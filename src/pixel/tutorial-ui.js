const TIPS = {
  schedule: [
    "planner-basics",
    "點日期，再選活動",
    "每天一件主要安排。已完成的日期不能改寫；排程助手會保留正式通告與約定。",
  ],
  travel: [
    "map-basics",
    "城市是你的舞台",
    "點建築查看，確認後進入空間。走路、看資料不消耗一天；上課、工作與邀約才使用行程日。",
  ],
  "app-jobs": [
    "jobs-basics",
    "把機會變成作品",
    "先看角色資格與指定工作日，試鏡通过後才能簽約；正式通告要在截止前完成所有場次。",
  ],
  "app-agency": [
    "agency-basics",
    "找到適合自己的公司",
    "申請、下一週回覆、面談、閱讀合約。收到邀約後可談抽成、年限、創作權與試鏡保障。",
  ],
  "app-people": [
    "npc-basics",
    "慢慢認識一個人",
    "訊息與檔案都在這裡。邀約需要留一天；秘密和關係進展會隨共同經歷開放。",
  ],
  wardrobe: [
    "wardrobe-basics",
    "穿搭也會影響表現",
    "先試穿，比較加成再決定。可收藏三套常用造型，試穿不會改變目前穿著。",
  ],
  "app-stats": [
    "stats-basics",
    "了解自己的步調",
    "能力上限為 1,000；服裝加成另外計入。疲勞與健康也會影響實際表現。",
  ],
  "week-summary": [
    "summary-basics",
    "看看這週留下了什麼",
    "確認成果後再迎接下一週；新的邀約、產業新聞和人物動態會一起更新。",
  ],
};
export function tutorialMarkup(state, type) {
  const tip = TIPS[type];
  if (!tip || (state.life.game.tutorialSeen || []).includes(tip[0])) return "";
  return `<aside class="pixel-tutorial"><div><b>${tip[1]}</b><p>${tip[2]}</p></div><button data-dismiss-tutorial="${tip[0]}" aria-label="收起新手提示">知道了</button></aside>`;
}
export function dismissTutorial(state, id) {
  state.life.game.tutorialSeen = [
    ...new Set([...(state.life.game.tutorialSeen || []), id]),
  ];
}
