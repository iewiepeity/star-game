import {
  HOME_ITEMS,
  HOME_RECIPES,
  HOME_SLOTS,
  HOME_VISIT_ACTIVITIES,
  NPC_HOME_VOICES,
  SUPPLIES,
} from "../data/home-life.js";
import { NPCS } from "../data/npcs.js";
import { state } from "../core/state.js";
import { adjustRelationship } from "./npc-engine.js";
import { state as liveState, hydrateState } from "../core/state.js";

function relate(game, npcId, effects) {
  if (game === liveState) return adjustRelationship(npcId, effects);
  const previous = structuredClone(liveState);
  try {
    hydrateState(structuredClone(game));
    const result = adjustRelationship(npcId, effects);
    Object.assign(game, structuredClone(liveState));
    return result;
  } finally {
    // Restore the exact other game, including deliberately uninitialized fields.
    for (const key of Object.keys(liveState)) delete liveState[key];
    Object.assign(liveState, previous);
  }
}

export { initialHomeLife, normalizeHomeLife } from "../core/home-state.js";
import {
  initialHomeLife,
  normalizeHomeLife,
  homeKeyEligible,
  invalidateHomeKeys,
} from "../core/home-state.js";
const ACTIVE_ROMANCE = new Set(["dating", "committed", "engaged", "married"]);

export function ensureHomeLife(game = state) {
  game.homeLife = normalizeHomeLife(game.homeLife);
  invalidateHomeKeys(game);
  syncCareerKeepsakes(game);
  return game.homeLife;
}

export function syncCareerKeepsakes(game = state) {
  const home = game.homeLife || (game.homeLife = initialHomeLife());
  const add = (item) => {
    const existing = home.keepsakes.find((entry) => entry.id === item.id);
    if (existing) Object.assign(existing, item);
    else home.keepsakes.push(item);
  };
  for (const work of game.completedWorks || [])
    if (work.title && (work.id || work.jobId))
      add({
        id: `work:${work.id || work.jobId}`,
        name: `${work.title.startsWith("《") ? work.title : `《${work.title}》`}作品紀念`,
        kind: "作品",
        source: `第 ${work.completedWeek || work.week || "？"} 週完成的作品`,
        icon: "▤",
      });
  for (const award of game.awards || [])
    if (award.id)
      // Earlier saves included the week in the identifier; migrate in place.
      for (const item of home.keepsakes)
        if (item.id === `award:${award.id}:${award.week}`) {
          if (home.displayedKeepsakeId === item.id)
            home.displayedKeepsakeId = `award:${award.id}`;
          item.id = `award:${award.id}`;
        }
  for (const award of game.awards || [])
    if (award.id)
      add({
        id: `award:${award.id}`,
        name: `${award.title || award.name || "星途獎項"}・${award.result || "紀念"}`,
        kind: award.result === "入圍" ? "入圍紀念" : "獎項",
        source: `第 ${award.week || "？"} 週${award.result || "留下的獎項"}`,
        icon: award.result === "入圍" ? "▤" : "♛",
      });
  home.keepsakes = [
    ...new Map(home.keepsakes.map((item) => [item.id, item])).values(),
  ].slice(-240);
  return home.keepsakes;
}

export function buyHomeItem(id, game = state) {
  const home = ensureHomeLife(game),
    item = Object.hasOwn(HOME_ITEMS, id) && HOME_ITEMS[id];
  if (!item) return { ok: false, message: "找不到這件家具。" };
  if (home.ownedFurniture.includes(id))
    return { ok: false, message: "這件家具已經在倉庫裡。" };
  if (game.money < item.price)
    return { ok: false, message: "現金不足，先別讓沙發吃掉這週的飯錢。" };
  game.money -= item.price;
  home.ownedFurniture.push(id);
  home.notice = `${item.name}已送到住處。`;
  return { ok: true, message: home.notice };
}

