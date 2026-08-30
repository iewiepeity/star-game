import { ACTIONS } from "../data/actions.js";
import { FOCUSES } from "../data/focuses.js";
import { AGENCIES } from "../data/agencies.js";
import { MAP_LOCATIONS } from "../data/map-locations.js";
import { DAYS, SHORT } from "../data/calendar.js";
import { state } from "../core/state.js";
import { esc, money } from "../core/utils.js";
import { JOB_BY_ID } from "../data/jobs.js";
import { activityForDay } from "../logic/scheduled-activities.js";
import { weeklyTaskInfo } from "../logic/weekly-task.js";
import { SCHEDULE_PRESETS } from "../logic/schedule-assistant.js";
import { jobScheduleOptions } from "../logic/job-engine.js";

function activeJobAlerts() {
  return Object.values(state.activeJobs || {}).filter((record) => ["passed", "active"].includes(record.stage)).map((record) => {
    const job = JOB_BY_ID[record.jobId];
    if (!job) return "";
    if (record.stage === "passed") return `<article class="contract-alert contract-awaiting"><span>試鏡通過・等待簽約</span><b>${esc(job.title)}</b><strong>${esc(job.client)}已送出正式合約</strong><small>可直接在行程 App 簽署，不必回工作信箱。</small><button data-planner-sign-job="${job.id}">立即簽約 →</button></article>`;
    const scheduled = state.scheduledJobIds.filter((id) => id === job.id).length;
    const viable = job.workDays.filter((day) => state.schedule[day] === "rest" || state.scheduledJobIds[day] === job.id || state.schedule[day] === "job_session").length;
    const pressure = record.deadlineWeek <= state.week + 1 && scheduled < Math.min(record.remainingSessions, viable) ? "・本週可用工作日偏少" : "";
    return `<article class="contract-alert"><span>進行中通告</span><b>${esc(job.title)}</b><strong>剩餘 ${record.remainingSessions} 次・第 ${record.deadlineWeek} 週截止${pressure}</strong><small>指定工作日：${job.workDays.map((index) => DAYS[index]).join("、")}・本週已排 ${scheduled} 次</small><button data-planner-focus-job="${job.id}">在下方排入工作 →</button></article>`;
  }).join("");
}
export function budget() { return state.schedule.reduce((s, id, i) => s + (ACTIONS[id]?.cost || 0) + (id === "personal_task" ? activityForDay(i)?.cost || 0 : 0), 0); }
export function forecastFatigue() { return state.schedule.reduce((s, id, i) => Math.max(0, s + (ACTIONS[id]?.fatigue || 0) + (id === "personal_task" ? activityForDay(i)?.fatigue || 0 : 0)), state.fatigue); }
function fatigueTrend(fat) { const delta=fat-state.fatigue; if(fat>=85)return"高風險"; if(delta>=30)return"明顯上升"; if(delta>=10)return"小幅上升"; if(delta<=-15)return"明顯恢復"; return"大致穩定"; }
function contractConflictPreview(){
  const risks=[];
  for(const record of Object.values(state.activeJobs||{})){
    if(record.stage!=="active"||record.deadlineWeek-state.week>1)continue;
    const job=JOB_BY_ID[record.jobId]; if(!job)continue;
    const scheduled=state.scheduledJobIds.filter(id=>id===job.id).length;
    const open=job.workDays.filter(day=>state.schedule[day]==="rest"||state.scheduledJobIds[day]===job.id).length;
    if(record.remainingSessions>scheduled+open)risks.push(`《${job.title}》即使把本週可用指定日全排滿，仍可能需要下週立刻處理`);
    else if(record.remainingSessions>scheduled)risks.push(`《${job.title}》還需要 ${record.remainingSessions-scheduled} 次，本週仍有 ${open} 個可排指定日`);
  }
  return risks[0]||null;
}
function plannerCommandBar(fat,spend){
  const urgent=Object.values(state.activeJobs||{}).filter(r=>r.stage==="active"&&r.deadlineWeek-state.week<=1).length, conflict=contractConflictPreview();
  const risk=state.health<=45||fat>=85?"高風險：先保住健康":conflict?"期限與可用工作日正在互相擠壓":urgent?`${urgent} 份通告接近違約`:spend>state.money?"本週預算不足":"排程目前可執行";
  return `<section class="planner-command-bar"><header><span>WEEK CONTROL</span><b>${risk}</b></header><div><span>健康 <b>${state.health}</b></span><span>體力 <b>${state.stamina}</b></span><span>心情 <b>${state.mood}</b></span><span>疲勞趨勢 <b>${fatigueTrend(fat)}</b></span><span>剩餘資金 <b>${money(state.money-spend)}</b></span></div>${conflict?`<strong class="planner-conflict">⚠ ${esc(conflict)}</strong>`:""}<small>先看期限衝突與狀態趨勢，再點日期排入行程；不顯示成功骰值，只提醒你能合理預見的風險。</small></section>`;
}
export function plannerApp() {
  const forced = state.forcedRestWeek === state.week, spend = budget(), fat = forecastFatigue(), train = state.schedule.filter((id) => ACTIONS[id]?.type === "train").length, work = state.schedule.filter((id) => ["work", "job"].includes(ACTIONS[id]?.type)).length, task = weeklyTaskInfo(), focus = FOCUSES[state.focus] || FOCUSES.growth;
  return `<div class="planner-app">${plannerCommandBar(fat,spend)}${forced ? `<div class="forced-rest-banner"><i>✚</i><div><span>MEDICAL RECOVERY WEEK</span><b>本週為強制休養週</b><p>七天行程已由醫療安排鎖定為休息，不能替換、複製或插入其他活動。完成本週後才會恢復正常排程。</p></div></div>` : `${activeJobAlerts()}<div class="week-brief"><div><span>本週任務</span><b>${task.label}</b><small>${task.desc}</small></div><strong>獎勵<br><b>${task.rewardText}</b></strong></div><section class="focus-panel"><div class="focus-row"><span>本週策略</span>${Object.entries(FOCUSES).map(([id, f]) => `<button class="${state.focus === id ? "active" : ""}" data-focus="${id}" title="${f.note}">${f.icon} ${f.label}</button>`).join("")}</div><div class="focus-explainer"><i>${focus.icon}</i><span><small>已套用到本週所有相關結算・${focus.badge}</small><b>${focus.label}</b><em>${focus.note}</em></span><strong>${state.focus==="growth"?"例：訓練原本＋5，本週會變＋6":state.focus==="fame"?"例：公開試鏡成功率直接＋5%，成功再多 2 知名度":"例：初次認識與正向互動會額外增加關係"}</strong></div></section>`}<div class="calendar-head"><div><b>第 ${state.week} 週</b><small>${forced ? "身體正在恢復；本週所有行程固定為休息。" : "創作、投稿、NPC 約會與正式社群更新也會占用一天；一週真的只有七天。"}</small></div>${forced ? "" : `<div><button id="copy" ${state.lastSchedule ? "" : "disabled"}>複製上週</button><button id="rest-all">全部休息</button></div>`}</div><div class="ipad-calendar ${forced ? "forced-rest-calendar" : ""}">${state.schedule.map((id, i) => calendarDay(id, i, forced)).join("")}</div><div class="week-check"><span>訓練 <b>${train}/2</b></span><span>工作 <b>${work}/1</b></span><span>疲勞趨勢 <b class="${fat > 60 ? "bad" : ""}">${fatigueTrend(fat)}</b></span><span>本週支出 <b class="${spend > state.money ? "bad" : ""}">${money(spend)}</b></span><em>${forced ? "醫療休養中・行程不可修改" : spend > state.money ? "預算不足，請調整行程" : fat > 60 ? "高疲勞可能拖累本週表現" : "本週任務條件可達成"}</em></div>${state.notice ? `<div class="mini-toast">✓ ${esc(state.notice)}</div>` : ""}${forced ? `<section class="forced-rest-lock"><b>🔒 本週排程已鎖定</b><p>按「開始這週」後會依序完成七天休養；不計算一般週任務。</p></section>` : activityPicker()}</div>`;
}
export function calendarDay(id, i, forced = false) {
  const a = ACTIONS[id] || ACTIONS.rest, locationId = id === "free" ? state.freeLocations[i] : null, freePlace = locationId ? MAP_LOCATIONS[locationId]?.name : null, interviewLabel = id === "agency_interview" && state.agencyInterview ? `${AGENCIES[state.agencyInterview.agencyId].shortName}面談` : null, assignedJob = id === "job_session" ? JOB_BY_ID[state.scheduledJobIds[i]] : null, personal = id === "personal_task" ? activityForDay(i) : null, dueDay = !forced && Object.values(state.activeJobs || {}).some((record) => record.stage === "active" && JOB_BY_ID[record.jobId]?.workDays.includes(i));
  return `<button class="calendar-cell ${!forced && state.selectedDay === i ? "selected" : ""} ${dueDay ? "due-day" : ""} ${id === "agency_interview" || id === "personal_task" ? "important-day" : ""}" data-day="${i}" aria-pressed="${!forced && state.selectedDay === i}" aria-label="${DAYS[i]}：${forced ? "強制休養" : assignedJob ? assignedJob.title : personal?.label || interviewLabel || freePlace || a.short}" ${forced ? "disabled" : ""}><span>${i + 1}<small>週${SHORT[i]}</small></span><i class="${a.type}" aria-hidden="true">${a.icon}</i><b>${forced ? "強制休養" : assignedJob ? assignedJob.title : personal?.label || interviewLabel || freePlace || a.short}</b><em>${forced ? "醫療鎖定" : assignedJob ? "正式通告" : personal ? `${personal.cost ? money(personal.cost) : "已預約"}` : id === "agency_interview" ? "不收費・重要行程" : a.cost ? money(a.cost) : "免費"}</em></button>`;
}
export function activityPicker() {
  const entries = Object.entries(ACTIONS).filter(([id, a]) => !a.hidden && id !== "agency_interview" && (state.filter === "全部" || a.group === state.filter));
  const showJobs = ["全部", "工作"].includes(state.filter), selectedDay = state.selectedDay;
  const jobEntries = showJobs ? Object.values(state.activeJobs || {}).filter((record) => ["passed", "active"].includes(record.stage)).map((record) => {
    const job = JOB_BY_ID[record.jobId];
    if (!job) return "";
    if (record.stage === "passed") return `<button class="planner-job-entry contract-ready" data-planner-sign-job="${job.id}"><i class="job">✎</i><span><b>簽署《${esc(job.title)}》</b><small>${esc(job.client)}・試鏡已通過，簽約後即可排工作</small></span><em>簽約<small>不占一天</small></em></button>`;
    const allowed = jobScheduleOptions(job.id).some((option) => option.day === selectedDay), alreadyHere = state.schedule[selectedDay] === "job_session" && state.scheduledJobIds[selectedDay] === job.id;
    const reason = alreadyHere ? "已排在這一天" : allowed ? `排入${DAYS[selectedDay]}` : job.workDays.includes(selectedDay) ? "這天已有行程或共演檔期衝突" : `指定${job.workDays.map((day) => `週${SHORT[day]}`).join("、")}`;
    return `<button class="planner-job-entry ${alreadyHere ? "active" : ""}" data-planner-job="${job.id}" data-job-day="${selectedDay}" ${allowed ? "" : "disabled"}><i class="job">🎥</i><span><b>《${esc(job.title)}》正式通告</b><small>剩餘 ${record.remainingSessions} 次・第 ${record.deadlineWeek} 週截止</small></span><em>${reason}</em></button>`;
  }).join("") : "";
  const assistant = `<details class="schedule-assistant"><summary><span>✦ 排程小幫手</span><b>少排一點行政，多活一點人生</b><em>展開</em></summary><div class="preset-list">${Object.entries(SCHEDULE_PRESETS).map(([id, preset]) => `<button data-schedule-preset="${id}"><b>${preset.label}</b><small>${preset.note}</small></button>`).join("")}</div><button class="schedule-work-all" data-schedule-work>依截止日排入本週正式通告</button><p>範本不會覆蓋已排定的通告、試鏡、創作或人物約會。</p></details>`;
  return `${assistant}<div class="planner-day-actions"><button class="planner-clear-day" data-clear-day="${selectedDay}" ${state.schedule[selectedDay] === "rest" ? "disabled" : ""}>清除${DAYS[selectedDay]}行程</button></div><section class="activity-picker"><header><div><span>接下來排入</span><b>${DAYS[state.selectedDay]}</b></div><nav>${["全部", "訓練", "工作", "生活", "休息"].map((f) => `<button class="${state.filter === f ? "active" : ""}" data-filter="${f}" aria-pressed="${state.filter === f}">${f}</button>`).join("")}</nav></header><div class="picker-list">${jobEntries}${entries.map(([id, a]) => `<button class="${state.schedule[state.selectedDay] === id ? "active" : ""}" data-pick="${id}" aria-pressed="${state.schedule[state.selectedDay] === id}"><i class="${a.type}" aria-hidden="true">${a.icon}</i><span><b>${a.label}</b><small>${a.note}</small></span><em>${a.cost ? money(a.cost) : "免費"}<small>疲勞 ${a.fatigue > 0 ? "+" : ""}${a.fatigue}</small></em></button>`).join("")}</div></section>`;
}
