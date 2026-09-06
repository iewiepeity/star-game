import { WORLD } from "./data.js";
export function inside(point, polygon) {
  let yes = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i],
      b = polygon[j];
    if (
      a.y > point.y !== b.y > point.y &&
      point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x
    )
      yes = !yes;
  }
  return yes;
}
export function walkable(room, point) {
  return (
    inside(point, room.floor) &&
    !room.blocks.some((block) => inside(point, block))
  );
}
// The path planner and moving actors must agree on the space around their feet.
export function footClear(room, point) {
  return [[0, 0], [4, 0], [-4, 0], [0, 4], [0, -4]].every(([dx, dy]) =>
    walkable(room, { x: point.x + dx, y: point.y + dy }));
}
export function buildGrid(room) {
  const size = WORLD.grid,
    cols = Math.ceil(WORLD.width / size),
    rows = Math.ceil(WORLD.height / size),
    nodes = [];
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++) {
      const pt = { x: x * size + size / 2, y: y * size + size / 2 };
      // Leave enough foot clearance along furniture edges.
      if (footClear(room, pt))
        nodes.push({ ...pt, id: y * cols + x, gx: x, gy: y });
    }
  return {
    nodes,
    byId: new Map(nodes.map((n) => [n.id, n])),
    cols,
    size,
    room,
    edges: new Map(),
  };
}
export function nearest(grid, point) {
  return grid.nodes.reduce(
    (best, n) =>
      !best ||
      Math.hypot(n.x - point.x, n.y - point.y) <
        Math.hypot(best.x - point.x, best.y - point.y)
        ? n
        : best,
    null,
  );
}
const distance = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
function segmentClear(room, a, b) {
  const steps = Math.max(1, Math.ceil(distance(a, b)));
  for (let i = 0; i <= steps; i++)
    if (
      !footClear(room, {
        x: a.x + ((b.x - a.x) * i) / steps,
        y: a.y + ((b.y - a.y) * i) / steps,
      })
    )
      return false;
  return true;
}
function bridge(room, from, to) {
  for (const corner of [
    { x: to.x, y: from.y },
    { x: from.x, y: to.y },
  ]) {
    if (segmentClear(room, from, corner) && segmentClear(room, corner, to))
      return [corner, to].filter(
        (p, i, arr) => distance(i ? arr[i - 1] : from, p) > 0.01,
      );
  }
  return null;
}
export function findPath(grid, from, to) {
  const candidates = [...grid.nodes].sort(
    (a, b) => distance(a, from) - distance(b, from),
  );
  let start = null,
    lead = null;
  for (const node of candidates) {
    lead = bridge(grid.room, from, node);
    if (lead) {
      start = node;
      break;
    }
  }
  const end = nearest(grid, to);
  if (!start || !end) return [];
  const open = new Set([start.id]),
    came = new Map(),
    cost = new Map([[start.id, 0]]),
    score = new Map([[start.id, distance(start, end)]]);
  while (open.size) {
    const current = [...open].reduce((a, b) =>
      score.get(a) < score.get(b) ? a : b,
    );
    if (current === end.id) {
      const route = [];
      let id = current;
      while (id !== start.id) {
        route.unshift(grid.byId.get(id));
        id = came.get(id);
      }
      const path = [...lead, ...route];
      // Merge straight runs; every corner is retained and every segment is cardinal.
      return path.filter((point, i) => {
        const prev = i ? path[i - 1] : from,
          next = path[i + 1];
        return (
          !next ||
          !(
            (prev.x === point.x && point.x === next.x) ||
            (prev.y === point.y && point.y === next.y)
          )
        );
      });
    }
    open.delete(current);
    const node = grid.byId.get(current),
      previous = grid.byId.get(came.get(current));
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const id = (node.gy + dy) * grid.cols + node.gx + dx,
        next = grid.byId.get(id);
      if (!next || next.gx !== node.gx + dx || next.gy !== node.gy + dy)
        continue;
      // Valid endpoints alone can still cut across a slanted furniture corner.
      const edge = [current, id].sort((a, b) => a - b).join(":");
      const clear = grid.edges?.get(edge) ?? segmentClear(grid.room, node, next);
      grid.edges?.set(edge, clear);
      if (!clear) continue;
      const turn =
        previous && (node.x - previous.x !== 0) !== (dx !== 0) ? 2 : 0;
      const value = cost.get(current) + grid.size + turn;
      if (value >= (cost.get(id) ?? Infinity)) continue;
      came.set(id, current);
      cost.set(id, value);
      score.set(id, value + distance(next, end));
      open.add(id);
    }
  }
  return [];
}
