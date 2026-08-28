import { state } from "../core/state.js";
import { SOCIAL_POST_TEMPLATES } from "../data/social.js";
import {
  workOnCreativeProject,
  reviseCreativeProject,
  submitCreativeProject,
  startCreativeProduction,
  releaseCreativeProject,
  sellCreativeRights,
} from "./creative.js";
import { completeCreativeTeamDay } from "./creative-team.js";
import { completeSequelSession } from "./sequel-engine.js";
import { resolveNpcInteraction } from "./npc-interaction-engine.js";
import { managerInteract } from "./manager.js";
import { resolveScheduledJobAudition } from "./job-engine.js";
const COMMENTS = [
  "第一天追蹤！",
  "慢慢來，我們會看著你成長。",
  "今天也辛苦了。",
  "期待看到作品！",
  "這種真誠的更新很加分。",
];
function doSocial(type,payload={}) {
  const t = payload.text?{text:payload.text,label:payload.label||"近況"}:SOCIAL_POST_TEMPLATES[type];
  if (!t) return { ok: false, text: "貼文草稿已失效。" };
  const base = Math.max(4, state.fans + state.fame * 3),
    id = `own-${state.week}-${Date.now()}`;
  state.socialPosts.unshift({
    id,
    text: t.text,
    week: state.week,
    likes: base,
    comments: Array.from(
      { length: Math.min(3, 1 + Math.floor(state.fame / 80)) },
      (_, i) => ({
        name: ["小星星", "路過觀眾", "新人守望者"][i],
        text: COMMENTS[(state.week + i + type.length) % COMMENTS.length],
      }),
    ),
  });
  const fanGain = Math.max(1, Math.min(12, Math.round(2 + state.fame / 70)));
  state.fans += fanGain;
  state.rep.話題度 = Math.min(1000, (state.rep.話題度 || 0) + 2);
  return {
    ok: true,
    text: `「${t.label}」已發布，粉絲＋${fanGain}、話題度＋2。`,
  };
}
export function resolvePersonalTask(task, choice = null) {
  if (!task) return { ok: false, text: "這項個人安排已失效。" };
  if (task.kind === "job_audition")
    return resolveScheduledJobAudition(task, choice);
  if (task.kind === "creative_work") {
    const p = state.creativeProjects?.find(
        (x) => x.id === task.payload.projectId,
      ),
      r =
        p?.status === "rejected"
          ? reviseCreativeProject(p.id)
          : workOnCreativeProject(p?.id);
    return r
      ? {
          ok: true,
          text: `完成《${p.title}》的創作工作；目前完成度 ${p.progress}%・品質 ${p.quality}。`,
        }
      : { ok: false, text: "這份創作目前無法繼續。" };
  }
  if (task.kind === "creative_submit") {
    const r = submitCreativeProject(
      task.payload.projectId,
      task.payload.companyId,
    );
    return r
      ? {
          ok: true,
          text: r.accepted
            ? `${r.company.name}採用了《${r.project.title}》，作品進入正式製作！`
            : `${r.company.name}退回《${r.project.title}》，之後可以修改再投。`,
        }
      : { ok: false, text: "投稿條件已失效。" };
  }
  if (task.kind === "creative_sale") {
    const r = sellCreativeRights(
      task.payload.projectId,
      task.payload.companyId,
    );
    return r
      ? {
          ok: true,
          text: `${r.company.name}以 $${r.value.toLocaleString()} 買下《${r.project.title}》企劃權；成品主導權正式移交。`,
        }
      : { ok: false, text: "洽售條件已失效。" };
  }
  if (task.kind === "creative_production") {
    const p = state.creativeProjects?.find(
        (x) => x.id === task.payload.projectId,
      ),
      r = startCreativeProduction(task.payload.projectId);
    if (r?.error === "budget")
      return {
        ok: false,
        text: `《${r.project.title}》原訂製作規格需要 $${r.cost.toLocaleString()}，但執行當天資金不足。`,
      };
    if (r && p) completeCreativeTeamDay(p, state.week, state.runnerDay);
    return r
      ? {
          ok: true,
          text: `《${r.project.title}》完成一次製作進度，目前 ${r.project.productionProgress}%（${r.project.productionSessions}/${r.project.requiredProductionSessions} 次）；合作團隊檔期同步完成。`,
        }
      : { ok: false, text: "這部作品目前無法進行製作。" };
  }
  if (task.kind === "creative_release") {
    const r = releaseCreativeProject(task.payload.projectId);
    return r
      ? {
          ok: true,
          text: `《${r.project.title}》正式發行！市場評分 ${r.score}、收入＋$${r.revenue.toLocaleString()}、粉絲＋${r.fanGain}。`,
        }
      : { ok: false, text: "這部作品目前還不能發行。" };
  }
  if (task.kind === "sequel_session") {
    const r = completeSequelSession(task.payload.offerId);
    return { ok: r.ok, text: r.text };
  }
  if (task.kind === "npc_interact") return resolveNpcInteraction(task, choice);
  if (task.kind === "manager_interact") {
    const r = managerInteract(task.payload.type, choice);
    return { ok: r.ok, title: r.title, text: r.message };
  }
  if (task.kind === "social_post") return doSocial(task.payload.type,task.payload);
  return { ok: false, text: "未知的個人安排。" };
}
