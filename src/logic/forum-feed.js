import { FORUM_THREADS, FORUM_HANDLES } from "../data/forum.js";
import { state } from "../core/state.js";
function playerThread() {
  const latest = state.weekResults.at(-1),
    known = state.knownPeople.length;
  const title =
    state.fame >= 80
      ? `最近常看到新人「${state.name}」，有人追嗎？`
      : latest
        ? `有人在${latest.action}看到一位很認真的新人`
        : "星望市是不是又多了一位新人？";
  const body =
    state.rep.爭議度 >= 120
      ? "討論很多，先提醒大家理性，不要把猜測當成事實。"
      : known
        ? "聽說已經開始跑行程，也和圈內人有互動。先放一個觀察名單。"
        : "目前資料很少，只知道正在默默訓練。新人加油。";
  return {
    id: "player",
    category: "熱門",
    title,
    author: "新人觀察簿",
    body,
    heat: Math.max(48, state.fame * 7 + state.fans),
    replies: [
      "有努力就先給鼓勵。",
      "先看作品，不急著下定論。",
      "感覺會是慢慢成長的類型。",
      "這串先卡位，以後紅了回來簽到。",
    ],
  };
}
function newsThreads() {
  return (state.industryNews || []).slice(0, 12).map((n) => ({
    id: `news-${n.id}`,
    week: n.week || 1,
    category: n.category === "獎項" || n.category === "圈內" ? "熱門" : "作品",
    title: n.title,
    author: "娛樂搬運工",
    body: n.body,
    heat: n.heat || 60,
    replies: [
      `這次提到「${n.title}」，想知道後續實際會怎麼發展。`,
      "最近真的一直看到相關消息。",
      "先看作品跟實績再說。",
      "娛樂圈的風向變得也太快。",
      "卡一個，過幾週回來看。",
    ],
  }));
}
function echoThreads() {
  return [...(state.livingWorldFeed || [])]
    .reverse()
    .filter((item) =>
      ["作品長尾", "履約回聲", "人物近況", "世界反應"].includes(item.type),
    )
    .slice(0, 8)
    .map((item, index) => ({
      id: `echo-${item.id}`,
      week: item.week || 1,
      category: item.type === "作品長尾" ? "作品" : "熱門",
      title: item.title,
      author: item.type === "人物近況" ? "圈內目擊" : "後續觀察站",
      body: item.text,
      heat: Math.max(55, 90 - index * 4 + Math.min(180, state.fame * 2)),
      replies:
        item.type === "作品長尾"
          ? [
              "這個作品居然還有後續討論。",
              "當時那段真的滿有記憶點。",
              "所以前面的選擇現在才看出影響。",
              "娛樂圈真的不是播完就沒事。",
            ]
          : [
              `看到「${item.title}」才知道還有這段後續。`,
              "先卡，感覺還會繼續發酵。",
              "這種圈內後續比熱搜本身有意思。",
              "幾週前的事情現在又回來了。",
            ],
    }));
}
export function allThreads() {
  const latest = state.weekResults
    ?.filter((r) => r.success && !["休息", "好好休息"].includes(r.action))
    .at(-1);
  const player = latest
    ? [
        {
          ...playerThread(),
          id: `player-${state.week}-${latest.dayIndex}`,
          week: state.week,
        },
      ]
    : [];
  const threads = [
    ...echoThreads(),
    ...newsThreads(),
    ...player,
    ...FORUM_THREADS.map((t) => ({ ...t, week: 1 })),
  ];
  return threads
    .filter((t) => state.forumArchive || state.week - (t.week || 1) <= 4)
    .sort((a, b) => b.week - a.week || b.heat - a.heat);
}
export function repliesFor(thread) {
  return [...new Set(thread.replies)].map((text, i) => ({
    id: `${thread.id}:reply:${i}`,
    handle: FORUM_HANDLES[(i + thread.id.length) % FORUM_HANDLES.length],
    text,
    likes: 3 + ((thread.heat + i * 17) % 86),
  }));
}
