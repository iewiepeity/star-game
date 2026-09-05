import { appIcon } from "./app-icons.js";
import { state } from "../core/state.js";
import { esc } from "../core/utils.js";
import { playerLookImage } from "./player-look.js";
export function phoneApp() {
  const messages = (state.npcMessages || []).filter((m) =>
      state.knownPeople.includes(m.npcId),
    ),
    unread = messages.filter((m) => !m.read).length;
  return `<div class="inside-page phone-home"><header>${playerLookImage()}<div><span>第 ${state.week} 週・我的手機</span><h2>${esc(state.name)}的日常</h2><p>想看看大家在做什麼，就打開來。瀏覽不會消耗行程。</p></div></header><div class="phone-app-grid">${[
    [
      "people",
      "♡",
      "訊息與聯絡人",
      `${unread} 則未讀・${state.knownPeople.length} 位聯絡人`,
    ],
    ["social", "✧", "星光社群", "查看即時近況、按讚與回覆"],
    ["forum", "☷", "星談論壇", "圈內討論與熱門話題"],
    ["world", "▤", "娛樂週報", "這一週的作品與新聞"],
    ["map", "⌖", "星望市地圖", "看看附近有什麼地方"],
  ]
    .map(
      ([id, , label, note]) =>
        `<button data-phone-open="${id}"><i aria-hidden="true">${appIcon(id)}</i><b>${label}</b><small>${note}</small></button>`,
    )
    .join(
      "",
    )}</div><aside>閱讀與瀏覽不占用一天；發布正式內容、赴約與外出，會先讓你確認行程。</aside></div>`;
}
