import { NPCS } from "../data/npcs.js";
import { OUTFITS } from "../data/wardrobe.js";
import { REGULAR_PLACES } from "../data/city-life.js";

const object = (v) =>
  v && typeof v === "object" && !Array.isArray(v) ? v : {};
const list = (v, max = 2000) => (Array.isArray(v) ? v.slice(-max) : []);
const text = (v, max = 400) =>
  typeof v === "string"
    ? v.replace(/[<>\u0000-\u001f]/g, "").slice(0, max)
    : "";
const integer = (v, min, max, fallback = min) =>
  Number.isInteger(v) && v >= min && v <= max ? v : fallback;
const npc = (id) => Object.hasOwn(NPCS, id);
const unique = (values) => [...new Set(values)];
export const cityDay = (game, day = game.runnerDay || 0) =>
  (game.week - 1) * 7 + day;
export const activePartner = (rel) =>
  ["dating", "committed", "engaged", "married"].includes(rel?.romance);
export function initialCityLife() {
  return {
    version: 1,
    regulars: {},
    outfitMemories: [],
    appointments: [],
    pet: null,
    practice: { completed: [], mastered: 0 },
    echoes: [],
    sourceIds: [],
    photos: [],
    notice: "",
  };
}
export function normalizeCityLife(raw) {
  const v = object(raw),
    out = initialCityLife();
  for (const id of Object.keys(REGULAR_PLACES)) {
    const entry = object(v.regulars?.[id]);
    if (Object.keys(entry).length)
      out.regulars[id] = {
        days: unique(
          list(entry.days, 1820).filter(
            (n) => Number.isInteger(n) && n >= 0 && n < 1820,
          ),
        ),
        redeemed: entry.redeemed === true,
      };
  }
  out.outfitMemories = list(v.outfitMemories)
    .filter((m) => m && npc(m.npcId) && Object.hasOwn(OUTFITS, m.outfitId))
    .map((m) => ({
      npcId: m.npcId,
      outfitId: m.outfitId,
      day: integer(m.day, 0, 1819),
      occasion: ["home", "daily", "practice", "work", "stage"].includes(
        m.occasion,
      )
        ? m.occasion
        : "daily",
      text: text(m.text),
    }));
  out.appointments = list(v.appointments, 400)
    .filter(
      (a) =>
        a &&
        npc(a.npcId) &&
        [
          "birthday",
          "player-birthday",
          "new-year",
          "anniversary",
          "collab",
        ].includes(a.kind) &&
        typeof a.id === "string",
    )
    .map((a) => ({
      id: text(a.id, 120),
      eventId: text(a.eventId, 120),
      npcId: a.npcId,
      kind: a.kind,
      title: text(a.title, 80),
      due: integer(a.due, 0, 1819),
      day: integer(a.day, 0, 1819),
      origin: integer(a.origin, 0, 1819),
      status: ["reserved", "completed", "cancelled", "missed"].includes(
        a.status,
      )
        ? a.status
        : "cancelled",
      reschedules: integer(a.reschedules, 0, 30),
      photoConsent: a.photoConsent === true,
      text: text(a.text),
    }));
  if (["cat", "dog"].includes(v.pet?.kind))
    out.pet = {
      kind: v.pet.kind,
      name: text(v.pet.name, 16) || "小星",
      adopted: integer(v.pet.adopted, 0, 1819),
      greeted: unique(
        list(v.pet.greeted, 1820).filter(
          (d) => Number.isInteger(d) && d >= 0 && d < 1820,
        ),
      ),
      comfortWeeks: unique(
        list(v.pet.comfortWeeks, 260).filter(
          (w) => Number.isInteger(w) && w >= 1 && w <= 260,
        ),
      ),
      walks: unique(
        list(v.pet.walks, 1820).filter(
          (d) => Number.isInteger(d) && d >= 0 && d < 1820,
        ),
      ),
      care:
        v.pet.care && (v.pet.care.npcId === "service" || npc(v.pet.care.npcId))
          ? { npcId: v.pet.care.npcId, week: integer(v.pet.care.week, 1, 260) }
          : null,
      careDays: unique(
        list(v.pet.careDays, 1820).filter(
          (d) => Number.isInteger(d) && d >= 0 && d < 1820,
        ),
      ),
    };
  out.practice = {
    completed: unique(
      list(v.practice?.completed, 1820).filter(
        (d) => Number.isInteger(d) && d >= 0 && d < 1820,
      ),
    ),
    mastered: integer(v.practice?.mastered, 0, 1820, 0),
  };
  out.echoes = list(v.echoes, 800)
    .filter(
      (e) =>
        e &&
        npc(e.npcId) &&
        ["home", "gift", "date", "pet", "collab"].includes(e.kind),
    )
    .map((e) => ({
      id: text(e.id, 160),
      npcId: e.npcId,
      kind: e.kind,
      due: integer(e.due, 0, 1826),
      source: text(e.source, 200),
      text: text(e.text),
      status: ["pending", "delivered", "closed"].includes(e.status)
        ? e.status
        : "closed",
      accepted: e.accepted === true,
    }));
  out.sourceIds = unique(
    list(v.sourceIds, 8000)
      .map((id) => text(id, 160))
      .filter(Boolean),
  );
  out.photos = list(v.photos, 400)
    .filter((p) => p && npc(p.npcId))
    .map((p) => ({
      id: text(p.id, 160),
      appointmentId: text(p.appointmentId, 120),
      npcId: p.npcId,
      day: integer(p.day, 0, 1819),
      published: p.published === true,
      text: text(p.text),
    }));
  out.notice = text(v.notice);
  return out;
}
