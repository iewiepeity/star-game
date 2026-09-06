import { THEMES } from "./preferences.js";
import { menuIcon } from "./menu-icons.js";
export function settingsMarkup({ theme, speed, paused, preferences = {} }) {
  return `<div class="preference-studio">
    <section class="preference-section"><header><h3>今天，想用什麼顏色？</h3><span>即時套用 · 這台裝置會記住</span></header>
    <div class="theme-picker" role="group" aria-label="介面主題顏色">${THEMES.map((t) => `<button class="theme-choice" data-pixel-theme="${t.id}" aria-pressed="${theme === t.id}" style="--swatch-paper:${t.colors[0]};--swatch-trim:${t.colors[1]};--swatch-accent:${t.colors[2]}"><span class="theme-preview" aria-hidden="true"><i></i><b>✦</b><em></em><em></em></span><strong>${t.name}</strong><small>${theme === t.id ? "✓ 使用中" : t.note}</small></button>`).join("")}</div></section>
    <section class="preference-section"><header><h3>遊玩節奏</h3><span>重要的選擇，仍會停下來等你</span></header>
      <div class="playback-setting"><div><b>演出速度</b><small>只調整播放速度，成果相同</small></div><div class="speed-options" role="group" aria-label="演出速度">${[1, 2, 4, 8, 16].map((n) => `<button data-set-speed="${n}" aria-pressed="${speed === n}">${n}×</button>`).join("")}</div></div>
      <div class="setting-pair"><button class="setting-action" data-ui="pause" id="pause" aria-label="${paused ? "繼續世界" : "暫停世界"}"><i>${paused ? "▷" : "Ⅱ"}</i><span><b>${paused ? "繼續世界" : "暫停世界"}</b><small>${paused ? "準備好，繼續生活" : "讓所有人歇一下"}</small></span></button><div class="camera-setting"><span>場景鏡頭</span><div><button data-ui="zoom-out" aria-label="縮小場景">−</button><button data-ui="center" aria-label="鏡頭回到主角">${menuIcon("profile")}</button><button data-ui="zoom-in" aria-label="放大場景">＋</button></div></div></div>
    </section>
    <section class="preference-section"><header><h3>閱讀與聲音</h3><span>這台裝置的偏好</span></header>
    <div class="font-options" role="group" aria-label="文字大小">${[
      ["standard", "標準"],
      ["comfortable", "舒適"],
      ["large", "大字"],
    ]
      .map(
        ([id, n]) =>
          `<button data-pixel-pref="fontSize" data-value="${id}" aria-pressed="${preferences.fontSize === id}">${n}</button>`,
      )
      .join("")}</div>
    <label class="volume-control">背景音樂<input type="range" min="0" max="1" step=".01" data-volume="musicVolume" value="${preferences.musicVolume ?? 0.28}" aria-label="背景音樂音量"></label>
    <label class="volume-control">互動音效<input type="range" min="0" max="1" step=".01" data-volume="sfxVolume" value="${preferences.sfxVolume ?? 0.42}" aria-label="互動音效音量"></label>
    <div class="buttons" aria-label="試聽事件音效"><button data-preview-sfx="message">試聽訊息</button><button data-preview-sfx="success">成功</button><button data-preview-sfx="warning">提醒</button><button data-preview-sfx="reward">獎勵</button></div>
    <div class="buttons"><button data-pixel-pref="audioMuted" data-value="${!preferences.audioMuted}" aria-pressed="${!!preferences.audioMuted}">${preferences.audioMuted ? "開啟聲音" : "全部靜音"}</button><button data-pixel-pref="tutorials" data-value="${!preferences.tutorials}" aria-pressed="${!!preferences.tutorials}">新手提示 ${preferences.tutorials ? "開啟" : "關閉"}</button><button data-tutorial-reset>重新閱讀新人手冊</button></div></section>
    <section class="preference-section"><header><h3>離線與安裝</h3><span id="offline-status">第一次連線後可準備離線內容</span></header><div class="buttons"><button data-offline="install">加入主畫面</button><button data-offline="download">準備完整離線內容</button><button data-offline="update">檢查更新</button></div><progress id="offline-progress" max="100" value="0" hidden></progress></section>
    <div class="settings-utilities"><button data-ui="saves"><i>${menuIcon("saves")}</i><span><b>存檔與讀檔</b><small>留住現在的旅程</small></span><em>›</em></button><button data-ui="help"><i>?</i><span><b>操作說明</b><small>走路、互動與行程</small></span><em>›</em></button></div>
    <details class="new-journey"><summary>下一段人生</summary><p>可先存檔，再選擇結算或從頭開始。</p><div class="buttons"><button data-storage="retire">主動退圈並結算</button><button data-storage="new">建立新角色</button></div></details>
    <p class="preference-footnote">配色只改變介面，保留場景和人物插畫原本的顏色。</p>
  </div>`;
}
