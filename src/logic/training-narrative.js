import { state } from "../core/state.js";
import { normalizeTrainingProgress } from "../core/training-narrative-state.js";
export { normalizeTrainingProgress };
import { ACTIONS } from "../data/actions.js";
import { TRAINING_CURRICULUM, TRAINING_STAGE_LABELS } from "../data/training-curriculum.js";

const number = (value, max = 100000) => Math.max(0, Math.min(max, Number.isFinite(value) ? value : 0));
const validLesson = (id, value) => Object.values(TRAINING_CURRICULUM[id]).find(lesson => lesson.id === value);
export function trainingSkill(id, game = state) {
  const gains = ACTIONS[id]?.gains || [];
  const names = ["songwriting", "image"].includes(id) ? gains.slice(0, 2).map(x => x[0]) : gains.slice(0, 1).map(x => x[0]);
  return names.length ? Math.round(names.reduce((sum, name) => sum + number(game.stats?.[name], 1000), 0) / names.length) : 0;
}
const abilityStage = skill => skill < 180 ? "beginner" : skill < 420 ? "skilled" : "plateau";
export function trainingLevel(id, game = state) {
  if (!TRAINING_CURRICULUM[id]) return null;
  const progress = normalizeTrainingProgress(game.trainingNarrativeProgress)[id];
  const skill = trainingSkill(id, game);
  const stage = progress?.stage === "breakthrough" && progress.skill <= skill ? "breakthrough" : abilityStage(skill);
  const lesson = TRAINING_CURRICULUM[id][stage];
  return { stage, label: TRAINING_STAGE_LABELS[stage], skill, sessions: progress?.sessions || 0, problem: validLesson(id, progress?.lastProblemId)?.problem || lesson.problem, lesson };
}
// Called once by the existing training transaction, after its original gains.
// Only narrative memory changes here: tuition, condition load and gains stay owned by routineTraining.
export function recordTrainingPractice(game, id, beforeSkill, gains, multiplier) {
  if (!TRAINING_CURRICULUM[id]) return;
  const all = normalizeTrainingProgress(game.trainingNarrativeProgress), previous = all[id];
  const skill = trainingSkill(id, game), sessions = (previous?.sessions || 0) + 1;
  const progressed = skill > beforeSkill && gains.some(g => g.amount > 0);
  let stage = abilityStage(beforeSkill);
  const cycleStartSkill = previous?.stage === "plateau" ? previous.cycleStartSkill : beforeSkill;
  const plateauSessions = stage === "plateau" ? (previous?.stage === "plateau" ? previous.plateauSessions : 0) + 1 : 0;
  const crossed = [180, 420, 700].some(threshold => beforeSkill < threshold && skill >= threshold);
  if (sessions >= 3 && progressed && multiplier >= .8 && (crossed || (plateauSessions >= 3 && skill - cycleStartSkill >= 12))) stage = "breakthrough";
  const lesson = TRAINING_CURRICULUM[id][stage];
  const result = stage === "breakthrough" ? "breakthrough" : multiplier < .8 || !progressed ? "limited" : "steady";
  all[id] = {
    sessions, skill, stage, plateauSessions: stage === "plateau" ? plateauSessions : 0,
    cycleStartSkill: stage === "plateau" ? cycleStartSkill : skill,
    lastProblemId: lesson.id, lastLessonId: lesson.id, lastResult: result,
    lastWeek: game.week || 0, lastDay: game.runnerDay || 0,
    pendingReview: { previousLessonId: previous?.lastProblemId || "", previousResult: previous?.lastResult || "steady", important: !previous || previous.stage !== stage || previous.lastResult !== result },
    history: [...(previous?.history || []), { lessonId: lesson.id, stage, result, week: game.week || 0, skill }].slice(-12),
  };
  game.trainingNarrativeProgress = all;
}
export function trainingLessonMoment(id, baseEvent, game = state) {
  if (!TRAINING_CURRICULUM[id] || !baseEvent) return baseEvent;
  const progress = normalizeTrainingProgress(game.trainingNarrativeProgress)[id];
  const level = trainingLevel(id, game), stage = progress?.stage || level.stage;
  const lesson = TRAINING_CURRICULUM[id][stage];
  const review = progress?.pendingReview;
  const previous = validLesson(id, review?.previousLessonId);
  const recall = previous ? `老師翻到上回的練習記錄：「${previous.revisit}」${review.previousResult === "limited" ? "上次受狀態影響的部分，今天先用慢速重試，不急著加難。" : review.previousResult === "breakthrough" ? "先重做上次成立的方法，再看它能否帶進新的題目。" : "你先對照上次留下的記號，再開始這次的課題。"}` : "老師先記下今天的起點，之後會從這份練習接著看。";
  const result = progress?.lastResult === "limited" ? "今天的狀態讓練習需要拆小；老師把這個問題留在下一次的複習欄，沒有把嘗試當作已經掌握。" : lesson.outcome;
  return {
    ...baseEvent, id: `${id}:${lesson.id}:${baseEvent.title}`,
    title: baseEvent.title,
    text: `${TRAINING_STAGE_LABELS[stage]}課題：${lesson.title}。${recall} ${lesson.text} 課間小記：${baseEvent.text}`,
    outcome: `${result} ${baseEvent.outcome}`,
    important: review?.important === true,
    training: { actionId: id, stage, stageLabel: TRAINING_STAGE_LABELS[stage], lessonTitle: lesson.title, problem: lesson.problem, previousProblem: previous?.problem || "", result: progress?.lastResult || "steady" },
  };
}
