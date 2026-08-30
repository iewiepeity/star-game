import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { audioModeForState, playSfx, soundForControl } from "../src/core/audio.js";

test("audio mode follows the current story and app context", () => {
  assert.equal(audioModeForState({ screen: "event", appOpen: null }), "event");
  assert.equal(audioModeForState({ screen: "game", appOpen: "planner" }), "planning");
  assert.equal(audioModeForState({ screen: "game", appOpen: "gallery" }), "creative");
  assert.equal(audioModeForState({ screen: "game", appOpen: "people" }), "social");
  assert.equal(audioModeForState({ screen: "game", appOpen: null, notice: "獲得年度最佳演員獎項" }), "awards");
  assert.equal(audioModeForState({ screen: "game", appOpen: null, notice: "醜聞危機持續延燒" }), "tension");
  assert.equal(audioModeForState({ screen: "game", appOpen: null, notice: "兩人在深夜正式告白" }), "romance");
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

test("audio production chain includes dynamics, crossfades and app lifecycle handling", () => {
  const audio = readFileSync(new URL("../src/core/audio.js", import.meta.url), "utf8");
  const main = readFileSync(new URL("../src/main.js", import.meta.url), "utf8");
  assert.match(audio, /createDynamicsCompressor/);
  assert.match(audio, /musicBuses=\[context\.createGain\(\),context\.createGain\(\)\]/);
  assert.match(audio, /suspendAudio/);
  assert.match(audio, /careerIntensity/);
  assert.match(main, /visibilityState==="hidden"/);
  assert.match(main, /shouldPlayKeyboardSound/);
});

test("licensed offline one-shots are present and listed in the PWA shell", () => {
  const worker = readFileSync(new URL("../service-worker.js", import.meta.url), "utf8");
  const license = readFileSync(new URL("../assets/audio/README.md", import.meta.url), "utf8");
  for (const name of ["tap", "open", "close", "confirm", "warning", "reward", "paper", "scroll"]) {
    assert.equal(existsSync(new URL(`../assets/audio/kenney-interface/${name}.ogg`, import.meta.url)), true);
    assert.equal(worker.includes(`"${name}"`), true);
  }
  assert.match(license, /Creative Commons CC0 1\.0 Universal/);
  assert.match(license, /kenney\.nl\/assets\/interface-sounds/);
});
