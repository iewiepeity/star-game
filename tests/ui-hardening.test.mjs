import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("UI hardening stylesheet is loaded and available offline", async () => {
  const [index, worker, css] = await Promise.all([read("index.html"), read("service-worker.js"), read("ui-hardening.css")]);
  assert.match(index, /ui-hardening\.css/);
  assert.match(worker, /ui-hardening\.css/);
  assert.match(css, /100dvh/);
  assert.match(css, /safe-area-inset-top/);
  assert.match(css, /--control-min: 44px/);
});

test("dialogs expose keyboard focus management and safe destructive defaults", async () => {
  const [dialog, binding, focus] = await Promise.all([read("src/views/confirm-dialog.js"), read("src/bind/room.js"), read("src/core/dialog-focus.js")]);
  assert.match(dialog, /role="alertdialog"/);
  assert.match(dialog, /tabindex="-1"/);
  assert.match(binding, /event\.key === "Escape"/);
  assert.match(binding, /trapDialogFocus/);
  assert.match(focus, /event\.shiftKey/);
  assert.match(binding, /\[data-confirm-cancel\]/);
  assert.match(dialog, /繼續交往/);
});

test("only the currently open app binds its interaction layer", async () => {
  const source = await read("src/bind.js");
  assert.match(source, /appBinders\[state\.appOpen\]/);
  assert.doesNotMatch(source, /bindPlanner\(\);\s*bindMap\(\);/);
});

test("planner, jobs and map include the new compact operation controls", async () => {
  const [planner, jobs, map, settings] = await Promise.all([read("src/views/planner.js"), read("src/views/jobs.js"), read("src/views/map.js"), read("src/views/settings.js")]);
  assert.match(planner, /data-clear-day/);
  assert.match(planner, /aria-pressed/);
  assert.match(jobs, /工作狀態篩選/);
  assert.match(map, /map-place-details/);
  assert.match(map, /aria-pressed/);
  assert.match(settings, /主動退圈並查看結算/);
});
