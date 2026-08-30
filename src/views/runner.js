// 畫面層：逐日事件畫面。一般行程會自動從 loading → result → 下一天；需要選擇時才暫停。
import { ACTIONS } from "../data/actions.js";
import { DAYS, SHORT } from "../data/calendar.js";
import { state } from "../core/state.js";
import { esc, money } from "../core/utils.js";
import { jobState, qualification } from "../logic/job-engine.js";
import { runnerSceneArt } from "../data/story-art.js";
import { autoAdvanceDelay, getPreferences } from "../core/preferences.js";
import { sanitizeRichText } from "../core/safe-html.js";
function playbackControls() {
  const speed = getPreferences().autoSpeed,
    canPause = state.runnerPhase === "result" && speed !== "manual",
    paused = Boolean(state.runnerPaused);
  return `<div class="runner-playback" aria-label="自動播放控制"><button data-runner-pause aria-pressed="${paused}" ${canPause ? "" : "disabled"}>${paused ? "▶ 繼續" : "Ⅱ 暫停"}</button><div role="group" aria-label="播放速度">${[
    ["manual", "手動"],
    ["x1", "1×"],
    ["x2", "2×"],
  ]
    .map(
      ([value, label]) =>
        `<button data-runner-speed="${value}" aria-pressed="${speed === value}" class="${speed === value ? "active" : ""}">${label}</button>`,
    )
    .join("")}</div></div>`;
}
export function runnerView() {
  const i = state.runnerDay,
    actionId = state.schedule[i],
    a = ACTIONS[actionId],
    art = runnerSceneArt(
      actionId,
      state.freeLocations?.[i],
      state.runnerResult,
    );
  return `<main class="event-screen"><img src="${art.src}" alt="${art.alt}" style="object-position:${art.position}"><div class="event-top"><div class="logo dark">✦ 星途未定</div><div>${state.week} 週・DAY ${i + 1}　${DAYS[i]}</div><div>體力 ${state.stamina}　疲勞 ${state.fatigue}</div></div><ol class="day-track" aria-label="本週進度">${DAYS.map((d, x) => `<li class="${x < i ? "done" : x === i ? "now" : ""}" ${x === i ? 'aria-current="step"' : ""}>${x < i ? "✓" : x + 1}<small>${SHORT[x]}</small></li>`).join("")}</ol><section class="story-box" aria-live="polite"><div class="story-action"><i>${a.icon}</i><span><small>今日行程</small><b>${a.label}</b><em>${a.note}</em></span>${playbackControls()}</div>${state.runnerPhase === "loading" ? `<div class="story-loading" role="status"><i></i><b>今天正在發生……</b><small>一般行程會自動結算並進入下一天</small></div>` : state.runnerPhase === "decision" ? decisionView() : resultView()}</section></main>`;
}
function relationshipCues(data) {
  return data?.relationshipCues?.length
    ? `<div class="relationship-float-layer" aria-live="polite">${data.relationshipCues.map((cue, index) => { const kind=/^[a-z-]+$/i.test(cue.kind||"")?cue.kind:"neutral";return `<span class="${kind}" style="--cue-delay:${index * 0.18}s" aria-label="${esc(cue.label)}" title="${esc(cue.label)}"><i>${esc(cue.symbol)}</i><small>${esc(cue.label)}</small></span>`;}).join("")}</div>`
    : "";
}
function npcArt(data) {
  const accent = /^#[0-9a-f]{3,8}$/i.test(data?.accent || "")
    ? data.accent
    : "#c77880";
  return data?.portrait
    ? `<figure class="runner-npc-art" style="--npc-accent:${accent}"><img src="${esc(data.portrait)}" alt="${esc(data.npcName || "NPC")}半身立繪" loading="eager">${relationshipCues(data)}<figcaption>${esc(data.npcName || "")}</figcaption></figure>`
    : "";
}
function venueBoard(venue) {
  if (!venue) return "";
  const jobs = venue.jobs || [];
  return `<section class="venue-board"><header><span>ON-SITE CASTING DESK</span><h3>${esc(venue.company.name)}・現場公開徵選</h3><p>${esc(venue.company.note)}</p></header>${venue.notice ? `<div class="venue-notice">${esc(venue.notice)}</div>` : ""}<div class="venue-job-list">${
    jobs.length
      ? jobs
          .map((job) => {
            const record = jobState(job.id),
              q = qualification(job),
              available = record.stage === "available",
              missing = q.rows.filter((row) => !row.met).map((row) => row.name),
              status =
                record.stage === "applied"
                  ? "已登記，之後可到通告信箱安排試鏡"
                  : record.stage !== "available"
                    ? `目前進度：${record.stage}`
                    : q.met
                      ? "資格符合，可當場登記"
                      : "尚缺條件：" +
                        (missing.join("、") || `訓練 ${q.trainingRequired} 次`);
            return `<article class="venue-job-card"><div><span>${"★".repeat(job.stars)}・${esc(job.category)}</span><b>${esc(job.title)}</b><small>${esc(job.client)}・報酬 ${money(job.pay)}</small><em>${esc(status)}</em></div><button data-venue-apply="${job.id}" ${!available || !q.met ? "disabled" : ""}>${record.stage === "applied" ? "已登記" : available ? "登記試鏡" : "已處理"}</button></article>`;
          })
          .join("")
      : `<div class="venue-empty"><b>今天沒有適合目前階段的公開徵選</b><small>公司已經記錄在通告信箱；之後有新案時會出現在那裡。</small></div>`
  }</div></section>`;
}
export function decisionView() {
  const d = state.runnerDecision;
  return `<div class="decision ${d.kind === "npc_interaction" ? "npc-interaction-decision" : ""}">${npcArt(d)}<div class="runner-scene-copy"><span>CHOICE・自動播放暫停</span><h2>${esc(d.title)}</h2><p>${esc(d.text)}</p><div>${d.choices.map((c) => `<button data-choice="${esc(c.id)}"><b>${esc(c.label)}</b><small>${esc(c.note)}</small></button>`).join("")}</div></div></div>`;
}
export function resultView() {
  const r = state.runnerResult,
    next = state.runnerDay === 6 ? "本週總結" : DAYS[state.runnerDay + 1],
    delay = autoAdvanceDelay(),
    manual = delay == null,
    interactive = r.requiresInteraction || r.venue || r.portrait,
    note = r.venue
      ? "現場看板會停留；查看或登記完畢後，再親自前往下一天。"
      : interactive
        ? "這段內容需要你確認；閱讀或處理完畢後再前往下一天。"
        : state.runnerPaused
          ? "自動播放已暫停；你可以繼續播放或直接前往下一天。"
          : manual
            ? "目前使用手動播放；準備好時再前往下一天。"
            : `即將自動進入${next}……`;
  const countdown =
    !interactive && !manual && !state.runnerPaused
      ? `<span class="runner-countdown" style="--runner-delay:${delay}ms" aria-hidden="true"><i></i></span>`
      : "";
  return `<div class="day-result ${r.success ? "success" : "fail"} ${r.portrait ? "npc-interaction-result" : ""} ${r.venue ? "venue-result" : ""}">${npcArt(r)}<div class="runner-scene-copy"><span>${r.success ? "RESULT・SUCCESS" : "RESULT・EXPERIENCE"}</span><h2>${esc(r.title)}</h2><div class="day-result-copy">${sanitizeRichText(r.text)}</div>${venueBoard(r.venue)}<div class="day-result-stats"><b>💰 ${money(state.money)}</b><b>★ 知名度 ${state.fame}</b><b>♡ 粉絲 ${state.fans}</b></div><p class="runner-auto-note">${note}</p>${countdown}<button class="main-btn" id="next-day">${state.runnerDay === 6 ? "查看本週總結" : "進入" + next} →</button></div></div>`;
}
