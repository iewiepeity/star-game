import { ROOMS } from "./data.js";
import { cityDay } from "../core/city-life-state.js";
import { CITY_CHOICES, CITY_VOICES } from "../data/city-life.js";
import { repairCitySchedule, cancelCityAppointment } from "./city-schedule.js";
import { cityLife, cityActionProblem, settleCityAction, recordRegularVisit, regularOpportunity, redeemRegularOpportunity, noticeOutfit, collectCitySources, petGreeting, tripCareProblem, settleTripCare } from "../logic/city-life.js";
import { captureWeekStart } from "../logic/career-memory.js";
import {
  CAREER_CHOICES,
  careerDefinition,
  careerCost,
  careerAccess,
  careerDecision,
  resolveCareerDay,
  syncCoreSchedule,
  adoptCoreSchedule,
  releaseCareerDay,
  closeCareerWeek,
  advanceCareerWeek,
} from "./career.js";
import { lockEnding } from "../logic/career.js";
import { initialState } from "../core/state.js";
import { homeVisitScheduleKey, normalizeHomeLife, invalidateHomeKeys } from "../core/home-state.js";
import { homePlanReason, reserveHomeDay, releaseHomeDay, repairHomeSchedules } from "./home-schedule.js";
import { withCore } from "./core-bridge.js";
export { withCore } from "./core-bridge.js";
import { randomInt, setSeed } from "../core/rng.js";
import { maybeQueueLifeEvent } from "../logic/life-events.js";
import { ABILITIES, HIDDEN_TRAITS } from "../data/abilities.js";
import { ACTIONS } from "../data/actions.js";
import { OUTFITS, AVATARS } from "../data/wardrobe.js";
import { MAP_LOCATIONS } from "../data/map-locations.js";
import { locationDayCopy } from "./location-day-copy.js";
import { TRAINING_VENUES, hasVisited } from "../logic/city-progression.js";
import { recordPartTimeShift } from "../logic/work-progression.js";
import { COMPANY_PART_TIME } from "../data/part-time.js";
import { effectiveActionCost, reliefGigAvailable } from "../logic/economy.js";
import {
  applyActivityLoad,
  healthPressure,
  performanceMultiplier,
} from "../logic/condition-engine.js";
import {
  routineGains,
  routineRest,
  routineTraining,
} from "../logic/routine-rules.js";
import {
  createCreativeProject,
  workOnCreativeProject,
  CREATIVE_TYPES,
} from "../logic/creative.js";
import { resolvePersonalTask } from "../logic/personal-tasks.js";
import { evaluateWeeklyTask } from "../logic/weekly-task.js";
import { resolveScheduleMoment, resolveLocationMoment } from "../logic/random-events.js";
import { meetNpc } from "../logic/npc-engine.js";
import {
  completeNpcExternalSlot,
} from "../logic/npc-ecosystem.js";
import {
  buyHomeItem as buyHomeItemCore,
  buySupply as buySupplyCore,
  giftCraftedItem as giftCraftedItemCore,
  homeActionAccess,
  placeHomeItem as placeHomeItemCore,
  resolveCrafting,
  resolveHomeVisit,
  setDisplayedKeepsake as setDisplayedKeepsakeCore,
  setHomeKey as setHomeKeyCore,
  useCraftedItem as useCraftedItemCore,
} from "../logic/home-life.js";

