// 畫面層：星望市地圖 App——選擇自由活動地點；地點資料本身在 data/map-locations.js。
import{MAP_LOCATIONS}from"../data/map-locations.js";
import{DAYS}from"../data/calendar.js";
import{state}from"../core/state.js";

export function mapApp(){return `<div class="map-page"><div class="map-intro"><div><span>STARWISH CITY</span><h2>今天想去哪裡？</h2><p>${state.selectedDay!=null?`將為${DAYS[state.selectedDay]}安排自由活動。`:"選擇地點探索星望市。"}</p></div><b>交通費 $300</b></div><div class="city-map">${Object.entries(MAP_LOCATIONS).map(([id,l])=>`<button class="map-place ${l.locked?"locked":""} ${state.mapLocation===id?"selected":""}" ${l.locked?"disabled":""} data-map-location="${id}"><i>${l.icon}</i><span><small>${l.area}</small><b>${l.name}</b><em>${l.note}</em><strong>${l.effect}</strong></span>${l.locked?`<u>尚未解鎖</u>`:`<u>選擇地點 →</u>`}</button>`).join("")}</div><aside class="map-tip">自由活動必須先選擇地點；地點會影響可能遇見的人物、能力成長與事件。</aside></div>`}
