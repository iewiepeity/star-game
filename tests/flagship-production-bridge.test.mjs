import test from "node:test";
import assert from "node:assert/strict";
import { JOB_BY_ID } from "../src/data/jobs.js";
import { jobStoryline } from "../src/data/job-storylines.js";
import {
  ensureJobState,
  completeJobSession,
  jobProductionDecision,
} from "../src/logic/job-engine.js";
import { resolveEvent } from "../src/logic/event-engine.js";
import {
  initialLife,
  normalizeLife,
  withCore,
  beginDay,
  settleDay,
  advanceDay,
  CHOICES,
} from "../src/pixel/life.js";
import { bookCareer, careerDecision } from "../src/pixel/career.js";

const JOB_ID = "J061";
const EVENT_ID = `flagship-choice:${JOB_ID}`;
const assignment = { id: "career_job", jobId: JOB_ID };
const reload = (life) => normalizeLife(JSON.parse(JSON.stringify(life)));
const unrelated = (id) => ({
  event: {
    id,
    title: "仍在等玩家回覆的另一件事",
    text: "這件事不應阻擋工作現場的決定。",
    choices: [{ id: "listen", label: "聽完", effects: [{ money: 100 }] }],
  },
  source: "人物事件",
  queuedWeek: 12,
  dueWeek: 13,
});
const unrelatedEvents = (game) => [
  game.activeEvent,
  ...game.eventQueue,
  ...game.queuedEvents,
].filter((item) => item?.event?.id?.startsWith("unrelated:"));
const flagshipSnapshots = (game) => [
  game.activeEvent,
  ...game.eventQueue,
  ...game.queuedEvents,
].filter((item) => item?.event?.id === EVENT_ID);

function preparedLife() {
  const life = initialLife("flagship-production-bridge");
  life.plan = Array.from({ length: 7 }, () => ({ id: "rest" }));
  life.day = 2; // J061 can work on Wednesday, Friday and Saturday this week.
  withCore(life, (game) => {
    game.week = 12;
    game.money = 100000;
    game.stats = Object.fromEntries(Object.keys(game.stats).map((key) => [key, 350]));
    game.hidden.洞察 = 700;
    game.hidden.抗壓 = 700;
    game.rep.可信度 = 100;
    game.rep.業界評價 = 100;
    game.rep.話題度 = 100;
    game.eventPresentedWeek = game.week;
    game.activeEvent = unrelated("unrelated:active");
    game.eventQueue = [unrelated("unrelated:visible")];
    game.queuedEvents = [unrelated("unrelated:delayed")];
    const record = ensureJobState(JOB_ID);
    Object.assign(record, {
      stage: "active",
      signedWeek: 8,
      deadlineWeek: 20,
      auditionChoice: "steady",
      npcCast: [],
      npcScheduleSlots: [],
    });
    assert.equal(JOB_BY_ID[JOB_ID].sessions, 6);
    for (let i = 0; i < 3; i++) {
      assert.equal(jobProductionDecision(JOB_ID), null);
      const result = completeJobSession(JOB_ID);
      assert.equal(result.ok, true);
      assert.equal(result.completed, false);
    }
  });
  assert.equal(life.game.activeJobs[JOB_ID].completedSessions, 3);
  assert.equal(life.game.completedWorks.length, 0);
  return life;
}

function bookAndBegin(life) {
  const result = bookCareer(life, CHOICES, "job", { jobId: JOB_ID }, life.day);
  assert.equal(result.ok, true, result.message);
  const pending = beginDay(life);
  assert.ok(!pending.error, pending.error);
  return pending;
}

