import{state,hydrateState}from"../core/state.js";
import{saveManualSlot,loadManualSlot,deleteManualSlot,backupCurrent,loadBackup,exportSave,parseImportedSave}from"../core/persistence.js";
import{render}from"../render.js";

function downloadSave(){const blob=new Blob([exportSave(state)],{type:"application/json"}),url=URL.createObjectURL(blob),link=document.createElement("a");link.href=url;link.download=`star-game-${state.name||"player"}-week-${state.week}.json`;link.click();URL.revokeObjectURL(url)}
function loadWithBackup(saved,message,returnApp="save"){if(!saved)return;backupCurrent(state,"讀檔前備份");hydrateState(saved);state.saveNotice=message;state.appOpen=returnApp;render()}

export function bindSave(){
 document.querySelectorAll("[data-save-slot]").forEach(button=>button.onclick=()=>{const slot=Number(button.dataset.saveSlot);saveManualSlot(slot,state,`手動存檔 ${slot}`);state.saveNotice=`已儲存至槽位 ${slot}。`;render()});
 document.querySelectorAll("[data-load-slot]").forEach(button=>button.onclick=()=>loadWithBackup(loadManualSlot(Number(button.dataset.loadSlot)),`已讀取槽位 ${button.dataset.loadSlot}。`,button.closest(".settings-page")?"settings":"save"));
 document.querySelectorAll("[data-delete-slot]").forEach(button=>button.onclick=()=>{deleteManualSlot(Number(button.dataset.deleteSlot));state.saveNotice=`已刪除槽位 ${button.dataset.deleteSlot}。`;render()});
 document.querySelector("#export-save")?.addEventListener("click",downloadSave);
 const input=document.querySelector("#import-save-file");document.querySelector("#import-save")?.addEventListener("click",()=>input?.click());
 input?.addEventListener("change",async()=>{try{const file=input.files?.[0];if(!file)return;const imported=parseImportedSave(await file.text());loadWithBackup(imported,"存檔匯入成功。") }catch(error){state.saveNotice=`匯入失敗：${error.message}`;render()}});
 document.querySelector("#load-backup")?.addEventListener("click",()=>loadWithBackup(loadBackup(),"已還原上一份安全備份。"));
}
