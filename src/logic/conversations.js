import { state } from "../core/state.js";
import { NPCS } from "../data/npcs.js";
import { NPC_CONTACT_STORIES } from "../data/npc-contact-stories.js";

export const CONTACT_TOPICS = {
  day: { label: "聊近況", text: "今天過得怎麼樣？忙完的話，想聽聽你的近況。" },
  work: {
    label: "聊工作",
    text: "最近工作有遇到什麼有意思的事嗎？也想聽聽你的經驗。",
  },
  care: {
    label: "關心一下",
    text: "行程再滿也記得吃飯、休息。有空再回我就好。",
  },
};
export function contactReply(id, topic) {
  const npc = NPCS[id],
    rel = state.relationships[id] || {};
  if (!npc) return undefined;
  const close = (rel.closeness || 0) >= 40;
  const replies = {
    day: close
      ? [
          "剛收工，正在找晚餐。今天有點累，但看到你傳來的訊息就笑了。",
          "今天難得有一段空檔，出去散了步。你呢？也有留時間給自己嗎？",
          "今天沒什麼大事，反而挺舒服的。下次見面再慢慢講給你聽。",
        ]
      : [
          "謝謝你來問。今天的事情告一段落了，正在休息。",
          "今天還算順利，整理完手邊的工作就能回家了。",
          "剛看到訊息，今天忙了一陣子。希望你也一切順利。",
        ],
    work: [
      `做${npc.job}，最常練習的其實是重新來過。今天也改了好幾次，才找到比較順的做法。`,
      "最近在整理以前做過的東西，才發現自己有些習慣一直沒改。能看見問題也是進步吧。",
      "今天最有意思的是聽別人解釋自己的做法。有時候把話聽完，比急著表現更有收穫。",
    ],
    care: close
      ? [
          "有，我有吃飯。被你這樣叮嚀，有種有人在等我好好回家的感覺。",
          "被你抓到了，剛才真的忘了喝水。現在去倒，你也一起休息一下。",
          "謝謝你一直記得這些小事。今天就早點收工，你也別熬夜。",
        ]
      : [
          "謝謝你的提醒，我會留意的。你也別把自己逼得太緊。",
          "剛吃完飯，正在休息。謝謝你惦記。",
          "收到，今天會早點休息。你也照顧好自己。",
        ],
  };
  const pool = [...(NPC_CONTACT_STORIES[id]?.[topic] || []), ...(replies[topic] || [])];
  if (!pool.length) return undefined;
  const history = (state.npcMessages || []).filter(message => message.npcId === id).map(message => message.text || message.message || message.label).filter(text => typeof text === "string");
  // Read-only selection: a preview is stable; only a sent reply advances the
  // least-recently-used order through the existing saved message history.
  const lastSeen = text => history.findLastIndex(message => message === text || message.startsWith(`${text} `));
  return pool.find(text => lastSeen(text) === -1) ||
    [...pool].sort((a, b) => lastSeen(a) - lastSeen(b))[0];
}
export function conversationMessages(id) {
  if (!NPCS[id] || !state.knownPeople.includes(id)) return [];
  return (state.npcMessages || []).filter((m) => m.npcId === id);
}
export function markConversationRead(id) {
  for (const m of conversationMessages(id)) m.read = true;
}
export function openConversation(id) {
  if (!NPCS[id] || !state.knownPeople.includes(id)) return false;
  state.peopleThread = id;
  state.peopleSection = "contacts";
  state.contactTopic = "day";
  state.chatDraft = null;
  markConversationRead(id);
  return true;
}
export function contactAllowance(id) {
  const contacts = (state.shortContacts || []).filter(
    (c) => c.week === state.week,
  );
  const person = Math.max(0, 2 - contacts.filter((c) => c.npcId === id).length);
  const total = Math.max(0, 5 - contacts.length);
  const conflict = (state.relationships[id]?.hostility || 0) >= 45;
  return {
    person,
    total,
    disabled: conflict || !person || !total,
    reason: conflict
      ? "對方目前想保留距離，請先處理彼此的衝突。"
      : !person
        ? "本週已聊過兩次，下週再接著聊。"
        : !total
          ? "本週短聯絡已用完，下週再聊。"
          : "短訊息與電話不占一天；正式見面另排行程。",
  };
}
