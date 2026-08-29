// 事件層：房間畫面的共用外殼——開關 App 視窗、通告信封捷徑、空手通訊錄/人物檔案的「去安排自由活動」、退圈入口。
// 不屬於任何單一 App 的內容；各 App 自己的事件在 bind/planner.js、bind/map.js、bind/npc.js、bind/agency.js、bind/jobs.js。
import{AGENCY_LIST}from"../data/agencies.js";
import{state}from"../core/state.js";
import{render}from"../render.js";
import{evaluateEnding}from"../logic/career.js";

function enhancePeople(){const list=document.querySelector(".contact-list");if(!list||list.previousElementSibling?.classList.contains("list-tools"))return;const tools=document.createElement("div");tools.className="list-tools";tools.innerHTML='<input type="search" placeholder="搜尋姓名、職業或關係" aria-label="搜尋聯絡人">';list.before(tools);tools.querySelector("input").oninput=event=>{const query=event.target.value.trim().toLowerCase();list.querySelectorAll(".contact-card").forEach(card=>card.hidden=!card.textContent.toLowerCase().includes(query))}}

export function bindRoomShell(){
 enhancePeople();
 document.querySelectorAll("[data-open-app]").forEach(x=>x.onclick=()=>{const target=x.dataset.openApp;if(target==="map"){const openDay=state.schedule.findIndex(id=>id==="rest");if(openDay>=0)state.selectedDay=openDay}if(target==="agency"&&!state.selectedAgencyId)state.selectedAgencyId=AGENCY_LIST[0].id;if(target==="achievements")state.achievementNotifications=[];if(target==="people")(state.npcMessages||[]).forEach(message=>message.read=true);state.appOpen=target;render()});
 document.querySelectorAll("[data-close-app]").forEach(x=>x.onclick=()=>{state.appOpen=null;render()});
 document.querySelector("[data-open-job]")?.addEventListener("click",()=>{state.appOpen="jobs";render()});
 document.querySelector("[data-go-free]")?.addEventListener("click",()=>{state.selectedDay=state.schedule.findIndex(id=>id==="rest");if(state.selectedDay<0)state.selectedDay=6;state.appOpen="map";render()});
 document.querySelector("[data-retire]")?.addEventListener("click",()=>{state.retireConfirm=true;render()});
 document.querySelectorAll("[data-retire-cancel]").forEach(button=>button.onclick=()=>{state.retireConfirm=false;render()});
 document.querySelector("[data-retire-confirm]")?.addEventListener("click",()=>{state.retireConfirm=false;state.endingType="retire";state.endingResult=evaluateEnding("retire");state.screen="ending";state.appOpen=null;render()});
}
