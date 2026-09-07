import test from "node:test";
import assert from "node:assert/strict";
import {
  playerPublicName,
  playerRealName,
  playerStageName,
  syncLegacyPlayerName,
} from "../src/core/player-name.js";
import {
  initialState,
  hydrateState,
  resetState,
  state,
} from "../src/core/state.js";
import { migrateV15ToV16 } from "../src/core/migrations.js";
import { validateGameState } from "../src/core/save-schema.js";

import { socialApp } from "../src/views/social.js";

test("藝名留空時沿用本名，填寫後成為公開名稱", () => {
  const player = { name: "", realName: "林星予", stageName: "" };
  assert.equal(playerRealName(player), "林星予");
  assert.equal(playerStageName(player), "");
  assert.equal(playerPublicName(player), "林星予");
  player.stageName = "星予";
  assert.equal(syncLegacyPlayerName(player), "星予");
  assert.equal(player.name, "星予");
});

test("私人名稱使用本名，公開社群使用藝名", () => {
  resetState();
  state.realName = "林星予";
  state.stageName = "星予";
  syncLegacyPlayerName(state);
  state.prologueStep = 2;
  state.socialPosts = [{ id: "post", text: "第一篇貼文" }];
  assert.equal(playerRealName(state), "林星予");

  assert.match(socialApp(), /星予/);
});

test("v15 舊存檔把原姓名升級為本名並沿用為公開名", () => {
  const old = initialState();
  old.saveVersion = 15;
  old.name = "舊玩家";
  delete old.realName;
  delete old.stageName;
  const migrated = migrateV15ToV16(old);
  assert.equal(migrated.saveVersion, 16);
  assert.equal(migrated.realName, "舊玩家");
  assert.equal(migrated.stageName, "");
  assert.equal(migrated.name, "舊玩家");
  assert.equal(validateGameState(migrated).ok, true);
  hydrateState(old);
  assert.equal(state.realName, "舊玩家");
  assert.equal(state.stageName, "");
  assert.equal(state.name, "舊玩家");
});
