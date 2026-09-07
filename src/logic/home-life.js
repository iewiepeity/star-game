import { HOME_ITEMS, HOME_RECIPES, HOME_SLOTS, HOME_VISIT_ACTIVITIES, NPC_HOME_VOICES, SUPPLIES } from "../data/home-life.js";
import { NPCS } from "../data/npcs.js";
import { state } from "../core/state.js";
import { adjustRelationship } from "./npc-engine.js";

const STARTER_ITEMS = Object.keys(HOME_ITEMS).filter((id) => HOME_ITEMS[id].starter);
const STARTER_PLACED = Object.fromEntries(Object.entries(HOME_ITEMS).filter(([, item]) => item.starter).map(([id, item]) => [item.slot, id]));
const ACTIVE_ROMANCE = new Set(["dating", "committed", "engaged", "married"]);

export function initialHomeLife() {
  return {
    ownedFurniture: [...STARTER_ITEMS],
    placedFurniture: { ...STARTER_PLACED },
    materials: {},
    craftedItems: [],
    keepsakes: [],
    displayedKeepsakeId: null,
    keys: {},
    visits: [],
    gifts: [],
    giftWeeks: {},
    notice: "",
  };
}

export function normalizeHomeLife(raw) {
  const next = initialHomeLife(), source = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  next.ownedFurniture = [...new Set([...STARTER_ITEMS, ...(Array.isArray(source.ownedFurniture) ? source.ownedFurniture : []).filter((id) => HOME_ITEMS[id])])];
  for (const slot of Object.keys(HOME_SLOTS)) {
    const id = source.placedFurniture?.[slot];
    if (HOME_ITEMS[id]?.slot === slot && next.ownedFurniture.includes(id)) next.placedFurniture[slot] = id;
  }
  next.materials = Object.fromEntries(Object.entries(source.materials || {}).filter(([, amount]) => Number.isInteger(amount) && amount >= 0).map(([id, amount]) => [id, Math.min(999, amount)]));
  next.craftedItems = (Array.isArray(source.craftedItems) ? source.craftedItems : []).filter((item) => item && HOME_RECIPES[item.recipeId] && typeof item.id === "string").slice(-120);
  next.keepsakes = (Array.isArray(source.keepsakes) ? source.keepsakes : []).filter((item) => item && typeof item.id === "string" && typeof item.name === "string").slice(-160);
  next.displayedKeepsakeId = next.keepsakes.some((item) => item.id === source.displayedKeepsakeId) ? source.displayedKeepsakeId : null;
  next.keys = Object.fromEntries(Object.entries(source.keys || {}).filter(([id, item]) => NPCS[id] && item && typeof item === "object"));
  next.visits = (Array.isArray(source.visits) ? source.visits : []).filter((item) => item && NPCS[item.npcId] && HOME_VISIT_ACTIVITIES[item.activityId]).slice(-120);
  next.gifts = (Array.isArray(source.gifts) ? source.gifts : []).filter((item) => item && NPCS[item.npcId] && HOME_RECIPES[item.recipeId]).slice(-160);
  next.giftWeeks = source.giftWeeks && typeof source.giftWeeks === "object" && !Array.isArray(source.giftWeeks) ? { ...source.giftWeeks } : {};
  next.notice = typeof source.notice === "string" ? source.notice.slice(0, 200) : "";
  return next;
}

export function ensureHomeLife(game = state) {
  game.homeLife = normalizeHomeLife(game.homeLife);
  syncCareerKeepsakes(game);
  return game.homeLife;
}

export function syncCareerKeepsakes(game = state) {
  const home = game.homeLife || (game.homeLife = initialHomeLife());
  const add = (item) => { if (!home.keepsakes.some((entry) => entry.id === item.id)) home.keepsakes.push(item); };
  for (const work of game.completedWorks || []) add({ id: `work:${work.id || work.jobId}`, name: `《${work.title}》作品紀念`, kind: "作品", source: `第 ${work.completedWeek || work.week || "？"} 週完成的作品`, icon: "▤" });
  for (const award of game.awards || []) add({ id: `award:${award.id || award.title}:${award.week || ""}`, name: award.title || award.name || "星途獎座", kind: "獎項", source: `第 ${award.week || "？"} 週留下的獎項`, icon: "♛" });
  home.keepsakes = home.keepsakes.slice(-160);
  return home.keepsakes;
}

export function buyHomeItem(id, game = state) {
  const home = ensureHomeLife(game), item = HOME_ITEMS[id];
  if (!item) return { ok: false, message: "找不到這件家具。" };
  if (home.ownedFurniture.includes(id)) return { ok: false, message: "這件家具已經在倉庫裡。" };
  if (game.money < item.price) return { ok: false, message: "現金不足，先別讓沙發吃掉這週的飯錢。" };
  game.money -= item.price;
  home.ownedFurniture.push(id);
  home.notice = `${item.name}已送到住處。`;
  return { ok: true, message: home.notice };
}

