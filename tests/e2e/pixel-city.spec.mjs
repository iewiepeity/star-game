import { test, expect } from "@playwright/test";
import { initialPixelState } from "../../src/pixel/model.js";
import { CITY_PLACES, AGENCY_ROOMS } from "../../src/pixel/city-catalog.js";
import { ROOMS } from "../../src/pixel/data.js";
import { mkdir } from "node:fs/promises";
const read = (p) => p.evaluate(() => window.__pixelRead());
const menu = async (p, id) => {
  await p.locator('[data-ui="menu"]').first().click();
  if (id) await p.locator(`#panel [data-ui="${id}"]`).click();
};
const close = (p) => p.getByRole("button", { name: "關閉視窗" }).click();
async function start(p, state = initialPixelState()) {
  state.flags.intro = true;
  state.life.speed = 16;
  await p.addInitScript((s) => {
    const key = "star-game-pixel-phase-one-v1";
    if (!localStorage.getItem(key))
      localStorage.setItem(key, JSON.stringify({ state: s }));
  }, state);
  await p.goto("/pixel.html");
  await expect(p.locator("#loading")).toBeHidden();
}
async function city(p, id) {
  await menu(p, "travel");
  await p.locator(`[data-map-place="${id}"]`).click();
  await p.locator(`[data-map-enter="${id}"]`).click();
  await expect
    .poll(async () => (await read(p)).scene, { timeout: 15000 })
    .toBe(id);
  await expect.poll(async () => (await read(p)).paused).toBe(false);
}
async function object(p, id) {
  await menu(p, "nearby");
  await p.locator(`[data-object="${id}"]`).click();
}

test("whole-city map supports touch search, zoom and direct entry with a visible destination action", async ({
  page,
}, info) => {
  await start(page);
  await menu(page, "travel");
  await page.locator(".city-map-art").evaluate((i) => i.decode());
  await expect(page.locator("[data-map-place]")).toHaveCount(27);
  await page.locator("#map-search").fill("服");
  await expect(page.locator('[data-map-place="shop"]')).toHaveClass(
    /search-match/,
  );
  await page.locator('[data-map-place="shop"]').click();
  await page.locator('[data-map-place="home"]').hover();
  await expect(page.locator('[data-map-enter="shop"]')).toBeVisible();
  const bounds = await page.locator('[data-map-enter="shop"]').boundingBox();
  expect(bounds.y + bounds.height).toBeLessThan(page.viewportSize().height);
  await expect(page.locator("#map-detail img")).toHaveCount(0);
  await page.locator('[data-map-zoom="in"]').click();
  const overflow = await page
    .locator(".city-map-viewport")
    .evaluate(
      (e) => e.scrollWidth > e.clientWidth || e.scrollHeight > e.clientHeight,
    );
  expect(overflow).toBe(true);
  await page.locator("[data-map-home]").click();
  await page.locator("#map-search").fill("");
  await page.screenshot({ path: info.outputPath("city-map.png") });
  await page.locator('[data-map-enter="shop"]').click();
  await expect
    .poll(async () => (await read(page)).scene, { timeout: 15000 })
    .toBe("shop");
  expect((await read(page)).state.life.day).toBe(0);
  expect((await read(page)).state.life.game.money).toBe(18000);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("same-gender appearances remain one actor, and a new outfit keeps its identity during furniture actions", async ({
  page,
}) => {
  test.setTimeout(90000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const s = initialPixelState();
  for (const a of ["sunny", "noir", "sage"])
    s.life.game.ownedOutfits[a].push("practice");
  await start(page, s);
  await menu(page, "profile");
  await expect(page.locator("[data-avatar]")).toHaveCount(2);
  await expect(page.locator('[data-avatar="noir"]')).toHaveCount(0);
  for (const a of ["sunny", "raven", "sunny"]) {
    await page.locator(`[data-avatar="${a}"]`).click();
    await expect
      .poll(async () => (await read(page)).player.outfit, { timeout: 15000 })
      .toBe(`${a}-newcomer`);
    expect((await read(page)).playerCount).toBe(1);
  }
  await page.locator('[data-ui="closet"]').click();
  await page.locator('[data-fitting="practice"]').click();
  await page.locator('[data-outfit="practice"]').click();
  await expect
    .poll(async () => (await read(page)).player.outfit)
    .toBe("sunny-practice");
  await close(page);
  // Preview poses at 1x so the test can inspect contact before their duration ends.
  await page.locator("#speed-label").click();
  await object(page, "sofa");
  await expect
    .poll(async () => (await read(page)).player.pose, { timeout: 15000 })
    .toBe("sit");
  expect((await read(page)).player.texture).toBe("poses-sunny-0");
  expect((await read(page)).player.frame).toBe("1-seat-front");
  await page.locator('[data-ui="stop-activity"]').click();
  await object(page, "bed");
  await page.locator('[data-activity="rest"]').click();
  await expect
    .poll(async () => (await read(page)).player.pose, { timeout: 15000 })
    .toBe("rest");
  expect((await read(page)).player.frame).toBe("1-rest");
  expect((await read(page)).retainedAssets.heroes).toBeLessThanOrEqual(2);
  expect(errors).toEqual([]);
});

test("all 32 rooms load through map or connected interior entrances, retaining only three scene atlases", async ({
  page,
}, info) => {
  test.skip(
    info.project.name !== "desktop",
    "Full catalog traversal; responsive controls are covered in all six browsers above.",
  );
  test.setTimeout(150000);
  const s = initialPixelState();
  s.knownPeople = ["silver_pc"];
  s.life.game.knownPeople = ["silver_pc"];
  await start(page, s);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await mkdir("../phase3-room-check", { recursive: true });
  await page.screenshot({ path: "../phase3-room-check/home.png" });
  for (const p of CITY_PLACES.filter((p) => p.id !== "home")) {
    await city(page, p.id);
    const current = await read(page);
    expect(current.playerCount).toBe(1);
    expect(current.retainedAssets.rooms).toBeLessThanOrEqual(3);
    await page.screenshot({ path: `../phase3-room-check/${p.id}.png` });
    if (p.id === "business")
      for (const id of AGENCY_ROOMS) {
        await object(page, "service");
        await page.locator('[data-ui="agencies"]').click();
        await page.locator(`[data-interior="${id}"]`).click();
        await expect
          .poll(async () => (await read(page)).scene, { timeout: 12000 })
          .toBe(id);
        await expect.poll(async () => (await read(page)).paused).toBe(false);
        await page.screenshot({ path: `../phase3-room-check/${id}.png` });
        await object(page, "door");
        await expect
          .poll(async () => (await read(page)).scene, { timeout: 12000 })
          .toBe("business");
      }
    if (p.id === "gallery") {
      await object(page, "service");
      await page.locator('[data-interior="editing_room"]').click();
      await expect
        .poll(async () => (await read(page)).scene, { timeout: 12000 })
        .toBe("editing_room");
      await expect.poll(async () => (await read(page)).paused).toBe(false);
      await page.screenshot({ path: "../phase3-room-check/editing_room.png" });
    }
  }
  expect(new Set((await read(page)).state.visited).size).toBe(
    Object.keys(ROOMS).length,
  );
  expect(errors).toEqual([]);
});
