import { test, expect } from "@playwright/test";
import { initialPixelState } from "../../src/pixel/model.js";
import { initialLife, recordMeeting } from "../../src/pixel/life.js";
import { ROOMS } from "../../src/pixel/data.js";
import { JOB_CATALOG } from "../../src/data/jobs.js";
const read = (p) => p.evaluate(() => window.__pixelRead());
const menu = async (p, id) => {
  await p.locator('[data-ui="menu"]').first().click();
  if (id) await p.locator(`#panel [data-ui="${id}"]`).click();
};
async function start(p, scene = "home", setup = () => {}) {
  const s = initialPixelState();
  s.life = initialLife("career-0");
  s.flags.intro = true;
  s.life.speed = 16;
  s.sceneId = scene;
  s.position = ROOMS[scene].entry;
  s.life.game.money = 100000;
  s.life.game.stats = Object.fromEntries(
    Object.keys(s.life.game.stats).map((k) => [k, 350]),
  );
  s.life.game.trainingSessionsCompleted = 20;
  setup(s);
  await p.addInitScript((s) => {
    const key = "star-game-pixel-phase-one-v1";
    if (!localStorage.getItem(key))
      localStorage.setItem(key, JSON.stringify({ state: s }));
  }, s);
  await p.goto("/pixel.html");
  await expect(p.locator("#loading")).toBeHidden();
}
async function today(p) {
  await p.locator('#panel [data-life="today"]').click();
  await p.locator("[data-start]").click();
}
test("a real casting desk books today's audition, pauses for a choice, and keeps the result after reload", async ({
  page,
}, info) => {
  test.setTimeout(60000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await start(page, "tv");
  await menu(page, "nearby");
  await page.locator('[data-object="reception"]').click();
  await page.locator('[data-board-venue="tv_company"]').click();
  const job = JOB_CATALOG.find((j) => j.stars === 1 && j.category === "電視劇");
  await page.locator(`[data-job="${job.id}"]`).click();
  await page.locator('[data-career-command="apply-job"]').click();
  await page.locator('[data-book="audition"]').click();
  await page.locator('[data-book-day="0"]').click();
  expect((await read(page)).state.life.plan[0].id).toBe("career_task");
  await today(page);
  await expect(page.locator('[data-career-decision="steady"]')).toBeVisible({
    timeout: 20000,
  });
  expect((await read(page)).state.life.pending.phase).toBe("decision");
  expect((await read(page)).state.life.ledger).toHaveLength(0);
  await page.reload();
  await expect(page.locator('[data-career-decision="steady"]')).toBeVisible({
    timeout: 15000,
  });
  await page.locator('[data-career-decision="steady"]').click();
  await expect(page.locator("[data-job]").first()).toBeVisible({
    timeout: 20000,
  });
  const saved = await read(page);
  expect(saved.state.life.ledger).toHaveLength(1);
  expect(saved.state.life.game.activeJobs[job.id].stage).toBe("passed");
  await page.locator(`[data-job="${job.id}"]`).click();
  await page.locator('[data-career-command="sign-job"]').click();
  await expect(page.locator('[data-book="job"]')).toBeVisible();
  await page.screenshot({ path: info.outputPath("contract.png") });
  expect(errors).toEqual([]);
});
test("an invitation enters the agreed space and shows a sharp shoulder portrait in the bottom dialogue", async ({
  page,
}, info) => {
  test.setTimeout(60000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await start(page, "home", (s) => {
    recordMeeting(s.life, "sufei");
    s.knownPeople = ["sufei"];
  });
  await menu(page, "phone");
  await page.locator('[data-pixel-app="people"]').last().click();
  await page.locator('[data-people-section="profiles"]').click();
  await page.locator('[data-select-npc="sufei"]').first().click();
  await page.locator('[data-npc-profile-tab="relationship"]').click();
  await page.locator('[data-npc-interact="meal"]').click();
  await page.locator('[data-book-day="0"]').click();
  await today(page);
  await expect(page.locator("[data-career-decision]").first()).toBeVisible({
    timeout: 20000,
  });
  const r = await read(page);
  expect(r.scene).toBe("restaurant");
  expect(r.npcs.some((n) => n.id === "sufei")).toBe(true);
  await expect(page.locator("#panel")).not.toBeVisible();
  const portrait = page.locator("#dialogue .dialogue-portrait img");
  await expect(portrait).toBeVisible();
  expect(await portrait.evaluate((i) => i.naturalWidth)).toBeGreaterThanOrEqual(
    600,
  );
  await page.screenshot({ path: info.outputPath("appointment.png") });
  await page.locator("[data-career-decision]").first().click();
  await expect(page.locator('#dialogue [data-life="advance"]')).toBeVisible({
    timeout: 15000,
  });
  const money = (await read(page)).state.life.game.money;
  expect(money).toBe(99300);
  await page.reload();
  await expect(page.locator('#dialogue [data-life="advance"]')).toBeVisible({
    timeout: 15000,
  });
  expect((await read(page)).state.life.game.money).toBe(money);
  await page.locator('#dialogue [data-life="advance"]').click();
  expect((await read(page)).state.life.day).toBe(1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});
test("career menu supports production choices and the organic city retains every destination", async ({
  page,
}, info) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await start(page);
  await menu(page, "career");
  await expect(page.locator(".career-tile")).toHaveCount(6);
  await page.screenshot({ path: info.outputPath("career-menu.png") });
  await page.locator('[data-career="projects"]').click();
  await page.locator("#creative-title").fill("下一站的歌");
  await page.locator('[data-creative-new="song"]').click();
  await expect(page.locator("[data-creative-work]")).toBeVisible();
  await page.getByRole("button", { name: "關閉視窗" }).click();
  await menu(page, "travel");
  await expect(page.locator("[data-map-place]")).toHaveCount(27);
  await page.locator(".city-map-art").evaluate((i) => i.decode());
  expect(await page.locator(".city-map-art").getAttribute("src")).toContain(
    "map-organic",
  );
  await page.locator('[data-map-place="livehouse"]').click();
  await page.screenshot({ path: info.outputPath("organic-map.png") });
  await page.locator('[data-map-enter="livehouse"]').click();
  await expect
    .poll(async () => (await read(page)).scene, { timeout: 15000 })
    .toBe("livehouse");
  await expect.poll(async () => (await read(page)).paused).toBe(false);
  expect(errors).toEqual([]);
});
for (const scene of ["market", "livehouse"])
  test(`${scene}: walking keeps the hero intact and no atlas caption enters the scene`, async ({
    page,
  }, info) => {
    await start(page, scene, (s) => {
      s.outfitId = "practice";
      s.life.game.outfitId = "practice";
      s.life.game.ownedOutfits.raven.push("practice");
    });
    await menu(page, "nearby");
    await page.locator('[data-object="detail"]').click();
    await expect(page.locator("#panel[open]")).toBeVisible({ timeout: 20000 });
    await page.getByRole("button", { name: "關閉視窗" }).click();
    await page.waitForTimeout(260);
    await page.screenshot({ path: info.outputPath(`${scene}.png`) });
    expect((await read(page)).playerCount).toBe(1);
  });
