import { NPC_ARCS } from "../data/npc-arc-events.js";
import { NPC_LONGFORM_CHAPTERS } from "../data/longform-content.js";
import { NPCS } from "../data/npcs.js";
import { NPC_INVITATION_POOLS } from "../data/invitation-content.js";
import { eventContext } from "../logic/event-context.js";

// Locations are authored in chapter order, not inferred from the dialogue.
// Follow-ups return to the same set, preserving the visual memory of a choice.
const ARC_ROOMS = {
  jiqing: ["radio", "radio", "radio"],
  shenyao: ["cinema", "film_company", "studio"],
  tangtang: ["dance", "recording", "livehouse"],
  guchengxi: ["theatre", "rehearsal", "theatre"],
  linxiafan: ["shop", "shop", "shop"],
  lujingran: ["recording", "record_company", "recording"],
  xiayutong: ["film_company", "editing_room", "studio"],
  sufei: ["cafe", "rehearsal", "studio"],
  chengyian: ["media_company", "media_company", "cafe"],
  hanzhiyuan: ["business", "business", "restaurant"],
};
const LONG_ROOMS = {
  jiqing: ["radio", "radio", "radio", "tv", "radio"],
  shenyao: ["editing_room", "studio", "editing_room", "cinema", "cinema"],
  tangtang: ["dance", "park", "record_company", "dance", "livehouse"],
  guchengxi: ["film_company", "studio", "film_company", "theatre", "theatre"],
  linxiafan: ["shop", "shop", "shop", "shop", "shop"],
  lujingran: ["recording", "recording", "recording", "recording", "livehouse"],
  xiayutong: ["rehearsal", "film_company", "studio", "cinema", "studio"],
  sufei: ["cafe", "rehearsal", "tv", "cinema", "studio"],
  chengyian: [
    "media_company",
    "media_company",
    "media_company",
    "media_company",
    "cafe",
  ],
  hanzhiyuan: ["business", "business", "business", "business", "restaurant"],
};
export const PERSONAL_SETS = {
  silver_pc: { room: "editing_room", date: "cinema", gesture: "read" },
  jiqing: { room: "radio", date: "cafe", gesture: "read" },
  shenyao: { room: "cinema", date: "cinema", gesture: "read" },
  tangtang: { room: "dance", date: "livehouse", gesture: "dance" },
  guchengxi: { room: "theatre", date: "theatre", gesture: "read" },
  linxiafan: { room: "shop", date: "shop", gesture: "read" },
  lujingran: { room: "recording", date: "recording", gesture: "listen" },
  xiayutong: { room: "studio", date: "cinema", gesture: "read" },
  sufei: { room: "rehearsal", date: "cafe", gesture: "read" },
  chengyian: { room: "media_company", date: "cafe", gesture: "read" },
  hanzhiyuan: { room: "business", date: "restaurant", gesture: "read" },
};
export const CHAPTER_SETS = Object.fromEntries(
  Object.entries(NPC_ARCS)
    .flatMap(([npcId, chapters]) =>
      chapters.map((c, i) => [
        `npc-arc-${npcId}-${c.id}`,
        { room: ARC_ROOMS[npcId][i], npcId },
      ]),
    )
    .concat(
      Object.entries(NPC_LONGFORM_CHAPTERS).flatMap(([npcId, chapters]) =>
        chapters.map((c, i) => [
          `npc-long:${npcId}:${c.id}`,
          { room: LONG_ROOMS[npcId][i], npcId },
        ]),
      ),
    ),
);
export const HIDDEN_CHAPTER_SETS = {
  "silver-route-encounter": { room: "cinema", npcId: "silver_pc" },
  "silver-route-echo": { room: "editing_room", npcId: "silver_pc" },
  "silver-route-fracture": { room: "editing_room", npcId: "silver_pc" },
  "silver-route-festival": { room: "studio", npcId: "silver_pc" },
  "silver-route-archive": { room: "editing_room", npcId: "silver_pc" },
  "silver-route-consent": { room: "cinema", npcId: "silver_pc" },
  "silver-route-choice": { room: "editing_room", npcId: "silver_pc" },
  "silver-route-finale": { room: "cinema", npcId: "silver_pc" },
};
const INVITATION_ROOMS = {
  jiqing: ["cafe", "radio", "radio", "radio"],
  shenyao: ["cinema", "editing_room", "cinema", "studio"],
  tangtang: ["rehearsal", "park", "livehouse", "dance"],
  guchengxi: ["restaurant", "market", "theatre", "record_company"],
  linxiafan: ["shop", "shop", "shop", "shop"],
  lujingran: ["recording", "park", "recording", "rehearsal"],
  xiayutong: ["studio", "cinema", "cafe", "studio"],
  sufei: ["rehearsal", "cafe", "park", "rehearsal"],
  chengyian: ["cafe", "media_company", "park", "media_company"],
  hanzhiyuan: ["business", "business", "restaurant", "business"],
};
const INVITATION_TYPES = ["ordinary", "low", "romance", "conflict"];
const clean = (value) => String(value || "").replace(/<[^>]*>/g, " ");

