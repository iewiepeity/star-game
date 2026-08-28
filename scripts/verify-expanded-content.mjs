import{access}from"node:fs/promises";
import{fileURLToPath}from"node:url";
import{LOCATION_EVENTS,locationEventCount}from"../src/data/location-events.js";
import{SCHEDULE_EVENTS,scheduleEventCount}from"../src/data/schedule-events.js";
import{NPC_LIST}from"../src/data/npcs.js";
import{MAP_LOCATIONS}from"../src/data/map-locations.js";
import{ACTIONS}from"../src/data/actions.js";

const failures=[];
for(const [id,events]of Object.entries(LOCATION_EVENTS))if(events.length<10)failures.push(`${id} 只有 ${events.length} 則場景事件`);
for(const [id,events]of Object.entries(SCHEDULE_EVENTS))if(events.length<5)failures.push(`${id} 只有 ${events.length} 則日程事件`);
for(const id of Object.keys(MAP_LOCATIONS))if(!LOCATION_EVENTS[id])failures.push(`${id} 尚未建立場景事件池`);
for(const id of Object.keys(ACTIONS))if(!SCHEDULE_EVENTS[id])failures.push(`${id} 尚未建立日程事件池`);
for(const npc of NPC_LIST){
 for(const field of["background","career","publicImage","privateSelf","motivation","fear","values","strengths","weaknesses","habit","secret","arc","playerHook"])if(!npc.profile?.[field])failures.push(`${npc.name} 缺少 ${field}`);
 for(const art of[npc.head,npc.bust,npc.portrait]){
  try{await access(fileURLToPath(new URL(`../${art.replace(/^\.\//,"")}`,import.meta.url)))}catch{failures.push(`${npc.name} 缺少圖片 ${art}`)}
 }
}
if(failures.length)throw new Error(failures.join("\n"));
console.log(JSON.stringify({npcs:NPC_LIST.length,locations:Object.keys(LOCATION_EVENTS).length,locationEvents:locationEventCount(),schedules:Object.keys(SCHEDULE_EVENTS).length,scheduleEvents:scheduleEventCount(),portraitAssets:NPC_LIST.length*3},null,2));
