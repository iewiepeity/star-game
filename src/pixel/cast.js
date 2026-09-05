import { NPCS } from "../data/npcs.js";
import { hiddenRoomOpen } from "./city-catalog.js";
const ROUTES = {
  sufei: ["rehearsal", "library", "cafe", "cinema"],
  jiqing: ["cafe", "radio", "restaurant", "tv"],
  shenyao: ["film_company", "studio", "cinema", "library"],
  tangtang: ["dance", "recording", "livehouse", "gym"],
  guchengxi: ["theatre", "studio", "park", "restaurant"],
  linxiafan: ["shop", "beauty", "gallery", "media_company"],
  lujingran: ["record_company", "park", "recording", "livehouse"],
  xiayutong: ["tv", "media_company", "studio", "restaurant"],
  hanzhiyuan: ["business", "agency_starlight", "agency_mirror", "restaurant"],
  chengyian: ["gallery", "shop", "media_company", "park"],
  silver_pc: ["gallery", "editing_room", "airport", "editing_room"],
};
const STATUS = {
  sufei: ["暖身中", "讀本休息"],
  jiqing: ["整理節目筆記", "等一杯咖啡"],
  shenyao: ["核對分鏡", "換景休息"],
  tangtang: ["排練準備", "伸展休息"],
  guchengxi: ["整理劇本", "稍作休息"],
  linxiafan: ["查看服裝", "記錄造型"],
  lujingran: ["記下旋律", "試著哼唱"],
  xiayutong: ["核對流程", "等候工作電話"],
  hanzhiyuan: ["核對會談時間", "整理履歷"],
  chengyian: ["尋找光線", "整理相機"],
  silver_pc: ["記錄分鏡", "整理剪輯筆記"],
};
export function cityItinerary(id, elapsed, state) {
  if (id === "silver_pc" && !hiddenRoomOpen(state || {}))
    return { scene: null, status: "未登場", node: 0 };
  const life = state?.life,
    week = life?.game.week || 1,
    day = Math.min(6, life?.day || 0);
  const slot = life?.game.npcSchedules?.[id]?.find(
    (x) => x.week === week && x.day === day && x.status === "reserved",
  );
  // A reservation wins over daily leisure; no random draw occurs on room reload.
  const t = Math.max(0, elapsed) % 240,
    phase = Math.floor(t / 80),
    index = Object.keys(ROUTES).indexOf(id);
  const daily = (week - 1 + day) % 4,
    places = ROUTES[id];
  const location = slot
    ? slot.location || slot.venue || (slot.external ? null : places[0])
    : places[(daily + phase) % places.length];
  const scene = location === "tv_company" ? "tv" : location;
  if (slot && !scene)
    return { scene: null, status: "已有約定", node: 0, busy: true };
  const leaving = !slot && t % 80 > 71;
  if (!slot && t % 80 > 77)
    return { scene: null, status: "前往下一站", node: 0 };
  return {
    scene,
    node: Math.floor((t + index * 7) / 18) % 3,
    status: slot ? slot.label || "工作中" : STATUS[id][Math.floor(t / 24) % 2],
    busy: !!slot,
    leaving,
  };
}
const LINES = {
  shenyao: [
    "你也在看這份公開徵選？先讀懂角色，再決定要不要試。",
    "問問準備的方向",
    "別只練最漂亮的那一句。角色沉默的時候，也要知道他在想什麼。",
  ],
  tangtang: [
    "我在等下一輪練習。你剛開始嗎？水放在旁邊，別憋著氣硬唱。",
    "請教練習節奏",
    "先找一個舒服的音域。能穩穩唱完，比今天硬衝高音更有用。",
  ],
  guchengxi: [
    "剛把今天的台詞順過一次。你有想嘗試的角色嗎？",
    "聊聊對戲",
    "有時候要少想自己的表情，多聽對方怎麼說。接得住，戲才走得下去。",
  ],
  linxiafan: [
    "在找適合的造型？先想今天要做什麼，再決定穿什麼。",
    "請教第一套工作服",
    "選活動方便、線條乾淨的。衣服可以幫你，但不該替你搶走所有注意力。",
  ],
  lujingran: [
    "我在記剛想到的一段旋律。你平常也會把靈感留下來嗎？",
    "聊聊還沒完成的作品",
    "先錄下來，明天再聽。別因為今天不完整，就把可能性刪掉。",
  ],
  xiayutong: [
    "不好意思，我先確認一下時間。好了，你也想了解這裡的工作？",
    "問問新人怎麼開始",
    "從準時報到、看懂流程開始。場務與助理也能讓你認識整個現場。",
  ],
  hanzhiyuan: [
    "來看公司名錄？可以先比較方向，履歷準備好再談會更有效。",
    "請教履歷內容",
    "把能證明你能力的東西放前面。作品不多沒關係，內容要是真的。",
  ],
  chengyian: [
    "這裡的光剛好。放心，我還沒按快門，拍人以前總要先問一聲。",
    "聊聊自然的表情",
    "先別急著擺出標準答案。想一件你真的在意的事，眼神就會留下來。",
  ],
  silver_pc: [
    "你也會隨手記下沒完成的畫面嗎？有些片段，放久了才知道它要去哪裡。",
    "聊聊分鏡筆記",
    "我喜歡保留原稿。未完成，不代表只能被刪掉。",
  ],
};
export function expandCast(people, conversations) {
  for (const [id, npc] of Object.entries(NPCS))
    people[id] = {
      id,
      name: npc.name,
      job: npc.job,
      portrait: npc.portrait,
      head: npc.head,
    };
  for (const [id, [first, label, reply]] of Object.entries(LINES))
    conversations[id] = [
      { speaker: id, text: first },
      {
        speaker: "player",
        text: "我正在慢慢熟悉這座城市，也在尋找適合自己的開始。",
      },
      {
        speaker: id,
        text: `我是${NPCS[id].name}。${NPCS[id].profile?.values || "慢慢來，有機會再聊。"}`,
        choices: [
          { label, reply },
          { label: "讓對方先忙", reply: "謝謝你留意我的時間。我們下次再聊。" },
        ],
      },
    ];
}
export function repeatLine(id) {
  return (
    {
      sufei: "今天有比上次多一點把握嗎？累了就先停一下。",
      jiqing: "又見面了，今天在城市找到什麼喜歡的地方？",
    }[id] ||
    LINES[id]?.[2] ||
    "又見面了，今天過得怎麼樣？"
  );
}
