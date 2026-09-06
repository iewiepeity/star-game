import { communityHeart } from "./community-heart.js";
import { npcSocialPost } from "../logic/social-context.js";
import { playerLookImage } from "./player-look.js";
import { OFFICIAL_SOCIAL_POSTS } from "../data/social.js";
import { NPCS } from "../data/npcs.js";
import { DAYS } from "../data/calendar.js";
import { state } from "../core/state.js";
import { esc } from "../core/utils.js";
import {
  publicOpinionLabel,
  publicOpinionSnapshot,
} from "../logic/reputation-engine.js";
import { socialReplyOptions } from "../logic/community-interactions.js";
import { socialDrafts } from "../logic/social-drafts.js";
import { workArtFor } from "../data/work-art.js";
function postCard(post) {
  const liked = state.likedSocialPosts.includes(post.id),
    expanded = state.socialExpandedPost === post.id,
    comments = post.comments || [],
    replied =
      post.npcId && state.socialReplies?.[`${state.week}:${post.npcId}`];
  return `<article class="social-post ${post.pending ? "pending" : ""}" data-post-id="${esc(post.id)}"><header><i>${post.player ? playerLookImage() : post.image ? `<img src="${post.image}" alt="" loading="lazy">` : esc(post.avatar || "✦")}</i><div><b>${esc(post.name)}</b><small>${post.badge}・第 ${post.week || state.week} 週</small></div>${post.pending ? `<em>排程中</em>` : ""}</header><p>${esc(post.text)}</p>${post.media ? `<img class="social-work-media" src="${post.media.src}" alt="${esc(post.media.alt)}" loading="lazy">` : ""}<footer>${post.pending ? `<span>◷ 將於行程執行後正式發布</span>` : `${communityHeart("social", post.id, liked, (post.likes || 0) + Number(liked))}<button data-social-comments="${esc(post.id)}" aria-expanded="${expanded}">▤ 回覆 ${comments.length}</button>`}</footer>${
    post.npcId && expanded
      ? `<div class="social-reply-actions">${
          replied
            ? `<span>✓ 已用「${esc(socialReplyOptions(post.npcId)[replied]?.label || "回覆")}」和對方互動</span>`
            : Object.entries(socialReplyOptions(post.npcId))
                .map(
                  ([id, option]) =>
                    `<button data-social-reply="${post.npcId}" data-reply-type="${id}">${esc(option.label)}</button>`,
                )
                .join("")
        }</div>`
      : ""
  }${
    expanded
      ? `<div class="social-comments">${
          comments
            .map(
              (c) =>
                `<p><b>${esc(typeof c === "string" ? "網友" : c.name)}</b> ${esc(typeof c === "string" ? c : c.text)}</p>`,
            )
            .join("") || "<p>還沒有留言，先留一點空間給下一句話。</p>"
        }</div>`
      : ""
  }</article>`;
}
function feed() {
  const drafts = socialDrafts();
  const scheduled = Object.values(state.scheduledActivities || {})
    .filter(
      (a) =>
        a.week === state.week &&
        a.status === "scheduled" &&
        a.kind === "social_post",
    )
    .map((a) => {
      const t = a.payload?.text
        ? a.payload
        : drafts[a.payload?.type] || a.payload;
      return {
        id: `scheduled-${a.id}`,
        name: state.name,
        player: true,
        badge: `預定發布・${DAYS[a.day]}`,
        avatar: state.name.slice(0, 1),
        week: state.week,
        text: t?.text || a.label,
        comments: [],
        pending: true,
      };
    });
  const own = state.socialPosts.map((p) => ({
    ...p,
    name: state.name,
    player: true,
    badge: "本人",
    avatar: state.name.slice(0, 1),
  }));
  const news = (state.industryNews || []).slice(0, 8).map((n) => ({
    id: `social-${n.id}`,
    name: "星望娛樂快訊",
    badge: n.category,
    avatar: "✦",
    week: n.week,
    text: `${n.title}｜${n.body}`,
    likes: Math.max(30, Math.round((n.heat || 50) / 2)),
    comments: ["這週娛樂圈好多事。", "先卡，等後續。"],
  }));
  const echoes = [...(state.livingWorldFeed || [])]
    .reverse()
    .filter((item) =>
      ["作品長尾", "履約回聲", "人物近況", "世界反應"].includes(item.type),
    )
    .slice(0, 5)
    .map((item, i) => {
      const work = (state.completedWorks || []).find((w) =>
        `${item.title} ${item.text}`.includes(w.title),
      );
      return {
        id: `echo-social-${item.id}`,
        name:
          item.type === "人物近況" && item.npcId && NPCS[item.npcId]
            ? NPCS[item.npcId].name
            : "圈內觀察",
        badge: item.type || "後續",
        avatar: item.npcId && NPCS[item.npcId] ? NPCS[item.npcId].avatar : "↻",
        image: item.npcId && NPCS[item.npcId] ? NPCS[item.npcId].head : null,
        media: workArtFor(work),
        week: item.week,
        text: `${item.title}｜${item.text}`,
        likes: 45 + i * 19 + Math.min(300, state.fame),
        comments:
          item.type === "作品長尾"
            ? ["原來這作品後續還在發酵。", "當時那段真的有記憶點。"]
            : ["圈內最近真的一直在動。", "這件事之後應該還有後續。"],
      };
    });
  const npc = state.knownPeople
    .filter((id) => NPCS[id])
    .map((id, i) => ({
      ...npcSocialPost(id),
      name: NPCS[id].name,
      badge: NPCS[id].job,
      image: NPCS[id].head,
      likes: 86 + i * 37,
      comments: state.socialReplies?.[`${state.week}:${id}`]
        ? [
            {
              name: state.name,
              text:
                state.npcMessages.find(
                  (m) => m.id === `social-reply:${state.week}:${id}`,
                )?.outgoingText ||
                socialReplyOptions(id)[
                  state.socialReplies[`${state.week}:${id}`]
                ]?.label ||
                "留下了回覆",
            },
            {
              name: NPCS[id].name,
              text:
                state.npcMessages.find(
                  (m) => m.id === `social-reply:${state.week}:${id}`,
                )?.text || "謝謝你的留言。",
            },
          ].filter(Boolean)
        : [],
    }));
  return [
    ...scheduled,
    ...own,
    ...echoes,
    ...news,
    ...npc,
    ...OFFICIAL_SOCIAL_POSTS,
  ];
}
export function socialApp() {
  const filter = state.socialFilter || "all",
    posts = feed().filter((p) =>
      filter === "mine" ? p.player : filter === "friends" ? p.npcId : true,
    );
  const estimated = Math.max(12, state.fans + state.fame * 4),
    op = publicOpinionSnapshot(),
    drafts = socialDrafts();
  return `<div class="social-page"><header class="social-profile"><i>${playerLookImage()}</i><div><span>@star_${esc(state.name.toLowerCase().replace(/\s/g, "")) || "newcomer"}</span><h2>${esc(state.name)}</h2><p>新人藝人・${publicOpinionLabel()}・品牌信任 ${op.brandTrust}</p></div><dl><div><b>${state.socialPosts.length}</b><small>貼文</small></div><div><b>${estimated}</b><small>追蹤者</small></div><div><b>${op.heat}</b><small>話題熱度</small></div></dl></header><section class="social-compose"><details><summary>✎ 分享今天的近況</summary><p>正式經營貼文會安排一天；按讚與留言隨時都能做。</p><div>${Object.entries(
    drafts,
  )
    .map(
      ([id, t]) =>
        `<button data-social-post="${id}"><i>${t.icon}</i><span><b>${t.label}</b><small>${t.text}</small></span></button>`,
    )
    .join(
      "",
    )}</div></details>${state.socialNotice ? `<p>${esc(state.socialNotice)}</p>` : ""}</section><nav class="social-feed-tabs" aria-label="動態篩選">${[
    ["all", "為你推薦"],
    ["friends", "好友動態"],
    ["mine", "我的貼文"],
  ]
    .map(
      ([id, label]) =>
        `<button data-social-filter="${id}" aria-pressed="${filter === id}">${label}</button>`,
    )
    .join(
      "",
    )}</nav><div class="social-feed">${posts.map(postCard).join("") || `<p class="social-empty">${filter === "mine" ? "還沒有自己的貼文，分享一段今天的生活吧。" : "認識朋友後，就能在這裡看到對方的近況。"}</p>`}</div></div>`;
}
