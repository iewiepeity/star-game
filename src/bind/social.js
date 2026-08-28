import { SOCIAL_POST_TEMPLATES } from "../data/social.js";
import { state } from "../core/state.js";
import { scheduleActivity } from "../logic/scheduled-activities.js";
import { render } from "../render.js";
import { replyToNpcPost } from "../logic/community-interactions.js";
import { socialDrafts } from "../logic/social-drafts.js";
export function bindSocial() {
  document.querySelectorAll("[data-social-post]").forEach(
    (x) =>
      (x.onclick = () => {
        const type = x.dataset.socialPost,
          t = socialDrafts()[type] || SOCIAL_POST_TEMPLATES[type];
        const already = Object.values(state.scheduledActivities || {}).some(
          (a) =>
            a.week === state.week &&
            a.status === "scheduled" &&
            a.kind === "social_post",
        );
        if (already) {
          state.socialNotice = "這週已經安排一篇正式社群更新了。";
          render();
          return;
        }
        const r = scheduleActivity(
          "social_post",
          { type, text:t.text, label:t.label },
          `社群更新：${t.label}`,
          { fatigue: 2, stamina: 2 },
        );
        state.socialNotice = r.message;
        render();
      }),
  );
  document.querySelectorAll("[data-social-like]").forEach(
    (x) =>
      (x.onclick = () => {
        const id = x.dataset.socialLike,
          index = state.likedSocialPosts.indexOf(id);
        if (index >= 0) state.likedSocialPosts.splice(index, 1);
        else state.likedSocialPosts.push(id);
        render();
      }),
  );
  document.querySelectorAll("[data-social-reply]").forEach(
    (x) =>
      (x.onclick = () => {
        const result = replyToNpcPost(
          x.dataset.socialReply,
          x.dataset.replyType,
        );
        state.socialNotice = result.message;
        render();
      }),
  );
}
