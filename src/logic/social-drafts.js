import { titleTag } from "../core/utils.js";
import { state } from "../core/state.js";
import { SOCIAL_POST_TEMPLATES } from "../data/social.js";
import { MAP_LOCATIONS } from "../data/map-locations.js";
export function socialDrafts(){
 const drafts={...SOCIAL_POST_TEMPLATES},work=[...(state.completedWorks||[])].reverse()[0],creative=[...(state.creativeProjects||[])].reverse().find(p=>["released","sold","production"].includes(p.status)),place=(state.recentLocations||[]).map(id=>MAP_LOCATIONS[id]).find(Boolean),manager=state.managerState;
 if(work)drafts.afterwork={label:"作品幕後",icon:"幕",text:`${titleTag(work.title)}完成後，我最想記住的不是結果，而是現場那次選擇：${typeof work.storyLegacy==="string"?work.storyLegacy:work.storyLegacy?.text||"先把自己的部分做好，再確認有沒有漏掉別人的功勞"}。`};
 if(creative)drafts.original={label:"原創進度",icon:"創",text:`${titleTag(creative.title)}正在走自己的路。${creative.status==="sold"?"這次選擇把企劃交給公司，也學會創作權是有重量的。":creative.status==="released"?`檔案終於從資料夾搬到公開頁面。謝謝願意花時間看完或聽完的人，也謝謝那些具體的回饋。`:"製作現場正在把紙上的想法變成真正的作品。"}`};
 if(place)drafts.city={label:"城市見聞",icon:"城",text:`翻到在${place.name}留下的筆記。城市很大，現在多了一個知道怎麼走的地方。`};
 if(manager?.history?.some(h=>h.title))drafts.team={label:"團隊近況",icon:"團",text:"和團隊重新談過接下來的方向。有些專業不是把行程塞滿，而是知道什麼值得一起守住。"};
 return drafts;
}
