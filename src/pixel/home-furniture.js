import { HOME_ITEMS } from "../data/home-life.js";
import { initialHomeLife } from "../core/home-state.js";
import { cushionPigment } from "./fabric-colors.js";

const SLOT_OBJECTS = {
  bed: "bed",
  "prop-blinds": "window",
  sofa: "sofa",
  "prop-picture": "wall",
  "prop-table-plant": "table",
};
const PALETTES = {
  linen_bed: [161, 176, 178],
  blush_bed: [188, 126, 142],
  rose_sofa: [179, 112, 132],
  blue_sofa: [109, 151, 177],
};
// The illustration's olive throw is distinct from the cream sheets and brown
// bed frame. Select its pigment before applying any palette, so every colour
// follows the same pixel edge (including the irregular hanging hem).
function furniturePigment(id, r, g, b) {
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b),
    delta = max - min;
  if (!delta || max < 35) return false;
  const saturation = delta / max;
  if (id.endsWith("bed")) {
    const channel = max === r ? (g - b) / delta
      : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
    const hue = (channel * 60 + 360) % 360;
    return hue >= 42 && hue <= 86 && saturation >= 0.1;
  }
  // Sofa legs/floor are more saturated wood than the cream upholstery. Keep
  // them, the cushions and the original dark outlines out of every sofa tint.
  return max >= 75 && saturation < 0.46;
}
const inside = (x, y, polygon) => {
  let hit = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [a, b] = polygon[i],
      [c, d] = polygon[j];
    if (b > y !== d > y && x < ((c - a) * (y - b)) / (d - b) + a) hit = !hit;
  }
  return hit;
};

export function homeFurnitureInfo(home, objectId) {
  const slot = SLOT_OBJECTS[objectId];
  if (!slot) return null;
  const h = home || initialHomeLife(),
    itemId = h.placedFurniture[slot];
  const keepsake =
    slot === "wall" &&
    h.keepsakes.find((item) => item.id === h.displayedKeepsakeId);
  return {
    itemId,
    name: HOME_ITEMS[itemId]?.name || "",
    keepsakeId: keepsake?.id || null,
    keepsakeName: keepsake?.name || null,
  };
}

