import { test, expect } from "@playwright/test";
import { initialPixelState } from "../../src/pixel/model.js";
import { recordMeeting } from "../../src/pixel/life.js";
const read = (p) => p.evaluate(() => window.__pixelRead?.());
async function start(page, fn = () => {}) {
  const s = initialPixelState();
  s.flags.intro = true;
  s.life.speed = 16;
  recordMeeting(s.life, "sufei");
  fn(s);
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
async function apps(page) {
  await page.locator('[data-ui="menu"]').first().click();
  await page.locator('#panel [data-ui="phone"]').click();
}
test("all information apps open within the pixel world and fit the viewport", async ({
  page,
}, info) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await start(page);
  await apps(page);
  for (const id of [
    "people",
    "creative",
    "stats",
    "world",
    "log",
    "timeline",
    "gallery",
    "achievements",
    "social",
    "forum",
    "jobs",
    "agency",
    "wardrobe",
  ]) {
    await page.locator(`[data-pixel-app="${id}"]`).last().click();
    await expect(page.locator(`.pixel-app[data-app="${id}"]`)).toBeVisible();
    expect(
      await page
        .locator("#panel")
        .evaluate((e) => e.scrollWidth <= e.clientWidth + 2),
      id + " overflow",
    ).toBe(true);
    await page.screenshot({ path: info.outputPath(id + ".png") });
    await page.locator('[data-pixel-app="phone"]').click();
  }
  expect(errors).toEqual([]);
});
test("chat at the cafe performs, settles once, and has full-width mobile choices", async ({
  page,
}, info) => {
  test.setTimeout(60000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await start(page, (s) => {
    s.knownPeople = ["sufei"];
  });
  await apps(page);
  await page.locator('[data-pixel-app="people"]').last().click();
  await page.locator('[data-select-npc="sufei"]').first().click();
  await page.locator('[data-npc-interact="chat"]').click();
  await page.locator('[data-book-day="0"]').click();
  await page.locator('#panel [data-life="today"]').click();
  await page.locator("[data-start]").click();
  await expect(page.locator("[data-career-decision]").first()).toBeVisible({
    timeout: 25000,
  });
  const state = await read(page);
  expect(state.scene).toBe("cafe");
  expect(state.npcs.some((n) => n.id === "sufei")).toBe(true);
  if (page.viewportSize().width < 700) {
    const choices = await page.locator("#dialogue .choices").boundingBox(),
      button = await page
        .locator("[data-career-decision]")
        .first()
        .boundingBox();
    expect(button.width).toBeGreaterThan(choices.width * 0.95);
  }
  await page.screenshot({ path: info.outputPath("chat-choice.png") });
  await page.locator("[data-career-decision]").first().click();
  await expect(page.locator('#dialogue [data-life="advance"]')).toBeVisible({
    timeout: 15000,
  });
  const after = await read(page);
  expect(after.state.life.ledger).toHaveLength(1);
  expect(
    Object.values(after.state.life.game.scheduledActivities)[0].status,
  ).toBe("completed");
  await page.reload();
  await expect(page.locator('#dialogue [data-life="advance"]')).toBeVisible();
  expect((await read(page)).state.life.ledger).toHaveLength(1);
  expect(errors).toEqual([]);
});
test("social likes, replies, formal publishing and forum reactions work in the new apps", async ({
  page,
}) => {
  test.setTimeout(60000);
  await start(page);
  await apps(page);
  await page.locator('[data-pixel-app="social"]').last().click();
  await page.locator('[data-social-like="npc-sufei"]').click();
  expect((await read(page)).state.life.game.likedSocialPosts).toContain(
    "npc-sufei",
  );
  await page.locator('[data-social-reply="sufei"]').first().click();
  expect(
    (await read(page)).state.life.game.socialReplies["1:sufei"],
  ).toBeTruthy();
  await page.locator(".social-compose summary").click();
  await page.locator('[data-social-post="daily"]').click();
  await page.locator('[data-book-day="0"]').click();
  await page.locator('#panel [data-life="today"]').click();
  await page.locator("[data-start]").click();
  await expect
    .poll(async () => (await read(page)).state.life.ledger.length, {
      timeout: 20000,
    })
    .toBe(1);
  expect((await read(page)).state.life.game.socialPosts).toHaveLength(1);
  await page.locator('[data-life="advance"]').click();
  // Daily events may interrupt; a save still contains the completed formal post.
  await page.reload();
  await expect(page.locator("#loading")).toBeHidden();
  expect((await read(page)).state.life.game.socialPosts).toHaveLength(1);
});
test("export, import preview, rollback backup and real new-character prologue", async ({
  page,
}) => {
  await start(page);
  await apps(page);
  await page.locator('[data-pixel-app="save"]').click();
  const download = page.waitForEvent("download");
  await page.locator('[data-storage="export"]').click();
  const file = await download;
  const path = await file.path();
  await page.locator("#pixel-import-file").setInputFiles(path);
  await expect(page.locator('[data-storage="confirm"]')).toBeVisible();
  await page.locator('[data-storage="confirm"]').click();
  await expect.poll(async () => (await read(page)).panel).toBe("");
  await apps(page);
  await page.locator('[data-pixel-app="settings"]').last().click();
  await page.locator(".new-journey summary").click();
  await page.locator('[data-storage="new"]').click();
  await page.locator('[data-storage="confirm"]').click();
  await expect(page.locator('[data-create-field="realName"]')).toBeVisible();
  await page.locator('[data-create-field="realName"]').fill("新名字");
  await page.locator('[data-create-field="stageName"]').fill("小星");
  await page.locator('[data-ui="begin"]').click();
  await expect(page.locator('[data-onboarding="next"]')).toBeVisible();
  await page.locator('[data-onboarding="skip"]').click();
  expect((await read(page)).state.playerName).toBe("小星");
  expect((await read(page)).state.life.game.prologueCompleted).toBe(true);
  expect((await read(page)).state.identity.locked).toBe(true);
});
test("forum threads, collectible looks and the full production controls are usable", async ({
  page,
}) => {
  await start(page, (s) => {
    s.life.game.ownedOutfits.raven.push("practice");
  });
  await apps(page);
  await page.locator('[data-pixel-app="forum"]').last().click();
  await page.locator("[data-forum-thread]").first().click();
  const text = await page.locator(".pixel-app").innerText();
  expect(text.length).toBeGreaterThan(100);
  await page.locator('[data-forum-react="reason"]').click();
  await page.locator("[data-forum-back]").click();
  await page.locator('[data-pixel-app="phone"]').click();
  await page.locator('[data-pixel-app="wardrobe"]').last().click();
  await page.locator('[data-fitting="practice"]').click();
  expect((await read(page)).state.outfitId).toBe("newcomer");
  await page.locator('[data-outfit="practice"]').click();
  await page.locator('[data-save-look="work"]').click();
  expect((await read(page)).state.life.game.savedLooks.raven.work).toBe(
    "practice",
  );
  await page.locator('[data-pixel-app="phone"]').click();
  await page.locator('[data-pixel-app="creative"]').last().click();
  await page.locator("#creative-title").fill("這座城市的歌");
  await page.locator('[data-creative-new="song"]').click();
  expect((await read(page)).state.life.game.creativeProjects[0].title).toBe(
    "這座城市的歌",
  );
  await expect(page.locator("[data-creative-direction]").first()).toBeVisible();
  await page.locator("[data-creative-work]").click();
  await expect(page.locator('[data-book-day="0"]')).toBeEnabled();
});
test("the complete offline pack reloads and enters an unvisited room without a network", async ({
  page,
  context,
}, info) => {
  test.skip(
    info.project.name !== "desktop",
    "One offline cache lifecycle per release",
  );
  test.setTimeout(120000);
  await start(page);
  await apps(page);
  await page.locator('[data-pixel-app="settings"]').last().click();
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await page.locator('[data-offline="download"]').click();
  await page.locator('[data-offline="confirm-download"]').click();
  await expect(page.locator("#offline-status")).toHaveText(
    "完整離線內容已準備好，可以離線遊玩。",
    { timeout: 90000 },
  );
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator("#loading")).toBeHidden();
  await apps(page);
  await page.locator('[data-pixel-app="map"]').last().click();
  await page.locator('[data-map-place="livehouse"]').click();
  await page.locator('[data-map-enter="livehouse"]').click();
  await expect
    .poll(async () => (await read(page))?.scene, { timeout: 20000 })
    .toBe("livehouse");
  await expect(page.locator("#loading")).toBeHidden();
  await context.setOffline(false);
});

