import{resetState,state}from"../core/state.js";
import{setPreference}from"../core/preferences.js";
import{backupCurrent}from"../core/persistence.js";
import{rollStats}from"../core/stats.js";
import{TUTORIALS}from"../logic/tutorial.js";
import{render}from"../render.js";

export function bindSettings(){
 document.querySelectorAll("[data-font-size]").forEach(button=>button.onclick=()=>{setPreference("fontSize",button.dataset.fontSize);render()});
 document.querySelectorAll("[data-theme]").forEach(button=>button.onclick=()=>{setPreference("theme",button.dataset.theme);render()});
 document.querySelectorAll("[data-auto-speed]").forEach(button=>button.onclick=()=>{setPreference("autoSpeed",button.dataset.autoSpeed);render()});
 document.querySelectorAll("[data-audio-volume]").forEach(input=>input.oninput=()=>{setPreference(input.dataset.audioVolume,Number(input.value)/100);input.closest("label").querySelector("b").textContent=`${input.value}%`});
 document.querySelector("[data-audio-muted]")?.addEventListener("click",async()=>{const{getPreferences}=await import("../core/preferences.js");setPreference("audioMuted",!getPreferences().audioMuted);render()});
 document.querySelector("[data-open-save-manager]")?.addEventListener("click",()=>{state.appOpen="save";render()});
 document.querySelectorAll("[data-tutorial-mode]").forEach(button=>button.onclick=()=>{state.tutorialSeen=button.dataset.tutorialMode==="skip"?TUTORIALS.map(item=>item.id):[];state.notice=button.dataset.tutorialMode==="skip"?"已關閉後續新手教學":"新手教學已重設，進入各介面時會再次顯示";render()});
 document.querySelector("[data-request-reset]")?.addEventListener("click",()=>{state.settingsConfirmReset=true;render()});
 document.querySelector("[data-cancel-reset]")?.addEventListener("click",()=>{state.settingsConfirmReset=false;render()});
 document.querySelector("[data-confirm-reset]")?.addEventListener("click",()=>{
  backupCurrent(state,"從頭開始前備份");
  resetState();
  rollStats();
  // 重新載入後只會讀到剛寫入的全新自動存檔，避免舊的房間／設定畫面殘留。
  window.location.reload();
 });
}
