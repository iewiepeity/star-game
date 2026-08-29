import{MAP_LOCATIONS}from"../data/map-locations.js";
import{state}from"../core/state.js";
import{random,money}from"../core/utils.js";
import{resolveLocationEvent}from"./random-events.js";
import{meetNpc}from"./npc-engine.js";
import{jobsVisibleAt,markIndustryVisit}from"./industry.js";
import{resolveOverseasVisit}from"./overseas.js";
import{fameLifeTier}from"./playable-depth-engine.js";

function addStat(name,min,max){const gain=random(min,max);state.stats[name]=Math.min(1000,(state.stats[name]||0)+gain);return`<b>${name}＋${gain}</b>`}
function fameFriction(locationId,location){const tier=fameLifeTier();if(tier.min<250||location.industry||["clinic","airport"].includes(locationId))return"";const crowded=["mall","nightmarket","cinema","park","restaurant","cafe","shopping","department"].some(k=>locationId.includes(k))||!location.private;const trigger=((state.week*17+locationId.length*13+state.fame)%100)<Math.min(78,18+Math.floor(state.fame/28));if(!crowded||!trigger)return`現在的知名度讓你很難完全忘記旁人的視線，但今天沒有造成明顯騷動。`;if(tier.min>=1400){const extra=8;state.fatigue+=extra;state.rep.話題度=Math.min(1000,(state.rep.話題度||0)+5);state.fans+=Math.max(2,Math.round(state.fame/180));return`你才停留沒多久就被認出來。合照、偷拍與即時貼文很快聚集，<b>疲勞＋${extra}</b>；爆紅之後，普通出門本身就是公開行程。`}state.fatigue+=4;state.fans+=Math.max(1,Math.round(state.fame/260));state.rep.國民度=Math.min(1000,(state.rep.國民度||0)+2);return`有人猶豫幾秒後上前確認是不是你。短暫合照讓行程多了一點負擔，也讓你第一次感覺到「被認出」不是抽象數字。`}

export function resolveExploration(locationId,choice){
 if(locationId==="airport")return resolveOverseasVisit(choice==="explore"?"audition":"festival");
 const location=MAP_LOCATIONS[locationId]||MAP_LOCATIONS.park,out=[];let venue=null;
 state.lastVisitedLocation=locationId;state.lastVisitedWeek=state.week;state.fatigue+=3+(location.extraFatigue||0);state.stamina=Math.max(0,state.stamina-4-(location.extraFatigue||0));
 if(location.extraCost){state.money-=location.extraCost;out.push(`<b>花費－${money(location.extraCost)}</b>`)}
 if(location.recover){const reduced=Math.min(state.fatigue,location.recover.fatigue);state.fatigue-=reduced;state.mood=Math.min(100,state.mood+location.recover.mood);out.push(`<b>疲勞－${reduced}</b>`,`<b>心情＋${location.recover.mood}</b>`)}
 if(location.gain)out.push(addStat(...location.gain));if(location.bonus&&choice==="focus")out.push(addStat(...location.bonus));if(location.luck){state.luck=Math.min(1000,(state.luck||0)+location.luck);out.push("你得到了一點好兆頭")}
 if(location.industry){const company=markIndustryVisit(locationId),jobs=jobsVisibleAt(locationId);if(company){out.unshift(choice==="browse_jobs"?`你走到<b>${company.name}</b>的 Casting Desk，現場公開徵選已經展開`:`你正式走進<b>${company.name}</b>，也記下了這裡的製作方向`);if(choice==="browse_jobs")venue={company,jobs,notice:""}}}
 const encounter=choice==="explore"?meetNpc(location.encounter,`在${location.name}建立第一次印象。`):null;if(encounter?.text)out.unshift(encounter.text);
 const fame=fameFriction(locationId,location);if(fame)out.push(fame);
 if(locationId==="clinic")out.push("本週已解鎖衣櫃裡的整形與性別肯認醫療");if(locationId==="shop")out.push("本週已解鎖衣櫃服裝購買");
 return{text:out.join("、")+"。"+resolveLocationEvent(locationId,choice),encounter:encounter?.met?encounter:null,venue}
}
