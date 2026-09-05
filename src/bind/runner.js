import { bindCityMap } from "./city-map.js";
import { titleTag } from "../core/utils.js";
// 逐日行程預設自動往下一天；只有需要玩家選擇的 decision 才停住。按鈕保留作為「立即跳過等待」的快捷鍵。
import {
  resolveDay,
  advanceRunner,
  setRunnerPaused,
  setRunnerSpeed,
} from "../logic/runner.js";
import { state } from "../core/state.js";
import { JOB_BY_ID } from "../data/jobs.js";
import { applyForJob, ensureJobState, signJob } from "../logic/job-engine.js";
import { jobSource } from "../logic/industry.js";
import { render } from "../render.js";
export function bindRunnerScreen() {
  bindCityMap();
  document
    .querySelector(".runner-city-map")
    ?.addEventListener("toggle", (event) => {
      state.runnerCityMapOpen = event.currentTarget.open;
    });
  document
    .querySelectorAll("[data-choice]")
    .forEach((x) => (x.onclick = () => resolveDay(x.dataset.choice)));
  document
    .querySelector("[data-runner-pause]")
    ?.addEventListener("click", () => setRunnerPaused(!state.runnerPaused));
  document
    .querySelectorAll("[data-runner-speed]")
    .forEach((button) =>
      button.addEventListener("click", () =>
        setRunnerSpeed(button.dataset.runnerSpeed),
      ),
    );
  document.querySelectorAll("[data-venue-apply]").forEach(
    (button) =>
      (button.onclick = () => {
        const id = button.dataset.venueApply,
          source = jobSource(JOB_BY_ID[id]),
          record = ensureJobState(id),
          ok = applyForJob(id);
        if (ok) {
          record.sourceType = source.type;
          record.referrerId = source.referrerId || null;
          record.sourceAgencyId = source.agencyId || null;
        }
        if (state.runnerResult?.venue)
          state.runnerResult.venue.notice = ok
            ? `已在現場登記${titleTag(JOB_BY_ID[id].title)}；到「行程與工作」即可安排試鏡日期。`
            : record.notice || "目前無法登記這份試鏡。";
        render();
      }),
  );
  document
    .querySelector("[data-sign-job-now]")
    ?.addEventListener("click", (event) => {
      const id = event.currentTarget.dataset.signJobNow,
        ok = signJob(id),
        job = JOB_BY_ID[id];
      state.notice = ok
        ? `已正式簽署${titleTag(job.title)}，通告現在可直接排入行程。`
        : ensureJobState(id).notice || "合約目前無法成立。";
      if (ok && state.runnerResult)
        state.runnerResult.text = state.runnerResult.text.replace(
          /<section class="audition-contract-offer">[\s\S]*<\/section>$/,
          '<section class="audition-contract-offer signed"><span>CONTRACT SIGNED</span><b>合約已正式成立</b><p>本週結束後，到「行程與工作」的工作分類就能選擇這份通告。</p></section>',
        );
      render();
    });
  document
    .querySelector("#next-day")
    ?.addEventListener("click", () => advanceRunner());
}
