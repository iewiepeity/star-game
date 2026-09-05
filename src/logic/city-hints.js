import { state } from "../core/state.js";
import { NPCS } from "../data/npcs.js";
export function contextHint(id, location, selectedDay = state.selectedDay) {
  const day = selectedDay || 0,
    weekend = day >= 5,
    known =
      location.encounter &&
      (state.knownPeople || []).includes(location.encounter);
  if (
    (state.publicLifeRisk || 0) >= 3 &&
    !location.industry &&
    !location.recover
  )
    return "附近已有人認出你；繼續停留可能引來更多目光，普通外出也不再完全私人。";
  if ((state.publicLifeRisk || 0) >= 2 && weekend && !location.industry)
    return "週末人潮讓被認出的風險升高。若同行的是地下戀對象，這裡並不安全。";
  const npc = known ? NPCS[location.encounter] : null;
  const npcBusyHere =
    known &&
    (state.npcSchedules?.[location.encounter] || []).some(
      (item) =>
        (item.locationId === id || item.location === id) &&
        item.week === state.week &&
        item.day === day,
    );
  if (npcBusyHere)
    return `今天附近明顯有工作團隊進出。你認得其中一台車——${npc.name}似乎也在這裡工作。`;
  if (known && (state.week + day + id.length) % 4 === 0)
    return `門口有幾個熟悉的工作人員。你想起${npc.name}之前提過最近會在這一帶出沒。`;
  if (location.industry)
    return weekend
      ? "週末櫃台人比較少，但臨時徵選與試拍反而可能集中在今天。"
      : "大廳電子看板持續更新本週製作與徵選；不是每個案子都會寄進你的信箱。";
  if (location.recover)
    return weekend
      ? "週末人潮比較多，恢復效果不會改變，但想安靜待著得挑時間。"
      : "平日比較安靜，偶爾能聽見附近工作人員聊起最近的圈內消息。";
  if (location.category === "訓練")
    return state.fatigue >= 65
      ? "你光站在門口就感覺得到今天狀態不太對；硬練不一定比休息划算。"
      : "今天課表排得很滿，走廊上能看到幾個正在為試鏡臨時加課的新人。";
  if (location.category === "靈感")
    return weekend
      ? "週末的人比平日多，真正有用的靈感可能藏在觀察別人，而不是硬逼自己產出。"
      : "這個時段人不多，城市的聲音反而比平常清楚。";
  return weekend
    ? "週末讓這裡比平常熱鬧；同一個地方，今天遇到的人與氣氛可能完全不同。"
    : "今天看起來很普通，但星望市的工作與人物並不會因你沒來就停止。";
}
