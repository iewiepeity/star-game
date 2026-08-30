let waitingWorker = null;
let applying = false;

export function markUpdateAvailable(worker) {
  waitingWorker = worker || null;
}

export function updateAvailable() {
  return Boolean(waitingWorker);
}

export function applyAvailableUpdate() {
  if (!waitingWorker) return false;
  applying = true;
  waitingWorker.postMessage({ type: "SKIP_WAITING" });
  return true;
}

export function updateIsApplying() {
  return applying;
}
