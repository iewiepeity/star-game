# 服裝與城市人物動作補圖

延續既有四位主角、服裝與 NPC 參考圖的髮型、色盤、Q 版比例與像素輪廓，補齊日常動作。既有 60 張服裝立繪、縮圖及移動素材繼續使用。

| 對象 | 新增動作 | 圖格 |
| --- | --- | ---: |
| Raven、Sunny、Noir、Sage，各 15 套服裝 | 跳舞 2 格、練唱 2 格、正面及背面坐著喝咖啡各 2 格 | 480 |
| 9 位擴充 NPC | 跳舞、閱讀、手機、站立喝飲料各 2 格 | 72 |
| 合計 | 15 張無損 WebP 圖集 | 552 |

## 素材與接入

- `sources/` 保留生成 PNG；`prompts.json` 記錄共用提示與修正。參考來源為 `assets/pixel/wardrobe/wardrobe-{avatar}-{0..2}.webp` 與 `assets/pixel/cast/cast-{0..2}.webp`。
- `scripts/build-action-atlases.mjs` 僅裁切、定位、無損打包；不以程式繪圖替代生成素材。Sunny 第一組練習服只取修正版第二列，其餘列保留原稿。
- `assets/pixel/actions/manifest.json` 記錄每格來源座標、來源 SHA-256、座位方向及錨點。背面圖以必要的水平翻轉統一朝向。
- 沿用既有洋紅去背流程。每個動作循環固定縮放比例，減少動態偏好固定第一格。
- 換裝依需求載入，沿用兩組近期主角素材保留限制與失敗回復流程。聲樂課接上 `sing`；NPC 動作接上原有行為排程。
- 遊戲版本 0.24.1／套件版本 1.47.1；離線清單及服務工作者快取同步更新。

## 驗證範圍與結果

只驗證本次動作、身份／服裝載入及相鄰整合，不執行全遊戲多年模擬。

- `node --test tests/pixel-action-art.test.mjs`：5 項通過，涵蓋全部 60 套服裝、9 位 NPC、動畫換格、座位方向、減少動態、缺圖回退與練唱活動。
- `node --test tests/pixel-phase-one.test.mjs tests/pixel-completion.test.mjs tests/pixel-identity.test.mjs`：57 項通過。
- `node scripts/verify-action-atlases.mjs`：552 格皆獨立，來源雜湊、像素逐位元相同與圖集尺寸檢查通過。
- 修改的 JS／MJS 檔案 ESLint 通過；`npm run build` 通過，產出含新增圖集及模組的離線包。
- 已檢視生成原圖並修正衣服、鞋色與錯列；尚未完成實際遊戲畫面的視覺驗收。
- `tests/e2e/pixel-action-art.spec.mjs` 已加入桌面／手機的四主角動作還原、停止動作及換裝載入失敗重試案例。執行環境缺少 Chromium；安裝遭下載逾時／不完整壓縮檔阻擋，測試停在瀏覽器啟動前，因此這 10 個案例尚未驗證通過。

具備 Chromium 的環境可執行：

```sh
npx playwright install chromium
npx playwright test tests/e2e/pixel-action-art.spec.mjs --project=desktop --project=mobile --workers=2
```

重建／像素驗證使用 `sharp`；可由 Codex runtime 提供，或另以 `npm install --no-save sharp` 安裝。
