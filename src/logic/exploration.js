import { coursesAt, hasVisited } from "./city-progression.js";
import { ACTIONS } from "../data/actions.js";
import{MAP_LOCATIONS}from"../data/map-locations.js";
import{state,markVisitedLocation}from"../core/state.js";
import{random,money}from"../core/utils.js";
import{resolveLocationEvent}from"./random-events.js";
import{meetNpc}from"./npc-engine.js";
import{jobsVisibleAt,markIndustryVisit}from"./industry.js";
import{resolveOverseasVisit}from"./overseas.js";

function addStat(name,min,max){const gain=random(min,max);state.stats[name]=Math.min(1000,(state.stats[name]||0)+gain);return`<b>${name}＋${gain}</b>`}

export function resolveExploration(locationId,choice){
 if(locationId==="airport")return resolveOverseasVisit(choice==="explore"?"audition":"festival");
 const location=MAP_LOCATIONS[locationId]||MAP_LOCATIONS.park,out=[];let venue=null;
 const firstVisit = !hasVisited(state, locationId);
 markVisitedLocation(locationId);
 if (firstVisit && coursesAt(locationId).length) out.push(`你向櫃檯詢問了報名方式，已開放：${coursesAt(locationId).map(id => ACTIONS[id].label).join("、")}。之後可在行程表直接報名`);
 if (firstVisit && locationId === "business") out.push("服務台給了你一份經紀公司新人招募名錄，現在可以查看公開簡介並準備投遞；正式條件會在面談通過後提供");state.fatigue+=3+(location.extraFatigue||0);state.stamina=Math.max(0,state.stamina-4-(location.extraFatigue||0));
 if(location.extraCost){state.money-=location.extraCost;out.push(`<b>花費－${money(location.extraCost)}</b>`)}
 if(location.recover){const reduced=Math.min(state.fatigue,location.recover.fatigue);state.fatigue-=reduced;state.mood=Math.min(100,state.mood+location.recover.mood);out.push(`<b>疲勞－${reduced}</b>`,`<b>心情＋${location.recover.mood}</b>`)}
 if(location.gain)out.push(addStat(...location.gain));if(location.bonus&&choice==="focus")out.push(addStat(...location.bonus));if(location.luck){state.luck=Math.min(1000,(state.luck||0)+location.luck);out.push("你得到了一點好兆頭")}
 if(location.industry){const company=markIndustryVisit(locationId),jobs=jobsVisibleAt(locationId);if(company){out.unshift(choice==="browse_jobs"?`你走到<b>${company.name}</b>的 Casting Desk，現場公開徵選已經展開`:`你正式走進<b>${company.name}</b>，也記下了這裡的製作方向`);if(choice==="browse_jobs")venue={company,jobs,notice:""}}}
 const encounter=choice==="explore"?meetNpc(location.encounter,`在${location.name}建立第一次印象。`):null;if(encounter?.text)out.unshift(encounter.text);
 if(locationId==="clinic")out.push("本週已解鎖衣櫃裡的整形與性別肯認醫療");if(locationId==="shop")out.push("本週已解鎖衣櫃服裝購買");
 return{text:out.join("、")+"。"+resolveLocationEvent(locationId,choice),encounter:encounter?.met?encounter:null,venue}
}
