import { state } from "../core/state.js";
import { esc } from "../core/utils.js";
import { NPCS } from "../data/npcs.js";
import { careerPhase } from "../logic/career-phases.js";
import { publicOpinionLabel } from "../logic/reputation-engine.js";
import { placeArt } from "./place-art.js";
import { workArtFor } from "../data/work-art.js";
const story = (title, text, tag = "") =>
  `<details class="world-row"><summary><span>✧ ${esc(tag)}</span><b>${esc(title)}</b></summary><p>${esc(text)}</p></details>`;
export function worldApp() {
  const phase = careerPhase(),
    market = state.worldMarket || {},
    manager = state.managerState;
  const careers = Object.entries(state.npcCareers || {})
    .filter(([id]) => NPCS[id])
    .sort((a, b) => (b[1].momentum || 0) - (a[1].momentum || 0))
    .slice(0, 6);
  const works = [...(state.completedWorks || [])].reverse().slice(0, 4),
    news = (state.industryNews || []).slice(0, 6),
    living = [...(state.livingWorldFeed || [])].reverse().slice(0, 8),
    signal = [...(state.worldSignalHistory || [])].reverse()[0];
  const rivals = Object.entries(state.competitors || state.rivals || {}).slice(
    0,
    5,
  );
  return `<div class="world-page"><header class="world-visual-hero">${placeArt("tv_company")}<div><span>娛樂週報・第 ${state.week} 週</span><h2>${esc(market.headline || phase.label)}</h2><small>${esc(phase.goal)}</small></div></header><nav class="world-quick-cards"><button data-open-app="stats">♡ 身體狀態 <b>健康 ${state.health}・疲勞 ${state.fatigue}</b></button><button data-open-app="social">✧ 公眾近況 <b>${publicOpinionLabel()}</b></button><button data-open-app="agency">◇ 經紀團隊 <b>${manager ? esc(manager.name) : "尚未簽約"}</b></button></nav><section class="world-news-columns"><article><h3>本週焦點</h3>${news.length ? news.map((n) => story(n.title, n.body, "圈內消息")).join("") : '<p class="world-empty">新的作品與消息，會在生活中慢慢出現。</p>'}${living.map((item) => story(item.title || "後續", item.text || "", `第 ${item.week} 週・${item.type || "世界回聲"}`)).join("")}${signal ? story("世界對你的反應", signal.text) : ""}</article><article><h3>圈內人物的日常</h3><div class="world-people">${careers.map(([id, c]) => `<details class="world-row"><summary class="world-person"><img src="${NPCS[id].head}" alt="${esc(NPCS[id].name)}" loading="lazy"><b>${esc(NPCS[id].name)}</b><small>${c.trend === "up" ? "上升中" : c.trend === "down" ? "調整步調" : "持續前進"}</small></summary><p>${esc(c.currentProject || c.lastUpdate || "正在自己的道路上工作")}</p>${state.knownPeople.includes(id) ? `<button data-scene-npc="${id}">打開人物檔案</button>` : ""}</details>`).join("") || '<p class="world-empty">這座城市也有其他人的生活。</p>'}</div></article></section><section class="world-work-wall"><h3>作品的後續</h3>${
    works.length
      ? works
          .map((w) => {
            const art = workArtFor(w);
            return `<button data-open-app="log">${art ? `<img src="${art.src}" alt="${esc(w.title)}" loading="lazy">` : placeArt("cinema")}<span>${esc(w.title)}</span><small>${esc(w.lifecycle?.status || w.grade || "發行中")}</small></button>`;
          })
          .join("")
      : '<p class="world-empty">完成作品後，海報會留在這裡。</p>'
  }</section><details class="world-backstage"><summary>競爭、品牌與年度方向</summary><p>${esc(phase.pressure || phase.world || "")}</p>${rivals.map(([id, r]) => story(r.name || NPCS[id]?.name || id, `聲勢 ${Math.round(r.momentum || r.fame || 0)}`, r.trend || r.status || "觀望")).join("")}<div class="brand-strip">${Object.entries(
    state.brandRelations || {},
  )
    .slice(0, 5)
    .map(
      ([id, v]) =>
        `<span>${esc(id)} <b>${typeof v === "number" ? v : v.score || 0}</b></span>`,
    )
    .join("")}</div></details></div>`;
}
