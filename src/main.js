import{state,hydrateState}from"./core/state.js";
import{flushSaveState,loadState,migrateLegacyManualSlot,scheduleSaveState}from"./core/persistence.js";
import{rollStats}from"./core/stats.js";
import{startDay}from"./logic/runner.js";
import{ensureRngState}from"./core/rng.js";
import{activateNextEvent}from"./logic/event-engine.js";
import{render}from"./render.js";
import{applyPreferences}from"./core/preferences.js";
import{enableAudio,playSfx,soundForControl}from"./core/audio.js";
import{installGlobalErrorHandlers,showFatalError}from"./core/error-recovery.js";
import{markUpdateAvailable,updateIsApplying}from"./core/pwa-update.js";

installGlobalErrorHandlers();
function updateSaveStatus(status){state.saveStatus=status;const node=document.querySelector("[data-save-status]");if(!node)return;node.dataset.saveStatus=status;node.querySelector("b").textContent=status==="saving"?"儲存中…":status==="error"?"尚未儲存":"已儲存";node.querySelector("small").textContent=status==="error"?"點擊開啟存檔管理":"進度保存在此裝置"}
document.addEventListener("star-game:state-changed",()=>{updateSaveStatus("saving");scheduleSaveState(state)});
document.addEventListener("star-game:save-status",event=>updateSaveStatus(event.detail?.status||"error"));
document.addEventListener("star-game:save-now",()=>flushSaveState());
window.addEventListener("pagehide",()=>flushSaveState());
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden")flushSaveState()});
try{
 applyPreferences();
 document.addEventListener("pointerdown",event=>{enableAudio();const control=event.target.closest("button,[role=button]");const sound=soundForControl(control);if(sound)playSfx(sound)},{passive:true});
 migrateLegacyManualSlot();
 const saved=loadState();
 if(saved){hydrateState(saved);ensureRngState();if(state.screen==="runner"&&state.runnerPhase==="loading")startDay();else if(state.eventQueue.length&&!state.activeEvent){activateNextEvent();render()}else render()}else rollStats();
}catch(error){showFatalError(error)}

if("serviceWorker"in navigator)window.addEventListener("load",async()=>{try{const reg=await navigator.serviceWorker.register("./service-worker.js");const offer=worker=>{if(!navigator.serviceWorker.controller||!worker)return;markUpdateAvailable(worker);render({persist:false})};if(reg.waiting)offer(reg.waiting);reg.addEventListener("updatefound",()=>{const worker=reg.installing;worker?.addEventListener("statechange",()=>{if(worker.state==="installed")offer(reg.waiting||worker)})});reg.update().catch(()=>{});let reloading=false;navigator.serviceWorker.addEventListener("controllerchange",()=>{if(reloading||!updateIsApplying())return;reloading=true;location.reload()})}catch{}});
