// 畫面層：能力資料 App——21 項公開能力、隱藏特質（只顯示「尚待觀察」，不外露數值）與娛樂圈評價。
import{ABILITY_GROUPS,HIDDEN_TRAITS}from"../data/abilities.js";
import{state}from"../core/state.js";
import{width}from"../core/utils.js";

export function statsApp(){const best=Object.entries(state.stats).sort((a,b)=>b[1]-a[1]).slice(0,3);return `<div class="inside-page"><div class="inside-title"><div><span>ABILITIES</span><h2>能力資料</h2></div><p>目前最高：${best.map(([n,v])=>`${n} ${v}`).join("・")}</p></div><div class="stats-columns">${Object.entries(ABILITY_GROUPS).map(([g,names])=>`<section><h3>${g}</h3>${names.map(n=>`<div class="stat-row"><span>${n}</span><i><b style="width:${width(state.stats[n])}%"></b></i><strong>${state.stats[n]}<small>/1000</small></strong></div>`).join("")}</section>`).join("")}</div><div class="hidden-traits"><h3>隱藏特質</h3><p>實際數值不公開，會透過通告、活動、事件選項與 NPC 反應逐漸顯露。</p><div class="hidden-grid">${[...HIDDEN_TRAITS,"運氣"].map(n=>`<span>${n}<b>尚待觀察</b></span>`).join("")}</div></div><div class="rep-section"><h3>娛樂圈評價</h3><div class="hidden-grid">${Object.entries(state.rep).map(([n,v])=>`<span>${n}<b>${v}</b></span>`).join("")}</div></div></div>`}
