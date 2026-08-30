import{hydrateState,resetState,state}from"../core/state.js";
import{setPreference}from"../core/preferences.js";
import{backupCurrent,saveState}from"../core/persistence.js";
import{rollStats}from"../core/stats.js";
import{TUTORIALS}from"../logic/tutorial.js";
import{commitState,render,renderUi}from"../render.js";

export function bindSettings(){
 document.querySelectorAll("[data-font-size]").forEach(button=>button.onclick=()=>{setPreference("fontSize",button.dataset.fontSize);renderUi()});
 document.querySelectorAll("[data-theme]").forEach(button=>button.onclick=()=>{setPreference("theme",button.dataset.theme);renderUi()});
 document.querySelectorAll("[data-auto-speed]").forEach(button=>button.onclick=()=>{setPreference("autoSpeed",button.dataset.autoSpeed);renderUi()});
 document.querySelectorAll("[data-audio-volume]").forEach(input=>input.oninput=()=>{setPreference(input.dataset.audioVolume,Number(input.value)/100);input.closest("label").querySelector("b").textContent=`${input.value}%`});
 document.querySelector("[data-audio-muted]")?.addEventListener("click",async()=>{const{getPreferences}=await import("../core/preferences.js");setPreference("audioMuted",!getPreferences().audioMuted);renderUi()});
 document.querySelector("[data-open-save-manager]")?.addEventListener("click",()=>{state.appOpen="save";renderUi()});
 document.querySelectorAll("[data-tutorial-mode]").forEach(button=>button.onclick=()=>commitState("tutorial:mode",()=>{state.tutorialSeen=button.dataset.tutorialMode==="skip"?TUTORIALS.map(item=>item.id):[];state.notice=button.dataset.tutorialMode==="skip"?"已關閉後續新手教學":"新手教學已重設，進入各介面時會再次顯示"}));
 document.querySelector("[data-request-reset]")?.addEventListener("click",()=>{state.settingsConfirmReset=true;renderUi()});
 document.querySelector("[data-cancel-reset]")?.addEventListener("click",()=>{state.settingsConfirmReset=false;renderUi()});
 document.querySelector("[data-confirm-reset]")?.addEventListener("click",()=>{
  const previous=structuredClone(state);
  if(!backupCurrent(state,"從頭開始前備份")){state.notice="無法建立安全備份，已取消重新開始。";state.settingsConfirmReset=false;render();return}
  resetState();
  rollStats();
  if(!saveState(state)){hydrateState(previous);state.notice="無法寫入全新存檔，原本進度已恢復。";state.appOpen="settings";render();return}
  window.location.reload();
 });
}
