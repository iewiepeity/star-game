import { test } from "node:test";
import assert from "node:assert/strict";
import {
  initialLife,
  beginDay,
  settleDay,
  advanceDay,
  nextWeek,
  planDay,
  access,
  arriveAt,
  CHOICES,
  definition,
  newProject,
  recordMeeting,
  normalizeLife,
  withCore,
  compactLifeHistory,
} from "../src/pixel/life.js";
import {
  bookCareer,
  careerCommand,
  careerDecision,
  currentStory,
  chooseStory,
  attachReservationLocations,
} from "../src/pixel/career.js";
import { JOB_CATALOG } from "../src/data/jobs.js";
import { AGENCIES } from "../src/data/agencies.js";
import { ROOMS, ACTIVITY_SPOTS } from "../src/pixel/data.js";
import { cityItinerary } from "../src/pixel/cast.js";
import { enqueueVisibleEvent } from "../src/logic/event-engine.js";
import { canApplyToAgency } from "../src/logic/agency.js";
import {
  eligibleCreativeCollaborators,
  toggleCreativeCollaborator,
  setCreativeBudget,
} from "../src/logic/creative-team.js";
const complete = (l, a = l.plan[l.day], choice = "steady") => {
  const pending = beginDay(l, a);
  assert.ok(!pending.error, pending.error);
  const d = definition(l, a);
  assert.ok(
    ROOMS[d.room]?.objects.some((o) => o.id === d.item),
    JSON.stringify(d),
  );
  assert.ok(ACTIVITY_SPOTS[d.room][d.item]?.kinds.includes(d.pose));
  const r = settleDay(l, choice);
  assert.ok(r && !r.error, r?.error);
  const saved = structuredClone(l.game);
  assert.deepEqual(settleDay(l, choice), r);
  assert.deepEqual(l.game, saved);
  advanceDay(l);
  return r;
};
const endWeek = (l) => {
  while (l.day < 7) complete(l, { id: "rest" });
  assert.equal(nextWeek(l), true);
};
const skilled = (seed = "career-0") => {
  const l = initialLife(seed);
  l.game.money = 100000;
  l.game.stats = Object.fromEntries(
    Object.keys(l.game.stats).map((k) => [k, 350]),
  );
  l.game.trainingSessionsCompleted = 20;
  l.game.contract = 90;
  return l;
};

