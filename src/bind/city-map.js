import { state } from "../core/state.js";
import { CITY_LANDMARKS } from "../data/city-map.js";
import { MAP_LOCATIONS } from "../data/map-locations.js";
import { cityPreview, cityPlaceLocked } from "../views/city-map.js";
import { render, renderUi } from "../render.js";
import { decisionFor } from "../logic/runner.js";
import { replacePlannerDay } from "../logic/planner-edit.js";
import { setUndo } from "../core/undo.js";
import { restoreStateFields } from "../core/state-transaction.js";
import { openApp } from "../core/app-navigation.js";
import { esc } from "../core/utils.js";
export function bindCityMap() {
  const root = document.querySelector("[data-city-atlas]");
  if (!root) return;
  const viewport = root.querySelector("[data-city-viewport]"),
    world = root.querySelector("[data-city-world]"),
    panel = root.querySelector("[data-city-preview]"),
    search = root.querySelector("[data-city-search]"),
    results = root.querySelector("[data-city-search-results]"),
    runner = root.dataset.runner === "true";
  const painting = world.querySelector("img"),
    loading = root.querySelector("[data-city-loading]");
  function ready() {
    loading.hidden = true;
    world.inert = false;
  }
  if (painting.complete && painting.naturalWidth) ready();
  else {
    world.inert = true;
    painting.addEventListener("load", ready, { once: true });
    painting.addEventListener(
      "error",
      () => {
        loading.textContent = "城市圖片暫時無法載入，請重新整理。";
      },
      { once: true },
    );
  }
  const hover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  let pinned = false,
    current = null,
    hideTimer,
    drag = null,
    suppressClick = false;
  const camera = state.cityCamera || {};
  const initialSelection = runner
    ? state.freeLocations[state.runnerDay]
    : state.citySelection;

  let zoom = Math.max(
    1,
    Math.min(
      4,
      camera.zoom ?? (hover ? 1 : 960 / (viewport.clientWidth || 960)),
    ),
  );
  let measured = viewport.clientWidth > 0;
  let base = 1;
  function measure() {
    if (!viewport.clientWidth || !viewport.clientHeight) return;
    const firstVisible = !measured;
    if (!measured) {
      if (camera.zoom == null && !hover)
        zoom = Math.min(4, Math.max(1, 960 / viewport.clientWidth));
      measured = true;
    }
    base = Math.min(viewport.clientWidth, viewport.clientHeight * 1.5);
    world.style.width = `${base * zoom}px`;
    if (firstVisible && initialSelection) center(initialSelection);
  }
  function keepCamera() {
    state.cityCamera = {
      zoom,
      left: viewport.scrollLeft,
      top: viewport.scrollTop,
    };
  }
  function center(id) {
    const p = CITY_LANDMARKS[id];
    if (!p) return;
    viewport.scrollLeft =
      world.offsetLeft +
      (world.offsetWidth * p.x) / 100 -
      viewport.clientWidth / 2;
    viewport.scrollTop =
      world.offsetTop +
      (world.offsetHeight * p.y) / 100 -
      viewport.clientHeight / 2;
    keepCamera();
  }
  function close() {
    clearTimeout(hideTimer);
    pinned = false;
    current = null;
    panel.hidden = true;
    root.querySelectorAll("[data-city-place]").forEach((b) => {
      b.classList.remove("is-inspected");
      b.setAttribute("aria-expanded", "false");
    });
  }
  function scheduleHide() {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      if (!pinned) close();
    }, 180);
  }
  function show(id, sticky = false) {
    clearTimeout(hideTimer);
    if (pinned && !sticky) return;
    if (!CITY_LANDMARKS[id]) return;
    current = id;
    pinned = sticky;
    if (sticky) state.citySelection = id;
    panel.innerHTML = cityPreview(id, { runner, pinned });
    panel.hidden = false;
    panel.dataset.side = CITY_LANDMARKS[id].x > 65 ? "left" : "right";
    panel.dataset.edge = CITY_LANDMARKS[id].y > 58 ? "top" : "bottom";
    panel.classList.toggle("is-pinned", pinned);
    root.querySelectorAll("[data-city-place]").forEach((b) => {
      b.classList.toggle("is-inspected", b.dataset.cityPlace === id);
      b.setAttribute("aria-expanded", String(b.dataset.cityPlace === id));
    });
  }
  function changeZoom(value) {
    const x =
        (viewport.scrollLeft + viewport.clientWidth / 2 - world.offsetLeft) /
        world.offsetWidth,
      y =
        (viewport.scrollTop + viewport.clientHeight / 2 - world.offsetTop) /
        world.offsetHeight;
    zoom = Math.max(1, Math.min(4, value));
    measure();
    viewport.scrollLeft =
      world.offsetLeft + x * world.offsetWidth - viewport.clientWidth / 2;
    viewport.scrollTop =
      world.offsetTop + y * world.offsetHeight - viewport.clientHeight / 2;
    keepCamera();
  }
  measure();
  viewport.scrollLeft = camera.left || 0;
  viewport.scrollTop = camera.top || 0;
  if (initialSelection && CITY_LANDMARKS[initialSelection]) {
    center(initialSelection);
    show(initialSelection, true);
  }
  viewport.addEventListener("scroll", keepCamera, { passive: true });
  root.querySelectorAll("[data-city-place]").forEach((button) => {
    const id = button.dataset.cityPlace;
    button.addEventListener("pointerenter", (e) => {
      if (hover && e.pointerType !== "touch") show(id);
    });
    button.addEventListener("pointerleave", () => {
      if (!pinned) scheduleHide();
    });
    button.addEventListener("focus", () => {
      if (!pinned && button.matches(":focus-visible")) {
        show(id);
        button.scrollIntoView({ block: "nearest", inline: "nearest" });
      }
    });
    button.addEventListener("blur", () => {
      if (!pinned) scheduleHide();
    });
  });
  panel.addEventListener("pointerenter", () => clearTimeout(hideTimer));
  panel.addEventListener("pointerleave", () => {
    if (!pinned) scheduleHide();
  });
  root.addEventListener("click", (event) => {
    if (suppressClick) {
      event.preventDefault();
      event.stopPropagation();
      suppressClick = false;
      return;
    }
    const button = event.target.closest("button");
    if (!button) {
      if (event.target.closest("[data-city-world]")) close();
      return;
    }
    if (button.dataset.cityPlace) {
      show(button.dataset.cityPlace, true);
      return;
    }
    if (button.hasAttribute("data-city-dismiss")) {
      state.citySelection = null;
      close();
      return;
    }
    if (button.hasAttribute("data-city-zoom")) {
      close();
      changeZoom(zoom + (button.dataset.cityZoom === "in" ? 0.5 : -0.5));
      return;
    }
    if (button.hasAttribute("data-city-overview")) {
      close();
      zoom = 1;
      measure();
      viewport.scrollTo(0, 0);
      keepCamera();
      return;
    }
    if (button.dataset.citySearchResult) {
      const id = button.dataset.citySearchResult;
      results.hidden = true;
      search.value = "";
      if (!hover && zoom < 2) changeZoom(Math.min(4, 960 / base));
      center(id);
      show(id, true);
      return;
    }
    if (button.hasAttribute("data-city-wardrobe")) {
      openApp(state, "wardrobe", {
        returnContext: { app: "map", label: "城市地圖" },
      });
      renderUi();
      return;
    }
    const id = button.dataset.cityConfirm;
    if (!id || cityPlaceLocked(id)) return;
    if (runner) {
      if (
        state.runnerPhase !== "decision" ||
        state.schedule[state.runnerDay] !== "free"
      )
        return;
      state.freeLocations[state.runnerDay] = id;
      state.runnerDecision = decisionFor("free");
      state.runnerCityMapOpen = false;
      render();
      return;
    }
    const day = state.selectedDay,
      result = replacePlannerDay(day, "free", { locationId: id });
    state.plannerReplacement = result.confirmationRequired
      ? result.request
      : null;
    state.notice = result.message;
    if (result.ok) {
      setUndo(state.notice, () => restoreStateFields(state, result.snapshot));
      state.recentLocations = [
        id,
        ...(state.recentLocations || []).filter((x) => x !== id),
      ].slice(0, 6);
      state.selectedDay = Math.min(day + 1, 6);
    }
    openApp(state, "planner");
    render();
  });
  root.addEventListener("change", (event) => {
    if (event.target.matches("[data-city-day]")) {
      const day = Number(event.target.value);
      if (Number.isInteger(day) && day >= 0 && day < 7) state.selectedDay = day;
      if (current) show(current, pinned);
    }
  });
  root.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Escape" && !panel.hidden) {
        event.preventDefault();
        event.stopPropagation();
        state.citySelection = null;
        close();
      }
    },
    { capture: true },
  );
  search.addEventListener("input", () => {
    const query = search.value.trim();
    results.hidden = !query;
    results.innerHTML = query
      ? Object.entries(MAP_LOCATIONS)
          .filter(([, p]) => (p.name + p.category + p.area).includes(query))
          .map(
            ([id, p]) =>
              `<button data-city-search-result="${id}">${esc(p.name)}</button>`,
          )
          .join("") || "<span>找不到這個地點</span>"
      : "";
  });
  viewport.addEventListener("pointerdown", (event) => {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    drag = {
      x: event.clientX,
      y: event.clientY,
      left: viewport.scrollLeft,
      top: viewport.scrollTop,
      id: event.pointerId,
      moved: false,
    };
  });
  viewport.addEventListener("pointermove", (event) => {
    if (!drag) return;
    const dx = event.clientX - drag.x,
      dy = event.clientY - drag.y;
    if (Math.abs(dx) + Math.abs(dy) > 6) {
      if (!drag.moved) {
        viewport.setPointerCapture(drag.id);
        close();
      }
      drag.moved = true;
      viewport.scrollLeft = drag.left - dx;
      viewport.scrollTop = drag.top - dy;
    }
  });
  const endDrag = () => {
    if (drag?.moved) {
      suppressClick = true;
      if (viewport.hasPointerCapture(drag.id))
        viewport.releasePointerCapture(drag.id);
    }
    drag = null;
  };
  viewport.addEventListener("pointerup", endDrag);
  viewport.addEventListener("pointercancel", () => {
    drag = null;
  });
  // Re-measure only this live map; no resize observers leak between render cycles.
  const observer = new window.ResizeObserver(() => {
    if (!root.isConnected) {
      observer.disconnect();
      return;
    }
    measure();
  });
  observer.observe(viewport);
  root.addEventListener("focusout", () => {
    if (!current) panel.hidden = true;
  });
}
