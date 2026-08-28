import{JOB_CATALOG as BASE_JOB_CATALOG,JOB_CATEGORIES}from"./jobs-catalog.js";
import{EXTRA_JOB_CATALOG}from"./jobs-expansion.js";
export{JOB_CATEGORIES};
export const JOB_CATALOG=Object.freeze([...BASE_JOB_CATALOG,...EXTRA_JOB_CATALOG]);
export const JOB_BY_ID=Object.freeze(Object.fromEntries(JOB_CATALOG.map(item=>[item.id,item])));
export const jobsByTier=(stars,category=null)=>JOB_CATALOG.filter(item=>item.stars===stars&&(!category||item.category===category));