export const DAY_NAMES = [
  "星期一",
  "星期二",
  "星期三",
  "星期四",
  "星期五",
  "星期六",
  "星期日",
];
export const SPEEDS = [1, 2, 4, 8, 16];
export const CHOICES = {
  styling: {
    label: "造型研究",
    group: "生活",
    action: "styling",
    room: "shop",
    item: "mirror",
    pose: "read",
  },
  relief_gig: {
    label: "新人服務台救急短工",
    group: "工作",
    action: "relief_gig",
    room: "business",
    item: "service",
    pose: "read",
  },
  visit_rehearsal: {
    label: "排練室自由活動",
    group: "探訪",
    room: "rehearsal",
    item: "notice",
    pose: "read",
    action: "free",
    venue: "rehearsal",
  },
  visit_tv: {
    label: "電視台自由活動",
    group: "探訪",
    room: "tv",
    item: "reception",
    pose: "read",
    action: "free",
    venue: "tv_company",
  },
  visit_shop: {
    label: "逛星光服飾店",
    group: "探訪",
    room: "shop",
    item: "checkout",
    pose: "read",
    action: "free",
    venue: "shop",
  },
  cafe: {
    label: "咖啡館自由活動",
    group: "探訪",
    room: "cafe",
    item: "window",
    pose: "coffee",
    action: "free",
    venue: "cafe",
  },
  acting: {
    label: "表演課",
    group: "訓練",
    room: "rehearsal",
    item: "practice",
    pose: "read",
    action: "acting",
  },
  tv_assistant: {
    label: "棚務助理",
    group: "工作",
    room: "tv",
    item: "props",
    pose: "read",
    action: "tv_assistant",
  },
  newcomer_gig: {
    label: "活動引導零工",
    group: "工作",
    room: "tv",
    item: "reception",
    pose: "read",
    action: "newcomer_gig",
  },
  study: {
    label: "在家研究",
    group: "生活",
    room: "home",
    item: "desk",
    pose: "read",
    action: "study",
  },
  creative: {
    label: "推進創作",
    group: "創作",
    room: "home",
    item: "desk",
    pose: "read",
    action: "personal_task",
  },
  social: {
    label: "經營星語動態",
    group: "生活",
    room: "home",
    item: "desk",
    pose: "read",
    action: "personal_task",
  },
  rest: {
    label: "好好休息",
    group: "休息",
    room: "home",
    item: "bed",
    pose: "rest",
    action: "rest",
  },
  home_host: {
    label: "邀請到家裡相處",
    group: "生活",
    room: "home",
    item: "sofa",
    pose: "sit",
    action: "personal_task",
  },
  home_craft: {
    label: "在家做一份心意",
    group: "生活",
    room: "home",
    item: "desk-seat",
    pose: "sit",
    action: "personal_task",
  },
};
// A destination is part of the assignment. Planning is available from day one;
// the actual arrival opens future service shortcuts, without a registration day.
export const roomForVenue = (id) => (id === "tv_company" ? "tv" : id);
for (const [id, venue] of Object.entries(TRAINING_VENUES)) {
  if (CHOICES[id]) continue;
  CHOICES[id] = {
    label: ACTIONS[id].short,
    group: "訓練",
    room: roomForVenue(venue),
    item: "service",
    pose: id === "dance" ? "dance" : "read",
    action: id,
  };
}
for (const [id, job] of Object.entries(COMPANY_PART_TIME)) {
  if (CHOICES[id]) continue;
  CHOICES[id] = {
    label: job.label,
    group: "工作",
    room: roomForVenue(job.venue),
    item: "service",
    pose: "read",
    action: id,
  };
}
for (const [id, place] of Object.entries(MAP_LOCATIONS)) {
  if (["rehearsal", "tv_company", "shop", "cafe"].includes(id)) continue;
  CHOICES[`explore_${id}`] = {
    label: `${place.name}・自由活動`,
    group: "探訪",
    room: roomForVenue(id),
    item: "service",
    pose: "read",
    action: "free",
    venue: id,
  };
}
Object.assign(CHOICES, CAREER_CHOICES);
Object.assign(CHOICES, CITY_CHOICES);
export const definition = (life, assignment) =>
  careerDefinition(life.game, assignment) || CHOICES[assignment?.id];
