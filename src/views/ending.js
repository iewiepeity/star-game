import { playerLookCard } from "./player-look.js";
import { state, resetState } from "../core/state.js";
import {titleTag, money, esc } from "../core/utils.js";
import { rollStats } from "../core/stats.js";
import { evaluateEnding } from "../logic/career.js";
import { NPCS } from "../data/npcs.js";
import { endingArt } from "../data/season-art.js";
import { confirmationDialog } from "./confirm-dialog.js";
function retrospective(result) {
  const bestWork = result.portfolio.bestWork,
    bestRel = result.relationship,
    npc = bestRel && NPCS[bestRel.npcId],
    milestones = [...(result.snapshot.flags || [])]
      .filter((flag) =>
        /正式簽約|完成作品|原創發行|獎|關係|住院/.test(flag.label),
      )
      .slice(-8);
  return `<section class="ending-retrospective"><header><span>FIVE-YEAR RETROSPECTIVE</span><h2>這五年，不只是一張成績單</h2></header><div class="ending-highlight-grid"><article><small>代表作</small><b>${bestWork ? `${titleTag(esc(bestWork.title))}` : "仍在等待命名"}</b><p>${bestWork ? `${esc(bestWork.category)}・品質 ${bestWork.quality}・第 ${bestWork.completedWeek} 週完成` : "有些人的代表作，會在下一輪才真正出現。"}</p></article><article><small>最重要的羈絆</small><b>${npc ? esc(npc.name) : "一路走來的自己"}</b><p>${npc ? `在工作之外，${esc(npc.name)}也記得真正的你。` : "沒有固定答案，不代表這五年是獨自白走。"}</p></article></div>${milestones.length ? `<div class="ending-timeline">${milestones.map((flag) => `<article><i>${flag.week}</i><div><b>${esc(flag.label)}</b><p>${esc(flag.note)}</p></div></article>`).join("")}</div>` : ""}</section>`;
}
function baseEndingView() {
  const result = state.endingResult || evaluateEnding(state.endingType),
    best = Object.entries(state.stats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3),
    art = endingArt(result);
  return `<main class="summary-screen ending-screen"><img src="${art.src}" alt="${art.alt}"><section class="summary-paper rich-ending"><figure class="ending-hero"><img src="${art.src}" alt=""><figcaption><span>SEASON COMPLETE・${esc(result.rank)}</span><h1>${esc(result.title)}</h1><p>${esc(result.summary)}</p></figcaption></figure>${playerLookCard({ compact: true })}<div class="ending-grid"><div><small>職涯路線</small><b>${esc(result.route)}</b></div><div><small>結局評分</small><b>${result.score}</b></div><div><small>完成作品</small><b>${result.portfolio.works} 部</b></div><div><small>獎項成就</small><b>${result.awardWins} 座／${result.portfolio.awards} 次紀錄</b></div><div><small>代表能力</small><b>${best.map(([name, value]) => `${name} ${value}`).join("・") || "—"}</b></div><div><small>知名度／粉絲</small><b>${state.fame}／${state.fans}</b></div><div><small>財產</small><b>${money(state.money)}</b></div><div><small>已認識人物</small><b>${state.knownPeople.length} 位</b></div></div>${result.badges.length ? `<div class="ending-badges">${result.badges.map((badge) => `<span>${esc(badge)}</span>`).join("")}</div>` : ""}${retrospective(result)}<div class="ending-inherit"><span>下一輪入口</span><p>是否啟用「認識繼承」？只保留曾經相遇的眼熟印象，不帶走聯絡方式、關係數值或資源。</p><div class="gender-options"><button class="${state.inheritChoice ? "active" : ""}" data-inherit="yes">啟用眼熟繼承</button><button class="${!state.inheritChoice ? "active" : ""}" data-inherit="no">不繼承</button></div></div><button class="main-btn full" id="new-run">開始新一輪 →</button></section></main>`;
}
export function endingView() {
  return (
    baseEndingView()
      .replace(
        'data-inherit="yes"',
        `data-inherit="yes" aria-pressed="${Boolean(state.inheritChoice)}"`,
      )
      .replace(
        'data-inherit="no"',
        `data-inherit="no" aria-pressed="${!state.inheritChoice}"`,
      ) + confirmationDialog()
  );
}
export function startNewRun() {
  const priorKnown = [...state.knownPeople],
    inherit = state.inheritChoice,
    nextRun = (state.runCount || 1) + 1;
  const achievements = structuredClone(state.unlockedAchievements || []),
    notifications = [...(state.achievementNotifications || [])];
  const dockAppIds = [...(state.dockAppIds || [])];
  const endingHistory = structuredClone(state.endingHistory || []),
    result = state.endingResult || evaluateEnding(state.endingType);
  if (result && !endingHistory.some((x) => x.run === (state.runCount || 1)))
    endingHistory.push({
      run: state.runCount || 1,
      week: state.week,
      endingId: result.endingId,
      title: result.title,
      rank: result.rank,
      score: result.score,
      route: result.route,
    });
  resetState();
  state.runCount = nextRun;
  state.unlockedAchievements = achievements;
  state.achievementNotifications = notifications;
  state.endingHistory = endingHistory;
  state.dockAppIds = dockAppIds;
  if (inherit) state.familiarNpcs = priorKnown;
  rollStats();
}
