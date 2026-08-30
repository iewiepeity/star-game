import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { setUndo, peekUndo, consumeUndo } from "../src/core/undo.js";
import { initialState } from "../src/core/state.js";
import { validateGameState } from "../src/core/save-schema.js";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("工作與人物搜尋由 view/state 宣告，不再由 binder 插入 DOM", async () => {
  const [jobsView, jobsBind, peopleView, roomBind] = await Promise.all([
    read("src/views/jobs.js"), read("src/bind/jobs.js"), read("src/views/people.js"), read("src/bind/room.js"),
  ]);
  assert.match(jobsView, /data-job-query/);
  assert.match(jobsView, /jobStatusFilter/);
  assert.doesNotMatch(jobsBind, /createElement/);
  assert.match(peopleView, /data-people-query/);
  assert.match(peopleView, /role="tablist"/);
  assert.match(peopleView, /aria-selected/);
  assert.match(roomBind, /"Home","End"/);
  assert.doesNotMatch(roomBind, /enhancePeople/);
});

test("UI 搜尋與分類狀態可通過存檔驗證", () => {
  const value = initialState();
  value.jobQuery = "電影";
  value.jobStatusFilter = "action";
  value.peopleQuery = "導演";
  value.appQuery = "工作";
  value.appCategory = "事業";
  assert.equal(validateGameState(value).ok, true);
});

test("Undo action 只能消耗一次且綁定原訊息", () => {
  let restored = false;
  setUndo("本週已全部改為休息", () => { restored = true; });
  assert.equal(peekUndo("其他通知"), null);
  const action = consumeUndo("本週已全部改為休息");
  action.run();
  assert.equal(restored, true);
  assert.equal(consumeUndo("本週已全部改為休息"), null);
});

test("PWA 更新由玩家確認，安裝階段不再強制接管", async () => {
  const [main, worker, update] = await Promise.all([
    read("src/main.js"), read("service-worker.js"), read("src/core/pwa-update.js"),
  ]);
  assert.match(main, /markUpdateAvailable/);
  assert.match(worker, /SKIP_WAITING/);
  assert.doesNotMatch(worker, /install[\s\S]{0,180}skipWaiting/);
  assert.match(update, /applyAvailableUpdate/);
});

test("CSS 新增語意 token、元件層與 reduced motion 保護", async () => {
  const [index, css, cascade, a11y] = await Promise.all([read("index.html"), read("design-system.css"), read("cascade.css"), read("a11y.css")]);
  assert.match(index, /design-system\.css/);
  assert.match(index, /cascade\.css/);
  assert.match(css, /@layer tokens, components, utilities/);
  assert.match(cascade, /tokens, legacy, components, utilities, overrides/);
  assert.match(css, /--surface-raised/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(a11y, /\.sr-only/);
});

test("搜尋輸入支援中文組字並延遲重繪", async () => {
  const [helper, jobs, room] = await Promise.all([
    read("src/core/deferred-search.js"), read("src/bind/jobs.js"), read("src/bind/room.js"),
  ]);
  assert.match(helper, /compositionstart/);
  assert.match(helper, /compositionend/);
  assert.match(helper, /event\.isComposing/);
  assert.match(helper, /setTimeout/);
  assert.match(jobs, /render\(\{persist:false\}\)/);
  assert.match(room, /render\(\{persist:false\}\)/);
});

test("畫面完成與資料異動使用不同事件", async () => {
  const [render, main, persistence] = await Promise.all([
    read("src/render.js"), read("src/main.js"), read("src/core/persistence.js"),
  ]);
  assert.match(render, /star-game:state-changed/);
  assert.match(main, /addEventListener\("star-game:state-changed"/);
  assert.doesNotMatch(main, /addEventListener\("star-game:rendered"/);
  assert.doesNotMatch(persistence, /pendingAutoState = structuredClone/);
});
