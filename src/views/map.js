import { MAP_LOCATIONS, MAP_CATEGORIES } from "../data/map-locations.js";
import { DAYS } from "../data/calendar.js";
import { NPCS } from "../data/npcs.js";
import { state } from "../core/state.js";
import { overseasEligibility } from "../logic/overseas.js";

MAP_LOCATIONS.airport.note = "第二年後可展開海外發展；抵達後選『主動探索』挑戰徵選，選『專注體驗』參加影展／音樂節交流。";
const PURPOSES = {
  全部: { label: "全部地點", test: () => true },
  work: { label: "找試鏡／通告", test: (location) => location.industry || /試鏡|通告|Casting|工作/.test(location.effect + location.note) },
  people: { label: "認識人物", test: (location) => Boolean(location.encounter) },
  recover: { label: "恢復狀態", test: (location) => Boolean(location.recover) },
  growth: { label: "能力成長", test: (location) => Boolean(location.gain) },
};

function contextHint(id, location) {
  const day = state.selectedDay || 0, weekend = day >= 5, known = location.encounter && (state.knownPeople || []).includes(location.encounter);
  if ((state.publicLifeRisk || 0) >= 3 && !location.industry && !location.recover) return "附近已有人認出你；繼續停留可能引來更多目光，普通外出也不再完全私人。";
  if ((state.publicLifeRisk || 0) >= 2 && weekend && !location.industry) return "週末人潮讓被認出的風險升高。若同行的是地下戀對象，這裡並不安全。";
  const npc = known ? NPCS[location.encounter] : null;
  const npcBusyHere = known && Object.values(state.npcSchedules || {}).some((item) => item?.npcId === location.encounter && (item.locationId === id || item.location === id) && (item.week == null || item.week === state.week));
  if (npcBusyHere) return `今天附近明顯有工作團隊進出。你認得其中一台車——${npc.name}似乎也在這裡工作。`;
  if (known && (state.week + day + id.length) % 4 === 0) return `門口有幾個熟悉的工作人員。你想起${npc.name}之前提過最近會在這一帶出沒。`;
  if (location.industry) return weekend ? "週末櫃台人比較少，但臨時徵選與試拍反而可能集中在今天。" : "大廳電子看板持續更新本週製作與徵選；不是每個案子都會寄進你的信箱。";
  if (location.recover) return weekend ? "週末人潮比較多，恢復效果不會改變，但想安靜待著得挑時間。" : "平日比較安靜，偶爾能聽見附近工作人員聊起最近的圈內消息。";
  if (location.category === "訓練") return state.fatigue >= 65 ? "你光站在門口就感覺得到今天狀態不太對；硬練不一定比休息划算。" : "今天課表排得很滿，走廊上能看到幾個正在為試鏡臨時加課的新人。";
  if (location.category === "靈感") return weekend ? "週末的人比平日多，真正有用的靈感可能藏在觀察別人，而不是硬逼自己產出。" : "這個時段人不多，城市的聲音反而比平常清楚。";
  return weekend ? "週末讓這裡比平常熱鬧；同一個地方，今天遇到的人與氣氛可能完全不同。" : "今天看起來很普通，但星望市的工作與人物並不會因你沒來就停止。";
}

function locationCard(id, location, selected, favorites, overseas) {
  const locked = location.locked && !(id === "airport" && overseas.unlocked);
  const effect = id === "airport"
    ? (overseas.unlocked ? "海外影展、音樂節與公開徵選" : overseas.requirements.filter((item) => !item.met).map((item) => `${item.label}（目前 ${item.current}）`).join("・"))
    : location.effect;
  const hint = contextHint(id, location), favorite = favorites.has(id);
  return `<article class="map-place ${locked ? "locked" : ""} ${selected === id ? "selected" : ""}">
    <button class="map-favorite ${favorite ? "active" : ""}" data-map-favorite="${id}" aria-label="${favorite ? "取消收藏" : "收藏"}${location.name}" aria-pressed="${favorite}">${favorite ? "★" : "☆"}</button>
    <div class="map-place-main"><i aria-hidden="true">${location.icon}</i><span><small>${location.area}・${location.category}</small><b>${location.name}</b><strong>${effect}</strong><details class="map-place-details"><summary>查看介紹與今日線索</summary><em>${location.note}</em><mark class="map-context">今日線索｜${hint}</mark></details></span><button class="map-go" ${locked ? "disabled" : ""} data-map-location="${id}">${locked ? "完成條件後開放" : location.industry ? "前往工作櫃台 →" : "選擇地點 →"}</button></div>
  </article>`;
}

export function mapApp() {
  const selected = state.freeLocations[state.selectedDay], filter = state.mapFilter || "全部", purpose = state.mapPurpose || "全部", overseas = overseasEligibility(), favorites = new Set(state.favoriteLocations || []);
  const locations = Object.entries(MAP_LOCATIONS).filter(([, location]) => (filter === "全部" || location.category === filter) && (PURPOSES[purpose]?.test(location) ?? true));
  const available = Object.entries(MAP_LOCATIONS).filter(([id, location]) => !location.locked || (id === "airport" && overseas.unlocked)).length;
  const recent = (state.recentLocations || []).filter((id) => MAP_LOCATIONS[id]).slice(0, 4);
  return `<div class="map-page"><div class="map-intro"><div><span>STARWISH CITY・${available} 個可探索地點</span><h2>${DAYS[state.selectedDay]}想完成什麼？</h2><p>先選目的，再挑地點；收藏與最近去過的地方會留在最容易找到的位置。</p></div><b>基本交通費 $300</b></div>
    <section class="map-purpose"><span>依目的找地點</span>${Object.entries(PURPOSES).map(([id, item]) => `<button class="${purpose === id ? "active" : ""}" data-map-purpose="${id}" aria-pressed="${purpose === id}">${item.label}</button>`).join("")}</section>
    ${recent.length ? `<section class="map-recent"><span>最近前往</span>${recent.map((id) => `<button data-map-location="${id}">${MAP_LOCATIONS[id].icon} ${MAP_LOCATIONS[id].name}</button>`).join("")}</section>` : ""}
    <nav class="map-filters" aria-label="地點分類">${MAP_CATEGORIES.map((category) => `<button class="${filter === category ? "active" : ""}" data-map-filter="${category}" aria-pressed="${filter === category}">${category}</button>`).join("")}</nav>
    <div class="city-map">${locations.map(([id, location]) => locationCard(id, location, selected, favorites, overseas)).join("")}</div>
    <aside class="map-tip">產業地點會先進入該公司的工作櫃台；地圖只透露玩家當下能合理察覺的線索，不會用未相遇人物直接劇透。</aside>
  </div>`;
}