test("handbook search, categories and six custom shortcuts survive reload", async ({
  page,
}, info) => {
  await start(page);
  await apps(page);
  await page.locator("[data-pocket-query]").fill("論壇");
  await expect(page.locator(".pixel-app-library button")).toHaveCount(1);
  await expect(page.locator(".pixel-app-library")).toContainText("星聞論壇");
  await page.locator("[data-pocket-query]").fill("");
  await page.locator('[data-pocket-category="事業"]').click();
  await expect(page.locator(".pixel-app-library button")).toHaveCount(4);
  await page.locator('[data-pocket-category="全部"]').click();
  await page.locator('[data-pocket-dock="edit"]').click();
  await page.locator('[data-pocket-dock-item="timeline"]').click();
  await page.locator('[data-pocket-dock-item="social"]').click();
  await page.locator('[data-pocket-dock="save"]').click();
  await expect(page.locator(".pocket-dock button")).toHaveCount(6);
  await expect(
    page.locator('.pocket-dock [data-pocket-open="social"]'),
  ).toBeVisible();
  await page.reload();
  await expect(page.locator("#loading")).toBeHidden();
  await apps(page);
  await expect(
    page.locator('.pocket-dock [data-pocket-open="social"]'),
  ).toBeVisible();
  await page.screenshot({ path: info.outputPath("handbook.png") });
  await page.locator('.pocket-dock [data-pocket-open="social"]').click();
  await expect(page.locator('.pixel-app[data-app="social"]')).toBeVisible();
  await page.locator('[data-pixel-app="phone"]').click();
  await page.locator('[data-pixel-app="settings"]').click();
  await page.locator(".new-journey summary").click();
  await page.locator('[data-storage="retire"]').click();
  expect((await read(page)).state.life.game.endingResult).toBeNull();
  await page.locator('[data-storage="retire-confirm"]').click();
  await expect(page.locator("#panel")).toHaveAttribute(
    "data-view",
    "career-ending",
  );
  expect((await read(page)).state.life.game.endingResult).toBeTruthy();
  await page.reload();
  await expect(page.locator("#loading")).toBeHidden();
  expect((await read(page)).state.life.game.endingResult).toBeTruthy();
});

