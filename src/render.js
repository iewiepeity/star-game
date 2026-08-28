import{state,syncVisitedLocations}from"./core/state.js";
import{saveState}from"./core/persistence.js";
import{createView}from"./views/create.js";
import{runnerView}from"./views/runner.js";
import{summaryView}from"./views/summary.js";
import{endingView}from"./views/ending.js";
import{eventView}from"./views/event.js";
import{roomView}from"./views/room.js";
import{bind}from"./bind.js";
import{evaluateAchievements}from"./logic/achievement-engine.js";
import{esc}from"./core/utils.js";
const app=document.querySelector("#app");
const TOAST_DURATION=3200;
let toastTimer=null;
let activeToast="";

function toastMarkup(message){
 return `<div class="game-toast" role="status" aria-live="polite"><i aria-hidden="true">✓</i><span>${esc(message)}</span></div>`;
}

function syncToast(message){
 if(!message){
  if(toastTimer)clearTimeout(toastTimer);
  toastTimer=null;
  activeToast="";
  return;
 }
 if(message===activeToast&&toastTimer)return;
 if(toastTimer)clearTimeout(toastTimer);
 activeToast=message;
 toastTimer=setTimeout(()=>{
  toastTimer=null;
  if(state.notice===message){
   state.notice="";
   activeToast="";
   render();
  }
 },TOAST_DURATION);
}

export function render(){
 syncVisitedLocations();
 evaluateAchievements();
 const isCreate=state.screen==="create";
 const view=isCreate?createView():state.screen==="runner"?runnerView():state.screen==="summary"?summaryView():state.screen==="ending"?endingView():state.screen==="event"?eventView():roomView();
 const message=isCreate?"":String(state.notice||"").trim();
 app.innerHTML=view+(message?toastMarkup(message):"");
 app.querySelectorAll(".mini-toast").forEach(node=>node.remove());
 bind();
 saveState(state);
 syncToast(message);
}
