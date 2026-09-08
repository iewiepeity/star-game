import { normalizeRomanceLife } from "../core/romance-life-state.js";
import { romanceRepairStatus, inferBreakupReason } from "./romance-life.js";
import { romanceExperienceStatus } from "./romance-experiences.js";
import { state } from "../core/state.js";
import { invalidateHomeKeys } from "../core/home-state.js";
import { NPCS } from "../data/npcs.js";
import {
  ROMANCE_ROUTES,
  ROMANCE_STAGES,
  ROMANCE_STAGE_BY_ID,
} from "../data/romance.js";
import { NPC_ROMANCE_STATUS } from "../data/romance-scenes.js";
import { narrativePreferences } from "./narrative-preferences.js";
import { canInitiateMemoryContact } from "./character-memory.js";

function relationshipMessage(id, kind, text) {
  if (!text) return;
  state.npcMessages ??= [];
  state.npcMessages.push({
    id: `romance-status:${id}:${kind}:${state.week}:${state.relationships[id]?.romanceHistory?.length || 0}`,
    week: state.week,
    npcId: id,
    title: `${NPCS[id].name}・${{ public: "一起對外說明", underground: "保留私人空間", broken: "關係在這裡停下" }[kind] || "關係近況"}`,
    text,
    read: false,
    source: "romance",
  });
}
const RUPTURE_LINES = Object.freeze({
  jiqing: "我不能繼續替這些傷害圓場。我們的伴侶關係，到這裡先結束。",
  shenyao: "這次的問題，不是再談一次就能當作沒有。我無法繼續這段伴侶關係。",
  tangtang: "我不想再笑著說沒事。我們分開吧，這次我是認真說的。",
  guchengxi: "我沒辦法再用沒關係帶過。我們的伴侶關係，到這裡停下來。",
  linxiafan: "我的底線已經說清楚了。這段關係不能照原來的方式繼續，我決定分開。",
  lujingran: "我在意的事，一直沒有被好好面對。我們分開吧。這次不是沉默讓你猜。",
  xiayutong: "我不能一直用下次會更好把問題跳過去。這段伴侶關係，我想停下來。",
  sufei: "這不是誰輸誰贏。但我不想再這樣相處，我決定分開。",
  chengyian:
    "我不能替眼前的傷害找一個好看的解釋。我們的伴侶關係，先在這裡結束。",
});
const clamp = (value) =>
  Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
const PARTNER_STAGES = new Set(["dating", "committed", "engaged", "married"]);
const WORKING_STAGES = new Set(["applied", "audition", "passed", "active"]);
const NEXT_THRESHOLDS = Object.freeze({
  none: { next: "interested", affection: 20, closeness: 30, trust: 20 },
  interested: { next: "ambiguous", affection: 40, closeness: 45, trust: 35 },
  ambiguous: { next: "dating", affection: 60, closeness: 60, trust: 50 },
  dating: {
    next: "committed",
    affection: 78,
    closeness: 75,
    trust: 65,
    minWeeks: 8,
  },
  committed: {
    next: "engaged",
    affection: 90,
    closeness: 85,
    trust: 80,
    minWeeks: 26,
    minAge: 20,
  },
  engaged: {
    next: "married",
    affection: 94,
    closeness: 88,
    trust: 85,
    minWeeks: 13,
    minAge: 20,
  },
  rejected: {
    next: "interested",
    affection: 32,
    closeness: 45,
    trust: 35,
    minWeeks: 8,
  },
  broken: {
    next: "interested",
    affection: 70,
    closeness: 75,
    trust: 65,
    minWeeks: 13,
  },
});

export function playerAge(game = state) {
  return 22 + Math.floor(Math.max(0, (game.week || 1) - 1) / 52);
}
export function romanceRoute(id) {
  return ROMANCE_ROUTES[id] || null;
}
export function romanceStageLabel(stage) {
  return ROMANCE_STAGE_BY_ID[stage]?.label || "尚未定義";
}

export function ensureRomanceFields(id) {
  const rel =
    state.relationships[id] ||
    (state.relationships[id] = {
      closeness: 0,
      trust: 0,
      stage: "acquaintance",
      lastInteractionWeek: 0,
      lastMilestoneWeek: 0,
      events: [],
    });
  rel.romance = ROMANCE_STAGES.includes(rel.romance) ? rel.romance : "none";
  rel.affection = clamp(rel.affection);
  rel.hostility = clamp(rel.hostility);
  rel.visibility = rel.visibility || "private";
  rel.romanceSinceWeek = Number(rel.romanceSinceWeek) || 0;
  rel.romanceHistory = Array.isArray(rel.romanceHistory)
    ? rel.romanceHistory
    : [];
  rel.affectionHistory = Array.isArray(rel.affectionHistory)
    ? rel.affectionHistory
    : [];
  rel.hostilityHistory = Array.isArray(rel.hostilityHistory)
    ? rel.hostilityHistory
    : [];
  normalizeRomanceLife(rel);
  return rel;
}

