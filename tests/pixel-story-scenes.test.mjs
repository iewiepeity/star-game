import test from "node:test";
import assert from "node:assert/strict";
import { NPC_ARCS } from "../src/data/npc-arc-events.js";
import { NPC_LONGFORM_CHAPTERS } from "../src/data/longform-content.js";
import { NPC_INVITATION_POOLS } from "../src/data/invitation-content.js";
import {
  HIDDEN_ROUTE_CHAPTERS,
  queueHiddenRoute,
} from "../src/logic/hidden-route.js";
import { initialLife, withCore } from "../src/pixel/life.js";
import { currentStory, chooseStory } from "../src/pixel/career.js";
import { eventContext } from "../src/logic/event-context.js";
import {
  storyScene,
  adaptSavedInvitation,
  CHAPTER_SETS,
  PERSONAL_SETS,
} from "../src/pixel/story-scenes.js";
import { storyFormation } from "../src/pixel/story-blocking.js";
import { ROOMS } from "../src/pixel/data.js";
import { buildGrid, findPath, walkable } from "../src/pixel/navigation.js";

test("all 80 authored NPC chapters and 100 longform follow-ups have concrete sets and preserve every beat", () => {
  assert.equal(Object.keys(CHAPTER_SETS).length, 80);
  let chapters = 0,
    followups = 0;
  for (const [prefix, catalog] of [
    ["npc-arc-", NPC_ARCS],
    ["npc-long:", NPC_LONGFORM_CHAPTERS],
  ]) {
    for (const [npcId, pool] of Object.entries(catalog))
      for (const chapter of pool) {
        const id = `${prefix}${npcId}${prefix.endsWith(":") ? ":" : "-"}${chapter.id}`;
        const event = { ...chapter, id, npcId };
        const plan = storyScene(event);
        assert.ok(ROOMS[plan.room], id);
        assert.deepEqual(plan.cast, [npcId]);
        assert.ok(plan.beats.some((b) => b.text === chapter.text));
        for (const beat of chapter.beats || [])
          assert.ok(
            plan.beats.some((b) => b.text === beat.text),
            id + beat.label,
          );
        for (const choice of chapter.choices)
          if (choice.followUp) {
            const follow = storyScene({
              ...event,
              id: `${id}:${choice.id}:follow-up`,
              text: choice.followUp.text,
              beats: [],
            });
            assert.equal(follow.room, plan.room);
            assert.equal(follow.beats[0].text, choice.followUp.text);
            followups++;
          }
        chapters++;
      }
  }
  assert.equal(chapters, 80);
  assert.equal(followups, 100);
});
test("all 40 invitations ask before travel; rescheduled meetings stage only their actual visit", () => {
  let count = 0;
  for (const [npcId, pool] of Object.entries(NPC_INVITATION_POOLS))
    for (const [type, invitation] of Object.entries(pool)) {
      const id = `invitation:${npcId}:26`,
        game = { npcInvitationHistory: [{ id, npcId, type }] };
      const e = {
        id,
        cast: [npcId],
        text: invitation.ask,
        beats: [
          { label: "來信", text: invitation.ask },
          { label: "相聚", text: invitation.detail },
        ],
        choices: [{ id: "accept" }, { id: "decline" }],
      };
      const plan = storyScene(e, game);
      assert.ok(ROOMS[plan.room]);
      assert.equal(plan.replyFirst, true);
      assert.equal(plan.acceptId, "accept");
      assert.equal(plan.beats.length, 1);
      assert.equal(plan.beats[0].text, invitation.detail);
      assert.equal(
        storyScene({ ...e, id: id + ":rescheduled" }, game).replyFirst,
        false,
      );
      count++;
    }
  assert.equal(count, 40);
});
test("relationship milestones remain messages while friendship, romance and ensembles have their cast", () => {
  for (const npcId of Object.keys(PERSONAL_SETS)) {
    assert.equal(
      storyScene({ id: `npc-story-${npcId}:stage:acquaintance`, npcId }),
      null,
    );
    for (const stage of ["familiar", "confidant", "bonded"])
      assert.ok(storyScene({ id: `npc-story-${npcId}:stage:${stage}`, npcId }));
    for (const romance of [
      "none",
      "interested",
      "ambiguous",
      "dating",
      "committed",
      "engaged",
      "rejected",
      "broken",
    ])
      assert.ok(
        storyScene({ id: `npc-romance-${npcId}:romance:${romance}:0`, npcId }),
      );
  }
  const e = {
    id: "ensemble:sufei:jiqing:shenyao:52",
    cast: ["sufei", "jiqing", "shenyao"],
    text: "合作的選擇",
    effect: { mood: 2 },
  };
  assert.deepEqual(eventContext(e).npcIds, e.cast);
  assert.deepEqual(storyScene(e).cast, e.cast);
});
test("every city set has separate, reachable marks for a protagonist and three guests", () => {
  for (const [id, room] of Object.entries(ROOMS)) {
    const points = storyFormation(room, 3),
      grid = buildGrid(room);
    assert.equal(points.length, 4, id);
    for (const [i, point] of points.entries()) {
      assert.ok(walkable(room, point), id);
      assert.ok(findPath(grid, room.entry, point).length, id);
      for (const other of points.slice(i + 1))
        assert.ok(Math.hypot(point.x - other.x, point.y - other.y) >= 62, id);
    }
  }
});
test("pending legacy invitations adapt their setting without modifying choices or historical memories", () => {
  const event = {
    id: "invitation:sufei:26",
    text: "等洗衣機",
    beats: [{ text: "洗衣店" }, { text: "滾筒轉動" }],
    choices: [
      {
        id: "accept",
        outcome: "離開房租日的自助洗衣店",
        effect: { npc: "sufei", relation: 5 },
        followUp: { event: { text: "回到房租日的自助洗衣店" } },
      },
    ],
  };
  const history = [
    { id: event.id, npcId: "sufei", type: "low", title: "房租日的自助洗衣店" },
  ];
  const adapted = adaptSavedInvitation(event, {
    npcInvitationHistory: history,
  });
  assert.equal(adapted.beats[1].text, NPC_INVITATION_POOLS.sufei.low.detail);
  assert.deepEqual(adapted.choices[0].effect, event.choices[0].effect);
  assert.match(adapted.choices[0].followUp.event.text, /晨星咖啡館/);
  assert.equal(history[0].title, "房租日的自助洗衣店");
  assert.equal(event.beats[1].text, "滾筒轉動");
});
test("all eight second-run chapters queue through the pixel transaction and stay serializable through a choice", () => {
  const life = initialLife("hidden-pixel-test");
  life.game.week = 20;
  life.game.familiarNpcs = ["jiqing", "sufei", "shenyao"];
  assert.equal(withCore(life, queueHiddenRoute), null);
  life.game.runCount = 2;
  for (const chapter of HIDDEN_ROUTE_CHAPTERS) {
    if (life.game.relationships.silver_pc)
      life.game.relationships.silver_pc.trust = 80;
    assert.equal(
      withCore(life, queueHiddenRoute),
      `silver-route-${chapter.id}`,
    );
    const story = currentStory(life),
      plan = storyScene(story.event, life.game);
    assert.deepEqual(plan.cast, ["silver_pc"]);
    assert.ok(ROOMS[plan.room]);
    assert.ok(plan.beats.length >= chapter.beats.length);
    assert.doesNotThrow(() => structuredClone(life));
    assert.equal(
      chooseStory(life, chapter.choices[0].id).id,
      `silver-route-${chapter.id}`,
    );
    assert.doesNotThrow(() => structuredClone(life));
    life.game.eventOutcome = null;
    life.game.week++;
  }
  assert.equal(life.game.eventHistory.length, 8);
});
