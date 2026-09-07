import { SAVE_KEY, validatePixelState } from "./model.js";

export const PIXEL_DATABASE = "star-game-pixel-saves-v2";
const STORE = "saves";
const META = "revision";
const JOURNAL_PREFIX = `${SAVE_KEY}-pending-`;
const SESSION_PREFIX = "session-backup:";
const slotKey = (slot) =>
  slot === "auto" ? SAVE_KEY : `${SAVE_KEY}-slot-${slot}`;
const slots = ["auto", 1, 2, 3, 4, 5];
const legacyKeys = [
  ...slots.flatMap((slot) => [
    slotKey(slot),
    `${slotKey(slot)}-backup`,
    `${slotKey(slot)}-deleted`,
  ]),
  `${SAVE_KEY}-transfer-backup`,
];
const empty = () => ({ state: null });
function decode(raw) {
  if (raw == null) return empty();
  try {
    const item = JSON.parse(raw);
    return { state: validatePixelState(item.state), savedAt: item.savedAt };
  } catch {
    return { state: null, error: "這份存檔無法讀取，原始資料已保留" };
  }
}
function encode(state) {
  return JSON.stringify({
    state: validatePixelState(state),
    savedAt: new Date().toISOString(),
  });
}
function openDatabase(factory, name) {
  return new Promise((resolve, reject) => {
    if (!factory) return reject(new Error("無法使用儲存空間"));
    const request = factory.open(name, 1);
    let settled = false;
    const timer = setTimeout(() => {
      settled = true;
      reject(new Error("儲存空間沒有回應，請關閉其他遊戲分頁後重試"));
    }, 8000);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onblocked = () => {
      clearTimeout(timer);
      settled = true;
      reject(new Error("請關閉其他遊戲分頁後重試"));
    };
    request.onerror = () => {
      clearTimeout(timer);
      reject(request.error);
    };
    request.onsuccess = () => {
      clearTimeout(timer);
      if (settled) request.result.close();
      else resolve(request.result);
    };
  });
}

