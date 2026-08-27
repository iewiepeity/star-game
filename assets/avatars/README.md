# 玩家立繪與服裝素材

四種玩家外型各有三套同姿勢造型，檔名格式為 `<avatarId>-<outfitId>.webp`：

- `silver`：霧銀系女性立繪
- `sunny`：暖杏系女性立繪
- `noir`：夜墨系男性立繪
- `sage`：春茶系男性立繪
- `newcomer`：新人私服
- `practice`：練習服
- `stage`：舞台造型

素材為透明背景 WebP，固定 512×1024 畫布。遊戲採完整立繪切換而非即時疊衣服圖層，避免不同身形或生成誤差造成領口、手臂與腰線錯位；資料與加成定義集中於 `src/data/wardrobe.js`。
