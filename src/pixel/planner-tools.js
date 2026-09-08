import { weeklyTaskMarkup } from "../logic/weekly-task.js";
import { withCore } from "./life.js";
import { FOCUSES } from "../data/focuses.js";
import { CHOICES, planDay, access } from "./life.js";
import { bookCareer } from "./career.js";
import { SCHEDULE_PRESETS } from "../logic/schedule-assistant.js";
const undo = new WeakMap();
const protectedDay = (life, i) =>
  i < life.day ||
  (i === life.day && life.pending) ||
  life.plan[i].id.startsWith("career_") || life.plan[i].id === "home_host" || !!life.plan[i].appointmentId;
// Sequential taps may replace routine plans, but never jump into a reservation
// or wrap back to an earlier day. A date can still be selected explicitly.
export function nextPlanningDay(life, day) {
  for (let next = day + 1; next < life.plan.length; next++) {
    if (!protectedDay(life, next)) return next;
  }
  return day;
}
export function assignmentForAction(action, venue) {
  if (action === "free")
    return {
      id:
        Object.entries(CHOICES).find(
          ([, d]) => d.venue === (venue || "park"),
        )?.[0] || "park",
    };
  return {
    id:
      Object.entries(CHOICES).find(
        ([, d]) => d.action === action && !d.group?.includes("約定"),
      )?.[0] || "rest",
  };
}
const fingerprint = (life) =>
  JSON.stringify([
    life.day,
    life.game.week,
    life.ledger,
    life.plan,
    life.game.scheduledActivities,
    life.game.scheduledActivityIds,
    life.game.npcSchedules,
    life.game.money,
    life.game.fatigue,
    life.game.stats,
    life.game.completedWorks,
    life.game.eventHistory,
    life.game.relationships,
    life.game.socialPosts,
    life.game.homeLife,
    life.game.cityLife,
    life.game.activeJobs,
    life.game.agencyApplications,
    life.game.agencyOffer,
    life.game.currentAgencyId,
    life.game.creativeProjects,
    life.game.eventQueue,
  ]);
export function applyPlannerTool(life, id) {
  if (life.game.endingResult || life.game.forcedRestWeek === life.game.week)
    return { ok: false, message: "目前無法調整行程" };
  if (id === "undo") {
    const previous = undo.get(life);
    if (!previous || previous.fingerprint !== fingerprint(life))
      return { ok: false, message: "行動或資源已更新，無法復原舊的排程" };
    const { plan, game } = previous.state;
    life.plan = structuredClone(plan);
    for (const key of [
      "schedule",
      "freeLocations",
      "scheduledJobIds",
      "scheduledActivityIds",
      "scheduledActivities",
      "activeJobs",
      "npcSchedules",
      "agencyApplications",
      "agencyInterview",
    ])
      life.game[key] = structuredClone(game[key]);
    undo.delete(life);
    return { ok: true, message: "已復原上一次排程助手的變更" };
  }
  if (id === "repeat" && !life.previousPlan)
    return { ok: false, message: "還沒有上一週行程" };
  const snapshot = structuredClone(life);
  let count = 0;
  if (id === "due") {
    const jobs = Object.values(life.game.activeJobs)
      .filter((j) => j.stage === "active")
      .sort((a, b) => a.deadlineWeek - b.deadlineWeek);
    for (const job of jobs)
      for (let day = life.day; day < 7; day++) {
        if (
          protectedDay(life, day) ||
          !["rest", "park"].includes(life.plan[day].id)
        )
          continue;
        const r = bookCareer(life, CHOICES, "job", { jobId: job.jobId }, day);
        if (r.ok) count++;
      }
  } else {
    if (!["repeat", "rest"].includes(id) && !SCHEDULE_PRESETS[id])
      return { ok: false, message: "找不到這份範本" };
    for (let day = life.day; day < 7; day++) {
      if (protectedDay(life, day)) continue;
      let a =
        id === "rest"
          ? { id: "rest" }
          : id === "repeat"
            ? structuredClone(life.previousPlan[day])
            : assignmentForAction(
                SCHEDULE_PRESETS[id].plan[day],
                SCHEDULE_PRESETS[id].locations?.[day],
              );
      if (a.id.startsWith("career_") || ["relief_gig", "home_host", "city_date", "city_collab"].includes(a.id) || a.regularId)
        a = { id: "rest" };
      if (!access(life, a, day) && !planDay(life, day, a)) count++;
    }
  }
  if (count)
    undo.set(life, { state: snapshot, fingerprint: fingerprint(life) });
  return {
    ok: count > 0,
    message: count
      ? `已調整 ${count} 天；保留已完成日期與正式約定。`
      : "沒有可以調整的空檔，或目前沒有待安排的正式通告。",
  };
}
export function plannerToolsMarkup(life) {
  return `<details class="planner-tools"><summary>排程助手 · 範本與復原</summary><p class="tiny-note">保留已完成日期和正式約定；待辦通告只使用休息或公園的空檔。</p><div class="buttons">${Object.entries(
    SCHEDULE_PRESETS,
  )
    .map(([id, p]) => `<button data-planner-tool="${id}">${p.label}</button>`)
    .join(
      "",
    )}<button data-planner-tool="repeat" ${life.previousPlan ? "" : "disabled"}>沿用上週</button><button data-planner-tool="rest">例行安排改休息</button><button data-planner-tool="due">優先安排待辦通告</button><button data-planner-tool="undo" ${undo.has(life) ? "" : "disabled"}>復原助手變更</button></div></details>`;
}

export function setWeeklyFocus(life, id) {
  if (!Object.hasOwn(FOCUSES, id))
    return { ok: false, message: "找不到這項策略" };
  if (life.game.endingResult || life.day > 6)
    return { ok: false, message: "下一週開始後再調整策略" };
  if (life.pending)
    return { ok: false, message: "先完成或取消今天的行動，再切換策略" };
  life.game.focus = id;
  return {
    ok: true,
    message: `已改為${FOCUSES[id].label}，從接下來的行動生效`,
  };
}
export function weeklyFocusMarkup(life) {
  const focus = FOCUSES[life.game.focus] || FOCUSES.growth;
  return `${withCore(life, () => weeklyTaskMarkup(life.plan.map(a => a.id === "social" ? "social_post" : a.id === "creative" ? "creative_work" : ["home_host", "home_craft"].includes(a.id) ? a.id : null)))}<section class="weekly-focus" aria-label="本週策略"><div class="section-heading"><b>本週策略</b><small>從接下來的行動生效</small></div><div class="focus-options">${Object.entries(
    FOCUSES,
  )
    .map(
      ([id, f]) =>
        `<button data-weekly-focus="${id}" aria-pressed="${life.game.focus === id}" ${life.pending ? "disabled" : ""}>${f.icon} ${f.label}</button>`,
    )
    .join("")}</div><p class="tiny-note">${focus.note}</p></section>`;
}
