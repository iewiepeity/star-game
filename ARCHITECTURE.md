# 星途未定｜架構說明

本文件描述現行 runtime 的模組分工與不變量。專案維持原生 ES Modules、單機瀏覽器執行，不需要框架或後端服務。

## 1. 分層

```text
src/data/*     純內容與設定：通告、NPC、地點、事件、深化文本
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

整個遊戲只有一個可變狀態來源：`src/core/state.js` 匯出的 `state`。除了 `resetState()` 開新輪之外，不可建立第二份遊戲狀態。

## 2. 通告與作品

- 75 份正式通告共用 `logic/job-engine.js`。
- runtime 只以 `state.activeJobs`、`scheduledJobIds` 與 `job_session` 表示正式工作進度。
- 申請、試鏡、簽約、指定工作日、逐次執行、完成與違約均由引擎驗證，UI 不是規則防線。
- `data/job-storylines.js` 是工作敘事入口：50 C 級、10 B 級（J051～J060）、15 A 級（J061～J075）。
- `data/deepening-content.js` 提供 A 級旗艦文本，`data/job-feature-beats.js` 提供 B 級特色製作事件。

Playable Depth 另外在既有通告流程上加入：

- `data/playable-depth-content.js::AUDITION_INTEL`：試鏡情報與現場追加要求。
- `logic/personal-tasks.js`：正式試鏡當天讀取情報、執行原本試鏡決策，落選後建立業界記憶。
- `logic/failure-depth.js`：回邀到期後解除原通告重試冷卻並留下真正可再試的機會。
- `logic/playable-depth-engine.js::crewForWork()`：作品建立非攻略合作班底，後續作品可重遇並累積信任。
- `legacyTagsFor()`：作品保存突破作、影評口碑、商業代表作、獎季作品、名場面、爭議作品與轉型作等履歷標籤。

## 3. 人物、戀愛與共同記憶

- NPC 初遇、友情、信任、敵意與原有關係里程碑仍由 `logic/npc-engine.js`／`romance-engine.js` 管理。
- 戀愛狀態：`none → interested → ambiguous → dating → committed → engaged → married`，另支援拒絕、分手、復合、地下／公開與唯一伴侶。
- 未認識 NPC 不可因後台事件自動進入 `knownPeople`。

Playable Depth 使用 `state.relationshipMilestones` 保存玩家與 NPC 的可引用共同經歷，例如第一次見面、第一次合作、第一次約會、第一次衝突、公開、分手、復合、訂婚與結婚。這些是敘事記憶，不取代原本關係數值。

正式伴侶同時有進行中工作時，`romanceWorkPressure()` 可建立戀愛 × 工作事件，例如地下戀遇到炒 CP、宣傳尺度與媒體壓力；選擇會修改關係與話題，而不是只顯示文字。

## 4. NPC 自主世界與競爭

- `npc-autonomy.js`／`npc-ecosystem.js` 維持 NPC 工作與職涯模擬。
- `deepening-engine.js` 將主要 NPC 的自主職涯 beat 搬到玩家可見世界。
- NPC 即使沒有被玩家點開也會工作、低潮、休息、轉型或取得新機會。
- `competitionBeat()` 從第三年開始讀取既有 competitor／rival 狀態，定期形成可見的市場比較與選擇。

## 5. 世界回聲、短篇事件鏈與每週主線

第一輪深化的 `deepening-engine.js` 繼續負責作品／違約等長尾 world echo。

第二輪 `playable-depth-engine.js` 增加兩層：

### Weekly Thread

每週依目前狀態形成 `training`、`job`、`romance` 或 `scandal` 主線，寫入 `state.weeklyThreads`。首頁顯示週初脈絡，週結算使用同一 thread 收束，避免七天像七個互不相干的 Action。

### Short Chain

`maybeStartShortChain()` 建立 A→B→C 事件鏈。第一段只建立選項，不替玩家預選；事件畫面的選擇寫入 `depth-chain:*` flag，`tickShortChains()` 再依實際選擇於數週後與一年後回收。

因此重要選擇必須回答：「玩家之後會在哪裡再次感受到這件事？」

## 6. 經紀人、爆紅與炎上

### 經紀人

既有 `manager.js` 管理四位固定經紀人的 trust／stress／rapport 與主動事件。Playable Depth 額外在過勞、健康惡化或連續低品質作品時建立介入事件；玩家可接受、堅持或協商，選擇有實際疲勞／聲望效果。

### 爆紅生活

`fameLifeTier()` 將知名度分成自由生活、開始被認出、公開行程有成本、爆紅生活四層。`exploration.js` 會在公開地點依人氣產生合照、偷拍、即時貼文、額外疲勞與粉絲／國民度變化。高 fame 不再只等於更多邀約。

### 醜聞

`scandal-engine.js` 是唯一正式醜聞 runtime。支援正式說明／承擔、暫不回應、明確否認、模糊處理；緋聞且已有伴侶時可直接公開關係。處理後第 1／3 週仍可建立後續事件，危機不在選完按鈕後立刻歸零。

## 7. 年度大型事件與五年章節

`career-phases.js` 維持五年主題：

1. Year 1「活下來」
2. Year 2「我是誰」
3. Year 3「位置有限」
4. Year 4「選擇有代價」
5. Year 5「留下什麼」

`ANNUAL_TENTPOLES` 另外定義春季平台招商、城市電影節、夏季音樂祭、時尚週、年度盛典／獎季與跨年舞臺。每個事件有 lead weeks；倒數開始時可提前保留檔期，正式週再形成大型曝光事件。

## 8. 二周目

結局仍建立 immutable snapshot。`views/ending.js::startNewRun()` 若啟用繼承：

- 保留曾認識 NPC 的 `familiarNpcs`。
- 呼叫 `recordLoopKnowledge()` 保存前輪代表作品類型／legacy 所形成的 `ngPlusKnowledge`。
- 不保留能力、金錢、作品或關係數值。
- 新輪可由 `ngPlusIntuition()` 顯示額外直覺提示。

## 9. 每週世界推進

`logic/world-tick.js::advanceWorldWeek()` 是唯一週級世界總入口。順序原則：

1. 結算上週輿論。
2. 週數前進並清理活動。
3. 檢查公司合約、通告期限與獎季。
4. 推進市場、競爭者、作品生命週期、NPC 職涯／工作／關係／戀愛／傳聞。
5. 生成新聞、公眾反應、品牌、醜聞、經紀人與粉圈狀態。
6. 排入日曆、NPC 主線、媒體、續作、年度事件、隱藏路線與跨事件。
7. `tickDeepeningSystems()` 執行第一輪世界回聲。
8. `tickPlayableDepth()` 建立週故事、短篇鏈、試鏡回邀、共同記憶、經紀人介入、戀愛 × 工作、年度倒數、競爭與爆紅狀態。
9. `applyFailureCallbackMechanics()` 把落選回聲轉成真的重試機會。
10. Playable Depth 事件進 `eventQueue`。
11. `processQueuedEvents()` 將到期事件推到可見事件畫面。

新增週級系統不可另做第二個背景時鐘。

## 10. UI 原則與 telemetry

首頁仍優先回答：

1. 現在最急
2. 有人在找你
3. 本章目標

另外只顯示當週 story pulse、爆紅生活層級、大型事件倒數、經紀人介入與二周目直覺。完整後台資訊留在娛樂圈週報。

`bind/room.js` 會把玩家實際開啟各 App 的次數記到 `state.playTelemetry.systems`。用途是後續根據真實使用率做 UI 收斂，不用「覺得這個按鈕好像很重要」來猜。telemetry 僅保存在本機存檔，不上傳。

行程、地圖與事件畫面仍遵守：不公開精確成功骰值、不新增不必要地點、重要選擇必須有後果提示。

## 11. 存讀檔

目前 save schema 為 **v14**。

- `core/persistence.js`：自動存檔、手動槽、匯出／匯入。
- `core/migrations.js`：逐版遷移舊存檔。
- `core/state.js::hydrateState()`：補預設值與正規化。
- v14 保存 `weeklyThreads`、`eventChains`、`crewNetwork`、`auditionIntel`、`industryMemories`、`relationshipMilestones`、`managerInterventions`、`scandalResponses`、`annualTentpoleHistory`、`ngPlusKnowledge`、`playTelemetry`。
- 舊存檔缺少上述欄位時會自動補安全預設值，不要求玩家刪檔。

## 12. 測試與壓測

```text
npm run validate
npm test
npm run simulate
npm run test:e2e
```

`npm run validate` 檢查既有 75 通告、NPC、地點與 A／B／C 深化內容。

`tests/deepening-1-16.test.mjs` 驗證第一輪垂直深化；`tests/playable-depth-1-16.test.mjs` 驗證 v14 persistence、weekly thread、玩家驅動短篇鏈、工作班底、試鏡回邀、共同記憶、經紀人介入、爆紅地圖摩擦、實際醜聞回應、年度倒數、第三年競爭、二周目知識與 telemetry。

`scripts/simulate-five-years.mjs` 以 10 種玩法 archetype 跑完整 260 週，使用正式 `state` 與 `tickPlayableDepth()`，檢查破產、健康失衡、無作品、週故事覆蓋與單一行為過度重複。

Playwright E2E 同時跑桌機與手機。

## 13. 擴充規則

- 不要先用增加 NPC、地點或通告數量解決重複感。
- 資料放 `data/`，規則放 `logic/`，畫面只讀 state。
- 重要狀態變更必須有 test／validator 或 E2E 防線。
- 選擇若宣稱會「之後影響」，就必須存在可追蹤 state 與後續觸發點。
- 不可讓未認識 NPC 因後台事件偷渡進通訊錄。

第一輪深化見 [`DEEPENING-1-16.md`](./DEEPENING-1-16.md)；第二輪實玩深化見 [`PLAYABLE-DEPTH-1-16.md`](./PLAYABLE-DEPTH-1-16.md)。
