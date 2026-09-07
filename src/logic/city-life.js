import { state } from "../core/state.js";
import {
  activePartner,
  cityDay,
  initialCityLife,
} from "../core/city-life-state.js";
import { NPCS } from "../data/npcs.js";
import { OUTFITS } from "../data/wardrobe.js";
import {
  ACTING_ROUNDS,
  CITY_VOICES,
  OCCASIONS,
  OUTFIT_STYLES,
  REGULAR_PLACES,
} from "../data/city-life.js";
import { adjustRelationship } from "./npc-engine.js";
import { applyActivityLoad } from "./condition-engine.js";

export const cityLife = (game = state) =>
  game.cityLife || (game.cityLife = initialCityLife());
const known = (g, id) => Object.hasOwn(NPCS, id) && g.knownPeople?.includes(id);
const friendly = (g, id) =>
  known(g, id) &&
  (g.relationships[id]?.hostility || 0) < 45 &&
  g.relationships[id]?.romance !== "broken";
const message = (g, id, npcId, title, text) => {
  g.npcMessages ||= [];
  if (!g.npcMessages.some((m) => m.id === id))
    g.npcMessages.push({
      id,
      npcId,
      title,
      text,
      week: g.week,
      source: "city-life",
      read: false,
    });
};
const once = (g, key) => {
  const ids = cityLife(g).sourceIds;
  if (ids.includes(key)) return false;
  ids.push(key);
  return true;
};
const fail = (message) => ({ ok: false, message });

export function outfitDescription(id) {
  const [style, occasion] = OUTFIT_STYLES[id] || ["自在", "daily"];
  return `${style}風格 · 適合${OCCASIONS[occasion]}。沿用整套造型，試穿不增加能力或人際記憶。`;
}
export function noticeOutfit(
  npcId,
  occasion = "daily",
  game = state,
  day = cityDay(game),
) {
  if (
    !friendly(game, npcId) ||
    !OUTFITS[game.outfitId] ||
    !(game.ownedOutfits?.[game.avatarId] || []).includes(game.outfitId)
  )
    return "";
  const c = cityLife(game),
    history = c.outfitMemories,
    outfitId = game.outfitId;
  if (history.some((m) => m.npcId === npcId && m.day === day)) return "";
  const prior = history.find(
    (m) => m.npcId === npcId && m.outfitId === outfitId,
  );
  const [style, category] = OUTFIT_STYLES[outfitId] || ["自在", "daily"];
  const voice = CITY_VOICES[npcId];
  const line = prior
    ? `「這套『${OUTFITS[outfitId].name}』我記得，上次${OCCASIONS[prior.occasion]}時看過。」`
    : `「${voice.outfit}」${style === voice.style ? "對方多看了一眼你選的風格。" : ""}`;
  const context =
    category === occasion || (occasion === "home" && category === "daily")
      ? "穿著也剛好適合今天的安排。"
      : "今天換了個場合，仍然可以穿自己喜歡的樣子。";
  const text = `${NPCS[npcId].name}：${line}${context}`;
  history.push({ npcId, outfitId, occasion, day, text });
  // Reactions are memories, never infinitely repeatable numerical rewards.
  return text;
}

export function recordRegularVisit(location, day, game = state) {
  if (!REGULAR_PLACES[location]) return "";
  const entry = (cityLife(game).regulars[location] ||= {
    days: [],
    redeemed: false,
  });
  if (entry.days.includes(day)) return "";
  entry.days.push(day);
  if (entry.days.length < 3) return "";
  const place = REGULAR_PLACES[location];
  return place.greeting + (entry.days.length === 5 ? ` ${place.info}` : "");
}
export function regularOpportunity(game, id) {
  const entry = cityLife(game).regulars[id];
  return REGULAR_PLACES[id] && entry?.days.length >= 5 && !entry.redeemed
    ? REGULAR_PLACES[id]
    : null;
}
export function redeemRegularOpportunity(id) {
  const offer = regularOpportunity(state, id);
  if (!offer) return "";
  cityLife().regulars[id].redeemed = true;
  state.mood = Math.min(100, state.mood + 3);
  return `完成了${offer.offer}。熟悉的地方，替今天多添一點踏實。`;
}

