import test from "node:test";
import assert from "node:assert/strict";
import { SCHEDULE_EVENTS } from "../src/data/schedule-events.js";
import { TRAINING_MOMENTS } from "../src/data/training-moments.js";

const courses = ["vocal", "acting", "dance", "speech", "creation", "songwriting", "script", "image", "networking"];

test("all nine training courses integrate fifteen distinct classroom scenes", () => {
  assert.deepEqual(Object.keys(TRAINING_MOMENTS), courses);
  const titles = new Set(), texts = new Set(), outcomes = new Set();
  for (const kind of courses) {
    assert.equal(TRAINING_MOMENTS[kind].length, 15, kind);
    assert.equal(SCHEDULE_EVENTS[kind].length, 20, kind);
    for (const [index, [title, text, outcome]] of TRAINING_MOMENTS[kind].entries()) {
      assert.ok(title && text.length >= 25 && outcome.length >= 20, `${kind}: ${title}`);
      assert.equal(titles.has(title), false, title);
      assert.equal(texts.has(text), false, title);
      assert.equal(outcomes.has(outcome), false, title);
      titles.add(title); texts.add(text); outcomes.add(outcome);
      assert.equal(SCHEDULE_EVENTS[kind][index + 5].title, title);
      assert.equal(SCHEDULE_EVENTS[kind][index + 5].text, text);
      assert.equal(SCHEDULE_EVENTS[kind][index + 5].outcome, outcome);
    }
  }
  assert.equal(titles.size, 135);
});

test("additional training scenes preserve each course's existing effect distribution", () => {
  for (const kind of courses) {
    const events = SCHEDULE_EVENTS[kind];
    for (let index = 5; index < events.length; index++)
      assert.deepEqual(events[index].effect, events[index % 5].effect, `${kind}: ${events[index].title}`);
  }
});
