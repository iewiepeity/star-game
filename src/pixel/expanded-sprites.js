import { OUTFITS } from "../data/wardrobe.js";
import { actionAssets } from "./action-sprites.js";
const IDS = Object.keys(OUTFITS);
const NPC_GROUPS = [
  ["shenyao", "tangtang", "guchengxi"],
  ["linxiafan", "lujingran", "xiayutong"],
  ["hanzhiyuan", "chengyian", "silver_pc"],
];
export function expandedMeta(key) {
  for (let group = 0; group < 3; group++) {
    const row = NPC_GROUPS[group].indexOf(key);
    if (row >= 0) return { sheet: `cast-${group}`, row, npc: true, group };
  }
  const [avatar, outfit] = key.split("-"),
    i = IDS.indexOf(outfit);
  if (!["raven", "sunny", "noir", "sage"].includes(avatar) || i < 0)
    return null;
  if (avatar === "raven" && i < 3) return null;
  return {
    sheet: `wardrobe-${avatar}-${Math.floor(i / 5)}`,
    poseSheet: `poses-${avatar}-${Math.floor(i / 5)}`,
    row: i % 5,
    avatar,
    group: Math.floor(i / 5),
  };
}
export const expandedAssets = (key) => {
  const m = expandedMeta(key);
  const base = m
    ? [m.sheet, ...(m.poseSheet ? [m.poseSheet] : [])].map((id) => ({
        key: id,
        url: `assets/pixel/${m.npc ? "cast" : "wardrobe"}/${id}.webp`,
      }))
    : [];
  return [...base, ...actionAssets(key)];
};
// Cell geometry is supplied by the reviewed source atlas manifest. A single GPU
// texture serves all five outfits (or three NPCs), instead of five duplicates.
export function importAtlas(scene, key, manifest) {
  if (scene.textures.exists(key)) return;
  const image = scene.textures.get(`raw-${key}`).getSourceImage(),
    texture = scene.textures.createCanvas(key, image.width, image.height),
    ctx = texture.getContext();
  ctx.drawImage(image, 0, 0);
  const pixels = ctx.getImageData(0, 0, image.width, image.height),
    data = pixels.data;
  for (let i = 0; i < data.length; i += 4)
    if (
      data[i] > data[i + 1] + 45 &&
      data[i + 2] > data[i + 1] + 40 &&
      data[i] > 100 &&
      data[i + 2] > 100
    )
      data[i + 3] = 0;
  ctx.putImageData(pixels, 0, 0);
  texture.refresh();
  for (const [name, rect] of Object.entries(manifest))
    texture.add(name, 0, ...rect);
  // Release the duplicate loader texture; the keyed canvas is the retained asset.
  scene.textures.remove(`raw-${key}`);
}
function set(actor, sheet, frame, flip = false) {
  actor.sprite
    .setTexture(sheet, frame)
    .setFlipX(flip)
    .setAlpha(1)
    .setRotation(0);
}
export function expandedActorFrame(actor, moving, elapsed) {
  const m = expandedMeta(actor.key);
  if (!m) return false;
  const step = moving && Math.floor(elapsed * 8) % 2 === 1;
  const direction = actor.facing;
  // The art export standard uses canonical front/left/right/back frame names;
  // source-profile direction corrections are encoded in the asset manifest.
  const pose = `${m.row}-${step ? "walk" : "idle"}-${direction}`;
  set(actor, m.sheet, pose);
  const info =
    actor.sprite.scene.cache.json.get("pixel-atlas-manifest").flips?.[
      m.sheet
    ] || [];
  actor.sprite.setFlipX(info.includes(pose));
  actor.sprite
    .setScale(76 / actor.sprite.frame.height)
    .setOrigin(0.5, 1)
    .setPosition(actor.x, actor.y)
    .setDepth(actor.y);
  actor.shadow
    .setVisible(true)
    .setPosition(actor.x, actor.y - 1)
    .setDepth(actor.y - 1);
  actor.label
    ?.setPosition(actor.x, actor.y - 86)
    .setDepth(1200)
    .setScale(1 / actor.sprite.scene.cameras.main.zoom);
  return true;
}
export function expandedActivityFrame(actor, kind, elapsed, spot = {}) {
  const m = expandedMeta(actor.key);
  if (!m) return false;
  if (m.npc) {
    expandedActorFrame(actor, false, elapsed);
    actor.sprite.y -= Math.sin(elapsed * 2) * 0.5;
    return true;
  }
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const x = spot.x ?? actor.x,
    y = spot.y ?? actor.y,
    sprite = actor.sprite;
  if (kind === "sit" || kind === "coffee") {
    const facing = spot.seat?.facing || "sw",
      back = ["nw", "ne"].includes(facing),
      flip = ["se", "ne"].includes(facing);
    set(
      actor,
      m.poseSheet,
      `${m.row}-${back ? "seat-back" : "seat-front"}`,
      flip,
    );
    const manifest = sprite.scene.cache.json.get("pixel-atlas-manifest"),
      nativeFlip = manifest.flips?.[m.poseSheet]?.includes(
        `${m.row}-${back ? "seat-back" : "seat-front"}`,
      );
    sprite.setFlipX(flip !== !!nativeFlip);
    // Pelvis anchors are calibrated on the rendered frame, not projected feet.
    const anchor = manifest.seats?.[m.poseSheet]?.[m.row]?.[back ? 1 : 0] || [
      0.65, 0.8,
    ];
    sprite
      .setScale((spot.seat?.height || 68) / sprite.frame.height)
      .setOrigin(flip ? 1 - anchor[0] : anchor[0], anchor[1])
      .setPosition(x, y)
      .setDepth(spot.depth ?? actor.y);
  } else if (kind === "rest") {
    set(actor, m.poseSheet, `${m.row}-rest`);
    sprite
      .setDisplaySize(
        spot.width || 108,
        ((spot.width || 108) * sprite.frame.height) / sprite.frame.width,
      )
      .setOrigin(0.5)
      .setPosition(x, y + (reduced ? 0 : Math.sin(elapsed * 2) * 0.5))
      .setDepth(spot.depth ?? actor.y);
  } else if (kind === "dance") {
    expandedActorFrame(actor, true, elapsed * 0.5);
    sprite.setPosition(
      x + (reduced ? 0 : Math.sin(elapsed * 3) * 4),
      y - (reduced ? 0 : Math.abs(Math.sin(elapsed * 6)) * 3),
    );
  } else {
    set(actor, m.poseSheet, `${m.row}-read`);
    sprite
      .setScale(76 / sprite.frame.height)
      .setOrigin(0.5, 1)
      .setPosition(x, y - (reduced ? 0 : Math.sin(elapsed * 2) * 0.5))
      .setDepth(spot.depth ?? actor.y);
  }
  actor.shadow.setVisible(!["rest", "sit", "coffee"].includes(kind));
  return true;
}
