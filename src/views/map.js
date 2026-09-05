import { cityMap } from "./city-map.js";
export function mapApp() {
  return `<div class="map-page illustrated-map-page">${cityMap()}</div>`;
}
