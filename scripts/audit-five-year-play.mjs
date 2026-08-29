import { state, resetState } from "../src/core/state.js";
import { NPC_LIST } from "../src/data/npcs.js";
import { ABILITIES } from "../src/data/abilities.js";
import { setSeed } from "../src/core/rng.js";
import { tickDeepeningSystems } from "../src/logic/deepening-engine.js";
import { activateNextEvent, resolveEvent, dismissActiveEvent } from "../src/logic/event-engine.js";
import { validateGameState } from "../src/core/save-schema.js";

resetState();setSeed("five-year-human-audit");state.name="五年人工路徑稽核";
state.stats=Object.fromEntries(ABILITIES.map(name=>[name,650]));state.hidden={幽默:650,共情:650,洞察:650,膽識:650,品德:650,自律:650,野心:650,抗壓:650};
state.knownPeople=NPC_LIST.filter(n=>!n.special).map(n=>n.id);for(const id of state.knownPeople)state.relationships[id]={closeness:72,trust:72,affection:55,hostility:0,romance:"none",visibility:"private",romanceHistory:[],affectionHistory:[],hostilityHistory:[]};
state.partnerId=state.knownPeople[0];state.relationships[state.partnerId].romance="dating";
const decisions=[];
for(let week=1;week<=260;week++){
 state.week=week;tickDeepeningSystems();
 activateNextEvent();
 if(state.activeEvent?.event){const event=state.activeEvent.event,choice=event.choices?.[week%Math.max(1,event.choices.length)];const result=resolveEvent(event,choice?.id);decisions.push({week,id:event.id,choice:choice?.id||null});dismissActiveEvent();}
 const valid=validateGameState(state);if(!valid.ok)throw new Error(`第 ${week} 週存檔失效：${valid.errors.join("、")}`);
}
const longform=Object.values(state.npcLongformProgress).reduce((sum,value)=>sum+value,0),exposures=Object.values(state.contentExposure),repeatMax=Math.max(0,...exposures);
if(longform<45)throw new Error(`跨年人物章節曝光不足：${longform}/50`);
if(new Set(decisions.map(x=>x.id)).size<35)throw new Error("五年可見選擇事件差異不足");
console.log(JSON.stringify({weeks:260,decisions:decisions.length,uniqueDecisionEvents:new Set(decisions.map(x=>x.id)).size,longformChapters:longform,trackedNarratives:exposures.length,maxExposure:repeatMax},null,2));
