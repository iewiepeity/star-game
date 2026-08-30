const NEWCOMER_SUBSIDY_END_WEEK = 8;
const NEWCOMER_TRAINING_RATE = 0.7;

export function trainingSubsidyRate(week) {
  return Number(week) <= NEWCOMER_SUBSIDY_END_WEEK
    ? NEWCOMER_TRAINING_RATE
    : 1;
}

export function effectiveActionCost(action, week) {
  const base = Math.max(0, Number(action?.cost) || 0);
  if (action?.type !== "train") return base;
  return Math.round(base * trainingSubsidyRate(week));
}

export function newcomerSubsidyActive(week) {
  return trainingSubsidyRate(week) < 1;
}

export function reliefGigAvailable(game) {
  return (
    (Number(game?.money) || 0) < 1500 &&
    !(game?.flags || []).some((flag) => flag?.label === "新人緊急周轉")
  );
}
