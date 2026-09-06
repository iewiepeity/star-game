import test from "node:test";
import assert from "node:assert/strict";
import { careerChapterText, doctrineScene } from "../src/data/career-story-content.js";
import { endingStorySummary } from "../src/data/ending-story-content.js";
import { sequelOfferText, sequelSessionText, sequelCompletionText } from "../src/data/sequel-story-content.js";

const emptyEnding = (trigger = "fiveyear") => ({
  trigger, snapshot: { week: 260, currentAgencyId: null, fatigue: 0, health: 80, careerDoctrine: {} },
  portfolio: { works: 0, originals: 0, bestWork: null }, bestRel: null,
});

test("年度回看分別承認空白履歷與實際作品，不替自由身安插團隊", () => {
  const game = { completedWorks: [], eventHistory: [], currentAgencyId: null };
  const phase = { year: 2, pressure: "三星以上跨路線暫停半年" };
  const empty = careerChapterText(phase, game);
  assert.match(empty, /作品欄還沒有完成紀錄/);
  assert.match(empty, /自由身/);
  game.completedWorks.push({ title: "出租套房的夏天" });
  game.eventHistory.push({ id: "career-phase-1", choice: "protect", choiceLabel: "先守住生活" });
  const progressed = careerChapterText(phase, game);
  assert.match(progressed, /《出租套房的夏天》/);
  assert.match(progressed, /去年你選過「先守住生活」/);
  assert.doesNotMatch(progressed, /作品欄還沒有完成紀錄/);
});

test("沒有作品和伴侶的五年結局保留兩種空白，且不改寫存檔資料", () => {
  const input = emptyEnding();
  const before = structuredClone(input);
  const text = endingStorySummary("unfinished", input);
  assert.match(text, /作品欄目前沒有完成紀錄/);
  assert.match(text, /沒有一段親密關係/);
  assert.match(text, /自由身/);
  assert.doesNotMatch(text, /與你的關係走到(?:交往|訂婚|婚姻)/);
  assert.deepEqual(input, before);
});

test("親近朋友不自動變成伴侶，低信任的既有婚姻也不被寫成圓滿", () => {
  const input = emptyEnding();
  input.bestRel = { npcId: "sufei", closeness: 90, trust: 35, romance: "none" };
  assert.match(endingStorySummary("people_first", input), /許映真留在/);
  assert.doesNotMatch(endingStorySummary("people_first", input), /關係走到婚姻/);
  input.bestRel.romance = "married";
  const text = endingStorySummary("people_first", input);
  assert.match(text, /許映真與你的關係走到婚姻/);
  assert.match(text, /信任仍有需要慢慢照顧/);
});

test("提早退圈與死亡不套用五年完成的開場；死亡不附活人休息建議", () => {
  const early = emptyEnding("retire");
  early.snapshot.week = 34;
  assert.match(endingStorySummary("unfinished", early), /第 34 週/);
  assert.doesNotMatch(endingStorySummary("unfinished", early), /五年之約到了/);
  const death = emptyEnding("death");
  death.snapshot.fatigue = 100;
  death.snapshot.health = 0;
  const text = endingStorySummary("death", death);
  assert.match(text, /這段人生到此結束/);
  assert.doesNotMatch(text, /先把休息留給自己|往前挑戰|五年之約到了/);
});

test("方針回響依歷次紀錄輪替，文字選擇本身不新增收入或邀約", () => {
  const game = { week: 170, money: 1234, doctrineEventHistory: [] };
  const first = doctrineScene(game, { id: "autonomy" });
  game.doctrineEventHistory.push({ week: 153, id: "autonomy" });
  const before = structuredClone(game);
  const second = doctrineScene(game, { id: "autonomy" });
  assert.notEqual(first.title, second.title);
  assert.notEqual(first.accept, second.accept);
  assert.deepEqual(game, before);
});

test("續作同一進度按類別敘事，協商與品質結算保留不同結果", () => {
  const offer = { title: "仍未散場續作", category: "歌曲", completedSessions: 1, requiredSessions: 3, npcCast: [] };
  assert.match(sequelOfferText(offer), /實際安排製作/);
  assert.match(sequelSessionText(offer), /試唱/);
  const music = sequelSessionText(offer);
  offer.category = "電視劇";
  assert.notEqual(sequelSessionText(offer), music);
  assert.match(sequelSessionText(offer), /時間線/);
  assert.match(sequelCompletionText(offer, 79, 18500), /拉回原點/);
  offer.negotiated = true;
  const strong = sequelCompletionText(offer, 96, 23125);
  assert.match(strong, /加價已按約列入/);
  assert.match(strong, /收入＋23125/);
  assert.doesNotMatch(strong, /拉回原點/);
});

test("十九種既有結局仍可由原條件抵達，且各自產生可封存正文", async () => {
  const core = await import("../src/core/state.js");
  const { resetState } = core;
  let state = core.state;
  const { evaluateEnding } = await import("../src/logic/career.js");
  const works = (n, originalCount = 0, quality = 70) => {
    state.completedWorks = Array.from({ length: n }, (_, i) => ({ id: `test-${i}`, title: `查核作品${i}`, category: "電影", quality, original: i < originalCount, completedWeek: i + 1 }));
  };
  const relationship = () => { state.relationships.sufei = { closeness: 90, trust: 80, affection: 80, romance: "committed" }; };
  const cases = [
    ["death", () => {}, "death"],
    ["storm_icon", () => { state.rep.爭議度 = 650; state.fame = 450; }],
    ["whole_life", () => { state.careerDoctrine.year5 = { id: "integrated" }; works(10); }],
    ["legacy_builder", () => { state.careerDoctrine.year5 = { id: "legacy" }; state.rep.可信度 = 700; }],
    ["people_first", () => { state.careerDoctrine.year5 = { id: "people" }; relationship(); }],
    ["masterpiece_vow", () => { state.careerDoctrine.year5 = { id: "masterpiece" }; works(1, 0, 90); }],
    ["creative_auteur", () => { works(8, 5); state.rep.業界評價 = 450; }],
    ["award_collector", () => { state.awards = Array.from({ length: 5 }, () => ({ result: "得獎" })); }],
    ["national_darling", () => { state.rep.國民度 = 750; state.rep.路人緣 = 700; }],
    ["commercial_king", () => { state.rep.商業價值 = 800; state.money = 1500000; }],
    ["soulmate", relationship],
    ["power_couple", () => { relationship(); state.fame = 500; }],
    ["multi_hyphenate", () => { works(12); state.careerProgress = { 電影: 300, 歌曲: 300 }; }],
    ["cult_artist", () => { state.rep.業界評價 = 750; }],
    ["wealthy_exit", () => { state.money = 2000000; }, "retire"],
    ["workhorse", () => works(18)],
    ["breakout", () => { state.money = 5000000; state.fame = 3000; state.fans = 200000; state.rep.業界評價 = 500; }],
    ["steady", () => { state.money = 1000000; state.fame = 1000; state.rep.業界評價 = 250; }],
    ["unfinished", () => {}],
  ];
  for (const [id, setup, trigger = "fiveyear"] of cases) {
    resetState();
    state = core.state;
    state.week = 260;
    setup();
    const result = evaluateEnding(trigger);
    assert.equal(result.endingId, id);
    assert.ok(result.summary.length > 80, id);
    assert.doesNotMatch(result.summary, /undefined|NaN/, id);
    assert.doesNotThrow(() => structuredClone(result), id);
  }
});
