import test from "node:test";
import assert from "node:assert/strict";
import {
  initialState,
  resetState,
  state,
  hydrateState,
} from "../src/core/state.js";
import { normalizeHomeLife } from "../src/core/home-state.js";
import { HOME_RECIPES, HOME_VISIT_ACTIVITIES } from "../src/data/home-life.js";
import { ABILITIES } from "../src/data/abilities.js";
import {
  buySupply,
  resolveCrafting,
  resolveHomeVisit,
  giftCraftedItem,
  setHomeKey,
  keyAccessStatus,
  syncCareerKeepsakes,
} from "../src/logic/home-life.js";
import { adjustRelationship } from "../src/logic/npc-engine.js";
import { transitionRomance } from "../src/logic/romance-engine.js";
import { weeklyTaskCounts } from "../src/logic/weekly-task.js";
import {
  initialLife,
  planDay,
  beginDay,
  settleDay,
  advanceDay,
  nextWeek,
  normalizeLife,
  access,
  withCore,
  CHOICES,
} from "../src/pixel/life.js";
import { bookCareer } from "../src/pixel/career.js";
import { applyPlannerTool } from "../src/pixel/planner-tools.js";
import { cityItinerary } from "../src/pixel/cast.js";
import { createLifeUI } from "../src/pixel/life-ui.js";
import {
  homeFurnitureInfo,
  paintHomeFurniture,
} from "../src/pixel/home-furniture.js";

const visit = { id: "home_host", npcId: "jiqing", activityId: "movie" };
const craft = { id: "home_craft", recipeId: "cocoa_cookie" };
function lifeFixture() {
  const life = initialLife("home-regression");
  life.plan = Array.from({ length: 7 }, () => ({ id: "rest" }));
  life.game.knownPeople = ["jiqing"];
  life.game.relationships.jiqing = {
    ...life.game.relationships.jiqing,
    closeness: 70,
    trust: 65,
    affection: 70,
    hostility: 0,
    romance: "dating",
  };
  return life;
}

test("材料預留、同週重複邀請與其他 NPC 約定均不可超額安排；預檢不改狀態", () => {
  const life = lifeFixture();
  buySupply("pantry", life.game);
  assert.equal(planDay(life, 1, craft), "");
  assert.match(planDay(life, 2, craft), /材料已留/);
  assert.equal(planDay(life, 1, { id: "rest" }), "");
  assert.equal(planDay(life, 2, craft), "");
  assert.equal(planDay(life, 0, visit), "");
  const before = structuredClone(life);
  assert.equal(access(life, visit), "");
  assert.deepEqual(life, before);
  assert.match(planDay(life, 3, visit), /已經約好/);
  assert.match(planDay(life, 1.5, craft), /這一天/);
  assert.equal(planDay(life, 0, { id: "rest" }), "");
  life.game.npcSchedules.jiqing.push({
    week: 1,
    day: 3,
    jobId: "existing-job",
    status: "reserved",
    location: "tv",
  });
  assert.match(planDay(life, 3, visit), /已有約定/);
});

test("重排不堆積 NPC 檔期，排程助手與通告不默默取消作客", () => {
  const life = lifeFixture();
  for (let i = 0; i < 5; i++) assert.equal(planDay(life, 2, visit), "");
  assert.equal(life.game.npcSchedules.jiqing.length, 1);
  assert.match(
    bookCareer(life, CHOICES, "npc", { npcId: "jiqing", type: "chat" }, 2)
      .message,
    /作客約定/,
  );
  applyPlannerTool(life, "rest");
  assert.deepEqual(life.plan[2], visit);
  assert.equal(life.game.npcSchedules.jiqing[0].status, "reserved");
});

test("作客 NPC 實際出現在家中，結算後仍在，取消或翌日離開；交惡不能入屋", () => {
  const life = lifeFixture();
  planDay(life, 0, visit);
  assert.equal(cityItinerary("jiqing", 100, { life }).scene, "home");
  life.game.relationships.jiqing.hostility = 50;
  assert.notEqual(cityItinerary("jiqing", 100, { life }).scene, "home");
  life.game.relationships.jiqing.hostility = 0;
  beginDay(life);
  const result = settleDay(life);
  assert.equal(result.success, true);
  assert.match(result.notes.join(""), /電影播到片尾/);
  assert.equal(cityItinerary("jiqing", 100, { life }).scene, "home");
  const resumed = normalizeLife(life),
    before = structuredClone(resumed.game);
  assert.deepEqual(settleDay(resumed), result);
  assert.deepEqual(resumed.game, before);
  advanceDay(resumed);
  assert.notEqual(
    cityItinerary("jiqing", 100, { life: resumed }).scene,
    "home",
  );
});

