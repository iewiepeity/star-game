import{ABILITIES}from"../src/data/abilities.js";
import{JOB_CATALOG,JOB_CATEGORIES,jobsByTier}from"../src/data/jobs-catalog.js";

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

