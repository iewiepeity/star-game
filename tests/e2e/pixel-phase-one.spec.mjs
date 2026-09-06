import { initialPixelState } from "../../src/pixel/model.js";
import { test, expect } from "@playwright/test";
test.use({ actionTimeout: 12000 });
test.setTimeout(60000);
const read = (page) => page.evaluate(() => window.__pixelRead());
const close = (page) => page.getByRole("button", { name: "關閉視窗" }).click();
async function start(page) {
  // Visual regression fixture: acquisition has its own phase-two browser test.
  const fixture = initialPixelState();
  fixture.life.game.ownedOutfits.raven = ["newcomer", "practice", "audition"];
  await page.addInitScript((state) => {
    const key = "star-game-pixel-phase-one-v1";
    if (!localStorage.getItem(key))
      localStorage.setItem(key, JSON.stringify({ state }));
  }, fixture);
  await page.goto("/pixel.html");
  await page.getByRole("button", { name: "開始我的一天 →" }).click();
  await page.locator('[data-onboarding="skip"]').click();
}
async function menu(page, item) {
  await page.getByRole("button", { name: "開啟選單" }).click();
  if (item) await page.locator(`#panel [data-ui="${item}"]`).click();
}
async function travel(page, id) {
  await menu(page, "travel");
  await page.locator(`[data-map-place="${id}"]`).click();
  await page.locator(`[data-map-enter="${id}"]`).click();
  await expect
    .poll(async () => (await read(page)).scene, { timeout: 12000 })
    .toBe(id);
  await expect.poll(async () => (await read(page)).paused).toBe(false);
}
async function object(page, id) {
  await menu(page, "nearby");
  await page.locator(`[data-object="${id}"]`).click();
}
async function talk(page) {
  await menu(page, "nearby");
  await page.locator('[data-npc="jiqing"]').click();
  await expect(page.locator("#dialogue")).toBeVisible();
}
async function activity(page, kind) {
  await expect
    .poll(async () => (await read(page)).player.pose, { timeout: 12000 })
    .toBe(kind);
}
test("walk, dress, enter every room, meet an NPC and reload the same save", async ({
  page,
}) => {
  // This end-to-end journey includes multiple real walks, outfit loads and
  // a six-second practice. Keep per-action limits, but budget the whole trip.
  test.setTimeout(120000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await start(page);
  await page.evaluate(() => {
    localStorage.setItem("star-game-save", "main-save-sentinel");
    localStorage.setItem("star-game-preferences", "preferences-sentinel");
  });
  const initial = await read(page);
  await object(page, "wardrobe");
  await page.locator('[data-fitting="practice"]').click();
  await page.locator('[data-outfit="practice"]').click();
  expect((await read(page)).player.x).not.toBe(initial.player.x);
  await expect(page.locator("#player-head")).toHaveAttribute(
    "src",
    "./assets/avatars/raven-practice.webp",
  );
  expect((await read(page)).player.outfit).toBe("raven-practice");
  await close(page);
  await travel(page, "rehearsal");
  await object(page, "practice");
  await page.locator('[data-activity="dance"]').click();
  await activity(page, "dance");
  await expect
    .poll(async () => (await read(page)).state.flags.practiced, {
      timeout: 15000,
    })
    .toBe(true);
  await travel(page, "cafe");
  await talk(page);
  await expect(page.locator("#panel")).not.toBeVisible();
  await expect(page.locator(".conversation img")).toHaveAttribute(
    "src",
    /portraits\/jiqing/,
  );
  await page.locator('[data-ui="next-dialogue"]').click();
  await expect(page.locator(".conversation img")).toHaveAttribute(
    "src",
    "./assets/avatars/raven-practice.webp",
  );
  await page.locator('[data-ui="next-dialogue"]').click();
  await page.locator('[data-choice="0"]').click();
  await page.locator('[data-ui="next-dialogue"]').click();
  expect((await read(page)).state.knownPeople).toContain("jiqing");
  await menu(page, "saves");
  await page.locator('[data-save="1"]').click();
  const saved = await read(page);
  await close(page);
  await travel(page, "home");
  await object(page, "wardrobe");
  await page.locator('[data-fitting="audition"]').click();
  await page.locator('[data-outfit="audition"]').click();
  await expect(page.locator("#toast")).toContainText("已換上這套衣服");
  await close(page);
  await menu(page, "saves");
  await page.locator('[data-load="1"]').click();
  await expect(page.locator("#loading")).toBeHidden({ timeout: 20000 });
  await expect
    .poll(async () => (await read(page))?.scene, { timeout: 12000 })
    .toBe("cafe");
  await expect(page.locator("#loading")).toBeHidden();
  const restored = await read(page);
  expect(restored.scene).toBe("cafe");
  expect(restored.player.outfit).toBe("raven-practice");
  expect(restored.player.x).toBeCloseTo(saved.player.x, 0);
  expect(restored.playerCount).toBe(1);
  expect(restored.state.flags.practiced).toBe(true);
  await page.reload();
  await expect(page.locator("#loading")).toBeHidden({ timeout: 20000 });
  await expect
    .poll(async () => (await read(page))?.scene, { timeout: 12000 })
    .toBe("cafe");
  expect((await read(page)).player.outfit).toBe("raven-practice");
  expect(
    await page.evaluate(() => localStorage.getItem("star-game-save")),
  ).toBe("main-save-sentinel");
  expect(
    await page.evaluate(() => localStorage.getItem("star-game-preferences")),
  ).toBe("preferences-sentinel");
  expect(errors).toEqual([]);
});
test("NPC moves while the world runs; pause and panels freeze the world", async ({
  page,
}) => {
  test.setTimeout(45000);
  await start(page);
  await travel(page, "cafe");
  const npc = (await read(page)).npcs.find((n) => n.id === "jiqing");
  await expect
    .poll(
      async () => {
        const n = (await read(page)).npcs.find((n) => n.id === "jiqing");
        return Math.hypot(n.x - npc.x, n.y - npc.y);
      },
      { timeout: 26000 },
    )
    .toBeGreaterThan(8);
  await menu(page, "settings");
  await page.getByRole("button", { name: "暫停世界" }).click();
  await close(page);
  const paused = await read(page);
  await page.waitForTimeout(700);
  expect((await read(page)).state.elapsed).toBe(paused.state.elapsed);
  await menu(page, "settings");
  await page.getByRole("button", { name: "繼續世界" }).click();
  await page.getByRole("button", { name: "操作說明" }).click();
  const modal = await read(page);
  await page.waitForTimeout(500);
  expect((await read(page)).state.elapsed).toBe(modal.state.elapsed);
  await close(page);
  expect((await read(page)).playerCount).toBe(1);
});
test("unified menu, camera drag and bottom dialogue checkpoint remain usable", async ({
  page,
}) => {
  test.setTimeout(50000);
  await start(page);
  await expect(page.locator(".bottom-bar button")).toHaveCount(5);
  await menu(page);
  await expect(page.locator(".command-menu button")).toHaveCount(8);
  await page.locator('[data-ui="settings"]').click();
  await page.getByRole("button", { name: "放大場景" }).click();
  await close(page);
  const before = await read(page),
    box = await page.locator("canvas").boundingBox();
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.55);
  await page.mouse.down();
  await page.mouse.move(
    box.x + box.width * 0.5 + 65,
    box.y + box.height * 0.55 + 20,
    { steps: 5 },
  );
  await page.mouse.up();
  expect((await read(page)).player.x).toBe(before.player.x);
  expect((await read(page)).player.moving).toBe(false);
  await menu(page, "settings");
  await page.getByRole("button", { name: "鏡頭回到主角" }).click();
  await close(page);
  await travel(page, "cafe");
  await talk(page);
  const dock = await page.locator("#dialogue").boundingBox();
  expect(page.viewportSize().height - dock.y - dock.height).toBeLessThanOrEqual(
    24,
  );
  expect(await page.locator("#world-shell").evaluate((el) => el.inert)).toBe(
    true,
  );
  await page.locator('[data-ui="next-dialogue"]').click();
  await page.getByRole("button", { name: "保存這段相遇" }).click();
  await page.locator('[data-save="2"]').click();
  await close(page);
  await expect(page.locator("#dialogue")).toBeVisible();
  await page.getByRole("button", { name: "結束對話" }).click();
  await menu(page, "saves");
  await page.locator('[data-load="2"]').click();
  await expect(page.locator(".conversation img")).toHaveAttribute(
    "src",
    "./assets/avatars/raven-newcomer.webp",
  );
  expect((await read(page)).state.dialogue.index).toBe(1);
  await page.getByRole("button", { name: "結束對話" }).focus();
  await page.keyboard.press("Tab");
  await expect(page.locator('[data-ui="next-dialogue"]')).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.locator("#dialogue")).not.toBeVisible();
  expect(await page.locator("#world-shell").evaluate((el) => el.inert)).toBe(
    false,
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test("tap floor to walk in four directions; simultaneous keys do not create diagonal movement", async ({
  page,
  hasTouch,
}) => {
  await start(page);
  const before = await read(page),
    box = await page.locator("canvas").boundingBox();
  const x =
    box.x + (before.player.x - 80 - before.camera.x) * before.camera.zoom;
  const y = box.y + (before.player.y - before.camera.y) * before.camera.zoom;
  if (hasTouch) await page.touchscreen.tap(x, y);
  else await page.mouse.click(x, y);
  await expect
    .poll(async () => (await read(page)).player.x)
    .toBeLessThan(before.player.x - 40);
  await expect.poll(async () => (await read(page)).player.moving).toBe(false);
  const arrived = await read(page);
  await page.locator("#world").focus();
  await page.keyboard.down("ArrowDown");
  await page.keyboard.down("ArrowRight");
  const held = await read(page);
  await page.waitForTimeout(300);
  const both = await read(page);
  expect(both.player.x).toBeGreaterThan(held.player.x);
  expect(both.player.y).toBe(held.player.y);
  await page.keyboard.up("ArrowRight");
  await page.keyboard.up("ArrowDown");
  await page.keyboard.down("ArrowDown");
  await page.waitForTimeout(1800);
  await page.keyboard.up("ArrowDown");
  const end = await read(page);
  expect(end.player.y).toBeGreaterThan(arrived.player.y);
  expect(end.player.y).toBeLessThan(620);
  expect(end.playerCount).toBe(1);
});
test("bed, sofa and rehearsal have distinct poses; interrupted activity safely reloads", async ({
  page,
}) => {
  test.setTimeout(90000);
  await start(page);
  await object(page, "bed");
  await page.locator('[data-activity="rest"]').click();
  await activity(page, "rest");
  await page.waitForTimeout(550);
  const bed = await read(page);
  expect(bed.player.visual).not.toEqual({ x: bed.player.x, y: bed.player.y });
  expect(bed.state.flags.rested).toBeUndefined();
  await menu(page, "saves");
  await page.locator('[data-save="3"]').click();
  const saved = await read(page);
  await close(page);
  await page.locator('[data-ui="stop-activity"]').click();
  await activity(page, "standing");
  await menu(page, "saves");
  await page.locator('[data-load="3"]').click();
  await activity(page, "rest");
  expect((await read(page)).player.x).toBe(saved.player.x);
  await expect
    .poll(async () => (await read(page)).state.flags.rested, { timeout: 12000 })
    .toBe(true);
  await object(page, "sofa");
  await activity(page, "sit");
  expect((await read(page)).player.texture).toBe("raven-newcomer-seated");
  expect((await read(page)).player.frame).toBe("0-0");
  await page.locator('[data-ui="stop-activity"]').click();
  await activity(page, "standing");
  const standing = await read(page);
  expect(standing.player.visual).toEqual({
    x: standing.player.x,
    y: standing.player.y,
  });
  await travel(page, "rehearsal");
  await object(page, "practice");
  await page.locator('[data-activity="dance"]').click();
  await activity(page, "dance");
  const frame = (await read(page)).player.frame;
  await expect
    .poll(async () => (await read(page)).player.frame)
    .not.toBe(frame);
  await page.locator('[data-ui="stop-activity"]').click();
  await object(page, "practice");
  await page.locator('[data-activity="read"]').click();
  await activity(page, "read");
  expect(["1-2", "1-3"]).toContain((await read(page)).player.frame);
  expect((await read(page)).state.flags.practiced).toBeUndefined();
  await expect
    .poll(async () => (await read(page)).state.flags.practiced, {
      timeout: 15000,
    })
    .toBe(true);
});
test("the actual furniture replaces floating buttons; touch selects before walking", async ({
  page,
  hasTouch,
}) => {
  await start(page);
  // Zoom out so the bed can be reached even on a narrow phone viewport.
  await menu(page, "settings");
  for (let i = 0; i < 4; i++)
    await page.getByRole("button", { name: "縮小場景" }).click();
  await close(page);
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        window.requestAnimationFrame(() =>
          window.requestAnimationFrame(resolve),
        ),
      ),
  );
  const box = await page.locator("canvas").boundingBox();
  let world = await read(page);
  let x = box.x + (309 * 0.625 - world.camera.x) * world.camera.zoom;
  let y = box.y + (418 * 0.625 - world.camera.y) * world.camera.zoom;
  // Furniture outside a phone's camera viewport must be brought into view first.
  for (
    let i = 0;
    i < 4 && (x < box.x + 24 || x > box.x + box.width - 24);
    i++
  ) {
    const startX = box.x + box.width / 2,
      startY = box.y + box.height / 2;
    const offset = Math.max(
      -box.width * 0.4,
      Math.min(box.width * 0.4, startX - x),
    );
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + offset, startY, { steps: 5 });
    await page.mouse.up();
    await page.evaluate(
      () =>
        new Promise((resolve) =>
          window.requestAnimationFrame(() =>
            window.requestAnimationFrame(resolve),
          ),
        ),
    );
    world = await read(page);
    x = box.x + (309 * 0.625 - world.camera.x) * world.camera.zoom;
    y = box.y + (418 * 0.625 - world.camera.y) * world.camera.zoom;
  }
  expect(x).toBeGreaterThan(box.x);
  expect(x).toBeLessThan(box.x + box.width);
  expect(y).toBeGreaterThan(box.y);
  expect(y).toBeLessThan(box.y + box.height);
  expect(world.markerCount).toBe(0);
  expect(await page.locator("[data-object]").count()).toBe(0);
  if (hasTouch) {
    await page.touchscreen.tap(x, y);
    await expect(page.locator("#panel-title")).toHaveText("休息一下");
    expect((await read(page)).player.moving).toBe(false);
    await page.getByRole("button", { name: "走近看看 →" }).click();
  } else await page.mouse.click(x, y);
  await page.locator('[data-activity="rest"]').click();
  await activity(page, "rest");
  await expect(page.locator("#panel")).not.toBeVisible();
});

