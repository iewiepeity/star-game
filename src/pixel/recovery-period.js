// Hospitalization reserves the following week and the remainder of this one.
// Reuse the saved deadline so this also applies after loading older saves.
export function recoveryRequired(life, week = life.game.week) {
  const end = life.game.forcedRestWeek;
  return end === week || (end === life.game.week + 1 && week === life.game.week);
}