const MONTHS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
export function birthdayDay(month, day) {
  const m = Math.max(1, Math.min(12, Math.floor(Number(month) || 1)));
  const d = Math.max(1, Math.min(MONTHS[m - 1], Math.floor(Number(day) || 1)));
  return Math.min(
    363,
    MONTHS.slice(0, m - 1).reduce((a, b) => a + b, 0) + d - 1,
  );
}
export function relationshipOrigin(game, npcId) {
  const rel = game.relationships[npcId];
  if (!activePartner(rel)) return null;
  const history = rel.romanceHistory || [];
  const start = history
    .slice(history.findLastIndex((h) => h.to === "broken") + 1)
    .find((h) => h.to === "dating" && Number.isInteger(h.week));
  return start ? (start.week - 1) * 7 : null;
}
export function calendarOccasions(game, now = cityDay(game)) {
  const events = [],
    year = Math.floor(now / 364);
  for (const y of [year - 1, year, year + 1].filter((y) => y >= 0 && y < 5)) {
    events.push({
      id: `new-year:${y}`,
      kind: "new-year",
      due: y * 364 + 363,
      title: "跨年小聚",
    });
    events.push({
      id: `player-birthday:${y}`,
      kind: "player-birthday",
      due: y * 364 + birthdayDay(game.birthMonth, game.birthDay),
      title: "我的生日",
    });
    for (const npcId of (game.knownPeople || []).filter((id) =>
      Object.hasOwn(NPCS, id),
    )) {
      const match = NPCS[npcId].birthday.match(/(\d+)\s*月\s*(\d+)\s*日/);
      if (match)
        events.push({
          id: `birthday:${npcId}:${y}`,
          kind: "birthday",
          npcId,
          due: y * 364 + birthdayDay(match[1], match[2]),
          title: `${NPCS[npcId].name}的生日`,
        });
      const origin = relationshipOrigin(game, npcId);
      if (origin === null) continue; // Do not invent the start date of a legacy relationship.
      const due = y * 364 + (origin % 364);
      if (due > origin)
        events.push({
          id: `anniversary:${npcId}:${origin}:${y}`,
          kind: "anniversary",
          npcId,
          due,
          origin,
          title: `與${NPCS[npcId].name}的交往紀念日`,
        });
    }
  }
  return events
    .filter((e) => e.due >= now - 7 && e.due <= now + 20)
    .sort((a, b) => a.due - b.due);
}
export function appointmentProblem(
  game,
  event,
  npcId,
  day,
  now,
  excluding = null,
) {
  if (!event || !known(game, npcId) || (event.npcId && event.npcId !== npcId))
    return "先選擇已認識的人與日曆上的日子。";
  if (
    !friendly(game, npcId) ||
    (game.relationships[npcId]?.closeness || 0) < 20
  )
    return "對方婉拒了邀請，想等彼此更自在時再約。";
  if (event.kind === "anniversary" && !activePartner(game.relationships[npcId]))
    return "目前的關係不適合安排這個紀念日。";
  if (
    !Number.isInteger(day) ||
    day < now ||
    day > 1819 ||
    Math.abs(day - event.due) > 7
  )
    return "請選擇前後一週內、還沒過去的日子。";
  if (
    cityLife(game).appointments.some(
      (a) =>
        a.id !== excluding &&
        a.eventId === event.id &&
        ["reserved", "completed"].includes(a.status),
    )
  )
    return "這個日子已經有約定或留下回憶了。";
  const week = Math.floor(day / 7) + 1,
    weekday = day % 7;
  if (
    (game.npcSchedules?.[npcId] || []).some(
      (s) =>
        s.week === week &&
        s.day === weekday &&
        s.status !== "released" &&
        s.jobId !== excluding,
    )
  )
    return "對方那天已有工作或約定，可以換個日子。";
  return "";
}
export function releaseAppointment(game, a, status = "cancelled") {
  a.status = status;
  for (const slot of game.npcSchedules?.[a.npcId] || [])
    if (slot.jobId === a.id && slot.status === "reserved")
      slot.status = "released";
}
export function cityActionProblem(game, assignment, day) {
  if (["city_date", "city_collab"].includes(assignment.id)) {
    const a = cityLife(game).appointments.find(
      (a) => a.id === assignment.appointmentId,
    );
    if (!a || a.status !== "reserved" || a.day !== day)
      return "這個邀約已變動，請重新查看日曆。";
    if (
      !friendly(game, a.npcId) ||
      (a.kind === "anniversary" &&
        relationshipOrigin(game, a.npcId) !== a.origin)
    )
      return "彼此的近況變了，請先取消或重新確認邀約。";
    if (
      (game.npcSchedules?.[a.npcId] || []).some(
        (s) =>
          s.week === Math.floor(day / 7) + 1 &&
          s.day === day % 7 &&
          s.status !== "released" &&
          s.jobId !== a.id,
      )
    )
      return "對方臨時有了撞期，請改約。";
  }
  if (assignment.id === "pet_walk" && !cityLife(game).pet)
    return "先迎接一位小夥伴，再一起散步。";
  return "";
}
export function queueCityEcho(npcId, kind, source, text, day, game = state) {
  const id = `echo:${kind}:${source}`;
  if (!friendly(game, npcId) || !once(game, id)) return;
  cityLife(game).echoes.push({
    id,
    npcId,
    kind,
    source,
    text,
    due: day + 1,
    status: "pending",
    accepted: false,
  });
}
export function settleCityAction(assignment, choice, day) {
  const c = cityLife(),
    notes = [];
  if (["city_date", "city_collab"].includes(assignment.id)) {
    const a = c.appointments.find((a) => a.id === assignment.appointmentId);
    if (!a || a.status !== "reserved")
      return { ok: false, text: "邀約已變動，今天沒有結算。" };
    a.status = "completed";
    for (const slot of state.npcSchedules?.[a.npcId] || [])
      if (
        slot.jobId === a.id &&
        slot.status === "reserved" &&
        (slot.week - 1) * 7 + slot.day === day
      )
        slot.status = "completed";
    applyActivityLoad({ fatigue: 5, stamina: 5 }, state);
    state.money -= a.kind === "collab" ? 0 : 300;
    const reward = once(state, `date-reward:${a.npcId}:${state.week}`);
    if (reward)
      adjustRelationship(a.npcId, {
        closeness: 3,
        trust: 2,
        affection: activePartner(state.relationships[a.npcId]) ? 2 : 0,
        source: a.title,
      });
    a.text =
      a.kind === "collab"
        ? `${NPCS[a.npcId].name}和你把那天聊過的一場戲實際試了一遍，互相留了修改筆記。`
        : `${NPCS[a.npcId].name}：「${CITY_VOICES[a.npcId].date}」${a.day !== a.due ? "雖然補過了日子，赴約的心意仍然是真的。" : "約好的日子，兩個人都到了。"}`;
    if (a.kind === "collab")
      state.stats["演技"] = Math.min(1000, (state.stats["演技"] || 0) + 5);
    notes.push(
      a.text,
      noticeOutfit(
        a.npcId,
        a.kind === "collab" ? "practice" : "stage",
        state,
        day,
      ),
    );
    // A photo exists only after an explicit on-site request and NPC consent.
    a.photoConsent =
      choice === "photo" &&
      a.kind !== "collab" &&
      (state.relationships[a.npcId]?.trust || 0) >= 40;
    if (a.photoConsent) {
      c.photos.push({
        id: `photo:${a.id}`,
        appointmentId: a.id,
        npcId: a.npcId,
        day,
        published: false,
        text: `在咖啡館與${NPCS[a.npcId].name}一起拍的合照；兩人的臉清楚入鏡。`,
      });
      notes.push(
        "對方同意合照並同意你分享。照片先留在回憶裡，由你決定是否公開。",
      );
    } else if (choice === "photo")
      notes.push("對方今天想把相處留給自己，你收起相機，仍好好過完了這一天。");
    queueCityEcho(
      a.npcId,
      "date",
      a.id,
      `那天的${a.title}我記得。謝謝你真的留了時間，不只是說說。`,
      day,
    );
    return {
      ok: true,
      title: a.title,
      portrait: NPCS[a.npcId].portrait,
      text: notes.filter(Boolean).join(" "),
    };
  }
  if (assignment.id === "pet_walk") {
    applyActivityLoad({ fatigue: 3, stamina: 3 }, state);
    c.pet.walks.push(day);
    state.mood = Math.min(100, state.mood + 6);
    return {
      ok: true,
      text: `${c.pet.name}沿著河邊慢慢探索。你也暫時放下工作，不必走完固定里程才算是陪伴。`,
    };
  }
  if (assignment.id === "city_challenge") {
    applyActivityLoad({ fatigue: 5, stamina: 5 }, state);
    const answers = Array.isArray(assignment.answers) ? assignment.answers : [];
    const played =
      answers.length === ACTING_ROUNDS.length &&
      answers.every((n) => Number.isInteger(n) && n >= 0 && n <= 2);
    const score = played
      ? answers.filter((n, i) => n === ACTING_ROUNDS[i].answer).length
      : choice === "quick" && c.practice.mastered >= 3
        ? 3
        : 0;
    c.practice.completed.push(day);
    if (played) c.practice.mastered++;
    state.stats["演技"] = Math.min(
      1000,
      (state.stats["演技"] || 0) + 4 + score,
    );
    return {
      ok: true,
      text: `${played ? `完成三段接話，接住了 ${score} 個轉折。` : choice === "quick" && c.practice.mastered >= 3 ? "用熟悉的方法快速複習了一遍。" : "略過挑戰，照常完成基礎對戲練習。"}留下${4 + score}點演技進步；每次練習仍占一天。`,
    };
  }
  return null;
}

