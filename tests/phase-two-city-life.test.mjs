import test from "node:test";
import assert from "node:assert/strict";
import { initialState, hydrateState, state } from "../src/core/state.js";
import { validateGameState } from "../src/core/save-schema.js";
import {
  initialCityLife,
  normalizeCityLife,
  cityDay,
} from "../src/core/city-life-state.js";
import {
  ACTING_ROUNDS,
  REGULAR_PLACES,
  CITY_CHOICES,
} from "../src/data/city-life.js";
import { NPCS } from "../src/data/npcs.js";
import { ROOMS } from "../src/pixel/data.js";
import {
  initialLife,
  normalizeLife,
  CHOICES,
  access,
  planDay,
  beginDay,
  settleDay,
  advanceDay,
  nextWeek,
  arriveAt,
  cancelDay,
  withCore,
  costOf,
  recordMeeting,
} from "../src/pixel/life.js";
import {
  bookCityAppointment,
  cancelCityAppointment,
  cityBookingProblem,
  repairCitySchedule,
} from "../src/pixel/city-schedule.js";
import {
  noticeOutfit,
  calendarOccasions,
  birthdayDay,
  adoptPet,
  comfortPet,
  petGreeting,
  setPetCare,
  tripCareProblem,
  regularOpportunity,
  collectCitySources,
  recallCityMemory,
  publishCityPhoto,
  withdrawCityPhoto,
} from "../src/logic/city-life.js";
import { npcSocialPost } from "../src/logic/social-context.js";
import { applyPlannerTool } from "../src/pixel/planner-tools.js";
import { cityItinerary } from "../src/pixel/cast.js";
import { petVisible, drawPet } from "../src/pixel/pet-visual.js";
import { createHomeUI } from "../src/pixel/home-ui.js";
import { createLifeUI } from "../src/pixel/life-ui.js";
import {
  publicRomanceClue,
  maybeQueueMediaEvent,
} from "../src/logic/media-engine.js";
import {
  recordRumor,
  respondToRumor,
  tickRumors,
} from "../src/logic/rumor-engine.js";
import { setSeed } from "../src/core/rng.js";
import { createCityLifeUI } from "../src/pixel/city-life-ui.js";

function fixture(week = 11) {
  const life = initialLife("city-life-tests");
  life.game.week = week;
  life.game.money = 100000;
  life.game.fatigue = 0;
  life.game.birthMonth = 3;
  life.game.birthDay = 18;
  life.game.knownPeople = ["jiqing", "sufei"];
  for (const id of life.game.knownPeople)
    life.game.relationships[id] = {
      closeness: 70,
      trust: 65,
      affection: 55,
      hostility: 0,
      romance: "dating",
      events: [],
      romanceHistory: [
        { week: 1, from: "ambiguous", to: "dating", source: "正式告白" },
      ],
    };
  life.plan = Array.from({ length: 7 }, () => ({ id: "rest" }));
  return life;
}
function run(life, assignment, choice = "focus") {
  assert.equal(planDay(life, life.day, assignment), "");
  assert.equal(beginDay(life).error, undefined);
  const result = settleDay(life, choice);
  assert.equal(result.error, undefined);
  return result;
}
function birthday(life) {
  return calendarOccasions(life.game, cityDay(life.game, life.day)).find(
    (e) => e.kind === "birthday" && e.npcId === "jiqing",
  );
}

