import { state } from "../core/state.js";
import { NPCS } from "../data/npcs.js";
import { normalizeCharacterMemories, normalizeMemoryEntry } from "../core/character-memory-state.js";

export const MEMORY_TOPICS = Object.freeze([
  { kind: "preference", key: "place", label: "見面地點", choices: [["quiet", "喜歡安靜的地方", "下次會先找安靜、能慢慢說話的地方。"], ["lively", "喜歡有生活聲音的地方", "那就找有街景和人聲的地方，不用總把自己藏起來。"]] },
  { kind: "preference", key: "drink", label: "平常喜歡喝", choices: [["tea", "我比較喜歡茶", "記住了，下次先問你想喝哪一種茶。"], ["coffee", "我比較喜歡咖啡", "那下次一起看看咖啡單，口味由你決定。"]] },
  { kind: "preference", key: "listening", label: "累的時候", choices: [["listen", "先聽我說就好", "好，我會先聽，不急著替你想辦法。"], ["advice", "可以一起想辦法", "我會先問你卡在哪裡，再一起想下一步。"]] },
  { kind: "boundary", key: "notice", label: "邀約時間", choices: [["advance", "請提前一週問我", "以後先問下一週，等你確認有空再約，不會突然要你今晚出門。"], ["flexible", "有空時可以臨時問", "好，我可以臨時問，但你說不方便就留到下次。"]] },
  { kind: "boundary", key: "space", label: "私人空間", choices: [["ask", "少一點主動聯絡，先讓我休息", "我會少傳些訊息，留時間給你；你想聊的時候再找我。"], ["freely", "可以照平常的頻率聯絡", "那就照原來的步調。忙的時候不用勉強回覆。"]] },
]);

export function characterMemory(npcId, game = state) {
  const saved = normalizeCharacterMemories(game.characterMemories)[npcId] || { preferences: {}, boundaries: {}, promises: [], responses: [], shared: [], history: [] };
  return { ...saved, disclosure: [...saved.responses].reverse().find(item => item.key === "support")?.value === "dismissed" ? "guarded" : "open" };
}
export function recordCharacterMemory(npcId, raw, game = state) {
  if (!NPCS[npcId] || !game.knownPeople?.includes(npcId)) return false;
  const entry = normalizeMemoryEntry({ ...raw, week: raw.week ?? game.week });
  if (!entry) return false;
  game.characterMemories = normalizeCharacterMemories(game.characterMemories);
  const memory = game.characterMemories[npcId] ??= { preferences: {}, boundaries: {}, promises: [], responses: [], shared: [], history: [] };
  if (entry.kind === "preference" || entry.kind === "boundary") {
    const collection = memory[entry.kind === "preference" ? "preferences" : "boundaries"];
    if (collection[entry.key] === entry.value) return false;
    collection[entry.key] = entry.value;
  } else {
    const collection = memory[{ promise: "promises", response: "responses", shared: "shared" }[entry.kind]];
    const last = collection.findLast(item => item.key === entry.key);
    if (last?.value === entry.value && last?.status === entry.status && last.week === entry.week) return false;
    if (entry.kind === "promise") memory.promises = memory.promises.filter(item => item.key !== entry.key);
    memory[{ promise: "promises", response: "responses", shared: "shared" }[entry.kind]].push(entry);
  }
  memory.history.push(entry);
  game.characterMemories = normalizeCharacterMemories(game.characterMemories);
  return true;
}
function reply(npcId, outgoingText, text, game) {
  game.npcMessages ??= [];
  game.npcMessages.push({ id: `memory:${npcId}:${game.week}:${game.npcMessages.length}`, npcId, week: game.week, source: "character-memory", outgoingText, text, read: false });
}
export function tellCharacterMemory(npcId, key, value, game = state) {
  if (!game.knownPeople?.includes(npcId) || !NPCS[npcId] || game.endingResult || (game.relationships?.[npcId]?.hostility || 0) >= 45) return { ok: false, message: "目前不適合談這些，先處理彼此的距離。" };
  const topic = MEMORY_TOPICS.find(item => item.key === key), choice = topic?.choices.find(item => item[0] === value);
  if (!choice) return { ok: false, message: "請選擇想告訴對方的事。" };
  const changed = recordCharacterMemory(npcId, { kind: topic.kind, key, value, label: choice[1], text: choice[2], source: "親口說過" }, game);
  if (!changed) return { ok: false, message: "對方已經記得這件事。" };
  reply(npcId, choice[1], choice[2], game);
  return { ok: true, message: `${NPCS[npcId].name}：「${choice[2]}」` };
}
export function promiseCharacterCheckIn(npcId, action = "promise", game = state) {
  if (!NPCS[npcId] || !game.knownPeople?.includes(npcId) || game.endingResult || (game.relationships?.[npcId]?.hostility || 0) >= 45) return { ok: false, message: "目前不適合約定下次談話。" };
  const current = characterMemory(npcId, game).promises.find(item => item.key === "work-check-in");
  if (action === "release" && current?.status !== "pending") return { ok: false, message: "沒有等待中的約定。" };
  if (action === "promise" && current?.status === "pending") return { ok: false, message: "你們已經約好，有空再接著聊。" };
  if (!["promise", "release"].includes(action)) return { ok: false, message: "目前無法調整約定。" };
  const released = action === "release", text = released ? "知道了，這次先放下，不必一直掛在心上。想談時我們再約。" : "好，下週以後你有空再問，我會把這件事留著。忙的話直接說也沒關係。";
  recordCharacterMemory(npcId, { kind: "promise", key: "work-check-in", value: "work", label: "再聽一次工作近況", status: released ? "released" : "pending", dueWeek: released ? current.dueWeek : game.week + 1, text, source: "你們的約定" }, game);
  reply(npcId, released ? "之前說好再聊，這陣子先放著好嗎？" : "下週以後，我想再聽你說說工作的近況。", text, game);
  return { ok: true, message: text };
}
export function noteCharacterInteraction(npcId, type, game = state) {
  if (!["work", "support", "personal", "collaborate"].includes(type)) return "";
  const promise = characterMemory(npcId, game).promises.find(item => item.key === "work-check-in" && item.status === "pending" && game.week >= item.dueWeek);
  if (!promise) return "";
  const text = "你還記得說好要再問一次。我原本把話收起來了，現在想慢慢說給你聽。";
  recordCharacterMemory(npcId, { ...promise, week: game.week, status: "fulfilled", text }, game);
  recordCharacterMemory(npcId, { kind: "response", key: "support", value: "listened", text, label: "把答應過的話放進生活", source: "履行約定" }, game);
  return text;
}
export function memoryContactText(npcId, topic, base, game = state) {
  const memory = characterMemory(npcId, game);
  if (topic === "work" && memory.disclosure === "guarded") return "工作先說到這裡就好。上次談到我在意的事時，我覺得沒有被好好接住；有些事我想等彼此都有餘裕再談。";
  const suffixes = [];
  if (topic === "care" && memory.preferences.listening === "listen") suffixes.push("你之前說累的時候想先被聽見，今天我也先聽你說，不急著給建議。");
  if (topic === "care" && memory.preferences.listening === "advice") suffixes.push("你說過願意一起想辦法；如果今天有卡住的事，我們可以只拆一小步。");
  if (topic === "day" && memory.preferences.drink) suffixes.push(memory.preferences.drink === "tea" ? "看到茶單就想到你說過喜歡茶，下次一起選一壺吧。" : "路過咖啡店時想起你偏愛咖啡，把店名留著等你有空。");
  if (topic === "day" && memory.preferences.place) suffixes.push(memory.preferences.place === "quiet" ? "我記得你喜歡安靜，留意到一個可以慢慢坐著的角落。" : "你說喜歡有生活聲音的地方，我記下了一條有街景的小路。");
  if (memory.boundaries.notice === "advance") suffixes.push("要見面的話，我會提前一週問你，等你確認時間。");
  if (!suffixes.length) return base;
  return `${base} ${suffixes[(game.week + (topic === "care" ? 1 : 0)) % suffixes.length]}`;
}
export function canInitiateMemoryContact(npcId, game = state) {
  const memory = characterMemory(npcId, game);
  const gap = memory.boundaries.space === "ask" ? 4 : memory.disclosure === "guarded" ? 3 : 1;
  if (gap === 1) return true;
  return game.week - lastMemoryContactWeek(npcId, memory, game) >= gap;
}
function lastMemoryContactWeek(npcId, memory, game) {
  return Math.max(0, ...(game.npcMessages || []).filter(item => item.npcId === npcId && item.source !== "character-memory").map(item => item.week || 0), ...memory.history.filter(item => item.key === "space" || item.key === "support").map(item => item.week));
}

