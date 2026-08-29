# 星途未定｜架構說明

本文件描述目前 `main` 對應的模組分工與不變量。專案維持原生 ES Modules、單機瀏覽器執行，不需要框架或後端服務即可遊玩。

## 1. 分層

```text
src/data/*     純內容與設定：通告、NPC、地點、事件、經紀人、深化文本
      ↓
src/core/*     state、存讀檔、RNG、共用工具
      ↓
src/logic/*    規則與狀態變更；不碰 DOM
      ↓
src/views/*    讀 state 產生 HTML；不直接改遊戲規則
      ↓
src/bind/*     使用者操作 → 呼叫 logic → render
      ↓
src/render.js  唯一整體重繪入口
src/main.js    開機、讀檔、首次 render
```

整個遊戲只有一個可變狀態來源：`src/core/state.js` 匯出的 `state`。除了 `resetState()` 開新輪之外，其他模組不可自行建立第二份遊戲狀態。

## 2. 核心 runtime 不變量

### 通告

- 75 份正式通告共用 `logic/job-engine.js`。
- runtime 只以 `state.activeJobs`、`scheduledJobIds` 與 `job_session` 表示工作進度。
- 申請、正式試鏡、簽約、指定工作日、逐次執行、完成與違約都由引擎驗證；UI 不是規則防線。
- `data/job-storylines.js` 是工作敘事入口：
  - C 級 50 份：共用類型骨架＋各工作資料。
  - B 級 10 份（J051～J060）：至少兩段專屬製作事件與專屬長尾。
  - A 級 15 份（J061～J075）：專屬開工、危機、關鍵選擇、完成與公開後長尾。
- A 級內容來源為 `data/deepening-content.js`；B 級內容來源為 `data/job-feature-beats.js`。

### 人物與戀愛

- NPC 初遇、友情、信任、敵意與關係里程碑只由 `logic/npc-engine.js` 修改。
- 戀愛狀態由 `logic/romance-engine.js` 管理：`none → interested → ambiguous → dating → committed → engaged → married`，另支援拒絕、分手、復合、地下／公開與唯一伴侶。
- `data/living-world-content.js` 提供各戀愛階段的可感知日常文本；正式伴侶會透過手機訊息持續反映關係，而不是只顯示好感數值。
- 未認識 NPC 不可因後台事件自動進入 `knownPeople` 或通訊錄。

### NPC 自主世界

- `logic/npc-autonomy.js`／`npc-ecosystem.js` 維持既有 NPC 工作與職涯模擬。
- `logic/deepening-engine.js` 額外將 10 位主要 NPC 的自主職涯 beat 搬到玩家可見世界。
- NPC 即使沒有與玩家互動也會工作、低潮、休息、轉型或獲得新機會；玩家可從娛樂圈週報、社群與已建立關係的私人訊息看到後續。

### 世界回聲

`logic/deepening-engine.js` 負責將一次性結果變成跨週後果：

1. 工作完成／違約等狀態先建立 `worldEchoes`。
2. 到期後寫入 `livingWorldFeed`。
3. 同時可排入可見事件，並由週報、社群或人物訊息再次呈現。
4. 已結算 echo 有去重與保留期限，避免同一事件無限重播。

因此重大選擇不應只留下 `+5`，而要回答「玩家之後會在哪裡再次感受到這件事」。

### 經紀人

- 經紀公司與基礎支援仍由 `logic/agency.js`、`logic/manager.js` 管理。
- 四位經紀人各有工作風格、信任、壓力與默契。
- `data/deepening-content.js` 額外定義保守／進取／危機／續約四類立場。
- 玩家既有的經紀人互動可選擇傾聽、堅持或折衷；結果會修改 trust／stress／rapport，不把經紀人當純 bonus provider。

### 五年章節

`logic/career-phases.js` 直接讀取 `data/deepening-content.js` 的 `YEAR_CHAPTERS`：

1. Year 1「活下來」：新人資源與第一份履歷。
2. Year 2「我是誰」：建立職涯定位。
3. Year 3「位置有限」：競爭與不可替代性。
4. Year 4「選擇有代價」：商業、作品、健康、關係與自主權互相衝突。
5. Year 5「留下什麼」：代表作、長期關係與結局收束。

每 13 週會形成一次章節壓力 checkpoint，避免第三～五年只重複週排程。

## 3. 每週世界推進

`logic/world-tick.js::advanceWorldWeek()` 是週級世界總入口。順序原則：

