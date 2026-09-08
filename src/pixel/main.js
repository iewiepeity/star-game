import { normalizeNarrativeSettings, narrativeText } from "../logic/narrative-preferences.js";
import { createPixelStorage as createStorage } from "./storage.js";
import {
  APPEARANCES,
  appearanceValue,
  setObjectAppearance,
  canReturnHome,
} from "./scene-objects.js";
import { setupPixelOffline } from "./offline.js";
import { homeFurnitureInfo } from "./home-furniture.js";
import { tutorialMarkup, dismissTutorial } from "./tutorial-ui.js";
import {
  configureAudioPreferences,
  enableAudio,
  syncAudio,
  playSfx,
  suspendAudio,
  resumeAudio,
} from "../core/audio.js";
import {
  creationFields,
  editCreation,
  finishCreation,
  rerollCreation,
  refreshCreationStats,
  prologueData,
  advanceOpening,
} from "./onboarding.js";
import { createStorageUI } from "./storage-ui.js";
import { createFeatureUI } from "./feature-ui.js";
import {
  pixelPreferences,
  applyPixelTheme,
  applyPixelFont,
} from "./preferences.js";
import { PIXEL_VERSION } from "./release-notes.js";
import { settingsMarkup, releaseNotesMarkup } from "./settings-ui.js";
import {
  avatarsForGender,
  selectAvatar,
  lockIdentity,
  changeGenderAtClinic,
  genderChangeReason,
  GENDER_CHANGE_COST,
} from "./identity.js";
import { createCityUI } from "./city-ui.js";
import { cityDetailText } from "./city-interaction-copy.js";
import { arriveAt, CHOICES, planDay, access } from "./life.js";
import { AGENCIES } from "../data/agencies.js";
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
import { initialPixelState, objectives } from "./model.js";
import { createWorld } from "./world.js";
import { createViewportControls } from "./viewport.js";
const $ = (id) => document.getElementById(id);
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
let storage, preferences;
try {
  preferences = pixelPreferences(window.localStorage);
} catch {
  preferences = pixelPreferences(null);
}
applyPixelTheme(preferences.get().theme);
applyPixelFont(preferences.get().fontSize);
configureAudioPreferences(() => preferences.get());
let audioUnlocked = false;
let appearanceBusy = false;
let legacyStorage = null;
try { legacyStorage = window.localStorage; } catch {}
storage = await createStorage(legacyStorage, {
  onDataDeleted: () => window.location.replace(new URL("./privacy.html", window.location.href)),
});
const loaded = storage.read();
let recoveryBlocked = !!loaded.error;
let state = loaded.state || initialPixelState(),
  world = null,
  paused = false,
  panelType = "",
  toastTimer = null;
