const VALID_ASSIGNMENTS = new Set([
  "rest",
  "free",
  "job_session",
  "personal_task",
  "agency_interview",
]);
const validDay = (day) => Number.isInteger(day) && day >= 0 && day < 7;

export function previewScheduleChange(
  gameState,
  day,
  assignment = { type: "rest" },
) {
  const errors = [],
    type = assignment.type;
  if (!validDay(day)) errors.push("日期必須介於 0 到 6");
  if (!VALID_ASSIGNMENTS.has(type) && !assignment.allowStandardAction)
    errors.push("未知的排程類型");
  if (gameState.forcedRestWeek === gameState.week && type !== "rest")
    errors.push("本週為強制休養週");
  if (type === "job_session" && !assignment.jobId)
    errors.push("正式工作缺少通告 ID");
  if (type === "personal_task" && !assignment.activityId)
    errors.push("個人行程缺少活動 ID");
  if (
    type === "free" &&
    assignment.locationId != null &&
    typeof assignment.locationId !== "string"
  )
    errors.push("地點 ID 無效");
  return {
    ok: errors.length === 0,
    errors,
    day,
    type,
    patch: {
      schedule: type,
      freeLocation: type === "free" ? assignment.locationId || null : null,
      jobId: type === "job_session" ? assignment.jobId : null,
      activityId: type === "personal_task" ? assignment.activityId : null,
    },
  };
}

export function commitScheduleChange(gameState, preview) {
  if (!preview?.ok)
    return {
      ok: false,
      message: preview?.errors?.join("、") || "排程資料無效",
    };
  const { day, patch } = preview;
  gameState.schedule[day] = patch.schedule;
  gameState.freeLocations[day] = patch.freeLocation;
  gameState.scheduledJobIds[day] = patch.jobId;
  gameState.scheduledActivityIds[day] = patch.activityId;
  return { ok: true, day };
}

export function scheduleChange(gameState, day, assignment) {
  return commitScheduleChange(
    gameState,
    previewScheduleChange(gameState, day, assignment),
  );
}
