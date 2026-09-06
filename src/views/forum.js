import { FORUM_CATEGORIES } from "../data/forum.js";
import { state } from "../core/state.js";
import { esc } from "../core/utils.js";
import { allThreads, repliesFor } from "../logic/forum-feed.js";
import { forumReplyText } from "../logic/community-interactions.js";
import { communityHeart } from "./community-heart.js";
export { allThreads } from "../logic/forum-feed.js";
const liked = (id) => (state.likedForumItems || []).includes(id);
const heart = (id, count) =>
  communityHeart("forum", id, liked(id), count + Number(liked(id)));
function playerReplies(thread) {
  const saved = (state.forumComments || []).filter(
    (c) => c.threadId === thread.id,
  );
  const legacy = state.forumReactions?.[`${state.week}:${thread.id}`];
  if (
    legacy &&
    legacy !== "ignore" &&
    !saved.some((c) => c.week === state.week)
  )
    saved.push({
      id: `legacy:${state.week}:${thread.id}`,
      text: forumReplyText(thread, legacy),
      week: state.week,
    });
  return saved;
}
export function forumApp() {
  const threads = allThreads(),
    selected = threads.find((t) => t.id === state.forumThread);
  if (selected) {
    const reaction = state.forumReactions?.[`${state.week}:${selected.id}`];
    const own = playerReplies(selected),
      replies = repliesFor(selected);
    return `<div class="forum-page"><button class="forum-back" data-forum-back>← 返回討論區</button><article class="forum-thread-detail"><div class="forum-author"><i>${esc(selected.author.slice(0, 1))}</i><div><b>${esc(selected.author)}</b><small>第 ${selected.week || 1} 週・${selected.category}</small></div><span class="forum-chip">樓主</span></div><h2>${esc(selected.title)}</h2><p>${esc(selected.body)}</p><footer>${heart(selected.id, Math.round(selected.heat / 5))}<span>${replies.length + own.length} 則回覆・熱度 ${selected.heat}</span></footer></article><section class="forum-player-reply"><h3>加入討論</h3>${reaction ? `<p class="forum-reply-status" role="status">${reaction === "ignore" ? "你選擇先觀望，這串沒有送出你的留言。" : "✓ 留言已送出，在下方可以看到你的回覆。"}</p>` : `<div class="forum-reply-choices">${["reason", "join"].map((type) => `<button data-forum-react="${type}"><b>${type === "reason" ? "理性補充" : "分享經驗"}</b><span>${esc(forumReplyText(selected, type))}</span><small>送出這則回覆 ↑</small></button>`).join("")}</div><details class="forum-custom-composer"><summary>✎ 用自己的話留言</summary><label><span>你的回覆（最多 400 字）</span><textarea data-forum-draft rows="4" maxlength="400" aria-label="編寫論壇留言" placeholder="聊聊你的看法，也給別人的看法留一點空間。">${esc(state.forumDraft || "")}</textarea></label><button data-forum-react="custom">發布留言 ↑</button></details><button data-forum-react="ignore">先觀望，暫不留言</button>`}</section><div class="forum-reply-head"><b>全部回覆 · ${replies.length + own.length}</b><button data-forum-refresh>重新整理 ↻</button></div><div class="forum-replies">${[...replies.map((r) => ({ ...r, week: selected.week })), ...own.map((r) => ({ ...r, handle: state.name, own: true, likes: 0 }))].map((r, i) => `<article class="${r.own ? "own-reply" : ""}"><i>${esc(r.handle.slice(0, 1))}</i><div><header><b>${esc(r.handle)}${r.own ? " · 你" : ""}</b><small>#${i + 1}・第 ${r.week || 1} 週</small></header><p>${esc(r.text)}</p>${r.own ? `<span class="sent-label">✓ 已發布</span>` : heart(r.id, r.likes)}</div></article>`).join("")}</div><p class="forum-end">— 讀到這裡，你已追上這串討論 —</p></div>`;
  }
  const category = state.forumCategory || "熱門",
    query = (state.forumQuery || "").trim().toLocaleLowerCase("zh-Hant");
  const visible = threads.filter(
    (t) =>
      (category === "熱門" || t.category === category) &&
      `${t.title} ${t.body} ${t.author}`
        .toLocaleLowerCase("zh-Hant")
        .includes(query),
  );
  if (state.forumSort === "heat")
    visible.sort((a, b) => b.heat - a.heat || b.week - a.week);
  if (state.forumSort === "unread")
    visible.sort(
      (a, b) =>
        Number(state.forumReadIds?.includes(a.id)) -
        Number(state.forumReadIds?.includes(b.id)),
    );
  return `<div class="forum-page"><header class="forum-hero"><div><span>STAR TALK</span><h2>星談論壇</h2><p>作品開聊、圈內近況，還有那些想找人一起吐槽的小事。</p></div><b>${threads.length} 串討論</b></header><div class="forum-tools"><label><input type="search" data-forum-query value="${esc(state.forumQuery || "")}" placeholder="搜尋文章、內容或作者" aria-label="搜尋論壇"></label><label><span class="sr-only">討論排序</span><select data-forum-sort aria-label="討論排序"><option value="latest" ${!state.forumSort || state.forumSort === "latest" ? "selected" : ""}>最新文章</option><option value="heat" ${state.forumSort === "heat" ? "selected" : ""}>最多熱度</option><option value="unread" ${state.forumSort === "unread" ? "selected" : ""}>未讀優先</option></select></label><button data-forum-archive aria-pressed="${!!state.forumArchive}">${state.forumArchive ? "只看近期討論" : "查看歷史討論"}</button></div><nav class="forum-tabs" aria-label="論壇分類">${FORUM_CATEGORIES.map((c) => `<button class="${c === category ? "active" : ""}" data-forum-category="${c}" aria-pressed="${c === category}">${c}</button>`).join("")}</nav><div class="forum-thread-list">${visible.map((t) => `<button data-forum-thread="${esc(t.id)}" class="${state.forumReadIds?.includes(t.id) ? "read" : "unread"}"><span class="forum-thread-icon" aria-hidden="true">${t.category === "作品" ? "▣" : t.category === "閒聊" ? "☕" : "✦"}</span><span class="forum-thread-copy"><small><span class="forum-chip">${t.category}</span> ${esc(t.author)}・第 ${t.week || 1} 週${state.forumReadIds?.includes(t.id) ? "・已讀" : "・未讀"}</small><b>${esc(t.title)}</b><em>${esc(t.body)}</em><small>${repliesFor(t).length + playerReplies(t).length} 則回覆${liked(t.id) ? "・♥ 你喜歡這篇" : ""}</small></span><strong>🔥 ${t.heat}</strong></button>`).join("") || `<div class="forum-empty"><h3>這裡暫時很安靜</h3><p>${query ? "換個關鍵字，或到其他分類找找。" : "最近沒有相關文章，歷史討論裡還留著舊串。"}</p></div>`}</div><aside class="forum-disclaimer">星談公約：聊作品、尊重彼此，未經證實的消息先別急著轉傳。</aside></div>`;
}