const panel = $("panel");
const viewportControls = createViewportControls($("viewport-reset"), panel);
let previousFocus = null;
let checkpointCount = 0;
let resumeUpdateAfterConflict = false;
const portrait = () => portraitAsset(state.avatarId, state.outfitId);
function toast(message) {
  (panel.open ? panel : document.body).append($("toast"));
  $("toast").textContent = message;
  $("toast").classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("toast").classList.remove("visible"), 3300);
}
async function checkpoint(slot = "auto") {
  if (appearanceBusy || recoveryBlocked) return false;
  if (world) {
    state.position = { x: world.player.x, y: world.player.y };
  }
  checkpointCount++;
  $("save-status").textContent = "正在儲存…";
  const ok = await storage.write(state, slot);
  checkpointCount--;
  $("save-status").textContent = checkpointCount ? "正在儲存…" : ok ? "● 已儲存" : "暫時無法儲存";
  if (!ok) toast(storage.error || "儲存失敗，請從存檔選單匯出目前旅程");
  return ok;
}
function changed() {
  state.knownPeople = [
    ...new Set([...state.knownPeople, ...state.life.game.knownPeople]),
  ];
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
  $("return-home").disabled = !canReturnHome(
    state,
    appearanceBusy || controller.transitioning,
  );
  const homeLabel = state.sceneId === "home" ? "⌂ 在家" : "⌂ 回家";
  if ($("return-home").textContent !== homeLabel) $("return-home").textContent = homeLabel;
  lifeUI.changed();
  if (audioUnlocked) syncRoomAudio();
}
function syncRoomAudio() {
  syncAudio(
    state.sceneId === "home"
      ? "room"
      : state.sceneId === "cafe"
        ? "social"
        : state.sceneId.includes("agency")
          ? "industry"
          : "planning",
    state.life.game,
  );
}
function setDialogueVisible(visible) {
  if (visible) $("toast").classList.remove("visible");
  $("dialogue").hidden = !visible;
  document.body.classList.toggle("conversation-open", visible);
  for (const element of document.querySelectorAll(
    ".topbar,#world-shell,.bottom-bar",
  ))
    element.inert = visible;
}
function show(type, html, { preserveScroll = false, scrollAnchor } = {}) {
  const keepPosition = preserveScroll && panel.open && panelType === type;
  const scrollTop = keepPosition ? panel.scrollTop : 0;
  const expanded = keepPosition
    ? [...panel.querySelectorAll("details")].map(node => node.open) : [];
  const anchor = keepPosition && scrollAnchor ? panel.querySelector(scrollAnchor) : null;
  const anchorTop = anchor?.getBoundingClientRect().top;
  const focused = keepPosition && panel.contains(document.activeElement)
    ? document.activeElement : null;
  const focusAttribute = focused && [...focused.attributes].find(attribute =>
    attribute.name === "id" || attribute.name.startsWith("data-"));
  if (panelType === "travel" && type !== "travel") cityUI.cancelRoute();
  panelType = type;
  panel.dataset.view = type;
  setDialogueVisible(false);
  $("panel-content").innerHTML =
    (preferences.get().tutorials ? tutorialMarkup(state, type) : "") + html;
  if (!$("panel-title")) {
    const title = $("panel-content").querySelector("h2");
    if (title) title.id = "panel-title";
  }
  if (!panel.open) {
    previousFocus = document.activeElement;
    panel.showModal();
  }
  if ($("toast").classList.contains("visible")) panel.append($("toast"));
  if (keepPosition) {
    panel.querySelectorAll("details").forEach((node, i) => { node.open = !!expanded[i]; });
    if (focusAttribute) {
      panel.querySelector(`[${focusAttribute.name}="${CSS.escape(focusAttribute.value)}"]`)
        ?.focus({ preventScroll: true });
    }
  }
  panel.scrollTop = scrollTop;
  const nextAnchor = anchor && panel.querySelector(scrollAnchor);
  if (nextAnchor) panel.scrollTop += nextAnchor.getBoundingClientRect().top - anchorTop;
  viewportControls.sync();
  world?.keys.clear();
  for (const hotspot of world?.hotspots || []) {
    hotspot.title.setVisible(false);
  }
}
function close() {
  if (appearanceBusy) return;
  document.body.append($("toast"));
  cityUI.cancelRoute();
  if (recoveryBlocked) { recovery(); return; }
  if (storage.conflicted) { storageConflict(); return; }
  if (!state.flags.intro) {
    checkpoint();
    welcome();
    toast("角色仍可繼續編輯，完成設定後請按「開始我的一天」");
    return;
  }
  panel.close();
  panelType = "";
  if (state.dialogue) renderDialogue();
  else if (lifeUI.resumeNarrative()) return;
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
  document.body.append($("toast"));
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
  if (state.life.storyStage) {
    show(
      "story-menu",
      `${heading("A MOMENT TO PAUSE", "稍作停留")}<div class="command-list"><button class="command-row" data-ui="close"><span><strong>繼續故事</strong><small>回到剛才的這一幕</small></span><b>→</b></button><button class="command-row" data-ui="saves"><span><strong>存檔與讀檔</strong></span><b>→</b></button><button class="command-row" data-ui="settings"><span><strong>系統設定</strong><small>配色、文字與聲音</small></span><b>→</b></button></div>`,
    );
    return;
  }
  show(
    "menu",
    `${heading("STARLIGHT DAYS", "我的生活")}<nav class="command-menu" aria-label="遊戲功能">${[
      ["schedule", "本週行程", "安排生活與成長"],
      ["travel", "城市地圖", "走進每一個地方"],
      ["career", "職涯與故事", "徵選、通告、人物與作品"],
      ["creative", "創作筆記", "把靈感變成作品"],
      ["phone", "手機", "社群與聯絡人"],
      ["profile", "我的角色", "能力、衣櫃與名字"],
      ["home-life", "居家生活", "布置、作客、手作與紀念"],
      ["city-life", "城市生活", "穿搭、日曆、熟客與小夥伴"],
      ["nearby", "附近物件", "看看身邊有什麼"],
      ["settings", "系統設定", "主題、速度與視角"],
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
    `${heading("AROUND ME · 附近", "看看身邊有什麼")}<nav id="nearby" aria-label="場景互動物件">${ROOMS[state.sceneId].objects.map((item) => `<button data-object="${item.id}">${item.name}<span>${item.action === "inspect" ? "看看 →" : "使用 →"}</span></button>`).join("")}${actors.map((id) => `<button data-npc="${id}"><img src="${PEOPLE[id].head}" alt="">${PEOPLE[id].name}<span>聊聊 →</span></button>`).join("")}</nav>`,
  );
}
function releaseNotes() {
  show("release-notes", `${heading("WHAT'S NEW · 星望市施工日誌", "版本更新紀錄")}${releaseNotesMarkup(escape)}`);
}
function settings() {
  show(
    "settings",
    `${heading("YOUR LITTLE WORLD", "照自己的步調")}${settingsMarkup({ theme: preferences.get().theme, speed: state.life.speed, paused, preferences: preferences.get(), narrativeSettings: state.life.game.narrativeSettings })}`,
    { preserveScroll: true },
  );
}
function clinic() {
  if (state.sceneId !== "clinic") {
    cityUI.route("clinic", clinic);
    return;
  }
  const gender = state.identity.gender === "女性" ? "男性" : "女性";
  show(
    "clinic",
    `${heading("STARWISH CLINIC", "性別變更服務", "這是屬於你的決定。先看看費用與外型，確認後才會辦理。")}
    <div class="clinic-intro"><i>${menuIcon("clinic")}</i><div><small>目前性別</small><b>${state.identity.gender}</b><span>變性手術 · $${GENDER_CHANGE_COST.toLocaleString()}</span></div></div>
    <p class="tiny-note">確認後當場辦理，不另占行程天數；現有服裝會保留在各自外型的衣櫃。</p>
    <div class="avatar-choices" role="group" aria-label="術後人物外型">${avatarsForGender(
      gender,
    )
      .map(
        (a) =>
          `<button data-request-gender="${a.id}" ${genderChangeReason(state, a.id) ? "disabled" : ""}><img src="${portraitAsset(a.id, "newcomer")}" alt="${a.name}"><strong>${a.name}</strong><small>${a.gender}</small></button>`,
      )
      .join("")}</div>
    <p class="result-note">${escape(genderChangeReason(state, avatarsForGender(gender)[0].id) || "選擇外型後，會再列出變更內容與費用供你確認。")}</p>
    <button data-ui="close">先不變更，回到場景</button>`,
  );
}
async function applyAppearance(id, surgery = false) {
  const before = structuredClone(state);
  const error = surgery
    ? genderChangeReason(state, id)
    : state.identity.locked && AVATARS[id].gender !== state.identity.gender
      ? "性別已固定，請到診所辦理變更。"
      : "";
  if (error) {
    toast(error);
    return;
  }
  appearanceBusy = true;
  lifeUI.takeover();
  const r = surgery
    ? changeGenderAtClinic(state, id)
    : { ok: !selectAvatar(state, id) };
  if (!r.ok) {
    Object.assign(state, before);
    appearanceBusy = false;
    toast(r.reason || "無法更換外型");
    return;
  }
  try {
    await world.setOutfit(state.outfitId);
  } catch {
    Object.assign(state, before);
    appearanceBusy = false;
    toast("人物載入失敗，原外型與金錢已保留，請再試一次。");
    return;
  }
  appearanceBusy = false;
  checkpoint();
  changed();
  if (surgery) {
    profile();
    toast(`變更已完成，目前性別為${state.identity.gender}。`);
  } else if (panelType === "welcome") welcome();
  else profile();
}
function schedule() {
  lifeUI.schedule();
}
function phone() {
  featureUI.open("phone");
}

function heading(kicker, title, description = "") {
  return `<header class="panel-heading"><span class="eyebrow">${escape(kicker)}</span><h2 id="panel-title">${escape(title)}</h2>${description ? `<p class="lede">${escape(description)}</p>` : ""}</header>`;
}
function welcome() {
  show(
    "welcome",
    `${heading("NEW GAME · 星望市", "你的故事，從這裡開始", "一只行李，一個夢想。先認識即將出發的自己。")}
    <div class="creation-layout">
      <section class="creation-look"><h3 class="section-caption"><span>01</span> 選擇主角</h3>
        <div class="identity-picker"><div role="group" aria-label="主角性別">${["女性", "男性"].map((g) => `<button data-create-gender="${g}" aria-pressed="${state.identity.gender === g}">${g}</button>`).join("")}</div></div>
        ${avatarChoices()}
        <p class="tiny-note">選定性別後，同性別的兩種外型仍能自由切換。</p>
      </section>
      <section class="creation-details"><h3 class="section-caption"><span>02</span> 留下你的名字</h3>${creationFields(state, escape)}</section>
    </div>
    <details class="newcomer-guide"><summary>星望市生活小提醒</summary><div class="help-lines">
      <div><b>安排一週</b><span>每天一件事。第一週已擬好行程，也可以自己調整。</span></div>
      <div><b>走進城市</b><span>點地圖前往教室、商店與公司；到店就能購物，到教室就能上課。</span></div>
      <div><b>照自己的步調</b><span>親自走走，或交給自動行程。重要選擇都會等你決定。</span></div>
    </div></details>
    <div class="creation-footer"><span>夢想沒有標準答案。<small>接下來，一起翻開序章。</small></span><button class="primary" data-ui="begin">開始我的一天 →</button></div>`,
  );
}
function travel() {
  cityUI.show();
}
function avatarChoices() {
  return `<div class="avatar-choices" role="group" aria-label="主角外型">${avatarsForGender(
    state.identity.gender,
  )
    .map(
      (a) =>
        `<button data-avatar="${a.id}" aria-pressed="${state.avatarId === a.id}"><img src="${portraitAsset(a.id, "newcomer")}" alt="${a.name}"><strong>${a.name}</strong></button>`,
    )
    .join("")}</div>`;
}
function wardrobe() {
  featureUI.wardrobe();
}

function profile() {
  show(
    "profile",
    `${heading("THIS IS ME · 玩家資訊", "我的角色")}<div class="player-profile"><img src="${portrait()}" alt="目前角色的立繪"><div><label>角色本名<input id="real-name-input" maxlength="16" value="${escape(state.life.game.realName || state.playerName)}" autocomplete="off"></label><label>藝名（選填）<input id="name-input" maxlength="16" value="${escape(state.life.game.stageName || "")}" autocomplete="off"></label><p>${escape(outfits.find((o) => o.id === state.outfitId).name)}<br><span class="tiny-note">${AVATARS[state.avatarId].name} · ${AGENCIES[state.life.game.currentAgencyId]?.name || "自由藝人"}</span></p><button class="primary" data-ui="name">儲存名字</button><p class="tiny-note">${state.visited.length} 個足跡 · ${state.knownPeople.length} 位新朋友</p><button data-ui="closet">前往衣櫃</button></div></div><div class="identity-caption"><b>${state.identity.gender} · 同性別外型</b><button data-ui="clinic">診所性別變更服務 →</button></div>${avatarChoices()}<div class="buttons"><button data-pixel-app="stats">完整能力與健康</button><button data-pixel-app="achievements">成就收藏</button><button data-pixel-app="log">生涯紀錄</button></div><div class="ability-grid">${Object.entries(
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
    `${heading("HOW TO PLAY · 操作", "慢慢逛，也可以很順手")}<div class="help-lines"><div><b>走動</b><span>點空地自動走過去；電腦也可用方向鍵或 WASD。</span></div><div><b>互動</b><span>點家具或人物本身。也可從「選單 → 附近物件」選擇，角色會先走近。</span></div><div><b>看場景</b><span>拖曳畫面平移；選單的「設定」可以縮放或找回主角。</span></div><div><b>職涯</b><span>選單的「職涯與故事」可查看徵選、作品與人物約定。試鏡、製作與約會各占一天。</span></div><div><b>閱讀</b><span>開啟視窗會暫停世界；重要劇情在下方閱讀，選擇後才繼續。</span></div><div><b>進度</b><span>自動存檔，另外提供五格手動存讀檔。</span></div></div><p class="tiny-note">每天一件主要安排，走路與查看手機不消耗天數。可直接排課並在當天前往；正式通告從現場徵選開始。1× 到 16× 只改變演出速度，成果相同。</p>`,
  );
}
function saves() {
  show(
    "saves",
    `${heading("SAVE A MOMENT · 存讀檔", "留住現在的生活", "自動保存生活，也可以用五個手動位置記住重要時刻。")}<div class="save-list">${[
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
      .join("")}</div>${!storage.available || storage.conflicted || storage.error ? `<p class="storage-warning" role="alert">${escape(storage.error)}</p>` : ""}${storageUI.extras()}`,
  );
}
function storageConflict() {
  if (!world) return;
  if (panelType === "update-confirm") resumeUpdateAfterConflict = true;
  show("storage-conflict", `${heading("SAVE A MOMENT", "另一個分頁已有新進度", "此分頁已暫停，還沒有覆蓋任何新進度。可以先匯出這份旅程，再接續最新存檔。")}
    <div class="buttons"><button data-storage="export">匯出此分頁旅程</button><button class="primary" data-storage-latest>接續最新進度</button></div>`);
  $("save-status").textContent = "此分頁已暫停儲存";
}
function recovery() {
  const backup = storage.readBackup("auto");
  show("recovery", `${heading("SAVE A MOMENT", "先找回你的旅程", "自動存檔無法讀取，已停止覆寫，原始資料與備份都保留著。")}
    <div class="buttons">${backup.state ? '<button class="primary" data-storage-recover>從自動備份復原</button>' : ""}<button data-storage-raw>下載原始存檔</button><button data-ui="saves">選擇手動存檔或匯入</button><button data-storage="new">建立新的旅程</button></div>`);
  $("save-status").textContent = "存檔待復原";
}
function downloadRaw() {
  const raw = storage.raw();
  if (!raw) return;
  const url = URL.createObjectURL(new Blob([raw], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "星途未定-原始存檔.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function replaceState(next, kind = "load") {
  if (appearanceBusy || controller.transitioning)
    throw new Error("請等場景載入完成再讀取");
  if (storage.conflicted) throw new Error(storage.error);
  appearanceBusy = true;
  let previous;
  try {
    await storage.idle();
    if (storage.conflicted) throw new Error(storage.error);
    previous = structuredClone(state);
    lifeUI.takeover();
    leaveOverlay();
    state = next;
    await world.restoreRoom();
    if (!await storage.replace(state, recoveryBlocked ? null : previous, { recover: recoveryBlocked }))
      throw new Error(storage.error || "無法保存載入後的旅程，原本資料已保留");
  } catch (e) {
    if (previous) {
      state = previous;
      try { await world.restoreRoom(); } catch { /* The loading overlay offers retry. */ }
    }
    appearanceBusy = false;
    if (recoveryBlocked) recovery();
    else if (storage.conflicted) storageConflict();
    else saves();
    throw new Error(e.message || "場景載入失敗，原本的旅程已保留，請重試");
  }
  appearanceBusy = false;
  recoveryBlocked = false;
  $("save-status").textContent = "● 已儲存";
  changed();
  if (kind === "new" || !state.flags.intro) welcome();
  else if (state.life.game.pixelPrologueActive) narrate(prologueData(state));
  else if (state.dialogue) renderDialogue();
  else lifeUI.resumeNarrative();
  toast(kind === "new" ? "新的旅程從這裡開始" : "已接續旅程，先前資料保留在備份中");
}
async function restore(slot) {
  const saved = storage.read(slot);
  if (!saved.state) {
    toast(saved.error || "這格還沒有存檔");
    return;
  }
  try {
    await replaceState(saved.state);
  } catch (e) {
    toast(e.message);
  }
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
    `<div class="conversation"><figure class="dialogue-portrait ${player ? "player-crop" : "npc-crop"}"><img src="${player ? portrait() : PEOPLE[d.npcId].portrait}" alt="${escape(name)}的肩上肖像"></figure><div class="speech"><div class="dialogue-heading"><h2 id="dialogue-name">${escape(name)}</h2><span>${player ? "你" : PEOPLE[d.npcId].job}</span></div><p id="dialogue-text">${escape(text)}</p><div class="choices">${node.choices && !d.reply ? node.choices.map((choice, i) => `<button data-choice="${i}">${choice.label}</button>`).join("") : `<button class="primary" data-ui="next-dialogue">${d.reply ? "下次見" : "繼續 →"}</button>`}</div></div><div class="dialogue-tools"><button data-ui="saves" aria-label="保存這段相遇">存檔</button><button data-ui="menu">選單</button><button data-ui="end-dialogue" aria-label="結束對話">×</button></div></div>`;
  setDialogueVisible(true);
  world?.keys.clear();
  $("dialogue").querySelector(".choices button")?.focus();
}
function narrate({
  title,
  text,
  portrait: face,
  portraitKind = "npc",
  art,
  choices,
  context,
  contextNote,
  readerKey,
  onRead,
}) {
  leaveOverlay();
  panelType = "career-dialogue";
  $("toast").classList.remove("visible");
  clearTimeout(toastTimer);
  const fullText = String(text).replace(/<[^>]*>/g, " ");
  const conciseText = narrativeText(fullText, state.life.game);
  let expanded = false;
  let pages = [], index = 0, key;
  function preparePages() {
    const blocks = (expanded ? fullText : conciseText).split(/(?<=[。！？])\s*/).filter(Boolean);
    pages = [];
    for (const part of blocks) {
      if (!pages.length || pages.at(-1).length + part.length > 155) pages.push(part);
      else pages[pages.length - 1] += part;
    }
    if (!pages.length) pages.push("……");
    key = `${readerKey || `${state.life.game.week}-${state.life.day}-${title}`}:${expanded ? "full" : state.life.game.narrativeSettings?.textMode || "full"}`;
    index = state.life.reader?.key === key ? Math.min(pages.length - 1, state.life.reader.index) : 0;
  }
  preparePages();
  function page() {
    state.life.reader = { key, index };
    if (index === pages.length - 1) onRead?.();
    checkpoint();
    $("dialogue").innerHTML =
      `<div class="conversation career-conversation ${face ? "" : "no-portrait"}">${face ? `<figure class="dialogue-portrait ${portraitKind === "player" ? "player-crop" : "npc-crop"}"><img src="${face}" alt="${portraitKind === "player" ? escape(state.playerName) + "的" : ""}肩上肖像"></figure>` : ""}<div class="speech">${context ? `<p class="story-context">${escape(context)}${contextNote ? `<small>${escape(contextNote)}</small>` : ""}</p>` : ""}${art ? `<img class="story-art" src="${art}" alt="故事插畫">` : ""}<div class="dialogue-heading"><h2 id="dialogue-name">${escape(title)}</h2>${pages.length > 1 ? `<small>${index + 1} / ${pages.length}</small>` : ""}</div><p>${escape(pages[index])}</p>${conciseText !== fullText.trim() ? `<button id="career-text-expand" aria-expanded="${expanded}">${expanded ? "回到精簡" : "閱讀完整文本"}</button>` : ""}<div class="choices" data-choice-count="${index < pages.length - 1 ? 1 : choices.length}">${index < pages.length - 1 ? '<button class="primary" id="career-page-next">繼續 →</button>' : choices.map((c) => `<button ${c.attrs}><span class="choice-label">${escape(c.label)}</span>${c.note ? `<small>${escape(c.note)}</small>` : ""}</button>`).join("")}</div></div><div class="dialogue-tools"><button data-ui="saves" aria-label="保存故事進度">存檔</button></div></div>`;
    $("career-text-expand")?.addEventListener("click", () => { expanded = !expanded; preparePages(); page(); });
    $("career-page-next")?.addEventListener("click", () => {
      index++;
      page();
    });
    $("dialogue").querySelector(".choices button")?.focus();
  }
  setDialogueVisible(true);
  world?.keys.clear();
  page();
}
function nextDialogue() {
  const d = state.dialogue;
  if (!d) return;
  if (d.reply) {
    if (!state.knownPeople.includes(d.npcId)) state.knownPeople.push(d.npcId);
    const met = lifeUI.meeting(d.npcId);
    endDialogue();
    toast(met?.met ? "這座城市，多了一個認識的人" : "聊完近況，下次再見");
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
  inspectObject(item);
}
function inspectObject(item) {
  const furnishing = state.sceneId === "home" && homeFurnitureInfo(state.life?.game.homeLife, item.id);
  const definition = furnishing && item.appearance === "blinds" && furnishing.itemId !== "starter_blinds" ? null : APPEARANCES[item.appearance],
    value = appearanceValue(state, state.sceneId, item);
  show(
    "scene-object",
    `${heading("", furnishing?.name || item.name)}<p>${escape(furnishing ? furnishing.keepsakeName ? `牆上展示著「${furnishing.keepsakeName}」。` : `這是你選擇的${furnishing.name}。可以在居家生活更換布置。` : item.response)}</p>${
      definition
        ? `<p class="object-state" role="status">${definition.labels[value]}</p><div class="object-options">${Object.entries(
            definition.choices,
          )
            .map(
              ([id, label]) =>
                `<button data-object-state="${id}" data-scene-object="${item.id}" aria-pressed="${id === value}" ${id === value ? "disabled" : ""}>${label}</button>`,
            )
            .join("")}</div>`
        : ""
    }<div class="buttons">${item.action !== "inspect" ? `<button class="primary" data-object="${item.id}">使用${escape(item.name)}</button>` : ""}<button data-ui="close">繼續逛逛</button></div>`,
  );
}
function interact(item) {
  if (item.action === "inspect") {
    inspectObject(item);
    return;
  }
  if (lifeUI.interact(item)) return;
  switch (item.action) {
    case "career":
      lifeUI.career.hub();
      break;
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
      simple(item.name, cityDetailText(state.sceneId));
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
    paused || appearanceBusy || recoveryBlocked || storage.conflicted || !storage.available ||
    !!world?.storyActors.active ||
    panel.open ||
    !!state.dialogue ||
    panelType === "career-dialogue" ||
    controller.transitioning,
  storyPaused: () =>
    paused || appearanceBusy || recoveryBlocked || storage.conflicted || !storage.available || panel.open || !!state.dialogue || controller.transitioning,
  transitioning: false,
  toast,
  checkpoint,
  changed,
  activityProgress: (value) => {
    $("activity-progress").value = value;
    $("activity-percent").textContent = `${Math.round(value * 100)}%`;
  },
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
    // After startup, the requesting action handles failures and restores state.
    // Do not cover a recoverable outfit/room error with the startup screen.
    if (world) return;
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
    if (id === "home" && state.life.game.cityLife?.pet) toast(state.life.game.cityLife.notice);
  },
  ready: (scene) => {
    world = scene;
    $("loading").hidden = true;
    changed();
    storage.onConflict(storageConflict);
    if (recoveryBlocked) { recovery(); return; }
    if (!storage.available) {
      saves();
      $("save-status").textContent = "無法儲存，請先匯出備份";
      return;
    }
    arriveAt(state.life, state.sceneId);
    if (state.dialogue) renderDialogue();
    else if (!state.flags.intro) welcome();
    else if (state.life.game.pixelPrologueActive) narrate(prologueData(state));
    else lifeUI.resumeNarrative();
    checkpoint();
    if (storage.startupNotice) toast(storage.startupNotice);
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
  openApp: (id) => featureUI.open(id),
  cancelTravel: () => cityUI.cancelRoute(),
  travelTo: (...args) => cityUI.route(...args),
  storyTravelTo: (id, after, onError) =>
    cityUI.route(id, after, true, true, onError),
  agencies: () => cityUI.agencies(),
  narrate,
  state: () => state,
  world: () => world,
  show,
  heading,
  escape,
  checkpoint,
  toast,
  leaveOverlay,
  paused: () =>
    paused || appearanceBusy || recoveryBlocked || storage.conflicted || !storage.available ||
    !!state.life.storyStage ||
    panel.open ||
    !!state.dialogue ||
    panelType === "career-dialogue" ||
    controller.transitioning,
});
const offlineUI = setupPixelOffline({
  heading,
  show,
  settings,
  toast,
  checkpoint,
});
const storageUI = createStorageUI({
  state: () => state,
  storage,
  show,
  heading,
  escape,
  toast,
  checkpoint,
  saves,
  replace: replaceState,
  ending: () => lifeUI.career.ending(),
});
document.addEventListener("change", (event) => storageUI.file(event));
document.addEventListener(
  "pointerdown",
  async () => {
    if (!audioUnlocked) {
      audioUnlocked = true;
      try {
        await enableAudio();
        // Do not replace button text between pointerdown and click: WebKit
        // cancels the first tap when its text node disappears.
        syncRoomAudio();
      } catch {
        audioUnlocked = false;
      }
    }
  },
  { passive: true },
);
document.addEventListener("click", (event) => {
  if (audioUnlocked && event.target.closest("button"))
    playSfx(event.target.closest("button").dataset.previewSfx || "tap");
});
document.addEventListener("input", (event) => {
  if (event.target.dataset.volume) {
    preferences.set(event.target.dataset.volume, Number(event.target.value));
    if (audioUnlocked) syncAudio("room", state.life.game);
  }
});
const featureUI = createFeatureUI({
  state: () => state,
  escape,
  heading,
  show,
  checkpoint,
  changed,
  toast,
  book: (...args) => lifeUI.career.book(...args),
  planWork: (id) => {
    if (!CHOICES[id]) return;
    show(
      "plan-work",
      `${heading("WORK DAYS", `安排${CHOICES[id].label}`)}<div class="career-date-list">${state.life.plan.map((a, i) => `<button data-work-day="${i}" data-work-action="${id}" ${access(state.life, { id }, i) || a.id.startsWith("career_") || (i === state.life.day && state.life.pending) ? "disabled" : ""}><b>星期${"一二三四五六日"[i]}</b><small>${i < state.life.day ? "已完成" : CHOICES[a.id]?.label || "正式約定"}</small></button>`).join("")}</div>`,
    );
  },
  cityRoute: (venue) => {
    const id =
      Object.keys(ROOMS).find((id) => ROOMS[id].venue === venue) || venue;
    if (ROOMS[id]) cityUI.route(id, () => lifeUI.services(id));
    else travel();
  },
  shopRoute: () => cityUI.route("shop", () => lifeUI.shop()),
  native: {
    planner: schedule,
    map: travel,
    save: saves,
    settings,
  },
});
document.addEventListener("input", (event) => {
  if (event.target.dataset.createField) {
    editCreation(state, event.target.dataset.createField, event.target.value);
    checkpoint();
  }
  if (event.target.matches(".pixel-app input, .pixel-app textarea")) featureUI.input(event);
});
document.addEventListener("compositionend", (event) => {
  if (event.target.matches(".pixel-app input, .pixel-app textarea")) featureUI.compositionEnd(event);
});
document.addEventListener("change", (event) => {
  if (event.target.matches(".pixel-app select")) featureUI.input(event);
});
document.addEventListener(
  "error",
  (event) => {
    if (event.target.matches?.(".pixel-app img[data-remove-on-error]"))
      event.target.remove();
  },
  true,
);
document.addEventListener("keydown", (event) => {
  const list = event.target.closest?.(".pixel-app .people-hub-tabs");
  if (!list || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
    return;
  event.preventDefault();
  const tabs = [...list.querySelectorAll('[role="tab"]')],
    index = tabs.indexOf(document.activeElement),
    next =
      event.key === "Home"
        ? tabs[0]
        : event.key === "End"
          ? tabs.at(-1)
          : tabs[
              (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) %
                tabs.length
            ],
    id = next?.dataset.peopleSection;
  next?.click();
  document.querySelector(`[data-people-section="${id}"]`)?.focus();
});
setInterval(() => lifeUI.tick(0.1), 100);
document.addEventListener("click", async (event) => {
  const target = event.target.closest("button");
  if (!target) return;
  if (target.dataset.ui === "reset-view") {
    world?.resetZoom();
    cityUI.handle({ dataset: { mapHome: "" } });
    const restored = await viewportControls.reset();
    toast(restored ? "已回到原比例" : "場景已回到原比例；頁面縮放仍由瀏覽器控制，請從瀏覽器選單調整。");
    return;
  }
  if (!world) return;
  if (target.dataset.ui === "return-home") {
    if (!canReturnHome(state, appearanceBusy || controller.transitioning))
      return;
    cityUI.cancelRoute();
    lifeUI.takeover();
    leaveOverlay();
    await world.returnHome();
    return;
  }
  if (target.dataset.objectState !== undefined) {
    if (controller.transitioning || state.life.storyStage || state.dialogue)
      return;
    const item = ROOMS[state.sceneId].objects.find(
      (o) => o.id === target.dataset.sceneObject,
    );
    if (
      item &&
      setObjectAppearance(state, ROOMS, item.id, target.dataset.objectState)
    ) {
      world.refreshFurniture();
      checkpoint();
      inspectObject(item);
    }
    return;
  }
  if (target.dataset.inspectObject) {
    const item = ROOMS[state.sceneId].objects.find(
      (o) => o.id === target.dataset.inspectObject,
    );
    if (item) inspectObject(item);
    return;
  }
  if (cityUI.handle(target)) return;
  if (appearanceBusy) return;
  if (target.dataset.onboarding || target.dataset.chooseAspiration) {
    if (target.dataset.onboarding === "reroll") {
      rerollCreation(state);
      refreshCreationStats(state, panel);
      $("reroll-status").textContent = "新的能力已擲出！可以再次重擲。";
      checkpoint();
    } else if (
      advanceOpening(state, {
        skip: target.dataset.onboarding === "skip",
        aspiration: target.dataset.chooseAspiration,
      })
    )
      narrate(prologueData(state));
    else {
      leaveOverlay();
      checkpoint();
      changed();
      toast("打開城市地圖，為自己的第一週選一個起點。");
    }
    return;
  }
  if (target.dataset.dismissTutorial) {
    dismissTutorial(state, target.dataset.dismissTutorial);
    target.closest(".pixel-tutorial").remove();
    checkpoint();
    return;
  }
  if (target.dataset.tutorialReset !== undefined) {
    state.life.game.tutorialSeen = [];
    preferences.set("tutorials", true);
    checkpoint();
    help();
    return;
  }
  if (target.dataset.narrativePref) {
    const d = target.dataset, value = ["skipReadRoutine", "storyReminders"].includes(d.narrativePref) ? d.value === "true" : d.value;
    state.life.game.narrativeSettings = normalizeNarrativeSettings({ ...state.life.game.narrativeSettings, [d.narrativePref]: value });
    checkpoint();
    settings();
    return;
  }
  if (target.dataset.pixelPref) {
    const d = target.dataset,
      v = ["audioMuted", "tutorials"].includes(d.pixelPref)
        ? d.value === "true"
        : d.value;
    const p = preferences.set(d.pixelPref, v);
    applyPixelFont(p.fontSize);
    settings();
    if (audioUnlocked) syncAudio("room", state.life.game);
    return;
  }
  if (target.dataset.workDay !== undefined) {
    const day = Number(target.dataset.workDay),
      reason = planDay(state.life, day, { id: target.dataset.workAction });
    checkpoint();
    changed();
    schedule();
    toast(reason || "已排入工作日");
    return;
  }
  if (offlineUI.handle(target)) return;
  if (target.hasAttribute("data-storage-latest")) {
    target.disabled = true;
    if (await storage.refresh()) {
      const latest = storage.read();
      if (latest.error) { recoveryBlocked = true; recovery(); }
      else if (latest.state) {
        try {
          await replaceState(latest.state);
          if (resumeUpdateAfterConflict) { resumeUpdateAfterConflict = false; offlineUI.offerUpdate(); }
        } catch (e) { storage.suspendWrites(); toast(e.message); }
      } else { storage.suspendWrites(); toast("找不到最新存檔，請先匯出此分頁的旅程"); }
    } else { target.disabled = false; toast("暫時無法讀取最新進度，請先匯出備份"); }
    return;
  }
  if (target.hasAttribute("data-storage-recover")) {
    target.disabled = true;
    try { await replaceState(storage.readBackup("auto").state, "recover"); }
    catch (e) { toast(e.message); }
    return;
  }
  if (target.hasAttribute("data-storage-raw")) { downloadRaw(); return; }
  if (await storageUI.handle(target)) return;
  if (featureUI.handle(target)) return;
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
  if (target.dataset.pixelTheme) {
    const value = preferences.setTheme(target.dataset.pixelTheme);
    applyPixelTheme(value.theme);
    settings();
    document
      .querySelector(`button[data-pixel-theme="${value.theme}"]`)
      ?.focus();
    if (!value.saved) toast("配色已套用，但這個瀏覽器暫時無法記住設定。");
    return;
  }
  if (target.dataset.setSpeed) {
    const n = Number(target.dataset.setSpeed);
    if ([1, 2, 4, 8, 16].includes(n)) {
      state.life.speed = n;
      checkpoint();
      changed();
      settings();
      document.querySelector(`[data-set-speed="${n}"]`)?.focus();
    }
    return;
  }
  if (
    target.dataset.createGender &&
    panelType === "welcome" &&
    !state.identity.locked
  ) {
    const avatar = avatarsForGender(target.dataset.createGender)[0];
    if (avatar) await applyAppearance(avatar.id);
    return;
  }
  if (target.dataset.requestGender) {
    const id = target.dataset.requestGender,
      reason = genderChangeReason(state, id);
    if (reason) {
      toast(reason);
      return;
    }
    show(
      "clinic-confirm",
      `${heading("A CHOICE OF YOUR OWN", "確認這次性別變更？")}<div class="clinic-confirm-portrait"><img src="${portraitAsset(id, "newcomer")}" alt="預定外型"><div><b>${state.identity.gender} → ${AVATARS[id].gender}</b><p>${AVATARS[id].name}</p><p>費用 $${GENDER_CHANGE_COST.toLocaleString()}</p><small>既有服裝、作品與關係會保留；穿著會換成新外型已擁有的服裝。</small></div></div><div class="panel-actions"><button data-ui="clinic">再想一想</button><button class="primary" data-confirm-gender="${id}">確認辦理 · $${GENDER_CHANGE_COST.toLocaleString()}</button></div>`,
    );
    return;
  }
  if (target.dataset.confirmGender) {
    await applyAppearance(target.dataset.confirmGender, true);
    return;
  }
  if (target.dataset.avatar && AVATARS[target.dataset.avatar]) {
    if (controller.transitioning) return;
    await applyAppearance(target.dataset.avatar);
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
    appearanceBusy = true;
    const pendingButtons = [...panel.querySelectorAll("button:not(:disabled)")];
    for (const button of pendingButtons) button.disabled = true;
    panel.setAttribute("aria-busy", "true");
    const previousChanged = state.flags.changed;
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
      state.flags.changed = previousChanged;
      appearanceBusy = false;
      toast("服裝載入失敗，請再試一次");
      return;
    } finally {
      for (const button of pendingButtons) button.disabled = false;
      panel.removeAttribute("aria-busy");
    }
    appearanceBusy = false;
    checkpoint();
    changed();
    panelType === "shop" ? lifeUI.shop() : wardrobe();
    toast("已換上這套衣服");
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
      target.disabled = true;
      const ok = await checkpoint(slot);
      saves();
      toast(ok ? `已儲存到位置 ${slot}` : storage.error || "儲存失敗，請匯出目前旅程");
    }
    return;
  }
  if (target.dataset.confirmSave) {
    target.disabled = true;
    const ok = await checkpoint(target.dataset.confirmSave);
    saves();
    toast(ok ? "已更新手動存檔" : storage.error || "儲存失敗，請匯出目前旅程");
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
      finishCreation(state);
      lockIdentity(state);
      narrate(prologueData(state));
      checkpoint();
      break;
    case "help":
      help();
      break;
    case "saves":
      saves();
      break;
    case "clinic":
      clinic();
      break;
    case "profile":
      profile();
      break;
    case "home-life":
      lifeUI.home();
      break;
    case "city-life":
      lifeUI.city();
      break;
    case "name":
      state.life.game.realName =
        $("real-name-input").value.trim().slice(0, 16) || "星途新人";
      state.life.game.stageName = $("name-input").value.trim().slice(0, 16);
      state.playerName = state.life.game.stageName || state.life.game.realName;
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
    case "release-notes":
      releaseNotes();
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
    case "career":
      lifeUI.career.hub();
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
function stageExit() {
  if (appearanceBusy || recoveryBlocked || !world) return;
  state.position = { x: world.player.x, y: world.player.y };
  storage.stageExit(state);
}
window.addEventListener("pagehide", stageExit);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    if (audioUnlocked) suspendAudio();
    world?.keys.clear();
    stageExit();
    checkpoint();
  } else if (audioUnlocked) resumeAudio();
});
setInterval(() => {
  if (world && !document.hidden) checkpoint();
}, 10000);
// Read-only diagnostic surface, shared by browser smoke tests and support.
window.__pixelRead = () =>
  world
    ? { ...world.snapshot(), state: structuredClone(state), panel: panelType }
    : null;
$("pixel-version-label").textContent = `STARLIGHT DAYS · v${PIXEL_VERSION}`;
createWorld(controller);

$("dialogue").addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    event.preventDefault();
    if (state.life.storyStage) {
      menu();
      return;
    }
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
