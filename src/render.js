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
import{peekUndo,consumeUndo,clearUndo}from"./core/undo.js";
import{updateAvailable,applyAvailableUpdate}from"./core/pwa-update.js";
const app=document.querySelector("#app");
const TOAST_DURATION=3200;
const GUIDE_DURATION=8500;
let toastTimer=null;
let activeToast="";
let guideTimer=null;
let activeGuide="";
let renderedMarkup="";
const appScrollPositions={};
const nestedScrollPositions={};
const disclosureStates={};
const NESTED_SCROLL_SELECTORS=[".job-catalog",".contact-list",".wardrobe-closet",".creative-phase",".picker-list",".map-place-list"];

function rememberAppUi(appId,body){
 if(!appId||!body)return;
 nestedScrollPositions[appId]=Object.fromEntries(NESTED_SCROLL_SELECTORS.map(selector=>[selector,body.querySelector(selector)?.scrollTop||0]));
 disclosureStates[appId]=new Set([...body.querySelectorAll("details[open] > summary")].map(summary=>summary.textContent.trim()));
}

function restoreAppUi(appId,body){
 if(!appId||!body)return;
 for(const[selector,top]of Object.entries(nestedScrollPositions[appId]||{})){const node=body.querySelector(selector);if(node)node.scrollTop=top}
 const open=disclosureStates[appId];
 if(open)for(const summary of body.querySelectorAll("details > summary"))if(open.has(summary.textContent.trim()))summary.parentElement.open=true;
}

function activeFocusSelector(){
 const node=document.activeElement;
 const wasInDialog=Boolean(node?.closest?.('[role="dialog"], [role="alertdialog"]'));
 if(!node?.dataset)return{selector:"",wasInDialog};
 if(node.dataset.focusKey)return{selector:`[data-focus-key="${CSS.escape(node.dataset.focusKey)}"]`,wasInDialog};
 if(node.id)return{selector:`#${CSS.escape(node.id)}`,wasInDialog};
 const entry=Object.entries(node.dataset)[0];
 if(!entry)return{selector:"",wasInDialog};
 const [key,value]=entry,attribute=key.replace(/[A-Z]/g,m=>`-${m.toLowerCase()}`);
 return{selector:`[data-${attribute}="${CSS.escape(value)}"]`,wasInDialog};
}

function toastMarkup(message){
 const undo=peekUndo(message);
 return `<div class="game-toast" role="status"><i aria-hidden="true">✓</i><span>${esc(message)}</span>${undo?'<button type="button" data-undo-action>復原</button>':""}</div>`;
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
   clearUndo(message);
    document.querySelector(".game-toast")?.remove();
    document.dispatchEvent(new CustomEvent("star-game:rendered"));
  }
 },TOAST_DURATION);
}

function guideMarkup(guide){
 return `<aside class="guide-toast" role="status" aria-live="polite" data-guide-id="${guide.id}"><span class="guide-tape" aria-hidden="true"></span><i aria-hidden="true">✦</i><div><small>${esc(guide.kicker)}</small><b>${esc(guide.title)}</b><p>${esc(guide.text)}</p></div><button type="button" data-dismiss-guide aria-label="關閉教學提示">×</button></aside>`;
}

function updateMarkup(){return updateAvailable()?'<aside class="pwa-update" role="status"><div><b>新版已準備完成</b><span>目前進度不會被打斷；方便時再重新載入。</span></div><button type="button" data-apply-update>儲存並更新</button></aside>':""}

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
  if(activeGuide===id){markTutorialSeen(state,id);activeGuide="";document.querySelector(`[data-guide-id="${CSS.escape(id)}"]`)?.remove();document.dispatchEvent(new CustomEvent("star-game:rendered"))}
 },GUIDE_DURATION);
}

function renderUnsafe(){
 const {selector:focusSelector,wasInDialog}=activeFocusSelector();
 const previousWindow=app.querySelector(".app-window"),previousBody=previousWindow?.querySelector(".window-body"),previousApp=state.appOpen;
 if(previousBody&&previousApp){appScrollPositions[previousApp]=previousBody.scrollTop;rememberAppUi(previousApp,previousBody)}
 const isCreate=state.screen==="create";
 const view=isCreate?createView():state.screen==="prologue"?prologueView():state.screen==="runner"?runnerView():state.screen==="summary"?summaryView():state.screen==="ending"?endingView():state.screen==="event"?eventView():roomView();
 const message=isCreate?"":String(state.notice||"").trim();
 const guide=!isCreate&&!message?nextTutorial(state):null;
 const markup=view+(message?toastMarkup(message):guide?guideMarkup(guide):"")+updateMarkup(),domChanged=markup!==renderedMarkup;
 if(domChanged){app.innerHTML=markup;renderedMarkup=markup}
 const nextBody=app.querySelector(".window-body");
 if(nextBody&&state.appOpen){nextBody.scrollTop=appScrollPositions[state.appOpen]||0;restoreAppUi(state.appOpen,nextBody)}
 app.querySelectorAll(".mini-toast").forEach(node=>node.remove());
 if(domChanged)bind();
 syncAudio(state.screen==="game"?"room":state.screen);
 if(focusSelector&&(wasInDialog||!app.querySelector('[role="dialog"], [role="alertdialog"]')))app.querySelector(focusSelector)?.focus({preventScroll:true});
 if(domChanged)document.querySelector("[data-dismiss-guide]")?.addEventListener("click",()=>{if(guideTimer)clearTimeout(guideTimer);guideTimer=null;if(guide)markTutorialSeen(state,guide.id);activeGuide="";render()});
 document.querySelector("[data-undo-action]")?.addEventListener("click",()=>{const action=consumeUndo(message);if(!action)return;action.run();state.notice=action.doneMessage;render()},{once:true});
 document.querySelector("[data-apply-update]")?.addEventListener("click",event=>{event.currentTarget.disabled=true;event.currentTarget.textContent="更新中…";document.dispatchEvent(new CustomEvent("star-game:save-now"));applyAvailableUpdate()},{once:true});
 document.dispatchEvent(new CustomEvent("star-game:rendered"));
 syncToast(message);
 syncGuide(guide);
}
export function render(){try{renderUnsafe();return true}catch(error){showFatalError(error);return false}}
