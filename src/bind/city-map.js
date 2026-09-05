import { state } from "../core/state.js";
import { MAP_LOCATIONS } from "../data/map-locations.js";
import { CITY_DISTRICTS } from "../data/city-map.js";
import { renderUi } from "../render.js";
export function bindCityMap() {
  document.querySelectorAll("[data-city-district]").forEach(
    (button) =>
      (button.onclick = () => {
        const id = button.dataset.cityDistrict;
        if (id !== "all" && !CITY_DISTRICTS[id]) return;
        state.cityDistrict = id;
        renderUi();
      }),
  );
  document.querySelectorAll("[data-city-place]").forEach(
    (button) =>
      (button.onclick = () => {
        const id = button.dataset.cityPlace;
        if (!MAP_LOCATIONS[id]) return;
        state.citySelection = id;
        renderUi();
      }),
  );
  document
    .querySelector("[data-city-day]")
    ?.addEventListener("change", (event) => {
      const day = Number(event.target.value);
      if (Number.isInteger(day) && day >= 0 && day < 7) {
        state.selectedDay = day;
        renderUi();
      }
    });
}
