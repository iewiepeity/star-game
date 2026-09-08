// These namespaces belong to this game, not every project on this origin.
export const PIXEL_DATABASE = "star-game-pixel-saves-v2";
export function isGameStorageKey(key) {
  return /^(?:star-game-pixel-phase-one-v1(?:$|-)|star-game-save(?:$|-)|star-game-pixel-preferences-v1$|star-game-preferences$)/.test(key);
}
function clearOwnedKeys(storage) {
  const keys = Array.from({ length: storage.length }, (_, i) => storage.key(i));
  for (const key of keys) if (isGameStorageKey(key)) storage.removeItem(key);
}
export async function clearGameData({ indexedDB, localStorage, sessionStorage, caches, serviceWorker, pageURL, onBlocked = () => {} }) {
  if (!indexedDB || !localStorage || !sessionStorage) throw new Error("無法存取本機資料；請從瀏覽器網站資料設定手動清除。");
  // Open game tabs receive versionchange, stop saving and leave the game.
  // Do not report success while an older tab still blocks deletion.
  await new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(PIXEL_DATABASE);
    request.onsuccess = resolve;
    request.onerror = () => reject(request.error);
    request.onblocked = onBlocked;
  });
  clearOwnedKeys(localStorage);
  clearOwnedKeys(sessionStorage);
  const scope = new URL("./", pageURL).href;
  if (serviceWorker) {
    for (const registration of await serviceWorker.getRegistrations()) {
      const worker = registration.active || registration.waiting || registration.installing;
      if (registration.scope === scope && worker?.scriptURL === new URL("service-worker.js", scope).href) {
        await registration.unregister();
      }
    }
  }
  if (caches) {
    for (const name of await caches.keys()) {
      if (/^star-game-runtime-/.test(name)) await caches.delete(name);
    }
  }
}
