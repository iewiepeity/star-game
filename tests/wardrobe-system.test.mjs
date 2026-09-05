import test from "node:test";
import assert from "node:assert/strict";
import { initialState, hydrateState } from "../src/core/state.js";
import {
  purchaseOutfit,
  bonusComparison,
  saveLook,
  normalizeSavedLooks,
} from "../src/logic/wardrobe.js";
import { persistableState } from "../src/core/persistence.js";
function shopper() {
  const game = initialState();
  game.money = 9000;
  game.visitedLocationsByWeek[game.week] = ["shop"];
  return game;
}
test("服裝交易原子扣款，重送、金額不足、未到店不更動進度", () => {
  const game = shopper();
  assert.equal(purchaseOutfit(game, "raven", "stage").ok, true);
  assert.equal(game.money, 5500);
  assert.equal(game.outfitId, "stage");
  assert.deepEqual(game.ownedOutfits.raven, ["newcomer", "stage"]);
  const before = structuredClone(game);
  assert.equal(purchaseOutfit(game, "raven", "stage").ok, false);
  assert.equal(purchaseOutfit(game, "raven", "icon").ok, false);
  assert.equal(purchaseOutfit(game, "sunny", "practice").ok, false);
  assert.deepEqual(game, before);
  game.week++;
  const nextWeek = structuredClone(game);
  assert.equal(purchaseOutfit(game, "raven", "practice").ok, false);
  assert.deepEqual(game, nextWeek);
});
test("能力比較包含失去的加成與上限，但不修改穿著或基礎能力", () => {
  const game = shopper();
  game.stats = { 親和力: 999, 時尚: 990 };
  const before = structuredClone(game);
  const comparison = bonusComparison(game, "stage");
  assert.deepEqual(
    comparison.find((r) => r.name === "親和力"),
    { name: "親和力", before: 1000, after: 999, delta: -1 },
  );
  assert.equal(comparison.find((r) => r.name === "時尚").delta, 4);
  assert.deepEqual(game, before);
});
test("常用造型只存已購服裝，依人物獨立持有，讀檔清除無效資料", () => {
  const game = shopper();
  purchaseOutfit(game, "raven", "stage");
  assert.equal(saveLook(game, "work"), true);
  assert.equal(saveLook(game, "invalid"), false);
  game.savedLooks.sunny.work = "stage";
  const normalized = normalizeSavedLooks(game, game.savedLooks);
  assert.equal(normalized.raven.work, "stage");
  assert.deepEqual(normalized.sunny, {});
  const loaded = hydrateState({ ...game, savedLooks: normalized });
  assert.equal(loaded.savedLooks.raven.work, "stage");
  const legacy = hydrateState({
    ...initialState(),
    ownedOutfits: ["newcomer", "practice"],
  });
  assert.deepEqual(legacy.savedLooks.raven, {});
  assert.ok(legacy.ownedOutfits.raven.includes("practice"));
});
test("試穿與篩選不進存檔，正式造型與常用造型可保存", () => {
  const game = shopper();
  game.wardrobePreview = "icon";
  saveLook(game, "daily");
  const saved = persistableState(game);
  assert.equal(saved.wardrobePreview, undefined);
  assert.equal(saved.wardrobeFilter, undefined);
  assert.equal(saved.outfitId, "newcomer");
  assert.equal(saved.savedLooks.raven.daily, "newcomer");
});
