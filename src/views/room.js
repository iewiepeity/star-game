import { AGENCIES, AGENCY_LIST } from "../data/agencies.js";
import { state } from "../core/state.js";
import { esc, money, yearOf, weekInYear } from "../core/utils.js";
import { portraitThumbAsset } from "../data/wardrobe.js";
import { isAgencyContractActive, checkAgencyEligibility } from "../logic/agency.js";
import { playerAge } from "../logic/romance-engine.js";
import { budget, plannerApp } from "./planner.js";
import { statsApp } from "./stats-app.js";
import { peopleApp } from "./people.js";
import { logApp } from "./log.js";
import { mapApp } from "./map.js";
import { jobsApp } from "./jobs.js";
import { npcApp } from "./npc.js";
import { agencyApp } from "./agency.js";
import { wardrobeApp } from "./wardrobe.js";
import { saveApp } from "./save.js";
import { settingsApp } from "./settings.js";
import { forumApp } from "./forum.js";
import { socialApp } from "./social.js";
import { creativeApp } from "./creative.js";
import { achievementsApp } from "./achievements.js";
import { worldApp } from "./world.js";
import { timelineApp } from "./timeline.js";
import { careerPhase } from "../logic/career-phases.js";
import { JOB_BY_ID } from "../data/jobs.js";