test("舊居家行程遷移為合法核心行動，修復來訪地點並釋放過期預約", () => {
  const life = lifeFixture();
  planDay(life, 0, visit);
  life.game.schedule[0] = "home_host";
  delete life.game.npcSchedules.jiqing[0].location;
  life.game.npcSchedules.jiqing.push({
    jobId: "pixel-home:0:2",
    week: 0,
    day: 2,
    status: "reserved",
    external: true,
  });
  const next = normalizeLife(life);
  assert.equal(next.game.schedule[0], "personal_task");
  assert.equal(next.game.npcSchedules.jiqing[0].location, "home");
  assert.equal(next.game.npcSchedules.jiqing[1].status, "released");
  hydrateState(next.game);
  assert.equal(state.schedule[0], "personal_task");
  delete life.game.homeLife;
  assert.ok(
    normalizeLife(life).game.homeLife.ownedFurniture.includes("starter_bed"),
  );
});

test("手作與作客列入生活目標，完整一週與重載不重複消耗或獎勵", () => {
  let life = lifeFixture();
  buySupply("pantry", life.game);
  planDay(life, 0, craft);
  planDay(life, 1, visit);
  while (life.day < 7) {
    assert.ok(!beginDay(life).error);
    const result = settleDay(life);
    assert.ok(!result.error, result.error);
    life = normalizeLife(life);
    assert.deepEqual(settleDay(life), result);
    assert.equal(advanceDay(life), true);
  }
  assert.equal(life.game.homeLife.craftedItems.length, 1);
  assert.equal(life.game.homeLife.visits.length, 1);
  assert.equal(withCore(life, () => weeklyTaskCounts()).life, 7);
  assert.equal(nextWeek(life), true);
  assert.ok(
    life.game.npcSchedules.jiqing
      .filter((slot) => slot.jobId.startsWith("pixel-home:"))
      .every((slot) => slot.status !== "reserved"),
  );
  applyPlannerTool(life, "repeat");
  assert.ok(life.plan.every((a) => a.id !== "home_host"));
});

test("品質來自真實養成能力，成品櫃滿或同日重播不消耗材料", () => {
  for (const recipe of Object.values(HOME_RECIPES))
    assert.ok(ABILITIES.includes(recipe.stat));
  const low = lifeFixture().game,
    high = lifeFixture().game;
  low.stats.學識 = 0;
  high.stats.學識 = 1000;
  buySupply("pantry", low);
  buySupply("pantry", high);
  assert.equal(resolveCrafting(craft, () => 0, low).item.quality, 1);
  assert.equal(resolveCrafting(craft, () => 0, high).item.quality, 5);
  buySupply("pantry", low);
  const materials = structuredClone(low.homeLife.materials);
  assert.equal(resolveCrafting(craft, () => 0, low).ok, false);
  assert.deepEqual(low.homeLife.materials, materials);
  high.homeLife.craftedItems = Array.from({ length: 100 }, (_, i) => ({
    id: `held:${i}`,
    recipeId: "charm",
    quality: 1,
    status: "kept",
    madeWeek: 1,
  }));
  buySupply("pantry", high);
  assert.match(resolveCrafting(craft, () => 0, high).text, /成品櫃已滿/);
});

test("顯式傳入遊戲的作客與贈禮不污染其他遊戲的全域關係", () => {
  const game = lifeFixture().game;
  resetState();
  const before = structuredClone(state);
  assert.equal(resolveHomeVisit(visit, game).ok, true);
  assert.ok(game.relationships.jiqing.closeness > 70);
  assert.deepEqual(state, before);
  buySupply("pantry", game);
  const made = resolveCrafting(craft, () => 0, game);
  assert.equal(giftCraftedItem(made.item.id, "jiqing", game).ok, true);
  assert.equal(game.homeLife.craftedItems[0].status, "gifted");
  assert.deepEqual(state, before);
});

test("鑰匙遇分手或失去信任立即失效，復合不會偷偷恢復權限", () => {
  hydrateState(lifeFixture().game);
  assert.equal(setHomeKey("__proto__", true).ok, false);
  assert.equal(setHomeKey("sufei", true).ok, false);
  setHomeKey("jiqing", true);
  adjustRelationship("jiqing", { trust: -30 });
  assert.equal(state.homeLife.keys.jiqing.invalidated, true);
  adjustRelationship("jiqing", { trust: 40 });
  assert.equal(keyAccessStatus("jiqing").active, false);
  setHomeKey("jiqing", true);
  assert.equal(keyAccessStatus("jiqing").active, true);
  assert.equal(transitionRomance("jiqing", "broken", "回歸測試").ok, true);
  assert.equal(state.homeLife.keys.jiqing.invalidated, true);
});

