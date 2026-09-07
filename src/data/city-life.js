// Existing full-outfit art is reused. These tags describe choices, not body parts.
export const OUTFIT_STYLES = {
  newcomer: ["清爽", "daily"],
  casual: ["自在", "daily"],
  street: ["個性", "daily"],
  practice: ["俐落", "practice"],
  vocal: ["柔和", "practice"],
  audition: ["俐落", "work"],
  classic: ["經典", "work"],
  cinema: ["經典", "work"],
  variety: ["明亮", "work"],
  stage: ["明亮", "stage"],
  gala: ["優雅", "stage"],
  editorial: ["個性", "stage"],
  premium: ["優雅", "stage"],
  host: ["俐落", "stage"],
  icon: ["個性", "stage"],
};
export const OCCASIONS = {
  daily: "街角相處",
  practice: "排練練習",
  work: "工作場合",
  stage: "節慶聚會",
  home: "在家相處",
};
export const CITY_VOICES = {
  jiqing: {
    style: "明亮",
    outfit: "這套很上鏡，不過今天先不用找鏡頭，坐下聊吧。",
    pet: "牠這個迎賓動作，比我的開場白還有效。",
    date: "我把手機轉靜音了。這段時間留給我們。",
  },
  shenyao: {
    style: "經典",
    outfit: "線條很乾淨。走動看看，舒服比站著漂亮重要。",
    pet: "先別叫牠。等牠自己決定要不要過來。",
    date: "今天沒有分鏡，也不用重來。慢慢走。",
  },
  tangtang: {
    style: "明亮",
    outfit: "好看！你轉一下，我要記住這個搭配。",
    pet: "可以摸嗎？我先讓牠聞聞手，好不好？",
    date: "今天先不比誰練得久，比誰更會放假！",
  },
  guchengxi: {
    style: "自在",
    outfit: "這套看起來適合散步。鞋子也舒服的話，我們可以多走一點。",
    pet: "看來我得先通過家裡這位的面試。",
    date: "難得沒有通告催場，我們連發呆都可以慢慢來。",
  },
  linxiafan: {
    style: "個性",
    outfit: "這個選擇有你的意思。衣服是你穿，不是你替衣服站臺。",
    pet: "先把包收高一點。這位小室友好奇心很強。",
    date: "行程表收起來。休息不必也做成提案。",
  },
  lujingran: {
    style: "自在",
    outfit: "嗯，很適合你。不是客套，我有看。",
    pet: "我坐地上就好。牠想靠近再靠近。",
    date: "不用一直找話題。這樣也很好。",
  },
  xiayutong: {
    style: "明亮",
    outfit: "這套一出場就有畫面！放心，今天沒有偷偷開機。",
    pet: "好，今天的主角確定了。零食得先問主人。",
    date: "我想到三個玩法——不過先聽你的，今天沒有製作人。",
  },
  hanzhiyuan: {
    style: "俐落",
    outfit: "看得出你有準備。也記得替自己留件舒服的外套。",
    pet: "聯絡方式和照顧習慣寫清楚，我會按約定來。",
    date: "工作訊息晚點再回。說好的空檔就要算數。",
  },
  sufei: {
    style: "俐落",
    outfit: "這套不會卡動作吧？別誤會，我只是覺得你選得不錯。",
    pet: "牠好像還在觀察我。沒關係，我很有耐心。",
    date: "今天真的不帶劇本？好吧，那就認真休息。",
  },
  chengyian: {
    style: "個性",
    outfit: "這個顏色遇到窗光會很好看。想拍的話，我會先問你。",
    pet: "牠剛才歪頭的樣子很可愛。不拍也可以記得。",
    date: "今天把相機放下，用眼睛記一段就好。",
  },
  silver_pc: {
    style: "經典",
    outfit: "這套走起路來很好看。是今天看到的，不是猜的。",
    pet: "牠認得的是現在的腳步聲。這樣很踏實。",
    date: "就記住今天吧。這一次的選擇是我們自己做的。",
  },
};
export const REGULAR_PLACES = {
  cafe: {
    greeting: "店員記得你常坐的窗邊，先問今天想安靜一點，還是聊幾句。",
    info: "櫃臺放著棚務徵人資訊；店員提醒，仍要自己看清工作內容再排班。",
    action: "tv_assistant",
    offer: "熟客交換的棚務消息",
  },
  rehearsal: {
    greeting: "值班人員朝你點頭，熟悉的練習室又亮起燈。",
    info: "排練室今天有人交換對戲心得，你也可以預留一天練習接話。",
    action: "city_challenge",
    offer: "排練室的對戲練習",
  },
  shop: {
    greeting: "店員認出你，先問今天要找工作場合還是平常穿的衣服。",
    info: "店員把造型研究的小筆記留給你；先試穿，再決定要不要買。",
    action: "styling",
    offer: "衣櫃之外的造型筆記",
  },
  park: {
    greeting: "常來散步的人點頭打招呼，熟悉的步道今天也有人慢慢走。",
    info: "河邊這一段午後比較安靜，很適合帶著筆記本整理靈感。",
    action: "study",
    offer: "河畔靈感筆記",
  },
  recording: {
    greeting: "錄音室接待認出你，把今天可用的練習資訊遞了過來。",
    info: "這週可以繼續預約歌唱課；準備好再去，不用急著買新器材。",
    action: "vocal",
    offer: "錄音室的練習資訊",
  },
};
export const ACTING_ROUNDS = [
  {
    prompt: "對手停在門口：『你還留著那張車票？』",
    choices: [
      "先看一眼車票，再說：『我還沒決定要不要走。』",
      "不等對方說完，背出下一整頁台詞。",
      "轉頭確認自己是不是站在最亮的位置。",
    ],
    answer: 0,
    feedback: "先接住對手的視線和問題，再讓自己的動機進場。",
  },
  {
    prompt: "對手忘了一句台詞，場面短暫安靜。",
    choices: [
      "立刻指出漏詞，要求對方道歉。",
      "沿著人物關係補一句：『你是不是還有話想說？』",
      "直接走出場，讓工作人員處理。",
    ],
    answer: 1,
    feedback: "在角色裡留一個入口，能幫彼此把節奏接回來。",
  },
  {
    prompt: "最後一遍，對手把同一句話說得更輕。",
    choices: [
      "音量加倍，避免自己的存在感變弱。",
      "完全複製上一遍，不能有任何改變。",
      "重新聽一次，再調整自己的停頓與距離。",
    ],
    answer: 2,
    feedback: "接話不是搶話；聽見變化，表演才會真的發生。",
  },
];
export const CITY_CHOICES = {
  city_date: {
    label: "赴一個重要的約",
    group: "生活",
    room: "cafe",
    item: "window",
    pose: "coffee",
    action: "personal_task",
  },
  pet_walk: {
    label: "和小夥伴散步",
    group: "生活",
    room: "park",
    item: "service",
    pose: "read",
    action: "personal_task",
  },
  city_challenge: {
    label: "對戲接話練習",
    group: "生活",
    room: "rehearsal",
    item: "practice",
    pose: "read",
    action: "personal_task",
  },
  city_collab: {
    label: "朋友邀約的對戲日",
    group: "生活",
    room: "rehearsal",
    item: "practice",
    pose: "read",
    action: "personal_task",
  },
};
