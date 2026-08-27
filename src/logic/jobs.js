// 邏輯層：新人廣告試鏡的判定。只負責算出是否獲選並寫回 state，不觸發 render（呼叫端在 bind.js 決定何時重繪）。
import{JOB}from"../data/job.js";
import{state}from"../core/state.js";
import{successRateLabel}from"../core/utils.js";

export function resolveJobAudition(choice){const delta=JOB.requirements.reduce((sum,[n,min])=>sum+((state.stats[n]||0)-min),0)/JOB.requirements.length;const hiddenBonus=choice==="bold"?((state.hidden.膽識||500)-500)/18:0;const chance=Math.max(8,Math.min(92,55+delta*.75+(choice==="natural"?10:-5)+hiddenBonus));const passed=Math.random()*100<chance;state.stats.鏡頭感=Math.min(1000,state.stats.鏡頭感+(passed?4:2));state.jobStage=passed?"passed":"failed";state.jobNotice=passed?`試鏡獲選！這次的現場表現屬於「${successRateLabel(chance)}」。`:`這次沒有獲選，現場評估屬於「${successRateLabel(chance)}」；仍獲得鏡頭感＋2。`}
