import test from"node:test";
import assert from"node:assert/strict";
import{ABILITIES}from"../src/data/abilities.js";
import{JOB_CATALOG}from"../src/data/jobs-catalog.js";
import{state,resetState}from"../src/core/state.js";
import{setSeed}from"../src/core/rng.js";
import{scheduleActivity,activityForDay}from"../src/logic/scheduled-activities.js";
import{playerBirthdayWeek}from"../src/logic/calendar-events.js";
import{refreshAgencyJobOffers}from"../src/logic/agency-offers.js";
import{jobSource}from"../src/logic/industry.js";
import{meetNpc,adjustRelationship}from"../src/logic/npc-engine.js";
import{ensureNpcCareer}from"../src/logic/npc-ecosystem.js";
import{syncNpcAutonomousWork}from"../src/logic/npc-autonomy.js";
function fresh(){resetState();state.name="整合測試";state.stats=Object.fromEntries(ABILITIES.map(n=>[n,500]));state.schedule=Array(7).fill("rest");state.freeLocations=Array(7).fill(null);state.scheduledJobIds=Array(7).fill(null);state.scheduledActivityIds=Array(7).fill(null);setSeed("integration")}
test("創作／社交等個人行為會先占用一個真實行程日",()=>{fresh();const r=scheduleActivity("social_post",{type:"work"},"正式社群更新",{fatigue:2});assert.equal(r.ok,true);assert.equal(state.schedule[r.day],"personal_task");assert.equal(activityForDay(r.day).label,"正式社群更新");assert.equal(state.schedule.filter(x=>x==="personal_task").length,1)});
test("玩家生日由創角日期換算成每年固定週",()=>{fresh();state.birthMonth=7;state.birthDay=2;assert.equal(playerBirthdayWeek(),27)});
test("簽約公司只會每週送有限工作邀約，不會解鎖整個通告池",()=>{fresh();state.currentAgencyId="starlight";state.agencyContractEndWeek=104;const offers=refreshAgencyJobOffers();assert.ok(offers.length>=1&&offers.length<=4);assert.ok(offers.every(o=>o.expiresWeek===state.week+1));const offered=JOB_CATALOG.find(j=>j.id===offers[0].jobId);assert.equal(jobSource(offered).type,"agency");const notOffered=JOB_CATALOG.find(j=>!offers.some(o=>o.jobId===j.id));if(notOffered)assert.notEqual(jobSource(notOffered).type,"agency")});
test("人脈通告必須是該 NPC 真正相關領域且關係夠深",()=>{fresh();meetNpc("guchengxi");adjustRelationship("guchengxi",{closeness:50,trust:35});const movie=JOB_CATALOG.find(j=>j.category==="電影"&&j.stars>=3),song=JOB_CATALOG.find(j=>j.category==="歌曲"&&j.stars>=3);assert.equal(jobSource(movie).type,"network");assert.notEqual(jobSource(song).type,"network")});
test("NPC 自己增加作品時會建立真實檔期，而不是只有 works +1",()=>{fresh();const career=ensureNpcCareer("guchengxi");career.works=1;career.lastScheduledWorkCount=0;const updates=syncNpcAutonomousWork();assert.ok(updates.length>=1);assert.ok((state.npcSchedules.guchengxi||[]).some(s=>s.source==="npc-autonomous"&&s.status==="reserved"));assert.equal(career.lastScheduledWorkCount,career.works)});
