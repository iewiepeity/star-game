import test from "node:test";
import assert from "node:assert/strict";
import { state, resetState, hydrateState } from "../src/core/state.js";
import { meetNpc } from "../src/logic/npc-engine.js";
import { ROMANCE_PERSONAL_DAILY, romanceDailyPool } from "../src/data/romance-personal-daily.js";
import { romanceDailyEvent, applyRomanceDailyChoice } from "../src/logic/romance-daily.js";
import { applyEffects, resolveEvent } from "../src/logic/event-engine.js";
import { romanceOpportunity, transitionRomance, breakUp, setRomanceVisibility } from "../src/logic/romance-engine.js";
import { beginRomanceRepair, reviewRomanceRepair, romanceRepairStatus, chooseRomanceCeremony, romanceCommitmentRecall } from "../src/logic/romance-life.js";
import { characterMemory, promiseCharacterCheckIn } from "../src/logic/character-memory.js";
import { npcInteractionDecision, resolveNpcInteraction } from "../src/logic/npc-interaction-engine.js";
import { queueNpcStoryEvents } from "../src/logic/npc-storylines.js";
import { npcApp } from "../src/views/npc.js";
import { createFeatureUI } from "../src/pixel/feature-ui.js";
import { initialLife } from "../src/pixel/life.js";

function fresh(id = "jiqing", romance = "dating") {
  resetState();
  state.week = 100;
  meetNpc(id);
  Object.assign(state.relationships[id], { romance, romanceSinceWeek: 1, trust: 80, affection: 80, closeness: 80, hostility: 0, visibility: "underground", lastInteractionWeek: 90 });
  if (["dating", "committed", "engaged", "married"].includes(romance)) state.partnerId = id;
  state.completedWorks = [{ id: "test-work" }];
  state.narrativeSettings.romanceFrequency = "high";
  state.narrativeSettings.conflictIntensity = "dramatic";
  state.selectedNpc = id;
}
function sceneEvent(sceneId, id = "jiqing") {
  const event = romanceDailyEvent(id);
  const scene = romanceDailyPool(id, event.personalStory.stage).find(item => item.id === sceneId);
  assert.ok(scene, sceneId);
  const payload = { ...event.personalStory, sceneId };
  return { ...event, id: `${event.id}:${sceneId}`, personalStory: payload, text: scene.text, choices: scene.choices.map(choice => ({ ...choice, effect: { personalStory: { ...payload, choice: choice.id } } })) };
}
function interaction(type, id = "jiqing") {
  const task = { kind: "npc_interact", payload: { npcId: id, type } };
  const decision = npcInteractionDecision(task);
  assert.ok(decision?.choices?.length);
  const result = resolveNpcInteraction(task, decision.choices[0].id);
  assert.equal(result.ok, true);
}
function marriageOffer() {
  Object.assign(state.relationships.jiqing, { affection: 100, trust: 100, closeness: 100 });
  state.characterMemories = { jiqing: { bonds: ["care", "private"] } };
  state.hidden.品德 = 700;
  queueNpcStoryEvents();
  return [...state.eventQueue, ...state.queuedEvents].map(item => item.event).find(event => event.id.startsWith("npc-romance-jiqing:"));
}

test("nine routes have 36 distinct personal scenes; all 108 style choices persist exactly once", () => {
  assert.equal(Object.keys(ROMANCE_PERSONAL_DAILY).length, 9);
  const texts = new Set();
  for (const [id, stages] of Object.entries(ROMANCE_PERSONAL_DAILY)) {
    for (const [stage, scenes] of Object.entries(stages)) {
      const scene = scenes[0];
      texts.add(scene.text);
      assert.equal(new Set(scene.choices.map(choice => choice.outcome)).size, 3);
      for (const choice of scene.choices) {
        fresh(id, stage === "steady" ? "committed" : stage);
        const event = romanceDailyEvent(id);
        assert.equal(event.personalStory.sceneId, scene.id);
        const before = structuredClone(state);
        assert.deepEqual(romanceDailyEvent(id), event);
        assert.deepEqual(state, before, "preview is read-only");
        assert.ok(resolveEvent(event, choice.id));
        const memory = characterMemory(id);
        assert.ok(memory.bonds.includes(choice.bond));
        assert.equal(memory.preferences["romance-style"], choice.memory.value);
        assert.equal(state.relationships[id].lastInteractionWeek, 100);
        const snapshot = structuredClone(state);
        assert.equal(resolveEvent(event, choice.id), null);
        assert.equal(applyRomanceDailyChoice({ ...event.personalStory, choice: choice.id }).ok, false);
        assert.deepEqual(state, snapshot);
        hydrateState(structuredClone(state));
        assert.equal(state.romanceDaily[id].history.at(-1).sceneId, scene.id);
        assert.deepEqual(characterMemory(id).bonds, memory.bonds);
      }
    }
  }
  assert.equal(texts.size, 36);
});

