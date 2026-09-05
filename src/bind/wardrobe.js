import {
  purchaseOutfit,
  ownsOutfit,
  saveLook,
  LOOK_SLOTS,
} from "../logic/wardrobe.js";
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
  const game = state;
  const request = ++wardrobeRequest;
  const loaded = await preloadImage(portraitAsset(avatarId, outfitId));
  if (request !== wardrobeRequest || state !== game) return false;
  if (!loaded) {
    document
      .querySelectorAll('.dressing-room [aria-busy="true"]')
      .forEach((button) => {
        button.disabled = false;
        button.removeAttribute("aria-busy");
      });
    state.wardrobeNotice =
      "造型圖片載入失敗，請確認連線後重試；目前穿著已保留。";
    renderUi();
    return false;
  }
  if (
    state.appOpen !== "wardrobe" ||
    !ownsOutfit(state, avatarId, outfitId) ||
    isAvatarLocked(AVATARS[avatarId], state.gender)
  )
    return false;
  state.avatarId = avatarId;
  state.outfitId = outfitId;
  state.wardrobePreview = null;
  state.wardrobeNotice = message;
  render();
  return true;
}

async function buyOutfit(dialog) {
  const game = state;
  const request = ++wardrobeRequest;
  const loaded = await preloadImage(
    portraitAsset(dialog.avatarId, dialog.outfitId),
  );
  if (
    request !== wardrobeRequest ||
    state !== game ||
    state.confirmDialog !== dialog ||
    state.appOpen !== "wardrobe"
  )
    return false;
  if (!loaded) {
    state.wardrobeNotice = "造型圖片載入失敗，沒有扣款；請確認連線後重試。";
    state.confirmDialog = null;
    renderUi();
    return false;
  }
  const result = purchaseOutfit(state, dialog.avatarId, dialog.outfitId);
  state.wardrobeNotice = result.message;
  if (result.ok) state.wardrobePreview = null;
  state.confirmDialog = null;
  render();
  return result.ok;
}

function changeGender(target) {
  if (!target || target === state.gender || state.money < GENDER_CHANGE_COST)
    return false;
  wardrobeRequest++;
  state.money -= GENDER_CHANGE_COST;
  state.wardrobePreview = null;
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
  document.querySelectorAll("[data-preview-outfit]").forEach((button) => {
    button.onclick = async () => {
      const id = button.dataset.previewOutfit,
        avatar = state.avatarId,
        game = state;
      if (!OUTFITS[id]) return;
      const request = ++wardrobeRequest;
      button.disabled = true;
      button.setAttribute("aria-busy", "true");
      const loaded = await preloadImage(portraitAsset(avatar, id));
      if (
        state !== game ||
        request !== wardrobeRequest ||
        state.avatarId !== avatar ||
        state.appOpen !== "wardrobe"
      )
        return;
      button.disabled = false;
      button.removeAttribute("aria-busy");
      if (!loaded) {
        state.wardrobeNotice = "試穿圖片載入失敗，請確認連線後重試。";
        renderUi();
        return;
      }
      state.wardrobePreview = id;
      state.wardrobeNotice = "";
      renderUi();
    };
  });
  document
    .querySelector("[data-cancel-fitting]")
    ?.addEventListener("click", () => {
      wardrobeRequest++;
      state.wardrobePreview = null;
      state.wardrobeNotice = "已還原目前穿著，沒有扣款。";
      renderUi();
    });
  document.querySelectorAll("[data-wardrobe-filter]").forEach(
    (button) =>
      (button.onclick = () => {
        state.wardrobeFilter = button.dataset.wardrobeFilter;
        renderUi();
      }),
  );
  document
    .querySelector("[data-wardrobe-category]")
    ?.addEventListener("change", (event) => {
      state.wardrobeCategory = event.target.value;
      renderUi();
    });
  document.querySelectorAll("[data-save-look]").forEach(
    (button) =>
      (button.onclick = () => {
        if (saveLook(state, button.dataset.saveLook)) {
          state.wardrobeNotice = `已將目前穿著存入「${LOOK_SLOTS[button.dataset.saveLook]}」。`;
          render();
        }
      }),
  );
  document.querySelectorAll("[data-wear-look]").forEach(
    (button) =>
      (button.onclick = () => {
        const id =
          state.savedLooks?.[state.avatarId]?.[button.dataset.wearLook];
        if (ownsOutfit(state, state.avatarId, id))
          applyLook(state.avatarId, id, `已穿上「${OUTFITS[id].name}」`);
      }),
  );
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
          state.confirmDialog = {
            type: "buy-outfit",
            outfitId: id,
            avatarId: state.avatarId,
          };
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
        buyOutfit(dialog);
      } else if (dialog?.type === "change-gender")
        changeGender(dialog.targetGender);
    });
}
