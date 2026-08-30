import{state,hydrateState}from"./core/state.js";
import{flushSaveState,loadState,migrateLegacyManualSlot,scheduleSaveState}from"./core/persistence.js";
import{rollStats}from"./core/stats.js";
import{startDay}from"./logic/runner.js";
import{ensureRngState}from"./core/rng.js";
import{activateNextEvent}from"./logic/event-engine.js";
import{render}from"./render.js";
import{applyPreferences}from"./core/preferences.js";
import{enableAudio,playSfx}from"./core/audio.js";
import{installGlobalErrorHandlers,showFatalError}from"./core/error-recovery.js";
import{markUpdateAvailable,updateIsApplying}from"./core/pwa-update.js";

installGlobalErrorHandlers();
document.addEventListener("star-game:rendered",()=>scheduleSaveState(state));
document.addEventListener("star-game:save-now",()=>flushSaveState());
window.addEventListener("pagehide",()=>flushSaveState());
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden")flushSaveState()});
try{
 applyPreferences();
 document.addEventListener("pointerdown",event=>{enableAudio();if(event.target.closest("button"))playSfx(event.target.closest(".main-btn,[data-confirm-reset],#begin-week")?"confirm":"tap")},{passive:true});
 migrateLegacyManualSlot();
 const saved=loadState();
 if(saved){hydrateState(saved);ensureRngState();if(state.screen==="runner"&&state.runnerPhase==="loading")startDay();else if(state.eventQueue.length&&!state.activeEvent){activateNextEvent();render()}else render()}else rollStats();
}catch(error){showFatalError(error)}

if("serviceWorker"in navigator)window.addEventListener("load",async()=>{try{const reg=await navigator.serviceWorker.register("./service-worker.js");const offer=worker=>{if(!navigator.serviceWorker.controller||!worker)return;markUpdateAvailable(worker);render()};if(reg.waiting)offer(reg.waiting);reg.addEventListener("updatefound",()=>{const worker=reg.installing;worker?.addEventListener("statechange",()=>{if(worker.state==="installed")offer(reg.waiting||worker)})});reg.update().catch(()=>{});let reloading=false;navigator.serviceWorker.addEventListener("controllerchange",()=>{if(reloading||!updateIsApplying())return;reloading=true;location.reload()})}catch{}});
