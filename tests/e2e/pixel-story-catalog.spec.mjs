import { test, expect } from "@playwright/test";
import { NPC_ARCS } from "../../src/data/npc-arc-events.js";
import { NPC_LONGFORM_CHAPTERS } from "../../src/data/longform-content.js";
import { initialPixelState, SAVE_KEY } from "../../src/pixel/model.js";
import { recordMeeting } from "../../src/pixel/life.js";
import { HIDDEN_ROUTE_CHAPTERS } from "../../src/logic/hidden-route.js";
test.use({ serviceWorkers: "block" });
test.describe.configure({ mode: "parallel" });
const read = (page) => page.evaluate(() => window.__pixelRead?.());

// Each route plays all eight existing chapters through the rendered choice.
// This catches missing textures / casts / unwalkable staging that data checks
// cannot see. Representative interruption tests live in pixel-stories.spec.
for (const npcId of [...Object.keys(NPC_ARCS), "silver_pc"]) {
  test(`all eight chapters on ${npcId}'s route render and resolve in the pixel world`, async ({
    page,
  }, info) => {
    test.setTimeout(120000);
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const chapters =
      npcId === "silver_pc"
        ? HIDDEN_ROUTE_CHAPTERS.map((c) => ({
            ...JSON.parse(JSON.stringify(c)),
            id: `silver-route-${c.id}`,
            requires: { runMin: 2 },
          }))
        : [
            ...NPC_ARCS[npcId].map((c) => ({
              ...c,
              id: `npc-arc-${npcId}-${c.id}`,
            })),
            ...NPC_LONGFORM_CHAPTERS[npcId].map((c) => ({
              ...c,
              id: `npc-long:${npcId}:${c.id}`,
            })),
          ];
    for (const [index, chapter] of chapters.entries()) {
      const s = initialPixelState();
      if (npcId === "silver_pc") s.life.game.runCount = 2;
      s.flags.intro = true;
      s.life.speed = 16;
      s.knownPeople = [npcId];
      recordMeeting(s.life, npcId);
      s.life.game.activeEvent = {
        source: "人物主線",
        event: {
          ...chapter,
          npcId,
          kind: "人物事件",
          choices: chapter.choices.map((c) => ({
            ...c,
            ...(c.effect ? { effect: { ...c.effect, npc: npcId } } : {}),
            followUp: null,
          })),
        },
      };
      if (!index) {
        await page.addInitScript(
          ({ s, key }) => {
            const next = sessionStorage.getItem("pixel-story-test-next");
            if (next) {
              localStorage.setItem(key, next);
              sessionStorage.removeItem("pixel-story-test-next");
            } else if (!localStorage.getItem(key))
              localStorage.setItem(key, JSON.stringify({ state: s }));
          },
          { s, key: SAVE_KEY },
        );
        await page.goto("/pixel.html");
      } else {
        await page.evaluate(
          ({ s }) =>
            sessionStorage.setItem(
              "pixel-story-test-next",
              JSON.stringify({ state: s }),
            ),
          { s, key: SAVE_KEY },
        );
        await page.reload();
      }
      await expect(page.locator("#loading")).toBeHidden();
      await page.locator("[data-stage-start]").click();
      for (let step = 0; step < 40; step++) {
        if (await page.locator("[data-stage-choice]").first().isVisible())
          break;
        const next = page
          .locator("#career-page-next, [data-stage-next], [data-stage-skip]")
          .first();
        if (await next.isVisible()) await next.click();
        else await page.waitForTimeout(100);
      }
      await expect(
        page.locator("[data-stage-choice]").first(),
        chapter.id,
      ).toBeVisible();
      const before = await read(page),
        actor = before.npcs.find((n) => n.id === npcId);
      expect(before.story.phase, chapter.id).toBe("beat");
      expect(actor?.status, chapter.id).toBe("故事現場");
      expect(actor.visible, chapter.id).toBe(true);
      expect(
        Math.hypot(before.player.x - actor.x, before.player.y - actor.y),
        chapter.id,
      ).toBeGreaterThanOrEqual(62);
      if (index === 7)
        await page.screenshot({ path: info.outputPath(npcId + ".png") });
      await page.locator("[data-stage-choice]").first().click();
      await expect
        .poll(
          async () => (await read(page)).state.life.game.eventHistory.length,
        )
        .toBe(1);
      const after = await read(page);
      expect(after.state.life.game.eventHistory[0].id).toBe(chapter.id);
      expect(after.state.life.game.relationships[npcId].trust).toBeGreaterThan(
        before.state.life.game.relationships[npcId].trust,
      );
      expect(after.state.life.day).toBe(0);
      expect(after.state.life.ledger).toHaveLength(0);
      expect(after.playerCount).toBe(1);
    }
    expect(errors).toEqual([]);
  });
}
