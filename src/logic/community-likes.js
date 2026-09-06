import { state } from "../core/state.js";
import { allThreads, repliesFor } from "./forum-feed.js";
export function toggleCommunityLike(kind, id) {
  const key = { social: "likedSocialPosts", forum: "likedForumItems" }[kind];
  if (!key || typeof id !== "string" || !id || id.length > 240)
    return { ok: false };
  if (
    kind === "forum" &&
    !allThreads().some(
      (t) => t.id === id || repliesFor(t).some((r) => r.id === id),
    ) &&
    !(state.forumComments || []).some((c) => c.id === id)
  )
    return { ok: false };
  state[key] ??= [];
  const index = state[key].indexOf(id);
  if (index >= 0) state[key].splice(index, 1);
  else {
    if (state[key].length >= 2000)
      return {
        ok: false,
        message: "收藏的愛心好多！先取消幾個舊的喜歡，再留給這一篇。",
      };
    state[key].push(id);
  }
  return { ok: true, liked: index < 0 };
}
