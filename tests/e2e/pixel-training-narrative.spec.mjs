import { test, expect } from "@playwright/test";
import { initialPixelState } from "../../src/pixel/model.js";
import { initialLife, beginDay, settleDay } from "../../src/pixel/life.js";
import { SCHEDULE_EVENTS } from "../../src/data/schedule-events.js";
import { routineNarrativeId } from "../../src/logic/narrative-preferences.js";
import { NPCS } from "../../src/data/npcs.js";

test.use({serviceWorkers:"block"});
test.setTimeout(60000);
const read = page => page.evaluate(() => window.__pixelRead());
async function start(page, configure) {
  const s = initialPixelState(); s.flags.intro = true; s.playerName = "夏知星";
  // This scenario covers read/unread routine playback. A clock-based seed can
  // also draw an important life event, which correctly interrupts auto mode.
  s.life = initialLife("read-rest-unread-training");
  s.life.game.money = 100000; s.life.game.pixelPrologueActive = false; s.life.speed = 16;
  configure(s);
  await page.addInitScript(state => {
    if (!sessionStorage.getItem("narrative-seeded")) {
      localStorage.setItem("star-game-pixel-phase-one-v1", JSON.stringify({state}));
      sessionStorage.setItem("narrative-seeded", "true");
    }
  }, s);
  await page.goto("/pixel.html");
  await expect(page.locator("#loading")).toBeHidden({timeout:30000});
}

test("concise story reader expands original text while keeping final choices and complete saved record", async ({page}) => {
  const errors = []; page.on("pageerror", e => errors.push(e.message));
  await start(page, s => {
    beginDay(s.life, {id:"vocal"});
    const result = settleDay(s.life);
    result.presentation = {portrait:NPCS.jiqing.portrait,title:"課後的練習回顧",context:"訓練室"};
    s.life.game.narrativeSettings = {...s.life.game.narrativeSettings,textMode:"concise"};
    s.life.game.activeEvent = null; s.life.game.eventOutcome = null; s.life.game.eventQueue = [];
  });
  await expect(page.locator("#career-text-expand")).toHaveText("閱讀完整文本");
  await expect(page.locator('[data-life="advance"]')).toBeVisible();
  const saved = (await read(page)).state.life.pending.result;
  expect(saved.moments[0].text).toContain("課間小記");
  expect((await read(page)).state.life.game.eventHistory.at(-1).text).toBe(saved.moments[0].text);
  await page.locator("#career-text-expand").click();
  await expect(page.locator("#career-text-expand")).toHaveText("回到精簡");
  let displayed = "";
  for (let i=0; i<20; i++) {
    displayed += await page.locator("#dialogue .speech > p:not(.story-context)").innerText();
    if (!(await page.locator("#career-page-next").isVisible())) break;
    await page.locator("#career-page-next").click();
  }
  expect(displayed).toContain("老師先記下今天的起點");
  expect(displayed).toContain("課間小記");
  await expect(page.locator('[data-life="advance"]')).toBeVisible();
  expect((await read(page)).state.life.pending.result.moments[0].text).toBe(saved.moments[0].text);
  expect(errors).toEqual([]);
});

test("auto skips an already read rest but stops at unread training after both days settle once", async ({page}) => {
  const errors = []; page.on("pageerror", e => errors.push(e.message));
  await start(page, s => {
    s.life.plan[0] = {id:"rest"}; s.life.plan[1] = {id:"vocal"};
    s.life.game.routineNarrativeHistory = SCHEDULE_EVENTS.rest.map(routineNarrativeId);
    s.life.game.narrativeSettings = {...s.life.game.narrativeSettings,skipReadRoutine:true};
  });
  const before = (await read(page)).state.life.game.money;
  await page.locator("#auto-control").click();
  await expect.poll(async () => (await read(page)).state.life.day, {timeout:20000}).toBe(1);
  await expect.poll(async () => (await read(page)).state.life.pending?.phase, {timeout:30000}).toBe("result");
  const l = (await read(page)).state.life;
  expect(l.auto).toBe(false);
  expect(l.ledger).toHaveLength(2);
  expect(l.ledger[0].moments[0].readBefore).toBe(true);
  expect(l.ledger[1].moments[0].readBefore).toBe(false);
  expect(l.game.trainingSessionsCompleted).toBe(1);
  expect(l.game.trainingNarrativeProgress.vocal.sessions).toBe(1);
  expect(l.game.money).toBeLessThan(before);
  await expect(page.locator(".daily-moment")).toBeVisible();
  expect(await page.locator(".daily-moment").innerText()).toContain("入門課題");
  const original = l.pending.result.moments[0].text;
  await page.reload(); await expect(page.locator("#loading")).toBeHidden();
  expect((await read(page)).state.life.game.trainingNarrativeProgress.vocal.sessions).toBe(1);
  expect((await read(page)).state.life.pending.result.moments[0].text).toBe(original);
  expect(errors).toEqual([]);
});
