import{state,hydrateState}from"./core/state.js";
import{loadState,migrateLegacyManualSlot}from"./core/persistence.js";
import{rollStats}from"./core/stats.js";
import{startDay}from"./logic/runner.js";
import{ensureRngState}from"./core/rng.js";
import{activateNextEvent}from"./logic/event-engine.js";
import{render}from"./render.js";
import{applyPreferences}from"./core/preferences.js";
import{enableAudio,playSfx}from"./core/audio.js";

applyPreferences();
document.addEventListener("pointerdown",event=>{enableAudio();if(event.target.closest("button"))playSfx(event.target.closest(".main-btn,[data-confirm-reset],#begin-week")?"confirm":"tap")},{passive:true});
migrateLegacyManualSlot();
const saved=loadState();
if(saved){hydrateState(saved);ensureRngState();if(state.screen==="runner"&&state.runnerPhase==="loading")startDay();else if(state.eventQueue.length&&!state.activeEvent){activateNextEvent();render()}else render()}else rollStats();

if("serviceWorker"in navigator)window.addEventListener("load",async()=>{try{const reg=await navigator.serviceWorker.register("./service-worker.js");reg.update().catch(()=>{});let reloading=false;navigator.serviceWorker.addEventListener("controllerchange",()=>{if(reloading||sessionStorage.getItem("sw-reloaded")==="1")return;reloading=true;sessionStorage.setItem("sw-reloaded","1");location.reload()});setTimeout(()=>sessionStorage.removeItem("sw-reloaded"),5000)}catch{}});
