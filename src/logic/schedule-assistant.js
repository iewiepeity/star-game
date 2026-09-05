import { state } from "../core/state.js";
import { ACTIONS } from "../data/actions.js";
import { scheduleJobSession } from "./job-engine.js";

export const SCHEDULE_PRESETS = {
  balanced: {
    label: "穩定成長",
    note: "兩天訓練、一次實戰、一次探索與充足休息",
    plan: ["acting", "rest", "vocal", "audition", "free", "rest", "rest"],
    locations: { 4: "park" },
  },
  actor: {
    label: "演員路線",
    note: "表演、形象、口條與公開試鏡",
    plan: ["acting", "image", "rest", "audition", "speech", "rest", "study"],
  },
  singer: {
    label: "唱作路線",
    note: "歌藝、詞曲、街頭舞台與恢復",
    plan: [
      "vocal",
      "songwriting",
      "rest",
      "street",
      "creation",
      "rest",
      "rest",
    ],
  },
  social: {
    label: "人脈曝光",
    note: "口條、社交、公開實戰與城市探索",
    plan: ["speech", "networking", "free", "audition", "rest", "free", "rest"],
    locations: { 2: "business", 5: "radio" },
  },
  recovery: {
    label: "養身恢復",
    note: "保留少量進修，其餘時間修復狀態",
    plan: ["rest", "study", "rest", "free", "rest", "rest", "rest"],
    locations: { 3: "park" },
  },
};

const protectedDay = (i) =>
  ["job_session", "personal_task", "agency_interview"].includes(
    state.schedule[i],
  );
export function applySchedulePreset(id) {
  if (state.forcedRestWeek === state.week)
    return { ok: false, message: "本週是強制休養週，醫囑比範本大聲。" };
  const preset = SCHEDULE_PRESETS[id];
  if (!preset) return { ok: false, message: "找不到這份排程範本。" };
  let changed = 0;
  for (let i = 0; i < 7; i++) {
    if (protectedDay(i)) continue;
    const action = preset.plan[i];
    if (!ACTIONS[action]) continue;
    state.schedule[i] = action;
    state.freeLocations[i] =
      action === "free" ? preset.locations?.[i] || "park" : null;
    state.scheduledJobIds[i] = null;
    state.scheduledActivityIds[i] = null;
    changed++;
  }
  return {
    ok: true,
    changed,
    message: `已套用「${preset.label}」；保留 ${7 - changed} 天既有的重要預約。`,
  };
}

export function scheduleDueWork() {
  if (state.forcedRestWeek === state.week)
    return { ok: false, count: 0, message: "強制休養週不能安插工作。" };
  const records = Object.values(state.activeJobs || {})
    .filter((record) => record.stage === "active")
    .sort(
      (a, b) =>
        a.deadlineWeek - b.deadlineWeek ||
        b.remainingSessions - a.remainingSessions,
    );
  let count = 0;
  for (const record of records) {
    while (
      record.remainingSessions >
      state.schedule.filter(
        (action, index) =>
          action === "job_session" &&
          state.scheduledJobIds[index] === record.jobId,
      ).length
    ) {
      const result = scheduleJobSession(record.jobId);
      if (!result.ok) break;
      count++;
    }
  }
  return {
    ok: count > 0,
    count,
    message: count
      ? `依截止日自動排入 ${count} 次正式通告；仍可逐日調整。`
      : records.length
        ? "本週指定工作日沒有可用空檔，或工作已安排完成。"
        : "目前沒有執行中的正式通告。",
  };
}

export function copyRoutineWeek() {
  if (state.forcedRestWeek === state.week || !state.lastSchedule)
    return { ok: false, message: "目前無法沿用上週行程。" };
  let kept = 0;
  for (let day = 0; day < 7; day++) {
    if (protectedDay(day)) {
      kept++;
      continue;
    }
    const previous = state.lastSchedule[day],
      action = ACTIONS[previous];
    const id =
      action &&
      !action.hidden &&
      !["agency_interview", "personal_task", "job_session"].includes(previous)
        ? previous
        : "rest";
    state.schedule[day] = id;
    state.freeLocations[day] =
      id === "free" ? state.lastFreeLocations?.[day] || "park" : null;
    state.scheduledJobIds[day] = null;
    state.scheduledActivityIds[day] = null;
  }
  return {
    ok: true,
    message: `已沿用上週例行安排；保留 ${kept} 天重要預約，未重複一次性工作。`,
  };
}
export function restRoutineWeek() {
  if (state.forcedRestWeek === state.week)
    return { ok: false, message: "本週依醫囑休養。" };
  let kept = 0;
  for (let day = 0; day < 7; day++) {
    if (protectedDay(day)) {
      kept++;
      continue;
    }
    state.schedule[day] = "rest";
    state.freeLocations[day] = null;
    state.scheduledJobIds[day] = null;
    state.scheduledActivityIds[day] = null;
  }
  return { ok: true, message: `例行安排已改為休息；保留 ${kept} 天重要預約。` };
}
