import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { initialLife, CHOICES, beginDay } from "../src/pixel/life.js";
import { withCore } from "../src/pixel/core-bridge.js";
import { planRoutineWithUndo, undoRoutine, canUndoRoutine, nextPlanningDay } from "../src/pixel/planner-tools.js";
import { plannerContext, resultHighlights, highlightsMarkup } from "../src/pixel/ux-summaries.js";
import { mapPurposeRooms } from "../src/pixel/map-purpose.js";
import { settingsMarkup } from "../src/pixel/settings-ui.js";
import { createFeatureUI } from "../src/pixel/feature-ui.js";
import { createLifeUI } from "../src/pixel/life-ui.js";
import { createViewportControls } from "../src/pixel/viewport.js";
import { meetNpc } from "../src/logic/npc-engine.js";
import { npcApp } from "../src/views/npc.js";

const fresh = () => { const life = initialLife(); life.plan = Array.from({ length: 7 }, () => ({ id: "rest" })); life.game.money = 20000; return life; };
const click = (ui, dataset) => ui.handle({ dataset, closest: () => true });
function feature(life, fn) {
  const previous = globalThis.document;
  let saves = 0, shown = "";
  const toasts = [];
  globalThis.document = { querySelector: () => null, querySelectorAll: () => [], activeElement: null };
  try {
    const ui = createFeatureUI({ state: () => ({ life }), native: { phone() {}, people() {} }, checkpoint: () => saves++, changed() {}, toast: text => toasts.push(text), show: (_id, html) => { shown = html; }, heading: (...text) => text.join(" "), escape: text => text });
    fn(ui, () => ({ saves, shown, toasts }));
  } finally { if (previous === undefined) delete globalThis.document; else globalThis.document = previous; }
}
function partner(life) {
  withCore(life, game => { meetNpc("jiqing"); Object.assign(game.relationships.jiqing, { romance: "married", visibility: "underground", ceremony: "undecided", trust: 80, closeness: 80 }); game.partnerId = "jiqing"; game.selectedNpc = "jiqing"; });
}

test("單次連排與復原不消耗天數、金錢，且只復原最後一次", () => {
  const life = fresh(), before = life.game.money;
  assert.equal(planRoutineWithUndo(life, 0, { id: "acting" }), "");
  assert.equal(nextPlanningDay(life, 0), 1);
  assert.equal(planRoutineWithUndo(life, 1, { id: "acting" }), "");
  withCore(life, () => {});
  assert.equal(canUndoRoutine(life), true);
  assert.equal(undoRoutine(life).day, 1);
  assert.deepEqual(life.plan.slice(0, 2), [{ id: "acting" }, { id: "rest" }]);
  assert.equal(undoRoutine(life).ok, false);
  assert.equal(life.day, 0);
  assert.equal(life.game.money, before);
});

test("復原不能覆寫後來的資源、正式約定或角色偏好", () => {
  const life = fresh();
  planRoutineWithUndo(life, 0, { id: "acting" });
  life.game.money--;
  assert.equal(undoRoutine(life).ok, false);
  planRoutineWithUndo(life, 0, { id: "vocal" });
  life.game.characterMemories = { jiqing: { preferences: { drink: "tea" } } };
  assert.equal(undoRoutine(life).ok, true);
  assert.equal(life.game.characterMemories.jiqing.preferences.drink, "tea");
  life.plan[1] = { id: "career_job", jobId: "J001" };
  planRoutineWithUndo(life, 1, { id: "rest" });
  assert.equal(canUndoRoutine(life), false);
  planRoutineWithUndo(life, 0, { id: "rest" });
  beginDay(life);
  assert.equal(undoRoutine(life).ok, false);
});

test("讀檔不復活復原紀錄，無效活動不新增復原權", () => {
  const life = fresh();
  assert.ok(planRoutineWithUndo(life, 0, { id: "unknown" }));
  assert.equal(canUndoRoutine(life), false);
  planRoutineWithUndo(life, 0, { id: "acting" });
  assert.equal(canUndoRoutine(structuredClone(life)), false);
});

test("固定排程提示區分所選日與今天，預算不提前加入收入", () => {
  const life = fresh();
  life.plan[0] = { id: "acting" };
  life.game.money = 0;
  life.game.fatigue = 90;
  const html = plannerContext(life, 2);
  assert.match(html, /正在安排星期三/);
  assert.match(html, /今天是星期一/);
  assert.match(html, /目前現金不足/);
  assert.match(html, /目前疲勞偏高/);
  assert.match(html, /不預先當作已入帳/);
});

test("人物速覽直接提供聯絡、見面與故事入口，陌生人不被揭露", () => {
  const life = fresh();
  partner(life);
  const html = withCore(life, game => { game.npcProfileTab = "overview"; return npcApp(); });
  assert.match(html, /data-chat-open="jiqing"/);
  assert.match(html, /安排見面 · 占一天/);
  assert.match(html, /data-personal-story-open="jiqing"/);
  assert.match(html, /data-romance-daily="jiqing"/);
  assert.doesNotMatch(html, /data-chat-open="silver_pc"/);
});

