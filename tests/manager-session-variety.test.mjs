import test from "node:test";
import assert from "node:assert/strict";
import { state, resetState, hydrateState } from "../src/core/state.js";
import { MANAGER_SCENES } from "../src/data/manager-scenes.js";
import { JOB_SESSION_SCENES } from "../src/data/job-session-scenes.js";
import { managerInteractionDecision, managerInteract, tickManager } from "../src/logic/manager.js";
import { resolvePersonalTask } from "../src/logic/personal-tasks.js";
import { JOB_CATALOG } from "../src/data/jobs.js";
import { completeJobSession, ensureJobState, jobProductionDecision } from "../src/logic/job-engine.js";

function fresh(agency = "starlight") {
  resetState();
  state.currentAgencyId = agency;
  state.stamina = 100;
  state.health = 100;
  state.money = 50000;
}

test("四家公司三種會談各有八場，每一場的選項與結局都完整對應", () => {
  const titles = new Set(), texts = new Set();
  let count = 0;
  for (const [agency, types] of Object.entries(MANAGER_SCENES)) {
    for (const [type, scenes] of Object.entries(types)) {
      assert.equal(scenes.length, 8);
      for (const scene of scenes) {
        count++;
        titles.add(scene.title); texts.add(scene.text);
        assert.ok(scene.text.length > 30, scene.id);
        assert.deepEqual(scene.choices.map((c) => c.id), ["listen", "assert", "compromise"]);
        assert.equal(new Set(scene.choices.map((c) => c.label)).size, 3);
        assert.equal(new Set(scene.choices.map((c) => c.outcome)).size, 3);
        for (const choice of scene.choices) {
          fresh(agency);
          const task = { kind: "manager_interact", payload: { type, managerSceneId: scene.id } };
          const decision = managerInteractionDecision(task);
          assert.ok(decision.title.includes(scene.title));
          assert.ok(decision.choices.some((c) => c.id === choice.id && c.label === choice.label));
          const result = resolvePersonalTask(task, choice.id);
          assert.equal(result.ok, true);
          assert.equal(result.title, decision.title);
          assert.equal(result.text, `${scene.text} ${choice.outcome}`);
        }
      }
    }
  }
  assert.equal(count, 96);
  assert.equal(titles.size, count);
  assert.equal(texts.size, count);
});

test("會談跨週依近期紀錄輪替，讀檔後決策與結果仍是選到的同一場", () => {
  for (const agency of Object.keys(MANAGER_SCENES)) {
    fresh(agency);
    const seen = { chat: new Set(), career: new Set(), apologize: new Set() };
    for (let round = 0; round < 8; round++) {
      for (const type of Object.keys(seen)) {
        const task = { kind: "manager_interact", payload: { type } };
        const decision = managerInteractionDecision(task);
        assert.deepEqual(managerInteractionDecision(task), decision);
        assert.equal(seen[type].has(task.payload.managerSceneId), false, `${agency} ${type}`);
        seen[type].add(task.payload.managerSceneId);
        const persisted = JSON.parse(JSON.stringify({ game: state, task }));
        hydrateState(persisted.game);
        assert.deepEqual(managerInteractionDecision(persisted.task), decision);
        const result = resolvePersonalTask(persisted.task, "compromise");
        assert.equal(result.title, decision.title);
        assert.equal(state.managerPrepUntil, state.week + 1);
        assert.equal(managerInteract(type).ok, false);
        tickManager();
        state.week++;
      }
    }
    for (const type of Object.keys(seen)) assert.equal(seen[type].size, 8);
  }
});

test("四類長期通告空檔有六十四場日常製作，不改四幕、成品和報酬流程", () => {
  assert.equal(Object.values(JOB_SESSION_SCENES).flat().length, 64);
  for (const category of ["歌曲", "電視劇", "綜藝", "廣告"]) {
    fresh();
    const job = JOB_CATALOG.filter((j) => j.category === category).sort((a, b) => b.sessions - a.sessions)[0];
    const record = ensureJobState(job.id);
    record.stage = "active"; record.auditionChoice = "steady";
    const scenes = [], continuing = [];
    for (let i = 0; i < job.sessions; i++) {
      state.week = Math.floor(i / 7) + 1; state.runnerDay = i % 7;
      const decision = jobProductionDecision(job.id);
      const result = completeJobSession(job.id, decision ? "protect" : null);
      assert.equal(result.ok, true, job.id);
      scenes.push(...result.scenes);
      if (!result.scenes.length) {
        continuing.push(result.scene);
        assert.ok(result.text.includes(result.scene.text));
        assert.ok(result.scene.id.startsWith("job-session-"));
        assert.doesNotMatch(result.text, /今天依上次確認的版本繼續製作/);
      }
    }
    assert.deepEqual(scenes.map((scene) => scene.stage), [0, 1, 2, 3]);
    assert.equal(continuing.length, job.sessions - 4);
    assert.equal(new Set(continuing.map((scene) => scene.text)).size, continuing.length, job.id);
    assert.equal(record.continuationHistory.length, continuing.length);
    assert.equal(record.storyHistory.filter((scene) => ["production", "completion"].includes(scene.phase)).length, 4);
    assert.equal(state.completedWorks.length, 1);
    const money = state.money;
    assert.equal(completeJobSession(job.id).ok, false);
    assert.equal(state.money, money);
  }
});
