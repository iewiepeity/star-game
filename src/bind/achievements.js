import{state}from"../core/state.js";import{render}from"../render.js";
export function bindAchievements(){document.querySelectorAll("[data-achievement-filter]").forEach(button=>button.onclick=()=>{state.achievementFilter=button.dataset.achievementFilter||"全部";render()})}
