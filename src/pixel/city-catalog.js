import { MAP_LOCATIONS } from "../data/map-locations.js";
export const CITY_CATALOG = {
  film_company: {
    name: "極光影業",
    district: "影視與劇場",
    note: "查看電影徵選、投遞劇本、登記片場零工",
  },
  studio: {
    name: "十七號攝影棚",
    district: "影視與劇場",
    note: "場務登記、工作報到、觀看拍攝",
  },
  rehearsal: {
    name: "映畫排練室",
    district: "影視與劇場",
    note: "表演訓練、排戲、同學交流",
  },
  theatre: {
    name: "星河小劇場",
    district: "影視與劇場",
    note: "觀看演出、工作坊登記、舞台工作",
  },
  record_company: {
    name: "迴響唱片",
    district: "音樂街區",
    note: "遞交 Demo、看歌曲工作、登記助理機會",
  },
  recording: {
    name: "迴聲錄音室",
    district: "音樂街區",
    note: "歌唱訓練、聲線練習、錄音報到",
  },
  livehouse: {
    name: "月蝕 Live House",
    district: "音樂街區",
    note: "看演出、查 Open Mic、演出與音樂交流",
  },
  tv_company: {
    name: "星曜電視台",
    district: "傳媒與商務",
    note: "公開資訊、棚務助理、活動零工",
  },
  radio: {
    name: "星望廣播電臺",
    district: "傳媒與商務",
    note: "認識主持工作、參觀、主持訓練與錄製",
  },
  business: {
    name: "星環商務中心",
    district: "傳媒與商務",
    note: "找經紀公司、查看拜訪條件、安排會談",
  },
  media_company: {
    name: "稜鏡娛樂製作",
    district: "傳媒與商務",
    note: "廣告徵選、形象企劃投稿、商拍助理登記",
  },
  library: {
    name: "星望市立圖書館",
    district: "舊城與學院",
    note: "資料研究、閱讀、創作準備",
  },
  cafe: {
    name: "晨星咖啡館",
    district: "舊城與學院",
    note: "點餐、讀劇本、寫作、碰面與約會",
  },
  cinema: {
    name: "星輝電影院",
    district: "舊城與學院",
    note: "買票觀影、映後交流、約看電影",
  },
  gallery: {
    name: "白牆藝廊",
    district: "舊城與學院",
    note: "看展、翻展冊、攝影與時尚交流",
  },
  market: {
    name: "週末文創市集",
    district: "舊城與學院",
    note: "逛攤、購物、街頭表演與認識攤主",
  },
  temple: {
    name: "星望天后宮",
    district: "舊城與學院",
    note: "參拜、求籤、休息、聽地方故事",
  },
  dance: {
    name: "Pulse 舞蹈教室",
    district: "生活與訓練",
    note: "報名舞蹈課、練習、找舞伴",
  },
  gym: {
    name: "雲雀健身中心",
    district: "生活與訓練",
    note: "體能課程介紹、健身、休息補水",
  },
  shop: {
    name: "星光購物商場",
    district: "生活與訓練",
    note: "挑選衣服、試穿搭配、購買新衣",
  },
  beauty: {
    name: "晨光美容沙龍",
    district: "生活與訓練",
    note: "造型諮詢、保養與妝髮整理",
  },
  clinic: {
    name: "星望整形外科",
    district: "生活與訓練",
    note: "外貌諮詢與個人形象調整",
  },
  restaurant: {
    name: "夜光餐酒館",
    district: "生活與訓練",
    note: "用餐、慶功聚會、邀約與職涯交流",
  },
  park: {
    name: "星光河濱公園",
    district: "河岸與海灣",
    note: "散步、慢跑、休息與偶遇",
  },
  beach: {
    name: "月灣海灘",
    district: "河岸與海灣",
    note: "散步、看夕陽、休息與約會",
  },
  airport: {
    name: "星望國際機場",
    district: "河岸與海灣",
    note: "進入公共航廈、接送與劇情碰面",
  },
  home: {
    name: "我的住處",
    district: "住處與公司內部",
    note: "排程、手機、創作、換裝、休息",
  },
  agency_starlight: {
    name: "星光藝能",
    district: "住處與公司內部",
    note: "了解條件、投遞履歷、安排面談",
  },
  agency_mirror: {
    name: "映界文化",
    district: "住處與公司內部",
    note: "演員履歷諮詢、面談與角色規劃",
  },
  agency_clearvoice: {
    name: "澄音娛樂",
    district: "住處與公司內部",
    note: "音樂履歷與 Demo 接洽、面談",
  },
  agency_tide: {
    name: "浪潮媒體",
    district: "住處與公司內部",
    note: "主持與社群作品接洽、面談",
  },
  editing_room: {
    name: "深夜剪輯室",
    district: "住處與公司內部",
    note: "剪輯素材、核對分鏡與討論作品",
  },
};

