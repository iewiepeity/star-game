import { queueShortCheckIn } from "./short-contact.js";
import { state } from "../core/state.js";
import { NPCS } from "../data/npcs.js";
import { chance } from "../core/rng.js";
import { ensureRelationship } from "./npc-engine.js";
import { npcNetworkInfluence } from "./npc-ecosystem.js";
import { enqueueVisibleEvent } from "./event-engine.js";
import { canInitiateMemoryContact, characterMemory, memoryContactText } from "./character-memory.js";
import { narrativePreferences } from "./narrative-preferences.js";

export function tickNpcProactiveEvents() {
  queueShortCheckIn();
  if (!state.knownPeople?.length || chance(70)) return [];
  const prefs = narrativePreferences(), all = state.knownPeople.filter(id => NPCS[id]).map(id => ({ id, rel: ensureRelationship(id) }));
  const conflict = all.filter(x => (x.rel.hostility || 0) >= 45).sort((a, b) => b.rel.hostility - a.rel.hostility)[0];
  if (conflict && prefs.conflictIntensity !== "gentle") {
    const npc = NPCS[conflict.id], id = `npc-conflict:${state.week}:${conflict.id}`;
    if (prefs.conflictIntensity === "normal" && state.week % 3) return [];
    const queued = enqueueVisibleEvent({ id, kind: "人物事件", title: `${npc.name}不再替你留情面`, text: `在共同出席的場合，${npc.name}刻意避開和你同框；圈內人已經察覺你們之間的氣氛不對。`, choices: [
      { id: "calm", label: "不公開反擊，私下處理", outcome: "你沒有讓衝突繼續擴大，但真正的問題仍需要一次正式和解。", effects: [{ npc: conflict.id, hostility: -4, trust: 1 }] },
      { id: "fight", label: "當場正面回嗆", outcome: "這場衝突立刻成為話題，你們的對立也更難收拾。", effects: [{ npc: conflict.id, relation: -3, trust: -4, affection: -3, hostility: 12 }, { rep: "話題度", value: 10 }] },
    ] }, "人物衝突");
    return queued && queued !== "expired" ? [id] : [];
  }
  const candidates = all.filter(x => (x.rel.closeness || 0) >= 35 && (x.rel.hostility || 0) < 20 && canInitiateMemoryContact(x.id)).sort((a, b) => (b.rel.trust + b.rel.closeness) - (a.rel.trust + a.rel.closeness));
  const pick = candidates[0];
  if (!pick) return [];
  const npc = NPCS[pick.id], memory = characterMemory(pick.id), network = npcNetworkInfluence(pick.id), id = `npc-proactive:${state.week}:${pick.id}`;
  const guarded = memory.disclosure === "guarded", advance = memory.boundaries.notice === "advance";
  const text = guarded ? `${npc.name}只傳來一張路邊的照片，沒有像以前一樣談工作裡的心事。你記得上次沒有好好接住對方在意的事情。` : advance ? `${npc.name}提前傳來訊息：「我記得你不喜歡臨時改行程。下一週有想見面的空檔嗎？等你確認再安排。」` : memoryContactText(pick.id, "day", network >= 80 ? `${npc.name}提到圈內最近有一個機會，想先問你是否有興趣，再把名字帶進討論。` : `${npc.name}傳訊息，問你最近要不要找時間碰個面。`);
  const queued = enqueueVisibleEvent({ id, kind: "人物事件", cast: [pick.id], title: `${npc.name}主動聯絡你`, text, choices: [
    { id: "accept", label: guarded ? "把上次沒聽完的話好好接回來" : advance ? "願意，之後一起確認空檔" : "回覆，慢慢聊近況", outcome: guarded ? "你沒有催促對方立刻說完，只認真把話聽到最後；下次對方願意再多說一些。" : "你們先確認彼此的意願；想見面時，可以在人物檔案選日子邀約。", effects: [{ npc: pick.id, relation: 5, trust: 3, affection: 2 }, { rep: "業界評價", value: !guarded && network >= 80 ? 5 : 0 }, { characterMemory: { npcId: pick.id, kind: "response", key: "support", value: "listened", label: "把話好好聽完", text: "你願意把之前沒聽完的話接下去。" } }] },
    { id: "decline", label: "說明這陣子想留些私人時間", outcome: "對方理解你需要空間，之後會少一點主動聯絡，等你想聊時再接上。", effects: [{ characterMemory: { npcId: pick.id, kind: "boundary", key: "space", value: "ask", label: "先留一些私人時間", text: "對方會減少主動聯絡，等你有餘裕。" } }] },
  ] }, "人物主動");
  if (queued && queued !== "expired") {
    state.npcMessages ??= [];
    state.npcMessages.push({ id, npcId: pick.id, week: state.week, source: "proactive", text, read: false });
    return [id];
  }
  return [];
}
