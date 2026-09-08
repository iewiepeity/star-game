import test from "node:test";
import assert from "node:assert/strict";
import { initialPixelState, validatePixelState } from "../src/pixel/model.js";
import { initialLife, beginDay, settleDay, advanceDay, costOf, newProject, withCore, arriveAt } from "../src/pixel/life.js";
import { applyPlannerTool, plannerToolsMarkup } from "../src/pixel/planner-tools.js";
import { plannerContext } from "../src/pixel/ux-summaries.js";
import { createLifeUI } from "../src/pixel/life-ui.js";
import { exportPixelSave, parsePixelTransfer } from "../src/pixel/save-transfer.js";
import { adoptPet } from "../src/logic/city-life.js";
import { JOB_CATALOG } from "../src/data/jobs.js";

function fresh() {
  const life = initialLife("debug-regressions");
  life.plan = Array.from({ length: 7 }, () => ({ id: "rest" }));
  life.game.money = 100000;
  return life;
}

test("存讀檔與匯出匯入不把歷史地點灌入本週探訪", () => {
  const s = initialPixelState();
  s.visited = ["home", "rehearsal", "cafe"];
  s.sceneId = "cafe";
  s.life.game.week = 2;
  s.life.game.visitedLocationsByWeek = { 1: ["rehearsal", "cafe"], 2: ["cafe"] };
  const before = structuredClone(s.life.game.visitedLocationsByWeek);
  for (const restored of [validatePixelState(s), parsePixelTransfer(exportPixelSave(s)).state]) {
    assert.deepEqual(restored.life.game.visitedLocationsByWeek, before);
  }
  assert.deepEqual(s.life.game.visitedLocationsByWeek, before);
});

test("人在外面存讀檔不會觸發寵物回家迎接，真正返家仍會迎接", () => {
  const s = initialPixelState();
  withCore(s.life, () => adoptPet("dog", "小星", 0));
  s.sceneId = "cafe";
  s.visited = ["home", "cafe"];
  const restored = validatePixelState(s);
  assert.deepEqual(restored.life.game.cityLife.pet.greeted, []);
  arriveAt(restored.life, "home");
  assert.deepEqual(restored.life.game.cityLife.pet.greeted, [0]);
});

test("初代無養成存檔仍遷移歷史地點", () => {
  const s = initialPixelState();
  delete s.life;
  s.visited = ["home", "rehearsal"];
  const restored = validatePixelState(s);
  assert.ok(restored.life.game.visitedLocationsByWeek[1].includes("rehearsal"));
});

test("排程助手復原不能覆寫已開始的行動", () => {
  const life = fresh();
  assert.equal(applyPlannerTool(life, "actor").ok, true);
  beginDay(life);
  const before = structuredClone(life);
  assert.equal(applyPlannerTool(life, "undo").ok, false);
  assert.deepEqual(life, before);
  assert.match(plannerToolsMarkup(life), /data-planner-tool="undo" disabled/);
});

test("執行中套用範本可安排未來，但不能用復原改寫當天", () => {
  const life = fresh();
  beginDay(life);
  const pending = structuredClone(life.pending);
  assert.equal(applyPlannerTool(life, "actor").ok, true);
  assert.deepEqual(life.pending, pending);
  assert.equal(life.plan[0].id, "rest");
  assert.equal(applyPlannerTool(life, "undo").ok, false);
  settleDay(life);
  advanceDay(life);
  assert.equal(applyPlannerTool(life, "undo").ok, false);
});

test("未開始行動的助手復原仍保留其他偏好修改", () => {
  const life = fresh(), plan = structuredClone(life.plan);
  applyPlannerTool(life, "actor");
  life.game.focus = "people";
  assert.equal(applyPlannerTool(life, "undo").ok, true);
  assert.deepEqual(life.plan, plan);
  assert.equal(life.game.focus, "people");
});

test("待辦助手使用真正的公園空檔，不覆蓋課程或其他探訪", () => {
  const life = fresh();
  const job = JOB_CATALOG.find(j => j.workDays.length > 0);
  const day = job.workDays[0];
  life.plan = life.plan.map((_, i) => ({ id: i === day ? "explore_park" : i % 2 ? "cafe" : "acting" }));
  const before = structuredClone(life.plan);
  life.game.activeJobs[job.id] = { jobId: job.id, stage: "active", remainingSessions: 1, completedSessions: 0, deadlineWeek: 3, npcCast: [], npcScheduleSlots: [] };
  assert.equal(applyPlannerTool(life, "due").ok, true);
  assert.deepEqual(life.plan[day], { id: "career_job", jobId: job.id });
  for (let i = 0; i < 7; i++) if (i !== day) assert.deepEqual(life.plan[i], before[i]);
});

function scheduleHTML(life) {
  let html = "";
  const ui = createLifeUI({ state: () => ({ life }), show: (_id, value) => { html = value; }, heading: (...parts) => parts.join(" "), escape: String, checkpoint() {}, toast() {}, leaveOverlay() {} });
  ui.schedule();
  return html;
}

test("剩餘預算在結算後排除今日費用，未結算時保留", () => {
  const life = fresh();
  life.plan[0] = { id: "acting" };
  life.plan[1] = { id: "vocal" };
  const remaining = costOf(life, life.plan[1]);
  const total = remaining + costOf(life, life.plan[0]);
  beginDay(life);
  assert.ok(plannerContext(life, 1).includes(`餘下已排費用 $${total.toLocaleString()}`));
  settleDay(life);
  assert.equal(life.pending.phase, "result");
  assert.ok(plannerContext(life, 1).includes(`餘下已排費用 $${remaining.toLocaleString()}`));
  assert.ok(scheduleHTML(life).includes(`餘下學費／外出費 $${remaining.toLocaleString()}`));
});

for (const status of ["revising", "rejected"]) {
  test(`行程表可安排 ${status} 創作且排除已發行作品`, () => {
    const life = fresh();
    const published = newProject(life, "song", "已發行");
    const unfinished = newProject(life, "song", "繼續修改");
    life.game.creativeProjects.find(p => p.id === published.id).status = "released";
    life.game.creativeProjects.find(p => p.id === unfinished.id).status = status;
    const button = scheduleHTML(life).match(/<button[^>]*data-plan="creative"[^>]*>/)?.[0];
    assert.ok(button);
    assert.ok(button.includes(`data-project="${unfinished.id}"`));
    assert.doesNotMatch(button, /disabled/);
    assert.ok(!beginDay(life, { id: "creative", projectId: unfinished.id }).error);
    assert.equal(settleDay(life).success, true);
    assert.ok(life.game.creativeProjects.find(p => p.id === unfinished.id).progress > 0);
    assert.equal(life.game.creativeProjects.find(p => p.id === published.id).status, "released");
  });
}
