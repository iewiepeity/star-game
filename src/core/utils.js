// 核心層：與遊戲規則無關的純小工具，任何模組都可以直接用，不依賴 state 以外的東西（successRateLabel/yearOf/weekInYear/jobWorkDaysText/playerPortraitPath 除外，需要讀 state 或資料表）。
import{state}from"./state.js";
import{JOB}from"../data/job.js";
import{SHORT}from"../data/calendar.js";
import{AVATARS,OUTFITS,portraitAsset}from"../data/wardrobe.js";

export const random=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
export const esc=v=>String(v).replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
export const money=n=>`$${Math.max(0,n).toLocaleString("zh-TW")}`;
export const width=n=>Math.max(.35,Math.min(100,n/10));

// 成功率一律只顯示文字提示，不得外露精確百分比（規則 8）。
export function successRateLabel(chance){if(chance<15)return"幾乎不可能";if(chance<30)return"希望渺茫";if(chance<50)return"值得一試";if(chance<75)return"勝算不錯";return"十拿九穩"}
export function yearOf(){return Math.min(5,Math.ceil(state.week/52))}
export function weekInYear(){return((state.week-1)%52)+1}
// 通告（JOB）指定工作日的文字描述，供 views/jobs.js、views/planner.js 與 logic/runner.js 共用。
export function jobWorkDaysText(){return JOB.workDays.map(i=>"週"+SHORT[i]).join("、")}

// 玩家選擇的外型與當前服裝共同決定立繪；性別欄只影響稱呼，不限制任何立繪。
export function playerPortraitPath(outfitId=state.outfitId,avatarId=state.avatarId){return portraitAsset(AVATARS[avatarId]?avatarId:"raven",OUTFITS[outfitId]?outfitId:"newcomer")}
export function outfitBonus(statName){return OUTFITS[state.outfitId]?.bonuses?.[statName]||0}
export function effectiveStat(statName){return Math.min(1000,(state.stats[statName]||0)+outfitBonus(statName))}