function hasWorkConflict(id, game = state) {
  return Object.values(game.activeJobs || {}).some(
    (job) => WORKING_STAGES.has(job.stage) && job.npcCast?.includes(id),
  );
}

export function romanceEligibility(id, game = state) {
  const route = romanceRoute(id),
    npc = NPCS[id];
  if (!npc || !route)
    return { ok: false, reason: "目前沒有可發展的感情路線。" };
  if (route.tier === "disabled")
    return { ok: false, reason: "目前只開放職涯與信任路線。" };
  if (route.tier === "hidden")
    return {
      ok: false,
      hidden: true,
      reason: "這條特殊路線尚未在本周目揭露。",
    };
  const rel = game.relationships?.[id] || {};
  if ((rel.hostility || 0) >= 20)
    return {
      ok: false,
      reason: "彼此仍有未解衝突，必須先修復關係，感情才可能繼續發展。",
    };
  const age = playerAge(game);
  if (age < route.minAge)
    return { ok: false, reason: `等你更成熟一些，再重新看待這段關係。` };
  if ((game.completedWorks?.length || 0) < (route.minWorks || 0))
    return {
      ok: false,
      reason: "先建立屬於自己的作品與立足點，關係才可能變得平等。",
    };
  if (route.avoidWorkConflict && hasWorkConflict(id, game))
    return {
      ok: false,
      reason: "目前仍有直接合作或選角關係，暫時不適合跨越工作界線。",
    };
  return { ok: true, route, age };
}

export function adjustAffection(id, delta, source = "相處") {
  const route = romanceRoute(id);
  if (!route || ["disabled", "hidden"].includes(route.tier) || !delta)
    return { changed: false };
  const rel = ensureRomanceFields(id),
    before = rel.affection;
  rel.affection = clamp(before + delta);
  rel.affectionHistory.push({
    week: state.week,
    delta: rel.affection - before,
    source,
  });
  if (rel.affectionHistory.length > 40)
    rel.affectionHistory = rel.affectionHistory.slice(-40);
  return {
    changed: rel.affection !== before,
    direction:
      rel.affection > before ? "up" : rel.affection < before ? "down" : "same",
  };
}

export function affectionSignal(id) {
  const rel = ensureRomanceFields(id),
    value = rel.affection;
  if (rel.hostility >= 70) return "即使過去曾經親近，現在也已被明確的敵意蓋過";
  if (rel.hostility >= 45) return "原有的在意被衝突卡住，對方不願再靠近";
  if (rel.hostility >= 20) return "對方仍在意發生過的事，親近感暫時停在原地";
  if (rel.romance === "broken") return "彼此仍在適應分開後的距離";
  if (rel.romance === "rejected") return "那次沒有被接住的心意仍留有痕跡";
  if (rel.romance === "married") return "對方已經把你放進長遠的人生裡";
  if (value >= 90) return "你對對方而言，已經是無法輕易取代的人";
  if (value >= 75) return "對方會自然地把你算進未來安排";
  if (value >= 58) return "對方對你的態度，明顯和其他人不太一樣";
  if (value >= 40) return "對方開始願意把工作之外的時間留給你";
  if (value >= 20) return "有些在意，正藏在看似平常的互動裡";
  return "目前仍以禮貌而自然的步調認識彼此";
}
export function trustSignal(id) {
  const rel = ensureRomanceFields(id),
    value = rel.trust || 0;
  if (rel.hostility >= 70) return "對方已不再相信你的承諾，也會防範你影響工作";
  if (rel.hostility >= 45) return "重要資訊與私人想法都不再對你開放";
  if (rel.hostility >= 20) return "信任出現裂痕，對方正在觀察你是否真正改變";
  if (value >= 80) return "幾乎能放心把脆弱交給你";
  if (value >= 60) return "願意談起不會對外說的事";
  if (value >= 40) return "相處時已經不必處處防備";
  if (value >= 20) return "正在確認你是不是值得依靠的人";
  return "仍保留著業界往來應有的界線";
}

