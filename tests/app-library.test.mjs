import test from "node:test";
import assert from "node:assert/strict";
import { APP_META, APP_LIBRARY_IDS, APP_DOCK_IDS, DEFAULT_DOCK_IDS, normalizeDockIds, appIcon } from "../src/views/app-icons.js";
import { resetState, state } from "../src/core/state.js";

import { peopleHubApp } from "../src/views/people.js";

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

test("saved app shortcuts sanitize invalid and duplicate values",()=>{
 resetState();
 state.dockAppIds=["jobs","creative","npc","social","agency","settings"];
 assert.deepEqual(normalizeDockIds(["jobs","jobs","unknown","map"]),["jobs","map"]);
 assert.deepEqual(normalizeDockIds([]),[...DEFAULT_DOCK_IDS]);
});

test("contacts and dossiers are two tabs in one people app",()=>{
 resetState();state.knownPeople=["lujingran"];
 state.peopleSection="contacts";
 assert.match(peopleHubApp(),/訊息與關係/);
 assert.match(peopleHubApp(),/手機通訊錄/);
 state.peopleSection="profiles";
 const html=peopleHubApp();
 assert.match(html,/人物檔案/);
 assert.match(html,/PERSONAL FILE/);
 assert.doesNotMatch(html,/position:sticky/);
});
