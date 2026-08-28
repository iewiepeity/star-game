import{LOCATION_EVENTS}from"../data/location-events.js";
import{SCHEDULE_EVENTS}from"../data/schedule-events.js";
import{state}from"../core/state.js";
import{random}from"../core/utils.js";
import{applyEffects,classifyEvent,eligibleEvents}from"./event-engine.js";

function choose(kind,key,pool){
 if(!pool?.length)return null;
 const historyKey=`${kind}:${key}`,last=state.randomEventHistory?.[historyKey];
 const candidates=pool.map((event,index)=>({event,index})).filter(item=>pool.length===1||item.index!==last);
 const picked=candidates[random(0,candidates.length-1)];
 state.randomEventHistory??={};state.randomEventHistory[historyKey]=picked.index;
 return picked.event;
}

function renderEvent(event){
 const effects=applyEffects(event.effect,event.title);
 state.eventHistory.push({week:state.week,kind:classifyEvent(event),title:event.title,outcome:event.outcome,effects});
 return`<aside class="random-story"><span>${classifyEvent(event)}</span><h3>${event.title}</h3><p>${event.text}</p><strong>${event.outcome}</strong>${effects.length?`<small>${effects.join("・")}</small>`:""}</aside>`;
}

export function prepareScheduleEvent(actionId){
 const event=choose("schedule",actionId,SCHEDULE_EVENTS[actionId]);
 state.pendingRandomEvent=event?{kind:"schedule",key:actionId,index:state.randomEventHistory[`schedule:${actionId}`]}:null;
}

export function resolveScheduleEvent(actionId){
 const pending=state.pendingRandomEvent;
 let event=pending?.kind==="schedule"&&pending.key===actionId?SCHEDULE_EVENTS[actionId]?.[pending.index]:null;
 if(!event)event=choose("schedule",actionId,SCHEDULE_EVENTS[actionId]);
 state.pendingRandomEvent=null;
 return event?renderEvent(event):"";
}

export function resolveLocationEvent(locationId,choice){
 const all=eligibleEvents(LOCATION_EVENTS[locationId]||[]);
 // 「專注體驗」不會讓尚未認識的 NPC 無預警闖入；主動探索才可能觸發初遇。
 const pool=choice==="explore"?all:all.filter(event=>!event.effect?.npc||state.knownPeople.includes(event.effect.npc));
 const event=choose("location",locationId,pool.length?pool:all.filter(event=>!event.effect?.npc));
 return event?renderEvent(event):"";
}
