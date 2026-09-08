import { trainingSubsidyNotice } from "../logic/economy.js";
import { esc } from "../core/utils.js";
import { costOf, definition, DAY_NAMES } from "./life.js";
import { canUndoRoutine } from "./planner-tools.js";
import { careerCost } from "./career.js";

export function remainingPlanCost(life) {
  const start = life.day + (life.pending?.phase === "result" ? 1 : 0);
  const productionBudgets = new Set();
  return life.plan.slice(start).reduce((sum, assignment) => {
    let cost = costOf(life, assignment);
    const task = assignment.id === "career_task" && life.game.scheduledActivities[assignment.taskId];
    if (task?.kind === "creative_production") {
      const id = task.payload.projectId;
      if (productionBudgets.has(id)) cost -= careerCost(life, assignment);
      productionBudgets.add(id);
    }
    return sum + cost;
  }, 0);
}

export function plannerContext(life, selectedDay) {
  const selected = definition(life, life.plan[selectedDay])?.label || "未安排";
  const today = definition(life, life.plan[life.day])?.label || "未安排";
  const cost = remainingPlanCost(life);
  const warnings = [cost > life.game.money ? "目前現金不足以支付餘下已排行程；尚未取得的收入不計入。" : "", life.game.fatigue > 80 ? "目前疲勞偏高，建議在高負荷行動前安排休息。" : ""].filter(Boolean);
  return `<section class="planner-context" aria-label="目前排程位置"><div role="status" aria-live="polite"><b>正在安排${DAY_NAMES[selectedDay]} · ${esc(selected)}</b><small>今天是${DAY_NAMES[life.day]} · ${esc(today)}；選擇行程只改排程，不會開始執行。</small></div><button data-routine-undo ${canUndoRoutine(life) ? "" : "disabled"}>復原剛才安排</button></section><div class="planner-budget"><p class="tiny-note" data-training-subsidy>${esc(trainingSubsidyNotice(life.game.week))}</p><p>餘下已排費用 $${cost.toLocaleString()} · 現金 $${life.game.money.toLocaleString()}</p><small>收入依實際完成結果計算，這裡不預先當作已入帳。</small>${warnings.map(text => `<p role="status">${esc(text)}</p>`).join("")}</div>`;
}

// 僅取實際結算中已提供給玩家的成果；不讀隱藏關係數值或推測事件。
export function resultHighlights(results = []) {
  const items = [];
  for (const result of results) {
    if (result.success === false) continue;
    for (const moment of result.moments || []) {
      if (moment.title && moment.outcome) items.push({ title: moment.title, text: moment.outcome, priority: /突破|作品|戀愛|約定|關係|里程碑/.test(`${moment.kind || ""} ${moment.title}`) ? 2 : 0 });
    }
  }
  const gains = new Map();
  for (const result of results) for (const gain of result.gains || []) {
    if (gain.amount > 0) gains.set(gain.name, (gains.get(gain.name) || 0) + gain.amount);
  }
  for (const [name, amount] of [...gains].sort((a, b) => b[1] - a[1])) items.push({ title: `${name}有了進步`, text: `這段時間的實際成長累計 +${amount}。`, priority: 1 });
  return items.sort((a, b) => b.priority - a.priority).filter((item, index) => items.findIndex(other => other.title === item.title && other.text === item.text) === index).slice(0, 3).map(({ title, text }) => ({ title, text }));
}
export function highlightsMarkup(results, title) {
  const items = resultHighlights(results);
  return items.length ? `<section class="journey-highlights" aria-label="${esc(title)}"><h3>${esc(title)}</h3>${items.map(item => `<article><b>${esc(item.title)}</b><p>${esc(item.text)}</p></article>`).join("")}</section>` : "";
}
