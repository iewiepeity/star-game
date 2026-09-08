import { test, expect } from "@playwright/test";
import { initialPixelState } from "../../src/pixel/model.js";
import { tickWorkEchoes } from "../../src/logic/work-echoes.js";
import { revealControl } from "./reveal-control.mjs";

// Every test owns a fresh Playwright browser context. These fixtures are made
// here in Node; no existing browser profile or player's save is inspected.
function releasedSongFixture() {
  const saved = initialPixelState();
  saved.flags.intro = true;
  saved.playerName = "作品回響測試";
  const game = saved.life.game;
  Object.assign(game, { week: 53, money: 54321, fans: 765, fame: 42 });
  game.creativeProjects = ["雨停之後", "寄給明天", "最後一盞燈"].map((title, index) => ({
    id: `echo-ui-${index + 1}`, type: "song", direction: "heart", title,
    status: "released", createdWeek: 1, releaseWeek: 1, category: "歌曲",
    progress: 100, quality: 850, revisions: 2, submissions: [],
    productionProgress: 100, productionSessions: 4, requiredProductionSessions: 4,
    acceptedCompanyId: null, marketScore: 88, revenue: 18000,
    team: [], roleAssignments: {}, selfParticipation: true,
    budgetTier: "standard", budgetSpent: 0, distributionMode: "independent",
    finalGrade: { grade: "A", stars: 4 }, storyHistory: [],
  }));
  game.completedWorks = game.creativeProjects.map(project => ({
    id: `creative-${project.id}`, creativeProjectId: project.id,
    title: project.title, category: "歌曲", original: true,
    creativeType: "song", direction: "heart", quality: 85, marketScore: 88,
    completedWeek: 1, completedYear: 1, stars: 4, grade: "A",
    npcCast: [], awards: [], selfParticipation: true,
    distributionMode: "independent",
  }));
  // Generating authored records must not issue release rewards or perform a day.
  const economy = rewards(game);
  tickWorkEchoes(game);
  expect(rewards(game)).toEqual(economy);
  expect(game.workEchoes.records).toHaveLength(9);
  for (const stage of ["opening", "weeks", "anniversary"]) {
    const records = game.workEchoes.records.filter(record => record.stage === stage);
    expect(new Set(records.map(record => record.copyId)).size).toBe(3);
    const withoutWorkNames = records.map(record => {
      const work = game.completedWorks.find(item => item.id === record.workId);
      return record.text.replaceAll(work.title, "{work}");
    });
    expect(new Set(withoutWorkNames).size).toBe(3);
  }
  return saved;
}

function rewards(game) {
  return {
    money: game.money, fans: game.fans, fame: game.fame,
    awards: structuredClone(game.awards),
    workAwards: game.completedWorks.map(work => ({ id: work.id, awards: structuredClone(work.awards) })),
  };
}

async function readGame(page) {
  return page.evaluate(() => window.__pixelRead().state.life.game);
}

async function start(page, saved) {
  await page.addInitScript(saved => {
    const key = "star-game-pixel-phase-one-v1";
    const seeded = "star-game-work-echo-ui-fixture-seeded";
    // A once-per-test-tab marker prevents reload from hiding a lost save by
    // installing the fixture again. The legacy entry's redirect is covered too.
    if (!sessionStorage.getItem(seeded)) {
      if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({ state: saved }));
      sessionStorage.setItem(seeded, "true");
    }
  }, saved);
  await page.goto("/pixel.html");
  await expect(page.locator("#loading")).toBeHidden();
  await expect(page.locator('[data-ui="menu"]').first()).toBeVisible();
}

async function openApp(page, id) {
  await page.locator('[data-ui="menu"]').first().click();
  await page.locator('#panel [data-ui="phone"]').click();
  await page.locator(`[data-pixel-app="${id}"]`).last().click();
  await expect(page.locator(`.pixel-app[data-app="${id}"]`)).toBeVisible();
}

async function assertTimeline(page, project, records, { exerciseCollapse = false } = {}) {
  const card = page.locator(`[data-creative-project="${project.id}"]`);
  const toggle = card.locator(`[data-creative-toggle="${project.id}"]`);
  if (exerciseCollapse && await toggle.getAttribute("aria-expanded") === "true") {
    await toggle.click();
    await expect(card.locator(".creative-card-details")).toBeHidden();
  }
  if (await toggle.getAttribute("aria-expanded") === "false") await toggle.click();
  await expect(card.locator(".creative-card-details")).toBeVisible();
  const timeline = card.locator(".work-echo-timeline");
  const bodies = timeline.locator(":scope > article > p:first-of-type");
  await revealControl(bodies.first());
  await expect(timeline).toHaveAttribute("open", "");
  await expect(bodies).toHaveText(records.map(record => record.text));
  for (const body of await bodies.all()) await expect(body).toBeVisible();
}

test("completed same-direction works show three distinct full echo chapters and retain them after reload", async ({ page }) => {
  const saved = releasedSongFixture();
  const expected = saved.life.game;
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await start(page, saved);
  await openApp(page, "creative");
  for (const project of expected.creativeProjects) {
    await assertTimeline(page, project, expected.workEchoes.records.filter(record => record.workId === `creative-${project.id}`), { exerciseCollapse: true });
  }
  expect(rewards(await readGame(page))).toEqual(rewards(expected));
  await page.reload();
  await expect(page.locator("#loading")).toBeHidden();
  const restored = await readGame(page);
  expect(restored.workEchoes.records).toEqual(expected.workEchoes.records);
  expect(rewards(restored)).toEqual(rewards(expected));
  await openApp(page, "creative");
  const project = expected.creativeProjects[1];
  await assertTimeline(page, project, expected.workEchoes.records.filter(record => record.workId === `creative-${project.id}`));
  expect(errors).toEqual([]);
});

test("a work echo forum thread shows its public body and three authored replies without awarding anything on reload", async ({ page }) => {
  const saved = releasedSongFixture();
  const expected = saved.life.game;
  const record = expected.workEchoes.records.find(item => item.workId === "creative-echo-ui-2" && item.stage === "anniversary");
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await start(page, saved);
  await openApp(page, "forum");
  await page.locator(`[data-forum-thread="${record.id}"]`).click();
  const assertThread = async () => {
    const detail = page.locator(".forum-thread-detail");
    await expect(detail.locator("h2")).toHaveText(record.publicTitle);
    await expect(detail.locator(":scope > p")).toHaveText(record.publicText);
    await expect(detail.locator(":scope > p")).toBeVisible();
    const replies = page.locator(".forum-replies > article > div > p");
    await expect(replies).toHaveText(record.replies);
    await expect(replies).toHaveCount(3);
    for (const reply of await replies.all()) await expect(reply).toBeVisible();
    // The private creator's reflection is not substituted for the public post.
    expect(record.publicText).not.toBe(record.text);
    await expect(detail).not.toContainText(record.text);
  };
  await assertThread();
  const opened = await readGame(page);
  expect(opened.forumReadIds).toContain(record.id);
  expect(rewards(opened)).toEqual(rewards(expected));
  await page.reload();
  await expect(page.locator("#loading")).toBeHidden();
  const restored = await readGame(page);
  expect(restored.forumReadIds).toContain(record.id);
  expect(restored.workEchoes.records).toEqual(expected.workEchoes.records);
  expect(rewards(restored)).toEqual(rewards(expected));
  await openApp(page, "forum");
  // The selected read-only thread itself is saved by the existing app flow.
  await assertThread();
  expect(errors).toEqual([]);
});
