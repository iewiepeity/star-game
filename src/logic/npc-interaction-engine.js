import{state}from"../core/state.js";
import{NPCS}from"../data/npcs.js";
import{NPC_INTERACTION_EVENTS}from"../data/npc-interaction-events.js";
import { NPC_EVERYDAY_SCENES } from "../data/npc-everyday-scenes.js";
import{interactWithNpc}from"./npc-ecosystem.js";
import { noteCharacterInteraction, recordCharacterMemory } from "./character-memory.js";

const genericEffects={chat:{closeness:3,trust:2},meal:{closeness:4,trust:2},support:{closeness:4,trust:5},collaborate:{closeness:3,trust:6},personal:{closeness:5,trust:4,affection:2},date:{closeness:5,trust:4,affection:5},reconcile:{closeness:1,trust:3,hostility:-12}};
function genericEvent(id,type){const npc=NPCS[id],effect=genericEffects[type];if(!npc||!effect)return null;return{id:`${id}-${type}-open-scene`,title:`${npc.name}｜沒有寫在行程表上的時間`,text:`你和${npc.name}找了個不被打擾的角落。對方先聊起最近的工作，停了一下，又問起你這一週過得怎麼樣。`,choices:[{id:"listen",label:"先聽對方說完",note:"尊重現在的步調",outcome:"這段關係沒有被命運快速帶過，而是留下了新的共同記憶。",effect},{id:"honest",label:"也坦白自己的感受",note:"讓對方重新認識現在的你",outcome:"對方沒有急著下結論，而是也說起一件最近放在心上的事。",effect:{...effect,trust:(effect.trust||0)+1}}]}}
function eventFor(task) {
 const id = task?.payload?.npcId, type = task?.payload?.type;
 const first = NPC_INTERACTION_EVENTS[id]?.[type] || genericEvent(id, type);
 if (!first) return null;
 const pool = [first, ...(NPC_EVERYDAY_SCENES[id]?.[type] || [])];
 // Pin the chosen encounter to the scheduled task. Reopening a decision or
 // loading its save must resolve the same text and choices, even after a tick.
 const pinned = pool.find(event => event.id === task?.payload?.interactionEventId);
 if (pinned) return pinned;
 const saved = state.npcInteractionEventHistory?.[`${id}:${type}`];
 const history = Array.isArray(saved) ? saved : [];
 const event = pool.find(event => !history.includes(event.id)) ||
  [...pool].sort((a, b) => history.lastIndexOf(a.id) - history.lastIndexOf(b.id))[0];
 if (task?.payload) task.payload.interactionEventId = event.id;
 return event;
}
export function npcInteractionDecision(task){const npc=NPCS[task?.payload?.npcId],event=eventFor(task);if(!npc||!event)return null;return{kind:"npc_interaction",npcId:task.payload.npcId,npcName:npc.name,portrait:npc.portrait||npc.bust,accent:npc.accent,title:event.title,text:event.text,choices:event.choices.map(({id,label,note})=>({id,label,note}))}}
export function resolveNpcInteraction(task,choiceId){const npcId=task?.payload?.npcId,type=task?.payload?.type,npc=NPCS[npcId],event=eventFor(task);if(!npc||!event)return{ok:false,text:"這段相處事件已經失效。"};const selected=event.choices.find(x=>x.id===choiceId)||event.choices[0],before=state.relationships[npcId]||{},beforeAffection=Number(before.affection)||0,beforeHostility=Number(before.hostility)||0,result=interactWithNpc(npcId,type,{...selected.effect,source:`${event.title}・${selected.label}`});if(!result.ok)return{ok:false,text:result.message,npcName:npc.name,portrait:npc.portrait||npc.bust,accent:npc.accent};const attentive=(selected.effect?.trust||0)>=0&&(selected.effect?.hostility||0)<=0;const memoryText=attentive?noteCharacterInteraction(npcId,type):"";const bond={support:"care",personal:"private",work:"work",collaborate:"work"}[type];if(attentive&&bond)recordCharacterMemory(npcId,{kind:"shared",key:`bond:${bond}`,value:bond,label:event.title,text:selected.outcome,source:"共同經歷",week:state.week});recordCharacterMemory(npcId,{kind:"shared",key:`interaction:${event.id}`,value:selected.id,label:event.title,text:selected.outcome,source:"人物相處",week:state.week});if(!attentive||["support","personal","collaborate"].includes(type))recordCharacterMemory(npcId,{kind:"response",key:"support",value:attentive?"listened":"dismissed",label:event.title,text:selected.outcome,source:"人物相處",week:state.week});const after=state.relationships[npcId]||{},affectionDelta=(Number(after.affection)||0)-beforeAffection,hostilityDelta=(Number(after.hostility)||0)-beforeHostility,affectionCueDelta=affectionDelta||(Number(selected.effect?.affection)||0),relationshipCues=[];if(affectionCueDelta>0)relationshipCues.push({kind:"affection-up",symbol:"♥",label:"對方似乎更在意你了"});else if(affectionCueDelta<0)relationshipCues.push({kind:"affection-down",symbol:"💔",label:"對方的心意退了一步"});if(hostilityDelta>0)relationshipCues.push({kind:"hostility-up",symbol:"⚡",label:"你們之間留下了芥蒂"});else if(hostilityDelta<0)relationshipCues.push({kind:"hostility-down",symbol:"✦",label:"彼此的芥蒂稍微鬆動了"});state.npcInteractionEventHistory??={};state.npcInteractionMemories??=[];const key=`${npcId}:${type}`;state.npcInteractionEventHistory[key]=[...(state.npcInteractionEventHistory[key]||[]),event.id].slice(-10);state.npcInteractionMemories.push({week:state.week,day:state.runnerDay,npcId,type,eventId:event.id,choiceId:selected.id,title:event.title,outcome:selected.outcome});state.npcInteractionMemories=state.npcInteractionMemories.slice(-100);const focusNote=state.focus==="people"&&((selected.effect?.closeness||0)>0||(selected.effect?.trust||0)>0)?`<em class="focus-result">♡ 策略「拓展人脈」：親近額外＋2、信任額外＋1</em>`:"";return{ok:true,title:event.title,text:`${selected.outcome}${memoryText?`<br>${memoryText}`:""}<br><small>${result.relationship.text.replace(/<[^>]+>/g,"")}。</small>${focusNote}`,npcName:npc.name,portrait:npc.portrait||npc.bust,accent:npc.accent,relationshipCues}}
