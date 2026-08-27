// 事件層：星望市地圖 App——選擇自由活動地點。
import{MAP_LOCATIONS}from"../data/map-locations.js";
import{DAYS}from"../data/calendar.js";
import{state}from"../core/state.js";
import{cancelAgencyInterview}from"../logic/agency.js";
import{render}from"../render.js";

export function bindMap(){
 document.querySelectorAll("[data-map-location]").forEach(x=>x.onclick=()=>{if(state.agencyInterview&&state.agencyInterview.dayIndex===state.selectedDay)cancelAgencyInterview();state.mapLocation=x.dataset.mapLocation;state.schedule[state.selectedDay]="free";state.notice=`${DAYS[state.selectedDay]}將前往「${MAP_LOCATIONS[state.mapLocation].name}」`;state.appOpen="planner";render()});
}
