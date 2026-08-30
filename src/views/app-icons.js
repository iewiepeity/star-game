// 平板 App 圖示：低飽和紙感色與細線插畫，保留文青手帳的安靜氣質。
const paths={
 planner:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4M17 3v4M3 10h18M7 14l2 2 4-4"/>',
 timeline:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2M4 4l2 2M20 4l-2 2"/>',
 gallery:'<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="9" r="1.5"/><path d="m5 17 4-4 3 3 2-2 5 4M18 2v4M16 4h4"/>',
 stats:'<path d="M4 20V10M10 20V5M16 20v-7M22 20H2"/><path d="m4 7 6-4 6 6 5-5"/>',
 people:'<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2.5"/><path d="M5.5 17c.6-2 1.8-3 3.5-3s2.9 1 3.5 3M15 8h3M15 12h3M15 16h2"/>',
 log:'<path d="M4 4h12a3 3 0 0 1 3 3v14H7a3 3 0 0 1-3-3V4Z"/><path d="M7 4v17M10 8h6M10 12h6M10 16h4"/>',
 world:'<circle cx="8" cy="8" r="5"/><path d="M3 8h10M8 3c2 2 2 8 0 10M8 3c-2 2-2 8 0 10M14 8h7v12H5v-5M10 12h8M10 16h8"/>',
 map:'<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z"/><path d="M9 3v15M15 6v15"/><path d="M12 8a2 2 0 1 1 4 0c0 2-2 4-2 4s-2-2-2-4Z"/>',
 jobs:'<rect x="3" y="6" width="18" height="14" rx="3"/><path d="M8 6V4h8v2M3 11h18M10 11v3h4v-3"/>',
 creative:'<path d="m4 20 1-5L16 4l4 4L9 19l-5 1Z"/><path d="m14 6 4 4M4 20l5-1M6 15l3 4M20 2v3M18.5 3.5h3"/>',
 npc:'<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2.5"/><path d="M5.5 17c.6-2 1.8-3 3.5-3s2.9 1 3.5 3M15 8h3M15 12h3M15 16h2"/>',
 social:'<rect x="4" y="3" width="16" height="18" rx="4"/><circle cx="12" cy="11" r="3"/><path d="M8 6h1M16 6h1M9 17h6"/>',
 forum:'<path d="M3 5h13a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3H9l-4 3v-3H3V5Z"/><path d="M7 9h8M7 12h5"/>',
 wardrobe:'<path d="M12 5a2 2 0 1 0-2-2M12 5v2L3 14v3h18v-3l-9-7Z"/><path d="M7 17v3h10v-3"/>',
 settings:'<path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h8M16 18h4"/><circle cx="16" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="14" cy="18" r="2"/>',
 agency:'<path d="M4 21V7l8-4 8 4v14M2 21h20M8 9h2M14 9h2M8 13h2M14 13h2M10 21v-4h4v4"/>',
 achievements:'<path d="M8 4h8v4a4 4 0 0 1-8 0V4ZM8 6H4v2a4 4 0 0 0 5 4M16 6h4v2a4 4 0 0 1-5 4M12 12v5M8 21h8M9 17h6"/>',
 save:'<path d="M4 3h13l3 3v15H4V3Z"/><path d="M8 3v6h8V3M8 21v-7h8v7M10 6h4"/>'
};
export const APP_META=Object.freeze({
 planner:{label:"行程",title:"行程與工作",note:"安排七天行程、策略與預算",tone:"coral"},timeline:{label:"時間線",title:"星途時間線",note:"集中查看人物、作品與重大選擇",tone:"amber"},gallery:{label:"影像館",title:"星途影像館",note:"收藏 CG 並重讀人物章節",tone:"violet"},stats:{label:"能力",title:"能力資料",note:"檢視能力與隱藏特質",tone:"blue"},people:{label:"人物",title:"人物",note:"訊息、關係與人物檔案",tone:"teal"},log:{label:"紀錄",title:"星途紀錄",note:"回顧每週成果與重大選擇",tone:"slate"},world:{label:"娛樂週報",title:"娛樂圈週報",note:"市場、作品與後台世界",tone:"indigo"},map:{label:"星望地圖",title:"星望市地圖",note:"探索城市與產業公司",tone:"sage"},jobs:{label:"工作信箱",title:"工作信箱",note:"管理徵選、推薦與指名邀約",tone:"gold"},creative:{label:"創作室",title:"創作工作室",note:"製作、販售或自主發行作品",tone:"plum"},npc:{label:"人物",title:"人物",note:"訊息、關係與人物檔案",tone:"teal"},social:{label:"星光社群",title:"星光社群",note:"發布近況並查看圈內動態",tone:"pink"},forum:{label:"星談論壇",title:"星談論壇",note:"娛樂討論與熱門話題",tone:"orange"},wardrobe:{label:"造型衣櫃",title:"造型衣櫃",note:"切換造型與能力加成",tone:"lilac"},agency:{label:"經紀公司",title:"經紀公司",note:"投遞、面談與簽約進度",tone:"navy"},achievements:{label:"星途成就",title:"星途成就",note:"收藏旅程與生活里程碑",tone:"honey"},save:{label:"存檔管理",title:"存檔管理",note:"管理存檔與安全備份",tone:"mint"},settings:{label:"遊戲設定",title:"遊戲設定",note:"存讀檔、顯示與遊戲流程",tone:"gray"}
});
export const APP_LIBRARY_IDS=Object.freeze(["planner","timeline","gallery","stats","people","log","world","map","jobs","creative","social","forum","wardrobe","agency","achievements","save","settings"]);
export const APP_CATEGORIES=Object.freeze({planner:"行程",map:"行程",jobs:"事業",creative:"事業",agency:"事業",stats:"事業",people:"人物",social:"人物",forum:"人物",timeline:"收藏",gallery:"收藏",log:"收藏",world:"收藏",achievements:"收藏",wardrobe:"系統",save:"系統",settings:"系統"});
export const APP_CATEGORY_LABELS=Object.freeze(["全部","行程","事業","人物","收藏","系統"]);
export const DEFAULT_DOCK_IDS=Object.freeze(["planner","timeline","gallery","stats","people","log"]);
export const APP_DOCK_IDS=DEFAULT_DOCK_IDS;
export function normalizeDockIds(ids,{fallback=true}={}){const aliases={npc:"people"},clean=[...new Set((Array.isArray(ids)?ids:[]).map(id=>aliases[id]||id).filter(id=>APP_LIBRARY_IDS.includes(id)))].slice(0,6);return clean.length||!fallback?clean:[...DEFAULT_DOCK_IDS]}
export function appIcon(id,className=""){return`<svg class="app-icon-svg ${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path class="icon-whisper" d="M19.5 3.5c-1.4.1-2.4.8-2.8 2.1"/>${paths[id]||paths.settings}</svg>`}