export function adoptPet(kind, name) {
  if (!["cat", "dog"].includes(kind) || cityLife().pet)
    return fail("目前無法再迎接另一位小夥伴。");
  const clean = String(name || "小星").trim();
  if (!clean || clean.length > 16 || /[<>\u0000-\u001f]/.test(clean))
    return fail("名字請使用 1 到 16 個字，不含特殊標記。");
  cityLife().pet = {
    kind,
    name: clean,
    adopted: cityDay(state),
    greeted: [],
    comfortWeeks: [],
    walks: [],
    care: null,
    careDays: [],
  };
  return {
    ok: true,
    message: `${clean}住下來了。基本食水與清潔會妥善照料，不需要每日打卡。`,
  };
}
export function petGreeting(game, day) {
  if (!Number.isInteger(day) || day < 0 || day >= 1820) return "";
  const pet = cityLife(game).pet;
  if (!pet || day < pet.adopted || pet.greeted.includes(day)) return "";
  pet.greeted.push(day);
  const text =
    pet.kind === "cat"
      ? `${pet.name}在門口伸了個懶腰，尾巴輕輕擦過你的小腿。`
      : `${pet.name}聽到熟悉的腳步，搖著尾巴來迎接你。`;
  cityLife(game).notice = text;
  return text;
}
export function comfortPet() {
  const pet = cityLife().pet;
  if (!pet) return fail("家裡還沒有小夥伴。");
  const rewarded = !pet.comfortWeeks.includes(state.week);
  if (rewarded) {
    pet.comfortWeeks.push(state.week);
    state.mood = Math.min(100, state.mood + 3);
  }
  return {
    ok: true,
    message: `陪${pet.name}坐了一會兒。${rewarded ? "心情放鬆了一點。" : "不必多做什麼，陪著就好；這週的短陪伴不再增加數值。"}`,
  };
}
export function petCarers(game) {
  return (game.knownPeople || []).filter(
    (id) =>
      friendly(game, id) &&
      (game.relationships[id]?.trust || 0) >= 45 &&
      (game.relationships[id]?.closeness || 0) >= 40,
  );
}
export function setPetCare(npcId) {
  const pet = cityLife().pet;
  if (
    !pet ||
    (npcId !== "service" &&
      npcId !== "none" &&
      !petCarers(state).includes(npcId))
  )
    return fail("先選擇願意幫忙的熟人，或預約照顧服務。");
  pet.care = npcId === "none" ? null : { npcId, week: state.week };
  return {
    ok: true,
    message:
      npcId === "none"
        ? "已取消尚未使用的託顧安排。"
        : "已記下本週的託顧選擇；出發前仍會確認對方檔期，實際出發才結算。",
  };
}
export function tripCareProblem(game, day) {
  const pet = cityLife(game).pet;
  if (!pet || pet.careDays.includes(day)) return "";
  const care = pet.care;
  if (!care || care.week !== game.week)
    return "出遠門前，先在城市生活安排本週託顧。";
  if (care.npcId === "service")
    return game.money >= 300 ? "" : "託顧服務需要另留 $300。";
  if (!petCarers(game).includes(care.npcId))
    return "對方目前不適合託顧，請重新選擇。";
  if (
    (game.npcSchedules?.[care.npcId] || []).some(
      (s) =>
        s.week === game.week && s.day === day % 7 && s.status !== "released",
    )
  )
    return "對方出發日另有安排，請改用照顧服務或換人。";
  return "";
}
export function settleTripCare(day) {
  const pet = cityLife().pet;
  if (!pet || pet.careDays.includes(day)) return "";
  const id = pet.care.npcId;
  pet.careDays.push(day);
  if (id === "service") state.money -= 300;
  else {
    state.npcSchedules[id] ||= [];
    state.npcSchedules[id].push({
      jobId: `pet-care:${day}`,
      week: state.week,
      day: day % 7,
      status: "completed",
      external: true,
      location: "home",
      label: "照顧小夥伴",
    });
    queueCityEcho(
      id,
      "pet",
      `care:${day}`,
      `你出門那天，${pet.name}安穩地待在家。我們照約定把事情照顧好了。`,
      day,
    );
  }
  return `${id === "service" ? "照顧服務" : NPCS[id].name}依約照顧${pet.name}，回來後收到平安的交接。`;
}

