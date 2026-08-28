import{NPCS}from"../data/npcs.js";
import{state}from"../core/state.js";
import{esc}from"../core/utils.js";

const row=(label,value)=>`<div><dt>${label}</dt><dd>${esc(value)}</dd></div>`;
const section=(title,items,open=false)=>`<details class="npc-info-section" ${open?"open":""}><summary>${title}<span>展開</span></summary><dl>${items.map(([label,value])=>row(label,value)).join("")}</dl></details>`;

export function npcApp(){
 const ids=state.knownPeople.filter(id=>NPCS[id]);
 if(!ids.length)return `<div class="tablet-empty"><span>◈</span><h3>還沒有認識任何人</h3><p>人物檔案不會預先劇透。安排自由活動並選擇「主動探索」，真正相遇後才會收錄資料。</p><button data-go-free>去安排自由活動</button></div>`;
 const current=ids.includes(state.selectedNpc)?state.selectedNpc:ids[0],npc=NPCS[current],p=npc.profile,rel=state.relationships[current]||{closeness:0,trust:0,romance:"none"},familiar=state.familiarNpcs.includes(current),artView=state.npcArtView==="full"?"full":"bust",art=artView==="full"?npc.portrait:npc.bust;
 return `<div class="npc-dossier">
  <nav class="npc-list">${ids.map(id=>{const n=NPCS[id];return `<button class="${id===current?"active":""}" data-select-npc="${id}"><i style="--npc-accent:${n.accent}">${n.avatar}<img class="portrait-img" src="${n.head}" alt="" loading="lazy" decoding="async" onerror="this.remove()"></i><span><b>${esc(n.name)}</b><small>${esc(n.job)}</small></span></button>`}).join("")}</nav>
  <section class="npc-profile">
   <div class="npc-figure ${artView}" style="--npc-accent:${npc.accent}"><img src="${art}" alt="${esc(npc.name)}${artView==="full"?"全身":"半身"}立繪" loading="lazy" decoding="async"><span>已認識${familiar?"・似曾相識":""}</span><nav><button class="${artView==="bust"?"active":""}" data-npc-art="bust">半身</button><button class="${artView==="full"?"active":""}" data-npc-art="full">全身</button></nav></div>
   <div class="npc-profile-copy">
    <header><span>PERSONAL FILE・${npc.age} 歲</span><h2>${esc(npc.name)}</h2><p>${esc(npc.bio)}</p></header>
    <blockquote>「${esc(npc.speech)}」</blockquote>
    ${section("基本資料",[["性別",npc.gender],["生日",npc.birthday],["血型",npc.bloodType],["身高",npc.height],["職業",npc.job],["出沒地點",npc.location]],true)}
    ${section("性格與生活",[["個性",npc.personality],["喜歡",npc.likes],["不喜歡",npc.dislikes],["成長地",p.hometown],["背景",p.background],["習慣",p.habit]])}
    ${section("公眾與私下",[["公眾形象",p.publicImage],["私下面貌",p.privateSelf],["職涯經歷",p.career],["擅長",p.strengths],["弱點",p.weaknesses]])}
    ${section("人物核心",[["目標",p.motivation],["恐懼",p.fear],["價值觀",p.values],["未公開經歷",rel.trust>=45?p.secret:"信任達 45 後揭露"],["人物成長方向",p.arc],["與玩家的連結",p.playerHook]])}
    <section class="relationship-panel"><div><span>好感</span><i><b style="width:${rel.closeness}%"></b></i><strong>${rel.closeness}／100</strong></div><div><span>信任</span><i><b style="width:${rel.trust}%"></b></i><strong>${rel.trust}／100</strong></div><small>關係狀態：${rel.romance==="none"?"尚未定義":esc(rel.romance)}・可攻略名單會等人物系統完整後再決定。</small></section>
   </div>
  </section>
 </div>`;
}
