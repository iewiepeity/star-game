// Geographic groupings are presentation only; every pin retains the real location ID.
export const CITY_DISTRICTS = {
  studio: {
    name: "影視與劇場",
    x: 20,
    y: 23,
    places: ["film_company", "studio", "rehearsal", "theatre"],
  },
  music: {
    name: "音樂街區",
    x: 51,
    y: 20,
    places: ["record_company", "recording", "livehouse"],
  },
  media: {
    name: "傳媒與商務",
    x: 81,
    y: 27,
    places: ["tv_company", "radio", "business", "media_company"],
  },
  culture: {
    name: "舊城與學院",
    x: 19,
    y: 66,
    places: ["library", "cafe", "cinema", "gallery", "market", "temple"],
  },
  life: {
    name: "生活與訓練",
    x: 51,
    y: 59,
    places: ["dance", "gym", "shop", "beauty", "clinic", "restaurant"],
  },
  coast: {
    name: "河岸與海灣",
    x: 81,
    y: 76,
    places: ["park", "beach", "airport"],
  },
};
export const districtFor = (id) =>
  Object.keys(CITY_DISTRICTS).find((key) =>
    CITY_DISTRICTS[key].places.includes(id),
  );

export const CITY_ART = "./assets/city/starwish-city-soft.jpg";
// Centers and hit areas measured against the final 1536 × 1024 illustration.
export const CITY_LANDMARKS = {
  film_company: { x: 14, y: 17, w: 12, h: 18 },
  studio: { x: 32, y: 16, w: 15, h: 15 },
  record_company: { x: 49, y: 14, w: 11, h: 18 },
  recording: { x: 60, y: 17, w: 10, h: 12 },
  tv_company: { x: 73, y: 12, w: 13, h: 20 },
  rehearsal: { x: 11, y: 32, w: 12, h: 14 },
  theatre: { x: 25, y: 30, w: 13, h: 13 },
  livehouse: { x: 43, y: 32, w: 13, h: 14 },
  dance: { x: 58, y: 30, w: 12, h: 14 },
  media_company: { x: 72, y: 26, w: 13, h: 14 },
  radio: { x: 90, y: 30, w: 9, h: 18 },
  cinema: { x: 12, y: 47, w: 14, h: 16 },
  gallery: { x: 30, y: 45, w: 15, h: 15 },
  library: { x: 47, y: 49, w: 12, h: 15 },
  cafe: { x: 56, y: 54, w: 6, h: 8 },
  business: { x: 71, y: 45, w: 14, h: 22 },
  airport: { x: 91, y: 49, w: 13, h: 19 },
  gym: { x: 11, y: 67, w: 13, h: 14 },
  temple: { x: 30, y: 64, w: 14, h: 16 },
  market: { x: 45, y: 69, w: 17, h: 15 },
  shop: { x: 60, y: 68, w: 14, h: 22 },
  park: { x: 79, y: 75, w: 14, h: 18 },
  clinic: { x: 14, y: 86, w: 13, h: 18 },
  beauty: { x: 30, y: 86, w: 12, h: 17 },
  restaurant: { x: 58, y: 87, w: 16, h: 18 },
  beach: { x: 88, y: 90, w: 16, h: 16 },
};
