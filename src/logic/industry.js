import{INDUSTRY_COMPANIES}from"../data/industry.js";
import{NPC_CAREER_PROFILES}from"../data/npc-network.js";
import{JOB_CATALOG}from"../data/jobs-catalog.js";
import{state}from"../core/state.js";
import{availableJobs}from"./job-engine.js";
import{activeAgencyOffer}from"./agency-offers.js";
export function companyForLocation(locationId){return Object.values(INDUSTRY_COMPANIES).find(c=>c.locationId===locationId)||null}
export function discoverCompany(locationId){const company=companyForLocation(locationId);if(!company)return null;state.discoveredCompanies??=[];if(!state.discoveredCompanies.includes(company.id))state.discoveredCompanies.push(company.id);return company}
function relevantContact(job){return Object.entries(state.relationships||{}).filter(([id,r])=>state.knownPeople.includes(id)&&NPC_CAREER_PROFILES[id]?.specialties.includes(job.category)&&(r.closeness||0)>=35&&(r.trust||0)>=20).sort((a,b)=>(b[1].trust||0)-(a[1].trust||0))[0]?.[0]||null}
export function jobSource(job){const company=Object.values(INDUSTRY_COMPANIES).find(c=>c.categories.includes(job.category));if(!company)return{type:"public",company:null};const existing=state.activeJobs[job.id];if(existing)return{type:existing.sourceType||"public",company,referrerId:existing.referrerId||null};if(state.fame>=220&&(state.completedWorks?.length||0)>=12&&job.stars<=Math.min(5,2+Math.floor(state.fame/180)))return{type:"direct",company};const offer=activeAgencyOffer(job.id);if(offer)return{type:"agency",company,agencyId:offer.agencyId};const referrerId=job.stars>=3?relevantContact(job):null;if(referrerId)return{type:"network",company,referrerId};return{type:"public",company}}
export function jobsVisibleAt(locationId){const company=companyForLocation(locationId);if(!company)return[];const unlocked=new Set(availableJobs().map(j=>j.id));return JOB_CATALOG.filter(job=>company.categories.includes(job.category)&&(unlocked.has(job.id)||state.activeJobs[job.id]))}
export function canAccessJob(job){const source=jobSource(job),record=state.activeJobs[job.id];if(record)return{ok:true,source};if(["agency","network","direct"].includes(source.type))return{ok:true,source};return{ok:(state.visitedIndustryLocations||[]).includes(source.company?.locationId),source}}
export function markIndustryVisit(locationId){state.visitedIndustryLocations??=[];if(!state.visitedIndustryLocations.includes(locationId))state.visitedIndustryLocations.push(locationId);return discoverCompany(locationId)}
