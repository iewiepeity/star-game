import { state } from "../core/state.js";
import { NPCS } from "../data/npcs.js";
import { NPC_INTERACTIONS } from "../data/npc-network.js";
import { DAYS } from "../data/calendar.js";
import { invitationStatus } from "../logic/npc-invitations.js";
import { esc, money } from "../core/utils.js";
export function npcInvitationPanel(npcId) {
  const pending = state.npcInvitation;
  if (!pending || pending.npcId !== npcId || !NPC_INTERACTIONS[pending.type])
    return "";
  const def = NPC_INTERACTIONS[pending.type],
    reason = invitationStatus(state, npcId, pending.type, pending.day);
  return `<section class="npc-invitation" role="region" aria-label="確認人物邀約"><h3>想和${esc(NPCS[npcId].name)}${def.label}</h3><p>先問問哪天方便。已有行程不會被覆蓋；這次預算 ${money(def.cost || 0)}，相處完成時才支付。</p><div class="invitation-days">${DAYS.map(
    (day, index) => {
      const why = invitationStatus(state, npcId, pending.type, index);
      return `<button data-invitation-day="${index}" ${why ? "disabled" : ""} aria-pressed="${pending.day === index}"><b>${day}</b><small>${why ? esc(why) : "彼此都有空"}</small></button>`;
    },
  ).join(
    "",
  )}</div><p role="status">${reason ? esc(reason) : `已選${DAYS[pending.day]}，可以送出邀約。`}</p><div><button data-confirm-invitation ${reason ? "disabled" : ""}>確認邀約與日期</button><button data-cancel-invitation>先不約，繼續看看</button></div></section>`;
}
