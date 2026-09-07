import { normalizeWorkEchoes } from "./work-echoes.js";
import { FORUM_THREADS, FORUM_HANDLES } from "../data/forum.js";
import { state } from "../core/state.js";
import { weeklyForumThreads, communityHash, weeklyCopy } from "./community-rotation.js";
import { COMMUNITY_COMMENT_POOLS } from "../data/community-responses.js";

export function communityComments(category, key, count = 3) {
  const group = category === "歌曲" ? "音樂" : ["電影", "電視劇", "廣告", "原創"].includes(category) ? "作品" : category;
  const pool = COMMUNITY_COMMENT_POOLS[group] || COMMUNITY_COMMENT_POOLS.圈內;
  const offset = communityHash(key) % pool.length;
  return Array.from({ length: Math.min(count, pool.length) }, (_, index) => pool[(offset + index) % pool.length]);
}
function playerThread(latest) {
  const known = state.knownPeople.length;
  const title =
    state.fame >= 80
      ? weeklyCopy([
          `最近常看到「${state.name}」，大家最先注意到哪一面？`,
          `想整理「${state.name}」的成長記錄，有哪些內容值得回看？`,
          `關於「${state.name}」，想聽大家聊一點具體的觀察`,
          `「${state.name}」近況討論：先從已公開的作品和行程說起`,
          `最近認識「${state.name}」這個名字，從哪裡開始了解比較好？`,
          `這週又看到「${state.name}」的消息，來交換一下不同角度`,
        ], "player-title")
      : latest
        ? `有人在${latest.action}看到一位很認真的新人`
        : "星望市是不是又多了一位新人？";
  const body =
    state.rep.爭議度 >= 120
      ? weeklyCopy([
          "討論很多，先把已經公開的消息和推測分開。如果有完整來源，可以放回這串一起看。",
          "這幾週的說法不太一致，想先整理確定知道的部分。作品表現可以討論，沒有根據的私下猜測就先放下。",
          "知道大家有不同感受，也希望具體說明在回應哪件事。別讓一張截圖代替所有前後文。",
          "這串先保留不同看法，不替本人補沒有公開的說明。後面如果有新資訊，也請一起更新。",
        ], "player-controversy")
      : known
        ? weeklyCopy([
            "從公開近況看得到一些工作與互動的累積。想把那些具體的小進展記下來，不急著預測之後會走多快。",
            "開始認得這個名字之後，也會想知道每次行程帶回了什麼。比起只說有潛力，更想聽大家注意到哪個細節。",
            "已經有一些圈內互動，也持續在自己的路上走。這串留給看過相關內容的人，慢慢補上不同角度。",
            "回頭看前面的近況，才能知道現在和以前有什麼不同。想把作品、工作和交流的記錄放在一起讀。",
          ], "player-known")
        : weeklyCopy([
            "目前能找到的公開資料不多，先留下一個名字。新人有自己的步調，不需要第一週就替人排好整段生涯。",
            "從一點點近況開始認識。想先看實際做過的事情，再慢慢形成印象，這串不急著下結論。",
            "剛注意到這位新人，還在整理有哪些可看的內容。有具體資訊再補進來，給起步一點時間。",
            "資料還少，也許可以先把每次看得見的小進展記住。以後回頭看，才知道路是怎麼一段段走過來的。",
          ], "player-new");
  return {
    id: "player",
    category: "熱門",
    title,
    author: "新人觀察簿",
    body,
    heat: Math.max(48, state.fame * 7 + state.fans),
    replies: communityComments("圈內", `player-${state.week}-${latest?.dayIndex}`, 4),
  };
}
function newsThreads() {
  return (state.industryNews || []).filter(n => !n.key?.startsWith("work-echo:")).slice(0, 12).map((n) => ({
    id: `news-${n.id}`,
    week: n.week || 1,
    category: n.category === "歌曲" ? "音樂" : n.category === "綜藝" ? "綜藝" : n.category === "獎項" || n.category === "圈內" ? "熱門" : "作品",
    title: n.title,
    author: "娛樂搬運工",
    body: n.body,
    background: !!n.editorial,
    heat: n.heat || 60,
    replies: communityComments(n.category, n.key || n.id, 4),
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
      replies: communityComments(item.type === "作品長尾" ? "作品" : "圈內", item.id, 4),
    }));
}
export function allThreads() {
  const latest = state.weekResults
    ?.filter((r) => r.success && !["休息", "好好休息"].includes(r.action))
    .at(-1);
  const player = latest
    ? [
        {
          ...playerThread(latest),
          id: `player-${state.week}-${latest.dayIndex}`,
          week: state.week,
        },
      ]
    : [];
  const threads = [
    ...normalizeWorkEchoes(state.workEchoes).records.map(r => ({ id: r.id, workId: r.workId, week: r.publishedWeek, category: "作品", title: r.publicTitle || r.title, author: "作品後續觀察", body: r.publicText || r.text, heat: 88, replies: r.replies })),
    ...echoThreads(),
    ...newsThreads(),
    ...player,
    ...weeklyForumThreads(),
    ...FORUM_THREADS.map((t) => ({ ...t, week: 1 })),
  ];
  return threads
    .filter((t) => state.forumArchive || state.week - (t.week || 1) <= 4)
    .sort((a, b) => b.week - a.week || Number(!!a.background) - Number(!!b.background) || b.heat - a.heat);
}
export function repliesFor(thread) {
  return [...new Set(thread.replies)].map((text, i) => ({
    id: `${thread.id}:reply:${i}`,
    handle: FORUM_HANDLES[(i + thread.id.length) % FORUM_HANDLES.length],
    text,
    likes: 3 + ((thread.heat + i * 17) % 86),
  }));
}
