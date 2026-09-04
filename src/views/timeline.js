import { state } from "../core/state.js";
import {titleTag, esc } from "../core/utils.js";
import { NPCS } from "../data/npcs.js";
import { workArtFor } from "../data/work-art.js";

const FILTERS={all:"全部",unread:"未讀",people:"人物",works:"作品",decisions:"選擇"};
export function timelineItems(){
 const messages=(state.npcMessages||[]).map((x,index)=>({id:`message-${index}`,week:x.week,group:"people",unread:!x.read,npcId:x.npcId,type:x.read?"人物訊息":"未讀訊息",title:NPCS[x.npcId]?.name||"人物",text:x.text,urgent:!x.read,target:"npc"}));
 const events=(state.eventHistory||[]).map((x,index)=>({id:`event-${index}`,week:x.week,group:"decisions",type:x.kind||"重大選擇",title:x.title,text:`你選擇了「${x.choiceLabel||"確認"}」${x.outcome?`；${x.outcome}`:""}`,target:"planner"}));
 const decisions=(state.majorDecisionHistory||[]).map((x,index)=>({id:`decision-${index}`,week:x.week,group:"decisions",type:"永久方針",title:`第 ${x.year} 年・${x.label}`,text:"這項選擇持續改變資源、工作門檻與結局。",urgent:true,target:"planner"}));
 const works=(state.completedWorks||[]).map((x,index)=>({id:`work-${index}`,week:x.completedWeek||x.week,group:"works",type:"作品",title:`${titleTag(x.title)}`,text:x.storyLegacy||`${x.category||"作品"}已進入履歷。`,art:workArtFor(x),target:"world"}));
 const invitations=(state.npcInvitationHistory||[]).filter(x=>x.response!=="pending").map((x,index)=>({id:`invite-${index}`,week:x.resolvedWeek||x.week,group:"people",npcId:x.npcId,type:"人物邀約",title:NPCS[x.npcId]?.name||"人物",text:`${x.label||x.response}・${x.title||"私人行程"}`,target:"npc"}));
 const filter=FILTERS[state.timelineFilter]?state.timelineFilter:"all",query=(state.timelineQuery||"").trim().toLowerCase();
 return [...messages,...events,...decisions,...works,...invitations].filter(x=>x.week&&(filter==="all"||filter==="unread"&&x.unread||x.group===filter)&&(!query||`${x.type} ${x.title} ${x.text}`.toLowerCase().includes(query))).sort((a,b)=>b.week-a.week).slice(0,80);
}

export function timelineApp(){
 const items=timelineItems(),unread=(state.npcMessages||[]).filter(x=>!x.read).length,pending=(state.eventQueue?.length||0)+(state.queuedEvents?.filter(x=>x.dueWeek<=state.week+1).length||0);
 return `<div class="timeline-page"><header class="timeline-hero"><div><span>ONE TIMELINE</span><h2>星途時間線</h2><p>人物、作品、邀約與永久選擇集中在同一處；可篩選、搜尋並直接跳回來源。</p></div><strong>${unread} 則人物未讀<br>${pending} 件近期事件</strong></header><nav class="timeline-filters" aria-label="時間線篩選">${Object.entries(FILTERS).map(([id,label])=>`<button class="${state.timelineFilter===id?"active":""}" data-timeline-filter="${id}" aria-pressed="${state.timelineFilter===id}">${label}</button>`).join("")}<input data-timeline-query value="${esc(state.timelineQuery||"")}" placeholder="搜尋人物、作品或選擇" aria-label="搜尋時間線"><button data-timeline-search>搜尋</button>${unread?`<button data-timeline-read-all>全部已讀</button>`:""}<b>${items.length} 筆</b></nav>${items.length?`<section class="timeline-list">${items.map(item=>`<article class="${item.urgent?"urgent":""} ${item.art?"timeline-work":""}" id="${item.id}"><i>${item.week}</i>${item.art?`<img src="${item.art.src}" alt="${esc(item.art.alt)}" loading="lazy">`:""}<div><span>${esc(item.type)}</span><h3>${esc(item.title||"旅程紀錄")}</h3><p>${esc(item.text||"")}</p>${item.target?`<button data-timeline-open="${item.target}" data-npc-id="${item.npcId||""}">前往來源</button>`:""}</div></article>`).join("")}</section>`:`<section class="timeline-empty"><b>這個篩選暫時沒有紀錄</b><p>換一個分類或清除搜尋即可回到完整旅程。</p></section>`}</div>`;
}
