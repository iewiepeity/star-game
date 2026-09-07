import { test, expect } from "@playwright/test";
import { setImmediate as yieldSimulation } from "node:timers/promises";
import { resumePixelSave } from "./pixel-save-ready.mjs";
import { ROOMS } from "../../src/pixel/data.js";
import { initialPixelState, SAVE_KEY } from "../../src/pixel/model.js";
import {
  initialLife,
  beginDay,
  settleDay,
  advanceDay,
  nextWeek,
} from "../../src/pixel/life.js";
import { currentStory, chooseStory } from "../../src/pixel/career.js";

test.use({ serviceWorkers: "block" });
test.describe.configure({ timeout: 90000 });
const read = (page) => page.evaluate(() => window.__pixelRead());
async function seed(page, state = initialPixelState(), raw = null) {
  await page.addInitScript(
    ({ state, key, raw }) => {
      if (sessionStorage.getItem("audit-seeded")) return;
      sessionStorage.setItem("audit-seeded", "yes");
      localStorage.setItem(key, raw ?? JSON.stringify({ state }));
      if (raw) localStorage.setItem(key + "-backup", JSON.stringify({ state }));
    },
    { state, key: SAVE_KEY, raw },
  );
  await page.goto("/pixel.html");
  await expect(page.locator("#loading")).toBeHidden({ timeout: 30000 });
}
const begun = () => {
  const s = initialPixelState();
  s.flags.intro = true;
  s.identity.locked = true;
  return s;
};
async function stored(page, slot = "auto", suffix = "") {
  return page.evaluate(
    async ({ slot, suffix }) => {
      const { createPixelStorage } = await import("/src/pixel/storage.js");
      const storage = await createPixelStorage(localStorage, {
        broadcast: null,
      });
      const result =
        suffix === "raw"
          ? storage.raw(slot)
          : suffix === "backup"
            ? storage.readBackup(slot)
            : storage.read(slot);
      storage.close();
      return result;
    },
    { slot, suffix },
  );
}
async function app(page, id) {
  await page.locator('[data-ui="menu"]').first().click();
  await page.locator('#panel [data-ui="phone"]').click();
  await page.locator("[data-pocket-query]").fill("");
  if (id !== "phone")
    await page.locator(`[data-pixel-app="${id}"]`).last().click();
}

test("corrupt autosaves stay untouched through Escape and reload; explicit recovery preserves raw data", async ({
  page,
}) => {
  const state = begun();
  state.playerName = "可救回的玩家";
  state.life.game.week = 60;
  await seed(page, state, "{broken-save");
  await expect(page.locator('#panel[data-view="recovery"]')).toBeVisible();
  await page.keyboard.press("Escape");
  expect(await stored(page, "auto", "raw")).toBe("{broken-save");
  expect((await stored(page, "auto", "backup")).state.playerName).toBe(
    "可救回的玩家",
  );
  await page.reload();
  await page.locator("[data-storage-recover]").click();
  await expect
    .poll(async () => (await read(page))?.state.playerName)
    .toBe("可救回的玩家");
  await expect(page.locator("#save-status")).toHaveText("● 已儲存");
  await page.reload();
  await expect(page.locator("#loading")).toBeHidden({ timeout: 30000 });
  expect((await read(page)).state.life.game.week).toBe(60);
  expect(await stored(page, "auto", "raw")).toBe("{broken-save");
});

test("failed first saves and overwrites report failure and keep the previous slot", async ({
  page,
}) => {
  await seed(page, begun());
  await page.locator('[data-ui="saves"]').first().click();
  await page.locator('[data-save="1"]').click();
  await expect(page.locator("#toast")).toHaveText("已儲存到位置 1");
  const before = await stored(page, 1);
  await page.evaluate(() => {
    const put = window.IDBObjectStore.prototype.put;
    window.__restorePut = () => {
      window.IDBObjectStore.prototype.put = put;
    };
    window.IDBObjectStore.prototype.put = function (value, key) {
      if (String(key).includes("-slot-"))
        throw new window.DOMException("full", "QuotaExceededError");
      return put.call(this, value, key);
    };
  });
  await page.locator('[data-save="2"]').click();
  await expect(page.locator("#save-status")).toHaveText("暫時無法儲存");
  await expect(page.locator("#toast")).not.toContainText("已儲存");
  expect((await stored(page, 2)).state).toBeNull();
  await page.locator('[data-save="1"]').click();
  await page.locator('[data-confirm-save="1"]').click();
  await expect(page.locator("#toast")).not.toContainText("已更新");
  expect(await stored(page, 1)).toEqual(before);
  await page.evaluate(() => window.__restorePut());
  await page.locator('[data-save="2"]').click();
  await expect(page.locator("#toast")).toHaveText("已儲存到位置 2");
});

