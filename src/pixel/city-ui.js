import {
  CITY_PLACES,
  CITY_CATALOG,
  AGENCY_ROOMS,
  hiddenRoomOpen,
  publicRoom,
} from "./city-catalog.js";
import { ROOMS } from "./data.js";
import { CHOICES } from "./life.js";
import { AGENCIES } from "../data/agencies.js";
export function createCityUI(api) {
  let zoom = 1,
    selectedId = null,
    travelTimer = null,
    scheduledArrival = null,
    storyTrip = false,
    scheduledFailure = null,
    mapObserver = null;
  const s = () => api.state();
  function cancelRoute() {
    clearTimeout(travelTimer);
    travelTimer = null;
    scheduledArrival = null;
    storyTrip = false;
    scheduledFailure = null;
  }
  function details(id) {
    if (!ROOMS[id]) return;
    const place = CITY_PLACES.find((p) => p.id === publicRoom(id));
    const current = s().sceneId === id,
      name = place?.id === id ? place.name : ROOMS[id].name;
    const services = Object.values(CHOICES)
      .filter((d) => d.room === id && ["訓練", "工作"].includes(d.group))
      .map((d) => d.label);
    document
      .querySelectorAll("[data-map-place], [data-map-list]")
      .forEach((b) =>
        b.classList.toggle("map-preview", (b.dataset.mapPlace || b.dataset.mapList) === publicRoom(id)),
      );
    const el = document.getElementById("map-detail");
    if (!el) return;
    el.dataset.place = id;
    el.innerHTML = `<div><small>${place?.district || "星望市"} · ${current ? "你在這裡" : s().visited.includes(id) ? "曾經到訪" : "還沒去過"}</small><h3>${name}</h3><p>${services.length ? services.join("・") : place?.description || "走進這個地方，看看身邊的人與物。"}</p></div><button class="primary" data-map-enter="${id}" ${current ? "disabled" : ""}>${current ? "目前位置" : "前往這裡 →"}</button>`;
  }
  function overview() {
    const el = document.getElementById("map-detail");
    if (!el) return;
    delete el.dataset.place;
    document.querySelectorAll(".map-preview").forEach(b => b.classList.remove("map-preview"));
    el.innerHTML = `<div><small>我的城市足跡</small><h3>${CITY_PLACES.filter(p => s().visited.includes(p.id)).length} / ${CITY_PLACES.length} 個地點</h3><p>滑鼠移到建築上看介紹，也能從下方名錄選擇目的地。</p></div><button data-ui="close">回到${ROOMS[s().sceneId].name}</button>`;
  }
  function show(preselect = null) {
    selectedId = preselect;
    mapObserver?.disconnect();
    cancelRoute();
    api.show(
      "travel",
      `<header class="map-heading">${api.heading("STARWISH CITY", "星望市", "點建築選擇目的地，走訪不消耗天數。")}</header><div class="map-tools"><label><span class="sr-only">尋找地點</span><input id="map-search" type="search" placeholder="找地點、課程或公司…" autocomplete="off"></label><button data-map-zoom="out" aria-label="縮小地圖">−</button><button data-map-zoom="in" aria-label="放大地圖">＋</button><button data-map-home>全市</button></div><div class="city-map-viewport" tabindex="0" aria-label="星望市地圖，可捲動"><div class="city-map-canvas" style="--map-zoom:${zoom}"><img class="city-map-art" src="assets/pixel/city/map-organic.webp" alt="星望市：影視、音樂、傳媒、文化、生活與海灣街區"><nav class="city-map-landmarks" aria-label="城市地點">${CITY_PLACES.map((p) => `<button class="map-landmark ${publicRoom(s().sceneId) === p.id ? "current" : ""}" style="--x:${p.x}%;--y:${p.y}%" data-map-place="${p.id}" aria-label="${p.name}" aria-pressed="false"><span>${p.short}</span>${publicRoom(s().sceneId) === p.id ? '<i aria-hidden="true">▼</i>' : ""}</button>`).join("")}</nav></div></div><div id="map-detail" class="map-detail" aria-live="polite"><div><small>我的城市足跡</small><h3>${CITY_PLACES.filter((p) => s().visited.includes(p.id)).length} / 27</h3><p>移到建築上看看，或點一下選擇。手機可以放大、滑動地圖。</p></div><button data-ui="close">回到${ROOMS[s().sceneId].name}</button></div>`,
    );
    const tip = document.querySelector("#panel-content > .pixel-tutorial");
    if (tip) {
      const help = document.createElement("details");
      help.className = "map-help";
      help.innerHTML = "<summary>第一次逛城市？</summary>";
      help.append(tip);
      document.querySelector(".map-heading").append(help);
    }
    const detail = document.getElementById("map-detail");
    const sidebar = document.createElement("aside");
    sidebar.className = "city-map-sidebar";
    sidebar.setAttribute("aria-label", "地點資訊與名錄");
    detail.replaceWith(sidebar);
    sidebar.append(detail);
    const directory = document.createElement("nav");
    directory.className = "city-place-directory";
    directory.setAttribute("aria-label", "城市地點名錄");
    directory.innerHTML = `<header><b>地點名錄</b><small>點文字也能選擇</small></header><div class="city-place-list">${CITY_PLACES.map((p, i) => `<button class="city-place-row" data-map-list="${p.id}" aria-pressed="${preselect === p.id}"><i aria-hidden="true">${String(i + 1).padStart(2, "0")}</i><span><strong>${p.name}</strong><small>${p.district}${publicRoom(s().sceneId) === p.id ? " · 目前位置" : ""}</small></span><b aria-hidden="true">›</b></button>`).join("")}</div><p class="map-no-results" hidden>沒有找到這個地點，換個名字試試。</p>`;
    sidebar.append(directory);
    overview();
    const input = document.getElementById("map-search");
    const viewport = document.querySelector(".city-map-viewport");
    const canvas = document.querySelector(".city-map-canvas");
    const fit = () =>
      canvas.style.setProperty(
        "--map-base-width",
        Math.min(viewport.clientWidth, viewport.clientHeight * 1.5) + "px",
      );
    mapObserver = new window.ResizeObserver(fit);
    mapObserver.observe(viewport);
    fit();
    input.addEventListener("input", () => {
      const q = input.value.trim().toLowerCase();
      let matches = 0;
      for (const b of document.querySelectorAll("[data-map-place], [data-map-list]")) {
        const p = CITY_PLACES.find((p) => p.id === (b.dataset.mapPlace || b.dataset.mapList));
        const words = [
          p.name,
          p.short,
          p.district,
          ...(p.id === "business" ? ["經紀公司", ...Object.values(AGENCIES).map(a => a.name)] : []),
          ...Object.values(CHOICES)
            .filter((c) => c.room === p.id)
            .map((c) => c.label),
        ].join(" ");
        b.classList.toggle(
          "search-match",
          !!q && words.toLowerCase().includes(q),
        );
        b.classList.toggle(
          "search-muted",
          !!q && !words.toLowerCase().includes(q),
        );
        if (b.dataset.mapList) {
          b.hidden = !!q && !words.toLowerCase().includes(q);
          if (!b.hidden) matches++;
        }
      }
      directory.querySelector(".map-no-results").hidden = matches > 0;
    });
    for (const b of document.querySelectorAll("[data-map-place], [data-map-list]")) {
      const id = b.dataset.mapPlace || b.dataset.mapList;
      b.addEventListener("pointerenter", (e) => {
        if (e.pointerType === "mouse" && !storyTrip && !scheduledArrival) details(id);
      });
      b.addEventListener("pointerleave", (e) => {
        if (e.pointerType === "mouse" && !storyTrip && !scheduledArrival) {
          if (selectedId) details(selectedId);
          else overview();
        }
      });
      b.addEventListener("focus", () => {
        if (!storyTrip && !scheduledArrival) details(id);
      });
    }
    if (preselect) {
      document.querySelectorAll("[data-map-place], [data-map-list]").forEach(b =>
        b.setAttribute("aria-pressed", String((b.dataset.mapPlace || b.dataset.mapList) === publicRoom(preselect))));
      details(preselect);
    }
  }
  function enter(id, after, story = false, onError = null) {
    cancelRoute();
    if (!ROOMS[id] || (id === "editing_room" && !hiddenRoomOpen(s()) && !story))
      return;
    if (!after) {
      api.takeover();
      api.world().cancelActivity();
      api.world().stopRoute();
    }
    api.leaveOverlay();
    if (s().sceneId === id) after?.();
    else api.world().transition(id, after, onError);
  }
  function route(id, after, automatic = false, story = false, onError = null) {
    if (!automatic) {
      api.takeover();
      api.world().cancelActivity();
      api.world().stopRoute();
    }
    if (s().sceneId === id) {
      api.leaveOverlay();
      after?.();
      return;
    }
    // Every trip is shown on the city map. Scheduled routines use this same gate.
    show(id);
    scheduledArrival = after;
    storyTrip = story;
    scheduledFailure = onError;
    if (automatic)
      travelTimer = setTimeout(
        () => {
          if (document.hidden) {
            travelTimer = null;
            return;
          }
          const callback = scheduledArrival;
          enter(id, callback, story, onError);
        },
        Math.max(300, 1100 / s().life.speed),
      );
  }
  function agencies() {
    if (s().sceneId !== "business") {
      api.takeover();
      api.world().cancelActivity();
      api.world().stopRoute();
      route("business", agencies, true);
      return;
    }
    api.show(
      "agencies",
      `${api.heading("STAR RING", "星環商務中心・公司名錄", "搭電梯到各公司的公開接待區。正式簽約仍需要履歷、面談與錄取。")}<div class="command-list">${AGENCY_ROOMS.map((id, i) => `<button class="command-row" data-interior="${id}"><span><small>${i + 2} F</small><strong>${CITY_CATALOG[id].name}</strong><small>${Object.values(AGENCIES).find((a) => a.id === id.replace("agency_", ""))?.style || CITY_CATALOG[id].note}</small></span><b>→</b></button>`).join("")}</div><div class="panel-actions"><button data-ui="close">留在大廳</button></div>`,
    );
  }
  function interior(id) {
    if (
      (AGENCY_ROOMS.includes(id) && s().sceneId === "business") ||
      (id === "business" && AGENCY_ROOMS.includes(s().sceneId)) ||
      (id === "editing_room" &&
        s().sceneId === "gallery" &&
        hiddenRoomOpen(s()))
    )
      enter(id);
  }
  function handle(b) {
    const d = b.dataset;
    if (d.mapPlace || d.mapList) {
      // A story trip must retain its arrival callback and agreed destination.
      // Clicking a landmark while the short route preview is visible must not
      // silently turn it into an unrelated free-roam trip.
      if (storyTrip) {
        details(selectedId);
        return true;
      }
      cancelRoute();
      selectedId = d.mapPlace || d.mapList;
      document.querySelectorAll("[data-map-place], [data-map-list]").forEach(button => button.setAttribute("aria-pressed", String((button.dataset.mapPlace || button.dataset.mapList) === selectedId)));
      details(selectedId);
      return true;
    }
    if (d.mapEnter) {
      const cb = scheduledArrival;
      enter(d.mapEnter, cb, storyTrip, scheduledFailure);
      return true;
    }
    if (d.mapZoom || d.mapHome !== undefined) {
      zoom =
        d.mapHome !== undefined
          ? 1
          : Math.max(
              1,
              Math.min(2.5, zoom + (d.mapZoom === "in" ? 0.5 : -0.5)),
            );
      document
        .querySelector(".city-map-canvas")
        ?.style.setProperty("--map-zoom", zoom);
      return true;
    }
    if (d.interior) {
      interior(d.interior);
      return true;
    }
    return false;
  }
  return { show, route, handle, agencies, interior, cancelRoute };
}
