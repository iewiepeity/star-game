import { placeArt } from "./place-art.js";
import { state } from "../core/state.js";
import {
  CREATIVE_TYPES,
  CREATIVE_DIRECTIONS,
  CREATIVE_DIRECTION_STORIES,
} from "../logic/creative.js";
import {
  eligibleCreativeCollaborators,
  CREATIVE_BUDGETS,
} from "../logic/creative-team.js";
import { INDUSTRY_LIST } from "../data/industry.js";
import { NPCS } from "../data/npcs.js";
import { esc, money } from "../core/utils.js";
import { creativeActionState } from "../logic/creative-workflow.js";
const STATUS = {
  draft: "創作中",
  ready: "可投稿",
  rejected: "退件待修改",
  contracted: "已簽約",
  production: "製作中",
  ready_release: "待發行",
  released: "已發行",
  sold: "企劃已售出",
};
const CREATIVE_META = {
  song: { icon: "♫", note: "寫詞、作曲與聲音製作" },
  script: { icon: "▤", note: "角色、場景與完整敘事" },
  show: { icon: "◉", note: "節目定位、流程與主持企劃" },
};
const phase = (p) =>
  ["released", "sold"].includes(p.status)
    ? 6
    : p.status === "ready_release"
      ? 5
      : ["contracted", "production"].includes(p.status)
        ? 4
        : p.status === "ready"
          ? 2
          : p.status === "rejected"
            ? 2
            : 1;
