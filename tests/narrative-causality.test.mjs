import test from "node:test";
import assert from "node:assert/strict";
import { state, resetState } from "../src/core/state.js";
import { SHORT_CHAIN_SEEDS } from "../src/data/playable-depth-content.js";
import { NPC_LONGFORM_CHAPTERS } from "../src/data/longform-content.js";
import { tickPlayableDepth } from "../src/logic/playable-depth-engine.js";
import { tickDeepeningSystems } from "../src/logic/deepening-engine.js";
import { tickCrossEventChains } from "../src/logic/cross-event-engine.js";
import { tickEnsembleScene } from "../src/logic/lived-story-engine.js";
import { activateNextEvent, dismissActiveEvent, resolveEvent, processQueuedEvents } from "../src/logic/event-engine.js";
import { CREATIVE_DIRECTION_STORIES, creativePhaseCopy } from "../src/data/creative-story-content.js";
import { socialDrafts } from "../src/logic/social-drafts.js";
import { JOB_CATALOG, JOB_BY_ID } from "../src/data/jobs.js";
import { jobStoryline } from "../src/data/job-storylines.js";
import { ensureJobState, completeJobSession, jobProductionDecision } from "../src/logic/job-engine.js";

const allEvents = () => [state.activeEvent, ...state.eventQueue, ...state.queuedEvents].filter(Boolean).map(x => x.event);
const fresh = () => { resetState(); state.name = "測試新人"; state.screen = "game"; };

test("all seven short-chain choices return their own cause after six weeks, including after save/load", () => {
  for (const [index, seed] of SHORT_CHAIN_SEEDS.entries()) {
    const returnedTexts = [];
    for (const choice of seed.choices) {
      fresh(); state.week = 4 + index * 10;
      tickPlayableDepth(); activateNextEvent();
      const opening = state.activeEvent.event;
      assert.equal(opening.id, `short-chain:${seed.id}:open`);
      const originWeek = state.week;
      resolveEvent(opening, choice.id); dismissActiveEvent();
      const delayed = state.queuedEvents.find(x => x.event.id === `short-chain:${seed.id}:return`);
      assert.ok(delayed);
      assert.equal(delayed.dueWeek, originWeek + 6);
      assert.equal(delayed.event.text, seed.followByChoice[choice.id].text);
      assert.deepEqual(delayed.event.requires.flags, [choice.flag]);
      state.queuedEvents = JSON.parse(JSON.stringify(state.queuedEvents));
      state.week = originWeek + 5; processQueuedEvents();
      assert.ok(!state.eventQueue.some(x => x.event.id === delayed.event.id));
      state.week++; processQueuedEvents(); activateNextEvent();
      assert.equal(state.activeEvent.event.id, delayed.event.id);
      returnedTexts.push(state.activeEvent.event.text);
      const before = state.rep.業界評價 || 0;
      const result = resolveEvent(state.activeEvent.event, "remember"); dismissActiveEvent();
      assert.equal(result.outcome, seed.followByChoice[choice.id].outcome);
      const expected = (seed.followByChoice[choice.id].effects || [seed.followByChoice[choice.id].effect]).filter(Boolean)
        .filter(e => e.rep === "業界評價").reduce((n, e) => n + e.value, 0);
      assert.equal(state.rep.業界評價 || 0, before + expected);
      processQueuedEvents(); tickPlayableDepth();
      assert.equal(state.eventHistory.filter(x => x.id === delayed.event.id).length, 1);
      assert.ok(!allEvents().some(x => x.id === delayed.event.id));
      assert.equal(state.knownPeople.length, 0);
    }
    assert.equal(new Set(returnedTexts).size, seed.choices.length);
  }
});

test("a character cannot open the next long chapter before the previous branch returns", () => {
  fresh(); state.knownPeople = ["lujingran"];
  state.week = 15; tickDeepeningSystems();
  const first = allEvents().find(x => x.id.startsWith("npc-long:"));
  assert.ok(first.persistent);
  const firstProgress = state.npcLongformProgress.lujingran;
  state.week = 20; tickDeepeningSystems();
  assert.equal(state.npcLongformProgress.lujingran, firstProgress);
  state.eventQueue = []; state.queuedEvents = []; state.activeEvent = null;
  resolveEvent(first, "stand");
  state.week = 25; tickDeepeningSystems();
  assert.equal(state.npcLongformProgress.lujingran, firstProgress);
  const follow = state.queuedEvents.find(x => x.event.id === `${first.id}:stand:follow-up`).event;
  assert.ok(follow.persistent);
  resolveEvent(follow);
  state.week = 30; tickDeepeningSystems();
  assert.equal(state.npcLongformProgress.lujingran, firstProgress + 1);
  assert.ok(allEvents().some(x => x.id === `npc-long:lujingran:${NPC_LONGFORM_CHAPTERS.lujingran[1].id}`));
});

test("already handled works do not starve older work or creative consequences", () => {
  fresh(); state.week = 12;
  state.completedWorks = [
    { id: "older", jobId: "J001", title: "先前作品", completedWeek: 10, storyChoice: "steady" },
    { id: "newer", jobId: "J006", title: "近期作品", completedWeek: 11, storyChoice: "bold" },
    { id: "self-produced", title: "自製作品", completedWeek: 11 },
  ];
  state.creativeProjects = [{ id: "draft-sale", title: "出售草稿", status: "sold", saleWeek: 10 }];
  assert.equal(tickCrossEventChains(), "cross-flagship-newer");
  assert.equal(tickCrossEventChains(), "cross-flagship-older");
  assert.equal(tickCrossEventChains(), "cross-creative-after-draft-sale");
  assert.equal(tickCrossEventChains(), null);
  assert.equal(new Set(allEvents().map(x => x.id)).size, 3);
  for (const event of allEvents()) assert.doesNotMatch(event.text, /「(?:steady|bold|signature)」/);
});

