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
 markVisitedLocation(locationId);state.fatigue+=3+(location.extraFatigue||0);state.stamina=Math.max(0,state.stamina-4-(location.extraFatigue||0));
 if(location.extraCost){state.money-=location.extraCost;out.push(`<b>花費－${money(location.extraCost)}</b>`)}
 if(location.recover){const reduced=Math.min(state.fatigue,location.recover.fatigue);state.fatigue-=reduced;state.mood=Math.min(100,state.mood+location.recover.mood);out.push(`<b>疲勞－${reduced}</b>`,`<b>心情＋${location.recover.mood}</b>`)}
 if(location.gain)out.push(addStat(...location.gain));if(location.bonus&&choice==="focus")out.push(addStat(...location.bonus));if(location.luck){state.luck=Math.min(1000,(state.luck||0)+location.luck);out.push("你得到了一點好兆頭")}
 if(location.industry){const company=markIndustryVisit(locationId),jobs=jobsVisibleAt(locationId);if(company){out.unshift(choice==="browse_jobs"?`你走到<b>${company.name}</b>的 Casting Desk，現場公開徵選已經展開`:`你正式走進<b>${company.name}</b>，也記下了這裡的製作方向`);if(choice==="browse_jobs")venue={company,jobs,notice:""}}}
 const encounter=choice==="explore"?meetNpc(location.encounter,`在${location.name}建立第一次印象。`):null;if(encounter?.text)out.unshift(encounter.text);
 if(locationId==="clinic")out.push("本週已解鎖衣櫃裡的整形與性別肯認醫療");if(locationId==="shop")out.push("本週已解鎖衣櫃服裝購買");
 return{text:out.join("、")+"。"+resolveLocationEvent(locationId,choice),encounter:encounter?.met?encounter:null,venue}
}
