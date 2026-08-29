import { state } from "../core/state.js";
import { NPCS } from "../data/npcs.js";
import { JOB_CATALOG } from "../data/jobs.js";
import { managerForAgency } from "../data/managers.js";
import { FLAGSHIP_JOB_BEATS, MANAGER_STANCES } from "../data/deepening-content.js";
import { NPC_AUTONOMOUS_BEATS, ROMANCE_STAGE_FLAVOR, WORLD_REACTION_SIGNALS } from "../data/living-world-content.js";
import { careerPhase } from "./career-phases.js";
import { enqueueVisibleEvent } from "./event-engine.js";

const jobById = Object.fromEntries(JOB_CATALOG.map((job) => [job.id, job]));
const cap = (list, size = 40) => list.length > size ? list.slice(-size) : list;

function ensureDeepeningState() {
  state.worldEchoes ??= [];
  state.livingWorldFeed ??= [];
  state.deepeningSeenWorks ??= [];
  state.deepeningSeenBreaches ??= [];
  state.npcAutonomousBeatIndex ??= {};
  state.romanceFlavorState ??= {};
  state.worldSignalHistory ??= [];
  state.managerAdvice ??= null;
  return state;
}

function addFeed(item) {
  ensureDeepeningState();
  const id = item.id || `living-${state.week}-${state.livingWorldFeed.length}`;
  if (state.livingWorldFeed.some((entry) => entry.id === id)) return null;
  state.livingWorldFeed.push({ week: state.week, ...item, id });
  state.livingWorldFeed = cap(state.livingWorldFeed, 50);
  return id;
}

export function queueWorldEcho({ id, dueWeek = state.week + 2, title, text, kind = "世界回聲", source = null } = {}) {
  ensureDeepeningState();
  if (!id || state.worldEchoes.some((echo) => echo.id === id)) return null;
  state.worldEchoes.push({ id, dueWeek, title, text, kind, source, resolved: false });
  return id;
}

function captureWorkEchoes() {
  const queued = [];
  for (const work of state.completedWorks || []) {
    if (state.deepeningSeenWorks.includes(work.id)) continue;
    state.deepeningSeenWorks.push(work.id);
    const flag = FLAGSHIP_JOB_BEATS[work.jobId];
    if (!flag) continue;
    queued.push(queueWorldEcho({
      id: `work-echo:${work.id}`,
      dueWeek: Math.max(state.week + 1, (work.completedWeek || state.week) + 2),
      title: `《${work.title}》沒有在殺青那天結束`,
      text: flag.publicEcho,
      kind: "作品長尾",
      source: work.jobId,
    }));
  }
  const breaches = (state.jobHistory || []).filter((entry) => entry.type === "breached");
  for (const entry of breaches) {
    const key = `${entry.jobId || entry.id || "job"}:${entry.week || state.week}`;
    if (state.deepeningSeenBreaches.includes(key)) continue;
    state.deepeningSeenBreaches.push(key);
    const job = jobById[entry.jobId];
    if (!job) continue;
    queued.push(queueWorldEcho({
      id: `breach-echo:${key}`,
      dueWeek: Math.max(state.week + 1, (entry.week || state.week) + 2),
      title: `《${job.title}》的空缺後來仍被提起`,
      text: `${job.client}重新排好了檔期，但那次未完成仍留在合作紀錄裡。之後的邀約不會只看能力，也會看你怎麼處理承諾。`,
      kind: "履約回聲",
      source: job.id,
    }));
  }
  state.deepeningSeenWorks = cap(state.deepeningSeenWorks, 120);
  state.deepeningSeenBreaches = cap(state.deepeningSeenBreaches, 80);
  return queued.filter(Boolean);
}

function resolveWorldEchoes() {
  const resolved = [];
  for (const echo of state.worldEchoes) {
    if (echo.resolved || echo.dueWeek > state.week) continue;
    echo.resolved = true;
    echo.resolvedWeek = state.week;
    addFeed({ id: `feed:${echo.id}`, type: echo.kind, title: echo.title, text: echo.text });
    enqueueVisibleEvent({
      id: `echo-event:${echo.id}`,
      kind: "跨週事件",
      priority: 72,
      maxDelayWeeks: 4,
      title: echo.title,
      text: echo.text,
      choices: [{ id: "remember", label: "記住這件事留下的後果", outcome: "有些工作會結束，但娛樂圈不會立刻忘記。", effect: { mood: 1 } }],
    }, "世界回聲");
    resolved.push(echo.id);
  }
  state.worldEchoes = state.worldEchoes.filter((echo) => !echo.resolved || state.week - (echo.resolvedWeek || state.week) <= 8);
  return resolved;
}

