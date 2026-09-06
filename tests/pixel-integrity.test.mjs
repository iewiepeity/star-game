import test from "node:test";
import assert from "node:assert/strict";
import { readdir } from "node:fs/promises";
import { initialPixelState, validatePixelState } from "../src/pixel/model.js";
import {
  initialLife,
  recordMeeting,
  beginDay,
  settleDay,
  CHOICES,
  withCore,
  arriveAt,
} from "../src/pixel/life.js";
import {
  currentStory,
  chooseStory,
  bookCareer,
  careerCommand,
  attachReservationLocations,
  productionRoom,
} from "../src/pixel/career.js";
import { eventContext } from "../src/logic/event-context.js";
import { queueNpcStoryEvents } from "../src/logic/npc-storylines.js";
import { setWeeklyFocus } from "../src/pixel/planner-tools.js";
import { newRun } from "../src/pixel/save-transfer.js";
import { cityItinerary } from "../src/pixel/cast.js";
import { JOB_CATALOG } from "../src/data/jobs.js";
import { ABILITIES, HIDDEN_TRAITS } from "../src/data/abilities.js";

test("relationship stories never introduce an unknown NPC just by queuing or reading", () => {
  const l = initialLife();
  withCore(l, queueNpcStoryEvents);
  assert.equal(currentStory(l), null);
  recordMeeting(l, "sufei", "rehearsal");
  withCore(l, queueNpcStoryEvents);
  const known = [...l.game.knownPeople];
  const rel = structuredClone(l.game.relationships.sufei);
  const story = currentStory(l);
  assert.deepEqual(story.context.npcIds, ["sufei"]);
  assert.deepEqual(l.game.relationships.sufei, rel);
  assert.deepEqual(l.game.knownPeople, known);
});
test("neutral relationship choice retains portrait context and original week through save/load", () => {
  const s = initialPixelState();
  recordMeeting(s.life, "sufei", "cafe");
  s.life.game.week = 4;
  withCore(s.life, queueNpcStoryEvents);
  s.life.game.week = 5;
  assert.equal(currentStory(s.life).context.week, 4);
  const result = chooseStory(s.life, "steady");
  assert.deepEqual(result.storyContext.npcIds, ["sufei"]);
  assert.equal(result.storyContext.week, 4);
  const saved = validatePixelState(s);
  assert.deepEqual(currentStory(saved.life).context.npcIds, ["sufei"]);
  const before = structuredClone(saved.life.game);
  assert.equal(chooseStory(saved.life, "steady"), null);
  assert.deepEqual(saved.life.game, before);
});
test("v0.7 result missing effect objects recovers NPC identity without changing acquaintances", () => {
  const l = initialLife();
  l.game.eventOutcome = {
    id: "npc-story-sufei:stage:acquaintance",
    week: 4,
    title: "許映真｜關係開始有了名字",
    outcome: "你和許映真的距離又近了一些。",
    effects: ["心情＋1"],
  };
  const before = [...l.game.knownPeople];
  assert.deepEqual(currentStory(l).context.npcIds, ["sufei"]);
  assert.deepEqual(l.game.knownPeople, before);
  assert.deepEqual(
    eventContext({
      choices: [{ effects: [{ npc: "jiqing" }, { npc: "sufei" }] }],
    }).npcIds,
    ["jiqing", "sufei"],
  );
});
test("in-person meeting records its actual room and repeats do not rewrite first meeting", () => {
  const l = initialLife();
  l.day = 3;
  const first = recordMeeting(l, "sufei", "theatre");
  assert.ok(first.met);
  assert.match(first.meeting.text, /星河小劇場/);
  const rel = structuredClone(l.game.relationships.sufei);
  assert.equal(rel.metLocation, "theatre");
  assert.equal(rel.metDay, 3);
  assert.equal(recordMeeting(l, "sufei", "cafe").met, false);
  assert.deepEqual(l.game.relationships.sufei, rel);
});
test("weekly focus is selectable, saved, and cannot switch during a daily transaction", () => {
  const s = initialPixelState();
  assert.ok(setWeeklyFocus(s.life, "people").ok);
  assert.equal(validatePixelState(s).life.game.focus, "people");
  const ordinary = initialLife();
  recordMeeting(ordinary, "sufei");
  recordMeeting(s.life, "sufei");
  assert.equal(
    s.life.game.relationships.sufei.closeness,
    ordinary.game.relationships.sufei.closeness + 2,
  );
  beginDay(s.life, { id: "rest" });
  assert.equal(setWeeklyFocus(s.life, "fame").ok, false);
  assert.equal(s.life.game.focus, "people");
  assert.equal(setWeeklyFocus(ordinary, "__proto__").ok, false);
});
test("exposure strategy actually gives public performances the success fame bonus", () => {
  let observed = false;
  for (let seed = 0; seed < 20; seed++) {
    const normal = initialLife(`focus-${seed}`),
      exposed = structuredClone(normal);
    normal.game.focus = "people";
    setWeeklyFocus(exposed, "fame");
    beginDay(normal, { id: "street_perform" });
    beginDay(exposed, { id: "street_perform" });
    settleDay(normal, "steady");
    settleDay(exposed, "steady");
    if (normal.game.fame === 2) {
      assert.equal(exposed.game.fame, 4);
      observed = true;
      break;
    }
  }
  assert.ok(observed, "at least one successful identical-seed performance");
});
test("inheritance remembers faces but never unlocks contacts or carries relationships or money", () => {
  const old = initialPixelState();
  recordMeeting(old.life, "sufei");
  old.life.game.money = 900000;
  const next = newRun(old, { inherit: true });
  assert.deepEqual(next.life.game.familiarNpcs, ["sufei"]);
  assert.deepEqual(next.life.game.knownPeople, []);
  assert.deepEqual(next.knownPeople, []);
  assert.equal(next.life.game.money, 18000);
  assert.equal(next.life.game.relationships.sufei?.closeness || 0, 0);
  assert.deepEqual(newRun(old).life.game.familiarNpcs, []);
  recordMeeting(next.life, "sufei", "cafe");
  assert.match(
    next.life.game.relationships.sufei.firstMeetingText,
    /眼熟|錯覺/,
  );
  assert.deepEqual(next.life.game.knownPeople, ["sufei"]);
});
test("first co-star work reserves the same room and includes a visible meeting result", () => {
  const l = initialLife("work-meeting");
  const job = JOB_CATALOG.find((j) => j.category === "電視劇" && j.stars === 1);
  l.game.money = 100000;
  l.game.stats = Object.fromEntries(ABILITIES.map((a) => [a, 500]));
  arriveAt(l, "tv");
  careerCommand(l, "apply-job", job.id);
  Object.assign(l.game.activeJobs[job.id], { stage: "passed" });
  assert.ok(careerCommand(l, "sign-job", job.id).ok);
  // A deterministic, valid co-star booking tests the rendered first meeting.
  const r = l.game.activeJobs[job.id];
  const day = job.workDays[0];
  r.npcCast = ["sufei"];
  r.npcScheduleSlots = [{ week: 1, day, status: "reserved" }];
  l.game.npcSchedules.sufei = [
    { jobId: job.id, week: 1, day, status: "reserved" },
  ];
  attachReservationLocations(l.game);
  l.day = day;
  assert.equal(
    cityItinerary("sufei", 0, { life: l }).scene,
    productionRoom(job.category),
  );
  assert.ok(bookCareer(l, CHOICES, "job", { jobId: job.id }, day).ok);
  beginDay(l);
  const result = settleDay(l);
  assert.ok(!result.error, result.error);
  assert.match(result.presentation.title, /工作相遇.*許映真/);
  assert.ok(result.presentation.portrait);
  assert.ok(result.notes.some((n) => n.includes("交換聯絡方式")));
  assert.deepEqual(l.game.knownPeople, ["sufei"]);
});
test("all static content effects reference real abilities, including effect arrays", async () => {
  for (const file of await readdir(new URL("../src/data/", import.meta.url))) {
    if (!file.endsWith(".js")) continue;
    const data = await import(`../src/data/${file}`);
    const rep = Object.keys(initialLife().game.rep);
    function visit(value, path) {
      if (!value || typeof value !== "object") return;
      if (value.stat && "value" in value)
        assert.ok(
          (value.hidden ? HIDDEN_TRAITS : value.rep ? rep : ABILITIES).includes(
            value.stat,
          ),
          `${path}: ${value.stat}`,
        );
      for (const [key, child] of Object.entries(value))
        visit(child, `${path}.${key}`);
    }
    visit(data, file);
  }
});
