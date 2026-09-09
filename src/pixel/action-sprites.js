import { AVATARS, OUTFITS } from "../data/wardrobe.js";

const outfits = Object.keys(OUTFITS);
const cast = [
  ["shenyao", "tangtang", "guchengxi"],
  ["linxiafan", "lujingran", "xiayutong"],
  ["hanzhiyuan", "chengyian", "silver_pc"],
];
export function actionMeta(key) {
  for (let group = 0; group < cast.length; group++) {
    const row = cast[group].indexOf(key);
    if (row >= 0) return { sheet: `actions-cast-${group}`, row, npc: true };
  }
  const [avatar, outfit] = key.split("-");
  const index = outfits.indexOf(outfit);
  return AVATARS[avatar] && index >= 0
    ? { sheet: `actions-${avatar}-${Math.floor(index / 5)}`, row: index % 5, npc: false }
    : null;
}
export function actionAssets(key) {
  const meta = actionMeta(key);
  return meta ? [{ key: meta.sheet, url: `assets/pixel/actions/${meta.sheet}.webp` }] : [];
}

// New art is presentation-only: no RNG, state changes, costs or day settlement.
export function authoredActivityFrame(actor, kind, elapsed, spot = {}, reducedOverride) {
  const meta = actionMeta(actor.key);
  if (!meta || !actor.sprite.scene.textures.exists(meta.sheet)) return false;
  const data = actor.sprite.scene.cache.json.get("pixel-action-manifest")?.sheets[meta.sheet];
  if (!data) return false;
  const reduced = reducedOverride ?? window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const seated = !meta.npc && kind === "coffee";
  const rear = seated && ["nw", "ne"].includes(spot.seat?.facing);
  const pose = seated ? `coffee-${rear ? "back" : "front"}` : kind;
  if (!(meta.npc ? ["dance", "read", "phone", "drink"] : ["dance", "sing", "coffee-front", "coffee-back"]).includes(pose)) return false;
  const tick = Math.floor(Math.max(0, elapsed) * (pose === "dance" ? 2.4 : 1.4));
  const phase = reduced ? 0 : pose.startsWith("coffee") || pose === "drink"
    ? [0, 0, 1, 1, 0, 0][tick % 6]
    : tick % 2;
  const name = `${meta.row}-${pose}-${phase}`;
  if (!data.frames[name]) return false;
  const sprite = actor.sprite;
  const nativeFlip = data.flips.includes(name);
  const east = seated && ["se", "ne"].includes(spot.seat?.facing);
  const flip = seated ? nativeFlip !== east : false;
  sprite.setTexture(meta.sheet, name).setFlipX(flip).setRotation(0).setAlpha(1);
  // A stable scale per animation avoids breathing/pulsing from tight frame crops.
  const referenceHeight = data.frames[`${meta.row}-${pose}-0`][3];
  sprite.setScale((seated ? spot.seat?.height || 68 : 76) / referenceHeight);
  if (seated) {
    const [ox, oy] = data.origins[name];
    sprite.setOrigin(flip ? 1 - ox : ox, oy);
  } else sprite.setOrigin(0.5, 1);
  sprite.setPosition(spot.x ?? actor.x, spot.y ?? actor.y).setDepth(spot.depth ?? actor.y);
  actor.shadow.setVisible(!seated).setPosition(sprite.x, sprite.y - 1).setDepth((spot.depth ?? actor.y) - 1);
  actor.gesture?.clear().setVisible(false);
  actor.label?.setPosition(sprite.x, sprite.y - 86).setDepth(1200).setScale(1 / sprite.scene.cameras.main.zoom);
  return true;
}
