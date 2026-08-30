import{state,hydrateState}from"../core/state.js";
import{saveManualSlot,loadManualSlot,deleteManualSlot,backupCurrent,loadBackup,exportSave,parseImportedSave,restoreRecentManualSlot}from"../core/persistence.js";
import{render,renderUi}from"../render.js";

function downloadSave(){const blob=new Blob([exportSave(state)],{type:"application/json"}),url=URL.createObjectURL(blob),link=document.createElement("a");link.href=url;link.download=`star-game-${state.name||"player"}-week-${state.week}.json`;link.click();URL.revokeObjectURL(url)}
function loadWithBackup(saved,message,returnApp="save"){if(!saved)return;backupCurrent(state,"讀檔前備份");hydrateState(saved);state.saveNotice=message;state.appOpen=returnApp;render()}

export function bindSave(){
 const showConfirm=(action,slot)=>{state.saveConfirm={action,slot};renderUi();globalThis.requestAnimationFrame(()=>document.querySelector("[data-cancel-save-action]")?.focus())};
 const save=slot=>{const ok=saveManualSlot(slot,state,`手動存檔 ${slot}`);state.saveConfirm=null;state.saveNotice=ok?`已儲存至槽位 ${slot}。`:"存檔寫入失敗，原本內容沒有被刪除。";renderUi()};
 document.querySelectorAll("[data-save-slot]").forEach(button=>button.onclick=()=>{const slot=Number(button.dataset.saveSlot);if(button.dataset.hasSave==="true"){showConfirm("overwrite",slot);return}save(slot)});
 document.querySelectorAll("[data-load-slot]").forEach(button=>button.onclick=()=>loadWithBackup(loadManualSlot(Number(button.dataset.loadSlot)),`已讀取槽位 ${button.dataset.loadSlot}。`,button.closest(".settings-page")?"settings":"save"));
 document.querySelectorAll("[data-delete-slot]").forEach(button=>button.onclick=()=>showConfirm("delete",Number(button.dataset.deleteSlot)));
 document.querySelector("[data-cancel-save-action]")?.addEventListener("click",()=>{state.saveConfirm=null;renderUi()});
 document.querySelector("[data-confirm-save-action]")?.addEventListener("click",event=>{const slot=Number(event.currentTarget.dataset.slot),action=event.currentTarget.dataset.confirmSaveAction;if(action==="overwrite"){save(slot);return}const ok=deleteManualSlot(slot);state.saveConfirm=null;state.saveNotice=ok?`已刪除槽位 ${slot}；仍可復原一次。`:"刪除失敗，槽位內容仍然保留。";renderUi()});
 document.querySelector("[data-restore-manual]")?.addEventListener("click",()=>{const slot=restoreRecentManualSlot();state.saveNotice=slot?`已復原槽位 ${slot} 的舊內容。`:"目前沒有可復原的舊槽位。";renderUi()});
 document.querySelector("#export-save")?.addEventListener("click",downloadSave);
 const input=document.querySelector("#import-save-file");document.querySelector("#import-save")?.addEventListener("click",()=>input?.click());
 input?.addEventListener("change",async()=>{try{const file=input.files?.[0];if(!file)return;const imported=parseImportedSave(await file.text());loadWithBackup(imported,"存檔匯入成功。") }catch(error){state.saveNotice=`匯入失敗：${error.message}`;render()}});
 document.querySelector("#load-backup")?.addEventListener("click",()=>loadWithBackup(loadBackup(),"已還原上一份安全備份。"));
}