1. 結算上週輿論與狀態。
2. 週數前進、清理過期活動。
3. 檢查公司合約、通告期限與獎季。
4. 推進市場、競爭者、作品生命週期、NPC 職涯／工作／關係／戀愛／傳聞。
5. 生成新聞、公眾反應、品牌、醜聞、經紀人、粉圈等狀態。
6. 排入日曆、NPC 主線、主動事件、媒體、續作、年度事件、隱藏路線與跨事件。
7. 執行 `tickDeepeningSystems()`，把本週真正發生的作品、人物、戀情、經紀人、隱藏特質與章節壓力轉成玩家可感知內容。
8. `processQueuedEvents()` 將當週已到期事件推到可見事件畫面。

新增週級系統時，應接在這條流程上，不可另做第二個背景時鐘。

## 4. 隱藏能力與聲望

隱藏特質與聲望值可以參與規則，但 UI 不直接揭露精確骰值。

`living-world-content.js::WORLD_REACTION_SIGNALS` 將 8 個隱藏特質與 8 個娛樂圈聲望轉成世界反應，例如：

- 共情高 → 合作者更願意說真話。
- 抗壓高 → 高壓現場更依賴玩家穩住節奏。
- 業界評價高 → 未公開資源會先在製作會議提到玩家。
- 爭議度高 → 普通發言也更容易被截圖放大。

這些反應只在達到明顯門檻後出現，並有冷卻去重。

## 5. UI 資訊原則

### 首頁

`views/room.js` 的首頁只優先回答三件事：

1. **現在最急**：健康、疲勞、迫近工作期限或待處理事件。
2. **有人在找你**：未讀人物訊息或經紀人判斷。
3. **本章目標**：目前年度主題、目標與壓力。

市場、作品與完整世界狀態往「娛樂圈週報」收，不把首頁做成儀表板牆。

### 行程

`views/planner.js` 顯示：

- 正式通告剩餘場次、期限、指定工作日與本週已排次數。
- 期限 × 可用工作日的衝突預警。
- 疲勞只顯示趨勢／風險，不揭露試鏡或工作精確骰值。
- 範本不得覆蓋通告、試鏡、人物約會、創作與面談等重要預約。

### 地圖

維持 26 個地點，不以擴點製造內容量。`views/map.js` 依週末、地點用途、疲勞與已認識 NPC 的工作狀態給「今日線索」。陌生 NPC 不可被地圖直接劇透。

### 週報與社群

- `views/world.js` 是後台世界的主要可視化入口，包含章節壓力、作品長尾、NPC 職涯、競爭、品牌、經紀人與世界回聲。
- `views/social.js` 會把作品長尾、履約回聲、人物近況與世界反應轉成公開動態，讓同一事件不只存在於紀錄頁。

## 6. 存讀檔

目前 save schema 為 **v13**。

- `core/persistence.js`：自動存檔、手動槽、匯出／匯入。
- `core/migrations.js`：逐版遷移舊存檔。
- `core/state.js::hydrateState()`：補預設值、正規化關係／行程／創作等結構。
- 新增欄位應有初始值或可被 lazy initializer 安全補齊，不能要求玩家刪除舊存檔。
- v13 包含 NPC 分歧、跨事件、地圖收藏與創作發行等欄位；垂直深化新增的 echo／feed 狀態亦採向後相容的 lazy 初始化。

## 7. 測試與內容驗證

```text
npm run validate
npm test
npm run test:e2e
```

`npm run validate` 目前包含：

- 原始內容交叉引用驗證。
- 擴充內容驗證。
- `scripts/validate-deepening.mjs`：固定檢查 75 通告、15 A、10 B、50 C、五年章節、10 NPC 自主 beat、4 經紀人立場、戀愛階段與世界反應。

`tests/deepening-1-16.test.mjs` 另測試跨週 echo、陌生 NPC 不進通訊錄、戀愛訊息、經紀人建議，以及首頁／地圖／行程是否真的接上深化層。

## 8. 內容擴充規則

- 不要為了解決重複感先加 NPC、地點或工作數量。
- 先確認既有事件是否能留下跨週後果。
- 資料寫在 `data/`，規則寫在 `logic/`，畫面只讀 state。
- 所有新亂數走 `core/rng.js`，避免不可重現 bug。
- 重要狀態變更要有測試或 validator 防線。

1～16 垂直深化的逐項完成定義與追蹤見 [`DEEPENING-1-16.md`](./DEEPENING-1-16.md)。