test("seats match furniture directions and retain hip contact through sipping and reload", async ({
  page,
}) => {
  test.setTimeout(120000);
  await start(page);
  for (const [room, id, frame, mask] of [
    ["home", "desk-seat", "0-3", 1],
    ["home", "sofa", "0-0", 0],
    ["rehearsal", "bench", "0-0", 0],
    ["cafe", "chair", "0-2", 1],
  ]) {
    if ((await read(page)).scene !== room) await travel(page, room);
    await object(page, id);
    await activity(page, "sit");
    const seated = await read(page);
    expect(seated.player.texture).toBe("raven-newcomer-seated");
    expect(seated.player.frame).toBe(frame);
    expect(seated.player.origin.y).toBeLessThan(1);
    expect(seated.seatForegroundCount).toBe(mask);
    await page.locator('[data-ui="stop-activity"]').click();
    expect((await read(page)).seatForegroundCount).toBe(0);
  }
  await object(page, "window");
  await page.getByRole("button", { name: "坐下喝一杯" }).click();
  await activity(page, "coffee");
  const initial = await read(page);
  await expect
    .poll(async () => (await read(page)).player.frame)
    .not.toBe(initial.player.frame);
  expect((await read(page)).player.visual).toEqual(initial.player.visual);
  await menu(page, "saves");
  await page.locator('[data-save="4"]').click();
  await close(page);
  await page.locator('[data-ui="stop-activity"]').click();
  await menu(page, "saves");
  await page.locator('[data-load="4"]').click();
  await activity(page, "coffee");
  expect((await read(page)).player.visual).toEqual(initial.player.visual);
  expect((await read(page)).seatForegroundCount).toBe(1);
  await page.locator('[data-ui="stop-activity"]').click();
  await talk(page);
  expect(
    await page.locator(".conversation img").evaluate((img) => img.naturalWidth),
  ).toBeGreaterThanOrEqual(640);
});
