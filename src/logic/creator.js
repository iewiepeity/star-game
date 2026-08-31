import { state } from "../core/state.js";
import { effectiveStat } from "../core/utils.js";
import { randomInt, chance } from "../core/rng.js";
import { CREATOR_FORMATS, CREATOR_TOPICS, CREATOR_INVESTMENTS, CREATOR_RARITIES } from "../data/creator-content.js";

export const creatorUnlocked = () => (state.runCount || 1) >= 2;

export function ensureCreatorProfile() {
  if (!creatorUnlocked()) return null;
  state.creatorProfile ??= { followers: 24, loyalty: 20, reputation: 50, totalViews: 0, totalRevenue: 0, level: 1, startedWeek: state.week };
  state.creatorVideos ??= [];
  return state.creatorProfile;
}

export function qualityGrade(score) {
  if (score >= 92) return { id: "S", label: "神作", stars: 5 };
  if (score >= 82) return { id: "A", label: "傑出", stars: 4 };
  if (score >= 68) return { id: "B", label: "優良", stars: 3 };
  if (score >= 52) return { id: "C", label: "尚可", stars: 2 };
  return { id: "D", label: "粗糙", stars: 1 };
}

export function rarityFor(score, viral = false) {
  const rarityScore = Math.min(100, score + (viral ? 12 : 0));
  return CREATOR_RARITIES.find((rarity) => rarityScore >= rarity.min);
}

export function resolveCreatorContent(payload = {}) {
  const profile = ensureCreatorProfile();
  if (!profile) return { ok: false, text: "創作者中心要在完成第一輪人生後才會解鎖。" };
  const format = CREATOR_FORMATS[payload.format], topic = CREATOR_TOPICS[payload.topic], investment = CREATOR_INVESTMENTS[payload.investment];
  if (!format || !topic || !investment) return { ok: false, text: "這份拍攝企劃已失效。" };
  const skill = format.stats.reduce((sum, name) => sum + effectiveStat(name), 0) / format.stats.length;
  const quality = Math.max(20, Math.min(100, Math.round(34 + skill / 14 + format.quality + investment.quality + randomInt(-12, 13))));
  const viral = chance(Math.min(24, 2 + quality / 7 + (topic.heat || 0) + (state.rep.話題度 || 0) / 80));
  const grade = qualityGrade(quality), rarity = rarityFor(quality, viral);
  const followerBase = Math.max(profile.followers, state.fans / 5, 24);
  const views = Math.max(30, Math.round(format.baseViews + followerBase * (0.7 + quality / 100) + quality * randomInt(3, 10) * (viral ? randomInt(7, 15) : 1)));
  const followers = Math.max(1, Math.round(views * (0.012 + quality / 6500) * (viral ? 1.5 : 1)));
  const revenue = profile.level >= 2 ? Math.round(views * (format === CREATOR_FORMATS.live ? 0.34 : 0.08)) : Math.round(views * 0.025);
  const titles = topic.titles, title = titles[(state.week + state.creatorVideos.length) % titles.length];
  const video = { id: `creator-${state.runCount}-${state.week}-${state.creatorVideos.length + 1}`, title, week: state.week, format: payload.format, formatLabel: format.label, topic: payload.topic, topicLabel: topic.label, investment: payload.investment, quality, grade: grade.id, gradeLabel: grade.label, stars: grade.stars, rarity: rarity.id, rarityLabel: rarity.label, views, followers, revenue, viral, longTailViews: 0 };
  state.creatorVideos.unshift(video);
  profile.followers += followers; profile.totalViews += views; profile.totalRevenue += revenue; profile.loyalty = Math.min(100, profile.loyalty + Math.max(1, Math.round((quality - 45) / 18))); profile.reputation = Math.max(0, Math.min(100, profile.reputation + Math.round((quality - 55) / 15))); profile.level = profile.followers >= 100000 ? 5 : profile.followers >= 20000 ? 4 : profile.followers >= 3000 ? 3 : profile.followers >= 500 ? 2 : 1;
  state.money += revenue; state.fans += Math.max(1, Math.round(followers * 0.35)); state.fame += viral ? Math.max(1, Math.round(Math.log10(views))) : quality >= 82 ? 1 : 0;
  state.rep.話題度 = Math.min(1000, (state.rep.話題度 || 0) + (viral ? 12 : 2));
  state.rep.可信度 = Math.min(1000, (state.rep.可信度 || 0) + (topic.trust || 0));
  if (topic.industry) state.rep.業界評價 = Math.min(1000, (state.rep.業界評價 || 0) + topic.industry);
  if (topic.fashion) state.rep.時尚影響力 = Math.min(1000, (state.rep.時尚影響力 || 0) + topic.fashion);
  if (topic.risk && quality < 55) state.rep.爭議度 = Math.min(1000, (state.rep.爭議度 || 0) + topic.risk);
  state.flags.push({ week: state.week, label: `自媒體發布：${title}`, note: `${rarity.label}・${grade.id} 級品質 ${quality}，${views.toLocaleString()} 次觀看。` });
  return { ok: true, video, text: `《${title}》發布！品質 ${quality}（${grade.id}・${grade.label}）、稀有度「${rarity.label}」，觀看 ${views.toLocaleString()}、追蹤＋${followers.toLocaleString()}、收益＋$${revenue.toLocaleString()}${viral ? "。影片爆紅了！" : "。"}` };
}
