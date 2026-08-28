import{state}from"../core/state.js";
import{money,effectiveStat}from"../core/utils.js";
import{adjustRelationship,meetNpc}from"./npc-engine.js";

export const EVENT_KINDS=Object.freeze({INSTANT:"即時事件",CHOICE:"選擇事件",DELAYED:"延遲事件",CHAIN:"連鎖事件",NPC:"人物事件",CAREER:"職涯事件",PUBLIC:"輿論事件"});

export function classifyEvent(event){
 if(event.kind)return event.kind;
 if(event.choices?.length)return EVENT_KINDS.CHOICE;
 if(event.effect?.npc)return EVENT_KINDS.NPC;
 if(event.effect?.delayWeeks||event.followUp)return EVENT_KINDS.DELAYED;
 if(event.effect?.flag||event.requires?.flags)return EVENT_KINDS.CHAIN;
 if(event.effect?.rep||event.effect?.fame||event.effect?.fans)return EVENT_KINDS.PUBLIC;
 if(event.effect?.work||event.effect?.award)return EVENT_KINDS.CAREER;
 return EVENT_KINDS.INSTANT;
}

export function matchesConditions(conditions={},game=state){
 if(conditions.weekMin&&game.week<conditions.weekMin)return false;
 if(conditions.weekMax&&game.week>conditions.weekMax)return false;
 if(conditions.knownNpc&&!game.knownPeople.includes(conditions.knownNpc))return false;
 if(conditions.unknownNpc&&game.knownPeople.includes(conditions.unknownNpc))return false;
 if(conditions.flags&&!conditions.flags.every(flag=>game.eventFlags.includes(flag)))return false;
 if(conditions.notFlags?.some(flag=>game.eventFlags.includes(flag)))return false;
 if(conditions.stats&&Object.entries(conditions.stats).some(([name,min])=>effectiveStat(name)<min))return false;
 if(conditions.rep&&Object.entries(conditions.rep).some(([name,min])=>(game.rep[name]||0)<min))return false;
 return true;
}

export function eligibleEvents(pool,game=state){return(pool||[]).filter(event=>matchesConditions(event.requires||{},game))}

export function applyEffects(effect={},source="事件"){
 const out=[];
 if(effect.hidden){const name=effect.stat||effect.hidden,value=effect.value||1;state.hidden[name]=Math.min(1000,(state.hidden[name]||500)+value);out.push(`${name}獲得成長`)}
 else if(effect.rep){const name=effect.stat||effect.rep,value=effect.value||1;state.rep[name]=Math.max(0,Math.min(1000,(state.rep[name]||0)+value));out.push(`${name}${value>=0?"＋":""}${value}`)}
 else if(effect.stat){const value=effect.value||1;state.stats[effect.stat]=Math.max(0,Math.min(1000,(state.stats[effect.stat]||0)+value));out.push(`${effect.stat}${value>=0?"＋":""}${value}`)}
 for(const key of["mood","fatigue","money","fame","fans","contract"]){if(effect[key]==null)continue;const value=effect[key];if(key==="mood")state.mood=Math.max(0,Math.min(100,state.mood+value));else if(key==="fatigue")state.fatigue=Math.max(0,state.fatigue+value);else if(key==="contract")state.contract=Math.max(0,Math.min(100,state.contract+value));else state[key]=Math.max(0,(state[key]||0)+value);const label={mood:"心情",fatigue:"疲勞",money:"金錢",fame:"知名度",fans:"粉絲",contract:"簽約準備度"}[key];out.push(`${label}${value>=0?"＋":""}${key==="money"?money(value):value}${key==="contract"?"%":""}`)}
 if(effect.flag&&!state.eventFlags.includes(effect.flag)){state.eventFlags.push(effect.flag);out.push(`解鎖「${effect.flag}」`)}
 if(effect.npc){const met=meetNpc(effect.npc,source);if(met.text)out.push(met.text);const rel=adjustRelationship(effect.npc,{closeness:effect.relation||2,trust:effect.trust||0,source});if(rel.text&&!met.met)out.push(rel.text)}
 return out;
}

export function resolveEvent(event,choiceId=null){
 if(!event||!matchesConditions(event.requires||{}))return null;
 const choice=event.choices?.find(item=>item.id===choiceId),effect=choice?.effect||event.effect||{};
 const effects=applyEffects(effect,event.title||"事件");
 const record={id:event.id||null,week:state.week,kind:classifyEvent(event),title:event.title,choice:choiceId,outcome:choice?.outcome||event.outcome,effects};
 state.eventHistory.push(record);
 if(event.followUp){const delay=event.effect?.delayWeeks||event.followUp.delayWeeks||1;state.queuedEvents.push({dueWeek:state.week+delay,event:event.followUp.event||event.followUp,source:event.title})}
 return{...record,text:event.text};
}

export function processQueuedEvents(){const due=state.queuedEvents.filter(item=>item.dueWeek<=state.week),future=state.queuedEvents.filter(item=>item.dueWeek>state.week);state.queuedEvents=future;return due.map(item=>resolveEvent(item.event)).filter(Boolean)}
