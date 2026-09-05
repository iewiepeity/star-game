import { state } from "../core/state.js";
import { NPCS } from "../data/npcs.js";
import { NPC_INTERACTIONS } from "../data/npc-network.js";
import { DAYS } from "../data/calendar.js";
import { relationshipStage } from "./npc-engine.js";
import { scheduleActivity } from "./scheduled-activities.js";
import { reserveNpcExternalSlot } from "./npc-ecosystem.js";
export function invitationStatus(game, npcId, type, day) {
  const npc = NPCS[npcId],
    def = NPC_INTERACTIONS[type],
    rel = game.relationships?.[npcId] || {};
  if (!npc || !def || !game.knownPeople?.includes(npcId))
    return "你們還沒有交換聯絡方式。";
  if (game.forcedRestWeek === game.week)
    return "本週需要休養，先把邀約留到之後。";
  if (
    game.npcInteractionsByWeek?.[`${game.week}:${npcId}:${type}`] ||
    Object.values(game.scheduledActivities || {}).some(
      (t) =>
        t.kind === "npc_interact" &&
        t.week === game.week &&
        t.payload?.npcId === npcId &&
        t.payload?.type === type &&
        t.status === "scheduled",
    )
  )
    return "這週已經約好或完成這項相處，留點空間給彼此吧。";
  if (
    type === "reconcile"
      ? (rel.hostility || 0) < 20
      : (rel.hostility || 0) >= 70 ||
        ((rel.hostility || 0) >= 45 &&
          ["collaborate", "personal", "date"].includes(type))
  )
    return "現在不適合這樣見面，先尊重彼此的界線。";
  const ranks = ["acquaintance", "familiar", "friend", "confidant", "bonded"],
    romance = [
      "none",
      "interested",
      "ambiguous",
      "dating",
      "committed",
      "engaged",
      "married",
    ];
  if (
    def.minStage &&
    ranks.indexOf(relationshipStage(rel).id) < ranks.indexOf(def.minStage)
  )
    return "我們還沒熟到能聊這麼深入，先從近況慢慢認識吧。";
  if (
    def.minRomance &&
    romance.indexOf(rel.romance || "none") < romance.indexOf(def.minRomance)
  )
    return "現在還不適合以約會的方式見面。";
  if ((def.cost || 0) > game.money) return "先留足這次相處的預算，再約時間。";
  if (!Number.isInteger(day) || day < 0 || day > 6) return "請先選一天。";
  if (
    game.schedule[day] !== "rest" ||
    game.scheduledActivityIds?.[day] ||
    game.scheduledJobIds?.[day]
  )
    return "你這天已有安排，先保留一個空白日。";
  const slots = game.npcSchedules?.[npcId];
  if (
    Array.isArray(slots) &&
    slots.some(
      (s) => s.week === game.week && s.day === day && s.status !== "released",
    )
  )
    return `${npc.name}這天有工作，換一天好嗎？`;
  return "";
}
export function inviteNpc(npcId, type, day) {
  const reason = invitationStatus(state, npcId, type, day);
  if (reason) return { ok: false, message: reason };
  const npc = NPCS[npcId],
    def = NPC_INTERACTIONS[type];
  const result = scheduleActivity(
    "npc_interact",
    { npcId, type },
    `和${npc.name}${def.label}`,
    {
      cost: def.cost || 0,
      fatigue: def.fatigue || 2,
      stamina: Math.max(2, def.fatigue || 2),
      preferredDay: day,
    },
  );
  if (!result.ok) return result;
  reserveNpcExternalSlot(npcId, {
    key: result.id,
    week: state.week,
    day,
    label: `與${state.name}相約`,
  });
  const memory = [...(state.npcInteractionMemories || [])]
    .reverse()
    .find((m) => m.npcId === npcId);
  const response =
    type === "reconcile"
      ? `那就${DAYS[day]}談談吧。我願意聽，但也希望你能聽我把話說完。`
      : state.npcCareers?.[npcId]?.trend === "down"
        ? `最近有些事不太順。${DAYS[day]}見面吧，謝謝你想到我。`
        : memory
          ? `${DAYS[day]}可以。上次一起度過的那段時間，我還記得；到時候再聊。`
          : `${DAYS[day]}有空，那就說好了。不用特別準備什麼，慢慢聊就好。`;
  state.npcMessages ??= [];
  state.npcMessages.push({
    id: `invite:${result.id}`,
    npcId,
    week: state.week,
    source: "invitation",
    read: false,
    text: response,
  });
  state.npcInvitation = null;
  return {
    ...result,
    message: `${npc.name}：「${response}」已保留${DAYS[day]}；費用在實際相處時支付。`,
  };
}
