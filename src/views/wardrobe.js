// 畫面層：紙娃娃衣櫃。以同角色、同站姿的完整立繪切換服裝，避免圖層錯位；加成由 effectiveStat() 套用。
// 性別鎖定立繪、服裝購買綁服裝店（星光購物商場）、變性綁整形醫院（星望整形外科），皆需本週已去過對應地點。
import {
  AVATAR_LIST,
  AVATARS,
  OUTFIT_LIST,
  outfitBonusText,
  portraitAsset,
  portraitThumbAsset,
  isAvatarLocked,
  GENDER_CHANGE_COST,
} from "../data/wardrobe.js";
import { state, visitedLocationThisWeek } from "../core/state.js";
import { money, esc } from "../core/utils.js";

const shoppingUnlocked = () => visitedLocationThisWeek("shop");
const surgeryUnlocked = () => visitedLocationThisWeek("clinic");

export function wardrobeApp() {
  const markup = baseWardrobeApp();
  return AVATAR_LIST.reduce(
    (html, avatar) =>
      html.replace(
        `data-wardrobe-avatar="${avatar.id}"`,
        `data-wardrobe-avatar="${avatar.id}" aria-pressed="${avatar.id === state.avatarId}"`,
      ),
    markup,
  );
}

function baseWardrobeApp() {
  const avatar = AVATARS[state.avatarId] || AVATAR_LIST[0],
    owned = new Set(state.ownedOutfits[avatar.id] || ["newcomer"]),
    current =
      OUTFIT_LIST.find((x) => x.id === state.outfitId) || OUTFIT_LIST[0],
    canBuy = shoppingUnlocked(),
    canSurgery = surgeryUnlocked();
  return `<div class="wardrobe-page"><section class="wardrobe-stage"><div class="wardrobe-art"><span>NOW WEARING</span><img src="${portraitAsset(avatar.id, current.id)}" width="512" height="1024" decoding="async" fetchpriority="high" alt="穿著${esc(current.name)}的玩家全身立繪"></div><div class="wardrobe-current"><strong>${current.name}</strong><small>${outfitBonusText(current)}</small></div><div class="avatar-switch"><span>切換人物立繪・目前性別：${esc(state.gender)}</span>${AVATAR_LIST.map(
    (a, index) => {
      const locked = isAvatarLocked(a, state.gender);
      return `<button class="${a.id === avatar.id ? "active" : ""} ${locked ? "locked" : ""}" data-wardrobe-avatar="${a.id}" ${locked ? "disabled" : ""} aria-label="${locked ? `第 ${index + 1} 款人物立繪已上鎖` : `切換成第 ${index + 1} 款人物立繪`}"><img src="${portraitThumbAsset(a.id, "newcomer")}" width="160" height="320" loading="lazy" decoding="async" alt="">${locked ? "<u>上鎖</u>" : ""}</button>`;
    },
  ).join(
    "",
  )}</div></section><section class="closet-panel"><header><span>DRESSING ROOM</span><h2>今天要穿什麼？</h2><p>服裝加成只在穿著期間生效，會直接影響試鏡、面談與資質判定，不會永久灌入基礎能力。新服裝要先去地圖上的星光購物商場逛過，本週才能在這裡購買；每套服裝只算在購買當下穿著的人物立繪名下，換人立繪不會共用購買紀錄。</p></header>${state.wardrobeNotice ? `<div class="wardrobe-notice">${esc(state.wardrobeNotice)}</div>` : ""}${canBuy ? "" : '<div class="wardrobe-hint">本週還沒去過星光購物商場，只能穿目前已擁有的服裝，暫時無法購買新服裝。</div>'}<div class="outfit-list" data-scroll-key="wardrobe-outfits">${OUTFIT_LIST.map(
    (outfit) => {
      const isOwned = owned.has(outfit.id),
        wearing = state.outfitId === outfit.id,
        locked = !isOwned && !canBuy,
        status = wearing
          ? "穿著中"
          : isOwned
            ? "已擁有"
            : locked
              ? "尚未解鎖"
              : "服飾商店",
        label = wearing
          ? "目前造型"
          : isOwned
            ? "穿上"
            : locked
              ? "前往服裝店購買"
              : "購買並穿上・" + money(outfit.price);
      return `<article class="outfit-card ${wearing ? "wearing" : ""} ${locked ? "locked" : ""}"><div class="outfit-thumb"><img src="${portraitThumbAsset(avatar.id, outfit.id)}" width="160" height="320" loading="lazy" decoding="async" alt="${esc(outfit.name)}預覽"></div><div><span>${status}</span><h3>${outfit.name}</h3><p>${outfit.note}</p><div class="outfit-bonuses">${Object.entries(
        outfit.bonuses,
      )
        .map(([name, value]) => `<b>${name}<em>＋${value}</em></b>`)
        .join(
          "",
        )}</div></div><button data-outfit="${outfit.id}" ${wearing || locked ? "disabled" : ""}>${label}</button></article>`;
    },
  ).join(
    "",
  )}</div><section class="surgery-panel"><header><span>PLASTIC SURGERY</span><h2>整形手術・變性</h2><p>要先去地圖上的星望整形外科看過診，本週才能在這裡辦理變性；手術費用高昂，變性後會自動換上對應性別的立繪。</p></header>${canSurgery ? "" : '<div class="wardrobe-hint">本週還沒去過星望整形外科，暫時無法辦理變性手術。</div>'}<div class="surgery-options">${[
    "女性",
    "男性",
  ]
    .filter((g) => g !== state.gender)
    .map(
      (g) =>
        `<button data-change-gender="${g}" ${canSurgery && state.money >= GENDER_CHANGE_COST ? "" : "disabled"}>變性為${g}・${money(GENDER_CHANGE_COST)}</button>`,
    )
    .join("")}</div></section></section></div>`;
}
