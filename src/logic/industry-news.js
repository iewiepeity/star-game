import { titleTag } from "../core/utils.js";
import { state } from "../core/state.js";
import { NPCS } from "../data/npcs.js";
import { INDUSTRY_COLUMNS, INDUSTRY_EVENT_COPY } from "../data/industry-stories.js";
import { weeklyCopy, communityHash } from "./community-rotation.js";

function push(item) {
  state.industryNews ??= [];
  if (state.industryNews.some(n => n.key === item.key)) return false;
  const baseId = `NEWS-${state.week}-${communityHash(item.key).toString(36)}`;
  let id = baseId, suffix = 1;
  while (state.industryNews.some(news => news.id === id)) id = `${baseId}-${suffix++}`;
  state.industryNews.unshift({ ...item, week: state.week, id });
  state.industryNews = state.industryNews.slice(0, 80);
  return true;
}
export function generateIndustryNews({ awards = [], npcUpdates = [] } = {}) {
  const made = [];
  // A dated editorial gives quiet weeks something to read. Zero heat preserves gameplay balance:
  // this is a column about the industry, not an invented success or a popularity boost for the player.
  const column = INDUSTRY_COLUMNS[(Math.max(1, state.week) - 1) % INDUSTRY_COLUMNS.length];
  const editorial = { ...column, key: `column:${state.week}`, category: "圈內", subject: "industry", heat: 0, editorial: true };
  if (push(editorial)) made.push(editorial);
  for (const project of state.creativeProjects || []) {
    if (project.status !== "released" || project.releaseWeek !== state.week) continue;
    const item = {
      key: `creative:${project.id}:${project.releaseWeek}`, category: project.category || "作品", subject: "player",
      title: `${state.name}原創${titleTag(project.title)}正式推出`,
      body: `市場評分 ${project.marketScore}。${weeklyCopy(INDUSTRY_EVENT_COPY.release, project.id)}`,
      heat: Math.max(40, project.marketScore * 5 + state.fame),
    };
    if (push(item)) made.push(item);
  }
  for (const award of awards) {
    const work = state.completedWorks.find(item => item.id === award.workId);
    const item = {
      key: `award:${award.id}`, category: "獎項", subject: "player",
      title: `${titleTag(work?.title || "作品")}${award.result === "入圍" ? "入圍" : "拿下"}${award.name}`,
      body: `${state.name}的作品在本年度獎季獲得${award.result}肯定。${weeklyCopy(INDUSTRY_EVENT_COPY.award, award.id)}`,
      heat: 180 + state.fame * 3,
    };
    if (push(item)) made.push(item);
  }
  for (const update of npcUpdates.slice(0, 4)) {
    const npc = Object.values(NPCS).find(person => update.includes(person.name));
    const item = {
      key: `npc:${state.week}:${update}`, category: "圈內", subject: npc?.id || "industry",
      title: update,
      body: weeklyCopy(INDUSTRY_EVENT_COPY.npc, update),
      heat: 70 + (npc ? state.npcCareers?.[npc.id]?.fame || 0 : 20),
    };
    if (push(item)) made.push(item);
  }
  const completed = (state.completedWorks || []).filter(work => work.completedWeek === state.week && !work.original);
  for (const work of completed) {
    const item = {
      key: `work:${work.id}`, category: work.category, subject: "player",
      title: `${state.name}完成${titleTag(work.title)}`,
      body: `作品品質 ${work.quality}。${work.npcCast?.length ? "這次由共演陣容一起參與完成。" : ""}${weeklyCopy(INDUSTRY_EVENT_COPY.work, work.id)}`,
      heat: 50 + work.quality * 3 + state.fame,
    };
    if (push(item)) made.push(item);
  }
  return made;
}
export function recentIndustryNews(limit = 12) {
  return (state.industryNews || []).slice(0, limit);
}
