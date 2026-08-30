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
import{audioModeForState,playSfx,syncAudio}from"./core/audio.js";
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
function uiKey(node,index,prefix){return node.dataset?.[prefix]||`${node.tagName.toLowerCase()}:${index}`}

function rememberAppUi(appId,body){
 if(!appId||!body)return;
 const marked=[...body.querySelectorAll("[data-scroll-key]")];
 nestedScrollPositions[appId]=marked.length?Object.fromEntries(marked.map((node,index)=>[uiKey(node,index,"scrollKey"),node.scrollTop||0])):Object.fromEntries(NESTED_SCROLL_SELECTORS.map(selector=>[selector,body.querySelector(selector)?.scrollTop||0]));
 disclosureStates[appId]=new Set([...body.querySelectorAll("details")].map((details,index)=>details.open?uiKey(details,index,"disclosureKey"):null).filter(Boolean));
}

function restoreAppUi(appId,body){
 if(!appId||!body)return;
 const marked=[...body.querySelectorAll("[data-scroll-key]")];
 for(const[key,top]of Object.entries(nestedScrollPositions[appId]||{})){const node=marked.length?marked.find((item,index)=>uiKey(item,index,"scrollKey")===key):body.querySelector(key);if(node)node.scrollTop=top}
 const open=disclosureStates[appId];
 if(open)for(const[index,details]of [...body.querySelectorAll("details")].entries())if(open.has(uiKey(details,index,"disclosureKey")))details.open=true;
}

function activeFocusSelector(){
 const node=document.activeElement;
 const wasInDialog=Boolean(node?.closest?.('[role="dialog"], [role="alertdialog"]'));
 const selection=typeof node?.selectionStart==="number"?{start:node.selectionStart,end:node.selectionEnd,direction:node.selectionDirection}:null;
 if(!node?.dataset)return{selector:"",wasInDialog,selection};
 if(node.dataset.focusKey)return{selector:`[data-focus-key="${CSS.escape(node.dataset.focusKey)}"]`,wasInDialog,selection};
 if(node.id)return{selector:`#${CSS.escape(node.id)}`,wasInDialog,selection};
 const entry=Object.entries(node.dataset)[0];
 if(!entry)return{selector:"",wasInDialog,selection};
 const [key,value]=entry,attribute=key.replace(/[A-Z]/g,m=>`-${m.toLowerCase()}`);
 return{selector:`[data-${attribute}="${CSS.escape(value)}"]`,wasInDialog,selection};
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
  if(activeGuide===id){markTutorialSeen(state,id);activeGuide="";document.querySelector(`[data-guide-id="${CSS.escape(id)}"]`)?.remove();document.dispatchEvent(new CustomEvent("star-game:rendered"));document.dispatchEvent(new CustomEvent("star-game:state-changed"))}
 },GUIDE_DURATION);
}

function renderUnsafe({persist=true,reason="unspecified"}={}){
 const {selector:focusSelector,wasInDialog,selection}=activeFocusSelector();
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
 syncAudio(audioModeForState(state));
 if(focusSelector&&(wasInDialog||!app.querySelector('[role="dialog"], [role="alertdialog"]'))){const next=app.querySelector(focusSelector);next?.focus({preventScroll:true});if(selection&&typeof next?.setSelectionRange==="function")next.setSelectionRange(selection.start,selection.end,selection.direction)}
 if(domChanged)document.querySelector("[data-dismiss-guide]")?.addEventListener("click",()=>{if(guideTimer)clearTimeout(guideTimer);guideTimer=null;if(guide)markTutorialSeen(state,guide.id);activeGuide="";render()});
 document.querySelector("[data-undo-action]")?.addEventListener("click",()=>{const action=consumeUndo(message);if(!action)return;action.run();state.notice=action.doneMessage;render()},{once:true});
 document.querySelector("[data-apply-update]")?.addEventListener("click",event=>{event.currentTarget.disabled=true;event.currentTarget.textContent="更新中…";document.dispatchEvent(new CustomEvent("star-game:save-now"));applyAvailableUpdate()},{once:true});
 document.dispatchEvent(new CustomEvent("star-game:rendered"));
 if(persist)document.dispatchEvent(new CustomEvent("star-game:state-changed",{detail:{reason}}));
 if(message&&message!==activeToast)playSfx(/失敗|違約|不足|無法|拒絕|警告|逾期/.test(message)?"warning":/獲得|解鎖|成功|得獎|入選|完成/.test(message)?"success":"message");
 syncToast(message);
 syncGuide(guide);
}
export function render(options){try{renderUnsafe(options);return true}catch(error){showFatalError(error);return false}}
export function renderUi(){return render({persist:false})}
export function commitState(reason,mutation){if(typeof mutation==="function")mutation(state);return render({persist:true,reason})}
