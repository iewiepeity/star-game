import { buildGrid, nearest } from "./navigation.js";

// Keep the entire cast in one connected patch of floor. Positions are chosen
// together, so three actors never independently snap onto the same grid tile.
export function storyFormation(room, count) {
  const grid = buildGrid(room),
    entry = nearest(grid, room.entry);
  const center = room.route[Math.min(1, room.route.length - 1)] || entry;
  const reachable = [entry],
    seen = new Set([entry.id]);
  for (let i = 0; i < reachable.length; i++) {
    const node = reachable[i];
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const n = grid.byId.get((node.gy + dy) * grid.cols + node.gx + dx);
      if (
        n &&
        n.gx === node.gx + dx &&
        n.gy === node.gy + dy &&
        !seen.has(n.id)
      ) {
        seen.add(n.id);
        reachable.push(n);
      }
    }
  }
  for (const anchor of [...reachable].sort(
    (a, b) =>
      Math.hypot(a.x - center.x, a.y - center.y) -
      Math.hypot(b.x - center.x, b.y - center.y),
  )) {
    const points = [anchor];
    for (const node of [...reachable].sort(
      (a, b) =>
        Math.hypot(a.x - anchor.x, a.y - anchor.y) -
        Math.hypot(b.x - anchor.x, b.y - anchor.y),
    )) {
      if (Math.hypot(node.x - anchor.x, node.y - anchor.y) > 155) break;
      if (points.every((p) => Math.hypot(p.x - node.x, p.y - node.y) >= 62))
        points.push(node);
      if (points.length === count + 1) return points;
    }
  }
  throw new Error("這個場景沒有足夠的對話空間");
}
