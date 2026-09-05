export const CREATOR_FORMATS = Object.freeze({
  short: { label: "短影音", icon: "▶", stats: ["口才", "幽默"], baseViews: 180, quality: 2 },
  video: { label: "長影片", icon: "▣", stats: ["口才", "學識"], baseViews: 120, quality: 10 },
  live: { label: "直播", icon: "●", stats: ["口才", "臨場反應"], baseViews: 90, quality: -3 },
  music: { label: "翻唱／音樂", icon: "♫", stats: ["歌藝", "音感"], baseViews: 140, quality: 8 },
  skit: { label: "戲劇短片", icon: "✦", stats: ["演技", "幽默"], baseViews: 150, quality: 12 },
});

export const CREATOR_TOPICS = Object.freeze({
  daily: { label: "日常分享", titles: ["搬進星望市後的一週", "藝人沒通告時都在做什麼？", "鏡頭外的普通一天"], trust: 3 },
  work: { label: "工作幕後", titles: ["第一次站上片場的幕後", "那些鏡頭沒有拍到的事", "一份通告是怎麼完成的"], industry: 3 },
  fashion: { label: "美妝穿搭", titles: ["新人也能完成的通告妝", "一週穿搭實錄", "鏡頭前顯精神的小技巧"], fashion: 4 },
  challenge: { label: "熱門挑戰", titles: ["我也來挑戰最近最紅的企劃", "沒有劇本的三十秒", "這個挑戰真的有那麼難？"], heat: 5, risk: 3 },
  opinion: { label: "聊天觀點", titles: ["想紅和想做好作品衝突嗎？", "新人最常被誤會的三件事", "我為什麼還留在這一行"], trust: 5, risk: 5 },
});

export const CREATOR_INVESTMENTS = Object.freeze({
  basic: { label: "手機拍攝", cost: 0, quality: 0, fatigue: 5 },
  standard: { label: "租借器材", cost: 1800, quality: 12, fatigue: 6 },
  premium: { label: "專業製作", cost: 6500, quality: 26, fatigue: 8 },
});

export const CREATOR_RARITIES = Object.freeze([
  { id: "legendary", label: "傳奇", min: 96, color: "legendary" },
  { id: "epic", label: "史詩", min: 88, color: "epic" },
  { id: "rare", label: "稀有", min: 76, color: "rare" },
  { id: "uncommon", label: "精良", min: 62, color: "uncommon" },
  { id: "common", label: "普通", min: 0, color: "common" },
]);
