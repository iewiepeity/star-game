import test from "node:test";
import assert from "node:assert/strict";
import { state, resetState } from "../src/core/state.js";
import { createCreativeProject, chooseIndependentProduction } from "../src/logic/creative.js";
import { queueCreativeActivity } from "../src/logic/creative-schedule.js";
import { activityForDay, cancelActivity, markActivityDone } from "../src/logic/scheduled-activities.js";
import { resolvePersonalTask } from "../src/logic/personal-tasks.js";
import { capturePlannerTransaction } from "../src/core/state-transaction.js";

function setup() {
  resetState();
  state.schedule = Array(7).fill("rest");
  state.scheduledJobIds = Array(7).fill(null);
  state.scheduledActivityIds = Array(7).fill(null);
  state.scheduledActivities = {};
  state.npcSchedules = {};
  state.selectedDay = 0;
  state.money = 20000;
  return createCreativeProject("song", "慢慢發光");
}
function queue(p, kind = "creative_work", day) {
  return queueCreativeActivity(kind, { projectId: p.id }, p.title, { preferredDay: day });
}
function perform(day) {
  state.runnerDay = day;
  const result = resolvePersonalTask(activityForDay(day));
  markActivityDone(day);
  return result;
}
function production() {
  const p = setup();
  p.progress = 100; p.status = "ready";
  chooseIndependentProduction(p.id);
  p.team = ["jiqing"];
  return p;
}
test("同週可安排七天創作；排程不立即增加進度，執行才累積", () => {
  const p = setup();
  const initial = p.progress;
  for (let day = 0; day < 7; day++) assert.equal(queue(p).day, day);
  assert.equal(p.progress, initial);
  assert.equal(queue(p).ok, false);
  assert.equal(perform(0).ok, true);
  const first = p.progress;
  assert.ok(first > initial);
  assert.equal(perform(1).ok, true);
  assert.ok(p.progress > first);
  assert.equal(state.week, 1);
});
test("草稿完成後只取消同作品同階段的多餘日，保留其他作品", () => {
  const p = setup(), other = createCreativeProject("script", "另一個故事");
  p.progress = 99;
  queue(p); queue(p); queue(other);
  assert.match(perform(0).text, /後面 1 天改為休息/);
  assert.equal(state.schedule[1], "rest");
  assert.equal(activityForDay(2).payload.projectId, other.id);
});
test("同週製作多天只扣一次預算，完成後釋放多餘日的 NPC 檔期", () => {
  const p = production(), before = state.money;
  p.requiredProductionSessions = 2;
  for (let day = 0; day < 4; day++) assert.equal(queue(p, "creative_production").ok, true);
  assert.equal(state.money, before);
  assert.equal(perform(0).ok, true);
  assert.equal(state.money, before - 3500);
  assert.equal(perform(1).ok, true);
  assert.equal(state.money, before - 3500);
  assert.equal(p.status, "ready_release");
  assert.deepEqual(state.npcSchedules.jiqing.map(s => s.status), ["completed", "completed", "released", "released"]);
  assert.equal(state.schedule[2], "rest");
  assert.equal(state.schedule[3], "rest");
});
test("取消一天製作不會取消另外一天合作檔期", () => {
  const p = production();
  queue(p, "creative_production"); queue(p, "creative_production");
  cancelActivity(0);
  assert.deepEqual(state.npcSchedules.jiqing.map(s => s.status), ["released", "reserved"]);
  assert.equal(activityForDay(1).status, "scheduled");
});
test("團隊檔期衝突完整還原行程與選定日，不影響已有預約", () => {
  const p = production();
  queue(p, "creative_production");
  state.npcSchedules.jiqing.push({ jobId: "other", week: 1, day: 1, status: "reserved" });
  state.schedule[1] = "free"; state.freeLocations[1] = "park";
  const before = capturePlannerTransaction(state);
  assert.equal(queue(p, "creative_production", 1).ok, false);
  assert.deepEqual(capturePlannerTransaction(state), before);
});
test("投稿與發行等單次交易仍不能重複排隊", () => {
  const p = setup(); p.status = "ready";
  assert.equal(queue(p, "creative_submit").ok, true);
  assert.equal(queue(p, "creative_submit").ok, false);
});