test("nickname is opt-in, reused only with a partner, can be declined and changed", () => {
  fresh();
  resolveEvent(sceneEvent("nickname-dating"), "yes");
  assert.equal(characterMemory("jiqing").preferences["romance-nickname"], "小夜燈");
  state.week++;
  assert.match(romanceDailyEvent("jiqing").text, /『小夜燈。』/);
  resolveEvent(sceneEvent("nickname-dating"), "name");
  state.week++;
  assert.doesNotMatch(romanceDailyEvent("jiqing").text, /『小夜燈。』/);
  state.relationships.jiqing.romance = "ambiguous";
  state.partnerId = null;
  assert.ok(romanceDailyPool("jiqing", "ambiguous").every(scene => !/^(nickname|touch)-/.test(scene.id)));
});

test("handholding, hugs and kisses ask anew; choosing conversation has equal relationship effects", () => {
  for (const [stage, romance] of [["dating", "dating"], ["steady", "committed"], ["married", "married"]]) {
    const results = [];
    for (const choice of ["yes", "talk"]) {
      fresh("jiqing", romance);
      const event = sceneEvent(`touch-${stage}`);
      assert.ok(resolveEvent(event, choice));
      results.push([state.relationships.jiqing.affection, state.relationships.jiqing.trust]);
      const memory = characterMemory("jiqing");
      if (choice === "talk") {
        assert.equal(memory.boundaries["romance-touch"], "ask");
        assert.equal(memory.shared.some(entry => entry.key === `intimacy:${stage}`), false);
      }
      state.week++;
      assert.deepEqual(sceneEvent(`touch-${stage}`).choices.map(c => c.id), ["yes", "talk"]);
    }
    assert.deepEqual(results[0], results[1]);
  }
});

test("remembered romance style changes the next personal encounter without choosing for the player", () => {
  const openings = new Set();
  for (const choice of ["tease", "stay", "need"]) {
    fresh();
    resolveEvent(romanceDailyEvent("jiqing"), choice);
    state.week++;
    // A new stage offers the same person's next personal scene, with remembered style.
    state.relationships.jiqing.romance = "committed";
    const event = romanceDailyEvent("jiqing");
    openings.add(event.text);
    assert.deepEqual(event.choices.map(c => c.id), ["tease", "stay", "need"]);
  }
  assert.equal(openings.size, 3);
});

test("daily experiences unlock commitment and recall actual memories, not fabricated ones", () => {
  fresh();
  assert.equal(romanceOpportunity("jiqing"), null);
  assert.equal(romanceCommitmentRecall("jiqing"), "");
  const event = romanceDailyEvent("jiqing");
  const expected = event.choices.find(c => c.id === "need").outcome;
  resolveEvent(event, "need");
  assert.equal(romanceOpportunity("jiqing").next, "committed");
  state.week++;
  queueNpcStoryEvents();
  const offer = [...state.eventQueue, ...state.queuedEvents].map(item => item.event).find(item => item.id.startsWith("npc-romance-jiqing:"));
  assert.ok(offer.text.includes(expected));
  assert.equal(transitionRomance("jiqing", "committed").ok, true);
});

test("legacy daily memories migrate bonds but harmful or unknown choices do not", () => {
  fresh();
  state.characterMemories = { jiqing: { shared: [
    { kind: "shared", key: "romance:ambiguous:same-table", value: "quiet", text: "一起坐著讀書", week: 2 },
    { kind: "shared", key: "romance:steady:career-direction", value: "decide", week: 3 },
    { kind: "shared", key: "romance:married:unknown", value: "yes", week: 4 },
  ] } };
  hydrateState(structuredClone(state));
  assert.deepEqual(characterMemory("jiqing").bonds, ["private"]);
  // Raw forged daily effects cannot produce a bond either.
  const before = structuredClone(state.characterMemories);
  applyEffects({ personalStory: { kind: "romanceDaily", npcId: "jiqing", stage: "dating", sceneId: "fake", choice: "yes", revision: 0, offeredWeek: 100 } });
  assert.deepEqual(state.characterMemories, before);
});