test("人物快捷戀愛日常僅排入後續，不耗日、不提前給獎且不重複排入", () => {
  const life = fresh(); partner(life);
  const before = { day: life.day, money: life.game.money, affection: life.game.relationships.jiqing.affection };
  feature(life, ui => {
    click(ui, { romanceDaily: "jiqing" });
    click(ui, { romanceDaily: "jiqing" });
  });
  const queued = [...life.game.eventQueue, ...life.game.queuedEvents].filter(item => item.event?.personalStory?.kind === "romanceDaily");
  assert.equal(queued.length, 1);
  assert.deepEqual({ day: life.day, money: life.game.money, affection: life.game.relationships.jiqing.affection }, before);
});

test("公開／婚禮須確認，取消與失效確認不修改關係，重複確認不重複給獎", () => {
  const life = fresh(); partner(life);
  feature(life, (ui, status) => {
    click(ui, { romanceAction: "public", npcId: "jiqing" });
    assert.match(status().shown, /已公開的消息不會消失/);
    assert.equal(life.game.relationships.jiqing.visibility, "underground");
    assert.equal(status().saves, 0);
    ui.open("people");
    click(ui, { confirmRelationship: "yes" });
    assert.equal(life.game.relationships.jiqing.visibility, "underground");
    click(ui, { romanceAction: "public", npcId: "jiqing" });
    click(ui, { confirmRelationship: "yes" });
    assert.equal(life.game.relationships.jiqing.visibility, "public");
    const fans = life.game.fans;
    click(ui, { confirmRelationship: "yes" });
    assert.equal(life.game.fans, fans);
    click(ui, { romanceCeremony: "small", npcId: "jiqing" });
    assert.equal(life.game.relationships.jiqing.ceremony, "undecided");
    life.game.relationships.jiqing.romance = "broken";
    click(ui, { confirmRelationship: "yes" });
    assert.equal(life.game.relationships.jiqing.ceremony, "undecided");
  });
});

test("每日／週重點只引用真實成果、最多三件且不漏出未轉義文字", () => {
  assert.deepEqual(resultHighlights([]), []);
  assert.equal(highlightsMarkup([], "今天"), "");
  const records = [{ success: false, moments: [{ title: "未完成", outcome: "不能聲稱成功" }] }, { success: true, gains: [{ name: "演技", amount: 3 }], moments: [{ title: "<script>", outcome: "真的有這個結果" }, { title: "一", outcome: "二" }, { title: "三", outcome: "四" }, { title: "五", outcome: "六" }] }];
  const snapshot = structuredClone(records);
  assert.equal(resultHighlights(records).length, 3);
  assert.doesNotMatch(highlightsMarkup(records, "這週"), /<script>|未完成/);
  assert.match(highlightsMarkup(records, "這週"), /&lt;script&gt;/);
  assert.deepEqual(records, snapshot);
  assert.equal(resultHighlights([{ moments: [{ title: "普通一天", outcome: "吃了飯" }, { title: "演技突破", outcome: "真正完成的突破" }] }])[0].title, "演技突破");
});

test("日結與週結實際畫面保留全文與明細，重點不另發獎", () => {
  const life = fresh();
  const result = { day: 0, week: 1, label: "休息", assignment: { id: "rest" }, success: true, deltas: { money: 0 }, gains: [{ name: "演技", amount: 2 }], notes: [], moments: [{ title: "今天的相處", text: "完整原文", outcome: "實際結果", kind: "日常", effects: [] }] };
  life.pending = { phase: "result", result };
  let html = "";
  const ui = createLifeUI({ state: () => ({ life }), world: () => ({}), show: (_type, markup) => { html = markup; }, heading: (...parts) => parts.join(" "), escape: text => String(text), checkpoint() {}, toast() {}, leaveOverlay() {} });
  const money = life.game.money;
  ui.today();
  assert.match(html, /今天留下的變化/);
  assert.match(html, /查看詳細數值/);
  assert.match(html, /完整原文/);
  assert.equal((html.match(/<details\b/g) || []).length, (html.match(/<\/details>/g) || []).length);
  life.pending = null;
  life.day = 7;
  life.weekSummary = { week: 1, results: [result], reward: { met: false, money: 0 } };
  ui.schedule();
  assert.match(html, /這週值得記住的事/);
  assert.match(html, /查看七日行程與收支/);
  assert.equal(life.game.money, money);
});

test("地圖情境依自己的行程與已接工作篩選，不讀 NPC 隱藏位置", () => {
  const life = fresh();
  assert.equal(mapPurposeRooms(life, "appointment").size, 0);
  assert.equal(mapPurposeRooms(life, "work").size, 0);
  life.game.activeJobs = { J001: { jobId: "J001", stage: "active" }, J002: { jobId: "J002", stage: "completed" } };
  life.plan[0] = { id: "career_job", jobId: "J001" };
  assert.ok(mapPurposeRooms(life, "appointment").size > 0);
  assert.ok(mapPurposeRooms(life, "work").size > 0);
  assert.ok(mapPurposeRooms(life, "training").has(CHOICES.acting.room));
  assert.ok(mapPurposeRooms(life, "rest").has("home"));
  assert.equal(mapPurposeRooms(life, "unknown").size, 0);
  life.plan[0] = { id: "career_task", taskId: "missing" };
  assert.doesNotThrow(() => mapPurposeRooms(life, "appointment"));
  assert.equal(mapPurposeRooms(life, "all").has("editing_room"), false);
});

