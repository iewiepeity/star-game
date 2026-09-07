import { meetNpc } from "../src/logic/npc-engine.js";
import test from "node:test";
import assert from "node:assert/strict";
import { state, resetState, hydrateState } from "../src/core/state.js";
import { TRAINING_CURRICULUM } from "../src/data/training-curriculum.js";
import { ACTIONS } from "../src/data/actions.js";
import { SCHEDULE_EVENTS } from "../src/data/schedule-events.js";
import { normalizeNarrativeSettings, narrativeText, canSkipRoutineResult, markRoutineRead, routineWasRead } from "../src/logic/narrative-preferences.js";
import { trainingLevel, trainingSkill, recordTrainingPractice, trainingLessonMoment, normalizeTrainingProgress } from "../src/logic/training-narrative.js";
import { routineTraining, routineGains } from "../src/logic/routine-rules.js";
import { applyActivityLoad, performanceMultiplier } from "../src/logic/condition-engine.js";
import { effectiveActionCost } from "../src/logic/economy.js";
import { resolveScheduleMoment } from "../src/logic/random-events.js";
import { tickRomanceFlavor } from "../src/logic/deepening-engine.js";
import { tickLoveWorkConflict, ensurePlayableDepthState } from "../src/logic/playable-depth-engine.js";
import { settingsMarkup } from "../src/pixel/settings-ui.js";

function fresh() { resetState(); state.money = 100000; state.week = 16; state.fatigue = 0; state.stamina = state.mood = state.health = 100; return state; }
function practice(game, id, gain = 6, multiplier = 1) {
  const before = trainingSkill(id, game), names = ACTIONS[id].gains.slice(0, ["image", "songwriting"].includes(id) ? 2 : 1).map(x => x[0]);
  for (const name of names) game.stats[name] = Math.min(1000, game.stats[name] + gain);
  recordTrainingPractice(game, id, before, names.map(name => ({name, amount:gain})), multiplier);
}

test("legacy preferences default safely and concise mode preserves source text and offers settings controls", () => {
  const defaults = normalizeNarrativeSettings();
  assert.deepEqual(defaults, {textMode:"full",skipReadRoutine:false,romanceFrequency:"normal",conflictIntensity:"normal",storyReminders:true});
  assert.deepEqual(normalizeNarrativeSettings({textMode:"unknown",skipReadRoutine:"true",romanceFrequency:12,conflictIntensity:null}), defaults);
  const source = "老師記得上次的問題。今天換一段練習。你把新的方法留在筆記裡。";
  assert.equal(narrativeText(source, {narrativeSettings:{textMode:"full"}}), source);
  assert.equal(narrativeText(source, {narrativeSettings:{textMode:"concise"}}), "老師記得上次的問題。 你把新的方法留在筆記裡。");
  const html = settingsMarkup({theme:"cream",speed:1,paused:false,narrativeSettings:{textMode:"concise"}});
  for (const key of Object.keys(defaults)) assert.ok(html.includes(`data-narrative-pref="${key}"`));
  assert.match(html, /翻閱完整日常記錄/);
});

test("nine courses have four distinct authored lessons and existing high abilities never receive a novice starting lesson", () => {
  const game = fresh(), ids = new Set(), texts = new Set();
  for (const [id, stages] of Object.entries(TRAINING_CURRICULUM)) {
    assert.equal(Object.keys(stages).length, 4);
    for (const lesson of Object.values(stages)) { assert.ok(lesson.text.length > 40 && lesson.revisit.length > 25); ids.add(lesson.id); texts.add(lesson.text); }
    for (const [skill, stage] of [[50,"beginner"],[220,"skilled"],[600,"plateau"]]) {
      for (const [name] of ACTIONS[id].gains) game.stats[name] = skill;
      assert.equal(trainingLevel(id, game).stage, stage);
    }
  }
  assert.equal(ids.size, 36); assert.equal(texts.size, 36);
});

test("plateau practice earns a breakthrough and the teacher recalls the actual previous issue after reload", () => {
  const game = fresh(); game.stats.歌藝 = 500;
  practice(game, "vocal");
  assert.equal(game.trainingNarrativeProgress.vocal.stage, "plateau");
  practice(game, "vocal");
  const before = structuredClone(game);
  hydrateState(before);
  const second = trainingLessonMoment("vocal", SCHEDULE_EVENTS.vocal[0]);
  assert.match(second.text, /那個尾音上次很順/);
  assert.equal(second.training.previousProblem, TRAINING_CURRICULUM.vocal.plateau.problem);
  practice(state, "vocal");
  assert.equal(state.trainingNarrativeProgress.vocal.stage, "breakthrough");
  const third = trainingLessonMoment("vocal", SCHEDULE_EVENTS.vocal[0]);
  assert.equal(third.important, true);
  assert.equal(third.training.stage, "breakthrough");
  assert.deepEqual(third.effect, SCHEDULE_EVENTS.vocal[0].effect);
  assert.ok(third.text.includes(SCHEDULE_EVENTS.vocal[0].text));
  assert.deepEqual(normalizeTrainingProgress(state.trainingNarrativeProgress), state.trainingNarrativeProgress);
});

