import { bindCityMap } from "./city-map.js";
import { state } from "../core/state.js";
import { replacePlannerDay } from "../logic/planner-edit.js";
import { setUndo } from "../core/undo.js";
import { restoreStateFields } from "../core/state-transaction.js";

import { render } from "../render.js";
import { openApp } from "../core/app-navigation.js";
export function bindMap() {
  bindCityMap();
  document.querySelectorAll("[data-map-purpose]").forEach(
    (x) =>
      (x.onclick = () => {
        state.mapPurpose = x.dataset.mapPurpose;
        render();
      }),
  );
  document.querySelectorAll("[data-map-favorite]").forEach(
    (x) =>
      (x.onclick = () => {
        state.favoriteLocations ??= [];
        const id = x.dataset.mapFavorite,
          index = state.favoriteLocations.indexOf(id);
        if (index >= 0) state.favoriteLocations.splice(index, 1);
        else state.favoriteLocations.unshift(id);
        render();
      }),
  );
  document.querySelectorAll("[data-map-filter]").forEach(
    (x) =>
      (x.onclick = () => {
        state.mapFilter = x.dataset.mapFilter;
        render();
      }),
  );
  document.querySelectorAll("[data-map-location]").forEach(
    (x) =>
      (x.onclick = () => {
        const day = state.selectedDay,
          locationId = x.dataset.mapLocation;
        const result = replacePlannerDay(day, "free", { locationId });
        state.plannerReplacement = result.confirmationRequired
          ? result.request
          : null;
        state.notice = result.message;
        if (result.ok) {
          setUndo(state.notice, () =>
            restoreStateFields(state, result.snapshot),
          );
          state.recentLocations = [
            locationId,
            ...(state.recentLocations || []).filter((id) => id !== locationId),
          ].slice(0, 6);
          state.selectedDay = Math.min(day + 1, 6);
        }
        openApp(state, "planner");
        render();
      }),
  );
}
