import { initialLife, CHOICES, beginDay, settleDay, normalizeLife } from "../src/pixel/life.js";
import { bookCareer, careerDecision } from "../src/pixel/career.js";
import test from "node:test";
import assert from "node:assert/strict";
import { state, resetState, hydrateState } from "../src/core/state.js";
import { normalizeTrainingProgress } from "../src/core/training-narrative-state.js";
import {
  trainingSubsidyNotice,
  effectiveActionCost,
} from "../src/logic/economy.js";
import { ACTIONS } from "../src/data/actions.js";
import { JOB_CATALOG } from "../src/data/jobs.js";
import { techniqueChoices } from "../src/logic/training-techniques.js";
import {
  jobAuditionDecision,
  resolveAudition,
  auditionChance,
} from "../src/logic/job-engine.js";
import {
  currentWeeklyGoal,
  weeklyGoalOptions,
  selectWeeklyGoal,
} from "../src/logic/weekly-goals.js";
import {
  weeklyTaskReady,
  weeklyTaskCounts,
  weeklyTaskMarkup,
  evaluateWeeklyTask,
} from "../src/logic/weekly-task.js";
import {
  syncSequelOfferFlags,
  completeSequelSession,
  sequelQuality,
  tickSequelOpportunities,
} from "../src/logic/sequel-engine.js";
import {
  recordCharacterMemory,
  characterMemory,
} from "../src/logic/character-memory.js";
import {
  npcInteractionDecision,
  resolveNpcInteraction,
} from "../src/logic/npc-interaction-engine.js";
import { meetNpc } from "../src/logic/npc-engine.js";
import {
  romanceOpportunity,
  romanceProgress,
  transitionRomance,
} from "../src/logic/romance-engine.js";

function fresh() {
  resetState();
  state.week = 16;
  state.fatigue = 0;
  state.health = state.mood = state.stamina = 100;
  state.schedule = Array(7).fill("rest");
  state.weekResults = [];
  state.money = 100000;
}
const offer = (extra = {}) => ({
  id: "S1",
  workId: "W1",
  title: "再見星光",
  category: "電影",
  stars: 3,
  quality: 85,
  status: "offered",
  termsVersion: 2,
  requiredSessions: 2,
  completedSessions: 0,
  payMultiplier: 1,
  npcCast: [],
  ...extra,
});

test("breakthrough techniques require earned progress, survive later practice and reject forged choices", () => {
  fresh();
  const job = JOB_CATALOG.find((j) => j.category === "電影");
  state.activeJobs[job.id] = { stage: "audition_scheduled" };
  assert.equal(techniqueChoices(job, state).length, 0);
  assert.equal(resolveAudition(job.id, "technique:acting"), null);
  assert.equal(state.activeJobs[job.id].stage, "audition_scheduled");
  state.trainingNarrativeProgress = {
    acting: { stage: "breakthrough", sessions: 5 },
  };
  hydrateState(structuredClone(state));
  assert.ok(state.trainingNarrativeProgress.acting.unlocked);
  state.trainingNarrativeProgress.acting.stage = "skilled";
  state.trainingNarrativeProgress = normalizeTrainingProgress(
    state.trainingNarrativeProgress,
  );
  assert.ok(
    techniqueChoices(job, state).some((c) => c.id === "technique:acting"),
  );
  assert.equal(techniqueChoices({ category: "歌曲" }, state).length, 0);
  const decision = jobAuditionDecision({ payload: { jobId: job.id } });
  assert.ok(decision.choices.some((c) => c.id === "technique:acting"));
  assert.ok(
    auditionChance(job, "technique:acting") >= auditionChance(job, "steady"),
  );
  const result = resolveAudition(job.id, "technique:acting");
  assert.match(result.technique.text, /即興/);
  assert.equal(resolveAudition(job.id, "technique:acting"), null);
});

