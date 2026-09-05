import { test, expect } from "@playwright/test";
const read = (page) => page.evaluate(() => window.__pixelRead());
async function start(page) {
  await page.goto("/pixel.html");
  await expect(
    page.getByRole("button", { name: "開始我的一天 →" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "開始我的一天 →" }).click();
}
async function travel(page, id) {
  await page.locator(".city-button").click();
  await page.locator(`[data-room="${id}"]`).click();
  await expect.poll(async () => (await read(page)).scene).toBe(id);
  await expect.poll(async () => (await read(page)).paused).toBe(false);
}
async function object(page, id) {
  await page.locator(`[data-object="${id}"]`).click();
  await expect(page.locator("#panel")).toBeVisible();
}
const close = (page) => page.getByRole("button", { name: "關閉視窗" }).click();
test("walk, dress, enter every room, meet an NPC and reload the same save", async ({
  page,
}) => {
  test.setTimeout(70000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await start(page);
  await page.evaluate(() => {
    localStorage.setItem("star-game-save", "main-save-sentinel");
    localStorage.setItem("star-game-preferences", "preferences-sentinel");
  });
  const initial = await read(page);
  await object(page, "wardrobe");
  expect((await read(page)).player.x).not.toBe(initial.player.x);
  await page.locator('[data-outfit="practice"]').click();
  await expect(page.locator("#player-head")).toHaveAttribute(
    "src",
    "./assets/avatars/raven-practice.webp",
  );
  expect((await read(page)).player.outfit).toBe("raven-practice");
  await close(page);
  await travel(page, "rehearsal");
  await object(page, "practice");
  await close(page);
  await travel(page, "cafe");
  await expect(page.locator('[data-npc="jiqing"]')).toBeVisible();
  await page.locator('[data-npc="jiqing"]').click();
  await expect(page.locator(".conversation")).toBeVisible();
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
  await page.getByRole("button", { name: "存檔與讀檔" }).click();
  await page.locator('[data-save="1"]').click();
  const saved = await read(page);
  await close(page);
  await travel(page, "home");
  await object(page, "wardrobe");
  await page.locator('[data-outfit="audition"]').click();
  await close(page);
  await page.getByRole("button", { name: "存檔與讀檔" }).click();
  await page.locator('[data-load="1"]').click();
  const restored = await read(page);
  expect(restored.scene).toBe("cafe");
  expect(restored.player.outfit).toBe("raven-practice");
  expect(restored.player.x).toBeCloseTo(saved.player.x, 0);
  expect(restored.playerCount).toBe(1);
  expect(restored.state.flags.practiced).toBe(true);
  await page.reload();
  await expect.poll(async () => (await read(page))?.scene).toBe("cafe");
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
  const first = await read(page);
  const npc = first.npcs.find((n) => n.id === "jiqing");
  await expect
    .poll(
      async () => {
        const n = (await read(page)).npcs.find((n) => n.id === "jiqing");
        return Math.hypot(n.x - npc.x, n.y - npc.y);
      },
      { timeout: 26000 },
    )
    .toBeGreaterThan(8);
  await page.getByRole("button", { name: "暫停世界" }).click();
  const paused = await read(page);
  await page.waitForTimeout(700);
  expect((await read(page)).state.elapsed).toBe(paused.state.elapsed);
  await page.getByRole("button", { name: "繼續世界" }).click();
  await page.getByRole("button", { name: "操作說明" }).click();
  const modal = await read(page);
  await page.waitForTimeout(500);
  expect((await read(page)).state.elapsed).toBe(modal.state.elapsed);
  await close(page);
  expect((await read(page)).playerCount).toBe(1);
});
test("touch layout, camera drag and dialogue checkpoint remain usable", async ({
  page,
}) => {
  test.setTimeout(40000);
  await start(page);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "放大場景" }).click();
  const before = await read(page);
  const canvas = page.locator("canvas"),
    box = await canvas.boundingBox();
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
  await page.getByRole("button", { name: "鏡頭回到主角" }).click();
  await travel(page, "cafe");
  await page.locator('[data-npc="jiqing"]').click();
  await expect(page.locator(".conversation")).toBeVisible();
  await page.locator('[data-ui="next-dialogue"]').click();
  await page.getByRole("button", { name: "保存這段相遇" }).click();
  await page.locator('[data-save="2"]').click();
  await close(page);
  await page.getByRole("button", { name: "存檔與讀檔" }).click();
  await page.locator('[data-load="2"]').click();
  await expect(page.locator(".conversation img")).toHaveAttribute(
    "src",
    "./assets/avatars/raven-newcomer.webp",
  );
  expect((await read(page)).state.dialogue.index).toBe(1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("tap the actual floor to walk, and keyboard control stops at the scene boundary", async ({
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
  expect(arrived.state.sceneId).toBe("home");
  await page.locator("#world").focus();
  await page.keyboard.down("ArrowDown");
  await page.waitForTimeout(1800);
  await page.keyboard.up("ArrowDown");
  const end = await read(page);
  expect(end.player.y).toBeGreaterThan(arrived.player.y);
  expect(end.player.y).toBeLessThan(620);
  expect(end.playerCount).toBe(1);
});
