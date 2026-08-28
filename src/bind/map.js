import{MAP_LOCATIONS}from"../data/map-locations.js";
import{DAYS}from"../data/calendar.js";
import{state}from"../core/state.js";
import{cancelAgencyInterview}from"../logic/agency.js";
import{cancelActivity}from"../logic/scheduled-activities.js";
import{render}from"../render.js";
export function bindMap(){document.querySelectorAll("[data-map-filter]").forEach(x=>x.onclick=()=>{state.mapFilter=x.dataset.mapFilter;render()});document.querySelectorAll("[data-map-location]").forEach(x=>x.onclick=()=>{const day=state.selectedDay,locationId=x.dataset.mapLocation;if(state.agencyInterview&&state.agencyInterview.dayIndex===day)cancelAgencyInterview();if(state.schedule[day]==="personal_task")cancelActivity(day);state.schedule[day]="free";state.freeLocations[day]=locationId;state.scheduledActivityIds[day]=null;state.notice=`${DAYS[day]}將前往「${MAP_LOCATIONS[locationId].name}」${day===6?"；游標已停在本週最後一天":""}`;state.selectedDay=Math.min(day+1,6);state.appOpen="planner";render()})}
