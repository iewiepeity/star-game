import { normalizeNarrativeSettings } from "../core/narrative-settings-state.js";
import { PIXEL_VERSION, RELEASE_NOTES } from "./release-notes.js";
import { THEMES } from "./preferences.js";
import { menuIcon } from "./menu-icons.js";
export function settingsMarkup({ theme, speed, paused, preferences = {}, narrativeSettings = {} }) {
  const narrative = normalizeNarrativeSettings(narrativeSettings);
  const options = (key, entries) => `<div class="speed-options" role="group">${entries.map(([value, label]) => `<button data-narrative-pref="${key}" data-value="${value}" aria-pressed="${narrative[key] === value}">${label}</button>`).join("")}</div>`;
  return `<div class="preference-studio settings-groups">
    <section class="preference-section"><header><h3>閱讀與顯示</h3><span>這台裝置會記住</span></header>
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

    <div class="buttons"><button data-ui="reset-view">↺ 回到原比例</button></div>
    <details class="settings-group"><summary>配色主題</summary>    <section class="preference-section"><header><h3>今天，想用什麼顏色？</h3><span>即時套用 · 這台裝置會記住</span></header>
    <div class="theme-picker" role="group" aria-label="介面主題顏色">${THEMES.map((t) => `<button class="theme-choice" data-pixel-theme="${t.id}" aria-pressed="${theme === t.id}" style="--swatch-paper:${t.colors[0]};--swatch-trim:${t.colors[1]};--swatch-accent:${t.colors[2]}"><span class="theme-preview" aria-hidden="true"><i></i><b>✦</b><em></em><em></em></span><strong>${t.name}</strong><small>${theme === t.id ? "✓ 使用中" : t.note}</small></button>`).join("")}</div></section>
</details>
    </section>
    <details class="settings-group"><summary>聲音與演出</summary>    <section class="preference-section"><header><h3>遊玩節奏</h3><span>重要的選擇，仍會停下來等你</span></header>
      <div class="playback-setting"><div><b>演出速度</b><small>只調整播放速度，成果相同</small></div><div class="speed-options" role="group" aria-label="演出速度">${[1, 2, 4, 8, 16].map((n) => `<button data-set-speed="${n}" aria-pressed="${speed === n}">${n}×</button>`).join("")}</div></div>
      <div class="setting-pair"><button class="setting-action" data-ui="pause" id="pause" aria-label="${paused ? "繼續世界" : "暫停世界"}"><i>${paused ? "▷" : "Ⅱ"}</i><span><b>${paused ? "繼續世界" : "暫停世界"}</b><small>${paused ? "準備好，繼續生活" : "讓所有人歇一下"}</small></span></button><div class="camera-setting"><span>場景鏡頭</span><div><button data-ui="zoom-out" aria-label="縮小場景">−</button><button data-ui="center" aria-label="鏡頭回到主角">${menuIcon("profile")}</button><button data-ui="zoom-in" aria-label="放大場景">＋</button></div></div></div>
    </section>
<section class="preference-section"><h3>聲音與操作提示</h3>    <label class="volume-control">背景音樂<input type="range" min="0" max="1" step=".01" data-volume="musicVolume" value="${preferences.musicVolume ?? 0.28}" aria-label="背景音樂音量"></label>
    <label class="volume-control">互動音效<input type="range" min="0" max="1" step=".01" data-volume="sfxVolume" value="${preferences.sfxVolume ?? 0.42}" aria-label="互動音效音量"></label>
    <div class="buttons" aria-label="試聽事件音效"><button data-preview-sfx="message">試聽訊息</button><button data-preview-sfx="success">成功</button><button data-preview-sfx="warning">提醒</button><button data-preview-sfx="reward">獎勵</button></div>
    <div class="buttons"><button data-pixel-pref="audioMuted" data-value="${!preferences.audioMuted}" aria-pressed="${!!preferences.audioMuted}">${preferences.audioMuted ? "開啟聲音" : "全部靜音"}</button><button data-pixel-pref="tutorials" data-value="${!preferences.tutorials}" aria-pressed="${!!preferences.tutorials}">新手提示 ${preferences.tutorials ? "開啟" : "關閉"}</button><button data-tutorial-reset>重新閱讀新人手冊</button></div></section>
</details>
    <details class="settings-group"><summary>故事偏好 · 跟著旅程保存</summary>    <section class="preference-section" aria-label="故事與日常"><header><h3>故事與日常</h3><span>跟著這份旅程保存</span></header>
      <div class="playback-setting"><div><b>敘事長度</b><small>精簡時仍可展開全文，選項與成果完整保留</small></div>${options("textMode", [["full", "完整"], ["concise", "精簡"]])}</div>
      <div class="playback-setting"><div><b>已讀日常快速略過</b><small>只略過讀過的相同日常；新選擇、故事後續與重要成果仍會停下</small></div>${options("skipReadRoutine", [[false, "關閉"], [true, "開啟"]])}</div>
      <div class="playback-setting"><div><b>戀愛日常頻率</b><small>調整日常相處與主動邀約，已建立的關係仍保留</small></div>${options("romanceFrequency", [["off", "暫停"], ["low", "偶爾"], ["normal", "平常"], ["high", "常常"]])}</div>
      <div class="playback-setting"><div><b>戲劇強度</b><small>調整主動日常的衝突程度，重要故事與自己的選擇仍會繼續</small></div>${options("conflictIntensity", [["gentle", "溫和"], ["normal", "平常"], ["dramatic", "濃厚"]])}</div>
      <div class="playback-setting"><div><b>重要人物故事提醒</b><small>關閉只收起額外提醒，不會移除故事與選擇</small></div>${options("storyReminders", [[true, "開啟"], [false, "關閉"]])}</div>
      <div class="buttons"><button data-life="narrative-history">翻閱完整日常記錄</button></div>
    </section>
</details>
    <details class="settings-group"><summary>存檔與資料</summary>    <div class="settings-utilities"><button data-ui="saves"><i>${menuIcon("saves")}</i><span><b>存檔與讀檔</b><small>留住現在的旅程</small></span><em>›</em></button><button data-ui="help"><i>?</i><span><b>操作說明</b><small>走路、互動與行程</small></span><em>›</em></button></div>
    <details class="new-journey"><summary>下一段人生</summary><p>可先存檔，再選擇結算或從頭開始。</p><div class="buttons"><button data-storage="retire">主動退圈並結算</button><button data-storage="new">建立新角色</button></div></details>
    <section class="preference-section"><h3>隱私與本機資料</h3><p>遊戲不使用追蹤 Cookie，存檔與設定保存在這台裝置。</p><a href="./privacy.html">查看隱私說明／清除本遊戲資料</a><p class="tiny-note">離開遊戲前，建議先匯出重要存檔。</p></section>
</details>
    <details class="settings-group"><summary>更新與離線</summary>    <section class="version-summary" aria-label="目前版本"><div><span>你正在玩的版本</span><strong>像素版 v${PIXEL_VERSION}</strong><small>星望市施工日誌，歡迎翻閱。</small></div><button data-ui="release-notes">版本更新紀錄 <span aria-hidden="true">▸</span></button></section>
    <section class="preference-section"><header><h3>離線與安裝</h3><span id="offline-status">第一次連線後可準備離線內容</span></header><div class="buttons"><button data-offline="install">加入主畫面</button><button data-offline="download">準備完整離線內容</button><button data-offline="update">檢查更新</button></div><progress id="offline-progress" max="100" value="0" hidden></progress></section>
</details>
    <p class="preference-footnote">配色只改變介面，保留場景和人物插畫原本的顏色。</p>
  </div>`;
}


export function releaseNotesMarkup(escape) {
  return `<p class="lede">星望市施工日誌：有時加點新花樣，有時把絆腳的小石頭搬走。你正在玩的是 <strong>v${PIXEL_VERSION}</strong>。</p>
    <p class="tiny-note">近期更新，由新到舊。點開標題就能翻閱；看完不會多過一天，放心摸魚。</p>
    <div class="release-history">${RELEASE_NOTES.map((release, i) => `<details class="release-entry" ${i === 0 ? "open" : ""}>
      <summary><span class="release-meta"><b>v${release.version}</b><time datetime="${release.date}">${release.date.replaceAll("-", "/")}</time>${i === 0 ? '<em>目前版本</em>' : ""}</span><span class="release-title">${escape(release.title)}</span></summary>
      <ul>${release.notes.map(note => `<li>${escape(note)}</li>`).join("")}</ul>
    </details>`).join("")}</div>
    <div class="panel-actions"><button class="primary" data-ui="settings">回到設定</button><button data-ui="close">知道了，繼續闖蕩</button></div>`;
}
