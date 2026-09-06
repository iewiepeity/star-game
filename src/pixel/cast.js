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
    busy:
      !!slot && !life?.game.scheduledActivities?.[slot.jobId]?.payload?.npcId,
    leaving,
  };
}
const LINES = {
  shenyao: [
    "抱歉，剛才在想一個鏡頭，差點沒注意到你。你平常看哪一類電影？",
    "問問準備的方向",
    "別只練最漂亮的那一句。角色沉默的時候，也要知道他在想什麼。",
  ],
  tangtang: [
    "你好！我剛有一點空檔。先讓我喝口水，說話也是要換氣的嘛。",
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
    "你好，請稍等，我把這個時間記下來就好。你想聊聊工作嗎？",
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
// These are spoken introductions, not excerpts from the character bible.
const INTRODUCTIONS = {
  shenyao: "裴硯之，拍電影的。剛才那個問題沒有標準答案，我只是想聽你的看法。",
  tangtang: "我叫楚星梨。台上唱歌，台下常常在找水壺——今天還好，它沒離家出走。",
  guchengxi: "周予珩，是個演員。工作以外不用那麼拘謹，叫名字就好。",
  linxiafan: "黎曼青，做造型的。你先說自己喜歡什麼，我再想怎麼幫你。",
  lujingran: "江敘白，寫歌，也唱。剛才不是沒聽見，我想把那段旋律記完。",
  xiayutong: "我叫宋知夏，做綜藝的。手機先收起來，不然聊兩句我又會開始記企劃。",
  hanzhiyuan: "秦紹謙，做經紀工作。有問題可以先問，今天不用急著做決定。",
  chengyian: "溫時嶼，攝影師。沒在拍照的時候，也喜歡到處看看。你的名字怎麼念？",
  silver_pc:
    "沈霧棠，做影像設計，也接動態捕捉的工作。剛才有一瞬間覺得你很眼熟……也可能是我認錯了。",
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
        text: "很高興認識你。你方便聊一會兒嗎？",
      },
      {
        speaker: id,
        text: INTRODUCTIONS[id],
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
