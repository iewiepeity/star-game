import { state } from "../core/state.js";
import { managerForAgency } from "../data/managers.js";
import { enqueueVisibleEvent } from "./event-engine.js";
const clamp = (n) => Math.max(0, Math.min(100, n));
const MANAGER_SCENES = {
  starlight: {
    chat: [
      "凌晨還亮著的行程表",
      "許芮安把已經刪掉三份的行程表推過來，問你真正捨不得放掉的是工作，還是證明自己的感覺。",
    ],
    career: [
      "五年不能只用忙來計算",
      "她把作品、健康與市場位置放在同一張圖上，要你選擇下一季究竟先守代表作還是曝光。",
    ],
    apologize: [
      "危機不是一句道歉就結束",
      "她沒有罵人，只要求把受影響的合作方、粉絲與工作人員逐一列出。",
    ],
  },
  mirror: {
    chat: [
      "劇本之外的沉默",
      "沈靜禾帶來兩份條件相近的劇本，真正想問的卻是你最近是否還記得自己為什麼想演戲。",
    ],
    career: [
      "不是每個好角色都該接",
      "她用紅筆圈出三份作品的代價，逼你在安全履歷與可能改變定位的角色之間選擇。",
    ],
    apologize: [
      "專業信任要用下一次證明",
      "她不接受漂亮聲明，只問你打算如何讓下一個劇組相信同樣的事不會再發生。",
    ],
  },
  clearvoice: {
    chat: [
      "三個群組同時安靜下來",
      "韓知勳難得把手機扣在桌上，說市場正在追著你跑，但你的身體與作品不一定跟得上。",
    ],
    career: [
      "下一首歌要留下什麼",
      "他列出舞臺、串流與創作三條路，要求你選一條願意為它放棄部分曝光的方向。",
    ],
    apologize: [
      "熱搜可以買，信任不行",
      "他把即將上線的宣傳全部暫停，讓你決定先搶回聲量，還是先修復可信度。",
    ],
  },
  tide: {
    chat: [
      "玩梗玩到哪裡要踩煞車",
      "羅沐晴把本週留言牆投到大螢幕，熱門的不一定適合延續，安靜的反應也可能藏著真正機會。",
    ],
    career: [
      "把一次亮眼變成長期位置",
      "她拿出三個延伸企劃，問你想成為被記住的人，還是每週都有新梗的人。",
    ],
    apologize: [
      "不要讓危機變成下一支企劃",
      "她已經想好十種回應，但先把簡報關掉，要求你說出最不方便承認的那一部分。",
    ],
  },
};
export function ensureManager() {
  if (!state.currentAgencyId) return null;
  const def = managerForAgency(state.currentAgencyId);
  if (!def) return null;
  state.managerState ??= {};
  if (state.managerState.managerId !== def.id)
    state.managerState = {
      managerId: def.id,
      name: def.name,
      agencyId: def.agencyId,
      trust: def.initialTrust,
      stress: def.initialStress,
      rapport: 30,
      lastInteractionWeek: 0,
      lastEventWeek: 0,
      history: [],
    };
  state.managerState.name=def.name;
  state.managerState.chemistry=state.managerState.rapport;
  return { def, state: state.managerState };
}
export function adjustManager({
  trust = 0,
  stress = 0,
  rapport = 0,
  source = "事件",
} = {}) {
  const m = ensureManager();
  if (!m) return null;
  const s = m.state;
  s.trust = clamp(s.trust + trust);
  s.stress = clamp(s.stress + stress);
  s.rapport = clamp(s.rapport + rapport);
  s.chemistry = s.rapport;
  s.history.push({ week: state.week, trust, stress, rapport, source });
  if (s.history.length > 30) s.history = s.history.slice(-30);
  return s;
}
export function managerRelationshipLabel() {
  const m = ensureManager();
  if (!m) return "尚未有經紀人";
  const s = m.state;
  if (s.trust >= 80 && s.rapport >= 65) return "高度默契";
  if (s.trust >= 65) return "信任穩定";
  if (s.trust >= 45) return "磨合中";
  if (s.trust >= 25) return "關係緊繃";
  return "信任危機";
}
export function managerInteractionDecision(task) {
  const m = ensureManager(),
    type = task?.payload?.type || "chat",
    scene = m && MANAGER_SCENES[m.def.agencyId]?.[type];
  if (!m || !scene) return null;
  return {
    kind: "manager_interaction",
    title: `${m.def.name}｜${scene[0]}`,
    text: scene[1],
    choices: [
      {
        id: "listen",
        label: "先聽完對方真正擔心的事",
        note: "提高信任與默契，降低經紀人壓力",
      },
      {
        id: "assert",
        label: "把自己的方向說清楚",
        note: "提高默契與話題企圖，但經紀人壓力略增",
      },
      {
        id: "compromise",
        label: "一起訂出本週可執行的折衷",
        note: "降低雙方壓力，得到下週工作準備",
      },
    ],
  };
}
export function managerInteract(type, choice = "listen") {
  const m = ensureManager();
  if (!m) return { ok: false, message: "目前沒有固定經紀人。" };
  if (m.state.lastInteractionWeek === state.week)
    return { ok: false, message: "這週已經和經紀人談過一次了。" };
  const scene =
    MANAGER_SCENES[m.def.agencyId]?.[type] || MANAGER_SCENES.starlight.chat;
  m.state.lastInteractionWeek = state.week;
  let result;
  if (choice === "assert") {
    result = { trust: 1, rapport: 5, stress: 2, source: "坦白職涯主張" };
    state.rep.話題度 = Math.min(1000, (state.rep.話題度 || 0) + 2);
  } else if (choice === "compromise") {
    result = { trust: 3, rapport: 3, stress: -6, source: "共同調整安排" };
    state.managerPrepUntil = state.week + 1;
  } else
    result =
      type === "apologize"
        ? { trust: 6, rapport: 3, stress: -7, source: "危機後傾聽" }
        : type === "career"
          ? { trust: 4, rapport: 5, stress: -4, source: "職涯會談" }
          : { trust: 3, rapport: 4, stress: -3, source: "日常聯絡" };
  adjustManager(result);
  m.state.history.at(-1).choice = choice;
  m.state.history.at(-1).title = scene[0];
  return {
    ok: true,
    title: `${m.def.name}｜${scene[0]}`,
    message: `${scene[1]} 你選擇了${choice === "assert" ? "把方向說清楚" : choice === "compromise" ? "一起訂出折衷方案" : "先聽完對方真正擔心的事"}；這次談話會留在你們之後的合作裡。`,
  };
}
export function managerAuditionModifier(job) {
  const m = ensureManager();
  if (!m || !job) return 0;
  const recommended = (state.agencyJobOffers || []).some(
    (o) =>
      o.jobId === job.id &&
      o.agencyId === state.currentAgencyId &&
      o.expiresWeek >= state.week,
  );
  if (!recommended) return 0;
  const base = m.def.support?.auditionPrepBonus || 0,
    relationship = 0.7 + m.state.trust / 200 + m.state.rapport / 500;
  return Math.max(0, Math.min(8, Math.round(base * relationship)));
}
export function managerWeeklyBrief() {
  const m = ensureManager();
  if (!m) return null;
  const offers = (state.agencyJobOffers || []).filter(
      (o) =>
        o.agencyId === state.currentAgencyId && o.expiresWeek >= state.week,
    ),
    active = Object.values(state.activeJobs || {}).filter(
      (j) => j.stage === "active",
    ),
    urgent = active.filter(
      (j) => j.deadlineWeek - state.week <= 1 && j.remainingSessions > 0,
    ),
    items = [];
  if (offers.length)
    items.push(
      `已整理 ${offers.length} 份工作邀約，最晚可看到第 ${Math.max(...offers.map((o) => o.expiresWeek))} 週。`,
    );
  else items.push("本週暫無合適的新邀約，會繼續篩選，不拿爛案硬塞信箱。");
  if (urgent.length)
    items.push(
      `${urgent.length} 份通告接近期限，還有 ${urgent.reduce((sum, j) => sum + j.remainingSessions, 0)} 次工作要完成。`,
    );
  else if (active.length)
    items.push(`${active.length} 份通告執行中，目前沒有迫近的違約風險。`);
  else items.push("目前沒有執行中的正式通告，可以留空檔給試鏡、訓練或休息。");
  if (state.fatigue >= 70 || state.health <= 45)
    items.push(
      `疲勞 ${state.fatigue}、健康 ${state.health}；建議本週優先安排休息。`,
    );
  else if (
    state.publicOpinion?.state === "scandal" ||
    state.publicOpinion?.state === "controversial"
  )
    items.push("輿論正在升溫，新的公開發言與合作需要先做風險確認。");
  else items.push("目前身心與輿論風險可控，行程仍由你最後決定。");
  return {
    headline: urgent.length ? "先處理迫近期限" : "本週安排已整理",
    items,
  };
}
export function tickManager() {
  const m = ensureManager();
  if (!m) return null;
  const s = m.state,
    op = state.publicOpinion?.state || "neutral";
  let trust = 0,
    stress = -1;
  if (op === "scandal") {
    trust -= 2;
    stress += 10;
  } else if (op === "controversial") {
    trust -= 1;
    stress += 5;
  } else if (op === "viral") {
    trust += 1;
    stress += 3;
  } else if (op === "loved") trust += 1;
  const breaches = (state.jobHistory || []).filter(
    (x) => x.week === state.week && x.type === "breached",
  ).length;
  if (breaches) {
    trust -= breaches * 4;
    stress += breaches * 8;
  }
  const completed = (state.jobHistory || []).filter(
    (x) => x.week === state.week && x.type === "completed",
  ).length;
  if (completed) {
    trust += Math.min(3, completed);
    stress -= Math.min(3, completed);
  }
  adjustManager({ trust, stress, source: "每週工作狀態" });
  const key = `manager:${state.week}`;
  if (
    s.lastEventWeek !== state.week &&
    s.stress >= 75 &&
    !state.eventQueue.some((x) => x.event?.id === key)
  ) {
    enqueueVisibleEvent(
      {
        id: key,
        kind: "人物事件",
        title: `${m.def.name}｜我們真的要談一下`,
        text: `${m.def.name}把行程表放到桌上。最近的工作與輿論讓經紀人的壓力明顯升高，對方想確認你到底打算怎麼走下去。`,
        choices: [
          {
            id: "listen",
            label: "先聽對方把話說完",
            outcome: "你們重新對齊了工作節奏。",
            effects: [{ rep: "可信度", value: 6 }],
            effect: { mood: 2 },
          },
          {
            id: "push",
            label: "我知道風險，但我想繼續衝",
            outcome: "經紀人沒有阻止你，只提醒你要承擔後果。",
            effects: [
              { rep: "話題度", value: 6 },
              { rep: "爭議度", value: 3 },
            ],
            effect: { fame: 2 },
          },
        ],
      },
      "經紀人",
    );
    s.lastEventWeek = state.week;
  }
  return s;
}
