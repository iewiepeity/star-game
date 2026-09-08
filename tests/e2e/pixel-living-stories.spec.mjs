import { revealControl } from "./reveal-control.mjs";
import { test, expect } from "@playwright/test";
import { initialPixelState } from "../../src/pixel/model.js";
import { RELEASE_NOTES } from "../../src/pixel/release-notes.js";
import { recordMeeting } from "../../src/pixel/life.js";
import { resumePixelSave as waitForPixelSaveReady } from "./pixel-save-ready.mjs";

test.use({ serviceWorkers: "block" });
const read = page => page.evaluate(() => window.__pixelRead().state.life);
async function start(page) {
  const seed = initialPixelState();
  seed.flags.intro = true;
  seed.playerName = "夏知星";
  seed.life.game.week = 30;
  recordMeeting(seed.life, "sufei");
  seed.knownPeople = ["sufei"];
  Object.assign(seed.life.game.relationships.sufei, { closeness: 55, trust: 55, affection: 25 });
  Object.assign(seed.life.game, { currentAgencyId: "starlight", selectedAgencyId: "starlight", agencyContractEndWeek: 80, agencyJoinedWeek: 20, agencyStage: "signed" });
  await page.addInitScript(s => {
    if (!sessionStorage.getItem("living-stories-seed")) {
      localStorage.setItem("star-game-pixel-phase-one-v1", JSON.stringify({ state: s }));
      sessionStorage.setItem("living-stories-seed", "true");
    }
  }, seed);
  await page.goto("/pixel.html");
  await expect(page.locator("#loading")).toBeHidden({ timeout: 20000 });
  await waitForPixelSaveReady(page);
}
async function menu(page, id) {
  await page.locator('[data-ui="menu"]').first().click();
  await page.locator(`#panel [data-ui="${id}"]`).click();
}
async function app(page, id) {
  await menu(page, "phone");
  await page.locator(`[data-pixel-app="${id}"]`).last().click();
}

test("人物偏好、界線、故事暫放與公司協議可操作並隨存檔保存", async ({ page }) => {
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  await start(page);
  const before = await read(page);
  await app(page, "people");
  await page.locator('[data-chat-open="sufei"]').first().click();
  await page.locator('[data-select-npc="sufei"]').click();
  await page.locator('.npc-profile-tabs [data-npc-profile-tab="memories"]').click();
  await page.locator('[data-character-memory="sufei"][data-memory-value="tea"]').click();
  await expect(page.locator('[data-character-memory="sufei"][data-memory-value="tea"]')).toHaveAttribute("aria-pressed", "true");
  await page.locator('[data-character-memory="sufei"][data-memory-value="advance"]').click();
  await page.locator('[data-character-promise="sufei"]').click();
  await expect(page.locator('.character-memory')).toContainText("沒有截止日");
  await page.locator('[data-personal-story-pause="sufei"]').click();
  await expect(page.locator('[data-personal-story-resume="sufei"]')).toBeVisible();
  await expect(page.locator('.personal-story-panel')).toContainText("暫放");
  await expect.poll(async () => (await read(page)).game.personalStories.sufei.status).toBe("paused");
  await page.getByRole("button", { name: "關閉視窗" }).click();
  await app(page, "agency");
  await page.locator('summary').filter({ hasText: "談休息與行程緩衝" }).click();
  await page.locator('[data-agency-agreement="rest"]').click();
  await expect(page.locator('.agency-cooperation')).toContainText("已談妥的安排");
  await expect(page.locator('[data-agency-agreement="rest"]')).toBeDisabled();
  const after = await read(page);
  expect(after.day).toBe(before.day);
  expect(after.plan).toEqual(before.plan);
  expect(after.game.money).toBe(before.game.money);
  await page.reload();
  await expect(page.locator("#loading")).toBeHidden({ timeout: 20000 });
  await waitForPixelSaveReady(page);
  const saved = await read(page);
  expect(saved.game.characterMemories.sufei.boundaries.notice).toBe("advance");
  expect(saved.game.characterMemories.sufei.preferences.drink).toBe("tea");
  expect(saved.game.characterMemories.sufei.promises[0].status).toBe("pending");
  expect(saved.game.personalStories.sufei.status).toBe("paused");
  expect(saved.game.agencyAgreements.records[0].kind).toBe("rest");
  await app(page, "people");
  await page.locator('[data-select-npc="sufei"]').first().click();
  await page.locator('.npc-profile-tabs [data-npc-profile-tab="memories"]').click();
  await page.locator('[data-personal-story-resume="sufei"]').click();
  await expect(page.locator('[data-personal-story-pause="sufei"]')).toBeVisible();
  expect(errors).toEqual([]);
});

test("五項敘事偏好與更新紀錄在設定內可用，重新載入仍保留", async ({ page }) => {
  await start(page);
  await menu(page, "settings");
  const prefs = { textMode: "concise", skipReadRoutine: "true", romanceFrequency: "low", conflictIntensity: "gentle", storyReminders: "false" };
  for (const [key, value] of Object.entries(prefs)) {
    const button = page.locator(`[data-narrative-pref="${key}"][data-value="${value}"]`);
    await revealControl(button);
    await button.click();
    await expect(button).toHaveAttribute("aria-pressed", "true");
  }
  await revealControl(page.locator('[data-ui="release-notes"]'));
  await page.locator('[data-ui="release-notes"]').click();
  await expect(page.locator(".release-entry").first()).toContainText(`v${RELEASE_NOTES[0].version}`);
  await expect(page.locator(".release-entry").first()).toContainText(RELEASE_NOTES[0].title);
  await expect(page.locator(".release-entry").filter({ hasText: "v0.20.0" })).toContainText("提前邀約");
  await page.reload();
  await expect(page.locator("#loading")).toBeHidden({ timeout: 20000 });
  await waitForPixelSaveReady(page);
  expect((await read(page)).game.narrativeSettings).toEqual({ textMode: "concise", skipReadRoutine: true, romanceFrequency: "low", conflictIntensity: "gentle", storyReminders: false });
  await menu(page, "settings");
  await revealControl(page.locator('[data-life="narrative-history"]'));
  await page.locator('[data-life="narrative-history"]').click();
  await expect(page.locator('#panel')).toContainText("日常");
});
