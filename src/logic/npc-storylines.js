import { state } from "../core/state.js";
import { NPCS } from "../data/npcs.js";
import { NPC_STORY_CONTENT } from "../data/npc-story-content.js";
import { relationshipStage } from "./npc-engine.js";
import { romanceOpportunity } from "./romance-engine.js";
import { enqueueVisibleEvent } from "./event-engine.js";
import { NPC_ARCS } from "../data/npc-arc-events.js";
import { NPC_ROMANCE_SCENES } from "../data/romance-scenes.js";
import { narrativePreferences } from "./narrative-preferences.js";
import { canInitiateMemoryContact } from "./character-memory.js";
const STAGE_COPY = {
  acquaintance: {
    title: "關係開始有了名字",
    text: (n) =>
      `翻開通訊錄，你想起與${n.name}交換聯絡方式的那天。要不要傳個訊息，聊聊各自的近況？`,
    choices: (n) => [
      {
        id: "warm",
        label: "傳訊息聊聊近況",
        outcome: `你們互傳了幾則近況。你和${n.name}的距離又近了一些。`,
        effect: { npc: n.id, relation: 4, trust: 2, affection: 1 },
      },
      {
        id: "steady",
        label: "照現在的步調就好",
        outcome: "你沒有刻意加速這段關係。",
        effect: { mood: 1 },
      },
    ],
  },
  familiar: {
    title: "圈內熟人變成真正的熟人",
    text: (n) =>
      NPC_STORY_CONTENT[n.id]?.hook ||
      `${n.name}開始會在沒有工作理由的時候找你說幾句。`,
    choices: (n) => [
      {
        id: "open",
        label: "也分享自己的近況",
        outcome: `${n.name}明顯更信任你了。`,
        effect: { npc: n.id, relation: 5, trust: 5, affection: 2 },
      },
      {
        id: "work",
        label: "先聊最近的工作",
        outcome: "你們的默契更偏向可靠的工作夥伴。",
        effect: { npc: n.id, relation: 2, trust: 6 },
      },
    ],
  },
  friend: {
    title: "工作之外的邀請",
    text: (n) => `${n.name}傳來一則訊息：這次不是通告，也不是公事。`,
    choices: (n) => [
      {
        id: "go",
        label: "赴約",
        outcome: "這次見面沒有鏡頭，也沒有誰需要表現。",
        effect: { npc: n.id, relation: 8, trust: 5, affection: 4, mood: 4 },
      },
      {
        id: "later",
        label: "最近真的太忙了",
        outcome: `${n.name}說沒關係，下次再約。`,
        effect: { npc: n.id, relation: 1, trust: 1 },
      },
    ],
  },
  confidant: {
    title: "只有你知道的事",
    text: (n) =>
      NPC_STORY_CONTENT[n.id]?.private ||
      `${n.name}第一次主動提起自己很少對外說的壓力。`,
    choices: (n) => [
      {
        id: "listen",
        label: "先聽，不急著給答案",
        outcome: "你沒有替對方解決問題，但讓這件事變得沒那麼難扛。",
        effect: { npc: n.id, relation: 5, trust: 10, affection: 4 },
      },
      {
        id: "encourage",
        label: "認真替對方打氣",
        outcome: `${n.name}笑著說，至少這句話會記得。`,
        effect: { npc: n.id, relation: 7, trust: 6, affection: 3 },
      },
    ],
  },
  bonded: {
    title: "無法輕易取代的人",
    text: (n) =>
      `${n.name}開始把你放進不會對外公開的人生安排裡；無論是否成為戀人，這份信任都已經很重要。`,
    choices: (n) => [
      {
        id: "stay",
        label: "告訴對方你也很珍惜",
        outcome: "你們不必急著替重要下定義。",
        effect: { npc: n.id, relation: 5, trust: 6, affection: 3 },
      },
      {
        id: "cherish",
        label: "用行動守住這份信任",
        outcome: "你記住了對方真正需要的是什麼。",
        effect: { npc: n.id, relation: 3, trust: 8, affection: 1 },
      },
    ],
  },
};
function acceptedQueue(event, source) {
  const result = enqueueVisibleEvent(event, source);
  return result === true || result === "deferred";
}
function romanceChoices(npc, id, opportunity, copy, laterEffect) {
  const choices = [
    {
      id: "yes",
      label: copy.label,
      outcome: copy.yes,
      effect: {
        npc: id,
        relation: 4,
        trust: 5,
        affection: 4,
        romance: opportunity.next,
      },
    },
    {
      id: "later",
      label: ["rejected", "broken"].includes(opportunity.from)
        ? "保持現在的距離"
        : "現在還不能答應",
      outcome: copy.later,
      effect: laterEffect,
    },
  ];
  if (opportunity.from === "committed")
    choices.push({
      id: "build-together",
      label: "願意訂婚，從做得到的生活開始",
      note: "深厚羈絆與共情解鎖",
      special: true,
      requires: {
        relationship: { [id]: { closeness: 80, trust: 70, affection: 70 } },
        hidden: { 共情: 580 },
      },
      outcome:
        copy.yes +
        " 你們也把暫時做不到的事說清楚，先決定一件下週就能一起完成的安排。",
      effect: {
        npc: id,
        relation: 7,
        trust: 9,
        affection: 7,
        romance: "engaged",
      },
    });
  if (opportunity.from === "engaged")
    choices.push({
      id: "private-vow",
      label: "辦一場只邀親友的婚禮",
      note: "深厚羈絆與品德解鎖；婚訊公開，儀式與細節留給親友。",
      special: true,
      requires: {
        relationship: { [id]: { closeness: 90, trust: 82, affection: 82 } },
        hidden: { 品德: 600 },
      },
      outcome:
        copy.yes +
        " 你們對外確認婚訊，儀式卻沒有直播與贊助；每張椅子都留給真正想邀請的人。",
      effect: {
        npc: id,
        relation: 8,
        trust: 10,
        affection: 8,
        romance: "married",
      },
    });
  return choices;
}
// 交往後可以暫緩承諾；八週後重新提問，不把一次「還沒準備好」鎖成永久死路。
function romanceOfferKey(id, rel) {
  const base = `${id}:romance:${rel.romance}:${rel.romanceHistory?.length || 0}`;
  if (!state.npcStoryHistory.includes(base)) return base;
  if (!["dating", "committed", "engaged"].includes(rel.romance)) return base;
  const eventId = `npc-romance-${base}`;
  const latest = [...(state.eventHistory || [])]
    .reverse()
    .find(
      (record) =>
        record.id === eventId || record.id?.startsWith(`${eventId}:retry:`),
    );
  if (!latest || latest.choice !== "later" || state.week - latest.week < 8)
    return base;
  return `${base}:retry:${latest.week}`;
}
export function queueNpcStoryEvents() {
  state.npcStoryHistory ??= [];
  const preferences = narrativePreferences(), romanceInterval = { low: 6, normal: 3, high: 1 }[preferences.romanceFrequency] || 3;
  const queued = [],
    ranks = ["acquaintance", "familiar", "friend", "confidant", "bonded"];
  for (const id of state.knownPeople || []) {
    const sourceNpc = NPCS[id],
      rel = state.relationships[id];
    if (!sourceNpc || !rel) continue;
    const npc = { ...sourceNpc, id };
    const stage = relationshipStage(rel).id,
      copy = STAGE_COPY[stage],
      latestRomanceWeek = Math.max(0, ...(state.eventHistory || []).filter(item => item.id?.startsWith(`npc-romance-${id}:`) || item.id?.startsWith(`romance-daily:${id}:`)).map(item => Number(item.week) || 0)),
      canOfferRomance = preferences.romanceFrequency !== "off" && canInitiateMemoryContact(id) && (!latestRomanceWeek || state.week - latestRomanceWeek >= romanceInterval),
      opportunity = canOfferRomance ? romanceOpportunity(id) : null,
      romance = opportunity && NPC_ROMANCE_SCENES[id]?.[opportunity.from];
    if (copy) {
      const key = `${id}:stage:${stage}`;
      if (!state.npcStoryHistory.includes(key)) {
        const event = {
          id: `npc-story-${key}`,
          npcId: id,
          kind: "人物事件",
          title: `${npc.name}｜${copy.title}`,
          text: copy.text(npc),
          choices: copy.choices(npc),
        };
        if (acceptedQueue(event, "人物關係")) {
          state.npcStoryHistory.push(key);
          queued.push(event.id);
        }
      }
    }
    if (romance) {
      const key = romanceOfferKey(id, rel);
      if (!state.npcStoryHistory.includes(key)) {
        const early = ["none", "interested", "ambiguous"].includes(
            opportunity.from,
          ),
          laterEffect = {
            npc: id,
            relation: -2,
            trust: 1,
            affection: -8,
            ...(early ? { romance: "rejected" } : {}),
          },
          event = {
            id: `npc-romance-${key}`,
            npcId: id,
            kind: "戀愛事件",
            priority: 100,
            persistent: true,
            title: `${npc.name}｜${romance.title}`,
            text: romance.text,
            choices: romanceChoices(npc, id, opportunity, romance, laterEffect),
          };
        if (acceptedQueue(event, "戀愛事件")) {
          state.npcStoryHistory.push(key);
          queued.push(event.id);
        }
      }
    }
    if (!romance)
      for (const [chapterIndex, chapter] of (NPC_ARCS[id] || []).entries()) {
        const key = `${id}:arc:${chapter.id}`;
        if (
          ranks.indexOf(stage) < ranks.indexOf(chapter.stage) ||
          state.npcStoryHistory.includes(key)
        )
          continue;
        const prior =
            chapterIndex > 0 ? (NPC_ARCS[id] || [])[chapterIndex - 1] : null,
          priorRecord =
            prior &&
            [...state.eventHistory]
              .reverse()
              .find((item) => item.id === `npc-arc-${id}-${prior.id}`),
          echo = priorRecord
            ? `上一次，你選擇了「${priorRecord.choiceLabel}」。${priorRecord.outcome} 這個決定沒有被忘記。\n\n`
            : "",
          event = {
            id: `npc-arc-${id}-${chapter.id}`,
            npcId: id,
            kind: "人物事件",
            priority: 95,
            persistent: true,
            title: `${npc.name}｜${chapter.title}`,
            text: echo + chapter.text,
            choices: chapter.choices.map((choice) => {
              const { effect, ...copy } = choice;
              return {
                ...copy,
                outcome: choice.outcome,
                effects: [
                  { npc: id, ...effect },
                  { flag: `npc-branch:${id}:${chapter.id}:${choice.id}` },
                ],
              };
            }),
          };
        if (prior && !priorRecord) continue;
        if (acceptedQueue(event, "人物主線")) {
          state.npcStoryHistory.push(key);
          queued.push(event.id);
        }
        break;
      }
  }
  return queued;
}

