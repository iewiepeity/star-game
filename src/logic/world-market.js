import{state}from"../core/state.js";
import{randomInt,chance}from"../core/rng.js";

const CATEGORIES=["歌曲","電影","電視劇","綜藝","廣告"];
const TREND_LABELS={歌曲:["唱作熱潮","偶像回歸潮","抒情作品回溫"],電影:["商業大片年","獨立電影抬頭","懸疑犯罪熱"],電視劇:["串流劇大戰","古裝劇熱潮","都會愛情回溫"],綜藝:["實境節目熱潮","談話節目復甦","戶外綜藝旺季"],廣告:["品牌預算擴張","精品代言旺季","生活品牌搶人大戰"]};

export function ensureWorldMarket(){
 state.worldMarket??={year:1,categoryHeat:Object.fromEntries(CATEGORIES.map(c=>[c,50])),categoryDemand:Object.fromEntries(CATEGORIES.map(c=>[c,1])),headline:"市場平穩",history:[],activeEvent:null};
 return state.worldMarket;
}

export function marketHeat(category){return ensureWorldMarket().categoryHeat?.[category]??50}
export function marketDemand(category){return ensureWorldMarket().categoryDemand?.[category]??1}
export function marketJobModifier(category){return Math.round((marketHeat(category)-50)/6)}
export function marketRewardMultiplier(category){return Math.max(.75,Math.min(1.35,marketDemand(category)))}

function chooseTrend(){const category=CATEGORIES[randomInt(0,CATEGORIES.length-1)],direction=chance(58)?1:-1,label=direction>0?TREND_LABELS[category][randomInt(0,TREND_LABELS[category].length-1)]:`${category}市場進入冷卻期`;return{category,direction,label,weeks:randomInt(5,12),startedWeek:state.week}}

export function tickWorldMarket(){
 const m=ensureWorldMarket();m.year=Math.ceil(state.week/52);
 for(const c of CATEGORIES){const heat=m.categoryHeat[c]??50;m.categoryHeat[c]=Math.max(15,Math.min(90,heat+(heat>50?-1:heat<50?1:0)+randomInt(-2,2)));m.categoryDemand[c]=Number((.8+m.categoryHeat[c]/250).toFixed(2))}
 if(m.activeEvent){const e=m.activeEvent;m.categoryHeat[e.category]=Math.max(10,Math.min(95,m.categoryHeat[e.category]+e.direction*3));e.weeks-=1;if(e.weeks<=0)m.activeEvent=null}
 if(!m.activeEvent&&chance(22)){m.activeEvent=chooseTrend();m.headline=m.activeEvent.label;state.industryNews??=[];state.industryNews.unshift({id:`NEWS-MARKET-${state.week}`,key:`market:${state.week}`,week:state.week,category:"產業",subject:"industry",title:m.activeEvent.label,body:m.activeEvent.direction>0?`${m.activeEvent.category}相關企劃明顯增加，製作方開始積極搶人。`:`${m.activeEvent.category}案量轉弱，市場競爭比前幾週更激烈。`,heat:150})}
 else if(!m.activeEvent)m.headline="市場平穩";
 m.history.push({week:state.week,headline:m.headline,heat:{...m.categoryHeat}});if(m.history.length>80)m.history=m.history.slice(-80);return m
}
