import { ACTIONS } from "../data/actions.js";
import { MAP_LOCATIONS } from "../data/map-locations.js";
export const TRAINING_VENUES = {
  vocal: "recording",
  acting: "rehearsal",
  dance: "dance",
  speech: "radio",
  creation: "library",
  songwriting: "recording",
  script: "library",
  image: "beauty",
  networking: "business",
};
export const ASPIRATIONS = {
  acting: { label: "演員", venue: "rehearsal", action: "acting" },
  vocal: { label: "歌手", venue: "recording", action: "vocal" },
  speech: { label: "主持人", venue: "radio", action: "speech" },
  creation: { label: "創作者", venue: "library", action: "creation" },
};
export function hasVisited(game, id) {
  return Object.entries(game.visitedLocationsByWeek || {}).some(
    ([week, locations]) =>
      Number(week) <= game.week &&
      Array.isArray(locations) &&
      locations.includes(id),
  );
}
export function trainingAccess(game, id) {
  const venue = TRAINING_VENUES[id];
  return {
    unlocked: !venue || hasVisited(game, venue),
    venue,
    message: venue
      ? `先完成一次「${MAP_LOCATIONS[venue].name}」自由活動，之後即可報名${ACTIONS[id].label}。`
      : "",
  };
}
export function coursesAt(venue) {
  return Object.keys(TRAINING_VENUES).filter(
    (id) => TRAINING_VENUES[id] === venue,
  );
}
export function agencyContactsUnlocked(game) {
  return (
    hasVisited(game, "business") ||
    Boolean(
      game.currentAgencyId ||
      game.agencyOffer ||
      Object.keys(game.agencyApplications || {}).length ||
      game.agencyHistory?.length,
    )
  );
}
export function newcomerStep(game) {
  const aspiration = ASPIRATIONS[game.aspiration] || ASPIRATIONS.acting;
  if (
    game.currentAgencyId ||
    game.completedWorks?.length ||
    Object.keys(game.activeJobs || {}).length ||
    (game.trainingSessionsCompleted || 0) > 0
  )
    return null;
  const venue = MAP_LOCATIONS[aspiration.venue];
  if (!hasVisited(game, aspiration.venue)) {
    const planned = game.schedule?.findIndex(
      (id, day) =>
        id === "free" && game.freeLocations?.[day] === aspiration.venue,
    );
    return {
      stage: "arrival",
      label: planned >= 0 ? "第一站已排好，準備出門" : `先認識${venue.name}`,
      text:
        planned >= 0
          ? "先確認其餘日子的生活與預算，再開始這週。實際到訪後，相關課程才會開放。"
          : `你想先試試${aspiration.label}這條路。到現場了解環境和報名方式，比一口氣填滿課表更實際。`,
      app: planned >= 0 ? "planner" : "map",
      location: aspiration.venue,
      action: planned >= 0 ? "確認行程並開始這週" : "在地圖找到第一站",
    };
  }
  return {
    stage: "first-training",
    label: "已認識教室，試上一堂課",
    text: `${ACTIONS[aspiration.action].label}已開放。安排一堂課、一天新人零工，再留時間休息；有作品與準備度後再考慮經紀公司。`,
    app: "planner",
    action: "安排第一堂課",
  };
}