export function placeHomeItem(id, game = state) {
  const home = ensureHomeLife(game), item = HOME_ITEMS[id];
  if (!item || !home.ownedFurniture.includes(id)) return { ok: false, message: "這件家具還不在倉庫裡。" };
  home.placedFurniture[item.slot] = id;
  home.notice = `已把${item.name}放進${HOME_SLOTS[item.slot]}的位置。`;
  return { ok: true, message: home.notice };
}

export function buySupply(id, game = state) {
  const home = ensureHomeLife(game), supply = SUPPLIES[id];
  if (!supply) return { ok: false, message: "找不到這份材料包。" };
  if (game.money < supply.price) return { ok: false, message: "現金不足，材料先留在架上。" };
  game.money -= supply.price;
  for (const [material, amount] of Object.entries(supply.contents)) home.materials[material] = (home.materials[material] || 0) + amount;
  return { ok: true, message: `${supply.name}已收進材料櫃。` };
}

export function homeActionAccess(game, assignment) {
  const home = game.homeLife || ensureHomeLife(game);
  if (assignment.id === "home_craft") {
    const recipe = HOME_RECIPES[assignment.recipeId];
    if (!recipe) return "請先選擇要製作的東西";
    const missing = Object.entries(recipe.needs).filter(([id, amount]) => (home.materials[id] || 0) < amount);
    return missing.length ? "材料不足，先在居家生活補充材料" : "";
  }
  if (assignment.id === "home_host") {
    const npc = NPCS[assignment.npcId], activity = HOME_VISIT_ACTIVITIES[assignment.activityId];
    if (!npc || !activity || !(game.knownPeople || []).includes(assignment.npcId)) return "只能邀請已經交換聯絡方式的人";
    const rel = game.relationships?.[assignment.npcId] || {};
    if ((rel.hostility || 0) >= 45) return "目前的關係不適合私下到家裡相處";
    if ((rel.closeness || 0) < 20 && !ACTIVE_ROMANCE.has(rel.romance)) return "再熟悉一點，才適合邀請對方到住處";
    if (home.visits.some((visit) => visit.npcId === assignment.npcId && visit.week === game.week)) return "這週已經在家裡相處過了";
  }
  return "";
}

function qualityFor(game, recipe, randomInt) {
  const ability = Number(game.stats?.[recipe.stat] ?? game.stats?.[recipe.fallbackStat] ?? 30);
  return Math.max(1, Math.min(5, 1 + Math.floor((ability + randomInt(0, 80)) / 55)));
}

export function resolveCrafting(assignment, randomInt, game = state) {
  const home = ensureHomeLife(game), recipe = HOME_RECIPES[assignment.recipeId], reason = homeActionAccess(game, assignment);
  if (reason) return { ok: false, text: reason };
  for (const [id, amount] of Object.entries(recipe.needs)) home.materials[id] -= amount;
  const quality = qualityFor(game, recipe, randomInt);
  const item = { id: `craft:${game.week}:${game.runnerDay}:${assignment.recipeId}`, recipeId: assignment.recipeId, name: recipe.name, quality, madeWeek: game.week, status: "kept" };
  home.craftedItems.push(item);
  game.fatigue = Math.min(200, game.fatigue + 6);
  game.stamina = Math.max(0, game.stamina - 6);
  game.mood = Math.min(100, game.mood + 2);
  return { ok: true, item, text: `${recipe.name}完成了，品質 ${"★".repeat(quality)}。可以自己使用、保留，或送給記得它的人。` };
}

export function resolveHomeVisit(assignment, game = state) {
  const home = ensureHomeLife(game), reason = homeActionAccess(game, assignment);
  if (reason) return { ok: false, text: reason };
  const npc = NPCS[assignment.npcId], activity = HOME_VISIT_ACTIVITIES[assignment.activityId], voice = NPC_HOME_VOICES[assignment.npcId];
  const displayed = home.keepsakes.find((item) => item.id === home.displayedKeepsakeId);
  const noticed = displayed?.npcId === assignment.npcId ? `${npc.name}也注意到你仍展示著「${displayed.name}」，目光在那裡停了一會。` : displayed ? `你們聊到房裡展示的「${displayed.name}」，那段經歷又多了一個被記住的人。` : "";
  const firstVisit = !home.visits.some((visit) => visit.npcId === assignment.npcId);
  adjustRelationship(assignment.npcId, { closeness: 5, trust: 3, affection: ACTIVE_ROMANCE.has(game.relationships[assignment.npcId]?.romance) ? 2 : 0, source: `到家裡${activity.name}` });
  const visit = { id: `visit:${game.week}:${game.runnerDay}:${assignment.npcId}`, week: game.week, npcId: assignment.npcId, activityId: assignment.activityId, displayedKeepsakeId: displayed?.id || null };
  home.visits.push(visit);
  if (firstVisit && voice?.keepsake) home.keepsakes.push({ id: `npc:${assignment.npcId}:first-visit`, name: voice.keepsake, npcId: assignment.npcId, kind: "人物", source: `${npc.name}第一次來作客後留下的東西`, icon: "✦" });
  game.npcInteractionMemories.push({ week: game.week, npcId: assignment.npcId, action: "home_visit", title: `${npc.name}來家裡・${activity.name}`, text: `${voice?.visit || `${npc.name}在這個小房間裡陪你待了一段時間。`}${noticed}`, source: "居家作客" });
  game.fatigue = Math.min(200, game.fatigue + 4);
  game.stamina = Math.max(0, game.stamina - 5);
  game.mood = Math.min(100, game.mood + 8);
  return { ok: true, title: `${npc.name}來家裡`, text: `${voice?.visit || `${npc.name}在這個小房間裡陪你待了一段時間。`}${noticed}`, portrait: npc.portrait || npc.bust, context: `我的住處・${activity.name}` };
}

