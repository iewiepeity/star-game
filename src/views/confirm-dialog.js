import { state } from "../core/state.js";
import { NPCS } from "../data/npcs.js";
import { esc } from "../core/utils.js";
import { OUTFITS, GENDER_CHANGE_COST } from "../data/wardrobe.js";

export function confirmationDialog() {
  const dialog = state.confirmDialog;
  if (!dialog) return "";
  const configs = {
    "close-app": {
      kicker: "UNFINISHED ACTION",
      title: "要關閉目前畫面嗎？",
      description: "尚未完成的輸入會保留在本次遊戲中；重新開啟 App 就能繼續。",
      cancel: "繼續操作",
      confirm: "保留草稿並關閉",
    },
    overwrite: {
      kicker: `SAVE SLOT ${dialog.slot}`,
      title: `確定覆寫槽位 ${dialog.slot}？`,
      description: "目前進度會取代原本內容；舊內容仍可從「復原舊槽位」取回一次。",
      cancel: "取消",
      confirm: "確認覆寫",
    },
    "delete-save": {
      kicker: `SAVE SLOT ${dialog.slot}`,
      title: `確定刪除槽位 ${dialog.slot}？`,
      description: "刪除後仍可復原最近一次舊槽位，但下一次覆寫或刪除會取代這份復原紀錄。",
      cancel: "保留存檔",
      confirm: "確認刪除",
    },
    reset: {
      kicker: "NEW GAME",
      title: `確定結束 ${esc(state.name)} 的目前進度？`,
      description: "目前進度會先放進安全備份，再回到角色建立畫面；手動槽位不會刪除。",
      cancel: "繼續這一輪",
      confirm: "確認從頭開始",
    },
    retire: {
      kicker: "END THIS JOURNEY?",
      title: "確定要主動結束這一輪嗎？",
      description: "會立刻依目前作品、關係與生涯狀態進入結算；這一輪將不再繼續推進。",
      cancel: "繼續這一輪",
      confirm: "確認結束並結算",
    },
    breakup: {
      kicker: "RELATIONSHIP DECISION",
      title: `確定要和${esc(NPCS[dialog.npcId]?.name || "對方")}分手嗎？`,
      description: "這會改變彼此關係、心情、後續人物事件與五年結局，而且不能用普通互動立刻復原。",
      cancel: "繼續交往",
      confirm: "確認分手",
    },
    "buy-outfit": {
      kicker: "WARDROBE PURCHASE",
      title: `購買「${esc(OUTFITS[dialog.outfitId]?.name || "這套服裝")}」？`,
      description: `將支付 ${(OUTFITS[dialog.outfitId]?.price || 0).toLocaleString("zh-TW")} 元；服裝會歸目前人物立繪持有並立即穿上。`,
      cancel: "先不購買",
      confirm: "確認購買並穿上",
    },
    "change-gender": {
      kicker: "IDENTITY CHANGE",
      title: `確認變性為${esc(dialog.targetGender || "指定性別")}？`,
      description: `將支付 ${GENDER_CHANGE_COST.toLocaleString("zh-TW")} 元，並切換至對應人物立繪；已購買服裝仍保留在原人物名下。`,
      cancel: "取消手術",
      confirm: "確認手術與費用",
    },
    "new-run": {
      kicker: "BEGIN AGAIN?",
      title: "確定開始新一輪？",
      description: "本輪結局會寫入回顧；新一輪將重設角色與進度，只保留已選擇的眼熟繼承、成就、結局紀錄與快捷列。",
      cancel: "留在結局回顧",
      confirm: "確認開始新一輪",
    },
  };
  const config = configs[dialog.type];
  if (!config) return "";
  return `<div class="confirm-backdrop" data-confirm-cancel></div><section class="confirm-dialog shared-confirm" role="alertdialog" aria-modal="true" aria-labelledby="shared-confirm-title" aria-describedby="shared-confirm-description" tabindex="-1"><span>${config.kicker}</span><h2 id="shared-confirm-title">${config.title}</h2><p id="shared-confirm-description">${config.description}</p><div><button data-confirm-cancel>${config.cancel}</button><button class="danger" data-confirm-accept>${config.confirm}</button></div></section>`;
}
