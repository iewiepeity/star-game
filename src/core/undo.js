let pendingUndo = null;

export function setUndo(message, run, doneMessage = "已復原剛才的變更") {
  pendingUndo = typeof run === "function" ? { message, run, doneMessage } : null;
}

export function peekUndo(message) {
  return pendingUndo?.message === message ? pendingUndo : null;
}

export function consumeUndo(message) {
  if (pendingUndo?.message !== message) return null;
  const action = pendingUndo;
  pendingUndo = null;
  return action;
}

export function clearUndo(message) {
  if (!message || pendingUndo?.message === message) pendingUndo = null;
}
