# 文本替換備查索引

日期：2026-09-06。基準提交：`1ea5f29728c723668f70dfdc2756d84c62365a4d`。

本次保留 9 份既有來源的完整原文，另新增 2 份來源。下列數字為原始碼漢字數，包含註解、重複及規則提示，不代表不重複劇情字數。

[逐檔校驗清單](manifest.json)記錄替換前後完整 SHA-256；[原文封存](originals.json.gz)保留完整舊來源；[逐行差異](source-changes.patch.gz)可核對每一處修改。遊戲既有存檔中的歷史文字不在替換範圍。

| 動作 | 來源檔案 | 原碼漢字（前） | 原碼漢字（後） | 替換原因 |
| --- | --- | ---: | ---: | --- |
| 替換 | [src/data/map-locations.js](../../../src/data/map-locations.js) | 1,099 | 1,104 | 專屬文本、人物／題材一致性與分支後果 |
| 替換 | [src/pixel/career-ui.js](../../../src/pixel/career-ui.js) | 910 | 907 | 文本接入、階段前提、延遲回收與像素呈現一致性 |
| 替換 | [src/pixel/cast.js](../../../src/pixel/cast.js) | 708 | 932 | 文本接入、階段前提、延遲回收與像素呈現一致性 |
| 替換 | [src/pixel/city-catalog.js](../../../src/pixel/city-catalog.js) | 1,453 | 852 | 文本接入、階段前提、延遲回收與像素呈現一致性 |
| 新增 | [src/pixel/city-interaction-copy.js](../../../src/pixel/city-interaction-copy.js) | 0 | 1,368 | 文本接入、階段前提、延遲回收與像素呈現一致性 |
| 替換 | [src/pixel/life-ui.js](../../../src/pixel/life-ui.js) | 873 | 871 | 文本接入、階段前提、延遲回收與像素呈現一致性 |
| 替換 | [src/pixel/life.js](../../../src/pixel/life.js) | 477 | 447 | 文本接入、階段前提、延遲回收與像素呈現一致性 |
| 新增 | [src/pixel/location-day-copy.js](../../../src/pixel/location-day-copy.js) | 0 | 1,222 | 文本接入、階段前提、延遲回收與像素呈現一致性 |
| 替換 | [src/pixel/main.js](../../../src/pixel/main.js) | 1,429 | 1,411 | 文本接入、階段前提、延遲回收與像素呈現一致性 |
| 替換 | [src/views/npc.js](../../../src/views/npc.js) | 464 | 508 | 文本接入、階段前提、延遲回收與像素呈現一致性 |
| 替換 | [src/views/people.js](../../../src/views/people.js) | 175 | 167 | 文本接入、階段前提、延遲回收與像素呈現一致性 |

在專案根目錄執行：

```sh
node scripts/audit-narrative-rewrite.mjs --directory docs/narrative/2026-09-06-player-view
node scripts/audit-narrative-rewrite.mjs --directory docs/narrative/2026-09-06-player-view --original src/data/map-locations.js
node scripts/audit-narrative-rewrite.mjs --directory docs/narrative/2026-09-06-player-view --diff
```

全文範圍與驗證限制請見[交付說明](NARRATIVE-REWRITE.md)及[編輯總綱](EDITORIAL-GUIDE.md)。
