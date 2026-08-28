import{state}from"./state.js";
import{randomInt}from"./rng.js";
import{AVATARS,OUTFITS,portraitAsset}from"../data/wardrobe.js";
export const random=(a,b)=>randomInt(a,b);
export const esc=v=>String(v).replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
export const money=n=>`$${Math.max(0,n).toLocaleString("zh-TW")}`;
export const width=n=>Math.max(.35,Math.min(100,n/10));
export function successRateLabel(chance){if(chance<15)return"幾乎不可能";if(chance<30)return"希望渺茫";if(chance<50)return"值得一試";if(chance<75)return"勝算不錯";return"十拿九穩"}
export function yearOf(){return Math.min(5,Math.ceil(state.week/52))}
export function weekInYear(){return((state.week-1)%52)+1}
export function playerPortraitPath(outfitId=state.outfitId,avatarId=state.avatarId){return portraitAsset(AVATARS[avatarId]?avatarId:"raven",OUTFITS[outfitId]?outfitId:"newcomer")}
export function outfitBonus(statName){return OUTFITS[state.outfitId]?.bonuses?.[statName]||0}
export function effectiveStat(statName){return Math.min(1000,(state.stats[statName]||0)+outfitBonus(statName))}
