# 文本與流程驗證

日期：2026-09-06。核心 1.33.0／像素版 0.10.0。來源基準 `5d8cee0acc9627809f23606826ad9f54b1a4af71`。

| 檢查 | 結果與範圍 |
| --- | --- |
| `npm run check` | 通過；含格式、ESLint 零警告、內容驗證、398 項單元／整合測試、五年與世界反應模擬、資產與 PWA 檢查、正式建置 |
| 五年模擬 | 260 週、173 個不重複決策事件、50 個長篇章節；模擬已補入延遲事件排程處理 |
| 桌面劇情瀏覽 | `pixel-story-catalog.spec.mjs` 與 `pixel-stories.spec.mjs`，19 項通過；以 fixture 展示 11 位人物的 88 章，另驗證邀約、多人同場、場景失敗重試及讀檔續接 |
| 手機劇情與職涯 | `pixel-stories.spec.mjs` 與 `pixel-career.spec.mjs` 共 13 項情境均完成；首次 12 項通過、1 項初始載入超過 5 秒，該項單獨重跑通過 |
| 手機旗艦現場抉擇 | `pixel-flagship-narrative.spec.mjs` 通過；實際操作三個專屬選項、決策前後重新載入、單次進度／獎勵及舊佇列清理 |
| 旗艦製作因果 | 6 項 bridge 測試通過：滿事件佇列仍先選再製作；無選項不結算；讀檔不重獎；不同選擇確實改變品質與成品記錄；失效舊事件清除 |
| 75 份工作生命週期 | 每份工作四幕依序只呈現一次；短通告不漏幕、長通告不重播；完成只產生一份作品並領取一次收入 |
| 備查完整性 | 44 份替換來源的完整原文、7 份新增來源，共 51 份 src 變更；封存、逐行差異及目前檔案的 SHA-256 全數吻合 |
| 文件索引 | 交付說明與替換索引的全部相對連結存在；編輯總綱的來源路徑已確認 |

瀏覽器使用 Chromium 149、Playwright 與桌面／手機視窗設定；這是 Chromium 的行動尺寸模擬，並非實體 iPhone 或 Safari 測試。手機長篇與旗艦選項已直接檢視截圖，確認繁體文字、選項代價及長標題能讀取。

上述模擬與 fixture 可以驗證觸發、接線及呈現，不能據此宣稱所有五年排程、所有戀愛組合或任意舊存檔都已由真人完整通關。首次載入逾時保留於本紀錄；單獨重跑成功不代表所有裝置皆能在五秒內完成載入。

一般查驗原文與來源一致性：

```sh
node scripts/audit-narrative-rewrite.mjs
npm run check
```

瀏覽器測試另行執行（需可用的 Chromium）：

```sh
npx playwright test pixel-story-catalog.spec.mjs pixel-stories.spec.mjs --project desktop
npx playwright test pixel-stories.spec.mjs pixel-career.spec.mjs --project mobile
npx playwright test pixel-flagship-narrative.spec.mjs --project mobile
```

完整範圍見[交付說明](NARRATIVE-REWRITE.md)，逐檔替換見[備查索引](REPLACEMENT-INDEX.md)。
