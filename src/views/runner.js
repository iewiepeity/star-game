// 畫面層：逐日事件畫面（讀秒 loading → 現場選擇 → 結果），對應 logic/runner.js 的 startDay/resolveDay 流程狀態。
import{ACTIONS}from"../data/actions.js";
import{DAYS,SHORT}from"../data/calendar.js";
import{state}from"../core/state.js";
import{money}from"../core/utils.js";

export function runnerView(){const i=state.runnerDay,a=ACTIONS[state.schedule[i]];return `<main class="event-screen"><img src="./assets/star-city-street.webp" alt="星望市娛樂街景"><div class="event-top"><div class="logo dark">✦ 星途未定</div><div>${state.week} 週・DAY ${i+1}　${DAYS[i]}</div><div>體力 ${state.stamina}　疲勞 ${state.fatigue}</div></div><div class="day-track">${DAYS.map((d,x)=>`<i class="${x<i?"done":x===i?"now":""}">${x<i?"✓":x+1}<small>${SHORT[x]}</small></i>`).join("")}</div><section class="story-box"><div class="story-action"><i>${a.icon}</i><span><small>今日行程</small><b>${a.label}</b><em>${a.note}</em></span></div>${state.runnerPhase==="loading"?`<div class="story-loading"><i></i><b>今天正在發生……</b></div>`:state.runnerPhase==="decision"?decisionView():resultView()} </section></main>`}
export function decisionView(){const d=state.runnerDecision;return `<div class="decision"><span>CHOICE</span><h2>${d.title}</h2><p>${d.text}</p><div>${d.choices.map(c=>`<button data-choice="${c.id}"><b>${c.label}</b><small>${c.note}</small></button>`).join("")}</div></div>`}
export function resultView(){const r=state.runnerResult;return `<div class="day-result ${r.success?"success":"fail"}"><span>${r.success?"RESULT・SUCCESS":"RESULT・EXPERIENCE"}</span><h2>${r.title}</h2><p>${r.text}</p><div><b>💰 ${money(state.money)}</b><b>★ 知名度 ${state.fame}</b><b>♡ 粉絲 ${state.fans}</b></div><button class="main-btn" id="next-day">${state.runnerDay===6?"查看本週總結":"前往"+DAYS[state.runnerDay+1]} →</button></div>`}
