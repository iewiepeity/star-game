// 事件層：人物檔案 App——切換目前查看的人物。
import{state}from"../core/state.js";
import{render}from"../render.js";

export function bindNpc(){
 document.querySelectorAll("[data-select-npc]").forEach(x=>x.onclick=()=>{state.selectedNpc=x.dataset.selectNpc;render()});
}
