# 星望市城市原畫

`starwish-city.jpg` 是 1.27.0 的完整城市圖，涵蓋 `MAP_LOCATIONS` 全部 26 個地點。保留原遊戲的水彩、色鉛筆、暖紙與低飽和配色。

- 生成日期：2026-09-05。
- 生成方法：Codex 內建 `image_gen.imagegen`，全新城市插畫；沒有 API key、第三方端點或其他影像生成工具。
- 原始輸出：1536 × 1024 PNG；發行素材僅以 macOS `sips` 轉為 JPEG（品質 88），沒有修改畫面內容。
- 完整提示詞：同目錄 `generation-prompt.txt`。
- 所有文字、到訪標記與點擊熱區由遊戲繪製；`src/data/city-map.js` 的 `CITY_LANDMARKS` 是根據完成原畫重新量測的百分比座標，不是直接沿用提示詞座標。
- 修改原畫時需重新校準熱區；新增 `MAP_LOCATIONS` 時，也必須補上原畫地點與 `CITY_LANDMARKS`，並通過包含全部地點的瀏覽器測試。
- 課程、公司、工作與週報共用這張圖的 CSS 裁切，不載入額外大圖。既有角色立繪與房間背景維持原素材。
