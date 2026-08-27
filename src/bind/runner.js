// 事件層：逐日事件畫面。選擇分支（data-choice）與「前往下一天／查看本週總結」。
import{state}from"../core/state.js";
import{resolveDay,startDay,finishWeek}from"../logic/runner.js";

export function bindRunnerScreen(){
 document.querySelectorAll("[data-choice]").forEach(x=>x.onclick=()=>resolveDay(x.dataset.choice));document.querySelector("#next-day")?.addEventListener("click",()=>{if(state.runnerDay===6)finishWeek();else{state.runnerDay++;startDay()}})
}
