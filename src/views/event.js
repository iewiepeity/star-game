import{state}from"../core/state.js";
import{esc}from"../core/utils.js";

const EVENT_ICONS={職涯事件:"✦",人物事件:"♡",選擇事件:"?",醜聞:"!",戀愛事件:"❦",世界事件:"◎"};
const eventIcon=kind=>EVENT_ICONS[kind]||"✧";

export function eventView(){
 const item=state.activeEvent;
 if(!item)return`<main class="narrative-event-screen"><div class="event-ambient" aria-hidden="true"></div><section class="narrative-event-card event-finished"><i>✓</i><span>EVENT COMPLETE</span><h1>事件處理完成</h1><p>所有待處理事件都已確認，可以回到房間繼續安排本週行程。</p><button id="event-continue" class="main-btn">回到房間 →</button></section></main>`;
 const e=item.event,kind=e.kind||item.source||"事件",choices=e.choices||[];
 return`<main class="narrative-event-screen"><div class="event-ambient" aria-hidden="true"></div><header class="narrative-event-top"><div class="logo dark">✦ 星途未定</div><div><span>CAREER STORY</span><b>第 ${state.week} 週</b></div></header><article class="narrative-event-card"><div class="event-card-rule"><span>${esc(kind)}</span><em>本週唯一事件</em></div><div class="event-card-body"><aside><i>${eventIcon(kind)}</i><small>WEEK ${state.week}</small></aside><section><span class="event-eyebrow">NEW EVENT・${esc(kind)}</span><h1>${esc(e.title||"突發事件")}</h1><p>${esc(e.text||"")}</p>${choices.length?`<div class="event-choice-list">${choices.map((c,index)=>`<button data-event-choice="${esc(c.id)}"><em>${String(index+1).padStart(2,"0")}</em><span><b>${esc(c.label)}</b>${c.note?`<small>${esc(c.note)}</small>`:""}</span><i>→</i></button>`).join("")}</div>`:`<button id="event-resolve" class="event-confirm"><span>確認這段經歷</span><i>→</i></button>`}<button id="event-skip" class="event-later">稍後再處理</button></section></div><footer><span>事件結果會寫入本輪經歷</span><i></i><span>其他事件會順延到後續週次</span></footer></article></main>`;
}
