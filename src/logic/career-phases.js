import { state } from "../core/state.js";
import { YEAR_CHAPTERS } from "../data/deepening-content.js";
import { enqueueVisibleEvent } from "./event-engine.js";

export const CAREER_PHASES = Object.freeze(YEAR_CHAPTERS.map((chapter) => Object.freeze({
  year: chapter.year,
  label: chapter.title,
  goal: chapter.goal,
  pressure: chapter.pressure,
  world: chapter.world,
})));

export function careerPhase() {
  return CAREER_PHASES[Math.min(4, Math.max(0, Math.floor((state.week - 1) / 52)))];
}

export function queueCareerPhaseEvent() {
  const phase = careerPhase(), startWeek = (phase.year - 1) * 52 + 1;
  state.careerPhaseHistory ??= [];
  if (state.week !== startWeek || state.careerPhaseHistory.includes(phase.year)) return null;
  state.careerPhaseHistory.push(phase.year);
  const commitmentChoices = phase.year === 2 ? [
    { id: "screen", label: "把半年留給影視表演", outcome: "高階的其他路線暫時讓路，這次選擇會真正關上一些門。", effect: { careerCommitment: "screen", commitmentLabel: "影視表演", mood: 2 } },
    { id: "music", label: "把半年留給音樂作品", outcome: "高階的其他路線暫時讓路，這次選擇會真正關上一些門。", effect: { careerCommitment: "music", commitmentLabel: "音樂作品", mood: 2 } },
    { id: "media", label: "把半年留給主持綜藝", outcome: "高階的其他路線暫時讓路，這次選擇會真正關上一些門。", effect: { careerCommitment: "media", commitmentLabel: "主持綜藝", mood: 2 } },
    { id: "commercial", label: "把半年留給商業形象", outcome: "高階的其他路線暫時讓路，這次選擇會真正關上一些門。", effect: { careerCommitment: "commercial", commitmentLabel: "商業形象", mood: 2 } },
  ] : null;
  const event = {
    id: `career-phase-${phase.year}`,
    kind: "年度章節",
    priority: 96,
    maxDelayWeeks: 3,
    title: `第 ${phase.year} 年・${phase.label}`,
    text: `${phase.world} 今年的壓力是：${phase.pressure} 核心目標不是把所有事做完，而是「${phase.goal}」。`,
    choices: commitmentChoices || [
      { id: "protect", label: "先寫下今年最想守住的事", outcome: "這句話被留在章節首頁；之後碰到衝突時，遊戲會再把它拿回你面前。", effect: { mood: 4, rep: "可信度", value: 2 } },
      { id: "reach", label: "先寫下今年最想拿到的東西", outcome: "目標被寫得很具體。接下來的機會與代價，也會因此更容易比較。", effect: { rep: "話題度", value: 2, fame: 1 } },
    ],
  };
  enqueueVisibleEvent(event, "年度章節");
  return event.id;
}
