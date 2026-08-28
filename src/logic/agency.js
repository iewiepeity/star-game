import{AGENCIES}from"../data/agencies.js";
import{DAYS}from"../data/calendar.js";
import{state}from"../core/state.js";
import{effectiveStat}from"../core/utils.js";
import{ensureManager}from"./manager.js";
import{baseAgencyTerms,currentOfferTerms}from"./contract-negotiation.js";
export function agencyRequirementRows(agency){const rows=[{label:"簽約準備度",current:state.contract,required:agency.requirements.contractReadiness,unit:"%"}];agency.requirements.abilities.forEach(([n,min])=>rows.push({label:n,current:effectiveStat(n),required:min,unit:""}));return rows}
export function checkAgencyEligibility(agency){const missing=agencyRequirementRows(agency).filter(r=>r.current<r.required);return{met:missing.length===0,missing}}
export function canApplyToAgency(agency){if(isAgencyContractActive())return false;const app=state.agencyApplications[agency.id];if(app&&!['rejected','expired','declined'].includes(app.status))return false;return checkAgencyEligibility(agency).met}
export function applyToAgency(id){const agency=AGENCIES[id];if(!canApplyToAgency(agency))return;state.agencyApplications[id]={status:"applied",appliedWeek:state.week};state.notice=`已向${agency.name}投遞新人資料。`}
export function cancelAgencyInterview(reason){if(!state.agencyInterview)return;const{agencyId,dayIndex}=state.agencyInterview;const app=state.agencyApplications[agencyId];if(app&&app.status==="interview_scheduled")app.status="applied";if(state.schedule[dayIndex]==="agency_interview")state.schedule[dayIndex]="rest";state.agencyInterview=null;if(reason)state.notice=reason}
export function scheduleAgencyInterview(id){const agency=AGENCIES[id],app=state.agencyApplications[id];if(!app||app.status!=="applied")return;if(state.agencyInterview&&state.agencyInterview.agencyId!==id){state.notice="本週已排入其他面談，請先完成後再安排。";return}const dayIndex=state.schedule.findIndex(a=>a==="rest"||a==="free");if(dayIndex<0){state.notice="本週沒有空檔，請先移除一項行程。";return}state.schedule[dayIndex]="agency_interview";state.freeLocations[dayIndex]=null;state.agencyInterview={agencyId:id,dayIndex};app.status="interview_scheduled";state.notice=`${agency.name}面談已排入${DAYS[dayIndex]}。`}
export function deterministicInterviewScore(agency,choice){const reqAvg=agency.requirements.abilities.reduce((s,[n,min])=>s+(effectiveStat(n)-min),0)/agency.requirements.abilities.length;const readinessGap=state.contract-agency.requirements.contractReadiness;const publicPair=choice==="steady"?["口才","親和力"]:["鏡頭感","肢體表現"];const publicAvg=publicPair.reduce((s,n)=>s+effectiveStat(n),0)/publicPair.length;const hiddenPair=choice==="steady"?["自律"]:["膽識","野心"];const hiddenAvg=hiddenPair.reduce((s,n)=>s+((state.hidden[n]||500)-500),0)/hiddenPair.length;const fatiguePenalty=state.fatigue>60?(state.fatigue-60)*.3:0;const moodBonus=(state.mood-70)*.15;const base=50+reqAvg*.3+readinessGap*.4+(publicAvg-75)*.18+hiddenAvg*.05+moodBonus-fatiguePenalty;return Math.max(5,Math.min(95,Math.round(base)))}
export function acceptAgencyOffer(){if(!state.agencyOffer)return;const id=state.agencyOffer.agencyId,agency=AGENCIES[id],terms=currentOfferTerms(agency)||baseAgencyTerms(agency);state.currentAgencyId=id;state.agencySignedWeek=state.week;state.agencyContractTerms={...terms};state.agencyContractEndWeek=state.week+terms.durationWeeks-1;state.agencyStatus="signed";state.agencyApplications[id].status="signed";state.agencyOffer=null;ensureManager();state.flags.push({week:state.week,label:`正式簽約：${agency.name}`,note:`成為${agency.name}旗下新人，合約至第 ${state.agencyContractEndWeek} 週，抽成 ${Math.round(terms.commissionRate*100)}%。`});state.notice=`已正式簽約${agency.name}！`}
export function declineAgencyOffer(){if(!state.agencyOffer)return;const id=state.agencyOffer.agencyId,agency=AGENCIES[id];state.agencyApplications[id].status="declined";state.agencyOffer=null;state.notice=`已婉拒${agency.name}的合約。`}
export function isAgencyContractActive(){return!!state.currentAgencyId&&state.week<=state.agencyContractEndWeek}
export function checkAgencyContractExpiry(){if(!state.currentAgencyId||state.week<=state.agencyContractEndWeek)return;const agency=AGENCIES[state.currentAgencyId];state.agencyHistory.push({agencyId:agency.id,name:agency.name,signedWeek:state.agencySignedWeek,endWeek:state.agencyContractEndWeek,endedReason:"expired",contractTerms:state.agencyContractTerms?structuredClone(state.agencyContractTerms):null,managerState:state.managerState?structuredClone(state.managerState):null});if(state.agencyApplications[agency.id])state.agencyApplications[agency.id].status="expired";state.currentAgencyId=null;state.managerState=null;state.agencyContractTerms=null;state.agencyStatus="expired";state.flags.push({week:state.week,label:`合約到期：${agency.name}`,note:`與${agency.name}的合約已於第 ${state.agencyContractEndWeek} 週到期，恢復自由藝人身分。`});state.notice=`與${agency.name}的合約已到期，恢復自由藝人身分。`}
export function calculateJobIncome(grossPay){const rate=isAgencyContractActive()?(state.agencyContractTerms?.commissionRate??AGENCIES[state.currentAgencyId].contract.commissionRate):0;const commission=Math.round(grossPay*rate);return{gross:grossPay,commission,net:grossPay-commission}}

