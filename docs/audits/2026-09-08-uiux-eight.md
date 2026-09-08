# UI/UX 1～8 改善與定向驗證

日期：2026-09-08  
基準提交：51abc1afecc1875f126eeb5366b08c372e5f61cc  
版本：Pixel 0.23.0／Core 1.46.0

## 實作對照

| 項目 | 已完成 | 主要位置與原因 |
| --- | --- | --- |
| 1．排程位置與復原 | 固定顯示所選日期與今天的行程；普通單次安排可復原最後一次；預算不預支收入，學費變動提示保持可見 | life-ui、planner-tools、ux-summaries：連排不用依賴消失的 Toast；復原重用排程規則，不還原整個存檔 |
| 2．時間成本 | 排入日期標示占一天；聊天與走訪標示不耗日；開始今天顯示今天真正要做的活動；自動執行說明剩餘行程 | life-ui、people、npc、city-ui：區分查看、規劃與執行，不改遊戲成本 |
| 3．人物入口 | 速覽提供聊天、見面、可接續／恢復的人物故事與可用戀愛日常 | npc、feature-ui：入口不必繞進回憶頁；故事仍由原有規則與事件佇列接續 |
| 4．結算重點 | 日結／週結最多三件真實成果，優先呈現關係、作品、突破等已有敘事與實際成長；明細可展開 | ux-summaries、life-ui：只做呈現，不新增獎勵，不宣稱不存在的里程碑 |
| 5．地圖情境 | 今天有約、待辦工作、想訓練、想休息；與既有搜尋交集使用，空結果明確說明 | map-purpose、city-ui：只讀玩家已接工作與自己的行程，不使用 NPC 隱藏位置 |
| 6．重要決定 | 婚禮與公開狀態先顯示影響、再確認；取消、過時與重複確認不執行；分手另放關係管理 | feature-ui、npc：降低誤觸，劇情裡原本已明確表達承諾的選項不再額外重複確認 |
| 7．設定分組 | 閱讀顯示在上方，其餘為聲音演出、故事、存檔資料、更新離線；保留裝置／存檔設定說明與原有控制項 | settings-ui、main：修改設定後保留摺疊與捲動位置，字體和原比例入口直接可見 |
| 8．手機閱讀與操作 | 長按鈕換行、常用控制至少 44px 高、相關文字跟隨閱讀字級、輸入至少 16px、重要操作樣式區分；鍵盤出現時限制面板在可見高度 | phone.css、viewport：不改像素美術或取消縮放；手機／平板鍵盤處理仍待實機視覺驗證 |

單次排程復原不跨讀檔保存。已開始的行動、變動的資源與正式約定不被當成可回溯的普通安排。恢復一個排程會使用原有 planDay 規則，不覆寫後來的角色偏好或其他存檔資料。

## 定向驗證

實際執行共 **19 項測試，全數通過**：

- tests/ux-eight.test.mjs：14 項，含真實 UI 處理函式、設定 markup、日結／週結輸出、地圖資料選擇、確認與取消，以及最小 DOM／VisualViewport 替身。
- tests/pixel-mobile-planner.test.mjs：1 項，連排仍跳過正式約定。
- tests/planner-undo-transaction.test.mjs：2 項，既有排程交易資料的復原。
- tests/romance-depth.test.mjs：僅 changed profile controls 這 1 項，更新為先確認再完成婚禮。
- tests/training-narrative-preferences.test.mjs：僅 legacy preferences default safely 這 1 項，檢查設定控制保留。

命令：

```sh
node --test tests/ux-eight.test.mjs tests/pixel-mobile-planner.test.mjs tests/planner-undo-transaction.test.mjs
node --test --test-name-pattern='changed profile controls' tests/romance-depth.test.mjs
node --test --test-name-pattern='legacy preferences default safely' tests/training-narrative-preferences.test.mjs
```

其他檢查：

- 僅變動 JS/MJS 的 ESLint：零錯誤、零警告。
- git diff --check 通過。
- npm run build 通過；離線清單 641 個檔案。
- npm run audit:pwa 通過，快取版本 star-game-runtime-v1.46.0。
- 新增 pixel-ux-eight.spec.mjs，四個情境涵蓋連排復原、設定展開、婚禮確認、地圖篩選；桌機／手機共八個案例完成測試清單載入。
- 受摺疊分組影響的既有 E2E 導航改為先點開祖先 details 的 summary；不強制點擊隱藏控制項。僅做清單／語法載入檢查，沒有把它們算成執行通過。
- 現有環境無 Chromium 可執行檔；**未執行瀏覽器視覺、真實觸控、iOS 鍵盤或橫直向實測**。DOM 替身與 CSS 靜態規則檢查不等於這些實測。
- 沒有跑全套 npm test、check 或五年遊戲流程。

## 交付狀態

功能與本機 build 完成；未推送 main、未部署。本文件記錄的是實作完成時的狀態。

## 既有文字與介面替換紀錄

以下是相對上述基準的原文／新文與位置（- 為原文，+ 為新文）；修改原因對應前述八項。原有劇情文本未刪除，僅新增結算摘要與明細展開。新檔 ux-summaries.js、map-purpose.js 沒有被替代的原文。

