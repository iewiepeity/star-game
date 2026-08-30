import { AGENCY_LIST } from "../data/agencies.js";
import { state } from "../core/state.js";
import { render } from "../render.js";
import { evaluateEnding } from "../logic/career.js";
import { DEFAULT_DOCK_IDS, normalizeDockIds } from "../views/app-icons.js";
import { activateDialog, rememberDialogTrigger, restoreDialogTrigger, trapDialogFocus } from "../core/dialog-focus.js";

let dialogKeyHandler = null;
let activeDialogIdentity = "";

function enhancePeople() {
  const list = document.querySelector(".contact-list");
  if (!list || list.previousElementSibling?.classList.contains("list-tools")) return;
  const tools = document.createElement("div");
  tools.className = "list-tools";
  tools.innerHTML = '<input type="search" placeholder="搜尋姓名、職業或關係" aria-label="搜尋聯絡人">';
  list.before(tools);
  tools.querySelector("input").oninput = (event) => {
    const query = event.target.value.trim().toLowerCase();
    list.querySelectorAll(".contact-card").forEach((card) => card.hidden = !card.textContent.toLowerCase().includes(query));
  };
}

function closeDialog() {
  state.retireConfirm = false;
  state.appOpen = null;
  render();
  Promise.resolve().then(restoreDialogTrigger);
}

function bindDialogKeyboard() {
  const dialog = document.querySelector(".confirm-dialog, .app-window");
  const identity = state.retireConfirm ? "retire" : state.appOpen || "";
  if (dialog && identity !== activeDialogIdentity) activateDialog(dialog, { initial: dialog.classList.contains("confirm-dialog") ? "[data-retire-cancel]" : null });
  activeDialogIdentity = dialog ? identity : "";
  if (dialogKeyHandler) document.removeEventListener("keydown", dialogKeyHandler);
  dialogKeyHandler = (event) => {
    const current = document.querySelector(".confirm-dialog, .app-window");
    if (!current) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeDialog();
      return;
    }
    trapDialogFocus(event, current);
  };
  document.addEventListener("keydown", dialogKeyHandler);
}

export function bindRoomShell() {
  enhancePeople();
  document.querySelectorAll("[data-people-section]").forEach((button) => button.onclick = () => { state.peopleSection = button.dataset.peopleSection; render(); });
  document.querySelector("[data-dock-edit]")?.addEventListener("click", () => { state.dockEditing = true; state.dockDraftIds = [...normalizeDockIds(state.dockAppIds)]; state.dockNotice = ""; render(); });
  document.querySelectorAll("[data-dock-toggle]").forEach((button) => button.onclick = () => {
    const id = button.dataset.dockToggle, current = [...(state.dockDraftIds || [])], index = current.indexOf(id);
    if (index >= 0) { current.splice(index, 1); state.dockNotice = ""; }
    else if (current.length >= 6) state.dockNotice = "快捷列已滿，請先移除一個 App。";
    else { current.push(id); state.dockNotice = ""; }
    state.dockDraftIds = current; render();
  });
  document.querySelectorAll("[data-dock-remove]").forEach((button) => button.onclick = () => { state.dockDraftIds = (state.dockDraftIds || []).filter((id) => id !== button.dataset.dockRemove); state.dockNotice = ""; render(); });
  document.querySelector("[data-dock-reset]")?.addEventListener("click", () => { state.dockDraftIds = [...DEFAULT_DOCK_IDS]; state.dockNotice = "已恢復預設排列，按完成後套用。"; render(); });
  document.querySelector("[data-dock-cancel]")?.addEventListener("click", () => { state.dockEditing = false; state.dockDraftIds = null; state.dockNotice = ""; render(); });
  document.querySelector("[data-dock-save]")?.addEventListener("click", () => {
    const draft = [...(state.dockDraftIds || [])];
    if (draft.length !== 6) { state.dockNotice = "請選滿六個 App 才能完成。"; render(); return; }
    state.dockAppIds = draft; state.dockEditing = false; state.dockDraftIds = null; state.dockNotice = ""; render();
  });
  document.querySelectorAll("[data-open-app]").forEach((button) => button.onclick = () => {
    rememberDialogTrigger(button);
    const target = button.dataset.openApp;
    if (target === "map") { const openDay = state.schedule.findIndex((id) => id === "rest"); if (openDay >= 0) state.selectedDay = openDay; }
    if (target === "agency" && !state.selectedAgencyId) state.selectedAgencyId = AGENCY_LIST[0].id;
    if (target === "achievements") state.achievementNotifications = [];
    if (target === "people") { state.peopleSection = "contacts"; (state.npcMessages || []).forEach((message) => message.read = true); }
    state.appOpen = target; render();
  });
  document.querySelectorAll("[data-close-app]").forEach((button) => button.onclick = closeDialog);
  document.querySelector("[data-open-job]")?.addEventListener("click", (event) => { rememberDialogTrigger(event.currentTarget); state.appOpen = "jobs"; render(); });
  document.querySelector("[data-go-free]")?.addEventListener("click", () => { state.selectedDay = state.schedule.findIndex((id) => id === "rest"); if (state.selectedDay < 0) state.selectedDay = 6; state.appOpen = "map"; render(); });
  document.querySelector("[data-retire]")?.addEventListener("click", (event) => { rememberDialogTrigger(event.currentTarget); state.retireConfirm = true; render(); });
  document.querySelectorAll("[data-retire-cancel]").forEach((button) => button.onclick = () => { state.retireConfirm = false; render(); Promise.resolve().then(restoreDialogTrigger); });
  document.querySelector("[data-retire-confirm]")?.addEventListener("click", () => { state.retireConfirm = false; state.endingType = "retire"; state.endingResult = evaluateEnding("retire"); state.screen = "ending"; state.appOpen = null; render(); });
  bindDialogKeyboard();
}
