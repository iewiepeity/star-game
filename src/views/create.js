// 畫面層：角色建立流程（STEP 1 姓名／性別／生日、STEP 2 能力擲骰）。
import { ABILITY_GROUPS } from "../data/abilities.js";
import { KNOWN_GENDERS, GENDER_OPTIONS } from "../data/genders.js";
import {
  AVATAR_LIST,
  portraitAsset,
  portraitThumbAsset,
  isAvatarLocked,
} from "../data/wardrobe.js";
import { state } from "../core/state.js";
import { esc, width } from "../core/utils.js";
import { birthDayLimit } from "../core/birthday.js";
import { playerRealName } from "../core/player-name.js";
export function createView() {
  const best = Object.entries(state.stats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  return `<main class="create-screen"><section class="create-art"><div class="logo">✦ 星途未定</div><img src="./assets/new-start-box.webp" alt="裝著表演用品的搬家紙箱"><div class="opening-copy"><span>序章｜22 歲的夏天</span><h1>帶著一箱夢想，<br>住進星望市。</h1><p>大學畢業，給自己五年時間。沒有公司、沒有作品、沒有人脈。你的明星人生，從這間小房間開始。</p></div></section><section class="create-form">${state.createStep === 1 ? identityStep() : statsStep(best)}</section></main>`;
}
export function identityStep() {
  const selected =
    AVATAR_LIST.find((a) => a.id === state.avatarId) || AVATAR_LIST[0];
  const invalidName = Boolean(state.notice && !playerRealName(state));
  const genderButtons = GENDER_OPTIONS.map((gender) => {
    const active =
      gender === "自訂"
        ? !KNOWN_GENDERS.includes(state.gender)
        : state.gender === gender;
    return `<button class="${active ? "active" : ""}" data-gender="${gender}" aria-pressed="${active}">${gender}</button>`;
  }).join("");
  const avatarButtons = AVATAR_LIST.map((a, index) => {
    const locked = isAvatarLocked(a, state.gender);
    const active = a.id === selected.id;
    return `<button class="${active ? "active" : ""} ${locked ? "locked" : ""}" data-avatar="${a.id}" ${locked ? "disabled" : ""} aria-pressed="${active}" aria-label="${locked ? `第 ${index + 1} 款人物立繪已上鎖` : `選擇第 ${index + 1} 款人物立繪`}"><img src="${portraitThumbAsset(a.id, "newcomer")}" width="160" height="320" loading="lazy" decoding="async" alt=""><span aria-hidden="true">${locked ? "上鎖" : active ? "✓ 已選擇" : "選擇"}</span></button>`;
  }).join("");
  return `<div class="form-card identity-card"><div class="step-mark">STEP 1 / 2</div><h2>這位新人是誰？</h2><p>本名會用於私人故事；藝名則會出現在作品、社群與媒體。藝名留空時，公開場合會沿用本名。</p><div class="identity-layout"><div class="identity-fields"><label><span>本名 <small>必填</small></span><input id="player-real-name" maxlength="16" placeholder="輸入本名" value="${esc(state.realName)}" required autocomplete="name" aria-invalid="${invalidName}" ${invalidName ? 'aria-describedby="create-notice"' : ""}></label><label><span>藝名 <small>選填</small></span><input id="player-stage-name" maxlength="16" placeholder="留空則沿用本名" value="${esc(state.stageName)}" autocomplete="nickname"></label><div class="birthday-fields"><label><span>生日月份</span><input id="birth-month" type="number" min="1" max="12" value="${state.birthMonth}" inputmode="numeric"></label><label><span>生日日期</span><input id="birth-day" type="number" min="1" max="${birthDayLimit(state.birthMonth)}" value="${state.birthDay}" inputmode="numeric"></label></div><fieldset><legend>性別／稱呼</legend><div class="gender-options">${genderButtons}</div></fieldset><label class="${KNOWN_GENDERS.includes(state.gender) ? "hidden" : ""}"><span>自訂性別</span><input id="custom-gender" maxlength="20" value="${esc(state.customGender)}" placeholder="自由輸入"></label><div class="selected-avatar-copy"><b>已選擇此人物立繪</b><small>立繪需符合所選性別；選擇非二元或自訂稱呼時，四款立繪都能自由選。</small></div></div><div class="create-avatar-preview"><img src="${portraitAsset(selected.id, "newcomer")}" width="512" height="1024" decoding="async" fetchpriority="high" alt="目前選擇的玩家立繪"></div></div><fieldset><legend>玩家立繪</legend><div class="avatar-picker">${avatarButtons}</div></fieldset><button class="main-btn full ${playerRealName(state) ? "" : "needs-name"}" id="to-stats">擲出初始能力 →</button>${state.notice ? `<p class="create-notice" id="create-notice" role="alert">${esc(state.notice)}</p>` : ""}</div>`;
}
export function statsStep(best) {
  return `<div class="form-card wide"><div class="roll-title"><div><div class="step-mark">STEP 2 / 2</div><h2>命運發了這副牌</h2><p>21 項固定公開能力各自隨機 0～150。不滿意就繼續骰，重骰次數不限。</p></div><button class="reroll" id="reroll">↻ 全部重骰</button></div><div class="best-tags">${best.map(([n, v], i) => `<span>目前強項 ${i + 1}<b>${n} ${v}</b></span>`).join("")}<em>所有能力進入遊戲後的上限皆為 1000</em></div><div class="rolled-grid">${Object.entries(
    ABILITY_GROUPS,
  )
    .map(
      ([group, names]) =>
        `<section><h3>${group}</h3>${names.map((n) => `<div class="mini-stat"><span>${n}</span><i><b style="width:${width(state.stats[n])}%"></b></i><strong>${state.stats[n]}</strong></div>`).join("")}</section>`,
    )
    .join(
      "",
    )}</div><div class="form-actions"><button class="back-btn" id="back">← 修改身分</button><button class="main-btn" id="start">就用這組，搬進星望市 →</button></div></div>`;
}
