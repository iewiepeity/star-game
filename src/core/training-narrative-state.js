import { TRAINING_CURRICULUM, TRAINING_STAGE_LABELS } from "../data/training-curriculum.js";
const stages = Object.keys(TRAINING_STAGE_LABELS);
const number = (value, max = 100000) => Math.max(0, Math.min(max, Number.isFinite(value) ? value : 0));
const short = value => typeof value === "string" ? value.slice(0, 240) : "";
const validLesson = (id, value) => Object.values(TRAINING_CURRICULUM[id]).find(lesson => lesson.id === value);
export function normalizeTrainingProgress(raw) {
  return Object.fromEntries(Object.keys(TRAINING_CURRICULUM).filter(id => raw?.[id] && typeof raw[id] === "object").map(id => {
    const p = raw[id];
    return [id, {
      sessions: Math.floor(number(p.sessions)), skill: number(p.skill, 1000),
      stage: stages.includes(p.stage) ? p.stage : "beginner",
      plateauSessions: Math.floor(number(p.plateauSessions)), cycleStartSkill: number(Number.isFinite(p.cycleStartSkill) ? p.cycleStartSkill : p.skill, 1000),
      lastProblemId: validLesson(id, p.lastProblemId)?.id || "", lastLessonId: validLesson(id, p.lastLessonId)?.id || "",
      lastResult: ["steady", "limited", "breakthrough"].includes(p.lastResult) ? p.lastResult : "steady",
      lastWeek: Math.floor(number(p.lastWeek)), lastDay: Math.floor(number(p.lastDay, 6)),
      pendingReview: p.pendingReview && typeof p.pendingReview === "object" ? {
        previousLessonId: validLesson(id, p.pendingReview.previousLessonId)?.id || "",
        previousResult: ["steady", "limited", "breakthrough"].includes(p.pendingReview.previousResult) ? p.pendingReview.previousResult : "steady",
        important: p.pendingReview.important === true,
      } : null,
      history: (Array.isArray(p.history) ? p.history : []).filter(x => x && validLesson(id, x.lessonId)).slice(-12).map(x => ({
        lessonId: x.lessonId, stage: stages.includes(x.stage) ? x.stage : "beginner", result: short(x.result),
        week: Math.floor(number(x.week)), skill: number(x.skill, 1000),
      })),
    }];
  }));
}
