import{state}from"../core/state.js";
import{portfolioSummary}from"./portfolio.js";

const ROUTES={歌曲:"唱作歌手",電影:"電影演員",電視劇:"國民演員",綜藝:"綜藝主持",廣告:"商業明星"};
export function careerRoute(){const entries=Object.entries(state.careerProgress||{}).sort((a,b)=>b[1]-a[1]);return entries[0]?.[1]>0?ROUTES[entries[0][0]]:"仍在尋找方向的新人"}

export function evaluateEnding(trigger=state.endingType||"fiveyear"){
 const portfolio=portfolioSummary(),route=careerRoute(),relValues=Object.values(state.relationships||{}),bestRel=relValues.sort((a,b)=>(b.closeness+b.trust)-(a.closeness+a.trust))[0],awardWins=state.awards.filter(a=>a.result!=="入圍").length;
 const careerScore=Math.min(400,state.fame*.12+state.rep.業界評價*.25+portfolio.works*12+awardWins*35);
 const lifeScore=Math.min(250,Math.max(0,state.money)/20000+(bestRel?bestRel.closeness+bestRel.trust:0));
 const publicScore=Math.min(250,state.fans/5000+state.rep.路人緣*.12+state.rep.可信度*.12-state.rep.爭議度*.1);
 const score=Math.round(careerScore+lifeScore+publicScore),rank=score>=750?"傳奇":score>=560?"巨星":score>=380?"一線":score>=220?"站穩腳步":"未完待續";
 const title=trigger==="death"?"燃盡的星光":trigger==="retire"?`${route}・轉身之後`:`${rank}之路・${route}`;
 const badges=[];if(portfolio.works>=10)badges.push("作品豐收");if(awardWins)badges.push("獎項肯定");if(state.money>=1000000)badges.push("財務自由");if(bestRel?.closeness>=80)badges.push("重要羈絆");if(state.rep.爭議度>=500)badges.push("風暴中心");
 return{trigger,title,rank,route,score,badges,portfolio,awardWins,relationship:bestRel||null,summary:trigger==="death"?"你用盡力氣追逐星光，卻忘了身體不是可以無限續杯的資源。":`五年的選擇讓你成為「${route}」。這不是唯一答案，而是這一輪由作品、關係與聲望共同寫下的結果。`};
}

