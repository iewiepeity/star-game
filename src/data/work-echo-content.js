import { SONG_WORK_ECHOES } from "./work-echo-song-content.js";
import { SCRIPT_WORK_ECHOES } from "./work-echo-script-content.js";
import { SHOW_WORK_ECHOES } from "./work-echo-show-content.js";

export const WORK_ECHO_COPY_VERSION = 1;
export const ORIGINAL_WORK_ECHOES = {
  song: SONG_WORK_ECHOES,
  script: SCRIPT_WORK_ECHOES,
  show: SHOW_WORK_ECHOES,
};

// These layers describe recorded results, not imagined sales, awards or deals.
// Private choices are deliberately never interpolated into public channels.
export const WORK_ECHO_RECEPTION = {
  opening: {
    strong: "發行紀錄上的市場評分很亮眼。你把成績頁留在旁邊，另開一張空白筆記：受歡迎是已經發生的事，哪些做法值得留下，還得逐項想清楚。",
    steady: "市場評分落在中段，這次既不是無人接住，也還稱不上大放異彩。你沒有把不同意見平均成一句『還可以』，而是分開記下它們在談什麼。",
    slow: "成品的完成度不低，第一輪市場評分卻偏冷。你把這兩項分開看，暫時不替冷清找英雄式的解釋，也不把花過的工夫一筆劃掉。",
    rough: "這次市場回應有限，成品也還有能繼續打磨的地方。你先圈出一項下次做得到的修改，沒有因為一次發行不順，就把整份創作能力判成零分。",
  },
  weeks: {
    strong: "幾週過去，發行時亮眼的市場回應仍是履歷上的一筆實績；眼前的討論卻不是另一張銷量表。你想找的是人們具體記住了什麼，而不是把每則留言都當作成功的續章。",
    steady: "回頭看，中段的市場評分沒有替這些分歧提供標準答案。你把能用來修正工作的意見另存一頁，不需要讓下一份作品一次滿足互相矛盾的期待。",
    slow: "有人在舊串裡重新提起它，讓開頭較冷的作品多了一次被細看、被說明的機會。這不是銷量突然翻盤的證據；你仍把晚到的具體理解，和市場成績分開記著。",
    rough: "初次發行留下的問題並沒有因為時間過去就自動消失。你重讀當時的修改清單，發現有的批評指向同一個接縫；先修一個能確認的問題，比急著證明所有人都看錯更有用。",
  },
  anniversary: {
    strong: "當年的好成績沒有被抹掉，但它也不該變成每次創作都得交出的保證。你把這份作品放回它自己的年份，容許下一份在不同地方冒險。",
    steady: "一年前的市場評分依舊是那個數字，如今你能說明的卻比數字多。哪些選擇讓作品站穩，哪些只是當時順手採用的辦法，終於能分開談。",
    slow: "開頭冷清、完成度卻不差，這兩件事仍同時留在紀錄裡。回看不必硬補一場遲來的翻紅；能辨認當年做對了什麼，已經是一種比替自己辯護更清楚的收穫。",
    rough: "你沒有替當年的生澀修飾成天才被誤解，也沒有因此收回它曾經完成的事實。現在重看那些接縫，至少知道下次該在哪一步多停一下。",
  },
};

export const WORK_ECHO_PRIVATE_CHOICES = {
  weeks: {
    proud: "你翻到發行初期寫下的那一頁，當時先留下了自己真心喜歡的部分。如今重看，那份喜歡可以更具體，也可以有修正，不必為了前後一致而停止思考。",
    mixed: "你還記得自己在第一輪回響裡承認過不滿意。那份遺憾不會因為別人的肯定而失效；你把想重做的地方和已經成立的選擇分開，不必拿其中一邊否定另一邊。",
    quiet: "初次發行時，你選擇先不替感受定名。那頁空白不是忘記作答；現在多了一點距離，你仍可以只留下一個觀察，不急著總結整份作品。",
  },
  anniversary: {
    proud: "去年先被你記下的，是自己真正喜歡的地方。如今有些仍讓你點頭，有些已經會採取不同做法；喜歡過一個選擇，不代表必須永遠使用它。",
    mixed: "那份曾被你說出口的不滿意還找得到。隔著一年，你終於能把當時的限制和自己的盲點拆開；不是所有遺憾都需要補拍、重錄或重新發行才能放下。",
    quiet: "你當時沒有急著替作品定義成敗。一年後翻回來，這份暫不定案替你留下一點空間：可以承認它的重要，也不必立刻把它推成代表自己的唯一答案。",
  },
};

