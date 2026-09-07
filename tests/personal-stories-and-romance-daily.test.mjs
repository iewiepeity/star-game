import test from "node:test";
import assert from "node:assert/strict";
import { initialState, state, resetState, hydrateState } from "../src/core/state.js";
import { NPC_LIST } from "../src/data/npcs.js";
import { PERSONAL_STORIES } from "../src/data/personal-stories.js";
import { ROMANCE_DAILY_STORIES } from "../src/data/romance-daily-stories.js";
import { personalStoryStatus, personalStoryEvent, tickPersonalStories, pausePersonalStory, resumePersonalStory, applyPersonalStoryChoice, isPersonalStoryEventCurrent } from "../src/logic/personal-stories.js";
import { romanceDailyEvent, romanceDailyStatus, requestRomanceDaily } from "../src/logic/romance-daily.js";
import { normalizePersonalStories, normalizeRomanceDaily } from "../src/core/personal-stories-state.js";
import { meetNpc } from "../src/logic/npc-engine.js";
import { resolveEvent, applyEffects, enqueueVisibleEvent, processQueuedEvents } from "../src/logic/event-engine.js";
import { characterMemory, recordCharacterMemory, promiseCharacterCheckIn } from "../src/logic/character-memory.js";
import { npcInteractionDecision, resolveNpcInteraction } from "../src/logic/npc-interaction-engine.js";
import { tickRomanceRelationships } from "../src/logic/romance-engine.js";
import { queueNpcStoryEvents } from "../src/logic/npc-storylines.js";

function fresh(id = "jiqing", romance = "none") {
  resetState();
  meetNpc(id);
  Object.assign(state.relationships[id], { closeness: 30, trust: 25, affection: 20, hostility: 0, romance, lastInteractionWeek: 1 });
  if (["dating", "committed", "engaged", "married"].includes(romance)) state.partnerId = id;
  state.narrativeSettings = { textMode: "full", skipReadRoutine: false, romanceFrequency: "high", conflictIntensity: "dramatic", storyReminders: true };
  return state;
}

test("ten characters each have a complete four-week playable story with replay-safe choices", () => {
  assert.deepEqual(Object.keys(PERSONAL_STORIES).sort(), NPC_LIST.map(npc => npc.id).sort());
  for (const { id } of NPC_LIST) {
    fresh(id);
    for (let chapter = 0; chapter < 4; chapter++) {
      state.week = chapter + 1;
      const event = personalStoryEvent(id);
      assert.equal(event.personalStory.chapter, chapter);
      const snapshot = structuredClone(state);
      assert.deepEqual(personalStoryEvent(id), event);
      tickPersonalStories();
      assert.deepEqual(state, snapshot);
      const result = resolveEvent(event, "accompany");
      assert.ok(result && !result.pending);
      assert.equal(personalStoryStatus(id).history.length, chapter + 1);
      assert.equal(personalStoryEvent(id), null, "a chapter cannot be speed-run in the same week");
      const completed = structuredClone(state);
      assert.equal(resolveEvent(event, "advise"), null);
      applyEffects(event.choices[0].effect);
      assert.deepEqual(state, completed, "even a repeated raw effect cannot award another choice");
    }
    assert.equal(personalStoryStatus(id).status, "completed");
    assert.ok(personalStoryStatus(id).ending);
    assert.equal(pausePersonalStory(id).ok, false);
  }
});

test("companionship and advice unlock different actual invitations; declining does not invent a dismissal", () => {
  const scenes = {}, options = {};
  for (const route of ["accompany", "advise", "ignore"]) {
    fresh();
    resolveEvent(personalStoryEvent("jiqing"), route);
    state.week = 2;
    assert.match(personalStoryEvent("jiqing").text, new RegExp(PERSONAL_STORIES.jiqing.chapters[1].followups[route]));
    resolveEvent(personalStoryEvent("jiqing"), route);
    state.week = 3;
    const event = personalStoryEvent("jiqing");
    scenes[route] = event.text;
    options[route] = event.choices.find(choice => choice.id === "invitation");
    if (route === "ignore") {
      assert.equal(options.ignore, undefined);
      const snapshot = structuredClone(state);
      assert.equal(applyPersonalStoryChoice({ ...event.personalStory, choice: "invitation" }).ok, false);
      assert.deepEqual(state, snapshot);
      assert.notEqual(characterMemory("jiqing").disclosure, "guarded");
    } else {
      const before = state.relationships.jiqing.closeness;
      resolveEvent(event, "invitation");
      assert.ok(state.relationships.jiqing.closeness > before);
      assert.equal(state.personalStories.jiqing.history.at(-1).invitation, true);
      assert.ok(characterMemory("jiqing").shared.length > 0);
    }
  }
  assert.equal(new Set(Object.values(scenes)).size, 3);
  assert.notEqual(options.accompany.label, options.advise.label);
  assert.notEqual(options.accompany.outcome, options.advise.outcome);
});

