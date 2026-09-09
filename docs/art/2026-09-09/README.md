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
- 已檢視生成原圖並修正衣服、鞋色與錯列；另檢視四位主角共 8 張桌面／手機實際遊戲截圖，抽查新姿勢、服裝與咖啡座位朝向。不是全部 60 套服裝逐套的瀏覽器目視驗收。
- 本機 Chromium 下載受阻後，改由 GitHub 分支限定的驗證流程執行 `tests/e2e/pixel-action-art.spec.mjs`；桌面／手機共 **10 項通過（48.9 秒）**，涵蓋四主角動作還原、換格、停止動作及換裝載入失敗回復／重試。
- 驗證提交：`64788db804cab891770627095346ee9fd1439deb`；[GitHub Actions 結果與截圖](https://github.com/iewiepeity/star-game/actions/runs/34319600448)。後續此筆更新僅補驗證紀錄，不修改執行程式或素材。

具備 Chromium 的環境可執行：

```sh
npx playwright install chromium
npx playwright test tests/e2e/pixel-action-art.spec.mjs --project=desktop --project=mobile --workers=2
```

重建／像素驗證使用 `sharp`；可由 Codex runtime 提供，或另以 `npm install --no-save sharp` 安裝。
