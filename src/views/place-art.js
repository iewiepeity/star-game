import { CITY_ART, CITY_LANDMARKS } from "../data/city-map.js";
import { MAP_LOCATIONS } from "../data/map-locations.js";
export function placeArt(id, className = "") {
  const point = CITY_LANDMARKS[id] || CITY_LANDMARKS.park;
  return `<span class="place-art ${className}" role="img" aria-label="${MAP_LOCATIONS[id]?.name || "星望市"}" style="background-image:url('${CITY_ART}');--art-x:${point.x}%;--art-y:${point.y}%"></span>`;
}
