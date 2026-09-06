// Only contacts the player has actually met may appear in the phone.
import { NPCS } from "../data/npcs.js";
import { state } from "../core/state.js";
import { relationshipStance } from "../logic/npc-engine.js";
import { esc } from "../core/utils.js";
import { npcApp } from "./npc.js";
import {
  CONTACT_TOPICS,
  conversationMessages,
  contactAllowance,
  markConversationRead,
} from "../logic/conversations.js";

function contactCard(id) {
  const npc = NPCS[id],
    messages = conversationMessages(id),
    latest = messages.at(-1);
  const unread = messages.filter((m) => !m.read).length;
  return `<button class="contact-card ${state.peopleThread === id ? "active" : ""}" data-chat-open="${id}" aria-current="${state.peopleThread === id}"><i class="contact-avatar"><img src="${npc.head}" alt="" loading="lazy" decoding="async"></i><span><b>${esc(npc.name)}</b><small>${esc(latest?.text || latest?.message || `${npc.job}・傳個訊息聊聊近況`)}</small></span><em>${unread ? `<b class="unread-count">${unread}</b>` : latest ? `第 ${latest.week || state.week} 週` : "開始對話"}</em></button>`;
}
function conversation(id) {
  if (!NPCS[id] || !state.knownPeople.includes(id))
    return `<section class="chat-empty"><span>✉</span><h3>今天，想找誰聊聊？</h3><p>從左側選一位朋友，訊息會按對象收進各自的對話。</p></section>`;
  const npc = NPCS[id],
    messages = conversationMessages(id),
    allowance = contactAllowance(id);
  const topic = Object.hasOwn(CONTACT_TOPICS, state.contactTopic)
    ? state.contactTopic
    : "day";
  let week = null;
  const bubbles = messages
    .map((m, i) => {
      const date =
        week !== m.week
          ? `<div class="chat-date">第 ${m.week || state.week} 週</div>`
          : "";
      week = m.week;
      const outgoing =
        m.outgoingText ||
        (m.source === "short-contact" && m.type
          ? m.type === "call"
            ? "撥了一通電話，聊聊最近的生活。"
            : "傳了訊息，問問最近過得如何。"
          : "");
      return `${date}${outgoing ? `<article class="chat-bubble outgoing"><small>你${m.type === "call" ? "・通話紀錄" : ""}</small><p>${esc(outgoing)}</p><span>已讀</span></article>` : ""}<article class="chat-bubble incoming" data-message-id="${esc(m.id || String(i))}"><small>${esc(npc.name)}${m.source === "social" ? "・來自貼文回覆" : m.type === "call" ? "・電話裡的回應" : ""}</small><p>${esc(m.text || m.message || m.label || "有一則新訊息")}</p></article>`;
    })
    .join("");
  return `<section class="chat-thread"><header class="chat-header"><button class="chat-back" data-chat-back aria-label="返回對話列表">←</button><img src="${npc.head}" alt=""><div><b>${esc(npc.name)}</b><small>${esc(npc.job)}・${esc(relationshipStance(state.relationships[id] || {}).label)}</small></div><button data-select-npc="${id}">人物檔案 →</button></header><div class="chat-history" data-scroll-key="chat-history" role="log" aria-label="與${esc(npc.name)}的訊息">${bubbles || `<p class="chat-start">你們已交換聯絡方式，從一句問候開始吧。</p>`}</div><div class="chat-composer"><nav aria-label="選擇聊天話題">${Object.entries(
    CONTACT_TOPICS,
  )
    .map(
      ([key, t]) =>
        `<button data-chat-topic="${key}" aria-pressed="${topic === key}" ${allowance.disabled ? "disabled" : ""}>${t.label}</button>`,
    )
    .join(
      "",
    )}</nav><label class="chat-draft-label"><span>寫給${esc(npc.name)}的訊息</span><textarea class="chat-draft" data-chat-draft rows="3" maxlength="200" aria-label="編寫訊息" ${allowance.disabled ? "disabled" : ""}>${esc(state.chatDraft ?? CONTACT_TOPICS[topic].text)}</textarea></label><div class="chat-send-row"><small>本週：對方還能聊 ${allowance.person} 次・合計剩 ${allowance.total} 次</small><button data-short-contact="${id}" data-contact-type="call" data-contact-topic="${topic}" ${allowance.disabled ? "disabled" : ""}>☎ 打電話</button><button class="main-btn" data-short-contact="${id}" data-contact-type="message" data-contact-topic="${topic}" ${allowance.disabled ? "disabled" : ""}>送出訊息 ↑</button></div><p class="chat-allowance" role="status">${allowance.reason}</p></div></section>`;
}
export function peopleApp() {
  const known = state.knownPeople.filter((id) => NPCS[id]);
  if (known.includes(state.peopleThread))
    markConversationRead(state.peopleThread);
  const query = (state.peopleQuery || "").trim().toLocaleLowerCase("zh-Hant");
  const filtered = known.filter((id) =>
    `${NPCS[id].name} ${NPCS[id].job} ${relationshipStance(state.relationships[id] || {}).label}`
      .toLocaleLowerCase("zh-Hant")
      .includes(query),
  );
  const unread = known.reduce(
    (sum, id) => sum + conversationMessages(id).filter((m) => !m.read).length,
    0,
  );
  if (!known.length)
    return `<div class="inside-page"><div class="inside-title"><div><span>CONTACTS</span><h2>手機通訊錄</h2></div><p>0 位聯絡人</p></div><div class="tablet-empty"><span>♡</span><h3>還沒有認識任何人</h3><p>安排自由活動或參加工作，與遇見的人交換聯絡方式。</p><button data-go-free>去安排自由活動</button></div></div>`;
  const selected = known.includes(state.peopleThread);
  return `<div class="inside-page messenger ${selected ? "thread-open" : ""}"><div class="inside-title"><div><span>MESSAGES</span><h2>手機通訊錄</h2></div><p>${known.length} 位聯絡人・${unread} 則未讀</p></div><div class="messenger-layout ${selected ? "has-thread" : ""}"><aside class="conversation-list"><div class="list-tools people-list-tools"><label><input type="search" data-people-query data-focus-key="people-query" value="${esc(state.peopleQuery || "")}" placeholder="搜尋姓名、職業或關係" aria-label="搜尋聯絡人"></label><output aria-live="polite">顯示 ${filtered.length}／${known.length} 位</output></div><div class="contact-list" data-scroll-key="contacts">${filtered.map(contactCard).join("") || `<p>找不到這位聯絡人。</p><button data-clear-people-query>清除搜尋</button>`}</div></aside>${conversation(state.peopleThread)}</div></div>`;
}
export function peopleHubApp() {
  const section = state.peopleSection === "profiles" ? "profiles" : "contacts";
  return `<div class="people-hub"><nav class="people-hub-tabs" role="tablist" aria-label="人物功能">${[
    ["contacts", "MESSAGES", "訊息與關係"],
    ["profiles", "PERSONAL FILES", "人物檔案"],
  ]
    .map(
      ([id, english, label]) =>
        `<button id="people-tab-${id}" role="tab" aria-selected="${section === id}" aria-controls="people-panel" tabindex="${section === id ? "0" : "-1"}" class="${section === id ? "active" : ""}" data-people-section="${id}"><span>${english}</span><b>${label}</b></button>`,
    )
    .join(
      "",
    )}</nav><div id="people-panel" class="people-hub-content" role="tabpanel" aria-labelledby="people-tab-${section}">${section === "profiles" ? npcApp() : peopleApp()}</div></div>`;
}