test("public access → audition day → offer → signed work → completed portfolio; once per day across reload", () => {
  const l = skilled();
  const j = JOB_CATALOG.find((j) => j.stars === 1 && j.category === "電視劇");
  assert.equal(careerCommand(l, "apply-job", j.id).ok, false);
  arriveAt(l, "tv");
  assert.equal(careerCommand(l, "apply-job", j.id).ok, true);
  assert.equal(bookCareer(l, CHOICES, "audition", { jobId: j.id }, 0).ok, true);
  assert.ok(careerDecision(l, l.plan[0]).choices.length);
  assert.equal(normalizeLife(l).plan[0].taskId, l.plan[0].taskId);
  complete(l);
  assert.equal(l.game.activeJobs[j.id].stage, "passed");
  assert.equal(careerCommand(l, "sign-job", j.id).ok, true);
  for (
    let weeks = 0;
    weeks < j.deadlineWeeks && l.game.activeJobs[j.id].stage === "active";
    weeks++
  ) {
    for (let day = l.day; day < 7; day++) {
      const b = bookCareer(l, CHOICES, "job", { jobId: j.id }, day);
      complete(l, b.ok ? l.plan[day] : { id: "rest" });
      if (l.game.activeJobs[j.id].stage === "completed") break;
    }
    if (l.game.activeJobs[j.id].stage === "active") endWeek(l);
  }
  assert.equal(l.game.activeJobs[j.id].stage, "completed");
  assert.equal(l.game.completedWorks.filter((w) => w.jobId === j.id).length, 1);
  assert.ok(l.game.money > 100000);
});
test("agency application waits one week, then interview and offer stay separate", () => {
  const l = skilled("agency");
  arriveAt(l, "agency_starlight");
  assert.equal(
    withCore(l, () => canApplyToAgency(AGENCIES.starlight)),
    true,
  );
  assert.equal(careerCommand(l, "apply-agency", "starlight").ok, true);
  assert.equal(
    bookCareer(l, CHOICES, "interview", { agencyId: "starlight" }, 0).ok,
    false,
  );
  assert.equal(l.game.currentAgencyId, null);
  endWeek(l);
  assert.equal(
    bookCareer(l, CHOICES, "interview", { agencyId: "starlight" }, 0).ok,
    true,
  );
  complete(l);
  assert.equal(l.game.agencyOffer?.agencyId, "starlight");
  assert.equal(l.game.currentAgencyId, null);
  assert.equal(careerCommand(l, "accept-agency", "starlight").ok, true);
  const end = l.game.agencyContractEndWeek;
  assert.equal(careerCommand(l, "accept-agency", "starlight").ok, false);
  assert.equal(l.game.agencyContractEndWeek, end);
});
test("bookings cannot use past days, overwrite another commitment, or silently choose another date", () => {
  const l = skilled();
  recordMeeting(l, "sufei");
  complete(l, { id: "rest" });
  assert.equal(
    bookCareer(l, CHOICES, "npc", { npcId: "sufei", type: "chat" }, 0).ok,
    false,
  );
  assert.equal(
    bookCareer(l, CHOICES, "npc", { npcId: "sufei", type: "chat" }, 2).ok,
    true,
  );
  const before = structuredClone(l);
  assert.equal(
    bookCareer(l, CHOICES, "npc", { npcId: "sufei", type: "meal" }, 2).ok,
    false,
  );
  assert.deepEqual(l, before);
  assert.equal(planDay(l, 2, { id: "rest" }), "");
  assert.equal(l.game.npcSchedules.sufei[0].status, "released");
  assert.equal(
    bookCareer(l, CHOICES, "npc", { npcId: "sufei", type: "meal" }, 2).ok,
    true,
  );
});
test("NPC reservation appears in one scene, respects dates and charges meal only once", () => {
  const l = skilled();
  recordMeeting(l, "sufei");
  const before = l.game.money;
  assert.equal(
    bookCareer(l, CHOICES, "npc", { npcId: "sufei", type: "meal" }, 0).ok,
    true,
  );
  assert.equal(l.game.money, before);
  for (const t of [0, 50, 100, 239])
    assert.equal(cityItinerary("sufei", t, { life: l }).scene, "restaurant");
  assert.equal(cityItinerary("sufei", 0, { life: l }).busy, false);
  complete(l, l.plan[0], careerDecision(l, l.plan[0]).choices[0].id);
  assert.equal(l.game.money, before - 700);
  assert.equal(l.game.npcSchedules.sufei[0].status, "completed");
  assert.ok(l.game.npcInteractionMemories.length);
  assert.equal(
    bookCareer(l, CHOICES, "npc", { npcId: "sufei", type: "meal" }, 1).ok,
    false,
  );
});
test("original production keeps team, budget, release and awards; surplus booked days are released", () => {
  const l = skilled();
  recordMeeting(l, "tangtang");
  l.game.relationships.tangtang.trust = 70;
  const p = newProject(l, "song", "像素裡的一首歌");
  while (l.game.creativeProjects[0].status !== "ready") {
    if (l.day === 7) nextWeek(l);
    complete(l, { id: "creative", projectId: p.id });
  }
  assert.equal(careerCommand(l, "independent", p.id).ok, true);
  assert.ok(
    withCore(l, () =>
      eligibleCreativeCollaborators(l.game.creativeProjects[0]),
    ).some((n) => n.id === "tangtang"),
  );
  withCore(l, () => {
    toggleCreativeCollaborator(p.id, "tangtang");
    setCreativeBudget(p.id, "standard");
  });
  const before = l.game.money;
  for (
    let i = 0;
    i < 10 && l.game.creativeProjects[0].status !== "ready_release";
    i++
  ) {
    if (l.day === 7) nextWeek(l);
    // Autonomous calendars can block a date. Reserve at a genuinely free date.
    const r = bookCareer(
      l,
      CHOICES,
      "creative_production",
      { projectId: p.id },
      l.day,
    );
    complete(l, r.ok ? l.plan[l.day] : { id: "rest" });
  }
  assert.equal(l.game.creativeProjects[0].status, "ready_release");
  assert.equal(l.game.creativeProjects[0].budgetSpent, 3500);
  assert.ok(l.game.money >= before - 3500);
  if (l.day === 7) nextWeek(l);
  assert.equal(
    bookCareer(l, CHOICES, "creative_release", { projectId: p.id }, l.day).ok,
    true,
  );
  complete(l);
  assert.equal(l.game.completedWorks.length, 1);
  assert.ok(l.game.completedWorks[0].original);
  assert.deepEqual(l.game.completedWorks[0].npcCast, ["tangtang"]);
});
test("story choices remain pending until chosen, duplicate clicks and reload do not apply twice", () => {
  const l = initialLife("story");
  withCore(l, () =>
    enqueueVisibleEvent({
      id: "pixel-story-test",
      kind: "人物事件",
      title: "一句真心話",
      text: "今天有些不同。",
      choices: [{ id: "listen", label: "聽他說", effects: [{ money: 300 }] }],
    }),
  );
  const story = currentStory(l);
  assert.equal(story.event.id, "pixel-story-test");
  const before = l.game.money;
  assert.equal(chooseStory(l, "invalid"), null);
  assert.equal(l.game.money, before);
  chooseStory(l, "listen");
  const reloaded = normalizeLife(l);
  assert.equal(reloaded.game.money, before + 300);
  assert.equal(chooseStory(reloaded, "listen"), null);
  assert.equal(currentStory(reloaded).outcome.id, "pixel-story-test");
});
test("overseas requires the original later-game thresholds and full budget", () => {
  const l = skilled();
  assert.match(access(l, { id: "overseas" }), /第二年/);
  l.game.week = 53;
  l.game.fame = 80;
  l.game.completedWorks = Array.from({ length: 3 }, (_, i) => ({
    id: `w${i}`,
  }));
  l.game.money = 4999;
  assert.match(access(l, { id: "overseas" }), /現金/);
  l.game.money = 5000;
  complete(l, { id: "overseas" }, "festival");
  assert.equal(l.game.money, 0);
  assert.equal(l.game.overseasVisits, 1);
});
test("completed works, agency expiry and NPC clocks advance with original weekly simulation", () => {
  const l = skilled();
  l.game.currentAgencyId = "starlight";
  l.game.agencyContractEndWeek = 1;
  l.game.agencyApplications.starlight = { status: "signed" };
  endWeek(l);
  assert.equal(l.game.currentAgencyId, null);
  assert.equal(l.game.week, 2);
  assert.ok(Object.keys(l.game.npcCareers).length >= 10);
  assert.equal(l.game.history.length, 1);
  assert.ok(l.worldNews);
});
test("the five-year career reaches a saved ending instead of an endless week counter", () => {
  const l = initialLife("five-years");
  l.game.week = 260;
  endWeek(l);
  assert.equal(l.game.week, 261);
  assert.equal(l.game.endingResult.trigger, "fiveyear");
  assert.match(access(l, { id: "rest" }), /旅程已完成/);
  assert.equal(
    normalizeLife(l).game.endingResult.title,
    l.game.endingResult.title,
  );
});
test("new room foreground masks never reuse floor collision polygons; market excludes caption area", () => {
  for (const room of Object.values(ROOMS).filter((r) => r.crop))
    for (const mask of room.foreground)
      assert.ok(
        !room.blocks.some(
          (p) => JSON.stringify(p) === JSON.stringify(mask.polygon),
        ),
      );
  assert.ok(ROOMS.market.artOutline.length > 5);
  assert.ok(ROOMS.livehouse.foreground.length > 0);
  const l = skilled();
  attachReservationLocations(l.game);
});
test("older pixel summaries migrate once while current settlement and first-work milestone survive compaction", () => {
  const l = initialLife("history-migration");
  l.game.week = 6;
  l.summaries = Array.from({ length: 5 }, (_, i) => ({
    week: i + 1,
    reward: { money: 200 },
    results: [{ day: 0, label: "工作", notes: ["完成拍攝"] }],
  }));
  const old = { id: "first", week: 1, assignment: { id: "tv_assistant" } };
  const recent = { id: "current", week: 6, assignment: { id: "rest" } };
  l.ledger = [old, recent];
  compactLifeHistory(l);
  assert.equal(l.milestones.firstWork, true);
  assert.deepEqual(l.ledger, [recent]);
  assert.equal(l.summaries.length, 2);
  assert.equal(l.game.history.length, 5);
  assert.equal(l.game.history[0].results[0].result, "完成拍攝");
  compactLifeHistory(l);
  assert.equal(l.game.history.length, 5);
  const reloaded = normalizeLife(l);
  assert.equal(reloaded.milestones.firstWork, true);
  assert.deepEqual(reloaded.ledger, [recent]);
});
