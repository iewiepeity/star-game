import { state } from "../core/state.js";
import { capturePlannerTransaction, restoreStateFields } from "../core/state-transaction.js";
import { scheduleActivity, cancelActivity } from "./scheduled-activities.js";
import { reserveCreativeTeam } from "./creative-team.js";
import { creativeActionState } from "./creative-workflow.js";

const REPEATABLE = { creative_work: "work", creative_production: "produce" };
export function queuedCreativeDays(projectId, kind) {
  return Object.values(state.scheduledActivities || {}).filter(
    (a) => a.status === "scheduled" && a.week === state.week &&
      a.kind === kind && a.payload?.projectId === projectId,
  ).length;
}
export function queueCreativeActivity(kind, payload, label, load, { reserveTeam = kind === "creative_production" } = {}) {
  const project = state.creativeProjects?.find((p) => p.id === payload.projectId);
  if (!project) return { ok: false, message: "作品不存在。" };
  if (REPEATABLE[kind]) {
    const action = creativeActionState(project, REPEATABLE[kind]);
    if (!action.ok) return { ok: false, message: action.reason };
  } else if (queuedCreativeDays(project.id, kind)) {
    return { ok: false, message: "這份作品已經有同類行程在排隊了。" };
  }
  const snapshot = reserveTeam ? capturePlannerTransaction(state) : null;
  const result = scheduleActivity(kind, payload, label, load);
  if (result.ok && reserveTeam) {
    const booking = reserveCreativeTeam(project, state.week, result.day);
    if (!booking.ok) {
      restoreStateFields(state, snapshot);
      return booking;
    }
  }
  return result;
}

// Once a phase is finished, spare days become rest instead of failed work days.
export function releaseFinishedCreativeDays(task, project) {
  if (!REPEATABLE[task.kind] || creativeActionState(project, REPEATABLE[task.kind]).ok) return 0;
  let count = 0;
  for (let day = (task.day ?? state.runnerDay) + 1; day < 7; day++) {
    const next = state.scheduledActivities?.[state.scheduledActivityIds?.[day]];
    if (next?.status === "scheduled" && next.week === state.week &&
        next.kind === task.kind && next.payload?.projectId === project.id) {
      cancelActivity(day);
      count++;
    }
  }
  return count;
}
