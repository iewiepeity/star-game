import { cityDay, normalizeCityLife } from "../core/city-life-state.js";
import {
  appointmentProblem,
  calendarOccasions,
  cityLife,
  releaseAppointment,
  collectCitySources,
} from "../logic/city-life.js";
import { withCore } from "./core-bridge.js";
import { releaseHomeDay } from "./home-schedule.js";
import { syncCoreSchedule } from "./career.js";
import { CITY_CHOICES } from "../data/city-life.js";

export const cityAppointmentAction = (a) => ({
  id: a.kind === "collab" ? "city_collab" : "city_date",
  appointmentId: a.id,
});
export function cityEvent(life, eventId) {
  const event = calendarOccasions(life.game, cityDay(life.game, life.day)).find(
    (e) => e.id === eventId,
  );
  if (event) return event;
  const echo = cityLife(life.game).echoes.find(
    (e) =>
      e.id === eventId &&
      e.kind === "home" &&
      e.status === "delivered" &&
      !e.accepted,
  );
  if (echo && cityDay(life.game, life.day) <= echo.due + 14)
    return {
      id: echo.id,
      kind: "collab",
      npcId: echo.npcId,
      due: echo.due + 7,
      title: "朋友邀約的對戲日",
    };
  return null;
}
export function cityBookingProblem(
  life,
  eventId,
  npcId,
  day,
  rescheduleId = null,
) {
  const game = life.game,
    now = cityDay(game, life.day);
  if (game.endingResult || game.forcedRestWeek === Math.floor(day / 7) + 1)
    return "這段時間需要休養，暫時不接新的約定。";
  const old =
    rescheduleId &&
    cityLife(game).appointments.find(
      (a) => a.id === rescheduleId && a.status === "reserved",
    );
  if (rescheduleId && (!old || old.eventId !== eventId || old.npcId !== npcId))
    return "原本的約定已經改變，請重新查看日曆。";
  if (old && (old.day < now || (old.day === now && life.pending)))
    return "今天的約定已開始，先完成或取消行動再改約。";
  const event =
    cityEvent(life, eventId) ||
    (old?.kind === "collab"
      ? {
          id: old.eventId,
          kind: old.kind,
          npcId: old.npcId,
          due: old.due,
          title: old.title,
        }
      : null);
  const reason = appointmentProblem(game, event, npcId, day, now, rescheduleId);
  if (reason) return reason;
  if (day === now && life.pending)
    return "今天的行動已開始，先完成或取消再安排。";
  if (
    cityLife(game).appointments.some(
      (a) => a.status === "reserved" && a.day === day && a.id !== rescheduleId,
    )
  )
    return "你這天已經有另一個邀約。";
  if (Math.floor(day / 7) === game.week - 1) {
    const assignment = life.plan[day % 7];
    if (
      assignment.appointmentId !== rescheduleId &&
      (assignment.id.startsWith("career_") || assignment.id === "home_host")
    )
      return "這天已有正式約定，請先在行程表取消。";
  }
  return "";
}
export function bookCityAppointment(
  life,
  definitions,
  eventId,
  npcId,
  day,
  rescheduleId = null,
) {
  const reason = cityBookingProblem(life, eventId, npcId, day, rescheduleId);
  if (reason) return { ok: false, message: reason };
  const old =
    rescheduleId &&
    cityLife(life.game).appointments.find((a) => a.id === rescheduleId);
  const event = cityEvent(life, eventId) || {
    id: old.eventId,
    kind: old.kind,
    due: old.due,
    title: old.title,
    origin: old.origin,
  };
  const oldDay = old?.day;
  const result = withCore(life, (game) => {
    const c = cityLife(game),
      previous = old && c.appointments.find((a) => a.id === old.id);
    if (previous) releaseAppointment(game, previous);
    const a = previous || {
      id: `city-date:${event.id}:${c.appointments.length}`,
      eventId,
      npcId,
      kind: event.kind,
      title: event.title,
      due: event.due,
      origin: event.origin || 0,
      photoConsent: false,
      text: "",
      reschedules: 0,
    };
    a.day = day;
    a.status = "reserved";
    if (previous) a.reschedules++;
    else c.appointments.push(a);
    game.npcSchedules[npcId] ||= [];
    game.npcSchedules[npcId].push({
      jobId: a.id,
      week: Math.floor(day / 7) + 1,
      day: day % 7,
      status: "reserved",
      external: true,
      location: a.kind === "collab" ? "rehearsal" : "cafe",
      label: a.title,
    });
    const echo = c.echoes.find((e) => e.id === eventId);
    if (echo) echo.accepted = true;
    const text = `${previous ? "改約" : "約定"}在第 ${Math.floor(day / 7) + 1} 週、週${"一二三四五六日"[day % 7]}。${a.kind === "collab" ? "一起對戲，不是正式通告或錄取承諾。" : "預留一天與 $300，實際赴約才結算。"}`;
    game.npcMessages.push({
      id: `booking:${a.id}:${a.reschedules}`,
      npcId,
      week: game.week,
      title: "約好了",
      text,
      source: "city-life",
      read: false,
    });
    return { ok: true, message: text, appointment: structuredClone(a) };
  });
  if (
    oldDay != null &&
    Math.floor(oldDay / 7) === life.game.week - 1 &&
    life.plan[oldDay % 7].appointmentId === old.id
  )
    life.plan[oldDay % 7] = { id: "rest" };
  if (Math.floor(day / 7) === life.game.week - 1) {
    releaseHomeDay(life, day % 7);
    life.plan[day % 7] = cityAppointmentAction(result.appointment);
  }
  syncCoreSchedule(life, definitions);
  return result;
}
export function cancelCityAppointment(life, id) {
  const a = cityLife(life.game).appointments.find(
    (a) => a.id === id && a.status === "reserved",
  );
  if (!a) return { ok: false, message: "這個約定已結束。" };
  if (a.day === cityDay(life.game, life.day) && life.pending)
    return { ok: false, message: "先完成或取消今天的行動，再取消邀約。" };
  releaseAppointment(life.game, a);
  if (
    Math.floor(a.day / 7) === life.game.week - 1 &&
    life.plan[a.day % 7].appointmentId === id
  ) {
    life.plan[a.day % 7] = { id: "rest" };
    life.game.schedule[a.day % 7] = "rest";
    life.game.freeLocations[a.day % 7] = null;
    life.game.scheduledActivityIds[a.day % 7] = null;
    life.game.scheduledJobIds[a.day % 7] = null;
  }
  life.game.npcMessages.push({
    id: `cancel:${id}`,
    npcId: a.npcId,
    week: life.game.week,
    title: "這次先取消",
    text: "收到，我把那天空出來了。這次沒有赴約費用，等彼此有空再說。",
    source: "city-life",
    read: false,
  });
  return { ok: true, message: "已取消邀約並釋出雙方檔期，沒有扣款。" };
}
export function repairCitySchedule(life) {
  life.game.cityLife = normalizeCityLife(life.game.cityLife);
  collectCitySources(life.game, cityDay(life.game, life.day));
  const c = cityLife(life.game);
  for (const slots of Object.values(life.game.npcSchedules || {}))
    for (const s of slots) {
      if (!s.jobId?.startsWith("city-date:") || s.status !== "reserved")
        continue;
      const a = c.appointments.find(
        (a) => a.id === s.jobId && a.status === "reserved",
      );
      if (!a || a.day !== (s.week - 1) * 7 + s.day) s.status = "released";
    }
  for (let day = life.day; day < 7; day++) {
    if (life.pending && day === life.day) continue;
    const a = c.appointments.find(
      (a) => a.status === "reserved" && a.day === cityDay(life.game, day),
    );
    if (
      a &&
      (life.plan[day].id === "rest" || life.plan[day].appointmentId === a.id)
    )
      life.plan[day] = cityAppointmentAction(a);
    else if (a)
      releaseAppointment(life.game, a); // Never overwrite a newly assigned workday on load.
    else if (CITY_CHOICES[life.plan[day].id] && life.plan[day].appointmentId)
      life.plan[day] = { id: "rest" };
  }
}
