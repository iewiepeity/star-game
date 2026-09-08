import { techniqueChoices } from "./training-techniques.js";
import { workEchoAuditionBonus, consumeWorkEchoOpportunity, activeWorkEchoOpportunity } from "./work-echoes.js";
import { auditionResultCard } from "../views/audition-result.js";
import { canAccessJob } from "./industry.js";
import { jobExperienceTier } from "./work-progression.js";
import { JOB_BY_ID, JOB_CATALOG } from "../data/jobs.js";
import { DAYS } from "../data/calendar.js";
import { state } from "../core/state.js";
import { titleTag, effectiveStat, successRateLabel } from "../core/utils.js";
import { chance } from "../core/rng.js";
import { calculateJobIncome } from "./agency.js";
import { addCompletedWork, workQuality } from "./portfolio.js";
import {
  assignJobCast,
  applyJobNpcRelations,
  confirmJobCastAndSchedule,
  refreshNpcJobSchedule,
  jobNpcSlotsForWeek,
  completeNpcJobSlot,
  releaseNpcJobSchedule,
  sanitizeJobCast,
} from "./npc-ecosystem.js";
import { scheduleChange } from "./schedule-transaction.js";
import { brandEligible, jobMarketModifier } from "./reputation-engine.js";
import {
  brandAuditionModifier,
  brandCanWork,
  recordBrandOutcome,
} from "./brand-relations.js";
import { recordScandal, scandalMarketPenalty } from "./scandal-engine.js";
import { marketJobModifier, marketRewardMultiplier } from "./world-market.js";
import { personaJobModifier } from "./persona-engine.js";
import { competitionPressure } from "./competitors.js";
import {
  roleProfile,
  roleRequirements,
  roleTrainingRequirement,
} from "./work-profile.js";
import { scheduleActivity } from "./scheduled-activities.js";
import {
  successChanceWithCondition,
  performanceLabel,
} from "./condition-engine.js";
import { managerAuditionModifier } from "./manager.js";
import { jobStoryline } from "../data/job-storylines.js";
import { jobProductionFrames } from "../data/job-production-scenes.js";
import { continuingJobScene } from "../data/job-session-scenes.js";
import { attachJobCrew, recordCrewOutcome } from "./playable-depth-engine.js";
import {
  availableChoices,
  resolveEvent,
  clearJobProductionEvent,
} from "./event-engine.js";
function storyFeed(record, beat) {
  record.storyHistory ??= [];
  record.storyHistory.push({ week: state.week, ...beat });
  record.storyHistory = record.storyHistory.slice(-12);
  return beat;
}
const FLAGSHIP_CHOICE_IDS = Object.freeze([
  "protect",
  "breakthrough",
  "signature",
]);
const flagshipChoice = (id) =>
  FLAGSHIP_CHOICE_IDS.find((choice) =>
    state.eventFlags.includes(`flagship:${id}:${choice}`),
  );

// The production day owns this decision. A busy weekly event queue must never
// postpone it until after the work has already been released.
export function jobProductionDecision(id) {
  const job = JOB_BY_ID[id],
    record = state.activeJobs?.[id],
    story = jobStoryline(id);
  if (
    !job ||
    record?.stage !== "active" ||
    story?.depth !== "A" ||
    flagshipChoice(id)
  )
    return null;
  if (
    (record.completedSessions || 0) < Math.max(1, Math.ceil(job.sessions / 2))
  )
    return null;
  const copy = story.flagshipChoices,
    event = {
      id: `flagship-choice:${id}`,
      kind: "職涯事件",
      decisionKind: "job_production",
      jobId: id,
      storyContext: {
        source: "工作現場",
        channel: "story",
        week: state.week,
        npcIds: [...(record.npcCast || [])],
      },
      requires: {
        activeJob: id,
        notFlags: FLAGSHIP_CHOICE_IDS.map(
          (choice) => `flagship:${id}:${choice}`,
        ),
      },
      title: `${titleTag(job.title)}｜確認接下來的版本`,
      text: `${story.production?.[1]?.text || story.theme} 團隊把可行方案放在一起，等你確認接下來的做法。`,
      choices: [
        {
          id: "protect",
          label: copy.protect.label,
          outcome: copy.protect.outcome,
          effects: [
            { flag: `flagship:${id}:protect` },
            { rep: "可信度", value: 5 },
          ],
        },
        {
          id: "breakthrough",
          label: copy.breakthrough.label,
          outcome: copy.breakthrough.outcome,
          effects: [
            { flag: `flagship:${id}:breakthrough` },
            { rep: "話題度", value: 7 },
          ],
        },
        {
          id: "signature",
          label: copy.signature.label,
          outcome: copy.signature.outcome,
          note: "洞察與抗壓各 600 解鎖",
          special: true,
          requires: { hidden: { 洞察: 600, 抗壓: 600 } },
          effects: [
            { flag: `flagship:${id}:signature` },
            { rep: "業界評價", value: 9 },
            { rep: "可信度", value: 5 },
          ],
        },
      ],
    };
  return { ...event, choices: availableChoices(event) };
}

