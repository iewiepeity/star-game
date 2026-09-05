import test from "node:test";
import assert from "node:assert/strict";
import { resetState, state } from "../src/core/state.js";
import { setSeed } from "../src/core/rng.js";
import { creatorUnlocked, resolveCreatorContent, qualityGrade, rarityFor } from "../src/logic/creator.js";
import { creatorApp } from "../src/views/creator.js";

function fresh(run = 1) {
  resetState();
  state.runCount = run;
  state.name = "測試新人";
  state.stats = { 口才: 700, 幽默: 700, 學識: 600, 臨場反應: 650, 歌藝: 600, 音感: 600, 演技: 600 };
  setSeed(24680);
}

test("創作者中心嚴格限制為第二周目起解鎖", () => {
  fresh(1);
  assert.equal(creatorUnlocked(), false);
  assert.match(creatorApp(), /第二輪人生尚未開始/);
  const result = resolveCreatorContent({ format: "short", topic: "daily", investment: "basic" });
  assert.equal(result.ok, false);
  assert.equal(state.creatorVideos.length, 0);
});

test("第二周目影片具有品質、等級、稀有度與頻道成果", () => {
  fresh(2);
  const result = resolveCreatorContent({ format: "skit", topic: "challenge", investment: "premium" });
  assert.equal(result.ok, true);
  assert.equal(state.creatorVideos.length, 1);
  assert.ok(result.video.quality >= 20 && result.video.quality <= 100);
  assert.ok(["S", "A", "B", "C", "D"].includes(result.video.grade));
  assert.ok(["legendary", "epic", "rare", "uncommon", "common"].includes(result.video.rarity));
  assert.ok(result.video.views > 0);
  assert.ok(state.creatorProfile.followers > 24);
});

test("品質與稀有度門檻穩定且可測試", () => {
  assert.equal(qualityGrade(95).id, "S");
  assert.equal(qualityGrade(75).id, "B");
  assert.equal(rarityFor(76).id, "rare");
  assert.equal(rarityFor(84, true).id, "legendary");
});
