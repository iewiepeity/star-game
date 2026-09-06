import { NPCS } from "../data/npcs.js";

// Outcomes contain prose effects, not the original effect objects. Keep their
// participants explicitly; also recover old saves using stable event IDs.
export function eventContext(event = {}, meta = {}) {
  const saved = event.storyContext || {};
  const ids = new Set(saved.npcIds || []);
  function collect(value) {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) return value.forEach(collect);
    for (const key of ["npcId", "npc"])
      if (NPCS[value[key]]) ids.add(value[key]);
    for (const id of value.npcIds || []) if (NPCS[id]) ids.add(id);
    for (const id of value.cast || []) if (NPCS[id]) ids.add(id);
    for (const key of ["effect", "effects", "choices"]) collect(value[key]);
  }
  collect(event);
  for (const [id, npc] of Object.entries(NPCS)) {
    if (
      ["npc-story-", "npc-romance-", "npc-arc-", "npc-"].some((prefix) =>
        [":", "-"].some((separator) =>
          String(event.id || "").startsWith(`${prefix}${id}${separator}`),
        ),
      ) ||
      String(event.title || "").includes(npc.name)
    )
      ids.add(id);
  }
  const npcIds = [...ids].filter((id) => NPCS[id]);
  const source = saved.source || meta.source || "";
  return {
    npcIds,
    channel:
      saved.channel ||
      (/人物主動|來信|邀約/.test(source)
        ? "message"
        : npcIds.length
          ? "relationship"
          : "story"),
    source,
    week: saved.week || meta.queuedWeek || event.week || meta.week || null,
  };
}
