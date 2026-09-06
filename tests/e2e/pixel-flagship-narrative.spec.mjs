import { test, expect } from "@playwright/test";
import { initialPixelState } from "../../src/pixel/model.js";
import { initialLife, withCore } from "../../src/pixel/life.js";
import { ROOMS } from "../../src/pixel/data.js";
import { JOB_BY_ID } from "../../src/data/jobs.js";
import { jobStoryline } from "../../src/data/job-storylines.js";
import { ensureJobState } from "../../src/logic/job-engine.js";

test.use({ serviceWorkers: "block" });
const read = (page) => page.evaluate(() => window.__pixelRead());
const job = JOB_BY_ID.J061;
const story = jobStoryline(job.id);
const decisionId = `flagship-choice:${job.id}`;
const chosenFlag = `flagship:${job.id}:breakthrough`;

async function through(page, selector) {
  for (let i = 0; i < 40; i++) {
    if (await page.locator(selector).first().isVisible()) return;
    const next = page.locator("#career-page-next");
    if (await next.isVisible()) await next.click();
    else await page.waitForTimeout(150);
  }
  await expect(page.locator(selector).first()).toBeVisible({ timeout: 20000 });
}

async function start(page) {
  const s = initialPixelState();
  s.flags.intro = true;
  s.sceneId = "home";
  s.position = { ...ROOMS.home.entry };
  s.life = initialLife("flagship-narrative-backlog");
  s.life.speed = 16;
  // J061's first permitted workday is Wednesday; this fixture starts there.
  s.life.day = job.workDays[0];
  s.life.plan = Array.from({ length: 7 }, () => ({ id: "rest" }));
  s.life.plan[s.life.day] = { id: "career_job", jobId: job.id };
  withCore(s.life, (game) => {
    game.money = 100000;
    game.stats = Object.fromEntries(Object.keys(game.stats).map((k) => [k, 500]));
    game.hidden.洞察 = 700;
    game.hidden.抗壓 = 700;
    Object.assign(ensureJobState(job.id), {
      stage: "active", completedSessions: 3, remainingSessions: 3,
      deadlineWeek: game.week + 8, auditionChoice: "steady",
      npcCast: [], npcScheduleSlots: [], flagshipDecisionQueued: true,
    });
    game.schedule[s.life.day] = "job_session";
    game.scheduledJobIds[s.life.day] = job.id;
    game.eventPresentedWeek = game.week;
    game.queuedEvents = Array.from({ length: 3 }, (_, i) => ({
      dueWeek: game.week + 1, queuedWeek: game.week, expiresWeek: null,
      source: "待處理消息", priority: 120,
      event: {
        id: `flagship-fixture-backlog:${i}`, kind: "職涯事件",
        persistent: true, title: `已在等候的消息 ${i + 1}`,
        text: "這則一般消息應繼續等待，不應取代當天製作必須作出的決定。",
        choices: [{ id: "read", label: "讀完", effect: { mood: 1 } }],
      },
    }));
    // A pre-update save may already carry this decision behind other events.
    game.queuedEvents.push({
      dueWeek: game.week + 1, queuedWeek: game.week, expiresWeek: null,
      source: "旗艦作品", priority: 110,
      event: {
        id: decisionId, kind: "職涯事件", persistent: true,
        title: `${job.title}・先前排入的製作決策`, text: story.production[1].text,
        choices: ["protect", "breakthrough", "signature"].map((id) => ({
          id, ...story.flagshipChoices[id],
          effects: [
            { flag: `flagship:${job.id}:${id}` },
            ...(id === "signature"
              ? [{ rep: "業界評價", value: 9 }, { rep: "可信度", value: 5 }]
              : [{ rep: id === "protect" ? "可信度" : "話題度", value: id === "protect" ? 5 : 7 }]),
          ],
        })),
      },
    });
  });
  await page.addInitScript((s) => {
    const key = "star-game-pixel-phase-one-v1";
    if (!localStorage.getItem(key))
      localStorage.setItem(key, JSON.stringify({ state: s }));
  }, s);
  await page.goto("/pixel.html");
  await expect(page.locator("#loading")).toBeHidden();
}

function settlementSnapshot(saved) {
  const life = saved.state.life;
  return {
    sessions: life.game.activeJobs[job.id].completedSessions,
    remaining: life.game.activeJobs[job.id].remainingSessions,
    ledger: life.ledger.length,
    choiceFlags: life.game.eventFlags.filter((flag) => flag === chosenFlag).length,
    decisions: life.game.eventHistory.filter((event) => event.id === decisionId).length,
    topic: life.game.rep.話題度,
    money: life.game.money,
  };
}

test("a queued story backlog cannot delay a flagship's on-set choice; reload settles the work once", async ({ page }, info) => {
  test.setTimeout(60000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await start(page);
  const before = settlementSnapshot(await read(page));
  await page.locator('[data-ui="menu"]').first().click();
  await page.locator('#panel [data-ui="schedule"]').click();
  await page.locator('#panel [data-life="today"]').click();
  await page.locator("[data-start]").click();
  await through(page, '[data-career-decision="breakthrough"]');

  for (const id of ["protect", "breakthrough", "signature"])
    await expect(page.locator(`[data-career-decision="${id}"]`))
      .toContainText(story.flagshipChoices[id].label);
  expect((await read(page)).state.life.pending.phase).toBe("decision");
  expect(settlementSnapshot(await read(page))).toEqual(before);
  expect((await read(page)).state.life.game.queuedEvents
    .filter((entry) => entry.event.id.startsWith("flagship-fixture-backlog:"))).toHaveLength(3);
  await page.screenshot({ path: info.outputPath("flagship-three-choices.png") });

  await page.reload();
  await expect(page.locator("#loading")).toBeHidden();
  await through(page, '[data-career-decision="breakthrough"]');
  expect(settlementSnapshot(await read(page))).toEqual(before);
  await page.locator('[data-career-decision="breakthrough"]').click();
  await through(page, '#panel [data-life="advance"]');
  const after = settlementSnapshot(await read(page));
  expect(after).toEqual({
    ...before, sessions: 4, remaining: 2, ledger: 1,
    choiceFlags: 1, decisions: 1, topic: before.topic + 7,
  });
  const resolved = (await read(page)).state.life.game;
  expect(resolved.eventHistory.find((event) => event.id === decisionId).choice).toBe("breakthrough");
  expect([resolved.activeEvent, ...resolved.eventQueue, ...resolved.queuedEvents]
    .filter(Boolean).some((entry) => entry.event.id === decisionId)).toBe(false);
  expect(resolved.queuedEvents
    .filter((entry) => entry.event.id.startsWith("flagship-fixture-backlog:"))).toHaveLength(3);

  await page.reload();
  await expect(page.locator("#loading")).toBeHidden();
  await page.getByRole("button", { name: "查看成果", exact: true }).click();
  await through(page, '#panel [data-life="advance"]');
  expect(settlementSnapshot(await read(page))).toEqual(after);
  await expect(page.locator("[data-career-decision]")).toHaveCount(0);
  await page.locator('#panel [data-life="advance"]').click();
  expect((await read(page)).state.life.day).toBe(job.workDays[0] + 1);
  expect(settlementSnapshot(await read(page))).toEqual(after);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});