export function adaptSavedInvitation(event, game) {
  if (!event?.id?.startsWith("invitation:")) return event;
  const record = (game.npcInvitationHistory || []).find(
    (r) => event.id === r.id || event.id === r.id + ":rescheduled",
  );
  const def = NPC_INVITATION_POOLS[record?.npcId]?.[record?.type];
  if (!def || !record.title || record.title === def.place) return event;
  // Only pending official invitations are adapted. Existing decisions and
  // historical outcomes keep their original text and numerical effects.
  function copy(value) {
    if (typeof value === "string")
      return value.replaceAll(record.title, def.place);
    if (Array.isArray(value)) return value.map(copy);
    if (value && typeof value === "object")
      return Object.fromEntries(
        Object.entries(value).map(([k, v]) => [k, copy(v)]),
      );
    return value;
  }
  const result = copy(event);
  if (!event.id.endsWith(":rescheduled")) {
    result.text = def.ask;
    if (result.beats?.[0])
      result.beats[0].text = `地點是${def.place}。${def.ask}`;
    if (result.beats?.[1]) result.beats[1].text = def.detail;
  }
  return result;
}

export function storyScene(event, game = {}, meta = {}) {
  if (!event) return null;
  const context = eventContext(event, meta);
  const cast = context.npcIds.filter((id) => PERSONAL_SETS[id]);
  if (!cast.length) return null;
  const id = event.id || "",
    npcId = cast[0],
    personal = PERSONAL_SETS[npcId];
  const chapter = Object.entries({
    ...CHAPTER_SETS,
    ...HIDDEN_CHAPTER_SETS,
  }).find(([key]) => id === key || id.startsWith(key + ":"))?.[1];
  const invitation = id.startsWith("invitation:");
  const replyFirst =
    (invitation && !id.endsWith(":rescheduled")) ||
    id.startsWith("npc-proactive:") ||
    /:stage:friend$/.test(id);
  // Contact milestones, private messages and old outcomes do not summon people.
  if (
    !chapter &&
    !replyFirst &&
    !invitation &&
    !id.startsWith("ensemble:") &&
    !id.startsWith("npc-romance-") &&
    !id.startsWith("npc-conflict:") &&
    !/^npc-story-.*:stage:(familiar|confidant|bonded)$/.test(id)
  )
    return null;
  const record = (game.npcInvitationHistory || []).find(
    (r) => id === r.id || id === r.id + ":rescheduled",
  );
  const invitationRoom =
    INVITATION_ROOMS[npcId]?.[
      Math.max(0, INVITATION_TYPES.indexOf(record?.type))
    ];
  const familiarRoom = {
    jiqing: "tv",
    shenyao: "editing_room",
    tangtang: "recording",
    guchengxi: "rehearsal",
    sufei: "theatre",
  };
  const firstRomanceRoom = {
    jiqing: "park",
    shenyao: "studio",
    tangtang: "recording",
    guchengxi: "park",
    sufei: "theatre",
    xiayutong: "studio",
    chengyian: "media_company",
  };
  const room =
    chapter?.room ||
    (invitation
      ? invitationRoom
      : id.startsWith("ensemble:")
        ? "media_company"
        : id.startsWith("npc-conflict:")
          ? "restaurant"
          : /:romance:none:/.test(id)
            ? firstRomanceRoom[npcId] || personal.date
            : id.startsWith("npc-romance-") || replyFirst
              ? personal.date
              : /:stage:familiar$/.test(id)
                ? familiarRoom[npcId] || personal.room
                : personal.room);
  const rawBeats = event.beats?.length
    ? event.beats
    : [{ label: event.title, text: event.text }];
  const beats = rawBeats
    .filter((_, i) => !(invitation && replyFirst && i === 0))
    .map((b, i) => ({
      label: clean(b.label || event.title),
      text: clean(b.text),
      speaker: cast.includes(b.speaker) ? b.speaker : cast[i % cast.length],
      gesture: /錄音|旋律|耳機|歌曲|聽完/.test(b.text)
        ? "listen"
        : /舞步|編舞|試唱|清唱/.test(b.text)
          ? "dance"
          : /劇本|訪綱|信|草稿|提案|署名|讀/.test(b.text)
            ? "read"
            : "talk",
    }));
  // Chapter text can carry a previous branch's consequences. Keep it even when
  // the author supplied separate beats, without repeating identical paragraphs.
  if (chapter && event.text && !beats.some((b) => b.text === clean(event.text)))
    beats.splice(Math.min(1, beats.length), 0, {
      label: "這次見面的緣由",
      text: clean(event.text),
      speaker: npcId,
      gesture: "talk",
    });
  if (replyFirst && !invitation) {
    beats.splice(0, beats.length, {
      label: "工作以外的相聚",
      text: `${NPCS[npcId].name}看到你抵達，便把手上的事暫時收好。這一次，你們有時間把近況慢慢說完。`,
      speaker: npcId,
      gesture: "talk",
    });
  }
  if (
    invitation &&
    !replyFirst &&
    event.text &&
    !beats.some((b) => b.text === clean(event.text))
  )
    beats.unshift({
      label: "履行約定",
      text: clean(event.text),
      speaker: npcId,
      gesture: "talk",
    });
  return {
    id,
    cast,
    room,
    replyFirst,
    context,
    beats,
    acceptId: event.choices?.find((c) => ["accept", "go"].includes(c.id))?.id,
    title: clean(event.title),
    names: cast.map((id) => NPCS[id].name).join("、"),
  };
}
