# 整體流程除錯與定向驗證（2026-09-08）

基準：main `96f7b1a8db4c322bdc2c0ca285354808911f266d`。開始前確認 GitHub 遠端與本機一致、工作目錄乾淨。
完成版本：Pixel 0.23.1／Core 1.46.1。本文件為實作完成時的紀錄；當時尚未推送或部署。

## 檢視範圍與方式

閱讀架構與主要入口，交叉檢查像素排程、逐日／逐週推進、正式工作預約、城市與居家約定、人物與戀愛操作、創作、存檔驗證／匯入匯出／IndexedDB、縮放與更新流程。這是程式碼及狀態邊界檢視，並非全程實玩五年，也不代表所有程式碼或所有組合皆無 bug。

依使用者要求，只執行本次變更相關測試，未執行全套測試或五年模擬。

## 已確認並修復

| 問題 | 根因與修正 | 驗證 |
| --- | --- | --- |
| 存讀檔重算歷史探訪及寵物迎接 | model 驗證把所有歷史 visited 再呼叫 arriveAt，將舊地點寫入當週，且外出存檔也觸發回家迎接。僅初代無 life 存檔重建探訪，現代存檔保留原有日期資料。 | 直接驗證、匯出匯入、真實返家邏輯、初代相容 |
| 助手復原改寫進行中行程 | 助手復原未檢查 pending。新增執行與按鈕共用檢查；進行中仍可排未來日期，但不建立可覆寫當天的復原快照。 | 開始前套用、開始後套用、完成後舊復原失效、普通復原保留偏好 |
| 待辦助手漏認公園 | 比對不存在的 park 行程 ID；更正為 explore_park。 | 公園能排正式工作，其他探訪／課程不受影響 |
| 剩餘預算重算今日費用 | 結算後 day 尚未前進，兩處費用仍從今天開始加總。改用共用剩餘費用計算，排除 result 階段已完成日。 | 結算前保留今日費用，結算後兩處顯示一致 |
| 修改／退稿作品無法從行程表安排 | UI 只尋找 draft，與核心允許的 revising／rejected 不一致。同步可寫作狀態。 | 按鈕可用且綁定正確作品，實際完成一天增加進度，已發行作品不變 |

既有存檔中已被舊版本寫入的探訪紀錄不會擅自刪除，因為無法可靠區分真實到訪與舊驗證造成的紀錄。

## 實際驗證

新增 `tests/pixel-debug-regressions.test.mjs`：修復前 10 項中 8 項如預期失敗、2 項相容案例通過；修復後全過。後續補入創作實際結算斷言亦通過。

最終執行共 31 項、全數通過：

- `node --test tests/pixel-debug-regressions.test.mjs tests/pixel-storage.test.mjs tests/pixel-mobile-planner.test.mjs`：21 項。
- `node --test --test-name-pattern='planner|export roundtrip|original midweek|save deletion' tests/pixel-completion.test.mjs`：5 項。
- `node --test --test-name-pattern='單次連排|復原|讀檔|固定排程' tests/ux-eight.test.mjs`：5 項。
- ESLint：只檢查修改的 JS 與新增測試，通過。
- `npm run build`：通過；dist 1.46.1，離線清單 641 檔、110 MB。
- `npm run audit:pwa`：首次抓到 CORE_VERSION 未同步；補正後重建並重跑，通過，快取為 star-game-runtime-v1.46.1。
- `git diff --check`：通過。

瀏覽器限制：Playwright Chromium executable 不存在，未執行瀏覽器 E2E、視覺或真實手機驗證；介面案例是呼叫實際 UI 函式檢查輸出的 HTML，不冒充瀏覽器操作。

## 修改對照

既有玩家可見故事與說明文字未替換；新增版本紀錄保留所有舊條目。以下為主要邏輯修改的原文／新文與位置，原因見上表。

