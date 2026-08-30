import test from "node:test";
import assert from "node:assert/strict";
import { state, resetState } from "../src/core/state.js";
import { cancelActivity } from "../src/logic/scheduled-activities.js";
import { capturePlannerTransaction, restoreStateFields } from "../src/core/state-transaction.js";

function scheduledTask(task) {
  state.schedule = Array(7).fill("rest");
  state.scheduledActivityIds = Array(7).fill(null);
  state.schedule[2] = "personal_task";
  state.scheduledActivityIds[2] = task.id;
  state.scheduledActivities = { [task.id]: task };
}

test("Undo 會連同試鏡工作階段一起復原", () => {
  resetState();
  state.activeJobs.J001 = { jobId: "J001", stage: "audition_scheduled", auditionActivityId: "A1", notice: "已安排試鏡" };
  scheduledTask({ id: "A1", kind: "job_audition", payload: { jobId: "J001" }, status: "scheduled" });
  const snapshot = capturePlannerTransaction(state);

  cancelActivity(2);
  assert.equal(state.activeJobs.J001.stage, "applied");
  restoreStateFields(state, snapshot);

  assert.equal(state.schedule[2], "personal_task");
  assert.equal(state.scheduledActivities.A1.status, "scheduled");
  assert.equal(state.activeJobs.J001.stage, "audition_scheduled");
  assert.equal(state.activeJobs.J001.auditionActivityId, "A1");
});

test("Undo 會連同創作團隊 NPC 檔期一起復原", () => {
  resetState();
  state.creativeProjects = [{ id: "CP1", title: "雨後", status: "production", team: ["jiqing"] }];
  state.npcSchedules = { jiqing: [{ jobId: "creative:CP1", week: 1, day: 2, status: "reserved", external: true }] };
  scheduledTask({ id: "A2", kind: "creative_production", payload: { projectId: "CP1" }, status: "scheduled" });
  const snapshot = capturePlannerTransaction(state);

  cancelActivity(2);
  assert.equal(state.npcSchedules.jiqing[0].status, "released");
  restoreStateFields(state, snapshot);

  assert.equal(state.scheduledActivities.A2.status, "scheduled");
  assert.equal(state.npcSchedules.jiqing[0].status, "reserved");
});