export function placeHomeItem(id, game = state) {
  const home = ensureHomeLife(game),
    item = Object.hasOwn(HOME_ITEMS, id) && HOME_ITEMS[id];
  if (!item || !home.ownedFurniture.includes(id))
    return { ok: false, message: "這件家具還不在倉庫裡。" };
  home.placedFurniture[item.slot] = id;
  home.notice = `已把${item.name}放進${HOME_SLOTS[item.slot]}的位置。`;
  return { ok: true, message: home.notice };
}

export function buySupply(id, game = state) {
  const home = ensureHomeLife(game),
    supply = Object.hasOwn(SUPPLIES, id) && SUPPLIES[id];
  if (!supply) return { ok: false, message: "找不到這份材料包。" };
  if (
    Object.entries(supply.contents).some(
      ([id, amount]) => (home.materials[id] || 0) + amount > 999,
    )
  )
    return { ok: false, message: "材料櫃已經滿了，先用掉一些再補貨。" };
  if (game.money < supply.price)
    return { ok: false, message: "現金不足，材料先留在架上。" };
  game.money -= supply.price;
  for (const [material, amount] of Object.entries(supply.contents))
    home.materials[material] = (home.materials[material] || 0) + amount;
  return { ok: true, message: `${supply.name}已收進材料櫃。` };
}

export function homeActionAccess(game, assignment) {
  const home = game.homeLife || initialHomeLife();
  if (assignment.id === "home_craft") {
    const recipe =
      Object.hasOwn(HOME_RECIPES, assignment.recipeId) &&
      HOME_RECIPES[assignment.recipeId];
    if (!recipe) return "請先選擇要製作的東西";
    if (
      home.craftedItems.filter((item) => item.status === "kept").length >= 100
    )
      return "成品櫃已滿，先使用或送出一些心意";
    const missing = Object.entries(recipe.needs).filter(
      ([id, amount]) => (home.materials[id] || 0) < amount,
    );
    return missing.length ? "材料不足，先在居家生活補充材料" : "";
  }
  if (assignment.id === "home_host") {
    const npc = Object.hasOwn(NPCS, assignment.npcId) && NPCS[assignment.npcId],
      activity =
        Object.hasOwn(HOME_VISIT_ACTIVITIES, assignment.activityId) &&
        HOME_VISIT_ACTIVITIES[assignment.activityId];
    if (
      !npc ||
      !activity ||
      !(game.knownPeople || []).includes(assignment.npcId)
    )
      return "只能邀請已經交換聯絡方式的人";
    const rel = game.relationships?.[assignment.npcId] || {};
    if ((rel.hostility || 0) >= 45) return "目前的關係不適合私下到家裡相處";
    if ((rel.closeness || 0) < 20 && !ACTIVE_ROMANCE.has(rel.romance))
      return "再熟悉一點，才適合邀請對方到住處";
    if (
      home.visits.some(
        (visit) => visit.npcId === assignment.npcId && visit.week === game.week,
      )
    )
      return "這週已經在家裡相處過了";
  }
  return "";
}

function qualityFor(game, recipe, randomInt) {
  const ability = Number(game.stats?.[recipe.stat] ?? 0);
  return Math.max(
    1,
    Math.min(5, 1 + Math.floor((ability + randomInt(0, 80)) / 200)),
  );
}

export function resolveCrafting(assignment, randomInt, game = state) {
  if (assignment?.id !== "home_craft")
    return { ok: false, text: "請先選擇手作安排。" };
  const home = ensureHomeLife(game),
    recipe = HOME_RECIPES[assignment.recipeId],
    reason = homeActionAccess(game, assignment);
  if (reason) return { ok: false, text: reason };
  if (home.craftedItems.filter((item) => item.status === "kept").length >= 100)
    return { ok: false, text: "成品櫃已滿，先使用或送出一些心意。" };
  const itemId = `craft:${game.week}:${game.runnerDay}:${assignment.recipeId}`;
  if (home.craftedItems.some((item) => item.id === itemId))
    return { ok: false, text: "今天已經完成這份手作。" };
  for (const [id, amount] of Object.entries(recipe.needs))
    home.materials[id] -= amount;
  const quality = qualityFor(game, recipe, randomInt);
  const item = {
    id: itemId,
    recipeId: assignment.recipeId,
    name: recipe.name,
    quality,
    madeWeek: game.week,
    status: "kept",
  };
  home.craftedItems.push(item);
  game.fatigue = Math.min(200, game.fatigue + 6);
  game.stamina = Math.max(0, game.stamina - 6);
  game.mood = Math.min(100, game.mood + 2);
  return {
    ok: true,
    item,
    text: `${recipe.name}完成了，品質 ${"★".repeat(quality)}。可以自己使用、保留，或送給記得它的人。`,
  };
}

