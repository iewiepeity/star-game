// Shared by the classic runner and the pixel world's daily transactions.
import { trainingSkill, recordTrainingPractice } from "./training-narrative.js";
import { ACTIONS } from "../data/actions.js";
import {
  applyActivityLoad,
  performanceMultiplier,
} from "./condition-engine.js";
import { effectiveActionCost } from "./economy.js";
export function routineGains(game, gains, roll, multiplier = 1) {
  return (gains || []).map(([name, min, max]) => {
    const amount = Math.max(
      1,
      Math.round(
        (roll(min, max) + (game.focus === "growth" ? 1 : 0)) * multiplier,
      ),
    );
    const before = game.stats[name] || 0;
    game.stats[name] = Math.min(1000, before + amount);
    return { name, amount: game.stats[name] - before };
  });
}
export function routineRest(game) {
  const reduced = Math.min(game.fatigue, 18);
  game.fatigue -= reduced;
  game.stamina = Math.min(100, game.stamina + 24);
  game.mood = Math.min(100, game.mood + 3);
  game.health = Math.min(100, game.health + 3);
  return reduced;
}
export function routineTraining(game, id, roll) {
  const action = ACTIONS[id],
    multiplier = performanceMultiplier("training", game);
  const beforeSkill = trainingSkill(id, game);
  const cost = effectiveActionCost(action, game.week);
  applyActivityLoad({ ...action, cost }, game);
  const gains = routineGains(game, action.gains, roll, multiplier);
  game.trainingSessionsCompleted = (game.trainingSessionsCompleted || 0) + 1;
  recordTrainingPractice(game, id, beforeSkill, gains, multiplier);
  return { cost, gains, multiplier };
}