function jobHomeStatus() {
  const active = Object.values(state.activeJobs || {}).filter((j) => j.stage === "active");
  if (active.length) return `${active.length} 份執行中・剩餘 ${active.reduce((s, j) => s + j.remainingSessions, 0)} 次工作`;
  return state.currentAgencyId ? "查看經紀人送來的工作" : "去產業公司找公開徵選";
}
export function playerIdentityLabel() {
  if (isAgencyContractActive()) return `${esc(AGENCIES[state.currentAgencyId].name)}・旗下新人`;
  if (state.agencyStatus === "expired") return "自由藝人";
  return "未簽約新人";
}
function retireDialog() {
  return state.retireConfirm ? `<div class="confirm-backdrop" data-retire-cancel></div><section class="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="retire-title"><span>END THIS JOURNEY?</span><h2 id="retire-title">確定要主動結束這一輪嗎？</h2><p>會立刻依目前的作品、關係與生涯狀態進入星途結算。存檔不會自動刪除，但這一輪將不再繼續推進。</p><div><button data-retire-cancel>繼續這一輪</button><button class="danger" data-retire-confirm>確認結束並結算</button></div></section>` : "";
}
export function roomView() {
  return `<main class="room-screen"><img class="room-bg" src="./assets/rookie-room.webp" width="1536" height="1024" decoding="async" fetchpriority="high" alt="新人租屋處的工作桌"><header class="room-hud"><div class="player-chip"><div>${esc(state.name.slice(0, 1))}<img class="portrait-img" src="${portraitThumbAsset(state.avatarId, state.outfitId)}" width="160" height="320" decoding="async" alt="玩家目前造型"></div><span><b>${esc(state.name)}</b><small>${playerAge()} 歲・${playerIdentityLabel()}</small></span></div><div class="hud-stats"><span>💰 <b>${money(state.money)}</b></span><span>★ 知名度 <b>${state.fame}</b></span><span>♡ 粉絲 <b>${state.fans}</b></span><span>☁ 疲勞 <b>${state.fatigue}</b></span></div></header><button class="desk-pin phone-pin" data-open-app="people"><i>1</i><b>手機</b><small>${state.knownPeople.length ? "查看聯絡人" : "新的城市，空白通訊錄"}</small></button><button class="desk-pin mail-pin" data-open-job><i>!</i><b>工作信箱</b><small>${jobHomeStatus()}</small></button><section class="tablet"><div class="tablet-camera"></div><div class="tablet-screen">${tabletHome()}${tabletDock()}</div></section>${state.appOpen ? appWindow() : ""}${retireDialog()}</main>`;
}
export function agencyHomeCard() {
  if (isAgencyContractActive()) {
    const a = AGENCIES[state.currentAgencyId], remain = Math.max(0, state.agencyContractEndWeek - state.week + 1);
    return `<button class="agency-entry" data-open-app="agency"><div><span>所屬經紀公司</span><b>${esc(a.name)}</b></div><small>合約剩餘 <b>${remain}</b> 週・經紀抽成 <b>${Math.round(a.contract.commissionRate * 100)}%</b></small></button>`;
  }
  const eligible = AGENCY_LIST.filter((a) => checkAgencyEligibility(a).met).length;
  return `<button class="agency-entry" data-open-app="agency"><div><span>經紀公司</span><b>${state.agencyStatus === "expired" ? "自由藝人" : `${state.contract}%`}</b></div><small>可查看／投遞 ${eligible}／${AGENCY_LIST.length} 間公司 →</small></button>`;
}
function weeklyCommandCenter() {
  const phase = careerPhase();
  const active = Object.values(state.activeJobs || {}).filter((record) => record.stage === "active").sort((a, b) => a.deadlineWeek - b.deadlineWeek);
  const urgent = active[0], job = urgent && JOB_BY_ID[urgent.jobId];
  const messages = (state.npcMessages || []).filter((message) => !message.read).length;
  const queued = (state.eventQueue?.length || 0) + (state.queuedEvents?.filter((item) => item.dueWeek <= state.week + 1).length || 0);
  const manager = state.managerAdvice;
  const market = state.worldMarket?.headline || "市場本週相對平穩";
  let urgentTitle = "目前沒有迫近期限", urgentText = active.length ? `${active.length} 份正式通告正在執行` : "可以把空檔留給訓練、探索或休息";
  if (state.health <= 45 || state.fatigue >= 75) {
    urgentTitle = "身體正在拉警報";
    urgentText = "這週繼續塞滿行程，後面的工作反而更容易一起出事";
  } else if (job) {
    urgentTitle = `《${esc(job.title)}》第 ${urgent.deadlineWeek} 週截止`;
    urgentText = `還有 ${urgent.remainingSessions} 次工作・距期限 ${Math.max(0, urgent.deadlineWeek - state.week)} 週`;
  } else if (queued) {
    urgentTitle = `${queued} 件劇情／世界回聲等待處理`;
    urgentText = "先看看最近的選擇在娛樂圈留下了什麼";
  }
  const peopleTitle = messages ? `${messages} 則人物訊息未讀` : manager ? `${esc(manager.name)}有一個判斷` : "目前沒有人急著找你";
  const peopleText = manager ? `${esc(manager.name)}：「${esc(manager.text)}」` : messages ? "有些關係不會等到你有空才繼續往前" : "NPC 仍會有自己的工作與生活，近況會出現在週報裡";
  return `<section class="home-briefing"><header><span>THIS WEEK・行前簡報</span><b>先看急事，再看人，最後確認今年要去哪裡</b></header><div class="home-priority-grid"><button data-open-app="${job ? "jobs" : "planner"}"><small>① 現在最急</small><b>${urgentTitle}</b><em>${urgentText}</em></button><button data-open-app="people"><small>② 有人在找你</small><b>${peopleTitle}</b><em>${peopleText}</em></button><button data-open-app="world"><small>③ 本章目標・第 ${phase.year} 年</small><b>${esc(phase.label)}｜${esc(phase.goal)}</b><em>${esc(phase.pressure || phase.world)}</em></button></div><footer><small>市場風向</small><b>${esc(market)}</b></footer></section>`;
}
export function tabletHome() {
  const phase = careerPhase();
  return `<div class="tablet-home"><header><span>第 ${yearOf()} 年・第 ${weekInYear()} 週</span><b>${esc(state.name)}，早安！</b><small>${esc(phase.label)}・${esc(phase.goal)}</small></header>${agencyHomeCard()}${weeklyCommandCenter()}<button class="next-action" data-open-app="planner"><span>下一步</span><b>安排第 ${state.week} 週行程</b><small>預計支出 ${money(budget())}</small><i>→</i></button><div class="home-launchers"><button data-open-app="world"><b>◉ 娛樂圈週報</b><small>市場、作品、NPC 與後台狀態</small></button><button data-open-app="map"><b>⌖ 星望市地圖</b><small>依目的探索城市與產業公司</small></button><button data-open-app="jobs"><b>▤ 工作信箱</b><small>${jobHomeStatus()}</small></button><button data-open-app="creative"><b>✎ 創作工作室</b><small>製作、販售或自主發行作品</small></button><button data-open-app="npc"><b>◈ 人物檔案</b><small>人脈也可能帶來非公開機會</small></button><button data-open-app="social"><b>◎ 星光社群</b><small>發布真實近況、查看圈內動態</small></button><button data-open-app="forum"><b>☷ 星談論壇</b><small>看看網友正在聊什麼</small></button><button data-open-app="wardrobe"><b>♢ 造型衣櫃</b><small>換裝並調整能力加成</small></button><button data-open-app="settings"><b>⚙ 遊戲設定</b><small>存讀檔、字體、主題與重新開始</small></button></div><button class="retire-link" data-retire>主動結束這一輪並查看星途結算 →</button></div>`;
}
export function tabletDock() {
  return `<nav class="tablet-dock">${[["planner", "▦", "行程"], ["timeline", "◷", "時間線"], ["stats", "◫", "能力"], ["people", "♡", "人際"], ["log", "≡", "紀錄"]].map(([id, icon, label]) => `<button data-open-app="${id}"><i>${icon}</i>${label}</button>`).join("")}</nav>`;
}
export function appWindow() {
  const meta = {
    timeline: ["◷", "星途時間線", "集中查看人物、作品、邀約與重大選擇"],
    planner: ["▦", "行程與工作", "安排七天行程、策略與預算"], stats: ["◫", "能力資料", "檢視公開能力與隱藏特質"], creative: ["✎", "創作工作室", "創作、修改並向產業公司投稿"], wardrobe: ["♢", "造型衣櫃", "切換造型與能力加成"], people: ["♡", "手機與人際", "查看聯絡人和關係進度"], log: ["≡", "星途紀錄", "回顧每週成果與重大選擇"], world: ["◉", "娛樂圈週報", "整合玩家狀態、市場、作品、人物與後台世界"], achievements: ["♛", "星途成就", "收藏旅程、工作、人際與生活里程碑"], map: ["⌖", "星望市地圖", "前往城市地點與娛樂產業公司"], jobs: ["▤", "工作信箱", "管理公開徵選、推薦與指名邀約"], npc: ["◈", "人物檔案", "已認識人物的資料與關係"], social: ["◎", "星光社群", "發布近況並查看動態"], forum: ["☷", "星談論壇", "娛樂討論與熱門話題"], agency: ["◆", "經紀公司", "投遞、面談與簽約進度"], save: ["💾", "存檔管理", "管理存檔與安全備份"], settings: ["⚙", "遊戲設定", "存讀檔、顯示偏好與遊戲流程"],
  }[state.appOpen];
  const views = { planner: plannerApp, timeline: timelineApp, stats: statsApp, creative: creativeApp, wardrobe: wardrobeApp, people: peopleApp, log: logApp, world: worldApp, achievements: achievementsApp, map: mapApp, jobs: jobsApp, npc: npcApp, social: socialApp, forum: forumApp, agency: agencyApp, save: saveApp, settings: settingsApp };
  const body = views[state.appOpen]();
  return `<div class="app-backdrop" data-close-app></div><section class="app-window ${state.appOpen}" role="dialog" aria-modal="true" aria-labelledby="app-window-title"><header class="window-bar"><div class="window-icon">${meta[0]}</div><div><h2 id="app-window-title">${meta[1]}</h2><p>${meta[2]}</p></div>${state.appOpen === "planner" ? `<button class="window-start" id="begin-week">開始這週 →</button>` : ""}<button class="window-close" data-close-app aria-label="關閉${meta[1]}">×</button></header><div class="window-body">${body}</div></section>`;
}
