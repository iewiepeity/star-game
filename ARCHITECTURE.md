# 架構說明

這份文件描述 `src/` 底下的模組如何分工、彼此怎麼串起來。這次重構**只搬動程式碼、沒有改變任何規則或數值**——原本 `game.js` 一支檔案的內容被原封不動地拆進對應模組，行為與重構前完全一致（已用 Playwright 跑過一輪完整流程驗證：建立角色→擲骰→開啟經紀公司/行程 App→跑完 7 天含現場選擇→週結算→回到房間）。

沒有引入任何框架、建置工具或新套件：`index.html` 仍然只用瀏覽器原生 `<script type="module">` 載入 `src/main.js`，靠 ES module 的 `import`/`export` 做拆分。

## 分層與資料流

```
data/*        純資料表（能力、行程、通告、經紀公司、地圖、NPC……）
   ↓
core/*        state 單例、存讀檔、純工具函式、擲骰
   ↓
logic/*       規則判定與狀態變化（經紀公司、試鏡、逐日事件）
   ↓
views/*       把 state 轉成 HTML 字串，只讀不寫
   ↓
render.js     依 state.screen 挑一個畫面整包重繪、呼叫 bind()、把 state 存進 localStorage
   ↓
bind.js       總表：依畫面/依 App 呼叫 bind/*.js；使用者操作 → 呼叫 logic → render()
   ↓
main.js       進入點：有存檔就還原，沒有就第一次擲骰 + 第一次 render()
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
| `npcs.js` | 可認識的人物檔案（含 `portrait` 立繪路徑，見下方「立繪」一節） |
| `job.js` | 第一份通告（晨露汽水廣告）的固定條件 |
| `agencies.js` | 經紀公司清單（門檻、合約條件）——新增公司只需擴充這裡 |
| `map-locations.js` | 星望市地圖可選地點 |
| `genders.js` | 性別選項清單（`KNOWN_GENDERS`／`GENDER_OPTIONS`），角色建立畫面與玩家立繪都靠這份清單判斷 |
| `portraits.js` | 舊版玩家立繪路徑相容對照；新功能不再直接使用 |
| `wardrobe.js` | 四款玩家立繪、三套服裝、價格、能力加成與素材路徑的唯一資料來源 |

### `core/`（狀態與通用工具）
| 檔案 | 內容 |
|---|---|
| `state.js` | `initialState()`、目前遊戲狀態 `state`、`resetState()`（開新一輪的唯一入口）、`hydrateState()`（從存檔還原及舊欄位遷移的唯一入口） |
| `persistence.js` | `saveState`／`loadState`——把 state 存進/讀出 `localStorage`，詳見下方「存讀檔」一節 |
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
| `wardrobe.js` | 紙娃娃衣櫃 App（人物切換、服裝預覽、價格與能力加成） |
| `runner.js` | 逐日事件畫面（loading／選擇／結果三態） |
| `summary.js` | 週結算畫面、戀愛關係摘要 |
| `ending.js` | 結局畫面、`startNewRun`（開新一輪的畫面端觸發點） |

### 頂層
| 檔案 | 內容 |
|---|---|
| `render.js` | 唯一寫 DOM 的地方：依 `state.screen` 選畫面、整包 `innerHTML` 重繪、呼叫 `bind()`、把 state 存檔 |
| `bind.js` | 事件總表：依 `state.screen` 分派 create／runner／summary／ending，房間畫面則依序呼叫每個 App 自己的 `bind/*.js` |
| `bind/*.js` | 每支對應一個畫面或一個平板 App，只找自己的 `data-*` 屬性掛事件；細節見下方「新增一個 App 的事件」 |
| `main.js` | 進入點：有存檔就 `hydrateState()` 還原，沒有就跟以前一樣 `rollStats()` 開新的一局 |

### `bind/`（事件層，一個畫面／一個 App 一支檔案）
| 檔案 | 對應 | 內容 |
|---|---|---|
| `create.js` | 角色建立畫面 | 姓名性別輸入、重骰、確認進入房間 |
| `runner.js` | 逐日事件畫面 | 現場選擇、前往下一天／查看本週總結 |
| `summary.js` | 週結算畫面 | 推進到下一週、檢查合約到期與通告違約 |
| `ending.js` | 結局畫面 | 切換眼熟繼承、開始新的一輪 |
| `room.js` | 房間外殼（非特定 App） | 開關 App 視窗、通告信封捷徑、空狀態的「去安排自由活動」、退圈入口 |
| `planner.js` | 行程規劃 App | 點日期開抽屜、篩選、選活動、切換策略、複製上週／全部休息、開始這週 |
| `map.js` | 星望市地圖 App | 選擇自由活動地點 |
| `npc.js` | 人物檔案 App | 切換目前查看的人物 |
| `agency.js` | 經紀公司 App | 切換公司、投遞／排面談／接受或婉拒合約 |
| `jobs.js` | 通告中心 App | 接取試鏡、簽約、排入拍攝日、試鏡現場選擇 |
| `wardrobe.js` | 紙娃娃衣櫃 App | 切換人物立繪、購買服裝、穿著造型 |

**新增一個 App 的事件**：在 `src/bind/` 底下加一支新檔案（例如 `bind/shop.js`），匯出一個 `bindShop()` 函式，只用 `document.querySelectorAll("[data-shop-action]")` 這類自己 App 專屬的 `data-*` 屬性去掛事件；然後在 `src/bind.js` 裡多一行 `import` 和多一行呼叫。**不需要改任何既有的 `bind/*.js`**——因為每支檔案只找自己的 `data-*` 屬性，某個 App 沒開啟時對應的 DOM 根本不存在，`querySelectorAll` 自然找不到東西、什麼事都不會發生，所以就算把全部 App 的 `bind*()` 都呼叫一輪也不會互相干擾。

## 存讀檔

`core/persistence.js` 把整個 `state` 序列化存進 `localStorage`（鍵名 `star-game-save`），存檔格式是 `{v: 版本號, state}`。存檔時機是 `render.js`——每次 `render()` 畫完面都會存一次，所以理論上不會有「忘記存檔」的情況，任何一次點擊之後重新整理頁面都能接回原本畫面。讀檔在 `main.js` 開機時做：讀到版本號吻合的存檔就用 `core/state.js` 的 `hydrateState()` 蓋掉初始狀態；讀不到、格式不對、或版本號不吻合，一律當作沒有存檔，照舊開新的一局。

兩個值得知道的細節：
- **版本號是為了未來的欄位變動準備的**：如果之後改了 `state` 的形狀（例如某個欄位改名、拿掉），把 `persistence.js` 裡的 `SAVE_VERSION` 加一即可——舊存檔會被判定成「版本不符」直接捨棄開新局，不需要另外寫遷移程式。真的想保留舊存檔玩家的進度時，才需要在 `loadState()` 加版本轉換邏輯。
- **`hydrateState()` 會補預設值並處理相容遷移**：先用 `Object.assign(initialState(), saved)` 補齊新欄位，再把舊版共用的 `mapLocation` 轉成逐日 `freeLocations[dayIndex]`。上週目的地則存於 `lastFreeLocations`，讓「複製上週」能同時還原行程與各日地點；非自由活動日期一律清除目的地，避免舊資料誤觸事件。
- **行程游標不循環覆蓋**：排入活動或自由活動地點後，游標最多只前進到星期日；在星期日繼續排程時會停在原位並顯示提示，不會繞回星期一覆蓋已排好的行程。
- **逐日事件的讀秒畫面（`runnerPhase==="loading"`）背後有一個 0.65 秒的 `setTimeout`**，重新整理頁面後計時器不會恢復。`main.js` 讀檔時特別檢查這個狀態，發現存檔剛好停在讀秒瞬間就重新呼叫一次 `startDay()`，讓當天重新跑一次讀秒，不會卡住。
- 所有 `localStorage` 存取都包在 `try/catch` 裡：私密瀏覽模式或使用者關閉網站資料時，存讀會靜默失敗，遊戲照常從新的一局開始，不會噴錯讓畫面卡死。

## 玩家立繪與紙娃娃換裝

玩家目前可選霧銀、暖杏、夜墨與春茶四款立繪，每款都有新人私服、練習服與舞台造型。素材集中於 `assets/avatars/`，資料、價格與能力加成集中於 `data/wardrobe.js`。

換裝採「同人物、同站姿的完整立繪切換」，而非把獨立衣服圖硬疊在身體上，避免不同身形造成領口、手臂與腰線錯位。`state.avatarId`、`state.outfitId` 與 `state.ownedOutfits` 會隨一般存檔保存；舊存檔缺少欄位時由 `initialState()` 自動補上預設值。

- 玩家立繪不再綁定 `state.gender`；姓名、性別／稱呼與外型可自由搭配。`playerPortraitPath()` 會依 `avatarId` 與 `outfitId` 即時計算素材路徑。
- `effectiveStat()` 會在基礎能力上加上目前服裝加成，能力頁、通告資質、試鏡、經紀公司資格與面談判定都使用此函式；訓練成長仍只寫入基礎能力，因此脫下服裝後加成會正確消失。
- NPC 立繪是每個人物資料自己的 `portrait` 欄位（`data/npcs.js`），新增 NPC 時比照加一行即可。
- 目前接好的位置：角色建立畫面（四款外型即時預覽）、紙娃娃衣櫃、房間畫面左上角玩家頭像、人物檔案 App 的大頭照與左側列表、手機通訊錄的聯絡人頭像。
- 刻意沒有接的位置：逐日事件畫面（現在的訓練/休息/工作等大部分行程沒有明確的「畫面上該放誰的立繪」，要接的話得先決定內容規則，不只是加參數，所以先跳過，需要的話再說）。

## 這次重構「沒有」做的事

拆檔／加存檔解決了「單一巨型檔案、無法定位邏輯」和「重整頁面進度就沒了」這兩個問題。以下仍是刻意沒有加的東西：

- **沒有測試**：沒有自動化測試檔或 CI 檢查，仍然只能手動／人工用瀏覽器驗證。
- **沒有建置工具或型別系統**：維持零依賴、瀏覽器原生 ES module，沒有 TypeScript、bundler。

這兩項的性質跟前面不一樣：測試與型別檢查的價值要在內容穩定下來、迭代速度變慢之後才划算，目前遊戲規則與文案都還在快速變動，過早導入反而會拖慢每次修改的速度，建議先不急著做。
