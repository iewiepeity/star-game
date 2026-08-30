const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
const romanceStages = new Set([
  "none",
  "interested",
  "ambiguous",
  "dating",
  "committed",
  "engaged",
  "married",
  "rejected",
  "broken",
]);
const timelineFilters = new Set([
  "all",
  "unread",
  "people",
  "works",
  "decisions",
]);
const screens = new Set([
  "create",
  "prologue",
  "game",
  "runner",
  "summary",
  "event",
  "ending",
]);
const jobStages = new Set([
  "available",
  "applied",
  "audition",
  "audition_scheduled",
  "failed",
  "passed",
  "active",
  "completed",
  "breached",
]);
const finite = (value, min = -Infinity, max = Infinity) =>
  Number.isFinite(value) && value >= min && value <= max;
const safeString = (value, max = 2000) =>
  typeof value === "string" && value.length <= max;
const unsafeMarkup = (value) =>
  typeof value === "string" &&
  /(<script\b|javascript:|\son[a-z]+\s*=)/i.test(value);
const validId = (value, max = 120) => value == null || safeString(value, max);
const numericFields = {
  week: [1, 261],
  birthMonth: [1, 12],
  birthDay: [1, 31],
  stamina: [0, 100],
  fatigue: [0, 200],
  mood: [0, 100],
  health: [0, 100],
  money: [-1e9, 1e12],
  fame: [0, 1e9],
  fans: [0, 1e12],
  rngCursor: [0, 1e9],
};
export function validateGameState(s) {
  const errors = [];
  if (!isObj(s)) return { ok: false, errors: ["state 必須是物件"] };
  for (const [key, [min, max]] of Object.entries(numericFields))
    if (!finite(s[key], min, max)) errors.push(`${key} 無效`);
  if (!Number.isInteger(s.week)) errors.push("week 必須是整數");
  if (!screens.has(s.screen)) errors.push("screen 無效");
  if (
    !safeString(s.name, 40) ||
    !safeString(s.realName, 40) ||
    !safeString(s.stageName, 40) ||
    !safeString(s.customGender, 40)
  )
    errors.push("玩家文字欄位無效");
  for (const key of ["schedule", "scheduledJobIds", "scheduledActivityIds"])
    if (!Array.isArray(s[key]) || s[key].length !== 7)
      errors.push(`${key} 必須有七天`);
  for (const key of [
    "scheduledActivities",
    "stats",
    "rep",
    "publicOpinion",
    "brandRelations",
    "relationships",
    "activeJobs",
    "npcSchedules",
    "npcInteractionEventHistory",
    "careerDoctrine",
    "doctrineTickWeeks",
  ])
    if (!isObj(s[key])) errors.push(`${key} 無效`);
  for (const key of [
    "publicOpinionHistory",
    "scandals",
    "knownPeople",
    "npcInteractionMemories",
    "completedWorks",
    "creativeProjects",
    "industryNews",
    "npcStoryHistory",
    "awards",
    "eventHistory",
    "queuedEvents",
    "agencyJobOffers",
    "majorDecisionHistory",
    "npcInvitations",
    "npcInvitationHistory",
    "ensembleEventHistory",
    "doctrineEventHistory",
    "unlockedAchievements",
    "achievementNotifications",
    "seenGalleryItemIds",
    "endingHistory",
    "managerAdviceHistory",
    "dockAppIds",
  ])
    if (!Array.isArray(s[key])) errors.push(`${key} 無效`);
  if (s.managerState != null && !isObj(s.managerState))
    errors.push("managerState 無效");
  if (s.partnerId != null && typeof s.partnerId !== "string")
    errors.push("partnerId 無效");
  if (isObj(s.relationships))
    for (const [id, rel] of Object.entries(s.relationships)) {
      if (!isObj(rel)) errors.push(`relationship 無效：${id}`);
      else {
        if (
          !Number.isFinite(rel.affection) ||
          rel.affection < 0 ||
          rel.affection > 100
        )
          errors.push(`affection 無效：${id}`);
        if (
          !Number.isFinite(rel.hostility) ||
          rel.hostility < 0 ||
          rel.hostility > 100
        )
          errors.push(`hostility 無效：${id}`);
        if (!romanceStages.has(rel.romance)) errors.push(`romance 無效：${id}`);
      }
    }
  if (Array.isArray(s.creativeProjects))
    for (const p of s.creativeProjects) {
      if (!Array.isArray(p.team))
        errors.push(`creative team 無效：${p.id || "unknown"}`);
      if (!isObj(p.roleAssignments || {}))
        errors.push(`creative roles 無效：${p.id || "unknown"}`);
    }
  if (isObj(s.stats))
    for (const [key, value] of Object.entries(s.stats))
      if (!finite(value, -10000, 10000)) errors.push(`能力值無效：${key}`);
  if (isObj(s.rep))
    for (const [key, value] of Object.entries(s.rep))
      if (!finite(value, -10000, 10000)) errors.push(`評價值無效：${key}`);
  if (isObj(s.activeJobs))
    for (const [id, job] of Object.entries(s.activeJobs)) {
      if (!isObj(job) || job.jobId !== id || !jobStages.has(job.stage))
        errors.push(`通告狀態無效：${id}`);
      else {
        if (job.deadlineWeek != null && !finite(job.deadlineWeek, 1, 400))
          errors.push(`通告期限無效：${id}`);
        if (
          !finite(job.remainingSessions, 0, 100) ||
          !finite(job.completedSessions, 0, 100)
        )
          errors.push(`通告次數無效：${id}`);
      }
    }
  for (const key of [
    "jobQuery",
    "peopleQuery",
    "appQuery",
    "timelineQuery",
    "notice",
    "creativeDraftTitle",
  ])
    if (!safeString(s[key] ?? "", key === "notice" ? 2000 : 200))
      errors.push(`${key} 無效`);
  for (const key of ["selectedJobId", "selectedNpc", "partnerId", "appOpen"])
    if (!validId(s[key])) errors.push(`${key} 無效`);
  for (const [key, value] of [
    ["runnerResult.text", s.runnerResult?.text],
    ["runnerResult.title", s.runnerResult?.title],
    ["runnerDecision.text", s.runnerDecision?.text],
    ["runnerDecision.title", s.runnerDecision?.title],
    ["activeEvent.text", s.activeEvent?.event?.text || s.activeEvent?.text],
  ])
    if (unsafeMarkup(value)) errors.push(`${key} 含不安全標記`);
  if (
    s.runnerDecision?.choices != null &&
    !Array.isArray(s.runnerDecision.choices)
  )
    errors.push("runnerDecision.choices 無效");
  for (const [index, choice] of (Array.isArray(s.runnerDecision?.choices)
    ? s.runnerDecision.choices
    : []
  ).entries())
    for (const key of ["id", "label", "note"])
      if (!safeString(choice?.[key] ?? "", 500) || unsafeMarkup(choice?.[key]))
        errors.push(`runnerDecision.choices[${index}].${key} 無效`);
  if (!Number.isInteger(s.rngCursor ?? 0) || Number(s.rngCursor) < 0)
    errors.push("rngCursor 無效");
  if (!timelineFilters.has(s.timelineFilter))
    errors.push("timelineFilter 無效");
  if (s.timelineQuery != null && typeof s.timelineQuery !== "string")
    errors.push("timelineQuery 無效");
  if (
    s.jobStatusFilter != null &&
    !["all", "action", "active", "available"].includes(s.jobStatusFilter)
  )
    errors.push("jobStatusFilter 無效");
  if (s.jobSort != null && !["deadline", "stars", "title"].includes(s.jobSort))
    errors.push("jobSort 無效");
  if (
    s.appCategory != null &&
    !["全部", "規劃", "事業", "人物", "世界", "紀錄", "個人", "系統"].includes(
      s.appCategory,
    )
  )
    errors.push("appCategory 無效");
  if (
    s.recentAppIds != null &&
    (!Array.isArray(s.recentAppIds) ||
      s.recentAppIds.length > 6 ||
      s.recentAppIds.some((id) => !validId(id)))
  )
    errors.push("recentAppIds 無效");
  if (
    s.seenGalleryItemIds != null &&
    (!Array.isArray(s.seenGalleryItemIds) ||
      s.seenGalleryItemIds.some((id) => !validId(id)))
  )
    errors.push("seenGalleryItemIds 無效");
  return { ok: errors.length === 0, errors };
}
export function assertGameState(s) {
  const result = validateGameState(s);
  if (!result.ok)
    throw new Error(`存檔結構驗證失敗：${result.errors.join("、")}`);
  return s;
}
