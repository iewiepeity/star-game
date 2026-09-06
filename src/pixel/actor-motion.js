// Presentation-only motion: it never draws from the simulation RNG or advances a day.
export const BODY_RADIUS = 8;
export const facingToward = (a, b) =>
  Math.abs(b.x - a.x) > Math.abs(b.y - a.y)
    ? b.x < a.x
      ? 1
      : 2
    : b.y < a.y
      ? 3
      : 0;
export function clearMotion(actor) {
  actor.speed = 0;
  actor.turnWait = 0;
  actor.blockedFor = 0;
}
export function bodyClear(actor, point, others, radius = BODY_RADIUS * 2) {
  return others.every(
    (other) =>
      other === actor ||
      other.hidden ||
      Math.hypot(point.x - other.x, point.y - other.y) >= radius ||
      Math.hypot(point.x - other.x, point.y - other.y) >
        Math.hypot(actor.x - other.x, actor.y - other.y) + 0.01,
  );
}
export function advanceMotion(actor, dt, maxSpeed, canStep = () => true) {
  const start = { x: actor.x, y: actor.y };
  let time = Math.min(dt, 0.64);
  while (time > 0 && actor.path.length) {
    const step = Math.min(time, 1 / 60);
    time -= step;
    if (actor.turnWait > 0) {
      actor.turnWait = Math.max(0, actor.turnWait - step);
      continue;
    }
    const target = actor.path[0],
      dx = target.x - actor.x,
      dy = target.y - actor.y,
      dist = Math.hypot(dx, dy);
    if (dist < 0.01) {
      actor.path.shift();
      continue;
    }
    const total = actor.path.reduce(
      (sum, p, i) =>
        sum +
        Math.hypot(
          p.x - (i ? actor.path[i - 1].x : actor.x),
          p.y - (i ? actor.path[i - 1].y : actor.y),
        ),
      0,
    );
    const desired = Math.min(maxSpeed, Math.sqrt(2 * 520 * total));
    actor.speed = Math.min(desired, (actor.speed || 0) + maxSpeed * 4 * step);
    const move = Math.min(dist, actor.speed * step),
      next = {
        x: actor.x + (dx / dist) * move,
        y: actor.y + (dy / dist) * move,
      };
    if (!canStep(next)) {
      actor.blockedFor = (actor.blockedFor || 0) + time + step;
      actor.speed = 0;
      break;
    }
    actor.blockedFor = 0;
    actor.facing = facingToward(actor, target);
    actor.x = next.x;
    actor.y = next.y;
    actor.walkDistance = (actor.walkDistance || 0) + move;
    if (move >= dist - 0.001) {
      actor.path.shift();
      const nextTarget = actor.path[0];
      if (nextTarget && facingToward(actor, nextTarget) !== actor.facing) {
        actor.turnWait = 0.045;
        actor.speed *= 0.55;
      }
    }
  }
  if (!actor.path.length) actor.speed = 0;
  return Math.hypot(actor.x - start.x, actor.y - start.y) > 0.001;
}