test("integrity: old relationship result shows the remembered NPC without spawning them in the theatre", async ({
  page,
}, info) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await start(page, (s) => {
    s.sceneId = "theatre";
    s.position = { x: 770, y: 435 };
    s.life.game.week = 4;
    s.life.game.eventOutcome = {
      id: "npc-story-sufei:stage:acquaintance",
      week: 4,
      kind: "人物事件",
      title: "許映真｜關係開始有了名字",
      outcome: "你和許映真的距離又近了一些。",
      effects: ["心情＋1"],
      choice: "steady",
    };
  });
  await expect(page.locator(".story-context")).toContainText("關係回顧");
  await expect(page.locator(".story-context")).toContainText("手帳裡的許映真");
  await expect(page.locator("#dialogue .dialogue-portrait img")).toBeVisible();
  await expect(page.locator("#dialogue .story-art")).toHaveCount(0);
  const before = await read(page);
  expect(before.npcs.some((n) => n.id === "sufei")).toBe(false);
  const known = before.state.life.game.knownPeople;
  await page.reload();
  await expect(page.locator(".story-context")).toContainText("關係回顧");
  await expect(page.locator("#dialogue .dialogue-portrait img")).toBeVisible();
  expect(
    await page
      .locator("#dialogue .speech")
      .evaluate((e) => e.scrollWidth <= e.clientWidth + 2),
  ).toBe(true);
  await page.screenshot({ path: info.outputPath("relationship-recap.png") });
  await page.locator("[data-story-done]").click();
  expect((await read(page)).state.life.game.knownPeople).toEqual(known);
  expect((await read(page)).state.life.game.eventOutcome).toBeNull();
  expect(errors).toEqual([]);
});

