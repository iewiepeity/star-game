import { trainingAccess } from "./city-progression.js";
import { state } from "../core/state.js";
import { ACTIONS } from "../data/actions.js";
import { MAP_LOCATIONS } from "../data/map-locations.js";
import { DAYS } from "../data/calendar.js";
import { cancelAgencyInterview } from "./agency.js";
import { cancelActivity } from "./scheduled-activities.js";
import {
  scheduleChange,
  previewScheduleChange,
} from "./schedule-transaction.js";
import {
  capturePlannerTransaction,
  restoreStateFields,
} from "../core/state-transaction.js";

export function plannerDaySignature(day) {
  return JSON.stringify([
    state.week,
    state.schedule[day],
    state.scheduledJobIds[day],
    state.scheduledActivityIds[day],
    state.agencyInterview?.dayIndex === day ? state.agencyInterview : null,
  ]);
}
export function replacePlannerDay(
  day,
  id,
  { confirmed = false, signature, locationId = null } = {},
) {
  if (
    !Number.isInteger(day) ||
    day < 0 ||
    day > 6 ||
    state.forcedRestWeek === state.week ||
    !ACTIONS[id] ||
    ACTIONS[id].hidden ||
    id === "agency_interview" ||
    (id === "free" && !MAP_LOCATIONS[locationId])
  )
    return { ok: false, message: "這個活動目前無法排入。" };
  const access = trainingAccess(state, id);
  if (!access.unlocked) return { ok: false, message: access.message };
  if (signature && signature !== plannerDaySignature(day))
    return { ok: false, message: "這天的安排已改變，請重新選擇活動。" };
  const important = [
    "personal_task",
    "agency_interview",
    "job_session",
  ].includes(state.schedule[day]);
  if (important && !confirmed)
    return {
      ok: false,
      confirmationRequired: true,
      request: { day, id, locationId, signature: plannerDaySignature(day) },
      message: `${DAYS[day]}已有重要預約；替換會取消當天安排，正式通告仍須在期限內完成。`,
    };
  const preview = previewScheduleChange(state, day, {
    type: id,
    locationId,
    allowStandardAction: true,
  });
  if (!preview.ok) return { ok: false, message: preview.errors.join("、") };
  const snapshot = capturePlannerTransaction(state);
  if (state.agencyInterview?.dayIndex === day) cancelAgencyInterview();
  if (state.schedule[day] === "personal_task") cancelActivity(day);
  const result = scheduleChange(state, day, {
    type: id,
    locationId,
    allowStandardAction: true,
  });
  if (!result.ok) {
    restoreStateFields(state, snapshot);
    return result;
  }
  return {
    ok: true,
    snapshot,
    message: `${DAYS[day]}已安排「${id === "free" ? MAP_LOCATIONS[locationId].name : ACTIONS[id].label}」`,
  };
}