// Only unanswered invitations can wait for a newly stated boundary. Important
// follow-ups (including an agreed reschedule) deliberately do not match here.
// This query never changes memory, invitation history, rewards, or schedules.
export function memoryInvitationDeferral(event, game = state) {
  const invitation = /^invitation:([^:]+):(\d+)$/.exec(event?.id || "");
  const proactive = /^npc-proactive:(\d+):([^:]+)$/.exec(event?.id || "");
  const daily = event?.memoryInitiated && event?.personalStory?.kind === "romanceDaily" ? event.personalStory : null;
  if (!invitation && !proactive && !daily) return null;
  const npcId = daily ? daily.npcId : invitation ? invitation[1] : proactive[2];
  const createdWeek = Number(daily ? daily.offeredWeek : invitation ? invitation[2] : proactive[1]);
  if (!Object.hasOwn(NPCS, npcId) || !Number.isSafeInteger(createdWeek) || createdWeek < 1) return null;
  if (game.eventHistory?.some(item => item.id === event.id)) return null;
  const response = game.npcInvitationHistory?.find(item => item.id === event.id)?.response;
  if (response && response !== "pending") return null;
  const memory = characterMemory(npcId, game);
  const boundary = key => memory.history.findLast(item => item.kind === "boundary" && item.key === key);
  const space = boundary("space"), notice = boundary("notice");
  let dueWeek = 0;
  // An invitation generated after an earlier boundary already passed the
  // normal contact gate; its own notification must not defer it another month.
  if (memory.boundaries.space === "ask" && space?.value === "ask" && space.week >= createdWeek) {
    dueWeek = lastMemoryContactWeek(npcId, memory, game) + 4;
  }
  if (memory.boundaries.notice === "advance" && notice?.value === "advance" && notice.week >= createdWeek) {
    dueWeek = Math.max(dueWeek, notice.week + 1);
  }
  return dueWeek > game.week ? dueWeek : null;
}
