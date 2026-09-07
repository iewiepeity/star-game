import { appearanceValue, sourcePoint } from "./scene-objects.js";
import { recolorCushions } from "./fabric-colors.js";
import { paintHomeFurniture, homeFurnitureInfo } from "./home-furniture.js";
// Runtime scene composition: remove each furniture patch from the static backdrop
// and render it as a separate sprite. Source art stays lossless and unchanged on disk.
// Only the current room's generated textures are retained.
export function createFurnitureLayers(scene, room, sourceImage, state) {
  const keys = [],
    sprites = [];
  const make = (key, w, h) => {
    keys.push(key);
    return scene.textures.createCanvas(key, Math.ceil(w), Math.ceil(h));
  };
  const background = make("furniture-background", 960, 640),
    ctx = background.context;
  const homeSource =
    state().sceneId === "home"
      ? make("furniture-home-source", 1536, 1024)
      : null;
  const image = homeSource ? homeSource.canvas : sourceImage;
  const crop = room.crop || [0, 0, 1536, 1024],
    r = room.rect;
  ctx.drawImage(sourceImage, ...crop, r.x, r.y, r.width, r.height);
  for (const item of room.objects.filter((o) => o.layer)) {
    const pts = item.layer.polygon,
      x = Math.floor(Math.min(...pts.map((p) => p.x))),
      y = Math.floor(Math.min(...pts.map((p) => p.y))),
      right = Math.ceil(Math.max(...pts.map((p) => p.x))),
      bottom = Math.ceil(Math.max(...pts.map((p) => p.y))),
      key = `furniture-${item.id}`,
      texture = make(key, right - x, bottom - y);
    const layer = texture.context;
    const path = (c, dx = 0, dy = 0) => {
      c.beginPath();
      pts.forEach((p, i) =>
        i ? c.lineTo(p.x - dx, p.y - dy) : c.moveTo(p.x - dx, p.y - dy),
      );
      c.closePath();
    };
    layer.save();
    path(layer, x, y);
    layer.clip();
    layer.drawImage(sourceImage, ...crop, r.x - x, r.y - y, r.width, r.height);
    layer.restore();
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    // Keep a subpixel overlap under cut edges: complementary antialiased masks
    // otherwise leave pale seams when composed by WebGL on a scaled camera.
    const cx = (x + right) / 2,
      cy = (y + bottom) / 2;
    ctx.translate(cx, cy);
    ctx.scale(
      Math.max(0.9, (right - x - 2) / (right - x)),
      Math.max(0.9, (bottom - y - 2) / (bottom - y)),
    );
    ctx.translate(-cx, -cy);
    path(ctx);
    ctx.fill();
    ctx.restore();
    const sprite = scene.add.image(x, y, key).setOrigin(0).setDepth(-9);
    sprites.push({ item, sprite, texture, x, y, path });
  }
  background.refresh();
  function refresh() {
    if (homeSource) {
      homeSource.context.clearRect(0, 0, 1536, 1024);
      homeSource.context.drawImage(sourceImage, 0, 0);
      paintHomeFurniture(homeSource.context, state().life?.game.homeLife);
      homeSource.refresh();
      ctx.clearRect(0, 0, 960, 640);
      ctx.drawImage(image, ...crop, r.x, r.y, r.width, r.height);
      for (const { texture, x, y, path } of sprites) {
        ctx.save();
        ctx.globalCompositeOperation = "destination-out";
        ctx.translate(x + texture.width / 2, y + texture.height / 2);
        ctx.scale(
          Math.max(0.9, (texture.width - 2) / texture.width),
          Math.max(0.9, (texture.height - 2) / texture.height),
        );
        ctx.translate(-x - texture.width / 2, -y - texture.height / 2);
        path(ctx);
        ctx.fill();
        ctx.restore();
      }
      background.refresh();
    }
    for (const entry of sprites) {
      const { item, texture, x, y, path } = entry,
        c = texture.context,
        w = texture.width,
        h = texture.height;
      c.clearRect(0, 0, w, h);
      c.save();
      path(c, x, y);
      c.clip();
      c.drawImage(image, ...crop, r.x - x, r.y - y, r.width, r.height);
      const value = appearanceValue(state(), state().sceneId, item);
      const poly = (points, color) => {
        c.fillStyle = color;
        c.beginPath();
        points
          .map(([a, b]) => sourcePoint(room, a, b))
          .forEach((p, i) =>
            i ? c.lineTo(p.x - x, p.y - y) : c.moveTo(p.x - x, p.y - y),
          );
        c.closePath();
        c.fill();
      };
      if (item.appearance === "doors" && value === "open") {
        poly(
          [
            [510, 130],
            [605, 150],
            [605, 321],
            [510, 294],
          ],
          "#392e22",
        );
        poly(
          [
            [518, 145],
            [596, 162],
            [596, 169],
            [518, 151],
          ],
          "#ba9364",
        );
        for (let i = 0; i < 4; i++) {
          const a = 530 + i * 15;
          poly(
            [
              [a, 171 + i * 3],
              [a + 11, 174 + i * 3],
              [a + 14, 253 + i * 3],
              [a - 3, 250 + i * 3],
            ],
            ["#a5a68c", "#c49785", "#839590", "#c9b89e"][i],
          );
        }
        poly(
          [
            [510, 130],
            [525, 152],
            [525, 310],
            [510, 294],
          ],
          "#86603d",
        );
        poly(
          [
            [590, 164],
            [605, 150],
            [605, 321],
            [590, 313],
          ],
          "#8f6846",
        );
      } else if (
        item.appearance === "blinds" &&
        value === "closed" &&
        (!homeSource ||
          state().life?.game.homeLife?.placedFurniture.window ===
            "starter_blinds")
      ) {
        poly(
          [
            [755, 112],
            [975, 183],
            [975, 321],
            [755, 251],
          ],
          "#b4a287",
        );
        for (let k = 0; k < 15; k++)
          poly(
            [
              [755, 113 + k * 9],
              [975, 184 + k * 9],
              [975, 186 + k * 9],
              [755, 115 + k * 9],
            ],
            "#7f735f",
          );
      } else if (item.appearance === "fabric" && value !== "original") {
        const pixels = c.getImageData(0, 0, w, h);
        recolorCushions(pixels, room, { x, y }, value);
        c.putImageData(pixels, 0, 0);
      } else if (item.appearance === "light" && value === "off") {
        c.fillStyle = "rgba(35,40,48,.48)";
        c.beginPath();
        c.ellipse(w * 0.5, h * 0.33, w * 0.32, h * 0.24, 0, 0, Math.PI * 2);
        c.fill();
      } else if (item.appearance === "screen" && value === "off") {
        if (item.id === "prop-laptop" && state().sceneId === "home")
          poly(
            [
              [815, 289],
              [858, 305],
              [842, 332],
              [798, 316],
            ],
            "#25313a",
          );
        else {
          c.fillStyle = "#25313a";
          c.fillRect(w * 0.15, h * 0.17, w * 0.67, h * 0.46);
        }
      } else if (item.appearance === "power" && value === "on") {
        c.fillStyle = "#a8dcaa";
        c.beginPath();
        c.arc(
          w * 0.72,
          h * 0.68,
          Math.max(1.5, Math.min(w, h) * 0.045),
          0,
          Math.PI * 2,
        );
        c.fill();
      } else if (item.appearance === "bell" && value === "rung") {
        c.strokeStyle = "#f7d28e";
        c.lineWidth = 2;
        c.beginPath();
        c.arc(w / 2, h / 2, Math.min(w, h) * 0.4, Math.PI, Math.PI * 2);
        c.stroke();
      }
      c.restore();
      texture.refresh();
    }
  }
  refresh();
  return {
    backgroundKey: "furniture-background",
    sourceKey: homeSource ? "furniture-home-source" : null,
    refresh,
    dispose() {
      for (const key of keys)
        if (scene.textures.exists(key)) scene.textures.remove(key);
    },
    snapshot: () =>
      sprites.map(({ item }) => ({
        id: item.id,
        value: appearanceValue(state(), state().sceneId, item),
        home:
          state().sceneId === "home"
            ? homeFurnitureInfo(state().life?.game.homeLife, item.id)
            : null,
      })),
  };
}
