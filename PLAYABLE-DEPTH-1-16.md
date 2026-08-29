# Playable Depth Pass｜實玩深化 1～16

目標：停止橫向增加主要 NPC、地點與通告數量，把既有五年流程做成「每週有故事、每年有變化、每輪有不同人生」。

## 驗收清單

1. ✅ **五年實玩壓測**：`scripts/simulate-five-years.mjs` 以 10 種 archetype 跑 260 週，使用正式 state 與 `tickPlayableDepth()`；CI 的 `npm run check` 會執行。
2. ✅ **週故事連續性**：`weeklyThreads` 在首頁建立本週脈絡，`views/summary.js` 於週末收束同一 thread。
3. ✅ **短篇事件鏈**：玩家先在事件畫面選 A／B，`depth-chain:*` flag 決定數週後與一年後的不同回收版本。
4. ✅ **工作合作班底**：作品保存導演／製作人／合作演員等 crew；後續作品可重遇同角色、累積 works／trust。
5. ✅ **試鏡深化**：正式工作頁顯示情報／團隊偏好；試鏡當天顯示現場追加要求，仍走原本試鏡決策與判定。
6. ✅ **失敗也有內容**：落選建立業界記憶；回邀到期後實際解除原通告重試冷卻並留下再次試鏡通知。
7. ✅ **娛樂圈競爭**：Year 3 起既有 competitor／rival 狀態可形成比較事件，玩家可選作品路線或正面搶市場。
8. ✅ **作品履歷**：作品保存 breakthrough／critical／commercial／award／meme／controversial／turning 等 legacy tags 與 crew。
9. ✅ **NPC 共同記憶**：保存初遇、首次合作、約會、衝突、公開、分手／復合、訂婚、結婚等 milestone。
10. ✅ **戀愛 × 工作**：正式伴侶＋進行中工作可觸發炒 CP／宣傳尺度事件，三種選擇會實際改關係、話題與疲勞。
11. ✅ **經紀人主動介入**：過勞、健康惡化或連續低品質作品時可主動踩煞車；接受／堅持／折衷有不同效果。
12. ✅ **爆紅改變生活**：`exploration.js` 依 fame tier 在公開地點產生認出、合照、偷拍、即時貼文與額外疲勞／聲望效果。
13. ✅ **炎上／醜聞劇情鏈**：正式醜聞引擎支援承擔、沉默、否認、模糊與緋聞公開戀情；第 1／3 週仍有後續回聲。
14. ✅ **年度大型事件**：平台招商、電影節、音樂祭、時尚週、年度盛典／獎季與跨年提前倒數，倒數與正式週都有選擇。
15. ✅ **二周目知識**：結局新輪只保留 familiar NPC 與 `ngPlusKnowledge`；能力、金錢、作品、關係數值全部重置，首頁會出現直覺提示。
16. ✅ **UI Polish／實玩驗證**：首頁維持急事／人物／章節三層並加入 story pulse；App 使用量寫入本機 telemetry；新增桌機＋手機 Playwright 驗收。

## 測試 gate

```text
npm run validate
npm test
npm run simulate
npm run test:e2e
```

完成條件：上述 1～16 都必須有 runtime、玩家可見出口或自動測試，不能只存在於本文件。CI 未全綠前不合併 main。
