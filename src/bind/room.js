import { AGENCY_LIST } from "../data/agencies.js";
import { state } from "../core/state.js";
import { render } from "../render.js";
import { evaluateEnding } from "../logic/career.js";
import { DEFAULT_DOCK_IDS, normalizeDockIds } from "../views/app-icons.js";
import { activateDialog, rememberDialogTrigger, restoreDialogTrigger, trapDialogFocus } from "../core/dialog-focus.js";

let dialogKeyHandler = null;
let activeDialogIdentity = "";

function closeDialog() {
  state.retireConfirm = false;
  state.appOpen = null;
  state.appReturnContext = null;
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
  document.querySelectorAll("[data-people-section]").forEach((button) => button.onclick = () => { state.peopleSection = button.dataset.peopleSection; render(); });
  document.querySelector(".people-hub-tabs")?.addEventListener("keydown",(event)=>{if(!["ArrowLeft","ArrowRight"].includes(event.key))return;event.preventDefault();const tabs=[...event.currentTarget.querySelectorAll('[role="tab"]')],index=tabs.indexOf(document.activeElement),next=tabs[(index+(event.key==="ArrowRight"?1:-1)+tabs.length)%tabs.length];next?.click();Promise.resolve().then(()=>document.querySelector(`[data-people-section="${next?.dataset.peopleSection}"]`)?.focus())});
  document.querySelector("[data-people-query]")?.addEventListener("input",(event)=>{state.peopleQuery=event.currentTarget.value.trimStart().slice(0,200);render()});
  document.querySelector("[data-clear-people-query]")?.addEventListener("click",()=>{state.peopleQuery="";render()});
  document.querySelector("[data-app-query]")?.addEventListener("input",(event)=>{state.appQuery=event.currentTarget.value.trimStart().slice(0,200);render()});
  document.querySelectorAll("[data-app-category]").forEach(button=>button.onclick=()=>{state.appCategory=button.dataset.appCategory;render()});
  document.querySelector("[data-clear-app-filters]")?.addEventListener("click",()=>{state.appQuery="";state.appCategory="全部";render()});
  document.querySelector("[data-return-app]")?.addEventListener("click",(event)=>{state.appOpen=event.currentTarget.dataset.returnApp;state.appReturnContext=null;render()});
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
    state.appReturnContext = null; state.appOpen = target; render();
  });
  document.querySelectorAll("[data-close-app]").forEach((button) => button.onclick = closeDialog);
  document.querySelector("[data-open-job]")?.addEventListener("click", (event) => { rememberDialogTrigger(event.currentTarget); state.appOpen = "jobs"; render(); });
  document.querySelector("[data-go-free]")?.addEventListener("click", () => { state.selectedDay = state.schedule.findIndex((id) => id === "rest"); if (state.selectedDay < 0) state.selectedDay = 6; state.appOpen = "map"; render(); });
  document.querySelector("[data-retire]")?.addEventListener("click", (event) => { rememberDialogTrigger(event.currentTarget); state.retireConfirm = true; render(); });
  document.querySelectorAll("[data-retire-cancel]").forEach((button) => button.onclick = () => { state.retireConfirm = false; render(); Promise.resolve().then(restoreDialogTrigger); });
  document.querySelector("[data-retire-confirm]")?.addEventListener("click", () => { state.retireConfirm = false; state.endingType = "retire"; state.endingResult = evaluateEnding("retire"); state.screen = "ending"; state.appOpen = null; render(); });
  bindDialogKeyboard();
}
