const NEWCOMER_SUBSIDY_END_WEEK = 8;
const NEWCOMER_TRAINING_RATE = 0.7;

export function trainingSubsidyRate(week) {
  return Number(week) <= NEWCOMER_SUBSIDY_END_WEEK
    ? NEWCOMER_TRAINING_RATE
    : Number(week) <= 10 ? 0.8 : Number(week) <= 12 ? 0.9 : 1;
}

export function trainingSubsidyNotice(week) {
  const rate = trainingSubsidyRate(week), next = trainingSubsidyRate(Number(week) + 1);
  if (rate === 1) return "新人培訓補助已結束，目前按原學費計算。";
  return `目前學費 ${Math.round(rate * 10)} 折。前八週七折，第九～十週八折，第十一～十二週九折，第十三週恢復原價。${next !== rate ? `下週將改為${next === 1 ? "原價" : Math.round(next * 10) + "折"}，請預留預算。` : ""}`;
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
