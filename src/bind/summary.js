// 事件層：週結算畫面。推進到下一週（含住院跳過的週數），檢查合約到期與通告違約，回到房間。
import{state}from"../core/state.js";
import{checkAgencyContractExpiry}from"../logic/agency.js";
import{checkJobDeadlines}from"../logic/job-engine.js";
import{evaluateEnding}from"../logic/career.js";
import{processQueuedEvents}from"../logic/event-engine.js";
import{render}from"../render.js";

export function bindSummaryScreen(){
 document.querySelector("#next-week")?.addEventListener("click",()=>{if(state.hospitalSkipWeeks){state.history.push({week:state.week+1,results:[],reward:false,hospitalized:true,fullRecovery:true})}state.week+=1+state.hospitalSkipWeeks;state.hospitalSkipWeeks=0;checkAgencyContractExpiry();checkJobDeadlines();const delayed=processQueuedEvents();if(delayed.length)state.notice=`有 ${delayed.length} 件過去選擇的後續事件發生。`;if(state.week>260){state.endingType="fiveyear";state.endingResult=evaluateEnding("fiveyear");state.screen="ending";state.reward=null;render();return}if(state.jobStage==="active"&&state.week>state.jobDeadline&&state.jobRemaining>0){state.jobStage="breached";state.jobNotice=`逾期未完成 ${state.jobRemaining} 次拍攝`}state.schedule=state.schedule.map(id=>id==="job_session"?"rest":id);state.scheduledJobIds=Array(7).fill(null);state.screen="game";state.tab="planner";state.appOpen=null;state.reward=null;render()})
}
