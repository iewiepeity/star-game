import{LOCATION_EVENTS}from"../data/location-events.js";
import{SCHEDULE_EVENTS}from"../data/schedule-events.js";
import{NPCS}from"../data/npcs.js";
import{state}from"../core/state.js";
import{random,money}from"../core/utils.js";

function choose(kind,key,pool){
 if(!pool?.length)return null;
 const historyKey=`${kind}:${key}`,last=state.randomEventHistory?.[historyKey];
 const candidates=pool.map((event,index)=>({event,index})).filter(item=>pool.length===1||item.index!==last);
 const picked=candidates[random(0,candidates.length-1)];
 state.randomEventHistory??={};state.randomEventHistory[historyKey]=picked.index;
 return picked.event;
}

function meetOrAdvanceNpc(id){
 if(!id||!NPCS[id])return"";
 const npc=NPCS[id],known=state.knownPeople.includes(id);
 if(known){
  const rel=state.relationships[id]||(state.relationships[id]={closeness:0,trust:0,romance:"none"});
  rel.closeness=Math.min(100,rel.closeness+2);
  return`與<b>${npc.name}</b>的好感＋2`;
 }
 const familiar=state.familiarNpcs.includes(id),closeness=familiar?18:8,trust=familiar?20:10;
 state.knownPeople.push(id);state.selectedNpc=id;state.relationships[id]={closeness,trust,romance:"none"};
 state.flags.push({week:state.week,label:`第一次認識${npc.name}`,note:familiar?"彼此有種說不上來的熟悉，很快就聊開了。":"在一次偶然事件中建立了第一印象。"});
 return familiar?`第一次正式認識<b>${npc.name}</b>，彼此都覺得似曾相識`:`第一次認識了<b>${npc.name}</b>`;
}

function applyEffect(effect={}){
 const out=[];
 if(effect.hidden){
  const name=effect.stat||effect.hidden,value=effect.value||1;
  state.hidden[name]=Math.min(1000,(state.hidden[name]||500)+value);out.push(`${name}獲得成長`);
 }else if(effect.rep){
  const name=effect.stat||effect.rep,value=effect.value||1;
  state.rep[name]=Math.min(1000,(state.rep[name]||0)+value);out.push(`${name}＋${value}`);
 }else if(effect.stat){
  const value=effect.value||1;state.stats[effect.stat]=Math.min(1000,(state.stats[effect.stat]||0)+value);out.push(`${effect.stat}＋${value}`);
 }
 if(effect.mood){state.mood=Math.max(0,Math.min(100,state.mood+effect.mood));out.push(`心情${effect.mood>0?"＋":""}${effect.mood}`)}
 if(effect.fatigue){state.fatigue=Math.max(0,state.fatigue+effect.fatigue);out.push(`疲勞${effect.fatigue>0?"＋":""}${effect.fatigue}`)}
 if(effect.money){state.money+=effect.money;out.push(`金錢＋${money(effect.money)}`)}
 if(effect.fame){state.fame=Math.max(0,state.fame+effect.fame);out.push(`知名度＋${effect.fame}`)}
 if(effect.fans){state.fans=Math.max(0,state.fans+effect.fans);out.push(`粉絲＋${effect.fans}`)}
 if(effect.contract){state.contract=Math.min(100,state.contract+effect.contract);out.push(`簽約準備度＋${effect.contract}%`)}
 if(effect.npc){const relation=meetOrAdvanceNpc(effect.npc);if(relation)out.push(relation)}
 return out;
}

function renderEvent(event){
 const effects=applyEffect(event.effect);
 return`<aside class="random-story"><span>今日插曲</span><h3>${event.title}</h3><p>${event.text}</p><strong>${event.outcome}</strong>${effects.length?`<small>${effects.join("・")}</small>`:""}</aside>`;
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
 const all=LOCATION_EVENTS[locationId]||[];
 // 「專注體驗」不會讓尚未認識的 NPC 無預警闖入；主動探索才可能觸發初遇。
 const pool=choice==="explore"?all:all.filter(event=>!event.effect?.npc||state.knownPeople.includes(event.effect.npc));
 const event=choose("location",locationId,pool.length?pool:all.filter(event=>!event.effect?.npc));
 return event?renderEvent(event):"";
}