```diff
diff --git a/phone.css b/phone.css
index 6292ac1..c6fa14f 100644
--- a/phone.css
+++ b/phone.css
@@ -284,3 +284,36 @@
      list heading's space so the composer stays within the phone viewport. */
   :is(#panel .pixel-app, .people-hub) .messenger.thread-open .inside-title { display: none; }
 }
+/* Task-focused mobile UI: keep pixel decoration, readable text and clear controls. */
+#panel .planner-context {
+  position: sticky; top: 0; z-index: 5; display: flex; align-items: center;
+  justify-content: space-between; gap: 10px; padding: 12px;
+  background: var(--ui-paper); color: var(--ui-ink); border: 2px solid var(--ui-edge);
+}
+#panel .planner-context small { display: block; margin-top: 5px; }
+#panel :is(.planner-budget, .journey-highlights, .npc-quick-actions) { margin-block: 14px; }
+#panel .journey-highlights article { padding: 12px; margin-block: 8px; border-inline-start: 3px solid var(--ui-accent); background: var(--ui-tint); }
+#panel :is(.settings-group, .planner-extras, .result-breakdown, .relationship-management) { margin-block: 12px; border: 1px solid var(--ui-edge); padding: 10px; }
+#panel :is(.settings-group, .planner-extras, .result-breakdown, .relationship-management) > summary { cursor: pointer; min-height: 44px; display: list-item; align-content: center; font-weight: 700; }
+#panel .relationship-management { flex-basis: 100%; }
+#panel .map-purpose { display: flex; flex-wrap: wrap; gap: 8px; margin-block: 10px; }
+#panel .map-purpose [aria-pressed="true"] { border-width: 2px; font-weight: 700; text-decoration: underline; text-underline-offset: 4px; }
+#panel :is(.primary, .main-btn) { font-weight: 700; border-width: 2px; }
+#panel button.danger { border: 2px solid #8a2434; color: #8a2434; background: #fff1f2; }
+#panel :is(.planner-context, .planner-budget, .npc-quick-actions, .settings-groups, .journey-highlights) small { font-size: calc(14px * var(--reading-scale, 1)); line-height: 1.65; }
+#panel[data-keyboard="true"] { max-height: var(--usable-panel-height, calc(100dvh - 24px)); top: var(--visible-panel-top, 12px); bottom: auto; margin-block: 0; }
+@media (max-width: 700px) {
+  #panel { max-height: min(calc(100dvh - 24px), var(--usable-panel-height, 100dvh)); }
+  #panel button:not(.map-landmark):not(.close-panel) { min-height: 44px; white-space: normal; overflow-wrap: anywhere; height: auto; }
+  #panel :is(.command-row, .npc-actions button, .panel-actions button, .chat-send-row button) { min-width: 0; line-height: 1.5; }
+  #panel :is(.command-row small, .chat-composer small, .chat-composer nav button, .character-memory small, .npc-actions button, .map-detail p) { font-size: calc(14px * var(--reading-scale, 1)); }
+  #panel :is(input, textarea, select) { font-size: max(16px, calc(16px * var(--reading-scale, 1))); }
+  #panel .planner-context { align-items: stretch; flex-direction: column; padding: 8px; }
+  #panel .planner-context button { align-self: flex-start; }
+  #panel .chat-composer { position: static; }
+  #panel .chat-send-row { flex-wrap: wrap; }
+  #panel .chat-send-row small { flex-basis: 100%; }
+  #panel .chat-send-row button { flex: 1 1 130px; }
+  #panel :is(.eyebrow, .inside-title > div > span, .npc-quick-actions > small) { letter-spacing: .04em; }
+  #panel .eyebrow { font-size: calc(12px * var(--reading-scale, 1)); }
+}
diff --git a/src/pixel/city-ui.js b/src/pixel/city-ui.js
index 5bc5f29..9d82524 100644
--- a/src/pixel/city-ui.js
+++ b/src/pixel/city-ui.js
@@ -1,3 +1,6 @@
+import { MAP_PURPOSES, mapPurposeRooms } from "./map-purpose.js";
+import { esc } from "../core/utils.js";
+import { access } from "./life.js";
 import {
   CITY_PLACES,
   CITY_CATALOG,
@@ -9,6 +12,7 @@ import { ROOMS } from "./data.js";
 import { CHOICES } from "./life.js";
 import { AGENCIES } from "../data/agencies.js";
 export function createCityUI(api) {
+  let purpose = "all", applyMapFilter = null;
   let zoom = 1,
     selectedId = null,
     travelTimer = null,
@@ -29,9 +33,9 @@ export function createCityUI(api) {
     const place = CITY_PLACES.find((p) => p.id === publicRoom(id));
     const current = s().sceneId === id,
       name = place?.id === id ? place.name : ROOMS[id].name;
-    const services = Object.values(CHOICES)
-      .filter((d) => d.room === id && ["訓練", "工作"].includes(d.group))
-      .map((d) => d.label);
+    const services = Object.entries(CHOICES)
+      .filter(([, d]) => d.room === id && ["訓練", "工作", "休息"].includes(d.group))
+      .map(([key, d]) => { const reason = access(s().life, { id: key }); return `${d.label} · 占一天${reason ? `（${reason}）` : ""}`; });
     document
       .querySelectorAll("[data-map-place], [data-map-list]")
       .forEach((b) =>
@@ -40,7 +44,7 @@ export function createCityUI(api) {
     const el = document.getElementById("map-detail");
     if (!el) return;
     el.dataset.place = id;
-    el.innerHTML = `<div><small>${place?.district || "星望市"} · ${current ? "你在這裡" : s().visited.includes(id) ? "曾經到訪" : "還沒去過"}</small><h3>${name}</h3><p>${services.length ? services.join("・") : place?.description || "走進這個地方，看看身邊的人與物。"}</p></div><button class="primary" data-map-enter="${id}" ${current ? "disabled" : ""}>${current ? "目前位置" : "前往這裡 →"}</button>`;
+    el.innerHTML = `<div><small>${place?.district || "星望市"} · ${current ? "你在這裡" : s().visited.includes(id) ? "曾經到訪" : "還沒去過"}</small><h3>${name}</h3><p>${services.length ? services.map(esc).join("；") : place?.description || "走進這個地方，看看身邊的人與物。"}</p></div><button class="primary" data-map-enter="${id}" ${current ? "disabled" : ""}>${current ? "目前位置" : "前往看看 · 不耗一天 →"}</button>`;
   }
   function overview() {
     const el = document.getElementById("map-detail");
@@ -55,7 +59,7 @@ export function createCityUI(api) {
     cancelRoute();
     api.show(
       "travel",
-      `<header class="map-heading">${api.heading("STARWISH CITY", "星望市", "點建築選擇目的地，走訪不消耗天數。")}</header><div class="map-tools"><label><span class="sr-only">尋找地點</span><input id="map-search" type="search" placeholder="找地點、課程或公司…" autocomplete="off"></label><button data-map-zoom="out" aria-label="縮小地圖">−</button><button data-map-zoom="in" aria-label="放大地圖">＋</button><button data-map-home>全市</button></div><div class="city-map-viewport" tabindex="0" aria-label="星望市地圖，可捲動"><div class="city-map-canvas" style="--map-zoom:${zoom}"><img class="city-map-art" src="assets/pixel/city/map-organic.webp" alt="星望市：影視、音樂、傳媒、文化、生活與海灣街區"><nav class="city-map-landmarks" aria-label="城市地點">${CITY_PLACES.map((p) => `<button class="map-landmark ${publicRoom(s().sceneId) === p.id ? "current" : ""}" style="--x:${p.x}%;--y:${p.y}%" data-map-place="${p.id}" aria-label="${p.name}" aria-pressed="false"><span>${p.short}</span>${publicRoom(s().sceneId) === p.id ? '<i aria-hidden="true">▼</i>' : ""}</button>`).join("")}</nav></div></div><div id="map-detail" class="map-detail" aria-live="polite"><div><small>我的城市足跡</small><h3>${CITY_PLACES.filter((p) => s().visited.includes(p.id)).length} / 27</h3><p>移到建築上看看，或點一下選擇。手機可以放大、滑動地圖。</p></div><button data-ui="close">回到${ROOMS[s().sceneId].name}</button></div>`,
+      `<header class="map-heading">${api.heading("STARWISH CITY", "星望市", "點建築選擇目的地，走訪不消耗天數。")}</header><nav class="map-purpose" aria-label="今天想做什麼">${Object.entries(MAP_PURPOSES).map(([key, label]) => `<button data-map-purpose="${key}" aria-pressed="${purpose === key}">${label}</button>`).join("")}</nav><div class="map-tools"><label><span class="sr-only">尋找地點</span><input id="map-search" type="search" placeholder="找地點、課程或公司…" autocomplete="off"></label><button data-map-zoom="out" aria-label="縮小地圖">−</button><button data-map-zoom="in" aria-label="放大地圖">＋</button><button data-map-home>全市</button></div><div class="city-map-viewport" tabindex="0" aria-label="星望市地圖，可捲動"><div class="city-map-canvas" style="--map-zoom:${zoom}"><img class="city-map-art" src="assets/pixel/city/map-organic.webp" alt="星望市：影視、音樂、傳媒、文化、生活與海灣街區"><nav class="city-map-landmarks" aria-label="城市地點">${CITY_PLACES.map((p) => `<button class="map-landmark ${publicRoom(s().sceneId) === p.id ? "current" : ""}" style="--x:${p.x}%;--y:${p.y}%" data-map-place="${p.id}" aria-label="${p.name}" aria-pressed="false"><span>${p.short}</span>${publicRoom(s().sceneId) === p.id ? '<i aria-hidden="true">▼</i>' : ""}</button>`).join("")}</nav></div></div><div id="map-detail" class="map-detail" aria-live="polite"><div><small>我的城市足跡</small><h3>${CITY_PLACES.filter((p) => s().visited.includes(p.id)).length} / 27</h3><p>移到建築上看看，或點一下選擇。手機可以放大、滑動地圖。</p></div><button data-ui="close">回到${ROOMS[s().sceneId].name}</button></div>`,
     );
     const tip = document.querySelector("#panel-content > .pixel-tutorial");
     if (tip) {
@@ -88,7 +92,8 @@ export function createCityUI(api) {
     mapObserver = new window.ResizeObserver(fit);
     mapObserver.observe(viewport);
     fit();
-    input.addEventListener("input", () => {
+    applyMapFilter = () => {
+      const allowed = mapPurposeRooms(s().life, purpose);
       const q = input.value.trim().toLowerCase();
       let matches = 0;
       for (const b of document.querySelectorAll("[data-map-place], [data-map-list]")) {
@@ -102,21 +107,26 @@ export function createCityUI(api) {
             .filter((c) => c.room === p.id)
             .map((c) => c.label),
         ].join(" ");
+        const visible = allowed.has(p.id) && (!q || words.toLowerCase().includes(q));
         b.classList.toggle(
           "search-match",
-          !!q && words.toLowerCase().includes(q),
+          (purpose !== "all" || !!q) && visible,
         );
         b.classList.toggle(
           "search-muted",
-          !!q && !words.toLowerCase().includes(q),
+          !visible,
         );
         if (b.dataset.mapList) {
-          b.hidden = !!q && !words.toLowerCase().includes(q);
+          b.hidden = !visible;
           if (!b.hidden) matches++;
         }
       }
-      directory.querySelector(".map-no-results").hidden = matches > 0;
-    });
+      const empty = directory.querySelector(".map-no-results");
+      empty.hidden = matches > 0;
+      empty.textContent = purpose === "appointment" ? "今天沒有符合搜尋的已排約定，可改看全部地點。" : purpose === "work" ? "目前沒有符合搜尋的已接工作，可改看全部地點。" : "沒有符合目前條件的地點，換個篩選或搜尋試試。";
+    };
+    input.addEventListener("input", applyMapFilter);
+    applyMapFilter();
     for (const b of document.querySelectorAll("[data-map-place], [data-map-list]")) {
       const id = b.dataset.mapPlace || b.dataset.mapList;
       b.addEventListener("pointerenter", (e) => {
@@ -205,6 +215,13 @@ export function createCityUI(api) {
   }
   function handle(b) {
     const d = b.dataset;
+    if (d.mapPurpose) {
+      if (!Object.hasOwn(MAP_PURPOSES, d.mapPurpose) || storyTrip) return true;
+      purpose = d.mapPurpose;
+      document.querySelectorAll("[data-map-purpose]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.mapPurpose === purpose)));
+      applyMapFilter?.();
+      return true;
+    }
     if (d.mapPlace || d.mapList) {
       // A story trip must retain its arrival callback and agreed destination.
       // Clicking a landmark while the short route preview is visible must not
diff --git a/src/pixel/feature-ui.js b/src/pixel/feature-ui.js
index e15a85a..58ef5b2 100644
--- a/src/pixel/feature-ui.js
+++ b/src/pixel/feature-ui.js
@@ -1,3 +1,5 @@
+import { requestRomanceDaily } from "../logic/romance-daily.js";
+import { enqueueVisibleEvent } from "../logic/event-engine.js";
 import { beginRomanceRepair, reviewRomanceRepair, chooseRomanceCeremony, REPAIR_COPY } from "../logic/romance-life.js";
 import { pausePersonalStory, resumePersonalStory } from "../logic/personal-stories.js";
 import { prunePersonalStoryEvents, requestPersonalStory } from "../logic/event-engine.js";
@@ -94,6 +96,8 @@ const views = {
 
 export function createFeatureUI(api) {
   const collapsedProjectIds = new Set();
+  let pendingRelationshipDecision = null;
+  const relationshipSnapshot = id => JSON.stringify([life().game.partnerId, life().game.relationships?.[id]?.romance, life().game.relationships?.[id]?.visibility, life().game.relationships?.[id]?.ceremony]);
   let current = "phone",
     fitting = null,
     wardrobeFilter = "all",
@@ -108,6 +112,7 @@ export function createFeatureUI(api) {
   const card = ([id, title, note]) =>
     `<button data-pixel-app="${id}"><i>${appIcon(id)}</i><span><b>${title}</b><small>${note}</small></span></button>`;
   function open(id = "phone") {
+    pendingRelationshipDecision = null;
     if (id === "npc") id = "people";
     recordRecentApp(life().game, id);
     current = id;
@@ -524,9 +529,39 @@ export function createFeatureUI(api) {
       }
       return true;
     }
-    if (d.romanceRepair || d.romanceCeremony) {
+    if (d.romanceDaily) {
       mutate(() => {
-        const result = d.romanceCeremony ? chooseRomanceCeremony(d.npcId, d.romanceCeremony) : d.romanceRepair === "begin" ? beginRomanceRepair(d.npcId) : reviewRomanceRepair(d.npcId);
+        const result = requestRomanceDaily(d.romanceDaily);
+        if (!result.ok) return { message: result.text };
+        const queued = enqueueVisibleEvent(result.event, "玩家選擇戀愛日常");
+        return { message: queued && queued !== "expired" ? "已排進後續故事；不會直接執行今天的行程。" : "這段相處已在等待的故事裡，不會重複安排。" };
+      });
+      return true;
+    }
+    if (d.confirmRelationship) {
+      const decision = pendingRelationshipDecision;
+      pendingRelationshipDecision = null;
+      if (!decision || decision.snapshot !== relationshipSnapshot(decision.id)) { api.toast("關係狀態已改變，請重新確認。"); return true; }
+      current = "people";
+      mutate(() => {
+        const result = decision.kind === "ceremony" ? chooseRomanceCeremony(decision.id, decision.value) : setRomanceVisibility(decision.id, decision.value);
+        return { ...result, message: result.text || result.reason || "已更新彼此共同決定的公開狀態。" };
+      });
+      return true;
+    }
+    if (d.romanceCeremony || d.romanceAction === "public" || d.romanceAction === "underground") {
+      const kind = d.romanceCeremony ? "ceremony" : "visibility";
+      const value = d.romanceCeremony || d.romanceAction;
+      const copy = kind === "ceremony"
+        ? value === "small" ? ["一起辦親友小婚禮？", "確認後會留下已完成婚禮的紀錄，不能重複舉辦。婚訊不會因此自動公開，也不扣遊戲天數或金錢。"] : ["暫時不辦儀式？", "婚姻與公開狀態不變；日後仍可以一起補辦親友小婚禮。"]
+        : value === "public" ? ["一起公開這段關係？", "外界會知道你們的關係，可能帶來關注與輿論壓力。以後可以少談私生活，但已公開的消息不會消失。這不會改變婚禮安排。"] : ["保留更多私人空間？", "往後不再主動公開私生活；已公開的消息不會消失，伴侶與婚禮狀態不變。"];
+      pendingRelationshipDecision = { id: d.npcId, kind, value, snapshot: relationshipSnapshot(d.npcId) };
+      api.show("relationship-confirm", `${api.heading("OUR DECISION", copy[0], copy[1])}<div class="pixel-app panel-actions"><button data-pixel-app="people">先不改變</button><button class="primary" data-confirm-relationship="yes">確認這個決定</button></div>`);
+      return true;
+    }
+    if (d.romanceRepair) {
+      mutate(() => {
+        const result = d.romanceRepair === "begin" ? beginRomanceRepair(d.npcId) : reviewRomanceRepair(d.npcId);
         return { ...result, message: result.text || result.reason };
       });
       return true;
diff --git a/src/pixel/life-ui.js b/src/pixel/life-ui.js
index 874742f..6b471c9 100644
--- a/src/pixel/life-ui.js
+++ b/src/pixel/life-ui.js
@@ -1,4 +1,5 @@
-import { trainingSubsidyNotice } from "../logic/economy.js";
+import { plannerContext, highlightsMarkup } from "./ux-summaries.js";
+import { planRoutineWithUndo, undoRoutine } from "./planner-tools.js";
 import { selectWeeklyGoal } from "../logic/weekly-goals.js";
 import { withCore } from "./core-bridge.js";
 import { trainingLevel } from "../logic/training-narrative.js";
@@ -131,7 +132,7 @@ export function createLifeUI(api) {
         return row(
           training ? `${d.label} · ${training.label}` : d.label,
           reason ||
-            `${ROOMS[d.room].name}${training ? ` · ${training.problem}${training.unlocked ? " · 已掌握突破技巧，可用於相關試鏡" : ""}` : ""}${!hasVisited(l.game, ROOMS[d.room].venue) && d.room !== "home" ? " · 含首次前往" : ""}`,
+            `排入所選日期 · 占一天 · ${ROOMS[d.room].name}${training ? ` · ${training.problem}${training.unlocked ? " · 已掌握突破技巧，可用於相關試鏡" : ""}` : ""}${!hasVisited(l.game, ROOMS[d.room].venue) && d.room !== "home" ? " · 含首次前往" : ""}`,
           `data-plan="${id}" ${a.projectId ? `data-project="${a.projectId}"` : ""} ${locked ? "disabled" : ""} aria-pressed="${selected.id === id}"`,
           costOf(l, a) ? money(costOf(l, a)) : "—",
         );
@@ -139,7 +140,7 @@ export function createLifeUI(api) {
       .join("");
     show(
       "schedule",
-      `${heading("WEEKLY PLAN", "我的一週", "第一週就能自由改排。課程與工作會帶你前往場地，不需先花一天登記。")}${weeklyFocusMarkup(l)}<p class="tiny-note" data-training-subsidy>${escape(trainingSubsidyNotice(l.game.week))}</p>${plannerToolsMarkup(l)}<div class="week-strip" role="group" aria-label="七日行程">${l.plan.map((a, i) => `<button data-day="${i}" class="${i === selectedDay ? "selected" : ""}" ${i < l.day ? "disabled" : ""}><small>週${"一二三四五六日"[i]}</small><strong>${escape(label(a))}</strong><span>${i < l.day ? "已完成" : i === l.day ? "今天" : "可調整"}</span></button>`).join("")}</div><div class="section-heading"><b>安排 ${DAY_NAMES[selectedDay]}</b><span>餘下學費／外出費 ${money(estimate)}</span></div><nav class="schedule-filters" aria-label="行程類型">${["全部", "訓練", "工作", "探訪", "生活", "創作", "休息"].map((f) => `<button data-schedule-filter="${f}" aria-pressed="${filter === f}">${f}</button>`).join("")}</nav><div class="action-catalog">${cards}</div><div class="panel-actions"><button data-ui="menu">◀ 選單</button><button data-life="auto" ${l.pending ? "disabled" : ""}>自動執行行程</button><button class="primary" data-life="today">開始今天 →</button></div>`,
+      `${heading("WEEKLY PLAN", "我的一週", "第一週就能自由改排。課程與工作會帶你前往場地，不需先花一天登記。")}${plannerContext(l, selectedDay)}<details class="planner-extras"><summary>本週目標、補助與排程助手</summary>${weeklyFocusMarkup(l)}${plannerToolsMarkup(l)}</details><div class="week-strip" role="group" aria-label="七日行程">${l.plan.map((a, i) => `<button data-day="${i}" class="${i === selectedDay ? "selected" : ""}" ${i < l.day ? "disabled" : ""}><small>週${"一二三四五六日"[i]}</small><strong>${escape(label(a))}</strong><span>${i < l.day ? "已完成" : i === l.day ? "今天" : "可調整"}</span></button>`).join("")}</div><div class="section-heading"><b>安排 ${DAY_NAMES[selectedDay]}</b><span>餘下學費／外出費 ${money(estimate)}</span></div><nav class="schedule-filters" aria-label="行程類型">${["全部", "訓練", "工作", "探訪", "生活", "創作", "休息"].map((f) => `<button data-schedule-filter="${f}" aria-pressed="${filter === f}">${f}</button>`).join("")}</nav><div class="action-catalog">${cards}</div><div class="panel-actions"><button data-ui="menu">◀ 選單</button><button data-life="auto" ${l.pending ? "disabled" : ""}>依序執行剩餘行程</button><button class="primary" data-life="today">開始今天 · ${escape(label(l.plan[l.day]))} →</button></div>`,
       { preserveScroll: true, scrollAnchor },
     );
   }
@@ -160,7 +161,7 @@ export function createLifeUI(api) {
       reason = access(l, assignment);
     show(
       "action",
-      `${heading("TODAY", label(assignment), reason || "確認後，這件事會佔用今天的主要行程。")}${trainingLevel(d.action, l.game) ? `<p class="result-note">${escape(trainingLevel(d.action, l.game).label)}課題：${escape(trainingLevel(d.action, l.game).lesson.title)}。${trainingLevel(d.action, l.game).sessions ? `上次留下的問題：${escape(trainingLevel(d.action, l.game).problem)}。` : "老師會從目前的能力開始，留下練習記錄。"}</p>` : ""}<div class="action-detail">${roomIllustration(ROOMS[d.room])}<div><b>${ROOMS[d.room].name}</b><p>${costOf(l, assignment) ? `花費 ${money(costOf(l, assignment))}` : "不需費用"} · 1 天</p><small>${assignment.id === "rest" ? "體力 +24 · 疲勞 −18" : d.group === "訓練" ? "課程效果依當日身體狀態調整" : d.group === "工作" && ACTIONS[d.action].income ? `收入 $${ACTIONS[d.action].income[0].toLocaleString()}～$${ACTIONS[d.action].income[1].toLocaleString()} · 疲勞 +${ACTIONS[d.action].fatigue}` : assignment.id === "creative" ? "疲勞 +6 · 同一週可安排多天創作" : "完成後在日誌留下今日成果"}</small></div></div><div class="panel-actions"><button data-ui="close">再想一下</button><button class="primary" data-start="${assignment.id}" data-assignment="${escape(JSON.stringify(assignment))}" ${assignment.projectId ? `data-project="${escape(assignment.projectId)}"` : ""} ${reason ? "disabled" : ""}>確認今天的安排</button></div>`,
+      `${heading("TODAY", label(assignment), reason || "確認後，這件事會佔用今天的主要行程。")}${trainingLevel(d.action, l.game) ? `<p class="result-note">${escape(trainingLevel(d.action, l.game).label)}課題：${escape(trainingLevel(d.action, l.game).lesson.title)}。${trainingLevel(d.action, l.game).sessions ? `上次留下的問題：${escape(trainingLevel(d.action, l.game).problem)}。` : "老師會從目前的能力開始，留下練習記錄。"}</p>` : ""}<div class="action-detail">${roomIllustration(ROOMS[d.room])}<div><b>${ROOMS[d.room].name}</b><p>${costOf(l, assignment) ? `花費 ${money(costOf(l, assignment))}` : "不需費用"} · 1 天</p><small>${assignment.id === "rest" ? "體力 +24 · 疲勞 −18" : d.group === "訓練" ? "課程效果依當日身體狀態調整" : d.group === "工作" && ACTIONS[d.action].income ? `收入 $${ACTIONS[d.action].income[0].toLocaleString()}～$${ACTIONS[d.action].income[1].toLocaleString()} · 疲勞 +${ACTIONS[d.action].fatigue}` : assignment.id === "creative" ? "疲勞 +6 · 同一週可安排多天創作" : "完成後在日誌留下今日成果"}</small></div></div><div class="panel-actions"><button data-ui="close">再想一下</button><button class="primary" data-start="${assignment.id}" data-assignment="${escape(JSON.stringify(assignment))}" ${assignment.projectId ? `data-project="${escape(assignment.projectId)}"` : ""} ${reason ? "disabled" : ""}>開始今天 · ${escape(label(assignment))}</button></div>`,
     );
   }
   function run(assignment, auto = false) {
@@ -380,7 +381,7 @@ export function createLifeUI(api) {
       });
     show(
       "result",
-      `${heading(r.presentation?.audition ? "AUDITION DAY" : "A DAY TO REMEMBER", r.presentation?.audition ? `${DAY_NAMES[r.day]} · 試鏡結果` : `${DAY_NAMES[r.day]} · ${r.label}`)}${r.presentation?.audition ? auditionResultCard(r.presentation.audition) : `<div class="result-scene">${roomIllustration(ROOMS[definition(life(), r.assignment).room])}<span>今日完成</span></div>`}<div class="result-values">${Object.entries(
+      `${heading(r.presentation?.audition ? "AUDITION DAY" : "A DAY TO REMEMBER", r.presentation?.audition ? `${DAY_NAMES[r.day]} · 試鏡結果` : `${DAY_NAMES[r.day]} · ${r.label}`)}${r.presentation?.audition ? auditionResultCard(r.presentation.audition) : `<div class="result-scene">${roomIllustration(ROOMS[definition(life(), r.assignment).room])}<span>今日完成</span></div>`}${highlightsMarkup([r], "今天留下的變化")}<details class="result-breakdown"><summary>查看詳細數值</summary><div class="result-values">${Object.entries(
         r.deltas,
       )
         .filter(([, v]) => v)
@@ -390,7 +391,7 @@ export function createLifeUI(api) {
         )
         .join(
           "",
-        )}${r.gains.map((g) => `<div><small>${g.name}</small><b>+${g.amount}</b></div>`).join("")}</div>${notes.map((n) => `<p class="result-note">${escape(n)}</p>`).join("")}${(r.moments || []).map(m => `<article class="daily-moment"><span class="eyebrow">今日小記 · ${escape(m.kind)}</span><h3>${escape(m.title)}</h3><p>${escape(narrativeText(m.text, life().game))}</p>${narrativeText(m.text, life().game) !== m.text ? `<details><summary>閱讀完整文本</summary><p>${escape(m.text)}</p></details>` : ""}<p class="moment-outcome">${escape(m.outcome)}</p>${m.effects.length ? `<small>${m.effects.map(escape).join(" · ")}</small>` : ""}</article>`).join("")}<div class="panel-actions">${r.presentation?.jobOfferId ? `<button data-job="${r.presentation.jobOfferId}">閱讀通告合約</button>` : ""}${r.presentation?.agencyOfferId ? `<button data-agency-info="${r.presentation.agencyOfferId}">閱讀經紀合約</button>` : ""}<button data-ui="saves">保存今天</button><button class="primary" data-life="advance">${life().day === 6 ? "看看這一週" : "迎接明天 →"}</button></div>`,
+        )}${r.gains.map((g) => `<div><small>${g.name}</small><b>+${g.amount}</b></div>`).join("")}</div></details>${notes.map((n) => `<p class="result-note">${escape(n)}</p>`).join("")}${(r.moments || []).map(m => `<article class="daily-moment"><span class="eyebrow">今日小記 · ${escape(m.kind)}</span><h3>${escape(m.title)}</h3><p>${escape(narrativeText(m.text, life().game))}</p>${narrativeText(m.text, life().game) !== m.text ? `<details><summary>閱讀完整文本</summary><p>${escape(m.text)}</p></details>` : ""}<p class="moment-outcome">${escape(m.outcome)}</p>${m.effects.length ? `<small>${m.effects.map(escape).join(" · ")}</small>` : ""}</article>`).join("")}<div class="panel-actions">${r.presentation?.jobOfferId ? `<button data-job="${r.presentation.jobOfferId}">閱讀通告合約</button>` : ""}${r.presentation?.agencyOfferId ? `<button data-agency-info="${r.presentation.agencyOfferId}">閱讀經紀合約</button>` : ""}<button data-ui="saves">保存今天</button><button class="primary" data-life="advance">${life().day === 6 ? "看看這一週" : "迎接明天 →"}</button></div>`,
     );
     read();
   }
@@ -417,7 +418,7 @@ export function createLifeUI(api) {
       r.results.reduce((s, r) => s + r.deltas.money, 0) + r.reward.money;
     show(
       "summary",
-      `${heading("WEEK IN REVIEW", `第 ${r.week} 週 · 我的成長`)}<div class="week-reward"><span>本週淨收支</span><strong>${net > 0 ? "+" : ""}${money(net)}</strong><small>${r.reward.met ? `達成${escape(r.reward.goalLabel || (r.reward.orientation ? "新人安頓" : "每週養成"))}任務 · 補助 ${money(r.reward.money)}` : "下週再試：探訪／訓練、工作與適當休息"}</small></div><ol class="week-history">${r.results.map((r) => `<li><small>週${"一二三四五六日"[r.day]}</small><b>${escape(r.label)}</b><span>${r.deltas.money ? money(r.deltas.money) : "—"}</span></li>`).join("")}</ol><div class="panel-actions"><button data-ui="saves">存檔</button><button class="primary" data-life="next-week">開始下一週 →</button></div>`,
+      `${heading("WEEK IN REVIEW", `第 ${r.week} 週 · 我的成長`)}${highlightsMarkup(r.results, "這週值得記住的事")}<div class="week-reward"><span>本週淨收支</span><strong>${net > 0 ? "+" : ""}${money(net)}</strong><small>${r.reward.met ? `達成${escape(r.reward.goalLabel || (r.reward.orientation ? "新人安頓" : "每週養成"))}任務 · 補助 ${money(r.reward.money)}` : "下週再試：探訪／訓練、工作與適當休息"}</small></div><details class="result-breakdown"><summary>查看七日行程與收支</summary><ol class="week-history">${r.results.map((r) => `<li><small>週${"一二三四五六日"[r.day]}</small><b>${escape(r.label)}</b><span>${r.deltas.money ? money(r.deltas.money) : "—"}</span></li>`).join("")}</ol></details><div class="panel-actions"><button data-ui="saves">存檔</button><button class="primary" data-life="next-week">開始下一週 →</button></div>`,
     );
   }
   function narrativeHistory() {
@@ -575,8 +576,15 @@ export function createLifeUI(api) {
       schedule(Number(d.day));
       return true;
     }
+    if (d.routineUndo !== undefined) {
+      const result = undoRoutine(l);
+      toast(result.message);
+      if (result.ok) { selectedDay = result.day; checkpoint(); changed(); }
+      schedule(selectedDay);
+      return true;
+    }
     if (d.plan) {
-      const reason = planDay(l, selectedDay, {
+      const reason = planRoutineWithUndo(l, selectedDay, {
         id: d.plan,
         ...(d.project ? { projectId: d.project } : {}),
       });
diff --git a/src/pixel/main.js b/src/pixel/main.js
index 83ff7f9..0d3947b 100644
--- a/src/pixel/main.js
+++ b/src/pixel/main.js
@@ -303,6 +303,7 @@ function settings() {
   show(
     "settings",
     `${heading("YOUR LITTLE WORLD", "照自己的步調")}${settingsMarkup({ theme: preferences.get().theme, speed: state.life.speed, paused, preferences: preferences.get(), narrativeSettings: state.life.game.narrativeSettings })}`,
+    { preserveScroll: true },
   );
 }
 function clinic() {
diff --git a/src/pixel/settings-ui.js b/src/pixel/settings-ui.js
index ba0d594..09472e7 100644
--- a/src/pixel/settings-ui.js
+++ b/src/pixel/settings-ui.js
@@ -5,24 +5,8 @@ import { menuIcon } from "./menu-icons.js";
 export function settingsMarkup({ theme, speed, paused, preferences = {}, narrativeSettings = {} }) {
   const narrative = normalizeNarrativeSettings(narrativeSettings);
   const options = (key, entries) => `<div class="speed-options" role="group">${entries.map(([value, label]) => `<button data-narrative-pref="${key}" data-value="${value}" aria-pressed="${narrative[key] === value}">${label}</button>`).join("")}</div>`;
-  return `<div class="preference-studio">
-    <section class="version-summary" aria-label="目前版本"><div><span>你正在玩的版本</span><strong>像素版 v${PIXEL_VERSION}</strong><small>星望市施工日誌，歡迎翻閱。</small></div><button data-ui="release-notes">版本更新紀錄 <span aria-hidden="true">▸</span></button></section>
-    <section class="preference-section"><header><h3>今天，想用什麼顏色？</h3><span>即時套用 · 這台裝置會記住</span></header>
-    <div class="theme-picker" role="group" aria-label="介面主題顏色">${THEMES.map((t) => `<button class="theme-choice" data-pixel-theme="${t.id}" aria-pressed="${theme === t.id}" style="--swatch-paper:${t.colors[0]};--swatch-trim:${t.colors[1]};--swatch-accent:${t.colors[2]}"><span class="theme-preview" aria-hidden="true"><i></i><b>✦</b><em></em><em></em></span><strong>${t.name}</strong><small>${theme === t.id ? "✓ 使用中" : t.note}</small></button>`).join("")}</div></section>
-    <section class="preference-section"><header><h3>遊玩節奏</h3><span>重要的選擇，仍會停下來等你</span></header>
-      <div class="playback-setting"><div><b>演出速度</b><small>只調整播放速度，成果相同</small></div><div class="speed-options" role="group" aria-label="演出速度">${[1, 2, 4, 8, 16].map((n) => `<button data-set-speed="${n}" aria-pressed="${speed === n}">${n}×</button>`).join("")}</div></div>
-      <div class="setting-pair"><button class="setting-action" data-ui="pause" id="pause" aria-label="${paused ? "繼續世界" : "暫停世界"}"><i>${paused ? "▷" : "Ⅱ"}</i><span><b>${paused ? "繼續世界" : "暫停世界"}</b><small>${paused ? "準備好，繼續生活" : "讓所有人歇一下"}</small></span></button><div class="camera-setting"><span>場景鏡頭</span><div><button data-ui="zoom-out" aria-label="縮小場景">−</button><button data-ui="center" aria-label="鏡頭回到主角">${menuIcon("profile")}</button><button data-ui="zoom-in" aria-label="放大場景">＋</button></div></div></div>
-      <div class="buttons"><button data-ui="reset-view">↺ 回到原比例</button></div>
-    </section>
-    <section class="preference-section" aria-label="故事與日常"><header><h3>故事與日常</h3><span>跟著這份旅程保存</span></header>
-      <div class="playback-setting"><div><b>敘事長度</b><small>精簡時仍可展開全文，選項與成果完整保留</small></div>${options("textMode", [["full", "完整"], ["concise", "精簡"]])}</div>
-      <div class="playback-setting"><div><b>已讀日常快速略過</b><small>只略過讀過的相同日常；新選擇、故事後續與重要成果仍會停下</small></div>${options("skipReadRoutine", [[false, "關閉"], [true, "開啟"]])}</div>
-      <div class="playback-setting"><div><b>戀愛日常頻率</b><small>調整日常相處與主動邀約，已建立的關係仍保留</small></div>${options("romanceFrequency", [["off", "暫停"], ["low", "偶爾"], ["normal", "平常"], ["high", "常常"]])}</div>
-      <div class="playback-setting"><div><b>戲劇強度</b><small>調整主動日常的衝突程度，重要故事與自己的選擇仍會繼續</small></div>${options("conflictIntensity", [["gentle", "溫和"], ["normal", "平常"], ["dramatic", "濃厚"]])}</div>
-      <div class="playback-setting"><div><b>重要人物故事提醒</b><small>關閉只收起額外提醒，不會移除故事與選擇</small></div>${options("storyReminders", [[true, "開啟"], [false, "關閉"]])}</div>
-      <div class="buttons"><button data-life="narrative-history">翻閱完整日常記錄</button></div>
-    </section>
-    <section class="preference-section"><header><h3>閱讀與聲音</h3><span>這台裝置的偏好</span></header>
+  return `<div class="preference-studio settings-groups">
+    <section class="preference-section"><header><h3>閱讀與顯示</h3><span>這台裝置會記住</span></header>
     <div class="font-options" role="group" aria-label="文字大小">${[
       ["standard", "標準"],
       ["comfortable", "舒適"],
@@ -33,14 +17,37 @@ export function settingsMarkup({ theme, speed, paused, preferences = {}, narrati
           `<button data-pixel-pref="fontSize" data-value="${id}" aria-pressed="${preferences.fontSize === id}">${n}</button>`,
       )
       .join("")}</div>
-    <label class="volume-control">背景音樂<input type="range" min="0" max="1" step=".01" data-volume="musicVolume" value="${preferences.musicVolume ?? 0.28}" aria-label="背景音樂音量"></label>
+
+    <div class="buttons"><button data-ui="reset-view">↺ 回到原比例</button></div>
+    <details class="settings-group"><summary>配色主題</summary>    <section class="preference-section"><header><h3>今天，想用什麼顏色？</h3><span>即時套用 · 這台裝置會記住</span></header>
+    <div class="theme-picker" role="group" aria-label="介面主題顏色">${THEMES.map((t) => `<button class="theme-choice" data-pixel-theme="${t.id}" aria-pressed="${theme === t.id}" style="--swatch-paper:${t.colors[0]};--swatch-trim:${t.colors[1]};--swatch-accent:${t.colors[2]}"><span class="theme-preview" aria-hidden="true"><i></i><b>✦</b><em></em><em></em></span><strong>${t.name}</strong><small>${theme === t.id ? "✓ 使用中" : t.note}</small></button>`).join("")}</div></section>
+</details>
+    </section>
+    <details class="settings-group"><summary>聲音與演出</summary>    <section class="preference-section"><header><h3>遊玩節奏</h3><span>重要的選擇，仍會停下來等你</span></header>
+      <div class="playback-setting"><div><b>演出速度</b><small>只調整播放速度，成果相同</small></div><div class="speed-options" role="group" aria-label="演出速度">${[1, 2, 4, 8, 16].map((n) => `<button data-set-speed="${n}" aria-pressed="${speed === n}">${n}×</button>`).join("")}</div></div>
+      <div class="setting-pair"><button class="setting-action" data-ui="pause" id="pause" aria-label="${paused ? "繼續世界" : "暫停世界"}"><i>${paused ? "▷" : "Ⅱ"}</i><span><b>${paused ? "繼續世界" : "暫停世界"}</b><small>${paused ? "準備好，繼續生活" : "讓所有人歇一下"}</small></span></button><div class="camera-setting"><span>場景鏡頭</span><div><button data-ui="zoom-out" aria-label="縮小場景">−</button><button data-ui="center" aria-label="鏡頭回到主角">${menuIcon("profile")}</button><button data-ui="zoom-in" aria-label="放大場景">＋</button></div></div></div>
+    </section>
+<section class="preference-section"><h3>聲音與操作提示</h3>    <label class="volume-control">背景音樂<input type="range" min="0" max="1" step=".01" data-volume="musicVolume" value="${preferences.musicVolume ?? 0.28}" aria-label="背景音樂音量"></label>
     <label class="volume-control">互動音效<input type="range" min="0" max="1" step=".01" data-volume="sfxVolume" value="${preferences.sfxVolume ?? 0.42}" aria-label="互動音效音量"></label>
     <div class="buttons" aria-label="試聽事件音效"><button data-preview-sfx="message">試聽訊息</button><button data-preview-sfx="success">成功</button><button data-preview-sfx="warning">提醒</button><button data-preview-sfx="reward">獎勵</button></div>
     <div class="buttons"><button data-pixel-pref="audioMuted" data-value="${!preferences.audioMuted}" aria-pressed="${!!preferences.audioMuted}">${preferences.audioMuted ? "開啟聲音" : "全部靜音"}</button><button data-pixel-pref="tutorials" data-value="${!preferences.tutorials}" aria-pressed="${!!preferences.tutorials}">新手提示 ${preferences.tutorials ? "開啟" : "關閉"}</button><button data-tutorial-reset>重新閱讀新人手冊</button></div></section>
-    <section class="preference-section"><header><h3>離線與安裝</h3><span id="offline-status">第一次連線後可準備離線內容</span></header><div class="buttons"><button data-offline="install">加入主畫面</button><button data-offline="download">準備完整離線內容</button><button data-offline="update">檢查更新</button></div><progress id="offline-progress" max="100" value="0" hidden></progress></section>
-    <div class="settings-utilities"><button data-ui="saves"><i>${menuIcon("saves")}</i><span><b>存檔與讀檔</b><small>留住現在的旅程</small></span><em>›</em></button><button data-ui="help"><i>?</i><span><b>操作說明</b><small>走路、互動與行程</small></span><em>›</em></button></div>
+</details>
+    <details class="settings-group"><summary>故事偏好 · 跟著旅程保存</summary>    <section class="preference-section" aria-label="故事與日常"><header><h3>故事與日常</h3><span>跟著這份旅程保存</span></header>
+      <div class="playback-setting"><div><b>敘事長度</b><small>精簡時仍可展開全文，選項與成果完整保留</small></div>${options("textMode", [["full", "完整"], ["concise", "精簡"]])}</div>
+      <div class="playback-setting"><div><b>已讀日常快速略過</b><small>只略過讀過的相同日常；新選擇、故事後續與重要成果仍會停下</small></div>${options("skipReadRoutine", [[false, "關閉"], [true, "開啟"]])}</div>
+      <div class="playback-setting"><div><b>戀愛日常頻率</b><small>調整日常相處與主動邀約，已建立的關係仍保留</small></div>${options("romanceFrequency", [["off", "暫停"], ["low", "偶爾"], ["normal", "平常"], ["high", "常常"]])}</div>
+      <div class="playback-setting"><div><b>戲劇強度</b><small>調整主動日常的衝突程度，重要故事與自己的選擇仍會繼續</small></div>${options("conflictIntensity", [["gentle", "溫和"], ["normal", "平常"], ["dramatic", "濃厚"]])}</div>
+      <div class="playback-setting"><div><b>重要人物故事提醒</b><small>關閉只收起額外提醒，不會移除故事與選擇</small></div>${options("storyReminders", [[true, "開啟"], [false, "關閉"]])}</div>
+      <div class="buttons"><button data-life="narrative-history">翻閱完整日常記錄</button></div>
+    </section>
+</details>
+    <details class="settings-group"><summary>存檔與資料</summary>    <div class="settings-utilities"><button data-ui="saves"><i>${menuIcon("saves")}</i><span><b>存檔與讀檔</b><small>留住現在的旅程</small></span><em>›</em></button><button data-ui="help"><i>?</i><span><b>操作說明</b><small>走路、互動與行程</small></span><em>›</em></button></div>
     <details class="new-journey"><summary>下一段人生</summary><p>可先存檔，再選擇結算或從頭開始。</p><div class="buttons"><button data-storage="retire">主動退圈並結算</button><button data-storage="new">建立新角色</button></div></details>
     <section class="preference-section"><h3>隱私與本機資料</h3><p>遊戲不使用追蹤 Cookie，存檔與設定保存在這台裝置。</p><a href="./privacy.html">查看隱私說明／清除本遊戲資料</a><p class="tiny-note">離開遊戲前，建議先匯出重要存檔。</p></section>
+</details>
+    <details class="settings-group"><summary>更新與離線</summary>    <section class="version-summary" aria-label="目前版本"><div><span>你正在玩的版本</span><strong>像素版 v${PIXEL_VERSION}</strong><small>星望市施工日誌，歡迎翻閱。</small></div><button data-ui="release-notes">版本更新紀錄 <span aria-hidden="true">▸</span></button></section>
+    <section class="preference-section"><header><h3>離線與安裝</h3><span id="offline-status">第一次連線後可準備離線內容</span></header><div class="buttons"><button data-offline="install">加入主畫面</button><button data-offline="download">準備完整離線內容</button><button data-offline="update">檢查更新</button></div><progress id="offline-progress" max="100" value="0" hidden></progress></section>
+</details>
     <p class="preference-footnote">配色只改變介面，保留場景和人物插畫原本的顏色。</p>
   </div>`;
 }