// Render into a disposable source canvas, never into the shipped illustration.
// The same composed source feeds backdrop and overlapping furniture patches, so
// props cannot restore rectangular pieces of the old upholstery over a new sofa.
export function paintHomeFurniture(c, rawHome) {
  const home = rawHome || initialHomeLife(),
    placed = home.placedFurniture;
  const polygon = (points, color) => {
    c.fillStyle = color;
    c.beginPath();
    points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.closePath();
    c.fill();
  };
  const tint = (id, bounds, mask) => {
    if (!PALETTES[id]) return;
    const [x, y, w, h] = bounds,
      pixels = c.getImageData(x, y, w, h),
      palette = PALETTES[id];
    for (let row = 0; row < h; row++)
      for (let col = 0; col < w; col++) {
        if (!inside(x + col, y + row, mask)) continue;
        const offset = (row * w + col) * 4;
        const [r, g, b] = pixels.data.subarray(offset, offset + 3);
        if (!pixels.data[offset + 3] || !furniturePigment(id, r, g, b))
          continue;
        if (id.endsWith("sofa") && cushionPigment(x + col, y + row, r, g, b))
          continue;
        const light = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 175;
        for (let k = 0; k < 3; k++)
          pixels.data[offset + k] = Math.min(255, palette[k] * light);
      }
    c.putImageData(pixels, x, y);
  };
  tint(
    placed.bed,
    [210, 360, 284, 188],
    [
      [210, 360],
      [494, 360],
      [494, 548],
      [210, 548],
    ],
  );
  tint(
    placed.sofa,
    [1048, 357, 320, 241],
    [
      [1049, 429],
      [1090, 409],
      [1115, 418],
      [1115, 436],
      [1136, 444],
      [1133, 375],
      [1143, 363],
      [1151, 359],
      [1346, 438],
      [1353, 457],
      [1353, 471],
      [1366, 466],
      [1366, 560],
      [1289, 596],
      [1049, 506],
    ],
  );

  if (["sheer_curtain", "midnight_curtain"].includes(placed.window)) {
    const dark = placed.window === "midnight_curtain";
    polygon(
      [
        [756, 111],
        [975, 181],
        [975, 320],
        [756, 250],
      ],
      dark ? "#425c7e" : "rgba(252,247,237,.86)",
    );
    for (let i = 0; i < 12; i++) {
      const x = 758 + i * 18,
        y = 112 + i * 5.75;
      polygon(
        [
          [x, y],
          [x + 4, y + 1],
          [x + 4, y + 139],
          [x, y + 138],
        ],
        dark ? "#344762" : "rgba(185,177,159,.40)",
      );
    }
  }

  // The existing frame is the wall slot; keep its perspective and hit target.
  const wall = [
    [349, 184],
    [402, 165],
    [402, 233],
    [349, 252],
  ];
  polygon(wall, placed.wall === "cork_board" ? "#ac7b51" : "#dcc5a5");
  const keepsake = home.keepsakes.find(
    (item) => item.id === home.displayedKeepsakeId,
  );
  if (keepsake) {
    polygon(
      [
        [359, 191],
        [392, 180],
        [392, 225],
        [359, 236],
      ],
      "#faf1d7",
    );
    if (keepsake.kind === "獎項") {
      polygon(
        [
          [367, 198],
          [385, 192],
          [382, 206],
          [378, 211],
          [378, 218],
          [384, 216],
          [384, 220],
          [368, 225],
          [368, 221],
          [374, 219],
          [374, 212],
          [369, 209],
        ],
        "#b88636",
      );
    } else {
      polygon(
        [
          [363, 194],
          [388, 186],
          [388, 208],
          [363, 217],
        ],
        keepsake.npcId ? "#927a8d" : "#758875",
      );
      polygon(
        [
          [364, 222],
          [388, 214],
          [388, 216],
          [364, 224],
        ],
        "#ac9e86",
      );
    }
  } else if (placed.wall === "cork_board") {
    polygon(
      [
        [360, 194],
        [375, 189],
        [375, 207],
        [360, 212],
      ],
      "#eee0b4",
    );
    polygon(
      [
        [379, 209],
        [393, 204],
        [393, 222],
        [379, 227],
      ],
      "#cfb2a0",
    );
  }

  if (["record_player", "tea_set"].includes(placed.table)) {
    // Remove the starter plant only inside its original tabletop footprint.
    const patch = c.getImageData(716, 576, 72, 69);
    for (let y = 0; y < patch.height; y++)
      for (let x = 4; x < patch.width - 4; x++) {
        const start = y * patch.width * 4,
          p = start + x * 4;
        for (let k = 0; k < 3; k++)
          patch.data[p + k] =
            patch.data[start + k] * (1 - x / 71) +
            (patch.data[start + 71 * 4 + k] * x) / 71;
      }
    c.putImageData(patch, 716, 576);
    if (placed.table === "record_player") {
      polygon(
        [
          [724, 607],
          [752, 593],
          [779, 608],
          [751, 627],
        ],
        "#443f3c",
      );
      polygon(
        [
          [724, 607],
          [751, 623],
          [779, 608],
          [779, 617],
          [751, 636],
          [724, 617],
        ],
        "#624733",
      );
      c.fillStyle = "#282b31";
      c.beginPath();
      c.ellipse(749, 607, 15, 8, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#e1b684";
      c.beginPath();
      c.ellipse(749, 607, 4, 2, 0, 0, Math.PI * 2);
      c.fill();
      polygon(
        [
          [769, 600],
          [771, 601],
          [766, 615],
          [763, 615],
        ],
        "#c3bcaa",
      );
    } else {
      for (const [x, y] of [
        [738, 607],
        [764, 620],
      ]) {
        c.fillStyle = "#e7d9be";
        c.beginPath();
        c.ellipse(x, y + 6, 12, 5, 0, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = "#bd9a7d";
        c.fillRect(x - 7, y - 8, 14, 13);
        c.fillStyle = "#725746";
        c.beginPath();
        c.ellipse(x, y - 8, 7, 3, 0, 0, Math.PI * 2);
        c.fill();
      }
    }
  }
}
