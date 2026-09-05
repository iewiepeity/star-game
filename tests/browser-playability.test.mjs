import test from "node:test";
import assert from "node:assert/strict";
import { resetState, state } from "../src/core/state.js";
import {
  copyRoutineWeek,
  restRoutineWeek,
} from "../src/logic/schedule-assistant.js";
import { replacePlannerDay } from "../src/logic/planner-edit.js";
import { restoreStateFields } from "../src/core/state-transaction.js";
import { firstWorkJourney } from "../src/logic/first-work.js";
import { scenePosition, moveScene } from "../src/logic/scene-reader.js";
import { eventView } from "../src/views/event.js";
import { NPC_AUTONOMOUS_BEATS } from "../src/data/living-world-content.js";
import { NPCS } from "../src/data/npcs.js";
import { persistableState } from "../src/core/persistence.js";

test("沿用上週與休息整理都保留本週的重要預約", () => {
  resetState();
  state.visitedLocationsByWeek[state.week] = ["recording", "rehearsal", "dance"];
  state.schedule = [
    "personal_task",
    "agency_interview",
    "job_session",
    "vocal",
    "rest",
    "rest",
    "rest",
  ];
  state.scheduledActivityIds[0] = "A1";
  state.scheduledJobIds[2] = "J001";
  state.lastSchedule = Array(7).fill("acting");
  assert.equal(copyRoutineWeek().ok, true);
  assert.deepEqual(state.schedule.slice(0, 3), [
    "personal_task",
    "agency_interview",
    "job_session",
  ]);
  assert.equal(state.schedule[3], "acting");
  restRoutineWeek();
  assert.equal(state.scheduledActivityIds[0], "A1");
  assert.equal(state.scheduledJobIds[2], "J001");
  assert.equal(state.schedule[3], "rest");
  state.lastSchedule = Array(7).fill("job_session");
  copyRoutineWeek();
  assert.equal(state.schedule[3], "rest");
});
test("替換試鏡先確認且復原時恢復工作階段", () => {
  resetState();
  state.schedule[0] = "personal_task";
  state.scheduledActivityIds[0] = "A1";
  state.scheduledActivities.A1 = {
    id: "A1",
    kind: "job_audition",
    payload: { jobId: "J001" },
    status: "scheduled",
  };
  state.activeJobs.J001 = {
    jobId: "J001",
    stage: "audition_scheduled",
    auditionActivityId: "A1",
  };
  const proposed = replacePlannerDay(0, "rest");
  assert.equal(proposed.confirmationRequired, true);
  assert.equal(state.activeJobs.J001.stage, "audition_scheduled");
  const result = replacePlannerDay(0, "rest", {
    ...proposed.request,
    confirmed: true,
  });
  assert.equal(result.ok, true);
  assert.equal(state.activeJobs.J001.stage, "applied");
  restoreStateFields(state, result.snapshot);
  assert.equal(state.activeJobs.J001.stage, "audition_scheduled");
  assert.equal(state.scheduledActivityIds[0], "A1");
});
test("過期的替換要求與強制休養不會改動排程", () => {
  resetState();
  state.schedule[0] = "job_session";
  state.scheduledJobIds[0] = "J001";
  const request = replacePlannerDay(0, "vocal").request;
  state.week++;
  assert.equal(
    replacePlannerDay(0, "vocal", { ...request, confirmed: true }).ok,
    false,
  );
  state.forcedRestWeek = state.week;
  assert.equal(replacePlannerDay(1, "vocal").ok, false);
  assert.equal(copyRoutineWeek().ok, false);
});
test("地圖選擇走同一套確認與排程交易", () => {
  resetState();
  state.schedule[0] = "job_session";
  state.scheduledJobIds[0] = "J001";
  const proposed = replacePlannerDay(0, "free", { locationId: "park" });
  assert.equal(proposed.confirmationRequired, true);
  const result = replacePlannerDay(0, "free", {
    ...proposed.request,
    confirmed: true,
  });
  assert.equal(result.ok, true);
  assert.equal(state.scheduledJobIds[0], null);
  assert.equal(state.freeLocations[0], "park");
});
test("未簽公司仍依真實工作階段給新人下一步", () => {
  resetState();
  assert.equal(firstWorkJourney(state).app, "map");
  state.activeJobs.J001 = { stage: "passed" };
  assert.equal(firstWorkJourney(state).stage, "contract");
  state.activeJobs.J001 = {
    stage: "active",
    remainingSessions: 2,
    deadlineWeek: 4,
  };
  assert.equal(firstWorkJourney(state).stage, "production");
  state.completedWorks = [{ id: "W1", title: "初演" }];
  assert.equal(firstWorkJourney(state).stage, "completed");
});
test("逐幕閱讀不提前顯示後文或選項，讀檔保留位置", () => {
  resetState();
  state.activeEvent = {
    event: {
      id: "reader",
      title: "雨夜",
      beats: [{ text: "第一幕" }, { text: "第二幕" }, { text: "第三幕" }],
      choices: [{ id: "stay", label: "留下" }],
    },
  };
  let html = eventView();
  assert.match(html, /第一幕/);
  assert.doesNotMatch(html, /第二幕|data-event-choice=/);
  moveScene(state.activeEvent, 1);
  const saved = persistableState(state);
  assert.equal(scenePosition(saved.activeEvent).index, 1);
  moveScene(state.activeEvent, 1);
  html = eventView();
  assert.match(html, /data-event-choice="stay"/);
  assert.equal(moveScene(state.activeEvent, 1), false);
  moveScene(state.activeEvent, -1);
  assert.doesNotMatch(eventView(), /data-event-choice=/);
});
test("世界近況與人物名冊使用相同姓名", () => {
  for (const id of ["xiayutong", "hanzhiyuan"])
    assert.ok(NPC_AUTONOMOUS_BEATS[id][0].includes(NPCS[id].name));
});
