import { state } from "../core/state.js";
import { esc } from "../core/utils.js";
import { personalStoryStatus } from "../logic/personal-stories.js";
import { narrativePreferences } from "../logic/narrative-preferences.js";

export function personalStoryReminder(npcId, game = state) {
  const story = personalStoryStatus(npcId, game);
  if (!story?.ready || !narrativePreferences(game).storyReminders) return "";
  return `<article class="npc-memory-card"><small>有空再接著聊</small><h3>${esc(story.title)}</h3><p>有一章近況可以繼續，也可以先保留。</p><button data-npc-profile-tab="memories">看看這段故事</button></article>`;
}
export function personalStoryPanel(npcId, game = state) {
  const story = personalStoryStatus(npcId, game);
  if (!story) return "";
  return `<section class="npc-shared-memories personal-story-panel"><header><span>OUR ONGOING STORY</span><h3>${esc(story.title)}</h3></header><p>${story.status === "completed" ? "已完成" : story.status === "paused" ? "暫放中" : `第 ${story.chapterNumber}／${story.chapterCount} 章`}・${esc(story.reason)}</p>${story.ending ? `<p>${esc(story.ending)}</p>` : ""}${story.invitation ? `<article><b>你們先前的選擇留下的邀請</b><p>${esc(story.invitation.text)}</p></article>` : ""}<div class="npc-actions">${story.ready ? `<button data-personal-story-open="${npcId}">把這一章排進後續</button>` : ""}${story.canPause ? `<button data-personal-story-pause="${npcId}">先暫放這段故事</button>` : ""}${story.canResume ? `<button data-personal-story-resume="${npcId}">從原來那一章繼續</button>` : ""}</div>${story.history.length ? `<details><summary>翻閱已經走過的 ${story.history.length} 章</summary>${story.history.map(item => `<article><small>第 ${item.week} 週・第 ${item.chapter + 1} 章</small><p>${esc(item.outcome)}</p></article>`).join("")}</details>` : ""}</section>`;
}
