import{MAP_LOCATIONS}from"../data/map-locations.js";
import{NPCS}from"../data/npcs.js";
import{state}from"../core/state.js";
import{random,money}from"../core/utils.js";

function addStat(name,min,max){const gain=random(min,max);state.stats[name]=Math.min(1000,(state.stats[name]||0)+gain);return`<b>${name}＋${gain}</b>`}

function meetNpc(id){
 if(!id||state.knownPeople.includes(id))return"";
 const npc=NPCS[id],familiar=state.familiarNpcs.includes(id),start=familiar?18:8;
 state.knownPeople.push(id);state.selectedNpc=id;state.relationships[id]={closeness:start,trust:familiar?20:10,romance:"none"};
 state.flags.push({week:state.week,label:`第一次認識${npc.name}`,note:familiar?"彼此似乎有種說不上來的熟悉，很快就聊開了。":`在${npc.location.split("、")[0]}建立第一次印象。`});
 return familiar?`你與<b>${npc.name}</b>都覺得彼此有點眼熟，很快就聊開了。`:`你在這裡第一次認識了<b>${npc.name}</b>。`;
}

export function resolveExploration(locationId,choice){
 const location=MAP_LOCATIONS[locationId]||MAP_LOCATIONS.park,out=[];
 state.lastVisitedLocation=locationId;state.lastVisitedWeek=state.week;
 state.fatigue+=3+(location.extraFatigue||0);state.stamina=Math.max(0,state.stamina-4-(location.extraFatigue||0));
 if(location.extraCost){state.money-=location.extraCost;out.push(`<b>花費－${money(location.extraCost)}</b>`)}
 if(location.recover){const reduced=Math.min(state.fatigue,location.recover.fatigue);state.fatigue-=reduced;state.mood=Math.min(100,state.mood+location.recover.mood);out.push(`<b>疲勞－${reduced}</b>`,`<b>心情＋${location.recover.mood}</b>`)}
 if(location.gain)out.push(addStat(...location.gain));
 if(location.bonus&&choice==="focus")out.push(addStat(...location.bonus));
 if(location.luck){state.luck=Math.min(1000,(state.luck||0)+location.luck);out.push("你得到了一點好兆頭")}
 const encounter=choice==="explore"?meetNpc(location.encounter):"";
 if(encounter)out.unshift(encounter);
 if(locationId==="clinic")out.push("本週已解鎖衣櫃裡的整形與性別肯認醫療");
 if(locationId==="shop")out.push("本週已解鎖衣櫃服裝購買");
 return out.join("、")+"。";
}
