# 架構說明

這份文件描述 `src/` 底下的模組如何分工、彼此怎麼串起來。這次重構**只搬動程式碼、沒有改變任何規則或數值**——原本 `game.js` 一支檔案的內容被原封不動地拆進對應模組，行為與重構前完全一致（已用 Playwright 跑過一輪完整流程驗證：建立角色→擲骰→開啟經紀公司/行程 App→跑完 7 天含現場選擇→週結算→回到房間）。

沒有引入任何框架、建置工具或新套件：`index.html` 仍然只用瀏覽器原生 `<script type="module">` 載入 `src/main.js`，靠 ES module 的 `import`/`export` 做拆分。

## 分層與資料流

```
data/*        純資料表（能力、行程、通告、經紀公司、地圖、NPC……）
   ↓
core/*        state 單例、純工具函式、擲骰
   ↓
logic/*       規則判定與狀態變化（經紀公司、試鏡、逐日事件）
   ↓
views/*       把 state 轉成 HTML 字串，只讀不寫
   ↓
render.js     依 state.screen 挑一個畫面整包重繪，再呼叫 bind()
   ↓
bind.js       對剛畫出來的 DOM 掛事件；使用者操作 → 呼叫 logic → render()
   ↓
main.js       進入點：第一次擲骰 + 第一次 render()
```

上層可以匯入下層（例如 views 匯入 logic 與 data），但下層不會匯入上層（data 不知道 core 存在，core 不知道 logic 存在）。`render.js` 與 `bind.js` 互相匯入是唯一的例外：`render()` 畫完要呼叫 `bind()`，而 `bind()` 裡的操作又要呼叫 `render()` 才能看到結果——這是「畫面 → 事件 → 改 state → 重畫」這個迴圈本身的形狀，不是意外的循環依賴。ES module 允許這種循環，只要實際呼叫都發生在函式內部（事件觸發時）而不是模組載入當下，就不會有初始化順序的問題；`core/stats.js`、`logic/runner.js` 呼叫 `render()` 也是同樣道理。

整個遊戲**只有一個可變狀態物件**：`core/state.js` 匯出的 `state`。所有模組都直接讀寫它的屬性；只有「開新的一輪」需要整個物件換掉，這唯一的重新指派也只發生在 `core/state.js` 內部（透過 `resetState()`），避免其他檔案各自捏造新的 state 物件、產生兩份不同步的狀態。

## 各檔案內容

### `data/`（純資料，無邏輯）
| 檔案 | 內容 |
|---|---|
| `abilities.js` | 21 項公開能力分組、隱藏特質名稱表 |
| `actions.js` | 行事曆可安排的每種行程（訓練/工作/生活/休息/面談）及其花費、疲勞、成長區間 |
| `calendar.js` | 星期長/短名稱 |
| `focuses.js` | 本週策略選項 |
| `npcs.js` | 可認識的人物檔案 |
| `job.js` | 第一份通告（晨露汽水廣告）的固定條件 |
| `agencies.js` | 經紀公司清單（門檻、合約條件）——新增公司只需擴充這裡 |
| `map-locations.js` | 星望市地圖可選地點 |

### `core/`（狀態與通用工具）
| 檔案 | 內容 |
|---|---|
| `state.js` | `initialState()`、目前遊戲狀態 `state`、`resetState()`（開新一輪的唯一入口） |
| `utils.js` | `random`／`esc`／`money`／`width`／`successRateLabel`（只顯示文字提示、不外露精確機率）／`yearOf`／`weekInYear`／`jobWorkDaysText` |
| `stats.js` | `rollStats`／`initializeHiddenStats`／`reroll`——唯一會寫入能力初始值與隱藏特質的地方 |

### `logic/`（規則判定，直接改 state，不碰 DOM）
| 檔案 | 內容 |
|---|---|
| `agency.js` | 經紀公司資格判定、投遞／面談／簽約／到期的完整狀態機、通告抽成計算。三個關鍵不變量：①`isAgencyContractActive()` 是唯一判斷「合約是否仍有效」的地方；②`cancelAgencyInterview()` 是唯一取消面談的入口（手動覆蓋行程、住院都要走這裡）；③`deterministicInterviewScore()` 不含亂數，同一個 state 重算幾次都同分，真正成敗由 `logic/runner.js` 在結算時另外擲骰 |
| `jobs.js` | `resolveJobAudition`——試鏡是否獲選的判定 |
| `runner.js` | `decisionFor`（當天要不要跳現場選擇）、`applyGains`（套用能力成長）、`startDay`/`resolveDay`（逐日結算）、`hospitalize`（過勞強制住院）、`finishWeek`（週任務結算） |

### `views/`（只讀 state，回傳 HTML 字串，不寫 state）
| 檔案 | 內容 |
|---|---|
| `create.js` | 角色建立兩步驟（姓名性別／能力擲骰） |
| `room.js` | 房間主畫面、平板首頁/Dock、App 彈出視窗（`appWindow()` 是唯一知道「App id → 對應畫面函式」對照表的地方） |
| `planner.js` | 行程規劃 App、週任務提示、預算/疲勞預估、行事曆格子、活動抽屜 |
| `stats-app.js` | 能力資料 App |
| `people.js` | 手機通訊錄 App |
| `log.js` | 星途紀錄 App |
| `map.js` | 星望市地圖 App |
| `jobs.js` | 通告中心 App（含 `jobWorkDaysText` 供其他畫面共用） |
| `npc.js` | 人物檔案 App |
| `agency.js` | 經紀公司 App（列表、資格比對、面談狀態、合約卡片） |
| `runner.js` | 逐日事件畫面（loading／選擇／結果三態） |
| `summary.js` | 週結算畫面、戀愛關係摘要 |
| `ending.js` | 結局畫面、`startNewRun`（開新一輪的畫面端觸發點） |

### 頂層
| 檔案 | 內容 |
|---|---|
| `render.js` | 唯一寫 DOM 的地方：依 `state.screen` 選畫面、整包 `innerHTML` 重繪、呼叫 `bind()` |
| `bind.js` | 唯一掛事件的地方：依畫面分成 `bindCreateScreen`／`bindRunnerScreen`／`bindSummaryScreen`／`bindEndingScreen`／`bindRoomScreen` 五組，每個使用者操作最終都是「呼叫 logic 函式改 state → `render()`」 |
| `main.js` | 進入點：只呼叫一次 `rollStats()` 完成第一次擲骰與首次繪製 |

## 這次重構「沒有」做的事

拆檔只解決了「單一巨型檔案、無法定位邏輯」的問題。以下仍是原本就沒有、這次也刻意沒有加的東西（避免超出「模組化」這個範圍）：

- **沒有存檔機制**：仍然沒有 `localStorage`，重新整理頁面會遺失進度。
- **沒有測試**：沒有自動化測試檔或 CI 檢查，仍然只能手動／人工用瀏覽器驗證。
- **沒有建置工具或型別系統**：維持零依賴、瀏覽器原生 ES module，沒有 TypeScript、bundler。
- **`bind.js` 依然是集中式的事件總表**：拆成五個具名子函式讓每一段的職責看得出來，但沒有做成事件委派或每個 App 各自管理自己的事件——這類更大幅度的重構屬於「新架構」而非單純模組化，故未動。

如果之後要做這些，建議順序是：先加 `localStorage` 存讀檔（風險最低、價值最直接），再考慮把 `bind.js` 依 App 拆成各自的事件模組，測試與 TypeScript 放最後（範例／文字內容變動頻率高，過早鎖型別報酬不高）。
