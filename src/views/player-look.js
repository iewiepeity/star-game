import { state } from "../core/state.js";
import {
  AVATARS,
  OUTFITS,
  portraitAsset,
  portraitThumbAsset,
} from "../data/wardrobe.js";
import { esc } from "../core/utils.js";

// Every player surface reads the equipped look; fitting-room previews never leak here.
export function playerLookImage({
  full = false,
  className = "player-look-image",
} = {}) {
  const avatar = AVATARS[state.avatarId] || AVATARS.raven;
  const outfit = OUTFITS[state.outfitId] || OUTFITS.newcomer;
  const src = (full ? portraitAsset : portraitThumbAsset)(avatar.id, outfit.id);
  return `<img class="${className}" data-player-look="${avatar.id}:${outfit.id}" src="${src}" width="${full ? 512 : 160}" height="${full ? 1024 : 320}" decoding="async" alt="${esc(state.name || avatar.name)}・${esc(outfit.name)}">`;
}
export function playerLookCard({ editable = false, compact = false } = {}) {
  const outfit = OUTFITS[state.outfitId] || OUTFITS.newcomer;
  return `<section class="player-look-card ${compact ? "compact" : ""}">${playerLookImage({ full: !compact })}<div><small>目前造型</small><strong>${esc(state.name)}</strong><span>${esc(outfit.name)}</span>${editable ? '<button data-open-app="wardrobe">打開衣櫃・換裝</button>' : ""}</div></section>`;
}
