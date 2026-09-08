import {
  sequelOfferText,
  sequelSessionText,
  sequelCompletionText,
} from "../data/sequel-story-content.js";
import { titleTag } from "../core/utils.js";
import { state } from "../core/state.js";
import { chance, randomInt } from "../core/rng.js";
import { enqueueVisibleEvent } from "./event-engine.js";
import { scheduleActivity } from "./scheduled-activities.js";
import {
  isNpcBusy,
  reserveNpcExternalSlot,
  completeNpcExternalSlot,
  adjustNpcSocialRelation,
} from "./npc-ecosystem.js";
import { adjustRelationship } from "./npc-engine.js";
import { registerAwardCandidate } from "./portfolio.js";
const sequelSkill = (offer) => {
  const names = {
    歌曲: ["歌藝", "聲線"],
    電影: ["演技", "鏡頭感"],
    電視劇: ["演技", "鏡頭感"],
    綜藝: ["口才", "主持"],
    廣告: ["氣質", "鏡頭感"],
  }[offer.category] || ["演技"];
  return (
    names.reduce(
      (sum, name) =>
        sum + Math.max(0, Math.min(1000, Number(state.stats[name]) || 0)),
      0,
    ) / names.length
  );
};
export function sequelQuality(offer, roll = randomInt) {
  if (offer.termsVersion !== 2)
    return Math.max(55, Math.min(100, (offer.quality || 75) + roll(-7, 8)));
  const count = Math.max(1, offer.completedSessions || 0);
  const skill = (offer.skillTotal || 0) / count,
    condition = (offer.conditionTotal || 0) / count;
  const direction =
    offer.direction === "creative" ? (skill >= 420 ? 7 : -4) : 0;
  return Math.max(
    35,
    Math.min(
      100,
      Math.round(
        (offer.quality || 75) * 0.6 +
          skill * 0.025 +
          condition * 0.12 +
          direction +
          roll(-3, 3),
      ),
    ),
  );
}
const openDay = (day) =>
  ["rest", "free"].includes(state.schedule?.[day]) &&
  !state.scheduledJobIds?.[day] &&
  !state.scheduledActivityIds?.[day];
