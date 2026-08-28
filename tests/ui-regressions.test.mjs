import test from"node:test";
import assert from"node:assert/strict";
import{resetState,state}from"../src/core/state.js";
import{enqueueVisibleEvent,activateNextEvent,dismissActiveEvent}from"../src/logic/event-engine.js";
import{scheduleActivity}from"../src/logic/scheduled-activities.js";
import{socialApp}from"../src/views/social.js";
import{creativeApp}from"../src/views/creative.js";
import{plannerApp}from"../src/views/planner.js";
import{agencyApp}from"../src/views/agency.js";

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

test("經紀公司頁明確說明簽約準備度成長方式",()=>{
 resetState();
 const html=agencyApp();
 assert.match(html,/簽約準備度怎麼增加/);
 assert.match(html,/未簽約時完成每週任務/);
 assert.match(html,/公開試鏡或街頭演出/);
});
