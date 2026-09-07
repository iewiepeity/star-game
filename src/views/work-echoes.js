import { state } from "../core/state.js";
import { esc } from "../core/utils.js";
import { workEchoRecords } from "../logic/work-echoes.js";
export function workEchoTimeline(workId, game = state) {
  const records = workEchoRecords(workId, game);
  const choice = { proud: "留下喜歡的部分", mixed: "仍有想重做的地方", quiet: "暫不定義", revisit: "帶著舊作尋找新窗口", forward: "把經驗帶向新作品", leave: "這次只回看" };
  return records.length ? `<details class="work-echo-timeline"><summary>作品後來的故事・${records.length} 段回響</summary>${records.map(r => `<article><small>第 ${r.dueWeek} 週・${r.stage === "opening" ? "發行初期" : r.stage === "weeks" ? "幾週之後" : "隔年回看"}</small><h4>${esc(r.title)}</h4><p>${esc(r.text)}</p>${r.choice ? `<p>你的回應：${choice[r.choice]}</p>` : `<p>這段作品對話已留在故事裡，等你有空回應。</p>`}</article>`).join("")}</details>` : "";
}
