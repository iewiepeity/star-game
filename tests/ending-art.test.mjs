import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { endingArt } from "../src/data/season-art.js";
import { SCENE_ART } from "../src/data/story-art.js";
import { ENDING_ARCHETYPES } from "../src/logic/career.js";

test("19 種結局皆優先使用存在的專屬 CG", () => {
  assert.equal(ENDING_ARCHETYPES.length, 19);
  for (const { id, label } of ENDING_ARCHETYPES) {
    const expected = {
      src: id === "whole_life"
        ? "./assets/cg/milestone-five-year-integrated.webp"
        : `./assets/cg/milestone-ending-${id}.webp`,
      alt: id === "whole_life" ? "五年後的完整人生" : label,
      position: "center",
    };
    assert.deepEqual(endingArt({ endingId: id }), expected, id);
    assert.deepEqual(endingArt({ endingId: id, route: "國際演員", rank: "巨星" }), expected, `${id}: 優先於 route`);
    assert.ok(existsSync(new URL(`../${expected.src}`, import.meta.url)), expected.src);
  }
});

test("未提供或未知 endingId 保留所有舊關鍵字 fallback", () => {
  const cases = [
    [{ route: "國際演員", rank: "巨星" }, SCENE_ART.airport],
    [{ route: "電影演員" }, SCENE_ART.cinema],
    [{ route: "唱作歌手" }, SCENE_ART.recording],
    [{ route: "綜藝主持" }, SCENE_ART.radio],
    [{ rank: "巨星" }, SCENE_ART.awards],
    [{ title: "音樂人生" }, SCENE_ART.recording],
    [{}, SCENE_ART.room],
  ];
  for (const [result, expected] of cases) {
    for (const id of [undefined, "unknown_ending", "toString", "__proto__"]) {
      assert.deepEqual(endingArt({ ...result, endingId: id }), expected);
    }
  }
  assert.deepEqual(endingArt(), SCENE_ART.room);
  assert.deepEqual(endingArt(null), SCENE_ART.room);
});
