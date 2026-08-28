// 逐日行程預設自動往下一天；只有需要玩家選擇的 decision 才停住。按鈕保留作為「立即跳過等待」的快捷鍵。
import{resolveDay,advanceRunner}from"../logic/runner.js";
import{state}from"../core/state.js";
import{JOB_BY_ID}from"../data/jobs.js";
import{applyForJob,ensureJobState}from"../logic/job-engine.js";
import{jobSource}from"../logic/industry.js";
import{render}from"../render.js";
export function bindRunnerScreen(){document.querySelectorAll("[data-choice]").forEach(x=>x.onclick=()=>resolveDay(x.dataset.choice));document.querySelectorAll("[data-venue-apply]").forEach(button=>button.onclick=()=>{const id=button.dataset.venueApply,source=jobSource(JOB_BY_ID[id]),record=ensureJobState(id),ok=applyForJob(id);if(ok){record.sourceType=source.type;record.referrerId=source.referrerId||null;record.sourceAgencyId=source.agencyId||null}if(state.runnerResult?.venue)state.runnerResult.venue.notice=ok?`已在現場登記《${JOB_BY_ID[id].title}》；回到通告信箱即可安排試鏡日期。`:record.notice||"目前無法登記這份試鏡。";render()});document.querySelector("#next-day")?.addEventListener("click",()=>advanceRunner())}