// All writes compare and advance one revision in the same IndexedDB transaction.
// Cached reads are populated before the game starts and never authorize a write.
export async function createPixelStorage(
  legacy,
  {
    indexedDB = globalThis.indexedDB,
    databaseName = PIXEL_DATABASE,
    broadcast = globalThis.BroadcastChannel,
  } = {},
) {
  let db = null,
    cache = new Map(),
    revision = 0,
    conflict = false;
  let lastError = "",
    queue = Promise.resolve(),
    notifyConflict = () => {};
  let sequence = 0,
    startupNotice = "";
  const writer =
    globalThis.crypto?.randomUUID?.() ||
    `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const journals = [];
  let channel = null,
    noticeSent = false;
  const migrated = new Map();
  try {
    for (const key of legacyKeys) {
      const raw = legacy?.getItem(key);
      if (raw != null) migrated.set(key, raw);
    }
    for (let i = 0; i < (legacy?.length || 0); i++) {
      const key = legacy.key(i);
      if (!key?.startsWith(JOURNAL_PREFIX)) continue;
      const raw = legacy.getItem(key);
      try {
        const item = JSON.parse(raw);
        if (
          Number.isInteger(item.revision) &&
          Number.isInteger(item.sequence) &&
          typeof item.writer === "string" &&
          decode(item.raw).state
        )
          journals.push({ key, raw, item });
      } catch {
        /* Leave unknown emergency data untouched. */
      }
    }
  } catch {
    /* IndexedDB still works when legacy storage is unavailable. */
  }
  cache = new Map(migrated);
  function markConflict() {
    conflict = true;
    lastError =
      "另一個分頁已有新進度，此分頁已暫停儲存。請先匯出這份旅程，或接續最新進度。";
    if (!noticeSent) {
      noticeSent = true;
      notifyConflict();
    }
  }
  async function refresh() {
    await queue;
    if (!db) return false;
    return new Promise((resolve) => {
      const tx = db.transaction(STORE, "readonly"),
        store = tx.objectStore(STORE);
      const next = new Map(),
        request = store.openCursor();
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          next.set(cursor.key, cursor.value);
          cursor.continue();
        }
      };
      tx.oncomplete = () => {
        cache = next;
        revision = cache.get(META)?.revision || 0;
        conflict = false;
        noticeSent = false;
        lastError = "";
        resolve(true);
      };
      tx.onabort = () => resolve(false);
    });
  }
  try {
    db = await openDatabase(indexedDB, databaseName);
    db.onversionchange = () => {
      db.close();
      db = null;
      lastError = "儲存空間已更新，請重新載入";
    };
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite"),
        store = tx.objectStore(STORE);
      const request = store.get(META);
      request.onsuccess = () => {
        const meta = request.result || { revision: 0, migrated: true };
        if (!request.result) {
          for (const [key, raw] of migrated) store.put(raw, key);
          store.put(meta, META);
        }
        const primary = store.get(SAVE_KEY);
        primary.onsuccess = () => {
          const eligible = journals.filter(
            ({ item }) =>
              item.revision === meta.revision ||
              (item.writer === meta.writer &&
                item.sequence > (meta.sequence || 0)),
          );
          for (const journal of journals) {
            const { item } = journal;
            if (
              item.writer === meta.writer &&
              item.sequence <= (meta.sequence || 0)
            )
              continue;
            if (
              eligible.length === 1 &&
              eligible[0] === journal &&
              !decode(primary.result).error
            ) {
              if (decode(primary.result).state)
                store.put(primary.result, `${SAVE_KEY}-backup`);
              store.put(item.raw, SAVE_KEY);
              store.put(
                {
                  revision: meta.revision + 1,
                  migrated: true,
                  writer: item.writer,
                  sequence: item.sequence,
                },
                META,
              );
              startupNotice = "已接續離開頁面前的最新進度";
            } else {
              store.put(item.raw, SESSION_PREFIX + item.writer);
              startupNotice =
                "有分頁進度等待確認，可從存檔選單查看；目前存檔沒有被覆蓋";
            }
          }
        };
      };
      tx.oncomplete = resolve;
      tx.onabort = () => reject(tx.error);
    });
    if (!(await refresh())) throw new Error("無法讀取儲存空間");
    for (const { key, raw } of journals) {
      try {
        if (legacy.getItem(key) === raw) legacy.removeItem(key);
      } catch {}
    }
    // Release legacy quota only after a committed, byte-identical migration.
    // Never delete unrelated keys or a value changed by an older app meanwhile.
    for (const [key, raw] of migrated) {
      try {
        if (cache.get(key) === raw && legacy.getItem(key) === raw)
          legacy.removeItem(key);
      } catch {
        /* A retained legacy copy is harmless; IndexedDB is authoritative. */
      }
    }
    if (broadcast) {
      channel = new broadcast(`${databaseName}-changes`);
      channel.onmessage = ({ data }) => {
        if (data?.revision > revision) markConflict();
      };
    }
  } catch (e) {
    db?.close();
    db = null;
    lastError = `無法開啟儲存空間。原有資料已保留，請先匯出備份，再檢查瀏覽器設定或重新載入。${e?.message ? `（${e.message}）` : ""}`;
  }
  function transact(change) {
    const operationSequence = ++sequence;
    const operation = queue.then(
      () =>
        new Promise((resolve) => {
          if (!db || conflict) return resolve(false);
          let tx;
          try {
            tx = db.transaction(STORE, "readwrite");
          } catch {
            lastError = "無法開啟儲存空間，請匯出備份後重新載入";
            return resolve(false);
          }
          const store = tx.objectStore(STORE),
            updates = new Map();
          let rejected = false;
          const request = store.get(META);
          request.onsuccess = () => {
            if ((request.result?.revision || 0) !== revision) {
              markConflict();
              rejected = true;
              tx.abort();
              return;
            }
            try {
              const edit = {
                get: (key) => cache.get(key),
                put: (key, raw) => {
                  updates.set(key, raw);
                  store.put(raw, key);
                },
                remove: (key) => {
                  updates.set(key, undefined);
                  store.delete(key);
                },
              };
              change(edit);
              store.put(
                {
                  revision: revision + 1,
                  migrated: true,
                  writer,
                  sequence: operationSequence,
                },
                META,
              );
            } catch (e) {
              rejected = true;
              lastError =
                e.name === "QuotaExceededError"
                  ? "儲存空間不足，原有存檔已保留。請先匯出目前旅程，再釋出空間。"
                  : e.message;
              tx.abort();
            }
          };
          tx.oncomplete = () => {
            for (const [key, raw] of updates) {
              if (raw === undefined) cache.delete(key);
              else cache.set(key, raw);
            }
            revision++;
            cache.set(META, {
              revision,
              migrated: true,
              writer,
              sequence: operationSequence,
            });
            try {
              const key = JOURNAL_PREFIX + writer,
                journal = JSON.parse(legacy?.getItem(key) || "null");
              if (journal && journal.sequence <= operationSequence)
                legacy.removeItem(key);
            } catch {
              /* An acknowledged write remains safe even if journal cleanup fails. */
            }
            lastError = "";
            try {
              channel?.postMessage({ revision });
            } catch {
              /* Revision checks remain authoritative. */
            }
            resolve(true);
          };
          tx.onabort = () => {
            if (!rejected)
              lastError =
                "瀏覽器無法寫入存檔，請匯出目前旅程，再確認儲存空間或隱私設定";
            resolve(false);
          };
        }),
    );
    queue = operation.catch(() => false);
    return queue;
  }
  function prepare(state) {
    try {
      return encode(state);
    } catch {
      lastError = "進度資料無法保存，請匯出備份後重試";
      return null;
    }
  }
  function putSave(edit, raw, slot, recover = false) {
    const key = slotKey(slot),
      old = edit.get(key),
      parsed = decode(old);
    if (parsed.error) {
      if (!recover)
        throw new Error(
          "這格存檔損毀，已停止覆寫。請先從存檔選單復原或匯出原始資料",
        );
      edit.put(`${key}-quarantine`, old);
    } else if (parsed.state) edit.put(`${key}-backup`, old);
    edit.put(key, raw);
  }
  return {
    get startupNotice() {
      return startupNotice;
    },
    sessionCopies: () =>
      [...cache]
        .filter(([key]) => key.startsWith(SESSION_PREFIX))
        .map(([key, raw]) => ({ key, ...decode(raw) }))
        .filter((item) => item.state),
    readSessionCopy: (key) =>
      key.startsWith(SESSION_PREFIX) ? decode(cache.get(key)) : empty(),
    // IndexedDB may abort during unload. One per-page emergency snapshot is
    // written synchronously only on visibility/pagehide, then replayed under the
    // same revision rules at next boot. A stale tab can never replace the winner.
    stageExit(state) {
      if (!db || conflict) return false;
      const raw = prepare(state);
      if (!raw) return false;
      try {
        legacy.setItem(
          JOURNAL_PREFIX + writer,
          JSON.stringify({ raw, revision, writer, sequence: ++sequence }),
        );
        return true;
      } catch {
        return false;
      } // Previous committed checkpoints remain intact.
    },
    read: (slot = "auto") => decode(cache.get(slotKey(slot))),
    readBackup: (slot = "transfer") =>
      decode(
        cache.get(
          slot === "transfer"
            ? `${SAVE_KEY}-transfer-backup`
            : `${slotKey(slot)}-backup`,
        ),
      ),
    deleted: (slot) => decode(cache.get(`${slotKey(slot)}-deleted`)),
    raw: (slot = "auto") =>
      cache.get(`${slotKey(slot)}-quarantine`) ?? cache.get(slotKey(slot)),
    hasRecoveryCopy: () => cache.has(`${SAVE_KEY}-quarantine`),
    get error() {
      return lastError;
    },
    get conflicted() {
      return conflict;
    },
    get available() {
      return !!db;
    },
    onConflict(callback) {
      notifyConflict = callback;
      if (conflict) callback();
    },
    idle: () => queue,
    refresh,
    write(state, slot = "auto") {
      const raw = prepare(state);
      return raw
        ? transact((edit) => putSave(edit, raw, slot))
        : Promise.resolve(false);
    },
    backup(state) {
      const raw = prepare(state);
      return raw
        ? transact((edit) => edit.put(`${SAVE_KEY}-transfer-backup`, raw))
        : Promise.resolve(false);
    },
    replace(state, previous, { recover = false } = {}) {
      const raw = prepare(state),
        before = previous ? prepare(previous) : null;
      if (!raw || (previous && !before)) return Promise.resolve(false);
      return transact((edit) => {
        if (before) edit.put(`${SAVE_KEY}-transfer-backup`, before);
        putSave(edit, raw, "auto", recover);
      });
    },
    remove(slot) {
      if (![1, 2, 3, 4, 5].includes(Number(slot)))
        return Promise.resolve(false);
      return transact((edit) => {
        const key = slotKey(slot),
          raw = edit.get(key);
        if (!raw) throw new Error("這格還沒有存檔");
        edit.put(`${key}-deleted`, raw);
        edit.remove(key);
      });
    },
    restoreDeleted(slot) {
      return transact((edit) => {
        const key = slotKey(slot),
          raw = edit.get(`${key}-deleted`);
        if (!decode(raw).state || edit.get(key))
          throw new Error("無法復原或該位置已有存檔");
        edit.put(key, raw);
        edit.remove(`${key}-deleted`);
      });
    },
    close() {
      channel?.close();
      db?.close();
      db = null;
    },
  };
}
