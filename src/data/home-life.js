export const HOME_SLOTS = Object.freeze({
  bed: "床與寢具",
  window: "窗簾",
  sofa: "沙發",
  wall: "牆面紀念",
  table: "茶几擺飾",
});

export const HOME_ITEMS = Object.freeze({
  starter_bed: {
    name: "搬家時的單人床",
    slot: "bed",
    price: 0,
    icon: "▰",
    starter: true,
    note: "剛來星望市時陪你睡過許多忐忑的夜晚。",
  },
  linen_bed: {
    name: "晨霧亞麻床組",
    slot: "bed",
    price: 4200,
    icon: "▰",
    note: "洗過幾次後更柔軟，適合真正睡上一覺。",
  },
  blush_bed: {
    name: "晚霞玫瑰床組",
    slot: "bed",
    price: 6800,
    icon: "▰",
    note: "房間裡多了一點不急著長大的顏色。",
  },
  starter_blinds: {
    name: "原木百葉簾",
    slot: "window",
    price: 0,
    icon: "▥",
    starter: true,
    note: "把早晨切成一格一格的光。",
  },
  sheer_curtain: {
    name: "薄霧白紗簾",
    slot: "window",
    price: 3600,
    icon: "▥",
    note: "光線變得柔和，自拍也少跟陰影吵架。",
  },
  midnight_curtain: {
    name: "午夜藍遮光簾",
    slot: "window",
    price: 5200,
    icon: "▥",
    note: "晚班回家，也能好好睡到自然醒。",
  },
  starter_sofa: {
    name: "租屋處的小沙發",
    slot: "sofa",
    price: 0,
    icon: "▱",
    starter: true,
    note: "不算寬，但足夠留一個人的位置。",
  },
  rose_sofa: {
    name: "玫瑰絨布沙發",
    slot: "sofa",
    price: 7600,
    icon: "▱",
    note: "坐下來的人，通常會比預計多聊一會。",
  },
  blue_sofa: {
    name: "霧藍雙人沙發",
    slot: "sofa",
    price: 8200,
    icon: "▱",
    note: "兩個人並肩坐著，也不必急著找話題。",
  },
  blank_wall: {
    name: "留白的牆",
    slot: "wall",
    price: 0,
    icon: "□",
    starter: true,
    note: "等一段真正值得掛起來的故事。",
  },
  cork_board: {
    name: "生活軟木牆",
    slot: "wall",
    price: 2600,
    icon: "▦",
    note: "票根、拍立得與便條紙終於各有位置。",
  },
  starter_plant: {
    name: "窗邊小盆栽",
    slot: "table",
    price: 0,
    icon: "♧",
    starter: true,
    note: "它和你一起適應了這座城市。",
  },
  record_player: {
    name: "二手黑膠唱機",
    slot: "table",
    price: 5900,
    icon: "◉",
    note: "唱針落下後，房間開始有自己的聲音。",
  },
  tea_set: {
    name: "兩人份陶杯",
    slot: "table",
    price: 3200,
    icon: "♨",
    note: "買的是兩只杯子；另一只給誰，暫時不寫答案。",
  },
});

export const SUPPLIES = Object.freeze({
  pantry: {
    name: "烘焙材料包",
    price: 900,
    icon: "♨",
    contents: { flour: 2, sugar: 2, cocoa: 1 },
  },
  kitchen: {
    name: "料理材料包",
    price: 1100,
    icon: "▤",
    contents: { rice: 2, vegetables: 2, spice: 1 },
  },
  craft: {
    name: "手作材料包",
    price: 1200,
    icon: "✦",
    contents: { thread: 2, beads: 2, metal: 1 },
  },
});

export const MATERIAL_LABELS = Object.freeze({
  flour: "麵粉",
  sugar: "糖",
  cocoa: "可可",
  rice: "米",
  vegetables: "蔬菜",
  spice: "香料",
  thread: "線材",
  beads: "珠飾",
  metal: "金屬配件",
});

export const HOME_RECIPES = Object.freeze({
  cocoa_cookie: {
    name: "可可星星餅乾",
    type: "烘焙",
    icon: "★",
    needs: { flour: 1, sugar: 1, cocoa: 1 },
    stat: "學識",
    tags: ["sweet", "coffee"],
    effect: { mood: 6 },
    note: "形狀不一定完美，但每一塊都很認真。",
  },
  rice_box: {
    name: "深夜暖胃飯盒",
    type: "料理",
    icon: "▣",
    needs: { rice: 1, vegetables: 1, spice: 1 },
    stat: "學識",
    tags: ["meal", "health"],
    effect: { stamina: 10, fatigue: -4 },
    note: "適合忙到忘記吃飯的人，也適合今天的自己。",
  },
  charm: {
    name: "小小星願吊飾",
    type: "手作",
    icon: "✦",
    needs: { thread: 1, beads: 1, metal: 1 },
    stat: "時尚",
    tags: ["cute", "fashion"],
    effect: { mood: 4 },
    note: "不昂貴，卻能證明有人把一句喜歡記在心上。",
  },
  lyric_card: {
    name: "手寫歌詞卡",
    type: "手作",
    icon: "♫",
    needs: { thread: 1, beads: 1 },
    stat: "創作",
    tags: ["music", "handmade"],
    effect: { mood: 5 },
    note: "留下沒有公開過的一句話，字跡比印刷更誠實。",
  },
});