export function agencyRenewalPreview(){
 if(!isAgencyContractActive())return null;
 const agency=AGENCIES[state.currentAgencyId],remain=state.agencyContractEndWeek-state.week+1;
 if(remain>8)return null;
 const current=state.agencyContractTerms||baseAgencyTerms(agency),works=state.completedWorks.filter(work=>work.completedWeek>=state.agencySignedWeek).length,trust=state.managerState?.trust||0;
 const strong=works>=4||trust>=65;
 return{agency,remain,eligible:works>=2||trust>=45,works,trust,terms:{...current,durationWeeks:agency.contract.durationWeeks,commissionRate:Math.max(.05,current.commissionRate-(strong?.03:.01)),creativeFreedom:Math.min(100,(current.creativeFreedom||50)+(strong?10:5)),guaranteedAuditions:(current.guaranteedAuditions||0)+(strong?1:0)}};
}

export function renewAgencyContract(){
 const preview=agencyRenewalPreview();
 if(!preview)return{ok:false,message:"目前還沒進入續約談判期。"};
 if(!preview.eligible)return{ok:false,message:"公司希望先看到至少兩部合作作品，或更穩定的經紀人信任。"};
 const oldEnd=state.agencyContractEndWeek;
 state.agencyHistory.push({agencyId:preview.agency.id,name:preview.agency.name,signedWeek:state.agencySignedWeek,endWeek:oldEnd,endedReason:"renewed",contractTerms:structuredClone(state.agencyContractTerms||preview.agency.contract)});
 state.agencySignedWeek=oldEnd+1;state.agencyContractEndWeek=oldEnd+preview.terms.durationWeeks;state.agencyContractTerms={...preview.terms};state.agencyRenewalCount=(state.agencyRenewalCount||0)+1;
 state.flags.push({week:state.week,label:`完成續約：${preview.agency.name}`,note:`新合約延長至第 ${state.agencyContractEndWeek} 週，抽成調整為 ${Math.round(preview.terms.commissionRate*100)}%。`});
 return{ok:true,message:`續約完成！新合約至第 ${state.agencyContractEndWeek} 週，抽成 ${Math.round(preview.terms.commissionRate*100)}%。`};
}
