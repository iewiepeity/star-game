// 畫面層：結局結算（過勞死亡／五年周目結束／主動退圈共用同一畫面）與「開始新一輪」。
// startNewRun 是唯一會整個重置 state 的地方，透過 core/state.js 的 resetState() 完成，同時決定是否帶入「眼熟繼承」。
import{state,resetState}from"../core/state.js";
import{money}from"../core/utils.js";
import{rollStats}from"../core/stats.js";
import{relationshipSummary}from"./summary.js";

export function endingView(){const kind=state.endingType,best=Object.entries(state.stats).sort((a,b)=>b[1]-a[1]).slice(0,3);const headline=kind==="death"?"過勞衰竭・強制結束":kind==="fiveyear"?"第五年結束・周目結算":"主動退圈";const sub=kind==="death"?"疲勞超過極限，星途在此畫下句點。正式版將依此觸發專屬結局內容。":kind==="fiveyear"?"五年時間到了，這是本輪的星途總結。":"妳選擇提前結束這一輪的追夢旅程，以下是目前為止累積的成果。";return `<main class="summary-screen"><img src="./assets/rookie-room.webp" alt="新人房間"><section class="summary-paper"><span>SEASON COMPLETE</span><h1>${headline}</h1><p>${sub}</p><div class="ending-grid"><div><small>能力最高</small><b>${best[0]?`${best[0][0]} ${best[0][1]}`:"—"}</b></div><div><small>知名度／粉絲</small><b>${state.fame}／${state.fans}</b></div><div><small>財產</small><b>${money(state.money)}</b></div><div><small>已認識人物</small><b>${state.knownPeople.length} 位</b></div><div><small>戀愛狀態</small><b>${relationshipSummary()}</b></div><div><small>重要旗標</small><b>${state.flags.length} 項</b></div></div><div class="ending-inherit"><span>下一輪入口</span><p>是否啟用「認識繼承」？只帶入曾經認識過的人物眼熟印象，不保留聯絡方式、好感或資源。</p><div class="gender-options"><button class="${state.inheritChoice?"active":""}" data-inherit="yes">啟用眼熟繼承</button><button class="${!state.inheritChoice?"active":""}" data-inherit="no">不繼承</button></div></div><button class="main-btn full" id="new-run">開始新一輪 →</button></section></main>`}

export function startNewRun(){const priorKnown=[...state.knownPeople],inherit=state.inheritChoice;resetState();if(inherit)state.familiarNpcs=priorKnown;rollStats()}
