import { normalizeSavedLooks } from "../logic/wardrobe.js";
import {
  AVATAR_LIST,
  AVATARS,
  OUTFITS,
  isAvatarLocked,
  defaultAvatarForGender,
  defaultOwnedOutfits,
} from "../data/wardrobe.js";
import { normalizeBirthday } from "./birthday.js";
import { syncLegacyPlayerName } from "./player-name.js";
export function initialState() {
  return {
    screen: "create",
    createStep: 1,
    tab: "planner",
    appOpen: null,
    appReturnContext: null,
    confirmDialog: null,
    saveStatus: "saved",
    appQuery: "",
    appCategory: "全部",
    appLibraryExpanded: false,
    recentAppIds: [],
    peopleSection: "contacts",
    peopleQuery: "",
    creativeDraftTitle: "",
    gallerySelection: null,
    galleryFilter: "all",
    seenGalleryItemIds: [],
    dockAppIds: ["planner", "timeline", "gallery", "stats", "people", "log"],
    dockEditing: false,
    dockDraftIds: null,
    dockNotice: "",
    name: "",
    realName: "",
    stageName: "",
    gender: "女性",
    customGender: "",
    birthMonth: 8,
    birthDay: 1,
    avatarId: "raven",
    outfitId: "newcomer",
    ownedOutfits: defaultOwnedOutfits(),
    wardrobeNotice: "",
    wardrobePreview: null,
    wardrobeFilter: "all",
    wardrobeCategory: "all",
    savedLooks: {},
    visitedLocationsByWeek: {},
    mapFilter: "全部",
    mapPurpose: "全部",
    favoriteLocations: [],
    recentLocations: [],
    saveNotice: "",
    stats: {},
    hidden: {},
    luck: 0,
    rep: {
      業界評價: 0,
      商業價值: 0,
      話題度: 0,
      爭議度: 0,
      時尚影響力: 0,
      國民度: 0,
      路人緣: 500,
      可信度: 500,
    },
    publicOpinion: {
      state: "neutral",
      score: 0,
      brandTrust: 50,
      heat: 0,
      scandalLevel: 0,
      lastChangedWeek: 0,
    },
    publicOpinionHistory: [],
    brandRelations: {},
    scandals: [],
    managerState: null,
    managerAdviceHistory: [],
    week: 1,
    schedule: ["vocal", "acting", "rest", "audition", "free", "dance", "rest"],
    lastSchedule: null,
    freeLocations: Array(7).fill(null),
    lastFreeLocations: null,
    scheduledJobIds: Array(7).fill(null),
    lastScheduledJobIds: null,
    scheduledActivityIds: Array(7).fill(null),
    lastScheduledActivityIds: null,
    scheduledActivities: {},
    selectedDay: 0,
    filter: "全部",
    focus: "growth",
    stamina: 100,
    fatigue: 0,
    mood: 70,
    health: 100,
    overworkStrikes: 0,
    money: 18000,
    fame: 0,
    fans: 0,
    contract: 8,
    trainingSessionsCompleted: 0,
    knownPeople: [],
    familiarNpcs: [],
    relationships: {},
    partnerId: null,
    npcEventProgress: {},
    npcMessages: [],
    npcCareers: {},
    npcCareerHistory: [],
    npcInteractionsByWeek: {},
    npcInteractionEventHistory: {},
    npcInteractionMemories: [],
    npcSocialRelations: {},
    npcSchedules: {},
    npcStoryHistory: [],
    flags: [],
    eventFlags: [],
    eventHistory: [],
    queuedEvents: [],
    eventQueue: [],
    activeEvent: null,
    eventOutcome: null,
    eventPresentedWeek: 0,
    calendarEventHistory: [],
    runnerDay: 0,
    runnerPhase: "",
    runnerPaused: false,
    runnerResult: null,
    runnerDecision: null,
    pendingRandomEvent: null,
    randomEventHistory: {},
    weekResults: [],
    weekStartSnapshot: null,
    history: [],
    careerMemories: [],
    notice: "",
    reward: null,
    selectedJobId: "J001",
    jobQuery: "",
    jobSort: "deadline",
    jobStatusFilter: "all",
    activeJobs: {},
    jobHistory: [],
    completedWorks: [],
    awards: [],
    awardSeasons: {},
    runCount: 1,
    unlockedAchievements: [],
    achievementNotifications: [],
    achievementFilter: "全部",
    endingHistory: [],
    careerProgress: { 歌曲: 0, 電影: 0, 電視劇: 0, 綜藝: 0, 廣告: 0 },
    careerRouteHistory: [],
    careerPhaseHistory: [],
    careerCommitment: null,
    careerCommitmentHistory: [],
    careerDoctrine: {},
    majorDecisionHistory: [],
    npcInvitations: [],
    npcInvitationHistory: [],
    ensembleEventHistory: [],
    doctrineTickWeeks: {},
    doctrineEventHistory: [],
    timelineFilter: "all",
    timelineQuery: "",
    contentExposure: {},
    recentNarrativeIds: [],
    npcLongformProgress: {},
    crossEventHistory: [],
    creativeProjects: [],
    industryNews: [],
    discoveredCompanies: [],
    visitedIndustryLocations: [],
    selectedNpc: null,
    npcArtView: "bust",
    forumThread: null,
    forumCategory: "熱門",
    forumRefresh: 0,
    forumReactions: {},
    socialPosts: [],
    likedSocialPosts: [],
    socialNotice: "",
    endingType: null,
    endingResult: null,
    endingSnapshot: null,
    inheritChoice: true,
    hospitalSkipWeeks: 0,
    forcedRestWeek: null,
    agencyStatus: "unsigned",
    selectedAgencyId: null,
    agencyApplications: {},
    agencyInterview: null,
    agencyOffer: null,
    currentAgencyId: null,
    agencySignedWeek: null,
    agencyContractEndWeek: null,
    agencyHistory: [],
    agencyJobOffers: [],
    rngSeed: null,
    rngCursor: 0,
    saveVersion: 16,
  };
}
export let state = initialState();
export function resetState() {
  state = initialState();
  return state;
}
function migrateLegacyRuntime(saved, next) {
  if (!saved.activeJobs && saved.jobStage && saved.jobStage !== "available")
    next.activeJobs.J001 = {
      jobId: "J001",
      stage: saved.jobStage,
      appliedWeek: 1,
      deadlineWeek: saved.jobDeadline || 3,
      remainingSessions: saved.jobRemaining ?? 3,
      completedSessions: Math.max(0, 3 - (saved.jobRemaining ?? 3)),
    };
  delete next.jobStage;
  delete next.jobRemaining;
  delete next.jobDeadline;
  delete next.jobNotice;
}
function migrateLegacySchedules(next) {
  next.schedule = Array.from({ length: 7 }, (_, i) => {
    if (next.schedule?.[i] !== "adshoot") return next.schedule?.[i] || "rest";
    return next.activeJobs.J001?.stage === "active" ? "job_session" : "rest";
  });
  next.scheduledJobIds = Array.from({ length: 7 }, (_, i) =>
    next.schedule[i] === "job_session"
      ? next.scheduledJobIds?.[i] || "J001"
      : null,
  );
  next.scheduledActivityIds = Array.from({ length: 7 }, (_, i) =>
    next.schedule[i] === "personal_task"
      ? next.scheduledActivityIds?.[i] || null
      : null,
  );
  if (Array.isArray(next.lastSchedule)) {
    next.lastSchedule = next.lastSchedule.map((id) =>
      id === "adshoot" ? "rest" : id,
    );
    next.lastScheduledJobIds = Array(7).fill(null);
    next.lastScheduledActivityIds = Array(7).fill(null);
  }
}
export function hydrateState(saved) {
  const next = Object.assign(initialState(), saved);
  if (!Object.prototype.hasOwnProperty.call(saved, "realName"))
    next.realName = typeof saved.name === "string" ? saved.name : "";
  if (!Object.prototype.hasOwnProperty.call(saved, "stageName"))
    next.stageName = "";
  syncLegacyPlayerName(next);
  if (next.avatarId === "silver") next.avatarId = "raven";
  const legacyOwned = Array.isArray(saved.ownedOutfits)
    ? saved.ownedOutfits
    : null;
  next.ownedOutfits = Object.fromEntries(
    AVATAR_LIST.map((a) => {
      const avatarOwned =
        legacyOwned ||
        (Array.isArray(saved.ownedOutfits?.[a.id])
          ? saved.ownedOutfits[a.id]
          : []);
      return [
        a.id,
        [...new Set(["newcomer", ...avatarOwned.filter((id) => OUTFITS[id])])],
      ];
    }),
  );
  if (
    !AVATARS[next.avatarId] ||
    isAvatarLocked(AVATARS[next.avatarId], next.gender)
  )
    next.avatarId = defaultAvatarForGender(next.gender).id;
  if (!next.ownedOutfits[next.avatarId].includes(next.outfitId))
    next.outfitId = "newcomer";
  next.savedLooks = normalizeSavedLooks(next, saved.savedLooks);
  next.wardrobePreview = null;
  const rawVisits =
    saved.visitedLocationsByWeek &&
    typeof saved.visitedLocationsByWeek === "object"
      ? saved.visitedLocationsByWeek
      : {};
  next.visitedLocationsByWeek = Object.fromEntries(
    Object.entries(rawVisits).map(([week, locations]) => [
      week,
      [...new Set(Array.isArray(locations) ? locations : [])],
    ]),
  );
  if (!Array.isArray(saved.freeLocations))
    next.freeLocations = next.schedule.map((id) =>
      id === "free" ? saved.mapLocation || null : null,
    );
  next.freeLocations = Array.from({ length: 7 }, (_, i) =>
    next.schedule[i] === "free" ? next.freeLocations[i] || null : null,
  );
  for (const key of [
    "jobHistory",
    "completedWorks",
    "awards",
    "npcMessages",
    "npcCareerHistory",
    "npcStoryHistory",
    "npcInteractionMemories",
    "eventFlags",
    "eventHistory",
    "queuedEvents",
    "eventQueue",
    "careerRouteHistory",
    "calendarEventHistory",
    "creativeProjects",
    "industryNews",
    "publicOpinionHistory",
    "scandals",
    "discoveredCompanies",
    "visitedIndustryLocations",
    "agencyJobOffers",
    "careerPhaseHistory",
    "crossEventHistory",
    "favoriteLocations",
    "recentLocations",
    "unlockedAchievements",
    "achievementNotifications",
    "seenGalleryItemIds",
    "endingHistory",
    "managerAdviceHistory",
    "dockAppIds",
  ])
    next[key] = Array.isArray(next[key]) ? next[key] : [];
  for (const key of [
    "npcEventProgress",
    "npcCareers",
    "npcInteractionsByWeek",
    "npcInteractionEventHistory",
    "npcSocialRelations",
    "npcSchedules",
    "scheduledActivities",
    "awardSeasons",
    "brandRelations",
  ])
    next[key] = next[key] && typeof next[key] === "object" ? next[key] : {};
  next.relationships =
    next.relationships && typeof next.relationships === "object"
      ? next.relationships
      : {};
  for (const relation of Object.values(next.brandRelations)) {
    if (!relation || typeof relation !== "object") continue;
    const trust = Number.isFinite(relation.trust)
      ? Math.round(relation.trust)
      : 50;
    relation.score = relation.works
      ? `${relation.works} 次・信任 ${trust}`
      : relation.failedAuditions
        ? `試鏡中・信任 ${trust}`
        : "未合作";
  }
  const legacyAffection = {
    none: 0,
    interested: 25,
    ambiguous: 45,
    dating: 65,
    committed: 82,
    engaged: 91,
    married: 96,
    rejected: 18,
    broken: 28,
  };
  for (const rel of Object.values(next.relationships)) {
    rel.romance = typeof rel.romance === "string" ? rel.romance : "none";
    rel.affection = Number.isFinite(rel.affection)
      ? Math.max(0, Math.min(100, rel.affection))
      : Math.max(
          legacyAffection[rel.romance] || 0,
          Math.floor((rel.closeness || 0) * 0.2),
        );
    rel.visibility =
      rel.visibility ||
      (rel.romance === "married"
        ? "public"
        : ["dating", "committed", "engaged"].includes(rel.romance)
          ? "underground"
          : "private");
    rel.romanceSinceWeek = Number(rel.romanceSinceWeek) || 0;
    rel.romanceHistory = Array.isArray(rel.romanceHistory)
      ? rel.romanceHistory
      : [];
    rel.affectionHistory = Array.isArray(rel.affectionHistory)
      ? rel.affectionHistory
      : [];
    rel.hostility = Number.isFinite(rel.hostility)
      ? Math.max(0, Math.min(100, rel.hostility))
      : 0;
    rel.hostilityHistory = Array.isArray(rel.hostilityHistory)
      ? rel.hostilityHistory
      : [];
  }
  const partnerStages = new Set(["dating", "committed", "engaged", "married"]);
  next.partnerId =
    typeof next.partnerId === "string" &&
    partnerStages.has(next.relationships[next.partnerId]?.romance)
      ? next.partnerId
      : Object.entries(next.relationships).find(([, rel]) =>
          partnerStages.has(rel.romance),
        )?.[0] || null;
  next.publicOpinion =
    next.publicOpinion && typeof next.publicOpinion === "object"
      ? next.publicOpinion
      : {
          state: "neutral",
          score: 0,
          brandTrust: 50,
          heat: 0,
          scandalLevel: 0,
          lastChangedWeek: 0,
        };
  next.managerState =
    next.managerState && typeof next.managerState === "object"
      ? next.managerState
      : null;
  for (const p of next.creativeProjects) {
    p.productionProgress = Number(p.productionProgress) || 0;
    p.productionSessions = Number(p.productionSessions) || 0;
    p.releaseWeek = p.releaseWeek || null;
    p.marketScore = Number(p.marketScore) || 0;
    p.revenue = Number(p.revenue) || 0;
    p.team = Array.isArray(p.team) ? p.team : [];
    p.selfParticipation = p.selfParticipation ?? true;
    p.budgetTier = p.budgetTier || "standard";
    p.budgetSpent = Number(p.budgetSpent) || 0;
    p.roleAssignments =
      p.roleAssignments && typeof p.roleAssignments === "object"
        ? p.roleAssignments
        : {};
    p.distributionMode = p.distributionMode || null;
    p.storyHistory = Array.isArray(p.storyHistory) ? p.storyHistory : [];
    p.finalGrade = p.finalGrade || null;
  }
  const birthday = normalizeBirthday(next.birthMonth || 8, next.birthDay || 1);
  next.birthMonth = birthday.month;
  next.birthDay = birthday.day;
  next.health = Number.isFinite(next.health)
    ? Math.max(0, Math.min(100, next.health))
    : 100;
  next.overworkStrikes = Number.isInteger(next.overworkStrikes)
    ? next.overworkStrikes
    : 0;
  next.rngCursor = Number.isInteger(next.rngCursor) ? next.rngCursor : 0;
  next.dockEditing = false;
  next.dockDraftIds = null;
  next.dockNotice = "";
  next.confirmDialog = null;
  next.runnerPaused = false;
  next.saveStatus = "saved";
  next.appReturnContext = null;
  next.jobStatusFilter = ["all", "action", "active", "available"].includes(
    next.jobStatusFilter,
  )
    ? next.jobStatusFilter
    : "all";
  next.jobSort = ["deadline", "stars", "title"].includes(next.jobSort)
    ? next.jobSort
    : "deadline";
  next.appCategory = [
    "全部",
    "規劃",
    "事業",
    "人物",
    "世界",
    "紀錄",
    "個人",
    "系統",
  ].includes(next.appCategory)
    ? next.appCategory
    : "全部";
  next.appLibraryExpanded = false;
  next.recentAppIds = Array.isArray(next.recentAppIds)
    ? [
        ...new Set(next.recentAppIds.filter((id) => typeof id === "string")),
      ].slice(0, 6)
    : [];
  next.seenGalleryItemIds = [
    ...new Set(next.seenGalleryItemIds.filter((id) => typeof id === "string")),
  ];
  if (next.appOpen === "npc") {
    next.appOpen = "people";
    next.peopleSection = "profiles";
  }
  migrateLegacyRuntime(saved, next);
  migrateLegacySchedules(next);
  delete next.mapLocation;
  delete next.lastVisitedLocation;
  delete next.lastVisitedWeek;
  next.saveVersion = 16;
  state = next;
  return state;
}
export function visitedLocationThisWeek(locationId) {
  return (state.visitedLocationsByWeek?.[state.week] || []).includes(
    locationId,
  );
}
export function markVisitedLocation(locationId, week = state.week) {
  if (!locationId) return false;
  const key = String(week),
    locations = state.visitedLocationsByWeek[key] || [];
  if (!locations.includes(locationId)) locations.push(locationId);
  state.visitedLocationsByWeek[key] = locations;
  return true;
}
export function syncVisitedLocations() {
  if (!state.lastVisitedLocation || !state.lastVisitedWeek) return;
  const week = String(state.lastVisitedWeek),
    locations = state.visitedLocationsByWeek[week] || [];
  if (!locations.includes(state.lastVisitedLocation))
    locations.push(state.lastVisitedLocation);
  state.visitedLocationsByWeek[week] = locations;
  delete state.lastVisitedLocation;
  delete state.lastVisitedWeek;
}
