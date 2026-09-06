import { esc } from "../core/utils.js";
export function communityHeart(kind, id, liked, count) {
  return `<button class="community-heart ${liked ? "liked" : ""}" data-${kind}-like="${esc(id)}" aria-pressed="${liked}" aria-label="${liked ? "取消喜歡" : "喜歡"}・${count}"><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21 3 12V5h3V2h4v3h4V2h4v3h3v7z" fill="${liked ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2" stroke-linejoin="miter"/></svg><span>${count}</span><span class="heart-state">${liked ? "已喜歡" : "喜歡"}</span></button>`;
}