test("new sequel contracts exchange time for pay or creative control, old signed contracts stay unchanged", () => {
  fresh();
  state.sequelOffers = [offer()];
  state.eventFlags.push("sequel-negotiate:S1");
  syncSequelOfferFlags();
  syncSequelOfferFlags();
  assert.equal(state.sequelOffers[0].requiredSessions, 3);
  assert.equal(state.sequelOffers[0].payMultiplier, 1.25);
  assert.equal(state.sequelOffers[0].direction, "promotion");
  state.sequelOffers = [offer({ termsVersion: undefined })];
  syncSequelOfferFlags();
  assert.equal(state.sequelOffers[0].requiredSessions, 2);
  state.sequelOffers = [offer()];
  state.eventFlags = ["sequel-creative:S1"];
  syncSequelOfferFlags();
  assert.equal(state.sequelOffers[0].direction, "creative");
  assert.equal(state.sequelOffers[0].requiredSessions, 3);
  assert.equal(state.sequelOffers[0].payMultiplier, 1);
  hydrateState(structuredClone(state));
  assert.equal(state.sequelOffers[0].direction, "creative");
});

test("sequel quality responds to practiced ability, condition and chosen production direction", () => {
  const zero = () => 0;
  const weak = offer({
    completedSessions: 2,
    skillTotal: 200,
    conditionTotal: 80,
  });
  const strong = offer({
    completedSessions: 2,
    skillTotal: 1400,
    conditionTotal: 200,
  });
  assert.ok(sequelQuality(strong, zero) > sequelQuality(weak, zero));
  assert.ok(
    sequelQuality({ ...strong, direction: "creative" }, zero) >
      sequelQuality(strong, zero),
  );
  assert.ok(
    sequelQuality({ ...weak, direction: "creative" }, zero) <
      sequelQuality(weak, zero),
  );
  assert.equal(sequelQuality(offer({ termsVersion: undefined }), zero), 85);
});

test("sequel day and payout settle once, extra contracted day is required", () => {
  fresh();
  state.completedWorks = [{ id: "W1", quality: 85 }];
  state.sequelOffers = [offer()];
  state.eventFlags = ["sequel-negotiate:S1"];
  syncSequelOfferFlags();
  const before = state.money;
  for (let day = 0; day < 3; day++) {
    state.runnerDay = day;
    const result = completeSequelSession("S1");
    assert.equal(result.ok, true);
    if (day < 2) assert.equal(state.money, before);
    assert.equal(completeSequelSession("S1").ok, false);
  }
  assert.equal(state.money - before, Math.round(18500 * 1.25));
  assert.equal(state.completedWorks.filter((w) => w.sequel).length, 1);
});

test("weekly goal selection locks after execution, migrates safely and resets next week", () => {
  fresh();
  assert.equal(selectWeeklyGoal(state, "craft").ok, true);
  assert.equal(selectWeeklyGoal(state, "invalid").ok, false);
  hydrateState(structuredClone(state));
  assert.equal(currentWeeklyGoal(state).id, "craft");
  state.weekResults = [{ dayIndex: 0, success: false }];
  assert.equal(selectWeeklyGoal(state, "life").ok, false);
  state.week++;
  assert.equal(currentWeeklyGoal(state).id, "balanced");
  assert.equal(weeklyGoalOptions({ week: 209 })[1].label, "打磨最後的作品");
  const old = structuredClone(state);
  delete old.weeklyGoal;
  hydrateState(old);
  assert.equal(currentWeeklyGoal(state).id, "balanced");
});

test("career-stage goals have distinct conditions and never count failed production", () => {
  fresh();
  state.week = 60;
  selectWeeklyGoal(state, "craft");
  assert.equal(weeklyTaskReady({ train: 1, work: 2, production: 0 }), false);
  assert.equal(weeklyTaskReady({ train: 1, work: 2, production: 2 }), true);
  selectWeeklyGoal(state, "market");
  assert.equal(weeklyTaskReady({ work: 2, publicity: 0 }), false);
  assert.equal(weeklyTaskReady({ work: 2, publicity: 1 }), true);
  selectWeeklyGoal(state, "life");
  assert.equal(weeklyTaskReady({ work: 1, life: 3 }), true);
  state.weekResults = [
    { dayIndex: 0, actionId: "job_session", success: false },
  ];
  assert.equal(weeklyTaskCounts().production, 0);
  state.weekResults[0].success = true;
  assert.equal(weeklyTaskCounts().production, 1);
});