test("設定五組完整保留既有控制項，字體與比例不藏在摺疊內容", () => {
  const html = settingsMarkup({ theme: "cream", speed: 2, preferences: { fontSize: "large" } });
  for (const label of ["閱讀與顯示", "聲音與演出", "故事偏好", "存檔與資料", "更新與離線"]) assert.ok(html.includes(label));
  for (const marker of ['data-ui="reset-view"', 'data-offline="update"', 'data-volume="musicVolume"', 'data-storage="new"']) assert.equal(html.split(marker).length - 1, 1);
  assert.equal(html.split('data-narrative-pref="romanceFrequency"').length - 1, 4);
  assert.ok(html.indexOf('data-ui="reset-view"') < html.indexOf('<details'));
  assert.ok(html.indexOf('data-pixel-pref="fontSize"') < html.indexOf('<details'));
  assert.equal((html.match(/<section\b/g) || []).length, (html.match(/<\/section>/g) || []).length);
  assert.equal((html.match(/<details\b/g) || []).length, (html.match(/<\/details>/g) || []).length);
});

test("軟鍵盤縮小可用面板高度，關閉鍵盤後還原；不改寫使用者縮放", () => {
  const previous = { window: globalThis.window, document: globalThis.document, getComputedStyle: globalThis.getComputedStyle };
  const styles = new Map(), events = {};
  const viewport = { scale: 1, height: 350, width: 390, offsetTop: 10, addEventListener: (name, fn) => { events[name] = fn; } };
  const panel = { open: true, dataset: {}, style: { setProperty: (k, v) => styles.set(k, v), removeProperty: k => styles.delete(k) }, append() {}, addEventListener() {} };
  const button = { hidden: false, parentElement: panel };
  let scrolled = 0;
  globalThis.window = { visualViewport: viewport, innerHeight: 800, addEventListener() {}, requestAnimationFrame: fn => fn() };
  globalThis.document = { querySelector: () => null, activeElement: { matches: () => true, scrollIntoView: () => scrolled++ }, body: panel };
  try {
    const controls = createViewportControls(button, panel);
    assert.equal(styles.get("--usable-panel-height"), "326px");
    assert.equal(panel.dataset.keyboard, "true");
    assert.equal(scrolled, 1);
    viewport.height = 800;
    events.resize();
    assert.equal(panel.dataset.keyboard, "false");
    assert.equal(viewport.scale, 1);
    controls.sync();
  } finally { for (const [key, value] of Object.entries(previous)) if (value === undefined) delete globalThis[key]; else globalThis[key] = value; }
});

test("手機閱讀規則與設定重新繪製保留狀態接線存在（不冒充視覺實測）", () => {
  const css = readFileSync(new URL("../phone.css", import.meta.url), "utf8");
  assert.match(css, /\.planner-context\s*\{\s*position: sticky/);
  assert.match(css, /min-height: 44px; white-space: normal/);
  assert.match(css, /font-size: max\(16px/);
  assert.match(css, /data-keyboard="true"/);
  const main = readFileSync(new URL("../src/pixel/main.js", import.meta.url), "utf8");
  assert.match(main.slice(main.indexOf("function settings()"), main.indexOf("function clinic()")), /preserveScroll: true/);
});

test("實際排程處理函式在連排與復原後保持所選日期，不開始執行", () => {
  const life = fresh();
  const previous = { document: globalThis.document, CSS: globalThis.CSS };
  const nodes = new Map();
  let shown = "", options;
  globalThis.document = { getElementById: id => { if (!nodes.has(id)) nodes.set(id, { textContent: "" }); return nodes.get(id); } };
  globalThis.CSS = { escape: value => value };
  try {
    const ui = createLifeUI({ state: () => ({ life }), world: () => ({ cancelActivity() {}, stopRoute() {} }), show: (_type, html, opts) => { shown = html; options = opts; }, heading: (...parts) => parts.join(" "), escape: text => String(text), checkpoint() {}, toast() {}, leaveOverlay() {} });
    ui.schedule();
    ui.handle({ dataset: { plan: "acting" } });
    assert.match(shown, /正在安排星期二/);
    assert.equal(options.preserveScroll, true);
    ui.handle({ dataset: { routineUndo: "" } });
    assert.equal(life.plan[0].id, "rest");
    assert.match(shown, /正在安排星期一/);
    assert.equal(life.pending, null);
    assert.equal(life.day, 0);
  } finally { for (const [key, value] of Object.entries(previous)) if (value === undefined) delete globalThis[key]; else globalThis[key] = value; }
});
