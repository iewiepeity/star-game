// 事件層：render() 每次重繪完 DOM 之後，一定會呼叫這裡的 bind() 重新掛上所有事件（沒有事件委派，逐一 querySelector）。
// 依 state.screen 分成五組：create／runner／summary／ending 各自处理完就直接 return，其餘（房間＋所有平板 App）都在 bindRoomScreen。
// 這個檔案幾乎會用到其他每一層的東西，是全遊戲唯一「使用者操作 → 呼叫邏輯層 → render()」的接線總表。
import{AGENCY_LIST}from"./data/agencies.js";
import{MAP_LOCATIONS}from"./data/map-locations.js";
import{ACTIONS}from"./data/actions.js";
import{JOB}from"./data/job.js";
import{FOCUSES}from"./data/focuses.js";
import{DAYS}from"./data/calendar.js";
import{state}from"./core/state.js";
import{jobWorkDaysText}from"./core/utils.js";
import{reroll,initializeHiddenStats}from"./core/stats.js";
import{resolveDay,startDay,finishWeek}from"./logic/runner.js";
import{checkAgencyContractExpiry,cancelAgencyInterview,applyToAgency,scheduleAgencyInterview,acceptAgencyOffer,declineAgencyOffer}from"./logic/agency.js";
import{resolveJobAudition}from"./logic/jobs.js";
import{budget}from"./views/planner.js";
import{startNewRun}from"./views/ending.js";
import{render}from"./render.js";

export function bind(){
 if(state.screen==="create"){bindCreateScreen();return}
 if(state.screen==="runner"){bindRunnerScreen();return}
 if(state.screen==="summary"){bindSummaryScreen();return}
 if(state.screen==="ending"){bindEndingScreen();return}
 bindRoomScreen()
}

// STEP 1/2 姓名與性別輸入、STEP 2/2 重骰與確認進入房間。
function bindCreateScreen(){
 document.querySelector("#player-name")?.addEventListener("input",e=>{state.name=e.target.value;document.querySelector("#to-stats").disabled=!state.name.trim()});document.querySelectorAll("[data-gender]").forEach(x=>x.onclick=()=>{const g=x.dataset.gender;state.gender=g==="自訂"?state.customGender||"自訂":g;render()});document.querySelector("#custom-gender")?.addEventListener("input",e=>{state.customGender=e.target.value;state.gender=e.target.value||"自訂"});document.querySelector("#to-stats")?.addEventListener("click",()=>{state.createStep=2;render()});document.querySelector("#back")?.addEventListener("click",()=>{state.createStep=1;render()});document.querySelector("#reroll")?.addEventListener("click",reroll);document.querySelector("#start")?.addEventListener("click",()=>{initializeHiddenStats();state.screen="game";render()})
}

// 逐日事件：選擇分支（data-choice）與「前往下一天／查看本週總結」。
function bindRunnerScreen(){
 document.querySelectorAll("[data-choice]").forEach(x=>x.onclick=()=>resolveDay(x.dataset.choice));document.querySelector("#next-day")?.addEventListener("click",()=>{if(state.runnerDay===6)finishWeek();else{state.runnerDay++;startDay()}})
}

// 週結算：推進到下一週（含住院跳過的週數），檢查合約到期與通告違約，回到房間。
function bindSummaryScreen(){
 document.querySelector("#next-week")?.addEventListener("click",()=>{if(state.hospitalSkipWeeks){state.history.push({week:state.week+1,results:[],reward:false,hospitalized:true,fullRecovery:true})}state.week+=1+state.hospitalSkipWeeks;state.hospitalSkipWeeks=0;checkAgencyContractExpiry();if(state.week>260){state.endingType="fiveyear";state.screen="ending";state.reward=null;render();return}if(state.jobStage==="active"&&state.week>state.jobDeadline&&state.jobRemaining>0){state.jobStage="breached";state.jobNotice=`逾期未完成 ${state.jobRemaining} 次拍攝`}state.screen="game";state.tab="planner";state.appOpen=null;state.reward=null;render()})
}

// 結局畫面：切換是否啟用眼熟繼承、開始新的一輪。
function bindEndingScreen(){
 document.querySelectorAll("[data-inherit]").forEach(x=>x.onclick=()=>{state.inheritChoice=x.dataset.inherit==="yes";render()});document.querySelector("#new-run")?.addEventListener("click",startNewRun)
}