function finishPixelBranch(initial, choiceId) {
  let life = reload(initial);
  const pendingEvents = structuredClone(unrelatedEvents(life.game));
  const beforeRep = structuredClone(life.game.rep);
  const beforeMoney = life.game.money;
  const story = jobStoryline(JOB_ID);
  bookAndBegin(life);
  const decision = careerDecision(life, assignment);
  assert.equal(decision?.id, EVENT_ID);
  assert.equal(decision.kind, "職涯事件");
  assert.equal(decision.decisionKind, "job_production");
  assert.ok(decision.text.includes(story.production[1].text));
  assert.equal(
    decision.choices.find((choice) => choice.id === choiceId).label,
    story.flagshipChoices[choiceId].label,
  );
  // Save while standing at the production choice, with the weekly story slot occupied.
  life = reload(life);
  assert.equal(careerDecision(life, assignment)?.id, EVENT_ID);
  const fourth = settleDay(life, choiceId);
  assert.equal(fourth.presentation.ok, true);
  assert.equal(life.game.activeJobs[JOB_ID].completedSessions, 4);
  assert.ok(life.game.eventFlags.includes(`flagship:${JOB_ID}:${choiceId}`));
  assert.equal(life.game.money, beforeMoney);
  assert.equal(life.game.rep.可信度, beforeRep.可信度 + 5);
  assert.equal(life.game.rep.業界評價, beforeRep.業界評價 + (choiceId === "signature" ? 9 : 0));
  assert.deepEqual(unrelatedEvents(life.game), pendingEvents);
  assert.equal(flagshipSnapshots(life.game).length, 0);
  assert.equal(careerDecision(life, assignment), null);

  life = reload(life);
  const afterFourth = structuredClone(life.game);
  assert.deepEqual(settleDay(life, choiceId), fourth);
  assert.deepEqual(life.game, afterFourth, "reloading a settled day must not award the choice twice");
  assert.equal(advanceDay(life), true);
  assert.ok(!beginDay(life, { id: "rest" }).error);
  assert.ok(!settleDay(life).error);
  assert.equal(advanceDay(life), true);

  let final;
  for (const sessions of [5, 6]) {
    bookAndBegin(life);
    assert.equal(careerDecision(life, assignment), null);
    final = settleDay(life);
    assert.equal(final.presentation.ok, true);
    assert.equal(life.game.activeJobs[JOB_ID].completedSessions, sessions);
    if (sessions === 5) assert.equal(advanceDay(life), true);
  }
  const work = final.presentation.work;
  assert.equal(final.presentation.completed, true);
  assert.equal(work.storyChoice, choiceId);
  assert.ok(final.presentation.text.includes(story.flagshipChoices[choiceId].outcome));
  assert.equal(life.game.eventHistory.filter((item) => item.id === EVENT_ID).length, 1);
  assert.equal(life.game.completedWorks.filter((item) => item.jobId === JOB_ID).length, 1);
  assert.equal(life.game.activeJobs[JOB_ID].stage, "completed");
  assert.equal(life.game.activeJobs[JOB_ID].remainingSessions, 0);
  life = reload(life);
  const afterCompletion = structuredClone(life.game);
  assert.deepEqual(settleDay(life, choiceId), final);
  assert.deepEqual(life.game, afterCompletion, "a saved completion cannot pay a second time");
  assert.equal(careerDecision(life, assignment), null);
  return { life, work };
}

test("pixel work presents the J061 midpoint choice despite occupied story queues, and saves its outcome before quality is scored", () => {
  const initial = preparedLife();
  const protect = finishPixelBranch(initial, "protect");
  const signature = finishPixelBranch(initial, "signature");
  assert.ok(signature.work.quality < 100, "the quality comparison must stay below the cap");
  assert.equal(signature.work.quality, protect.work.quality + 3);
  assert.equal(signature.life.game.rngCursor, protect.life.game.rngCursor);
});

test("an unanswered or locked production choice cannot advance progress or grant rewards", () => {
  const life = preparedLife();
  life.game.hidden.洞察 = 599;
  life.game.hidden.抗壓 = 600;
  const decision = careerDecision(life, assignment);
  assert.deepEqual(decision.choices.map((choice) => choice.id), ["protect", "breakthrough"]);
  const before = structuredClone(life.game);
  for (const choiceId of [null, "not-a-choice", "signature"]) {
    const result = withCore(life, () => completeJobSession(JOB_ID, choiceId));
    assert.equal(result.ok, false);
    assert.equal(result.pending, true);
    assert.equal(result.decision.id, EVENT_ID);
    assert.deepEqual(life.game, before, `${choiceId} must leave the entire game state unchanged`);
  }
});

test("pixel settling without the required choice keeps the day open without a ledger entry or activity cost", () => {
  const life = preparedLife();
  bookAndBegin(life);
  const before = structuredClone(life.game);
  const ledger = structuredClone(life.ledger);
  const result = settleDay(life, null);
  assert.ok(result.pending || result.error || result.presentation?.pending);
  assert.deepEqual(life.game, before);
  assert.deepEqual(life.ledger, ledger);
  assert.notEqual(life.pending.phase, "result");
  assert.equal(advanceDay(life), false);
});

