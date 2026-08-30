export const PLANNER_TRANSACTION_KEYS = Object.freeze([
  "schedule",
  "freeLocations",
  "scheduledJobIds",
  "scheduledActivityIds",
  "scheduledActivities",
  "activeJobs",
  "npcSchedules",
  "creativeProjects",
  "agencyInterview",
  "agencyApplications",
  "selectedDay",
]);

export function captureStateFields(state, keys) {
  return Object.fromEntries(keys.map((key) => [key, structuredClone(state[key])]));
}

export function restoreStateFields(state, snapshot) {
  for (const [key, value] of Object.entries(snapshot)) state[key] = structuredClone(value);
}

export function capturePlannerTransaction(state) {
  return captureStateFields(state, PLANNER_TRANSACTION_KEYS);
}