export const suggestedPlan = () => [
  { id: "acting" },
  { id: "newcomer_gig" },
  { id: "study" },
  { id: "tv_assistant" },
  { id: "cafe" },
  { id: "social" },
  { id: "rest" },
];
export function arriveAt(life, roomId) {
  if (roomId === "home") petGreeting(life.game, cityDay(life.game, life.day));
  const id =
    roomId === "tv"
      ? "tv_company"
      : roomId.startsWith("agency_")
        ? "business"
        : roomId;
  if (!MAP_LOCATIONS[id]) return false;
  const first = !hasVisited(life.game, id);
  const visits = (life.game.visitedLocationsByWeek[life.game.week] ||= []);
  if (!visits.includes(id)) visits.push(id);
  return first;
}
export function cancelDay(life) {
  if (!life.pending) return "";
  if (
    life.pending.phase === "result" ||
    life.ledger.some((r) => r.id === life.pending.id)
  )
    return "今天已完成，請先迎接明天";
  life.pending = null;
  life.auto = false;
  return "";
}
export function initialLife(seed = `pixel-${Date.now()}`) {
  const life = {
    version: 2,
    game: initialState(),
    day: 0,
    plan: suggestedPlan(),
    pending: null,
    ledger: [],
    summaries: [],
    weekSummary: null,
    auto: false,
    speed: 1,
    metChoices: {},
    registrationChoice: "focus",
  };
  withCore(life, (game) => {
    game.screen = "game";
    game.name = "星途新人";
    game.realName = "星途新人";
    game.focus = "growth";
    setSeed(seed);
    game.stats = Object.fromEntries(
      ABILITIES.map((name) => [name, randomInt(0, 150)]),
    );
    game.hidden = Object.fromEntries(
      HIDDEN_TRAITS.map((n) => [
        n,
        350 + randomInt(1, 100) + randomInt(1, 100) + randomInt(1, 100),
      ]),
    );
    game.luck = 200 + randomInt(1, 200) + randomInt(1, 200) + randomInt(1, 200);
    captureWeekStart();
  });
  return life;
}
export function normalizeLife(raw, legacyOutfit = "newcomer") {
  if (!raw || raw.version !== 2) {
    const life = initialLife();
    // Phase-one wardrobe was a free preview: preserve the outfit already worn.
    life.game.outfitId = legacyOutfit;
    if (legacyOutfit !== "newcomer")
      life.game.ownedOutfits.raven.push(legacyOutfit);
    return life;
  }
  const life = structuredClone(raw);
  if (
    !Number.isInteger(life.day) ||
    life.day < 0 ||
    life.day > 7 ||
    !Array.isArray(life.plan) ||
    life.plan.length !== 7 ||
    !life.game ||
    !Number.isInteger(life.game.week)
  )
    throw new Error("養成進度格式不完整");
  for (const a of life.plan) if (!CHOICES[a?.id]) throw new Error("行程不存在");
  if (!Object.keys(life.game.hidden || {}).length)
    withCore(life, (game) => {
      game.hidden = Object.fromEntries(
        HIDDEN_TRAITS.map((n) => [
          n,
          350 + randomInt(1, 100) + randomInt(1, 100) + randomInt(1, 100),
        ]),
      );
      if (!game.luck)
        game.luck =
          200 + randomInt(1, 200) + randomInt(1, 200) + randomInt(1, 200);
    });
  life.speed = SPEEDS.includes(raw.speed) ? raw.speed : 1;
  life.auto = false; // A reload always gives control back before continuing a route.
  life.ledger ||= [];
  life.summaries ||= [];
  life.metChoices ||= {};
  life.game.homeLife = normalizeHomeLife(life.game.homeLife);
  invalidateHomeKeys(life.game);
  repairHomeSchedules(life);
  repairCitySchedule(life);
  syncCoreSchedule(life, CHOICES);
  if (
    life.pending &&
    (life.pending.id !== actionKey(life) ||
      !CHOICES[life.pending.assignment?.id])
  )
    throw new Error("行動紀錄不一致");
  compactLifeHistory(life);
  return life;
}
export const actionKey = (life) => `week-${life.game.week}-day-${life.day}`;
export function costOf(life, assignment) {
  const def = definition(life, assignment);
  if (CAREER_CHOICES[assignment?.id]) return careerCost(life, assignment) + (def?.room === "airport" && cityLife(life.game).pet?.care?.npcId === "service" ? 300 : 0);
  if (CITY_CHOICES[assignment?.id]) return assignment.id === "city_date" ? 300 : 0;
  return def
    ? effectiveActionCost(ACTIONS[def.action], life.game.week) +
        (def.action === "free" ? MAP_LOCATIONS[def.venue]?.extraCost || 0 : 0) +
        (def.room === "airport" && cityLife(life.game).pet?.care?.npcId === "service" ? 300 : 0)
    : 0;
}
export function access(life, assignment, day = life.day, planning = false) {
  const def = definition(life, assignment);
  if (!def) return "找不到這個安排";
  if (life.game.endingResult) return "這段旅程已完成，可在職涯紀錄查看結局";
  if (life.game.forcedRestWeek === life.game.week && assignment.id !== "rest")
    return "本週需要完整休養";
  if (!Number.isInteger(day) || day < life.day || day > 6) return "這一天已經結束";
  const careerReason =
    CAREER_CHOICES[assignment.id] && careerAccess(life, assignment, day);
  if (careerReason) return careerReason;
  const game = life.game;
  if (CITY_CHOICES[assignment.id]) {
    const reason = cityActionProblem(game, assignment, cityDay(game, day));
    if (reason) return reason;
  }
  if (def.room === "airport") {
    const reason = tripCareProblem(game, cityDay(game, day));
    if (reason) return reason;
  }
  if (assignment.regularId && regularOpportunity(game, assignment.regularId)?.action !== assignment.id)
    return "這份熟客消息已經用過，或不適用於這個行程。";
  if (assignment.regularId && life.plan.some((a, i) => i !== day && i >= life.day && a.regularId === assignment.regularId && !(i === life.day && life.pending?.phase === "result")))
    return "這份消息已排在另一天，請先取消原安排。";
  if (assignment.id === "relief_gig" && !reliefGigAvailable(game))
    return "資金低於 $1,500 時可接一次救急短工";
  // Services are public destinations. A schedule can include the first trip;
  // dispatch still walks through the city map and arrives before performing.
  if (assignment.id === "creative") {
    const project = game.creativeProjects.find(
      (p) => p.id === assignment.projectId,
    );
    if (!project || !["draft", "revising", "rejected"].includes(project.status))
      return "先建立一份未完成的作品";
  }
  if (["home_host", "home_craft"].includes(assignment.id)) {
    const reason = homeActionAccess(game, assignment);
    if (reason) return reason;
    const planReason = homePlanReason(life, assignment, day, planning);
    if (planReason) return planReason;
  }
  if (costOf(life, assignment) > game.money)
    return "現金不足，先安排休息或已開放的工作";
  if (game.fatigue > 100 && assignment.id !== "rest")
    return "身體需要恢復，今天先好好休息";
  return "";
}
export function planDay(life, day, assignment) {
  const reason = access(life, assignment, day, true);
  if (reason) return reason;
  if (day === life.day) {
    const error = cancelDay(life);
    if (error) return error;
  }
  releaseCareerDay(life, day);
  const previousAppointment = life.plan[day]?.appointmentId;
  if (previousAppointment && previousAppointment !== assignment.appointmentId)
    cancelCityAppointment(life, previousAppointment);
  reserveHomeDay(life, assignment, day);
  life.plan[day] = structuredClone(assignment);
  syncCoreSchedule(life, CHOICES);
  return "";
}
export function beginDay(life, assignment = life.plan[life.day]) {
  if (life.pending) return life.pending;
  const replacing = JSON.stringify(assignment) !== JSON.stringify(life.plan[life.day]);
  const reason = replacing ? planDay(life, life.day, assignment) : access(life, assignment);
  if (reason) return { error: reason };
  life.plan[life.day] = structuredClone(assignment);
  life.pending = {
    id: actionKey(life),
    assignment: structuredClone(assignment),
    phase: "travel",
    result: null,
  };
  return life.pending;
}
const plain = (text) =>
  String(text || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&[^;]+;/g, "");