test("a stale tab cannot overwrite a newer tab; resuming keeps a backup of the older memory", async ({
  page,
  context,
}) => {
  test.setTimeout(90000);
  await seed(page, begun());
  await expect(page.locator("#save-status")).toHaveText("● 已儲存");
  const other = await context.newPage();
  await other.goto("/pixel.html");
  await expect(other.locator("#loading")).toBeHidden({ timeout: 30000 });
  await resumePixelSave(other);
  await other.locator('[data-ui="profile"]').first().click();
  await other.locator("#real-name-input").fill("新分頁的新進度");
  await other.locator('[data-ui="name"]').click();
  await expect(other.locator("#save-status")).toHaveText("● 已儲存");
  await expect
    .poll(async () => (await stored(page)).state.playerName)
    .toBe("新分頁的新進度");
  await page.evaluate(() => window.dispatchEvent(new window.Event("pagehide")));
  expect((await stored(page)).state.playerName).toBe("新分頁的新進度");
  await expect(page.locator("[data-storage-latest]")).toBeVisible();
  // The active-page overwrite race is verified above. Stop the producer before
  // checking restoration so another periodic save cannot supersede this read.
  await other.close();
  await page.locator("[data-storage-latest]").click();
  // The in-memory state changes before room restoration and its atomic save.
  // Wait for the player-facing completion signal before inspecting the backup.
  await expect(page.locator("#save-status")).toHaveText("● 已儲存", {
    timeout: 30000,
  });
  expect((await read(page)).state.playerName).toBe("新分頁的新進度");
  await expect
    .poll(
      async () => (await stored(page, "transfer", "backup")).state?.playerName,
    )
    .toBe("星途新人");
});

