# 預約、讀檔與休養修復

基準提交：6dba20416c709926fac9ed22749042d33947d3d2。
完成版本：Pixel 0.23.2／Core 1.46.2。
本文件為實作完成時紀錄；此時未推送、未部署。

## 修復

1. `src/pixel/career.js`：預約前把整週暫設 study，原先發生在 withCore/hydrate 之前，導致其他日期的 scheduledActivityIds 與 scheduledJobIds 被正規化清空。現在先 hydrate 真正行程，再在交易內暫時阻擋其他日期；選定日期仍是唯一允許的日期。新增預約保留原有工作、NPC 邀約及多日創作；安排失敗保留原狀態。
2. `src/pixel/main.js`：replaceState 原先在 await storage.idle 之後才設定 appearanceBusy。現在首次 await 前上鎖，等待後重查衝突；等待、場景或寫入失敗都可解鎖，已替換狀態時才回復原進度。
3. `src/pixel/recovery-period.js` 與行程／工作／城市預約／助手入口：重用既有 forcedRestWeek 同時辨識住院當週剩餘日期與下一週，避免僅鎖下一週。讀取舊存檔仍適用，不新增存檔 schema；休養結束後恢復正常安排。
4. 關聯修正 `src/pixel/ux-summaries.js`：多日製作恢復保留後，剩餘費用須將同一作品的一次性製作預算去重；不同作品分別計價，其他費用保留。實際扣款沿用既有引擎。

既有玩家可見文本未替換；新增版本說明保留所有歷史条目。未嘗試推測並自動恢復舊版本已遺失的預約，避免覆蓋玩家後續安排。

## 定向驗證

最終共 32 個不同測試案例全部通過（重跑相同案例不重複計數）：

- `tests/pixel-reservation-recovery.test.mjs`：11 項，包含預約跨日保留、讀檔後一致、真正執行多日製作、一次性費用、原有工作保留、失敗預約回復、住院後各入口／重載／期限、讀檔連點／衝突／等待失敗／寫入失敗／場景失敗。
- `tests/pixel-storage.test.mjs`：10 項，檢查交易、備份、多分頁與失敗保護。
- `node --test --test-name-pattern='bookings|NPC reservation|original production' tests/pixel-career.test.mjs`：3 項。
- `node --test --test-name-pattern='planner|publishing strategy' tests/pixel-completion.test.mjs`：3 項。
- `node --test --test-name-pattern='預算|助手|復原' tests/pixel-debug-regressions.test.mjs`：5 項。

讀檔測試直接取出 main.js 的原始 replaceState 函式，在 VM 中模擬 storage 與場景非同步操作，非瀏覽器實測。其他新增案例使用實際遊戲邏輯與狀態；未執行完整五年模擬、全套測試或真實手機 E2E。

修改 JS／MJS 的 ESLint 通過；npm run build、npm run audit:pwa 通過。
離線清單 642 個檔案、110 MB，快取 star-game-runtime-v1.46.2；build 產物位於 dist/。