function tickNpcAutonomousNarratives() {
  if (state.week < 5 || state.week % 6 !== 0) return [];
  const updates = [];
  const ids = Object.keys(NPC_AUTONOMOUS_BEATS);
  // 每六週只推進兩人，避免世界新聞洗版；五年內每位仍會持續前進。
  for (let offset = 0; offset < 2; offset++) {
    const npcId = ids[(Math.floor(state.week / 6) * 2 + offset) % ids.length];
    const pool = NPC_AUTONOMOUS_BEATS[npcId] || [];
    if (!pool.length) continue;
    const index = state.npcAutonomousBeatIndex[npcId] || 0;
    const text = pool[index % pool.length];
    state.npcAutonomousBeatIndex[npcId] = index + 1;
    const npc = NPCS[npcId];
    const id = `npc-life:${npcId}:${index}`;
    addFeed({ id, type: "人物近況", title: `${npc?.name || "業界人物"}也在往前走`, text, npcId });
    // 認識的人才會把近況帶進私人訊息；陌生 NPC 不會因此進通訊錄。
    if ((state.knownPeople || []).includes(npcId)) {
      state.npcMessages.push({ id: `msg:${id}`, npcId, week: state.week, text: `${text} 最近忙完一段之後，對方也順手問了你一句近況。`, read: false, source: "autonomous" });
    }
    updates.push(id);
  }
  return updates;
}

function tickRomanceFlavor() {
  const npcId = state.partnerId;
  if (!npcId || !(state.knownPeople || []).includes(npcId)) return null;
  const stage = state.relationships?.[npcId]?.romance;
  const pool = ROMANCE_STAGE_FLAVOR[stage];
  if (!pool?.length) return null;
  const previous = state.romanceFlavorState[npcId] || {};
  const changed = previous.stage !== stage;
  if (!changed && state.week - (previous.week || 0) < 4) return null;
  const index = changed ? 0 : ((previous.index || 0) + 1) % pool.length;
  const text = pool[index];
  state.romanceFlavorState[npcId] = { stage, week: state.week, index };
  const id = `romance-flavor:${npcId}:${stage}:${state.week}`;
  state.npcMessages.push({ id, npcId, week: state.week, text, read: false, source: "romance" });
  addFeed({ id: `feed:${id}`, type: "關係日常", title: `${NPCS[npcId]?.name || "對方"}與你的日常正在改變`, text, npcId });
  return id;
}

function managerAdviceType() {
  if (!state.currentAgencyId) return null;
  if (state.publicOpinion?.state === "scandal" || state.publicOpinion?.state === "controversial") return "crisis";
  if (state.agencyContractEndWeek && state.agencyContractEndWeek - state.week <= 8) return "renewal";
  const active = Object.values(state.activeJobs || {}).filter((job) => job.stage === "active");
  if (state.fatigue >= 68 || state.health <= 50 || active.length >= 3) return "conservative";
  if (active.length <= 1 && state.health >= 70 && state.fatigue <= 45) return "ambitious";
  return "conservative";
}

function tickManagerAdvice() {
  if (!state.currentAgencyId || state.week % 3 !== 0) return null;
  const type = managerAdviceType(), lines = MANAGER_STANCES[state.currentAgencyId], def = managerForAgency(state.currentAgencyId);
  const text = lines?.[type];
  if (!text || !def) return null;
  const id = `manager-advice:${state.currentAgencyId}:${type}:${state.week}`;
  state.managerAdvice = { id, week: state.week, type, name: def.name, text };
  addFeed({ id: `feed:${id}`, type: "經紀人", title: `${def.name}的本週判斷`, text });
  return id;
}

function strongestWorldSignal() {
  const hidden = Object.entries(state.hidden || {}).filter(([, value]) => value >= 620).sort((a, b) => b[1] - a[1])[0];
  const rep = Object.entries(state.rep || {}).filter(([, value]) => value >= 650).sort((a, b) => b[1] - a[1])[0];
  if (!hidden && !rep) return null;
  if (hidden && (!rep || hidden[1] >= rep[1])) return { group: "hidden", name: hidden[0], value: hidden[1] };
  return { group: "rep", name: rep[0], value: rep[1] };
}

function tickWorldSignal() {
  if (state.week % 4 !== 0) return null;
  const signal = strongestWorldSignal();
  if (!signal) return null;
  const text = WORLD_REACTION_SIGNALS[signal.group]?.[signal.name];
  if (!text) return null;
  const signature = `${signal.group}:${signal.name}`;
  const last = [...state.worldSignalHistory].reverse().find((item) => item.signature === signature);
  if (last && state.week - last.week < 12) return null;
  const item = { id: `world-signal:${signature}:${state.week}`, signature, week: state.week, name: signal.name, text };
  state.worldSignalHistory.push(item);
  state.worldSignalHistory = cap(state.worldSignalHistory, 30);
  addFeed({ id: item.id, type: "世界反應", title: `世界開始用「${signal.name}」記住你`, text });
  return item.id;
}

function updateChapterPressure() {
  const phase = careerPhase();
  state.chapterPressure = { year: phase.year, title: phase.label, goal: phase.goal, pressure: phase.pressure, world: phase.world };
  if (state.week % 13 !== 0) return null;
  const id = `chapter-checkpoint:${phase.year}:${state.week}`;
  addFeed({ id, type: "章節壓力", title: `第 ${phase.year} 年・${phase.label}`, text: `${phase.pressure} 現在回頭看，你這季的安排有沒有仍朝「${phase.goal}」前進？` });
  return id;
}

export function tickDeepeningSystems() {
  ensureDeepeningState();
  const queued = captureWorkEchoes();
  const echoes = resolveWorldEchoes();
  const npc = tickNpcAutonomousNarratives();
  const romance = tickRomanceFlavor();
  const manager = tickManagerAdvice();
  const signal = tickWorldSignal();
  const chapter = updateChapterPressure();
  return { queued, echoes, npc, romance, manager, signal, chapter };
}
