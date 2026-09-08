import { clearGameData } from "./privacy-data.js";

const button = document.querySelector("#erase-data");
const confirmation = document.querySelector("#erase-confirmation");
const status = document.querySelector("#erase-status");
confirmation.addEventListener("input", () => {
  button.disabled = confirmation.value !== "清除";
});
button.addEventListener("click", async () => {
  if (confirmation.value !== "清除") return;
  button.disabled = true;
  confirmation.disabled = true;
  status.textContent = "正在清除本遊戲資料，請勿重新開啟遊戲…";
  try {
    await clearGameData({
      indexedDB: window.indexedDB,
      localStorage: window.localStorage,
      sessionStorage: window.sessionStorage,
      caches: window.caches,
      serviceWorker: navigator.serviceWorker,
      pageURL: window.location.href,
      onBlocked: () => { status.textContent = "請關閉其他星途未定分頁或主畫面 App；關閉後會繼續清除。"; },
    });
    status.textContent = "已清除本遊戲的本機存檔、備份、設定與離線快取。已下載的 JSON 檔案與其他裝置資料不受影響。";
  } catch {
    status.textContent = "未能完整清除，部分資料可能已刪除。請關閉其他遊戲分頁後重試，或使用瀏覽器的網站資料設定。";
    confirmation.disabled = false;
    button.disabled = false;
  }
});
