import{state}from"./core/state.js";
import{showFatalError}from"./core/error-recovery.js";
import{createView}from"./views/create.js";
import{prologueView}from"./views/prologue.js";
import{runnerView}from"./views/runner.js";
import{summaryView}from"./views/summary.js";
import{endingView}from"./views/ending.js";
import{eventView}from"./views/event.js";
import{roomView}from"./views/room.js";
import{bind}from"./bind.js";
import{markTutorialSeen,nextTutorial}from"./logic/tutorial.js";
import{esc}from"./core/utils.js";
import{syncAudio}from"./core/audio.js";
const app=document.querySelector("#app");
const TOAST_DURATION=3200;
const GUIDE_DURATION=8500;
let toastTimer=null;
let activeToast="";
let guideTimer=null;
let activeGuide="";
let renderedMarkup="";
const appScrollPositions={};

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

function guideMarkup(guide){
 return `<aside class="guide-toast" role="status" aria-live="polite" data-guide-id="${guide.id}"><span class="guide-tape" aria-hidden="true"></span><i aria-hidden="true">✦</i><div><small>${esc(guide.kicker)}</small><b>${esc(guide.title)}</b><p>${esc(guide.text)}</p></div><button type="button" data-dismiss-guide aria-label="關閉教學提示">×</button></aside>`;
}

function syncGuide(guide){
 const id=guide?.id||"";
 if(!id){
  if(guideTimer)clearTimeout(guideTimer);
  guideTimer=null;
  activeGuide="";
  return;
 }
 if(id===activeGuide&&guideTimer)return;
 if(guideTimer)clearTimeout(guideTimer);
 activeGuide=id;
 guideTimer=setTimeout(()=>{
  guideTimer=null;
  if(activeGuide===id){markTutorialSeen(state,id);activeGuide="";render()}
 },GUIDE_DURATION);
}

function renderUnsafe(){
 const activeKey=document.activeElement?.dataset?Object.entries(document.activeElement.dataset)[0]:null;
 const previousWindow=app.querySelector(".app-window"),previousBody=previousWindow?.querySelector(".window-body"),previousApp=state.appOpen;
 if(previousBody&&previousApp)appScrollPositions[previousApp]=previousBody.scrollTop;
 const isCreate=state.screen==="create";
 const view=isCreate?createView():state.screen==="prologue"?prologueView():state.screen==="runner"?runnerView():state.screen==="summary"?summaryView():state.screen==="ending"?endingView():state.screen==="event"?eventView():roomView();
 const message=isCreate?"":String(state.notice||"").trim();
 const guide=!isCreate&&!message?nextTutorial(state):null;
 const markup=view+(message?toastMarkup(message):guide?guideMarkup(guide):""),domChanged=markup!==renderedMarkup;
 if(domChanged){app.innerHTML=markup;renderedMarkup=markup}
 const nextBody=app.querySelector(".window-body");
 if(nextBody&&state.appOpen)nextBody.scrollTop=appScrollPositions[state.appOpen]||0;
 app.querySelectorAll(".mini-toast").forEach(node=>node.remove());
 if(domChanged)bind();
 syncAudio(state.screen==="game"?"room":state.screen);
 if(activeKey){const [key,value]=activeKey,attribute=key.replace(/[A-Z]/g,m=>`-${m.toLowerCase()}`);app.querySelector(`[data-${attribute}="${CSS.escape(value)}"]`)?.focus({preventScroll:true})}
 if(domChanged)document.querySelector("[data-dismiss-guide]")?.addEventListener("click",()=>{if(guideTimer)clearTimeout(guideTimer);guideTimer=null;if(guide)markTutorialSeen(state,guide.id);activeGuide="";render()});
 document.dispatchEvent(new CustomEvent("star-game:rendered"));
 syncToast(message);
 syncGuide(guide);
}
export function render(){try{renderUnsafe();return true}catch(error){showFatalError(error);return false}}
