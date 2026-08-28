import{FORUM_THREADS,FORUM_CATEGORIES,FORUM_HANDLES}from"../data/forum.js";
import{state}from"../core/state.js";
import{esc}from"../core/utils.js";

function playerThread(){
 const latest=state.weekResults.at(-1),known=state.knownPeople.length;
 const title=state.fame>=80?`最近常看到新人「${state.name}」，有人追嗎？`:latest?`有人在${latest.action}看到一位很認真的新人`:"星望市是不是又多了一位新人？";
 const body=state.rep.爭議度>=120?"討論很多，先提醒大家理性，不要把猜測當成事實。":known?"聽說已經開始跑行程，也和圈內人有互動。先放一個觀察名單。":"目前資料很少，只知道正在默默訓練。新人加油。";
 return{id:"player",category:"熱門",title,author:"新人觀察簿",body,heat:Math.max(48,state.fame*7+state.fans),replies:["有努力就先給鼓勵。","先看作品，不急著下定論。","感覺會是慢慢成長的類型。","這串先卡位，以後紅了回來簽到。"]};
}
function allThreads(){return[playerThread(),...FORUM_THREADS]}
function repliesFor(thread){const shift=state.forumRefresh%thread.replies.length;return Array.from({length:6},(_,i)=>({handle:FORUM_HANDLES[(i+shift+thread.id.length)%FORUM_HANDLES.length],text:thread.replies[(i+shift)%thread.replies.length],likes:3+((thread.heat+i*17+shift*9)%86)}))}

export function forumApp(){
 const threads=allThreads(),selected=threads.find(t=>t.id===state.forumThread);
 if(selected)return `<div class="forum-page"><button class="forum-back" data-forum-back>← 返回討論區</button><article class="forum-thread-detail"><span>${selected.category}・熱度 ${selected.heat}</span><h2>${esc(selected.title)}</h2><small>${esc(selected.author)}・第 ${state.week} 週</small><p>${esc(selected.body)}</p></article><div class="forum-reply-head"><b>網友回覆</b><button data-forum-refresh>重新整理留言 ↻</button></div><div class="forum-replies">${repliesFor(selected).map((r,i)=>`<article><i>${r.handle.slice(0,1)}</i><div><b>${esc(r.handle)}</b><p>${esc(r.text)}</p><small>#${i+1}・♡ ${r.likes}</small></div></article>`).join("")}</div></div>`;
 const category=state.forumCategory||"熱門",visible=category==="熱門"?threads:threads.filter(t=>t.category===category);
 return `<div class="forum-page"><header class="forum-hero"><div><span>STAR TALK</span><h2>星談論壇</h2><p>匿名娛樂圈討論區・內容會隨玩家近況改變</p></div><b>即時熱門 ${threads.reduce((n,t)=>n+t.heat,0)}</b></header><nav class="forum-tabs">${FORUM_CATEGORIES.map(c=>`<button class="${c===category?"active":""}" data-forum-category="${c}">${c}</button>`).join("")}</nav><div class="forum-thread-list">${visible.map((t,i)=>`<button data-forum-thread="${t.id}"><i>${i+1}</i><span><small>${t.category}・${esc(t.author)}</small><b>${esc(t.title)}</b><em>${esc(t.body)}</em></span><strong>🔥 ${t.heat}</strong></button>`).join("")}</div><aside class="forum-disclaimer">論壇為規則與文字模板模擬，不使用 AI，也不代表真實人物或網友發言。</aside></div>`;
}
