// 邏輯層：經紀公司資格判定與狀態機。這裡是唯一會改變 state.agency* 欄位的地方，畫面（views/agency.js）只讀不寫。
import{AGENCIES}from"../data/agencies.js";
import{DAYS}from"../data/calendar.js";
import{state}from"../core/state.js";

// ---- 資格判定（純函式，不碰畫面） ----
export function agencyRequirementRows(agency){const rows=[{label:"簽約準備度",current:state.contract,required:agency.requirements.contractReadiness,unit:"%"}];agency.requirements.abilities.forEach(([n,min])=>rows.push({label:n,current:state.stats[n]||0,required:min,unit:""}));return rows}
export function checkAgencyEligibility(agency){const missing=agencyRequirementRows(agency).filter(r=>r.current<r.required);return{met:missing.length===0,missing}}
export function canApplyToAgency(agency){if(isAgencyContractActive())return false;const app=state.agencyApplications[agency.id];if(app&&app.status!=="rejected")return false;return checkAgencyEligibility(agency).met}

// ---- 狀態處理（唯一改變 state 的地方） ----
export function applyToAgency(id){const agency=AGENCIES[id];if(!canApplyToAgency(agency))return;state.agencyApplications[id]={status:"applied",appliedWeek:state.week};state.notice=`已向${agency.name}投遞新人資料。`}

// 面談取消的唯一入口：手動覆蓋行程、住院中斷都經過這裡，確保狀態與行程欄位一起復原，不會卡住申請狀態。
export function cancelAgencyInterview(reason){if(!state.agencyInterview)return;const{agencyId,dayIndex}=state.agencyInterview;const app=state.agencyApplications[agencyId];if(app&&app.status==="interview_scheduled")app.status="applied";if(state.schedule[dayIndex]==="agency_interview")state.schedule[dayIndex]="rest";state.agencyInterview=null;if(reason)state.notice=reason}

export function scheduleAgencyInterview(id){const agency=AGENCIES[id],app=state.agencyApplications[id];if(!app||app.status!=="applied")return;if(state.agencyInterview&&state.agencyInterview.agencyId!==id){state.notice="本週已排入其他面談，請先完成後再安排。";return}const dayIndex=state.schedule.findIndex(a=>a==="rest"||a==="free");if(dayIndex<0){state.notice="本週沒有空檔，請先移除一項行程。";return}state.schedule[dayIndex]="agency_interview";state.agencyInterview={agencyId:id,dayIndex};app.status="interview_scheduled";state.notice=`${agency.name}面談已排入${DAYS[dayIndex]}。`}

// 只依能力、隱藏數值、心情、疲勞與回答方式計算，不含亂數；同一次面談、同一個 state 不論重新 render 幾次都會得到相同分數。
// 畫面上的文字提示只能讀這個函式；真正決定成敗要另外在結算時擲一次骰（見 logic/runner.js 的 resolveDay 的 agency_interview 分支）。
export function deterministicInterviewScore(agency,choice){const reqAvg=agency.requirements.abilities.reduce((s,[n,min])=>s+((state.stats[n]||0)-min),0)/agency.requirements.abilities.length;const readinessGap=state.contract-agency.requirements.contractReadiness;const publicPair=choice==="steady"?["口才","親和力"]:["鏡頭感","肢體表現"];const publicAvg=publicPair.reduce((s,n)=>s+(state.stats[n]||0),0)/publicPair.length;const hiddenPair=choice==="steady"?["自律"]:["膽識","野心"];const hiddenAvg=hiddenPair.reduce((s,n)=>s+((state.hidden[n]||500)-500),0)/hiddenPair.length;const fatiguePenalty=state.fatigue>60?(state.fatigue-60)*.3:0;const moodBonus=(state.mood-70)*.15;const base=50+reqAvg*.3+readinessGap*.4+(publicAvg-75)*.18+hiddenAvg*.05+moodBonus-fatiguePenalty;return Math.max(5,Math.min(95,Math.round(base)))}

export function acceptAgencyOffer(){if(!state.agencyOffer)return;const id=state.agencyOffer.agencyId,agency=AGENCIES[id];state.currentAgencyId=id;state.agencySignedWeek=state.week;state.agencyContractEndWeek=state.week+agency.contract.durationWeeks-1;state.agencyStatus="signed";state.agencyApplications[id].status="signed";state.agencyOffer=null;state.flags.push({week:state.week,label:`正式簽約：${agency.name}`,note:`成為${agency.name}旗下新人，合約至第 ${state.agencyContractEndWeek} 週。`});state.notice=`已正式簽約${agency.name}！`}
export function declineAgencyOffer(){if(!state.agencyOffer)return;const id=state.agencyOffer.agencyId,agency=AGENCIES[id];state.agencyApplications[id].status="declined";state.agencyOffer=null;state.notice=`已婉拒${agency.name}的合約。`}

// currentAgencyId 只代表「曾經簽過」；是否仍在合約期內一律以這個函式為準，calculateJobIncome 與所有身分／畫面判斷都要走這裡，不能只看 currentAgencyId 是否有值。
export function isAgencyContractActive(){return!!state.currentAgencyId&&state.week<=state.agencyContractEndWeek}

// 每週開始（含住院跳過的週數）都要呼叫一次，合約到期後停止抽成、清除 currentAgencyId，但保留歷史紀錄供星途紀錄使用。
export function checkAgencyContractExpiry(){if(!state.currentAgencyId||state.week<=state.agencyContractEndWeek)return;const agency=AGENCIES[state.currentAgencyId];state.agencyHistory.push({agencyId:agency.id,name:agency.name,signedWeek:state.agencySignedWeek,endWeek:state.agencyContractEndWeek,endedReason:"expired"});if(state.agencyApplications[agency.id])state.agencyApplications[agency.id].status="expired";state.currentAgencyId=null;state.agencyStatus="expired";state.flags.push({week:state.week,label:`合約到期：${agency.name}`,note:`與${agency.name}的合約已於第 ${state.agencyContractEndWeek} 週到期，恢復自由藝人身分。`});state.notice=`與${agency.name}的合約已到期，恢復自由藝人身分。`}

// ---- 通告收入計算（可重複使用，供任何正式通告呼叫） ----
export function calculateJobIncome(grossPay){const rate=isAgencyContractActive()?AGENCIES[state.currentAgencyId].contract.commissionRate:0;const commission=Math.round(grossPay*rate);return{gross:grossPay,commission,net:grossPay-commission}}