test("weekly goal reward and UI agree and re-evaluation cannot pay twice", () => {
  fresh();
  selectWeeklyGoal(state, "life");
  state.schedule = [
    "newcomer_gig",
    "rest",
    "rest",
    "rest",
    "rest",
    "rest",
    "rest",
  ];
  state.weekResults = state.schedule.map((actionId, dayIndex) => ({
    actionId,
    dayIndex,
    success: true,
  }));
  const before = state.money;
  const reward = evaluateWeeklyTask();
  assert.equal(reward.met, true);
  assert.equal(reward.goalId, "life");
  assert.equal(evaluateWeeklyTask(), reward);
  assert.equal(state.money, before + 1500);
  assert.match(weeklyTaskMarkup(), /data-weekly-goal="life"/);
  assert.match(weeklyTaskMarkup(), /生活／休息 3 天/);
});

function partner() {
  fresh();
  meetNpc("tangtang");
  state.partnerId = "tangtang";
  state.week = 100;
  Object.assign(state.relationships.tangtang, {
    romance: "dating",
    romanceSinceWeek: 1,
    affection: 100,
    trust: 100,
    closeness: 100,
  });
}

test("pixel sequel bookings reserve selected dates, include promotion and reject surplus days", () => {
  const life = initialLife("sequel-growth-bookings");
  life.game.week = 16;
  life.game.sequelOffers = [offer({ status: "active", direction: "promotion", requiredSessions: 3 })];
  for (let day = 0; day < 3; day++) assert.equal(bookCareer(life, CHOICES, "sequel", { offerId: "S1" }, day).ok, true);
  const third = life.game.scheduledActivities[life.plan[2].taskId];
  assert.match(third.label, /宣傳/);
  const before = structuredClone(life);
  assert.equal(bookCareer(life, CHOICES, "sequel", { offerId: "S1" }, 3).ok, false);
  assert.deepEqual(life, before);
  const saved = normalizeLife(life);
  assert.equal(saved.game.sequelOffers[0].direction, "promotion");
});

test("pixel audition decision and daily result use the earned technique after normalization", () => {
  const life = initialLife("technique-growth-integration");
  const job = JOB_CATALOG.find(j => j.category === "電影");
  life.game.trainingNarrativeProgress = { acting: { stage: "breakthrough", sessions: 5 } };
  life.game.activeJobs[job.id] = { stage: "audition_scheduled" };
  life.game.scheduledActivities.T1 = { id: "T1", kind: "job_audition", payload: { jobId: job.id }, week: life.game.week, day: 0, status: "scheduled", label: "試鏡", cost: 0, fatigue: 10, stamina: 10 };
  life.game.scheduledActivityIds[0] = "T1";
  life.plan[0] = { id: "career_task", taskId: "T1" };
  assert.ok(careerDecision(life, life.plan[0]).choices.some(c => c.id === "technique:acting"));
  const loaded = normalizeLife(life);
  assert.ok(!beginDay(loaded, loaded.plan[0]).error);
  const result = settleDay(loaded, "technique:acting");
  assert.ok(result && !result.error);
  assert.equal(loaded.game.activeJobs[job.id].auditionChoice, "technique:acting");
});
test("commitment needs shared experience, not numbers alone; different experiences work", () => {
  partner();
  assert.equal(romanceOpportunity("tangtang"), null);
  assert.match(romanceProgress("tangtang"), /共同經歷/);
  recordCharacterMemory("tangtang", {
    kind: "shared",
    key: "bond:private",
    value: "private",
    text: "分享自己的事",
  });
  assert.equal(romanceOpportunity("tangtang").next, "committed");
  assert.equal(transitionRomance("tangtang", "committed").ok, true);
  state.week += 26;
  assert.equal(romanceOpportunity("tangtang"), null);
  recordCharacterMemory("tangtang", {
    kind: "promise",
    key: "work-check-in",
    value: "work",
    status: "fulfilled",
  });
  assert.equal(romanceOpportunity("tangtang").next, "engaged");
  hydrateState(structuredClone(state));
  assert.equal(romanceOpportunity("tangtang").next, "engaged");
  assert.deepEqual(characterMemory("tangtang").bonds.sort(), [
    "private",
    "reliability",
  ]);
});

