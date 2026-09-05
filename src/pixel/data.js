import { NPCS } from "../data/npcs.js";
import { OUTFITS, portraitAsset } from "../data/wardrobe.js";
export const WORLD = { width: 960, height: 640, grid: 12 };
const p = (x, y) => ({ x: x * 0.625, y: y * 0.625 });
const poly = (points) => points.map(([x, y]) => p(x, y));
const object = (id, name, icon, x, y, tx, ty, action) => ({
  id,
  name,
  icon,
  ...p(x, y),
  target: p(tx, ty),
  action,
});
export const ROOMS = {
  home: {
    name: "我的住處",
    subtitle: "一切從這個小房間開始",
    color: "#b29a7a",
    entry: p(1180, 810),
    floor: poly([
      [96, 520],
      [566, 345],
      [1000, 494],
      [1410, 600],
      [1380, 750],
      [990, 970],
      [626, 970],
      [175, 735],
    ]),
    blocks: [
      poly([
        [90, 470],
        [304, 330],
        [550, 448],
        [550, 520],
        [345, 600],
      ]),
      poly([
        [670, 357],
        [876, 363],
        [1080, 455],
        [1020, 520],
        [700, 480],
      ]),
      poly([
        [1030, 430],
        [1380, 550],
        [1330, 630],
        [1050, 540],
      ]),
      poly([
        [625, 638],
        [746, 574],
        [883, 636],
        [883, 671],
        [747, 750],
        [625, 691],
      ]),
    ],
    foreground: [
      {
        depth: 735,
        polygon: poly([
          [625, 633],
          [706, 586],
          [755, 565],
          [808, 593],
          [881, 628],
          [876, 681],
          [754, 739],
          [737, 740],
          [735, 709],
          [651, 682],
          [654, 695],
          [638, 696],
        ]),
      },
    ],
    objects: [
      object("wardrobe", "衣櫃", "衣", 592, 290, 624, 443, "wardrobe"),
      object("desk", "筆記與手機", "✎", 850, 350, 881, 545, "desk"),
      object("bed", "休息一下", "☾", 337, 405, 575, 590, "rest"),
      object("door", "出門", "↗", 1320, 711, 1200, 821, "travel"),
    ],
    route: [p(600, 650), p(1050, 760)],
  },
  rehearsal: {
    name: "星望排練室",
    subtitle: "練習，是夢想的第一步",
    color: "#8e9d8a",
    entry: p(1220, 790),
    floor: poly([
      [100, 590],
      [600, 310],
      [948, 311],
      [1430, 565],
      [1410, 721],
      [1074, 930],
      [433, 930],
    ]),
    blocks: [
      poly([
        [634, 682],
        [758, 609],
        [857, 667],
        [856, 712],
        [740, 777],
        [636, 719],
      ]),
      poly([
        [953, 308],
        [1067, 350],
        [1080, 408],
        [978, 436],
        [916, 395],
      ]),
      poly([
        [1136, 429],
        [1285, 480],
        [1320, 495],
        [1290, 530],
        [1110, 470],
      ]),
    ],
    foreground: [
      {
        depth: 770,
        polygon: poly([
          [646, 678],
          [762, 614],
          [852, 663],
          [850, 710],
          [740, 774],
          [647, 720],
        ]),
      },
    ],
    objects: [
      object("practice", "鏡前練習", "♪", 610, 391, 755, 530, "practice"),
      object("notice", "課程公告", "!", 1250, 355, 1170, 540, "notice"),
      object("script", "讀本桌", "▤", 1007, 300, 992, 466, "script"),
      object("door", "離開排練室", "↗", 1374, 632, 1220, 790, "travel"),
    ],
    route: [p(570, 590), p(1000, 515), p(1160, 740)],
  },
  cafe: {
    name: "晨星咖啡館",
    subtitle: "偶遇，也需要留一點空白",
    color: "#b58b82",
    entry: p(962, 827),
    floor: poly([
      [116, 552],
      [875, 381],
      [1389, 583],
      [1380, 631],
      [1070, 849],
      [845, 900],
      [490, 901],
      [113, 655],
    ]),
    blocks: [
      poly([
        [487, 536],
        [610, 473],
        [747, 554],
        [775, 641],
        [638, 712],
        [502, 644],
      ]),
      poly([
        [930, 429],
        [1050, 370],
        [1190, 443],
        [1205, 520],
        [1083, 567],
        [953, 530],
      ]),
    ],
    foreground: [
      {
        depth: 692,
        polygon: poly([
          [507, 545],
          [530, 484],
          [590, 476],
          [608, 510],
          [653, 502],
          [710, 544],
          [749, 552],
          [774, 617],
          [748, 653],
          [673, 686],
          [626, 701],
          [553, 660],
          [523, 617],
        ]),
      },
      {
        depth: 550,
        polygon: poly([
          [929, 434],
          [953, 371],
          [1000, 354],
          [1031, 384],
          [1112, 359],
          [1175, 394],
          [1203, 455],
          [1206, 514],
          [1144, 545],
          [1084, 568],
          [967, 524],
        ]),
      },
    ],
    objects: [
      object("counter", "點一杯熱飲", "☕", 702, 337, 793, 495, "coffee"),
      object("window", "窗邊座位", "☀", 1144, 412, 1240, 589, "window"),
      object("door", "走回街上", "↗", 998, 884, 963, 818, "travel"),
    ],
    route: [p(810, 676), p(1160, 667), p(854, 515)],
  },
};
// Visual hit areas cover the furniture itself; idle scenes have no floating icons.
const HIT_AREAS = {
  home: {
    wardrobe: [
      [493, 92],
      [685, 104],
      [685, 363],
      [493, 363],
    ],
    desk: [
      [692, 277],
      [996, 348],
      [1000, 465],
      [696, 418],
    ],
    bed: [
      [109, 285],
      [312, 250],
      [537, 435],
      [531, 504],
      [337, 586],
      [110, 493],
    ],
    door: [
      [1248, 659],
      [1370, 594],
      [1370, 792],
      [1248, 847],
    ],
    sofa: [
      [1050, 404],
      [1147, 386],
      [1368, 477],
      [1366, 562],
      [1287, 609],
      [1050, 518],
    ],
    "desk-seat": [
      [701, 349],
      [780, 370],
      [810, 417],
      [798, 467],
      [704, 443],
    ],
  },
  rehearsal: {
    practice: [
      [104, 396],
      [568, 146],
      [569, 342],
      [107, 601],
    ],
    notice: [
      [1151, 279],
      [1320, 360],
      [1320, 440],
      [1152, 361],
    ],
    script: [
      [935, 255],
      [1065, 296],
      [1091, 375],
      [951, 406],
    ],
    door: [
      [1322, 623],
      [1420, 564],
      [1422, 743],
      [1324, 798],
    ],
    bench: [
      [1132, 353],
      [1321, 442],
      [1320, 493],
      [1134, 425],
    ],
  },
  cafe: {
    counter: [
      [187, 323],
      [558, 138],
      [866, 254],
      [864, 420],
      [433, 543],
      [185, 493],
    ],
    window: [
      [1090, 453],
      [1188, 418],
      [1193, 525],
      [1115, 557],
      [1080, 508],
    ],
    chair: [
      [658, 593],
      [750, 551],
      [757, 645],
      [704, 692],
      [653, 649],
    ],
    door: [
      [888, 806],
      [1047, 807],
      [1049, 920],
      [888, 929],
    ],
  },
};
ROOMS.home.objects.push(
  object("sofa", "沙發", "", 1200, 493, 1150, 657, "sit"),
  object("desk-seat", "書桌椅", "", 750, 411, 833, 535, "sit"),
);
ROOMS.rehearsal.objects.push(
  object("bench", "休息長椅", "", 1220, 440, 1180, 554, "sit"),
);
ROOMS.cafe.objects.push(
  object("chair", "咖啡座位", "", 697, 608, 804, 703, "sit"),
);
for (const [id, room] of Object.entries(ROOMS))
  for (const item of room.objects) {
    item.hit = poly(HIT_AREAS[id][item.id]);
  }
