import{state}from"../core/state.js";
import{NPCS}from"../data/npcs.js";
import{NPC_INTERACTIONS}from"../data/npc-network.js";
import{scheduleActivity}from"../logic/scheduled-activities.js";
import{render}from"../render.js";
export function bindNpc(){document.querySelectorAll("[data-select-npc]").forEach(x=>x.onclick=()=>{state.selectedNpc=x.dataset.selectNpc;state.npcArtView="bust";render()});document.querySelectorAll("[data-npc-art]").forEach(x=>x.onclick=()=>{state.npcArtView=x.dataset.npcArt;render()});document.querySelectorAll("[data-npc-interact]").forEach(x=>x.onclick=()=>{const npcId=x.dataset.npcId,type=x.dataset.npcInteract,npc=NPCS[npcId],def=NPC_INTERACTIONS[type];if(!npc||!def){state.notice="這個互動目前無法安排。";render();return}const key=`${state.week}:${npcId}:${type}`;if(state.npcInteractionsByWeek[key]){state.notice="這週已經做過這個互動了。";render();return}const r=scheduleActivity("npc_interact",{npcId,type},`和${npc.name}${def.label}`,{cost:def.cost||0,fatigue:def.fatigue||2,stamina:Math.max(2,def.fatigue||2)});state.notice=r.message;render()})}
