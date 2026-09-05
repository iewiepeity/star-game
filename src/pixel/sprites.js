// Source sheets use a magenta key, like traditional sprite import pipelines.
// Decode once into GPU textures. The generated source artwork stays unmodified.
export function importSprites(scene, key) {
  const image = scene.textures.get(`raw-${key}`).getSourceImage();
  const texture = scene.textures.createCanvas(key, image.width, image.height);
  const context = texture.getContext();
  context.drawImage(image, 0, 0);
  const pixels = context.getImageData(0, 0, image.width, image.height),
    data = pixels.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i],
      g = data[i + 1],
      b = data[i + 2];
    if (r > g + 45 && b > g + 40 && r > 100 && b > 100) data[i + 3] = 0;
  }
  context.putImageData(pixels, 0, 0);
  texture.refresh();
  const actionSheet = key.endsWith("-actions");
  const xs = actionSheet
      ? [0, 420, 800, 1140, image.width]
      : [0, 465, 780, 1090, image.width],
    ys = actionSheet ? [0, 512, image.height] : [0, 342, 662, image.height];
  for (let row = 0; row < ys.length - 1; row++)
    for (let col = 0; col < 4; col++) {
      let left = xs[col + 1],
        right = xs[col],
        top = ys[row + 1],
        bottom = ys[row];
      for (let y = ys[row]; y < ys[row + 1]; y++)
        for (let x = xs[col]; x < xs[col + 1]; x++)
          if (data[(y * image.width + x) * 4 + 3] > 128) {
            left = Math.min(left, x);
            right = Math.max(right, x);
            top = Math.min(top, y);
            bottom = Math.max(bottom, y);
          }
      if (right < left || bottom < top)
        throw new Error(`Missing sprite ${key}:${row}:${col}`);
      texture.add(
        `${row}-${col}`,
        0,
        left,
        top,
        right - left + 1,
        bottom - top + 1,
      );
    }
  return texture;
}
export function actorFrame(actor, moving, elapsed) {
  const row = moving ? [0, 1, 0, 2][Math.floor(elapsed * 9) % 4] : 0;
  let col = actor.facing,
    flip = false;
  // Art manifest: practice profiles both face right; Qiao's third-row left
  // profile faces right. Mirror only those source frames at render time.
  if (actor.key === "raven-practice" && col === 1) {
    col = 2;
    flip = true;
  }
  if (actor.key === "jiqing") {
    if (col === 1 && row === 2) {
      col = 2;
    } else if (col === 2) {
      col = 1;
      flip = row !== 2;
    }
  }
  actor.sprite
    .setTexture(actor.key, `${row}-${col}`)
    .setFlipX(flip)
    .setAlpha(1)
    .setRotation(0);
  actor.shadow.setVisible(true);
  const frame = actor.sprite.frame;
  actor.sprite
    .setScale(76 / frame.height)
    .setOrigin(0.5, 1)
    .setPosition(actor.x, actor.y)
    .setDepth(actor.y);
  actor.shadow.setPosition(actor.x, actor.y - 1).setDepth(actor.y - 1);
  actor.label
    ?.setPosition(actor.x, actor.y - 86)
    .setDepth(1200)
    .setScale(1 / actor.sprite.scene.cameras.main.zoom);
}

export function activityFrame(actor, kind, elapsed, spot = {}) {
  const sheet =
      actor.key === "raven-newcomer" && kind === "rest"
        ? "raven-newcomer-rest-actions"
        : `${actor.key}-actions`,
    phase = Math.floor(elapsed * (kind === "dance" ? 2.8 : 1.3)) % 2;
  let row = 0,
    col = 0;
  const gettingIntoBed = kind === "rest" && (elapsed < 0.4 || elapsed > 4.6);
  if (kind === "rest") col = gettingIntoBed ? 2 : phase;
  else if (kind === "sit") col = 2;
  else if (kind === "coffee") col = 2 + phase;
  else {
    row = 1;
    col = kind === "dance" ? phase : 2 + phase;
  }
  const sprite = actor.sprite;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  sprite
    .setTexture(sheet, `${row}-${col}`)
    .setFlipX(
      (actor.key === "raven-practice" &&
        (kind === "sit" || kind === "coffee")) ||
        (actor.key === "raven-newcomer" && kind === "rest" && !gettingIntoBed),
    )
    .setRotation(0)
    .setAlpha(1);
  const ref = sprite.scene.textures.get(sheet).get("1-2");
  const scale =
    (kind === "rest" ? 83 : kind === "sit" || kind === "coffee" ? 70 : 76) /
    ref.height;
  const x = spot.x ?? actor.x,
    y = spot.y ?? actor.y;
  const bounce =
    !reduced && kind === "dance" ? Math.abs(Math.sin(elapsed * 8)) * 3 : 0;
  const breathe = !reduced && kind === "rest" ? Math.sin(elapsed * 2) * 0.6 : 0;
  sprite
    .setScale(scale)
    .setOrigin(0.5, spot.center && !gettingIntoBed ? 0.5 : 1)
    .setPosition(x, y - bounce + breathe + (gettingIntoBed ? 22 : 0))
    .setDepth(spot.depth ?? actor.y);
  actor.shadow
    .setVisible(!["rest", "sit", "coffee"].includes(kind))
    .setPosition(x, y - 1)
    .setDepth((spot.depth ?? actor.y) - 1);
  actor.label
    ?.setPosition(x, y - 84)
    .setDepth(1200)
    .setScale(1 / sprite.scene.cameras.main.zoom);
}
