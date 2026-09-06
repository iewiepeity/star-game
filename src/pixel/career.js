import { eventContext } from "../logic/event-context.js";
import { adaptSavedInvitation } from "./story-scenes.js";
import { hiddenRoutePresentation } from "../logic/hidden-route.js";
import { state } from "../core/state.js";
import { withCore } from "./core-bridge.js";
import { JOB_BY_ID } from "../data/jobs.js";
import { AGENCIES } from "../data/agencies.js";
import { INDUSTRY_COMPANIES } from "../data/industry.js";
import { ACTIONS } from "../data/actions.js";
import { socialDrafts } from "../logic/social-drafts.js";
import { NPC_INTERACTIONS } from "../data/npc-network.js";
import {
  applyToAgency,
  canApplyToAgency,
  deterministicInterviewScore,
  acceptAgencyOffer,
  declineAgencyOffer,
  renewAgencyContract,
} from "../logic/agency.js";
import {
  applyForJob,
  scheduleJobAudition,
  scheduleJobSession,
  completeJobSession,
  jobAuditionDecision,
  jobProductionDecision,
  signJob,
  jobScheduleOptions,
} from "../logic/job-engine.js";
import {
  scheduleActivity,
  cancelActivity,
  markActivityDone,
} from "../logic/scheduled-activities.js";
import { resolvePersonalTask } from "../logic/personal-tasks.js";
import { inviteNpc } from "../logic/npc-invitations.js";
import { managerInteractionDecision } from "../logic/manager.js";
import { npcInteractionDecision } from "../logic/npc-interaction-engine.js";
import { queueCreativeActivity } from "../logic/creative-schedule.js";
import { creativeActionState } from "../logic/creative-workflow.js";
import { creativeBudgetCost } from "../logic/creative-team.js";
import { chooseIndependentProduction } from "../logic/creative.js";
import {
  scheduleSequelSession,
  syncSequelOfferFlags,
} from "../logic/sequel-engine.js";
import {
  overseasEligibility,
  overseasDecision,
  resolveOverseasVisit,
} from "../logic/overseas.js";
import {
  applyActivityLoad,
  successChanceWithCondition,
} from "../logic/condition-engine.js";
import { chance, randomInt } from "../core/rng.js";
import { effectiveStat } from "../core/utils.js";
import { advanceWorldWeek } from "../logic/world-tick.js";
import {
  captureWeekStart,
  finalizeWeekMemory,
} from "../logic/career-memory.js";
import { evaluateAchievements } from "../logic/achievement-engine.js";
import { lockEnding } from "../logic/career.js";
import {
  activateNextEvent,
  dismissActiveEvent,
  pruneJobProductionEvents,
  resolveEvent,
  availableChoices,
} from "../logic/event-engine.js";

export const CAREER_CHOICES = {
  career_task: { label: "個人約定", group: "約定", action: "personal_task" },
  career_job: { label: "正式通告", group: "約定", action: "job_session" },
  career_interview: {
    label: "經紀公司面談",
    group: "約定",
    action: "agency_interview",
  },
  overseas: {
    label: "海外發展",
    group: "職涯",
    action: "free",
    room: "airport",
    item: "service",
    pose: "read",
  },
  audition_practice: {
    label: "公開試鏡練習",
    group: "工作",
    action: "audition",
    room: "rehearsal",
    item: "practice",
    pose: "read",
  },
  street_perform: {
    label: "街頭演出",
    group: "工作",
    action: "street",
    room: "market",
    item: "detail",
    pose: "read",
  },
};
export const productionRoom = (category) =>
  ({
    歌曲: "recording",
    電影: "studio",
    電視劇: "tv",
    綜藝: "tv",
    廣告: "media_company",
  })[category] || "studio";
export const venueRoom = (venue) => (venue === "tv_company" ? "tv" : venue);
export const appointmentRoom = (type) =>
  type === "meal"
    ? "restaurant"
    : type === "date"
      ? "beach"
      : type === "collaborate"
        ? "rehearsal"
        : "cafe";
