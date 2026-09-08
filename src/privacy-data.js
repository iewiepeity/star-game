// These namespaces belong to this game, not every project on this origin.
export const PIXEL_DATABASE = "star-game-pixel-saves-v2";
export function isGameStorageKey(key) {
  return /^(?:star-game-pixel-phase-one-v1(?:$|-)|star-game-save(?:$|-)|star-game-pixel-preferences-v1$|star-game-preferences$)/.test(key);
}
function clearOwnedKeys(storage) {
  const keys = Array.from({ length: storage.length }, (_, i) => storage.key(i));
  for (const key of keys) if (isGameStorageKey(key)) storage.removeItem(key);
}
async function stopCaching(worker) {
  if (!worker || worker.state === "redundant") return;
  await new Promise((resolve, reject) => {
    const channel = new globalThis.MessageChannel();
    const finish = error => {
      clearTimeout(timer);
      channel.port1.close();
      channel.port2.close();
      if (error) reject(error); else resolve();
    };
    const timer = setTimeout(() => finish(new Error("背景離線服務尚未停止。請關閉其他遊戲分頁、更新遊戲後再清除，或使用瀏覽器網站資料設定。")), 10000);
    channel.port1.onmessage = event => {
      if (event.data?.type === "GAME_CACHING_STOPPED") finish();
    };
    try { worker.postMessage({ type: "STOP_GAME_CACHING" }, [channel.port2]); }
    catch (error) { finish(error); }
  });
}
export async function clearGameData({ indexedDB, localStorage, sessionStorage, caches, serviceWorker, pageURL, onBlocked = () => {} }) {
  if (!indexedDB || !localStorage || !sessionStorage) throw new Error("無法存取本機資料；請從瀏覽器網站資料設定手動清除。");
  const scope = new URL("./", pageURL).href;
  if (serviceWorker) {
    for (const registration of await serviceWorker.getRegistrations()) {
      const workers = [...new Set([registration.active, registration.waiting, registration.installing].filter(Boolean))];
      if (registration.scope === scope && workers.length && workers.every(worker => worker.scriptURL === new URL("service-worker.js", scope).href)) {
        // unregister alone does not stop a worker controlling an existing tab.
        await Promise.all(workers.map(stopCaching));
        await registration.unregister();
      }
    }
  }
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
  if (caches) {
    for (const name of await caches.keys()) {
      if (/^star-game-runtime-/.test(name)) await caches.delete(name);
    }
  }
}
