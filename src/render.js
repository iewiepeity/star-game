import{state,syncVisitedLocations}from"./core/state.js";
import{saveState}from"./core/persistence.js";
import{createView}from"./views/create.js";
import{runnerView}from"./views/runner.js";
import{summaryView}from"./views/summary.js";
import{endingView}from"./views/ending.js";
import{eventView}from"./views/event.js";
import{roomView}from"./views/room.js";
import{bind}from"./bind.js";
const app=document.querySelector("#app");
export function render(){syncVisitedLocations();app.innerHTML=state.screen==="create"?createView():state.screen==="runner"?runnerView():state.screen==="summary"?summaryView():state.screen==="ending"?endingView():state.screen==="event"?eventView():roomView();bind();saveState(state)}
