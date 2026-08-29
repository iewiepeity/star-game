import { JOB_CATALOG } from "../src/data/jobs.js";
import { JOB_STORYLINES } from "../src/data/job-storylines.js";
import { JOB_DEPTH_TIERS, FLAGSHIP_JOB_BEATS, YEAR_CHAPTERS, MANAGER_STANCES } from "../src/data/deepening-content.js";
import { FEATURE_JOB_IDS, FEATURE_JOB_BEATS } from "../src/data/job-feature-beats.js";
import { NPC_AUTONOMOUS_BEATS, ROMANCE_STAGE_FLAVOR, WORLD_REACTION_SIGNALS } from "../src/data/living-world-content.js";

const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const aIds=Object.entries(JOB_DEPTH_TIERS).filter(([,tier])=>tier==="A").map(([id])=>id);
const bIds=[...FEATURE_JOB_IDS];
const allIds=new Set(JOB_CATALOG.map(job=>job.id));

assert(JOB_CATALOG.length===75,"深化階段不得改變 75 份通告總數");
assert(aIds.length===15,`A 級旗艦工作應為 15，實際 ${aIds.length}`);
assert(bIds.length===10,`B 級特色工作應為 10，實際 ${bIds.length}`);
assert(new Set([...aIds,...bIds]).size===25,"A／B 工作不得重疊");
for(const id of [...aIds,...bIds])assert(allIds.has(id),`深化工作不存在：${id}`);
for(const id of aIds){
 const story=JOB_STORYLINES[id],beat=FLAGSHIP_JOB_BEATS[id];
 assert(story?.depth==="A",`${id} 未標示 A 級`);
 assert(story.production?.length===4,`${id} A 級製作鏈不足四段`);
 assert(story.production[0].text===beat.opening,`${id} 開工文本未接旗艦內容`);
 assert(story.production[1].text===beat.crisis,`${id} 危機文本未接旗艦內容`);
 assert(story.production[2].text===beat.pivot,`${id} 關鍵文本未接旗艦內容`);
 assert(story.production[3].text===beat.wrap,`${id} 收尾文本未接旗艦內容`);
 assert(story.legacy?.text===beat.publicEcho,`${id} 缺少公開後長尾`);
}
assert(new Set(aIds.map(id=>JOB_STORYLINES[id].production[1].text)).size===aIds.length,"A 級危機文本不可共用模板");
for(const id of bIds){
 const story=JOB_STORYLINES[id],beat=FEATURE_JOB_BEATS[id];
 assert(story?.depth==="B",`${id} 未標示 B 級`);
 assert(story.production?.length===4,`${id} B 級製作鏈不足`);
 assert(story.production[1].text===beat.friction,`${id} 缺少專屬磨合`);
 assert(story.production[2].text===beat.pivot,`${id} 缺少專屬關鍵場次`);
 assert(story.legacy?.text===beat.echo,`${id} 缺少 B 級長尾`);
}
assert(new Set(bIds.map(id=>JOB_STORYLINES[id].production[1].text)).size===bIds.length,"B 級專屬磨合不可重複");
const cCount=JOB_CATALOG.filter(job=>JOB_STORYLINES[job.id]?.depth==="C").length;
assert(cCount===50,`C 級工作應為 50，實際 ${cCount}`);
assert(YEAR_CHAPTERS.length===5&&new Set(YEAR_CHAPTERS.map(x=>x.title)).size===5,"五年章節必須各自不同");
assert(Object.keys(MANAGER_STANCES).length===4,"四位經紀人都必須具備立場文本");
for(const stance of Object.values(MANAGER_STANCES))for(const key of["conservative","ambitious","crisis","renewal"])assert(stance[key],`經紀人缺少 ${key} 立場`);
assert(Object.keys(NPC_AUTONOMOUS_BEATS).length===10,"10 位主要 NPC 都需要自主人生文本");
assert(Object.values(NPC_AUTONOMOUS_BEATS).every(pool=>pool.length>=3),"每位 NPC 至少需要三段自主職涯 beat");
for(const stage of["interested","ambiguous","dating","committed","engaged","married","broken"])assert(ROMANCE_STAGE_FLAVOR[stage]?.length>=2,`戀愛階段 ${stage} 文本不足`);
assert(Object.keys(WORLD_REACTION_SIGNALS.hidden).length===8,"8 個隱藏特質都需要世界反應");
assert(Object.keys(WORLD_REACTION_SIGNALS.rep).length===8,"8 個聲望值都需要世界反應");
console.log(`垂直深化驗證通過：15 A 級旗艦、10 B 級特色、${cCount} C 級基礎工作；5 年章節、10 NPC 自主人生、4 經紀人立場均完整。`);
