import { titleTag } from "../core/utils.js";
import{state}from"../core/state.js";
import{FOCUSES}from"../data/focuses.js";
import{NPCS}from"../data/npcs.js";

const METRICS=[
 ["money","金錢"],["fame","知名度"],["fans","粉絲"],["fatigue","疲勞"],
 ["stamina","體力"],["mood","心情"],["health","健康"],["contract","簽約準備度"]
];

function relationshipSnapshot(){
 return Object.fromEntries(Object.entries(state.relationships||{}).map(([id,rel])=>[id,{closeness:rel.closeness||0,trust:rel.trust||0,affection:rel.affection||0,hostility:rel.hostility||0,romance:rel.romance||"none"}]));
}

export function captureWeekStart(){
 state.weekStartSnapshot={
  week:state.week,
  metrics:Object.fromEntries(METRICS.map(([key])=>[key,state[key]||0])),
  stats:{...state.stats},rep:{...state.rep},relationships:relationshipSnapshot(),
  flagCount:state.flags.length,eventCount:state.eventHistory.length,workCount:state.completedWorks.length,
  awardCount:state.awards.length,focus:state.focus
 };
 return state.weekStartSnapshot;
}

function numericChanges(before,current,labels){
 return Object.entries(labels).map(([key,label])=>({key,label,value:(current[key]||0)-(before[key]||0)})).filter(item=>item.value!==0);
}

function relationshipChanges(before={}){
 const changes=[];
 for(const[id,rel]of Object.entries(state.relationships||{})){
  const old=before[id]||{},npc=NPCS[id];
  if(!npc)continue;
  const closeness=(rel.closeness||0)-(old.closeness||0),trust=(rel.trust||0)-(old.trust||0),hostility=(rel.hostility||0)-(old.hostility||0);
  if(closeness||trust||hostility||old.romance&&old.romance!==rel.romance)changes.push({id,name:npc.name,closeness,trust,hostility,romanceFrom:old.romance||"none",romanceTo:rel.romance||"none"});
 }
 return changes;
}

export function finalizeWeekMemory({hospitalized=false}={}){
 const start=state.weekStartSnapshot?.week===state.week?state.weekStartSnapshot:{metrics:{},stats:{},rep:{},relationships:{},flagCount:state.flags.length,eventCount:state.eventHistory.length,workCount:state.completedWorks.length,awardCount:state.awards.length,focus:state.focus};
 const metricLabels=Object.fromEntries(METRICS.map(([key,label])=>[key,label]));
 const metrics=numericChanges(start.metrics||{},state,metricLabels);
 const stats=numericChanges(start.stats||{},state.stats||{},Object.fromEntries(Object.keys(state.stats||{}).map(key=>[key,key]))).sort((a,b)=>Math.abs(b.value)-Math.abs(a.value));
 const reputation=numericChanges(start.rep||{},state.rep||{},Object.fromEntries(Object.keys(state.rep||{}).map(key=>[key,key]))).sort((a,b)=>Math.abs(b.value)-Math.abs(a.value));
 const memory={
  week:state.week,hospitalized,focus:start.focus||state.focus,focusLabel:FOCUSES[start.focus||state.focus]?.label||"穩定發展",
  metrics,stats,reputation,relationships:relationshipChanges(start.relationships),
  newFlags:state.flags.slice(start.flagCount||0),newEvents:state.eventHistory.slice(start.eventCount||0),
  newWorks:state.completedWorks.slice(start.workCount||0),newAwards:state.awards.slice(start.awardCount||0)
 };
 memory.headline=hospitalized?"身體替這週按下暫停":memory.newWorks.length?`${titleTag(memory.newWorks.at(-1).title)}成為履歷新頁`:memory.relationships.length?`和${memory.relationships[0].name}的關係有了變化`:memory.newEvents.length?memory.newEvents.at(-1).title:`以「${memory.focusLabel}」走完這一週`;
 state.careerMemories??=[];
 const index=state.careerMemories.findIndex(item=>item.week===state.week);
 if(index>=0)state.careerMemories[index]=memory;else state.careerMemories.push(memory);
 state.weekStartSnapshot=null;
 return memory;
}

export function memoryForWeek(week=state.week){return(state.careerMemories||[]).find(item=>item.week===week)||null}