const serviceAt = (room) =>
  ({ home: "desk", rehearsal: "practice", tv: "reception", cafe: "window" })[
    room
  ] || "service";
export function careerDefinition(game, a) {
  const def = CAREER_CHOICES[a?.id];
  if (!def) return null;
  let room = def.room,
    label = def.label;
  if (a.id === "career_interview") {
    room = `agency_${a.agencyId}`;
    label = `${AGENCIES[a.agencyId]?.name || "公司"}面談`;
  }
  if (a.id === "career_job") {
    const job = JOB_BY_ID[a.jobId];
    room = productionRoom(job?.category);
    label = job?.title || "正式通告";
  }
  if (a.id === "career_task") {
    const task = game.scheduledActivities?.[a.taskId],
      p = task?.payload || {};
    label = task?.label || "已取消的約定";
    const project = game.creativeProjects?.find((x) => x.id === p.projectId);
    const company = INDUSTRY_COMPANIES[p.companyId];
    room =
      task?.kind === "npc_interact"
        ? appointmentRoom(p.type)
        : task?.kind === "job_audition"
          ? venueRoom(
              Object.values(INDUSTRY_COMPANIES).find((c) =>
                c.categories.includes(JOB_BY_ID[p.jobId]?.category),
              )?.locationId || "tv",
            )
          : ["creative_submit", "creative_sale"].includes(task?.kind)
            ? venueRoom(company?.locationId || "tv")
            : task?.kind === "creative_production"
              ? productionRoom(project?.category)
              : task?.kind === "sequel_session"
                ? productionRoom(
                    game.sequelOffers?.find((x) => x.id === p.offerId)
                      ?.category,
                  )
                : task?.kind === "manager_interact"
                  ? `agency_${game.currentAgencyId}`
                  : "home";
  }
  return {
    ...def,
    room,
    label,
    item: def.item || serviceAt(room),
    pose: room === "cafe" ? "coffee" : "read",
  };
}
export function careerCost(life, a) {
  if (a.id === "overseas") return 5000;
  if (a.id !== "career_task")
    return ACTIONS[CAREER_CHOICES[a.id]?.action]?.cost || 0;
  const task = life.game.scheduledActivities?.[a.taskId];
  if (task?.kind === "creative_production") {
    const p = life.game.creativeProjects.find(
      (x) => x.id === task.payload.projectId,
    );
    return p && !p.productionSessions && !p.budgetSpent
      ? creativeBudgetCost(p)
      : 0;
  }
  return task?.cost || 0;
}
export function careerAccess(life, a, day) {
  const game = life.game;
  if (a.id === "overseas")
    return withCore(life, () => overseasEligibility().unlocked)
      ? ""
      : "海外發展需第二年、知名度 80、完成 3 部作品";
  if (a.id === "career_task") {
    const task = game.scheduledActivities?.[a.taskId];
    if (
      !task ||
      task.status !== "scheduled" ||
      task.week !== game.week ||
      task.day !== day
    )
      return "這項約定已取消或日期已改變";
    const p = task.payload;
    if (task.kind.startsWith("creative_")) {
      const project = game.creativeProjects.find((x) => x.id === p.projectId);
      const action = {
        creative_work: "work",
        creative_submit: "route",
        creative_sale: "route",
        creative_production: "produce",
        creative_release: "release",
      }[task.kind];
      const status = creativeActionState(project, action);
      if (!status.ok) return status.reason;
    }
  }
  if (
    a.id === "career_interview" &&
    (game.agencyInterview?.dayIndex !== day ||
      game.agencyInterview?.agencyId !== a.agencyId ||
      game.agencyApplications[a.agencyId]?.status !== "interview_scheduled")
  )
    return "面談通知已失效";
  if (a.id === "career_job") {
    const record = game.activeJobs[a.jobId],
      job = JOB_BY_ID[a.jobId];
    if (
      !job ||
      record?.stage !== "active" ||
      game.week > record.deadlineWeek ||
      record.remainingSessions <= 0
    )
      return "合約已完成或逾期";
    if (!job.workDays.includes(day)) return "這天不是指定拍攝日";
    if (
      record.npcCast?.length &&
      !record.npcScheduleSlots?.some(
        (s) => s.week === game.week && s.day === day && s.status === "reserved",
      )
    )
      return "共演人物這一天沒有共同檔期";
  }
  return "";
}
// Project the same seven-day plan into the original scheduler. Past days remain
// unavailable during booking, including past days that were rest days.
export function syncCoreSchedule(life, definitions, blockPast = false) {
  const game = life.game;
  for (let day = 0; day < 7; day++) {
    const a = life.plan[day],
      def = careerDefinition(game, a) || definitions[a.id];
    game.schedule[day] = blockPast && day < life.day ? "study" : def.action;
    game.freeLocations[day] = def.venue || null;
    game.scheduledActivityIds[day] = a.id === "career_task" ? a.taskId : null;
    game.scheduledJobIds[day] = a.id === "career_job" ? a.jobId : null;
  }
}
export function adoptCoreSchedule(life, startDay = life.day) {
  for (let day = startDay; day < 7; day++) {
    const game = life.game,
      taskId = game.scheduledActivityIds[day],
      jobId = game.scheduledJobIds[day];
    if (taskId) life.plan[day] = { id: "career_task", taskId };
    else if (jobId) life.plan[day] = { id: "career_job", jobId };
    else if (
      game.schedule[day] === "agency_interview" &&
      game.agencyInterview?.dayIndex === day
    )
      life.plan[day] = {
        id: "career_interview",
        agencyId: game.agencyInterview.agencyId,
      };
    else if (life.plan[day]?.id?.startsWith("career_"))
      life.plan[day] = { id: "rest" };
  }
}
export function releaseCareerDay(life, day) {
  const a = life.plan[day];
  if (a?.id === "career_task")
    withCore(life, (game) => {
      game.scheduledActivityIds[day] = a.taskId;
      cancelActivity(day);
    });
  if (a?.id === "career_interview") {
    const app = life.game.agencyApplications[a.agencyId];
    if (app?.status === "interview_scheduled") app.status = "applied";
    life.game.agencyInterview = null;
  }
  life.game.scheduledJobIds[day] = null;
}
export function bookCareer(life, definitions, kind, payload, day) {
  if (
    !Number.isInteger(day) ||
    day < life.day ||
    day > 6 ||
    life.game.endingResult
  )
    return { ok: false, message: "請選尚未完成的日期" };
  if (life.game.forcedRestWeek === life.game.week)
    return { ok: false, message: "本週需要完整休養" };
  if (day === life.day && life.pending)
    return { ok: false, message: "先完成或取消今天的行動，再安排約定" };
  if (life.plan[day].id.startsWith("career_"))
    return { ok: false, message: "這天已有正式約定，請先在行程表改成休息" };
  const snapshot = structuredClone(life);
  syncCoreSchedule(life, definitions, true);
  // The selected date is explicitly replaced. Other dates cannot be used as a
  // silent fallback by the legacy scheduler.
  const originalSchedule = [...life.game.schedule];
  life.game.schedule = Array(7).fill("study");
  life.game.schedule[day] = "rest";
  life.game.freeLocations[day] = null;
  const r = withCore(life, (game) => {
    game.selectedDay = day;
    if (kind === "audition") return scheduleJobAudition(payload.jobId, day);
    if (kind === "job") return scheduleJobSession(payload.jobId, day);
    if (kind === "sequel") return scheduleSequelSession(payload.offerId);
    if (kind === "npc") return inviteNpc(payload.npcId, payload.type, day);
    if (kind === "social_post") {
      const draft = socialDrafts()[payload.type];
      if (!draft) return { ok: false, message: "這份草稿已不存在，請重新選擇" };
      if (
        Object.values(game.scheduledActivities).some(
          (t) =>
            t.kind === kind && t.week === game.week && t.status === "scheduled",
        )
      )
        return {
          ok: false,
          message: "本週已有待發布的正式更新，請先完成或取消",
        };
      return scheduleActivity(
        kind,
        { type: payload.type, text: draft.text, label: draft.label },
        `社群更新：${draft.label}`,
        { fatigue: 2, stamina: 2, preferredDay: day },
      );
    }
    if (kind === "manager_interact") {
      if (
        !game.currentAgencyId ||
        !game.managerState ||
        !["chat", "career", "apologize"].includes(payload.type)
      )
        return { ok: false, message: "簽約並有經紀人後，才能安排會談" };
      return scheduleActivity(
        kind,
        payload,
        {
          chat: "和經紀人聊近況",
          career: "經紀人職涯會談",
          apologize: "危機後溝通",
        }[payload.type],
        { fatigue: 2, stamina: 2, preferredDay: day },
      );
    }
    if (kind === "interview") {
      const app = game.agencyApplications[payload.agencyId];
      if (
        app?.status !== "applied" ||
        game.week <= app.appliedWeek ||
        game.agencyInterview
      )
        return {
          ok: false,
          message: "先投遞履歷，收到下一週回覆後再約面談；每週一場",
        };
      game.agencyInterview = { agencyId: payload.agencyId, dayIndex: day };
      app.status = "interview_scheduled";
      game.schedule[day] = "agency_interview";
      return { ok: true, day, message: "面談日期已確認" };
    }
    if (kind.startsWith("creative_")) {
      const project = game.creativeProjects.find(
        (p) => p.id === payload.projectId,
      );
      const action = {
        creative_work: "work",
        creative_submit: "route",
        creative_sale: "route",
        creative_production: "produce",
        creative_release: "release",
      }[kind];
      const valid = creativeActionState(project, action);
      if (!valid.ok) return { ok: false, message: valid.reason };
      if (["creative_submit", "creative_sale"].includes(kind)) {
        const c = INDUSTRY_COMPANIES[payload.companyId];
        if (
          !c ||
          !(project.type === "song"
            ? c.type === "唱片公司"
            : project.type === "show"
              ? c.type === "電視公司"
              : ["電影公司", "電視公司"].includes(c.type))
        )
          return { ok: false, message: "這家公司不收這類作品" };
      }
      return queueCreativeActivity(
        kind,
        payload,
        `${project.title}・${{ creative_work: "寫作", creative_submit: "投稿", creative_sale: "洽售", creative_production: "製作", creative_release: "發行" }[kind]}`,
        { fatigue: 6, stamina: 6, preferredDay: day },
      );
    }
    return { ok: false, message: "未知的安排" };
  });
  if (!r?.ok || r.day !== day) {
    Object.assign(life, snapshot);
    return r || { ok: false, message: "安排沒有成立" };
  }
  for (let i = 0; i < 7; i++)
    if (i !== day) life.game.schedule[i] = originalSchedule[i];
  adoptCoreSchedule(life);
  syncCoreSchedule(life, definitions);
  attachReservationLocations(life.game);
  return r;
}
export function attachReservationLocations(game) {
  for (const slots of Object.values(game.npcSchedules || {}))
    for (const slot of slots) {
      const task = game.scheduledActivities?.[slot.jobId];
      const job = JOB_BY_ID[slot.jobId];
      const project = game.creativeProjects?.find(
        (p) => slot.jobId === `creative:${p.id}`,
      );
      const sequel = game.sequelOffers?.find(
        (p) => slot.jobId === `sequel:${p.id}`,
      );
      if (task?.kind === "npc_interact")
        slot.location = appointmentRoom(task.payload.type);
      else if (job) slot.location = productionRoom(job.category);
      else if (project || sequel)
        slot.location = productionRoom((project || sequel).category);
    }
}
export function careerDecision(life, a) {
  return withCore(life, (game) => {
    if (a.id === "career_job") return jobProductionDecision(a.jobId);
    if (a.id === "career_task") {
      const t = game.scheduledActivities[a.taskId];
      return t?.kind === "job_audition"
        ? jobAuditionDecision(t)
        : t?.kind === "npc_interact"
          ? npcInteractionDecision(t)
          : t?.kind === "manager_interact"
            ? managerInteractionDecision(t)
            : null;
    }
    if (a.id === "career_interview")
      return {
        title: `${AGENCIES[a.agencyId].name}面談`,
        text: "接待人員收起履歷，想聽聽你會如何走這條路。",
        choices: [
          { id: "steady", label: "穩健回答，說明準備" },
          { id: "bold", label: "展現企圖心與個人特色" },
        ],
      };
    if (a.id === "overseas") return overseasDecision();
    if (["audition_practice", "street_perform"].includes(a.id))
      return {
        title: CAREER_CHOICES[a.id].label,
        text: "準備好的內容之外，也留一點空間回應現場。",
        choices: [
          { id: "steady", label: "用熟悉的方式穩穩表現" },
          { id: "bold", label: "加入自己的設計" },
        ],
      };
    return null;
  });
}
// Called inside the daily ledger transaction, only after the room performance.
export function resolveCareerDay(life, a, choice) {
  if (a.id === "career_task") {
    const task = state.scheduledActivities[a.taskId];
    if (task.kind === "npc_interact")
      state.stamina = Math.max(0, state.stamina - (task.stamina || 0));
    else applyActivityLoad(task);
    const result = resolvePersonalTask(task, choice);
    markActivityDone(life.day);
    return result;
  }
  if (a.id === "career_job") {
    const decision = jobProductionDecision(a.jobId);
    if (decision && !decision.choices.some(item => item.id === choice))
      return {ok: false, pending: true, decision, text: "先確認製作版本，再開始今天的工作。"};
    applyActivityLoad(ACTIONS.job_session);
    const r = completeJobSession(a.jobId, choice);
    if (!r.pending) state.scheduledJobIds[life.day] = null;
    return r;
  }
  if (a.id === "career_interview") {
    const agency = AGENCIES[a.agencyId],
      score = successChanceWithCondition(
        deterministicInterviewScore(agency, choice),
        "audition",
      );
    applyActivityLoad(ACTIONS.agency_interview);
    const passed = chance(score);
    state.agencyApplications[a.agencyId].status = passed ? "offer" : "rejected";
    if (passed)
      state.agencyOffer = { agencyId: a.agencyId, offeredWeek: state.week };
    state.agencyInterview = null;
    return {
      ok: true,
      text: passed
        ? "面談結束後，公司送來正式合約。可以先閱讀條件，再決定是否簽約。"
        : "這次沒有獲得錄取。繼續累積實戰與作品，準備好再投遞。",
      agencyOfferId: passed ? a.agencyId : null,
    };
  }
  if (a.id === "overseas") {
    applyActivityLoad({ fatigue: 10, stamina: 10 });
    return { ok: true, ...resolveOverseasVisit(choice) };
  }
  const audition = a.id === "audition_practice",
    names = audition
      ? ["鏡頭感", "親和力", "口才"]
      : ["歌藝", "肢體表現", "社交"];
  const power = names.reduce((s, n) => s + effectiveStat(n), 0) / 3;
  const pct = Math.min(
    95,
    successChanceWithCondition(
      Math.max(
        10,
        Math.min(
          82,
          32 + (power - 75) * 0.24 + (choice === "steady" ? 10 : -4),
        ),
      ),
      audition ? "audition" : "work",
    ) + (state.focus === "fame" ? 5 : 0),
  );
  const action = ACTIONS[audition ? "audition" : "street"];
  applyActivityLoad(action);
  const success = chance(pct);
  if (action.income)
    state.money +=
      randomInt(...action.income) +
      (success ? randomInt(...(action.successIncome || [0, 0])) : 0);
  if (success)
    state.fame += (audition ? 4 : 2) + (state.focus === "fame" ? 2 : 0);
  const gain = audition ? (success ? 3 : 1) : success ? 2 : 1;
  if (!state.currentAgencyId)
    state.contract = Math.min(100, state.contract + gain);
  return {
    ok: true,
    text: `${success ? "今天的表現被記住了" : "還有進步的空間，今天也累積了實戰經驗"}。${!state.currentAgencyId ? `簽約準備度＋${gain}。` : ""}`,
  };
}
export function closeCareerWeek(life, reward) {
  return withCore(life, (game) => {
    evaluateAchievements();
    const memory = finalizeWeekMemory();
    game.history.push({
      week: game.week,
      results: structuredClone(game.weekResults),
      reward: reward.money,
      weeklyTask: structuredClone(reward),
    });
    return memory;
  });
}
export function advanceCareerWeek(life) {
  const news = withCore(life, (game) => {
    const result = advanceWorldWeek();
    captureWeekStart();
    attachReservationLocations(game);
    if (game.week > 260) lockEnding("fiveyear");
    return result;
  });
  life.worldNews = news;
  return news;
}
export function currentStory(life) {
  return withCore(life, (game) => {
    pruneJobProductionEvents();
    if (game.eventOutcome)
      return {
        outcome: game.eventOutcome,
        context: eventContext(game.eventOutcome),
      };
    const item = game.activeEvent || activateNextEvent();
    if (item)
      item.event = hiddenRoutePresentation(
        adaptSavedInvitation(item.event, game),
      );
    return item
      ? {
          event: item.event,
          choices: availableChoices(item.event),
          context: eventContext(item.event, { ...item, week: game.week }),
        }
      : null;
  });
}
export function chooseStory(life, id) {
  return withCore(life, (game) => {
    pruneJobProductionEvents();
    const e = game.activeEvent?.event;
    if (!e || game.eventHistory.some((x) => x.id === e.id)) return null;
    const r = resolveEvent(e, id);
    if (!r || r.pending) return null;
    game.eventOutcome = r;
    dismissActiveEvent();
    syncSequelOfferFlags();
    return r;
  });
}
export function careerCommand(life, type, id) {
  if (life.game.endingResult)
    return { ok: false, message: "這段五年旅程已完成" };
  return withCore(life, () => {
    if (type === "apply-agency") {
      const agency = AGENCIES[id];
      if (!canApplyToAgency(agency))
        return {
          ok: false,
          message: "履歷條件尚未達標，或已有投遞／合約進行中",
        };
      applyToAgency(id);
      return { ok: true, message: "履歷已送出，下週會收到面談回覆" };
    }
    if (type === "accept-agency") {
      if (state.agencyOffer?.agencyId !== id)
        return { ok: false, message: "目前沒有這份合約" };
      acceptAgencyOffer();
      return { ok: true, message: "經紀合約已成立" };
    }
    if (type === "decline-agency") {
      if (state.agencyOffer?.agencyId !== id)
        return { ok: false, message: "合約已失效" };
      declineAgencyOffer();
      return { ok: true, message: "已婉拒合約" };
    }
    if (type === "renew-agency") return renewAgencyContract();
    if (type === "apply-job") {
      const ok = applyForJob(id);
      return {
        ok,
        message: ok
          ? "試鏡登記完成，請選一天前往"
          : state.activeJobs[id]?.notice || state.notice,
      };
    }
    if (type === "sign-job") {
      const ok = signJob(id);
      attachReservationLocations(state);
      return {
        ok,
        message: ok
          ? "正式通告已簽署，請留意共同檔期與期限"
          : state.activeJobs[id]?.notice,
      };
    }
    if (type === "independent") return chooseIndependentProduction(id);
    return { ok: false, message: "找不到這項操作" };
  });
}
export function bookingDays(life, definitions, kind, payload) {
  return Array.from({ length: 7 }, (_, day) => {
    if (
      day < life.day ||
      life.plan[day].id.startsWith("career_") ||
      (day === life.day && life.pending)
    )
      return false;
    if (kind !== "job") return true;
    const copy = structuredClone(life);
    syncCoreSchedule(copy, definitions, true);
    copy.game.schedule[day] = "rest";
    return withCore(copy, () =>
      jobScheduleOptions(payload.jobId).some((d) => d.day === day),
    );
  });
}
export { NPC_INTERACTIONS };
