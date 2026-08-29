import{state,resetState}from"../src/core/state.js";
import{setSeed}from"../src/core/rng.js";
import{tickDeepeningSystems}from"../src/logic/deepening-engine.js";
import{WORLD_REACTION_SIGNALS}from"../src/data/living-world-content.js";

const hidden=Object.keys(WORLD_REACTION_SIGNALS.hidden),rep=Object.keys(WORLD_REACTION_SIGNALS.rep),runs=[];
for(let run=0;run<30;run++){
 resetState();setSeed(`world-reaction-audit-${run}`);state.name=`世界反應路徑 ${run+1}`;
 let firstWeek=null,total=0;const seen=new Set;
 for(let week=1;week<=260;week++){
  state.week=week;
  hidden.forEach((name,index)=>{const onset=8+(index*5+run*3)%54,rate=3+(run+index)%3;state.hidden[name]=Math.min(900,500+Math.max(0,week-onset)*rate)});
  rep.forEach((name,index)=>{const onset=20+(index*7+run*2)%70,rate=3+(run+index*2)%4;state.rep[name]=Math.min(900,500+Math.max(0,week-onset)*rate)});
  const result=tickDeepeningSystems();
  if(result.signal){const item=state.worldSignalHistory.find(entry=>entry.id===result.signal);firstWeek??=week;total+=1;if(item)seen.add(item.signature)}
 }
 runs.push({run:run+1,firstWeek,total,distinct:seen.size});
}
const aggregate={runs:runs.length,averageFirstWeek:Math.round(runs.reduce((sum,item)=>sum+(item.firstWeek||260),0)/runs.length),averageTotal:Number((runs.reduce((sum,item)=>sum+item.total,0)/runs.length).toFixed(1)),averageDistinct:Number((runs.reduce((sum,item)=>sum+item.distinct,0)/runs.length).toFixed(1)),minimumDistinct:Math.min(...runs.map(item=>item.distinct)),maximumDistinct:Math.max(...runs.map(item=>item.distinct))};
if(aggregate.averageFirstWeek>100)throw new Error(`世界反應平均首次出現過晚：第 ${aggregate.averageFirstWeek} 週`);
if(aggregate.minimumDistinct<10)throw new Error(`世界反應多樣性不足：單一路徑最低僅 ${aggregate.minimumDistinct} 種`);
console.log(JSON.stringify(aggregate,null,2));
