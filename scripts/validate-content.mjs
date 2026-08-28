import{ABILITIES}from"../src/data/abilities.js";
import{JOB_CATALOG,JOB_CATEGORIES,jobsByTier}from"../src/data/jobs-catalog.js";
import{NPCS,NPC_LIST}from"../src/data/npcs.js";
import{MAP_LOCATIONS}from"../src/data/map-locations.js";
import{LOCATION_EVENTS}from"../src/data/location-events.js";
import{SCHEDULE_EVENTS}from"../src/data/schedule-events.js";
import{ACTIONS}from"../src/data/actions.js";
import{FORUM_THREADS}from"../src/data/forum.js";
import{OFFICIAL_SOCIAL_POSTS}from"../src/data/social.js";
import{existsSync}from"node:fs";
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const ids=new Set(),hidden=new Set(["幽默","共情","洞察","膽識","品德","自律","野心","抗壓"]),rep=new Set(["業界評價","商業價值","話題度","爭議度","時尚影響力","國民度","路人緣","可信度"]);
assert(JOB_CATALOG.length===50,`通告總數必須是 50，目前是 ${JOB_CATALOG.length}`);
for(const item of JOB_CATALOG){assert(!ids.has(item.id),`通告 id 重複：${item.id}`);ids.add(item.id);assert(JOB_CATEGORIES.includes(item.category),`未知類型：${item.id} / ${item.category}`);assert(item.stars>=1&&item.stars<=5,`星級超出範圍：${item.id}`);assert(item.requirements.length>=3,`硬性資質少於三項：${item.id}`);assert(item.requirements.every(([name,min])=>ABILITIES.includes(name)&&min>0&&min<=1000),`資質資料無效：${item.id}`);assert(item.softTraits.every(name=>hidden.has(name)),`未知隱藏特質：${item.id}`);assert(item.reputationSignals.every(name=>rep.has(name)),`未知聲望訊號：${item.id}`);assert(item.workDays.length>=1&&item.workDays.every(day=>Number.isInteger(day)&&day>=0&&day<=6),`執行日無效：${item.id}`);assert(new Set(item.workDays).size===item.workDays.length,`執行日重複：${item.id}`);assert(item.audition.venue&&item.audition.prompt&&item.audition.tip,`試鏡內容不完整：${item.id}`);assert(item.audition.choices.length===2,`試鏡選擇必須恰好兩個：${item.id}`);assert(item.minTrainingSessions>=1,`通告缺少最低訓練門檻：${item.id}`)}
for(let stars=1;stars<=5;stars++)for(const category of JOB_CATEGORIES)assert(jobsByTier(stars,category).length===2,`${stars} 星 ${category} 必須恰好 2 份`);
assert(NPC_LIST.length===10,`本次主要 NPC 必須是 10 位，目前是 ${NPC_LIST.length}`);
for(const npc of NPC_LIST){assert(npc.name&&npc.job&&npc.bio&&npc.personality&&npc.likes&&npc.dislikes,`NPC 設定不完整：${npc.id}`);for(const path of[npc.portrait,npc.head,npc.bust])assert(existsSync(new URL(`../${path.replace("./","")}`,import.meta.url)),`NPC 圖像不存在：${npc.id} / ${path}`)}
const openLocations=Object.entries(MAP_LOCATIONS).filter(([,location])=>!location.locked);assert(openLocations.length>=15,`自由探索地點至少 15 個，目前是 ${openLocations.length}`);
for(const[id,location]of Object.entries(MAP_LOCATIONS)){assert(location.name&&location.area&&location.category&&location.note&&location.effect,`地點資料不完整：${id}`);assert(!location.encounter||NPCS[location.encounter],`地點綁定未知 NPC：${id}`);assert(Array.isArray(LOCATION_EVENTS[id])&&LOCATION_EVENTS[id].length>=10,`地點事件不足：${id}`)}
for(const[actionId,pool]of Object.entries(SCHEDULE_EVENTS)){assert(ACTIONS[actionId],`行程事件綁定未知 action：${actionId}`);assert(Array.isArray(pool)&&pool.length>=5,`行程事件不足：${actionId}`)}
const validateEffect=(effect,where)=>{if(!effect)return;const hiddenName=effect.hidden===true?effect.stat:(typeof effect.hidden==="string"?effect.hidden:null);if(hiddenName)assert(hidden.has(hiddenName),`${where} 使用未知隱藏特質 ${hiddenName}`);else if(effect.stat)assert(ABILITIES.includes(effect.stat),`${where} 使用未知能力 ${effect.stat}`);if(effect.rep)assert(rep.has(effect.rep),`${where} 使用未知評價 ${effect.rep}`);if(effect.npc)assert(NPCS[effect.npc],`${where} 使用未知 NPC ${effect.npc}`)};
for(const[id,pool]of Object.entries(LOCATION_EVENTS))pool.forEach((e,i)=>validateEffect(e.effect,`location:${id}[${i}]`));for(const[id,pool]of Object.entries(SCHEDULE_EVENTS))pool.forEach((e,i)=>validateEffect(e.effect,`schedule:${id}[${i}]`));
assert(FORUM_THREADS.length>=8&&FORUM_THREADS.every(thread=>thread.replies.length>=4),"論壇討論或模擬留言不足");assert(OFFICIAL_SOCIAL_POSTS.length>=3,"社群官方動態不足");
console.log(`內容交叉驗證通過：50 通告、${NPC_LIST.length} NPC、${Object.keys(MAP_LOCATIONS).length} 地點、事件與資產引用皆有效。`);