export const MAP_ROWS = [
  ["home", "film_company", "studio", "rehearsal", "theatre", "cinema"],
  ["record_company", "recording", "livehouse", "tv", "radio", "media_company"],
  ["business", "gallery", "library", "cafe", "shop", "beauty"],
  ["dance", "gym", "clinic", "restaurant", "market", "temple"],
  ["park", "beach", "airport"],
];
// Centers are measured from the organic city illustration, not a row/column grid.
export const CITY_COORDINATES = {
  home: [10.5, 19.5],
  film_company: [28, 16],
  studio: [43, 14],
  rehearsal: [38.5, 27],
  theatre: [58.5, 19],
  cinema: [75, 18],
  record_company: [11, 40.3],
  recording: [26.8, 40],
  livehouse: [40.5, 42],
  tv: [86, 35],
  radio: [79, 47],
  media_company: [68, 39],
  business: [53.5, 35.8],
  gallery: [33, 55],
  library: [49, 56],
  cafe: [25, 68],
  shop: [66, 57],
  beauty: [79, 61],
  dance: [10, 57],
  gym: [8.6, 75],
  clinic: [39.5, 70],
  restaurant: [53, 75],
  market: [65, 74.5],
  temple: [79, 78],
  park: [11, 88],
  beach: [93, 58],
  airport: [87.4, 13],
};
export const CITY_PLACES = MAP_ROWS.flat().map((id) => ({
  id,
  venue: id === "tv" ? "tv_company" : id,
  name:
    id === "home"
      ? "我的住處"
      : MAP_LOCATIONS[id === "tv" ? "tv_company" : id].name,
  short: {
    home: "我的住處",
    film_company: "極光影業",
    studio: "十七號攝影棚",
    rehearsal: "映畫排練室",
    theatre: "星河小劇場",
    cinema: "星輝電影院",
    record_company: "迴響唱片",
    recording: "迴聲錄音室",
    livehouse: "月蝕 Live House",
    tv: "星曜電視台",
    radio: "星望廣播",
    media_company: "稜鏡製作",
    business: "星環商務中心",
    gallery: "白牆藝廊",
    library: "市立圖書館",
    cafe: "晨星咖啡館",
    shop: "星光購物商場",
    beauty: "晨光美容沙龍",
    dance: "Pulse 舞蹈教室",
    gym: "雲雀健身中心",
    clinic: "星望診所",
    restaurant: "夜光餐酒館",
    market: "文創市集",
    temple: "天后宮",
    park: "河濱公園",
    beach: "月灣海灘",
    airport: "國際機場",
  }[id],
  x: CITY_COORDINATES[id][0],
  y: CITY_COORDINATES[id][1],
  district: CITY_CATALOG[id === "tv" ? "tv_company" : id].district,
  description:
    MAP_LOCATIONS[id === "tv" ? "tv_company" : id]?.note ||
    "放下行李，安排接下來的生活。",
}));
export const AGENCY_ROOMS = [
  "agency_starlight",
  "agency_mirror",
  "agency_clearvoice",
  "agency_tide",
];
export const hiddenRoomOpen = (state) =>
  state.knownPeople?.includes("silver_pc") ||
  state.life?.game?.knownPeople?.includes("silver_pc");
export const publicRoom = (id) =>
  id.startsWith("agency_")
    ? "business"
    : id === "editing_room"
      ? "gallery"
      : id;
