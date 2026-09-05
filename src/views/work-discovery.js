import { COMPANY_PART_TIME } from "../data/part-time.js";
import { INDUSTRY_COMPANIES } from "../data/industry.js";
import { state } from "../core/state.js";
import { hasVisited } from "../logic/city-progression.js";
import { companyShifts } from "../logic/work-progression.js";
import { money } from "../core/utils.js";
export function workDiscovery() {
  return `<section class="work-discovery"><header><span>從第一份工作開始</span><h3>到公司認識工作現場</h3><p>市民服務台的活動零工不需介紹人。公司打工則先到現場登記一次，之後便能在行程表安排；打工不是演出合約，也不會取代試鏡資格。</p></header><div>${Object.entries(COMPANY_PART_TIME).map(([id,job])=>{
    const visited=hasVisited(state,job.venue),count=companyShifts(state,job.companyId);
    return `<article><b>${INDUSTRY_COMPANIES[job.companyId].name}</b><strong>${job.label.split("・")[1]}</strong><p>${job.note}</p><small>日薪 ${money(job.income[0])}～${money(job.income[1])}・疲勞＋${job.fatigue}</small><p>${visited ? `已登記・已完成 ${count} 次` : "尚未登記・先到現場了解工作"}<br>${count >= 3 ? "窗口會持續提供徵選資訊" : "同公司三次打工後，開始收到後續徵選資訊"}</p><button ${visited ? `data-part-time-plan="${id}"` : `data-city-shortcut="${job.venue}"`}>${visited ? "到行程表安排打工" : "在地圖找到這間公司"}</button></article>`;
  }).join("")}</div></section>`;
}
