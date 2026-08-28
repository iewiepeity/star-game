import { state } from "../core/state.js";
import { SOCIAL_POST_TEMPLATES } from "../data/social.js";
import { MAP_LOCATIONS } from "../data/map-locations.js";
export function socialDrafts(){
 const drafts={...SOCIAL_POST_TEMPLATES},work=[...(state.completedWorks||[])].reverse()[0],creative=[...(state.creativeProjects||[])].reverse().find(p=>["released","sold","production"].includes(p.status)),place=(state.recentLocations||[]).map(id=>MAP_LOCATIONS[id]).find(Boolean),manager=state.managerState;
 if(work)drafts.afterwork={label:"作品幕後",icon:"幕",text:`《${work.title}》完成後，我最想記住的不是結果，而是現場那次選擇：${work.storyLegacy||"把每個小決定做到誠實"}。`};
 if(creative)drafts.original={label:"原創進度",icon:"創",text:`《${creative.title}》正在走自己的路。${creative.status==="sold"?"這次選擇把企劃交給公司，也學會創作權是有重量的。":creative.status==="released"?`成品是 ${creative.finalGrade?.grade||"-"} 級，但數字之外還有我想留下的方向。`:"製作現場正在把紙上的想法變成真正的作品。"}`};
 if(place)drafts.city={label:"城市見聞",icon:"城",text:`今天在${place.name}停留了一會。${place.note} 星望市的每個地方，都在教我不同的工作方式。`};
 if(manager?.history?.some(h=>h.title))drafts.team={label:"團隊近況",icon:"團",text:"和團隊重新談過接下來的方向。有些專業不是把行程塞滿，而是知道什麼值得一起守住。"};
 return drafts;
}
