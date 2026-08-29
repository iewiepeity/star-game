import { state } from "../core/state.js";
import { esc } from "../core/utils.js";
import { NPCS } from "../data/npcs.js";

function timelineItems(){
 const messages=(state.npcMessages||[]).map(x=>({week:x.week,type:x.read?"人物訊息":"未讀訊息",title:NPCS[x.npcId]?.name||"人物",text:x.text,urgent:!x.read}));
 const events=(state.eventHistory||[]).map(x=>({week:x.week,type:x.kind||"重大選擇",title:x.title,text:`你選擇了「${x.choiceLabel||"確認"}」${x.outcome?`；${x.outcome}`:""}`}));
 const decisions=(state.majorDecisionHistory||[]).map(x=>({week:x.week,type:"永久方針",title:`第 ${x.year} 年・${x.label}`,text:"這項選擇會持續改變後續資源與結局權重。",urgent:true}));
 const works=(state.completedWorks||[]).map(x=>({week:x.completedWeek||x.week,type:"作品",title:`《${x.title}》`,text:x.storyLegacy||`${x.category||"作品"}已進入履歷。`}));
 const invitations=(state.npcInvitationHistory||[]).filter(x=>x.response!=="pending").map(x=>({week:x.resolvedWeek||x.week,type:"人物邀約",title:NPCS[x.npcId]?.name||"人物",text:`${x.label||x.response}・${x.title||"私人行程"}`}));
 return [...messages,...events,...decisions,...works,...invitations].filter(x=>x.week).sort((a,b)=>b.week-a.week).slice(0,60);
}

export function timelineApp(){
 const items=timelineItems(),unread=(state.npcMessages||[]).filter(x=>!x.read).length,pending=(state.eventQueue?.length||0)+(state.queuedEvents?.filter(x=>x.dueWeek<=state.week+1).length||0);
 return `<div class="timeline-page"><header class="timeline-hero"><div><span>ONE TIMELINE</span><h2>星途時間線</h2><p>人物、作品、邀約與永久選擇集中在同一處，不必在十個頁面裡考古。</p></div><strong>${unread} 則人物未讀<br>${pending} 件近期事件</strong></header><nav class="timeline-filters"><span>最新優先</span><b>${items.length} 筆旅程紀錄</b></nav>${items.length?`<section class="timeline-list">${items.map(item=>`<article class="${item.urgent?"urgent":""}"><i>${item.week}</i><div><span>${esc(item.type)}</span><h3>${esc(item.title||"旅程紀錄")}</h3><p>${esc(item.text||"")}</p></div></article>`).join("")}</section>`:`<section class="timeline-empty"><b>旅程才剛開始</b><p>第一個人物訊息、作品或重大選擇出現後，就會被整理在這裡。</p></section>`}</div>`;
}