export function useCraftedItem(itemId, game = state) {
  const home = ensureHomeLife(game), item = home.craftedItems.find((entry) => entry.id === itemId && entry.status === "kept"), recipe = item && HOME_RECIPES[item.recipeId];
  if (!recipe) return { ok: false, message: "找不到這份成品。" };
  item.status = "used";
  for (const [key, value] of Object.entries(recipe.effect || {})) game[key] = Math.max(0, Math.min(key === "fatigue" ? 200 : 100, (game[key] || 0) + value));
  return { ok: true, message: `享用了${recipe.name}，這份照顧也留給了自己。` };
}

export function giftCraftedItem(itemId, npcId, game = state) {
  const home = ensureHomeLife(game), item = home.craftedItems.find((entry) => entry.id === itemId && entry.status === "kept"), recipe = item && HOME_RECIPES[item.recipeId], npc = NPCS[npcId];
  if (!recipe || !npc || !(game.knownPeople || []).includes(npcId)) return { ok: false, message: "目前無法送出這份禮物。" };
  const weekKey = `${npcId}:${game.week}`;
  if (home.giftWeeks[weekKey]) return { ok: false, message: `這週已經送過${npc.name}一份心意了，留點空白給下次。` };
  const voice = NPC_HOME_VOICES[npcId], liked = recipe.tags.some((tag) => voice?.favorite?.includes(tag));
  const sameCount = home.gifts.filter((gift) => gift.npcId === npcId && gift.recipeId === item.recipeId).length;
  const gain = sameCount ? 1 : liked ? 5 + Math.min(2, item.quality - 3) : 3;
  adjustRelationship(npcId, { closeness: gain, trust: liked ? 2 : 1, affection: liked && ACTIVE_ROMANCE.has(game.relationships[npcId]?.romance) ? 2 : 0, source: `親手做了${recipe.name}` });
  item.status = "gifted";
  item.giftedTo = npcId;
  item.giftedWeek = game.week;
  home.giftWeeks[weekKey] = true;
  const text = sameCount ? `${npc.name}認出這是熟悉的${recipe.name}。心意仍在，但驚喜已經沒有第一次那麼大。` : `${voice?.gift || `${npc.name}認真收下了這份手作。`}${liked ? "你記得對方真正喜歡的東西。" : "不完全是對方平常會選的風格，但親手完成的心意仍被好好接住。"}`;
  home.gifts.push({ week: game.week, npcId, recipeId: item.recipeId, quality: item.quality, liked, repeated: sameCount > 0, text });
  game.npcInteractionMemories.push({ week: game.week, npcId, action: "handmade_gift", title: `送給${npc.name}・${recipe.name}`, text, source: "親手禮物" });
  return { ok: true, message: text };
}

export function setDisplayedKeepsake(id, game = state) {
  const home = ensureHomeLife(game);
  if (id != null && !home.keepsakes.some((item) => item.id === id)) return { ok: false, message: "這份紀念還沒有來到房間。" };
  home.displayedKeepsakeId = id || null;
  return { ok: true, message: id ? "已把這份回憶擺在房間裡。" : "牆面暫時留白。" };
}

export function keyAccessStatus(npcId, game = state) {
  const home = game.homeLife || ensureHomeLife(game), rel = game.relationships?.[npcId] || {}, record = home.keys[npcId];
  const eligible = (rel.closeness || 0) >= 65 && (rel.trust || 0) >= 55 && (ACTIVE_ROMANCE.has(rel.romance) || rel.stage === "bonded" || rel.stage === "confidant");
  const active = Boolean(record?.granted && eligible && (rel.hostility || 0) < 45 && rel.romance !== "broken");
  return { eligible, granted: Boolean(record?.granted), active };
}

export function setHomeKey(npcId, granted, game = state) {
  const home = ensureHomeLife(game), status = keyAccessStatus(npcId, game);
  if (granted && !status.eligible) return { ok: false, message: "你們還沒走到能交付備用鑰匙的關係。" };
  home.keys[npcId] = { granted: Boolean(granted), week: game.week };
  return { ok: true, message: granted ? `你把備用鑰匙交給了${NPCS[npcId].name}。這不是好感獎勵，是一份信任。` : `已收回${NPCS[npcId].name}的備用鑰匙。` };
}
