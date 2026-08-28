import{state}from"../core/state.js";
import{interactWithNpc}from"../logic/npc-ecosystem.js";
import{render}from"../render.js";
export function bindNpc(){document.querySelectorAll("[data-select-npc]").forEach(x=>x.onclick=()=>{state.selectedNpc=x.dataset.selectNpc;state.npcArtView="bust";render()});document.querySelectorAll("[data-npc-art]").forEach(x=>x.onclick=()=>{state.npcArtView=x.dataset.npcArt;render()});document.querySelectorAll("[data-npc-interact]").forEach(x=>x.onclick=()=>{const r=interactWithNpc(x.dataset.npcId,x.dataset.npcInteract);state.notice=r.message;render()})}
