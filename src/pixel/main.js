import { createCityUI } from "./city-ui.js";
import { CITY_CATALOG } from "./city-catalog.js";
import { arriveAt } from "./life.js";
import { AVATARS, portraitAsset } from "../data/wardrobe.js";
import { repeatLine } from "./cast.js";
import { createLifeUI } from "./life-ui.js";
import { menuIcon } from "./menu-icons.js";
import {
  ROOMS,
  outfits,
  PEOPLE,
  CONVERSATIONS,
  ACTIVITY_TYPES,
} from "./data.js";
import { initialPixelState, createStorage, objectives } from "./model.js";
import { createWorld } from "./world.js";
const $ = (id) => document.getElementById(id);
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
let storage;
try {
  storage = createStorage(window.localStorage);
} catch {
  storage = createStorage({
    getItem: () => null,
    setItem: () => {
      throw new Error("Storage unavailable");
    },
  });
}
const loaded = storage.read();
let state = loaded.state || initialPixelState(),
  world = null,
  paused = false,
  panelType = "",
  toastTimer = null;
const panel = $("panel");
let previousFocus = null;
const portrait = () => portraitAsset(state.avatarId, state.outfitId);
function toast(message) {
  $("toast").textContent = message;
  $("toast").classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("toast").classList.remove("visible"), 3300);
}
function checkpoint(slot = "auto") {
  if (world) {
    state.position = { x: world.player.x, y: world.player.y };
  }
  const ok = storage.write(state, slot);
  $("save-status").textContent = ok ? "● 已儲存" : "暫時無法儲存";
  if (!ok) toast("瀏覽器無法寫入存檔，請確認儲存空間或隱私設定");
  return ok;
}
function changed() {
  const room = ROOMS[state.sceneId],
    outfit = outfits.find((o) => o.id === state.outfitId);
  $("room-title").textContent = room.name;
  $("room-subtitle").textContent = room.subtitle;
  $("player-name").textContent = state.playerName;
  $("outfit-label").textContent = outfit.name;
  if (!$("player-head").src.endsWith(portrait().replace("./", "")))
    $("player-head").src = portrait();

  const activity = state.activity;
  $("activity-strip").hidden = !activity;
  if (activity) {
    $("activity-label").textContent = ACTIVITY_TYPES[activity.kind].label;
    $("activity-progress").value =
      activity.elapsed / ACTIVITY_TYPES[activity.kind].duration;
  }
  lifeUI.changed();
}
function setDialogueVisible(visible) {
  $("dialogue").hidden = !visible;
  document.body.classList.toggle("conversation-open", visible);
  for (const element of document.querySelectorAll(
    ".topbar,#world-shell,.bottom-bar",
  ))
    element.inert = visible;
}
function show(type, html) {
  if (panelType === "travel" && type !== "travel") cityUI.cancelRoute();
  panelType = type;
  panel.dataset.view = type;
  setDialogueVisible(false);
  $("panel-content").innerHTML = html;
  if (!panel.open) {
    previousFocus = document.activeElement;
    panel.showModal();
  }
  panel.scrollTop = 0;
  world?.keys.clear();
  for (const hotspot of world?.hotspots || []) {
    hotspot.title.setVisible(false);
  }
}
function close() {
  cityUI.cancelRoute();
  if (panelType === "welcome") state.flags.intro = true;
  panel.close();
  panelType = "";
  if (state.dialogue) renderDialogue();
  else {
    setDialogueVisible(false);
    world?.releaseNpc();
    previousFocus?.focus?.();
  }
  checkpoint();
  changed();
}
function endDialogue() {
  state.dialogue = null;
  setDialogueVisible(false);
  panelType = "";
  world?.releaseNpc();
  checkpoint();
  changed();
  $("world").focus();
}
function leaveOverlay() {
  panel.close();
  state.dialogue = null;
  setDialogueVisible(false);
  panelType = "";
  world?.releaseNpc();
  paused = false;
}
function goTo(sceneId, itemId) {
  leaveOverlay();
  if (sceneId === state.sceneId) world.interact(itemId);
  else cityUI.route(sceneId, () => world.interact(itemId));
}
function menu() {
  show(
    "menu",
    `${heading("STARLIGHT DAYS", "我的生活")}<nav class="command-menu" aria-label="遊戲功能">${[
      ["schedule", "本週行程", "安排生活與成長"],
      ["travel", "城市地圖", "走進每一個地方"],
      ["creative", "創作筆記", "把靈感變成作品"],
      ["phone", "手機", "社群與聯絡人"],
      ["profile", "我的角色", "能力、衣櫃與名字"],
      ["nearby", "附近物件", "看看身邊有什麼"],
      ["settings", "系統設定", "存檔、速度與視角"],
    ]
      .map(
        ([id, name, note]) =>
          `<button ${id === "creative" ? 'data-life="creative"' : `data-ui="${id}"`}><i>${menuIcon(id)}</i><span><strong>${name}</strong><small>${note}</small></span><b>›</b></button>`,
      )
      .join(
        "",
      )}</nav><div class="menu-tail"><button data-ui="saves">${menuIcon("saves")} 存讀檔</button><button data-ui="close">返回 ▶</button></div>`,
  );
}
function nearby() {
  const actors = [...world.actors.keys()].filter((id) => id !== "player");
  show(
    "nearby",
    `${heading("AROUND ME · 附近", "看看身邊有什麼")}<nav id="nearby" aria-label="場景互動物件">${ROOMS[state.sceneId].objects.map((item) => `<button data-object="${item.id}">${item.name}<span>走近 →</span></button>`).join("")}${actors.map((id) => `<button data-npc="${id}"><img src="${PEOPLE[id].head}" alt="">${PEOPLE[id].name}<span>聊聊 →</span></button>`).join("")}</nav>`,
  );
}
function settings() {
  show(
    "settings",
    `${heading("TAKE IT EASY · 設定", "照自己的步調")}<div class="settings-controls"><button data-ui="saves">存檔與讀檔</button><button data-life="speed">速度 ${state.life.speed}× · 點按切換</button><button data-ui="zoom-in" aria-label="放大場景">＋ 放大</button><button data-ui="zoom-out" aria-label="縮小場景">− 縮小</button><button data-ui="center" aria-label="鏡頭回到主角">◎ 找回主角</button><button data-ui="pause" id="pause" aria-label="${paused ? "繼續世界" : "暫停世界"}">${paused ? "▷ 繼續世界" : "Ⅱ 暫停世界"}</button><button data-ui="help" aria-label="操作說明">操作說明</button></div>`,
  );
}
function schedule() {
  lifeUI.schedule();
}
function phone() {
  lifeUI.phone();
}

