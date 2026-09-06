import { state } from "../core/state.js";
import { ACTIONS } from "../data/actions.js";
import { isAgencyContractActive } from "./agency.js";
export function newcomerWeek() {
  return state.week === 1 && !isAgencyContractActive();
}
export function weeklyTaskCounts(planned = false, plannedKinds = []) {
  const counts = { train: 0, work: 0, visit: 0, life: 0 };
  for (let day = 0; day < 7; day++) {
    const result = state.weekResults?.find((x) => x.dayIndex === day),
      id = state.schedule[day];
    const task = Object.values(state.scheduledActivities || {}).find(
      (x) =>
        x.week === state.week &&
        x.day === day &&
        x.status === (planned && !result ? "scheduled" : "completed"),
    );
    if (!planned && !result?.success) continue;
    if (planned && result && !result.success) continue;
    const type = ACTIONS[result?.actionId || id]?.type;
    const taskKind = result?.taskKind || task?.kind || (planned && !result ? plannedKinds[day] : null);
    if (type === "train") counts.train++;
    if (
      id === "free" &&
      (planned ||
        state.visitedLocationsByWeek?.[state.week]?.includes(
          state.freeLocations[day],
        ))
    )
      counts.visit++;
    if (
      ["work", "job", "interview"].includes(type) ||
      [
        "job_audition",
        "manager_interact",
        "creative_work",
        "creative_production",
        "creative_revision",
        "sequel_session",
      ].includes(taskKind)
    )
      counts.work++;
    if (
      ["rest", "free", "social"].includes(type) ||
      ["rest", "free"].includes(id) ||
      ["npc_interact", "social_post"].includes(taskKind)
    )
      counts.life++;
  }
  return counts;
}
export function weeklyTaskReady(counts) {
  if (newcomerWeek()) return counts.visit >= 1 && counts.work >= 1;
  return (
    (counts.train >= 2 && counts.work >= 1) ||
    counts.work >= 3 ||
    (state.week >= 9 && counts.work >= 1 && counts.life >= 2)
  );
}
export function weeklyTaskInfo() {
  const signed = isAgencyContractActive();
  return {
    label: newcomerWeek()
      ? "在星望市安頓下來"
      : state.week < 9
        ? "新人職涯準備"
        : "安排自己的步調",
    desc: newcomerWeek()
      ? "探訪 1 次＋職涯活動 1 次＋週末疲勞 ≤ 60"
      : `訓練 2 天＋職涯活動 1 天，或職涯活動 3 天${state.week >= 9 ? "，或職涯活動 1 天＋生活／休息 2 天" : ""}；週末疲勞 ≤ 60`,
    rewardText: signed
      ? "$2,000・業界評價＋2"
      : newcomerWeek()
        ? "$1,500・新人生活補助"
        : "$1,500・簽約＋10%",
  };
}
export function weeklyTaskMarkup(plannedKinds = []) {
  if (state.forcedRestWeek === state.week)
    return `<section class="weekly-task"><b>醫療休養中・行程不可修改</b><p>先把七天留給恢復，這週不用追趕職涯目標。</p></section>`;
  const done = weeklyTaskCounts(),
    plan = weeklyTaskCounts(true, plannedKinds),
    task = weeklyTaskInfo();
  return `<section class="weekly-task" aria-label="每週目標"><details><summary>${task.label} · 職涯 ${done.work}／${plan.work}（完成／安排）</summary><p>${task.desc}</p><p>已完成：訓練 ${done.train}・職涯 ${done.work}・生活 ${done.life}・探訪 ${done.visit}</p><p>依目前安排：訓練 ${plan.train}・職涯 ${plan.work}・生活 ${plan.life}・探訪 ${plan.visit}。${weeklyTaskReady(plan) ? "活動條件可達成，仍需留意週末疲勞。" : "可自由調整，尚未滿足活動條件。"}</p><small>職涯活動包含打工、正式通告、完成試鏡（落選也計）、經紀人規劃與創作製作。生活包含休息、探訪、正式好友邀約與社群更新。</small></details></section>`;
}
export function evaluateWeeklyTask() {
  const prior = state.weeklyTaskHistory?.find((x) => x.week === state.week);
  if (prior?.met) return prior;
  const counts = weeklyTaskCounts(),
    orientation = newcomerWeek(),
    met = weeklyTaskReady(counts) && state.fatigue <= 60,
    signed = isAgencyContractActive(),
    money = met ? (signed ? 2000 : 1500) : 0;
  if (met) {
    state.money += money;
    if (signed)
      state.rep.業界評價 = Math.min(1000, (state.rep.業界評價 || 0) + 2);
    else if (!orientation)
      state.contract = Math.min(100, (state.contract || 0) + 10);
  }
  state.weeklyTaskHistory ??= [];
  const result = {
    week: state.week,
    met,
    money,
    ...counts,
    fatigue: state.fatigue,
    signed,
    orientation,
  };
  if (prior) Object.assign(prior, result);
  else state.weeklyTaskHistory.push(result);
  return result;
}
