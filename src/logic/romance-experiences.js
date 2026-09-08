import { normalizeCharacterMemories } from "../core/character-memory-state.js";
export const BOND_LABELS = Object.freeze({
  care: "接住彼此的低潮",
  private: "分享工作以外的自己",
  work: "一起面對工作",
  reliability: "把約定放進生活",
});
export function romanceExperienceStatus(npcId, next, game) {
  const required = { committed: 1, engaged: 2, married: 2 }[next] || 0;
  const memory = normalizeCharacterMemories(game.characterMemories)[npcId];
  const bonds = memory?.bonds || [];
  const labels = bonds.map((id) => BOND_LABELS[id]);
  return {
    ready: bonds.length >= required,
    labels,
    message:
      required && bonds.length < required
        ? "除了心意與時間，也想多留下一些共同經歷。可以安排關心支持、深入談心、工作交流或合作，也可以完成先前的約定；不必選唯一的相處方式。"
        : labels.length
          ? `一起走過：${labels.join("、")}。`
          : "一起相處的故事，會慢慢留下來。",
  };
}