// Outcomes remain reflections only. Opportunity creation still belongs to the
// existing work-echo effect and never becomes an automatic booking or reward.
export const WORK_ECHO_CHOICE_OUTCOMES = {
  song: {
    proud: "你在聆聽筆記上標出願意保留的聲音。不是把整首先蓋上滿分印章，而是終於能具體說出，自己為什麼想讓那一刻被聽見。",
    mixed: "你把還想修改的聽感另列一欄，沒有立刻撤下成品。作品已經有人聽見，你仍可以承認那個停頓、那層伴奏或那句話還有別的做法。",
    quiet: "你關掉反覆更新的通知，先讓這首歌留在公開頁上。今天不用找一句話代表全部心情；等想聽的時候，再把耳機戴起來。",
    revisit: "你把作品連結和一項具體的聲音選擇整理好，準備作為合作討論的材料。若有合適通告，工作信箱會留下試鏡線索；寄出想法不等於已經排進演出。",
    forward: "你保留這次學到的聆聽方法，在下一份草稿旁留出新的空間。下一首不必擁有相同節拍，也不必負責替上一首完成所有人的期待。",
    leave: "你讓最後一個聲音播完，沒有馬上建立新企劃。今天只是回來聽一次，這段時間不需要再折算成進度。",
  },
  script: {
    proud: "你圈出一個自己仍相信的敘事選擇，寫下它改變了什麼。不是替每場戲辯護，而是知道下一次遇到類似取捨，哪條線值得守住。",
    mixed: "你把還不夠成立的轉折移到修改筆記，不急著用另一種解說補上。承認成品有缺口，不等於否認那些已經傳達出去的部分。",
    quiet: "你把評論頁收起來，先保留作品原來的結尾。不是每次被問到滿不滿意，都得當場提出一個比作品更完整的答案。",
    revisit: "你整理作品連結與能談清楚的一項敘事經驗，留作合作討論。若有符合條件的公開通告，工作信箱會提供試鏡線索，是否安排仍由你決定。",
    forward: "你把真正有用的經驗抄到新的空白頁，沒有把整套人物與節奏照搬過去。下一個故事可以從別的問題開始，而不是再證明同一個答案。",
    leave: "你合上回看筆記，讓人物暫時停在作品已經寫下的位置。沒有新增續集，也沒有替今天安排改稿；回看本身就可以是這次的全部。",
  },
  show: {
    proud: "你記下一個節目確實接住人的方式，並把它和熱鬧的表面分開。下次未必要重做同一單元，但可以記得，那份尊重是怎麼留在成品裡的。",
    mixed: "你把還想調整的資訊與節奏列出來，沒有用更多效果音替它辯護。對節目仍有不滿意，可以是一份清楚的製作筆記，不必變成對整次工作的否定。",
    quiet: "你暫時停下追留言的手，讓節目自己留在觀眾的時間裡。今天不用決定它應該被叫作陪伴、娛樂或實驗，先承認它已經完成。",
    revisit: "你整理一段公開內容與一項可說明的節目設計，留給下一次合作討論。工作信箱若出現合適試鏡線索，你再自行安排，現在並沒有替任何人答應新錄影。",
    forward: "你在下一張企劃紙上寫下想換一種方式處理的問題。留下經驗，不代表必須留住原來的梗、來賓位置或每一段等待。",
    leave: "你讓回看停在這裡，沒有把一則留言立刻改成新單元。今天可以只是想起這份節目，然後把時間交回自己的生活。",
  },
};

