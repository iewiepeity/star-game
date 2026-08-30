import test from "node:test";
import assert from "node:assert/strict";
import { APP_META, APP_LIBRARY_IDS, APP_DOCK_IDS, DEFAULT_DOCK_IDS, normalizeDockIds, appIcon } from "../src/views/app-icons.js";
import { resetState, state } from "../src/core/state.js";
import { tabletHome, tabletDock, appWindow } from "../src/views/room.js";
import { peopleHubApp } from "../src/views/people.js";

test("tablet app library exposes every playable app with one icon contract", () => {
  assert.equal(APP_LIBRARY_IDS.length, 17);
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

test("dock accepts six player-selected apps and sanitizes invalid saved values",()=>{
 resetState();
 state.dockAppIds=["jobs","creative","npc","social","agency","settings"];
 const dock=tabletDock();
 for(const id of["jobs","creative","people","social","agency","settings"])assert.match(dock,new RegExp(`data-open-app="${id}"`));
 assert.doesNotMatch(dock,/data-open-app="npc"/);
 assert.doesNotMatch(dock,/data-open-app="planner"/);
 assert.deepEqual(normalizeDockIds(["jobs","jobs","unknown","map"]),["jobs","map"]);
 assert.deepEqual(normalizeDockIds([]),[...DEFAULT_DOCK_IDS]);
});

test("dock editor shows selections, empty slots and blocks incomplete save",()=>{
 resetState();state.dockEditing=true;state.dockDraftIds=["planner","gallery","jobs","creative","settings"];
 const home=tabletHome(),dock=tabletDock();
 assert.match(home,/CUSTOMIZE DOCK/);
 assert.match(home,/data-dock-toggle="jobs"/);
 assert.match(home,/data-dock-save disabled/);
 assert.equal((dock.match(/class="dock-empty"/g)||[]).length,1);
 assert.equal((dock.match(/data-dock-remove=/g)||[]).length,5);
});

test("home, dock and every app window render the shared icon system", () => {
  resetState();
  state.name = "測試玩家";
  state.appLibraryExpanded = true;
  const home = tabletHome();
  assert.equal((home.match(/class="app-tile"/g) || []).length, 17);
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

test("home defaults to six recent apps and expands to the complete library",()=>{
 resetState();state.recentAppIds=["jobs","creative","people"];
 const compact=tabletHome();
 assert.match(compact,/RECENT APPS/);
 assert.equal((compact.match(/class="app-tile"/g)||[]).length,3);
 state.appLibraryExpanded=true;
 const expanded=tabletHome();
 assert.match(expanded,/APP LIBRARY/);
 assert.equal((expanded.match(/class="app-tile"/g)||[]).length,17);
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
