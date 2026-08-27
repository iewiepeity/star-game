// 事件層：存檔管理 App。手動存檔寫進獨立的存檔槽；讀取則用 hydrateState() 整包換成存檔當下的狀態。
import{state,hydrateState}from"../core/state.js";
import{saveManualState,loadManualState}from"../core/persistence.js";
import{render}from"../render.js";

export function bindSave(){
 document.querySelector("#manual-save")?.addEventListener("click",()=>{saveManualState(state);state.saveNotice="已建立手動存檔。";render()});
 document.querySelector("#manual-load")?.addEventListener("click",()=>{const saved=loadManualState();if(!saved){state.saveNotice="目前沒有手動存檔可以讀取。";render();return}hydrateState(saved);state.saveNotice="已讀取手動存檔，進度已回到記錄當下。";render()});
}
