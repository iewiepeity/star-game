import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { CREATIVE_DIRECTION_STORIES, creativePhaseCopy, creativePhaseKey } from "../src/data/creative-story-content.js";
import { CREATIVE_PHASE_VARIANTS } from "../src/data/creative-phase-variants.js";

const phases = { development: 4, production: 3, release: 3 };
const routes = Object.entries(CREATIVE_DIRECTION_STORIES).flatMap(([type, directions]) => Object.keys(directions).map(direction => ({ type, direction })));
const pool = (project, phase, slot) => [
  CREATIVE_DIRECTION_STORIES[project.type][project.direction][`${phase}Beats`][slot],
  CREATIVE_PHASE_VARIANTS[project.type][project.direction][phase][slot],
];
const projectAt = (route, patch = {}) => ({
  ...route, id: "CP-1000-0", progress: 15, productionSessions: 1,
  productionProgress: 25, marketScore: 60, status: "draft", storyHistory: [], ...patch,
});
const record = (project, phase) => {
  const text = creativePhaseCopy(project, phase);
  project.storyHistory.push({ phase, text, storyKey: creativePhaseKey(project, phase) });
  return text;
};

test("all 90 original creative craft scenes remain byte-for-byte unchanged", () => {
  const original = routes.flatMap(({ type, direction }) => Object.keys(phases).flatMap(phase => CREATIVE_DIRECTION_STORIES[type][direction][`${phase}Beats`]));
  assert.equal(original.length, 90);
  assert.equal(createHash("sha256").update(JSON.stringify(original)).digest("hex"), "4b5342b1b0c9d715e81e4fe70a72a459f851741a54c99df89836f5a70e5a005d");
});

test("nine directions each add four development, three production and three release scenes", () => {
  const additions = [];
  for (const { type, direction } of routes) {
    for (const [phase, count] of Object.entries(phases)) {
      const scenes = CREATIVE_PHASE_VARIANTS[type][direction][phase];
      assert.equal(scenes.length, count, `${type}/${direction}/${phase}`);
      for (const text of scenes) {
        const count = (text.match(/\p{Script=Han}/gu) || []).length;
        assert.ok(count >= 45 && count <= 85, `${type}/${direction}/${phase}: ${count} Han characters`);
        assert.doesNotMatch(text, /[画却项见变换]|TODO|\{[^}]+\}/u, "authored Traditional Chinese rather than placeholders");
      }
      additions.push(...scenes);
    }
  }
  assert.equal(routes.length, 9);
  assert.equal(additions.length, 90);
  assert.equal(new Set(additions).size, 90);
  const original = routes.flatMap(({ type, direction }) => Object.keys(phases).flatMap(phase => CREATIVE_DIRECTION_STORIES[type][direction][`${phase}Beats`]));
  assert.equal(new Set([...original, ...additions]).size, 180);
});

test("development milestones preserve every boundary and use both authored variants", () => {
  for (const route of routes) {
    for (const [progress, slot] of [[0, 0], [1, 0], [25, 0], [26, 1], [50, 1], [51, 2], [75, 2], [76, 3], [100, 3]]) {
      for (let variant = 0; variant < 2; variant++) {
        const project = projectAt(route, { id: `CP-${1000 + variant}-` + variant, progress });
        assert.equal(creativePhaseCopy(project, "development"), pool(project, "development", slot)[variant]);
      }
    }
  }
});

test("production text separates setup, ongoing work and actual completion", () => {
  const cases = [
    [{ productionSessions: 1, productionProgress: 20 }, 0],
    [{ productionSessions: 2, productionProgress: 45 }, 1],
    [{ productionSessions: 5, productionProgress: 90 }, 1],
    [{ productionSessions: 1, productionProgress: 100 }, 2],
    [{ productionSessions: 2, productionProgress: 60, status: "ready_release" }, 2],
  ];
  for (const route of routes) for (const [patch, slot] of cases) for (let variant = 0; variant < 2; variant++) {
    const project = projectAt(route, { ...patch, id: `CP-1000-${variant}` });
    assert.equal(creativePhaseCopy(project, "production"), pool(project, "production", slot)[variant]);
  }
});

test("release scenes follow actual market-score bands and never invent a hit or award", () => {
  for (const route of routes) for (const [marketScore, slot] of [[20, 0], [54, 0], [55, 1], [81, 1], [82, 2], [100, 2]]) {
    for (let variant = 0; variant < 2; variant++) {
      const project = projectAt(route, { marketScore, id: `CP-1000-${variant}` });
      const text = creativePhaseCopy(project, "release");
      assert.equal(text, pool(project, "release", slot)[variant]);
      assert.doesNotMatch(text, /爆紅|得獎|售罄|榜首|冠軍|大賣|全網/);
      if (marketScore < 55) assert.match(text, /有限|稀疏|不多|冷清|還沒|還不|沒有|偏淡|零落|安靜|零散|回應還少|反應還少|反應還沒|仍沒|熱度仍/);
    }
  }
});