export function romanceOpportunity(id, game = state) {
  const rel = game.relationships?.[id];
  if (!rel || !game.knownPeople?.includes(id)) return null;
  const need = NEXT_THRESHOLDS[rel.romance || "none"];
  if (!need) return null;
  if (rel.romance === "broken" && !romanceRepairStatus(id, game)?.ready) return null;
  const eligible = romanceEligibility(id, game);
  if (!eligible.ok) return null;
  const since = Math.max(0, game.week - (rel.romanceSinceWeek ?? game.week));
  if (!romanceExperienceStatus(id, need.next, game).ready) return null;
  if (
    (rel.affection || 0) < need.affection ||
    (rel.closeness || 0) < need.closeness ||
    (rel.trust || 0) < need.trust ||
    since < (need.minWeeks || 0) ||
    playerAge(game) < (need.minAge || 0)
  )
    return null;
  if (PARTNER_STAGES.has(need.next) && game.partnerId && game.partnerId !== id)
    return null;
  return {
    from: rel.romance || "none",
    next: need.next,
    need,
    route: eligible.route,
  };
}

export function transitionRomance(id, next, source = "關係事件") {
  if (!ROMANCE_STAGES.includes(next) || !NPCS[id])
    return { ok: false, reason: "未知的感情狀態。" };
  const rel = ensureRomanceFields(id),
    current = rel.romance,
    allowed = {
      none: ["interested", "rejected"],
      interested: ["ambiguous", "rejected", "none"],
      ambiguous: ["dating", "rejected", "none"],
      dating: ["committed", "broken"],
      committed: ["engaged", "broken"],
      engaged: ["married", "broken"],
      married: ["broken"],
      rejected: ["interested", "none"],
      broken: ["interested", "none"],
    };
  if (!allowed[current]?.includes(next))
    return { ok: false, reason: "目前無法進入這個感情階段。" };
  const eligible = romanceEligibility(id);
  if (!eligible.ok && !["rejected", "broken", "none"].includes(next))
    return { ok: false, reason: eligible.reason };
  if (PARTNER_STAGES.has(next) && state.partnerId && state.partnerId !== id)
    return {
      ok: false,
      reason: `你目前已經和${NPCS[state.partnerId]?.name || "其他人"}交往，必須先處理現有關係。`,
    };
  if (
    !["rejected", "broken", "none"].includes(next) &&
    romanceOpportunity(id)?.next !== next
  )
    return {
      ok: false,
      reason: !romanceExperienceStatus(id, next, state).ready ? romanceExperienceStatus(id, next, state).message : "彼此的心意、信任或相處時間還未準備好，先照目前的步調相處。",
    };
  const before = current;
  rel.romance = next;
  invalidateHomeKeys(state);
  rel.romanceSinceWeek = state.week;
  if (next === "dating") {
    state.partnerId = id;
    rel.visibility = "underground";
  }
  if (PARTNER_STAGES.has(next)) state.partnerId = id;
  if (["broken", "rejected", "none"].includes(next) && state.partnerId === id)
    state.partnerId = null;
  if (["broken", "rejected", "none"].includes(next)) {
    if (next === "broken" && rel.visibility === "public")
      state.rep.話題度 = Math.min(1000, (state.rep.話題度 || 0) + 18);
    rel.visibility = "private";
    rel.mediaAcknowledged = false;
  }
  if (next === "married") rel.ceremony = "undecided";
  if (next === "broken") rel.romanceRepair = { reason: inferBreakupReason(source, rel), sinceWeek: state.week, step: 0, startedWeek: 0 };
  if (next === "dating") { rel.romanceRepair = null; rel.ceremony = "undecided"; }
  rel.romanceHistory.push({ week: state.week, from: before, to: next, source });
  rel.events = [
    ...(rel.events || []),
    { week: state.week, romance: next, source },
  ];
  state.flags.push({
    week: state.week,
    label: `感情狀態：${NPCS[id].name}・${romanceStageLabel(next)}`,
    note: source,
  });
  if (next === "broken") {
    const rupture = rel.hostility >= 45,
      text = rupture
        ? `${NPCS[id].name}明確告訴你：「${RUPTURE_LINES[id] || "我無法繼續這段伴侶關係。"}」`
        : NPC_ROMANCE_STATUS[id]?.broken;
    relationshipMessage(
      id,
      "broken",
      text +
        (before === "married"
          ? " 你們決定分開生活，後續安排仍需要另行談清楚。"
          : ""),
    );
  }
  return { ok: true, from: before, to: next, rel };
}

