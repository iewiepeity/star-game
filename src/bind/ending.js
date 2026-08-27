// 事件層：結局畫面。切換是否啟用眼熟繼承、開始新的一輪。
import{state}from"../core/state.js";
import{render}from"../render.js";
import{startNewRun}from"../views/ending.js";

export function bindEndingScreen(){
 document.querySelectorAll("[data-inherit]").forEach(x=>x.onclick=()=>{state.inheritChoice=x.dataset.inherit==="yes";render()});document.querySelector("#new-run")?.addEventListener("click",startNewRun)
}
