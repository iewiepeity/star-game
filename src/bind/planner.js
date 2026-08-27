// 事件層：行程規劃 App——點日期開抽屜、篩選、選擇活動、切換本週策略、複製上週／全部休息、開始這週。
import{ACTIONS}from"../data/actions.js";
import{JOB}from"../data/job.js";
import{FOCUSES}from"../data/focuses.js";
import{DAYS}from"../data/calendar.js";
import{state}from"../core/state.js";
import{jobWorkDaysText}from"../core/utils.js";
import{cancelAgencyInterview}from"../logic/agency.js";
import{startDay}from"../logic/runner.js";
import{budget}from"../views/planner.js";
import{render}from"../render.js";

export function bindPlanner(){
 document.querySelectorAll("[data-day]").forEach(x=>x.onclick=()=>{state.selectedDay=Number(x.dataset.day);state.drawerOpen=true;render()});
 document.querySelectorAll("[data-close-drawer]").forEach(x=>x.onclick=()=>{state.drawerOpen=false;render()});
 document.querySelectorAll("[data-filter]").forEach(x=>x.onclick=()=>{state.filter=x.dataset.filter;render()});
 document.querySelectorAll("[data-pick]").forEach(x=>x.onclick=()=>{const id=x.dataset.pick;if(id==="adshoot"&&!JOB.workDays.includes(state.selectedDay)){state.notice=`此通告僅能安排在每週${jobWorkDaysText()}`;render();return}if(id==="free"){state.drawerOpen=false;state.appOpen="map";render();return}if(state.agencyInterview&&state.agencyInterview.dayIndex===state.selectedDay)cancelAgencyInterview();state.schedule[state.selectedDay]=id;state.notice=`${DAYS[state.selectedDay]}已安排「${ACTIONS[id].label}」`;state.drawerOpen=false;render()});
 document.querySelectorAll("[data-focus]").forEach(x=>x.onclick=()=>{state.focus=x.dataset.focus;state.notice=`本週策略改為「${FOCUSES[state.focus].label}」`;render()});
 document.querySelector("#copy")?.addEventListener("click",()=>{if(state.lastSchedule){if(state.agencyInterview)cancelAgencyInterview();state.schedule=state.lastSchedule.map(id=>(id==="adshoot"&&state.jobStage!=="active")||id==="agency_interview"?"rest":id);state.notice="已複製上週行程";render()}});
 document.querySelector("#rest-all")?.addEventListener("click",()=>{if(state.agencyInterview)cancelAgencyInterview();state.schedule=Array(7).fill("rest");state.notice="本週已全部改為休息";render()});
 document.querySelector("#begin-week")?.addEventListener("click",()=>{const invalidJobDay=state.schedule.findIndex((id,idx)=>id==="adshoot"&&!JOB.workDays.includes(idx));if(invalidJobDay>=0){state.notice=`${DAYS[invalidJobDay]}不是此通告的指定工作日，請重新安排`;render();return}if(budget()>state.money){state.notice="預算不足，請先調整行程";render();return}state.lastSchedule=[...state.schedule];state.weekResults=[];state.runnerDay=0;state.screen="runner";state.appOpen=null;startDay()})
}
