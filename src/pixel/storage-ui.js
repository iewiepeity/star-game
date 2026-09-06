import {
  parsePixelTransfer,
  exportPixelSave,
  newRun,
} from "./save-transfer.js";
import { withCore } from "./core-bridge.js";
import { lockEnding } from "../logic/career.js";
import { evaluateAchievements } from "../logic/achievement-engine.js";
export function createStorageUI(api) {
  let pending = null;
  const esc = api.escape,
    storage = api.storage;
  function download() {
    try {
      const blob = new Blob([exportPixelSave(api.state())], {
          type: "application/json",
        }),
        url = URL.createObjectURL(blob),
        a = document.createElement("a");
      a.href = url;
      a.download = `星途未定-像素-${api.state().playerName}-第${api.state().life.game.week}週.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      api.toast("已匯出旅程，可在另一台裝置匯入");
    } catch (e) {
      api.toast(e.message);
    }
  }
  function extras() {
    return `<section class="transfer-tools"><h3>把旅程帶著走</h3><p class="tiny-note">匯出 JSON，在另一個瀏覽器或裝置匯入。也能匯入原版存檔；會先預覽內容。</p><div class="buttons"><button data-storage="export">匯出目前旅程</button><button data-storage="import">匯入存檔</button><button data-storage="legacy">搬入這台裝置的原版存檔</button><button data-storage="backup" ${storage.readBackup().state ? "" : "disabled"}>還原搬移前備份</button></div><input type="file" accept=".json,application/json" id="pixel-import-file" hidden></section><details class="save-maintenance"><summary>管理手動存檔 · 刪除與還原</summary>${[1, 2, 3, 4, 5].map((slot) => `<div class="save-row"><b>位置 ${slot}</b><button data-delete-slot="${slot}" ${storage.read(slot).state ? "" : "disabled"}>刪除</button><button data-undelete-slot="${slot}" ${storage.deleted(slot).state && !storage.read(slot).state ? "" : "disabled"}>復原刪除</button><button data-backup-slot="${slot}" ${storage.readBackup(slot).state ? "" : "disabled"}>載入上次覆寫前</button></div>`).join("")}</details>`;
  }
  function inheritance() {
    if (!api.state().life.game.endingResult) return "";
    const enabled = pending.state.life.game.inheritChoice;
    return `<section class="inheritance-choice"><h3>下一輪的眼熟印象</h3><p class="tiny-note">保留曾經相遇的眼熟印象。仍須重新見面、交換聯絡方式；不繼承關係數值、金錢或作品。</p><div class="focus-options"><button data-run-inherit="yes" aria-pressed="${enabled}">保留眼熟印象</button><button data-run-inherit="no" aria-pressed="${!enabled}">全新的相遇</button></div></section>`;
  }
  function preview(item, kind = "import") {
    pending = { ...item, kind };
    const s = item.state;
    api.show(
      "transfer-preview",
      `${api.heading("A JOURNEY TO KEEP", kind === "new" ? "開始新的人生？" : "確認接續這段旅程", kind === "new" ? "新角色從第一週開始；永久成就與結局收藏會保留。" : "目前進度會另存成搬移前備份，手動存檔也會保留。")}<div class="transfer-summary"><b>${esc(s.playerName)}</b><span>${esc(item.source || "像素版")} · 第 ${s.life.game.week} 週 · ${s.life.day === 7 ? "週末結算" : `週${"一二三四五六日"[s.life.day]}`}</span><span>$${s.life.game.money.toLocaleString()} · ${s.life.game.completedWorks.length} 部作品 · ${s.knownPeople.length} 位朋友</span></div>${kind === "new" ? inheritance() : ""}<div class="buttons"><button data-ui="saves">取消</button><button class="primary" data-storage="confirm">${kind === "new" ? "建立新角色" : "確認載入"}</button></div>`,
    );
  }
  function handle(button) {
    const d = button.dataset;
    if (
      d.runInherit &&
      pending?.kind === "new" &&
      api.state().life.game.endingResult
    ) {
      preview(
        {
          state: newRun(api.state(), { inherit: d.runInherit === "yes" }),
          source: "新周目",
        },
        "new",
      );
      return true;
    }
    if (d.deleteSlot) {
      api.show(
        "delete-slot",
        `${api.heading("SAVE MANAGEMENT", `刪除位置 ${d.deleteSlot}？`, "刪除後可從管理介面復原，直到這格再次被刪除。")}<div class="buttons"><button data-ui="saves">取消</button><button data-confirm-delete="${d.deleteSlot}">確認刪除</button></div>`,
      );
      return true;
    }
    if (d.confirmDelete) {
      api.toast(
        storage.remove(d.confirmDelete)
          ? "已刪除，可從管理介面復原"
          : "無法刪除",
      );
      api.saves();
      return true;
    }
    if (d.undeleteSlot) {
      api.toast(
        storage.restoreDeleted(d.undeleteSlot)
          ? "已復原存檔"
          : "無法復原或該位置已有存檔",
      );
      api.saves();
      return true;
    }
    if (d.backupSlot) {
      const item = storage.readBackup(d.backupSlot);
      if (item.state) preview(item);
      return true;
    }
    if (!d.storage) return false;
    if (d.storage === "export") download();
    if (d.storage === "import")
      document.getElementById("pixel-import-file").click();
    if (d.storage === "backup") {
      const item = storage.readBackup();
      if (item.state) preview(item);
    }
    if (d.storage === "legacy") {
      const items = [];
      for (const key of [
        "star-game-save",
        ...Array.from({ length: 5 }, (_, i) => `star-game-save-slot-${i + 1}`),
      ]) {
        try {
          const text = localStorage.getItem(key);
          if (text) {
            const item = parsePixelTransfer(text);
            items.push({ key, item });
          }
        } catch {}
      }
      api.show(
        "legacy-transfer",
        `${api.heading("WELCOME BACK", "接續原版旅程", "只讀取這個瀏覽器的原版存檔，不會覆寫它們。其他裝置可先在原版匯出 JSON。")}${items.length ? items.map(({ key, item }) => `<button data-legacy-slot="${key}">${esc(item.state.playerName)} · 第 ${item.state.life.game.week} 週 · ${key === "star-game-save" ? "自動" : `手動 ${key.at(-1)}`}</button>`).join("") : "<p>這個網址來源沒有可搬移的原版存檔，請使用匯入檔案。</p>"}<button data-ui="saves">返回</button>`,
      );
    }
    if (d.storage === "confirm" && pending) {
      const item = pending;
      pending = null;
      button.disabled = true;
      api.replace(item.state, item.kind).catch((e) => api.toast(e.message));
    }
    if (d.storage === "new")
      preview({ state: newRun(api.state()), source: "新周目" }, "new");
    if (d.storage === "retire")
      api.show(
        "retire-confirm",
        `${api.heading("THE NEXT CHAPTER", "要在這裡為旅程寫下結局嗎？", "將以目前的作品、關係與成長結算。可先匯出或手動存檔，再做決定。")}<button data-ui="settings">繼續生活</button><button data-storage="retire-confirm">確認退圈並結算</button>`,
      );
    if (d.storage === "retire-confirm") {
      if (
        api.state().life.pending &&
        api.state().life.pending.phase !== "result"
      )
        api.toast("先完成或取消今天的主要行動，再寫下結局");
      else {
        if (!storage.backup(api.state())) {
          api.toast("無法建立退圈前備份，請先匯出進度再重試");
          return true;
        }
        api.state().life.auto = false;
        withCore(api.state().life, () => {
          lockEnding("retire");
          evaluateAchievements();
        });
        api.checkpoint();
        api.ending();
      }
    }
    return true;
  }
  function legacy(button) {
    if (!button.dataset.legacySlot) return false;
    try {
      preview(
        parsePixelTransfer(localStorage.getItem(button.dataset.legacySlot)),
      );
    } catch (e) {
      api.toast(e.message);
    }
    return true;
  }
  async function file(event) {
    if (event.target.id !== "pixel-import-file") return;
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      if (file.size > 16_000_000) throw new Error("存檔超過 16 MB");
      preview(parsePixelTransfer(await file.text()));
    } catch (e) {
      api.toast(`無法匯入：${e.message}`);
    }
    event.target.value = "";
  }
  return { extras, handle: (button) => legacy(button) || handle(button), file };
}
