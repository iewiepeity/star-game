import { SCENE_PROPS } from "./scene-object-catalog.js";

const RESPONSES = {
  art: "你停下腳步看了一會。光線換個角度，細節也有了不同的表情。",
  cabinet: "裡頭的東西各有位置，用完再放回原處就好。",
  light: "光落在近處，讓這個角落顯得安靜。",
  plant: "葉片朝著光伸展，泥土裡還留著一點水氣。",
  window: "你往外看了一會，讓眼睛離開手邊的事。",
  computer: "螢幕前的位置已經準備好，等著下一段工作。",
  screen: "你抬頭看了看畫面，再把注意力收回眼前。",
  phone: "熟悉的手機握在手裡，想聯絡的人都在通訊錄中。",
  books: "你翻看眼前的文字，把在意的幾句記在心裡。",
  machine: "機器安穩地放在原位，操作前先看清楚按鍵。",
  cushion: "你把抱枕扶正，替自己留下一個舒服的位置。",
  table: "桌面留著日常使用的細微痕跡。你把邊緣輕輕抹平。",
  mat: "踩過這一小塊地墊，好像也把外頭的匆忙留了下來。",
  equipment: "你仔細看了看器材，沒有打亂原來的擺放。",
  mark: "這些記號提醒著站位，也記著一次次重來的練習。",
  seat: "這裡留著一個座位。你看了看周圍，想著下次和誰一起來。",
  stationery: "小東西整齊地放在手邊，需要時伸手就能拿到。",
  drink: "你看了一眼杯瓶，想起忙碌時也要留一點照顧自己的空檔。",
  speaker: "你靠近聽了聽，留意聲音在房間裡散開的方向。",
  food: "香氣和顏色讓你多看了一眼。要挑選時，再到服務處慢慢決定。",
  bell: "小小的鈴放在桌邊，伸手就能碰到。",
  fabric: "布料垂落在原位，邊緣隨空氣輕輕晃動。",
  clothes: "你看了看剪裁與配色，記下喜歡的搭配。",
  sign: "你讀過上面的字，記住這個地方的名字。",
  door: "門的另一側有人來去。你看過標示，留在開放的區域。",
  water: "水面一直在動。你停了一會，聽風把遠處的聲音帶過來。",
};
export const APPEARANCES = {
  light: {
    initial: "on",
    choices: { on: "開燈", off: "關燈" },
    labels: { on: "燈亮著", off: "燈已關上" },
  },
  power: {
    initial: "off",
    choices: { on: "開啟電源", off: "關閉電源" },
    labels: { on: "電源已開啟", off: "電源已關閉" },
  },
  screen: {
    initial: "on",
    choices: { on: "喚醒螢幕", off: "關閉螢幕" },
    labels: { on: "螢幕亮著", off: "螢幕已關閉" },
  },
  doors: {
    initial: "closed",
    choices: { open: "打開櫃門", closed: "關上櫃門" },
    labels: { open: "櫃門開著", closed: "櫃門已關上" },
  },
  blinds: {
    initial: "open",
    choices: { open: "拉起百葉簾", closed: "放下百葉簾" },
    labels: { open: "窗外的光透進來", closed: "百葉簾已放下" },
  },
  fabric: {
    initial: "original",
    choices: { original: "原來的配色", rose: "換成玫瑰色", blue: "換成霧藍色" },
    labels: {
      original: "原來的抱枕配色",
      rose: "換上玫瑰色抱枕",
      blue: "換上霧藍色抱枕",
    },
  },
  bell: {
    initial: "quiet",
    choices: { rung: "按一下鈴", quiet: "讓鈴靜下來" },
    labels: { quiet: "服務鈴靜靜放著", rung: "叮——清脆的一聲響起" },
  },
};
export function sourcePoint(room, x, y) {
  const [cx, cy, cw, ch] = room.crop || [0, 0, 1536, 1024];
  return {
    x: room.rect.x + ((x - cx) * room.rect.width) / cw,
    y: room.rect.y + ((y - cy) * room.rect.height) / ch,
  };
}
const rectangle = (room, [x, y, w, h]) =>
  [
    [x, y],
    [x + w, y],
    [x + w, y + h],
    [x, y + h],
  ].map(([a, b]) => sourcePoint(room, a, b));
