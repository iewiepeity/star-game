import { ABILITIES } from "../src/data/abilities.js";
import test from "node:test";
import assert from "node:assert/strict";
import { state, resetState, hydrateState } from "../src/core/state.js";
import { COMPANY_PART_TIME } from "../src/data/part-time.js";
import { INDUSTRY_LIST } from "../src/data/industry.js";
import { JOB_CATALOG } from "../src/data/jobs.js";
import { NPC_CAREER_PROFILES } from "../src/data/npc-network.js";
import { AGENCY_LIST } from "../src/data/agencies.js";
import { workAccess, recordPartTimeShift } from "../src/logic/work-progression.js";
import { resolveExploration } from "../src/logic/exploration.js";
import { replacePlannerDay } from "../src/logic/planner-edit.js";
import { applySchedulePreset, copyRoutineWeek } from "../src/logic/schedule-assistant.js";
import { applyForJob, availableJobs, ensureJobState } from "../src/logic/job-engine.js";
import { canAccessJob, jobSource } from "../src/logic/industry.js";
import { persistableState } from "../src/core/persistence.js";
import { activityPicker } from "../src/views/planner.js";

test("四間公司的打工必須實際到訪，登記與經驗跨週讀檔保留", () => {
  assert.equal(Object.keys(COMPANY_PART_TIME).length, INDUSTRY_LIST.length);
  for (const [id, job] of Object.entries(COMPANY_PART_TIME)) {
    resetState();
    assert.equal(workAccess(state, id).unlocked, false);
    assert.equal(replacePlannerDay(0, id).ok, false);
    assert.ok(!activityPicker().includes(`data-pick="${id}"`));
    replacePlannerDay(0, "free", {locationId:job.venue});
    assert.equal(workAccess(state,id).unlocked,false);
    assert.match(resolveExploration(job.venue,"focus").text, /臨時人員登記/);
    assert.equal(replacePlannerDay(1,id).ok,true);
    assert.ok(activityPicker().includes(`data-pick="${id}"`));
    assert.equal(state.partTimeShifts[id], undefined);
    recordPartTimeShift(state,id);
    hydrateState({...persistableState(state),week:4});
    assert.equal(workAccess(state,id).unlocked,true);
    assert.equal(state.partTimeShifts[id],1);
  }
});
test("新人僅能直接安排服務台零工；範本和舊排程不能繞過演出登記", () => {
  resetState();
  assert.equal(workAccess(state,"newcomer_gig").unlocked,true);
  assert.equal(replacePlannerDay(0,"audition").ok,false);
  assert.equal(replacePlannerDay(0,"street").ok,false);
  applySchedulePreset("actor");
  assert.ok(!state.schedule.includes("audition"));
  state.lastSchedule=Array(7).fill("film_runner");
  copyRoutineWeek();
  assert.ok(!state.schedule.includes("film_runner"));
  resolveExploration("park","focus");
  assert.equal(workAccess(state,"street").unlocked,true);
  assert.equal(workAccess(state,"audition").unlocked,false);
});
test("高能力與空白工作紀錄不能直接申請；探訪僅提供近期公司徵選", () => {
  resetState();
  const job=JOB_CATALOG.find(j=>j.stars===1&&j.category==="電影");
  state.stats=Object.fromEntries(ABILITIES.map(key=>[key,1000]));
  state.trainingSessionsCompleted=100;
  assert.equal(applyForJob(job.id),false);
  ensureJobState(job.id);
  assert.equal(canAccessJob(job).ok,false);
  assert.equal(applyForJob(job.id),false);
  assert.equal(state.activeJobs[job.id].stage,"available");
  resolveExploration("film_company","focus");
  assert.equal(canAccessJob(job).ok,true);
  state.week=4;
  assert.equal(canAccessJob(job).ok,false);
  resolveExploration("film_company","focus");
  assert.equal(applyForJob(job.id),true);
  state.week=7;
  assert.equal(canAccessJob(job).ok,true); // Existing application remains valid.
});
test("三次同公司打工開放持續消息與兩星機會，不洩漏別家公司或高階通告", () => {
  resetState();
  resolveExploration("film_company","focus");
  state.week=4;
  const film=JOB_CATALOG.find(j=>j.stars===2&&j.category==="電影"), other=JOB_CATALOG.find(j=>j.stars===1&&j.category==="歌曲"), high=JOB_CATALOG.find(j=>j.stars===5&&j.category==="電影");
  recordPartTimeShift(state,"film_runner");recordPartTimeShift(state,"film_runner");
  assert.equal(canAccessJob(film).ok,false);
  assert.match(recordPartTimeShift(state,"film_runner"),/兩星/);
  assert.equal(jobSource(film).type,"experience");
  assert.equal(canAccessJob(film).ok,true);
  assert.ok(availableJobs().some(j=>j.id===film.id));
  assert.equal(canAccessJob(other).ok,false);
  ensureJobState(high.id);
  assert.equal(canAccessJob(high).ok,false);
});
test("人脈引薦需要熟識與信任；經紀機會必須是有效公司實際推薦", () => {
  resetState();
  const job=JOB_CATALOG.find(j=>j.stars===1&&j.category==="電影"), contact=Object.keys(NPC_CAREER_PROFILES).find(id=>NPC_CAREER_PROFILES[id].specialties.includes(job.category));
  state.knownPeople=[contact];state.relationships[contact]={closeness:10,trust:10};
  assert.equal(canAccessJob(job).ok,false);
  state.relationships[contact]={closeness:35,trust:20};
  assert.equal(jobSource(job).type,"network");
  assert.equal(canAccessJob(job).ok,true);
  state.relationships[contact].hostility=50;
  assert.equal(canAccessJob(job).ok,false);
  state.currentAgencyId=AGENCY_LIST[0].id;state.agencyContractEndWeek=20;
  assert.equal(canAccessJob(job).ok,false);
  state.agencyJobOffers=[{jobId:job.id,agencyId:state.currentAgencyId,expiresWeek:2}];
  assert.equal(jobSource(job).type,"agency");
  assert.equal(canAccessJob(job).ok,true);
  state.currentAgencyId=null;
  assert.equal(canAccessJob(job).ok,false);
});
test("兩份相關作品建立公司窗口，但不會開放所有產業", () => {
  resetState();state.completedWorks=[{category:"電影"},{category:"電影"}];
  assert.equal(canAccessJob(JOB_CATALOG.find(j=>j.category==="電影"&&j.stars===1)).ok,true);
  assert.equal(canAccessJob(JOB_CATALOG.find(j=>j.category==="歌曲"&&j.stars===1)).ok,false);
});
