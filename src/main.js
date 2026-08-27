// 進入點：index.html 只載入這一支檔案。先嘗試從 localStorage 還原上次進度；
// 沒有存檔（或存檔版本對不上）就跟以前一樣，觸發第一次擲骰＋第一次 render()，停在角色建立畫面的 STEP 1。
// 完整的模組地圖與各層職責見專案根目錄的 ARCHITECTURE.md。
import{state,hydrateState}from"./core/state.js";
import{loadState}from"./core/persistence.js";
import{rollStats}from"./core/stats.js";
import{startDay}from"./logic/runner.js";
import{render}from"./render.js";

const saved=loadState();
if(saved){
 hydrateState(saved);
 // 「今天正在發生……」的讀秒畫面背後有一個 setTimeout，重新整理頁面後那個計時器不會恢復，
 // 存檔剛好停在這個瞬間的話，重新呼叫 startDay() 讓當天重新跑一次讀秒→現場選擇，不會卡在讀秒畫面出不去。
 if(state.screen==="runner"&&state.runnerPhase==="loading")startDay();
 else render();
}else{
 rollStats();
}
