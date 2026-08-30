const FOCUSABLE = [
  "button:not([disabled])",
  "a[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

let returnFocusSelector = "";

function focusSelector(node) {
  if (!node?.dataset) return "";
  if (node.id) return `#${CSS.escape(node.id)}`;
  const entry = Object.entries(node.dataset).find(([, value]) => value);
  if (!entry) return "";
  const [key, value] = entry;
  const attribute = key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
  return `[data-${attribute}="${CSS.escape(value)}"]`;
}

export function rememberDialogTrigger(node = document.activeElement) {
  returnFocusSelector = focusSelector(node);
}

export function restoreDialogTrigger() {
  if (!returnFocusSelector) return;
  document.querySelector(returnFocusSelector)?.focus({ preventScroll: true });
  returnFocusSelector = "";
}

export function activateDialog(dialog, { initial = null } = {}) {
  if (!dialog) return;
  const scope = dialog.closest(".room-screen") || dialog.parentElement;
  [...(scope?.children || [])].forEach((child) => {
    if (child !== dialog && !child.classList.contains("app-backdrop") && !child.classList.contains("confirm-backdrop")) child.inert = true;
  });
  const focusables = [...dialog.querySelectorAll(FOCUSABLE)];
  const target = (initial ? dialog.querySelector(initial) : null) || focusables[0];
  (target || dialog).focus({ preventScroll: true });
}

export function trapDialogFocus(event, dialog) {
  if (event.key !== "Tab" || !dialog) return;
  const focusables = [...dialog.querySelectorAll(FOCUSABLE)].filter((node) => node.getClientRects().length);
  if (!focusables.length) {
    event.preventDefault();
    dialog.focus();
    return;
  }
  const first = focusables[0], last = focusables.at(-1);
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}
