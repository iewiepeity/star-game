import{state}from"../core/state.js";
import{AGENCIES}from"../data/agencies.js";
import{JOB_CATALOG}from"../data/jobs-catalog.js";
import{availableJobs,jobState}from"./job-engine.js";
import{randomInt}from"../core/rng.js";
const agencyCategoryMap={戲劇:["電影","電視劇"],廣告:["廣告"],綜藝:["綜藝"],音樂:["歌曲"]};
export function refreshAgencyJobOffers(){state.agencyJobOffers=(state.agencyJobOffers||[]).filter(o=>o.expiresWeek>=state.week&&!['completed','breached'].includes(jobState(o.jobId).stage));if(!state.currentAgencyId||state.week>state.agencyContractEndWeek)return state.agencyJobOffers;const agency=AGENCIES[state.currentAgencyId];if(!agency)return state.agencyJobOffers;const existing=new Set(state.agencyJobOffers.filter(o=>o.expiresWeek>=state.week).map(o=>o.jobId)),favored=new Set((agency.specialties||[]).flatMap(x=>agencyCategoryMap[x]||[x]));const pool=availableJobs().filter(j=>jobState(j.id).stage==="available"&&!existing.has(j.id)).sort((a,b)=>(favored.has(b.category)?2:0)-(favored.has(a.category)?2:0)||b.stars-a.stars);const count=Math.min(pool.length,randomInt(2,4));for(const job of pool.slice(0,count))state.agencyJobOffers.push({jobId:job.id,agencyId:agency.id,offeredWeek:state.week,expiresWeek:state.week+1});return state.agencyJobOffers}
export function activeAgencyOffer(jobId){return(state.agencyJobOffers||[]).find(o=>o.jobId===jobId&&o.expiresWeek>=state.week)||null}
