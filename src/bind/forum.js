import { toggleCommunityLike } from "../logic/community-likes.js";
import { bindDeferredSearch } from "../core/deferred-search.js";
import { state } from "../core/state.js";
import { render, renderUi } from "../render.js";
import { forumReaction } from "../logic/community-interactions.js";

export function bindForum() {
  document
    .querySelector("[data-forum-draft]")
    ?.addEventListener("input", (e) => {
      state.forumDraft = e.target.value;
    });
  bindDeferredSearch(
    "[data-forum-query]",
    (value) => {
      state.forumQuery = value;
    },
    () => render({ persist: false }),
  );
  document
    .querySelector("[data-forum-sort]")
    ?.addEventListener("change", (e) => {
      state.forumSort = e.target.value;
      renderUi();
    });
  document.querySelectorAll("[data-forum-like]").forEach(
    (b) =>
      (b.onclick = () => {
        toggleCommunityLike("forum", b.dataset.forumLike);
        render();
      }),
  );
  document
    .querySelector("[data-forum-archive]")
    ?.addEventListener("click", () => {
      state.forumArchive = !state.forumArchive;
      render();
    });
  document.querySelectorAll("[data-forum-category]").forEach(
    (x) =>
      (x.onclick = () => {
        state.forumCategory = x.dataset.forumCategory;
        renderUi();
      }),
  );
  document.querySelectorAll("[data-forum-thread]").forEach(
    (x) =>
      (x.onclick = () => {
        state.forumThread = x.dataset.forumThread;
        state.forumDraft = "";
        state.forumReadIds ??= [];
        if (!state.forumReadIds.includes(state.forumThread))
          state.forumReadIds.push(state.forumThread);
        renderUi();
      }),
  );
  document.querySelector("[data-forum-back]")?.addEventListener("click", () => {
    state.forumThread = null;
    renderUi();
  });
  document
    .querySelector("[data-forum-refresh]")
    ?.addEventListener("click", () => {
      state.forumRefresh++;
      state.notice = "已更新討論，目前顯示所有已發布的留言。";
      renderUi();
    });
  document.querySelectorAll("[data-forum-react]").forEach(
    (button) =>
      (button.onclick = () => {
        const result = forumReaction(
          state.forumThread,
          button.dataset.forumReact,
          state.forumDraft,
        );
        state.notice = result.message;
        render();
      }),
  );
}
