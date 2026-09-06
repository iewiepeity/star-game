const FABRIC_PALETTES = { rose: [173, 101, 123], blue: [104, 143, 169] };
const luminance = (r, g, b) => r * 0.2126 + g * 0.7152 + b * 0.0722;

// Select the original fabric pigments, including folds and seams, instead of
// painting a flat polygon over the furniture. Sofa upholstery is a warmer hue.
export function cushionPigment(x, y, r, g, b) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min;
  if (!delta || max < 35) return false;
  let hue = max === r ? (g - b) / delta : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
  hue = (hue * 60 + 360) % 360;
  const saturation = delta / max;
  if (x >= 1107 && x <= 1178 && y >= 387 && y <= 463)
    return hue >= 43 && hue <= 86 && saturation >= 0.1;
  if (x >= 1241 && x <= 1319 && y >= 444 && y <= 514)
    return hue <= 28 && saturation >= 0.15;
  return false;
}

export function recolorCushions(image, room, origin, tone) {
  const palette = FABRIC_PALETTES[tone];
  if (!palette) return;
  const [cx, cy, cw, ch] = room.crop || [0, 0, 1536, 1024];
  const targetLight = luminance(...palette);
  const mask = new Uint8Array(image.width * image.height);
  for (let row = 0; row < image.height; row++) {
    for (let col = 0; col < image.width; col++) {
      const i = (row * image.width + col) * 4;
      if (!image.data[i + 3]) continue;
      const x = cx + ((origin.x + col + 0.5 - room.rect.x) * cw) / room.rect.width;
      const y = cy + ((origin.y + row + 0.5 - room.rect.y) * ch) / room.rect.height;
      const [r, g, b] = image.data.subarray(i, i + 3);
      if (!cushionPigment(x, y, r, g, b)) continue;
      mask[row * image.width + col] = x < 1200 ? 1 : 2;
    }
  }
  // Keep each cushion's connected fabric. Warm isolated pixels on the armrest
  // can share the salmon pigment, but are not part of the cushion.
  const fabrics = [[], [], []];
  for (let start = 0; start < mask.length; start++) {
    const kind = mask[start];
    if (!kind) continue;
    const connected = [start];
    mask[start] = 0;
    for (let head = 0; head < connected.length; head++) {
      const p = connected[head], x = p % image.width, y = Math.floor(p / image.width);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy, next = ny * image.width + nx;
        if (nx < 0 || nx >= image.width || ny < 0 || ny >= image.height || mask[next] !== kind) continue;
        mask[next] = 0;
        connected.push(next);
      }
    }
    if (connected.length > fabrics[kind].length) fabrics[kind] = connected;
  }
  for (const pixels of fabrics) for (const p of pixels) {
    const i = p * 4;
    const shade = luminance(...image.data.subarray(i, i + 3)) / targetLight;
    for (let channel = 0; channel < 3; channel++)
      image.data[i + channel] = Math.round(Math.min(255, palette[channel] * shade));
  }
}
