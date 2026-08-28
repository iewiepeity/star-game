import{state}from"../core/state.js";
import{applyForJob,startJobAudition,resolveAudition,signJob,scheduleJobSession,ensureJobState}from"../logic/job-engine.js";
import{render}from"../render.js";

export function bindJobs(){
 document.querySelectorAll("[data-select-job]").forEach(button=>button.onclick=()=>{state.selectedJobId=button.dataset.selectJob;render()});
 document.querySelectorAll("[data-job-action]").forEach(button=>button.onclick=()=>{const id=button.dataset.jobId,action=button.dataset.jobAction,record=ensureJobState(id);if(action==="apply")applyForJob(id);if(action==="start-audition"||action==="retry")startJobAudition(id);if(action==="sign")signJob(id);if(action==="schedule"){const result=scheduleJobSession(id);state.notice=result.message;if(result.ok)state.appOpen="planner"}record.notice=record.notice||"";render()});
 document.querySelectorAll("[data-audition-choice]").forEach(button=>button.onclick=()=>{resolveAudition(button.dataset.jobId,button.dataset.auditionChoice);render()});
}
