import test from"node:test";
import assert from"node:assert/strict";
import{state,resetState}from"../src/core/state.js";
import{eventView}from"../src/views/event.js";
import{resolveEvent}from"../src/logic/event-engine.js";

test("劇情事件使用完整卡片層級並保留選擇與稍後處理",()=>{
 resetState();
 state.week=8;
 state.activeEvent={event:{kind:"職涯事件",title:"導演多看了一眼",text:"收工前，導演把你叫住。",choices:[{id:"ask",label:"追問下一檔期",note:"主動爭取"}]}};
 const html=eventView();
 for(const text of["narrative-event-screen","CAREER STORY","WEEK 8","導演多看了一眼","稍後再處理"])assert.match(html,new RegExp(text));
 assert.match(html,/data-event-choice="ask"/);
});

test("事件選擇後會先顯示結果、數值影響與後續提示",()=>{
 resetState();
 const event={id:"result-demo",kind:"職涯事件",title:"臨時加戲",text:"導演遞來新的台詞。",choices:[{id:"accept",label:"接下這場戲",outcome:"你的臨場表現被劇組記住了。",effects:[{fame:3}]}],followUp:{delayWeeks:2,event:{id:"later",title:"新的邀請"}}};
 state.eventOutcome=resolveEvent(event,"accept");
 const html=eventView();
 assert.match(html,/EVENT RESULT/);
 assert.match(html,/接下這場戲/);
 assert.match(html,/你的臨場表現被劇組記住了/);
 assert.match(html,/知名度＋3/);
 assert.match(html,/這段故事尚未結束/);
 assert.match(html,/確認結果・回到房間/);
});
