import { THEMES } from "./preferences.js";
import { menuIcon } from "./menu-icons.js";
export function settingsMarkup({ theme, speed, paused }) {
  return `<div class="preference-studio">
    <section class="preference-section"><header><h3>今天，想用什麼顏色？</h3><span>即時套用 · 這台裝置會記住</span></header>
    <div class="theme-picker" role="group" aria-label="介面主題顏色">${THEMES.map((t) => `<button class="theme-choice" data-pixel-theme="${t.id}" aria-pressed="${theme === t.id}" style="--swatch-paper:${t.colors[0]};--swatch-trim:${t.colors[1]};--swatch-accent:${t.colors[2]}"><span class="theme-preview" aria-hidden="true"><i></i><b>✦</b><em></em><em></em></span><strong>${t.name}</strong><small>${theme === t.id ? "✓ 使用中" : t.note}</small></button>`).join("")}</div></section>
    <section class="preference-section"><header><h3>遊玩節奏</h3><span>重要的選擇，仍會停下來等你</span></header>
      <div class="playback-setting"><div><b>演出速度</b><small>只調整播放速度，成果相同</small></div><div class="speed-options" role="group" aria-label="演出速度">${[1, 2, 4, 8, 16].map((n) => `<button data-set-speed="${n}" aria-pressed="${speed === n}">${n}×</button>`).join("")}</div></div>
      <div class="setting-pair"><button class="setting-action" data-ui="pause" id="pause" aria-label="${paused ? "繼續世界" : "暫停世界"}"><i>${paused ? "▷" : "Ⅱ"}</i><span><b>${paused ? "繼續世界" : "暫停世界"}</b><small>${paused ? "準備好，繼續生活" : "讓所有人歇一下"}</small></span></button><div class="camera-setting"><span>場景鏡頭</span><div><button data-ui="zoom-out" aria-label="縮小場景">−</button><button data-ui="center" aria-label="鏡頭回到主角">${menuIcon("profile")}</button><button data-ui="zoom-in" aria-label="放大場景">＋</button></div></div></div>
    </section>
    <div class="settings-utilities"><button data-ui="saves"><i>${menuIcon("saves")}</i><span><b>存檔與讀檔</b><small>留住現在的旅程</small></span><em>›</em></button><button data-ui="help"><i>?</i><span><b>操作說明</b><small>走路、互動與行程</small></span><em>›</em></button></div>
    <p class="preference-footnote">配色只改變介面，保留場景和人物插畫原本的顏色。</p>
  </div>`;
}
