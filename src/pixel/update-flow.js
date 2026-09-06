// update() can resolve while the new worker is still installing its cache.
export function waitForPixelUpdate(registration, timeout = 20000) {
  const worker = registration.installing;
  if (!worker) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const finish = (error) => {
      clearTimeout(timer);
      worker.removeEventListener("statechange", changed);
      if (error) reject(error);
      else resolve();
    };
    const changed = () => {
      if (["installed", "activated"].includes(worker.state)) finish();
      else if (worker.state === "redundant")
        finish(new Error("新版下載未完成，請再試一次。"));
    };
    const timer = setTimeout(
      () => finish(new Error("新版仍在準備中，請稍後再試。")),
      timeout,
    );
    worker.addEventListener("statechange", changed);
    changed();
  });
}

export function activatePixelUpdate(
  registration,
  serviceWorkers,
  timeout = 15000,
) {
  const worker =
    registration.waiting ||
    (registration.active?.state === "activating" ? registration.active : null);
  // Another tab may already have activated the update since the dialog opened.
  // The caller can safely reload after saving, even without a waiting worker.
  if (!worker) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const previousController = serviceWorkers.controller;
    let settled = false;
    const finish = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      serviceWorkers.removeEventListener("controllerchange", controlled);
      worker.removeEventListener("statechange", changed);
      if (error) reject(error);
      else resolve();
    };
    const controlled = () => {
      if (
        serviceWorkers.controller &&
        serviceWorkers.controller !== previousController
      )
        finish();
    };
    const changed = () => {
      if (worker.state === "activated") finish();
      else if (worker.state === "redundant")
        finish(new Error("新版切換未完成，可以重試或重新載入遊戲。"));
    };
    const timer = setTimeout(
      () => finish(new Error("新版切換比預期久，可以重試或重新載入遊戲。")),
      timeout,
    );
    serviceWorkers.addEventListener("controllerchange", controlled);
    worker.addEventListener("statechange", changed);
    changed();
    if (!settled && worker.state === "installed") {
      try {
        worker.postMessage({ type: "SKIP_WAITING" });
      } catch (error) {
        finish(error);
      }
    }
  });
}
