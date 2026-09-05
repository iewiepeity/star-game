import { ASPIRATIONS } from "../logic/city-progression.js";
import{state}from"../core/state.js";
import{advancePrologue,completePrologue}from"../logic/onboarding.js";
import{render}from"../render.js";

export function bindPrologueScreen(){
 document.querySelectorAll("[data-aspiration]").forEach(button=>button.onclick=()=>{if(ASPIRATIONS[button.dataset.aspiration])state.aspiration=button.dataset.aspiration;render();});
 document.querySelectorAll("[data-prologue-next]").forEach(button=>button.onclick=()=>{advancePrologue(state);render()});
 document.querySelector("[data-skip-prologue]")?.addEventListener("click",()=>{completePrologue(state);render()});
 document.querySelector("[data-skip-onboarding]")?.addEventListener("click",()=>{completePrologue(state,{skipTutorial:true});render()});
}