// 房間畫面與所有平板 App 共用的事件：開關 App／抽屜、安排行程、選地圖地點、切換策略、複製上週／全部休息、
// 人物與經紀公司選取、經紀公司操作、退圈入口、通告動作與試鏡選擇、開始本週。
function bindRoomScreen(){
 document.querySelectorAll("[data-open-app]").forEach(x=>x.onclick=()=>{const target=x.dataset.openApp;if(target==="map"&&!state.drawerOpen){const openDay=state.schedule.findIndex(id=>id==="rest");if(openDay>=0)state.selectedDay=openDay}if(target==="agency"&&!state.selectedAgencyId)state.selectedAgencyId=AGENCY_LIST[0].id;state.appOpen=target;state.drawerOpen=false;render()});
 document.querySelectorAll("[data-close-app]").forEach(x=>x.onclick=()=>{state.appOpen=null;state.drawerOpen=false;render()});
 document.querySelector("[data-open-job]")?.addEventListener("click",()=>{state.appOpen="jobs";state.drawerOpen=false;render()});
 document.querySelectorAll("[data-day]").forEach(x=>x.onclick=()=>{state.selectedDay=Number(x.dataset.day);state.drawerOpen=true;render()});
 document.querySelectorAll("[data-close-drawer]").forEach(x=>x.onclick=()=>{state.drawerOpen=false;render()});
 document.querySelectorAll("[data-filter]").forEach(x=>x.onclick=()=>{state.filter=x.dataset.filter;render()});
 document.querySelectorAll("[data-pick]").forEach(x=>x.onclick=()=>{const id=x.dataset.pick;if(id==="adshoot"&&!JOB.workDays.includes(state.selectedDay)){state.notice=`此通告僅能安排在每週${jobWorkDaysText()}`;render();return}if(id==="free"){state.drawerOpen=false;state.appOpen="map";render();return}if(state.agencyInterview&&state.agencyInterview.dayIndex===state.selectedDay)cancelAgencyInterview();state.schedule[state.selectedDay]=id;state.notice=`${DAYS[state.selectedDay]}已安排「${ACTIONS[id].label}」`;state.drawerOpen=false;render()});
 document.querySelectorAll("[data-map-location]").forEach(x=>x.onclick=()=>{if(state.agencyInterview&&state.agencyInterview.dayIndex===state.selectedDay)cancelAgencyInterview();state.mapLocation=x.dataset.mapLocation;state.schedule[state.selectedDay]="free";state.notice=`${DAYS[state.selectedDay]}將前往「${MAP_LOCATIONS[state.mapLocation].name}」`;state.appOpen="planner";render()});
 document.querySelectorAll("[data-focus]").forEach(x=>x.onclick=()=>{state.focus=x.dataset.focus;state.notice=`本週策略改為「${FOCUSES[state.focus].label}」`;render()});
 document.querySelector("#copy")?.addEventListener("click",()=>{if(state.lastSchedule){if(state.agencyInterview)cancelAgencyInterview();state.schedule=state.lastSchedule.map(id=>(id==="adshoot"&&state.jobStage!=="active")||id==="agency_interview"?"rest":id);state.notice="已複製上週行程";render()}});
 document.querySelector("#rest-all")?.addEventListener("click",()=>{if(state.agencyInterview)cancelAgencyInterview();state.schedule=Array(7).fill("rest");state.notice="本週已全部改為休息";render()});
 document.querySelector("[data-go-free]")?.addEventListener("click",()=>{state.selectedDay=state.schedule.findIndex(id=>id==="rest");if(state.selectedDay<0)state.selectedDay=6;state.appOpen="map";render()});
 document.querySelectorAll("[data-select-npc]").forEach(x=>x.onclick=()=>{state.selectedNpc=x.dataset.selectNpc;render()});
 document.querySelectorAll("[data-select-agency]").forEach(x=>x.onclick=()=>{state.selectedAgencyId=x.dataset.selectAgency;render()});
 document.querySelectorAll("[data-agency-action]").forEach(x=>x.onclick=()=>{const act=x.dataset.agencyAction,id=state.selectedAgencyId||AGENCY_LIST[0].id;if(act==="apply")applyToAgency(id);if(act==="schedule-interview")scheduleAgencyInterview(id);if(act==="accept-offer")acceptAgencyOffer();if(act==="decline-offer")declineAgencyOffer();render()});
 document.querySelector("[data-retire]")?.addEventListener("click",()=>{state.endingType="retire";state.screen="ending";state.appOpen=null;render()});
 document.querySelectorAll("[data-job-action]").forEach(x=>x.onclick=()=>{const a=x.dataset.jobAction;if(a==="apply"||a==="retry"){state.jobStage="applied";state.jobNotice=""}if(a==="start-audition")state.jobStage="audition";if(a==="sign"){state.jobStage="active";state.jobNotice="合約已成立"}if(a==="schedule"){const i=state.schedule.findIndex((id,idx)=>JOB.workDays.includes(idx)&&(id==="rest"||id==="free"));if(i<0){state.notice=`本週${jobWorkDaysText()}都沒有空檔，請先移除其中一項行程`;state.appOpen="planner";render();return}state.schedule[i]="adshoot";state.selectedDay=i;state.notice=`廣告拍攝已排入${DAYS[i]}（指定工作日）`;state.appOpen="planner"}render()});
 document.querySelectorAll("[data-audition-choice]").forEach(x=>x.onclick=()=>{resolveJobAudition(x.dataset.auditionChoice);render()});
 document.querySelector("#begin-week")?.addEventListener("click",()=>{const invalidJobDay=state.schedule.findIndex((id,idx)=>id==="adshoot"&&!JOB.workDays.includes(idx));if(invalidJobDay>=0){state.notice=`${DAYS[invalidJobDay]}不是此通告的指定工作日，請重新安排`;render();return}if(budget()>state.money){state.notice="預算不足，請先調整行程";render();return}state.lastSchedule=[...state.schedule];state.weekResults=[];state.runnerDay=0;state.screen="runner";state.appOpen=null;startDay()})
}
