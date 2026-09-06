import { allThreads } from "./forum-feed.js";
import { contextualReplyOptions } from "./social-context.js";
import { state } from "../core/state.js";
import { NPCS } from "../data/npcs.js";
import { adjustRelationship } from "./npc-engine.js";

const SOCIAL_REPLIES = {
  encourage: {
    label: "替對方加油",
    copy: "留下了一句不搶風頭、但很真誠的鼓勵。",
    relation: 2,
    trust: 1,
  },
  work: {
    label: "聊作品細節",
    copy: "你從作品本身回應，對方也認真接住了話題。",
    relation: 1,
    trust: 2,
  },
  care: {
    label: "提醒好好休息",
    copy: "你沒有只稱讚成果，也注意到文字後面的疲倦。",
    relation: 2,
    trust: 2,
  },
};

export function replyToNpcPost(npcId, type) {
  const npc = NPCS[npcId],
    reply = contextualReplyOptions(npcId)[type];
  if (!npc || !reply || !state.knownPeople.includes(npcId))
    return { ok: false, message: "這則互動目前無法送出。" };
  state.socialReplies ??= {};
  const key = `${state.week}:${npcId}`;
  if (state.socialReplies[key])
    return { ok: false, message: `這週已經回覆過${npc.name}的動態了。` };
  state.socialReplies[key] = type;
  adjustRelationship(npcId, {
    closeness: reply.relation,
    trust: reply.trust,
    source: `社群回覆：${reply.label}`,
  });
  state.npcMessages ??= [];
  state.npcMessages.push({
    id: `social-reply:${key}`,
    week: state.week,
    npcId,
    title: "貼文回覆",
    text: reply.reply,
    outgoingText: reply.label,
    source: "social",
    read: false,
  });
  return { ok: true, message: `${npc.name}回覆：「${reply.reply}」` };
}

export function forumReplyText(thread, type) {
  if (type === "reason")
    return thread.category === "作品"
      ? "想把作品本身和場外消息分開看。等看過完整內容，再來聊哪些地方做得好。"
      : "先把已公開的消息和猜測分開吧。後續有當事人的說法，再補進這串。";
  return thread.category === "作品"
    ? "自己開始接觸這一行後，才知道完成一個作品有多少小環節。這串提到的部分，我也想再留意。"
    : "開始跑行程之後，才發現外面看到的往往只是生活的一小段。想多聽幾種角度，再慢慢理解。";
}

export function forumReaction(threadId, type, draft = "") {
  const thread = allThreads().find((t) => t.id === threadId);
  if (!thread)
    return { ok: false, message: "找不到這篇文章，回列表重新選一篇吧。" };
  const custom = typeof draft === "string" ? draft.trim() : "";
  if (type === "custom" && (!custom || custom.length > 400))
    return { ok: false, message: "留言請寫 1 到 400 個字，再按送出。" };
  state.forumReactions ??= {};
  const key = `${state.week}:${threadId}`;
  if (state.forumReactions[key])
    return { ok: false, message: "這週已經在這串留下回應。" };
  const map = {
      reason: {
        label: "理性補充",
        rep: "可信度",
        value: 2,
        message: "你補上可查證的資訊，討論稍微冷靜下來。",
      },
      join: {
        label: "分享經驗",
        rep: "路人緣",
        value: 2,
        message: "你用自己的經驗加入討論，沒有暴露不該公開的內容。",
      },
      custom: {
        label: "自由留言",
        rep: "路人緣",
        value: 1,
        message: "你的留言已發布在討論串裡。",
      },
      ignore: {
        label: "先觀望",
        rep: null,
        value: 0,
        message: "你把手機放下，沒有讓每一場網路討論都變成自己的戰場。",
      },
    },
    reaction = map[type];
  if (!reaction) return { ok: false, message: "這個回應不存在。" };
  state.forumReactions[key] = type;
  if (type !== "ignore") {
    state.forumComments ??= [];
    state.forumComments.push({
      id: `comment:${key}`,
      threadId,
      week: state.week,
      type,
      text: type === "custom" ? custom : forumReplyText(thread, type),
    });
    state.forumComments = state.forumComments.slice(-300);
  }
  if (reaction.rep)
    state.rep[reaction.rep] = Math.min(
      1000,
      (state.rep[reaction.rep] || 0) + reaction.value,
    );
  state.forumDraft = "";
  return { ok: true, message: reaction.message, label: reaction.label };
}

export function socialReplyOptions(id) {
  return id ? contextualReplyOptions(id) : SOCIAL_REPLIES;
}