export function resolveHomeVisit(assignment, game = state) {
  if (assignment?.id !== "home_host")
    return { ok: false, text: "請先選擇作客安排。" };
  const home = ensureHomeLife(game),
    reason = homeActionAccess(game, assignment);
  if (reason) return { ok: false, text: reason };
  const npc = NPCS[assignment.npcId],
    activity = HOME_VISIT_ACTIVITIES[assignment.activityId],
    voice = NPC_HOME_VOICES[assignment.npcId];
  const displayed = home.keepsakes.find(
    (item) => item.id === home.displayedKeepsakeId,
  );
  const noticed =
    displayed?.npcId === assignment.npcId
      ? `${npc.name}也注意到你仍展示著「${displayed.name}」，目光在那裡停了一會。`
      : displayed
        ? `你們聊到房裡展示的「${displayed.name}」，那段經歷又多了一個被記住的人。`
        : "";
  const firstVisit = !home.keepsakes.some(
    (item) => item.id === `npc:${assignment.npcId}:first-visit`,
  );
  relate(game, assignment.npcId, {
    closeness: 5,
    trust: 3,
    affection: ACTIVE_ROMANCE.has(game.relationships[assignment.npcId]?.romance)
      ? 2
      : 0,
    source: `到家裡${activity.name}`,
  });
  game.homeLife = home;
  const visit = {
    id: `visit:${game.week}:${game.runnerDay}:${assignment.npcId}`,
    week: game.week,
    npcId: assignment.npcId,
    activityId: assignment.activityId,
    displayedKeepsakeId: displayed?.id || null,
  };
  home.visits.push(visit);
  if (firstVisit && voice?.keepsake)
    home.keepsakes.push({
      id: `npc:${assignment.npcId}:first-visit`,
      name: voice.keepsake,
      npcId: assignment.npcId,
      kind: "人物",
      source: `${npc.name}第一次來作客後留下的東西`,
      icon: "✦",
    });
  const visitText = `${voice?.visit || `${npc.name}在這個小房間裡陪你待了一段時間。`}${activity.scene}${noticed}${firstVisit ? `離開前，${npc.name}留下了「${voice.keepsake}」。可以在居家生活的紀念頁擺出來。` : ""}`;
  (game.npcInteractionMemories ||= []).push({
    week: game.week,
    npcId: assignment.npcId,
    action: "home_visit",
    title: `${npc.name}來家裡・${activity.name}`,
    text: visitText,
    source: "居家作客",
  });
  game.fatigue = Math.min(200, game.fatigue + 4);
  game.stamina = Math.max(0, game.stamina - 5);
  game.mood = Math.min(100, game.mood + 8);
  return {
    ok: true,
    title: `${npc.name}來家裡`,
    text: visitText,
    portrait: npc.portrait || npc.bust,
    context: `我的住處・${activity.name}`,
  };
}

export function useCraftedItem(itemId, game = state) {
  const home = ensureHomeLife(game),
    item = home.craftedItems.find(
      (entry) => entry.id === itemId && entry.status === "kept",
    ),
    recipe = item && HOME_RECIPES[item.recipeId];
  if (!recipe) return { ok: false, message: "找不到這份成品。" };
  item.status = "used";
  for (const [key, value] of Object.entries(recipe.effect || {}))
    game[key] = Math.max(
      0,
      Math.min(key === "fatigue" ? 200 : 100, (game[key] || 0) + value),
    );
  return { ok: true, message: `享用了${recipe.name}，這份照顧也留給了自己。` };
}

