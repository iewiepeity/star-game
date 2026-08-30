# 發布與回復規則

## 發布閘門

1. 所有變更以 Pull Request 進入 `main`。
2. `core` 與 `e2e` 必須成功；紅燈版本不得部署。
3. 合併後由 CI 完成事件觸發 Pages，並以該次 CI 的 `head_sha` 建置。
4. `npm run build` 只將 runtime、樣式與素材放入 `dist/`。
5. Beta 版本建立 `vX.Y.Z-beta.N` tag；穩定版建立 `vX.Y.Z` tag。

## 建議的 GitHub branch protection

- Require a pull request before merging。
- Require status checks：`core`、`e2e`。
- Require branches to be up to date。
- Block force pushes and deletion。

上述 repository 規則需由擁有者在 GitHub Settings 啟用；workflow 本身無法取代分支保護。

## 回復上一版

1. 在 Actions 找到上一個成功的 CI commit。
2. 由該 commit 建立 `hotfix/rollback-<version>`。
3. 以一般 PR 回復造成問題的變更；不得直接 force push `main`。
4. Core 與 E2E 通過後合併，Pages 會部署該安全狀態。
5. 將故障版本標為 withdrawn，並在 Changelog 記錄原因。

## 發布檢查表

- [ ] `npm run check`
- [ ] `npm run test:e2e`
- [ ] 桌機與 390px 手機主流程煙霧測試
- [ ] 新存檔、舊存檔遷移、離線重開
- [ ] 音效首次互動、背景切換與靜音
- [ ] 五年結局與下一周目
- [ ] 更新 CHANGELOG、版本號與 Service Worker cache key
- [ ] 已知問題已寫入 Release notes