test("fatigued or capped practice does not claim a breakthrough and next lesson acknowledges the limited result", () => {
  const game = fresh(); game.stats.舞蹈 = 500;
  practice(game, "dance"); practice(game, "dance"); practice(game, "dance", 6, .5);
  assert.equal(game.trainingNarrativeProgress.dance.stage, "plateau");
  assert.equal(game.trainingNarrativeProgress.dance.lastResult, "limited");
  practice(game, "dance", 1, .5);
  assert.match(trainingLessonMoment("dance", SCHEDULE_EVENTS.dance[0], game).text, /上次受狀態影響/);
  assert.match(trainingLessonMoment("dance", SCHEDULE_EVENTS.dance[0], game).outcome, /沒有把嘗試當作已經掌握/);
  game.stats.舞蹈 = 1000; practice(game, "dance", 0);
  assert.notEqual(game.trainingNarrativeProgress.dance.stage, "breakthrough");
});

test("training narrative retains original costs, gains, condition load and random classroom effects", () => {
  for (const id of Object.keys(TRAINING_CURRICULUM)) {
    const game = fresh(), control = structuredClone(game), action = ACTIONS[id], multiplier = performanceMultiplier("training", control);
    const cost = effectiveActionCost(action, control.week);
    applyActivityLoad({...action,cost}, control);
    const gains = routineGains(control, action.gains, min => min, multiplier);
    const result = routineTraining(game, id, min => min);
    assert.deepEqual(result, {cost,gains,multiplier});
    for (const key of ["stats","money","fatigue","stamina","health","mood"]) assert.deepEqual(game[key], control[key], `${id}:${key}`);
    assert.equal(game.trainingNarrativeProgress[id].sessions, 1);
  }
});

test("routine settlement preserves full text and applies effects before a known passage can be skipped", () => {
  fresh(); state.narrativeSettings.skipReadRoutine = true;
  state.pendingRandomEvent = {kind:"schedule",key:"rest",index:0};
  const first = resolveScheduleMoment("rest");
  assert.equal(first.readBefore, false);
  assert.equal(routineWasRead(first), false, "settlement is not reading");
  assert.equal(state.eventHistory.at(-1).text, first.text);
  markRoutineRead([first]);
  const saved = structuredClone(state); hydrateState(saved);
  assert.equal(routineWasRead(first), true);
  state.pendingRandomEvent = {kind:"schedule",key:"rest",index:0};
  const second = resolveScheduleMoment("rest");
  assert.equal(second.readBefore, true);
  assert.equal(state.eventHistory.length, 2, "a skipped presentation still settles and records a new day");
  const result = {success:true,assignment:{id:"rest"},moments:[second],notes:[]};
  assert.equal(canSkipRoutineResult(result), true);
  assert.equal(canSkipRoutineResult({...result,assignment:{id:"rest",choice:"focus"}}), true, "pixel animations set an implicit focus even when there was no decision");
  assert.equal(canSkipRoutineResult({...result,assignment:{id:"visit",choice:"focus"}}), false);
  for (const update of [{readBefore:false},{important:true},{hasChoices:true},{followUp:true}]) assert.equal(canSkipRoutineResult({...result,moments:[{...second,...update}]}), false);
  assert.equal(canSkipRoutineResult({...result,presentation:{}}), false);
  assert.equal(canSkipRoutineResult({...result,assignment:{id:"visit",choice:"explore"}}), false);
  assert.equal(canSkipRoutineResult({...result,notes:["身體需要休養。"]}), false);
  state.activeEvent = {id:"new-story"}; assert.equal(canSkipRoutineResult(result), false);
});

test("existing romantic messages and work conflicts respect frequency and intensity without changing relationships", () => {
  fresh(); state.romanceFlavorState = {}; ensurePlayableDepthState();
  meetNpc("jiqing"); state.partnerId = "jiqing"; state.relationships.jiqing.romance = "dating"; state.fame = 400;
  const before = structuredClone(state.relationships);
  state.narrativeSettings.romanceFrequency = "off";
  assert.equal(tickRomanceFlavor(), null); assert.equal(tickLoveWorkConflict(), null);
  state.narrativeSettings.romanceFrequency = "normal"; state.narrativeSettings.conflictIntensity = "gentle";
  assert.equal(tickLoveWorkConflict(), null);
  assert.ok(tickRomanceFlavor()); assert.equal(tickRomanceFlavor(), null);
  state.week += 2; assert.equal(tickRomanceFlavor(), null);
  state.narrativeSettings.romanceFrequency = "high"; assert.ok(tickRomanceFlavor());
  state.week = 24; state.narrativeSettings.conflictIntensity = "normal";
  assert.ok(tickLoveWorkConflict());
  assert.deepEqual(state.relationships, before);
});