test("pausing before or during a story is indefinite and cost-free, restores its branch after save, and invalidates stale queues", () => {
  fresh();
  const event = personalStoryEvent("jiqing");
  enqueueVisibleEvent(event, "人物連續故事");
  const relationship = structuredClone(state.relationships.jiqing), money = state.money;
  assert.equal(pausePersonalStory("jiqing").ok, true);
  state.week = 120;
  processQueuedEvents();
  assert.equal(state.eventQueue.some(item => item.event.id === event.id), false);
  assert.equal(resolveEvent(event, "accompany"), null);
  assert.equal(personalStoryEvent("jiqing"), null);
  assert.deepEqual(state.relationships.jiqing, relationship);
  assert.equal(state.money, money);
  hydrateState(structuredClone(state));
  assert.equal(personalStoryStatus("jiqing").status, "paused");
  assert.equal(resumePersonalStory("jiqing").ok, true);
  assert.notEqual(personalStoryEvent("jiqing").id, event.id);
  resolveEvent(personalStoryEvent("jiqing"), "advise");
  assert.equal(pausePersonalStory("jiqing").ok, true);
  assert.equal(resumePersonalStory("jiqing").ok, true);
  assert.equal(personalStoryEvent("jiqing"), null);
  state.week++;
  assert.ok(personalStoryEvent("jiqing").text.includes(PERSONAL_STORIES.jiqing.chapters[1].followups.advise));
});

test("the in-scene pause action closes no chapter, grants no relationship reward, and can be manually resumed", () => {
  fresh();
  const before = structuredClone(state.relationships.jiqing);
  const event = personalStoryEvent("jiqing");
  assert.ok(resolveEvent(event, "pause"));
  assert.equal(state.personalStories.jiqing.chapter, 0);
  assert.equal(state.personalStories.jiqing.history.length, 0);
  assert.deepEqual(state.relationships.jiqing, before);
  resumePersonalStory("jiqing");
  assert.ok(personalStoryEvent("jiqing"));
});

test("four romance stages have distinct everyday scenes, real outcomes and a six-scene no-repeat cycle", () => {
  for (const [romance, stage] of [["ambiguous", "ambiguous"], ["dating", "dating"], ["committed", "steady"], ["married", "married"]]) {
    fresh("jiqing", romance);
    const seen = new Set();
    for (let week = 1; week <= 6; week++) {
      state.week = week;
      const event = romanceDailyEvent("jiqing");
      assert.equal(event.personalStory.stage, stage);
      seen.add(event.personalStory.sceneId);
      const before = structuredClone(state);
      assert.deepEqual(romanceDailyEvent("jiqing"), event);
      assert.deepEqual(state, before);
      assert.ok(resolveEvent(event, event.choices[0].id));
      assert.equal(romanceDailyEvent("jiqing"), null);
      assert.equal(romanceDailyStatus("jiqing").history.length, week);
      assert.ok(state.relationships.jiqing.trust > before.relationships.jiqing.trust || state.relationships.jiqing.affection > before.relationships.jiqing.affection || state.relationships.jiqing.closeness > before.relationships.jiqing.closeness);
      assert.equal(resolveEvent(event, event.choices[1].id), null);
    }
    assert.equal(seen.size, ROMANCE_DAILY_STORIES[stage].length);
  }
});

test("frequency and conflict settings shape new invitations without erasing an already queued encounter", () => {
  fresh("jiqing", "dating");
  state.narrativeSettings.conflictIntensity = "gentle";
  const seen = new Set();
  for (let week = 1; week <= 4; week++) {
    state.week = week;
    const event = romanceDailyEvent("jiqing");
    seen.add(event.personalStory.sceneId);
    assert.equal(ROMANCE_DAILY_STORIES.dating.find(scene => scene.id === event.personalStory.sceneId).intensity, "gentle");
    resolveEvent(event, event.choices[0].id);
  }
  assert.equal(seen.size, 4);
  state.narrativeSettings.romanceFrequency = "low";
  state.week = 9;
  assert.equal(romanceDailyEvent("jiqing"), null);
  state.week = 10;
  const queued = romanceDailyEvent("jiqing");
  state.narrativeSettings.romanceFrequency = "off";
  assert.equal(romanceDailyEvent("jiqing"), null);
  assert.equal(requestRomanceDaily("jiqing").ok, false);
  assert.equal(isPersonalStoryEventCurrent(queued), true);
  assert.ok(resolveEvent(queued, queued.choices[0].id));
  assert.equal(state.relationships.jiqing.romance, "dating");
  state.narrativeSettings.romanceFrequency = "high";
  state.week++;
  const stale = romanceDailyEvent("jiqing");
  state.relationships.jiqing.romance = "broken";
  state.partnerId = null;
  assert.equal(isPersonalStoryEventCurrent(stale), false);
  assert.equal(resolveEvent(stale, stale.choices[0].id), null);
});