export const HOME_VISIT_ACTIVITIES = Object.freeze({
  dinner: {
    name: "一起吃晚餐",
    icon: "♨",
    note: "聊聊最近的工作，也照顧彼此有沒有好好吃飯。",
    scene: "你們把晚餐分成兩份，聊到食物都快涼了，才笑著提醒彼此先吃。",
  },
  rehearsal: {
    name: "在家對戲",
    icon: "▤",
    note: "把客廳暫時借給另一個世界。",
    scene:
      "劇本攤在茶几上，同一句台詞換了幾種接法；念錯的地方成了今晚最先笑出聲的時刻。",
  },
  demo: {
    name: "聽試錄音",
    icon: "♫",
    note: "分享還沒有公開、也還不完美的版本。",
    scene: "你們聽完一段試錄，先說留下印象的地方，再把想重聽的一句倒回去。",
  },
  movie: {
    name: "窩著看電影",
    icon: "▶",
    note: "不談工作也可以，只把夜晚留給彼此。",
    scene: "電影播到片尾，你們沒有立刻起身，還在為剛才的伏筆各自提出證據。",
  },
});

export const NPC_HOME_VOICES = Object.freeze({
  jiqing: {
    favorite: ["coffee", "sweet"],
    keepsake: "深夜節目票根",
    visit: "她順手把兩只杯子移到最舒服的位置，笑著說這裡比錄音間更適合講真話。",
    gift: "她沒有急著拆完，只先問你：『這次換我好好接住妳的心意，可以嗎？』",
  },
  shenyao: {
    favorite: ["coffee", "rehearsal"],
    keepsake: "寫滿註記的台詞頁",
    visit:
      "他環視房間一圈，最後只說光線很好；坐下後，才把工作訊息調成靜音。",
    gift: "他端詳成品很久，低聲說：『準備得比妳自己以為的完整。』",
  },
  tangtang: {
    favorite: ["sweet", "cute"],
    keepsake: "星梨畫的抱枕名牌",
    visit:
      "她一進門便注意到所有可愛的小東西，最後抱著抱枕宣布這個位置暫時歸她。",
    gift: "她眼睛亮起來，還沒收好就已經開始想要掛在哪裡。",
  },
  guchengxi: {
    favorite: ["meal", "music"],
    keepsake: "沒有發行的試聽帶",
    visit: "他沒有把沉默當成尷尬，坐下後先問你今天想先休息還是先說話。",
    gift: "他笑著收下，說下次也會帶一件只屬於你們的東西來。",
  },
  linxiafan: {
    favorite: ["fashion", "handmade"],
    keepsake: "手寫配色便條",
    visit: "她先挑剔了三句配色，第四句卻是：『這裡很像妳。這是稱讚。』",
    gift: "她摸過收邊，嘴上仍然嚴格，卻已經替它想好最適合的位置。",
  },
  lujingran: {
    favorite: ["music", "handmade"],
    keepsake: "一枚舊吉他撥片",
    visit: "他在門口把耳機收好，進屋後才繼續剛才的話題，不急著替沉默找答案。",
    gift: "他把成品握在掌心，過了一會才說：『我會留著。不是客套。』",
  },
  xiayutong: {
    favorite: ["meal", "cute"],
    keepsake: "臨時節目企劃卡",
    visit:
      "她剛坐下就冒出三個節目點子，看見你把手機翻面放下，才笑著說今晚可以讓企劃休假。",
    gift: "她立刻替這份禮物取了誇張的企劃名稱，笑聲比包裝紙還先散開。",
  },
  hanzhiyuan: {
    favorite: ["health", "meal"],
    keepsake: "被闔上的行事曆書籤",
    visit: "他本來還想談下週安排，坐下後，終於把行事曆闔上了一次。",
    gift: "他確認你沒有為此透支預算，才把神情放柔：『心意收到。下次先顧好自己。』",
  },
  sufei: {
    favorite: ["rehearsal", "sweet"],
    keepsake: "對戲用的鉛筆",
    visit:
      "她把隨身的劇本收進包裡，嘴上說只是順路，卻記得你上次提過喜歡靠窗的位置。",
    gift: "她先說不用特別準備，收進包裡的動作卻比誰都仔細。",
  },
  chengyian: {
    favorite: ["handmade", "fashion"],
    keepsake: "未公開的拍立得",
    visit: "他蹲在窗邊看光落進來的角度，問你可不可以只拍一張、不公開的照片。",
    gift: "他沒有立刻拍照，只用手指記住不完美的紋理，說這才像是你做的。",
  },
  silver_pc: {
    favorite: ["handmade", "music"],
    keepsake: "唯讀備份晶片",
    visit: "她看著房裡留下的紀念物，淡淡地說：『原始檔還在。這很好。』",
    gift: "她收下後替它建了一份不會覆寫的備份，像在承認這次相遇值得留下。",
  },
});
