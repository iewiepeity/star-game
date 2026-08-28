import test from"node:test";
import assert from"node:assert/strict";
import{ABILITIES}from"../src/data/abilities.js";
import{JOB_BY_ID}from"../src/data/jobs-catalog.js";
import{state,resetState,hydrateState}from"../src/core/state.js";
import{setSeed,randomInt}from"../src/core/rng.js";
import{validateGameState}from"../src/core/save-schema.js";
import{ensureJobState,applyForJob,signJob,scheduleJobSession,completeJobSession,checkJobDeadlines}from"../src/logic/job-engine.js";
import{meetNpc,adjustRelationship,relationshipStage,advanceRomance}from"../src/logic/npc-engine.js";
import{matchesConditions,resolveEvent,processQueuedEvents,activateNextEvent,EVENT_KINDS,classifyEvent}from"../src/logic/event-engine.js";
import{addCompletedWork,resolveAwardSeason}from"../src/logic/portfolio.js";
import{evaluateEnding,endingSnapshot}from"../src/logic/career.js";

function fresh(){resetState();state.name="測試玩家";state.stats=Object.fromEntries(ABILITIES.map(name=>[name,1000]));state.hidden={幽默:700,共情:700,洞察:700,膽識:700,品德:700,自律:700,野心:700,抗壓:700};state.schedule=Array(7).fill("rest");state.freeLocations=Array(7).fill(null);state.scheduledJobIds=Array(7).fill(null);state.trainingSessionsCompleted=100;setSeed("test-seed")}

test("Seed RNG 可重現",()=>{fresh();const a=[randomInt(1,100),randomInt(1,100),randomInt(1,100)];setSeed("test-seed");const b=[randomInt(1,100),randomInt(1,100),randomInt(1,100)];assert.deepEqual(a,b)});

test("通告 domain 會阻擋未達資格的直接申請",()=>{fresh();state.stats.鏡頭感=0;assert.equal(applyForJob("J001"),false);assert.equal(state.activeJobs.J001.stage,"available")});

test("多通告可同時簽約、依指定日排程並建立作品履歷",()=>{fresh();for(const id of["J001","J002"]){const record=ensureJobState(id);record.stage="passed";assert.equal(signJob(id),true);assert.equal(scheduleJobSession(id).ok,true)}assert.equal(Object.values(state.activeJobs).filter(job=>job.stage==="active").length,2);const id=state.scheduledJobIds.find(Boolean),record=state.activeJobs[id];record.remainingSessions=1;const result=completeJobSession(id);assert.equal(result.completed,true);assert.equal(state.completedWorks.length,1)});

test("逾期通告會個別違約，不影響其他合約",()=>{fresh();const a=ensureJobState("J001"),b=ensureJobState("J002");Object.assign(a,{stage:"active",deadlineWeek:1,remainingSessions:2});Object.assign(b,{stage:"active",deadlineWeek:9,remainingSessions:2});state.week=2;assert.deepEqual(checkJobDeadlines(),["J001"]);assert.equal(a.stage,"breached");assert.equal(b.stage,"active")});

test("NPC 引擎集中處理初遇、里程碑事件與戀愛狀態",()=>{fresh();assert.equal(meetNpc("jiqing").met,true);adjustRelationship("jiqing",{closeness:40,trust:30,source:"共同工作"});const rel=state.relationships.jiqing;assert.equal(relationshipStage(rel).id,"friend");assert.ok(state.eventQueue.length>=1);assert.equal(advanceRomance("jiqing","interested"),true);assert.equal(rel.romance,"interested")});

test("事件 DSL 支援複合效果與關係條件",()=>{fresh();meetNpc("jiqing");adjustRelationship("jiqing",{closeness:30,trust:20});const event={title:"複合事件",text:"一次改很多東西",requires:{moneyMin:100,relationship:{jiqing:{closeness:20}}},effects:[{stat:"演技",value:3},{rep:"業界評價",value:4},{fame:2},{flag:"combo"}]};assert.equal(matchesConditions(event.requires),true);resolveEvent(event);assert.equal(state.stats.演技,1000);assert.equal(state.rep.業界評價,4);assert.equal(state.fame,2);assert.ok(state.eventFlags.includes("combo"))});

test("延遲事件到期後進入可見事件佇列，不再背景偷偷結算",()=>{fresh();resolveEvent({title:"埋下伏筆",text:"現在還看不出影響",effect:{delayWeeks:2},followUp:{delayWeeks:2,event:{title:"後續回響",text:"過去的選擇回來了",effect:{fame:5}}}});state.week=2;assert.equal(processQueuedEvents(),0);state.week=3;assert.equal(processQueuedEvents(),1);assert.equal(state.fame,0);activateNextEvent();assert.equal(state.activeEvent.event.title,"後續回響");resolveEvent(state.activeEvent.event);assert.equal(state.fame,5)});

test("作品先進年度獎季，再於典禮週判定",()=>{fresh();state.week=30;const job=JOB_BY_ID.J031;const work=addCompletedWork(job,{quality:95});assert.equal(state.awards.length,0);assert.ok(state.awardSeasons["1"].candidates.includes(work.id));state.week=52;setSeed("award-test");resolveAwardSeason(1);assert.equal(state.awardSeasons["1"].resolved,true)});

test("舊版單通告存檔只在 hydrate 時遷移，runtime 不再保留舊欄位",()=>{fresh();const legacy=structuredClone(state);delete legacy.activeJobs;legacy.jobStage="active";legacy.jobRemaining=2;legacy.jobDeadline=3;hydrateState(legacy);assert.equal(state.activeJobs.J001.stage,"active");assert.equal("jobStage"in state,false);assert.equal("jobRemaining"in state,false)});

test("結局 snapshot 不會受後續 state 變動污染",()=>{fresh();state.completedWorks=[{quality:90,category:"電影"}];state.careerProgress.電影=900;state.awards=[{result:"得獎"}];state.money=1200000;state.fame=800;state.fans=100000;meetNpc("guchengxi");adjustRelationship("guchengxi",{closeness:80,trust:80});const snap=endingSnapshot("fiveyear");state.money=0;state.endingSnapshot=snap;const result=evaluateEnding("fiveyear");assert.equal(result.snapshot.money,1200000);assert.ok(result.badges.includes("重要羈絆"))});

test("v4 存檔 schema、五槽、匯出匯入與備份",async()=>{const store=new Map;globalThis.localStorage={getItem:key=>store.get(key)||null,setItem:(key,value)=>store.set(key,value),removeItem:key=>store.delete(key)};const persistence=await import(`../src/core/persistence.js?test=${Date.now()}`);fresh();state.week=12;assert.equal(validateGameState(state).ok,true);assert.equal(persistence.saveManualSlot(3,state,"第三槽"),true);assert.equal(persistence.loadManualSlot(3).week,12);const exported=persistence.exportSave(state);assert.equal(persistence.parseImportedSave(exported).week,12);assert.equal(persistence.manualSlotMetas().length,5);assert.throws(()=>persistence.parseImportedSave(JSON.stringify({game:"star-game",v:4,state:{week:-1}})))});

test("事件分類仍維持資料驅動",()=>{fresh();assert.equal(classifyEvent({choices:[{id:"x"}]}),EVENT_KINDS.CHOICE);assert.equal(classifyEvent({effect:{fame:1}}),EVENT_KINDS.PUBLIC)});