test("integrity: neutral story choice preserves the portrait and context after reload", async ({
  page,
}) => {
  await start(page, (s) => {
    s.life.game.activeEvent = {
      source: "人物關係",
      queuedWeek: 2,
      event: {
        id: "npc-story-sufei:stage:acquaintance",
        title: "許映真｜關係開始有了名字",
        text: "最近幾次碰面後，彼此漸漸熟悉。",
        kind: "人物事件",
        choices: [
          {
            id: "steady",
            label: "照現在的步調就好",
            effect: { mood: 1 },
            outcome: "你沒有刻意加速這段關係。",
          },
        ],
      },
    };
  });
  await expect(page.locator(".story-context")).toContainText("人物故事");
  await expect(page.locator("#dialogue .dialogue-portrait img")).toBeVisible();
  await page.locator('[data-story-choice="steady"]').click();
  await expect(page.locator(".story-context")).toContainText("第 2 週收錄");
  await expect(page.locator("#dialogue .dialogue-portrait img")).toBeVisible();
  const history = (await read(page)).state.life.game.eventHistory;
  await page.reload();
  await expect(page.locator(".story-context")).toContainText("關係回顧");
  await expect(page.locator("#dialogue .dialogue-portrait img")).toBeVisible();
  expect((await read(page)).state.life.game.eventHistory).toEqual(history);
});

test("integrity: weekly strategy controls save all three choices and fit narrow screens", async ({
  page,
}, info) => {
  await start(page);
  await page.locator('[data-ui="menu"]').first().click();
  await page.locator('#panel [data-ui="schedule"]').click();
  for (const focus of ["people", "fame", "growth"]) {
    await page.locator(`[data-weekly-focus="${focus}"]`).click();
    await expect(
      page.locator(`[data-weekly-focus="${focus}"]`),
    ).toHaveAttribute("aria-pressed", "true");
    expect((await read(page)).state.life.game.focus).toBe(focus);
  }
  await page.locator('[data-weekly-focus="people"]').click();
  expect(
    await page
      .locator("#panel")
      .evaluate((e) => e.scrollWidth <= e.clientWidth + 2),
  ).toBe(true);
  await page.screenshot({ path: info.outputPath("weekly-focus.png") });
  await page.reload();
  await expect(page.locator("#loading")).toBeHidden();
  expect((await read(page)).state.life.game.focus).toBe("people");
});

test("integrity: ending offers optional familiar-face inheritance without phantom contacts", async ({
  page,
}, info) => {
  await start(page);
  await page.locator('[data-ui="menu"]').first().click();
  await page.locator('#panel [data-ui="settings"]').click();
  await page.locator(".new-journey summary").click();
  await page.locator('[data-storage="retire"]').click();
  await page.locator('[data-storage="retire-confirm"]').click();
  await page.locator('[data-storage="new"]').click();
  await expect(page.locator('[data-run-inherit="no"]')).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.locator('[data-run-inherit="yes"]').click();
  await expect(page.locator('[data-run-inherit="yes"]')).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.screenshot({ path: info.outputPath("inheritance.png") });
  await page.locator('[data-storage="confirm"]').click();
  await expect(page.locator('[data-ui="begin"]')).toBeVisible();
  const g = (await read(page)).state.life.game;
  expect(g.familiarNpcs).toEqual(["sufei"]);
  expect(g.knownPeople).toEqual([]);
  expect(g.money).toBe(18000);
  expect(g.runCount).toBe(2);
});

test("integrity: greeting a saved known NPC does not announce a new acquaintance", async ({
  page,
}) => {
  await start(page, (s) => {
    s.sceneId = "rehearsal";
    s.dialogue = {
      npcId: "sufei",
      index: 2,
      reply: "又見面了，今天過得怎麼樣？",
    };
  });
  await expect(page.locator("#dialogue-name")).toHaveText("許映真");
  await page.locator('#dialogue [data-ui="next-dialogue"]').click();
  await expect(page.locator("#toast")).toHaveText("聊完近況，下次再見");
  expect((await read(page)).state.life.game.knownPeople).toEqual(["sufei"]);
});
