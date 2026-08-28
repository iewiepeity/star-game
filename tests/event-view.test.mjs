import test from"node:test";
import assert from"node:assert/strict";
import{state,resetState}from"../src/core/state.js";
import{eventView}from"../src/views/event.js";

test("劇情事件使用完整卡片層級並保留選擇與稍後處理",()=>{
 resetState();
 state.week=8;
 state.activeEvent={event:{kind:"職涯事件",title:"導演多看了一眼",text:"收工前，導演把你叫住。",choices:[{id:"ask",label:"追問下一檔期",note:"主動爭取"}]}};
 const html=eventView();
 for(const text of["narrative-event-screen","CAREER STORY","WEEK 8","導演多看了一眼","稍後再處理"])assert.match(html,new RegExp(text));
 assert.match(html,/data-event-choice="ask"/);
});
