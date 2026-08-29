import test from"node:test";
import assert from"node:assert/strict";
import{resetState,state}from"../src/core/state.js";
import{enqueueVisibleEvent,activateNextEvent,dismissActiveEvent}from"../src/logic/event-engine.js";
import{scheduleActivity}from"../src/logic/scheduled-activities.js";
import{socialApp}from"../src/views/social.js";
import{creativeApp}from"../src/views/creative.js";
import{plannerApp}from"../src/views/planner.js";
import{agencyApp}from"../src/views/agency.js";
import{npcApp}from"../src/views/npc.js";
import{meetNpc,npcFirstMeeting}from"../src/logic/npc-engine.js";
import{resolveExploration}from"../src/logic/exploration.js";
import{applyJobNpcRelations}from"../src/logic/npc-ecosystem.js";
import{resultView}from"../src/views/runner.js";
import{JOB_BY_ID}from"../src/data/jobs.js";
import{auditionChance}from"../src/logic/job-engine.js";
import{applyEffects}from"../src/logic/event-engine.js";
import{brandRelation,recordBrandOutcome}from"../src/logic/brand-relations.js";
import{worldApp}from"../src/views/world.js";
import{SCHEDULE_EVENTS}from"../src/data/schedule-events.js";
import{LOCATION_EVENTS}from"../src/data/location-events.js";
import{CALENDAR_EVENTS}from"../src/data/calendar-events.js";

test("同一週最多只呈現一個事件，其餘順延且不會選完立刻跳下一件",()=>{
 resetState();
 assert.equal(enqueueVisibleEvent({id:"event-a",title:"第一件"}),true);
 assert.equal(enqueueVisibleEvent({id:"event-b",title:"第二件"}),"deferred");
 assert.equal(state.eventQueue.length,1);
 assert.equal(state.queuedEvents.length,1);
 assert.equal(state.queuedEvents[0].dueWeek,2);
 activateNextEvent();
 assert.equal(state.activeEvent.event.id,"event-a");
 dismissActiveEvent();
 assert.equal(state.activeEvent,null);
 assert.equal(activateNextEvent(),null);
});

test("社群更新排入行程後，會立即以排程中貼文顯示",()=>{
 resetState();
 state.name="緹緹";
 state.schedule=Array(7).fill("rest");
 const result=scheduleActivity("social_post",{type:"work"},"社群更新：工作預告",{fatigue:2,stamina:2});
 assert.equal(result.ok,true);
 const html=socialApp();
 assert.match(html,/工作預告/);
 assert.match(html,/排程中/);
 assert.match(html,/將於行程執行後正式發布/);
});

test("強制休養週鎖定七天休息，也禁止從其他功能插入行程",()=>{
 resetState();
 state.forcedRestWeek=state.week;
 state.schedule=Array(7).fill("rest");
 const result=scheduleActivity("creative_work",{projectId:"x"},"偷塞工作");
 assert.equal(result.ok,false);
 assert.match(result.message,/強制休養週/);
 const html=plannerApp();
 assert.match(html,/本週為強制休養週/);
 assert.equal((html.match(/disabled/g)||[]).length,7);
 assert.match(html,/行程不可修改/);
});

test("創作工作室具有完整建立、流程與作品區塊",()=>{
 resetState();
 const html=creativeApp();
 assert.match(html,/把靈感做成真正的作品/);
 assert.match(html,/01 靈感草稿/);
 assert.match(html,/歌曲 Demo/);
 assert.match(html,/影視劇本/);
 assert.match(html,/節目企劃/);
 assert.match(html,/桌上還沒有任何企劃/);
});

test("原創企劃名稱在畫面重繪後仍保留",()=>{
 resetState();state.creativeDraftTitle="雨後的第二幕";
 assert.match(creativeApp(),/value="雨後的第二幕"/);
});

test("八種隱藏特質都會由劇情效果實際改變，第二特質也不遺失",()=>{
 resetState();const traits=["幽默","共情","洞察","膽識","品德","自律","野心","抗壓"];
 state.hidden=Object.fromEntries(traits.map(name=>[name,500]));
 applyEffects(traits.map(name=>({hidden:name,value:2})),"劇情測試");
 for(const name of traits)assert.equal(state.hidden[name],502,`${name} should change`);
 applyEffects({hidden:"野心",value:3,hidden2:"自律",value2:4},"雙特質劇情");
 assert.equal(state.hidden.野心,505);assert.equal(state.hidden.自律,506);
});