function teamPanel(p) {
  if (!creativeActionState(p, "team").ok)
    return "";
  const eligible = eligibleCreativeCollaborators(p),
    selected = new Set(p.team || []),
    budget = CREATIVE_BUDGETS[p.budgetTier || "standard"],
    budgetAction = creativeActionState(p, "budget"),
    projectId = esc(p.id);
  return `<section class="creative-team"><header><span>PRODUCTION SETUP</span><b>製作團隊與規格</b></header><div class="creative-self"><span>玩家參與方式</span><button data-creative-self="${projectId}">${p.selfParticipation !== false ? "✓ 親自參與" : "幕後主創"}</button></div><div class="creative-budget">${Object.entries(
    CREATIVE_BUDGETS,
  )
    .map(
      ([id, b]) =>
        `<button ${budgetAction.ok ? "" : "disabled"} class="${(p.budgetTier || "standard") === id ? "active" : ""}" data-creative-budget="${projectId}" data-tier="${esc(id)}" aria-describedby="creative-budget-reason-${projectId}"><b>${esc(b.label)}</b><small>${money(b.cost)}</small></button>`,
    )
    .join(
      "",
    )}</div><p class="creative-team-note" id="creative-budget-reason-${projectId}">${esc(budgetAction.reason || budget.note)}${p.budgetSpent ? `・已投入 ${money(p.budgetSpent)}` : ""}</p><div class="creative-collaborators">${eligible.length ? eligible.map((n) => `<button class="${selected.has(n.id) ? "active" : ""}" data-creative-team="${projectId}" data-npc="${esc(n.id)}">${selected.has(n.id) ? "✓ " : ""}<img class="creative-person-head" src="${NPCS[n.id]?.head}" alt="">${esc(n.name)}<small>${esc(n.field)} Lv.${n.level}</small></button>`).join("") : `<p>目前沒有關係與專業都適合的合作 NPC。多認識業界人士後會出現在這裡。</p>`}</div>${selected.size ? `<div class="creative-roles">${[...selected].map((id) => `<button data-creative-role="${projectId}" data-npc="${esc(id)}">${esc(NPCS[id]?.name || id)}：${esc(p.roleAssignments?.[id] || "待分工")} ↻</button>`).join("")}</div>` : ""}</section>`;
}
function actionArea(p, companies) {
  const projectId = esc(p.id);
  if (creativeActionState(p, "route").ok)
    return `<div class="creative-route-choice"><header><b>決定作品接下來的命運</b><small>每條路的收益、控制權與風險都不同。</small></header><button class="creative-independent" data-creative-self-produce="${projectId}"><b>自己拍／自己製作</b><small>保留完整權利，增加一次製作並自行承擔成本</small></button><div class="creative-company-routes">${companies.map((c) => `<article><b>${esc(c.name)}</b><button data-creative-submit="${projectId}" data-company="${esc(c.id)}">提案共同製作</button><button data-creative-sell="${projectId}" data-company="${esc(c.id)}">直接販售企劃</button></article>`).join("")}</div></div>`;
  if (creativeActionState(p, "work").ok)
    return `<div class="creative-actions"><button data-creative-work="${projectId}">${p.status === "rejected" ? "重新修改" : "安排一天繼續創作"} →</button></div>`;
  if (creativeActionState(p, "produce").ok)
    return `<div class="creative-actions"><button data-creative-produce="${projectId}">安排製作工作 →</button></div>`;
  if (creativeActionState(p, "release").ok)
    return `<div class="creative-actions"><button data-creative-release="${projectId}">安排正式發行 →</button></div>`;
  return "";
}
function projectCard(p) {
  const def = CREATIVE_TYPES[p.type],
    meta = CREATIVE_META[p.type],
    directions = CREATIVE_DIRECTIONS[p.type],
    direction = directions[p.direction] || Object.values(directions)[0],
    editable = ["draft", "ready", "rejected"].includes(p.status),
    companies = INDUSTRY_LIST.filter(
      (c) =>
        c.type === def.companyType ||
        (p.type === "script" && c.type === "電視公司"),
    ),
    company = INDUSTRY_LIST.find((c) => c.id === p.acceptedCompanyId),
    step = phase(p);
  const story = CREATIVE_DIRECTION_STORIES[p.type]?.[p.direction], projectId = esc(p.id);
  return `<article class="creative-card"><header><i>${meta.icon}</i><div><span>${def.label}</span><h3>${esc(p.title)}</h3></div><em>${STATUS[p.status] || p.status}</em></header><div class="creative-direction"><span>創作方向</span><div>${Object.entries(
    directions,
  )
    .map(
      ([id, item]) =>
        `<button class="${p.direction === id ? "active" : ""}" data-creative-direction="${projectId}" data-direction="${esc(id)}" ${editable ? "" : "disabled"}><b>${esc(item.label)}</b><small>${esc(item.note)}</small></button>`,
    )
    .join(
      "",
    )}</div><p>目前核心：<b>${esc(direction.label)}</b>・${esc(direction.note)}</p></div>${story ? `<section class="creative-story-map"><div><small>草稿會怎麼不同</small><p>${esc(story.development)}</p></div><div><small>製作現場</small><p>${esc(story.production)}</p></div><div><small>發行後</small><p>${esc(story.release)}</p></div><footer><b>優勢：${esc(story.strength)}</b><em>風險：${esc(story.risk)}</em></footer></section>` : ""}<div class="creative-phase" data-scroll-key="creative-phase">${["草稿", "投稿", "簽約", "製作", "發行", "完成"].map((x, i) => `<span class="${i < step ? "done" : ""}"><i></i>${x}</span>`).join("")}</div><div class="creative-meters"><div><span>創作完成度 <b>${p.progress}%</b></span><i><b style="width:${p.progress}%"></b></i></div><div><span>作品品質 <b>${p.quality}</b></span><i><b style="width:${Math.min(100, p.quality / 10)}%"></b></i></div><div><span>修改次數</span><strong>${p.revisions} 次</strong></div></div>${["contracted", "production", "ready_release", "released"].includes(p.status) ? `<div class="creative-production-status"><span>合作方 <b>${esc(p.distributionMode === "independent" ? "自主製作" : company?.name || "-")}</b></span><span>製作進度 <b>${p.productionProgress || 0}%</b></span><span>工作次數 <b>${p.productionSessions || 0}/${p.requiredProductionSessions || def.baseSessions}</b></span></div>` : ""}${teamPanel(p)}${p.status === "released" ? `<div class="creative-release-result"><b>${"★".repeat(p.finalGrade?.stars || 1)} ${p.finalGrade?.grade || "-"}級・市場評分 ${p.marketScore}</b><span>${esc(direction.label)}・${p.distributionMode === "independent" ? "自主發行／完整持有" : "公司共同製作"}・收入 ${money(p.revenue || 0)}</span><p>${esc(story?.release || "作品正式與觀眾見面。")}</p></div>` : ""}${p.status === "sold" ? `<div class="creative-release-result sold"><b>${p.finalGrade?.grade || "-"}級企劃・售價 ${money(p.saleValue || 0)}</b><span>權利售予 ${esc(company?.name || "公司")}；後續成品不再由你主導</span></div>` : ""}${actionArea(p, companies)}${p.submissions?.length ? `<p class="creative-history">${p.submissions.map((s) => `${INDUSTRY_LIST.find((c) => c.id === s.companyId)?.name}：${s.result === "accepted" ? "採用" : "退件"}`).join("・")}</p>` : ""}</article>`;
}
export function creativeApp() {
  const projects = state.creativeProjects || [],
    released = projects.filter((p) => p.status === "released").length;
  return `<div class="creative-page"><header class="creative-hero"><div><span>CREATIVE STUDIO</span><h2>把靈感做成真正的作品</h2><p>每次創作、投稿與製作都會占用一天。從草稿到正式發行，每一步都會留下履歷。</p></div><dl><div><b>${projects.length}</b><small>進行企劃</small></div><div><b>${released}</b><small>已發行</small></div><div><b>${state.discoveredCompanies.length}</b><small>投稿窗口</small></div></dl></header><nav class="creative-workflow">${["01 靈感草稿", "02 完成創作", "03 產業投稿", "04 簽約製作", "05 正式發行", "06 市場回響"].map((x) => `<span>${x}</span>`).join("")}</nav><section class="creative-launcher"><header><span>NEW PROJECT</span><h3>建立新的原創企劃</h3><p>先替作品命名，再選擇要開始的創作類型。</p></header><label class="creative-title-field" for="creative-title"><span>作品名稱</span><input id="creative-title" type="text" maxlength="30" autocomplete="off" value="${esc(state.creativeDraftTitle||"")}" placeholder="輸入作品名稱……"></label><div class="creative-type-grid">${Object.entries(
    CREATIVE_TYPES,
  )
    .map(([id, d]) => {
      const m = CREATIVE_META[id];
      return `<button data-creative-new="${id}">${placeArt(/song|demo|lyric|music/.test(id)?"recording":/script|film/.test(id)?"library":"cafe")}<span><b>${d.label}</b><small>${m.note}</small></span><em>開始 →</em></button>`;
    })
    .join(
      "",
    )}</div></section><section class="creative-projects"><header><span>MY PROJECTS</span><h3>作品企劃室</h3></header>${projects.length ? projects.map(projectCard).join("") : `<div class="creative-empty"><i>✎</i><b>桌上還沒有任何企劃</b><p>從一首 Demo、一份劇本或節目企劃開始。先不用完美，先讓它存在。</p></div>`}</section></div>`;
}
