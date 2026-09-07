import { HOME_RECIPES } from "../data/home-life.js";
import { homeVisitScheduleKey, initialHomeLife } from "../core/home-state.js";

export function homePlanReason(life, assignment, day, planning = false) {
  const game = life.game,
    home = game.homeLife || initialHomeLife();
  if (assignment.id === "home_craft" && planning) {
    const recipe = HOME_RECIPES[assignment.recipeId];
    if (!recipe) return "請先選擇配方";
    const available = { ...home.materials };
    for (let i = life.day; i < 7; i++)
      if (
        i !== day &&
        life.plan[i]?.id === "home_craft" &&
        !(i === life.day && life.pending?.phase === "result")
      ) {
        const needs = HOME_RECIPES[life.plan[i].recipeId]?.needs || {};
        for (const [id, amount] of Object.entries(needs))
          available[id] = (available[id] || 0) - amount;
      }
    if (
      Object.entries(recipe.needs).some(
        ([id, amount]) => (available[id] || 0) < amount,
      )
    )
      return "材料已留給其他製作日，請先補貨或取消安排";
  }
  if (assignment.id !== "home_host") return "";
  if (
    life.plan.some(
      (a, i) =>
        i !== day &&
        i >= life.day &&
        a.id === "home_host" &&
        a.npcId === assignment.npcId,
    )
  )
    return "這週已經約好到家裡相處，請先取消原來的日期";
  if (
    (game.npcSchedules?.[assignment.npcId] || []).some(
      (slot) =>
        slot.week === game.week &&
        slot.day === day &&
        slot.status !== "released" &&
        slot.jobId !== homeVisitScheduleKey(game.week, day),
    )
  )
    return "對方這天已有約定，請換一天";
  return "";
}

export function releaseHomeDay(life, day) {
  const key = homeVisitScheduleKey(life.game.week, day);
  for (const slots of Object.values(life.game.npcSchedules || {}))
    for (const slot of slots)
      if (slot.jobId === key && slot.status === "reserved")
        slot.status = "released";
}

export function reserveHomeDay(life, assignment, day) {
  releaseHomeDay(life, day);
  if (assignment.id !== "home_host") return;
  life.game.npcSchedules ||= {};
  const slots = (life.game.npcSchedules[assignment.npcId] ||= []);
  const reservation = {
    jobId: homeVisitScheduleKey(life.game.week, day),
    week: life.game.week,
    day,
    status: "reserved",
    label: "在家作客",
    external: true,
    location: "home",
  };
  const previous = slots.find((slot) => slot.jobId === reservation.jobId);
  if (previous) Object.assign(previous, reservation);
  else slots.push(reservation);
}

export function repairHomeSchedules(life) {
  for (const [npcId, slots] of Object.entries(life.game.npcSchedules || {}))
    for (const slot of slots) {
      if (!slot.jobId?.startsWith("pixel-home:") || slot.status !== "reserved")
        continue;
      const assignment = life.plan[slot.day];
      if (
        slot.week !== life.game.week ||
        slot.day < life.day ||
        assignment?.id !== "home_host" ||
        assignment.npcId !== npcId
      )
        slot.status = "released";
      else slot.location = "home";
    }
}
