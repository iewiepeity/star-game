import { ROOMS, outfits, PEOPLE, CONVERSATIONS, itinerary } from "./data.js";
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
const portrait = () => outfits.find((o) => o.id === state.outfitId).portrait;
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
  if (!$("player-head").src.endsWith(outfit.portrait.replace("./", "")))
    $("player-head").src = outfit.portrait;
  const goals = objectives(state),
    done = goals.filter((g) => g.done).length;
  $("goal-count").textContent = `${done} / ${goals.length}`;
  $("goal-label").textContent =
    goals.find((g) => !g.done)?.label || "今天的小事，都好好完成了";
  const actorIds = world
    ? [...world.actors.keys()].filter((id) => id !== "player")
    : [];
  const signature = `${state.sceneId}|${actorIds.join(",")}`;
  if ($("nearby").dataset.signature !== signature) {
    $("nearby").dataset.signature = signature;
    $("nearby").innerHTML =
      room.objects
        .filter((o) => o.id !== "door")
        .map(
          (o) =>
            `<button data-object="${o.id}"><span aria-hidden="true">${o.icon}</span>${o.name}</button>`,
        )
        .join("") +
      actorIds
        .map(
          (id) =>
            `<button class="npc-button" data-npc="${id}"><img src="${PEOPLE[id].portrait}" alt="">${PEOPLE[id].name}</button>`,
        )
        .join("");
  }
}
function show(type, html) {
  panelType = type;
  $("panel-content").innerHTML = html;
  if (!panel.open) {
    previousFocus = document.activeElement;
    panel.showModal();
  }
  panel.scrollTop = 0;
  world?.keys.clear();
}
function close() {
  if (panelType === "welcome") state.flags.intro = true;
  panel.close();
  panelType = "";
  world?.releaseNpc();
  // Closing dialogue ends this encounter; explicit save/load keeps its current line.
  state.dialogue = null;
  checkpoint();
  changed();
  previousFocus?.focus?.();
}
function heading(kicker, title, description = "") {
  return `<span class="eyebrow">${kicker}</span><h2 id="panel-title">${title}</h2>${description ? `<p class="lede">${description}</p>` : ""}`;
}
function welcome() {
  show(
    "welcome",
    `${heading("CHAPTER 01 · 來到星望市", "先讓生活走起來", "行李才剛放下，新的生活就從房間裡開始。")}<div class="help-lines"><div><b>換件衣服</b><span>點衣櫃，選今天想穿的樣子。</span></div><div><b>走出家門</b><span>到排練室試試身手，或去咖啡館坐坐。</span></div><div><b>認識城市</b><span>點畫面上的人物，走近後和她聊聊。</span></div></div><div class="buttons"><button class="primary" data-ui="begin">開始我的一天 →</button></div><p class="tiny-note">第一階段像素體驗 · 三個場景、三套服裝、兩位 NPC。使用獨立進度。</p>`,
  );
}
function travel() {
  show(
    "travel",
    `${heading("CITY WALK · 星望市", "今天想去哪裡？", "選好目的地，角色會先走到門口再出發。")}<div class="route-cards">${Object.entries(
      ROOMS,
    )
      .map(
        ([id, room]) =>
          `<button class="route-card" data-room="${id}" ${id === state.sceneId ? "disabled" : ""}><img src="assets/pixel/${id}.png" alt="${room.name}的像素場景"><strong>${room.name}</strong><small>${id === state.sceneId ? "現在的位置" : state.visited.includes(id) ? "再去走走" : "第一次探索 →"}</small></button>`,
      )
      .join("")}</div>`,
  );
}
function wardrobe() {
  show(
    "wardrobe",
    `${heading("MY WARDROBE · 衣櫃", "換上今天的心情", "挑一套衣服，場景裡的你也會一起換裝。")}<div class="wardrobe-grid">${outfits.map((o) => `<button class="outfit-card" data-outfit="${o.id}" aria-pressed="${o.id === state.outfitId}"><img src="${o.portrait}" alt="${o.name}的原版立繪"><strong>${o.name}</strong><small>${o.id === state.outfitId ? "穿著中 ✓" : "換上這套"}</small></button>`).join("")}</div><div class="buttons"><button class="primary" data-ui="close">穿好了，出發</button></div>`,
  );
}
function profile() {
  show(
    "profile",
    `${heading("THIS IS ME · 玩家資訊", "我的小小起點")}<div class="player-profile"><img src="${portrait()}" alt="目前穿著的原版立繪"><div><label>角色名字<input id="name-input" maxlength="16" value="${escape(state.playerName)}" autocomplete="off"></label><p>${escape(outfits.find((o) => o.id === state.outfitId).name)}<br><span class="tiny-note">夜櫻系 · 未簽約新人</span></p><button class="primary" data-ui="name">儲存名字</button><p class="tiny-note">${state.visited.length} 個足跡 · ${state.knownPeople.length} 位新朋友</p></div></div>`,
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
    `${heading("HOW TO PLAY · 操作", "慢慢逛，也可以很順手")}<div class="help-lines"><div><b>走動</b><span>點空地自動走過去；電腦也可用方向鍵或 WASD。</span></div><div><b>互動</b><span>點場景的小標記、NPC，或下方物件按鈕。角色會先走近。</span></div><div><b>看場景</b><span>拖曳畫面平移；＋／− 縮放，◎ 找回主角。</span></div><div><b>閱讀</b><span>開啟視窗會暫停世界；也可用 Ⅱ 隨時暫停。</span></div><div><b>進度</b><span>自動存檔，另外提供五格手動存讀檔。</span></div></div><p class="tiny-note">像素版第一階段：先完成走動、場景、人物、換裝與存檔。訓練數值、工作、每週行程與戀愛養成會在後續階段接入。</p>`,
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
function restore(slot) {
  const saved = storage.read(slot);
  if (!saved.state) {
    toast(saved.error || "這格還沒有存檔");
    return;
  }
  state = saved.state;
  panel.close();
  panelType = "";
  world.events.emit("room-clear");
  world.loadRoom();
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
      reply:
        id === "sufei"
          ? "又見面了。今天有比上次多一點把握嗎？練累了就停一下，明天還能繼續。"
          : "又碰到你了。今天在城市裡找到什麼喜歡的地方？我還有一點時間，可以聽你說。",
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
  show(
    "dialogue",
    `${heading("ENCOUNTER · 城市偶遇", escape(name))}<div class="conversation"><figure><img src="${player ? portrait() : PEOPLE[d.npcId].portrait}" alt="${escape(name)}的插畫立繪"></figure><div class="speech"><span class="speaker">${player ? "剛到星望市的你" : PEOPLE[d.npcId].job}</span><p>${escape(text)}</p><div class="choices">${node.choices && !d.reply ? node.choices.map((choice, i) => `<button data-choice="${i}">${choice.label} →</button>`).join("") : `<button class="primary" data-ui="next-dialogue">${d.reply ? "下次見" : "繼續 →"}</button>`}</div><p class="tiny-note">世界暫停中 · 好好說完這段話</p><button data-ui="saves">保存這段相遇</button></div></div>`,
  );
}
function nextDialogue() {
  const d = state.dialogue;
  if (!d) return;
  if (d.reply) {
    if (!state.knownPeople.includes(d.npcId)) state.knownPeople.push(d.npcId);
    close();
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
function interact(item) {
  switch (item.action) {
    case "wardrobe":
      wardrobe();
      break;
    case "travel":
      travel();
      break;
    case "desk":
      show(
        "desk",
        `${heading("MY DESK · 書桌", "留一點時間給自己", "新城市的生活，慢慢記進手帳裡。")}<div class="buttons"><button data-ui="journal">✎ 打開生活手帳</button><button data-ui="phone">▯ 看看手機</button></div>`,
      );
      break;
    case "practice":
      state.flags.practiced = true;
      world.player.facing = 3;
      simple(
        "第一次站到鏡子前",
        '你調整呼吸，把一句台詞慢慢說完整。第一次不必完美，願意再練一次就有意義。<br><span class="tiny-note">已記下今天的練習。養成數值會在下一階段接入。</span>',
        "收好這份小小的勇氣",
      );
      break;
    case "notice":
      state.flags.notice = true;
      simple(
        "先了解，再開始",
        "你記下排練室的開放時段，和初學者課程的報名方式。這裡會是你往後練習表演的地方。",
      );
      break;
    case "script":
      simple(
        "一份攤開的劇本",
        "頁角寫著：「她不是不想說話，是還沒找到能相信的人。」你試著從角色的處境，重新理解這句台詞。",
      );
      break;
    case "rest":
      state.flags.rested = true;
      simple(
        "允許自己慢一點",
        "你放下行李，在床邊坐了一會兒。房間很小，卻是這座城市裡第一個真正屬於你的角落。",
      );
      break;
    case "coffee":
      state.flags.coffee = true;
      simple(
        "熱飲的溫度",
        "你捧著一杯熱飲，看著窗外的人來人往。今天還有很多不知道的事，但此刻不用急著找到答案。",
      );
      break;
    case "window":
      simple(
        "窗外的星望市",
        "街口有人正趕往工作，有人停下來等朋友。你忽然覺得，自己也開始成為這座城市的一部分。",
      );
      break;
  }
  checkpoint();
  changed();
}
const controller = {
  state: () => state,
  paused: () => paused || panel.open || controller.transitioning,
  transitioning: false,
  toast,
  checkpoint,
  changed,
  interact,
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
    if (!state.visited.includes(id)) state.visited.push(id);
  },
  ready: (scene) => {
    world = scene;
    $("loading").hidden = true;
    changed();
    if (loaded.error) toast("舊的像素測試存檔無法讀取，已開啟新的體驗");
    if (state.dialogue) renderDialogue();
    else if (!state.flags.intro) welcome();
    checkpoint();
  },
};
document.addEventListener("click", (event) => {
  const target = event.target.closest("button");
  if (!target || !world) return;
  if (target.dataset.object) {
    world.interact(target.dataset.object);
    return;
  }
  if (target.dataset.npc) {
    world.talk(target.dataset.npc);
    return;
  }
  if (target.dataset.room) {
    const id = target.dataset.room;
    close();
    if (paused) {
      paused = false;
      $("pause").textContent = "Ⅱ";
      $("pause").setAttribute("aria-pressed", "false");
    }
    world.transition(id);
    return;
  }
  if (target.dataset.outfit) {
    state.outfitId = target.dataset.outfit;
    state.flags.changed = true;
    world.setOutfit(state.outfitId);
    checkpoint();
    changed();
    wardrobe();
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
      checkpoint();
      changed();
      close();
      break;
    case "journal":
      journal();
      break;
    case "phone":
      show(
        "phone",
        `${heading("MY PHONE · 手機", "新的城市，新的日常")}<ul class="checklist">${state.knownPeople.length ? state.knownPeople.map((id) => `<li>${PEOPLE[id].name}<br><small>${itinerary(id, state.elapsed).status}</small></li>`).join("") : "<li>通訊錄還是空白。試著去城市裡認識一個人吧。</li>"}</ul><p class="tiny-note">這裡先記下已認識的人，社群與訊息會在後續階段接入。</p>`,
      );
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
      $("pause").textContent = paused ? "▷" : "Ⅱ";
      $("pause").setAttribute("aria-pressed", String(paused));
      $("pause").setAttribute("aria-label", paused ? "繼續世界" : "暫停世界");
      toast(paused ? "世界暫停了，慢慢想下一步" : "繼續今天的生活");
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
