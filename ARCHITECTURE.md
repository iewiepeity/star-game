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
src/views/*    像素版共用的手機 App HTML 呈現
      ↓
src/pixel/*    場景、互動與像素介面
src/pixel/main.js  開機、讀檔、建立場景
src/entry.js   首頁導向 pixel.html（保留查詢參數與 hash）
```

像素版由 `src/pixel/model.js` 建立並儲存玩家狀態，`life.game` 保存共用核心狀態。`src/pixel/core-bridge.js::withCore()` 在同步操作前 hydrate 核心 `state`，成功後寫回 `life.game`；不可另外建立背景時鐘或自動存檔流程。舊版入口、render 與 bind 已移除。

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

### 住處、行程與城市

`src/pixel/main.js` 與 `world.js` 提供可移動的像素場景；`life-ui.js` 與 `planner-tools.js` 呈現行程，`city-ui.js` 管理地圖、交通與地點互動。像素介面透過共用核心規則驗證工作期限、疲勞及重要預約。

### 週報與社群

- `views/world.js` 是後台世界的主要可視化入口，包含章節壓力、作品長尾、NPC 職涯、競爭、品牌、經紀人與世界回聲。
- `views/social.js` 會把作品長尾、履約回聲、人物近況與世界反應轉成公開動態，讓同一事件不只存在於紀錄頁。

## 6. 存讀檔

目前 save schema 為 **v16**。

- `core/persistence.js`：自動存檔、手動槽、匯出／匯入。
- `core/migrations.js`：逐版遷移舊存檔。
- `core/state.js::hydrateState()`：補預設值、正規化關係／行程／創作等結構。
- 新增欄位應有初始值或可被 lazy initializer 安全補齊，不能要求玩家刪除舊存檔。
- v13 包含 NPC 分歧、跨事件、地圖收藏與創作發行等欄位；垂直深化新增的 echo／feed 狀態亦採向後相容的 lazy 初始化。
- v14 補齊長期章節、人物邀約、永久方針與嚴格存檔欄位，舊版會依序遷移後再 hydrate。
- v15 加入五槽手動存檔、人物相處記憶、App 快捷列與最新世界狀態；自動存檔採 300ms 合併寫入，週次／逐日階段等關鍵節點仍立即落盤，頁面隱藏或離開前會強制 flush。
- v16 拆分本名與選填藝名；舊存檔姓名遷移為本名，公開名稱在藝名留空時沿用本名。
- `pixel/model.js` 與 `pixel/storage-ui.js` 負責像素存讀檔、備份及匯入預覽；`pixel/save-transfer.js` 保留舊版存檔相容性。

## 7. 測試與內容驗證

```text
npm run validate
npm test
npm run test:e2e
npm run lint
npm run audit:world-reactions
```

`npm run validate` 目前包含：

- 原始內容交叉引用驗證。
- 擴充內容驗證。
- `scripts/validate-deepening.mjs`：固定檢查 75 通告、15 A、10 B、50 C、五年章節、10 NPC 自主 beat、4 經紀人立場、戀愛階段與世界反應。

`tests/deepening-1-16.test.mjs` 另測試跨週 echo、陌生 NPC 不進通訊錄、戀愛訊息、經紀人建議，以及世界推進是否接上深化層。

## 8. 內容擴充規則

- 不要為了解決重複感先加 NPC、地點或工作數量。
- 先確認既有事件是否能留下跨週後果。
- 資料寫在 `data/`，規則寫在 `logic/`，畫面只讀 state。
- 所有新亂數走 `core/rng.js`，避免不可重現 bug。
- 重要狀態變更要有測試或 validator 防線。

1～16 垂直深化的逐項完成定義與追蹤見 [`DEEPENING-1-16.md`](./DEEPENING-1-16.md)。