export function sequelOffer(id) {
  return (state.sequelOffers || []).find((o) => o.id === id) || null;
}
export function syncSequelOfferFlags() {
  for (const offer of state.sequelOffers || []) {
    if (offer.status !== "offered") continue;
    if (state.eventFlags.includes(`sequel-accepted:${offer.id}`)) {
      offer.status = "active";
      offer.acceptedWeek = state.week;
      offer.requiredSessions =
        offer.requiredSessions ||
        Math.max(2, Math.min(4, Math.ceil((offer.stars || 3) / 1.5)));
      offer.completedSessions = offer.completedSessions || 0;
    } else if (state.eventFlags.includes(`sequel-negotiate:${offer.id}`)) {
      offer.status = "active";
      offer.acceptedWeek = state.week;
      offer.negotiated = true;
      offer.payMultiplier = 1.25;
      offer.requiredSessions =
        offer.requiredSessions ||
        Math.max(2, Math.min(4, Math.ceil((offer.stars || 3) / 1.5)));
      if (offer.termsVersion === 2) {
        offer.requiredSessions += 1;
        offer.direction = "promotion";
      }
      offer.completedSessions = offer.completedSessions || 0;
    } else if (state.eventFlags.includes(`sequel-creative:${offer.id}`)) {
      offer.status = "active";
      offer.acceptedWeek = state.week;
      offer.direction = "creative";
      offer.requiredSessions += 1;
      offer.completedSessions = 0;
    } else if (state.eventFlags.includes(`sequel-declined:${offer.id}`)) {
      offer.status = "declined";
      offer.closedWeek = state.week;
    }
  }
  return state.sequelOffers;
}
export function tickSequelOpportunities() {
  state.sequelOffers ??= [];
  syncSequelOfferFlags();
  const candidates = (state.completedWorks || []).filter(
    (w) =>
      (w.quality || 0) >= 78 &&
      (w.stars || 0) >= 3 &&
      !state.sequelOffers.some((o) => o.workId === w.id),
  );
  const work = candidates.find(() => chance(18));
  if (!work) return null;
  const offer = {
    termsVersion: 2,
    direction: "return",
    skillTotal: 0,
    conditionTotal: 0,
    sessionKeys: [],
    id: `SEQ-${state.week}-${work.id}`,
    workId: work.id,
    title: `${work.title}續作`,
    week: state.week,
    status: "offered",
    npcCast: [...(work.npcCast || [])],
    category: work.category,
    stars: work.stars,
    quality: work.quality,
    role: work.role,
    roleId: work.roleId || "featured",
    tags: [...(work.tags || []), "續作"],
    requiredSessions: Math.max(
      2,
      Math.min(4, Math.ceil((work.stars || 3) / 1.5)),
    ),
    completedSessions: 0,
    payMultiplier: 1,
  };
  state.sequelOffers.push(offer);
  enqueueVisibleEvent(
    {
      id: `sequel:${offer.id}`,
      kind: "職涯事件",
      title: `續作邀請｜${titleTag(work.title)}`,
      text: sequelOfferText(work),
      choices: [
        {
          id: "return",
          label: "接受回歸",
          outcome:
            "你按原條件接受續作，讓這份回歸成為可以繼續安排的正式計畫。熟悉的工作能接著往下做，檔期卻仍要實際排出來；期待不會替你完成製作。",
          effects: [
            { flag: `sequel-accepted:${offer.id}` },
            { rep: "話題度", value: 8 },
          ],
        },
        {
          id: "negotiate",
          label: "先談更好的條件",
          note: "報酬＋25%；多占一天完成宣傳義務",
          outcome:
            "製作方同意提高四分之一的報酬，你也答應在製作後多留一天參與宣傳。加價與檔期義務一起寫進了合約。",
          effects: [
            { flag: `sequel-negotiate:${offer.id}` },
            { rep: "商業價值", value: 5 },
          ],
        },
        {
          id: "creative",
          label: "爭取創作主導",
          note: "原報酬；多一天打磨，相關能力熟練時更能發揮，準備不足也可能失準",
          outcome:
            "你保留原報酬，把談判空間換成一次額外打磨與方向決定。團隊會配合你的新版本，也需要你拿出能支撐改動的專業。",
          effects: [{ flag: `sequel-creative:${offer.id}` }],
        },
        {
          id: "decline",
          label: "拒絕續作，嘗試轉型",
          outcome:
            "你謝過這份延續的信任，拒絕目前的續作提案。前作不會因此失去價值，但這一次的回歸與收入就此放下；接下來的空白，要重新去找值得填進去的東西。",
          effects: [
            { flag: `sequel-declined:${offer.id}` },
            { rep: "業界評價", value: 2 },
          ],
        },
      ],
    },
    "續作",
  );
  return offer;
}
export function scheduleSequelSession(id) {
  syncSequelOfferFlags();
  const offer = sequelOffer(id);
  if (!offer || offer.status !== "active")
    return { ok: false, message: "這份續作目前無法安排。" };
  const booked = Object.values(state.scheduledActivities || {}).filter(
    (t) =>
      t.kind === "sequel_session" &&
      t.payload?.offerId === id &&
      t.status === "scheduled",
  ).length;
  if (
    offer.termsVersion === 2 &&
    offer.completedSessions + booked >= offer.requiredSessions
  )
    return { ok: false, message: "這份續作所需的工作日已排齊。" };
  const phase =
    offer.direction === "promotion" &&
    offer.completedSessions + booked === offer.requiredSessions - 1
      ? "宣傳"
      : "製作";
  const key = `sequel:${offer.id}`,
    day = [0, 1, 2, 3, 4, 5, 6].find(
      (d) =>
        openDay(d) &&
        (offer.npcCast || []).every((n) => !isNpcBusy(n, state.week, d, key)),
    );
  if (day == null)
    return { ok: false, message: "本週沒有玩家與原班人馬都能配合的共同檔期。" };
  const r = scheduleActivity(
    "sequel_session",
    { offerId: offer.id, sequelPhase: phase },
    `${titleTag(offer.title)}${phase}`,
    { fatigue: 12, stamina: 10, preferredDay: day },
  );
  if (!r.ok) return r;
  for (const npcId of offer.npcCast || [])
    reserveNpcExternalSlot(npcId, {
      key,
      week: state.week,
      day: r.day,
      label: `${titleTag(offer.title)}續作`,
    });
  offer.lastScheduledWeek = state.week;
  return r;
}
export function completeSequelSession(id) {
  const offer = sequelOffer(id);
  if (!offer || offer.status !== "active")
    return { ok: false, text: "續作合約已失效。" };
  const sessionKey = `${state.week}:${state.runnerDay}`;
  if (offer.termsVersion === 2) {
    offer.sessionKeys ??= [];
    if (offer.sessionKeys.includes(sessionKey))
      return { ok: false, text: "這一天的續作工作已經結算。" };
    offer.sessionKeys.push(sessionKey);
    offer.skillTotal = (offer.skillTotal || 0) + sequelSkill(offer);
    offer.conditionTotal =
      (offer.conditionTotal || 0) +
      Math.max(
        0,
        Math.min(
          100,
          ((state.health || 0) +
            (state.mood || 0) +
            (100 - (state.fatigue || 0))) /
            3,
        ),
      );
  }
  offer.completedSessions += 1;
  const key = `sequel:${offer.id}`;
  for (const npcId of offer.npcCast || []) {
    completeNpcExternalSlot(npcId, key, state.week, state.runnerDay);
    if (state.knownPeople.includes(npcId))
      adjustRelationship(npcId, {
        closeness: 2,
        trust: 2,
        source: `${titleTag(offer.title)}續作合作`,
      });
  }
  if ((offer.npcCast || []).length > 1)
    for (let i = 0; i < offer.npcCast.length; i++)
      for (let j = i + 1; j < offer.npcCast.length; j++)
        adjustNpcSocialRelation(
          offer.npcCast[i],
          offer.npcCast[j],
          1,
          `${titleTag(offer.title)}續作合作`,
        );
  if (offer.completedSessions < offer.requiredSessions)
    return { ok: true, completed: false, text: sequelSessionText(offer) };
  offer.status = "completed";
  offer.completedWeek = state.week;
  const original = state.completedWorks.find((w) => w.id === offer.workId),
    quality = sequelQuality(offer),
    pay = Math.round(
      (5000 + (offer.stars || 3) * 4500) * (offer.payMultiplier || 1),
    );
  state.money += pay;
  state.fame += Math.max(3, (offer.stars || 3) * 3);
  state.fans += Math.max(20, (offer.stars || 3) * 30);
  const work = {
    id: `sequel-work-${offer.id}`,
    jobId: null,
    sequelOfferId: offer.id,
    parentWorkId: offer.workId,
    title: offer.title,
    category: offer.category,
    tags: [...(offer.tags || [])],
    stars: offer.stars,
    role: offer.role || "原班人馬回歸",
    roleId: offer.roleId || "featured",
    awardMultiplier: original?.awardMultiplier ?? 1,
    client: original?.client || "原製作方",
    quality,
    completedWeek: state.week,
    completedYear: Math.ceil(state.week / 52),
    fame: (offer.stars || 3) * 3,
    fans: (offer.stars || 3) * 30,
    npcCast: [...(offer.npcCast || [])],
    awards: [],
    sequel: true,
  };
  state.completedWorks.push(work);
  state.careerProgress[offer.category] =
    (state.careerProgress[offer.category] || 0) + work.stars * work.quality;
  registerAwardCandidate(work);
  state.flags.push({
    week: state.week,
    label: `續作完成：${offer.title}`,
    note: `原班人馬回歸，作品品質 ${quality}，收入 ${pay}。`,
  });
  return {
    ok: true,
    completed: true,
    work,
    pay,
    text: sequelCompletionText(offer, quality, pay),
  };
}