export const ACTIVITY_TYPES = {
  rest: {
    label: "躺下休息",
    duration: 5,
    flag: "rested",
    done: "休息了一會兒，肩膀也放鬆了。",
  },
  sit: { label: "坐一會兒", duration: 5, done: "讓自己慢一點，也很好。" },
  coffee: {
    label: "慢慢喝一杯",
    duration: 5,
    flag: "coffee",
    done: "熱飲暖暖的，今天可以慢慢來。",
  },
  dance: {
    label: "跟著節拍練習",
    duration: 6,
    flag: "practiced",
    done: "記住了這一段舞步，下次再練習。",
  },
  read: {
    label: "練習朗讀",
    duration: 6,
    flag: "practiced",
    done: "把台詞慢慢說完整，感覺更有把握了。",
  },
};
export const ACTIVITY_SPOTS = {
  home: {
    bed: {
      kinds: ["rest"],
      ...p(309, 418),
      center: true,
      width: 108,
      depth: 390,
    },
    sofa: {
      kinds: ["sit"],
      ...p(1148, 477),
      seat: { facing: "sw", height: 68 },
      depth: 390,
    },
    "desk-seat": {
      kinds: ["sit"],
      ...p(772, 405),
      seat: { facing: "ne", height: 68 },
      depth: 345,
      foreground: poly([
        [701, 352],
        [768, 375],
        [771, 424],
        [755, 432],
        [701, 410],
      ]),
    },
  },
  rehearsal: {
    practice: { kinds: ["dance", "read"] },
    script: { kinds: ["read"] },
    bench: {
      kinds: ["sit"],
      ...p(1226, 405),
      seat: { facing: "sw", height: 68 },
      depth: 340,
    },
  },
  cafe: {
    window: {
      kinds: ["sit", "coffee"],
      ...p(1127, 473),
      seat: { facing: "nw", height: 68 },
      depth: 355,
      foreground: poly([
        [1140, 449],
        [1183, 423],
        [1194, 432],
        [1193, 493],
        [1147, 521],
        [1135, 509],
      ]),
    },
    chair: {
      kinds: ["sit", "coffee"],
      ...p(692, 611),
      seat: { facing: "nw", height: 68 },
      depth: 440,
      foreground: poly([
        [704, 590],
        [746, 560],
        [756, 572],
        [754, 640],
        [705, 667],
        [693, 653],
      ]),
    },
  },
};
export function activityAllowed(sceneId, itemId, kind) {
  return !!ACTIVITY_SPOTS[sceneId]?.[itemId]?.kinds.includes(kind);
}
export const OUTFIT_IDS = ["newcomer", "practice", "audition"];
export const outfits = OUTFIT_IDS.map((id) => ({
  ...OUTFITS[id],
  portrait: portraitAsset("raven", id),
}));
export const PEOPLE = Object.fromEntries(
  ["sufei", "jiqing"].map((id) => [
    id,
    {
      id,
      name: NPCS[id].name,
      job: NPCS[id].job,
      portrait: NPCS[id].portrait,
      head: NPCS[id].head,
    },
  ]),
);
// One shared itinerary per person, regardless of the room the player is viewing.
export function itinerary(id, elapsed) {
  const t = ((elapsed % 180) + 180) % 180;
  if (id === "sufei") {
    if (t < 105)
      return {
        scene: "rehearsal",
        node: Math.floor(t / 18) % 3,
        status: t < 36 ? "暖身中" : "讀本休息",
        leaving: t > 94,
      };
    if (t < 120) return { scene: null, status: "前往咖啡館" };
    if (t < 165)
      return {
        scene: "cafe",
        node: Math.floor(t / 15) % 3,
        status: "練習後休息",
        leaving: t > 155,
      };
    return { scene: null, status: "前往排練室" };
  }
  if (t < 135)
    return {
      scene: "cafe",
      node: Math.floor(t / 19) % 3,
      status: t % 38 < 19 ? "整理節目筆記" : "等一杯咖啡",
      leaving: t > 124,
    };
  if (t < 152) return { scene: null, status: "外出接電話" };
  return { scene: "cafe", node: 1, status: "回來整理講稿", leaving: false };
}
export const CONVERSATIONS = {
  sufei: [
    {
      speaker: "sufei",
      text: "第一次來這裡？門邊有課程表。先看清楚時段，再決定自己想練什麼。",
    },
    { speaker: "player", text: "我剛搬來星望市，還在找開始的方法。" },
    {
      speaker: "sufei",
      text: "我是許映真。開始不用很漂亮，願意再來一次就很好。",
      choices: [
        {
          label: "請教怎麼準備試鏡",
          reply: "先讀懂角色在等什麼，再練台詞。別急著把每一句都演得很用力。",
        },
        {
          label: "讓她先休息",
          reply: "謝謝。等我喝口水，下次再聊。你也別把自己逼得太緊。",
        },
      ],
    },
  ],
  jiqing: [
    {
      speaker: "jiqing",
      text: "你在找座位嗎？窗邊還空著。我只是來把節目筆記整理完。",
    },
    { speaker: "player", text: "我剛到星望市，這裡的步調讓人鬆了一口氣。" },
    {
      speaker: "jiqing",
      text: "那先給自己一杯咖啡的時間吧。我叫喬映澄，在廣播電臺工作。",
      choices: [
        {
          label: "聊聊她的節目",
          reply:
            "最近想做「第一次來到這座城市」。等你想分享的時候，再告訴我你的故事。",
        },
        {
          label: "先各自享受咖啡",
          reply: "好呀。不急著說話，也是一種很舒服的相處。",
        },
      ],
    },
  ],
};

