// 畫面層：手機通訊錄 App。只列出 state.knownPeople 裡「玩家實際認識過」的人物，尚未相遇前不會出現。
import{NPCS}from"../data/npcs.js";
import{state}from"../core/state.js";

export function peopleApp(){return `<div class="inside-page"><div class="inside-title"><div><span>CONTACTS</span><h2>手機通訊錄</h2></div><p>${state.knownPeople.length} 位聯絡人</p></div>${state.knownPeople.length?`<div class="contact-list">${state.knownPeople.map(id=>{const n=NPCS[id];return `<article><div>${n.avatar}</div><span><b>${n.name}</b><small>${n.job}</small></span><em>剛認識</em></article>`}).join("")}</div>`:`<div class="tablet-empty"><span>♡</span><h3>還沒有認識任何人</h3><p>第一輪沒有免費人脈。安排自由活動或參加工作，讓第一次相遇真的發生。</p><button data-go-free>去安排自由活動</button></div>`}</div>`}
