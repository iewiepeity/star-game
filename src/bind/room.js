import { AGENCY_LIST } from "../data/agencies.js";
import { state } from "../core/state.js";
import { render, renderUi } from "../render.js";
import { evaluateEnding } from "../logic/career.js";
import { DEFAULT_DOCK_IDS, normalizeDockIds } from "../views/app-icons.js";
import { activateDialog, rememberDialogTrigger, restoreDialogTrigger, trapDialogFocus } from "../core/dialog-focus.js";
import { bindDeferredSearch } from "../core/deferred-search.js";

let dialogKeyHandler = null;
let activeDialogIdentity = "";

function hasDirtyAppState(){return Boolean(state.creativeDraftTitle?.trim()||state.saveConfirm||state.settingsConfirmReset)}
function closeDialog(force=false) {
  if(!force&&hasDirtyAppState()){state.appCloseConfirm=true;renderUi();Promise.resolve().then(()=>document.querySelector("[data-cancel-app-close]")?.focus());return}
  state.retireConfirm = false;
  state.appOpen = null;
  state.appReturnContext = null;
  state.appCloseConfirm = false;
  renderUi();
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
      closeDialog(false);
      return;
    }
    trapDialogFocus(event, current);
  };
  document.addEventListener("keydown", dialogKeyHandler);
}

export function bindRoomShell() {
  document.querySelectorAll("img[data-remove-on-error]").forEach(image=>image.addEventListener("error",()=>image.remove(),{once:true}));
  document.querySelectorAll("[data-people-section]").forEach((button) => button.onclick = () => { state.peopleSection = button.dataset.peopleSection; renderUi(); });
  document.querySelector(".people-hub-tabs")?.addEventListener("keydown",(event)=>{if(!["ArrowLeft","ArrowRight","Home","End"].includes(event.key))return;event.preventDefault();const tabs=[...event.currentTarget.querySelectorAll('[role="tab"]')],index=tabs.indexOf(document.activeElement),next=event.key==="Home"?tabs[0]:event.key==="End"?tabs.at(-1):tabs[(index+(event.key==="ArrowRight"?1:-1)+tabs.length)%tabs.length];next?.click();Promise.resolve().then(()=>document.querySelector(`[data-people-section="${next?.dataset.peopleSection}"]`)?.focus())});
  bindDeferredSearch("[data-people-query]",(value)=>{state.peopleQuery=value},()=>render({persist:false}));
  document.querySelector("[data-clear-people-query]")?.addEventListener("click",()=>{state.peopleQuery="";renderUi()});
  bindDeferredSearch("[data-app-query]",(value)=>{state.appQuery=value},()=>render({persist:false}));
  document.querySelectorAll("[data-app-category]").forEach(button=>button.onclick=()=>{state.appCategory=button.dataset.appCategory;renderUi()});
  document.querySelector("[data-clear-app-filters]")?.addEventListener("click",()=>{state.appQuery="";state.appCategory="全部";renderUi()});
  document.querySelector("[data-return-app]")?.addEventListener("click",(event)=>{state.appOpen=event.currentTarget.dataset.returnApp;state.appReturnContext=null;renderUi()});
  document.querySelector("[data-dock-edit]")?.addEventListener("click", () => { state.dockEditing = true; state.dockDraftIds = [...normalizeDockIds(state.dockAppIds)]; state.dockNotice = ""; renderUi(); });
  document.querySelectorAll("[data-dock-toggle]").forEach((button) => button.onclick = () => {
    const id = button.dataset.dockToggle, current = [...(state.dockDraftIds || [])], index = current.indexOf(id);
    if (index >= 0) { current.splice(index, 1); state.dockNotice = ""; }
    else if (current.length >= 6) state.dockNotice = "快捷列已滿，請先移除一個 App。";
    else { current.push(id); state.dockNotice = ""; }
    state.dockDraftIds = current; renderUi();
  });
  document.querySelectorAll("[data-dock-remove]").forEach((button) => button.onclick = () => { state.dockDraftIds = (state.dockDraftIds || []).filter((id) => id !== button.dataset.dockRemove); state.dockNotice = ""; renderUi(); });
  document.querySelector("[data-dock-reset]")?.addEventListener("click", () => { state.dockDraftIds = [...DEFAULT_DOCK_IDS]; state.dockNotice = "已恢復預設排列，按完成後套用。"; renderUi(); });
  document.querySelector("[data-dock-cancel]")?.addEventListener("click", () => { state.dockEditing = false; state.dockDraftIds = null; state.dockNotice = ""; renderUi(); });
  document.querySelector("[data-dock-save]")?.addEventListener("click", () => {
    const draft = [...(state.dockDraftIds || [])];
    if (draft.length !== 6) { state.dockNotice = "請選滿六個 App 才能完成。"; renderUi(); return; }
    state.dockAppIds = draft; state.dockEditing = false; state.dockDraftIds = null; state.dockNotice = ""; render();
  });
  document.querySelectorAll("[data-open-app]").forEach((button) => button.onclick = () => {
    rememberDialogTrigger(button);
    const target = button.dataset.openApp;
    if (target === "map") { const openDay = state.schedule.findIndex((id) => id === "rest"); if (openDay >= 0) state.selectedDay = openDay; }
    if (target === "agency" && !state.selectedAgencyId) state.selectedAgencyId = AGENCY_LIST[0].id;
    const hasAchievementNotices=target==="achievements"&&Boolean(state.achievementNotifications?.length),hasUnreadPeople=target==="people"&&(state.npcMessages||[]).some(message=>!message.read);
    if (target === "achievements") state.achievementNotifications = [];
    if (target === "people") { state.peopleSection = "contacts"; (state.npcMessages || []).forEach((message) => message.read = true); }
    state.appReturnContext = null; state.appCloseConfirm=false; state.appOpen = target; (hasAchievementNotices||hasUnreadPeople?render:renderUi)();
  });
  document.querySelectorAll("[data-close-app]").forEach((button) => button.onclick = ()=>closeDialog(false));
  document.querySelector("[data-cancel-app-close]")?.addEventListener("click",()=>{state.appCloseConfirm=false;renderUi()});
  document.querySelector("[data-confirm-app-close]")?.addEventListener("click",()=>closeDialog(true));
  document.querySelector("[data-open-job]")?.addEventListener("click", (event) => { rememberDialogTrigger(event.currentTarget); state.appOpen = "jobs"; renderUi(); });
  document.querySelector("[data-go-free]")?.addEventListener("click", () => { state.selectedDay = state.schedule.findIndex((id) => id === "rest"); if (state.selectedDay < 0) state.selectedDay = 6; state.appOpen = "map"; renderUi(); });
  document.querySelector("[data-retire]")?.addEventListener("click", (event) => { rememberDialogTrigger(event.currentTarget); state.retireConfirm = true; renderUi(); });
  document.querySelectorAll("[data-retire-cancel]").forEach((button) => button.onclick = () => { state.retireConfirm = false; renderUi(); Promise.resolve().then(restoreDialogTrigger); });
  document.querySelector("[data-retire-confirm]")?.addEventListener("click", () => { state.retireConfirm = false; state.endingType = "retire"; state.endingResult = evaluateEnding("retire"); state.screen = "ending"; state.appOpen = null; render(); });
  bindDialogKeyboard();
}
