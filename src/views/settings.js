import { state } from "../core/state.js";
import { getPreferences } from "../core/preferences.js";
import { TUTORIALS } from "../logic/tutorial.js";
import { saveSlotCards } from "./save.js";
import { esc } from "../core/utils.js";

const option = (kind, id, current, icon, title, note) => `<button class="setting-option ${current === id ? "active" : ""}" data-${kind}="${id}" aria-pressed="${current === id}"><i aria-hidden="true">${icon}</i><span><b>${title}</b><small>${note}</small></span>${current === id ? "<em>使用中</em>" : ""}</button>`;
const slider = (name, label, value) => `<label class="audio-slider"><span>${label}<b>${Math.round(value * 100)}%</b></span><input type="range" min="0" max="100" value="${Math.round(value * 100)}" data-audio-volume="${name}"></label>`;

function section(kicker, title, description, content, className = "") {
  return `<section class="settings-section ${className}"><header><span>${kicker}</span><h3>${title}</h3><p>${description}</p></header>${content}</section>`;
}

export function settingsApp() {
  const prefs = getPreferences(), seen = new Set(state.tutorialSeen || []), confirm = state.settingsConfirmReset;
  const reset = confirm
    ? `<div class="reset-confirm"><b>確定要結束 ${esc(state.name)} 的目前進度嗎？</b><p>自動存檔將被新的角色進度取代，但仍可從安全備份或手動槽位找回。</p><div><button data-cancel-reset>取消</button><button class="danger" data-confirm-reset>確認從頭開始</button></div></div>`
    : `<button class="reset-game" data-request-reset>從頭開始建立角色</button>`;
  return `<div class="inside-page settings-page"><div class="inside-title"><div><span>GAME SETTINGS</span><h2>遊戲設定</h2></div><p>顯示與播放偏好會保留在這台裝置，不受讀檔影響</p></div>${state.saveNotice ? `<div class="wardrobe-notice">${esc(state.saveNotice)}</div>` : ""}
    ${section("DISPLAY", "字體大小", "全介面使用一致的中文黑體，敘事標題使用同一套中文襯線字。", `<div class="setting-options">${option("font-size", "standard", prefs.fontSize, "A", "標準", "原始排版")}${option("font-size", "comfortable", prefs.fontSize, "A+", "舒適", "內文至少 16px")}${option("font-size", "large", prefs.fontSize, "A++", "大字", "內文至少 18px")}</div>`)}
    ${section("THEME", "介面主題", "保留水彩素材，只調整平板、視窗與按鈕色調。", `<div class="setting-options themes">${option("theme", "warm", prefs.theme, "☀", "奶油晨光", "原始米白與珊瑚粉")}${option("theme", "rose", prefs.theme, "❀", "櫻花手帳", "柔粉紙張與莓果色")}${option("theme", "night", prefs.theme, "☾", "夜幕星光", "深藍灰低亮度介面")}</div>`)}
    ${section("PLAYBACK", "自動播放速度與方式", "需要選擇、簽約或閱讀人物劇情時一定會暫停。", `<div class="setting-options playback-speeds">${option("auto-speed", "manual", prefs.autoSpeed, "Ⅱ", "手動播放", "由你決定何時進入下一天")}${option("auto-speed", "x1", prefs.autoSpeed, "1×", "舒緩閱讀", "每段停留 10 秒")}${option("auto-speed", "x2", prefs.autoSpeed, "2×", "快速播放", "每段仍保留 5 秒")}</div>`)}
    ${section("AUDIO", "音樂與音效", "音樂會依房間、事件、行程與結局切換；首次點擊後開始播放。", `${slider("musicVolume", "背景音樂", prefs.musicVolume)}${slider("sfxVolume", "操作音效", prefs.sfxVolume)}<button class="settings-link" data-audio-muted>${prefs.audioMuted ? "開啟聲音" : "全部靜音"}</button>`)}
    ${section("SAVE / LOAD", "快速存檔與讀檔", "讀檔前會自動建立安全備份；匯出、匯入與備份還原請進完整管理。", `${saveSlotCards()}<button class="settings-link" data-open-save-manager>開啟完整存檔管理 →</button>`)}
    ${section("TUTORIAL", "新手教學", `目前已看過 ${seen.size}／${TUTORIALS.length} 則教學提示。`, `<div class="settings-inline-actions"><button data-tutorial-mode="restart">重新顯示所有教學</button><button data-tutorial-mode="skip">關閉所有後續教學</button></div>`)}
    ${section("CAREER", "結束目前這輪", "依目前作品、關係與生涯狀態進入星途結算；存檔不會自動刪除。", `<button class="settings-link" data-retire>主動退圈並查看結算 →</button>`, "career-exit")}
    ${section("NEW GAME", "從頭開始", "目前進度會先放進安全備份，再回到角色建立畫面；手動存檔與顯示設定不會刪除。", reset, "danger-zone")}
  </div>`;
}
