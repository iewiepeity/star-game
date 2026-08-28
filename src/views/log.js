import{state}from"../core/state.js";
import{esc}from"../core/utils.js";
import{careerRoute}from"../logic/career.js";

const list=items=>`<div class="log-list">${items.join("")}</div>`;
export function logApp(){
 const works=state.completedWorks||[],awards=state.awards||[];
 return `<div class="inside-page"><div class="inside-title"><div><span>CAREER LOG</span><h2>星途紀錄</h2></div><p>目前路線：${esc(careerRoute())}</p></div>
 ${works.length?`<div class="inside-title"><div><span>PORTFOLIO</span><h3>作品履歷</h3></div><p>${works.length} 部作品</p></div>${list([...works].reverse().map(work=>`<article><b>${"★".repeat(work.stars)} ${esc(work.title)}</b><span>品質 ${work.quality}</span><small>${esc(work.category)}・${esc(work.role)}・第 ${work.completedWeek} 週完成</small></article>`))}`:""}
 ${awards.length?`<div class="inside-title"><div><span>AWARDS</span><h3>獎項紀錄</h3></div><p>${awards.length} 項</p></div>${list([...awards].reverse().map(award=>`<article><b>${esc(award.name)}</b><span>${esc(award.result)}</span><small>${esc(award.category)}・第 ${award.week} 週</small></article>`))}`:""}
 ${state.flags.length?`<div class="inside-title"><div><span>BUTTERFLY FLAGS</span><h3>重要旗標</h3></div><p>${state.flags.length} 項</p></div>${list([...state.flags].reverse().map(flag=>`<article><b>第 ${flag.week} 週</b><span>旗標</span><small>${esc(flag.label)}｜${esc(flag.note)}</small></article>`))}`:""}
 ${state.history.length?`<div class="inside-title"><div><span>WEEKLY LOG</span><h3>每週紀錄</h3></div></div>${list([...state.history].reverse().map(week=>`<article><b>第 ${week.week} 週</b><span>${week.hospitalized?"住院":week.results.filter(result=>result.success).length+" 次成功"}</span><small>${week.results.map(result=>result.action).join("・")||"住院休養"}</small></article>`))}`:`<div class="tablet-empty"><span>✦</span><h3>第一頁還是空白</h3><p>完成作品、獲得獎項或跑完第一週後，成果會整理在這裡。</p></div>`}</div>`;
}
