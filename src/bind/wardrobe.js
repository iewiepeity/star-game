// 事件層：衣櫃的人物切換、購買、穿著與變性。購買服裝需本週已去過服裝店（星光購物商場），
// 變性需本週已去過整形醫院（星望整形外科）；成功後立刻套用，並由 render() 寫入存檔。
import {
  AVATARS,
  OUTFITS,
  portraitAsset,
  isAvatarLocked,
  defaultAvatarForGender,
  GENDER_CHANGE_COST,
} from "../data/wardrobe.js";
import { state, visitedLocationThisWeek } from "../core/state.js";
import { preloadImage } from "../core/images.js";
import { render, renderUi } from "../render.js";
import { rememberDialogTrigger } from "../core/dialog-focus.js";

const shoppingUnlocked = () => visitedLocationThisWeek("shop");
const surgeryUnlocked = () => visitedLocationThisWeek("clinic");
let wardrobeRequest = 0;

async function applyLook(avatarId, outfitId, message) {
  const request = ++wardrobeRequest;
  await preloadImage(portraitAsset(avatarId, outfitId));
  if (request !== wardrobeRequest) return false;
  state.avatarId = avatarId;
  state.outfitId = outfitId;
  state.wardrobeNotice = message;
  render();
  return true;
}

async function buyOutfit(id) {
  const outfit = OUTFITS[id],
    avatarId = state.avatarId,
    owned = state.ownedOutfits[avatarId];
  if (!outfit || owned.includes(id) || state.money < outfit.price) return false;
  const request = ++wardrobeRequest;
  await preloadImage(portraitAsset(avatarId, id));
  if (request !== wardrobeRequest || state.avatarId !== avatarId) return false;
  state.money -= outfit.price;
  owned.push(id);
  state.outfitId = id;
  state.wardrobeNotice = `購買成功，已穿上「${outfit.name}」`;
  state.confirmDialog = null;
  render();
  return true;
}

function changeGender(target) {
  if (!target || target === state.gender || state.money < GENDER_CHANGE_COST)
    return false;
  wardrobeRequest++;
  state.money -= GENDER_CHANGE_COST;
  state.gender = target;
  const avatar = defaultAvatarForGender(target);
  state.avatarId = avatar.id;
  const owned = state.ownedOutfits[avatar.id];
  state.outfitId = owned.includes(state.outfitId) ? state.outfitId : "newcomer";
  state.wardrobeNotice = `變性手術完成，現在的性別是「${target}」`;
  state.confirmDialog = null;
  render();
  return true;
}

export function bindWardrobe() {
  document.querySelectorAll("[data-wardrobe-avatar]").forEach(
    (x) =>
      (x.onclick = () => {
        const id = x.dataset.wardrobeAvatar,
          avatar = AVATARS[id];
        if (!avatar || isAvatarLocked(avatar, state.gender)) return;
        const owned = state.ownedOutfits[id] || ["newcomer"],
          nextOutfit = owned.includes(state.outfitId)
            ? state.outfitId
            : "newcomer";
        x.disabled = true;
        x.setAttribute("aria-busy", "true");
        applyLook(id, nextOutfit, "已切換人物立繪");
      }),
  );
  document.querySelectorAll("[data-outfit]").forEach(
    (x) =>
      (x.onclick = () => {
        const id = x.dataset.outfit,
          outfit = OUTFITS[id];
        if (!outfit) return;
        const owned = state.ownedOutfits[state.avatarId];
        if (!owned.includes(id)) {
          if (!shoppingUnlocked()) {
            state.wardrobeNotice =
              "這件服裝還沒買喔，要先去地圖上的星光購物商場逛過，本週才能在這裡購買。";
            render();
            return;
          }
          if (state.money < outfit.price) {
            state.wardrobeNotice = `金額不足，購買「${outfit.name}」需要 $${outfit.price.toLocaleString("zh-TW")}`;
            render();
            return;
          }
          rememberDialogTrigger(x);
          state.confirmDialog = { type: "buy-outfit", outfitId: id };
          renderUi();
          return;
        }
        x.disabled = true;
        x.setAttribute("aria-busy", "true");
        applyLook(state.avatarId, id, `已穿上「${outfit.name}」`);
      }),
  );
  document.querySelectorAll("[data-change-gender]").forEach(
    (x) =>
      (x.onclick = () => {
        const target = x.dataset.changeGender;
        if (!target || target === state.gender) return;
        if (!surgeryUnlocked()) {
          state.wardrobeNotice =
            "要先去地圖上的星望整形外科看過診，本週才能在這裡辦理變性手術。";
          render();
          return;
        }
        if (state.money < GENDER_CHANGE_COST) {
          state.wardrobeNotice = `金額不足，變性手術需要 $${GENDER_CHANGE_COST.toLocaleString("zh-TW")}`;
          render();
          return;
        }
        rememberDialogTrigger(x);
        state.confirmDialog = { type: "change-gender", targetGender: target };
        renderUi();
      }),
  );
  document
    .querySelector("[data-confirm-accept]")
    ?.addEventListener("click", (event) => {
      const dialog = state.confirmDialog;
      if (dialog?.type === "buy-outfit") {
        event.currentTarget.disabled = true;
        event.currentTarget.textContent = "載入造型中…";
        buyOutfit(dialog.outfitId);
      } else if (dialog?.type === "change-gender")
        changeGender(dialog.targetGender);
    });
}