export function collectCitySources(game, day) {
  const c = cityLife(game);
  for (const visit of game.homeLife?.visits || []) {
    const id = visit.id || `${visit.npcId}:${visit.week}`;
    const when = Math.max(0, (visit.week - 1) * 7);
    if (when > day || !friendly(game, visit.npcId)) continue;
    queueCityEcho(
      visit.npcId,
      "home",
      id,
      "上次去你家坐坐，回來後還想到我們聊的那段。下次找一天，在排練室把它試出來？",
      day,
      game,
    );
  }
  for (const gift of game.homeLife?.gifts || []) {
    if ((gift.week - 1) * 7 > day || !friendly(game, gift.npcId)) continue;
    queueCityEcho(
      gift.npcId,
      "gift",
      `${gift.npcId}:${gift.week}:${gift.recipeId}`,
      `你親手做的那份心意，我收到了。${gift.liked ? "剛好是我喜歡的，想到時還會笑一下。" : "比起東西本身，我更記得你花時間準備。"}`,
      day,
      game,
    );
  }
  for (const echo of c.echoes) {
    if (echo.status !== "pending" || echo.due > day) continue;
    if (!friendly(game, echo.npcId) || day > echo.due + 14) {
      echo.status = "closed";
      continue;
    }
    echo.status = "delivered";
    message(game, echo.id, echo.npcId, "那天之後", echo.text);
  }
  for (const a of c.appointments) {
    if (a.status !== "reserved") continue;
    const changed =
      !friendly(game, a.npcId) ||
      (a.kind === "anniversary" &&
        relationshipOrigin(game, a.npcId) !== a.origin);
    if (changed || a.day < day) {
      releaseAppointment(game, a, changed ? "cancelled" : "missed");
      a.text = changed
        ? "彼此的近況有了變化，這次約定先取消，不沿用過去的關係。"
        : "這次沒能成行。等彼此有空，再好好說明近況。";
      if (known(game, a.npcId))
        message(game, `cancel:${a.id}`, a.npcId, "關於那個約定", a.text);
    }
  }
}
export function recallCityMemory(npcId, game = state) {
  if (!friendly(game, npcId)) return "";
  const echo = cityLife(game).echoes.findLast(
    (e) => e.npcId === npcId && e.status === "delivered",
  );
  if (echo && game.week <= Math.floor(echo.due / 7) + 3) return echo.text;
  const memory = cityLife(game).outfitMemories.findLast(
    (m) => m.npcId === npcId,
  );
  return memory
    ? `還記得你穿『${OUTFITS[memory.outfitId].name}』來${OCCASIONS[memory.occasion]}。下次見面，再聊聊最近的事吧。`
    : "";
}
export function publishCityPhoto(id) {
  const c = cityLife(),
    photo = c.photos.find((p) => p.id === id),
    appointment =
      photo && c.appointments.find((a) => a.id === photo.appointmentId);
  if (
    !photo ||
    photo.published ||
    !appointment?.photoConsent ||
    appointment.status !== "completed" ||
    !friendly(state, photo.npcId)
  )
    return fail("目前無法分享這張照片，原本的回憶仍會保留。");
  photo.published = true;
  state.socialPosts ||= [];
  state.socialPosts.unshift({
    id: `city-${photo.id}`,
    week: state.week,
    type: "daily",
    topic: "daily",
    label: "一起度過的一天",
    text: photo.text,
    likes: 0,
    comments: [],
    source: "city-life",
    npcId: photo.npcId,
  });
  // The only exposure route is the player's explicitly published, identifiable photo.
  // Never turn a private visit, private gift or an unshared picture into public knowledge.
  message(
    state,
    `shared:${photo.id}`,
    photo.npcId,
    "看到你分享的照片",
    "看到那張合照了，謝謝你先確認我們都願意分享。",
  );
  if (
    activePartner(state.relationships[photo.npcId]) &&
    state.fame >= 100 &&
    once(state, `exposure:${photo.id}`)
  ) {
    state.industryNews ||= [];
    state.industryNews.unshift({
      id: `exposure:${photo.id}`,
      week: state.week,
      title: "公開合照引起討論",
      body: `公開的咖啡館合照中，${state.name}與${NPCS[photo.npcId].name}都清楚入鏡。留言好奇兩人的關係，合照本身並不能證明正在交往。`,
      category: "城市生活",
      heat: 20,
      source: "city-life",
      evidenceId: photo.id,
      npcId: photo.npcId,
    });
    c.notice =
      "有人從你主動公開、清楚入鏡的合照認出了彼此。回響頁可以選擇保留分享，或收回照片；不會替你公開正式關係。";
  }
  return {
    ok: true,
    message: "已分享到星語。公開後可能被認出；照片不是正式關係的證明。",
  };
}
export function withdrawCityPhoto(id) {
  const photo = cityLife().photos.find((p) => p.id === id);
  if (!photo?.published) return fail("這張照片目前沒有公開。");
  // Existing discussion remains historically true, but the original post is withdrawn.
  state.socialPosts = state.socialPosts.filter((p) => p.id !== `city-${id}`);
  photo.published = false;
  return {
    ok: true,
    message: "已收回原貼文，私人回憶保留。已發生的討論不會被改寫。",
  };
}