test("old caring memories count, repeated identical experiences do not manufacture variety", () => {
  partner();
  recordCharacterMemory("tangtang", {
    kind: "response",
    key: "support",
    value: "listened",
  });
  assert.equal(romanceOpportunity("tangtang").next, "committed");
  for (let i = 0; i < 5; i++) {
    state.week++;
    recordCharacterMemory("tangtang", {
      kind: "response",
      key: "support",
      value: "listened",
    });
  }
  assert.deepEqual(characterMemory("tangtang").bonds, ["care"]);
  state.relationships.tangtang.romance = "married";
  hydrateState(structuredClone(state));
  assert.equal(state.relationships.tangtang.romance, "married");
});

test("subsidy warns before each price transition while ordinary actions are unchanged", () => {
  for (const week of [8, 10, 12])
    assert.match(trainingSubsidyNotice(week), /下週將改為/);
  for (const week of [1, 8, 9, 10, 11, 12, 13])
    assert.equal(effectiveActionCost(ACTIONS.free, week), 300);
  assert.equal(effectiveActionCost(ACTIONS.vocal, 10), 640);
  assert.equal(effectiveActionCost(ACTIONS.vocal, 12), 720);
});

test("a completed personal encounter records one distinct bond, not two from the same response", () => {
  partner();
  const task = {
    kind: "npc_interact",
    payload: { npcId: "tangtang", type: "personal" },
  };
  const decision = npcInteractionDecision(task);
  const result = resolveNpcInteraction(task, decision.choices[0].id);
  assert.equal(result.ok, true);
  assert.deepEqual(characterMemory("tangtang").bonds, ["private"]);
});

test("later years offer team, transition and life-work goals with real differing conditions", () => {
  fresh();
  state.week = 105;
  assert.equal(selectWeeklyGoal(state, "team").ok, true);
  assert.equal(weeklyTaskReady({ production: 1, connection: 0 }), false);
  assert.equal(weeklyTaskReady({ production: 1, connection: 1 }), true);
  state.week = 157;
  assert.equal(selectWeeklyGoal(state, "rebalance").ok, true);
  assert.equal(weeklyTaskReady({ train: 1, work: 1, life: 2 }), true);
  state.week = 209;
  assert.equal(selectWeeklyGoal(state, "legacy").ok, true);
  assert.equal(
    weeklyTaskReady({ production: 1, connection: 1, life: 1 }),
    false,
  );
  assert.equal(
    weeklyTaskReady({ production: 1, connection: 1, life: 2 }),
    true,
  );
});

test("new sequel invitation offers visible costs rather than free extra pay", () => {
  fresh();
  state.completedWorks = [
    { id: "W1", title: "首作", quality: 90, stars: 3, category: "電影" },
  ];
  let result;
  for (let i = 0; i < 100 && !result; i++) result = tickSequelOpportunities();
  assert.ok(result);
  const event = [
    state.activeEvent,
    ...state.eventQueue,
    ...state.queuedEvents,
  ].find((e) => e?.event?.id === `sequel:${result.id}`)?.event;
  assert.ok(event.choices.some((c) => c.id === "creative"));
  assert.match(
    event.choices.find((c) => c.id === "negotiate").note,
    /多占一天/,
  );
});
