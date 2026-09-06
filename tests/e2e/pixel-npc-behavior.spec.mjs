import { test, expect } from "@playwright/test";
import { initialPixelState } from "../../src/pixel/model.js";
import { ROOMS } from "../../src/pixel/data.js";
import { walkable } from "../../src/pixel/navigation.js";
const read = (p) => p.evaluate(() => window.__pixelRead());
async function start(page, scene = "cafe", amend = () => {}) {
  const s = initialPixelState();
  s.flags.intro = true;
  s.sceneId = scene;
  s.position = { ...ROOMS[scene].entry };
  s.life.speed = 2;
  amend(s);
  await page.addInitScript((state) => {
    if (!localStorage.getItem("star-game-pixel-phase-one-v1"))
      localStorage.setItem(
        "star-game-pixel-phase-one-v1",
        JSON.stringify({ state }),
      );
  }, s);
  await page.goto("/pixel.html");
  await expect(page.locator("#loading")).toBeHidden({ timeout: 15000 });
}
test("NPCs approach objects, interact, finish and choose another activity without settling a game day", async ({
  page,
}, info) => {
  test.setTimeout(50000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await start(page);
  const before = (await read(page)).state.life;
  await expect
    .poll(
      async () =>
        (await read(page)).npcs.find((n) => n.id === "jiqing")?.behavior?.phase,
      { timeout: 25000 },
    )
    .toBe("using");
  const first = (await read(page)).npcs.find((n) => n.id === "jiqing");
  expect(first.object).toBeTruthy();
  expect(walkable(ROOMS.cafe, first)).toBe(true);
  expect(first.moving).toBe(false);
  expect(
    Math.hypot(first.x - first.goal.x, first.y - first.goal.y),
  ).toBeLessThan(9);
  await page.screenshot({ path: info.outputPath("npc-interaction.png") });
  await expect
    .poll(
      async () =>
        (await read(page)).npcs.find((n) => n.id === "jiqing")?.behavior
          ?.completed || 0,
      { timeout: 16000 },
    )
    .toBeGreaterThan(0);
  await expect
    .poll(
      async () => {
        const n = (await read(page)).npcs.find((n) => n.id === "jiqing");
        return !!n?.object && n.object !== first.object;
      },
      { timeout: 15000 },
    )
    .toBe(true);
  const after = (await read(page)).state.life;
  expect(after.day).toBe(before.day);
  expect(after.game.money).toBe(before.game.money);
  expect(errors).toEqual([]);
});
test("menus pause object use, reload restores a valid behavior, and talking interrupts it", async ({
  page,
}) => {
  test.setTimeout(50000);
  await start(page);
  await expect
    .poll(
      async () =>
        (await read(page)).npcs.find((n) => n.id === "jiqing")?.behavior?.phase,
      { timeout: 25000 },
    )
    .toBe("using");
  await page.locator('[data-ui="menu"]').click();
  const paused = await read(page);
  await page.waitForTimeout(500);
  expect((await read(page)).state.elapsed).toBe(paused.state.elapsed);
  // checkpoint on page hide exercises the real autosave path.
  await page.reload();
  await expect(page.locator("#loading")).toBeHidden({ timeout: 15000 });
  const restored = (await read(page)).npcs.find((n) => n.id === "jiqing");
  const saved = paused.npcs.find((n) => n.id === "jiqing");
  expect(restored.object).toBe(saved.object);
  expect(restored.behavior.phase).toBe("using");
  expect(restored.behavior.remaining).toBeLessThanOrEqual(
    saved.behavior.remaining,
  );
  await page.locator('[data-ui="menu"]').click();
  await page.locator('#panel [data-ui="nearby"]').click();
  const npc = page.locator('[data-npc="jiqing"]');
  await expect(npc).toBeVisible();
  await npc.click();
  await expect(page.locator("#dialogue")).toBeVisible({ timeout: 15000 });
  expect(
    (await read(page)).npcs.find((n) => n.id === "jiqing").object,
  ).toBeNull();
});
test("moving feet stay on walkable ground and actors do not occupy the same contact point", async ({
  page,
}) => {
  test.setTimeout(30000);
  await start(page, "rehearsal");
  for (let i = 0; i < 24; i++) {
    const s = await read(page),
      actors = [s.player, ...s.npcs];
    for (const a of actors) expect(walkable(ROOMS.rehearsal, a)).toBe(true);
    for (let a = 0; a < actors.length; a++)
      for (let b = a + 1; b < actors.length; b++)
        expect(
          Math.hypot(actors[a].x - actors[b].x, actors[a].y - actors[b].y),
        ).toBeGreaterThanOrEqual(15.9);
    await page.waitForTimeout(180);
  }
});

test("old saves beside furniture recover to clear ground and can walk away", async ({
  page,
}) => {
  const room = ROOMS.home;
  let edge;
  for (let y = 180; y < 600 && !edge; y += 2)
    for (let x = 180; x < 1000; x += 2) {
      const p = { x, y };
      if (
        walkable(room, p) &&
        ![
          [4, 0],
          [-4, 0],
          [0, 4],
          [0, -4],
        ].every(([dx, dy]) => walkable(room, { x: x + dx, y: y + dy }))
      ) {
        edge = p;
        break;
      }
    }
  expect(edge).toBeTruthy();
  await start(page, "home", (s) => {
    s.position = edge;
  });
  const player = (await read(page)).player;
  for (const [dx, dy] of [
    [0, 0],
    [4, 0],
    [-4, 0],
    [0, 4],
    [0, -4],
  ])
    expect(walkable(room, { x: player.x + dx, y: player.y + dy })).toBe(true);
  const target = room.entry;
  const direction =
    Math.abs(target.x - player.x) > Math.abs(target.y - player.y)
      ? target.x > player.x
        ? "d"
        : "a"
      : target.y > player.y
        ? "s"
        : "w";
  await page.keyboard.down(direction);
  await page.waitForTimeout(500);
  await page.keyboard.up(direction);
  const after = (await read(page)).player;
  expect(Math.hypot(after.x - player.x, after.y - player.y)).toBeGreaterThan(2);
  expect(walkable(room, after)).toBe(true);
});
