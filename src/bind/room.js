import { COMPANY_PART_TIME } from "../data/part-time.js";
import { MAP_LOCATIONS } from "../data/map-locations.js";
import { districtFor } from "../data/city-map.js";
import { AGENCY_LIST } from "../data/agencies.js";
import { hydrateState, resetState, state } from "../core/state.js";
import { render, renderUi } from "../render.js";
import { evaluateEnding } from "../logic/career.js";
import { breakUp } from "../logic/romance-engine.js";
import {
  backupCurrent,
  deleteManualSlot,
  saveManualSlot,
  saveState,
} from "../core/persistence.js";
import { rollStats } from "../core/stats.js";
import { NPCS } from "../data/npcs.js";
import { DEFAULT_DOCK_IDS, normalizeDockIds } from "../views/app-icons.js";
import {
  activateDialog,
  rememberDialogTrigger,
  restoreDialogTrigger,
  trapDialogFocus,
} from "../core/dialog-focus.js";
import { bindDeferredSearch } from "../core/deferred-search.js";
import { openApp } from "../core/app-navigation.js";
import { markGallerySeen } from "../views/gallery.js";

let dialogKeyHandler = null;
let activeDialogIdentity = "";

function hasDirtyAppState() {
  return Boolean(state.creativeDraftTitle?.trim());
}
function closeDialog(force = false) {
  if (!force && hasDirtyAppState()) {
    state.confirmDialog = { type: "close-app" };
    renderUi();
    return;
  }
  state.appOpen = null;
  state.appReturnContext = null;
  state.confirmDialog = null;
  renderUi();
  Promise.resolve().then(restoreDialogTrigger);
}

function bindDialogKeyboard() {
  const dialog = document.querySelector(
    state.confirmDialog ? ".confirm-dialog" : ".app-window",
  );
  const identity = state.confirmDialog
    ? `confirm:${state.confirmDialog.type}`
    : state.appOpen || "";
  if (dialog && identity !== activeDialogIdentity)
    activateDialog(dialog, {
      initial: dialog.classList.contains("confirm-dialog")
        ? "[data-confirm-cancel]"
        : null,
    });
  activeDialogIdentity = dialog ? identity : "";
  if (dialogKeyHandler)
    document.removeEventListener("keydown", dialogKeyHandler);
  dialogKeyHandler = (event) => {
    const current = document.querySelector(
      state.confirmDialog ? ".confirm-dialog" : ".app-window",
    );
    if (!current) return;
    if (event.key === "Escape") {
      event.preventDefault();
      if (state.confirmDialog) {
        state.confirmDialog = null;
        renderUi();
        Promise.resolve().then(restoreDialogTrigger);
      } else closeDialog(false);
      return;
    }
    trapDialogFocus(event, current);
  };
  document.addEventListener("keydown", dialogKeyHandler);
}

