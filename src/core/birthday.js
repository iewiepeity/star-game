const MONTH_DAYS = Object.freeze([
  31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31,
]);

export function birthDayLimit(month) {
  const safeMonth = Math.max(1, Math.min(12, Number(month) || 1));
  return MONTH_DAYS[safeMonth - 1];
}

export function normalizeBirthday(month, day) {
  const safeMonth = Math.max(1, Math.min(12, Number(month) || 1));
  return {
    month: safeMonth,
    day: Math.max(1, Math.min(birthDayLimit(safeMonth), Number(day) || 1)),
  };
}