export function giftCraftedItem(itemId, npcId, game = state) {
  const home = ensureHomeLife(game),
    item = home.craftedItems.find(
      (entry) => entry.id === itemId && entry.status === "kept",
    ),
    recipe = item && HOME_RECIPES[item.recipeId],
    npc = Object.hasOwn(NPCS, npcId) && NPCS[npcId];
  if (!recipe || !npc || !(game.knownPeople || []).includes(npcId))
    return { ok: false, message: "目前無法送出這份禮物。" };
  if ((game.relationships?.[npcId]?.hostility || 0) >= 45)
    return { ok: false, message: "對方現在需要一點距離，先不要用禮物打擾。" };
  const weekKey = `${npcId}:${game.week}`;
  if (home.giftWeeks[weekKey])
    return {
      ok: false,
      message: `這週已經送過${npc.name}一份心意了，留點空白給下次。`,
    };
  const voice = NPC_HOME_VOICES[npcId],
    liked = recipe.tags.some((tag) => voice?.favorite?.includes(tag));
  const sameCount = home.gifts.filter(
    (gift) => gift.npcId === npcId && gift.recipeId === item.recipeId,
  ).length;
  const gain = sameCount ? 1 : liked ? 5 + Math.min(2, item.quality - 3) : 3;
  relate(game, npcId, {
    closeness: gain,
    trust: sameCount ? 0 : liked ? 2 : 1,
    affection:
      !sameCount &&
      liked &&
      ACTIVE_ROMANCE.has(game.relationships[npcId]?.romance)
        ? 2
        : 0,
    source: `親手做了${recipe.name}`,
  });
  game.homeLife = home;
  item.status = "gifted";
  item.giftedTo = npcId;
  item.giftedWeek = game.week;
  home.giftWeeks[weekKey] = true;
  const text = sameCount
    ? `${npc.name}認出這是熟悉的${recipe.name}。心意仍在，但驚喜已經沒有第一次那麼大。`
    : `${voice?.gift || `${npc.name}認真收下了這份手作。`}${liked ? "你記得對方真正喜歡的東西。" : "不完全是對方平常會選的風格，但親手完成的心意仍被好好接住。"}`;
  home.gifts.push({
    week: game.week,
    npcId,
    recipeId: item.recipeId,
    quality: item.quality,
    liked,
    repeated: sameCount > 0,
    text,
  });
  (game.npcInteractionMemories ||= []).push({
    week: game.week,
    npcId,
    action: "handmade_gift",
    title: `送給${npc.name}・${recipe.name}`,
    text,
    source: "親手禮物",
  });
  return { ok: true, message: text };
}

export function setDisplayedKeepsake(id, game = state) {
  const home = ensureHomeLife(game);
  if (id != null && !home.keepsakes.some((item) => item.id === id))
    return { ok: false, message: "這份紀念還沒有來到房間。" };
  home.displayedKeepsakeId = id || null;
  return {
    ok: true,
    message: id ? "已把這份回憶擺在房間裡。" : "牆面暫時留白。",
  };
}

export function keyAccessStatus(npcId, game = state) {
  const home = game.homeLife || initialHomeLife(),
    record = home.keys[npcId];
  const eligible = homeKeyEligible(npcId, game);
  const active = Boolean(record?.granted && !record.invalidated && eligible);
  return { eligible, granted: Boolean(record?.granted), active };
}

export function setHomeKey(npcId, granted, game = state) {
  const home = ensureHomeLife(game),
    status = keyAccessStatus(npcId, game);
  if (!Object.hasOwn(NPCS, npcId) || !game.knownPeople?.includes(npcId))
    return { ok: false, message: "只能把鑰匙交給已經認識的人。" };
  if (granted && !status.eligible)
    return { ok: false, message: "你們還沒走到能交付備用鑰匙的關係。" };
  home.keys[npcId] = {
    granted: Boolean(granted),
    week: game.week,
    invalidated: false,
  };
  return {
    ok: true,
    message: granted
      ? `你把備用鑰匙交給了${NPCS[npcId].name}。這不是好感獎勵，是一份信任。`
      : `已收回${NPCS[npcId].name}的備用鑰匙。`,
  };
}
