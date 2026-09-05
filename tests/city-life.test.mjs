import test from "node:test";
import assert from "node:assert/strict";
import {
  initialState,
  state,
  resetState,
  hydrateState,
} from "../src/core/state.js";
import {
  trainingAccess,
  TRAINING_VENUES,
  hasVisited,
  agencyContactsUnlocked,
  newcomerStep,
} from "../src/logic/city-progression.js";
import { ACTIONS } from "../src/data/actions.js";
import { MAP_LOCATIONS } from "../src/data/map-locations.js";
import { CITY_DISTRICTS } from "../src/data/city-map.js";
import { replacePlannerDay } from "../src/logic/planner-edit.js";
import { resolveExploration } from "../src/logic/exploration.js";
import {
  applySchedulePreset,
  copyRoutineWeek,
} from "../src/logic/schedule-assistant.js";
import { canApplyToAgency } from "../src/logic/agency.js";
import { AGENCY_LIST } from "../src/data/agencies.js";
import { NPCS } from "../src/data/npcs.js";
import { invitationStatus, inviteNpc } from "../src/logic/npc-invitations.js";
import { cancelActivity } from "../src/logic/scheduled-activities.js";
import { persistableState } from "../src/core/persistence.js";
test("每門訓練有實際場地，所有城市地點都有地圖入口", () => {
  for (const [id, a] of Object.entries(ACTIONS))
    if (a.type === "train") assert.ok(MAP_LOCATIONS[TRAINING_VENUES[id]], id);
  const places = Object.values(CITY_DISTRICTS).flatMap((d) => d.places);
  assert.equal(new Set(places).size, places.length);
  assert.deepEqual([...places].sort(), Object.keys(MAP_LOCATIONS).sort());
});
test("排入探訪不算已到訪；單日、範本與沿用上週都不能繞過訓練門檻", () => {
  resetState();
  assert.equal(replacePlannerDay(0, "vocal").ok, false);
  assert.equal(
    replacePlannerDay(0, "free", { locationId: "recording" }).ok,
    true,
  );
  assert.equal(trainingAccess(state, "vocal").unlocked, false);
  applySchedulePreset("singer");
  assert.ok(!state.schedule.includes("vocal"));
  state.lastSchedule = Array(7).fill("vocal");
  copyRoutineWeek();
  assert.ok(!state.schedule.includes("vocal"));
  resolveExploration("recording", "focus");
  assert.equal(trainingAccess(state, "vocal").unlocked, true);
  assert.equal(trainingAccess(state, "songwriting").unlocked, true);
  assert.equal(trainingAccess(state, "dance").unlocked, false);
  assert.equal(replacePlannerDay(1, "vocal").ok, true);
  const loaded = hydrateState(persistableState(state));
  loaded.week++;
  assert.equal(trainingAccess(loaded, "vocal").unlocked, true);
  loaded.visitedLocationsByWeek[99] = ["dance"];
  assert.equal(hasVisited(loaded, "dance"), false);
});
test("新人的第一站隨志向變化；公司資格再高也必須先取得聯絡資料", () => {
  resetState();
  state.aspiration = "vocal";
  assert.equal(newcomerStep(state).location, "recording");
  state.contract = 100;
  for (const a of AGENCY_LIST)
    for (const [name] of a.requirements.abilities) state.stats[name] = 1000;
  assert.equal(canApplyToAgency(AGENCY_LIST[0]), false);
  resolveExploration("business", "focus");
  assert.equal(canApplyToAgency(AGENCY_LIST[0]), true);
  assert.equal(
    agencyContactsUnlocked({
      ...initialState(),
      currentAgencyId: AGENCY_LIST[0].id,
    }),
    true,
  );
});
test("人物邀約尊重工作與玩家行程，預約不扣款且取消釋出人物檔期", () => {
  resetState();
  const id = Object.keys(NPCS)[0];
  state.knownPeople = [id];
  state.money = 5000;
  state.npcSchedules[id] = [
    { week: state.week, day: 0, status: "reserved", jobId: "work" },
  ];
  assert.match(invitationStatus(state, id, "meal", 0), /有工作/);
  state.schedule[1] = "free";
  assert.match(invitationStatus(state, id, "meal", 1), /已有安排/);
  const result = inviteNpc(id, "meal", 2);
  assert.equal(result.ok, true);
  assert.equal(state.money, 5000);
  assert.equal(state.schedule[2], "personal_task");
  assert.ok(
    state.npcSchedules[id].some((s) => s.jobId === result.id && s.day === 2),
  );
  assert.equal(inviteNpc(id, "meal", 3).ok, false);
  assert.equal(state.npcMessages.at(-1).source, "invitation");
  cancelActivity(2);
  assert.equal(
    state.npcSchedules[id].find((s) => s.jobId === result.id).status,
    "released",
  );
  assert.equal(invitationStatus(state, id, "meal", 2), "");
  assert.equal(
    invitationStatus(state, "missing", "chat", 3),
    "你們還沒有交換聯絡方式。",
  );
});


test("第一週任務先安頓生活，僅完成的探訪與工作算數", async () => {
  const { weeklyTaskInfo, evaluateWeeklyTask } = await import("../src/logic/weekly-task.js");
  resetState();
  assert.match(weeklyTaskInfo().desc, /探訪 1 次/);
  state.schedule[0] = "free";
  state.freeLocations[0] = "rehearsal";
  state.schedule[1] = "newcomer_gig";
  assert.equal(evaluateWeeklyTask().met, false);
  state.weekResults = [{dayIndex: 0, success: true}, {dayIndex: 1, success: true}];
  state.visitedLocationsByWeek = {1: ["rehearsal"]};
  const before = state.money, contract = state.contract;
  assert.equal(evaluateWeeklyTask().met, true);
  assert.equal(state.money, before + 1500);
  assert.equal(state.contract, contract);
  state.week = 2;
  assert.match(weeklyTaskInfo().desc, /訓練 2 天/);
});

test("經紀公司履歷送出後，下週才能預約面談", async () => {
  const { scheduleAgencyInterview } = await import("../src/logic/agency.js");
  resetState();
  const id = AGENCY_LIST[0].id;
  state.agencyApplications[id] = {status: "applied", appliedWeek: 1};
  scheduleAgencyInterview(id);
  assert.equal(state.agencyApplications[id].status, "applied");
  assert.ok(!state.schedule.includes("agency_interview"));
  state.week = 2;
  scheduleAgencyInterview(id);
  assert.equal(state.agencyApplications[id].status, "interview_scheduled");
  assert.equal(state.schedule[0], "agency_interview");
});
