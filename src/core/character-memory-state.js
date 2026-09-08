import { romanceDailyPool, romanceDailyBond } from "../data/romance-personal-daily.js";
import { NPCS } from "../data/npcs.js";

const object = value => value && typeof value === "object" && !Array.isArray(value) ? value : {};
const text = (value, limit = 500) => typeof value === "string" ? value.slice(0, limit) : "";
const safeKey = value => typeof value === "string" && /^[a-zA-Z0-9:_-]{1,160}$/.test(value);
const kinds = new Set(["preference", "boundary", "promise", "response", "shared"]);
export function normalizeMemoryEntry(raw) {
  if (!raw || !kinds.has(raw.kind) || !safeKey(raw.key) || typeof raw.value !== "string") return null;
  return {
    kind: raw.kind, key: raw.key, value: text(raw.value, 160),
    label: text(raw.label, 100), text: text(raw.text), source: text(raw.source, 100),
    week: Number.isInteger(raw.week) && raw.week > 0 ? Math.min(10000, raw.week) : 1,
    status: raw.kind === "promise" && ["pending", "fulfilled", "released"].includes(raw.status) ? raw.status : raw.kind === "promise" ? "pending" : "recorded",
    dueWeek: Number.isInteger(raw.dueWeek) && raw.dueWeek > 0 ? Math.min(10000, raw.dueWeek) : null,
  };
}
function values(raw) {
  return Object.fromEntries(Object.entries(object(raw)).filter(([key, value]) => safeKey(key) && typeof value === "string").slice(-80).map(([key, value]) => [key, text(value, 160)]));
}
export function normalizeCharacterMemories(raw) {
  return Object.fromEntries(Object.entries(object(raw)).filter(([id]) => Object.hasOwn(NPCS, id)).map(([id, source]) => {
    const item = object(source);
    const entries = (key, kind, limit) => (Array.isArray(item[key]) ? item[key] : []).map(normalizeMemoryEntry).filter(entry => entry && (!kind || entry.kind === kind)).slice(-limit);
    const promises = entries("promises", "promise", 40);
    const shared = entries("shared", "shared", 60), responses = entries("responses", "response", 40);
    const knownBonds = new Set(["care", "private", "work", "reliability"]);
    const bonds = new Set((Array.isArray(item.bonds) ? item.bonds : []).filter(id => knownBonds.has(id)));
    for (const entry of shared) if (entry.key.startsWith("bond:") && knownBonds.has(entry.value)) bonds.add(entry.value);
    for (const entry of shared) {
      const match = /^romance:([^:]+):(.+)$/.exec(entry.key);
      if (!match) continue;
      const scene = romanceDailyPool(id, match[1]).find(item => item.id === match[2]);
      const bond = romanceDailyBond(scene, scene?.choices.find(choice => choice.id === entry.value));
      if (bond) bonds.add(bond);
    }
    if (promises.some(p => p.status === "fulfilled")) bonds.add("reliability");
    if (!bonds.size && responses.some(p => p.key === "support" && p.value === "listened")) bonds.add("care");
    return [id, { bonds: [...bonds], preferences: values(item.preferences), boundaries: values(item.boundaries),
      promises: promises.filter((entry, index) => promises.findLastIndex(other => other.key === entry.key) === index),
      responses: entries("responses", "response", 40), shared: entries("shared", "shared", 60), history: entries("history", null, 100),
    }];
  }));
}