test("a failed latest-save scene load keeps the old page blocked until a successful retry", async ({
  page,
}) => {
  await seed(page, begun());
  await expect(page.locator("#save-status")).toHaveText("● 已儲存");
  await page.evaluate(async () => {
    const next = window.__pixelRead().state;
    next.playerName = next.life.game.realName = "最新旅程";
    next.sceneId = "rehearsal";
    const { createPixelStorage } = await import("/src/pixel/storage.js");
    const writer = await createPixelStorage(localStorage);
    try {
      for (let attempt = 0; attempt < 5; attempt++) {
        if (await writer.write(next)) return;
        if (!writer.conflicted || !(await writer.refresh())) break;
      }
      throw new Error(writer.error);
    } finally {
      writer.close();
    }
  });
  await expect(page.locator("[data-storage-latest]")).toBeVisible();
  const asset = "**/" + ROOMS.rehearsal.asset.replace(/^\.\//, "");
  expect((await stored(page)).state.playerName).toBe("最新旅程");
  await page.route(asset, (route) => route.abort());
  await page.locator("[data-storage-latest]").click();
  await expect(page.locator("#toast")).toContainText("素材載入失敗", {
    timeout: 20000,
  });
  expect((await read(page)).state.playerName).toBe("星途新人");
  await page.evaluate(() => window.dispatchEvent(new window.Event("pagehide")));
  expect((await stored(page)).state.playerName).toBe("最新旅程");
  await expect(page.locator("[data-storage-latest]")).toBeVisible();
  await page.unroute(asset);
  await page.locator("[data-storage-latest]").click();
  await expect(page.locator("#save-status")).toHaveText("● 已儲存", {
    timeout: 20000,
  });
  expect((await read(page)).scene).toBe("rehearsal");
  expect((await stored(page)).state.playerName).toBe("最新旅程");
});

test("Escape keeps an editable creation draft and only the Start button locks identity", async ({
  page,
}) => {
  await seed(page);
  await page.locator('[data-create-field="realName"]').fill("我的草稿");
  await page.keyboard.press("Escape");
  expect((await read(page)).state.identity.locked).toBe(false);
  await expect(page.locator('[data-ui="begin"]')).toBeVisible();
  await expect(page.locator("#save-status")).toHaveText("● 已儲存");
  await page.reload();
  await expect(page.locator('[data-create-field="realName"]')).toHaveValue(
    "我的草稿",
  );
  await page.locator('[data-ui="begin"]').click();
  expect((await read(page)).state.identity.locked).toBe(true);
  expect((await read(page)).state.playerName).toBe("我的草稿");
  await expect(page.locator('[data-onboarding="skip"]')).toBeVisible();
});

test("real IME composition retains its input node and commits exactly one Chinese query", async ({
  page,
  browserName,
}) => {
  test.skip(
    browserName !== "chromium",
    "CDP IME is a Chromium API; composition events are also tested below in every engine.",
  );
  await seed(page, begun());
  await app(page, "phone");
  const input = page.locator("[data-pocket-query]");
  await input.focus();
  await input.evaluate((e) => {
    window.__composingInput = e;
  });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Input.imeSetComposition", {
    text: "工",
    selectionStart: 1,
    selectionEnd: 1,
  });
  await cdp.send("Input.imeSetComposition", {
    text: "工作",
    selectionStart: 2,
    selectionEnd: 2,
  });
  await expect(input).toHaveValue("工作");
  expect(await page.evaluate(() => window.__composingInput.isConnected)).toBe(
    true,
  );
  await cdp.send("Input.insertText", { text: "工作" });
  await expect(input).toHaveValue("工作");
  await expect(page.locator(".pixel-app-library button")).toHaveCount(1);
});

test("composition lifecycle, state bars and mobile weekly cards remain readable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.addInitScript(() =>
    localStorage.setItem(
      "star-game-pixel-preferences-v1",
      JSON.stringify({ fontSize: "large", tutorials: false }),
    ),
  );
  await seed(page, begun());
  await app(page, "phone");
  await page.locator("[data-pocket-query]").evaluate((input) => {
    input.dispatchEvent(
      new window.CompositionEvent("compositionstart", { bubbles: true }),
    );
    input.value = "工作";
    input.dispatchEvent(
      new window.InputEvent("input", { bubbles: true, isComposing: true }),
    );
    if (!input.isConnected)
      throw new Error("Input replaced during composition");
    input.dispatchEvent(
      new window.CompositionEvent("compositionend", {
        bubbles: true,
        data: "工作",
      }),
    );
    input.dispatchEvent(new window.InputEvent("input", { bubbles: true }));
  });
  await expect(page.locator("[data-pocket-query]")).toHaveValue("工作");
  await expect(page.locator(".pixel-app-library button")).toHaveCount(1);
  await page.getByRole("button", { name: "關閉視窗", exact: true }).click();
  await app(page, "stats");
  const bars = await page
    .locator(".body-state-strip i")
    .evaluateAll((nodes) => nodes.map((e) => e.getBoundingClientRect().width));
  expect(bars).toHaveLength(4);
  expect(bars.every((w) => w > 40)).toBe(true);
  await page.getByRole("button", { name: "關閉視窗", exact: true }).click();
  await page.locator('[data-ui="schedule"]').first().click();
  const cards = await page.locator(".week-strip button").evaluateAll((nodes) =>
    nodes.map((e) => ({
      width: e.getBoundingClientRect().width,
      font: parseFloat(getComputedStyle(e.querySelector("span")).fontSize),
    })),
  );
  expect(cards).toHaveLength(7);
  expect(cards.every((c) => c.width >= 100 && c.font >= 14)).toBe(true);
  expect(
    await page
      .locator("#panel")
      .evaluate((e) => e.scrollWidth <= e.clientWidth + 2),
  ).toBe(true);
});

