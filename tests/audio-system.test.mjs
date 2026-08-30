import test from "node:test";
import assert from "node:assert/strict";
import { audioModeForState, playSfx, soundForControl } from "../src/core/audio.js";

test("audio mode follows the current story and app context", () => {
  assert.equal(audioModeForState({ screen: "event", appOpen: null }), "event");
  assert.equal(audioModeForState({ screen: "game", appOpen: "planner" }), "runner");
  assert.equal(audioModeForState({ screen: "game", appOpen: "gallery" }), "summary");
  assert.equal(audioModeForState({ screen: "game", appOpen: "people" }), "room");
});

test("controls receive semantic sound cues", () => {
  const control = (selector, { disabled = false } = {}) => ({
    disabled,
    getAttribute: () => null,
    matches: (query) => query.split(",").some((entry) => entry.trim() === selector),
  });
  assert.equal(soundForControl(control("[data-close-app]")), "close");
  assert.equal(soundForControl(control("[data-open-app]")), "open");
  assert.equal(soundForControl(control("[data-event-choice]")), "reveal");
  assert.equal(soundForControl(control("#begin-week")), "week");
  assert.equal(soundForControl(control("button", { disabled: true })), null);
});

test("audio safely becomes a no-op where Web Audio is unavailable", () => {
  assert.equal(playSfx("success"), false);
});
