import {
  HOME_ITEMS,
  HOME_RECIPES,
  HOME_SLOTS,
  HOME_VISIT_ACTIVITIES,
  MATERIAL_LABELS,
} from "../data/home-life.js";
import { NPCS } from "../data/npcs.js";

const record = (value) =>
  value && typeof value === "object" && !Array.isArray(value) ? value : {};
const list = (value) => (Array.isArray(value) ? value : []);
const text = (value, max = 200) =>
  typeof value === "string" ? value.replace(/[<>]/g, "").slice(0, max) : "";
const number = (value, min, max, fallback = min) =>
  Number.isFinite(value)
    ? Math.max(min, Math.min(max, Math.floor(value)))
    : fallback;
const known = (catalog, id) =>
  typeof id === "string" && Object.hasOwn(catalog, id);
const unique = (items) => [
  ...new Map(items.map((item) => [item.id, item])).values(),
];
export const homeVisitScheduleKey = (week, day) => `pixel-home:${week}:${day}`;

export function initialHomeLife() {
  const starter = Object.entries(HOME_ITEMS).filter(([, item]) => item.starter);
  return {
    ownedFurniture: starter.map(([id]) => id),
    placedFurniture: Object.fromEntries(
      starter.map(([id, item]) => [item.slot, id]),
    ),
    materials: {},
    craftedItems: [],
    keepsakes: [],
    displayedKeepsakeId: null,
    keys: {},
    visits: [],
    gifts: [],
    giftWeeks: {},
    notice: "",
  };
}

// Save repair is a pure data operation: it must not import the live core state.
export function normalizeHomeLife(raw) {
  const next = initialHomeLife(),
    source = record(raw);
  next.ownedFurniture = [
    ...new Set([
      ...next.ownedFurniture,
      ...list(source.ownedFurniture).filter((id) => known(HOME_ITEMS, id)),
    ]),
  ];
  for (const slot of Object.keys(HOME_SLOTS)) {
    const id = record(source.placedFurniture)[slot];
    if (next.ownedFurniture.includes(id) && HOME_ITEMS[id].slot === slot)
      next.placedFurniture[slot] = id;
  }
  for (const [id, value] of Object.entries(record(source.materials)))
    if (known(MATERIAL_LABELS, id)) next.materials[id] = number(value, 0, 999);
  next.craftedItems = unique(
    list(source.craftedItems)
      .filter(
        (item) => item && known(HOME_RECIPES, item.recipeId) && text(item.id),
      )
      .map((item) => ({
        id: text(item.id, 100),
        recipeId: item.recipeId,
        name: HOME_RECIPES[item.recipeId].name,
        quality: number(item.quality, 1, 5),
        madeWeek: number(item.madeWeek, 1, 260),
        status: ["kept", "used", "gifted"].includes(item.status)
          ? item.status
          : "kept",
        ...(known(NPCS, item.giftedTo)
          ? {
              giftedTo: item.giftedTo,
              giftedWeek: number(item.giftedWeek, 1, 260),
            }
          : {}),
      })),
  );
  next.craftedItems = [
    ...next.craftedItems.filter((item) => item.status === "kept").slice(-100),
    ...next.craftedItems.filter((item) => item.status !== "kept").slice(-20),
  ];
  next.keepsakes = unique(
    list(source.keepsakes)
      .filter((item) => item && text(item.id) && text(item.name))
      .map((item) => ({
        id: text(item.id, 160),
        name: text(item.name, 100),
        kind: text(item.kind, 20),
        source: text(item.source),
        icon: ["▤", "♛", "✦"].includes(item.icon) ? item.icon : "✦",
        ...(known(NPCS, item.npcId) ? { npcId: item.npcId } : {}),
      })),
  ).slice(-240);
  next.displayedKeepsakeId = next.keepsakes.some(
    (item) => item.id === source.displayedKeepsakeId,
  )
    ? source.displayedKeepsakeId
    : null;
  for (const [id, value] of Object.entries(record(source.keys)))
    if (known(NPCS, id)) {
      const item = record(value);
      next.keys[id] = {
        granted: item.granted === true,
        week: number(item.week, 1, 260),
        invalidated: item.invalidated === true,
      };
    }
  next.visits = list(source.visits)
    .filter(
      (item) =>
        item &&
        known(NPCS, item.npcId) &&
        known(HOME_VISIT_ACTIVITIES, item.activityId),
    )
    .map((item) => ({
      id: text(item.id, 120),
      week: number(item.week, 1, 260),
      npcId: item.npcId,
      activityId: item.activityId,
      displayedKeepsakeId: text(item.displayedKeepsakeId, 160) || null,
    }))
    .slice(-120);
  next.gifts = list(source.gifts)
    .filter(
      (item) =>
        item && known(NPCS, item.npcId) && known(HOME_RECIPES, item.recipeId),
    )
    .map((item) => ({
      week: number(item.week, 1, 260),
      npcId: item.npcId,
      recipeId: item.recipeId,
      quality: number(item.quality, 1, 5),
      liked: item.liked === true,
      repeated: item.repeated === true,
      text: text(item.text, 500),
    }))
    .slice(-160);
  for (const [key, value] of Object.entries(record(source.giftWeeks))) {
    const [id, week] = key.split(":");
    if (
      known(NPCS, id) &&
      /^\d+$/.test(week) &&
      +week >= 1 &&
      +week <= 260 &&
      value === true
    )
      next.giftWeeks[key] = true;
  }
  next.notice = text(source.notice);
  return next;
}

export function homeKeyEligible(npcId, game) {
  const rel = game.relationships?.[npcId] || {};
  return (
    known(NPCS, npcId) &&
    game.knownPeople?.includes(npcId) &&
    (rel.closeness || 0) >= 65 &&
    (rel.trust || 0) >= 55 &&
    (rel.hostility || 0) < 45 &&
    rel.romance !== "broken"
  );
}

export function invalidateHomeKeys(game) {
  for (const [id, key] of Object.entries(game.homeLife?.keys || {}))
    if (key.granted && !homeKeyEligible(id, game)) key.invalidated = true;
}
