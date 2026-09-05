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
