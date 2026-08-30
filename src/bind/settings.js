import{state}from"../core/state.js";
import{setPreference}from"../core/preferences.js";
import{TUTORIALS}from"../logic/tutorial.js";
import{commitState,renderUi}from"../render.js";
import{rememberDialogTrigger}from"../core/dialog-focus.js";
import{openApp}from"../core/app-navigation.js";
import{audioModeForState,playSfx,syncAudio}from"../core/audio.js";
let lastVolumePreview=0;

export function bindSettings(){
 document.querySelectorAll("[data-font-size]").forEach(button=>button.onclick=()=>{setPreference("fontSize",button.dataset.fontSize);renderUi()});
 document.querySelectorAll("[data-theme]").forEach(button=>button.onclick=()=>{setPreference("theme",button.dataset.theme);renderUi()});
 document.querySelectorAll("[data-auto-speed]").forEach(button=>button.onclick=()=>{setPreference("autoSpeed",button.dataset.autoSpeed);renderUi()});
 document.querySelectorAll("[data-audio-volume]").forEach(input=>input.oninput=()=>{setPreference(input.dataset.audioVolume,Number(input.value)/100);input.closest("label").querySelector("b").textContent=`${input.value}%`;syncAudio(audioModeForState(state),state);const now=performance.now();if(input.dataset.audioVolume==="sfxVolume"&&now-lastVolumePreview>180){lastVolumePreview=now;playSfx("message")}});
 document.querySelectorAll("[data-preview-sfx]").forEach(button=>button.onclick=()=>playSfx(button.dataset.previewSfx));
 document.querySelector("[data-audio-muted]")?.addEventListener("click",async()=>{const{getPreferences}=await import("../core/preferences.js");setPreference("audioMuted",!getPreferences().audioMuted);renderUi()});
 document.querySelector("[data-open-save-manager]")?.addEventListener("click",()=>{openApp(state,"save");renderUi()});
 document.querySelectorAll("[data-tutorial-mode]").forEach(button=>button.onclick=()=>commitState("tutorial:mode",()=>{state.tutorialSeen=button.dataset.tutorialMode==="skip"?TUTORIALS.map(item=>item.id):[];state.notice=button.dataset.tutorialMode==="skip"?"已關閉後續新手教學":"新手教學已重設，進入各介面時會再次顯示"}));
 document.querySelector("[data-request-reset]")?.addEventListener("click",event=>{rememberDialogTrigger(event.currentTarget);state.confirmDialog={type:"reset"};renderUi()});
}
