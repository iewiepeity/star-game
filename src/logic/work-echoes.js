import { recordCharacterMemory } from "./character-memory.js";
import { normalizeWorkEchoes } from "../core/work-echo-state.js";
export { normalizeWorkEchoes } from "../core/work-echo-state.js";
import { state } from "../core/state.js";
import { NPCS } from "../data/npcs.js";
import { availableJobs } from "./job-engine.js";
import { enqueueVisibleEvent } from "./event-queue.js";
import { originalEchoCopy, WORK_ECHO_COPY_VERSION, WORK_ECHO_CHOICE_OUTCOMES } from "../data/work-echo-content.js";

const STAGES = [{ id: "opening", after: 1, label: "發行初期" }, { id: "weeks", after: 4, label: "幾週之後" }, { id: "anniversary", after: 52, label: "隔年回看" }];
const validChoices = new Set(["proud", "mixed", "quiet", "revisit", "forward", "leave"]);
export function releasedEchoWorks(game = state) {
  const projects = game.creativeProjects || [];
  const works = (game.completedWorks || []).filter(w => w && typeof w.id === "string" && w.title && Number.isFinite(w.completedWeek)).map(work => {
    const project = projects.find(p => p.id === work.creativeProjectId);
    return project ? { ...work, creativeType: project.type, direction: work.direction || project.direction,
      distributionMode: work.distributionMode ?? project.distributionMode,
      selfParticipation: work.selfParticipation ?? project.selfParticipation } : work;
  });
  const originals = new Set(works.map(w => w.creativeProjectId).filter(Boolean));
  return [...works, ...(game.creativeProjects || []).filter(p => p.status === "released" && Number.isFinite(p.releaseWeek) && !originals.has(p.id)).map(p => ({
    id: `creative-${p.id}`, creativeProjectId: p.id, title: p.title, category: p.category || (p.type === "song" ? "歌曲" : p.type === "show" ? "綜藝" : "電影"),
    completedWeek: p.releaseWeek, quality: Math.min(100, Math.round((p.quality || 0) / 10)), marketScore: p.marketScore, revenue: p.revenue, npcCast: p.team || [], original: true,
    creativeType: p.type, direction: p.direction, distributionMode: p.distributionMode, selfParticipation: p.selfParticipation,
  }))].filter((w, i, all) => all.findIndex(other => other.id === w.id) === i);
}
function reception(work) {
  if (Number.isFinite(work.marketScore)) return work.marketScore;
  // Paid work has no market score. Use recorded audience gain only to discuss reach, never invent sales.
  return (work.fans || 0) >= 200 ? 78 : (work.fans || 0) >= 60 ? 62 : 45;
}
function echoCopy(work, stage, records, game) {
  const collaborator = (work.npcCast || []).find(id => NPCS[id] && game.knownPeople?.includes(id)) || null;
  const authored = originalEchoCopy(work, stage.id, records, collaborator);
  if (authored) return authored;
  const name = `《${work.title}》`, medium = work.category === "歌曲" ? "聽" : "看";
  const slow = reception(work) < 60 && work.quality >= 70;
  const mixed = reception(work) >= 75 && records.some(r => r.workId === work.id && r.choice === "mixed");
  const origin = (game.completedWorks || []).find(w => w.id === work.originWorkId);
  const lineage = origin ? `這次合作也接續了《${origin.title}》帶來的窗口，舊作沒有被留在上一頁。` : "";
  const detail = work.storyLegacy?.text || work.directionLabel || (work.original ? "從草稿走到發行的選擇" : "你在製作現場留下的表演");
  let title, text, replies;
  if (stage.id === "opening") {
    title = `${name}第一次離開你的控制`;
    text = `發行初期，${name}開始被不同的人${medium}見。${lineage}有人先注意到呈現，也有人問你最想留下哪一部分。你翻回工作筆記，那裡記著「${detail}」。${reception(work) >= 75 ? "已有的市場回應很亮眼，但成績不會自動替你回答是否滿意。" : "目前的回應還不算熱鬧，這也沒有替作品的一生定案。"}你想怎麼記住現在的感覺？`;
    replies = [`第一次${medium}${name}，還想再給細節一點時間。`, `${name}的完成紀錄在那裡，先談作品本身吧。`, `想知道${name}有哪些地方是主創自己最在意的。`];
  } else if (stage.id === "weeks") {
    title = slow ? `${name}被慢慢找到了` : mixed ? `${name}的成績與你的不甘心` : `${name}還在延續的討論`;
    text = slow ? `幾週後，有人在舊討論裡重新提起${name}。開頭的注意力有限，這次卻有人把「${detail}」講得很具體。一位新觀眾循著那則推薦找來，說自己差點錯過。作品沒有改版，只是遇見它的人變了。`
      : mixed ? `${name}已有亮眼的市場回應，你卻記得自己說過仍有不滿意的部分。你把觀眾喜歡的地方與想修改的段落分開寫：不必否定成功，也不必為了成績假裝毫無遺憾。下一次要延續哪一部分，現在可以由你決定。`
        : `宣傳剛開始的聲音慢慢遠了，${name}仍有人回來${medium}第二次。討論從第一印象轉向「${detail}」，也出現不同意你的選擇的人。你開始看清，作品留下的是一段對話，不只是發行那天的反應。`;
    replies = slow ? [`是別人的推薦把我帶到${name}，晚一點遇見也值得。`, `${name}第一輪很容易錯過，重${medium}才注意到那段細節。`, `這串留著，讓後來的人找得到${name}。`]
      : [`重${medium}${name}，和第一次注意到的不太一樣。`, `${name}有些地方我喜歡，有些仍想討論，兩件事可以一起說。`, `希望下一次作品延續${name}真正有意思的地方。`];
  } else {
    title = `隔了一年，再回到${name}`;
    text = `從完成${name}到現在已經隔了一年。你帶著後來的經驗回${medium}，當時費力的部分有些變得自然，有些仍難以重來。${mixed ? "那份成功與不滿意都還在，但你不必再選一個抹掉另一個。" : slow ? "後來才找到作品的人，也把最初冷清的那段時間接了起來。" : "它不是此刻的全部，卻保留了當時只有你能做出的選擇。"}你想讓它成為下一份工作的起點，還是好好放回這一年的紀錄？`;
    replies = [`一年後又回來${medium}${name}，才發現自己的注意點也變了。`, `${name}是這段創作履歷的一頁，不必每年都用同一把尺量。`, `從${name}認識這位創作者的人，現在仍有理由回來。`];
  }
  const npcId = (work.npcCast || []).find(id => NPCS[id] && game.knownPeople?.includes(id)) || null;
  const npcText = npcId ? stage.id === "opening" ? `${name}完成後再${medium}自己的那一段，會想起一起核對過的細節。謝謝把其他人的工作也留在作品裡。`
    : stage.id === "weeks" ? `${name}最近又有人在聊。我記得的是合作時那些細小的確認；換了觀眾，那些選擇也會被看出另一種意思。`
      : `隔了一年再${medium}${name}，還記得一起工作的那段時間。現在各自多走了一段，當時留下的東西卻還能把人帶回同一頁。` : "";
  const publicTitle = stage.id === "opening" ? `${name}發行後的第一輪討論` : stage.id === "weeks" ? slow ? `${name}被晚到的觀眾重新找到` : `${name}幾週後仍在延續的討論` : `一年後再看${name}`;
  const publicText = stage.id === "opening" ? `${name}已經完成，這串先聊公開作品本身。${lineage}有人先注意到呈現，也有人想多${medium}一次再說感想。一次亮相還不足以概括整份作品。`
    : stage.id === "weeks" ? slow ? `有人從舊討論裡重新找出${name}，又把推薦留給下一個人。第一輪聲量有限，晚來的觀眾卻開始談更具體的細節。` : `${name}發行幾週後，話題逐漸從第一印象變成細節。觀眾對同一段內容有不同理解，作品已經成了一段可以繼續回來的對話。`
      : `距離${name}完成已經一年。重${medium}的人帶著後來的生活回來，注意到的和當時不太一樣。這份作品仍留在公開履歷裡，歡迎留下具體的回看感想。`;
  return { title, text, publicTitle, publicText, summary: text.split(/(?<=。)/).slice(0, 2).join(""), replies, npcId, npcText };
}
function echoEvent(record) {
  const first = record.stage === "opening";
  const outcomes = record.copyVersion === WORK_ECHO_COPY_VERSION ? WORK_ECHO_CHOICE_OUTCOMES[record.copyId?.split(":")[0]] : null;
  return { id: record.id, kind: "職涯事件", persistent: true, routine: false,
    title: record.title, text: record.text, summary: record.summary,
    storyContext: { source: "作品回響", channel: "story", workId: record.workId, npcIds: record.npcId ? [record.npcId] : [], week: record.dueWeek },
    choices: (first ? [
      ["proud", "先記下我真的喜歡的部分", "你沒有急著替整份作品打分，先把值得保留的選擇寫下來。"],
      ["mixed", "成績之外，我仍有想重做的地方", "你承認自己的遺憾。作品受到歡迎和你仍想進步，可以同時成立。"],
      ["quiet", "先讓它存在，不急著定義", "你把這一刻的感受留白，沒有為了回答別人而替自己倉促定案。"],
    ] : [
      ["revisit", "帶著這份作品，再找一個合作窗口", "你決定讓舊作成為下一次討論的材料；若有合適的公開通告，工作信箱會留下可自行安排的試鏡線索。"],
      ["forward", "記下經驗，讓下一份作品走新的方向", "你把能帶走的經驗留下，沒有要求下一份作品重複同一種成功。"],
      ["leave", "今天只回看，不加新的安排", "你把這頁收好。回顧可以只是回顧，不必立刻變成工作。"],
    ]).map(([choice, label, outcome]) => ({ id: choice, label, outcome: outcomes?.[choice] || outcome, effect: { workEcho: { workId: record.workId, stage: record.stage, choice } } })),
  };
}
export function tickWorkEchoes(game = state) {
  game.workEchoes = normalizeWorkEchoes(game.workEchoes);
  const records = game.workEchoes.records;
  for (const work of releasedEchoWorks(game)) for (const stage of STAGES) {
    if (game.week < work.completedWeek + stage.after) continue;
    const id = `work-echo:${work.id}:${stage.id}`;
    let record = records.find(r => r.id === id);
    if (!record) {
      record = { id, workId: work.id, stage: stage.id, dueWeek: work.completedWeek + stage.after, publishedWeek: game.week,
        ...echoCopy(work, stage, records, game), choice: null, resolvedWeek: null, eventQueued: false };
      records.push(record);
      if (record.npcId) recordCharacterMemory(record.npcId, { kind: "shared", key: record.id, value: record.stage, label: record.publicTitle, text: record.npcText, source: "共同作品回響", week: record.dueWeek }, game);
    } else if (!record.resolvedWeek && record.copyVersion !== WORK_ECHO_COPY_VERSION) {
      // Upgrade only unanswered original-work chapters. Answered stories and
      // previously written character memories remain historical records.
      const copy = echoCopy(work, stage, records, game);
      if (copy.copyVersion === WORK_ECHO_COPY_VERSION) {
        Object.assign(record, copy);
        if (game === state) for (const item of [game.activeEvent, ...(game.eventQueue || []), ...(game.queuedEvents || [])]) {
          if (item?.event?.id === id) Object.assign(item.event, echoEvent(record));
        }
      }
    }
    if (!record.eventQueued && !record.resolvedWeek && game === state) {
      const known = [game.activeEvent, ...(game.eventQueue || []), ...(game.queuedEvents || [])].some(item => item?.event?.id === id) || game.eventHistory?.some(item => item.id === id);
      record.eventQueued = known || !!enqueueVisibleEvent(echoEvent(record), "作品回響");
    }
  }
  return records;
}
export function applyWorkEchoEffect(payload = {}, game = state) {
  game.workEchoes = normalizeWorkEchoes(game.workEchoes);
  const record = game.workEchoes.records.find(r => r.workId === payload.workId && r.stage === payload.stage);
  const work = releasedEchoWorks(game).find(w => w.id === payload.workId);
  if (!record || !work || record.resolvedWeek || !validChoices.has(payload.choice)) return { ok: false, message: "這段回響已經記下，或作品目前不在履歷裡。" };
  if (!echoEvent(record).choices.some(c => c.id === payload.choice)) return { ok: false, message: "這個回應不屬於目前的作品階段。" };
  record.choice = payload.choice; record.resolvedWeek = game.week;
  if (record.stage === "opening") {
    // A delayed first conversation still informs an unplayed later chapter.
    for (const later of game.workEchoes.records.filter(r => r.workId === work.id && r.stage !== "opening" && !r.resolvedWeek)) {
      Object.assign(later, echoCopy(work, STAGES.find(s => s.id === later.stage), game.workEchoes.records, game));
      if (game === state) for (const item of [game.activeEvent, ...game.eventQueue, ...game.queuedEvents]) if (item?.event?.id === later.id) Object.assign(item.event, echoEvent(later));
    }
  }
  let opportunity = null;
  if (payload.choice === "revisit" && game === state) {
    const existing = new Set(game.workEchoes.opportunities.filter(o => !o.usedWeek && o.expiresWeek >= game.week).map(o => o.jobId));
    const job = availableJobs().filter(j => j.category === work.category && j.id !== work.jobId && (!game.activeJobs?.[j.id] || game.activeJobs[j.id].stage === "available") && !existing.has(j.id)).sort((a, b) => a.stars - b.stars)[0];
    if (job) {
      opportunity = { id: `work-echo-offer:${work.id}:${record.stage}`, workId: work.id, stage: record.stage, jobId: job.id, offeredWeek: game.week, expiresWeek: game.week + 3, usedWeek: null };
      game.workEchoes.opportunities.push(opportunity);
    }
  }
  return { ok: true, message: opportunity ? `《${work.title}》帶來《${availableJobs().find(j => j.id === opportunity.jobId)?.title}》的試鏡線索，有效至第 ${opportunity.expiresWeek} 週；你可自行安排，作品討論準備＋4。` : `已把這次對《${work.title}》的回應留在作品紀錄。`, opportunity };
}
export function activeWorkEchoOpportunity(jobId, game = state) {
  const works = new Set(releasedEchoWorks(game).map(w => w.id));
  return normalizeWorkEchoes(game.workEchoes).opportunities.find(o => o.jobId === jobId && works.has(o.workId) && !o.usedWeek && o.offeredWeek <= game.week && o.expiresWeek >= game.week) || null;
}
export function workEchoAuditionBonus(jobId, game = state) { return activeWorkEchoOpportunity(jobId, game) ? 4 : 0; }
export function consumeWorkEchoOpportunity(jobId, game = state) {
  const offer = activeWorkEchoOpportunity(jobId, game);
  if (!offer) return false;
  game.workEchoes = normalizeWorkEchoes(game.workEchoes);
  game.workEchoes.opportunities.find(o => o.id === offer.id).usedWeek = game.week;
  return true;
}
export function workEchoRecords(workId, game = state) {
  return normalizeWorkEchoes(game.workEchoes).records.filter(r => r.workId === workId);
}
