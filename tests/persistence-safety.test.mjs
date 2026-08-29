import test from"node:test";
import assert from"node:assert/strict";
import{state,resetState}from"../src/core/state.js";
import{CALENDAR_EVENTS}from"../src/data/calendar-events.js";
import{LIFE_EVENTS}from"../src/data/life-events.js";
import{resolveEvent}from"../src/logic/event-engine.js";

test("自動存檔合併同一畫面重繪，關鍵進度則立即落盤",async()=>{
 const store=new Map,writes=[];
 globalThis.localStorage={getItem:key=>store.get(key)||null,setItem:(key,value)=>{store.set(key,value);writes.push(key)},removeItem:key=>store.delete(key)};
 const persistence=await import(`../src/core/persistence.js?autosave=${Date.now()}`);
 resetState();
 persistence.scheduleSaveState(state,{delay:20});
 persistence.scheduleSaveState(state,{delay:20});
 persistence.scheduleSaveState(state,{delay:20});
 await new Promise(resolve=>setTimeout(resolve,45));
 assert.equal(writes.filter(key=>key==="star-game-save").length,2);
 state.week=2;
 persistence.scheduleSaveState(state,{delay:20});
 assert.equal(writes.filter(key=>key==="star-game-save").length,3);
 assert.equal(JSON.parse(store.get("star-game-save")).state.week,2);
 assert.equal(persistence.backupLastAutoSave(),true);
 assert.equal(JSON.parse(store.get("star-game-save-backup")).state.week,2);
});

test("複合事件效果不再因重複 value 欄位互相覆蓋",()=>{
 resetState();state.stats.社交=100;state.rep.業界評價=100;
 const calendar=CALENDAR_EVENTS.find(event=>event.id==="spring_festival");
 resolveEvent(calendar,"network");
 assert.equal(state.stats.社交,102);assert.equal(state.rep.業界評價,102);
 const training=LIFE_EVENTS.train.find(event=>event.id==="train_peer");
 state.stats.學習=100;state.hidden.自律=500;
 resolveEvent(training,"ask");
 assert.equal(state.stats.學習,103);assert.equal(state.hidden.自律,501);
});
