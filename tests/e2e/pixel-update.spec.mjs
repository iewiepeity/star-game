import { test as base, expect } from "@playwright/test";
import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { initialPixelState, SAVE_KEY } from "../../src/pixel/model.js";
import { resumePixelSave } from "./pixel-save-ready.mjs";

// A real two-release server exercises installation, activation and caches.
// Each test owns its origin, so workers cannot leak between parallel browsers.
const root = fileURLToPath(new URL("../../", import.meta.url));
const test = base.extend({
  releaseSite: async ({}, use) => {
    let version = 1,
      stalled = false;
    const worker = await readFile(resolve(root, "service-worker.js"), "utf8");
    const mime = {
      ".html": "text/html",
      ".js": "text/javascript",
      ".css": "text/css",
      ".json": "application/json",
      ".webmanifest": "application/manifest+json",
      ".svg": "image/svg+xml",
      ".png": "image/png",
      ".webp": "image/webp",
      ".jpg": "image/jpeg",
      ".woff2": "font/woff2",
      ".ogg": "audio/ogg",
    };
    const server = createServer((req, res) => {
      const path = decodeURIComponent(
        new URL(req.url, "http://localhost").pathname,
      );
      res.setHeader("Cache-Control", "no-cache");
      if (path === "/service-worker.js") {
        res.setHeader("Content-Type", "text/javascript");
        let source = worker.replace(
          /star-game-runtime-v[^"\s]+/,
          `star-game-runtime-update-test-${version}`,
        );
        if (stalled)
          source = source.replace("self.skipWaiting()", "Promise.resolve()");
        res.end(source);
        return;
      }
      const file = resolve(root, `.${path === "/" ? "/index.html" : path}`);
      if (!file.startsWith(root.endsWith(sep) ? root : root + sep)) {
        res.writeHead(403).end();
        return;
      }
      res.setHeader(
        "Content-Type",
        mime[extname(file)] || "application/octet-stream",
      );
      const stream = createReadStream(file);
      stream.on("error", () => res.writeHead(404).end());
      stream.pipe(res);
    });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    try {
      await use({
        url: `http://127.0.0.1:${server.address().port}/pixel.html`,
        next: () => {
          version++;
        },
        stall: () => {
          stalled = true;
        },
      });
    } finally {
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
    }
  },
});

async function prepare(page, site) {
  const state = initialPixelState();
  state.flags.intro = true;
  state.life.game.money = 31415;
  await page.addInitScript(
    ({ state, key }) => {
      if (!sessionStorage.getItem("update-test-seeded")) {
        localStorage.setItem(key, JSON.stringify({ state }));
        sessionStorage.setItem("update-test-seeded", "true");
      }
    },
    { state, key: SAVE_KEY },
  );
  await page.goto(site.url);
  await expect(page.locator("#loading")).toBeHidden({ timeout: 30000 });
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await page.reload();
  await expect(page.locator("#loading")).toBeHidden({ timeout: 30000 });
  expect(await page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(
    true,
  );
  await page.locator('[data-ui="menu"]').first().click();
  await page.locator('#panel [data-ui="settings"]').click();
  site.next();
  await page.locator('[data-offline="update"]').click();
  await expect(
    page.getByRole("button", { name: "儲存並更新", exact: true }),
  ).toBeVisible({ timeout: 30000 });
}

async function applyAndCheck(page) {
  const before = await page.evaluate(() => window.__pixelRead().state.life);
  await Promise.all([
    page.waitForEvent("domcontentloaded"),
    page.getByRole("button", { name: "儲存並更新", exact: true }).click(),
  ]);
  await expect(page.locator("#loading")).toBeHidden({ timeout: 30000 });
  const after = await page.evaluate(() => window.__pixelRead().state.life);
  expect(after.game.money).toBe(31415);
  expect(after.day).toBe(before.day);
  expect(after.ledger).toEqual(before.ledger);
  expect(await page.evaluate(() => caches.keys())).toContain(
    "star-game-runtime-update-test-2",
  );
  expect(await page.evaluate(() => caches.keys())).not.toContain(
    "star-game-runtime-update-test-1",
  );
  expect(
    await page.evaluate(() =>
      navigator.serviceWorker
        .getRegistration()
        .then((r) => r.waiting?.state || null),
    ),
  ).toBe(null);
}

test("save and update activates a real new worker, reloads and retains the journey", async ({
  page,
  releaseSite,
}) => {
  test.setTimeout(90000);
  await prepare(page, releaseSite);
  await applyAndCheck(page);
});

test("save and update still reloads when another tab already activated the waiting update", async ({
  page,
  context,
  releaseSite,
}) => {
  test.setTimeout(90000);
  await prepare(page, releaseSite);
  const other = await context.newPage();
  await other.goto(releaseSite.url);
  await expect(other.locator("#loading")).toBeHidden({ timeout: 30000 });
  await resumePixelSave(other);
  await expect(page.locator("[data-storage-latest]")).toBeVisible();
  await other.evaluate(async () =>
    (await navigator.serviceWorker.getRegistration()).waiting.postMessage({
      type: "SKIP_WAITING",
    }),
  );
  await expect
    .poll(() =>
      page.evaluate(() =>
        navigator.serviceWorker
          .getRegistration()
          .then((r) => !r.waiting && r.active?.state === "activated"),
      ),
    )
    .toBe(true);
  await other.close();
  await expect(page.locator("[data-storage-latest]")).toBeVisible();
  await page.locator("[data-storage-latest]").click();
  await expect(page.locator("#save-status")).toHaveText("● 已儲存");

  await applyAndCheck(page);
});

test("a failed save explains the problem and leaves the update pending until a successful retry", async ({
  page,
  releaseSite,
}) => {
  test.setTimeout(90000);
  await prepare(page, releaseSite);
  await page.evaluate(() => {
    const original = window.IDBObjectStore.prototype.put;
    window.__restoreUpdateStorage = () => {
      window.IDBObjectStore.prototype.put = original;
    };
    window.IDBObjectStore.prototype.put = () => {
      throw new Error("storage full");
    };
  });
  await page.getByRole("button", { name: "儲存並更新", exact: true }).click();
  await expect(page.locator("#pixel-update-status")).toContainText(
    "目前無法儲存進度",
  );
  await expect(
    page.getByRole("button", { name: "儲存並更新", exact: true }),
  ).toBeEnabled();
  expect(
    await page.evaluate(() =>
      navigator.serviceWorker.getRegistration().then((r) => r.waiting?.state),
    ),
  ).toBe("installed");
  await page.evaluate(() => window.__restoreUpdateStorage());
  await applyAndCheck(page);
});

test("a stalled activation shows progress and offers a saved reload instead of an inert button", async ({
  page,
  releaseSite,
}) => {
  test.setTimeout(90000);
  releaseSite.stall();
  await prepare(page, releaseSite);
  await page.clock.install();
  await page.getByRole("button", { name: "儲存並更新", exact: true }).click();
  await expect(page.locator('[data-offline="apply-update"]')).toBeDisabled();
  await expect(page.locator("#pixel-update-status")).toContainText(
    "進度已儲存",
  );
  await page.clock.fastForward(16000);
  await expect(page.locator("#pixel-update-status")).toContainText(
    "切換未完成",
  );
  await expect(
    page.getByRole("button", { name: "儲存並更新", exact: true }),
  ).toBeEnabled();
  await Promise.all([
    page.waitForEvent("domcontentloaded"),
    page.getByRole("button", { name: "重新載入遊戲", exact: true }).click(),
  ]);
  await page.clock.resume();
  await expect(page.locator("#loading")).toBeHidden({ timeout: 30000 });
  expect(
    (await page.evaluate(() => window.__pixelRead().state.life)).game.money,
  ).toBe(31415);
});