function legacySnapshot(life) {
  const event = structuredClone(careerDecision(life, assignment));
  event.kind = "職涯事件";
  delete event.requires; // Old saved queue entries predate the active-job condition.
  return event;
}

function addLegacyCopies(life, event, active = false) {
  const snapshot = {
    event: structuredClone(event),
    source: "旗艦作品",
    queuedWeek: life.game.week - 1,
    dueWeek: life.game.week + 1,
    priority: 110,
  };
  life.game.eventQueue.push(structuredClone(snapshot));
  life.game.queuedEvents.push(structuredClone(snapshot));
  if (active) life.game.activeEvent = structuredClone(snapshot);
  life.game.activeJobs[JOB_ID].flagshipDecisionQueued = true;
}

test("answering during production removes every old queued snapshot, including an active copy", () => {
  for (const active of [false, true]) {
    let life = preparedLife();
    const event = legacySnapshot(life);
    addLegacyCopies(life, event, active);
    const otherEvents = structuredClone(unrelatedEvents(life.game));
    life = reload(life);
    const result = withCore(life, () => completeJobSession(JOB_ID, "protect"));
    assert.equal(result.ok, true);
    assert.equal(life.game.activeJobs[JOB_ID].completedSessions, 4);
    assert.equal(flagshipSnapshots(life.game).length, 0);
    assert.deepEqual(unrelatedEvents(life.game), otherEvents);
    assert.equal(careerDecision(life, assignment), null);
    const beforeRep = structuredClone(life.game.rep);
    const beforeHistory = structuredClone(life.game.eventHistory);
    assert.equal(withCore(life, () => resolveEvent(event, "signature")), null);
    assert.deepEqual(life.game.rep, beforeRep);
    assert.deepEqual(life.game.eventHistory, beforeHistory);
  }
});

test("an old queued event remains answerable, and a reload preserves its choice without a second production prompt or reward", () => {
  let life = preparedLife();
  const event = legacySnapshot(life);
  addLegacyCopies(life, event, true);
  const beforeRep = life.game.rep.話題度;
  const response = withCore(life, () => resolveEvent(life.game.activeEvent.event, "breakthrough"));
  assert.equal(response.choice, "breakthrough");
  assert.equal(life.game.rep.話題度, beforeRep + 7);
  assert.equal(life.game.activeJobs[JOB_ID].completedSessions, 3);
  assert.equal(flagshipSnapshots(life.game).length, 0);
  life = reload(life);
  assert.equal(careerDecision(life, assignment), null);
  let completed;
  for (let i = 0; i < 3; i++) {
    completed = withCore(life, () => completeJobSession(JOB_ID));
    assert.equal(completed.ok, true);
  }
  assert.equal(completed.work.storyChoice, "breakthrough");
  assert.equal(life.game.rep.話題度, beforeRep + 7);
  assert.equal(life.game.eventHistory.filter((item) => item.id === EVENT_ID).length, 1);
  life = reload(life);
  const before = structuredClone(life.game);
  assert.equal(withCore(life, () => resolveEvent(event, "breakthrough")), null);
  assert.deepEqual(life.game, before);
});

test("an unanswered old snapshot cannot award a flagship choice after its work has completed", () => {
  let life = preparedLife();
  const event = legacySnapshot(life);
  const record = life.game.activeJobs[JOB_ID];
  Object.assign(record, { stage: "completed", completedSessions: 6, remainingSessions: 0 });
  life.game.completedWorks.push({
    id: "legacy-work-J061",
    jobId: JOB_ID,
    title: JOB_BY_ID[JOB_ID].title,
    quality: 71,
    storyChoice: "steady",
    completedWeek: life.game.week,
  });
  addLegacyCopies(life, event, true);
  life = reload(life);
  const beforeRep = structuredClone(life.game.rep);
  const beforeWorks = structuredClone(life.game.completedWorks);
  const beforeHistory = structuredClone(life.game.eventHistory);
  const beforeFlags = structuredClone(life.game.eventFlags);
  assert.equal(withCore(life, () => resolveEvent(event, "signature")), null);
  assert.deepEqual(life.game.rep, beforeRep);
  assert.deepEqual(life.game.completedWorks, beforeWorks);
  assert.deepEqual(life.game.eventHistory, beforeHistory);
  assert.deepEqual(life.game.eventFlags, beforeFlags);
  assert.equal(careerDecision(life, assignment), null);
});
