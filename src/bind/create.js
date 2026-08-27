// 事件層：角色建立畫面。STEP 1/2 姓名與性別輸入、STEP 2/2 重骰與確認進入房間。
import{state}from"../core/state.js";
import{reroll,initializeHiddenStats}from"../core/stats.js";
import{render}from"../render.js";

export function bindCreateScreen(){
 document.querySelector("#player-name")?.addEventListener("input",e=>{state.name=e.target.value;document.querySelector("#to-stats").disabled=!state.name.trim()});document.querySelectorAll("[data-gender]").forEach(x=>x.onclick=()=>{const g=x.dataset.gender;state.gender=g==="自訂"?state.customGender||"自訂":g;render()});document.querySelectorAll("[data-avatar]").forEach(x=>x.onclick=()=>{state.avatarId=x.dataset.avatar;render()});document.querySelector("#custom-gender")?.addEventListener("input",e=>{state.customGender=e.target.value;state.gender=e.target.value||"自訂"});document.querySelector("#to-stats")?.addEventListener("click",()=>{state.createStep=2;render()});document.querySelector("#back")?.addEventListener("click",()=>{state.createStep=1;render()});document.querySelector("#reroll")?.addEventListener("click",reroll);document.querySelector("#start")?.addEventListener("click",()=>{initializeHiddenStats();state.screen="game";render()})
}