export function requestRomanceConversation(id) {
  const opportunity = romanceOpportunity(id),
    copy = opportunity && NPC_ROMANCE_SCENES[id]?.[opportunity.from];
  if (!copy)
    return { ok: false, message: "現在還需要一點時間。先看看彼此的相處感覺。" };
  const pending = [
    state.activeEvent,
    ...(state.eventQueue || []),
    ...(state.queuedEvents || []),
  ].some((x) => {
    const e = x?.event || x;
    return e?.npcId === id && e?.kind === "戀愛事件";
  });
  if (pending)
    return { ok: false, message: "你們已經有一段待繼續的談話，先把它聊完吧。" };
  const rel = state.relationships[id],
    base = `${id}:romance:${rel.romance}:${rel.romanceHistory?.length || 0}`;
  const key = `${base}:contact:${state.week}`;
  if (state.npcStoryHistory?.includes(key))
    return { ok: false, message: "這週已經提過，留點時間給彼此。" };
  const npc = { ...NPCS[id], id },
    early = ["none", "interested", "ambiguous"].includes(opportunity.from);
  const event = {
    id: `npc-romance-${key}`,
    npcId: id,
    kind: "戀愛事件",
    priority: 100,
    persistent: true,
    title: `${npc.name}｜${copy.title}`,
    text: copy.text,
    choices: romanceChoices(npc, id, opportunity, copy, {
      npc: id,
      trust: 1,
      affection: -8,
      ...(early ? { romance: "rejected" } : {}),
    }),
  };
  if (!acceptedQueue(event, "戀愛事件"))
    return { ok: false, message: "先完成眼前的事，再回來聊吧。" };
  state.npcStoryHistory ??= [];
  state.npcStoryHistory.push(key);
  return { ok: true, message: "已把這段談話留在待辦故事，回到場景即可繼續。" };
}
