import { AGENCIES } from "../data/agencies.js";
const kinds = new Set(["direction", "rest", "promotion"]);
const cats = new Set(["歌曲", "電影", "電視劇", "綜藝", "廣告"]);
const integer = (n, fallback = 1) => Number.isFinite(n) ? Math.max(1, Math.floor(n)) : fallback;
export function normalizeAgencyAgreements(raw) {
  return { records: (Array.isArray(raw?.records) ? raw.records : []).filter(r => r && AGENCIES[r.agencyId] && kinds.has(r.kind)).slice(-120).map(r => ({
    id: `${r.agencyId}:${integer(r.sinceWeek)}:${r.kind}`, agencyId: r.agencyId, kind: r.kind,
    category: cats.has(r.category) ? r.category : null, mode: r.mode === "launch" ? "launch" : "steady",
    sinceWeek: integer(r.sinceWeek), untilWeek: integer(r.untilWeek, integer(r.sinceWeek)),
    status: ["active", "expired", "cancelled"].includes(r.status) ? r.status : "active",
    trial: !!r.trial,
    deliveries: (Array.isArray(r.deliveries) ? r.deliveries : []).filter(d => d && typeof d.workId === "string").slice(-80).map(d => ({ workId: d.workId.slice(0, 140), week: integer(d.week), fans: Math.max(0, Math.min(120, Math.floor(Number(d.fans) || 0))) })),
  })) };
}
