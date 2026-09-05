import { ASPIRATIONS } from "../logic/city-progression.js";
import { state } from "../core/state.js";
import { esc } from "../core/utils.js";
import { playerRealName } from "../core/player-name.js";

const SCENES = [
  {
    label: "星望市・搬進新房間的第一天",
    title: "最後一只紙箱也安頓好了。",
    text: "房間比想像中還小，但至少，這裡是完全屬於自己的起點。桌角壓著一張有些泛黃的卡片。",
    action: "看看桌上的卡片 →",
  },
  {
    label: "很久以前留下的字",
    title: "要當明星！",
    text: "歪歪扭扭的字旁邊，還畫了幾顆大得不太合理的星星。那時候的願望，原來一直被好好收著。",
    action: "繼續 →",
  },
  {
    label: "玩家自言自語",
    title: "「……大學畢業了。」",
    text: "真的到了能自己決定未來的時候，反而有點不真實。履歷乾乾淨淨，通訊錄裡沒有任何業界人脈，連經紀公司都還得自己找。",
    action: "想起小時候的自己 →",
  },
  {
    label: "五年之約",
    title: "「那就給自己五年的時間，闖闖看吧。」",
    text: "五年後，不管走到哪裡，至少要能告訴小時候的自己——我真的試過了。桌上的平板在這時亮了起來。",
    action: "看看城市生活資訊 →",
  },
  { label:"星望市新人生活資訊", title:"夢想很遠，第一站可以很近。", text:"城市導覽列出了教室、產業據點和新人零工。課程要先去現場了解報名方式；星環商務中心可以索取經紀公司招募名錄，沒有任何公司已經在等你簽約。", action:"決定先從哪裡開始 →" },
  { label:"寫給自己的第一張便條", title:"先選一條想試試的路。", text:"這只是第一站，不會鎖定你的職涯。先去認識環境，再安排課程與生活。手機隨時能查看社群與聯絡人，瀏覽不會消耗一天。", action:"帶著第一個目標，開始生活 →" },
];

function childhoodCard(large = false) {
  return `<div class="childhood-card ${large ? "large" : ""}" aria-label="童年手寫卡片"><span>☆　✦　☆</span><b>長大以後，<br>要當明星！</b><small>給未來的我 ♡</small></div>`;
}

export function prologueView() {
  const step = Math.max(
      0,
      Math.min(SCENES.length - 1, Number(state.prologueStep) || 0),
    ),
    scene = SCENES[step];
  return `<main class="prologue-screen step-${step}"><img class="prologue-bg" src="./assets/rookie-room.webp" width="1536" height="1024" decoding="async" fetchpriority="high" alt="剛搬進星望市的新房間"><div class="prologue-shade"></div><header class="prologue-brand">✦ 星途未定 <span>PROLOGUE</span></header><nav class="prologue-skip"><button data-skip-prologue>跳過序章</button><button data-skip-onboarding>跳過序章與教學</button></nav>${step === 0 ? `<button class="card-on-desk" data-prologue-next aria-label="查看桌上的童年卡片">${childhoodCard()}</button>` : ""}${step === 1 ? `<section class="card-closeup">${childhoodCard(true)}</section>` : ""}<section class="prologue-dialogue"><div class="prologue-progress" role="progressbar" aria-label="序章進度" aria-valuemin="1" aria-valuemax="${SCENES.length}" aria-valuenow="${step + 1}" aria-valuetext="第 ${step + 1} 幕，共 ${SCENES.length} 幕">${SCENES.map((_, i) => `<i class="${i <= step ? "active" : ""}" aria-hidden="true"></i>`).join("")}</div><small>${esc(scene.label)}</small><h1>${esc(scene.title)}</h1><p>${esc(scene.text)}</p>${step === 5 ? `<div class="aspiration-options" role="group" aria-label="第一個想嘗試的方向">${Object.entries(ASPIRATIONS).map(([id,item])=>`<button data-aspiration="${id}" aria-pressed="${state.aspiration===id}">${item.label}</button>`).join("")}</div>` : ""}<div><span>${step >= 2 ? esc(playerRealName(state)) : ""}</span><button class="main-btn" data-prologue-next>${esc(scene.action)}</button></div></section></main>`;
}
