// 事件層：通告中心 App——接取試鏡、進入試鏡現場、簽約、排入拍攝日、試鏡現場選擇。
import{JOB}from"../data/job.js";
import{DAYS}from"../data/calendar.js";
import{state}from"../core/state.js";
import{jobWorkDaysText}from"../core/utils.js";
import{resolveJobAudition}from"../logic/jobs.js";
import{render}from"../render.js";

export function bindJobs(){
 document.querySelectorAll("[data-job-action]").forEach(x=>x.onclick=()=>{const a=x.dataset.jobAction;if(a==="apply"&&(state.trainingSessionsCompleted||0)<JOB.minTrainingSessions){state.jobNotice=`一星通告也需要完成至少 ${JOB.minTrainingSessions} 次基礎訓練；目前已完成 ${state.trainingSessionsCompleted||0} 次。`;render();return}if(a==="apply"||a==="retry"){state.jobStage="applied";state.jobNotice=""}if(a==="start-audition")state.jobStage="audition";if(a==="sign"){state.jobStage="active";state.jobNotice="合約已成立"}if(a==="schedule"){const i=state.schedule.findIndex((id,idx)=>JOB.workDays.includes(idx)&&(id==="rest"||id==="free"));if(i<0){state.notice=`本週${jobWorkDaysText()}都沒有空檔，請先移除其中一項行程`;state.appOpen="planner";render();return}state.schedule[i]="adshoot";state.freeLocations[i]=null;state.selectedDay=i;state.notice=`廣告拍攝已排入${DAYS[i]}（指定工作日）`;state.appOpen="planner"}render()});
 document.querySelectorAll("[data-audition-choice]").forEach(x=>x.onclick=()=>{resolveJobAudition(x.dataset.auditionChoice);render()});
}
