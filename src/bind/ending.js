// 事件層：結局畫面。切換是否啟用眼熟繼承、開始新的一輪。
import { state } from "../core/state.js";
import { render, renderUi } from "../render.js";
import { startNewRun } from "../views/ending.js";
import {
  activateDialog,
  rememberDialogTrigger,
  restoreDialogTrigger,
  trapDialogFocus,
} from "../core/dialog-focus.js";

export function bindEndingScreen() {
  document.querySelectorAll("[data-inherit]").forEach(
    (x) =>
      (x.onclick = () => {
        state.inheritChoice = x.dataset.inherit === "yes";
        render();
      }),
  );
  document.querySelector("#new-run")?.addEventListener("click", (event) => {
    rememberDialogTrigger(event.currentTarget);
    state.confirmDialog = { type: "new-run" };
    renderUi();
  });
  document.querySelectorAll("[data-confirm-cancel]").forEach((button) =>
    button.addEventListener("click", () => {
      state.confirmDialog = null;
      renderUi();
      Promise.resolve().then(restoreDialogTrigger);
    }),
  );
  document
    .querySelector("[data-confirm-accept]")
    ?.addEventListener("click", () => {
      if (state.confirmDialog?.type === "new-run") startNewRun();
    });
  const dialog = document.querySelector(".confirm-dialog");
  if (dialog) {
    activateDialog(dialog, { initial: "[data-confirm-cancel]" });
    dialog.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        state.confirmDialog = null;
        renderUi();
        Promise.resolve().then(restoreDialogTrigger);
      } else trapDialogFocus(event, dialog);
    });
  }
}
