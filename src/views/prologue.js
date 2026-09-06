import { ASPIRATIONS } from "../logic/city-progression.js";
import { state } from "../core/state.js";
import { esc } from "../core/utils.js";
import { playerRealName } from "../core/player-name.js";

export const SCENES = [
  {
    label: "星望市・搬進新房間的第一天",
    title: "紙箱上寫著：重要物品。",
    text: "你拆開最後一只紙箱。畢業證書、延長線、一雙還沒磨合的新鞋，和一張從舊書裡掉出來的小卡。窗外的廣告看板正好換了一輪，光在牆上亮起，又暗下去。這間房還沒有你的氣味，房租倒是已經很熟悉你的戶頭。",
    action: "撿起那張小卡 →",
  },
  {
    label: "很久以前留下的字",
    title: "要當明星！",
    text: "幾個字擠得歪歪的，旁邊畫滿比人還大的星星。那時候不知道試鏡會被刷掉，不知道一句台詞可能重拍二十次；只是覺得，如果有一天自己的出現，能讓某個人捨不得關掉螢幕，那一定很了不起。",
    action: "把卡片攤平 →",
  },
  {
    label: "還沒印上任何頭銜的名字",
    title: "大學畢業，接下來呢？",
    text: "履歷的學歷欄可以填了，演藝經歷卻還空著。沒有安排好的出道，也沒有等你簽字的公司。你把卡片立在桌邊，對著黑掉的平板螢幕試了一次自我介紹。第一遍太小聲，第二遍又像在面試房仲。至少第三遍，終於有一點像自己。",
    action: "在卡片背面寫下日期 →",
  },
  {
    label: "五年之約",
    title: "給自己五年，闖闖看。",
    text: "你在今天的日期旁畫上一條短線，另一端留給五年後。那天可能有掌聲，也可能只是收拾好行李；現在還不能知道。你只在下面補了一句：不要連好好生活都忘了。平板亮起，城市生活資訊跳出了第一則通知。",
    action: "打開城市生活資訊 →",
  },
  {
    label: "星望市新人生活資訊",
    title: "成名前，先找到明天的路。",
    text: "地圖上的教室、演出場所與零工據點擠在一起，沒有哪個圖示寫著『由此爆紅』。你先查好交通，再把想了解的課程和公司招募記下來。成為明星的第一個晚上，最實際的成果是一張不至於迷路的地圖。",
    action: "挑一個想試試的方向 →",
  },
  {
    label: "寫給自己的第一張便條",
    title: "第一步，不用長得像終點。",
    text: "先選一件明天願意起床去做的事。演好一句台詞、唱穩一個音、把話接住，或把腦中的故事寫下來。這個選擇不會替五年下結論；窗外還有很多條路，等你真的走過才會知道。",
    action: "帶著便條，開始生活 →",
  },
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
