import { state } from "../core/state.js";
import { esc, money } from "../core/utils.js";
import { CREATOR_FORMATS, CREATOR_TOPICS, CREATOR_INVESTMENTS } from "../data/creator-content.js";
import { creatorUnlocked } from "../logic/creator.js";

function pickers(items, selected, attribute) {
  return Object.entries(items).map(([id, item]) => `<button data-creator-${attribute}="${id}" aria-pressed="${selected === id}" class="${selected === id ? "active" : ""}"><b>${esc(item.label)}</b>${item.cost != null ? `<small>${item.cost ? money(item.cost) : "免費"}・品質 ${item.quality >= 0 ? "+" : ""}${item.quality}</small>` : ""}</button>`).join("");
}
function videoCard(video) {
  return `<article class="creator-video rarity-${video.rarity}"><header><span>${esc(video.rarityLabel)}</span><small>第 ${video.week} 週</small></header><h3>${esc(video.title)}</h3><p>${esc(video.formatLabel)}・${esc(video.topicLabel)}</p><div><b>品質 ${video.quality}</b><em>${video.grade}・${esc(video.gradeLabel)}</em></div><footer><span>▶ ${video.views.toLocaleString()}</span><span>追蹤＋${video.followers.toLocaleString()}</span><span>${money(video.revenue)}</span>${video.viral ? "<strong>🔥 爆紅</strong>" : ""}</footer></article>`;
}

export function creatorApp() {
  if (!creatorUnlocked()) return `<div class="creator-locked"><i>Ⅱ</i><h2>第二輪人生尚未開始</h2><p>完成任意五年結局後，創作者中心才會永久開放。</p></div>`;
  const profile = state.creatorProfile || { followers: 24, loyalty: 20, reputation: 50, totalViews: 0, totalRevenue: 0, level: 1 };
  return `<div class="creator-page"><header class="creator-hero"><div><span>NEW GAME＋ CREATOR ROUTE</span><h2>${esc(state.name)}的個人頻道</h2><p>鏡頭也是舞台。正式內容會占用一天行程，成品擁有獨立品質與稀有度。</p></div><strong>頻道 Lv.${profile.level}</strong></header><section class="creator-stats"><div><small>追蹤者</small><b>${profile.followers.toLocaleString()}</b></div><div><small>累積觀看</small><b>${profile.totalViews.toLocaleString()}</b></div><div><small>粉絲黏著</small><b>${profile.loyalty}</b></div><div><small>頻道口碑</small><b>${profile.reputation}</b></div><div><small>累積收益</small><b>${money(profile.totalRevenue)}</b></div></section><section class="creator-studio"><h3>規劃下一支內容</h3><label>內容形式</label><div class="creator-options">${pickers(CREATOR_FORMATS, state.creatorFormat, "format")}</div><label>題材方向</label><div class="creator-options">${pickers(CREATOR_TOPICS, state.creatorTopic, "topic")}</div><label>製作規格</label><div class="creator-options investment">${pickers(CREATOR_INVESTMENTS, state.creatorInvestment, "investment")}</div><button class="main-btn full" data-creator-schedule>排入本週拍攝行程 →</button>${state.creatorNotice ? `<p class="creator-notice">${esc(state.creatorNotice)}</p>` : ""}</section><section class="creator-library"><header><div><span>CONTENT LIBRARY</span><h3>頻道作品庫</h3></div><b>${state.creatorVideos.length} 支內容</b></header>${state.creatorVideos.length ? `<div class="creator-video-grid">${state.creatorVideos.map(videoCard).join("")}</div>` : `<div class="creator-empty"><b>頻道還沒有作品</b><p>第一支片不一定會爆紅，但一定會留下妳開始的證明。</p></div>`}</section></div>`;
}
