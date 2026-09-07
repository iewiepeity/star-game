import { state } from "../core/state.js";
import { managerForAgency } from "../data/managers.js";
import { MANAGER_SCENES } from "../data/manager-scenes.js";
import { enqueueVisibleEvent } from "./event-engine.js";
const clamp = (n) => Math.max(0, Math.min(100, n));
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
  if (s.history.length > 90) s.history = s.history.slice(-90);
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
function interactionScene(manager, type, sceneId) {
  const scenes = MANAGER_SCENES[manager.def.agencyId]?.[type];
  if (!scenes?.length) return null;
  const selected = scenes.find((scene) => scene.id === sceneId);
  if (selected) return selected;
  const recent = manager.state.history.filter((entry) => entry.sceneId && entry.type === type);
  const last = recent.at(-1)?.sceneId;
  // Choose the least recently used scene. Viewing a decision does not consume it.
  return [...scenes].sort((a, b) => {
    const seen = (scene) => recent.findLastIndex((entry) => entry.sceneId === scene.id);
    return seen(a) - seen(b) || Number(a.id === last) - Number(b.id === last);
  })[0];
}
export function managerInteractionDecision(task) {
  const m = ensureManager(), type = task?.payload?.type || "chat",
    scene = m && interactionScene(m, type, task?.payload?.managerSceneId);
  if (!m || !scene) return null;
  if (task?.payload) task.payload.managerSceneId = scene.id;
  const notes = {
    listen: "提高信任與默契，降低經紀人壓力",
    assert: "提高默契與話題企圖，但經紀人壓力略增",
    compromise: "降低雙方壓力，得到下週工作準備",
  };
  return {
    kind: "manager_interaction",
    title: `${m.def.name}｜${scene.title}`,
    text: scene.text,
    choices: scene.choices.map(({ id, label }) => ({ id, label, note: notes[id] })),
  };
}
export function managerInteract(type, choice = "listen", sceneId = null) {
  const m = ensureManager();
  if (!m) return { ok: false, message: "目前沒有固定經紀人。" };
  if (m.state.lastInteractionWeek === state.week)
    return { ok: false, message: "這週已經和經紀人談過一次了。" };
  type = MANAGER_SCENES[m.def.agencyId]?.[type] ? type : "chat";
  const scene = interactionScene(m, type, sceneId);
  choice = scene.choices.some((entry) => entry.id === choice) ? choice : "listen";
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
  Object.assign(m.state.history.at(-1), { choice, type, title: scene.title, sceneId: scene.id });
  return {
    ok: true,
    title: `${m.def.name}｜${scene.title}`,
    message: `${scene.text} ${scene.choices.find((entry) => entry.id === choice).outcome}`,
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
