import { waitForPixelUpdate, activatePixelUpdate } from "./update-flow.js";

export function setupPixelOffline(api) {
  let registration = null,
    installPrompt = null,
    downloading = false,
    applyingUpdate = false;
  const status = (text) => {
    const el = document.getElementById("offline-status");
    if (el) el.textContent = text;
  };
  const updateStatus = (text) => {
    const el = document.getElementById("pixel-update-status");
    if (el) el.textContent = text;
    api.toast(text);
  };
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPrompt = event;
  });
  if ("serviceWorker" in navigator) {
    const hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker
      .register("./service-worker.js")
      .then((reg) => {
        registration = reg;
        status(
          navigator.onLine
            ? "已啟用瀏覽器離線快取"
            : "目前離線，可讀取已準備內容",
        );
        const offer = () => {
          if (reg.waiting && hadController)
            api.toast("有新版本。可在設定檢查更新，保存後再切換。");
        };
        reg.addEventListener("updatefound", () =>
          reg.installing?.addEventListener("statechange", offer),
        );
        offer();
      })
      .catch(() => status("此瀏覽器無法啟用離線快取"));
    navigator.serviceWorker.addEventListener("message", (event) => {
      const d = event.data;
      if (d?.type !== "PIXEL_OFFLINE_PROGRESS") return;
      const progress = document.getElementById("offline-progress");
      if (progress) {
        progress.hidden = false;
        progress.value = d.percent;
      }
      status(d.message);
      if (d.done) {
        downloading = false;
        api.toast(d.message);
      }
    });
  }
  function offerUpdate() {
    api.show(
            "update-confirm",
            `${api.heading("A NEW CHAPTER", "發現新版本", "套用前會儲存目前進度，然後重新開啟遊戲。")}<p id="pixel-update-status" role="status" aria-live="polite">新版已準備好，存檔後就能出發。</p><div class="buttons"><button data-ui="settings">稍後</button><button class="primary" data-offline="apply-update">儲存並更新</button><button data-offline="reload-update" hidden>重新載入遊戲</button></div>`,
          );
  }
  async function handle(button) {
    const action = button.dataset.offline;
    if (!action) return;
    if (action === "install") {
      if (installPrompt) {
        await installPrompt.prompt();
        installPrompt = null;
      } else
        api.toast(
          window.matchMedia("(display-mode: standalone)").matches
            ? "已在獨立視窗中開啟"
            : "在瀏覽器選單選擇「加入主畫面」或「安裝應用程式」。Safari 可從分享選單加入。",
        );
    }
    if (action === "download") {
      if (downloading) {
        api.toast("正在準備內容，可以繼續遊玩");
        return;
      }
      if (!navigator.onLine) {
        api.toast("完整離線內容需要先連線下載一次");
        return;
      }
      if (!registration) {
        api.toast("離線功能尚未準備好，請稍後重試");
        return;
      }
      api.show(
        "offline-confirm",
        `${api.heading("PLAY ANYWHERE", "準備完整離線內容？", "會下載約 110 MB 的場景、人物和故事圖片。建議使用 Wi-Fi；準備完成後，即可離線探索所有已解鎖地點。")}<button data-ui="settings">稍後再說</button><button data-offline="confirm-download">開始準備</button>`,
      );
    }
    if (action === "confirm-download") {
      if (downloading) return;
      const reg = await navigator.serviceWorker.ready;
      if (!reg.active) {
        api.toast("離線功能尚未啟用");
        return;
      }
      downloading = true;
      api.settings();
      status("開始準備離線內容…");
      reg.active.postMessage({ type: "PIXEL_CACHE_ALL" });
    }
    if (action === "update") {
      if (!registration) {
        api.toast("此瀏覽器無法檢查更新");
        return;
      }
      const label = button.textContent;
      button.disabled = true;
      button.textContent = "檢查新版中…";
      status("正在檢查並準備新版…");
      try {
        await registration.update();
        await waitForPixelUpdate(registration);
        if (registration.waiting)
          offerUpdate();
        else {
          status("目前已是可取得的最新版本");
          api.toast("目前已是可取得的最新版本");
        }
      } catch (error) {
        const message = error.message.startsWith("新版")
          ? error.message
          : "目前無法連線檢查更新，請稍後再試。";
        status(message);
        api.toast(message);
      } finally {
        button.disabled = false;
        button.textContent = label;
      }
    }
    if (["apply-update", "reload-update"].includes(action)) {
      if (applyingUpdate) return;
      applyingUpdate = true;
      button.disabled = true;
      const label = button.textContent;
      button.textContent = "正在儲存進度…";
      let saved = false,
        reloading = false;
      try {
        if (!(await api.checkpoint())) {
          updateStatus("目前無法儲存進度，請稍後再試；這次尚未更新。");
          return;
        }
        saved = true;
        updateStatus("進度已儲存，正在切換新版…");
        button.textContent = "進度已儲存，更新中…";
        if (action === "apply-update" && registration) {
          await waitForPixelUpdate(registration);
          await activatePixelUpdate(registration, navigator.serviceWorker);
        }
        location.reload();
        reloading = true;
      } catch {
        updateStatus(
          saved
            ? "進度已保留，但新版切換未完成。可以重試或重新載入遊戲。"
            : "目前無法儲存進度，請稍後再試；這次尚未更新。",
        );
        const fallback = document.querySelector(
          '[data-offline="reload-update"]',
        );
        if (fallback && saved) fallback.hidden = false;
      } finally {
        if (!reloading) {
          applyingUpdate = false;
          button.disabled = false;
          button.textContent = label;
        }
      }
    }
  }
  return {
    offerUpdate,
    handle: (button) => {
      if (!button.dataset.offline) return false;
      handle(button).catch(() => {
        downloading = false;
        api.toast("離線準備未完成，請確認連線與儲存空間後重試");
      });
      return true;
    },
  };
}
