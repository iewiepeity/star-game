import { playerLookCard } from "./player-look.js";
import { scenePosition } from "../logic/scene-reader.js";
import { state } from "../core/state.js";
import { esc } from "../core/utils.js";
import { eventStoryArt } from "../data/story-art.js";
import { availableChoices } from "../logic/event-engine.js";

const EVENT_ICONS = {
  職涯事件: "✦",
  人物事件: "♡",
  選擇事件: "?",
  醜聞: "!",
  戀愛事件: "❦",
  世界事件: "◎",
};
const eventIcon = (kind) => EVENT_ICONS[kind] || "✧";

export function eventView() {
  const item = state.activeEvent;
  if (!item && state.eventOutcome) {
    const r = state.eventOutcome,
      art = eventStoryArt(r),
      effects = r.effects?.length
        ? r.effects.map((x) => `<li>${x}</li>`).join("")
        : `<li>這次選擇已寫入本輪經歷，可能成為後續事件的條件。</li>`;
    return `<main class="narrative-event-screen" style="--event-art:url('${art.src}')"><div class="event-ambient" aria-hidden="true"></div><section class="narrative-event-card event-outcome"><div class="event-card-rule"><span>EVENT RESULT</span><em>結果已記錄</em></div>${eventArtwork(art)}<div class="event-outcome-body"><i>✓</i><span>${esc(r.kind || "事件結果")}</span><h1>${esc(r.title || "事件處理完成")}</h1>${playerLookCard({ compact: true })}<div class="event-choice-made"><small>你的選擇</small><b>${esc(r.choiceLabel || "確認這段經歷")}</b></div><p>${esc(r.outcome || "這次決定已經留下影響，未來可能在其他事件中再次被提起。")}</p><section><b>本次影響</b><ul>${effects}</ul></section>${r.hasFollowUp ? `<aside>✦ 這段故事尚未結束，後續會在符合條件時出現。</aside>` : ""}<button id="event-continue" class="main-btn">確認結果・回到房間 →</button></div></section></main>`;
  }
  if (!item)
    return `<main class="narrative-event-screen"><div class="event-ambient" aria-hidden="true"></div><section class="narrative-event-card event-finished"><i>✓</i><span>EVENT COMPLETE</span><h1>事件處理完成</h1><p>所有待處理事件都已確認，可以回到房間繼續安排本週行程。</p><button id="event-continue" class="main-btn">回到房間 →</button></section></main>`;
  const e = item.event,
    kind = e.kind || item.source || "事件",
    choices = availableChoices(e),
    beats = e.beats || [],
    art = eventStoryArt(e);
  const position = scenePosition(item);
  const scene = beats.length
    ? `<div class="event-scene-beats"><section tabindex="-1" id="current-scene"><span>ACT ${String(position.index + 1).padStart(2, "0")}・${esc(beats[position.index].label || "場景")}</span><p>${esc(beats[position.index].text || "")}</p></section></div><div class="scene-reader-controls"><button data-scene-back ${position.index === 0 ? "disabled" : ""}>← 上一幕</button><span class="scene-reader-progress">${position.index + 1} / ${beats.length}</span>${position.last ? "" : `<button data-scene-next>繼續閱讀 →</button>`}</div>${
        position.index > 0
          ? `<details class="scene-transcript"><summary>回看已讀內容</summary>${beats
              .slice(0, position.index)
              .map((beat) => `<p>${esc(beat.text || "")}</p>`)
              .join("")}</details>`
          : ""
      }`
    : `<p>${esc(e.text || "")}</p>`;
  return `<main class="narrative-event-screen" style="--event-art:url('${art.src}')"><div class="event-ambient" aria-hidden="true"></div><header class="narrative-event-top"><div class="logo dark">✦ 星途未定</div><div><span>CAREER STORY</span><b>第 ${state.week} 週</b></div></header><article class="narrative-event-card ${beats.length ? "scene-event" : ""}"><div class="event-card-rule"><span>${esc(kind)}</span><em>${beats.length ? `${beats.length} 幕互動場景` : "本週唯一事件"}</em></div>${eventArtwork(art)}<div class="event-card-body"><aside><i>${eventIcon(kind)}</i><small>WEEK ${state.week}</small></aside><section><span class="event-eyebrow">NEW EVENT・${esc(kind)}</span><h1>${esc(e.title || "突發事件")}</h1>${scene}${playerLookCard({ compact: true })}${!position.last ? "" : choices.length ? `<div class="event-choice-list">${choices.map((c, index) => `<button data-event-choice="${esc(c.id)}" class="${c.special ? "special-choice" : ""}"><em>${String(index + 1).padStart(2, "0")}</em><span><b>${esc(c.label)}</b>${c.special ? `<small>✦ 累積經歷解鎖・${esc(c.note || "特殊選項")}</small>` : c.note ? `<small>${esc(c.note)}</small>` : ""}${c.followUp ? `<u>這個選擇會在之後形成專屬後續</u>` : ""}</span><i>→</i></button>`).join("")}</div>` : `<button id="event-resolve" class="event-confirm"><span>確認這段經歷</span><i>→</i></button>`}<button id="event-skip" class="event-later">稍後再處理</button></section></div><footer><span>事件結果會寫入本輪經歷</span><i></i><span>其他事件會順延到後續週次</span></footer></article></main>`;
}

function eventArtwork(art) {
  return art
    ? `<figure class="event-story-art"><img src="${art.src}" alt="${esc(art.alt)}" style="object-position:${art.position}" decoding="async" fetchpriority="high"><figcaption>STORY CG</figcaption></figure>`
    : "";
}
