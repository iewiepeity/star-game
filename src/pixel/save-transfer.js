import { initialPixelState, validatePixelState } from "./model.js";
import { assertGameState } from "../core/save-schema.js";
import { parseImportedSave } from "../core/persistence.js";
import { withCore } from "./core-bridge.js";
import { assignmentForAction } from "./planner-tools.js";
import { adoptCoreSchedule, closeCareerWeek } from "./career.js";
import { evaluateWeeklyTask } from "../logic/weekly-task.js";
import { AVATARS } from "../data/wardrobe.js";
import { ROOMS } from "./data.js";
export function exportPixelSave(state) {
  const valid = validatePixelState(state);
  assertGameState(valid.life.game);
  return JSON.stringify(
    {
      game: "star-game-pixel",
      version: 1,
      exportedAt: new Date().toISOString(),
      state: valid,
    },
    null,
    2,
  );
}
export function migrateOriginalSave(game) {
  const s = initialPixelState();
  s.life.game = structuredClone(game);
  // Normalize original defaults without replacing its RNG, records or resources.
  withCore(s.life, () => {});
  const g = s.life.game;
  s.avatarId = AVATARS[g.avatarId] ? g.avatarId : "raven";
  s.outfitId = g.outfitId;
  s.playerName = (g.stageName || g.realName || g.name || "星途新人").slice(
    0,
    16,
  );
  s.identity = {
    gender: AVATARS[s.avatarId].gender,
    locked: true,
    changes: [],
  };
  s.flags.intro = true;
  s.knownPeople = [...g.knownPeople];
  s.visited = [
    ...new Set([
      "home",
      ...Object.values(g.visitedLocationsByWeek)
        .flat()
        .filter((id) => ROOMS[id]),
    ]),
  ];
  s.life.plan = g.schedule.map((action, i) =>
    assignmentForAction(action, g.freeLocations[i]),
  );
  adoptCoreSchedule(s.life, 0);
  const results = g.weekResults || [];
  const completed = results
    .filter((r) => Number.isInteger(r.dayIndex))
    .map((r) => r.dayIndex);
  s.life.day = Math.min(
    7,
    Math.max(0, completed.length ? Math.max(...completed) + 1 : results.length),
  );
  s.life.ledger = results.map((r, i) => ({
    id: `week-${g.week}-day-${r.dayIndex ?? i}`,
    week: g.week,
    day: r.dayIndex ?? i,
    label: r.action || "原版行動",
    assignment: s.life.plan[r.dayIndex ?? i] || { id: "rest" },
    deltas: {},
    gains: [],
    notes: [r.text || r.result || ""],
    presentation: null,
  }));
  if (game.screen === "summary") s.life.day = 7;
  if (s.life.day === 7) {
    const prior = g.history.find((h) => h.week === g.week);
    const reward = prior
      ? prior.weeklyTask || { money: prior.reward || 0, met: false }
      : withCore(s.life, () => evaluateWeeklyTask());
    const memory =
      prior?.memory || (prior ? null : closeCareerWeek(s.life, reward));
    s.life.weekSummary = {
      week: g.week,
      results: s.life.ledger,
      reward,
      memory,
    };
  }
  Object.assign(s.life.game, {
    screen: "game",
    runnerPaused: true,
    appOpen: null,
    npcInvitation: null,
  });
  s.life.auto = false;
  s.life.pending = null;
  return validatePixelState(s);
}
export function parsePixelTransfer(text) {
  if (typeof text !== "string" || text.length > 16_000_000)
    throw new Error("存檔超過 16 MB，或格式不正確");
  const raw = JSON.parse(text);
  if (raw.game === "star-game-pixel") {
    if (raw.version !== 1) throw new Error("這份存檔來自較新的像素版本");
    assertGameState(raw.state?.life?.game);
    return { state: validatePixelState(raw.state), source: "像素版" };
  }
  return {
    state: migrateOriginalSave(parseImportedSave(text)),
    source: "原版",
  };
}
export function newRun(previous) {
  const next = initialPixelState();
  for (const k of ["unlockedAchievements", "endingHistory"])
    next.life.game[k] = structuredClone(previous.life.game[k] || []);
  if (
    previous.life.game.endingResult &&
    !next.life.game.endingHistory.some(
      (r) =>
        r.run === previous.life.game.runCount &&
        r.endingId === previous.life.game.endingResult.endingId,
    )
  )
    next.life.game.endingHistory.push({
      run: previous.life.game.runCount || 1,
      week: previous.life.game.week,
      endingId: previous.life.game.endingResult.endingId,
    });
  next.life.game.runCount = (previous.life.game.runCount || 1) + 1;
  return next;
}