function heading(kicker, title, description = "") {
  return `<span class="eyebrow">${kicker}</span><h2 id="panel-title">${title}</h2>${description ? `<p class="lede">${description}</p>` : ""}`;
}
function welcome() {
  show(
    "welcome",
    `${heading("CHAPTER 01 · 來到星望市", "第一週，先在城市站穩腳步", "行李才剛放下。打開城市地圖，走進想去的地方。第一週的生活，由你自己安排。")}<div class="help-lines"><div><b>看看本週行程</b><span>已替你擬好第一週的安排；每天一件事，也可以自己調整。</span></div><div><b>走進城市</b><span>點地圖進入每個空間。到店就能購物，到教室就能上課，不需額外登記。</span></div><div><b>照自己的步調</b><span>親自走過去，或讓角色依行程自動執行；遇到選擇會停下來。</span></div></div>${avatarChoices()}<div class="buttons"><button class="primary" data-ui="begin">開始我的一天 →</button></div><p class="tiny-note">每一個地點，都有屬於它的人與日常。</p>`,
  );
}
function travel() {
  cityUI.show();
}
function avatarChoices() {
  return `<div class="avatar-choices" role="group" aria-label="主角外型">${Object.values(
    AVATARS,
  )
    .map(
      (a) =>
        `<button data-avatar="${a.id}" aria-pressed="${state.avatarId === a.id}"><img src="${portraitAsset(a.id, "newcomer")}" alt="${a.name}"><strong>${a.name}</strong></button>`,
    )
    .join("")}</div>`;
}
function wardrobe() {
  show(
    "wardrobe",
    `${heading("MY WARDROBE · 衣櫃", "換上今天的心情", "挑一套衣服，場景裡的你也會一起換裝。")}<div class="wardrobe-grid">${outfits.map((o) => `<button class="outfit-card" data-outfit="${o.id}" aria-pressed="${o.id === state.outfitId}" ${state.life.game.ownedOutfits[state.avatarId].includes(o.id) ? "" : "disabled"}><img src="${portraitAsset(state.avatarId, o.id)}" alt="${o.name}的原版立繪"><strong>${o.name}</strong><small>${o.id === state.outfitId ? "穿著中 ✓" : state.life.game.ownedOutfits[state.avatarId].includes(o.id) ? "換上這套" : "到服飾店購買"}</small></button>`).join("")}</div><div class="buttons"><button class="primary" data-ui="close">穿好了，出發</button></div>`,
  );
}
function profile() {
  show(
    "profile",
    `${heading("THIS IS ME · 玩家資訊", "我的小小起點")}<div class="player-profile"><img src="${portrait()}" alt="目前穿著的原版立繪"><div><label>角色名字<input id="name-input" maxlength="16" value="${escape(state.playerName)}" autocomplete="off"></label><p>${escape(outfits.find((o) => o.id === state.outfitId).name)}<br><span class="tiny-note">${AVATARS[state.avatarId].name} · 未簽約新人</span></p><button class="primary" data-ui="name">儲存名字</button><p class="tiny-note">${state.visited.length} 個足跡 · ${state.knownPeople.length} 位新朋友</p><button data-ui="closet">前往衣櫃</button></div></div>${avatarChoices()}<div class="ability-grid">${Object.entries(
      state.life.game.stats,
    )
      .map(([name, v]) => `<div><small>${name}</small><b>${v}</b></div>`)
      .join("")}</div>`,
  );
}
function journal() {
  show(
    "journal",
    `${heading("LITTLE MOMENTS · 生活手帳", "今天的小事", "不用一次完成全部，照自己的步調探索。")}<ul class="checklist">${objectives(
      state,
    )
      .map(
        (g) =>
          `<li class="${g.done ? "complete" : ""}"><span>${g.done ? "✓" : "○"}</span>${g.label}</li>`,
      )
      .join(
        "",
      )}</ul><p class="tiny-note">${state.knownPeople.length ? `已認識：${state.knownPeople.map((id) => PEOPLE[id].name).join("、")}` : "新的城市，通訊錄還是空白的。"}</p><button data-ui="saves">記住這個時刻</button>`,
  );
}
function help() {
  show(
    "help",
    `${heading("HOW TO PLAY · 操作", "慢慢逛，也可以很順手")}<div class="help-lines"><div><b>走動</b><span>點空地自動走過去；電腦也可用方向鍵或 WASD。</span></div><div><b>互動</b><span>點家具或人物本身。也可從「選單 → 附近物件」選擇，角色會先走近。</span></div><div><b>看場景</b><span>拖曳畫面平移；選單的「設定」可以縮放或找回主角。</span></div><div><b>閱讀</b><span>開啟視窗會暫停世界；也可從「選單 → 設定」暫停。</span></div><div><b>進度</b><span>自動存檔，另外提供五格手動存讀檔。</span></div></div><p class="tiny-note">每天一件主要安排，走路與查看手機不消耗天數。先到訪排練室／電視台，再報名課程／工作。1× 到 16× 只改變演出速度，成果相同。</p>`,
  );
}
function saves() {
  show(
    "saves",
    `${heading("SAVE A MOMENT · 存讀檔", "留住現在的生活", "這裡的進度與正式版分開儲存。")}<div class="save-list">${[
      "auto",
      1,
      2,
      3,
      4,
      5,
    ]
      .map((slot) => {
        const saved = storage.read(slot);
        return `<div class="save-row"><div><b>${slot === "auto" ? "自動存檔" : `手動位置 ${slot}`}</b><small>${saved.state ? `${ROOMS[saved.state.sceneId].name} · ${new Date(saved.savedAt).toLocaleString("zh-TW", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}` : saved.error || "還沒有留下足跡"}</small></div>${slot !== "auto" ? `<button data-save="${slot}">儲存</button>` : ""}<button data-load="${slot}" ${!saved.state ? "disabled" : ""}>讀取</button></div>`;
      })
      .join("")}</div>`,
  );
}
async function restore(slot) {
  const saved = storage.read(slot);
  if (!saved.state) {
    toast(saved.error || "這格還沒有存檔");
    return;
  }
  state = saved.state;
  setDialogueVisible(false);
  panel.close();
  panelType = "";
  await world.restoreRoom();
  changed();
  if (state.dialogue) renderDialogue();
  checkpoint();
  toast("回到剛才留下的時刻");
}
function startDialogue(id) {
  if (state.knownPeople.includes(id)) {
    state.dialogue = {
      npcId: id,
      index: 2,
      reply: repeatLine(id),
    };
  } else state.dialogue = { npcId: id, index: 0, reply: null };
  renderDialogue();
  checkpoint();
}
function renderDialogue() {
  const d = state.dialogue;
  if (!d) return;
  const node = CONVERSATIONS[d.npcId][d.index],
    player = node.speaker === "player" && !d.reply;
  const name = player ? state.playerName : PEOPLE[d.npcId].name,
    text = d.reply || node.text;
  panel.close();
  panelType = "dialogue";
  $("dialogue").innerHTML =
    `<div class="conversation"><figure class="dialogue-portrait ${player ? "player-crop" : "npc-crop"}"><img src="${player ? portrait() : PEOPLE[d.npcId].portrait}" alt="${escape(name)}的肩上肖像"></figure><div class="speech"><div class="dialogue-heading"><h2 id="dialogue-name">${escape(name)}</h2><span>${player ? "剛到星望市的你" : PEOPLE[d.npcId].job}</span></div><p id="dialogue-text">${escape(text)}</p><div class="choices">${node.choices && !d.reply ? node.choices.map((choice, i) => `<button data-choice="${i}">${choice.label}</button>`).join("") : `<button class="primary" data-ui="next-dialogue">${d.reply ? "下次見" : "繼續 →"}</button>`}</div></div><div class="dialogue-tools"><button data-ui="saves" aria-label="保存這段相遇">存檔</button><button data-ui="menu">選單</button><button data-ui="end-dialogue" aria-label="結束對話">×</button></div></div>`;
  setDialogueVisible(true);
  world?.keys.clear();
  $("dialogue").querySelector(".choices button")?.focus();
}
function nextDialogue() {
  const d = state.dialogue;
  if (!d) return;
  if (d.reply) {
    if (!state.knownPeople.includes(d.npcId)) state.knownPeople.push(d.npcId);
    lifeUI.meeting(d.npcId);
    endDialogue();
    toast("這座城市，多了一個認識的人");
    return;
  }
  d.index++;
  renderDialogue();
  checkpoint();
}
function simple(title, text, button = "知道了") {
  show(
    "simple",
    `${heading("A LITTLE MOMENT · 生活片刻", title)}<p>${text}</p><div class="buttons"><button class="primary" data-ui="close">${button}</button></div>`,
  );
}
function beginActivity(itemId, kind) {
  leaveOverlay();
  world.startActivity(itemId, kind);
  changed();
}
function selectObject(item) {
  show(
    "object",
    `${heading("A LITTLE MOMENT · 身邊的事", item.name)}<div class="buttons"><button class="primary" data-object="${item.id}">走近看看 →</button><button data-ui="close">再逛逛</button></div>`,
  );
}
function interact(item) {
  if (lifeUI.interact(item)) return;
  switch (item.action) {
    case "agencies":
      cityUI.agencies();
      break;
    case "business-exit":
      cityUI.interior("business");
      break;
    case "reading":
      lifeUI.creative();
      break;
    case "detail":
      simple(
        item.name,
        CITY_CATALOG[state.sceneId]?.gate || "看看這裡的日常。",
      );
      break;
    case "wardrobe":
      wardrobe();
      break;
    case "travel":
      travel();
      break;
    case "desk":
      menu();
      break;
    case "rest":
      beginActivity(item.id, "rest");
      break;
    case "sit":
      beginActivity(item.id, "sit");
      break;
    case "script":
      beginActivity(item.id, "read");
      break;
    case "practice":
      show(
        "practice",
        `${heading("REHEARSAL · 鏡前練習", "今天想怎麼練習？")}<div class="practice-choices"><button data-activity="dance" data-item="${item.id}"><span>♫</span><strong>舞步練習</strong><small>跟著節拍，動動身體</small></button><button data-activity="read" data-item="${item.id}"><span>▤</span><strong>朗讀台詞</strong><small>把一句話說進心裡</small></button></div>`,
      );
      break;
    case "notice":
      state.flags.notice = true;
      simple(
        "先了解，再開始",
        "你記下排練室的開放時段，和初學者課程的報名方式。這裡會是你往後練習表演的地方。",
      );
      break;
    case "coffee":
      goTo("cafe", "window");
      break;
    case "window":
      show(
        "seat",
        `${heading("A WINDOW SEAT · 窗邊座位", "給自己一杯咖啡的時間")}<div class="buttons"><button class="primary" data-activity="coffee" data-item="${item.id}">坐下喝一杯</button><button data-activity="sit" data-item="${item.id}">靜靜坐一會</button></div>`,
      );
      break;
  }
  checkpoint();
  changed();
}
const controller = {
  state: () => state,
  paused: () =>
    paused || panel.open || !!state.dialogue || controller.transitioning,
  transitioning: false,
  toast,
  checkpoint,
  changed,
  interact,
  selectObject,
  speed: () => state.life.speed,
  takeover: () => lifeUI.takeover(),
  activityDone: (kind, itemId) => {
    if (lifeUI.activityDone(kind, itemId)) return;
    const data = ACTIVITY_TYPES[kind];
    if (data.flag) state.flags[data.flag] = true;
    checkpoint();
    changed();
    toast(data.done);
  },
  talk: startDialogue,
  loading: (percent) =>
    ($("load-progress").textContent = `整理房間與行李… ${percent}%`),
  loadError: (key) => {
    $("loading").hidden = false;
    $("load-progress").textContent = `場景載入失敗（${key}），請重新整理重試。`;
  },
  enterRoom: (id) => {
    state.sceneId = id;
    state.position = { ...ROOMS[id].entry };
    state.activity = null;
    if (!state.visited.includes(id)) state.visited.push(id);
    const first = arriveAt(state.life, id);
    if (first) toast(`${ROOMS[id].name}：服務已開放`);
  },
  ready: (scene) => {
    world = scene;
    $("loading").hidden = true;
    changed();
    if (loaded.error) toast("舊的像素測試存檔無法讀取，已開啟新的體驗");
    arriveAt(state.life, state.sceneId);
    if (state.dialogue) renderDialogue();
    else if (!state.flags.intro) welcome();
    checkpoint();
  },
};
const cityUI = createCityUI({
  state: () => state,
  world: () => world,
  show,
  heading,
  leaveOverlay,
  toast,
  takeover: () => lifeUI.takeover(),
});
const lifeUI = createLifeUI({
  travelTo: (...args) => cityUI.route(...args),
  state: () => state,
  world: () => world,
  show,
  heading,
  escape,
  checkpoint,
  toast,
  leaveOverlay,
  paused: () =>
    paused || panel.open || !!state.dialogue || controller.transitioning,
});
setInterval(() => lifeUI.tick(0.1), 100);
document.addEventListener("click", async (event) => {
  const target = event.target.closest("button");
  if (!target || !world) return;
  if (cityUI.handle(target)) return;
  if (lifeUI.handle(target)) return;
  if (target.dataset.object) {
    leaveOverlay();
    world.interact(target.dataset.object);
    return;
  }
  if (target.dataset.npc) {
    leaveOverlay();
    world.talk(target.dataset.npc);
    return;
  }
  if (target.dataset.go) {
    const [room, item] = target.dataset.go.split(":");
    goTo(room, item);
    return;
  }
  if (target.dataset.activity) {
    beginActivity(target.dataset.item, target.dataset.activity);
    return;
  }
  if (target.dataset.avatar && AVATARS[target.dataset.avatar]) {
    if (controller.transitioning) return;
    lifeUI.takeover();
    const avatar = target.dataset.avatar,
      oldAvatar = state.avatarId,
      oldOutfit = state.outfitId;
    state.avatarId = avatar;
    state.life.game.avatarId = avatar;
    state.life.game.gender = AVATARS[avatar].gender;
    state.outfitId = state.life.game.ownedOutfits[avatar].includes(
      state.outfitId,
    )
      ? state.outfitId
      : "newcomer";
    state.life.game.outfitId = state.outfitId;
    try {
      toast("正在整理造型…");
      await world.setOutfit(state.outfitId);
    } catch {
      state.avatarId = oldAvatar;
      state.outfitId = oldOutfit;
      state.life.game.avatarId = oldAvatar;
      state.life.game.outfitId = oldOutfit;
      state.life.game.gender = AVATARS[oldAvatar].gender;
      toast("人物載入失敗，請再試一次");
      return;
    }
    checkpoint();
    changed();
    panelType === "welcome" ? welcome() : profile();
    return;
  }
  if (target.dataset.outfit) {
    if (controller.transitioning) return;
    lifeUI.takeover();
    if (
      !state.life.game.ownedOutfits[state.avatarId].includes(
        target.dataset.outfit,
      )
    )
      return;
    const previousOutfit = state.outfitId;
    state.life.game.outfitId = target.dataset.outfit;
    state.outfitId = target.dataset.outfit;
    state.flags.changed = true;
    try {
      toast("正在換裝…");
      await world.setOutfit(state.outfitId);
    } catch {
      state.outfitId = previousOutfit;
      state.life.game.outfitId = previousOutfit;
      toast("服裝載入失敗，請再試一次");
      return;
    }
    checkpoint();
    changed();
    panelType === "shop" ? lifeUI.shop() : wardrobe();
    toast("立繪與像素人物已一起換裝");
    return;
  }
  if (target.dataset.choice !== undefined) {
    const d = state.dialogue;
    d.reply =
      CONVERSATIONS[d.npcId][d.index].choices[
        Number(target.dataset.choice)
      ].reply;
    renderDialogue();
    checkpoint();
    return;
  }
  if (target.dataset.save) {
    const slot = target.dataset.save;
    if (storage.read(slot).state) {
      show(
        "overwrite",
        `${heading("SAVE A MOMENT", "取代這格手動存檔？", "會用現在的場景、衣服與對話進度取代這格紀錄。")}<div class="buttons"><button class="primary" data-confirm-save="${slot}">取代存檔</button><button data-ui="saves">保留原紀錄</button></div>`,
      );
    } else {
      checkpoint(slot);
      saves();
      toast(`已儲存到位置 ${slot}`);
    }
    return;
  }
  if (target.dataset.confirmSave) {
    checkpoint(target.dataset.confirmSave);
    saves();
    toast("已更新手動存檔");
    return;
  }
  if (target.dataset.load) {
    restore(target.dataset.load);
    return;
  }
  switch (target.dataset.ui) {
    case "close":
      close();
      break;
    case "begin":
      state.flags.intro = true;
      close();
      break;
    case "help":
      help();
      break;
    case "saves":
      saves();
      break;
    case "profile":
      profile();
      break;
    case "name":
      state.playerName =
        $("name-input").value.trim().slice(0, 16) || "星途新人";
      state.life.game.name = state.playerName;
      checkpoint();
      changed();
      close();
      break;
    case "journal":
      journal();
      break;
    case "menu":
      menu();
      break;
    case "nearby":
      nearby();
      break;
    case "settings":
      settings();
      break;
    case "schedule":
      schedule();
      break;
    case "closet":
      goTo("home", "wardrobe");
      break;
    case "phone":
      phone();
      break;
    case "end-dialogue":
      endDialogue();
      break;
    case "stop-activity":
      lifeUI.takeover();
      world.cancelActivity();
      checkpoint();
      break;
    case "agencies":
      cityUI.agencies();
      break;
    case "travel":
      travel();
      break;
    case "next-dialogue":
      nextDialogue();
      break;
    case "center":
      world.center();
      break;
    case "zoom-in":
      world.zoom(0.15);
      break;
    case "zoom-out":
      world.zoom(-0.15);
      break;
    case "pause":
      paused = !paused;
      settings();
      toast(paused ? "世界暫停了" : "繼續今天的生活");
      break;
  }
});
panel.addEventListener("cancel", (event) => {
  event.preventDefault();
  close();
});
window.addEventListener("pagehide", () => checkpoint());
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    world?.keys.clear();
    checkpoint();
  }
});
setInterval(() => {
  if (world && !document.hidden) checkpoint();
}, 10000);
// Read-only diagnostic surface, shared by browser smoke tests and support.
window.__pixelRead = () =>
  world
    ? { ...world.snapshot(), state: structuredClone(state), panel: panelType }
    : null;
createWorld(controller);

$("dialogue").addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    event.preventDefault();
    endDialogue();
  }
  if (event.key === "Tab") {
    const buttons = [...$("dialogue").querySelectorAll("button")],
      first = buttons[0],
      last = buttons.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});
