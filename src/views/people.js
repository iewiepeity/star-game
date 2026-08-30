// 手機通訊錄只列出玩家實際認識過的人物；訊息也必須來自已建立的關係。
import { NPCS } from "../data/npcs.js";
import { state } from "../core/state.js";
import { relationshipStance } from "../logic/npc-engine.js";
import { romanceStageLabel } from "../logic/romance-engine.js";
import { esc } from "../core/utils.js";
import { npcApp } from "./npc.js";

function contactCard(id) {
  const npc = NPCS[id];
  const relation = state.relationships[id] || { closeness: 0, trust: 0, hostility: 0, romance: "none" };
  const stance = relationshipStance(relation).label;
  const romance = (relation.hostility || 0) < 20 && relation.romance && relation.romance !== "none" ? `・${romanceStageLabel(relation.romance)}` : "";
  return `<button class="contact-card ${(relation.hostility || 0) >= 45 ? "conflict" : ""}" data-select-npc="${id}"><div>${npc.avatar}<img class="portrait-img" src="${npc.head || npc.portrait || ""}" alt="" loading="lazy" decoding="async" onerror="this.remove()"></div><span><b>${esc(npc.name)}</b><small>${esc(npc.job)}</small></span><em>${stance}${romance}</em></button>`;
}

export function peopleApp() {
  const known = state.knownPeople.filter((id) => NPCS[id]);
  const query = (state.peopleQuery || "").trim().toLocaleLowerCase("zh-Hant");
  const filtered = known.filter((id) => `${NPCS[id].name} ${NPCS[id].job} ${relationshipStance(state.relationships[id] || {}).label}`.toLocaleLowerCase("zh-Hant").includes(query));
  const messages = (state.npcMessages || []).filter((message) => known.includes(message.npcId)).slice(-20).reverse();
  const unread = messages.filter((message) => !message.read).length;
  if (!known.length) return `<div class="inside-page"><div class="inside-title"><div><span>CONTACTS</span><h2>手機通訊錄</h2></div><p>0 位聯絡人</p></div><div class="tablet-empty"><span>♡</span><h3>還沒有認識任何人</h3><p>第一輪沒有免費人脈。安排自由活動或參加工作，讓第一次相遇真的發生。</p><button data-go-free>去安排自由活動</button></div></div>`;
  return `<div class="inside-page"><div class="inside-title"><div><span>CONTACTS</span><h2>手機通訊錄</h2></div><p>${known.length} 位聯絡人・${unread} 則未讀</p></div><div class="list-tools people-list-tools"><label><span class="sr-only">搜尋聯絡人</span><input type="search" data-people-query data-focus-key="people-query" value="${esc(state.peopleQuery || "")}" placeholder="搜尋姓名、職業或關係" aria-label="搜尋聯絡人"></label><output aria-live="polite">顯示 ${filtered.length}／${known.length} 位</output></div>${filtered.length ? `<div class="contact-list" data-scroll-key="contacts">${filtered.map(contactCard).join("")}</div>` : `<div class="tablet-empty compact"><span>⌕</span><h3>找不到這位聯絡人</h3><p>換個名字、職業或關係關鍵字試試看。</p><button data-clear-people-query>清除搜尋</button></div>`}${messages.length ? `<section class="message-inbox"><h3>人物訊息</h3>${messages.map((message) => { const npc = NPCS[message.npcId]; return `<button data-select-npc="${message.npcId}" class="${message.read ? "" : "unread"}"><b>${esc(npc?.name || "未知人物")}</b><span>${esc(message.text || message.message || message.label || "有一則新訊息")}</span><small>第 ${message.week || state.week} 週</small></button>`; }).join("")}</section>` : ""}</div>`;
}

export function peopleHubApp() {
  const section = state.peopleSection === "profiles" ? "profiles" : "contacts";
  return `<div class="people-hub"><nav class="people-hub-tabs" role="tablist" aria-label="人物功能"><button id="people-tab-contacts" role="tab" aria-selected="${section === "contacts"}" aria-controls="people-panel" tabindex="${section === "contacts" ? "0" : "-1"}" class="${section === "contacts" ? "active" : ""}" data-people-section="contacts"><span>CONTACTS</span><b>訊息與關係</b></button><button id="people-tab-profiles" role="tab" aria-selected="${section === "profiles"}" aria-controls="people-panel" tabindex="${section === "profiles" ? "0" : "-1"}" class="${section === "profiles" ? "active" : ""}" data-people-section="profiles"><span>PERSONAL FILES</span><b>人物檔案</b></button></nav><div id="people-panel" class="people-hub-content" role="tabpanel" aria-labelledby="people-tab-${section}">${section === "profiles" ? npcApp() : peopleApp()}</div></div>`;
}
