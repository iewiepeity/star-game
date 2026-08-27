// 事件層：角色建立畫面。STEP 1/2 姓名與性別輸入、STEP 2/2 重骰與確認進入房間。
import{state}from"../core/state.js";
import{reroll,initializeHiddenStats}from"../core/stats.js";
import{saveState}from"../core/persistence.js";
import{swapImageWhenReady}from"../core/images.js";
import{AVATARS,portraitAsset,isAvatarLocked,defaultAvatarForGender}from"../data/wardrobe.js";
import{render}from"../render.js";

export function bindCreateScreen(){
 document.querySelector("#player-name")?.addEventListener("input",e=>{state.name=e.target.value;document.querySelector("#to-stats").disabled=!state.name.trim()});document.querySelectorAll("[data-gender]").forEach(x=>x.onclick=()=>{const g=x.dataset.gender;state.gender=g==="自訂"?state.customGender||"自訂":g;if(isAvatarLocked(AVATARS[state.avatarId],state.gender))state.avatarId=defaultAvatarForGender(state.gender).id;render()});document.querySelectorAll("[data-avatar]").forEach(x=>x.onclick=async()=>{const id=x.dataset.avatar;if(!AVATARS[id]||isAvatarLocked(AVATARS[id],state.gender))return;state.avatarId=id;document.querySelectorAll("[data-avatar]").forEach(button=>{const selected=button===x;button.classList.toggle("active",selected);button.querySelector("span").textContent=selected?"✓ 已選擇":"選擇"});saveState(state);await swapImageWhenReady(document.querySelector(".create-avatar-preview img"),portraitAsset(id,"newcomer"),()=>state.avatarId===id)});document.querySelector("#custom-gender")?.addEventListener("input",e=>{state.customGender=e.target.value;state.gender=e.target.value||"自訂"});document.querySelector("#to-stats")?.addEventListener("click",()=>{state.createStep=2;render()});document.querySelector("#back")?.addEventListener("click",()=>{state.createStep=1;render()});document.querySelector("#reroll")?.addEventListener("click",reroll);document.querySelector("#start")?.addEventListener("click",()=>{initializeHiddenStats();state.screen="game";render()})
}
