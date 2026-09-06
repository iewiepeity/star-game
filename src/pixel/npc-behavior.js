import { buildGrid, findPath, nearest, walkable } from "./navigation.js";
import { facingToward } from "./actor-motion.js";
const PREFERENCES = {
  sufei: ["books", "equipment", "plant"],
  jiqing: ["drink", "books", "phone"],
  shenyao: ["art", "books", "computer"],
  tangtang: ["speaker", "equipment", "drink"],
  guchengxi: ["books", "art", "window"],
  linxiafan: ["clothes", "art", "plant"],
  lujingran: ["speaker", "equipment", "books"],
  xiayutong: ["computer", "phone", "books"],
  hanzhiyuan: ["books", "computer", "phone"],
  chengyian: ["art", "window", "equipment"],
  silver_pc: ["art", "computer", "books"],
};
export const BEHAVIOR_KINDS = {
  service: { pose: "read", verb: "核對", duration: 8 },
  books: { pose: "read", verb: "翻閱", duration: 8 },
  art: { pose: "look", verb: "欣賞", duration: 6 },
  plant: { pose: "water", verb: "照料", duration: 5 },
  drink: { pose: "drink", verb: "喝點水，看看", duration: 6 },
  computer: { pose: "type", verb: "查看", duration: 7 },
  phone: { pose: "phone", verb: "查看", duration: 5 },
  speaker: { pose: "listen", verb: "聆聽", duration: 7 },
  equipment: { pose: "check", verb: "檢查", duration: 6 },
  clothes: { pose: "look", verb: "端詳", duration: 6 },
  window: { pose: "look", verb: "眺望", duration: 5 },
  stationery: { pose: "read", verb: "整理", duration: 5 },
  mark: { pose: "stretch", verb: "在定位點暖身", duration: 7 },
};
export const hash = (text) =>
  [...text].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7);
export function initialBehavior() {
  return {
    phase: "idle",
    remaining: 1,
    objectId: null,
    cycle: 0,
    recent: [],
    completed: 0,
  };
}
export function normalizeBehaviors(raw, rooms, people) {
  const result = {};
  if (!raw || typeof raw !== "object") return result;
  for (const id of Object.keys(people)) {
    const value = raw[id];
    if (!value || !rooms[value.sceneId]) continue;
    const valid = rooms[value.sceneId].objects.filter(
      (o) => BEHAVIOR_KINDS[o.kind],
    );
    const object = valid.find((o) => o.id === value.objectId);
    result[id] = {
      ...initialBehavior(),
      sceneId: value.sceneId,
      phase:
        object && ["walking", "using"].includes(value.phase)
          ? value.phase
          : "idle",
      objectId: object?.id || null,
      remaining: Number.isFinite(value.remaining)
        ? Math.max(0, Math.min(12, value.remaining))
        : 1,
      cycle: Number.isSafeInteger(value.cycle)
        ? Math.max(0, Math.min(1000000, value.cycle))
        : 0,
      completed: Number.isSafeInteger(value.completed)
        ? Math.max(0, Math.min(1000000, value.completed))
        : 0,
      recent: Array.isArray(value.recent)
        ? value.recent.filter((x) => valid.some((o) => o.id === x)).slice(-3)
        : [],
    };
  }
  return result;
}
export function objectApproaches(room, grid = buildGrid(room)) {
  const nodes = new Map();
  for (const item of room.objects) {
    if (!BEHAVIOR_KINDS[item.kind]) continue;
    if (item.kind === "service") {
      if (
        ["services", "career", "notice", "script", "desk"].includes(item.action)
      ) {
        const target = nearest(grid, item.target);
        if (target) nodes.set(item.id, [target]);
      }
      continue;
    }
    // Feet approach the bottom edge of the object, never its illustration center.
    const bottom = Math.max(...item.hit.map((p) => p.y));
    const focus = { x: item.x, y: bottom + 10 };
    const choices = [...grid.nodes]
      .sort(
        (a, b) =>
          Math.hypot(a.x - focus.x, a.y - focus.y) -
          Math.hypot(b.x - focus.x, b.y - focus.y),
      )
      .slice(0, 12);
    const max = ["art", "window"].includes(item.kind) ? 145 : 85;
    const useful = choices.filter(
      (p) =>
        Math.hypot(p.x - focus.x, p.y - focus.y) < max &&
        Math.hypot(p.x - room.entry.x, p.y - room.entry.y) > 28,
    );
    if (useful.length) nodes.set(item.id, useful);
  }
  return nodes;
}
export function chooseInteraction({
  actor,
  room,
  grid,
  approaches,
  occupied = [],
  reserved = new Set(),
  behavior,
}) {
  const preferred = PREFERENCES[actor.id] || ["books", "art", "plant"];
  const candidates = room.objects
    .filter(
      (o) =>
        approaches.has(o.id) &&
        !reserved.has(o.id) &&
        (!actor.busy || o.kind === "service"),
    )
    .map((item) => {
      const rank = preferred.indexOf(item.kind);
      const proximity = Math.min(
        ...approaches
          .get(item.id)
          .map((p) => Math.hypot(p.x - actor.x, p.y - actor.y)),
      );
      return {
        item,
        score:
          (rank < 0 ? 0 : 5 - rank) +
          (hash(`${actor.id}:${behavior.cycle}:${item.id}`) % 101) / 35 -
          proximity / 120 -
          (behavior.recent.includes(item.id) ? 7 : 0),
      };
    })
    .sort((a, b) => b.score - a.score);
  for (const { item } of candidates.slice(0, 10)) {
    for (const target of approaches.get(item.id)) {
      if (occupied.some((p) => Math.hypot(p.x - target.x, p.y - target.y) < 23))
        continue;
      const path = findPath(grid, actor, target),
        end = path.at(-1) || actor;
      if (Math.hypot(end.x - target.x, end.y - target.y) > 3) continue;
      if (
        !path.length &&
        Math.hypot(actor.x - target.x, actor.y - target.y) > 3
      )
        continue;
      return {
        item,
        target,
        path,
        pose: BEHAVIOR_KINDS[item.kind].pose,
        duration: BEHAVIOR_KINDS[item.kind].duration + (hash(actor.id) % 3),
        facing: facingToward(target, item),
      };
    }
  }
  return null;
}
export function freePoint(grid, point, occupied = [], distance = 20) {
  return (
    [...grid.nodes]
      .sort(
        (a, b) =>
          Math.hypot(a.x - point.x, a.y - point.y) -
          Math.hypot(b.x - point.x, b.y - point.y),
      )
      .find((p) =>
        occupied.every((o) => Math.hypot(p.x - o.x, p.y - o.y) >= distance),
      ) || nearest(grid, point)
  );
}
export function usableBehavior(saved, sceneId, room, position) {
  if (saved?.sceneId !== sceneId || !walkable(room, position))
    return { ...initialBehavior(), sceneId };
  const behavior = { ...saved, recent: [...saved.recent] };
  if (!room.objects.some((o) => o.id === behavior.objectId)) {
    behavior.phase = "idle";
    behavior.objectId = null;
  }
  return behavior;
}
