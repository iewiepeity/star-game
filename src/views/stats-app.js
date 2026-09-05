import { playerLookCard } from "./player-look.js";
// 畫面層：能力資料 App——21 項公開能力、隱藏特質（只顯示「尚待觀察」，不外露數值）與娛樂圈評價。
import { ABILITY_GROUPS, HIDDEN_TRAITS } from "../data/abilities.js";
import { state } from "../core/state.js";
import { effectiveStat, outfitBonus, width } from "../core/utils.js";

export function statsApp() {
  const best = Object.keys(state.stats)
    .map((n) => [n, effectiveStat(n)])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  return `<div class="inside-page stats-app"><div class="inside-title"><div><span>ABILITIES</span><h2>能力資料</h2></div><p>目前最高：${best.map(([n, v]) => `${n} ${v}`).join("・")}</p></div>${playerLookCard({ editable: true })}<div class="body-state-strip">${[
    ["健康", state.health],
    ["心情", state.mood],
    ["體力", state.stamina],
    ["疲勞", state.fatigue],
  ]
    .map(
      ([label, value]) =>
        `<span>${label}<b>${value}</b><i><em style="width:${Math.max(0, Math.min(100, value))}%"></em></i></span>`,
    )
    .join(
      "",
    )}</div><div class="outfit-stat-note">♢ 顯示數值已包含目前服裝加成；更換服裝後會立即重新計算。</div><div class="stats-columns">${Object.entries(
    ABILITY_GROUPS,
  )
    .map(
      ([g, names], index) =>
        `<details ${index === 0 ? "open" : ""}><summary>${g}</summary>${names
          .map((n) => {
            const total = effectiveStat(n),
              bonus = outfitBonus(n);
            return `<div class="stat-row"><span>${n}${bonus ? `<em>服裝＋${bonus}</em>` : ""}</span><i><b style="width:${width(total)}%"></b></i><strong>${total}<small>/1000</small></strong></div>`;
          })
          .join("")}</details>`,
    )
    .join(
      "",
    )}</div><details class="hidden-traits"><summary>隱藏特質</summary><p>實際數值不公開，會透過通告、活動、事件選項與 NPC 反應逐漸顯露。</p><div class="hidden-grid">${[...HIDDEN_TRAITS, "運氣"].map((n) => `<span>${n}<b>尚待觀察</b></span>`).join("")}</div></details><details class="rep-section"><summary>娛樂圈評價</summary><div class="hidden-grid">${Object.entries(
    state.rep,
  )
    .map(([n, v]) => `<span>${n}<b>${v}</b></span>`)
    .join("")}</div></details></div>`;
}
