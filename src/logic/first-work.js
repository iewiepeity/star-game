import { newcomerStep } from "./city-progression.js";
export function firstWorkJourney(game) {
  const work = game.completedWorks?.[0];
  if (work)
    return {
      stage: "completed",
      label: "第一份作品，已經留下",
      text: `《${work.title}》已寫進履歷。回到房間，也能看見這段星途的起點。`,
      app: "log",
      action: "翻開作品履歷",
      work,
    };
  const records = Object.values(game.activeJobs || {});
  const active = records.find((r) => r.stage === "active");
  if (active)
    return {
      stage: "production",
      label: "把第一份作品完成",
      text: `還有 ${active.remainingSessions} 次拍攝／製作，第 ${active.deadlineWeek} 週截止。先保留指定工作日。`,
      app: "planner",
      action: "安排正式工作",
    };
  if (records.some((r) => r.stage === "passed"))
    return {
      stage: "contract",
      label: "你的第一份合約到了",
      text: "試鏡已通過。確認合約後，就能把正式工作排進這週。",
      app: "planner",
      action: "查看待簽合約",
    };
  if (
    records.some((r) =>
      ["applied", "audition", "audition_scheduled"].includes(r.stage),
    )
  )
    return {
      stage: "audition",
      label: "為第一次試鏡留出時間",
      text: "在工作信箱確認資格與試鏡日期；一般公開試鏡練習不會代替這份工作的正式試鏡。",
      app: "jobs",
      action: "確認試鏡安排",
    };
  const first = newcomerStep(game);
  if (first) return first;
  return {
    stage: "discover",
    label: "尋找第一個真正的機會",
    text: game.currentAgencyId
      ? "經紀人已能推薦工作。選一份適合現在能力的通告，準備正式試鏡。"
      : "先到產業據點查看公開徵選。未簽公司也能尋找適合新人的工作。",
    app: game.currentAgencyId ? "jobs" : "map",
    action: game.currentAgencyId ? "查看工作機會" : "去城市找徵選",
  };
}
