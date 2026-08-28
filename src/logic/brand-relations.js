import{state}from"../core/state.js";
const clamp=n=>Math.max(0,Math.min(100,n));
export function ensureBrand(client){state.brandRelations??={};return state.brandRelations[client]||(state.brandRelations[client]={trust:50,familiarity:0,works:0,failedAuditions:0,breaches:0,lastWeek:0,status:"new",history:[]})}
function refreshStatus(r){r.status=r.trust>=80&&r.works>=2?"preferred":r.trust>=65?"trusted":r.trust<30?"avoid":r.works?"known":"new"}
export function brandRelation(client){const r=ensureBrand(client);refreshStatus(r);return r}
export function brandAuditionModifier(client){const r=brandRelation(client);return Math.round((r.trust-50)/5)+Math.min(8,r.works*2)-Math.min(12,r.failedAuditions)}
export function brandCanWork(client,stars=1){const r=brandRelation(client);return !(r.status==="avoid"&&stars>=3)&&!(r.breaches>=2&&stars>=4)}
export function recordBrandOutcome(client,type,{quality=0}={}){if(!client)return null;const r=ensureBrand(client);let trust=0,familiarity=0;if(type==="completed"){r.works+=1;trust=4+Math.round((quality-60)/15);familiarity=8}else if(type==="audition_failed"){r.failedAuditions+=1;trust=-1;familiarity=2}else if(type==="breached"){r.breaches+=1;trust=-18;familiarity=3}r.trust=clamp(r.trust+trust);r.familiarity=clamp(r.familiarity+familiarity);r.lastWeek=state.week;r.history.push({week:state.week,type,trust,quality});if(r.history.length>20)r.history=r.history.slice(-20);refreshStatus(r);return r}
export function tickBrandRelations(){for(const r of Object.values(state.brandRelations||{})){if(r.lastWeek<state.week-8&&r.trust<50)r.trust=Math.min(50,r.trust+1);if(r.lastWeek<state.week-12&&r.failedAuditions>0)r.failedAuditions-=1;refreshStatus(r)}return state.brandRelations}
