import { state } from "../core/state.js";
import { NPCS } from "../data/npcs.js";
import { adjustRelationship } from "./npc-engine.js";
import { CONTACT_TOPICS, contactReply } from "./conversations.js";
import { recallCityMemory } from "./city-life.js";
import { memoryContactText, noteCharacterInteraction, canInitiateMemoryContact } from "./character-memory.js";
export function shortContact(id, type = "message", topic = null, draft = null) {
  if (
    !NPCS[id] ||
    !state.knownPeople.includes(id) ||
    !["message", "call"].includes(type) ||
    (topic !== null && !Object.hasOwn(CONTACT_TOPICS, topic))
  )
    return { ok: false, message: "目前無法聯絡。" };
  const outgoing = draft === null ? null : String(draft).trim();
  if (outgoing !== null && (!outgoing || outgoing.length > 200))
    return { ok: false, message: "訊息請寫 1 到 200 個字，再按送出。" };
  const rel = state.relationships[id];
  if ((rel?.hostility || 0) >= 45)
    return { ok: false, message: "對方目前想保留距離，請先處理彼此的衝突。" };
  state.shortContacts ??= [];
  const recent = state.shortContacts.filter((x) => x.week === state.week);
  if (recent.filter((x) => x.npcId === id).length >= 2)
    return {
      ok: false,
      message: "這週已經聊過兩次近況，其他的留到下次見面吧。",
    };
  if (recent.length >= 5)
    return {
      ok: false,
      message: "這週已經留了不少時間聯絡朋友，先把自己的生活照顧好吧。",
    };
  const replyTopic =
    outgoing && /吃飯|休息|喝水|照顧|辛苦|熬夜/.test(outgoing)
      ? "care"
      : outgoing && /工作|作品|排練|試鏡|演出|拍攝|經驗/.test(outgoing)
        ? "work"
        : topic;
  const memory = replyTopic !== "work" && recallCityMemory(id);
  const recentReplies = (state.npcMessages || []).filter(message => message.npcId === id).slice(-12);
  const keptPromise = noteCharacterInteraction(id, replyTopic || "day");
  const base = (memory && !recentReplies.some(message => message.text === memory) && memory) ||
    contactReply(id, replyTopic || "day");
  const text = `${memoryContactText(id, replyTopic || "day", base)}${keptPromise ? ` ${keptPromise}` : ""}`;
  adjustRelationship(id, {
    closeness: 1,
    trust: 1,
    affection: type === "call" ? 2 : 1,
    source: type === "call" ? "空檔打電話" : "訊息聊近況",
  });
  const record = {
    id: `short:${state.week}:${id}:${recent.filter((x) => x.npcId === id).length}`,
    week: state.week,
    npcId: id,
    type,
    topic,
    outgoingText:
      outgoing ??
      (topic
        ? CONTACT_TOPICS[topic].text
        : type === "call"
          ? "有空聊幾分鐘嗎？想聽聽你的近況。"
          : "最近過得怎麼樣？想到你，就來問候一下。"),
    text,
  };
  state.shortContacts.push(record);
  state.shortContacts = state.shortContacts.slice(-120);
  state.npcMessages ??= [];
  state.npcMessages.push({
    ...record,
    title: type === "call" ? "電話裡的近況" : "收到回覆",
    source: "short-contact",
    read: false,
  });
  return {
    ok: true,
    message: `${NPCS[id].name}：「${text}」這次聯絡不占整日行程。`,
  };
}

export function queueShortCheckIn() {
  const key = `check-in:${state.week}`;
  if (state.week % 2 || state.npcMessages?.some((m) => m.id === key))
    return false;
  const people = (state.knownPeople || []).filter(
    (id) =>
      NPCS[id] &&
      canInitiateMemoryContact(id) &&
      (state.relationships[id]?.closeness || 0) >= 20 &&
      (state.relationships[id]?.hostility || 0) < 20,
  );
  if (!people.length) return false;
  const npcId = people[Math.floor(state.week / 2) % people.length];
  state.npcMessages ??= [];
  state.npcMessages.push({
    id: key,
    npcId,
    week: state.week,
    title: "有空再回就好",
    text:
      memoryContactText(npcId, "day", contactReply(npcId, "day")) +
      " 有空傳個訊息就好，不用特地空下一天。",
    source: "short-contact",
    read: false,
  });
  return true;
}