export function bindRoomShell() {
  document
    .querySelectorAll("img[data-remove-on-error]")
    .forEach((image) =>
      image.addEventListener("error", () => image.remove(), { once: true }),
    );
  document.querySelectorAll("[data-people-section]").forEach(
    (button) =>
      (button.onclick = () => {
        state.peopleSection = button.dataset.peopleSection;
        renderUi();
      }),
  );
  document
    .querySelector(".people-hub-tabs")
    ?.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
        return;
      event.preventDefault();
      const tabs = [...event.currentTarget.querySelectorAll('[role="tab"]')],
        index = tabs.indexOf(document.activeElement),
        next =
          event.key === "Home"
            ? tabs[0]
            : event.key === "End"
              ? tabs.at(-1)
              : tabs[
                  (index +
                    (event.key === "ArrowRight" ? 1 : -1) +
                    tabs.length) %
                    tabs.length
                ];
      next?.click();
      Promise.resolve().then(() =>
        document
          .querySelector(
            `[data-people-section="${next?.dataset.peopleSection}"]`,
          )
          ?.focus(),
      );
    });
  bindDeferredSearch(
    "[data-people-query]",
    (value) => {
      state.peopleQuery = value;
    },
    () => render({ persist: false }),
  );
  document
    .querySelector("[data-clear-people-query]")
    ?.addEventListener("click", () => {
      state.peopleQuery = "";
      renderUi();
    });
  bindDeferredSearch(
    "[data-app-query]",
    (value) => {
      state.appQuery = value;
    },
    () => render({ persist: false }),
  );
  document.querySelectorAll("[data-app-category]").forEach(
    (button) =>
      (button.onclick = () => {
        state.appCategory = button.dataset.appCategory;
        renderUi();
      }),
  );
  document
    .querySelector("[data-clear-app-filters]")
    ?.addEventListener("click", () => {
      state.appQuery = "";
      state.appCategory = "全部";
      renderUi();
    });
  document
    .querySelector("[data-app-library-toggle]")
    ?.addEventListener("click", () => {
      state.appLibraryExpanded = !state.appLibraryExpanded;
      if (!state.appLibraryExpanded) {
        state.appQuery = "";
        state.appCategory = "全部";
      }
      renderUi();
    });
  document
    .querySelector("[data-return-app]")
    ?.addEventListener("click", (event) => {
      openApp(state, event.currentTarget.dataset.returnApp);
      render();
    });
  document.querySelector("[data-dock-edit]")?.addEventListener("click", () => {
    state.dockEditing = true;
    state.dockDraftIds = [...normalizeDockIds(state.dockAppIds)];
    state.dockNotice = "";
    renderUi();
  });
  document.querySelectorAll("[data-dock-toggle]").forEach(
    (button) =>
      (button.onclick = () => {
        const id = button.dataset.dockToggle,
          current = [...(state.dockDraftIds || [])],
          index = current.indexOf(id);
        if (index >= 0) {
          current.splice(index, 1);
          state.dockNotice = "";
        } else if (current.length >= 6)
          state.dockNotice = "快捷列已滿，請先移除一個 App。";
        else {
          current.push(id);
          state.dockNotice = "";
        }
        state.dockDraftIds = current;
        renderUi();
      }),
  );
  document.querySelectorAll("[data-dock-remove]").forEach(
    (button) =>
      (button.onclick = () => {
        state.dockDraftIds = (state.dockDraftIds || []).filter(
          (id) => id !== button.dataset.dockRemove,
        );
        state.dockNotice = "";
        renderUi();
      }),
  );
  document.querySelector("[data-dock-reset]")?.addEventListener("click", () => {
    state.dockDraftIds = [...DEFAULT_DOCK_IDS];
    state.dockNotice = "已恢復預設排列，按完成後套用。";
    renderUi();
  });
  document
    .querySelector("[data-dock-cancel]")
    ?.addEventListener("click", () => {
      state.dockEditing = false;
      state.dockDraftIds = null;
      state.dockNotice = "";
      renderUi();
    });
  document.querySelector("[data-dock-save]")?.addEventListener("click", () => {
    const draft = [...(state.dockDraftIds || [])];
    if (draft.length !== 6) {
      state.dockNotice = "請選滿六個 App 才能完成。";
      renderUi();
      return;
    }
    state.dockAppIds = draft;
    state.dockEditing = false;
    state.dockDraftIds = null;
    state.dockNotice = "";
    render();
  });
  document.querySelectorAll("[data-part-time-plan]").forEach(button => button.onclick = () => { const id=button.dataset.partTimePlan;if(!COMPANY_PART_TIME[id])return;state.filter="工作";openApp(state,"planner");renderUi();const entry=document.querySelector(`[data-pick="${id}"]`);entry?.scrollIntoView({block:"center"});entry?.focus({preventScroll:true}); });
  document.querySelectorAll("[data-city-shortcut]").forEach(button => button.onclick = () => { const id=button.dataset.cityShortcut;if(!MAP_LOCATIONS[id])return;state.citySelection=id;state.cityDistrict=districtFor(id)||"all";openApp(state,"map");renderUi(); });
  document.querySelectorAll("[data-phone-open]").forEach(button => button.onclick = () => { openApp(state,button.dataset.phoneOpen,{returnContext:{app:"phone",label:"手機"}});renderUi(); });
  document.querySelectorAll("[data-open-app]").forEach(
    (button) =>
      (button.onclick = () => {
        rememberDialogTrigger(button);
        const target = button.dataset.openApp;
        if (target === "map") {
          const openDay = state.schedule.findIndex((id) => id === "rest");
          if (openDay >= 0) state.selectedDay = openDay;
        }
        if (target === "agency" && !state.selectedAgencyId)
          state.selectedAgencyId = AGENCY_LIST[0].id;
        if (target === "achievements") state.achievementNotifications = [];
        if (target === "gallery") markGallerySeen();
        if (target === "people") {
          state.peopleSection = "contacts";
          (state.npcMessages || []).forEach((message) => (message.read = true));
        }
        openApp(state, target);
        render();
      }),
  );
  document
    .querySelectorAll("[data-close-app]")
    .forEach((button) => (button.onclick = () => closeDialog(false)));
  document
    .querySelector("[data-open-job]")
    ?.addEventListener("click", (event) => {
      rememberDialogTrigger(event.currentTarget);
      openApp(state, "jobs");
      render();
    });
  document.querySelector("[data-go-free]")?.addEventListener("click", () => {
    state.selectedDay = state.schedule.findIndex((id) => id === "rest");
    if (state.selectedDay < 0) state.selectedDay = 6;
    openApp(state, "map");
    render();
  });
  document
    .querySelector("[data-retire]")
    ?.addEventListener("click", (event) => {
      rememberDialogTrigger(event.currentTarget);
      state.confirmDialog = { type: "retire" };
      renderUi();
    });
  document.querySelectorAll("[data-confirm-cancel]").forEach(
    (button) =>
      (button.onclick = () => {
        state.confirmDialog = null;
        renderUi();
        Promise.resolve().then(restoreDialogTrigger);
      }),
  );
  document
    .querySelector("[data-confirm-accept]")
    ?.addEventListener("click", () => {
      const dialog = state.confirmDialog;
      if (!dialog) return;
      if (dialog.type === "close-app") {
        closeDialog(true);
        return;
      }
      if (dialog.type === "overwrite") {
        const ok = saveManualSlot(
          dialog.slot,
          state,
          `手動存檔 ${dialog.slot}`,
        );
        state.saveNotice = ok
          ? `已儲存至槽位 ${dialog.slot}。`
          : "存檔寫入失敗，原本內容沒有被刪除。";
        state.confirmDialog = null;
        renderUi();
        return;
      }
      if (dialog.type === "delete-save") {
        const ok = deleteManualSlot(dialog.slot);
        state.saveNotice = ok
          ? `已刪除槽位 ${dialog.slot}；仍可復原一次。`
          : "刪除失敗，槽位內容仍然保留。";
        state.confirmDialog = null;
        renderUi();
        return;
      }
      if (dialog.type === "breakup") {
        const npc = NPCS[dialog.npcId],
          result = breakUp(dialog.npcId, "玩家主動提出分手");
        state.notice = result.ok
          ? `你和${npc?.name || "對方"}結束了這段關係。`
          : result.reason;
        state.confirmDialog = null;
        render();
        return;
      }
      if (dialog.type === "retire") {
        state.confirmDialog = null;
        state.endingType = "retire";
        state.endingResult = evaluateEnding("retire");
        state.screen = "ending";
        state.appOpen = null;
        render();
        return;
      }
      if (dialog.type === "reset") {
        const previous = structuredClone(state);
        if (!backupCurrent(state, "從頭開始前備份")) {
          state.notice = "無法建立安全備份，已取消重新開始。";
          state.confirmDialog = null;
          render();
          return;
        }
        resetState();
        rollStats();
        if (!saveState(state)) {
          hydrateState(previous);
          state.notice = "無法寫入全新存檔，原本進度已恢復。";
          state.appOpen = "settings";
          render();
          return;
        }
        window.location.reload();
      }
    });
  bindDialogKeyboard();
}
