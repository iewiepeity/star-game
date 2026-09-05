import {
  AVATAR_LIST,
  AVATARS,
  OUTFITS,
  OUTFIT_LIST,
  OUTFIT_CATEGORIES,
  outfitCategory,
  outfitBonusText,
  portraitAsset,
  portraitThumbAsset,
  isAvatarLocked,
  GENDER_CHANGE_COST,
} from "../data/wardrobe.js";
import { state, visitedLocationThisWeek } from "../core/state.js";
import { money, esc } from "../core/utils.js";
import { bonusComparison, LOOK_SLOTS, ownsOutfit } from "../logic/wardrobe.js";

export function wardrobeApp() {
  const avatar = AVATARS[state.avatarId] || AVATAR_LIST[0];
  const current = OUTFITS[state.outfitId] || OUTFITS.newcomer;
  const preview = OUTFITS[state.wardrobePreview] || current;
  const trying = preview.id !== current.id;
  const owned = ownsOutfit(state, avatar.id, preview.id);
  const canBuy = visitedLocationThisWeek("shop");
  const canSurgery = visitedLocationThisWeek("clinic");
  const filter = state.wardrobeFilter || "all",
    category = state.wardrobeCategory || "all";
  const outfits = OUTFIT_LIST.filter(
    (o) =>
      (filter === "all" ||
        (filter === "owned"
          ? ownsOutfit(state, avatar.id, o.id)
          : !ownsOutfit(state, avatar.id, o.id))) &&
      (category === "all" || outfitCategory(o.id) === category),
  );
  const buyLabel = !canBuy
    ? "本週到店後可購買"
    : state.money < preview.price
      ? `還差 ${money(preview.price - state.money)}`
      : `購買並穿上・${money(preview.price)}`;
  return `<div class="wardrobe-page dressing-room"><section class="wardrobe-stage"><div class="wardrobe-art"><span>${trying ? "FITTING・試穿中" : "NOW WEARING・穿著中"}</span><img src="${portraitAsset(avatar.id, preview.id)}" width="512" height="1024" decoding="async" fetchpriority="high" alt="${esc(avatar.name)}・${esc(preview.name)}${trying ? "試穿預覽" : "目前造型"}"></div><div class="wardrobe-current"><strong>${esc(preview.name)}</strong><small>${outfitBonusText(preview)}</small></div><div class="fitting-actions">${trying ? `<button data-outfit="${preview.id}" ${!owned && (!canBuy || state.money < preview.price) ? "disabled" : ""}>${owned ? "確認穿上" : buyLabel}</button><button data-cancel-fitting>還原目前穿著</button>` : "<span>已套用到人物資訊、房間與故事</span>"}</div><div class="avatar-switch"><span>人物外型・${esc(avatar.name)}</span>${AVATAR_LIST.map((a) => `<button data-wardrobe-avatar="${a.id}" class="${a.id === avatar.id ? "active" : ""}" aria-pressed="${a.id === avatar.id}" aria-label="切換${esc(a.name)}" ${isAvatarLocked(a, state.gender) ? "disabled" : ""}><img src="${portraitThumbAsset(a.id, "newcomer")}" width="160" height="320" loading="lazy" alt=""></button>`).join("")}</div></section><section class="closet-panel" data-scroll-key="wardrobe-catalog"><header><span>DRESSING ROOM</span><h2>今天，以什麼模樣出發？</h2><p>點選服裝即可免費試穿，確認穿上才會改變造型與能力。服裝歸各人物外型持有。</p><b>錢包 ${money(state.money)}・已收藏 ${state.ownedOutfits[avatar.id]?.length || 1} / ${OUTFIT_LIST.length} 套</b></header><div class="wardrobe-notice" role="status">${esc(state.wardrobeNotice || (trying ? "試穿不扣款、不改變正式能力，也不會寫入目前穿著。" : "選一套服裝，看看新的自己。"))}</div><details class="saved-looks" data-disclosure-key="saved-looks"><summary>常用造型・一鍵換裝</summary><p>將目前正式穿著存入欄位，下次直接穿上；覆存只會更新該欄位。</p>${Object.entries(
    LOOK_SLOTS,
  )
    .map(([slot, label]) => {
      const id = state.savedLooks?.[avatar.id]?.[slot],
        look = OUTFITS[id];
      return `<div><span><b>${label}</b><small>${look ? esc(look.name) : "尚未設定"}</small></span><button data-wear-look="${slot}" ${look ? "" : "disabled"}>穿上</button><button data-save-look="${slot}">${look ? "以目前穿著覆存" : "儲存目前穿著"}</button></div>`;
    })
    .join("")}</details>${
    trying
      ? `<section class="fitting-comparison"><h3>與目前「${esc(current.name)}」比較</h3><div>${bonusComparison(
          state,
          preview.id,
        )
          .map(
            (row) =>
              `<span>${row.name}<b>${row.before} → ${row.after}</b><em class="${row.delta < 0 ? "negative" : ""}">${row.delta > 0 ? "+" : ""}${row.delta}</em></span>`,
          )
          .join("")}</div></section>`
      : ""
  }<div class="wardrobe-shop-link"><span>${canBuy ? "星光購物商場・本週購買服務已開放" : "可先試穿；本週完成購物商場行程後開放購買。"}</span><button data-open-app="map">查看地圖</button></div><nav class="closet-filters" aria-label="服裝收藏篩選">${Object.entries(
    { all: "全部服裝", owned: "我的衣櫃", shop: "服裝商店" },
  )
    .map(
      ([id, label]) =>
        `<button data-wardrobe-filter="${id}" aria-pressed="${filter === id}">${label}</button>`,
    )
    .join(
      "",
    )}</nav><label class="closet-category">穿搭場合<select data-wardrobe-category>${Object.entries(
    OUTFIT_CATEGORIES,
  )
    .map(
      ([id, label]) =>
        `<option value="${id}" ${category === id ? "selected" : ""}>${label}</option>`,
    )
    .join(
      "",
    )}</select></label><div class="outfit-list" data-scroll-key="wardrobe-outfits">${
    outfits
      .map((outfit) => {
        const isOwned = ownsOutfit(state, avatar.id, outfit.id),
          wearing = current.id === outfit.id,
          selected = preview.id === outfit.id;
        return `<button class="outfit-card ${wearing ? "wearing" : ""} ${selected ? "previewing" : ""}" data-preview-outfit="${outfit.id}" aria-label="試穿${esc(outfit.name)}" aria-pressed="${selected}"><span class="outfit-thumb"><img src="${portraitThumbAsset(avatar.id, outfit.id)}" width="160" height="320" loading="lazy" decoding="async" alt=""></span><span class="outfit-copy"><small>${wearing ? "穿著中" : isOwned ? "已擁有" : money(outfit.price)}</small><strong>${outfit.name}</strong><span class="outfit-note">${outfit.note}</span><small>${outfitBonusText(outfit)}</small></span><em class="outfit-try-label">${selected ? "預覽中" : "試穿"}</em></button>`;
      })
      .join("") ||
    '<p class="closet-empty">這個分類還沒有服裝，試試其他場合或「全部服裝」。</p>'
  }</div><details class="surgery-panel" data-disclosure-key="wardrobe-surgery"><summary>人物設定・整形手術</summary><p>本週先到星望整形外科看診後可辦理。手術會切換人物外型，原人物的服裝與常用造型仍保留。</p>${[
    "女性",
    "男性",
  ]
    .filter((g) => g !== state.gender)
    .map(
      (g) =>
        `<button data-change-gender="${g}" ${canSurgery && state.money >= GENDER_CHANGE_COST ? "" : "disabled"}>變性為${g}・${money(GENDER_CHANGE_COST)}</button>`,
    )
    .join(
      "",
    )}${canSurgery ? "" : "<p>本週尚未到院看診。</p>"}</details></section></div>`;
}
