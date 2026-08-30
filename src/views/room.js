import { AGENCIES, AGENCY_LIST } from "../data/agencies.js";
import { state } from "../core/state.js";
import { esc, money, yearOf, weekInYear } from "../core/utils.js";
import { portraitThumbAsset } from "../data/wardrobe.js";
import { isAgencyContractActive, checkAgencyEligibility } from "../logic/agency.js";
import { playerAge } from "../logic/romance-engine.js";
import { budget, plannerApp } from "./planner.js";
import { statsApp } from "./stats-app.js";
import { peopleHubApp } from "./people.js";
import { logApp } from "./log.js";
import { mapApp } from "./map.js";
import { jobsApp } from "./jobs.js";
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
import { galleryApp, galleryUnlocked } from "./gallery.js";
import { CG_GALLERY_ITEMS } from "../data/story-art.js";
import { APP_META, APP_LIBRARY_IDS, normalizeDockIds, appIcon } from "./app-icons.js";
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
  return state.retireConfirm ? `<div class="confirm-backdrop" data-retire-cancel></div><section class="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="retire-title" aria-describedby="retire-description" tabindex="-1"><span>END THIS JOURNEY?</span><h2 id="retire-title">確定要主動結束這一輪嗎？</h2><p id="retire-description">會立刻依目前的作品、關係與生涯狀態進入星途結算。存檔不會自動刪除，但這一輪將不再繼續推進。</p><div><button data-retire-cancel>繼續這一輪</button><button class="danger" data-retire-confirm>確認結束並結算</button></div></section>` : "";
}
export function roomView() {
  const unread=(state.npcMessages||[]).filter(message=>!message.read).length;
  return `<main class="room-screen"><img class="room-bg" src="./assets/rookie-room.webp" width="1536" height="1024" decoding="async" fetchpriority="high" alt="新人租屋處的工作桌"><header class="room-hud"><div class="player-chip"><div>${esc(state.name.slice(0, 1))}<img class="portrait-img" src="${portraitThumbAsset(state.avatarId, state.outfitId)}" width="160" height="320" decoding="async" alt="玩家目前造型"></div><span><b>${esc(state.name)}</b><small>${playerAge()} 歲・${playerIdentityLabel()}</small></span></div><div class="hud-stats"><span>💰 <b>${money(state.money)}</b></span><span>★ 知名度 <b>${state.fame}</b></span><span>♡ 粉絲 <b>${state.fans}</b></span><span>☁ 疲勞 <b>${state.fatigue}</b></span></div></header><button class="desk-pin phone-pin" data-open-app="people"><i>${unread||"♡"}</i><b>手機</b><small>${unread?`${unread} 則未讀訊息`:state.knownPeople.length?"查看聯絡人":"新的城市，空白通訊錄"}</small></button><button class="desk-pin mail-pin" data-open-job><i>!</i><b>工作信箱</b><small>${jobHomeStatus()}</small></button><section class="tablet"><div class="tablet-camera"></div><div class="tablet-screen">${tabletHome()}${tabletDock()}</div></section>${state.appOpen ? appWindow() : ""}${retireDialog()}</main>`;
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
  const selected=dockSelection();
  const tools=state.dockEditing?`<div class="dock-editor-actions"><span>快捷列 ${selected.length}／6</span><button data-dock-reset>恢復預設</button><button data-dock-cancel>取消</button><button class="primary" data-dock-save ${selected.length===6?"":"disabled"}>完成</button></div>`:`<div class="app-library-actions"><small>點一下就開</small><button data-dock-edit>編輯快捷列</button></div>`;
  return `<div class="tablet-home"><header><span>第 ${yearOf()} 年・第 ${weekInYear()} 週</span><b>${esc(state.name)}，早安！</b><small>${esc(phase.label)}・${esc(phase.goal)}</small></header>${agencyHomeCard()}${weeklyCommandCenter()}<button class="next-action" data-open-app="planner"><span>本週主要行動</span><b>安排第 ${state.week} 週行程</b><small>預計支出 ${money(budget())}</small><i aria-hidden="true">→</i></button><section class="app-library ${state.dockEditing?"editing":""}"><header><div><span>${state.dockEditing?"CUSTOMIZE DOCK":"APP LIBRARY"}</span><b>${state.dockEditing?"挑選六個常用 App":"全部 App"}</b></div>${tools}</header>${state.dockEditing?`<p class="dock-editor-note">點選 App 加入或移出下方快捷列；排列順序就是你加入的順序。${state.dockNotice?`<strong>${esc(state.dockNotice)}</strong>`:""}</p>`:""}<div class="home-launchers">${APP_LIBRARY_IDS.map(appTile).join("")}</div></section></div>`;
}
export function tabletDock() {
  const ids=dockSelection(),items=ids.map(id=>{const meta=APP_META[id],badge=appBadge(id),action=state.dockEditing?`data-dock-remove="${id}"`:`data-open-app="${id}"`;return`<button ${action} aria-label="${state.dockEditing?"移除":"開啟"}${meta.title}"><i class="mini-app-icon tone-${meta.tone}">${appIcon(id)}${badge?`<em class="app-badge">${badge}</em>`:""}${state.dockEditing?'<em class="dock-remove">×</em>':""}</i><span>${meta.label}</span></button>`}),empty=state.dockEditing?Array.from({length:Math.max(0,6-ids.length)},()=>'<span class="dock-empty" aria-hidden="true"><i>＋</i><small>空位</small></span>'):[];
  return `<nav class="tablet-dock ${state.dockEditing?"editing":""}" aria-label="${state.dockEditing?"正在編輯快捷列":"常用 App"}">${[...items,...empty].join("")}</nav>`;
}
function dockSelection(){return normalizeDockIds(state.dockEditing?state.dockDraftIds:state.dockAppIds,{fallback:!state.dockEditing})}
function appBadge(id){if(id==="people")return(state.npcMessages||[]).filter(message=>!message.read).length||"";if(id==="jobs")return Object.values(state.activeJobs||{}).filter(job=>job.stage==="active").length||"";if(id==="gallery")return CG_GALLERY_ITEMS.filter(galleryUnlocked).length||"";if(id==="achievements")return(state.achievementNotifications||[]).length||"";if(id==="agency")return state.agencyOffer?"!":"";return""}
function appTile(id){const meta=APP_META[id],badge=appBadge(id),selected=state.dockEditing&&dockSelection().includes(id),action=state.dockEditing?`data-dock-toggle="${id}"`:`data-open-app="${id}"`,classes=`app-tile${state.dockEditing?" dock-choice":""}${selected?" selected":""}`;return`<button class="${classes}" ${action} title="${esc(meta.note)}" aria-label="${state.dockEditing?(selected?"從快捷列移除":"加入快捷列"):"開啟"}${meta.title}"><span class="app-icon tone-${meta.tone}">${appIcon(id)}${badge?`<em class="app-badge">${badge}</em>`:""}${state.dockEditing?`<em class="dock-pick">${selected?"✓":"＋"}</em>`:""}</span><b>${meta.label}</b></button>`}
export function appWindow() {
  const meta = APP_META[state.appOpen];
  const views = { planner: plannerApp, gallery: galleryApp, timeline: timelineApp, stats: statsApp, creative: creativeApp, wardrobe: wardrobeApp, people: peopleHubApp, log: logApp, world: worldApp, achievements: achievementsApp, map: mapApp, jobs: jobsApp, npc: peopleHubApp, social: socialApp, forum: forumApp, agency: agencyApp, save: saveApp, settings: settingsApp };
  const body = views[state.appOpen]();
  return `<div class="app-backdrop" data-close-app></div><section class="app-window ${state.appOpen}" role="dialog" aria-modal="true" aria-labelledby="app-window-title" tabindex="-1"><header class="window-bar"><div class="window-icon tone-${meta.tone}">${appIcon(state.appOpen)}</div><div><h2 id="app-window-title">${meta.title}</h2><p>${meta.note}</p></div>${state.appOpen === "planner" ? `<button class="window-start" id="begin-week">開始這週 →</button>` : ""}<button class="window-close" data-close-app aria-label="關閉${meta.title}">×</button></header><div class="window-body">${body}</div></section>`;
}
