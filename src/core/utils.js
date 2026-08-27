// 核心層：與遊戲規則無關的純小工具，任何模組都可以直接用，不依賴 state 以外的東西（successRateLabel/yearOf/weekInYear/jobWorkDaysText/playerPortraitPath 除外，需要讀 state 或資料表）。
import{state}from"./state.js";
import{JOB}from"../data/job.js";
import{SHORT}from"../data/calendar.js";
import{KNOWN_GENDERS}from"../data/genders.js";
import{PLAYER_PORTRAITS}from"../data/portraits.js";

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

// 依性別挑一張玩家立繪路徑；非固定三個選項（含「自訂」與尚未輸入時）一律退回 default 那張。
// 不把路徑存進 state：性別隨時可能被改，路徑永遠是即時算出來的，不會有存檔存到舊路徑對不上的問題。
const GENDER_PORTRAIT_KEYS=["female","male","nonbinary"];
export function playerPortraitPath(gender){const i=KNOWN_GENDERS.indexOf(gender);return i>=0?PLAYER_PORTRAITS[GENDER_PORTRAIT_KEYS[i]]:PLAYER_PORTRAITS.default}