test("old queued common daily remains valid when new invitations are turned off", () => {
  fresh("jiqing", "ambiguous");
  const event = sceneEvent("same-table");
  state.narrativeSettings.romanceFrequency = "off";
  hydrateState(structuredClone(state));
  assert.ok(resolveEvent(event, "quiet"));
  assert.deepEqual(characterMemory("jiqing").bonds, ["private"]);
});

test("registration preserves visibility; ceremony and announcement are independent and replay-safe", () => {
  for (const visibility of ["underground", "public"]) {
    fresh("jiqing", "engaged");
    state.relationships.jiqing.visibility = visibility;
    const offer = marriageOffer();
    assert.doesNotMatch(offer.text, /婚禮前|婚禮上/);
    assert.ok(resolveEvent(offer, "yes"));
    assert.equal(state.relationships.jiqing.romance, "married");
    assert.equal(state.relationships.jiqing.visibility, visibility);
    assert.equal(state.relationships.jiqing.ceremony, "undecided");
    assert.equal(chooseRomanceCeremony("jiqing", "none").ok, true);
    assert.equal(state.relationships.jiqing.visibility, visibility);
    assert.equal(chooseRomanceCeremony("jiqing", "small").ok, true);
    const snapshot = structuredClone(state);
    assert.equal(chooseRomanceCeremony("jiqing", "small").ok, false);
    assert.equal(resolveEvent(offer, "private-vow"), null);
    assert.deepEqual(state, snapshot);
    hydrateState(structuredClone(state));
    assert.equal(state.relationships.jiqing.ceremony, "small");
    setRomanceVisibility("jiqing", visibility === "public" ? "underground" : "public");
    assert.equal(state.relationships.jiqing.ceremony, "small");
  }
});

test("small wedding choice registers a real ceremony without making the relationship public", () => {
  fresh("jiqing", "engaged");
  const offer = marriageOffer();
  assert.ok(resolveEvent(offer, "private-vow"));
  assert.equal(state.relationships.jiqing.ceremony, "small");
  assert.equal(state.relationships.jiqing.visibility, "underground");
  assert.ok(characterMemory("jiqing").shared.some(entry => entry.key === "marriage:ceremony"));
});

test("old married saves retain marriage and visibility without inventing ceremony details", () => {
  fresh("jiqing", "married");
  delete state.relationships.jiqing.ceremony;
  hydrateState(structuredClone(state));
  assert.equal(state.relationships.jiqing.romance, "married");
  assert.equal(state.relationships.jiqing.visibility, "underground");
  assert.equal(state.relationships.jiqing.ceremony, "legacy");
  assert.equal(chooseRomanceCeremony("jiqing", "small").ok, false);
});

test("unanswered legacy marriage invitations refresh but historical narration remains unchanged", () => {
  fresh("jiqing", "engaged");
  const offer = marriageOffer();
  delete offer.romanceCopyVersion;
  offer.text = "婚禮前，所有人都已經到場。";
  offer.choices[0].outcome = "完成婚禮並公開婚訊。";
  state.activeEvent = { event: structuredClone(offer) };
  state.eventHistory.push({ id: "past-marriage", text: "這是過去原本的紀錄。" });
  hydrateState(structuredClone(state));
  assert.doesNotMatch(state.activeEvent.event.text, /所有人都已經到場/);
  assert.equal(state.eventHistory.at(-1).text, "這是過去原本的紀錄。");
  const result = resolveEvent(offer, "yes");
  assert.match(result.outcome, /完成結婚登記/);
  assert.equal(state.relationships.jiqing.visibility, "underground");
  assert.equal(state.relationships.jiqing.ceremony, "undecided");
});

test("repair cannot be completed with the wrong kind of experience or an old fulfilled promise", () => {
  for (const reason of ["neglect", "betrayal"]) {
    fresh();
    promiseCharacterCheckIn("jiqing", "promise");
    state.week++;
    interaction("support");
    breakUp("jiqing", reason);
    state.week++;
    beginRomanceRepair("jiqing");
    state.week++;
    interaction("personal");
    assert.equal(romanceRepairStatus("jiqing").canReview, false, reason);
    assert.equal(reviewRomanceRepair("jiqing").ok, false);
  }
});

