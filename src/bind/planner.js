import { replacePlannerDay } from "../logic/planner-edit.js";
import { FOCUSES } from "../data/focuses.js";
import { DAYS } from "../data/calendar.js";
import { state } from "../core/state.js";
import { startDay } from "../logic/runner.js";
import { budget } from "../views/planner.js";
import { render, renderUi } from "../render.js";
import { captureWeekStart } from "../logic/career-memory.js";
import {
  applySchedulePreset,
  scheduleDueWork,
  copyRoutineWeek,
  restRoutineWeek,
} from "../logic/schedule-assistant.js";
import {
  signJob,
  scheduleJobSession,
  jobScheduleOptions,
} from "../logic/job-engine.js";

import { setUndo } from "../core/undo.js";
import {
  capturePlannerTransaction,
  restoreStateFields,
} from "../core/state-transaction.js";
import { openApp } from "../core/app-navigation.js";
const scheduleSnapshot = () => capturePlannerTransaction(state);
const restoreSchedule = (snapshot) => restoreStateFields(state, snapshot);
const offerUndo = (message, snapshot) =>
  setUndo(message, () => restoreSchedule(snapshot));
export function bindPlanner() {
  const forced = state.forcedRestWeek === state.week;
  const applyEdit = (day, id, options = {}) => {
    const result = replacePlannerDay(day, id, options);
    state.plannerReplacement = result.confirmationRequired
      ? result.request
      : null;
    state.notice = result.message;
    if (result.ok) {
      offerUndo(state.notice, result.snapshot);
      state.selectedDay = Math.min(day + 1, 6);
    }
    render();
    if (result.confirmationRequired)
      document.querySelector("[data-confirm-planner-edit]")?.focus();
  };
  document
    .querySelector("[data-confirm-planner-edit]")
    ?.addEventListener("click", () => {
      const request = state.plannerReplacement;
      if (request)
        applyEdit(request.day, request.id, { ...request, confirmed: true });
    });
  document
    .querySelector("[data-cancel-planner-edit]")
    ?.addEventListener("click", () => {
      state.plannerReplacement = null;
      state.notice = "已保留原本的預約";
      render();
    });
  document
    .querySelector("[data-clear-day]")
    ?.addEventListener("click", (event) => {
      if (forced) return;
      applyEdit(Number(event.currentTarget.dataset.clearDay), "rest");
    });
  document.querySelectorAll("[data-day]").forEach(
    (x) =>
      (x.onclick = () => {
        if (forced) return;
        state.selectedDay = Number(x.dataset.day);
        renderUi();
        document
          .querySelector(".activity-picker")
          ?.scrollIntoView({ block: "nearest" });
      }),
  );
  document.querySelectorAll("[data-filter]").forEach(
    (x) =>
      (x.onclick = () => {
        if (forced) return;
        state.filter = x.dataset.filter;
        renderUi();
      }),
  );
  document.querySelectorAll("[data-planner-sign-job]").forEach(
    (x) =>
      (x.onclick = () => {
        if (forced) return;
        const ok = signJob(x.dataset.plannerSignJob);
        state.notice = ok
          ? "合約已成立；這份通告已加入下方「工作」清單。"
          : "合約目前無法成立，請查看合作檔期。";
        state.filter = "工作";
        render();
      }),
  );
  document.querySelectorAll("[data-planner-job]").forEach(
    (x) =>
      (x.onclick = () => {
        if (forced) return;
        const result = scheduleJobSession(
          x.dataset.plannerJob,
          Number(x.dataset.jobDay),
        );
        state.notice = result.message;
        render();
      }),
  );
  document.querySelectorAll("[data-planner-focus-job]").forEach(
    (x) =>
      (x.onclick = () => {
        if (forced) return;
        state.filter = "工作";
        const id = x.dataset.plannerFocusJob,
          job = state.activeJobs[id],
          preferred = jobScheduleOptions(id)[0]?.day;
        if (preferred != null) state.selectedDay = preferred;
        state.notice = !job
          ? "通告資料已失效。"
          : preferred == null
            ? "已切到工作分類，但本週沒有符合合約與共演檔期的空位。"
            : "已切到工作分類並選好第一個可用日期。";
        render();
      }),
  );
  document.querySelectorAll("[data-discover-training]").forEach(button => button.onclick = () => { state.citySelection = button.dataset.discoverTraining; state.cityDistrict = "all"; openApp(state, "map"); render(); });
  document.querySelectorAll("[data-pick]").forEach(
    (x) =>
      (x.onclick = () => {
        if (forced) return;
        const id = x.dataset.pick;
        if (id === "free") {
          openApp(state, "map");
          render();
          return;
        }
        applyEdit(state.selectedDay, id);
      }),
  );
  document.querySelectorAll("[data-focus]").forEach(
    (x) =>
      (x.onclick = () => {
        if (forced) return;
        state.focus = x.dataset.focus;
        state.notice = `本週策略改為「${FOCUSES[state.focus].label}」`;
        render();
      }),
  );
  document.querySelectorAll("[data-schedule-preset]").forEach(
    (x) =>
      (x.onclick = () => {
        if (forced) return;
        const snapshot = scheduleSnapshot(),
          result = applySchedulePreset(x.dataset.schedulePreset);
        state.notice = result.message;
        if (result.ok !== false) offerUndo(state.notice, snapshot);
        render();
      }),
  );
  document
    .querySelector("[data-schedule-work]")
    ?.addEventListener("click", () => {
      if (forced) return;
      const snapshot = scheduleSnapshot(),
        result = scheduleDueWork();
      state.notice = result.message;
      if (result.ok !== false) offerUndo(state.notice, snapshot);
      render();
    });
  for (const [selector, action] of [
    ["#copy", copyRoutineWeek],
    ["#rest-all", restRoutineWeek],
  ])
    document.querySelector(selector)?.addEventListener("click", () => {
      if (forced) return;
      const snapshot = scheduleSnapshot(),
        result = action();
      state.notice = result.message;
      if (result.ok) offerUndo(state.notice, snapshot);
      render();
    });
  document.querySelector("#begin-week")?.addEventListener("click", () => {
    if (forced) {
      state.schedule = Array(7).fill("rest");
      state.freeLocations = Array(7).fill(null);
      state.scheduledJobIds = Array(7).fill(null);
      state.scheduledActivityIds = Array(7).fill(null);
    }
    const invalidAssigned = state.schedule.findIndex(
      (id, index) =>
        (id === "job_session" && !state.scheduledJobIds[index]) ||
        (id === "personal_task" && !state.scheduledActivityIds[index]),
    );
    if (invalidAssigned >= 0) {
      state.notice = `${DAYS[invalidAssigned]}的預約資料已失效，請重新安排`;
      render();
      return;
    }
    if (budget() > state.money) {
      state.notice = "預算不足，請先調整行程";
      render();
      return;
    }
    state.lastSchedule = [...state.schedule];
    state.lastFreeLocations = [...state.freeLocations];
    state.lastScheduledJobIds = [...state.scheduledJobIds];
    state.lastScheduledActivityIds = [...state.scheduledActivityIds];
    state.plannerReplacement = null;
    state.weekResults = [];
    captureWeekStart();
    state.runnerDay = 0;
    state.screen = "runner";
    state.appOpen = null;
    startDay();
  });
}
