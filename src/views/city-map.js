import { state } from "../core/state.js";
import { MAP_LOCATIONS } from "../data/map-locations.js";
import { CITY_ART, CITY_LANDMARKS } from "../data/city-map.js";
import { ACTIONS } from "../data/actions.js";
import { DAYS } from "../data/calendar.js";
import { coursesAt, hasVisited } from "../logic/city-progression.js";
import { workAt, companyShifts } from "../logic/work-progression.js";
import { contextHint } from "../logic/city-hints.js";
import { overseasEligibility } from "../logic/overseas.js";
import { esc, money } from "../core/utils.js";
export function cityPlaceLocked(id) {
  return Boolean(
    MAP_LOCATIONS[id]?.locked &&
    !(id === "airport" && overseasEligibility().unlocked),
  );
}
export function cityPreview(id, { runner = false, pinned = false } = {}) {
  const location = MAP_LOCATIONS[id];
  if (!location) return "";
  const visited = hasVisited(state, id),
    locked = cityPlaceLocked(id),
    courses = coursesAt(id),
    work = workAt(id),
    fee = 300 + (location.extraCost || 0);
  const effect = id === "airport" ? "海外徵選、影展與音樂節" : location.effect;
  return `<div class="city-preview-head"><span>${visited ? "已到訪" : "尚未到訪"}</span><button data-city-dismiss aria-label="關閉地點介紹">×</button></div><div class="city-preview-copy"><small>${location.area}・${location.category}</small><h3>${esc(location.name)}</h3><p>${esc(id === "airport" ? "第二年後，從這裡出發探索海外舞台。" : location.note)}</p><b class="city-effect">${esc(effect)}</b><p class="city-clue"><i aria-hidden="true">✧</i>${esc(contextHint(id, location, runner ? state.runnerDay : state.selectedDay))}</p>${courses.length ? `<p class="city-unlock">${visited ? "課程已開放" : "初訪開放"}：${courses.map((key) => ACTIONS[key].label).join("、")}</p>` : ""}${work.map(([, job]) => `<p class="city-unlock">${visited ? "已登記打工" : "首次到訪可登記"}：${job.label.split("・")[1]}・${companyShifts(state, job.companyId)} 次經驗</p>`).join("")}${
    locked
      ? `<small class="city-locked-note">${overseasEligibility()
          .requirements.filter((r) => !r.met)
          .map((r) => esc(r.label))
          .join("・")}</small>`
      : ""
  }${pinned ? `<div class="city-travel-form">${runner ? "" : `<label>選一天<select data-city-day>${DAYS.map((day, i) => `<option value="${i}" ${i === state.selectedDay ? "selected" : ""}>${day}・${ACTIONS[state.schedule[i]]?.short || "已有安排"}</option>`).join("")}</select></label>`}<button data-city-confirm="${id}" ${locked ? "disabled" : ""}>${locked ? "尚未開放" : runner ? "前往這裡" : `安排前往・${money(fee)}`}</button>${id === "shop" && !runner ? "<button data-city-wardrobe>查看服裝目錄</button>" : ""}</div>` : '<small class="city-click-hint">點建築，選擇前往日期</small>'}</div>`;
}
export function cityMap({ runner = false } = {}) {
  return `<section class="city-explorer city-atlas" data-city-atlas data-runner="${runner}"><header class="city-toolbar"><div><span>STARWISH CITY</span><h2>星望市</h2></div><div class="city-tools"><label class="city-search"><span class="sr-only">尋找地點</span><input data-city-search type="search" placeholder="⌕ 找地點" autocomplete="off" aria-label="尋找地點"></label><button data-city-zoom="out" aria-label="縮小地圖">−</button><button data-city-zoom="in" aria-label="放大地圖">＋</button><button data-city-overview aria-label="查看完整城市">全覽</button></div></header><div class="city-search-results" data-city-search-results hidden></div><div class="city-map-frame"><div class="city-viewport" data-city-viewport aria-label="可拖動的星望市地圖"><div class="city-world" data-city-world><img class="city-painting" src="${CITY_ART}" width="1536" height="1024" alt="水彩星望市全景，二十六個地點分布在街道與海岸之間" draggable="false" fetchpriority="high">${Object.entries(
    CITY_LANDMARKS,
  )
    .map(
      ([id, p]) =>
        `<button class="city-building ${hasVisited(state, id) ? "visited" : ""} ${cityPlaceLocked(id) ? "locked" : ""}" data-city-place="${id}" style="--place-x:${p.x}%;--place-y:${p.y}%;--place-w:${p.w}%;--place-h:${p.h}%" aria-label="${MAP_LOCATIONS[id].name}${cityPlaceLocked(id) ? "（尚未開放）" : ""}" aria-expanded="false"><span class="city-building-glow"></span><i aria-hidden="true">${cityPlaceLocked(id) ? "◇" : hasVisited(state, id) ? "•" : "✧"}</i><span class="city-building-label">${MAP_LOCATIONS[id].name}</span></button>`,
    )
    .join(
      "",
    )}</div></div><div class="city-loading" data-city-loading role="status">正在展開星望市…</div><aside class="city-preview" data-city-preview aria-label="地點介紹與今日線索" hidden></aside></div><footer class="city-footer"><span class="pointer-map-hint">移到建築看線索・拖曳地圖移動</span><span class="touch-map-hint">點建築看介紹・滑動地圖探索</span><span>26 個地點 <i>✧ 初次探索　• 已到訪</i></span></footer></section>`;
}