diff --git a/src/pixel/viewport.js b/src/pixel/viewport.js
index 23e8b62..a23945d 100644
--- a/src/pixel/viewport.js
+++ b/src/pixel/viewport.js
@@ -4,10 +4,21 @@ export function createViewportControls(button, panel) {
   const viewport = window.visualViewport;
   const meta = document.querySelector('meta[name="viewport"]');
   const original = meta?.getAttribute("content");
-  let resetting = null;
+  let resetting = null, previousHeight = 0;
 
   function sync() {
     const scale = viewport?.scale || 1;
+    if (viewport && Math.abs(scale - 1) < 0.02) {
+      panel.style?.setProperty("--usable-panel-height", `${Math.max(120, viewport.height - 24)}px`);
+      panel.style?.setProperty("--visible-panel-top", `${viewport.offsetTop + 12}px`);
+      const editing = document.activeElement?.matches?.("input, textarea, select");
+      if (panel.dataset) panel.dataset.keyboard = String(!!editing && viewport.height < window.innerHeight * 0.8);
+      if (editing && previousHeight !== viewport.height) window.requestAnimationFrame(() => document.activeElement?.scrollIntoView?.({ block: "nearest" }));
+      previousHeight = viewport.height;
+    } else {
+      panel.style?.removeProperty("--usable-panel-height");
+      if (panel.dataset) panel.dataset.keyboard = "false";
+    }
     button.hidden = Math.abs(scale - 1) < 0.02;
     const parent = panel.open ? panel : document.body;
     if (button.parentElement !== parent) parent.append(button);
diff --git a/src/views/npc.js b/src/views/npc.js
index e8e0150..49253b2 100644
--- a/src/views/npc.js
+++ b/src/views/npc.js
@@ -1,3 +1,5 @@
+import { personalStoryStatus } from "../logic/personal-stories.js";
+import { romanceDailyStatus } from "../logic/romance-daily.js";
 import { romanceRepairStatus } from "../logic/romance-life.js";
 import { personalStoryPanel, personalStoryReminder } from "./personal-stories.js";
 import { npcInvitationPanel } from "./npc-invitation.js";
@@ -50,7 +52,7 @@ const visibilityLabel = (value) =>
 
 function interactionButtons(current, story, rel) {
   return (
-    `<button data-chat-open="${current}">開啟對話 · 不占一天</button><button data-romance-talk="${current}">聊聊我們的關係</button><p>每人每週短聯絡 2 次，合計 5 次；下列正式邀約占一天。</p>` +
+    `<button data-chat-open="${current}">開啟對話 · 不耗一天</button><button data-romance-talk="${current}">聊聊我們的關係</button><p>每人每週短聯絡 2 次，合計 5 次；下列正式邀約占一天。</p>` +
     Object.entries(NPC_INTERACTIONS)
       .map(([id, d]) => {
         const conflict = rel.hostility || 0;
@@ -80,7 +82,7 @@ function interactionButtons(current, story, rel) {
                 ? "正式交往後才會開放"
                 : "",
           reasonId = `npc-action-reason-${current}-${id}`;
-        return `<span class="npc-action-option"><button class="${id === "reconcile" ? "reconcile" : ""}" data-npc-interact="${id}" data-npc-id="${current}" ${disabled ? `disabled aria-describedby="${reasonId}"` : ""}>${esc(d.label)}${d.cost ? `・${money(d.cost)}` : ""}</button>${disabled ? `<small id="${reasonId}">${esc(title)}</small>` : ""}</span>`;
+        return `<span class="npc-action-option"><button class="${id === "reconcile" ? "reconcile" : ""}" data-npc-interact="${id}" data-npc-id="${current}" ${disabled ? `disabled aria-describedby="${reasonId}"` : ""}>安排${esc(d.label)} · 占一天${d.cost ? `・${money(d.cost)}` : ""}</button>${disabled ? `<small id="${reasonId}">${esc(title)}</small>` : ""}</span>`;
       })
       .join("")
   );
@@ -92,7 +94,7 @@ function romanceActions(current, rel) {
   if (!["dating", "committed", "engaged", "married"].includes(rel.romance))
     return "";
   const ceremony = rel.romance === "married" ? `<p>儀式：${({ undecided: "尚未決定", none: "暫不舉辦", small: "已辦親友小婚禮", legacy: "保留原有婚姻紀錄" })[rel.ceremony] || "保留原有婚姻紀錄"}；公開狀態另行選擇。</p>${["undecided", "none"].includes(rel.ceremony) ? `<button data-romance-ceremony="small" data-npc-id="${current}">一起辦親友小婚禮</button>${rel.ceremony === "undecided" ? `<button data-romance-ceremony="none" data-npc-id="${current}">暫時不辦儀式</button>` : ""}` : ""}` : "";
-  return `<div class="romance-actions"><span>關係選擇</span>${ceremony}${rel.visibility !== "public" ? `<button data-romance-action="public" data-npc-id="${current}">公開戀情</button>` : ""}${rel.visibility !== "underground" ? `<button data-romance-action="underground" data-npc-id="${current}">保留私人空間（已公開的消息不會消失）</button>` : ""}<button class="danger" data-romance-action="breakup" data-npc-id="${current}">提出分手</button></div>`;
+  return `<div class="romance-actions"><span>關係選擇</span>${ceremony}${rel.visibility !== "public" ? `<button data-romance-action="public" data-npc-id="${current}">公開戀情</button>` : ""}${rel.visibility !== "underground" ? `<button data-romance-action="underground" data-npc-id="${current}">保留私人空間（已公開的消息不會消失）</button>` : ""}<details class="relationship-management"><summary>關係管理</summary><p>分開會改變伴侶關係；下一步會先確認，不會立刻分手。</p><button class="danger" data-romance-action="breakup" data-npc-id="${current}">考慮分開</button></details></div>`;
 }
 
 function routeHint(current, rel) {
@@ -208,9 +210,12 @@ export function npcApp() {
   const relationship = `<section class="relationship-panel ${rel.hostility >= 45 ? "conflict" : ""}"><header><span>RELATIONSHIP</span><h3>${esc(story.stage.label)}・${esc(romanceStageLabel(rel.romance))}</h3><small>${esc(visibilityLabel(rel.visibility))}</small></header><div class="relationship-signals"><article><span>相處感覺</span><b>${esc(affectionSignal(current))}</b></article><article><span>信任觀察</span><b>${esc(trustSignal(current))}</b></article><article><span>衝突跡象</span><b>${esc(hostilitySignal(current))}</b></article></div><p class="relationship-hint">${esc(romanceProgress(current))}</p></section>`;
   const meetingCard = `<article class="npc-first-meeting npc-memory-card"><small>FIRST ENCOUNTER・第 ${meeting.week} 週</small><h3>初次相遇・${esc(meeting.title)}</h3><p>${esc(meeting.text)}</p><small>${esc(meeting.source)}</small></article>`;
   const careerCard = `<article class="npc-career-card"><small>職涯近況・${esc(npc.special ? npc.job : career.field)}</small><h3>${trendLabel(career.trend)}</h3><p>近期作品 ${career.works}・獎項 ${career.awards}</p><small>擅長領域：${career.specialties.map(esc).join("、") || "跨領域"}</small></article>`;
+  const ongoing = personalStoryStatus(current);
+  const daily = romanceDailyStatus(current);
+  const quickActions = `<section class="npc-quick-actions" aria-label="找這個人"><h3>今天想怎麼相處？</h3><div class="npc-actions"><button data-chat-open="${current}">開啟對話 · 不耗一天</button><button data-npc-interact="personal" data-npc-id="${current}">安排見面 · 占一天</button>${ongoing?.ready ? `<button data-personal-story-open="${current}">接續${esc(ongoing.chapterTitle)}</button>` : ongoing?.canResume ? `<button data-personal-story-resume="${current}">恢復暫放的故事</button>` : ""}${daily?.ready ? `<button data-romance-daily="${current}">接續戀愛日常</button>` : ""}</div><small>見面先選日期；故事排進後續空檔，不會直接開始今天的行程。</small></section>`;
   const content = {
     overview:
-      relationship + personalStoryReminder(current) +
+      quickActions + relationship + personalStoryReminder(current) +
       `<div class="npc-overview-cards">${careerCard}<article class="npc-memory-card"><small>初次相遇・第 ${meeting.week} 週</small><p>${esc(meeting.title)}</p><button data-npc-profile-tab="memories">翻翻共同回憶 →</button></article></div>`,
     relationship: `<section class="npc-relationship-actions"><h3>把關係放進生活裡</h3><p>${esc(routeHint(current, rel))}</p>${npcInvitationPanel(current)}<div class="npc-actions">${interactionButtons(current, story, rel)}</div>${romanceActions(current, rel)}</section>`,
     memories:
diff --git a/src/views/people.js b/src/views/people.js
index 80570de..feb760f 100644
--- a/src/views/people.js
+++ b/src/views/people.js
@@ -54,7 +54,7 @@ function conversation(id) {
     )
     .join(
       "",
-    )}</nav><label class="chat-draft-label"><span>寫給${esc(npc.name)}的訊息</span><textarea class="chat-draft" data-chat-draft rows="3" maxlength="200" aria-label="編寫訊息" ${allowance.disabled ? "disabled" : ""}>${esc(state.chatDraft ?? CONTACT_TOPICS[topic].text)}</textarea></label><div class="chat-send-row"><small>本週：對方還能聊 ${allowance.person} 次・合計剩 ${allowance.total} 次</small><button data-short-contact="${id}" data-contact-type="call" data-contact-topic="${topic}" ${allowance.disabled ? "disabled" : ""}>☎ 打電話</button><button class="main-btn" data-short-contact="${id}" data-contact-type="message" data-contact-topic="${topic}" ${allowance.disabled ? "disabled" : ""}>送出訊息 ↑</button></div><p class="chat-allowance" role="status">${allowance.reason}</p></div></section>`;
+    )}</nav><label class="chat-draft-label"><span>寫給${esc(npc.name)}的訊息</span><textarea class="chat-draft" data-chat-draft rows="3" maxlength="200" aria-label="編寫訊息" ${allowance.disabled ? "disabled" : ""}>${esc(state.chatDraft ?? CONTACT_TOPICS[topic].text)}</textarea></label><div class="chat-send-row"><small>本週：對方還能聊 ${allowance.person} 次・合計剩 ${allowance.total} 次</small><button data-short-contact="${id}" data-contact-type="call" data-contact-topic="${topic}" ${allowance.disabled ? "disabled" : ""}>☎ 打電話 · 不耗一天</button><button class="main-btn" data-short-contact="${id}" data-contact-type="message" data-contact-topic="${topic}" ${allowance.disabled ? "disabled" : ""}>送出訊息 · 不耗一天 ↑</button></div><p class="chat-allowance" role="status">${allowance.reason}</p></div></section>`;
 }
 export function peopleApp() {
   const known = state.knownPeople.filter((id) => NPCS[id]);
```
