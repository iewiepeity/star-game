import { MAP_LOCATIONS } from "../data/map-locations.js";
export const CITY_CATALOG = {
  film_company: {
    name: "極光影業",
    district: "影視與劇場",
    note: "查看電影徵選、投遞劇本、登記片場零工",
    gate: "大廳公開；試鏡室須有通知，不能進門直接簽約。",
  },
  studio: {
    name: "十七號攝影棚",
    district: "影視與劇場",
    note: "場務登記、工作報到、觀看拍攝",
    gate: "拍攝中保持安全距離；共演與工作檔期決定誰在場。",
  },
  rehearsal: {
    name: "映畫排練室",
    district: "影視與劇場",
    note: "表演訓練、排戲、同學交流",
    gate: "可直接報名課程；完成課程才會獲得能力成長。",
  },
  theatre: {
    name: "星河小劇場",
    district: "影視與劇場",
    note: "觀看演出、工作坊登記、舞台工作",
    gate: "觀眾區可進；排練與後台依工作或邀請開放。",
  },
  record_company: {
    name: "迴響唱片",
    district: "音樂街區",
    note: "遞交 Demo、看歌曲工作、登記助理機會",
    gate: "收件不等於錄取；製作會談依通知開放。",
  },
  recording: {
    name: "迴聲錄音室",
    district: "音樂街區",
    note: "歌唱訓練、聲線練習、錄音報到",
    gate: "錄音中 NPC 顯示忙碌；未預約不可打斷錄製。",
  },
  livehouse: {
    name: "月蝕 Live House",
    district: "音樂街區",
    note: "看演出、查 Open Mic、演出與音樂交流",
    gate: "演出前後可聊天；演唱中以觀看或散場後再談為主。",
  },
  tv_company: {
    name: "星曜電視台",
    district: "傳媒與商務",
    note: "公開資訊、棚務助理、活動零工",
    gate: "公開徵選與內部通告分流，檔期符合才報到。",
  },
  radio: {
    name: "星望廣播電臺",
    district: "傳媒與商務",
    note: "認識主持工作、參觀、主持訓練與錄製",
    gate: "ON AIR 期間不能直接對主持人開長對話。",
  },
  business: {
    name: "星環商務中心",
    district: "傳媒與商務",
    note: "找經紀公司、查看拜訪條件、安排會談",
    gate: "可查看公司資訊；接洽、投遞、面談、簽約各有條件。",
  },
  media_company: {
    name: "稜鏡娛樂製作",
    district: "傳媒與商務",
    note: "廣告徵選、形象企劃投稿、商拍助理登記",
    gate: "商業拍攝區依工作授權；布告欄可自由查看。",
  },
  library: {
    name: "星望市立圖書館",
    district: "舊城與學院",
    note: "資料研究、閱讀、創作準備",
    gate: "閱讀是明確活動；繞書架不累加收益。",
  },
  cafe: {
    name: "晨星咖啡館",
    district: "舊城與學院",
    note: "點餐、讀劇本、寫作、碰面與約會",
    gate: "NPC 是候選出沒名單，依當天檔期擇一兩位出現。",
  },
  cinema: {
    name: "星輝電影院",
    district: "舊城與學院",
    note: "買票觀影、映後交流、約看電影",
    gate: "觀影時收起嘈雜提示，散場再互動。",
  },
  gallery: {
    name: "白牆藝廊",
    district: "舊城與學院",
    note: "看展、翻展冊、攝影與時尚交流",
    gate: "隱藏人物依既有劇情條件才出現。",
  },
  market: {
    name: "週末文創市集",
    district: "舊城與學院",
    note: "逛攤、購物、街頭表演與認識攤主",
    gate: "平日場地可走；週末攤位與活動才完整出現。",
  },
  temple: {
    name: "星望天后宮",
    district: "舊城與學院",
    note: "參拜、求籤、休息、聽地方故事",
    gate: "不把宗教場景當成刷能力跑圈地點。",
  },
  dance: {
    name: "Pulse 舞蹈教室",
    district: "生活與訓練",
    note: "報名舞蹈課、練習、找舞伴",
    gate: "鏡子中的反射不是第二位玩家，不可獨立互動。",
  },
  gym: {
    name: "雲雀健身中心",
    district: "生活與訓練",
    note: "體能課程介紹、健身、休息補水",
    gate: "器材被占用時候位或選其他器材，不穿過使用者。",
  },
  shop: {
    name: "星光購物商場",
    district: "生活與訓練",
    note: "看衣服、插畫試穿、購買後同步像素造型",
    gate: "只有玩家選中的 avatar 出現；試穿預覽不生成第二個玩家實體。",
  },
  beauty: {
    name: "晨光美容沙龍",
    district: "生活與訓練",
    note: "造型諮詢、保養、查看完成後插畫",
    gate: "服務費用與效果在確認前簡短顯示。",
  },
  clinic: {
    name: "星望整形外科",
    district: "生活與訓練",
    note: "諮詢、既有外貌與性別設定相關服務",
    gate: "私密諮詢內不安排無關 NPC 閒晃或突發搭訕。",
  },
  restaurant: {
    name: "夜光餐酒館",
    district: "生活與訓練",
    note: "用餐、慶功聚會、邀約與職涯交流",
    gate: "包廂須訂位；不因看到名人就強制觸發親密事件。",
  },
  park: {
    name: "星光河濱公園",
    district: "河岸與海灣",
    note: "散步、慢跑、休息與偶遇",
    gate: "NPC 以散步、坐下、離開為主，不機械原地轉圈。",
  },
  beach: {
    name: "月灣海灘",
    district: "河岸與海灣",
    note: "散步、看夕陽、休息與約會",
    gate: "角色停在可走岸線，不踏入不可通行的海面。",
  },
  airport: {
    name: "星望國際機場",
    district: "河岸與海灣",
    note: "進入公共航廈、接送與劇情碰面",
    gate: "公共航廈可探索；海外發展保留既有第二年、知名度 80、完成 3 部作品門檻，符合條件後從出發服務點進入。",
  },
  home: {
    name: "玩家住處",
    district: "住處與公司內部",
    note: "排程、手機、創作、換裝、休息",
    gate: "正式場景只有所選主角；不拿其他外型填滿房間。",
  },
  agency_starlight: {
    name: "星光藝能",
    district: "住處與公司內部",
    note: "了解條件、投遞履歷、安排面談",
    gate: "公司位於商務中心；簽約與內部資源依原有條件開放。",
  },
  agency_mirror: {
    name: "映界文化",
    district: "住處與公司內部",
    note: "演員履歷諮詢、面談與角色規劃",
    gate: "讀本與內部合作依身分與通知開放。",
  },
  agency_clearvoice: {
    name: "澄音娛樂",
    district: "住處與公司內部",
    note: "音樂履歷與 Demo 接洽、面談",
    gate: "練習與宣傳資源須有合約或正式邀請。",
  },
  agency_tide: {
    name: "浪潮媒體",
    district: "住處與公司內部",
    note: "主持與社群作品接洽、面談",
    gate: "提案展示不等於立刻獲得通告。",
  },
  editing_room: {
    name: "深夜剪輯室",
    district: "住處與公司內部",
    note: "隱藏人物影像合作與私人劇情",
    gate: "既有隱藏人物線解鎖後才開放，不在新手地圖直接暴露。",
  },
};

export const MAP_ROWS = [
  ["home", "film_company", "studio", "rehearsal", "theatre", "cinema"],
  ["record_company", "recording", "livehouse", "tv", "radio", "media_company"],
  ["business", "gallery", "library", "cafe", "shop", "beauty"],
  ["dance", "gym", "clinic", "restaurant", "market", "temple"],
  ["park", "beach", "airport"],
];
export const CITY_PLACES = MAP_ROWS.flat().map((id, i) => ({
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
  x: [12, 27, 42.2, 57.1, 72.2, 87][i % 6],
  y: [19, 34, 50, 66, 83][Math.floor(i / 6)],
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
