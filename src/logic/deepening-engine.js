import { state } from "../core/state.js";
import { NPCS } from "../data/npcs.js";
import { JOB_CATALOG } from "../data/jobs.js";
import { managerForAgency } from "../data/managers.js";
import { FLAGSHIP_JOB_BEATS, MANAGER_STANCES } from "../data/deepening-content.js";
import { NPC_AUTONOMOUS_BEATS, ROMANCE_STAGE_FLAVOR, WORLD_REACTION_SIGNALS } from "../data/living-world-content.js";
import { NPC_LONGFORM_CHAPTERS, NPC_ROMANCE_VOICES } from "../data/longform-content.js";
import { careerPhase, applyCareerDoctrineTick } from "./career-phases.js";
import { enqueueVisibleEvent } from "./event-engine.js";
import { tickNpcInvitation, tickEnsembleScene } from "./lived-story-engine.js";

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
  state.contentExposure ??= {};
  state.recentNarrativeIds ??= [];
  state.npcLongformProgress ??= {};
  return state;
}

export function exposureCount(id) {
  ensureDeepeningState();
  return state.contentExposure[id] || 0;
}

export function recordExposure(id) {
  if (!id) return 0;
  ensureDeepeningState();
  state.contentExposure[id] = exposureCount(id) + 1;
  state.recentNarrativeIds.push(id);
  state.recentNarrativeIds = cap(state.recentNarrativeIds, 24);
  return state.contentExposure[id];
}

// 優先挑選曝光較少、最近沒有出現的內容；同次數時維持資料順序，讓 Seed 回放仍可重現。
export function leastExposed(items, idOf = (item) => item.id) {
  ensureDeepeningState();
  return [...items].sort((a, b) => {
    const aId = idOf(a), bId = idOf(b);
    const recentA = state.recentNarrativeIds.includes(aId) ? 1000 : 0;
    const recentB = state.recentNarrativeIds.includes(bId) ? 1000 : 0;
    return exposureCount(aId) + recentA - exposureCount(bId) - recentB;
  })[0] || null;
}

function addFeed(item) {
  ensureDeepeningState();
  const id = item.id || `living-${state.week}-${state.livingWorldFeed.length}`;
  if (state.livingWorldFeed.some((entry) => entry.id === id)) return null;
  state.livingWorldFeed.push({ week: state.week, ...item, id });
  state.livingWorldFeed = cap(state.livingWorldFeed, 50);
  recordExposure(id);
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
    const candidates = pool.map((text, beatIndex) => ({ id: `npc-life:${npcId}:${beatIndex}`, text, beatIndex }));
    const selected = leastExposed(candidates) || candidates[index % pool.length];
    const text = selected.text;
    state.npcAutonomousBeatIndex[npcId] = index + 1;
    const npc = NPCS[npcId];
    const id = `${selected.id}:cycle-${Math.floor(index / pool.length)}`;
    addFeed({ id, type: "人物近況", title: `${npc?.name || "業界人物"}也在往前走`, text, npcId });
    // 認識的人才會把近況帶進私人訊息；陌生 NPC 不會因此進通訊錄。
    if ((state.knownPeople || []).includes(npcId)) {
      state.npcMessages.push({ id: `msg:${id}`, npcId, week: state.week, text: `${text} 最近忙完一段之後，對方也順手問了你一句近況。`, read: false, source: "autonomous" });
    }
    updates.push(id);
  }
  return updates;
}

function tickNpcLongform() {
  if (state.week < 14 || state.week % 5 !== 0) return null;
  const known = (state.knownPeople || []).filter((id) => NPC_LONGFORM_CHAPTERS[id]?.length);
  if (!known.length) return null;
  const candidates = known.flatMap((npcId) => {
    const progress = state.npcLongformProgress[npcId] || 0;
    const chapter = NPC_LONGFORM_CHAPTERS[npcId][progress];
    return chapter ? [{ npcId, chapter, id: `npc-long:${npcId}:${chapter.id}` }] : [];
  });
  const selected = leastExposed(candidates);
  if (!selected) return null;
  const { npcId, chapter, id } = selected;
  const npc = NPCS[npcId];
  enqueueVisibleEvent({
    id,
    kind: "人物事件",
    priority: 78,
    maxDelayWeeks: 10,
    title: `${npc.name}・${chapter.title}`,
    text: chapter.text,
    beats: chapter.beats,
    cast: [npcId],
    choices: chapter.choices.map((choice) => ({
      ...choice,
      effect: { ...choice.effect, npc: npcId, flag: `${id}:${choice.id}` },
      followUp: choice.followUp ? {
        ...choice.followUp,
        event: {
          id: `${id}:${choice.id}:follow-up`,
          kind: "人物後續",
          title: `${npc.name}・${choice.followUp.title}`,
          text: choice.followUp.text,
          beats: [
            { label: "數週之後", text: choice.followUp.text },
            { label: "被記住的選擇", text: `對方記得你當時選擇「${choice.label}」，所以這次回來找的人仍然是你。` },
          ],
          outcome: choice.followUp.outcome,
          effect: { ...choice.followUp.effect, npc: npcId, flag: `${id}:${choice.id}:resolved` },
        },
      } : null,
    })),
  }, "人物跨年主線");
  state.npcLongformProgress[npcId] = (state.npcLongformProgress[npcId] || 0) + 1;
  addFeed({ id: `feed:${id}`, type: "人物邀請", title: `${npc.name}希望你參與接下來的決定`, text: chapter.text, npcId });
  return id;
}

function tickRomanceFlavor() {
  const npcId = state.partnerId;
  if (!npcId || !(state.knownPeople || []).includes(npcId)) return null;
  const stage = state.relationships?.[npcId]?.romance;
  const personal = NPC_ROMANCE_VOICES[npcId]?.[stage];
  const pool = personal ? [personal, ...(ROMANCE_STAGE_FLAVOR[stage] || [])] : ROMANCE_STAGE_FLAVOR[stage];
  if (!pool?.length) return null;
  const previous = state.romanceFlavorState[npcId] || {};
  const changed = previous.stage !== stage;
  if (!changed && state.week - (previous.week || 0) < 4) return null;
  const candidates = pool.map((text, index) => ({ id: `romance:${npcId}:${stage}:${index}`, text, index }));
  const selected = leastExposed(candidates);
  const index = selected.index;
  const text = selected.text;
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
  applyCareerDoctrineTick();
  const queued = captureWorkEchoes();
  const echoes = resolveWorldEchoes();
  const npc = tickNpcAutonomousNarratives();
  const longform = tickNpcLongform();
  const romance = tickRomanceFlavor();
  const manager = tickManagerAdvice();
  const signal = tickWorldSignal();
  const chapter = updateChapterPressure();
  const invitation = tickNpcInvitation();
  const ensemble = tickEnsembleScene();
  return { queued, echoes, npc, longform, romance, manager, signal, chapter, invitation, ensemble };
}