export function settleDay(life, choice = "focus") {
  const pending = life.pending;
  if (!pending) return null;
  const existing = life.ledger.find((r) => r.id === pending.id);
  if (existing) {
    pending.result = existing;
    pending.phase = "result";
    return existing;
  }
  const assignment = pending.assignment,
    def = definition(life, assignment);
  const reason = access(life, assignment);
  if (reason) return { error: reason };
  // A resumed or programmatically invoked workday must not bypass its choice
  // and write a completed ledger entry while production is still pending.
  if (CAREER_CHOICES[assignment.id]) {
    const decision = careerDecision(life, assignment);
    if (decision && !decision.choices.some(item => item.id === choice)) {
      pending.decision = decision;
      pending.decisionMade = false;
      pending.phase = "decision";
      return {pending: true, decision, error: "先選擇今天的回應，再繼續行程。"};
    }
  }
  const before = structuredClone(life.game);
  const notes = [];
  let presentation = null;
  const moments = [];
  syncCoreSchedule(life, CHOICES);
  withCore(life, (game) => {
    game.runnerDay = life.day;
    game.schedule[life.day] = def.action;
    game.freeLocations[life.day] = def.venue || null;
    if (CITY_CHOICES[assignment.id]) {
      presentation = settleCityAction(assignment, choice, cityDay(game, life.day));
      notes.push(plain(presentation?.text));
    } else if (CAREER_CHOICES[assignment.id]) {
      presentation = resolveCareerDay(life, assignment, choice);
      const meetings = presentation?.encounters?.filter((m) => m.met) || [];
      if (meetings.length) {
        presentation = {
          ...presentation,
          title: `工作相遇 · ${meetings.map((m) => m.npcName).join("、")}`,
          portrait: meetings[0].portrait,
          context: `${ROOMS[def.room].name} · 今天的共同演出`,
        };
        notes.push(...meetings.map((m) => plain(m.text)));
      }
      if (!presentation?.audition) notes.push(plain(presentation?.text));
      for (const meeting of meetings) if (meeting.npcId) notes.push(noticeOutfit(meeting.npcId, "work", game, cityDay(game, life.day)));
    } else if (assignment.id === "home_host") {
      presentation = resolveHomeVisit(assignment, game);
      if (presentation.ok)
        completeNpcExternalSlot(
          assignment.npcId,
          homeVisitScheduleKey(game.week, life.day),
          game.week,
          life.day,
        );
      notes.push(plain(presentation.text));
      if (presentation.ok) {
        notes.push(noticeOutfit(assignment.npcId, "home", game, cityDay(game, life.day)));
        if (cityLife(game).pet) notes.push(`${cityLife(game).pet.name}也在家。${CITY_VOICES[assignment.npcId].pet}`);
      }
    } else if (assignment.id === "home_craft") {
      presentation = resolveCrafting(assignment, randomInt, game);
      notes.push(plain(presentation.text));
    } else if (ACTIONS[def.action].type === "train") {
      const r = routineTraining(game, def.action, randomInt);
      notes.push(`學習效率 ${Math.round(r.multiplier * 100)}%`);
    } else if (def.action === "rest") {
      routineRest(game);
      notes.push("睡了一個好覺，明天繼續。");
    } else if (
      COMPANY_PART_TIME[def.action] ||
      ["newcomer_gig", "relief_gig"].includes(def.action)
    ) {
      applyActivityLoad(ACTIONS[def.action], game);
      game.money += randomInt(...ACTIONS[def.action].income);
      if (def.action === "newcomer_gig") game.fame += 1;
      if (def.action === "relief_gig")
        game.flags.push({
          week: game.week,
          label: "新人緊急周轉",
          note: "完成服務台提供的一次救急短工",
        });
      routineGains(game, ACTIONS[def.action].shiftGains, randomInt);
      notes.push(
        COMPANY_PART_TIME[def.action]?.note || "引導來賓，並協助公開活動撤場。",
        COMPANY_PART_TIME[def.action]
          ? recordPartTimeShift(game, def.action)
          : "完成了今天的公開零工。",
      );
    } else if (def.action === "study" || def.action === "styling") {
      const multiplier = performanceMultiplier("training", game);
      applyActivityLoad(ACTIONS[def.action], game);
      routineGains(game, ACTIONS[def.action].gains, randomInt, multiplier);
    } else if (def.action === "free") {
      const location = MAP_LOCATIONS[def.venue];
      applyActivityLoad(ACTIONS.free, game);
      game.money -= location.extraCost || 0;
      game.fatigue = Math.max(
        0,
        Math.min(
          120,
          game.fatigue +
            (location.extraFatigue || 0) -
            (location.recover?.fatigue || 0),
        ),
      );
      game.mood = Math.min(100, game.mood + (location.recover?.mood || 0));
      game.stamina = Math.max(0, game.stamina - (location.extraFatigue || 0));
      if (location.luck)
        game.luck = Math.min(1000, (game.luck || 0) + location.luck);
      notes.push(locationDayCopy(def.venue));
      const visits = (game.visitedLocationsByWeek[game.week] ||= []);
      if (!visits.includes(def.venue)) visits.push(def.venue);
      // Growth belongs to the daily activity; walking into a room never grants gains.
      for (const gain of [
        location.gain,
        choice === "focus" && location.bonus,
      ].filter(Boolean)) {
        const [name, min, max] = gain;
        game.stats[name] = Math.min(
          1000,
          (game.stats[name] || 0) + randomInt(min, max),
        );
      }
      if (choice === "explore")
        notes.push("留意身邊的人，也許可以找機會聊聊。");
    } else if (assignment.id === "creative") {
      applyActivityLoad({ fatigue: 6, stamina: 6 }, game);
      const r = workOnCreativeProject(assignment.projectId);
      notes.push(
        `《${r.project.title}》完成度 ${r.project.progress}%`,
        plain(r.story),
      );
    } else if (assignment.id === "social") {
      applyActivityLoad({ fatigue: 4, stamina: 4 }, game);
      const r = resolvePersonalTask({
        kind: "social_post",
        payload: {
          type: "daily",
          label: "我的日常",
          text:
            assignment.text || "慢慢練習、好好生活。今天也往夢想走近了一點。",
        },
      });
      // The action ledger owns the post identity, independent of playback speed.
      if (game.socialPosts[0]) game.socialPosts[0].id = `pixel-${pending.id}`;
      notes.push(plain(r.text));
    }
    if (def.room === "airport") notes.push(settleTripCare(cityDay(game, life.day)));
    notes.push(recordRegularVisit(def.room, cityDay(game, life.day), game));
    if (assignment.regularId) notes.push(redeemRegularOpportunity(assignment.regularId));
    collectCitySources(game, cityDay(game, life.day));
    // Resolve inside the daily ledger transaction: reload/replay cannot draw or
    // award a second event, and ordinary room visits remain presentation-only.
    const moment = def.action === "free"
      ? resolveLocationMoment(def.venue, choice)
      : def.action !== "personal_task" ? resolveScheduleMoment(def.action) : null;
    if (moment) moments.push(moment);
    maybeQueueLifeEvent(
      ACTIONS[def.action] || { type: "life", label: def.label },
    );
    const health = healthPressure(game);
    if (health === "death") lockEnding("death");
    if (health === "hospital") {
      game.forcedRestWeek = game.week + 1;
      game.fatigue = Math.max(0, game.fatigue - 100);
      game.stamina = 100;
      game.health = Math.min(100, game.health + 30);
      notes.push("身體需要休養。剩餘日子與下週改為休息。");
    }
    life.hospitalized = health === "hospital";

    game.weekResults.push({
      day: DAY_NAMES[life.day],
      action: def.label,
      result: [...notes, ...moments.map(m => `${m.title}：${m.outcome}`)].join(" "),
      dayIndex: life.day,
      actionId: def.action,
      taskKind: assignment.id === "social" ? "social_post"
        : assignment.id === "creative" ? "creative_work"
        : ["home_host", "home_craft", ...Object.keys(CITY_CHOICES)].includes(assignment.id) ? assignment.id
        : assignment.id === "career_task" ? game.scheduledActivities[assignment.taskId]?.kind : null,
      success: presentation?.ok !== false,
      text: [...notes, ...moments.map(m => `${m.title}：${m.outcome}`)].join(" "),
    });
  });
  const deltas = {};
  for (const key of [
    "money",
    "fatigue",
    "stamina",
    "mood",
    "health",
    "fame",
    "fans",
  ])
    deltas[key] = life.game[key] - before[key];
  const gains = Object.entries(life.game.stats)
    .filter(([key, v]) => v !== before.stats[key])
    .map(([name, v]) => ({ name, amount: v - (before.stats[name] || 0) }));
  const result = {
    id: pending.id,
    week: life.game.week,
    day: life.day,
    label: def.label,
    assignment: structuredClone(assignment),
    success: presentation?.ok !== false,
    deltas,
    gains,
    notes: notes.filter(Boolean),
    presentation,
    moments,
  };
  // Original task completion can free redundant production days and NPC slots.
  adoptCoreSchedule(life, life.day + 1);
  if (life.hospitalized)
    for (let day = life.day + 1; day < 7; day++) {
      releaseCareerDay(life, day);
      releaseHomeDay(life, day);
      if (life.plan[day]?.appointmentId) cancelCityAppointment(life, life.plan[day].appointmentId);
      life.plan[day] = { id: "rest" };
    }
  life.ledger.push(result);
  pending.result = result;
  pending.phase = "result";
  return result;
}
export function advanceDay(life) {
  if (
    life.pending?.phase !== "result" ||
    !life.ledger.some((r) => r.id === life.pending.id)
  )
    return false;
  life.pending = null;
  life.day++;
  if (life.day < 7) collectCitySources(life.game, cityDay(life.game, life.day));
  if (life.day === 7) {
    const reward = withCore(life, () => evaluateWeeklyTask());
    const memory = closeCareerWeek(life, reward);
    life.weekSummary = {
      week: life.game.week,
      results: life.ledger.filter((r) => r.week === life.game.week),
      reward,
      memory,
    };
    life.summaries.push(structuredClone(life.weekSummary));
    life.auto = false;
  }
  return true;
}
export function nextWeek(life) {
  if (life.day !== 7 || !life.weekSummary) return false;
  life.previousPlan = structuredClone(life.plan);
  for (let day = 0; day < 7; day++) releaseHomeDay(life, day);
  advanceCareerWeek(life);
  life.day = 0;
  life.weekSummary = null;
  compactLifeHistory(life);
  life.game.weekResults = [];
  life.game.schedule = Array(7).fill("rest");
  life.game.freeLocations = Array(7).fill(null);
  life.game.scheduledJobIds = Array(7).fill(null);
  life.game.scheduledActivityIds = Array(7).fill(null);
  life.plan = Array.from({ length: 7 }, () => ({ id: "rest" }));
  repairCitySchedule(life);
  syncCoreSchedule(life, CHOICES);
  life.auto = false;
  return true;
}
export function newProject(life, type, title) {
  if (!CREATIVE_TYPES[type] || !title.trim()) return null;
  return withCore(life, () => createCreativeProject(type, title.slice(0, 40)));
}
export function buyOutfit(life, id) {
  if (!OUTFITS[id]) return "找不到這套服裝";
  const avatar = AVATARS[life.game.avatarId] ? life.game.avatarId : "raven";
  if (life.game.ownedOutfits[avatar].includes(id)) return "已擁有這套服裝";
  if (life.game.money < OUTFITS[id].price) return "現金不足";
  life.game.money -= OUTFITS[id].price;
  life.game.ownedOutfits[avatar].push(id);
  return "";
}
export const buyHomeItem = (life, id) => withCore(life, () => buyHomeItemCore(id));
export const placeHomeItem = (life, id) => withCore(life, () => placeHomeItemCore(id));
export const buyHomeSupply = (life, id) => withCore(life, () => buySupplyCore(id));
export const useHomeCraft = (life, id) => withCore(life, () => useCraftedItemCore(id));
export const giftHomeCraft = (life, itemId, npcId) => withCore(life, () => giftCraftedItemCore(itemId, npcId));
export const displayHomeKeepsake = (life, id) => withCore(life, () => setDisplayedKeepsakeCore(id));
export const changeHomeKey = (life, npcId, granted) => withCore(life, () => setHomeKeyCore(npcId, granted));
export function recordMeeting(life, id, roomId) {
  const room = ROOMS[roomId];
  return withCore(life, (game) => {
    const met = meetNpc(
      id,
      room
        ? `第 ${life.game.week} 週${DAY_NAMES[life.day]}，在${room.name}交談後正式交換聯絡方式。`
        : "在像素城市裡正式交換聯絡方式",
      room
        ? { context: "city", roomName: room.name, roomId, day: life.day }
        : {},
    );
    noticeOutfit(id, roomId === "home" ? "home" : roomId === "rehearsal" ? "practice" : "daily", game, cityDay(game, life.day));
    return met;
  });
}

// Keep one durable weekly journal, plus the current ledger for crash-safe replay.
// Phase-two/three saves are archived before removing their duplicated summaries.
export function compactLifeHistory(life) {
  life.milestones ||= {};
  if (
    life.ledger.some((r) =>
      ["tv_assistant", "newcomer_gig"].includes(r.assignment?.id),
    )
  )
    life.milestones.firstWork = true;
  const historyWeeks = new Set(life.game.history.map((h) => h.week));
  for (const summary of life.summaries)
    if (!historyWeeks.has(summary.week)) {
      life.game.history.push({
        week: summary.week,
        reward: summary.reward?.money || 0,
        results: summary.results.map((r) => ({
          day: DAY_NAMES[r.day],
          dayIndex: r.day,
          action: r.label,
          result: r.notes.join(" "),
          success: true,
        })),
      });
      historyWeeks.add(summary.week);
    }
  life.ledger = life.ledger.filter((r) => r.week >= life.game.week - 1);
  life.summaries = life.summaries.slice(-2);
}
