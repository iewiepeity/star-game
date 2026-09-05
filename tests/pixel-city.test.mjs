import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import {
  ROOMS,
  PEOPLE,
  ACTIVITY_SPOTS,
  activityAllowed,
  itinerary,
} from "../src/pixel/data.js";
import {
  CITY_PLACES,
  AGENCY_ROOMS,
  hiddenRoomOpen,
  publicRoom,
} from "../src/pixel/city-catalog.js";
import { expandedAssets, expandedMeta } from "../src/pixel/expanded-sprites.js";
import { MAP_LOCATIONS } from "../src/data/map-locations.js";
import { AVATARS, OUTFITS, portraitAsset } from "../src/data/wardrobe.js";
import { TRAINING_VENUES } from "../src/logic/city-progression.js";
import { COMPANY_PART_TIME } from "../src/data/part-time.js";
import {
  initialLife,
  arriveAt,
  access,
  beginDay,
  settleDay,
  costOf,
  CHOICES,
} from "../src/pixel/life.js";
import { initialPixelState, validatePixelState } from "../src/pixel/model.js";
const manifest = JSON.parse(
  readFileSync(new URL("../assets/pixel/atlas-manifest.json", import.meta.url)),
);
const file = (p) => new URL("../" + p.replace(/^\.\//, ""), import.meta.url);
test("27 public map landmarks cover home and all 26 original locations; 32 spaces have valid entrances and source art", () => {
  assert.equal(CITY_PLACES.length, 27);
  assert.equal(new Set(CITY_PLACES.map((p) => p.id)).size, 27);
  assert.deepEqual(
    CITY_PLACES.map((p) => p.venue)
      .filter((id) => id !== "home")
      .sort(),
    Object.keys(MAP_LOCATIONS).sort(),
  );
  assert.equal(Object.keys(ROOMS).length, 32);
  for (const [id, r] of Object.entries(ROOMS)) {
    assert.ok(existsSync(file(r.asset)), r.asset);
    assert.ok(r.objects.some((o) => o.id === "door"));
    assert.ok(
      CITY_PLACES.some((p) => p.id === publicRoom(id)),
      id,
    );
    for (const [object, _spot] of Object.entries(ACTIVITY_SPOTS[id]))
      assert.ok(
        r.objects.some((o) => o.id === object),
        id + object,
      );
  }
  assert.equal(AGENCY_ROOMS.length, 4);
  assert.equal(hiddenRoomOpen(initialPixelState()), false);
  assert.equal(
    hiddenRoomOpen({ ...initialPixelState(), knownPeople: ["silver_pc"] }),
    true,
  );
});
test("every scheduled activity reaches an actual compatible scene object", () => {
  for (const [id, a] of Object.entries(CHOICES).filter(
    ([id]) => !id.startsWith("career_"),
  ))
    assert.ok(activityAllowed(a.room, a.item, a.pose), id);
});
for (const avatar of Object.keys(AVATARS))
  test(
    avatar +
      ": all 15 wardrobes have matching walk, seat, rest, read frames and original illustration",
    () => {
      for (const outfit of Object.keys(OUTFITS)) {
        const key = avatar + "-" + outfit,
          meta = expandedMeta(key);
        assert.ok(existsSync(file(portraitAsset(avatar, outfit))), key);
        if (!meta) {
          for (const suffix of ["", "-actions", "-seated"])
            assert.ok(
              existsSync(file("assets/pixel/" + key + suffix + ".png")),
            );
          continue;
        }
        for (const a of expandedAssets(key))
          assert.ok(existsSync(file(a.url)), a.url);
        for (const movement of ["idle", "walk"])
          for (let dir = 0; dir < 4; dir++)
            assert.ok(
              manifest.frames[meta.sheet][
                meta.row + "-" + movement + "-" + dir
              ],
              key,
            );
        for (const pose of ["seat-front", "seat-back", "rest", "read"])
          assert.ok(
            manifest.frames[meta.poseSheet][meta.row + "-" + pose],
            key,
          );
        const s = initialPixelState();
        s.avatarId = avatar;
        s.outfitId = outfit;
        s.life.game.ownedOutfits[avatar].push(outfit);
        const restored = validatePixelState(s);
        assert.equal(restored.avatarId, avatar);
        assert.equal(restored.life.game.outfitId, outfit);
      }
    },
  );
for (const [id, venue] of Object.entries(TRAINING_VENUES))
  test(
    id + ": a first-week class can include its first visit and settles once",
    () => {
      const l = initialLife("class-" + id),
        a = { id };
      assert.equal(access(l, a), "");
      const money = l.game.money;
      arriveAt(l, CHOICES[id].room);
      assert.equal(l.game.money, money);
      assert.equal(l.day, 0);
      assert.ok(l.game.visitedLocationsByWeek[1].includes(venue));
      beginDay(l, a);
      settleDay(l);
      assert.equal(l.game.trainingSessionsCompleted, 1);
      const snapshot = structuredClone(l.game);
      settleDay(l);
      assert.deepEqual(l.game, snapshot);
    },
  );
for (const id of Object.keys(COMPANY_PART_TIME))
  test(
    id +
      ": direct entry opens paid support work and records company experience",
    () => {
      const l = initialLife(id);
      arriveAt(l, CHOICES[id].room);
      beginDay(l, { id });
      settleDay(l);
      assert.equal(l.game.partTimeShifts[id], 1);
      assert.ok(l.game.money > 18000);
      assert.equal(l.day, 0);
    },
  );
test("exploration keeps recovery, venue extras and affordability while arrival itself stays free", () => {
  const park = initialLife("park");
  park.game.fatigue = 40;
  park.game.mood = 30;
  arriveAt(park, "park");
  assert.equal(park.game.fatigue, 40);
  beginDay(park, { id: "explore_park" });
  settleDay(park);
  assert.equal(park.game.fatigue, 34);
  assert.equal(park.game.mood, 36);
  const l = initialLife("meal");
  const cost = costOf(l, { id: "explore_restaurant" });
  assert.equal(cost, 900);
  l.game.money = 899;
  assert.ok(access(l, { id: "explore_restaurant" }));
  l.game.money = 1000;
  beginDay(l, { id: "explore_restaurant" });
  settleDay(l);
  assert.equal(l.game.money, 100);
});
test("11 NPC identities remain unique; schedules are stable and hidden/working NPCs do not leak into leisure", () => {
  assert.equal(Object.keys(PEOPLE).length, 11);
  const state = initialPixelState();
  for (let t = 0; t < 500; t += 7) {
    assert.equal(itinerary("silver_pc", t, state).scene, null);
    for (const id of Object.keys(PEOPLE)) {
      const a = itinerary(id, t, state);
      assert.deepEqual(a, itinerary(id, t, structuredClone(state)));
      assert.ok(a.scene === null || ROOMS[a.scene]);
    }
  }
  state.life.game.npcSchedules.jiqing = [
    { week: 1, day: 0, status: "reserved", location: "radio", label: "錄製中" },
  ];
  for (const t of [1, 78, 145, 235]) {
    const p = itinerary("jiqing", t, state);
    assert.equal(p.scene, "radio");
    assert.equal(p.busy, true);
  }
  state.life.game.npcSchedules.jiqing[0] = {
    week: 1,
    day: 0,
    status: "reserved",
    external: true,
  };
  assert.equal(itinerary("jiqing", 10, state).scene, null);
});