test("all five-year slots, overwrite backups and deletion recovery fit even with full legacy storage", async ({
  page,
}) => {
  test.setTimeout(420000);
  const state = begun();
  state.life = initialLife("five-years-pixel");
  await test.step(
    "simulate all 260 weeks before measuring browser storage",
    async () => {
      for (let week = 1; week <= 260; week++) {
        const l = state.life,
          story = currentStory(l);
        if (story?.event) chooseStory(l, story.choices[0]?.id);
        l.game.eventOutcome = null;
        for (let day = 0; day < 7; day++) {
          const pending = beginDay(l, { id: "rest" });
          if (pending.error) throw Error(pending.error);
          settleDay(l);
          advanceDay(l);
        }
        nextWeek(l);
        // Keep timeout accounting responsive while other browser workers run.
        if (week % 26 === 0) await yieldSimulation();
      }
    },
    { timeout: 360000 },
  );
  await page.goto("/assets/icons/app-icon.svg");
  const result = await test.step(
    "write and verify every slot and recovery copy",
    () =>
      page.evaluate(async (state) => {
        const { createPixelStorage } = await import("/src/pixel/storage.js");
        localStorage.setItem("unrelated-large-data", "x".repeat(4_800_000));
        const storage = await createPixelStorage(localStorage, {
          broadcast: null,
        });
        const results = [];
        for (const slot of ["auto", 1, 2, 3, 4, 5]) {
          results.push(await storage.write(state, slot));
          results.push(await storage.write(state, slot));
        }
        const history = JSON.stringify(state.life.game.history);
        const preserved = [1, 2, 3, 4, 5].every(
          (n) =>
            JSON.stringify(storage.read(n).state.life.game.history) ===
              history && storage.readBackup(n).state.life.game.week === 261,
        );
        results.push(
          await storage.backup(state),
          await storage.remove(5),
          await storage.restoreDeleted(5),
        );
        const week = storage.read(5).state.life.game.week;
        storage.close();
        const reopened = await createPixelStorage(localStorage, {
          broadcast: null,
        });
        const reload = reopened.read(5).state.life.game.endingResult.title;
        reopened.close();
        return {
          results,
          preserved,
          week,
          reload,
          bytes: new TextEncoder().encode(JSON.stringify(state)).length,
        };
      }, state),
    { timeout: 60000 },
  );
  expect(result.results.every(Boolean)).toBe(true);
  expect(result.preserved).toBe(true);
  expect(result.week).toBe(261);
  expect(result.reload).toBe("未完待續");
});

test("five palettes and information panels pass the audited accessibility checks", async ({
  page,
}, info) => {
  test.skip(
    info.project.name !== "desktop",
    "All palette combinations are checked once; responsive behavior runs in every engine.",
  );
  test.setTimeout(90000);
  const { default: axe } = await import("axe-core");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() =>
    localStorage.setItem(
      "star-game-pixel-preferences-v1",
      JSON.stringify({ fontSize: "large", tutorials: false }),
    ),
  );
  await seed(page, begun());
  await page.addScriptTag({ content: axe.source });
  async function audit(label) {
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(
        document
          .getAnimations()
          .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
          .map((a) => a.finished.catch(() => {})),
      );
    });
    const failures = await page.evaluate(async () => {
      const r = await window.axe.run(document, {
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
      });
      return r.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          summary: n.failureSummary,
        })),
      }));
    });
    expect(failures, label).toEqual([]);
  }
  for (const theme of ["cream", "rose", "sage", "lilac", "night"]) {
    await page.locator('[data-ui="menu"]').first().click();
    await page.locator('#panel [data-ui="settings"]').click();
    await page.locator(`button[data-pixel-theme="${theme}"]`).click();
    await audit(theme + " settings");
    await page.getByRole("button", { name: "關閉視窗", exact: true }).click();
    await audit(theme + " home");
    await page.locator('[data-ui="schedule"]').first().click();
    await audit(theme + " schedule");
    await page.getByRole("button", { name: "關閉視窗", exact: true }).click();
  }
  for (const id of ["stats", "people", "creative", "forum", "jobs"]) {
    await app(page, id);
    await audit("night " + id);
    await page.getByRole("button", { name: "關閉視窗", exact: true }).click();
  }
});
