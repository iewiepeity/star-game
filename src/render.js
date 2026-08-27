// 渲染迴圈：整個遊戲只有一個進入點會寫 DOM。render() 依 state.screen 挑一個畫面整包重繪成字串塞進 #app，
// 呼叫 bind() 重新對新產生的 DOM 掛上事件，最後把目前 state 存進 localStorage——
// 沒有虛擬 DOM、沒有局部更新，任何一次 state 變動都要靠呼叫 render() 才會反映到畫面上，也才會存檔。
import{state,syncVisitedLocations}from"./core/state.js";
import{saveState}from"./core/persistence.js";
import{createView}from"./views/create.js";
import{runnerView}from"./views/runner.js";
import{summaryView}from"./views/summary.js";
import{endingView}from"./views/ending.js";
import{roomView}from"./views/room.js";
import{bind}from"./bind.js";

const app=document.querySelector("#app");

export function render(){syncVisitedLocations();app.innerHTML=state.screen==="create"?createView():state.screen==="runner"?runnerView():state.screen==="summary"?summaryView():state.screen==="ending"?endingView():roomView();bind();saveState(state)}
