import { state } from "../core/state.js";
import { JOB_BY_ID } from "../data/jobs.js";
import { jobSource } from "../logic/industry.js";
import { applyForJob, scheduleJobAudition, signJob, scheduleJobSession, ensureJobState } from "../logic/job-engine.js";
import { scheduleSequelSession } from "../logic/sequel-engine.js";
import { render } from "../render.js";
import { bindDeferredSearch } from "../core/deferred-search.js";

export function bindJobs() {
  bindDeferredSearch("[data-job-query]",(value)=>{state.jobQuery=value},()=>render({persist:false}));
  document.querySelector("[data-job-sort]")?.addEventListener("change",(event)=>{state.jobSort=event.currentTarget.value;render()});
  document.querySelector("[data-job-status]")?.addEventListener("change",(event)=>{state.jobStatusFilter=event.currentTarget.value;render()});
  document.querySelector("[data-clear-job-filters]")?.addEventListener("click",()=>{state.jobQuery="";state.jobStatusFilter="all";state.jobSort="deadline";render()});
  document.querySelectorAll("[data-select-job]").forEach((button) => button.onclick = () => { state.selectedJobId = button.dataset.selectJob; render(); Promise.resolve().then(() => document.querySelector(".job-detail")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" })); });
  document.querySelectorAll("[data-sequel-schedule]").forEach((button) => button.onclick = () => { const result = scheduleSequelSession(button.dataset.sequelSchedule); state.notice = result.message; if (result.ok) state.appOpen = "planner"; render(); });
  document.querySelectorAll("[data-job-action]").forEach((button) => button.onclick = () => {
    const id = button.dataset.jobId, action = button.dataset.jobAction, source = action === "apply" ? jobSource(JOB_BY_ID[id]) : null, record = ensureJobState(id);
    if (action === "apply" && applyForJob(id)) { record.sourceType = source.type; record.referrerId = source.referrerId || null; record.sourceAgencyId = source.agencyId || null; }
    if (action === "schedule-audition" || action === "retry") { const day = button.dataset.jobDay == null ? null : Number(button.dataset.jobDay), result = scheduleJobAudition(id, day); state.notice = result.message; if (result.ok) state.appOpen = "planner"; }
    if (action === "sign") signJob(id);
    if (action === "schedule") { const day = button.dataset.jobDay == null ? null : Number(button.dataset.jobDay), result = scheduleJobSession(id, day); state.notice = result.message; if (result.ok) state.appOpen = "planner"; }
    record.notice = record.notice || "";
    render();
  });
  document.querySelectorAll("[data-open-cast-npc]").forEach((button) => button.onclick = () => { const job=JOB_BY_ID[state.selectedJobId];state.appReturnContext={app:"jobs",label:job?`返回《${job.title}》`:"返回工作信箱"};state.selectedNpc=button.dataset.openCastNpc; state.peopleSection="profiles"; state.appOpen="people"; state.npcArtView="bust"; render(); });
}