test("不可信存檔資料會被限縮，消耗品歷史不擠掉仍保留的手作", () => {
  const raw = {
    ownedFurniture: ["__proto__", "rose_sofa"],
    placedFurniture: { bed: "rose_sofa", sofa: "rose_sofa" },
    materials: { flour: Infinity, sugar: -5, cocoa: 1e8, unknown: 50 },
    craftedItems: [
      {
        id: "kept",
        recipeId: "charm",
        name: "<img src=x onerror=alert(1)>",
        quality: 1e20,
        status: "kept",
      },
      ...Array.from({ length: 130 }, (_, i) => ({
        id: `used:${i}`,
        recipeId: "charm",
        status: "used",
      })),
    ],
    keepsakes: [
      { id: "safe", name: "<b>note</b>", icon: "<img onerror=alert(1)>" },
    ],
    keys: { jiqing: { granted: "true" } },
  };
  const h = normalizeHomeLife(raw);
  assert.equal(h.placedFurniture.bed, "starter_bed");
  assert.equal(h.placedFurniture.sofa, "rose_sofa");
  assert.deepEqual(h.materials, { flour: 0, sugar: 0, cocoa: 999 });
  assert.equal(h.craftedItems[0].id, "kept");
  assert.equal(h.craftedItems[0].quality, 5);
  assert.equal(h.craftedItems[0].name, HOME_RECIPES.charm.name);
  assert.equal(h.craftedItems.length, 21);
  assert.equal(h.keepsakes[0].icon, "✦");
  assert.ok(!h.keepsakes[0].name.includes("<"));
  assert.equal(h.keys.jiqing.granted, false);
});

test("作品與獎項紀念不重複加書名號，入圍不被顯示成得獎", () => {
  const game = initialState();
  game.completedWorks = [{ id: "one", title: "《第一幕》", week: 1 }];
  game.awards = [{ id: "nominee", title: "新人獎", result: "入圍", week: 1 }];
  syncCareerKeepsakes(game);
  syncCareerKeepsakes(game);
  assert.equal(game.homeLife.keepsakes.length, 2);
  assert.equal(game.homeLife.keepsakes[0].name, "《第一幕》作品紀念");
  assert.equal(game.homeLife.keepsakes[1].kind, "入圍紀念");
});

test("每一種居家活動都有對應情節，女性人物使用正確代稱", () => {
  for (const activityId of Object.keys(HOME_VISIT_ACTIVITIES)) {
    const game = lifeFixture().game,
      result = resolveHomeVisit({ ...visit, activityId }, game);
    assert.ok(result.text.includes(HOME_VISIT_ACTIVITIES[activityId].scene));
    assert.ok(result.text.startsWith("她"));
  }
});

test("手動確認保留配方及 NPC 活動資料，能走到實際互動而非遺失參數", (t) => {
  const oldDocument = globalThis.document;
  globalThis.document = { getElementById: () => ({ textContent: "" }) };
  t.after(() => {
    if (oldDocument === undefined) delete globalThis.document;
    else globalThis.document = oldDocument;
  });
  for (const assignment of [craft, visit]) {
    const life = lifeFixture(),
      pixel = { life, sceneId: "home" };
    buySupply("pantry", life.game);
    planDay(life, 0, assignment);
    let html = "",
      interacted = null;
    const escape = (text) =>
      String(text)
        .replaceAll("&", "&amp;")
        .replaceAll('"', "&quot;")
        .replaceAll("<", "&lt;");
    const ui = createLifeUI({
      state: () => pixel,
      world: () => ({ interact: (item) => (interacted = item) }),
      show: (_, markup) => (html = markup),
      heading: () => "",
      escape,
      checkpoint: () => {},
      toast: (message) => assert.fail(message),
      leaveOverlay: () => {},
    });
    ui.today();
    const encoded = html.match(/data-assignment="([^"]+)"/)?.[1];
    assert.ok(encoded, html);
    ui.handle({
      dataset: {
        start: assignment.id,
        assignment: encoded.replaceAll("&quot;", '"').replaceAll("&amp;", "&"),
      },
    });
    assert.deepEqual(life.pending.assignment, assignment);
    assert.equal(
      interacted,
      assignment.id === "home_host" ? "sofa" : "desk-seat",
    );
    assert.equal(settleDay(life).success, true);
  }
});

test("家具的五個場景槽位與展示紀念均有實際 renderer 入口", () => {
  const home = initialState().homeLife,
    calls = [];
  const context = new Proxy(
    {
      getImageData: (_x, _y, width, height) => ({
        width,
        height,
        data: new Uint8ClampedArray(width * height * 4).fill(150),
      }),
    },
    {
      get: (obj, key) => obj[key] ?? ((...args) => calls.push([key, ...args])),
    },
  );
  Object.assign(home.placedFurniture, {
    bed: "linen_bed",
    sofa: "rose_sofa",
    window: "sheer_curtain",
    table: "tea_set",
    wall: "cork_board",
  });
  home.keepsakes = [
    { id: "memory", name: "票根", npcId: "jiqing", kind: "人物" },
  ];
  home.displayedKeepsakeId = "memory";
  paintHomeFurniture(context, home);
  for (const [object, id] of [
    ["bed", "linen_bed"],
    ["sofa", "rose_sofa"],
    ["prop-blinds", "sheer_curtain"],
    ["prop-table-plant", "tea_set"],
    ["prop-picture", "cork_board"],
  ])
    assert.equal(homeFurnitureInfo(home, object).itemId, id);
  assert.equal(homeFurnitureInfo(home, "prop-picture").keepsakeId, "memory");
  assert.equal(calls.filter(([name]) => name === "putImageData").length, 3);
  assert.ok(calls.some(([name]) => name === "ellipse"));
});
