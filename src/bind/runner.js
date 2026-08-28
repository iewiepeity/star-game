// 逐日行程預設自動往下一天；只有需要玩家選擇的 decision 才停住。按鈕保留作為「立即跳過等待」的快捷鍵。
import{resolveDay,advanceRunner}from"../logic/runner.js";
export function bindRunnerScreen(){document.querySelectorAll("[data-choice]").forEach(x=>x.onclick=()=>resolveDay(x.dataset.choice));document.querySelector("#next-day")?.addEventListener("click",()=>advanceRunner())}
