import { NPCS } from "../data/npcs.js";
const validStages = new Set(["opening", "weeks", "anniversary"]);
const validChoices = new Set(["proud", "mixed", "quiet", "revisit", "forward", "leave"]);
const week = n => Math.max(1, Math.floor(Number(n) || 1));
const clean = (s, max = 4000) => typeof s === "string" ? s.slice(0, max) : "";
export function normalizeWorkEchoes(raw) {
  const records = Array.isArray(raw?.records) ? raw.records : [];
  const unique = new Map();
  for (const r of records) {
    if (!r || !clean(r.workId, 140) || !validStages.has(r.stage)) continue;
    const id = `work-echo:${clean(r.workId, 140)}:${r.stage}`;
    unique.set(id, { id, workId: clean(r.workId, 140), stage: r.stage, dueWeek: week(r.dueWeek), publishedWeek: week(r.publishedWeek),
      title: clean(r.title, 300), text: clean(r.text), publicTitle: clean(r.publicTitle, 300), publicText: clean(r.publicText), summary: clean(r.summary, 500),
      replies: (Array.isArray(r.replies) ? r.replies : []).map(s => clean(s, 700)).slice(0, 4),
      npcId: NPCS[r.npcId] ? r.npcId : null, npcText: clean(r.npcText, 1000),
      choice: validChoices.has(r.choice) ? r.choice : null, resolvedWeek: r.resolvedWeek ? week(r.resolvedWeek) : null,
      eventQueued: !!r.eventQueued,
      ...(r.copyVersion === 1 && clean(r.copyId, 180) ? {
        copyVersion: 1, copyId: clean(r.copyId, 180),
      } : {}),
    });
  }
  return { records: [...unique.values()].slice(-6000), opportunities: (Array.isArray(raw?.opportunities) ? raw.opportunities : []).filter(o => o && clean(o.workId, 140) && /^J\d{3}$/.test(o.jobId)).slice(-180).map(o => ({
    id: `work-echo-offer:${clean(o.workId, 140)}:${validStages.has(o.stage) ? o.stage : "weeks"}`,
    workId: clean(o.workId, 140), stage: validStages.has(o.stage) ? o.stage : "weeks", jobId: o.jobId,
    offeredWeek: week(o.offeredWeek), expiresWeek: week(o.expiresWeek), usedWeek: o.usedWeek ? week(o.usedWeek) : null,
  })) };
}