test("romance choices preserve explicit player preferences and remember actual supportive or dismissive responses", () => {
  fresh("jiqing", "ambiguous");
  recordCharacterMemory("jiqing", { kind: "preference", key: "place", value: "lively", text: "玩家說喜歡熱鬧" });
  recordCharacterMemory("jiqing", { kind: "boundary", key: "space", value: "freely", text: "玩家說可照平常聯絡" });
  resolveEvent(romanceDailyEvent("jiqing"), "quiet");
  assert.equal(characterMemory("jiqing").preferences.place, "lively");
  assert.equal(characterMemory("jiqing").boundaries.space, "freely");
  for (let week = 2; week <= 4; week++) {
    state.week = week;
    const event = romanceDailyEvent("jiqing");
    resolveEvent(event, event.choices[0].id);
  }
  state.week = 5;
  const event = romanceDailyEvent("jiqing"), before = state.relationships.jiqing.trust;
  assert.equal(event.personalStory.sceneId, "not-a-test");
  resolveEvent(event, "demand");
  assert.ok(state.relationships.jiqing.trust < before);
  assert.equal(characterMemory("jiqing").disclosure, "guarded");
});

test("hidden-route acquaintances stay non-romantic, but a saved established partner retains partner daily life", () => {
  fresh("silver_pc");
  assert.equal(romanceDailyEvent("silver_pc"), null);
  state.relationships.silver_pc.romance = "married";
  state.partnerId = "silver_pc";
  assert.equal(romanceDailyEvent("silver_pc").personalStory.stage, "married");
  state.knownPeople = [];
  assert.equal(romanceDailyEvent("silver_pc"), null);
});

test("a remembered request for fewer contacts delays automatic romance, while player-initiated time remains available", () => {
  fresh("jiqing", "dating");
  recordCharacterMemory("jiqing", { kind: "boundary", key: "space", value: "ask", text: "玩家明確說想少一點主動聯絡" });
  assert.equal(tickPersonalStories().some(event => event.kind === "戀愛日常"), false);
  assert.equal(requestRomanceDaily("jiqing").ok, true);
  state.week = 4;
  assert.equal(tickPersonalStories().some(event => event.kind === "戀愛日常"), false);
  state.week = 5;
  const event = tickPersonalStories().find(event => event.kind === "戀愛日常");
  assert.ok(event);
  resolveEvent(event, event.choices[0].id);
  const record = structuredClone(state.romanceDaily.jiqing);
  hydrateState(structuredClone(state));
  assert.deepEqual(state.romanceDaily.jiqing, record);
  assert.equal(characterMemory("jiqing").boundaries.space, "ask");
});

test("normalization and read helpers safely handle absent, malformed and unknown story records", () => {
  assert.deepEqual(normalizePersonalStories(null), {});
  assert.deepEqual(normalizeRomanceDaily([]), {});
  assert.deepEqual(normalizePersonalStories({ missing: { chapter: 999 } }), {});
  assert.deepEqual(normalizePersonalStories(JSON.parse('{"__proto__":{}}')), {});
  assert.deepEqual(normalizeRomanceDaily({ jiqing: { history: [{ stage: "constructor", sceneId: "bad", choice: "bad" }] } }).jiqing.history, []);
  const game = initialState();
  assert.equal(personalStoryStatus("missing", game), null);
  assert.equal(personalStoryStatus("__proto__", game), null);
  assert.deepEqual(tickPersonalStories(game), []);
});

test("successful full NPC interactions fulfill a due promise once and show the acknowledgment; failures do not", () => {
  fresh();
  state.week = 26;
  assert.equal(promiseCharacterCheckIn("jiqing", "promise").ok, true);
  state.week = 27;
  const task = { payload: { npcId: "jiqing", type: "collaborate" } };
  const decision = npcInteractionDecision(task);
  const result = resolveNpcInteraction(task, decision.choices[0].id);
  assert.equal(result.ok, true);
  assert.match(result.text, /你還記得說好要再問一次/);
  assert.equal(characterMemory("jiqing").promises.find(item => item.key === "work-check-in").status, "fulfilled");
  fresh();
  state.week = 26;
  promiseCharacterCheckIn("jiqing", "promise");
  state.week = 27;
  state.knownPeople = [];
  const failed = resolveNpcInteraction({ payload: { npcId: "jiqing", type: "support" } }, "listen");
  assert.equal(failed.ok, false);
  assert.equal(characterMemory("jiqing").promises.find(item => item.key === "work-check-in").status, "pending");
  fresh();
  const careless = resolveNpcInteraction({ payload: { npcId: "jiqing", type: "chat" } }, "exploit");
  assert.equal(careless.ok, true);
  assert.equal(characterMemory("jiqing").disclosure, "guarded");
});

test("turning romance off suppresses automatic old offers and reminders while leaving existing relationship consequences intact", () => {
  fresh("jiqing", "ambiguous");
  Object.assign(state.relationships.jiqing, { closeness: 80, trust: 75, affection: 80 });
  state.narrativeSettings.romanceFrequency = "off";
  queueNpcStoryEvents();
  assert.equal(state.eventQueue.some(item => item.event.kind === "戀愛事件"), false);
  state.week = 20;
  Object.assign(state.relationships.jiqing, { romance: "dating", visibility: "public", lastInteractionWeek: 1 });
  state.partnerId = "jiqing";
  state.publicOpinion.state = "scandal";
  const before = state.relationships.jiqing.trust;
  assert.deepEqual(tickRomanceRelationships(), []);
  assert.equal(state.relationships.jiqing.trust, before - 1);
});
