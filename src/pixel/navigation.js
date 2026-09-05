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
export function buildGrid(room) {
  const size = WORLD.grid,
    cols = Math.ceil(WORLD.width / size),
    rows = Math.ceil(WORLD.height / size),
    nodes = [];
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++) {
      const pt = { x: x * size + size / 2, y: y * size + size / 2 };
      // Give feet a small clearance so diagonals never graze the furniture.
      if (
        [
          [0, 0],
          [4, 0],
          [-4, 0],
          [0, 4],
          [0, -4],
        ].every(([dx, dy]) => walkable(room, { x: pt.x + dx, y: pt.y + dy }))
      )
        nodes.push({ ...pt, id: y * cols + x, gx: x, gy: y });
    }
  return {
    nodes,
    byId: new Map(nodes.map((n) => [n.id, n])),
    cols,
    size,
    room,
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
export function findPath(grid, from, to) {
  const start = nearest(grid, from),
    end = nearest(grid, to);
  if (!start || !end) return [];
  const open = new Set([start.id]),
    came = new Map(),
    cost = new Map([[start.id, 0]]),
    score = new Map([[start.id, Math.hypot(start.x - end.x, start.y - end.y)]]);
  while (open.size) {
    const current = [...open].reduce((a, b) =>
      score.get(a) < score.get(b) ? a : b,
    );
    if (current === end.id) {
      const path = [];
      let id = current;
      while (id !== start.id) {
        path.unshift(grid.byId.get(id));
        id = came.get(id);
      }
      if (Math.hypot(from.x - start.x, from.y - start.y) > 1)
        path.unshift(start);
      return path;
    }
    open.delete(current);
    const node = grid.byId.get(current);
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [1, 1],
      [-1, -1],
      [1, -1],
      [-1, 1],
    ]) {
      const id = (node.gy + dy) * grid.cols + node.gx + dx,
        next = grid.byId.get(id);
      if (!next || next.gx !== node.gx + dx || next.gy !== node.gy + dy)
        continue;
      if (
        dx &&
        dy &&
        (!grid.byId.has(node.gy * grid.cols + node.gx + dx) ||
          !grid.byId.has((node.gy + dy) * grid.cols + node.gx))
      )
        continue;
      const value = cost.get(current) + Math.hypot(dx, dy) * grid.size;
      if (value >= (cost.get(id) ?? Infinity)) continue;
      came.set(id, current);
      cost.set(id, value);
      score.set(id, value + Math.hypot(next.x - end.x, next.y - end.y));
      open.add(id);
    }
  }
  return [];
}
