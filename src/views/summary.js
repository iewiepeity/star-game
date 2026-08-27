// 畫面層：週結算畫面——本週獎勵結果、完成度與逐日回顧；「第三項數據」依簽約狀態顯示合約剩餘週數／自由藝人／簽約進度。
import{NPCS}from"../data/npcs.js";
import{state}from"../core/state.js";
import{money}from"../core/utils.js";
import{isAgencyContractActive}from"../logic/agency.js";

export function summaryView(){const ok=state.weekResults.filter(r=>r.success).length,nextWeek=state.week+1+state.hospitalSkipWeeks,thirdStat=isAgencyContractActive()?`<div><small>合約剩餘</small><b>${Math.max(0,state.agencyContractEndWeek-state.week+1)} 週</b></div>`:state.agencyStatus==="expired"?`<div><small>目前身分</small><b>自由藝人</b></div>`:`<div><small>簽約進度</small><b>${state.contract}%</b></div>`;return `<main class="summary-screen"><img src="./assets/rookie-room.webp" alt="新人房間"><section class="summary-paper"><span>WEEK ${state.week} COMPLETE</span><h1>${state.reward.title}</h1><p>${state.reward.text}</p><div class="reward-status"><div><small>順利完成</small><b>${ok}/7</b></div><div><small>現有存款</small><b>${money(state.money)}</b></div>${thirdStat}<div><small>目前疲勞</small><b>${state.fatigue}</b></div></div><div class="week-recap">${state.weekResults.map(r=>`<div><span>${r.day}</span><b>${r.action}</b><em>${r.success?"成功":"累積經驗"}</em></div>`).join("")}</div><button class="main-btn" id="next-week">${state.hospitalSkipWeeks?`完成一週住院休養，回到第 ${nextWeek} 週`:`回到房間，開始第 ${nextWeek} 週`} →</button></section></main>`}

export function relationshipSummary(){const entries=Object.entries(state.relationships).filter(([id])=>state.knownPeople.includes(id));return entries.length?entries.map(([id,r])=>`${NPCS[id].name}｜${r.romance==="none"?"認識":r.romance}`).join("・"):"尚未建立戀愛關係"}