test("城市生活舊檔遷移、未知欄位與非法資料驗證", () => {
  const old = initialState();
  delete old.cityLife;
  hydrateState(old);
  assert.deepEqual(state.cityLife, initialCityLife());
  const bad = {
    pet: { kind: "cat", name: "<script>" },
    appointments: [{ id: "x", npcId: "secret", kind: "birthday" }],
    sourceIds: Array(9000).fill("a"),
    regulars: { cafe: { days: [-1, 0, 0, 9000], redeemed: "yes" } },
  };
  const cleaned = normalizeCityLife(bad);
  assert.equal(cleaned.pet.name, "script");
  assert.deepEqual(cleaned.appointments, []);
  assert.deepEqual(cleaned.regulars.cafe.days, [0]);
  assert.deepEqual(cleaned.sourceIds, ["a"]);
  state.cityLife = bad;
  assert.equal(validateGameState(state).ok, false);
  hydrateState(state);
  assert.equal(validateGameState(state).ok, true);
  const pixel = fixture();
  delete pixel.game.cityLife;
  assert.deepEqual(normalizeLife(pixel).game.cityLife, initialCityLife());
});
test("沿用現有地點、動作與整套素材，不加入未定義的行程", () => {
  for (const place of Object.values(REGULAR_PLACES))
    assert.ok(CHOICES[place.action], place.action);
  for (const d of Object.values(CITY_CHOICES))
    assert.ok(ROOMS[d.room].objects.some((o) => o.id === d.item));
});
test("穿搭只在相遇後記憶，逐人逐日去重，不刷好感或洩漏秘密", () => {
  const life = fixture(),
    g = life.game,
    before = structuredClone(g.relationships);
  assert.equal(noticeOutfit("shenyao", "home", g, 70), "");
  const first = noticeOutfit("jiqing", "home", g, 70);
  assert.ok(first.includes(NPCS.jiqing.name));
  assert.equal(noticeOutfit("jiqing", "home", g, 70), "");
  assert.match(noticeOutfit("jiqing", "daily", g, 71), /我記得/);
  assert.deepEqual(g.relationships, before);
  assert.ok(!first.includes(NPCS.jiqing.profile.secret));
  g.relationships.jiqing.romance = "broken";
  assert.equal(recallCityMemory("jiqing", g), "");
});
test("在城市實際交談時也會留下穿搭印象", () => {
  const life = fixture();
  recordMeeting(life, "jiqing", "cafe");
  assert.equal(life.game.cityLife.outfitMemories.length, 1);
  recordMeeting(life, "jiqing", "cafe");
  assert.equal(life.game.cityLife.outfitMemories.length, 1);
});
test("熟客以完成日累積，房間來回不算；消息安排、結算與重播", () => {
  const life = fixture();
  for (let i = 0; i < 10; i++) arriveAt(life, "cafe");
  assert.equal(life.game.cityLife.regulars.cafe, undefined);
  for (let i = 0; i < 5; i++) {
    const result = run(life, { id: "cafe" });
    if (i === 2) assert.ok(result.notes.some((n) => n.includes("窗邊")));
    const count = life.game.cityLife.regulars.cafe.days.length;
    settleDay(life);
    assert.equal(life.game.cityLife.regulars.cafe.days.length, count);
    advanceDay(life);
  }
  assert.ok(regularOpportunity(life.game, "cafe"));
  const result = run(life, { id: "tv_assistant", regularId: "cafe" });
  assert.ok(result.notes.some((n) => n.includes("棚務消息")));
  assert.equal(regularOpportunity(life.game, "cafe"), null);
  const money = life.game.money;
  settleDay(life);
  assert.equal(life.game.money, money);
});
test("日曆支援生日、年末、正式關係紀念，不從好感猜日期", () => {
  const life = fixture();
  assert.ok(birthday(life));
  assert.equal(birthdayDay(2, 29), birthdayDay(2, 28));
  assert.equal(birthdayDay(12, 31), 363);
  life.game.week = 52;
  const events = calendarOccasions(life.game, cityDay(life.game));
  assert.ok(events.some((e) => e.kind === "new-year"));
  assert.ok(events.some((e) => e.kind === "anniversary"));
  life.game.relationships.jiqing.romanceHistory = [];
  assert.ok(
    !calendarOccasions(life.game).some(
      (e) => e.kind === "anniversary" && e.npcId === "jiqing",
    ),
  );
  assert.ok(!events.some((e) => e.npcId === "shenyao"));
});
test("接受、撞期、改期原子性、取消均保留合理結果且未出發不扣款", () => {
  const life = fixture(),
    event = birthday(life),
    before = life.game.money,
    day = cityDay(life.game);
  assert.equal(
    bookCityAppointment(life, CHOICES, event.id, "jiqing", day).ok,
    true,
  );
  const a = life.game.cityLife.appointments[0];
  life.game.npcSchedules.jiqing.push({
    jobId: "work",
    week: 11,
    day: 1,
    status: "reserved",
  });
  assert.match(
    cityBookingProblem(life, event.id, "jiqing", day + 1, a.id),
    /工作|約定/,
  );
  assert.equal(
    bookCityAppointment(life, CHOICES, event.id, "jiqing", day + 1, a.id).ok,
    false,
  );
  assert.equal(life.game.cityLife.appointments[0].day, day);
  assert.equal(
    bookCityAppointment(life, CHOICES, event.id, "jiqing", day + 2, a.id).ok,
    true,
  );
  assert.equal(life.plan[0].id, "rest");
  assert.equal(life.plan[2].id, "city_date");
  assert.equal(cancelCityAppointment(life, a.id).ok, true);
  assert.equal(life.plan[2].id, "rest");
  assert.equal(life.game.schedule[2], "rest");
  assert.equal(life.game.money, before);
  assert.ok(
    life.game.npcSchedules.jiqing
      .filter((s) => s.jobId === a.id)
      .every((s) => s.status === "released"),
  );
});
test("下一週的約定會恢復、助手不蓋掉邀約、分手後釋放權限", () => {
  const life = fixture(),
    event = birthday(life),
    now = cityDay(life.game);
  const result = bookCityAppointment(
    life,
    CHOICES,
    event.id,
    "jiqing",
    now + 7,
  );
  assert.equal(result.ok, true);
  for (let i = 0; i < 7; i++) {
    run(life, { id: "rest" });
    advanceDay(life);
  }
  assert.equal(nextWeek(life), true);
  assert.equal(life.plan[0].id, "city_date");
  applyPlannerTool(life, "rest");
  assert.equal(life.plan[0].id, "city_date");
  const restored = normalizeLife(life);
  assert.equal(restored.plan[0].id, "city_date");
  life.game.relationships.jiqing.romance = "broken";
  repairCitySchedule(life);
  assert.equal(life.plan[0].id, "rest");
  assert.equal(life.game.cityLife.appointments[0].status, "cancelled");
});
test("赴約→穿搭印象→私密合照→主動公開→次日訊息，重播不重算", () => {
  const life = fixture(),
    event = birthday(life),
    now = cityDay(life.game);
  life.game.fame = 120;
  assert.equal(
    bookCityAppointment(life, CHOICES, event.id, "jiqing", now).ok,
    true,
  );
  assert.equal(cityItinerary("jiqing", 238, { life }).scene, "cafe");
  const before = life.game.money;
  beginDay(life);
  const result = settleDay(life, "photo");
  assert.equal(result.success, true);
  assert.equal(life.game.money, before - 300);
  assert.equal(life.game.cityLife.outfitMemories.length, 1);
  assert.equal(life.game.cityLife.photos.length, 1);
  assert.equal(life.game.socialPosts.length, 0);
  const after = structuredClone(life.game);
  settleDay(life, "photo");
  assert.deepEqual(life.game, after);
  const photo = life.game.cityLife.photos[0];
  assert.equal(withCore(life, () => publishCityPhoto(photo.id)).ok, true);
  assert.equal(
    life.game.socialPosts.filter((p) => p.source === "city-life").length,
    1,
  );
  assert.equal(
    life.game.industryNews
      .find((n) => n.evidenceId === photo.id)
      .body.includes("清楚入鏡"),
    true,
  );
  assert.match(npcSocialPost("jiqing", life.game).text, /同意分享/);
  assert.equal(withCore(life, () => publishCityPhoto(photo.id)).ok, false);
  advanceDay(life);
  assert.ok(life.game.npcMessages.some((m) => m.title === "那天之後"));
  assert.equal(withCore(life, () => withdrawCityPhoto(photo.id)).ok, true);
  assert.equal(life.game.socialPosts.length, 0);
  assert.equal(
    life.game.industryNews.filter((n) => n.evidenceId === photo.id).length,
    1,
  );
  assert.equal(life.game.relationships.jiqing.romance, "dating");
});
test("未同意合照、陌生人、分手及作客不會無線索曝光", () => {
  const life = fixture(),
    event = birthday(life),
    day = cityDay(life.game);
  life.game.relationships.jiqing.trust = 25;
  bookCityAppointment(life, CHOICES, event.id, "jiqing", day);
  beginDay(life);
  settleDay(life, "photo");
  assert.equal(life.game.cityLife.photos.length, 0);
  assert.equal(life.game.socialPosts.length, 0);
  assert.equal(withCore(life, () => publishCityPhoto("made-up")).ok, false);
  const another = fixture();
  another.game.knownPeople = [];
  assert.equal(
    bookCityAppointment(another, CHOICES, event.id, "jiqing", day).ok,
    false,
  );
  run(another, { id: "rest" });
  assert.equal(another.game.cityLife.echoes.length, 0);
});
test("低負擔寵物：確認領養、回家去重、陪伴收益有上限，散步占一天", () => {
  const life = fixture(),
    day = cityDay(life.game);
  assert.equal(withCore(life, () => adoptPet("cat", "小星")).ok, true);
  assert.equal(withCore(life, () => adoptPet("dog", "另一隻")).ok, false);
  assert.match(petGreeting(life.game, day), /小星/);
  assert.equal(petGreeting(life.game, day), "");
  withCore(life, comfortPet);
  const mood = life.game.mood;
  withCore(life, comfortPet);
  assert.equal(life.game.mood, mood);
  run(life, { id: "pet_walk" });
  assert.deepEqual(life.game.cityLife.pet.walks, [day]);
  const copy = normalizeLife(life);
  settleDay(copy);
  assert.equal(copy.game.cityLife.pet.walks.length, 1);
  const g = life.game;
  g.week = 20;
  g.runnerDay = 0;
  assert.equal(g.cityLife.pet.name, "小星");
  assert.equal(g.cityLife.pet.kind, "cat");
  assert.equal(petVisible({ sceneId: "home", life }), true);
  assert.equal(petVisible({ sceneId: "cafe", life }), false);
  let pixels = 0;
  const graphics = {
    clear() {},
    fillStyle() {
      return this;
    },
    fillRect() {
      pixels++;
      return this;
    },
  };
  drawPet(graphics, "cat");
  assert.ok(pixels > 30);
});
test("出差託顧檢查熟人檔期，服務只在出發扣款，取消不扣款", () => {
  const life = fixture(),
    day = cityDay(life.game);
  withCore(life, () => adoptPet("dog", "暖暖"));
  assert.match(access(life, { id: "explore_airport" }), /託顧/);
  withCore(life, () => setPetCare("jiqing"));
  life.game.npcSchedules.jiqing = [
    { jobId: "busy", week: 11, day: 0, status: "reserved" },
  ];
  assert.match(tripCareProblem(life.game, day), /另有安排/);
  withCore(life, () => setPetCare("service"));
  const before = life.game.money,
    cost = costOf(life, { id: "explore_airport" });
  planDay(life, 0, { id: "explore_airport" });
  beginDay(life);
  cancelDay(life);
  assert.equal(life.game.money, before);
  run(life, { id: "explore_airport" });
  assert.equal(life.game.money, before - cost);
  assert.deepEqual(life.game.cityLife.pet.careDays, [day]);
  const after = life.game.money;
  settleDay(life);
  assert.equal(life.game.money, after);
});
test("對戲可略過，完整練習後快結算；取消與重載不重複給能力", () => {
  const life = fixture();
  const before = life.game.stats["演技"];
  run(life, { id: "city_challenge" }, "skip");
  assert.equal(life.game.stats["演技"], before + 4);
  advanceDay(life);
  for (let i = 0; i < 3; i++) {
    run(
      life,
      { id: "city_challenge", answers: ACTING_ROUNDS.map((r) => r.answer) },
      "played",
    );
    advanceDay(life);
  }
  assert.equal(life.game.cityLife.practice.mastered, 3);
  const quick = run(life, { id: "city_challenge" }, "quick");
  assert.match(quick.notes.join(""), /快速複習/);
  const g = structuredClone(life.game);
  settleDay(life);
  assert.deepEqual(life.game, g);
  advanceDay(life);
  planDay(life, life.day, { id: "city_challenge" });
  beginDay(life);
  life.pending.assignment.answers = [0];
  life.pending.phase = "decision";
  const copy = normalizeLife(life);
  assert.deepEqual(copy.pending.assignment.answers, [0]);
  cancelDay(life);
  assert.equal(life.game.cityLife.practice.mastered, 3);
});
test("作客與禮物延遲回收、對戲邀約有成立條件且跨系統去重", () => {
  const life = fixture();
  run(life, { id: "home_host", npcId: "jiqing", activityId: "rehearsal" });
  assert.equal(
    life.game.cityLife.echoes.filter((e) => e.kind === "home").length,
    1,
  );
  assert.equal(life.game.cityLife.echoes[0].status, "pending");
  advanceDay(life);
  const echo = life.game.cityLife.echoes.find((e) => e.kind === "home");
  assert.equal(echo.status, "delivered");
  assert.equal(
    bookCityAppointment(
      life,
      CHOICES,
      echo.id,
      "jiqing",
      cityDay(life.game, life.day),
    ).ok,
    true,
  );
  beginDay(life);
  const result = settleDay(life);
  assert.ok(result.notes.some((n) => n.includes("修改筆記")));
  for (let i = 0; i < 4; i++)
    collectCitySources(life.game, cityDay(life.game, life.day));
  assert.equal(life.game.npcMessages.filter((m) => m.id === echo.id).length, 1);
  assert.equal(life.game.completedWorks.length, 0); // Practice is not a completed paid production.
  assert.equal(recallCityMemory("sufei", life.game), "");
});
test("兩個存檔的城市回憶、照片與寵物不會混在一起", () => {
  const a = fixture(),
    b = fixture();
  withCore(a, () => adoptPet("cat", "甲"));
  noticeOutfit("jiqing", "home", a.game);
  hydrateState(a.game);
  hydrateState(b.game);
  assert.equal(state.cityLife.pet, null);
  assert.equal(state.cityLife.outfitMemories.length, 0);
});
test("居家與城市介面可完整渲染，玩家文字不輸出隱藏條件或腳本", () => {
  const life = fixture(),
    pixel = { life },
    shown = [];
  const escape = (s) => String(s).replace(/[<>"&]/g, "_");
  const api = {
    state: () => pixel,
    show: (id, html) => shown.push({ id, html }),
    heading: (_, title) => `<h2>${title}</h2>`,
    escape,
    definitions: CHOICES,
    access,
  };
  createHomeUI(api).open();
  assert.match(shown.at(-1).html, /居家生活/);
  const entry = createLifeUI(api);
  assert.equal(typeof entry.home, "function");
  assert.equal(typeof entry.city, "function");
  entry.home();
  entry.city();
  withCore(life, () => adoptPet("cat", "小星"));
  const ui = createCityLifeUI(api);
  for (const tab of [
    "calendar",
    "outfits",
    "regulars",
    "pets",
    "practice",
    "echoes",
  ]) {
    ui.open(tab);
    assert.match(shown.at(-1).html, /城市生活/);
    if (tab === "pets")
      assert.match(shown.at(-1).html, /<option value="service"/);
  }
  assert.ok(
    !shown.some(({ html }) =>
      /romanceHistory|sourceIds|hostility|<script/.test(html),
    ),
  );
});

test("舊媒體提問也必須有近期公開合照，熱度與模糊回應不能製造證據", () => {
  const life = fixture();
  hydrateState(life.game);
  state.fame = 500;
  assert.equal(publicRomanceClue(state, "jiqing"), null);
  for (let seed = 1; seed < 60; seed++) {
    state.eventQueue = [];
    state.queuedEvents = [];
    setSeed(seed);
    maybeQueueMediaEvent();
    assert.ok(!state.eventQueue.some((e) => e.event.mediaRomanceNpc));
  }
  const rumor = recordRumor({
    npcId: "jiqing",
    evidence: 2,
    source: "雙方同意公開的合照",
    evidenceId: "photo-evidence",
  });
  respondToRumor(rumor.id, "vague");
  for (let i = 0; i < 50; i++) {
    rumor.heat = 100;
    tickRumors();
    assert.equal(rumor.evidence, 2);
  }
  assert.equal(rumor.sources[0].evidenceId, "photo-evidence");
  respondToRumor(rumor.id, "confirm");
  assert.equal(rumor.evidence, 5);
});

test("換日後領養使用目前日期，熟客消息不能占用兩天", () => {
  const life = fixture();
  run(life, { id: "rest" });
  advanceDay(life);
  const day = cityDay(life.game, life.day);
  withCore(life, () => adoptPet("cat", "明天", day));
  assert.equal(life.game.cityLife.pet.adopted, day);
  life.game.cityLife.regulars.cafe = { days: [0, 1, 2, 3, 4], redeemed: false };
  const a = { id: "tv_assistant", regularId: "cafe" };
  assert.equal(planDay(life, 2, a), "");
  assert.match(planDay(life, 3, a), /已排在另一天/);
  assert.equal(planDay(life, 2, { id: "rest" }), "");
  assert.equal(planDay(life, 3, a), "");
});
