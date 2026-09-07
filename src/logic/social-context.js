import { normalizeWorkEchoes } from "./work-echoes.js";
import { state } from "../core/state.js";
import { NPCS } from "../data/npcs.js";
import { NPC_SOCIAL_COPY } from "../data/social.js";
import { NPC_SOCIAL_STORIES } from "../data/npc-social-stories.js";
import { SOCIAL_REPLY_VARIANTS } from "../data/community-responses.js";
import { weeklyCopy } from "./community-rotation.js";

export function npcSocialPost(id, game = state) {
  const npc = NPCS[id];
  if (!npc) return null;
  const post = { id: `npc-${id}-${game.week}`, npcId: id, week: game.week };
  const sharedPhoto = game.cityLife?.photos?.findLast(p => p.npcId === id && p.published && Math.floor(p.day / 7) + 2 >= game.week && game.cityLife.appointments?.some(a => a.id === p.appointmentId && a.status === "completed" && a.photoConsent));
  if (sharedPhoto && game.knownPeople.includes(id)) return {
    ...post,
    topic: "daily",
    text: weeklyCopy([
      "看到那張一起拍、也一起同意分享的咖啡館合照。那天確實留了一段時間，好好坐下來聊。",
      "把一起同意分享的合照再看了一次。照片以外，還記得那天坐下來，終於不用一邊聊天一邊趕時間。",
      "那張彼此同意分享的照片留住了一小段相處。不是每句話都需要寫出來，有些就好好放在那天。",
    ], id, game.week),
  };
  const workEcho = [...normalizeWorkEchoes(game.workEchoes).records].reverse().find(r => r.npcId === id && r.npcText && r.publishedWeek >= game.week - 1);
  if (workEcho) return { ...post, id: `npc-${id}-${workEcho.id}`, workId: workEcho.workId, topic: "release", text: workEcho.npcText };
  const shared = [...(game.completedWorks || [])]
    .reverse()
    .find(x => x.npcCast?.includes(id) && x.completedWeek === game.week);
  if (shared) return {
    ...post,
    topic: "release",
    text: `《${shared.title}》完成了。${weeklyCopy([
      "片尾那些名字都是真正一起完成現場的人，有空也看看他們。",
      "把這段合作好好記下來。每個人做的那一小部分，最後真的接成了一個完整版本。",
      "看到成品時，會想起準備它的過程。先把這一段走完的心情留住，再想下一步。",
      "等大家有空接觸完整內容，再慢慢聊。很想知道你們各自會記住哪個地方。",
      "這段工作有了可以回看的模樣。謝謝一起把細節接住的人，也謝謝願意看見這些細節的人。",
      "回頭看自己的部分，也重新注意到其他人做的事情。合作留給人的東西，常常要完成後才更清楚。",
    ], id, game.week)}`,
  };
  const latest = [...(game.npcCareerHistory || [])].reverse()
    .filter(x => x.week === game.week)
    .flatMap(x => x.npcId === id && x.title ? [x.title] : (x.updates || []).filter(text => text.includes(npc.name)))
    .at(0);
  const variants = [
    ["craft", NPC_SOCIAL_COPY[id] || "收工後記了幾筆，明天再接著試。"],
    ...(NPC_SOCIAL_STORIES[id] || []),
  ];
  const [topic, text] = weeklyCopy(variants, id, game.week);
  // Career information is an addition to the week's personal post, never a multiweek replacement.
  return { ...post, topic, text: latest ? `${text}\n另外記下一則近期動態：${latest}。` : text };
}

export function contextualReplyOptions(id, game = state) {
  const topic = npcSocialPost(id, game)?.topic || "craft";
  return Object.fromEntries(
    Object.entries(SOCIAL_REPLY_VARIANTS[topic]).map(([key, variants]) => {
      const [label, reply] = weeklyCopy(variants, `${id}:${topic}:${key}`, game.week);
      return [key, {
        label,
        reply,
        copy: reply,
        relation: key === "work" ? 1 : 2,
        trust: key === "encourage" ? 1 : 2,
      }];
    }),
  );
}
