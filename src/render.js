// 渲染迴圈：整個遊戲只有一個進入點會寫 DOM。render() 依 state.screen 挑一個畫面整包重繪成字串塞進 #app，
// 再呼叫 bind() 重新對新產生的 DOM 掛上事件——沒有虛擬 DOM、沒有局部更新，任何一次 state 變動都要靠呼叫 render() 才會反映到畫面上。
import{state}from"./core/state.js";
import{createView}from"./views/create.js";
import{runnerView}from"./views/runner.js";
import{summaryView}from"./views/summary.js";
import{endingView}from"./views/ending.js";
import{roomView}from"./views/room.js";
import{bind}from"./bind.js";

const app=document.querySelector("#app");

export function render(){app.innerHTML=state.screen==="create"?createView():state.screen==="runner"?runnerView():state.screen==="summary"?summaryView():state.screen==="ending"?endingView():roomView();bind()}
