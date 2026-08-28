import{ABILITIES}from"../src/data/abilities.js";
import{JOB_CATALOG,JOB_CATEGORIES,jobsByTier}from"../src/data/jobs-catalog.js";
import{NPCS,NPC_LIST}from"../src/data/npcs.js";
import{MAP_LOCATIONS}from"../src/data/map-locations.js";
import{FORUM_THREADS}from"../src/data/forum.js";
import{OFFICIAL_SOCIAL_POSTS}from"../src/data/social.js";
import{existsSync}from"node:fs";

const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const ids=new Set();

assert(JOB_CATALOG.length===50,`通告總數必須是 50，目前是 ${JOB_CATALOG.length}`);
for(const item of JOB_CATALOG){
 assert(!ids.has(item.id),`通告 id 重複：${item.id}`);
 ids.add(item.id);
 assert(JOB_CATEGORIES.includes(item.category),`未知類型：${item.id} / ${item.category}`);
 assert(item.stars>=1&&item.stars<=5,`星級超出範圍：${item.id}`);
 assert(item.requirements.length>=3,`硬性資質少於三項：${item.id}`);
 assert(item.requirements.every(([name,min])=>ABILITIES.includes(name)&&min>0&&min<=1000),`資質資料無效：${item.id}`);
 assert(item.workDays.length>=1&&item.workDays.every(day=>Number.isInteger(day)&&day>=0&&day<=6),`執行日無效：${item.id}`);
 assert(new Set(item.workDays).size===item.workDays.length,`執行日重複：${item.id}`);
 assert(item.audition.venue&&item.audition.prompt&&item.audition.tip,`試鏡內容不完整：${item.id}`);
 assert(item.audition.choices.length===2,`試鏡選擇必須恰好兩個：${item.id}`);
 assert(item.minTrainingSessions>=1,`通告缺少最低訓練門檻：${item.id}`);
}

for(let stars=1;stars<=5;stars++)for(const category of JOB_CATEGORIES){
 assert(jobsByTier(stars,category).length===2,`${stars} 星 ${category} 必須恰好 2 份`);
}

console.log("通告內容驗證通過：50 份、5 類型、5 星級，每個類型／星級組合各 2 份。");

assert(NPC_LIST.length===10,`本次主要 NPC 必須是 10 位，目前是 ${NPC_LIST.length}`);
for(const npc of NPC_LIST){
 assert(npc.name&&npc.job&&npc.bio&&npc.personality&&npc.likes&&npc.dislikes,`NPC 設定不完整：${npc.id}`);
 assert(existsSync(new URL(`../${npc.portrait.replace("./","")}`,import.meta.url)),`NPC 立繪不存在：${npc.id}`);
 assert(existsSync(new URL(`../${npc.thumb.replace("./","")}`,import.meta.url)),`NPC 縮圖不存在：${npc.id}`);
}
const openLocations=Object.entries(MAP_LOCATIONS).filter(([,location])=>!location.locked);
assert(openLocations.length>=15,`自由探索地點至少 15 個，目前是 ${openLocations.length}`);
for(const[id,location]of openLocations){
 assert(location.name&&location.area&&location.category&&location.note&&location.effect,`地點資料不完整：${id}`);
 assert(!location.encounter||NPCS[location.encounter],`地點綁定未知 NPC：${id}`);
}
assert(FORUM_THREADS.length>=8&&FORUM_THREADS.every(thread=>thread.replies.length>=4),"論壇討論或模擬留言不足");
assert(OFFICIAL_SOCIAL_POSTS.length>=3,"社群官方動態不足");
console.log(`世界內容驗證通過：10 位主要 NPC、${openLocations.length} 個自由探索地點、論壇與社群資料完整。`);