test("實際行程、地點與年度劇情資料涵蓋全部八種隱藏特質",()=>{
 const effects=[...Object.values(SCHEDULE_EVENTS).flat(),...Object.values(LOCATION_EVENTS).flat(),...CALENDAR_EVENTS.flatMap(event=>[event,...(event.choices||[])])].map(item=>item.effect).filter(Boolean);
 const covered=new Set(effects.flatMap(effect=>[effect.hidden===true?effect.stat:effect.hidden,effect.hidden2]).filter(Boolean));
 for(const name of["幽默","共情","洞察","膽識","品德","自律","野心","抗壓"])assert.ok(covered.has(name),`${name} needs a real story source`);
});

test("品牌後台顯示合作狀態而不是不存在的 score 造成全為 0",()=>{
 resetState();const fresh=brandRelation("晨露飲品");assert.equal(fresh.score,"未合作");
 recordBrandOutcome("晨露飲品","completed",{quality:90});
 assert.match(state.brandRelations["晨露飲品"].score,/1 次・信任/);
 const html=worldApp();assert.match(html,/晨露飲品/);assert.doesNotMatch(html,/晨露飲品 <b>0<\/b>/);
});

test("經紀公司頁明確說明簽約準備度成長方式",()=>{
 resetState();
 const html=agencyApp();
 assert.match(html,/簽約準備度怎麼增加/);
 assert.match(html,/未簽約時完成每週任務/);
 assert.match(html,/公開試鏡或街頭演出/);
});

test("初次遇見 NPC 會顯示完整相遇劇情並保存來源",()=>{
 resetState();
 const result=meetNpc("lujingran","在月蝕 Live House 建立第一次印象。");
 assert.equal(result.met,true);
 assert.match(result.title,/江敘白.*還沒關掉的麥克風/);
 assert.match(result.text,/旋律不錯/);
 assert.equal(result.portrait,"./assets/portraits/lujingran.webp");
 assert.deepEqual(npcFirstMeeting("lujingran"),{
  week:1,
  source:"在月蝕 Live House 建立第一次印象。",
  title:"還沒關掉的麥克風",
  text:state.relationships.lujingran.firstMeetingText
 });
});

test("探索相遇會把人物立繪交給逐日劇情，人物檔案也顯示初遇章節",()=>{
 resetState();
 const result=resolveExploration("livehouse","explore");
 assert.equal(result.encounter?.met,true);
 assert.ok(result.encounter?.portrait);
 state.selectedNpc=result.encounter.npcId;
 const html=npcApp();
 assert.match(html,/FIRST ENCOUNTER/);
 assert.match(html,/初次|麥克風|練習室|候補|照片|履歷|鏡頭|對戲/);
 assert.match(html,/npc-first-meeting/);
});

test("第一次與通告共演 NPC 合作會回傳正式初遇劇情，不會靜默加入人際",()=>{
 resetState();
 const result=applyJobNpcRelations({title:"夏日試拍"},{npcCast:["jiqing"]});
 assert.equal(result.encounters.length,1);
 assert.match(result.encounters[0].title,/夏日試拍/);
 assert.match(result.encounters[0].text,/第一次開工|工作人員/);
 assert.ok(state.knownPeople.includes("jiqing"));
 const repeated=applyJobNpcRelations({title:"夏日試拍"},{npcCast:["jiqing"]});
 assert.equal(repeated.encounters.length,0);
});

test("本週策略會顯示精確作用，而且曝光與人脈都有真實數值效果",()=>{
 resetState();
 state.focus="fame";
 const planner=plannerApp();
 assert.match(planner,/成功率 \+5%・知名度 \+2/);
 const fameChance=auditionChance(JOB_BY_ID.J001,"steady");
 state.focus="growth";
 const normalChance=auditionChance(JOB_BY_ID.J001,"steady");
 assert.equal(fameChance,normalChance+5);
 state.focus="people";
 meetNpc("lujingran");
 assert.equal(state.relationships.lujingran.closeness,10);
 assert.equal(state.relationships.lujingran.trust,11);
});

test("產業自由活動會進入現場徵選看板，而不是只跑一般行程",async()=>{
 resetState();
 state.schedule[0]="free";
 state.freeLocations[0]="tv_company";
 state.runnerDay=0;
 globalThis.document={querySelector:()=>({})};
 const{decisionFor}=await import("../src/logic/runner.js");
 const decision=decisionFor("free");
 assert.ok(decision.choices.some(choice=>choice.id==="browse_jobs"));
 const result=resolveExploration("tv_company","browse_jobs");
 assert.equal(result.venue.company.name,"星曜電視台");
 assert.ok(result.venue.jobs.length>0);
 state.runnerResult={title:"星曜電視台・Casting Desk",text:result.text,success:true,venue:result.venue};
 const html=resultView();
 assert.match(html,/ON-SITE CASTING DESK/);
 assert.match(html,/現場公開徵選/);
 assert.match(html,/data-venue-apply/);
 assert.match(html,/現場看板會停留/);
});
