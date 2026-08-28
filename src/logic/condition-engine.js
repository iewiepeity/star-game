import{state}from"../core/state.js";

const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

export function conditionSnapshot(game=state){return{fatigue:Number(game.fatigue)||0,stamina:clamp(Number(game.stamina)||0,0,100),health:clamp(Number(game.health)||0,0,100),mood:clamp(Number(game.mood)||0,0,100)}}

export function performanceMultiplier(kind="work",game=state){const{fatigue,stamina,health,mood}=conditionSnapshot(game);let fatigueFactor=fatigue<=40?1:fatigue<=60?.92:fatigue<=80?.78:fatigue<=100?.58:fatigue<=150?.35:.15;const staminaFactor=stamina>=60?1:stamina>=30?.9:stamina>0?.72:.55;const healthFactor=health>=70?1:health>=40?.85:.65;const moodFactor=mood>=60?1:mood>=30?.93:.82;const floor=kind==="training"?.2:.12;return clamp(fatigueFactor*staminaFactor*healthFactor*moodFactor,floor,1)}

export function performancePercent(kind="work",game=state){return Math.round(performanceMultiplier(kind,game)*100)}

export function performanceLabel(kind="work",game=state){const value=performancePercent(kind,game);return value>=95?"狀態絕佳":value>=80?"狀態穩定":value>=60?"略顯疲憊":value>=35?"表現明顯受影響":"已接近極限"}

export function successChanceWithCondition(base,kind="work",game=state){const multiplier=performanceMultiplier(kind,game);return clamp(Math.round(base+(multiplier-1)*45),5,95)}

export function applyActivityLoad(activity={},game=state){game.money=Math.max(0,(Number(game.money)||0)-(Number(activity.cost)||0));game.fatigue=Math.max(0,(Number(game.fatigue)||0)+(Number(activity.fatigue)||0));game.stamina=clamp((Number(game.stamina)||0)-(Number(activity.stamina)||0),0,100);return conditionSnapshot(game)}

export function healthPressure(game=state){if(game.fatigue>200||game.health<=0)return"death";if(game.fatigue>100)return"hospital";if(game.fatigue>80){const damage=Math.max(1,Math.round((game.fatigue-75)/10));game.health=Math.max(0,game.health-damage)}else game.health=Math.min(100,game.health+1);return game.health<=0?"death":null}