test("three breakup reasons require different real later actions; elapsed weeks and stats are insufficient", () => {
  const plans = new Set();
  for (const reason of ["neglect", "values", "betrayal"]) {
    fresh();
    assert.equal(breakUp("jiqing", reason).ok, true);
    state.week = 120;
    Object.assign(state.relationships.jiqing, { affection: 100, closeness: 100, trust: 100 });
    assert.equal(romanceOpportunity("jiqing"), null);
    assert.equal(transitionRomance("jiqing", "interested").ok, false);
    assert.equal(beginRomanceRepair("jiqing").ok, true);
    plans.add(romanceRepairStatus("jiqing").plan);
    assert.equal(beginRomanceRepair("jiqing").ok, false);
    assert.equal(reviewRomanceRepair("jiqing").ok, false);
    if (reason === "betrayal") assert.equal(promiseCharacterCheckIn("jiqing", "promise").ok, true);
    hydrateState(structuredClone(state));
    state.week++;
    assert.equal(reviewRomanceRepair("jiqing").ok, false, "waiting isn't repair");
    interaction(reason === "values" ? "personal" : "support");
    assert.equal(romanceRepairStatus("jiqing").canReview, true, reason);
    assert.equal(reviewRomanceRepair("jiqing").ok, true);
    assert.equal(reviewRomanceRepair("jiqing").ok, false);
    assert.equal(state.relationships.jiqing.romance, "broken");
    assert.equal(state.partnerId, null);
    assert.equal(romanceOpportunity("jiqing").next, "interested");
    assert.equal(transitionRomance("jiqing", "interested").ok, true);
    assert.equal(state.partnerId, null, "repair is not automatic reunion");
  }
  assert.equal(plans.size, 3);
});

test("old broken saves get a repair path; hostile rejection and a second breakup cannot reuse prior repair", () => {
  fresh("jiqing", "broken");
  delete state.relationships.jiqing.romanceRepair;
  hydrateState(structuredClone(state));
  assert.equal(romanceRepairStatus("jiqing").reason, "values");
  state.relationships.jiqing.hostility = 60;
  assert.equal(beginRomanceRepair("jiqing").ok, false);
  Object.assign(state.relationships.jiqing, { romance: "dating", hostility: 0, romanceRepair: { reason: "neglect", step: 2, sinceWeek: 1, startedWeek: 2 } });
  state.partnerId = "jiqing";
  breakUp("jiqing", "betrayal");
  assert.equal(romanceRepairStatus("jiqing").step, 0);
  assert.equal(romanceRepairStatus("jiqing").reason, "betrayal");
});

test("changed profile controls and actual Pixel click handlers persist choices without spending a day", () => {
  fresh("jiqing", "married");
  state.relationships.jiqing.ceremony = "undecided";
  state.npcProfileTab = "relationship";
  assert.match(npcApp(), /data-romance-ceremony="small"/);
  const snapshot = structuredClone(state);
  const life = initialLife();
  life.game = snapshot;
  const before = { day: life.day, plan: structuredClone(life.plan), money: life.game.money };
  const originalDocument = globalThis.document;
  let saves = 0, shown = "";
  const toasts = [];
  globalThis.document = { querySelector: () => null, querySelectorAll: () => [], activeElement: null };
  try {
    const ui = createFeatureUI({ state: () => ({ life }), native: { phone() {}, people() {} }, checkpoint: () => saves++, changed() {}, toast: text => toasts.push(text), show: (_id, html) => { shown = html; }, heading: (...text) => text.join(" "), escape: text => text });
    ui.handle({ closest: () => true, dataset: { romanceCeremony: "none", npcId: "jiqing" } });
    assert.equal(life.game.relationships.jiqing.ceremony, "none");
    ui.handle({ closest: () => true, dataset: { romanceCeremony: "small", npcId: "jiqing" } });
    assert.equal(life.game.relationships.jiqing.ceremony, "small");
    assert.equal(life.game.relationships.jiqing.visibility, "underground");
    ui.handle({ closest: () => true, dataset: { romanceAction: "breakup", npcId: "jiqing" } });
    assert.match(shown, /data-breakup-reason="neglect"/);
    assert.match(shown, /data-breakup-reason="values"/);
    assert.match(shown, /data-breakup-reason="betrayal"/);
    assert.equal(life.game.relationships.jiqing.romance, "married", "confirmation doesn't break up yet");
    ui.handle({ closest: () => true, dataset: { confirmBreakup: "jiqing", breakupReason: "neglect" } });
    ui.handle({ closest: () => true, dataset: { romanceRepair: "begin", npcId: "jiqing" } });
    assert.equal(life.game.relationships.jiqing.romanceRepair.reason, "neglect");
    assert.equal(life.game.relationships.jiqing.romanceRepair.step, 1);
    assert.equal(saves, 4);
    assert.ok(toasts.some(text => text.includes("訊息")));
    assert.deepEqual({ day: life.day, plan: life.plan, money: life.game.money }, before);
  } finally {
    if (originalDocument === undefined) delete globalThis.document;
    else globalThis.document = originalDocument;
  }
});
