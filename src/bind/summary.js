import{state}from"../core/state.js";
import{checkAgencyContractExpiry}from"../logic/agency.js";
import{checkJobDeadlines}from"../logic/job-engine.js";
import{lockEnding,recordCareerRoute}from"../logic/career.js";
import{processQueuedEvents,activateNextEvent}from"../logic/event-engine.js";
import{resolveDueAwardSeasons}from"../logic/portfolio.js";
import{render}from"../render.js";

export function bindSummaryScreen(){document.querySelector("#next-week")?.addEventListener("click",()=>{if(state.hospitalSkipWeeks)state.history.push({week:state.week+1,results:[],reward:false,hospitalized:true,fullRecovery:true});state.week+=1+state.hospitalSkipWeeks;state.hospitalSkipWeeks=0;checkAgencyContractExpiry();const breached=checkJobDeadlines();const awards=resolveDueAwardSeasons();recordCareerRoute();const due=processQueuedEvents();if(breached.length)state.notice=`有 ${breached.length} 份通告因逾期違約。`;else if(awards.length)state.notice=`本年度獎季公布了 ${awards.length} 項結果。`;else if(due)state.notice=`有 ${due} 件過去選擇的後續事件等待處理。`;if(state.week>260){state.endingSnapshot=null;lockEnding("fiveyear");state.screen="ending";state.reward=null;render();return}state.schedule=state.schedule.map(id=>id==="job_session"?"rest":id);state.scheduledJobIds=Array(7).fill(null);state.weekResults=[];state.reward=null;state.tab="planner";state.appOpen=null;if(state.eventQueue.length){activateNextEvent()}else state.screen="game";render()})}
