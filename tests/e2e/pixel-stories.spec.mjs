import { test, expect } from "@playwright/test";
import { initialPixelState } from "../../src/pixel/model.js";
import { recordMeeting } from "../../src/pixel/life.js";
import { NPC_LONGFORM_CHAPTERS } from "../../src/data/longform-content.js";
import { ROOMS } from "../../src/pixel/data.js";
import { hiddenRoomOpen } from "../../src/pixel/city-catalog.js";
import { initialLife, withCore } from "../../src/pixel/life.js";
import { queueHiddenRoute } from "../../src/logic/hidden-route.js";
test.use({ serviceWorkers: "block" });
const read = (p) => p.evaluate(() => window.__pixelRead?.());
async function start(page, event, amend = () => {}) {
  const s = initialPixelState();
  s.flags.intro = true;
  s.life.speed = 16;
  recordMeeting(s.life, "sufei");
  s.knownPeople = ["sufei"];
  s.life.game.activeEvent = { source: "人物主線", queuedWeek: 2, event };
  amend(s);
  await page.addInitScript((s) => {
    if (!localStorage.getItem("star-game-pixel-phase-one-v1"))
      localStorage.setItem(
        "star-game-pixel-phase-one-v1",
        JSON.stringify({ state: s }),
      );
  }, s);
  await page.goto("/pixel.html");
  await expect(page.locator("#loading")).toBeHidden();
}
const chapter = () => ({
  ...structuredClone(NPC_LONGFORM_CHAPTERS.sufei[1]),
  id: "npc-long:sufei:understudy",
  cast: ["sufei"],
  choices: NPC_LONGFORM_CHAPTERS.sufei[1].choices.map((c) => ({
    ...c,
    effect: { ...c.effect, npc: "sufei" },
    followUp: null,
  })),
});
async function through(page, selector) {
  for (let i = 0; i < 30; i++) {
    if (await page.locator(selector).first().isVisible()) return;
    const next = page
      .locator("#career-page-next, [data-stage-next], [data-stage-skip]")
      .first();
    if (await next.isVisible()) await next.click();
    else await page.waitForTimeout(150);
  }
  await expect(page.locator(selector).first()).toBeVisible({ timeout: 20000 });
}
async function observeMap(page, reselect = null) {
  // At 16× the route is visible for only 300 ms. Observe the rendered UI in
  // the page so a busy test runner cannot miss it after the click returns.
  await page.evaluate((reselect) => {
    window.__storyMapShown = false;
    const observer = new window.MutationObserver(() => {
      const map = document.querySelector(".city-map-viewport");
      if (map?.getBoundingClientRect().height > 0 &&
          getComputedStyle(map).visibility === "visible") {
        window.__storyMapShown = true;
        observer.disconnect();
        if (reselect)
          document.querySelector(`[data-map-place="${reselect}"]`).click();
      }
    });
    observer.observe(document.body, {
      subtree: true, childList: true, attributes: true,
      attributeFilter: ["hidden", "style", "class"],
    });
  }, reselect);
}
test("longform travels by map, stages the NPC, preserves every beat and settles once after reload", async ({
  page,
}, info) => {
  test.setTimeout(60000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await start(page, chapter());
  expect((await read(page)).scene).toBe("home");
  await observeMap(page, "rehearsal");
  await page.locator("[data-stage-start]").click();
  await expect.poll(() => page.evaluate(() => window.__storyMapShown)).toBe(true);
  await through(page, "[data-stage-next]");
  await expect.poll(async () => (await read(page)).story?.phase).toBe("beat");
  let s = await read(page);
  expect(s.scene).toBe("rehearsal");
  expect(s.story.cast).toEqual(["sufei"]);
  expect(s.npcs.find((n) => n.id === "sufei").status).toBe("故事現場");
  expect(s.playerCount).toBe(1);
  expect(s.state.life.game.eventHistory).toHaveLength(0);
  await page.screenshot({ path: info.outputPath("story-arrival.png") });
  await page.locator("[data-stage-next]").click();
  const beat = (await read(page)).state.life.storyStage.beat;
  await page.reload();
  await expect(page.locator("#loading")).toBeHidden();
  expect((await read(page)).state.life.storyStage.beat).toBe(beat);
  await through(page, "[data-stage-choice]");
  await page.screenshot({ path: info.outputPath("story-choice.png") });
  if (page.viewportSize().width < 650) {
    const box = await page.locator("#dialogue .conversation").boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(
      page.viewportSize().width + 1,
    );
  }
  await page.locator("[data-stage-choice]").first().click();
  await through(page, "[data-stage-done]");
  expect((await read(page)).state.life.game.eventHistory).toHaveLength(1);
  await page.locator("[data-stage-art]").click();
  await expect(page.locator(".story-illustration img")).toBeVisible();
  expect(
    await page
      .locator(".story-illustration img")
      .evaluate((e) => e.naturalWidth),
  ).toBeGreaterThan(500);
  await page.getByRole("button", { name: "回到這一幕", exact: true }).click();
  await page.reload();
  await through(page, "[data-stage-done]");
  expect((await read(page)).state.life.game.eventHistory).toHaveLength(1);
  await page.locator("[data-stage-done]").click();
  // The departure completes automatically; at 16× its optional skip button
  // can disappear before a remote click reaches it.
  await expect
    .poll(async () => (await read(page)).state.life.storyStage, {
      timeout: 20000,
    })
    .toBeNull();
  s = await read(page);
  expect(s.scene).toBe("home");
  expect(s.story).toBeNull();
  expect(s.state.life.day).toBe(0);
  expect(s.state.life.ledger).toHaveLength(0);
  expect(s.state.life.game.eventHistory).toHaveLength(1);
  expect(errors).toEqual([]);
});
const invitation = () => ({
  id: "invitation:sufei:26",
  cast: ["sufei"],
  title: "許映真・不是工作行程",
  text: "要不要一起在試鏡前喘一口氣？",
  beats: [
    { label: "新的訊息", text: "等你回覆。" },
    { label: "你抵達之後", text: "她把熱飲遞給你，終於肯說今天其實很怕。" },
  ],
  choices: [
    {
      id: "accept",
      label: "答應邀約",
      outcome: "這次相聚被記住了。",
      effect: { npc: "sufei", relation: 5 },
    },
    {
      id: "decline",
      label: "坦白婉拒",
      outcome: "你坦白說今天想獨處。",
      effect: { mood: 1 },
    },
  ],
});
test("declining an invitation never summons an absent NPC or travels", async ({
  page,
}) => {
  await start(page, invitation());
  const before = await read(page);
  await page.locator('[data-stage-reply="decline"]').click();
  await expect(page.locator("[data-story-done]")).toBeVisible();
  const after = await read(page);
  expect(after.scene).toBe(before.scene);
  expect(after.story).toBeNull();
  expect(after.state.life.game.eventHistory).toHaveLength(1);
  expect(after.npcs.map((n) => n.id)).toEqual(before.npcs.map((n) => n.id));
});
test("acceptance survives an interrupted trip and applies no reward before the meeting", async ({
  page,
}) => {
  test.setTimeout(60000);
  await start(page, invitation());
  // At 16× the map lasts only 300 ms. Interrupt from the rendered map itself
  // so runner latency cannot move this test past the trip it intends to reload.
  await page.evaluate(() => {
    const observer = new window.MutationObserver(() => {
      const map = document.querySelector(".city-map-viewport");
      if (!map?.getBoundingClientRect().height || getComputedStyle(map).visibility !== "visible") return;
      const state = window.__pixelRead().state;
      sessionStorage.setItem("interrupted-story-trip", JSON.stringify({
        phase: state.life.storyStage.phase,
        historyCount: state.life.game.eventHistory.length,
      }));
      observer.disconnect();
      location.reload();
    });
    observer.observe(document.body, { subtree: true, childList: true, attributes: true });
  });
  await Promise.all([
    page.waitForEvent("load"),
    page.locator('[data-stage-reply="accept"]').click(),
  ]);
  expect(await page.evaluate(() => JSON.parse(sessionStorage.getItem("interrupted-story-trip")))).toEqual({ phase: "travel", historyCount: 0 });
  await through(page, "[data-stage-resolve]");
  expect((await read(page)).scene).toBe("rehearsal");
  expect((await read(page)).state.life.game.eventHistory).toHaveLength(0);
  await page.locator("[data-stage-resolve]").click();
  await through(page, "[data-stage-done]");
  expect((await read(page)).state.life.game.eventHistory).toHaveLength(1);
});
test("ensemble shows all three cast members and changes the speaker without duplicating the player", async ({
  page,
}, info) => {
  test.setTimeout(60000);
  const cast = ["sufei", "jiqing", "shenyao"];
  await start(
    page,
    {
      id: "ensemble:sufei:jiqing:shenyao:52",
      cast,
      title: "一起決定的企劃",
      text: "三個人留下來討論。",
      beats: cast.map((id, i) => ({
        label: `第 ${i + 1} 個立場`,
        text: "把工作裡的分歧說清楚。",
        speaker: id,
      })),
      choices: [
        {
          id: "mediate",
          label: "讓每個人說完",
          outcome: "你們找到可以一起前進的方向。",
          effect: { mood: 1 },
        },
      ],
    },
    (s) => {
      s.sceneId = "media_company";
      s.position = { ...ROOMS.media_company.entry };
    },
  );
  await page.locator("[data-stage-start]").click();
  await through(page, "[data-stage-next]");
  const s = await read(page);
  expect(s.story.cast).toEqual(cast);
  expect(s.playerCount).toBe(1);
  for (const id of cast) expect(s.npcs.some((n) => n.id === id)).toBe(true);
  await page.locator("[data-stage-next]").click();
  expect((await read(page)).story.speaker).toBe("jiqing");
  await page.screenshot({ path: info.outputPath("ensemble.png") });
  expect((await read(page)).state.life.game.knownPeople).toEqual(["sufei"]);
});
test("a failed scene download offers retry and cannot award an unfinished invitation", async ({
  page,
}) => {
  test.setTimeout(60000);
  await start(page, invitation());
  const asset = "**/" + ROOMS.rehearsal.asset.replace(/^\.\//, "");
  await page.route(asset, (route) => route.abort());
  await page.locator('[data-stage-reply="accept"]').click();
  await expect(page.locator("[data-stage-retry]")).toBeVisible({
    timeout: 20000,
  });
  expect((await read(page)).scene).toBe("home");
  expect((await read(page)).state.life.game.eventHistory).toHaveLength(0);
  await page.unroute(asset);
  await page.locator("[data-stage-retry]").click();
  await through(page, "[data-stage-resolve]");
  expect((await read(page)).story.cast).toEqual(["sufei"]);
  expect((await read(page)).state.life.game.eventHistory).toHaveLength(0);
});
test("an authored private-room invitation works before public access and returns without unlocking that room", async ({
  page,
}) => {
  test.setTimeout(60000);
  await start(page, {
    id: "npc-arc-xiayutong-cut-scene",
    npcId: "xiayutong",
    title: "最喜歡卻必須剪掉的畫面",
    text: "她把剪輯室鑰匙放到你手上。",
    choices: [
      {
        id: "story",
        label: "讓整體故事先活下來",
        outcome: "你們一起確認了版本。",
        effect: { npc: "xiayutong", trust: 5 },
      },
    ],
  });
  await page.locator("[data-stage-start]").click();
  await through(page, "[data-stage-choice]");
  expect((await read(page)).scene).toBe("editing_room");
  await page.locator("[data-stage-choice]").click();
  await through(page, "[data-stage-done]");
  await page.locator("[data-stage-done]").click();
  await through(page, "[data-stage-skip]");
  await page.locator("[data-stage-skip]").click();
  await expect
    .poll(async () => (await read(page)).state.life.storyStage, {
      timeout: 20000,
    })
    .toBeNull();
  expect((await read(page)).scene).toBe("home");
  expect(hiddenRoomOpen((await read(page)).state)).toBe(false);
});
test("saving during the entrance and using the pause menu resumes a single cast", async ({
  page,
}) => {
  test.setTimeout(60000);
  await start(page, chapter(), (s) => {
    s.life.speed = 1;
  });
  await page.locator("[data-stage-start]").click();
  await expect(page.locator("[data-stage-skip]")).toBeVisible({
    timeout: 25000,
  });
  await page.locator('#dialogue [data-ui="saves"]').click();
  await page.locator('#panel [data-ui="close"]').last().click();
  await page.reload();
  await through(page, "[data-stage-next]");
  expect((await read(page)).npcs.filter((n) => n.id === "sufei")).toHaveLength(
    1,
  );
  await page.locator("[data-stage-next]").focus();
  await page.keyboard.press("Escape");
  await expect(page.locator('#panel[data-view="story-menu"]')).toBeVisible();
  await page
    .getByRole("button", { name: "繼續故事 回到剛才的這一幕 →" })
    .click();
  await through(page, "[data-stage-next]");
  expect((await read(page)).state.life.game.eventHistory).toHaveLength(0);
});
test("the second-run encounter brings the hidden NPC on screen before becoming a contact", async ({
  page,
}) => {
  test.setTimeout(60000);
  const l = initialLife("hidden-encounter");
  Object.assign(l.game, {
    runCount: 2,
    week: 20,
    familiarNpcs: ["jiqing", "sufei", "shenyao"],
  });
  withCore(l, queueHiddenRoute);
  l.game.activeEvent = l.game.eventQueue.shift();
  l.speed = 16;
  await start(page, l.game.activeEvent.event, (s) => {
    s.life = l;
    s.knownPeople = [];
  });
  expect((await read(page)).state.life.game.knownPeople).not.toContain(
    "silver_pc",
  );
  await page.locator("[data-stage-start]").click();
  await through(page, "[data-stage-choice]");
  const arrived = await read(page);
  expect(arrived.scene).toBe("cinema");
  expect(arrived.story.cast).toEqual(["silver_pc"]);
  expect(arrived.state.life.game.knownPeople).not.toContain("silver_pc");
  await page.locator('[data-stage-choice="stay"]').click();
  await through(page, "[data-stage-done]");
  expect((await read(page)).state.life.game.knownPeople).toContain("silver_pc");
  await page.reload();
  await through(page, "[data-stage-done]");
  expect((await read(page)).state.life.game.eventHistory).toHaveLength(1);
});
