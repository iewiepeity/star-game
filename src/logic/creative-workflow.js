export const CREATIVE_WORKFLOW = Object.freeze({
  direction: { statuses: ["draft", "rejected", "ready"], reason: "作品進入製作後就不能再改核心方向。" },
  work: { statuses: ["draft", "rejected"], reason: "目前不需要再安排草稿創作。" },
  route: { statuses: ["ready"], reason: "作品完成草稿後才能決定投稿、販售或自主製作。" },
  team: { statuses: ["contracted", "production", "ready_release"], reason: "作品進入正式製作後才能調整團隊。" },
  budget: { statuses: ["contracted", "production"], reason: "只有尚未完成的製作可以調整預算。" },
  produce: { statuses: ["contracted", "production"], reason: "目前不是可安排製作的階段。" },
  release: { statuses: ["ready_release"], reason: "完成所有製作工作後才能正式發行。" },
});

export function creativeActionState(project, action) {
  const rule = CREATIVE_WORKFLOW[action];
  if (!project) return { ok: false, reason: "作品資料不存在。" };
  if (!rule) return { ok: false, reason: "未知的創作流程動作。" };
  if (!rule.statuses.includes(project.status)) return { ok: false, reason: rule.reason };
  if (action === "budget" && project.productionSessions > 0) return { ok: false, reason: "製作開始後不能再更改預算規格。" };
  return { ok: true, reason: "" };
}
