import test from"node:test";
import assert from"node:assert/strict";
import{state,resetState}from"../src/core/state.js";
import{captureWeekStart,finalizeWeekMemory}from"../src/logic/career-memory.js";
import{applySchedulePreset}from"../src/logic/schedule-assistant.js";
import{overseasEligibility,resolveOverseasVisit}from"../src/logic/overseas.js";
import{queueHiddenRoute}from"../src/logic/hidden-route.js";
import{enqueueVisibleEvent}from"../src/logic/event-engine.js";
import{createCreativeProject,setCreativeDirection}from"../src/logic/creative.js";
import{agencyRenewalPreview,renewAgencyContract,canApplyToAgency}from"../src/logic/agency.js";
import{AGENCIES}from"../src/data/agencies.js";
import{NPCS}from"../src/data/npcs.js";
import{NPC_ARCS}from"../src/data/npc-arc-events.js";

const fresh=()=>{resetState();state.schedule=Array(7).fill("rest");state.freeLocations=Array(7).fill(null);state.scheduledJobIds=Array(7).fill(null);state.scheduledActivityIds=Array(7).fill(null)};

test("週記憶會保留實際數值、事件、作品與關係後果",()=>{fresh();captureWeekStart();state.fame+=7;state.stats.演技=5;state.eventHistory.push({title:"選擇留下",choiceLabel:"面對",outcome:"事情有了後續"});state.completedWorks.push({title:"測試作品"});const memory=finalizeWeekMemory();assert.equal(memory.metrics.find(x=>x.key==="fame").value,7);assert.equal(memory.stats.find(x=>x.key==="演技").value,5);assert.equal(memory.newEvents[0].title,"選擇留下");assert.equal(memory.newWorks[0].title,"測試作品")});

test("排程範本保留正式預約，只改動空白行程",()=>{fresh();state.schedule[2]="personal_task";state.scheduledActivityIds[2]="A-1";const result=applySchedulePreset("actor");assert.equal(result.ok,true);assert.equal(state.schedule[2],"personal_task");assert.equal(state.scheduledActivityIds[2],"A-1");assert.equal(state.schedule[0],"acting")});

test("海外發展有明確門檻，解鎖後會產生職涯成果",()=>{fresh();assert.equal(overseasEligibility().unlocked,false);state.week=53;state.fame=80;state.completedWorks=Array(3).fill({title:"作品"});state.money=10000;assert.equal(overseasEligibility().unlocked,true);const before=state.fame;const result=resolveOverseasVisit("festival");assert.match(result.text,/影展|作品/);assert.equal(state.money,5000);assert.ok(state.fame>before);assert.equal(state.overseasVisits,1)});

test("多周目隱藏人物線只在第二輪且符合眼熟條件後登場",()=>{fresh();state.week=20;state.familiarNpcs=["jiqing","shenyao","tangtang"];assert.equal(queueHiddenRoute(),null);state.runCount=2;assert.match(queueHiddenRoute(),/silver-route-encounter/);const queued=[...state.eventQueue,...state.queuedEvents].find(x=>x.event.id==="silver-route-encounter");assert.ok(queued);assert.equal(queued.event.persistent,true)});

test("高優先人物事件不會因事件塞車而過期",()=>{fresh();enqueueVisibleEvent({id:"visible",title:"本週事件"},"一般事件");enqueueVisibleEvent({id:"character",kind:"人物事件",title:"人物主線"},"人物主線");const item=state.queuedEvents.find(x=>x.event.id==="character");assert.equal(item.expiresWeek,null)});

test("創作方向會保存到企劃，而且三類作品各有三種選擇",()=>{fresh();for(const type of["song","script","show"]){const project=createCreativeProject(type,`${type}作品`);assert.ok(project.direction);const directions={song:"experimental",script:"character",show:"observational"};assert.equal(setCreativeDirection(project.id,directions[type]).ok,true);assert.equal(project.direction,directions[type])}});

test("合約最後八週會出現續約條件，過期後也能重新投遞",()=>{fresh();const agency=AGENCIES.starlight;state.currentAgencyId=agency.id;state.agencySignedWeek=1;state.agencyContractEndWeek=8;state.week=2;state.agencyContractTerms={...agency.contract};state.managerState={trust:70};state.agencyApplications[agency.id]={status:"signed"};const preview=agencyRenewalPreview();assert.equal(preview.eligible,true);const oldEnd=state.agencyContractEndWeek;assert.equal(renewAgencyContract().ok,true);assert.ok(state.agencyContractEndWeek>oldEnd);state.currentAgencyId=null;state.agencyApplications[agency.id].status="expired";state.contract=100;for(const[name]of agency.requirements.abilities)state.stats[name]=1000;assert.equal(canApplyToAgency(agency),true)});

test("十名主要 NPC 各有三章人物主線，沈霧棠也不再是空白檔案",()=>{assert.equal(Object.keys(NPC_ARCS).length,10);assert.ok(Object.values(NPC_ARCS).every(arcs=>arcs.length===3));assert.match(NPCS.silver_pc.job,/動態/);assert.doesNotMatch(NPCS.silver_pc.personality,/尚待/)});
