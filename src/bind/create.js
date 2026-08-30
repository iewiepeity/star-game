import { state } from "../core/state.js";
import { reroll, initializeHiddenStats } from "../core/stats.js";
import { saveState } from "../core/persistence.js";
import { swapImageWhenReady } from "../core/images.js";
import {
  AVATARS,
  portraitAsset,
  isAvatarLocked,
  defaultAvatarForGender,
} from "../data/wardrobe.js";
import { startPrologue } from "../logic/onboarding.js";
import { render } from "../render.js";
import { birthDayLimit, normalizeBirthday } from "../core/birthday.js";
import { playerRealName, syncLegacyPlayerName } from "../core/player-name.js";
function syncIdentityFromDom() {
  const realName =
      document.querySelector("#player-real-name")?.value ?? state.realName,
    stageName =
      document.querySelector("#player-stage-name")?.value ?? state.stageName,
    month =
      Number(document.querySelector("#birth-month")?.value) || state.birthMonth,
    day = Number(document.querySelector("#birth-day")?.value) || state.birthDay;
  state.realName = realName;
  state.stageName = stageName;
  syncLegacyPlayerName(state);
  const birthday = normalizeBirthday(month, day);
  state.birthMonth = birthday.month;
  state.birthDay = birthday.day;
  const custom = document.querySelector("#custom-gender")?.value;
  if (custom !== undefined) {
    state.customGender = custom;
    if (!["女性", "男性", "非二元"].includes(state.gender))
      state.gender = custom || "自訂";
  }
}
export function bindCreateScreen() {
  const realNameInput = document.querySelector("#player-real-name");
  const stageNameInput = document.querySelector("#player-stage-name");
  const syncNames = () => {
    state.realName = realNameInput?.value || "";
    state.stageName = stageNameInput?.value || "";
    syncLegacyPlayerName(state);
    document
      .querySelector("#to-stats")
      ?.classList.toggle("needs-name", !playerRealName(state));
  };
  for (const evt of ["input", "change", "keyup"])
    for (const input of [realNameInput, stageNameInput])
      input?.addEventListener(evt, syncNames);
  document.querySelector("#birth-month")?.addEventListener("input", (e) => {
    state.birthMonth = Math.max(1, Math.min(12, Number(e.target.value) || 1));
    const dayInput = document.querySelector("#birth-day");
    const max = birthDayLimit(state.birthMonth);
    dayInput?.setAttribute("max", String(max));
    if (dayInput && Number(dayInput.value) > max) dayInput.value = String(max);
    state.birthDay = Math.min(state.birthDay, max);
  });
  document.querySelector("#birth-day")?.addEventListener("input", (e) => {
    state.birthDay = Math.max(
      1,
      Math.min(birthDayLimit(state.birthMonth), Number(e.target.value) || 1),
    );
  });
  document.querySelectorAll("[data-gender]").forEach(
    (x) =>
      (x.onclick = () => {
        const g = x.dataset.gender;
        state.gender = g === "自訂" ? state.customGender || "自訂" : g;
        if (isAvatarLocked(AVATARS[state.avatarId], state.gender))
          state.avatarId = defaultAvatarForGender(state.gender).id;
        render();
      }),
  );
  document.querySelectorAll("[data-avatar]").forEach(
    (x) =>
      (x.onclick = async () => {
        const id = x.dataset.avatar;
        if (!AVATARS[id] || isAvatarLocked(AVATARS[id], state.gender)) return;
        state.avatarId = id;
        document.querySelectorAll("[data-avatar]").forEach((button) => {
          const selected = button === x;
          button.classList.toggle("active", selected);
          button.setAttribute("aria-pressed", String(selected));
          button.querySelector("span").textContent = selected
            ? "✓ 已選擇"
            : "選擇";
        });
        saveState(state);
        await swapImageWhenReady(
          document.querySelector(".create-avatar-preview img"),
          portraitAsset(id, "newcomer"),
          () => state.avatarId === id,
        );
      }),
  );
  document.querySelector("#custom-gender")?.addEventListener("input", (e) => {
    state.customGender = e.target.value;
    state.gender = e.target.value || "自訂";
  });
  document.querySelector("#to-stats")?.addEventListener("click", () => {
    syncIdentityFromDom();
    if (!playerRealName(state)) {
      state.notice = "請先輸入本名；藝名可以留空。";
      render();
      return;
    }
    state.notice = "";
    state.createStep = 2;
    render();
  });
  document.querySelector("#back")?.addEventListener("click", () => {
    state.createStep = 1;
    render();
  });
  document.querySelector("#reroll")?.addEventListener("click", reroll);
  document.querySelector("#start")?.addEventListener("click", () => {
    initializeHiddenStats();
    startPrologue(state);
    render();
  });
}
