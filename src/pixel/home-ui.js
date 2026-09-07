import { HOME_ITEMS, HOME_RECIPES, HOME_SLOTS, HOME_VISIT_ACTIVITIES, MATERIAL_LABELS, SUPPLIES } from "../data/home-life.js";
import { NPCS } from "../data/npcs.js";
import { ensureHomeLife, homeActionAccess, keyAccessStatus } from "../logic/home-life.js";

export function createHomeUI(api) {
  const { state, show, heading, escape, checkpoint, changed, toast, planDay, buyHomeItem, placeHomeItem, buyHomeSupply, useHomeCraft, giftHomeCraft, displayHomeKeepsake, changeHomeKey } = api;
  let tab = "room", selectedCraftId = null;
  const life = () => state().life;
  const money = (n) => `$${Number(n || 0).toLocaleString()}`;
  const home = () => ensureHomeLife(life().game);
  const footer = () => '<div class="panel-actions"><button data-ui="menu">◀ 選單</button><button class="primary" data-ui="close">回到房間</button></div>';
  const nav = () => `<nav class="home-life-tabs" aria-label="居家生活分類">${[["room","布置"],["visits","作客"],["craft","手作"],["keepsakes","紀念"],["keys","鑰匙"]].map(([id, label]) => `<button data-home-tab="${id}" aria-pressed="${tab === id}">${label}</button>`).join("")}</nav>`;
  const dayButtons = (assignment) => life().plan.map((planned, day) => {
    const reason = planReason(assignment, day), label = planned.id === "rest" ? "空著／休息" : planned.id === "home_host" ? "已有作客安排" : planned.id === "home_craft" ? "已有手作安排" : "已有其他行程";
    return `<button data-home-plan-day="${day}" data-home-assignment="${escape(JSON.stringify(assignment))}" ${reason ? "disabled" : ""}><b>週${"一二三四五六日"[day]}</b><small>${day < life().day ? "已結束" : label}</small></button>`;
  }).join("");
  const planReason = (assignment, day) => day < life().day || (day === life().day && life().pending) ? "這一天不能更改" : homeActionAccess(life().game, assignment);

  function roomView() {
    const h = home();
    return `<section class="home-room-preview"><div class="home-room-mini">${Object.entries(HOME_SLOTS).map(([slot, label]) => { const item = HOME_ITEMS[h.placedFurniture[slot]]; return `<div data-home-slot="${slot}"><small>${label}</small><i>${item?.icon || "□"}</i><b>${escape(item?.name || "留白")}</b></div>`; }).join("")}</div><p>點選已擁有家具即可換上；預覽、擺放與收納不消耗天數。</p></section><div class="home-catalog">${Object.entries(HOME_SLOTS).map(([slot, label]) => `<section><h3>${label}</h3>${Object.entries(HOME_ITEMS).filter(([, item]) => item.slot === slot).map(([id, item]) => { const owned = h.ownedFurniture.includes(id), placed = h.placedFurniture[slot] === id; return `<article><i>${item.icon}</i><div><b>${escape(item.name)}</b><small>${escape(item.note)}</small></div>${owned ? `<button data-home-place="${id}" ${placed ? "disabled" : ""}>${placed ? "擺放中" : "換上"}</button>` : `<button data-home-buy="${id}">${money(item.price)}</button>`}</article>`; }).join("")}</section>`).join("")}</div>`;
  }

  function visitsView() {
    const known = life().game.knownPeople || [];
    return known.length ? `<p class="home-life-note">邀請會占用一天。初識的人需要再相處一陣子，關係緊張時也不會硬闖進妳家。</p><div class="home-contact-grid">${known.map((id) => { const npc = NPCS[id], rel = life().game.relationships[id] || {}, available = (rel.closeness || 0) >= 20 && (rel.hostility || 0) < 45; return `<article><img src="${npc.portrait || npc.bust}" alt=""><div><b>${npc.name}</b><small>${npc.job} · ${available ? "可以邀請" : "還不適合到家裡"}</small></div><div class="home-visit-actions">${Object.entries(HOME_VISIT_ACTIVITIES).map(([activityId, activity]) => `<button data-home-visit="${id}" data-home-activity="${activityId}" ${available ? "" : "disabled"}>${activity.icon} ${activity.name}</button>`).join("")}</div></article>`; }).join("")}</div>` : '<p class="empty-note">先在城市裡認識一個人、交換聯絡方式，才有能邀請回家的朋友。</p>';
  }

  function craftView() {
    const h = home(), items = h.craftedItems.filter((item) => item.status === "kept");
    return `<section class="home-materials"><header><b>材料櫃</b><span>現金 ${money(life().game.money)}</span></header><p>${Object.entries(h.materials).filter(([, amount]) => amount > 0).map(([id, amount]) => `${MATERIAL_LABELS[id] || id} × ${amount}`).join("・") || "還沒有材料"}</p><div>${Object.entries(SUPPLIES).map(([id, supply]) => `<button data-home-supply="${id}">${supply.icon} ${supply.name}・${money(supply.price)}</button>`).join("")}</div></section><div class="home-recipe-grid">${Object.entries(HOME_RECIPES).map(([id, recipe]) => { const reason = homeActionAccess(life().game, { id: "home_craft", recipeId: id }); return `<article><i>${recipe.icon}</i><div><small>${recipe.type}</small><b>${recipe.name}</b><p>${recipe.note}</p><small>${Object.entries(recipe.needs).map(([material, amount]) => `${MATERIAL_LABELS[material]}×${amount}`).join("・")}</small></div><button data-home-recipe="${id}" ${reason ? "disabled" : ""}>${reason || "安排製作"}</button></article>`; }).join("")}</div><section class="home-finished"><h3>已完成的心意</h3>${items.length ? items.map((item) => `<article><span>${HOME_RECIPES[item.recipeId].icon}</span><div><b>${item.name}</b><small>${"★".repeat(item.quality)}・第 ${item.madeWeek} 週完成</small></div><button data-home-use="${item.id}">留給自己</button><button data-home-gift="${item.id}">送禮</button></article>`).join("") : '<p class="empty-note">完成後可以自己享用、保留或送給重要的人。</p>'}</section>`;
  }

  function keepsakesView() {
    const h = home(), displayed = h.displayedKeepsakeId;
    return h.keepsakes.length ? `<p class="home-life-note">這些不是能力加成，而是妳真的走過的日子。展示後，來作客的人可能會注意到。</p><div class="keepsake-grid">${h.keepsakes.map((item) => `<article><i>${item.icon || "✦"}</i><div><small>${escape(item.kind || "紀念")}</small><b>${escape(item.name)}</b><p>${escape(item.source || "留在房裡的一段回憶")}</p></div><button data-home-display="${escape(item.id)}" ${displayed === item.id ? "disabled" : ""}>${displayed === item.id ? "展示中" : "擺出來"}</button></article>`).join("")}</div>${displayed ? '<button data-home-display="">讓牆面暫時留白</button>' : ""}` : '<p class="empty-note">第一份作品、獎項與人物送來的東西，之後會慢慢住進這裡。</p>';
  }

  function keysView() {
    const known = life().game.knownPeople || [];
    return `<p class="home-life-note">備用鑰匙不是數值獎勵。只有足夠信任的知己或伴侶能取得；分手、交惡或撤回後會立即失效。</p><div class="home-key-list">${known.map((id) => { const npc = NPCS[id], status = keyAccessStatus(id, life().game); return `<article><img src="${npc.portrait || npc.bust}" alt=""><div><b>${npc.name}</b><small>${status.active ? "持有可用的備用鑰匙" : status.granted ? "鑰匙已失效" : status.eligible ? "可以交付" : "關係尚未走到這裡"}</small></div>${status.granted ? `<button data-home-key="${id}" data-home-key-value="false">收回鑰匙</button>` : `<button data-home-key="${id}" data-home-key-value="true" ${status.eligible ? "" : "disabled"}>交付鑰匙</button>`}</article>`; }).join("") || '<p class="empty-note">通訊錄還是空白的。</p>'}</div>`;
  }

  function open(nextTab = tab) {
    tab = nextTab;
    const views = { room: roomView, visits: visitsView, craft: craftView, keepsakes: keepsakesView, keys: keysView };
    show("home-life", `${heading("HOME & HEART", "居家生活", "房間會記得妳成為誰，也記得誰曾經在這裡坐過。")}${nav()}${views[tab]()}${footer()}`);
  }

  function chooseDay(assignment, title) {
    show("home-plan", `${heading("MAKE A DATE", title, "選一天排入行程；確認後仍可在行程開始前更換。")}<div class="home-day-grid">${dayButtons(assignment)}</div><div class="panel-actions"><button data-ui="home-life">返回居家生活</button></div>`);
  }

  function giftPicker(itemId) {
    selectedCraftId = itemId;
    const item = home().craftedItems.find((entry) => entry.id === itemId);
    show("home-gift", `${heading("A SMALL GIFT", `把${escape(item?.name || "這份心意")}送給誰？`, "對方會記得第一次，也會察覺妳是不是每週都送同一樣。")}<div class="home-contact-grid">${(life().game.knownPeople || []).map((id) => `<button class="home-gift-person" data-home-gift-person="${id}"><img src="${NPCS[id].portrait || NPCS[id].bust}" alt=""><span><b>${NPCS[id].name}</b><small>${NPCS[id].job}</small></span></button>`).join("") || '<p class="empty-note">目前沒有可以送禮的聯絡人。</p>'}</div><div class="panel-actions"><button data-ui="home-life">返回居家生活</button></div>`);
  }

  function handle(target) {
    const d = target.dataset;
    if (d.homeTab) { open(d.homeTab); return true; }
    if (d.homeBuy) { const result = buyHomeItem(life(), d.homeBuy); checkpoint(); changed(); open("room"); toast(result.message); return true; }
    if (d.homePlace) { const result = placeHomeItem(life(), d.homePlace); checkpoint(); changed(); open("room"); toast(result.message); return true; }
    if (d.homeSupply) { const result = buyHomeSupply(life(), d.homeSupply); checkpoint(); changed(); open("craft"); toast(result.message); return true; }
    if (d.homeRecipe) { chooseDay({ id: "home_craft", recipeId: d.homeRecipe }, `製作${HOME_RECIPES[d.homeRecipe].name}`); return true; }
    if (d.homeVisit) { chooseDay({ id: "home_host", npcId: d.homeVisit, activityId: d.homeActivity }, `邀請${NPCS[d.homeVisit].name}・${HOME_VISIT_ACTIVITIES[d.homeActivity].name}`); return true; }
    if (d.homePlanDay !== undefined) {
      let assignment;
      try { assignment = JSON.parse(d.homeAssignment); } catch { return true; }
      const day = Number(d.homePlanDay), result = planDay(life(), day, assignment);
      checkpoint(); changed();
      if (result) toast(result); else { open(assignment.id === "home_host" ? "visits" : "craft"); toast(`已排入週${"一二三四五六日"[day]}。`); }
      return true;
    }
    if (d.homeUse) { const result = useHomeCraft(life(), d.homeUse); checkpoint(); changed(); open("craft"); toast(result.message); return true; }
    if (d.homeGift) { giftPicker(d.homeGift); return true; }
    if (d.homeGiftPerson) { const result = giftHomeCraft(life(), selectedCraftId, d.homeGiftPerson); checkpoint(); changed(); open("craft"); toast(result.message); return true; }
    if (d.homeDisplay !== undefined) { const result = displayHomeKeepsake(life(), d.homeDisplay || null); checkpoint(); open("keepsakes"); toast(result.message); return true; }
    if (d.homeKey) { const result = changeHomeKey(life(), d.homeKey, d.homeKeyValue === "true"); checkpoint(); open("keys"); toast(result.message); return true; }
    return false;
  }
  return { open, handle };
}
