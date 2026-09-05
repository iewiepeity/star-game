import { initialState, hydrateState, state as core } from "../core/state.js";
import { randomInt, setSeed } from "../core/rng.js";
import { ABILITIES } from "../data/abilities.js";
import { ACTIONS } from "../data/actions.js";
import { OUTFITS } from "../data/wardrobe.js";
import { MAP_LOCATIONS } from "../data/map-locations.js";
import { trainingAccess, hasVisited } from "../logic/city-progression.js";
import { workAccess, recordPartTimeShift } from "../logic/work-progression.js";
import { effectiveActionCost } from "../logic/economy.js";
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
import { meetNpc } from "../logic/npc-engine.js";

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
  visit_rehearsal: {
    label: "認識排練室",
    group: "探訪",
    room: "rehearsal",
    item: "notice",
    pose: "read",
    action: "free",
    venue: "rehearsal",
  },
  visit_tv: {
    label: "電視台人員登記",
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
};
export const suggestedPlan = () => [
  { id: "visit_rehearsal" },
  { id: "acting" },
  { id: "visit_tv" },
  { id: "tv_assistant" },
  { id: "study" },
  { id: "cafe", choice: "focus" },
  { id: "rest" },
];
// Core modules use a live binding. Only synchronous commands run inside this bridge;
// the pixel save owns the snapshot. No classic render, runner, or storage is mounted.
export function withCore(life, fn) {
  hydrateState(structuredClone(life.game));
  const result = fn(core);
  life.game = structuredClone(core);
  return result;
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
    game.focus = "growth";
    setSeed(seed);
    game.stats = Object.fromEntries(
      ABILITIES.map((name) => [name, randomInt(0, 150)]),
    );
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
  life.speed = SPEEDS.includes(raw.speed) ? raw.speed : 1;
  life.auto = false; // A reload always gives control back before continuing a route.
  life.ledger ||= [];
  life.summaries ||= [];
  life.metChoices ||= {};
  if (
    life.pending &&
    (life.pending.id !== actionKey(life) ||
      !CHOICES[life.pending.assignment?.id])
  )
    throw new Error("行動紀錄不一致");
  return life;
}
export const actionKey = (life) => `week-${life.game.week}-day-${life.day}`;
export function costOf(life, assignment) {
  const def = CHOICES[assignment?.id];
  return def ? effectiveActionCost(ACTIONS[def.action], life.game.week) : 0;
}
export function access(
  life,
  assignment,
  day = life.day,
  projectVisits = false,
) {
  const def = CHOICES[assignment?.id];
  if (!def) return "找不到這個安排";
  if (day < life.day || day > 6) return "這一天已經結束";
  const game = structuredClone(life.game);
  if (projectVisits)
    for (let i = life.day; i < day; i++) {
      const prior = CHOICES[life.plan[i].id];
      if (prior.venue)
        (game.visitedLocationsByWeek[game.week] ||= []).push(prior.venue);
    }
  if (def.action === "acting" && !trainingAccess(game, def.action).unlocked)
    return "先用一天到排練室登記";
  if (!workAccess(game, def.action).unlocked) return "先用一天到電視台登記";
  if (assignment.id === "creative") {
    const project = game.creativeProjects.find(
      (p) => p.id === assignment.projectId,
    );
    if (!project || !["draft", "revising", "rejected"].includes(project.status))
      return "先建立一份未完成的作品";
  }
  if (costOf(life, assignment) > game.money)
    return "現金不足，先安排休息或已開放的工作";
  if (game.fatigue > 100 && assignment.id !== "rest")
    return "身體需要恢復，今天先好好休息";
  return "";
}
export function planDay(life, day, assignment) {
  if (life.pending && day === life.day) return "先完成或取消正在進行的行動";
  const reason = access(life, assignment, day, true);
  if (reason) return reason;
  life.plan[day] = structuredClone(assignment);
  return "";
}
export function beginDay(life, assignment = life.plan[life.day]) {
  if (life.pending) return life.pending;
  const reason = access(life, assignment);
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
    .replace(/<[^>]*>/g, "")
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
    def = CHOICES[assignment.id];
  const reason = access(life, assignment);
  if (reason) return { error: reason };
  const before = structuredClone(life.game);
  const notes = [];
  withCore(life, (game) => {
    game.runnerDay = life.day;
    game.schedule[life.day] = def.action;
    game.freeLocations[life.day] = def.venue || null;
    if (def.action === "acting") {
      const r = routineTraining(game, def.action, randomInt);
      notes.push(`學習效率 ${Math.round(r.multiplier * 100)}%`);
    } else if (def.action === "rest") {
      routineRest(game);
      notes.push("睡了一個好覺，明天繼續。");
    } else if (["tv_assistant", "newcomer_gig"].includes(def.action)) {
      applyActivityLoad(ACTIONS[def.action], game);
      game.money += randomInt(...ACTIONS[def.action].income);
      if (def.action === "newcomer_gig") game.fame += 1;
      routineGains(game, ACTIONS[def.action].shiftGains, randomInt);
      notes.push(
        def.action === "tv_assistant"
          ? "核對道具、引導來賓，完成今天的棚務。"
          : "在公開活動報到，引導來賓，並協助活動撤場。",
        def.action === "tv_assistant"
          ? recordPartTimeShift(game, "tv_assistant")
          : "公開招募的活動引導工作；公司內部職缺仍需先完成人事登記。",
      );
    } else if (def.action === "study") {
      const multiplier = performanceMultiplier("training", game);
      applyActivityLoad(ACTIONS.study, game);
      routineGains(game, ACTIONS.study.gains, randomInt, multiplier);
    } else if (def.action === "free") {
      const location = MAP_LOCATIONS[def.venue],
        first = !hasVisited(game, def.venue);
      applyActivityLoad(ACTIONS.free, game);
      const visits = (game.visitedLocationsByWeek[game.week] ||= []);
      if (!visits.includes(def.venue)) visits.push(def.venue);
      // Explicit exploration settlement, not a scene-entry or preview side effect.
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
      if (first && def.venue === "rehearsal")
        notes.push("已完成報名登記：之後可安排表演課。");
      if (first && def.venue === "tv_company")
        notes.push("人事窗口完成登記：之後可安排棚務助理。");
      if (first && def.venue === "shop")
        notes.push("已認識店內款式，可以在櫃檯購買服裝。");
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
      notes.push(plain(r.text));
    }
    healthPressure(game);
    game.weekResults.push({
      dayIndex: life.day,
      actionId: def.action,
      success: true,
      text: notes.join(" "),
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
    deltas,
    gains,
    notes: notes.filter(Boolean),
  };
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
  if (life.day === 7) {
    const reward = withCore(life, () => evaluateWeeklyTask());
    life.weekSummary = {
      week: life.game.week,
      results: life.ledger.filter((r) => r.week === life.game.week),
      reward,
    };
    life.summaries.push(structuredClone(life.weekSummary));
    life.auto = false;
  }
  return true;
}
export function nextWeek(life) {
  if (life.day !== 7 || !life.weekSummary) return false;
  life.game.week++;
  life.day = 0;
  life.weekSummary = null;
  life.game.weekResults = [];
  life.game.schedule = Array(7).fill("rest");
  life.game.freeLocations = Array(7).fill(null);
  life.plan = Array.from({ length: 7 }, () => ({ id: "rest" }));
  life.auto = false;
  return true;
}
export function newProject(life, type, title) {
  if (!CREATIVE_TYPES[type] || !title.trim()) return null;
  return withCore(life, () => createCreativeProject(type, title.slice(0, 40)));
}
export function buyOutfit(life, id) {
  if (!["practice", "audition"].includes(id)) return "找不到這套服裝";
  if (!hasVisited(life.game, "shop")) return "先完成一次服飾店探訪";
  if (life.game.ownedOutfits.raven.includes(id)) return "已擁有這套服裝";
  if (life.game.money < OUTFITS[id].price) return "現金不足";
  life.game.money -= OUTFITS[id].price;
  life.game.ownedOutfits.raven.push(id);
  return "";
}
export function recordMeeting(life, id) {
  return withCore(life, () => meetNpc(id, "在像素城市裡正式交換聯絡方式"));
}
