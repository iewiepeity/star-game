import{state}from"../core/state.js";
import{randomInt}from"../core/rng.js";

export function overseasEligibility(){
 const requirements=[
  {label:"進入第二年",met:state.week>=53,current:`第 ${state.week} 週`},
  {label:"知名度 80",met:state.fame>=80,current:String(state.fame)},
  {label:"完成 3 部作品",met:state.completedWorks.length>=3,current:`${state.completedWorks.length} 部`}
 ];
 return{unlocked:requirements.every(item=>item.met),requirements};
}

export function overseasDecision(){return{title:"星望國際機場・海外發展",text:"出境大廳的航班看板快速翻頁。這不只是逛機場，而是要決定這趟旅程替職涯打開哪一扇門。",choices:[{id:"festival",label:"參加海外影展／音樂節",note:"提高業界評價與國際能見度，花費 $5,000"},{id:"audition",label:"挑戰海外公開徵選",note:"考驗表演與語言準備，成功時回報較高，花費 $5,000"}]}}

export function resolveOverseasVisit(choice){
 const eligibility=overseasEligibility();
 if(!eligibility.unlocked)return{text:"你的海外工作資料仍未備齊，這次只能在航廈觀察出境工作的節奏。"};
 const cost=Math.min(5000,state.money);state.money-=cost;state.overseasVisits=(state.overseasVisits||0)+1;
 if(choice==="audition"){
  const power=((state.stats.演技||0)+(state.stats.歌藝||0)+(state.stats.口才||0))/3,success=power+randomInt(0,60)>=105;
  if(success){const fame=randomInt(8,14),fans=randomInt(1200,2600);state.fame+=fame;state.fans+=fans;state.rep.業界評價+=5;state.flags.push({week:state.week,label:"海外徵選留下名字",note:"第一次在陌生市場完成正式徵選，開始累積海外履歷。"});return{text:`花費－$${cost.toLocaleString("zh-TW")}。陌生語言與臨時改題沒有讓你失去節奏；評審在履歷上圈起你的名字。<b>知名度＋${fame}、粉絲＋${fans.toLocaleString("zh-TW")}、業界評價＋5</b>`}}
  state.stats.口才=Math.min(1000,(state.stats.口才||0)+4);state.rep.業界評價+=1;return{text:`花費－$${cost.toLocaleString("zh-TW")}。這次沒有進入下一輪，但你拿到具體回饋，也第一次知道自己在不同市場裡缺少什麼。<b>口才＋4、業界評價＋1</b>`}
 }
 const fame=randomInt(4,8),fans=randomInt(500,1400);state.fame+=fame;state.fans+=fans;state.rep.業界評價+=4;state.stats.學識=Math.min(1000,(state.stats.學識||0)+3);state.flags.push({week:state.week,label:"第一次海外公開行程",note:"你帶著作品走進不同市場，也建立了第一批海外觀眾。"});return{text:`花費－$${cost.toLocaleString("zh-TW")}。映後交流與後台合作，讓作品不再只留在星望市。<b>知名度＋${fame}、粉絲＋${fans.toLocaleString("zh-TW")}、業界評價＋4、學識＋3</b>`}
}
