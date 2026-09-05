import { test } from "node:test";
import assert from "node:assert/strict";
import { initialPixelState, validatePixelState } from "../src/pixel/model.js";
import {
  lockIdentity,
  selectAvatar,
  changeGenderAtClinic,
  GENDER_CHANGE_COST,
} from "../src/pixel/identity.js";
import {
  pixelPreferences,
  PIXEL_PREFERENCES_KEY,
} from "../src/pixel/preferences.js";
test("creation chooses a gender, then only matching appearances remain available", () => {
  const s = initialPixelState();
  assert.equal(selectAvatar(s, "noir"), "");
  lockIdentity(s);
  assert.equal(s.identity.gender, "男性");
  assert.match(selectAvatar(s, "raven"), /性別/);
  assert.equal(s.avatarId, "noir");
  assert.equal(selectAvatar(s, "sage"), "");
  assert.equal(validatePixelState(s).life.game.gender, "男性");
});
test("phase-five saves keep the avatar actually worn when identity lock is introduced", () => {
  const s = initialPixelState();
  delete s.identity;
  s.flags.intro = true;
  s.avatarId = "noir";
  s.life.game.gender = "男性";
  const copy = validatePixelState(s);
  assert.equal(copy.avatarId, "noir");
  assert.equal(copy.identity.locked, true);
  assert.equal(copy.identity.gender, "男性");
  assert.match(selectAvatar(copy, "sunny"), /性別/);
});
test("a locked save cannot change gender just by replacing its portrait id", () => {
  const s = initialPixelState();
  lockIdentity(s);
  s.avatarId = "noir";
  const loaded = validatePixelState(s);
  assert.equal(loaded.avatarId, "raven");
  assert.equal(loaded.life.game.gender, "女性");
});
test("clinic change checks place, funds and pending actions, charges once, and keeps both wardrobes", () => {
  const s = initialPixelState();
  lockIdentity(s);
  s.life.game.money = 100000;
  s.life.game.ownedOutfits.raven.push("practice");
  s.outfitId = "practice";
  assert.equal(changeGenderAtClinic(s, "noir").ok, false);
  s.sceneId = "clinic";
  s.life.pending = { phase: "performing" };
  assert.equal(changeGenderAtClinic(s, "noir").ok, false);
  s.life.pending = null;
  s.life.game.money = GENDER_CHANGE_COST - 1;
  assert.equal(changeGenderAtClinic(s, "noir").ok, false);
  s.life.game.money = 100000;
  assert.equal(changeGenderAtClinic(s, "noir").ok, true);
  assert.equal(s.life.game.money, 40000);
  assert.equal(s.avatarId, "noir");
  assert.equal(s.outfitId, "newcomer");
  assert.equal(s.identity.gender, "男性");
  assert.equal(s.life.game.gender, "男性");
  assert.equal(s.life.day, 0);
  assert.ok(s.life.game.ownedOutfits.raven.includes("practice"));
  assert.equal(changeGenderAtClinic(s, "noir").ok, false);
  assert.equal(s.life.game.money, 40000);
  const loaded = validatePixelState(s);
  assert.equal(loaded.avatarId, "noir");
  assert.equal(loaded.identity.changes.length, 1);
});
test("theme preferences are isolated from game saves and tolerate unavailable storage", () => {
  const data = new Map([
    ["star-game-preferences", "original"],
    ["star-game-pixel-phase-one-v1", "saved-game"],
  ]);
  const storage = {
    getItem: (k) => data.get(k),
    setItem: (k, v) => data.set(k, v),
  };
  const p = pixelPreferences(storage);
  assert.equal(p.get().theme, "cream");
  assert.equal(p.setTheme("night").saved, true);
  assert.equal(pixelPreferences(storage).get().theme, "night");
  assert.equal(data.get("star-game-preferences"), "original");
  assert.equal(data.get("star-game-pixel-phase-one-v1"), "saved-game");
  assert.ok(data.has(PIXEL_PREFERENCES_KEY));
  assert.equal(p.setTheme("unknown").theme, "cream");
  assert.equal(pixelPreferences(null).setTheme("sage").saved, false);
});
