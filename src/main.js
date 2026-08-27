// 進入點：index.html 只載入這一支檔案。它不定義任何遊戲邏輯，只負責觸發第一次擲骰＋第一次 render()，
// 把畫面停在角色建立畫面的 STEP 1。完整的模組地圖與各層職責見專案根目錄的 ARCHITECTURE.md。
import{rollStats}from"./core/stats.js";

rollStats();
