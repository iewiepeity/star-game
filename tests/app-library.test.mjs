import test from "node:test";
import assert from "node:assert/strict";
import { APP_META, APP_LIBRARY_IDS, APP_DOCK_IDS, appIcon } from "../src/views/app-icons.js";
import { resetState, state } from "../src/core/state.js";
import { tabletHome, tabletDock, appWindow } from "../src/views/room.js";

test("tablet app library exposes every playable app with one icon contract", () => {
  assert.equal(APP_LIBRARY_IDS.length, 18);
  assert.equal(new Set(APP_LIBRARY_IDS).size, APP_LIBRARY_IDS.length);
  for (const id of APP_LIBRARY_IDS) {
    const meta = APP_META[id];
    assert.ok(meta?.label, `${id} needs a label`);
    assert.ok(meta?.title, `${id} needs a title`);
    assert.ok(meta?.note, `${id} needs a description`);
    assert.ok(meta?.tone, `${id} needs a colour tone`);
    assert.match(appIcon(id), /^<svg/);
    assert.match(appIcon(id), /aria-hidden="true"/);
    assert.doesNotMatch(appIcon(id), /undefined/);
  }
});

test("dock uses a unique subset of app library icons", () => {
  assert.equal(APP_DOCK_IDS.length, 6);
  assert.equal(new Set(APP_DOCK_IDS).size, APP_DOCK_IDS.length);
  assert.ok(APP_DOCK_IDS.every(id => APP_LIBRARY_IDS.includes(id)));
});

test("home, dock and every app window render the shared icon system", () => {
  resetState();
  state.name = "測試玩家";
  const home = tabletHome();
  assert.equal((home.match(/class="app-tile"/g) || []).length, 18);
  assert.equal((tabletDock().match(/class="mini-app-icon/g) || []).length, 6);
  for (const id of APP_LIBRARY_IDS) {
    assert.match(home, new RegExp(`data-open-app="${id}"`));
    state.appOpen = id;
    const window = appWindow();
    assert.match(window, new RegExp(`class="app-window ${id}"`));
    assert.match(window, /class="window-icon tone-/);
    assert.match(window, /class="app-icon-svg/);
  }
});
