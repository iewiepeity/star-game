import { state } from "../core/state.js";
import { MAP_LOCATIONS } from "../data/map-locations.js";
import { CITY_DISTRICTS } from "../data/city-map.js";
import { ACTIONS } from "../data/actions.js";
import { DAYS } from "../data/calendar.js";
import { coursesAt, hasVisited } from "../logic/city-progression.js";
import { overseasEligibility } from "../logic/overseas.js";
import { esc, money } from "../core/utils.js";
export function cityMap({ runner = false } = {}) {
  const district = CITY_DISTRICTS[state.cityDistrict],
    selected = MAP_LOCATIONS[state.citySelection]
      ? state.citySelection
      : runner
        ? state.freeLocations[state.runnerDay]
        : null;
  const location = MAP_LOCATIONS[selected],
    visited = location && hasVisited(state, selected);
  const locked =
    location?.locked &&
    !(selected === "airport" && overseasEligibility().unlocked);
  const pins = district
    ? district.places.map((id, index) => ({
        id,
        label: MAP_LOCATIONS[id].name,
        x: 20 + (index % 3) * 30,
        y: 25 + Math.floor(index / 3) * 42,
        place: true,
      }))
    : Object.entries(CITY_DISTRICTS).map(([id, d]) => ({
        id,
        label: d.name,
        x: d.x,
        y: d.y,
      }));
  return `<section class="city-explorer"><header><div><span>STARWISH CITY</span><h2>${district?.name || "星望市・城市導覽"}</h2></div>${district ? '<button data-city-district="all">← 全市地圖</button>' : ""}</header><p>點地圖上的${district ? "地點" : "街區"}查看目的地。查看地圖不花時間，${runner ? "確認探索方式後才結算今天" : "完成實際行程才算到訪"}。</p><div class="city-canvas" role="group" aria-label="星望市互動地圖"><svg viewBox="0 0 900 560" preserveAspectRatio="none" aria-hidden="true"><rect width="900" height="560" fill="#eee6d6"/><path d="M680 -20 Q570 160 720 300 T850 600 L1000 600 1000 -20Z" fill="#b8d1cb"/><path d="M0 165H700M0 370H780M305 0V560M595 0V560" stroke="#fff9ef" stroke-width="32" fill="none"/><path d="M0 165H700M0 370H780M305 0V560M595 0V560" stroke="#d2baa4" stroke-width="2" stroke-dasharray="8 12" fill="none"/><g fill="#d8c0ae" stroke="#c4ab99" stroke-width="2"><rect x="35" y="35" width="94" height="63" rx="12"/><rect x="360" y="36" width="87" height="59" rx="10"/><rect x="665" y="64" width="119" height="62" rx="12"/><rect x="350" y="237" width="138" height="60" rx="12"/><rect x="43" y="460" width="116" height="65" rx="12"/><rect x="470" y="434" width="76" height="90" rx="12"/></g><g fill="#b5c6a5"><ellipse cx="135" cy="293" rx="86" ry="61"/><ellipse cx="697" cy="462" rx="68" ry="40"/></g><path d="M610 365 772 335" stroke="#f7eee1" stroke-width="28"/><text x="700" y="530" fill="#537c78" font-size="20" letter-spacing="6">星望河</text></svg>${pins.map((pin) => `<button class="city-pin ${pin.place && selected === pin.id ? "selected" : ""}" style="--pin-x:${pin.x}%;--pin-y:${pin.y}%" ${pin.place ? `data-city-place="${pin.id}" aria-pressed="${selected === pin.id}"` : `data-city-district="${pin.id}"`}><i aria-hidden="true">${pin.place ? (hasVisited(state, pin.id) ? "✓" : "⌖") : "◇"}</i><span>${esc(pin.label)}</span></button>`).join("")}</div>${
    location
      ? `<section class="city-place-detail" aria-live="polite"><span>${visited ? "已到訪" : "尚未到訪"}・${esc(location.area)}</span><h3>${esc(location.name)}</h3><p>${esc(location.note)}</p><p>${esc(location.effect)}</p>${
          coursesAt(selected).length
            ? `<p class="city-unlock">${visited ? "可報名課程" : "首次到訪開放"}：${coursesAt(
                selected,
              )
                .map((id) => ACTIONS[id].label)
                .join("、")}</p>`
            : ""
        }<div><b>交通 ${money(300)}${location.extraCost ? `＋現場支出 ${money(location.extraCost)}` : ""}</b>${runner ? "" : `<label>安排日期<select data-city-day>${DAYS.map((day, i) => `<option value="${i}" ${i === state.selectedDay ? "selected" : ""}>${day}・${ACTIONS[state.schedule[i]]?.short || "已安排"}</option>`).join("")}</select></label>`}<button ${locked ? "disabled" : ""} ${runner ? "data-city-travel" : `data-map-location="${selected}"`}>${locked ? "尚未開放" : runner ? "改為這個目的地" : "安排這次自由活動"}</button></div></section>`
      : '<p class="city-map-hint">先選街區，再選一個想去的地方。也可使用下方完整地點清單。</p>'
  }</section>`;
}
