import test from "node:test";
import assert from "node:assert/strict";
import { state, resetState } from "../src/core/state.js";
import { NPC_LONGFORM_CHAPTERS } from "../src/data/longform-content.js";
import { applyEffects, activateNextEvent, resolveEvent } from "../src/logic/event-engine.js";
import { applyCareerDoctrineTick } from "../src/logic/career-phases.js";
import { tickNpcInvitation, tickEnsembleScene } from "../src/logic/lived-story-engine.js";
import { timelineApp } from "../src/views/timeline.js";

function known(ids=["jiqing","shenyao","tangtang","guchengxi","linxiafan","lujingran","xiayutong","sufei","chengyian","hanzhiyuan"]){
 resetState();state.knownPeople=[...ids];
 for(const id of ids)state.relationships[id]={closeness:60,trust:60,affection:40,hostility:0,romance:"none",visibility:"private",romanceHistory:[],affectionHistory:[],hostilityHistory:[]};
}

test("五十個跨年人物章節都是多幕場景且兩條選擇各自有延遲後續",()=>{
 for(const chapter of Object.values(NPC_LONGFORM_CHAPTERS).flat()){
  assert.ok(chapter.beats.length>=3);assert.equal(chapter.choices.length,2);
  assert.ok(chapter.choices.every(choice=>choice.note&&choice.followUp?.delayWeeks&&choice.followUp.text));
 }
});

test("NPC 會主動邀約，玩家可改期且承諾會在兩週後回收",()=>{
 known();state.week=18;assert.ok(tickNpcInvitation());activateNextEvent();
 const event=state.activeEvent.event,npcId=event.cast[0];assert.equal(event.beats.length,3);
 const result=resolveEvent(event,"reschedule");assert.equal(result.hasFollowUp,true);
 assert.equal(state.npcInvitationHistory.at(-1).response,"reschedule");
 assert.ok(state.queuedEvents.some(item=>item.dueWeek===20));assert.equal(state.relationships[npcId].trust,62);
});

test("雙 NPC 場景會讓站隊對兩段關係產生相反後果",()=>{
 known();state.week=39;assert.ok(tickEnsembleScene());activateNextEvent();
 const event=state.activeEvent.event,[a,b]=event.cast;resolveEvent(event,"side-a");
 assert.ok(state.relationships[a].trust>60);assert.ok(state.relationships[b].trust<60);
 assert.equal(state.ensembleEventHistory.at(-1).choice,"side-a");
});

test("第三至第五年永久方針會保存在歷史並持續改變資源",()=>{
 known([]);state.week=157;applyEffects({doctrineKey:"year4",doctrineValue:"sustainable",doctrineLabel:"可持續職涯"},"年度章節");state.fatigue=40;state.health=80;applyCareerDoctrineTick();
 assert.equal(state.careerDoctrine.year4.id,"sustainable");assert.equal(state.majorDecisionHistory.length,1);assert.equal(state.fatigue,38);assert.equal(state.health,81);
});

test("統一時間線會同時顯示人物、作品與永久選擇",()=>{
 known(["jiqing"]);state.npcMessages.push({id:"m",npcId:"jiqing",week:4,text:"到家跟我說。",read:false});state.completedWorks.push({id:"w",title:"試播集",category:"電視劇",completedWeek:3});state.majorDecisionHistory.push({week:2,year:1,label:"守住作品"});
 const html=timelineApp();assert.match(html,/喬映澄/);assert.match(html,/試播集/);assert.match(html,/守住作品/);
});