test("old saves with an advanced counter recover an unread chapter and the chosen missing reply", () => {
  fresh(); state.week = 80; state.knownPeople = ["lujingran"];
  state.npcLongformProgress = { lujingran: 5 };
  tickDeepeningSystems();
  const id = `npc-long:lujingran:${NPC_LONGFORM_CHAPTERS.lujingran[0].id}`;
  assert.ok(allEvents().some(event => event.id === id));
  const opening = allEvents().find(event => event.id === id);
  state.eventQueue = []; state.queuedEvents = [];
  resolveEvent(opening, "question");
  const history = JSON.stringify(state.eventHistory);
  state.queuedEvents = []; // An old, nonpersistent return had expired unread.
  state.week = 100; tickDeepeningSystems();
  const recovered = state.queuedEvents.find(item => item.event.id === `${id}:question:follow-up`);
  assert.ok(recovered);
  assert.equal(recovered.dueWeek, 84);
  assert.equal(recovered.event.text, NPC_LONGFORM_CHAPTERS.lujingran[0].choices[1].followUp.text);
  assert.equal(JSON.stringify(state.eventHistory), history);
});

test("ensemble choices keep distinct practical returns and are not replayed as a new identical dispute", () => {
  const returns = [];
  for (const choiceId of ["mediate", "side-a", "side-b"]) {
    fresh(); state.week = 39; state.knownPeople = ["jiqing", "guchengxi"];
    tickEnsembleScene(); activateNextEvent();
    const event = state.activeEvent.event;
    assert.match(event.text, /照片/);
    resolveEvent(event, choiceId); dismissActiveEvent();
    const delayed = state.queuedEvents.find(x => x.event.id === `${event.id}:${choiceId}:follow-up`);
    assert.equal(delayed.dueWeek, 42);
    returns.push(delayed.event.text);
    state.week = 52;
    assert.equal(tickEnsembleScene(), null);
  }
  assert.equal(new Set(returns).size, 3);
});

test("all nine creative directions respond to progress and to actual release reception", () => {
  for (const [type, directions] of Object.entries(CREATIVE_DIRECTION_STORIES)) {
    for (const direction of Object.keys(directions)) {
      const project = { type, direction, progress: 15, productionProgress: 25, productionSessions: 1 };
      const opening = creativePhaseCopy(project, "development");
      project.progress = 100;
      assert.notEqual(creativePhaseCopy(project, "development"), opening);
      const production = creativePhaseCopy(project, "production");
      project.productionProgress = 100;
      assert.notEqual(creativePhaseCopy(project, "production"), production);
      assert.notEqual(creativePhaseCopy({ ...project, marketScore: 35 }, "release"), creativePhaseCopy({ ...project, marketScore: 95 }, "release"));
    }
  }
});

test("social draft renders the work's authored legacy rather than an object placeholder", () => {
  fresh(); state.completedWorks = [{ title: "試播作品", storyLegacy: { title: "片尾", text: "名單裡多了一個正確的名字。" } }];
  const text = socialDrafts().afterwork.text;
  assert.match(text, /正確的名字/);
  assert.doesNotMatch(text, /\[object Object\]/);
});

test("all 75 actual work lifecycles show their four scenes once, even on one-day jobs", () => {
  for (const job of JOB_CATALOG) {
    fresh();
    const record = ensureJobState(job.id);
    record.stage = "active";
    record.auditionChoice = "steady";
    const scenes = [];
    for (let session = 0; session < job.sessions; session++) {
      const decision = jobProductionDecision(job.id);
      const result = completeJobSession(job.id, decision ? "protect" : null);
      assert.ok(result.ok, job.id);
      scenes.push(...result.scenes);
      for (const scene of result.scenes) assert.ok(result.text.includes(scene.text));
    }
    assert.deepEqual(scenes.map(scene => scene.stage), [0, 1, 2, 3], job.id);
    assert.equal(record.storyHistory.filter(scene => ["production", "completion"].includes(scene.phase)).length, 4);
    assert.equal(state.completedWorks.length, 1);
    const money = state.money;
    assert.equal(completeJobSession(job.id).ok, false);
    assert.equal(state.money, money);
    assert.equal(state.completedWorks.length, 1);
  }
});

test("a flagship decision uses its own practical choices and retains that decision in the final work", () => {
  for (const choiceId of ["protect", "breakthrough", "signature"]) {
    fresh();
    const job = JOB_BY_ID.J062, story = jobStoryline(job.id), record = ensureJobState(job.id);
    record.stage = "active"; record.auditionChoice = "steady";
    state.hidden.洞察 = 700; state.hidden.抗壓 = 700;
    for (let session = 0; session < Math.ceil(job.sessions / 2); session++)
      assert.ok(completeJobSession(job.id).ok);
    const decision = jobProductionDecision(job.id);
    assert.ok(decision.text.includes(story.production[1].text));
    assert.equal(decision.choices.find(choice => choice.id === choiceId).label, story.flagshipChoices[choiceId].label);
    resolveEvent(decision, choiceId);
    let result;
    while (record.stage === "active") result = completeJobSession(job.id);
    assert.equal(result.work.storyChoice, choiceId);
    assert.ok(result.text.includes(story.flagshipChoices[choiceId].outcome));
  }
});
