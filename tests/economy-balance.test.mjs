import test from "node:test";
import assert from "node:assert/strict";
import { ACTIONS } from "../src/data/actions.js";
import { initialState } from "../src/core/state.js";
import {
  effectiveActionCost,
  newcomerSubsidyActive,
  reliefGigAvailable,
} from "../src/logic/economy.js";

test("前八週訓練費七折，第九週恢復原價", () => {
  assert.equal(effectiveActionCost(ACTIONS.vocal, 1), 560);
  assert.equal(effectiveActionCost(ACTIONS.dance, 8), 700);
  assert.equal(effectiveActionCost(ACTIONS.vocal, 9), 800);
  assert.equal(newcomerSubsidyActive(8), true);
  assert.equal(newcomerSubsidyActive(9), false);
});

test("街頭演出與新人零工都有真實收入設定", () => {
  assert.deepEqual(ACTIONS.street.income, [400, 700]);
  assert.deepEqual(ACTIONS.street.successIncome, [600, 900]);
  assert.deepEqual(ACTIONS.newcomer_gig.income, [1200, 2000]);
  assert.equal(ACTIONS.newcomer_gig.guaranteed, true);
});

test("救急短工只在低資金且尚未使用時開放", () => {
  const game = initialState();
  game.money = 1499;
  assert.equal(reliefGigAvailable(game), true);
  game.flags.push({ label: "新人緊急周轉" });
  assert.equal(reliefGigAvailable(game), false);
  game.flags = [];
  game.money = 1500;
  assert.equal(reliefGigAvailable(game), false);
});
