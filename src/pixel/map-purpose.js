import { CHOICES, definition, access } from "./life.js";
import { CITY_PLACES, publicRoom } from "./city-catalog.js";
import { JOB_BY_ID } from "../data/jobs.js";
import { productionRoom } from "./career.js";

export const MAP_PURPOSES = { all: "全部地點", appointment: "今天有約", work: "待辦工作", training: "想訓練", rest: "想休息" };
export function mapPurposeRooms(life, purpose) {
  const publicIds = new Set(CITY_PLACES.map(place => place.id));
  if (purpose === "all") return publicIds;
  if (!life || !Object.hasOwn(MAP_PURPOSES, purpose)) return new Set();
  const rooms = [];
  if (purpose === "appointment") {
    const assignment = life.plan?.[life.day];
    if (assignment && (assignment.id.startsWith("career_") || assignment.appointmentId || assignment.id === "home_host")) rooms.push(definition(life, assignment)?.room);
  } else if (purpose === "work") {
    for (const [id, job] of Object.entries(life.game.activeJobs || {})) {
      if (job.stage === "active" && JOB_BY_ID[job.jobId || id]) rooms.push(productionRoom(JOB_BY_ID[job.jobId || id].category));
    }
    for (const assignment of life.plan?.slice(life.day) || []) {
      const task = life.game.scheduledActivities?.[assignment.taskId];
      if (task && ["job_audition", "creative_production", "creative_submit", "creative_sale", "sequel_session"].includes(task.kind) && task.status !== "done" && task.status !== "cancelled") rooms.push(definition(life, assignment)?.room);
    }
  } else {
    for (const [id, choice] of Object.entries(CHOICES)) {
      if ((purpose === "training" ? choice.group === "訓練" : choice.group === "休息") && !access(life, { id }, life.day, true)) rooms.push(choice.room);
    }
  }
  return new Set(rooms.filter(room => typeof room === "string").map(publicRoom).filter(id => publicIds.has(id)));
}
