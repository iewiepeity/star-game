// 畫面層：手機通訊錄 App。只列出 state.knownPeople 裡「玩家實際認識過」的人物，尚未相遇前不會出現。
import{NPCS}from"../data/npcs.js";
import{state}from"../core/state.js";
import{relationshipStage}from"../logic/npc-engine.js";
import{romanceStageLabel}from"../logic/romance-engine.js";

export function peopleApp(){const known=state.knownPeople.filter(id=>NPCS[id]);return `<div class="inside-page"><div class="inside-title"><div><span>CONTACTS</span><h2>手機通訊錄</h2></div><p>${known.length} 位聯絡人</p></div>${known.length?`<div class="contact-list">${known.map(id=>{const n=NPCS[id],r=state.relationships[id]||{closeness:0,trust:0,romance:"none"},friendship=relationshipStage(r).label,romance=r.romance&&r.romance!=="none"?`・${romanceStageLabel(r.romance)}`:"";return `<article><div>${n.avatar}<img class="portrait-img" src="${n.head||n.portrait||""}" alt="" loading="lazy" decoding="async" onerror="this.remove()"></div><span><b>${n.name}</b><small>${n.job}</small></span><em>${friendship}${romance}</em></article>`}).join("")}</div>`:`<div class="tablet-empty"><span>♡</span><h3>還沒有認識任何人</h3><p>第一輪沒有免費人脈。安排自由活動或參加工作，讓第一次相遇真的發生。</p><button data-go-free>去安排自由活動</button></div>`}</div>`}
