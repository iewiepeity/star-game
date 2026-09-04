import { titleTag } from "../core/utils.js";
import { state } from "../core/state.js";
import {
  createCreativeProject,
  chooseIndependentProduction,
} from "../logic/creative.js";
import { setCreativeDirection } from "../logic/creative.js";
import {
  scheduleActivity,
  cancelActivity,
} from "../logic/scheduled-activities.js";
import {
  toggleCreativeCollaborator,
  toggleSelfParticipation,
  reserveCreativeTeam,
  cycleCreativeRole,
  setCreativeBudget,
  creativeBudgetCost,
} from "../logic/creative-team.js";
import { INDUSTRY_COMPANIES } from "../data/industry.js";
import { render } from "../render.js";
import { creativeActionState } from "../logic/creative-workflow.js";
function queue(kind, payload, label, load, { reserveTeam = false } = {}) {
  const duplicate = Object.values(state.scheduledActivities || {}).some(
    (a) =>
      a.status === "scheduled" &&
      a.kind === kind &&
      a.payload?.projectId === payload.projectId,
  );
  if (duplicate) {
    state.notice = "這份作品已經有同類行程在排隊了。";
    render();
    return null;
  }
  const r = scheduleActivity(kind, payload, label, load);
  if (r.ok && reserveTeam) {
    const p = state.creativeProjects?.find((x) => x.id === payload.projectId),
      booking = p && reserveCreativeTeam(p, state.week, r.day);
    if (booking && !booking.ok) {
      cancelActivity(r.day);
      state.notice = booking.message;
      render();
      return null;
    }
  }
  state.notice = r.message;
  render();
  return r;
}
export function bindCreative() {
  const titleInput=document.querySelector("#creative-title");
  titleInput?.addEventListener("input",()=>{state.creativeDraftTitle=titleInput.value});
  document.querySelectorAll("[data-creative-new]").forEach(
    (b) =>
      (b.onclick = () => {
        const title = document.querySelector("#creative-title")?.value;
        if (!createCreativeProject(b.dataset.creativeNew, title))
          state.notice = "請先替作品取個名字。";
        else {state.creativeDraftTitle="";state.notice = "企劃已建立；真正創作需要排進本週行程。";}
        render();
      }),
  );
  document.querySelectorAll("[data-creative-work]").forEach(
    (b) =>
      (b.onclick = () => {
        const p = state.creativeProjects?.find(
          (x) => x.id === b.dataset.creativeWork,
        );
        if (!p) {
          state.notice = "作品不存在。";
          render();
          return;
        }
        const availability = creativeActionState(p, "work");
        if (!availability.ok) {
          state.notice = availability.reason;
          render();
          return;
        }
        queue(
          "creative_work",
          { projectId: p.id },
          `${p.status === "rejected" ? "修改" : "創作"}${titleTag(p.title)}`,
          { fatigue: 6, stamina: 6 },
        );
      }),
  );
  document.querySelectorAll("[data-creative-submit]").forEach(
    (b) =>
      (b.onclick = () => {
        const p = state.creativeProjects?.find(
            (x) => x.id === b.dataset.creativeSubmit,
          ),
          company = INDUSTRY_COMPANIES[b.dataset.company];
        if (!p || !company) {
          state.notice = "投稿資料已失效。";
          render();
          return;
        }
        const availability = creativeActionState(p, "route");
        if (!availability.ok) {
          state.notice = availability.reason;
          render();
          return;
        }
        if (!state.discoveredCompanies.includes(company.id)) {
          state.notice = `要先親自去過${company.name}，才能知道他們的投稿窗口。`;
          render();
          return;
        }
        queue(
          "creative_submit",
          { projectId: p.id, companyId: company.id },
          `向${company.name}投稿${titleTag(p.title)}`,
          { fatigue: 3, stamina: 3 },
        );
      }),
  );
  document.querySelectorAll("[data-creative-team]").forEach(
    (b) =>
      (b.onclick = () => {
        const r = toggleCreativeCollaborator(
          b.dataset.creativeTeam,
          b.dataset.npc,
        );
        state.notice = r.message;
        render();
      }),
  );
  document.querySelectorAll("[data-creative-role]").forEach(
    (b) =>
      (b.onclick = () => {
        const role = cycleCreativeRole(b.dataset.creativeRole, b.dataset.npc);
        state.notice = role
          ? `已調整分工為「${role}」。`
          : "目前無法調整分工。";
        render();
      }),
  );
  document.querySelectorAll("[data-creative-budget]").forEach(
    (b) =>
      (b.onclick = () => {
        const r = setCreativeBudget(b.dataset.creativeBudget, b.dataset.tier);
        state.notice = r.message;
        render();
      }),
  );
  document.querySelectorAll("[data-creative-self]").forEach(
    (b) =>
      (b.onclick = () => {
        const own = toggleSelfParticipation(b.dataset.creativeSelf);
        state.notice = own
          ? "這份作品會由你親自參與演出／錄製。"
          : "改為幕後主創，讓合作團隊承擔主要演出或製作。";
        render();
      }),
  );
  document.querySelectorAll("[data-creative-produce]").forEach(
    (b) =>
      (b.onclick = () => {
        const p = state.creativeProjects?.find(
          (x) => x.id === b.dataset.creativeProduce,
        );
        if (!p) return;
        const availability = creativeActionState(p, "produce");
        if (!availability.ok) {
          state.notice = availability.reason;
          render();
          return;
        }
        const cost =
          p.productionSessions === 0 && !p.budgetSpent
            ? creativeBudgetCost(p)
            : 0;
        if (cost && state.money < cost) {
          state.notice = `這個製作規格需要 $${cost.toLocaleString()}，目前資金不足。`;
          render();
          return;
        }
        queue(
          "creative_production",
          { projectId: p.id },
          `製作${titleTag(p.title)}`,
          { fatigue: 10, stamina: 10 },
          { reserveTeam: true },
        );
      }),
  );
  document.querySelectorAll("[data-creative-release]").forEach(
    (b) =>
      (b.onclick = () => {
        const p = state.creativeProjects?.find(
          (x) => x.id === b.dataset.creativeRelease,
        );
        if (p && creativeActionState(p, "release").ok)
          queue("creative_release", { projectId: p.id }, `發行${titleTag(p.title)}`, {
            fatigue: 7,
            stamina: 7,
          });
      }),
  );
}
export function bindCreativeDirections() {
  document.querySelectorAll("[data-creative-direction]").forEach(
    (button) =>
      (button.onclick = () => {
        const result = setCreativeDirection(
          button.dataset.creativeDirection,
          button.dataset.direction,
        );
        state.notice = result.message;
        render();
      }),
  );
}
export function bindCreativeDistribution() {
  document.querySelectorAll("[data-creative-self-produce]").forEach(
    (button) =>
      (button.onclick = () => {
        const result = chooseIndependentProduction(
          button.dataset.creativeSelfProduce,
        );
        state.notice = result.message;
        render();
      }),
  );
  document.querySelectorAll("[data-creative-sell]").forEach(
    (button) =>
      (button.onclick = () => {
        const project = state.creativeProjects?.find(
            (item) => item.id === button.dataset.creativeSell,
          ),
          company = INDUSTRY_COMPANIES[button.dataset.company];
        if (!project || !company) return;
        queue(
          "creative_sale",
          { projectId: project.id, companyId: company.id },
          `前往${company.name}洽售${titleTag(project.title)}`,
          { fatigue: 3, stamina: 3 },
        );
      }),
  );
}
