import { AVATARS, GENDER_CHANGE_COST } from "../data/wardrobe.js";
export { GENDER_CHANGE_COST };
export const GENDERS = ["女性", "男性"];
export const avatarsForGender = (gender) =>
  Object.values(AVATARS).filter((a) => a.gender === gender);

export function normalizeIdentity(state, raw) {
  // v0.5 had no identity lock. Preserve the avatar actually worn in that save.
  const gender = GENDERS.includes(raw?.identity?.gender)
    ? raw.identity.gender
    : AVATARS[state.avatarId].gender;
  state.identity = {
    gender,
    locked: !!(
      raw?.identity?.locked ||
      state.flags.intro ||
      state.life.day ||
      state.life.game.week > 1 ||
      state.life.ledger.length
    ),
    changes: (Array.isArray(raw?.identity?.changes)
      ? raw.identity.changes
      : []
    ).filter(
      (c) =>
        GENDERS.includes(c.from) &&
        GENDERS.includes(c.to) &&
        Number.isInteger(c.week),
    ),
  };
  if (AVATARS[state.avatarId].gender !== gender) {
    state.avatarId = avatarsForGender(gender)[0].id;
    if (!state.life.game.ownedOutfits[state.avatarId].includes(state.outfitId))
      state.outfitId = "newcomer";
  }
  state.life.game.avatarId = state.avatarId;
  state.life.game.gender = gender;
  state.life.game.outfitId = state.outfitId;
}
export function lockIdentity(state) {
  state.identity.locked = true;
  state.flags.intro = true;
}
function wearAvatar(state, id) {
  state.avatarId = id;
  state.life.game.avatarId = id;
  state.outfitId = state.life.game.ownedOutfits[id].includes(state.outfitId)
    ? state.outfitId
    : "newcomer";
  state.life.game.outfitId = state.outfitId;
}
export function selectAvatar(state, id) {
  const avatar = AVATARS[id];
  if (!avatar) return "找不到這個外型";
  if (state.identity.locked && avatar.gender !== state.identity.gender)
    return "性別已在開局決定；如需變更，請前往星望整形外科。";
  state.identity.gender = avatar.gender;
  state.life.game.gender = avatar.gender;
  wearAvatar(state, id);
  return "";
}
export function genderChangeReason(state, avatarId) {
  const target = AVATARS[avatarId];
  if (!target || target.gender === state.identity.gender)
    return "請選擇另一個性別的外型";
  if (!state.identity.locked) return "開局時可直接選擇性別";
  if (state.sceneId !== "clinic") return "請到星望整形外科辦理";
  if (state.life.game.endingResult) return "這段旅程已完成";
  if (state.life.pending && state.life.pending.phase !== "result")
    return "請先完成或取消正在進行的行動";
  if (state.life.game.money < GENDER_CHANGE_COST)
    return `需要 $${GENDER_CHANGE_COST.toLocaleString()}，目前金額不足`;
  return "";
}
export function changeGenderAtClinic(state, avatarId) {
  const reason = genderChangeReason(state, avatarId);
  if (reason) return { ok: false, reason };
  const from = state.identity.gender,
    to = AVATARS[avatarId].gender;
  state.life.game.money -= GENDER_CHANGE_COST;
  state.identity.changes.push({
    from,
    to,
    week: state.life.game.week,
    day: state.life.day,
    cost: GENDER_CHANGE_COST,
  });
  state.identity.gender = to;
  state.life.game.gender = to;
  wearAvatar(state, avatarId);
  return { ok: true, from, to };
}
