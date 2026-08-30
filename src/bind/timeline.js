import{state}from"../core/state.js";
import{render,renderUi}from"../render.js";
import{bindDeferredSearch}from"../core/deferred-search.js";
import{openApp}from"../core/app-navigation.js";
export function bindTimeline(){document.querySelectorAll("[data-timeline-filter]").forEach(x=>x.onclick=()=>{state.timelineFilter=x.dataset.timelineFilter;renderUi()});bindDeferredSearch("[data-timeline-query]",value=>{state.timelineQuery=value},()=>render({persist:false}));document.querySelector("[data-timeline-search]")?.addEventListener("click",()=>{state.timelineQuery=document.querySelector("[data-timeline-query]")?.value||"";renderUi()});document.querySelector("[data-timeline-read-all]")?.addEventListener("click",()=>{for(const message of state.npcMessages||[])message.read=true;render()});document.querySelectorAll("[data-timeline-open]").forEach(x=>x.onclick=()=>{if(x.dataset.npcId){state.selectedNpc=x.dataset.npcId;state.peopleSection="profiles"}openApp(state,x.dataset.timelineOpen);render()})}