export function setRomanceVisibility(id, visibility, source = "共同決定") {
  const rel = ensureRomanceFields(id);
  if (
    !PARTNER_STAGES.has(rel.romance) ||
    !["underground", "public"].includes(visibility)
  )
    return { ok: false, reason: "目前沒有可調整公開狀態的戀愛關係。" };
  if (rel.visibility === visibility)
    return { ok: false, reason: "目前已經是這個狀態。" };
  rel.visibility = visibility;
  if (visibility === "public") rel.mediaAcknowledged = true;
  rel.romanceHistory.push({ week: state.week, visibility, source });
  if (
    visibility === "public" &&
    !state.eventFlags.includes(`romance:public:${id}`)
  ) {
    state.rep.話題度 = Math.min(1000, (state.rep.話題度 || 0) + 25);
    state.fans += Math.max(20, Math.round((state.fans || 0) * 0.02));
    const flag = `romance:public:${id}`;
    if (!state.eventFlags.includes(flag)) state.eventFlags.push(flag);
  }
  relationshipMessage(
    id,
    visibility,
    NPC_ROMANCE_STATUS[id]?.[visibility]?.replaceAll(
      "交往",
      rel.romance === "married" ? "結婚" : "交往",
    ),
  );
  return { ok: true, visibility };
}
export function breakUp(id, source = "主動分手") {
  const rel = ensureRomanceFields(id);
  if (!PARTNER_STAGES.has(rel.romance))
    return { ok: false, reason: "目前並沒有正式交往關係。" };
  const result = transitionRomance(id, "broken", source);
  if (result.ok) {
    state.mood = Math.max(0, state.mood - 12);
  }
  return result;
}

export function tickRomanceRelationships() {
  const updates = [], preferences = narrativePreferences();
  const noticeInterval = { low: 12, normal: 8, high: 6 }[preferences.romanceFrequency] || 8;
  const conflictInterval = { gentle: 4, normal: 2, dramatic: 1 }[preferences.conflictIntensity] || 2;
  for (const id of state.knownPeople || []) {
    const rel = ensureRomanceFields(id),
      idle = Math.max(0, state.week - (rel.lastInteractionWeek || state.week));
    if (rel.affection > 0 && idle >= 5)
      adjustAffection(id, -1, "長時間沒有聯絡");
    if (
      PARTNER_STAGES.has(rel.romance) &&
      preferences.romanceFrequency !== "off" &&
      canInitiateMemoryContact(id) &&
      idle >= 8 &&
      state.week - (rel.lastNeglectNoticeWeek || 0) >= noticeInterval
    ) {
      rel.lastNeglectNoticeWeek = state.week;
      state.npcMessages.push({
        week: state.week,
        npcId: id,
        title: `${NPCS[id].name}似乎在等你的消息`,
        text:
          NPC_ROMANCE_STATUS[id]?.neglect ||
          "最近都沒能好好見面。這週能不能一起找個彼此方便的時間？",
      });
      updates.push(`${NPCS[id].name}開始在意你們太久沒有好好相處`);
    }
    if (
      rel.visibility === "public" &&
      state.publicOpinion?.state === "scandal" &&
      PARTNER_STAGES.has(rel.romance)
    ) {
      rel.trust = Math.max(0, rel.trust - 1);
      if (preferences.romanceFrequency !== "off" && state.week - (rel.lastPublicPressureNoticeWeek || 0) >= conflictInterval) {
        rel.lastPublicPressureNoticeWeek = state.week;
        updates.push(`${NPCS[id].name}也受到公開戀情與輿論壓力影響`);
      }
    }
  }
  return updates;
}

export function romanceProgress(id) {
  const eligible = romanceEligibility(id);
  if (!eligible.ok) return eligible.reason;
  const rel = ensureRomanceFields(id),
    need = NEXT_THRESHOLDS[rel.romance];
  if (!need)
    return rel.romance === "married"
      ? "你們已經約定一起生活。"
      : "先照現在的步調相處。";
  if (need.next === "dating" && state.partnerId && state.partnerId !== id)
    return "你已有伴侶，請先處理現有關係。";
  const repair = romanceRepairStatus(id);
  if (repair && !repair.ready) return `上次分開：${repair.label}。${repair.step === 0 ? repair.plan : repair.need}`;
  if (rel.affection < need.affection)
    return "友情與信任不等於戀愛心意。可以關心近況、談談私事，讓彼此有機會更靠近。";
  if (rel.closeness < need.closeness || rel.trust < need.trust)
    return "彼此已有在意，還需要更多相處與信任。";
  if (state.week - (rel.romanceSinceWeek ?? state.week) < (need.minWeeks || 0))
    return "這段關係還需要一些共同生活的時間，暫時不必急著進下一步。";
  const experience = romanceExperienceStatus(id, need.next, state);
  if (!experience.ready) return experience.message;
  return `${experience.labels.length ? experience.message : ""}彼此已準備好，可以找個時間聊聊我們的關係。`;
}
