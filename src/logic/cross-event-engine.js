import { state } from "../core/state.js";
import { enqueueVisibleEvent } from "./event-engine.js";
import { JOB_BY_ID } from "../data/jobs.js";
import { NPCS } from "../data/npcs.js";

function already(key) {
  state.crossEventHistory ??= [];
  return state.crossEventHistory.includes(key);
}
function queue(key, event) {
  if (already(key)) return null;
  state.crossEventHistory.push(key);
  enqueueVisibleEvent({ ...event, id: `cross-${key}`, kind: "跨事件", priority: 84, maxDelayWeeks: 5 }, "跨事件");
  return event.id;
}

export function tickCrossEventChains() {
  const latestWork = [...(state.completedWorks || [])].reverse().find((work) => state.week - work.completedWeek <= 4);
  if (latestWork?.jobId && latestWork.storyChoice) {
    const job = JOB_BY_ID[latestWork.jobId], npcId = latestWork.npcCast?.find((id) => NPCS[id]), npc = NPCS[npcId];
    const key = `flagship-${latestWork.id}`;
    return queue(key, {
      title: `${job?.title || latestWork.title}，殺青之後才真正開始`,
      text: `你在現場選擇「${latestWork.storyChoice}」留下的版本被剪進正式宣傳。${npc ? `${npc.name}傳來訊息：觀眾已經在討論你們那場戲。` : "宣傳團隊要求你決定接下來要怎麼說這部作品。"}`,
      choices: [
        { id: "team", label: "把焦點放回作品與團隊", outcome: "合作名單上的人記住你沒有獨占掌聲。", effect: { rep: "業界評價", value: 7, rep2: "可信度", value2: 4 } },
        { id: "spotlight", label: "抓住這波聲量主推自己", outcome: "你的名字衝上搜尋，但團隊也開始重新衡量你。", effect: { rep: "話題度", value: 10, rep2: "爭議度", value2: 3, fame: 3 } },
      ],
    });
  }
  const creative = [...(state.creativeProjects || [])].reverse().find((p) => ["sold", "released"].includes(p.status) && state.week - (p.saleWeek || p.releaseWeek) >= 1);
  if (creative) {
    const key = `creative-after-${creative.id}`;
    const sold = creative.status === "sold";
    return queue(key, {
      title: sold ? `《${creative.title}》被改成了另一種樣子` : `《${creative.title}》第一批真實評價`,
      text: sold ? "買方公開的新版本偏離你原本的創作方向。合約合法，但觀眾仍把作品和你的名字連在一起。" : "作品發行後，核心觀眾與大眾數據出現不同答案。你必須決定下一輪要聽誰的。",
      choices: sold ? [
        { id: "credit", label: "接受改編並保留署名", outcome: "你承認出售權利的代價，也讓更多人看見原始企劃。", effect: { rep: "商業價值", value: 8 } },
        { id: "control", label: "公開說明原始創作立場", outcome: "創作者認同你的界線，買方則把這次發言記進合作紀錄。", effect: { rep: "業界評價", value: 6, rep2: "爭議度", value2: 3 } },
      ] : [
        { id: "core", label: "守住核心觀眾", outcome: "作品沒有迎合所有人，卻慢慢形成忠實作品粉。", effect: { rep: "可信度", value: 8, fans: 25 } },
        { id: "mass", label: "追加大眾宣傳版本", outcome: "新剪輯帶來更廣觸及，也稀釋了一點原本的稜角。", effect: { rep: "商業價值", value: 8, fans: 40 } },
      ],
    });
  }
  const manager = state.managerState;
  if (manager?.history?.length >= 2 && manager.stress >= 55) {
    const key = `manager-pressure-${Math.ceil(state.week / 13)}`;
    return queue(key, { title: "經紀人沒有回覆的那一晚", text: "連續幾週的工作、邀約與臨時危機都堆在同一張桌上。這次不是能力問題，而是你們要不要重新分配責任。", choices: [{ id: "reset", label: "取消一項曝光，重新排優先順序", outcome: "壓力下降，團隊開始把『不做什麼』也當成專業決策。", effect: { mood: 5, rep: "可信度", value: 3 } }, { id: "push", label: "撐過這波再休息", outcome: "眼前機會被接住，疲勞與關係成本也被留到之後。", effect: { fame: 3, fatigue: 8, rep: "話題度", value: 5 } }] });
  }
  return null;
}
