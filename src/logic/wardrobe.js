import { AVATARS, OUTFITS, isAvatarLocked } from "../data/wardrobe.js";

export const LOOK_SLOTS = {
  daily: "日常出門",
  work: "試鏡工作",
  stage: "舞台典禮",
};
export function ownsOutfit(game, avatarId, outfitId) {
  return Boolean(
    OUTFITS[outfitId] &&
    (game.ownedOutfits?.[avatarId] || []).includes(outfitId),
  );
}
export function purchaseProblem(game, avatarId, outfitId) {
  if (!AVATARS[avatarId] || !OUTFITS[outfitId]) return "找不到這套造型。";
  if (
    game.avatarId !== avatarId ||
    isAvatarLocked(AVATARS[avatarId], game.gender)
  )
    return "人物已切換，請重新選擇造型。";
  if (ownsOutfit(game, avatarId, outfitId)) return "你已經擁有這套服裝。";
  if (!game.visitedLocationsByWeek?.[game.week]?.includes("shop"))
    return "本週需先前往星光購物商場，才能購買新服裝。";
  if (game.money < OUTFITS[outfitId].price) return "金額不足，這次沒有扣款。";
  return "";
}
export function purchaseOutfit(game, avatarId, outfitId) {
  const problem = purchaseProblem(game, avatarId, outfitId);
  if (problem) return { ok: false, message: problem };
  game.money -= OUTFITS[outfitId].price;
  game.ownedOutfits[avatarId] = [
    ...(game.ownedOutfits[avatarId] || []),
    outfitId,
  ];
  game.outfitId = outfitId;
  return { ok: true, message: `購買成功，已穿上「${OUTFITS[outfitId].name}」` };
}
export function bonusComparison(game, outfitId) {
  const next = OUTFITS[outfitId]?.bonuses || {},
    current = OUTFITS[game.outfitId]?.bonuses || {};
  return [...new Set([...Object.keys(current), ...Object.keys(next)])].map(
    (name) => {
      const base = game.stats?.[name] || 0;
      const before = Math.min(1000, base + (current[name] || 0));
      const after = Math.min(1000, base + (next[name] || 0));
      return { name, before, after, delta: after - before };
    },
  );
}
export function normalizeSavedLooks(game, raw) {
  return Object.fromEntries(
    Object.keys(AVATARS).map((avatarId) => [
      avatarId,
      Object.fromEntries(
        Object.keys(LOOK_SLOTS)
          .filter((slot) => ownsOutfit(game, avatarId, raw?.[avatarId]?.[slot]))
          .map((slot) => [slot, raw[avatarId][slot]]),
      ),
    ]),
  );
}
export function saveLook(game, slot) {
  if (!LOOK_SLOTS[slot] || !ownsOutfit(game, game.avatarId, game.outfitId))
    return false;
  game.savedLooks = normalizeSavedLooks(game, game.savedLooks);
  game.savedLooks[game.avatarId][slot] = game.outfitId;
  return true;
}
