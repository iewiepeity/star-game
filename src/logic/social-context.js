import { state } from "../core/state.js";
import { NPCS } from "../data/npcs.js";
import { NPC_SOCIAL_COPY } from "../data/social.js";
const HOBBIES = {
  jiqing: "一間還沒去過的小咖啡館",
  shenyao: "一場老電影",
  tangtang: "一首適合散步的歌",
  guchengxi: "一張二手老唱片",
  linxiafan: "一塊手感很好的布",
  lujingran: "一段還沒填詞的旋律",
  xiayutong: "一個路人講的冷笑話",
  sufei: "一本猜錯兇手的小說",
  chengyian: "傍晚窗邊的光",
  hanzhiyuan: "一間不用訂位的小店",
};
const hash = (s) =>
  [...s].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7);
export function npcSocialPost(id, game = state) {
  const npc = NPCS[id];
  if (!npc) return null;
  const sharedPhoto = game.cityLife?.photos?.findLast(p => p.npcId === id && p.published && Math.floor(p.day / 7) + 2 >= game.week && game.cityLife.appointments.some(a => a.id === p.appointmentId && a.status === "completed" && a.photoConsent));
  if (sharedPhoto && game.knownPeople.includes(id)) return { id: `npc-${id}-${game.week}`, npcId: id, week: game.week, topic: "daily", text: "看到那張一起拍、也一起同意分享的咖啡館合照。那天確實留了一段時間，好好坐下來聊。" };
  const latest = [...(game.npcCareerHistory || [])]
    .reverse()
    .find((x) => x.npcId === id && x.week >= game.week - 2);
  const shared = [...(game.completedWorks || [])]
    .reverse()
    .find((x) => x.npcCast?.includes(id) && x.completedWeek >= game.week - 3);
  const variants = [
    {
      topic: "craft",
      text: NPC_SOCIAL_COPY[id] || "收工後記了幾筆，明天再接著試。",
    },
    {
      topic: "rest",
      text: "今天把最後一個空檔留給晚餐，吃完再回訊息。事情還有很多，但飯不用趕。",
    },
    {
      topic: "daily",
      text: `今天記住了${HOBBIES[id] || "路上的一件小事"}。和工作沒什麼關係，所以更想記下來。`,
    },
    {
      topic: "craft",
      text: `做${npc.job}也有一直練不順的小地方。今天重來了一遍，先記住這次哪裡比較好。`,
    },
    {
      topic: "daily",
      text: "本來只是出去買東西，回來多走了兩條街。沒有特別的收穫，腳步倒是慢下來了。",
    },
    {
      topic: "rest",
      text: "剛才關掉鬧鐘才發現，今天真的不用提早出門。早餐終於可以坐著吃。",
    },
    {
      topic: "craft",
      text: "收到一個很具體的建議。第一眼有點不服氣，回頭試過才知道對方說中了哪裡。",
    },
    {
      topic: "daily",
      text: `有人問我最近在想什麼，答案居然是${HOBBIES[id] || "下一頓晚餐"}。先把這件小事排進日曆。`,
    },
  ];
  const variant = shared
    ? {
        topic: "release",
        text: `《${shared.title}》完成了。片尾那些名字都是真正一起熬過現場的人，有空也看看他們。`,
      }
    : latest?.title
      ? {
          topic: "craft",
          text: `${latest.title}。先記下今天學到的一件事，其他的下次再說。`,
        }
      : variants[(game.week - 1 + hash(id)) % variants.length];
  return {
    id: `npc-${id}-${game.week}`,
    npcId: id,
    week: game.week,
    ...variant,
  };
}
export function contextualReplyOptions(id, game = state) {
  const topic = npcSocialPost(id, game)?.topic || "craft";
  const map = {
    craft: {
      encourage: [
        "問今天哪裡變順了",
        "其實是之前一直卡住的那一段。你還記得，真好。",
      ],
      work: ["分享自己練習時的發現", "這個方法我還沒試過，下次也來試試。"],
      care: ["問要不要先休息一下", "你提醒得剛好。我先離開椅子走一走。"],
    },
    rest: {
      encourage: ["替這個空白日開心", "原來休息也有人替我加油，今天收到啦。"],
      work: ["問今天吃了什麼", "簡單煮了一點，難得沒有邊吃邊看工作訊息。"],
      care: ["說晚點回也沒關係", "好，那我安心把手機放一下。晚點再聊。"],
    },
    daily: {
      encourage: ["說自己也想去看看", "下次整理好位置再傳給你，應該會喜歡。"],
      work: ["分享最近的小發現", "這個聽起來不錯，我也記下來了。"],
      care: [
        "問那時候心情怎麼樣",
        "比出門前輕鬆一點。謝謝你問的不是只有工作。",
      ],
    },
    release: {
      encourage: ["恭喜作品完成", "謝謝！還有很多不足，但終於能讓大家看到了。"],
      work: [
        "問最想保留哪個現場片段",
        "有一段原本差點刪掉，後來是大家一起留下來的。",
      ],
      care: [
        "問收工後有沒有好好吃飯",
        "終於吃了一頓不用看時間的飯。這也算殺青獎勵吧。",
      ],
    },
  };
  return Object.fromEntries(
    Object.entries(map[topic]).map(([key, [label, reply]]) => [
      key,
      {
        label,
        reply,
        copy: reply,
        relation: key === "work" ? 1 : 2,
        trust: key === "encourage" ? 1 : 2,
      },
    ]),
  );
}
