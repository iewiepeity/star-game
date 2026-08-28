import { state } from "../core/state.js";
import { enqueueVisibleEvent } from "./event-engine.js";

export const CAREER_PHASES = [
  { year: 1, label: "被看見以前", goal: "建立能力、人脈與第一批履歷", world: "公開徵選最多，業界仍把你視為可替換的新人。" },
  { year: 2, label: "名字開始被記住", goal: "建立主路線並爭取穩定合作", world: "邀約增加，品牌開始觀察你的公眾形象。" },
  { year: 3, label: "選擇成為哪種藝人", goal: "形成代表作、承擔選擇的代價", world: "競爭者與市場會針對你的定位做出反應。" },
  { year: 4, label: "掌握作品主導權", goal: "經營團隊、原創與跨域影響力", world: "後台決策、合約與製作權成為新的戰場。" },
  { year: 5, label: "留下什麼", goal: "完成旗艦作品並決定長期關係", world: "所有累積的作品、關係與輿論會共同收束結局。" },
];
export function careerPhase() { return CAREER_PHASES[Math.min(4, Math.floor((state.week - 1) / 52))]; }
export function queueCareerPhaseEvent() {
  const phase = careerPhase(), startWeek = (phase.year - 1) * 52 + 1;
  state.careerPhaseHistory ??= [];
  if (state.week !== startWeek || state.careerPhaseHistory.includes(phase.year)) return null;
  state.careerPhaseHistory.push(phase.year);
  const event = { id: `career-phase-${phase.year}`, kind: "年度章節", priority: 96, maxDelayWeeks: 3, title: `第 ${phase.year} 年・${phase.label}`, text: `${phase.world} 這一年的核心不是把所有事都做完，而是：${phase.goal}。`, choices: [{ id: "declare", label: "寫下今年最想守住的事", outcome: "這句話被放進年度首頁，之後的選擇會不斷回頭質問它。", effect: { mood: 4, rep: "可信度", value: 2 } }] };
  enqueueVisibleEvent(event, "年度章節");
  return event.id;
}
