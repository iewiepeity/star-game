import test from"node:test";
import assert from"node:assert/strict";
import{ABILITIES}from"../src/data/abilities.js";
import{JOB_BY_ID}from"../src/data/jobs-catalog.js";
import{state,resetState,hydrateState}from"../src/core/state.js";
import{ensureJobState,signJob,scheduleJobSession,completeJobSession,checkJobDeadlines}from"../src/logic/job-engine.js";
import{meetNpc,adjustRelationship,relationshipStage}from"../src/logic/npc-engine.js";
import{matchesConditions,resolveEvent,processQueuedEvents,EVENT_KINDS,classifyEvent}from"../src/logic/event-engine.js";
import{evaluateEnding}from"../src/logic/career.js";

function fresh(){resetState();state.name="測試玩家";state.stats=Object.fromEntries(ABILITIES.map(name=>[name,1000]));state.hidden={幽默:700,共情:700,洞察:700,膽識:700,品德:700,自律:700,野心:700,抗壓:700};state.schedule=Array(7).fill("rest");state.scheduledJobIds=Array(7).fill(null);state.trainingSessionsCompleted=100}

test("多通告可同時簽約、依指定日排程並建立作品履歷",()=>{fresh();for(const id of["J001","J002"]){const record=ensureJobState(id);record.stage="passed";assert.equal(signJob(id),true);assert.equal(scheduleJobSession(id).ok,true)}assert.equal(Object.values(state.activeJobs).filter(job=>job.stage==="active").length,2);const id=state.scheduledJobIds.find(Boolean),record=state.activeJobs[id];record.remainingSessions=1;const result=completeJobSession(id);assert.equal(result.completed,true);assert.equal(state.completedWorks.length,1)});

test("逾期通告會個別違約，不影響其他合約",()=>{fresh();const a=ensureJobState("J001"),b=ensureJobState("J002");Object.assign(a,{stage:"active",deadlineWeek:1,remainingSessions:2});Object.assign(b,{stage:"active",deadlineWeek:9,remainingSessions:2});state.week=2;assert.deepEqual(checkJobDeadlines(),["J001"]);assert.equal(a.stage,"breached");assert.equal(b.stage,"active")});

test("NPC 引擎集中處理初遇、關係階段與人物事件",()=>{fresh();assert.equal(meetNpc("jiqing").met,true);adjustRelationship("jiqing",{closeness:40,trust:30,source:"共同工作"});const rel=state.relationships.jiqing;assert.equal(relationshipStage(rel).id,"friend");assert.ok(state.npcMessages.length>=1)});

test("事件引擎支援條件、分類、旗標與效果",()=>{fresh();const event={title:"試鏡邀請",text:"收到通知",outcome:"機會出現",requires:{weekMin:1,stats:{演技:500}},effect:{flag:"first-offer",fame:3}};assert.equal(matchesConditions(event.requires),true);assert.equal(classifyEvent(event),EVENT_KINDS.CHAIN);resolveEvent(event);assert.ok(state.eventFlags.includes("first-offer"));assert.equal(state.fame,3)});

test("延遲事件會在指定週數後結算",()=>{fresh();resolveEvent({title:"埋下伏筆",text:"現在還看不出影響",outcome:"某件事被記住了",effect:{delayWeeks:2},followUp:{delayWeeks:2,event:{title:"後續回響",text:"過去的選擇回來了",outcome:"獲得口碑",effect:{fame:5}}}});assert.equal(state.queuedEvents.length,1);state.week=2;assert.equal(processQueuedEvents().length,0);state.week=3;assert.equal(processQueuedEvents().length,1);assert.equal(state.fame,5)});

test("舊版單通告存檔可遷移成多通告狀態",()=>{fresh();const legacy=structuredClone(state);delete legacy.activeJobs;legacy.jobStage="active";legacy.jobRemaining=2;legacy.jobDeadline=3;hydrateState(legacy);assert.equal(state.activeJobs.J001.stage,"active");assert.equal(state.activeJobs.J001.remainingSessions,2)});

test("結局判定會綜合作品、獎項、關係、財產與公眾評價",()=>{fresh();state.completedWorks=[{quality:90,category:"電影"}];state.careerProgress.電影=900;state.awards=[{result:"得獎"}];state.money=1200000;state.fame=800;state.fans=100000;meetNpc("guchengxi");adjustRelationship("guchengxi",{closeness:80,trust:80});const result=evaluateEnding("fiveyear");assert.equal(result.route,"電影演員");assert.ok(result.score>0);assert.ok(result.badges.includes("重要羈絆"))});

test("五槽存檔、匯出匯入與備份格式",async()=>{const store=new Map;globalThis.localStorage={getItem:key=>store.get(key)||null,setItem:(key,value)=>store.set(key,value),removeItem:key=>store.delete(key)};const persistence=await import(`../src/core/persistence.js?test=${Date.now()}`);fresh();state.week=12;assert.equal(persistence.saveManualSlot(3,state,"第三槽"),true);assert.equal(persistence.loadManualSlot(3).week,12);const exported=persistence.exportSave(state);assert.equal(persistence.parseImportedSave(exported).week,12);assert.equal(persistence.manualSlotMetas().length,5)});