export function originalEchoRoute(work) {
  if (!work.original && !work.creativeProjectId) return null;
  const type = work.creativeType || (work.category === "歌曲" ? "song" : work.category === "綜藝" ? "show" : ["電影", "電視劇"].includes(work.category) ? "script" : null);
  const pool = ORIGINAL_WORK_ECHOES[type]?.[work.direction];
  return pool ? { type, direction: work.direction, pool } : null;
}

function seedIndex(value, length) {
  let hash = 0;
  for (const char of String(value)) hash = (Math.imul(hash, 31) + char.codePointAt(0)) >>> 0;
  return hash % length;
}

export function selectOriginalEcho(work, stage, records) {
  const route = originalEchoRoute(work), pool = route?.pool[stage];
  if (!pool?.length) return null;
  const prefix = `${route.type}:${route.direction}:${stage}:`;
  const copyId = pack => `${prefix}${pack.id}`;
  const previous = records.find(record => record.workId === work.id && record.stage === stage);
  const saved = pool.find(pack => copyId(pack) === previous?.copyId);
  if (saved) return { ...route, pack: saved, copyId: copyId(saved) };
  const history = records.filter(record => record.workId !== work.id && record.copyId?.startsWith(prefix));
  const counts = pool.map(pack => history.filter(record => record.copyId === copyId(pack)).length);
  const min = Math.min(...counts);
  const last = pool.findIndex(pack => copyId(pack) === history.at(-1)?.copyId);
  const start = last >= 0 ? (last + 1) % pool.length : seedIndex(`${work.id}:${stage}`, pool.length);
  const index = Array.from({ length: pool.length }, (_, i) => (start + i) % pool.length).find(i => counts[i] === min);
  return { ...route, pack: pool[index], copyId: copyId(pool[index]) };
}

export function originalEchoCopy(work, stage, records, npcId) {
  const selected = selectOriginalEcho(work, stage, records);
  if (!selected) return null;
  const fill = text => text.replaceAll("{work}", () => `《${work.title}》`);
  const { pack, copyId } = selected;
  const score = Number.isFinite(work.marketScore) ? work.marketScore : null;
  const reception = score === null ? "" : WORK_ECHO_RECEPTION[stage][score >= 75 ? "strong" : score >= 60 ? "steady" : work.quality >= 70 ? "slow" : "rough"];
  const openingChoice = records.find(record => record.workId === work.id && record.stage === "opening")?.choice;
  const reflection = WORK_ECHO_PRIVATE_CHOICES[stage]?.[openingChoice] || "";
  const distribution = stage === "opening" ? work.distributionMode === "independent"
    ? "這份作品由你自主發行，帳面上的製作支出也由自己承擔。你把宣傳建議先放進待考慮清單，沒有在回留言時替自己答應另一筆花費。"
    : work.distributionMode === "company" ? "這份作品透過公司合作完成發行。你把能談的作品細節與需要先確認的合作事項分開，不讓一則公開回覆變成自己沒有答應過的承諾。" : "" : "";
  const participation = stage === "anniversary" && work.selfParticipation === false
    ? "這次你留在幕後，回看的重點是自己做出的創作與製作選擇，而不是把畫面或聲音裡的每個表現都算成自己的演出。" : "";
  const text = [fill(pack.text), reception, reflection, distribution, participation].filter(Boolean).join("\n\n");
  return {
    copyVersion: WORK_ECHO_COPY_VERSION, copyId,
    title: fill(pack.title), text, summary: fill(pack.text).split(/(?<=。)/).slice(0, 2).join(""),
    publicTitle: fill(pack.publicTitle), publicText: fill(pack.publicText), replies: pack.replies.map(fill),
    npcId, npcText: npcId ? fill(pack.npcText) : "",
  };
}
