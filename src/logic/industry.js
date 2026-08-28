import{INDUSTRY_COMPANIES}from"../data/industry.js";
import{JOB_CATALOG}from"../data/jobs-catalog.js";
import{state}from"../core/state.js";
import{availableJobs}from"./job-engine.js";

export function companyForLocation(locationId){return Object.values(INDUSTRY_COMPANIES).find(c=>c.locationId===locationId)||null}
export function discoverCompany(locationId){const company=companyForLocation(locationId);if(!company)return null;state.discoveredCompanies??=[];if(!state.discoveredCompanies.includes(company.id))state.discoveredCompanies.push(company.id);return company}
export function jobSource(job){const company=Object.values(INDUSTRY_COMPANIES).find(c=>c.categories.includes(job.category));if(!company)return{type:"public",company:null};const knownIndustryNpc=state.knownPeople.length>0&&Object.values(state.relationships||{}).some(r=>(r.closeness||0)>=20||(r.trust||0)>=10);if((state.completedWorks?.length||0)>=8&&state.fame>=80)return{type:"direct",company};if(state.currentAgencyId)return{type:"agency",company};if(knownIndustryNpc&&job.stars>=3)return{type:"network",company};return{type:"public",company}}
export function jobsVisibleAt(locationId){const company=companyForLocation(locationId);if(!company)return[];const unlocked=new Set(availableJobs().map(j=>j.id));return JOB_CATALOG.filter(job=>company.categories.includes(job.category)&&(unlocked.has(job.id)||state.activeJobs[job.id]))}
export function canAccessJob(job){const source=jobSource(job),record=state.activeJobs[job.id];if(record)return{ok:true,source};if(source.type==="agency"||source.type==="network"||source.type==="direct")return{ok:true,source};const visited=state.visitedIndustryLocations||[];return{ok:visited.includes(source.company?.locationId),source}}
export function markIndustryVisit(locationId){state.visitedIndustryLocations??=[];if(!state.visitedIndustryLocations.includes(locationId))state.visitedIndustryLocations.push(locationId);return discoverCompany(locationId)}
