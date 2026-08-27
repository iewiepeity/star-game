// 事件層：星望市地圖 App——選擇自由活動地點。這裡也會把游標推進下一天，
// 跟 bind/planner.js 的 data-pick 一致：從行程規劃點「自由活動」轉來這裡選完地點後，
// 游標一樣要往後移一天，行程規劃頁的「依序套用」體驗才不會在繞去地圖時中斷。
import{MAP_LOCATIONS}from"../data/map-locations.js";
import{DAYS}from"../data/calendar.js";
import{state}from"../core/state.js";
import{cancelAgencyInterview}from"../logic/agency.js";
import{render}from"../render.js";

export function bindMap(){
 document.querySelectorAll("[data-map-location]").forEach(x=>x.onclick=()=>{const day=state.selectedDay,locationId=x.dataset.mapLocation;if(state.agencyInterview&&state.agencyInterview.dayIndex===day)cancelAgencyInterview();state.schedule[day]="free";state.freeLocations[day]=locationId;state.notice=`${DAYS[day]}將前往「${MAP_LOCATIONS[locationId].name}」${day===6?"；游標已停在本週最後一天":""}`;state.selectedDay=Math.min(day+1,6);state.appOpen="planner";render()});
}