function resolveJobProductionDecision(job, record, choice) {
  const decision = jobProductionDecision(job.id);
  if (!decision) {
    if (flagshipChoice(job.id)) clearJobProductionEvent(job.id);
    return null;
  }
  if (!decision.choices.some((item) => item.id === choice))
    return {
      ok: false,
      pending: true,
      decision,
      text: "先和團隊確認這次製作的版本，再繼續今天的工作。",
    };
  const resolved = resolveEvent(decision, choice);
  if (!resolved || resolved.pending)
    return {
      ok: false,
      pending: true,
      decision,
      text: "這個做法目前尚未確認，請重新選擇。",
    };
  clearJobProductionEvent(job.id);
  record.flagshipDecisionQueued = false;
  storyFeed(record, {
    phase: "production-choice",
    title: decision.title,
    text: resolved.outcome,
    choice,
  });
  return null;
}
export function ensureJobState(id) {
  const job = JOB_BY_ID[id];
  if (!job) return null;
  const record =
    state.activeJobs[id] ||
    (state.activeJobs[id] = {
      jobId: id,
      stage: "available",
      appliedWeek: null,
      deadlineWeek: null,
      remainingSessions: job.sessions,
      completedSessions: 0,
      notice: "",
      lastAuditionWeek: null,
      npcCast: [],
      npcScheduleSlots: [],
      storyHistory: [],
      auditionChoice: null,
    });
  record.storyHistory ??= [];
  record.auditionChoice ??= null;
  sanitizeJobCast(job, record);
  return record;
}
export function jobState(id) {
  return state.activeJobs[id]
    ? ensureJobState(id)
    : {
        jobId: id,
        stage: "available",
        remainingSessions: JOB_BY_ID[id]?.sessions || 0,
        completedSessions: 0,
        notice: "",
        npcCast: [],
        npcScheduleSlots: [],
      };
}
export function availableJobs() {
  return JOB_CATALOG.filter(
    (job) =>
      job.stars <= jobExperienceTier(state, job) &&
      (job.category !== "廣告" || brandEligible(job.stars)) &&
      brandCanWork(job.client, job.stars),
  );
}
export function marketAdjustedPay(job) {
  return Math.max(
    0,
    Math.round((job?.pay || 0) * marketRewardMultiplier(job?.category)),
  );
}
function reputationScore(job) {
  if (!job.reputationSignals?.length) return 0;
  return job.reputationSignals.reduce(
    (sum, name) => sum + ((state.rep[name] || 0) - 500) / 45,
    0,
  );
}
const COMMITMENT_CATEGORIES = {
  screen: new Set(["電影", "電視劇"]),
  music: new Set(["歌曲"]),
  media: new Set(["綜藝"]),
  commercial: new Set(["廣告"]),
};
export function careerCommitmentAccess(job) {
  const commitment = state.careerCommitment;
  if (!commitment || state.week > commitment.lockedUntil || job.stars < 3)
    return { ok: true };
  const ok = COMMITMENT_CATEGORIES[commitment.id]?.has(job.category);
  return {
    ok: Boolean(ok),
    reason: `本期已承諾專注「${commitment.label}」至第 ${commitment.lockedUntil} 週；三星以上的其他路線暫不開放。`,
  };
}
export function careerDoctrineAccess(job) {
  const d = state.careerDoctrine || {},
    active = Object.values(state.activeJobs || {}).filter(
      (x) => x.stage === "active",
    ).length;
  if (d.year3?.id === "niche" && job.stars >= 4 && job.category === "廣告")
    return {
      ok: false,
      reason:
        "「獨特定位」關閉四星以上大眾廣告；團隊把檔期留給能累積作品辨識度的路線。",
    };
  if (d.year4?.id === "autonomy" && job.stars >= 3 && job.category === "廣告")
    return {
      ok: false,
      reason:
        "「創作自主」不接受三星以上品牌綁定；這是換取作品與選角決定權的代價。",
    };
  if (d.year4?.id === "sustainable" && active >= 2)
    return {
      ok: false,
      reason:
        "「可持續職涯」限制同時最多兩份正式合約；先完成現有工作，才能再簽下一份。",
    };
  if (d.year5?.id === "masterpiece" && active >= 1 && job.stars < 5)
    return {
      ok: false,
      reason:
        "「代表作優先」在已有製作進行時只保留五星新案；最後一年不再用工作數量填滿檔期。",
    };
  return { ok: true, reason: "" };
}
export function qualification(job) {
  const rows = roleRequirements(job).map(([name, required], index) => ({
    name,
    required,
    core: index === 0,
    current: effectiveStat(name),
    met: effectiveStat(name) >= required,
  }));
  const training = state.trainingSessionsCompleted || 0,
    trainingRequired = roleTrainingRequirement(job),
    brandOk =
      (job.category !== "廣告" || brandEligible(job.stars)) &&
      brandCanWork(job.client, job.stars),
    commitment = careerCommitmentAccess(job),
    doctrine = careerDoctrineAccess(job);
  return {
    rows,
    training,
    trainingRequired,
    brandOk,
    commitmentOk: commitment.ok,
    commitmentReason: commitment.reason || "",
    doctrineOk: doctrine.ok,
    doctrineReason: doctrine.reason || "",
    met:
      rows.filter((r) => r.core).every((r) => r.met) &&
      training >= trainingRequired &&
      brandOk &&
      commitment.ok &&
      doctrine.ok,
  };
}
function assertStage(id, allowed) {
  const record = ensureJobState(id);
  return record && allowed.includes(record.stage) ? record : null;
}
export function selectedJobRole(id) {
  const job = JOB_BY_ID[id];
  return roleProfile(job);
}
export function applyForJob(id) {
  const job = JOB_BY_ID[id];
  if (!job) return false;
  const access = canAccessJob(job);
  if (!access.ok) {
    state.notice = access.reason;
    return false;
  }
  const record = assertStage(id, ["available"]);
  if (!job || !record) return false;
  const q = qualification(job),
    role = roleProfile(job);
  if (!q.met) {
    record.notice = !q.commitmentOk
      ? q.commitmentReason
      : !q.doctrineOk
        ? q.doctrineReason
        : !q.brandOk
          ? `${job.client}目前對你的合作評估偏保守，這份工作暫不開放。`
          : `「${role.label}」資格尚未達標：${
              q.rows
                .filter((r) => r.core && !r.met)
                .map((r) => r.name)
                .join("、") || `至少 ${q.trainingRequired} 次訓練`
            }`;
    return false;
  }
  record.sourceType = access.source.type;
  record.referrerId = access.source.referrerId || null;
  record.sourceAgencyId = access.source.agencyId || null;
  record.sourceWorkId = access.source.sourceWorkId || activeWorkEchoOpportunity(job.id)?.workId || null;
  record.stage = "applied";
  record.appliedWeek = state.week;
  record.notice = `已登記「${role.label}」試鏡。`;
  state.selectedJobId = id;
  return true;
}
export function auditionScheduleOptions() {
  return [0, 1, 2, 3, 4, 5, 6]
    .filter(
      (day) =>
        ["rest", "free"].includes(state.schedule[day]) &&
        !state.scheduledActivityIds?.[day],
    )
    .map((day) => ({ day, label: DAYS[day] }));
}
export function scheduleJobAudition(id, preferredDay = null) {
  const job = JOB_BY_ID[id],
    record = assertStage(id, ["applied", "failed"]);
  if (!job || !record) return { ok: false, message: "這份試鏡目前無法安排。" };
  if (
    record.stage === "failed" &&
    record.lastAuditionWeek != null &&
    state.week - record.lastAuditionWeek < 2
  )
    return {
      ok: false,
      message: `同一通告試鏡失敗後需等到第 ${record.lastAuditionWeek + 2} 週。`,
    };
  const options = auditionScheduleOptions(),
    selected =
      preferredDay == null
        ? options[0]
        : options.find((x) => x.day === Number(preferredDay));
  if (!selected)
    return { ok: false, message: "本週沒有可用空檔，請先留一天給試鏡。" };
  const role = roleProfile(job),
    result = scheduleActivity(
      "job_audition",
      { jobId: id },
      `${job.title}・${role.label}試鏡`,
      { fatigue: 10, stamina: 10, preferredDay: selected.day },
    );
  if (!result.ok) return result;
  record.stage = "audition_scheduled";
  record.auditionActivityId = result.id;
  record.auditionWeek = state.week;
  record.auditionDay = result.day;
  record.notice = `試鏡已排入${DAYS[result.day]}；當天才會正式表現與判定。`;
  state.selectedJobId = id;
  return result;
}
export function startJobAudition(id) {
  return scheduleJobAudition(id).ok;
}
function baseAuditionChance(job, choice = "steady") {
  const role = roleProfile(job),
    gaps = roleRequirements(job).map(
      ([name, min]) => effectiveStat(name) - min,
    ),
    avg = gaps.reduce((s, n) => s + n, 0) / Math.max(1, gaps.length);
  const hidden = job.softTraits.reduce(
    (s, name) => s + ((state.hidden[name] || 500) - 500) / 40,
    0,
  );
  return Math.max(
    5,
    Math.min(
      95,
      Math.round(
        50 +
          avg * 0.16 +
          hidden +
          reputationScore(job) +
          jobMarketModifier(job.category) +
          marketJobModifier(job.category) +
          personaJobModifier(job.category) -
          competitionPressure(job.category) +
          brandAuditionModifier(job.client) +
          managerAuditionModifier(job) +
          workEchoAuditionBonus(job.id) +
          scandalMarketPenalty() +
          role.auditionModifier +
          (choice === "steady" ? 8 : techniqueChoices(job, state).some(c => c.id === choice) ? 12 : -3),
      ),
    ),
  );
}
export function auditionChance(job, choice = "steady") {
  return Math.min(
    95,
    successChanceWithCondition(baseAuditionChance(job, choice), "audition") +
      (state.focus === "fame" ? 5 : 0),
  );
}
export function jobAuditionDecision(task) {
  const job = JOB_BY_ID[task?.payload?.jobId],
    record = job && state.activeJobs[job.id];
  if (!job || record?.stage !== "audition_scheduled") return null;
  const role = roleProfile(job);
  return {
    kind: "job_audition",
    title: `${titleTag(job.title)}試鏡`,
    text: `試鏡角色：${role.label}。${job.audition.prompt}（目前${performanceLabel("audition")}）`,
    choices: [...job.audition.choices, ...techniqueChoices(job, state)].map((c) => ({
      id: c.id,
      label: c.label,
      note: `${c.note}・${successRateLabel(auditionChance(job, c.id))}`,
    })),
  };
}
export function resolveAudition(id, choice) {
  const job = JOB_BY_ID[id],
    record = assertStage(id, ["audition_scheduled", "audition"]);
  if (!job || !record) return null;
  const technique = techniqueChoices(job, state).find(c => c.id === choice);
  if (!job.audition.choices.some(c => c.id === choice) && !technique) return null;
  const role = roleProfile(job),
    pct = auditionChance(job, choice),
    passed = chance(pct),
    story = jobStoryline(id);
  record.stage = passed ? "passed" : "failed";
  record.lastAuditionWeek = state.week;
  consumeWorkEchoOpportunity(job.id);
  record.auditionActivityId = null;
  record.auditionChoice = choice;
  record.notice = passed
    ? `${role.label}試鏡通過・可閱讀正式合約`
    : `${role.label}未獲選・本次徵選已結束`;
  storyFeed(record, {
    phase: "audition",
    title: `${titleTag(job.title)}試鏡`,
    text: `${story?.audition?.arrival || job.audition.prompt} ${technique?.text || (choice === "bold" ? story?.audition?.bold : story?.audition?.steady)} ${passed ? story?.audition?.passed : story?.audition?.failed}`,
    choice,
    result: passed ? "passed" : "failed",
  });
  if (passed) assignJobCast(job, record);
  else recordBrandOutcome(job.client, "audition_failed");
  state.jobHistory.push({
    jobId: id,
    week: state.week,
    type: "audition",
    result: record.stage,
    choice,
    chance: pct,
    roleId: role.id,
    npcCast: [...(record.npcCast || [])],
  });
  return { passed, chance: pct, label: successRateLabel(pct), role, story, technique };
}
export function resolveScheduledJobAudition(task, choice) {
  const job = JOB_BY_ID[task?.payload?.jobId],
    result = job && resolveAudition(job.id, choice),
    copy = result?.story?.audition;
  if (!job || !result) return { ok: false, text: "這場試鏡已失效。" };
  const audition = { passed: result.passed, work: job.title, role: result.role.label, venue: job.audition.venue, client: job.client, arrival: copy?.arrival || job.audition.prompt, choice: result.technique?.text || (choice === "bold" ? copy?.bold : copy?.steady), feedback: result.passed ? copy?.passed : copy?.failed };

  return {
    ok: true,
    title: result.passed
      ? `${titleTag(job.title)}試鏡通過！`
      : `${titleTag(job.title)}這次沒有獲選`,
    audition,
    jobOfferId: result.passed ? job.id : null,
    text: `${auditionResultCard(audition)}${result.passed ? `<section class="audition-contract-offer"><span>NEXT STEP・正式合約</span><b>製作方已在現場送出合約</b><p>試鏡通過後直接確認，不必再回工作信箱尋找這份通告。</p><button class="main-btn" data-sign-job-now="${job.id}">立即簽署${titleTag(job.title)} →</button></section>` : ""}`,
  };
}
export function signJob(id) {
  const job = JOB_BY_ID[id],
    record = assertStage(id, ["passed"]);
  if (!job || !record) return false;
  assignJobCast(job, record);
  attachJobCrew(job, record);
  record.signedWeek = state.week;
  record.deadlineWeek = state.week + job.deadlineWeeks - 1;
  record.remainingSessions = job.sessions;
  record.completedSessions = 0;
  const booking = confirmJobCastAndSchedule(job, record);
  if (!booking.ok) {
    record.notice = booking.message || "共演陣容檔期無法確認，暫時無法簽約。";
    record.signedWeek = null;
    record.deadlineWeek = null;
    return false;
  }
  record.stage = "active";
  const story = jobStoryline(id),
    contractText = story?.contract?.text?.replace(
      "{deadline}",
      record.deadlineWeek,
    );
  record.notice =
    contractText ||
    (booking.recast
      ? "合約已成立；原合作人選撞檔，製作方已調整陣容。"
      : "合約已成立，合作陣容檔期已鎖定。");
  storyFeed(record, {
    phase: "contract",
    title: story?.contract?.title || `簽署${titleTag(job.title)}`,
    text: record.notice,
  });
  state.flags.push({
    week: state.week,
    label: `簽署通告：${job.title}`,
    note: `以「${roleProfile(job).label}」演出，需於第 ${record.deadlineWeek} 週前完成 ${job.sessions} 次工作。`,
  });
  return true;
}
export function jobScheduleOptions(id) {
  const job = JOB_BY_ID[id],
    record = assertStage(id, ["active"]);
  if (!job || !record) return [];
  refreshNpcJobSchedule(job, record);
  const npcDays = record.npcCast?.length
    ? new Set(jobNpcSlotsForWeek(record, state.week).map((slot) => slot.day))
    : null;
  return job.workDays
    .filter(
      (day) =>
        (!npcDays || npcDays.has(day)) &&
        ["rest", "free"].includes(state.schedule[day]) &&
        !state.scheduledJobIds[day],
    )
    .map((day) => ({ day, label: DAYS[day] }));
}
export function scheduleJobSession(id, preferredDay = null) {
  const job = JOB_BY_ID[id],
    record = assertStage(id, ["active"]);
  if (!job || !record) return { ok: false, message: "通告目前不在執行中。" };
  const options = jobScheduleOptions(id);
  const selected =
    preferredDay == null
      ? options[0]
      : options.find((x) => x.day === Number(preferredDay));
  if (!selected)
    return {
      ok: false,
      message: record.npcCast?.length
        ? "本週玩家或合作藝人的共同檔期沒有可用空檔。"
        : `本週指定工作日（${job.workDays.map((i) => DAYS[i]).join("、")}）沒有可用空檔。`,
    };
  const day = selected.day,
    result = scheduleChange(state, day, { type: "job_session", jobId: id });
  if (!result.ok) return result;
  state.selectedDay = day;
  return {
    ok: true,
    day,
    options,
    message: `${titleTag(job.title)}已排入${DAYS[day]}。`,
  };
}
export function cancelScheduledJobSession(day) {
  if (state.schedule[day] !== "job_session") return false;
  state.schedule[day] = "rest";
  state.scheduledJobIds[day] = null;
  return true;
}
export function completeJobSession(id, choice = null) {
  const job = JOB_BY_ID[id],
    record = assertStage(id, ["active"]);
  if (!job || !record) {
    clearJobProductionEvent(id);
    return { ok: false, text: "這份通告已不在執行中。" };
  }
  const pending = resolveJobProductionDecision(job, record, choice);
  if (pending) return pending;
  record.remainingSessions = Math.max(0, record.remainingSessions - 1);
  record.completedSessions += 1;
  completeNpcJobSlot(id, state.week, state.runnerDay);
  const perSession = Object.entries(job.rewards.growth || {}).map(
      ([name, total]) => {
        const gain = Math.max(1, Math.round(total / job.sessions));
        state.stats[name] = Math.min(1000, (state.stats[name] || 0) + gain);
        return `${name}＋${gain}`;
      },
    ),
    relations = applyJobNpcRelations(job, record, { completed: false }),
    encounters = relations.encounters,
    completed = record.remainingSessions === 0,
    story = jobStoryline(id),
    frames = jobProductionFrames(job, record, { completed }),
    scene = frames.at(-1) || continuingJobScene(job, record,
      Object.values(state.activeJobs).flatMap((item) => item.continuationHistory || [])
        .sort((a, b) => a.week - b.week || a.day - b.day),
    );
  if (!frames.length) {
    record.continuationHistory ??= [];
    record.continuationHistory.push({ sceneId: scene.id, week: state.week, day: state.runnerDay || 0, session: record.completedSessions });
    record.continuationHistory = record.continuationHistory.slice(-24);
  }
  const sceneMarkup = (frames.length ? frames : [scene])
    .map(
      (beat) =>
        `<section class="job-production-story"><span>${beat.label}・${job.category}・${job.id}</span>\n<h3>${beat.title}</h3>\n<p>${beat.text}</p>\n</section>`,
    )
    .join("\n");
  for (const beat of frames)
    storyFeed(record, {
      phase: beat.stage === 3 ? "completion" : "production",
      ...beat,
      session: record.completedSessions,
    });
  if (!completed) {
    return {
      ok: true,
      completed: false,
      scene,
      scenes: frames,
      encounter: encounters[0] || null,
      encounters,
      text: `${sceneMarkup}${record.auditionChoice ? `<small>試鏡時的選擇：${record.auditionChoice === "bold" ? story?.audition?.bold : story?.audition?.steady}</small>` : ""}<aside class="job-session-progress">${perSession.join("、")}・合約剩餘 ${record.remainingSessions} 次</aside>`,
    };
  }
  record.stage = "completed";
  record.completedWeek = state.week;
  releaseNpcJobSchedule(id);
  const grossPay = marketAdjustedPay(job),
    income = calculateJobIncome(grossPay),
    role = roleProfile(job),
    fameGain =
      Math.max(1, Math.round(job.rewards.fame * role.fame)) +
      (state.focus === "fame" ? 2 : 0),
    fanGain = Math.max(0, Math.round(job.rewards.fans * role.fame));
  state.money += income.net;
  state.fame += fameGain;
  state.fans += fanGain;
  applyJobNpcRelations(job, record, { completed: true });
  let quality = workQuality(job);
  if (record.auditionChoice === "steady") quality = Math.min(100, quality + 2);
  else if (record.auditionChoice === "bold") {
    quality = Math.min(100, quality + 3);
    state.rep.話題度 = Math.min(1000, (state.rep.話題度 || 0) + 3);
  }
  if (state.eventFlags.includes(`flagship:${job.id}:signature`))
    quality = Math.min(100, quality + 6);
  else if (state.eventFlags.includes(`flagship:${job.id}:breakthrough`))
    quality = Math.min(100, quality + 4);
  else if (state.eventFlags.includes(`flagship:${job.id}:protect`))
    quality = Math.min(100, quality + 3);
  recordCrewOutcome(job, record, quality);
  const work = addCompletedWork(job, {
    quality,
    npcCast: record.npcCast,
    role,
  });
  if (record.sourceWorkId) work.originWorkId = record.sourceWorkId;
  work.storyChoice =
    ["signature", "breakthrough", "protect"].find((choice) =>
      state.eventFlags.includes(`flagship:${job.id}:${choice}`),
    ) || record.auditionChoice;
  work.storyLegacy = story?.legacy;
  recordBrandOutcome(job.client, "completed", { quality });
  state.jobHistory.push({
    jobId: id,
    week: state.week,
    type: "completed",
    quality,
    grossPay,
    netIncome: income.net,
    roleId: role.id,
    npcCast: [...(record.npcCast || [])],
    storyChoice: work.storyChoice,
  });
  state.flags.push({
    week: state.week,
    label: `完成作品：${job.title}`,
    note: `以「${role.label}」完成作品，品質 ${quality}，市場調整後收入 ${income.net}。`,
  });
  const echo =
    story?.flagshipChoices?.[work.storyChoice]?.outcome ||
    (record.auditionChoice === "bold"
      ? story?.completion?.bold
      : story?.completion?.steady);
  return {
    ok: true,
    completed: true,
    work,
    income,
    scene,
    scenes: frames,
    encounter: encounters[0] || null,
    encounters,
    text: `${sceneMarkup}<section class="job-production-story finale"><strong>${echo || "這份作品記住了你一路做出的選擇。"}</strong></section><aside class="job-session-progress">${perSession.join("、")}・${role.label}・品質 ${quality}<br>實領 ${income.net}・知名度＋${fameGain}・粉絲＋${fanGain + (work.agencyPromotion?.fansBonus || 0)}${work.agencyPromotion ? `（含公司宣傳 ${work.agencyPromotion.fansBonus}）` : ""}</aside>`,
  };
}
export function checkJobDeadlines() {
  const breached = [];
  for (const [id, record] of Object.entries(state.activeJobs)) {
    if (
      record.stage === "active" &&
      state.week > record.deadlineWeek &&
      record.remainingSessions > 0
    ) {
      const job = JOB_BY_ID[id],
        story = jobStoryline(id);
      record.stage = "breached";
      clearJobProductionEvent(id);
      record.notice =
        story?.breach?.text ||
        `逾期未完成 ${record.remainingSessions} 次工作。`;
      storyFeed(record, {
        phase: "breach",
        title: story?.breach?.title || `${titleTag(job.title)}違約`,
        text: record.notice,
      });
      releaseNpcJobSchedule(id);
      state.rep.業界評價 = Math.max(
        0,
        (state.rep.業界評價 || 0) - Math.max(5, job.stars * 5),
      );
      recordBrandOutcome(job.client, "breached");
      recordScandal(
        "breach",
        Math.min(3, Math.max(1, job.stars - 1)),
        `${titleTag(job.title)}違約`,
      );
      state.jobHistory.push({
        jobId: id,
        week: state.week,
        type: "breached",
        remaining: record.remainingSessions,
        npcCast: [...(record.npcCast || [])],
        story: record.notice,
      });
      state.flags.push({
        week: state.week,
        label: `違約：${job.title}`,
        note: record.notice,
      });
      breached.push(id);
    }
  }
  return breached;
}