// Phase two: service points use the same navigation and object hit geometry.
function serviceRoom(name, subtitle, floor, objects, route, blocks = []) {
  return {
    name,
    subtitle,
    color: "#a99a7a",
    entry: p(976, 790),
    floor: poly(floor),
    blocks: blocks.map(poly),
    foreground: [],
    route: route.map(([x, y]) => p(x, y)),
    objects: objects.map(([id, name, x, y, tx, ty, action, hit]) => ({
      ...object(id, name, "", x, y, tx, ty, action),
      hit: poly(hit),
    })),
  };
}
ROOMS.tv = serviceRoom(
  "星曜電視台",
  "從幕後的一份工作開始",
  [
    [110, 610],
    [555, 398],
    [817, 366],
    [1367, 549],
    [1400, 598],
    [1039, 867],
    [518, 865],
  ],
  [
    [
      "reception",
      "臨時人員登記桌",
      365,
      435,
      573,
      537,
      "registration",
      [
        [177, 469],
        [448, 339],
        [526, 383],
        [523, 499],
        [265, 610],
        [180, 568],
      ],
    ],
    [
      "props",
      "棚務工作區",
      1019,
      312,
      981,
      529,
      "work",
      [
        [951, 154],
        [1095, 181],
        [1100, 425],
        [951, 367],
      ],
    ],
    [
      "door",
      "離開電視台",
      982,
      850,
      976,
      790,
      "travel",
      [
        [887, 744],
        [1096, 762],
        [1096, 938],
        [887, 940],
      ],
    ],
  ],
  [
    [643, 530],
    [873, 567],
    [1136, 629],
  ],
  [
    [
      [178, 483],
      [513, 379],
      [526, 495],
      [275, 620],
    ],
    [
      [822, 380],
      [842, 254],
      [932, 292],
      [951, 403],
    ],
  ],
);
ROOMS.shop = serviceRoom(
  "星光服飾店",
  "衣服也陪著你慢慢成長",
  [
    [115, 669],
    [369, 495],
    [569, 326],
    [951, 332],
    [1360, 530],
    [1416, 579],
    [1038, 886],
    [506, 897],
  ],
  [
    [
      "checkout",
      "服飾店櫃檯",
      367,
      342,
      578,
      477,
      "shop",
      [
        [229, 314],
        [475, 230],
        [534, 277],
        [530, 376],
        [334, 469],
        [231, 417],
      ],
    ],
    [
      "rack",
      "當季衣架",
      793,
      204,
      787,
      413,
      "shop",
      [
        [623, 88],
        [959, 105],
        [959, 321],
        [621, 311],
      ],
    ],
    [
      "mirror",
      "試衣鏡",
      1081,
      267,
      1045,
      485,
      "shop",
      [
        [1031, 153],
        [1120, 145],
        [1147, 392],
        [1022, 362],
      ],
    ],
    [
      "door",
      "離開服飾店",
      984,
      889,
      976,
      790,
      "travel",
      [
        [886, 776],
        [1091, 790],
        [1100, 966],
        [886, 976],
      ],
    ],
  ],
  [
    [669, 518],
    [1110, 594],
    [826, 706],
  ],
  [
    [
      [93, 528],
      [280, 446],
      [308, 517],
      [280, 607],
      [108, 669],
    ],
  ],
);
ACTIVITY_SPOTS.home.desk = { kinds: ["read"] };
ACTIVITY_SPOTS.rehearsal.notice = { kinds: ["read"] };
ACTIVITY_SPOTS.tv = {
  reception: { kinds: ["read"] },
  props: { kinds: ["read"] },
};
ACTIVITY_SPOTS.shop = {
  checkout: { kinds: ["read"] },
  rack: { kinds: ["read"] },
  mirror: { kinds: ["read"] },
};
