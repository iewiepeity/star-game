import { actorFrame } from "./sprites.js";
import { authoredActivityFrame } from "./action-sprites.js";
// Small hand-held props and restrained gestures work with every existing NPC atlas.
// No unsupported seated frame is placed on top of furniture.
export function drawNpcGesture(actor, pose, elapsed, reduced = false) {
  const authoredPose = pose === "type" ? "phone" : pose === "check" ? "read" : pose;
  if (authoredActivityFrame(actor, authoredPose, elapsed, {}, reduced)) return;
  actorFrame(actor, false, elapsed);
  const g = actor.gesture;
  g.clear();
  g.setVisible(true).setDepth(actor.y + 0.2);
  const direction = actor.facing === 1 ? -1 : 1,
    x = actor.x + direction * (actor.facing === 3 ? 19 : 9),
    y = actor.y - 32;
  const wave = reduced ? 0 : Math.sin(elapsed * 3) * 1.1;
  if (pose === "read") {
    g.fillStyle(0xd5b991).fillRect(x - 11, y - 7 + wave, 20, 13);
    g.fillStyle(0xfff1d2)
      .fillRect(x - 9, y - 6 + wave, 8, 10)
      .fillRect(x + 1, y - 6 + wave, 7, 10);
    g.lineStyle(1, 0x8c725c).lineBetween(x, y - 6 + wave, x, y + 5 + wave);
  } else if (pose === "drink") {
    const lift = reduced ? 0 : Math.max(0, Math.sin(elapsed * 1.3)) * 8;
    g.fillStyle(0xf6e4c5).fillRoundedRect(x - 4, y - 3 - lift, 9, 11, 2);
    g.lineStyle(2, 0xba9778).strokeCircle(x + 6, y + 2 - lift, 3);
  } else if (pose === "phone" || pose === "type") {
    g.fillStyle(0x49494d).fillRoundedRect(x - 5, y - 8 + wave, 10, 15, 2);
    g.fillStyle(0xa9c3b9).fillRect(x - 3, y - 6 + wave, 6, 9);
  } else if (pose === "water") {
    g.fillStyle(0x839c8c).fillRoundedRect(x - 6, y - 2, 11, 9, 2);
    g.lineStyle(3, 0x839c8c).lineBetween(
      x + direction * 4,
      y,
      x + direction * 12,
      y - 3,
    );
    if (!reduced)
      for (let i = 0; i < 3; i++) {
        const fall = (elapsed * 13 + i * 4) % 14;
        g.fillStyle(0x98c6d0, 0.8).fillCircle(
          x + direction * (12 + fall * 0.25),
          y + fall,
          1.1,
        );
      }
  } else if (pose === "check") {
    g.fillStyle(0xbea383).fillRect(x - 8, y - 6, 15, 16);
    g.fillStyle(0xeee6cd).fillRect(x - 6, y - 4, 11, 12);
    g.lineStyle(1, 0x736b5d).lineBetween(x - 4, y + wave, x + 4, y + wave);
  } else if (pose === "stretch") {
    actor.sprite.setRotation(reduced ? 0 : Math.sin(elapsed * 2) * 0.035);
  } else if (pose === "listen") {
    actor.sprite.y -= reduced ? 0 : Math.max(0, Math.sin(elapsed * 3)) * 0.9;
  } else actor.sprite.y -= reduced ? 0 : Math.sin(elapsed * 1.7) * 0.45;
  // Back-facing hands are occluded by the body, instead of drawing a book on a back.
  if (actor.facing === 3) g.setDepth(actor.y - 0.2);
}
