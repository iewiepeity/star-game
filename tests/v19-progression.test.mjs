import test from"node:test";
import assert from"node:assert/strict";
import{resetState,state}from"../src/core/state.js";
import{ACHIEVEMENTS}from"../src/data/achievements.js";
import{ENDING_ARCHETYPES}from"../src/logic/career.js";
import{HIDDEN_ROUTE_CHAPTERS,queueHiddenRoute}from"../src/logic/hidden-route.js";
import{availableChoices}from"../src/logic/event-engine.js";
import{queueCareerPhaseEvent}from"../src/logic/career-phases.js";
import{queueNpcStoryEvents}from"../src/logic/npc-storylines.js";

test("成就擴充到 81 項且涵蓋每一種結局原型",()=>{
 assert.equal(ACHIEVEMENTS.length,81);
 assert.equal(new Set(ACHIEVEMENTS.map(x=>x.id)).size,81);
 const ids=new Set(ACHIEVEMENTS.map(x=>x.id));
 for(const ending of ENDING_ARCHETYPES)assert.ok(ids.has(`ending_${ending.id}`),ending.id);
});

test("二周目隱藏線有八章且第三稿只在條件成立時出現",()=>{
 assert.equal(HIDDEN_ROUTE_CHAPTERS.length,8);
 assert.equal(new Set(HIDDEN_ROUTE_CHAPTERS.map(x=>x.id)).size,8);
 resetState();state.runCount=2;state.week=9;state.familiarNpcs=["a","b","c"];
 assert.equal(queueHiddenRoute(),"silver-route-encounter");
 const choiceEvent=HIDDEN_ROUTE_CHAPTERS.find(x=>x.id==="choice");
 state.hidden.洞察=619;assert.equal(availableChoices(choiceEvent).some(x=>x.id==="rewrite"),false);
 state.hidden.洞察=620;assert.equal(availableChoices(choiceEvent).some(x=>x.id==="rewrite"),true);
});

test("五年終章的完整人生選項必須由能力與作品共同解鎖",()=>{
 resetState();state.week=209;queueCareerPhaseEvent();
 const event=state.eventQueue[0].event;
 assert.equal(event.id,"career-phase-5");
 assert.equal(availableChoices(event).some(x=>x.id==="integrated"),false);
 state.hidden.洞察=600;state.hidden.共情=600;state.completedWorks=Array.from({length:10},(_,i)=>({jobId:`T${i}`}));
 assert.equal(availableChoices(event).some(x=>x.id==="integrated"),true);
});

test("深厚戀情會解鎖非典型求婚選項",()=>{
 resetState();state.week=100;state.knownPeople=["lujingran"];state.hidden.共情=600;
 state.relationships.lujingran={closeness:90,trust:85,affection:92,hostility:0,romance:"committed",romanceSinceWeek:1,romanceHistory:[],events:[]};
 state.npcStoryHistory=["lujingran:stage:bonded"];
 queueNpcStoryEvents();
 const queued=[...state.eventQueue.map(x=>x.event),...state.queuedEvents.map(x=>x.event)];
 const event=queued.find(x=>x.id?.includes(":romance:committed:"));
 assert.ok(event);
 assert.equal(availableChoices(event).length,3);
 assert.ok(availableChoices(event).find(x=>x.id==="build-together")?.special);
});
