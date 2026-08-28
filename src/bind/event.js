import{state}from"../core/state.js";
import{resolveEvent,dismissActiveEvent}from"../logic/event-engine.js";
import{syncSequelOfferFlags}from"../logic/sequel-engine.js";
import{syncRumorResponseFlags}from"../logic/rumor-engine.js";
import{render}from"../render.js";
export function bindEventScreen(){const finish=choice=>{if(state.activeEvent?.event)state.eventOutcome=resolveEvent(state.activeEvent.event,choice);syncSequelOfferFlags();syncRumorResponseFlags();dismissActiveEvent();render()};document.querySelectorAll("[data-event-choice]").forEach(b=>b.onclick=()=>finish(b.dataset.eventChoice));document.querySelector("#event-resolve")?.addEventListener("click",()=>finish(null));document.querySelector("#event-continue")?.addEventListener("click",()=>{state.eventOutcome=null;state.screen="game";render()});document.querySelector("#event-skip")?.addEventListener("click",()=>{if(state.activeEvent)state.eventQueue.unshift(state.activeEvent);state.activeEvent=null;state.eventOutcome=null;state.screen="game";render()})}