```diff
diff --git a/src/pixel/life-ui.js b/src/pixel/life-ui.js
index 6b471c9..10e88d7 100644
--- a/src/pixel/life-ui.js
+++ b/src/pixel/life-ui.js
@@ -1,4 +1,4 @@
-import { plannerContext, highlightsMarkup } from "./ux-summaries.js";
+import { plannerContext, highlightsMarkup, remainingPlanCost } from "./ux-summaries.js";
 import { planRoutineWithUndo, undoRoutine } from "./planner-tools.js";
 import { selectWeeklyGoal } from "../logic/weekly-goals.js";
 import { withCore } from "./core-bridge.js";
@@ -109,9 +109,7 @@ export function createLifeUI(api) {
     selectedDay = Math.max(l.day, Math.min(6, day));
     if (l.day === 7) return summary();
     const selected = l.plan[selectedDay];
-    const estimate = l.plan
-      .slice(l.day)
-      .reduce((sum, a) => sum + costOf(l, a), 0);
+    const estimate = remainingPlanCost(l);
     const cards = Object.entries(CHOICES)
       .filter(([id]) => !id.startsWith("career_"))
       .filter(([id]) => !["home_host", "home_craft", "city_date", "city_collab"].includes(id))
@@ -122,7 +120,7 @@ export function createLifeUI(api) {
             ? {
                 id,
                 projectId: l.game.creativeProjects.find(
-                  (p) => p.status === "draft",
+                  (p) => ["draft", "revising", "rejected"].includes(p.status),
                 )?.id,
               }
             : { id };
diff --git a/src/pixel/model.js b/src/pixel/model.js
index 2d0ef5b..7beacb6 100644
--- a/src/pixel/model.js
+++ b/src/pixel/model.js
@@ -124,9 +124,12 @@ export function validatePixelState(raw) {
   if (!state.life.game.realName && !state.life.game.stageName)
     state.life.game.realName = state.playerName;
   state.life.game.name = state.life.game.stageName || state.life.game.realName;
-  for (const id of state.visited) arriveAt(state.life, id);
-  if (!raw.life)
+  // Only the original scene-only save needs visits reconstructed. Modern saves
+  // already own dated visits; validation must not replay arrivals or pet greetings.
+  if (!raw.life) {
+    for (const id of state.visited) arriveAt(state.life, id);
     for (const id of state.knownPeople) recordMeeting(state.life, id);
+  }
   return state;
 }
 export function objectives(state) {
diff --git a/src/pixel/planner-tools.js b/src/pixel/planner-tools.js
index 7ba8f23..9f3cc72 100644
--- a/src/pixel/planner-tools.js
+++ b/src/pixel/planner-tools.js
@@ -6,6 +6,11 @@ import { bookCareer } from "./career.js";
 import { SCHEDULE_PRESETS } from "../logic/schedule-assistant.js";
 const undo = new WeakMap();
 const routineUndo = new WeakMap();
+function canUndoPlanner(life) {
+  const entry = undo.get(life);
+  return !!entry && !life.pending && !life.game.endingResult &&
+    life.game.forcedRestWeek !== life.game.week && entry.fingerprint === fingerprint(life);
+}
 export function canUndoRoutine(life) {
   const entry = routineUndo.get(life);
   return !!entry && !life.pending && entry.fingerprint === fingerprint(life);
@@ -85,7 +90,7 @@ export function applyPlannerTool(life, id) {
     return { ok: false, message: "目前無法調整行程" };
   if (id === "undo") {
     const previous = undo.get(life);
-    if (!previous || previous.fingerprint !== fingerprint(life))
+    if (!canUndoPlanner(life))
       return { ok: false, message: "行動或資源已更新，無法復原舊的排程" };
     const { plan, game } = previous.state;
     life.plan = structuredClone(plan);
@@ -116,7 +121,7 @@ export function applyPlannerTool(life, id) {
       for (let day = life.day; day < 7; day++) {
         if (
           protectedDay(life, day) ||
-          !["rest", "park"].includes(life.plan[day].id)
+          !["rest", "explore_park"].includes(life.plan[day].id)
         )
           continue;
         const r = bookCareer(life, CHOICES, "job", { jobId: job.jobId }, day);
@@ -141,8 +146,10 @@ export function applyPlannerTool(life, id) {
       if (!access(life, a, day) && !planDay(life, day, a)) count++;
     }
   }
-  if (count)
-    undo.set(life, { state: snapshot, fingerprint: fingerprint(life) });
+  if (count) {
+    undo.delete(life);
+    if (!life.pending) undo.set(life, { state: snapshot, fingerprint: fingerprint(life) });
+  }
   return {
     ok: count > 0,
     message: count
@@ -157,7 +164,7 @@ export function plannerToolsMarkup(life) {
     .map(([id, p]) => `<button data-planner-tool="${id}">${p.label}</button>`)
     .join(
       "",
-    )}<button data-planner-tool="repeat" ${life.previousPlan ? "" : "disabled"}>沿用上週</button><button data-planner-tool="rest">例行安排改休息</button><button data-planner-tool="due">優先安排待辦通告</button><button data-planner-tool="undo" ${undo.has(life) ? "" : "disabled"}>復原助手變更</button></div></details>`;
+    )}<button data-planner-tool="repeat" ${life.previousPlan ? "" : "disabled"}>沿用上週</button><button data-planner-tool="rest">例行安排改休息</button><button data-planner-tool="due">優先安排待辦通告</button><button data-planner-tool="undo" ${canUndoPlanner(life) ? "" : "disabled"}>復原助手變更</button></div></details>`;
 }
 
 export function setWeeklyFocus(life, id) {
diff --git a/src/pixel/ux-summaries.js b/src/pixel/ux-summaries.js
index 5e47d8d..876bd90 100644
--- a/src/pixel/ux-summaries.js
+++ b/src/pixel/ux-summaries.js
@@ -3,10 +3,15 @@ import { esc } from "../core/utils.js";
 import { costOf, definition, DAY_NAMES } from "./life.js";
 import { canUndoRoutine } from "./planner-tools.js";
 
+export function remainingPlanCost(life) {
+  const start = life.day + (life.pending?.phase === "result" ? 1 : 0);
+  return life.plan.slice(start).reduce((sum, assignment) => sum + costOf(life, assignment), 0);
+}
+
 export function plannerContext(life, selectedDay) {
   const selected = definition(life, life.plan[selectedDay])?.label || "未安排";
   const today = definition(life, life.plan[life.day])?.label || "未安排";
-  const cost = life.plan.slice(life.day).reduce((sum, assignment) => sum + costOf(life, assignment), 0);
+  const cost = remainingPlanCost(life);
   const warnings = [cost > life.game.money ? "目前現金不足以支付餘下已排行程；尚未取得的收入不計入。" : "", life.game.fatigue > 80 ? "目前疲勞偏高，建議在高負荷行動前安排休息。" : ""].filter(Boolean);
   return `<section class="planner-context" aria-label="目前排程位置"><div role="status" aria-live="polite"><b>正在安排${DAY_NAMES[selectedDay]} · ${esc(selected)}</b><small>今天是${DAY_NAMES[life.day]} · ${esc(today)}；選擇行程只改排程，不會開始執行。</small></div><button data-routine-undo ${canUndoRoutine(life) ? "" : "disabled"}>復原剛才安排</button></section><div class="planner-budget"><p class="tiny-note" data-training-subsidy>${esc(trainingSubsidyNotice(life.game.week))}</p><p>餘下已排費用 $${cost.toLocaleString()} · 現金 $${life.game.money.toLocaleString()}</p><small>收入依實際完成結果計算，這裡不預先當作已入帳。</small>${warnings.map(text => `<p role="status">${esc(text)}</p>`).join("")}</div>`;
 }
```

