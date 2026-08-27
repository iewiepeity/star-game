# Supabase 資料區

本目錄準備《星途未定》的資料庫結構。`schema.sql` 建立公開唯讀的 `job_catalog`；內容唯一來源是 `src/data/jobs-catalog.js`，共 50 筆通告／試鏡。

## 套用順序

1. 在目標 Supabase 專案執行 `schema.sql`。
2. 先執行 `node scripts/validate-content.mjs` 驗證內容，再執行 `node scripts/generate-job-seed.mjs` 產生種子 SQL，將輸出交給 Supabase SQL Editor 或管理端執行。
3. 查詢 `select stars, category, count(*) from public.job_catalog group by stars, category order by stars, category;`，應得到 25 組、每組 2 筆。
4. 執行 Supabase Security 與 Performance Advisors；任何警告都應先處理再接前端。

## 權限模型

- `anon`、`authenticated`：只能讀取 `is_active = true` 的通告。
- 瀏覽器端沒有新增、修改或刪除權限。
- 編輯內容由資料庫管理端進行；網站不得放入 `service_role` 或 secret key。
- RLS 已啟用。即使未來 Data API 的預設授權改變，權限仍由明確的 `GRANT SELECT` 與唯讀政策控制。

前端尚未寫入任何 Supabase 金鑰。建立／選定專案後，僅可加入 publishable key；服務端密鑰不得進入 GitHub Pages。