test("successive real project IDs start different variants without relying on timestamps", () => {
  for (const route of routes) for (const phase of Object.keys(phases)) {
    const first = projectAt(route, { id: "CP-100000-0" });
    const second = projectAt(route, { id: "CP-999999-1" });
    assert.notEqual(creativePhaseCopy(first, phase), creativePhaseCopy(second, phase));
  }
});

test("same-slot steps prefer unread scenes, alternate after exhaustion, and stay stable after recording", () => {
  for (const route of routes) {
    const project = projectAt(route, { progress: 26, storyStep: 1 });
    const first = record(project, "development");
    assert.equal(creativePhaseCopy(project, "development"), first);
    project.progress = 40;
    project.storyStep++;
    const second = record(project, "development");
    assert.notEqual(second, first);
    assert.equal(creativePhaseCopy(project, "development"), second);
    assert.equal(creativePhaseCopy(JSON.parse(JSON.stringify(project)), "development"), second);
    project.progress = 49;
    project.storyStep++;
    assert.equal(record(project, "development"), first);
    assert.equal(creativePhaseCopy(project, "development"), first);
  }
});

test("legacy histories without story keys skip the previously read scene in its exact slot", () => {
  for (const route of routes) for (const phase of Object.keys(phases)) {
    const project = projectAt(route);
    const slot = phase === "release" ? 1 : 0;
    const [base, extra] = pool(project, phase, slot);
    project.storyHistory = [{ week: 1, phase, text: base }];
    assert.equal(creativePhaseCopy(project, phase), extra);
    assert.deepEqual(project.storyHistory, [{ week: 1, phase, text: base }]);
  }
});

test("pure selection is deterministic, tolerates missing data and does not mutate project or history", () => {
  const project = projectAt(routes[0], { id: "older-project-id", storyHistory: [null, { phase: "development", text: "舊版無關文字" }] });
  Object.freeze(project.storyHistory[1]);
  Object.freeze(project.storyHistory);
  Object.freeze(project);
  const before = JSON.stringify(project);
  for (const phase of Object.keys(phases)) {
    assert.equal(creativePhaseCopy(project, phase), creativePhaseCopy(JSON.parse(before), phase));
  }
  assert.equal(JSON.stringify(project), before);
  assert.match(creativePhaseCopy(null, "development"), /重新核對/);
  assert.equal(creativePhaseCopy(project, "strength"), CREATIVE_DIRECTION_STORIES.song.heart.strength);
});

test("actual creative actions record exactly the returned story and keep the gameplay RNG draw counts", async () => {
  const game = await import("../src/core/state.js");
  const { setSeed } = await import("../src/core/rng.js");
  const { createCreativeProject, creativeStory, workOnCreativeProject, startCreativeProduction, releaseCreativeProject } = await import("../src/logic/creative.js");
  game.resetState();
  const { state } = game;
  state.name = "文本測試";
  state.money = 100000;
  setSeed("creative-phase-history");
  const project = createCreativeProject("song", "一步一步的歌");
  project.id = "CP-1000-0";
  const checkResult = (result, phase, previousCursor, draws) => {
    assert.equal(result.story, project.storyHistory.at(-1).text);
    assert.equal(project.storyHistory.at(-1).storyKey, creativePhaseKey(project, phase));
    assert.equal(creativeStory(project, phase), result.story);
    assert.equal(state.rngCursor - previousCursor, draws);
  };
  let cursor = state.rngCursor;
  const development = workOnCreativeProject(project.id);
  checkResult(development, "development", cursor, 2);
  assert.equal(project.storyStep, 1);
  Object.assign(project, { status: "contracted", productionSessions: 0, productionProgress: 0, requiredProductionSessions: 1, category: "歌曲", selfParticipation: false, team: [] });
  cursor = state.rngCursor;
  const production = startCreativeProduction(project.id);
  checkResult(production, "production", cursor, 2);
  assert.equal(project.status, "ready_release");
  assert.equal(project.productionProgress, 100);
  assert.ok(pool(project, "production", 2).includes(production.story));
  cursor = state.rngCursor;
  const released = releaseCreativeProject(project.id);
  checkResult(released, "release", cursor, 1);
  assert.equal(project.storyStep, 3);
  assert.equal(project.status, "released");
  assert.equal(state.completedWorks.length, 1);
});

test("reworking a rejected finished draft advances text even when progress remains one hundred", async () => {
  const game = await import("../src/core/state.js");
  const { setSeed } = await import("../src/core/rng.js");
  const { createCreativeProject, workOnCreativeProject } = await import("../src/logic/creative.js");
  game.resetState();
  const { state } = game;
  setSeed("creative-rejected-rework");
  const project = createCreativeProject("show", "改稿仍往前");
  Object.assign(project, { id: "CP-1000-0", progress: 100, status: "rejected" });
  const first = workOnCreativeProject(project.id);
  project.status = "rejected";
  const second = workOnCreativeProject(project.id);
  assert.equal(project.progress, 100);
  assert.notEqual(first.story, second.story);
  assert.equal(project.storyHistory.at(-1).text, second.story);
  assert.equal(project.storyStep, 2);
  assert.equal(state.rngCursor, 4);
});
