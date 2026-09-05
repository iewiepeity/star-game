import { inviteNpc, invitationStatus } from "../logic/npc-invitations.js";
import{state}from"../core/state.js";import{NPCS}from"../data/npcs.js";import{NPC_INTERACTIONS}from"../data/npc-network.js";import{setRomanceVisibility}from"../logic/romance-engine.js";import{render,renderUi}from"../render.js";import{rememberDialogTrigger}from"../core/dialog-focus.js";import{openApp}from"../core/app-navigation.js";
function openNpc(id){state.selectedNpc=id;state.npcArtView="bust";state.peopleSection="profiles";for(const message of state.npcMessages||[])if(message.npcId===id)message.read=true;openApp(state,"people");render()}
export function bindNpc(){
 document.querySelectorAll("[data-select-npc]").forEach(x=>x.onclick=()=>openNpc(x.dataset.selectNpc));
 document.querySelectorAll("[data-npc-art]").forEach(x=>x.onclick=()=>{state.npcArtView=x.dataset.npcArt;render()});
 document.querySelectorAll("[data-npc-interact]").forEach(x=>x.onclick=()=>{const npcId=x.dataset.npcId,type=x.dataset.npcInteract;if(x.disabled||!NPCS[npcId]||!NPC_INTERACTIONS[type])return;const day=Array.from({length:7},(_,i)=>i).find(i=>!invitationStatus(state,npcId,type,i));state.npcInvitation={npcId,type,day:day??null};renderUi();});
 document.querySelectorAll('[data-invitation-day]').forEach(button=>button.onclick=()=>{if(!state.npcInvitation)return;state.npcInvitation.day=Number(button.dataset.invitationDay);renderUi();});
 document.querySelector('[data-cancel-invitation]')?.addEventListener('click',()=>{state.npcInvitation=null;renderUi();});
 document.querySelector('[data-confirm-invitation]')?.addEventListener('click',()=>{const p=state.npcInvitation;if(!p)return;const result=inviteNpc(p.npcId,p.type,p.day);state.notice=result.message;render();});
 document.querySelectorAll("[data-romance-action]").forEach(x=>x.onclick=()=>{const id=x.dataset.npcId,action=x.dataset.romanceAction,npc=NPCS[id];if(!npc)return;if(action==="breakup"){rememberDialogTrigger(x);state.confirmDialog={type:"breakup",npcId:id};renderUi();return}const result=setRomanceVisibility(id,action,"玩家調整戀情公開狀態");state.notice=result.ok?action==="public"?`你和${npc.name}決定公開戀情。`:`你和${npc.name}決定暫時維持地下戀情。`:result.reason;render()})
}
