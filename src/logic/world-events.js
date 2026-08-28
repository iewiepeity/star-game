import{state}from"../core/state.js";import{randomInt}from"../core/rng.js";import{enqueueVisibleEvent}from"./event-engine.js";
const EVENTS=[
 {id:"streaming-war",title:"串流平台大戰",text:"數家平台同時擴大內容投資，戲劇與綜藝企劃量明顯增加。",effects:[{rep:"話題度",value:4}]},
 {id:"idol-boom",title:"偶像市場再度升溫",text:"唱跳與團體企劃重新成為市場焦點，年輕藝人的曝光競爭也更激烈。",effects:[{rep:"商業價值",value:4}]},
 {id:"ad-slowdown",title:"品牌預算縮手",text:"廣告市場進入保守期，品牌更重視可信度與既有合作紀錄。",effects:[{rep:"可信度",value:3}]},
 {id:"award-year",title:"獎季聲量擴張",text:"幾個重要影展與獎項今年特別受矚目，作品口碑開始影響商業合作。",effects:[{rep:"業界評價",value:4}]}
];
export function queueAnnualWorldEvent(){if(state.week<=1||state.week%52!==1)return null;state.worldEventHistory??=[];const year=Math.ceil(state.week/52);if(state.worldEventHistory.some(e=>e.year===year))return null;const e=EVENTS[randomInt(0,EVENTS.length-1)],record={year,week:state.week,id:e.id,title:e.title};state.worldEventHistory.push(record);enqueueVisibleEvent({id:`world:${year}:${e.id}`,kind:"職涯事件",title:`第 ${year} 年｜${e.title}`,text:e.text,choices:[{id:"adapt",label:"順著市場調整策略",outcome:"你開始重新檢視接案與曝光配置。",effects:e.effects},{id:"stay",label:"維持自己的節奏",outcome:"你沒有追著市場跑，繼續累積既有路線。",effects:[{rep:"可信度",value:2}]}]},"年度市場");return record}
