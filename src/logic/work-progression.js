import { COMPANY_PART_TIME } from "../data/part-time.js";
import { INDUSTRY_LIST } from "../data/industry.js";
import { MAP_LOCATIONS } from "../data/map-locations.js";
import { hasVisited } from "./city-progression.js";
export function workAccess(game, id) {
  const venue = COMPANY_PART_TIME[id]?.venue || ({ audition: "tv_company", street: "park" })[id];
  return {
    unlocked: !venue || hasVisited(game, venue), venue,
    message: venue ? `先實際到訪${MAP_LOCATIONS[venue].name}，了解${id === "audition" ? "新人徵選報名" : id === "street" ? "街頭演出場地規則" : "臨時人員登記與工作內容"}，之後即可從行程表安排。` : "",
  };
}
export function workAt(venue) {
  return Object.entries(COMPANY_PART_TIME).filter(([, job]) => job.venue === venue);
}
export function companyShifts(game, companyId) {
  return Object.entries(COMPANY_PART_TIME).reduce((sum, [id, job]) => sum + (job.companyId === companyId ? Number(game.partTimeShifts?.[id]) || 0 : 0), 0);
}
export function jobExperienceTier(game, job) {
  const company = INDUSTRY_LIST.find(c => c.categories.includes(job.category));
  return Math.min(5, Math.max(1 + Math.floor((game.completedWorks?.length || 0) / 4), company && companyShifts(game, company.id) >= 3 ? 2 : 1));
}
export function recordPartTimeShift(game, id) {
  const shift = COMPANY_PART_TIME[id];
  if (!shift) return "";
  game.partTimeShifts ??= {};
  game.partTimeShifts[id] = (game.partTimeShifts[id] || 0) + 1;
  const count = companyShifts(game, shift.companyId);
  return count === 3
    ? "你已完成這裡的三次打工。窗口記住了你的配合度，往後可在工作信箱收到這間公司的公開徵選資訊，並接觸兩星機會；試鏡仍須達到角色資格。"
    : `已累積 ${count} 次這間公司的打工經驗。${count < 3 ? "完成三次後，窗口會持續提供徵選資訊。" : "窗口會繼續把適合你目前經驗的徵選資訊留給你。"}`;
}
