import{LOCATION_EVENTS}from"../data/location-events.js";
import{SCHEDULE_EVENTS}from"../data/schedule-events.js";
import{state}from"../core/state.js";
import{random}from"../core/utils.js";
import{applyEffects,classifyEvent,eligibleEvents}from"./event-engine.js";

import { trainingLessonMoment } from "./training-narrative.js";
import { routineWasRead } from "./narrative-preferences.js";

function choose(kind,key,pool){
 if(!pool?.length)return null;
 const historyKey=`${kind}:${key}`,last=state.randomEventHistory?.[historyKey];
 // Keep the old numeric last index for pending events and existing saves. The
 // companion cycle tracks titles so changing location eligibility cannot make
 // a different event inherit an already-seen index.
 const cycleKey=`${historyKey}:seen`,previous=state.randomEventHistory?.[cycleKey];
 let seen=Array.isArray(previous)?previous.filter(title=>pool.some(event=>event.title===title)):[];
 const entries=pool.map((event,index)=>({event,index}));
 let candidates=entries.filter(item=>!seen.includes(item.event.title));
 if(!candidates.length){
  const lastTitle=seen.at(-1);
  seen=[];
  candidates=entries.filter(item=>pool.length===1||item.event.title!==lastTitle);
 }
 // A pre-expansion save knows only its last index. Avoid that event while the
 // new cycle is being established, without excluding it forever.
 if(!previous&&candidates.length>1)candidates=candidates.filter(item=>item.index!==last);
 const picked=candidates[random(0,candidates.length-1)];
 state.randomEventHistory??={};state.randomEventHistory[historyKey]=picked.index;
 state.randomEventHistory[cycleKey]=[...seen,picked.event.title].slice(-pool.length);
 return picked.event;
}

function applyMoment(event){
 const readBefore=routineWasRead(event,state);
 const effects=applyEffects(event.effect,event.title);
 const moment={kind:classifyEvent(event),title:event.title,text:event.text,outcome:event.outcome,effects,routine:true,readBefore,important:!!event.important||!!event.effect?.npc,hasChoices:!!event.choices?.length,followUp:!!event.followUp};
 // Optional fields must survive a JSON save/load without changing the record.
 if(event.id!==undefined)moment.id=event.id;
 if(event.training!==undefined)moment.training=event.training;
 state.eventHistory.push({week:state.week,...moment});
 return moment;
}

function renderEvent(event){
 if(!event)return "";
 const effects=event.effects;
 return`<aside class="random-story"><span>${event.kind}</span><h3>${event.title}</h3><p>${event.text}</p><strong>${event.outcome}</strong>${effects.length?`<small>${effects.join("・")}</small>`:""}</aside>`;
}

export function prepareScheduleEvent(actionId){
 const event=choose("schedule",actionId,SCHEDULE_EVENTS[actionId]);
 state.pendingRandomEvent=event?{kind:"schedule",key:actionId,index:state.randomEventHistory[`schedule:${actionId}`]}:null;
}

export function resolveScheduleMoment(actionId){
 const pending=state.pendingRandomEvent;
 let event=pending?.kind==="schedule"&&pending.key===actionId?SCHEDULE_EVENTS[actionId]?.[pending.index]:null;
 if(!event)event=choose("schedule",actionId,SCHEDULE_EVENTS[actionId]);
 state.pendingRandomEvent=null;
 return event?applyMoment(trainingLessonMoment(actionId,event)):null;
}

export function resolveLocationMoment(locationId,choice){
 const all=eligibleEvents(LOCATION_EVENTS[locationId]||[]);
 // 「專注體驗」不會讓尚未認識的 NPC 無預警闖入；主動探索才可能觸發初遇。
 const pool=choice==="explore"?all:all.filter(event=>!event.effect?.npc||state.knownPeople.includes(event.effect.npc));
 const event=choose("location",locationId,pool.length?pool:all.filter(event=>!event.effect?.npc));
 return event?applyMoment(event):null;
}

export function resolveScheduleEvent(actionId){return renderEvent(resolveScheduleMoment(actionId));}
export function resolveLocationEvent(locationId,choice){return renderEvent(resolveLocationMoment(locationId,choice));}