const bounds = (points) => ({
  x: Math.min(...points.map((p) => p.x)),
  y: Math.min(...points.map((p) => p.y)),
  right: Math.max(...points.map((p) => p.x)),
  bottom: Math.max(...points.map((p) => p.y)),
});
export function registerSceneObjects(rooms) {
  for (const [sceneId, room] of Object.entries(rooms)) {
    const authored = room.objects;
    for (const item of authored) {
      item.kind = "service";
      item.response = `${item.name}就在這裡。走近一點，可以決定接下來要做什麼。`;
      item.collision = [];
      item.layer = ["travel", "business-exit"].includes(item.action)
        ? null
        : { polygon: item.hit };
    }
    const props = (SCENE_PROPS[sceneId] || []).map(
      ([id, name, rect, kind, appearance]) => {
        const hit = rectangle(room, rect),
          b = bounds(hit);
        return {
          id: `prop-${id}`,
          name,
          kind,
          action: "inspect",
          hit,
          x: (b.x + b.right) / 2,
          y: (b.y + b.bottom) / 2,
          target: { ...room.entry },
          collision: [],
          response: RESPONSES[kind],
          appearance: appearance || null,
          layer: { polygon: hit, source: rect },
        };
      },
    );
    room.objects = [...authored, ...props];
    // Collision remains a floor footprint, never the image's visual silhouette.
    // These records are the single collision source; legacy blocks is a derived view.
    const obstacles = room.blocks.map((polygon, index) => ({
      id: `obstacle-${index}`,
      kind: "obstacle",
      visible: false,
      collision: [polygon],
    }));
    room.entities = [...room.objects, ...obstacles];
    Object.defineProperty(room, "blocks", {
      enumerable: true,
      configurable: true,
      get: () => room.entities.flatMap((e) => e.collision),
    });
    room.schemaVersion = 1;
  }
}
export function appearanceValue(state, sceneId, item) {
  const definition = APPEARANCES[item.appearance];
  if (!definition) return null;
  const saved = state.objectStates?.[sceneId]?.[item.id];
  return Object.hasOwn(definition.choices, saved) ? saved : definition.initial;
}
export function normalizeObjectStates(raw, rooms) {
  const result = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return result;
  for (const [sceneId, room] of Object.entries(rooms)) {
    for (const item of room.objects) {
      const value = raw[sceneId]?.[item.id],
        definition = APPEARANCES[item.appearance];
      if (
        definition &&
        typeof value === "string" &&
        Object.hasOwn(definition.choices, value)
      ) {
        result[sceneId] ||= {};
        result[sceneId][item.id] = value;
      }
    }
  }
  return result;
}
export function setObjectAppearance(state, rooms, itemId, value) {
  const item = rooms[state.sceneId]?.objects.find((o) => o.id === itemId),
    definition = APPEARANCES[item?.appearance];
  if (!definition || !Object.hasOwn(definition.choices, value)) return false;
  state.objectStates ||= {};
  state.objectStates[state.sceneId] ||= {};
  state.objectStates[state.sceneId][itemId] = value;
  return true;
}
export function canReturnHome(state, busy = false) {
  return (
    state.sceneId !== "home" &&
    !busy &&
    !state.dialogue &&
    !state.life.storyStage &&
    !state.life.game.pixelPrologueActive &&
    !state.life.game.activeEvent &&
    !state.life.pending
  );
}
// Prefer small props over large furniture only inside their actual hit regions.
export function pickObject(objects, point, inside) {
  return (
    objects
      .filter((o) => inside(point, o.hit))
      .sort((a, b) => {
        const aa = bounds(a.hit),
          bb = bounds(b.hit);
        return (
          (aa.right - aa.x) * (aa.bottom - aa.y) -
          (bb.right - bb.x) * (bb.bottom - bb.y)
        );
      })[0] || null
  );
}
