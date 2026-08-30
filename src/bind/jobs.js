import { state } from "../core/state.js";
import { JOB_BY_ID } from "../data/jobs.js";
import { jobSource } from "../logic/industry.js";
import { applyForJob, scheduleJobAudition, signJob, scheduleJobSession, ensureJobState } from "../logic/job-engine.js";
import { scheduleSequelSession } from "../logic/sequel-engine.js";
import { render } from "../render.js";

function enhanceJobList() {
  const catalog = document.querySelector(".job-catalog");
  if (!catalog || catalog.querySelector(".list-tools")) return;
  const tools = document.createElement("div"), input = document.createElement("input"), sort = document.createElement("select"), status = document.createElement("select");
  tools.className = "list-tools job-list-tools";
  input.type = "search";
  input.placeholder = "搜尋工作、委託方或類型";
  input.ariaLabel = "搜尋工作";
  input.value = state.jobQuery || "";
  sort.ariaLabel = "工作排序";
  status.ariaLabel = "工作狀態篩選";
  for (const [value, label] of [["deadline", "目前順序"], ["stars", "星等優先"], ["title", "名稱排序"]]) { const option = document.createElement("option"); option.value = value; option.textContent = label; sort.add(option); }
  for (const [value, label] of [["all", "全部狀態"], ["action", "需要處理"], ["active", "執行中"], ["available", "可接取"]]) { const option = document.createElement("option"); option.value = value; option.textContent = label; status.add(option); }
  tools.append(input, status, sort);
  catalog.querySelector("header")?.after(tools);
  sort.value = state.jobSort || "deadline";
  const apply = () => {
    state.jobQuery = input.value.trim().slice(0, 200);
    state.jobSort = sort.value;
    const cards = [...catalog.querySelectorAll("[data-select-job]")], query = state.jobQuery.toLowerCase();
    cards.forEach((card) => {
      const stage = card.dataset.jobStage;
      const stageMatches = status.value === "all" || stage === status.value || (status.value === "action" && ["applied", "failed", "passed", "audition_scheduled"].includes(stage));
      card.hidden = !stageMatches || !card.textContent.toLowerCase().includes(query);
    });
    if (sort.value !== "deadline") cards.sort((a, b) => sort.value === "stars" ? (b.textContent.match(/★/g)?.length || 0) - (a.textContent.match(/★/g)?.length || 0) : a.textContent.localeCompare(b.textContent, "zh-Hant")).forEach((card) => catalog.append(card));
  };
  input.oninput = apply;
  sort.onchange = apply;
  status.onchange = apply;
  apply();
}

export function bindJobs() {
  enhanceJobList();
  document.querySelectorAll("[data-select-job]").forEach((button) => button.onclick = () => { state.selectedJobId = button.dataset.selectJob; render(); Promise.resolve().then(() => document.querySelector(".job-detail")?.scrollIntoView({ behavior: "smooth", block: "start" })); });
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
  document.querySelectorAll("[data-open-cast-npc]").forEach((button) => button.onclick = () => { state.selectedNpc=button.dataset.openCastNpc; state.peopleSection="profiles"; state.appOpen="people"; state.npcArtView="bust"; render(); });
}
