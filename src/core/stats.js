// 核心層：能力擲骰與隱藏特質初始化。這是唯一會直接寫入 state.stats／state.hidden／state.luck 初始值的地方。
import{ABILITIES,HIDDEN_TRAITS}from"../data/abilities.js";
import{state}from"./state.js";
import{random}from"./utils.js";
import{render}from"../render.js";

export function rollStats(){
 state.stats=Object.fromEntries(ABILITIES.map(n=>[n,random(0,150)]));
 render()
}

export function initializeHiddenStats(){
 if(Object.keys(state.hidden).length)return;
 state.hidden=Object.fromEntries(HIDDEN_TRAITS.map(n=>[n,350+random(1,100)+random(1,100)+random(1,100)]));
 state.luck=200+random(1,200)+random(1,200)+random(1,200);
}

export function reroll(){rollStats()}
