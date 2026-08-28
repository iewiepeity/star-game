// 畫面層：星望市地圖 App——選擇自由活動地點；地點資料本身在 data/map-locations.js。
import{MAP_LOCATIONS,MAP_CATEGORIES}from"../data/map-locations.js";
import{DAYS}from"../data/calendar.js";
import{state}from"../core/state.js";
import{overseasEligibility}from"../logic/overseas.js";

MAP_LOCATIONS.airport.note="第二年後可展開海外發展；抵達後選『主動探索』挑戰徵選，選『專注體驗』參加影展／音樂節交流。";

export function mapApp(){const selected=state.freeLocations[state.selectedDay],filter=state.mapFilter||"全部",overseas=overseasEligibility(),locations=Object.entries(MAP_LOCATIONS).filter(([,l])=>filter==="全部"||l.category===filter),available=Object.entries(MAP_LOCATIONS).filter(([id,l])=>!l.locked||id==="airport"&&overseas.unlocked).length;return `<div class="map-page"><div class="map-intro"><div><span>STARWISH CITY・${available} 個可探索地點</span><h2>今天想去哪裡？</h2><p>${state.selectedDay!=null?`將為${DAYS[state.selectedDay]}安排自由活動。`:"選擇地點探索星望市。"}</p></div><b>基本交通費 $300</b></div><nav class="map-filters">${MAP_CATEGORIES.map(c=>`<button class="${filter===c?"active":""}" data-map-filter="${c}">${c}</button>`).join("")}</nav><div class="city-map">${locations.map(([id,l])=>{const locked=l.locked&&!(id==="airport"&&overseas.unlocked),effect=id==="airport"?(overseas.unlocked?"海外影展、音樂節與公開徵選":overseas.requirements.filter(x=>!x.met).map(x=>`${x.label}（目前 ${x.current}）`).join("・")):l.effect;return`<button class="map-place ${locked?"locked":""} ${selected===id?"selected":""}" ${locked?"disabled":""} data-map-location="${id}"><i>${l.icon}</i><span><small>${l.area}・${l.category}</small><b>${l.name}</b><em>${l.note}</em><strong>${effect}</strong></span>${locked?`<u>完成條件後開放</u>`:`<u>選擇地點 →</u>`}</button>`}).join("")}</div><aside class="map-tip">選「主動探索」較容易認識人物；選「專注體驗」則能獲得地點的額外能力成長。每一天的目的地會分開保存。</aside></div>`}
