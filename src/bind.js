// 事件層總表：render() 每次重繪完 DOM 之後，一定會呼叫這裡的 bind() 重新掛上事件（沒有事件委派，逐一 querySelector）。
// 依 state.screen 分派：create／runner／summary／ending 各自處理完就直接 return；房間畫面則是每個平板 App 各自一支 bind/*.js，
// 全部依序呼叫——每支只找自己 App 的 data- 屬性，當那個 App 沒有開啟時 querySelectorAll 自然找不到東西，不需要額外判斷。
// 之後新增一個 App／新增一批事件，只需要在 src/bind/ 底下加一支新檔案並在這裡多 import＋多呼叫一行，不必修改既有檔案。
import{state}from"./core/state.js";
import{bindCreateScreen}from"./bind/create.js";
import{bindRunnerScreen}from"./bind/runner.js";
import{bindSummaryScreen}from"./bind/summary.js";
import{bindEndingScreen}from"./bind/ending.js";
import{bindRoomShell}from"./bind/room.js";
import{bindPlanner}from"./bind/planner.js";
import{bindMap}from"./bind/map.js";
import{bindNpc}from"./bind/npc.js";
import{bindAgency}from"./bind/agency.js";
import{bindJobs}from"./bind/jobs.js";
import{bindWardrobe}from"./bind/wardrobe.js";
import{bindSave}from"./bind/save.js";
import{bindForum}from"./bind/forum.js";
import{bindSocial}from"./bind/social.js";

export function bind(){
 if(state.screen==="create"){bindCreateScreen();return}
 if(state.screen==="runner"){bindRunnerScreen();return}
 if(state.screen==="summary"){bindSummaryScreen();return}
 if(state.screen==="ending"){bindEndingScreen();return}
 bindRoomShell();
 bindPlanner();
 bindMap();
 bindNpc();
 bindAgency();
 bindJobs();
 bindWardrobe();
 bindSave();
 bindForum();
 bindSocial();
}
