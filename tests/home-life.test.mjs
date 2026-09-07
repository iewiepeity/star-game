import test from "node:test";
import assert from "node:assert/strict";
import { initialState, hydrateState, resetState, state } from "../src/core/state.js";
import { validateGameState } from "../src/core/save-schema.js";
import {
  buyHomeItem,
  buySupply,
  ensureHomeLife,
  giftCraftedItem,
  homeActionAccess,
  keyAccessStatus,
  placeHomeItem,
  resolveCrafting,
  resolveHomeVisit,
  setDisplayedKeepsake,
  setHomeKey,
  useCraftedItem,
} from "../src/logic/home-life.js";
import { beginDay, initialLife, planDay, settleDay } from "../src/pixel/life.js";

function known(id = "jiqing") {
  state.knownPeople = [id];
  state.relationships[id] = {
    closeness: 70,
    trust: 65,
    romance: "dating",
    affection: 70,
    hostility: 0,
    stage: "confidant",
    events: [],
    hostilityHistory: [],
    romanceHistory: [],
    affectionHistory: [],
  };
}

test("舊存檔會補齊居家資料，家具購買與擺放只扣款一次", () => {
  const old = initialState();
  delete old.homeLife;
  hydrateState(old);
  assert.ok(state.homeLife.ownedFurniture.includes("starter_bed"));
  const before = state.money;
  assert.equal(buyHomeItem("rose_sofa").ok, true);
  assert.equal(state.money, before - 7600);
  assert.equal(buyHomeItem("rose_sofa").ok, false);
  assert.equal(state.money, before - 7600);
  assert.equal(placeHomeItem("rose_sofa").ok, true);
  assert.equal(state.homeLife.placedFurniture.sofa, "rose_sofa");
  assert.equal(validateGameState(state).ok, true);
});

test("手作必須有材料，結算只消耗一次且可留給自己", () => {
  resetState();
  assert.match(homeActionAccess(state, { id: "home_craft", recipeId: "cocoa_cookie" }), /材料不足/);
  assert.equal(buySupply("pantry").ok, true);
  const result = resolveCrafting({ id: "home_craft", recipeId: "cocoa_cookie" }, () => 40);
  assert.equal(result.ok, true);
  assert.equal(state.homeLife.materials.flour, 1);
  assert.equal(state.homeLife.craftedItems.length, 1);
  const mood = state.mood;
  assert.equal(useCraftedItem(result.item.id).ok, true);
  assert.equal(state.mood, mood + 6);
  assert.equal(useCraftedItem(result.item.id).ok, false);
});

test("作客需要關係條件，同週不能重複刷收益並記住房內紀念", () => {
  resetState();
  known();
  const home = ensureHomeLife();
  home.keepsakes.push({ id: "npc:jiqing:test", name: "深夜節目票根", npcId: "jiqing", kind: "人物", source: "共同回憶" });
  setDisplayedKeepsake("npc:jiqing:test");
  const assignment = { id: "home_host", npcId: "jiqing", activityId: "dinner" };
  const result = resolveHomeVisit(assignment);
  assert.equal(result.ok, true);
  assert.match(result.text, /深夜節目票根/);
  assert.match(homeActionAccess(state, assignment), /這週已經/);
  assert.equal(state.homeLife.visits.length, 1);
  assert.equal(state.homeLife.keepsakes.some((item) => item.id === "npc:jiqing:first-visit"), true);
  assert.equal(state.npcInteractionMemories.at(-1).action, "home_visit");
});

test("安排到家作客會鎖定雙方檔期，更換行程則釋放", () => {
  const life = initialLife("home-schedule");
  life.game.knownPeople = ["jiqing"];
  life.game.relationships.jiqing = { closeness: 70, trust: 65, romance: "dating", affection: 70, hostility: 0, stage: "confidant" };
  const assignment = { id: "home_host", npcId: "jiqing", activityId: "dinner" };
  assert.equal(planDay(life, 2, assignment), "");
  assert.equal(life.game.npcSchedules.jiqing.some((slot) => slot.day === 2 && slot.status === "reserved"), true);
  assert.equal(planDay(life, 2, { id: "rest" }), "");
  assert.equal(life.game.npcSchedules.jiqing.some((slot) => slot.day === 2 && slot.status === "reserved"), false);
});

test("禮物尊重偏好、限制每週一次，同品項重複時收益遞減", () => {
  resetState();
  known();
  buySupply("pantry");
  let made = resolveCrafting({ id: "home_craft", recipeId: "cocoa_cookie" }, () => 80).item;
  const first = giftCraftedItem(made.id, "jiqing");
  assert.equal(first.ok, true);
  assert.equal(state.homeLife.gifts.at(-1).liked, true);
  state.week++;
  buySupply("pantry");
  made = resolveCrafting({ id: "home_craft", recipeId: "cocoa_cookie" }, () => 80).item;
  const before = state.relationships.jiqing.closeness;
  assert.equal(giftCraftedItem(made.id, "jiqing").ok, true);
  assert.equal(state.relationships.jiqing.closeness - before, 1);
  assert.equal(state.homeLife.gifts.at(-1).repeated, true);
  assert.equal(giftCraftedItem(made.id, "jiqing").ok, false);
});

test("備用鑰匙需高度信任，分手或交惡後立即失效", () => {
  resetState();
  known();
  assert.equal(setHomeKey("jiqing", true).ok, true);
  assert.equal(keyAccessStatus("jiqing").active, true);
  state.relationships.jiqing.romance = "broken";
  assert.equal(keyAccessStatus("jiqing").active, false);
  assert.equal(setHomeKey("jiqing", false).ok, true);
  assert.equal(keyAccessStatus("jiqing").granted, false);
});

test("像素行程的居家行動沿用每日 ledger，重播不重複發成品或作客收益", () => {
  const life = initialLife("home-ledger");
  buySupply("pantry", life.game);
  const assignment = { id: "home_craft", recipeId: "cocoa_cookie" };
  beginDay(life, assignment);
  const first = settleDay(life);
  const material = life.game.homeLife.materials.flour;
  const count = life.game.homeLife.craftedItems.length;
  const replay = settleDay(life);
  assert.equal(replay.id, first.id);
  assert.equal(life.game.homeLife.materials.flour, material);
  assert.equal(life.game.homeLife.craftedItems.length, count);
});
