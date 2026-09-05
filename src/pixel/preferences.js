export const PIXEL_PREFERENCES_KEY = "star-game-pixel-preferences-v1";
export const THEMES = [
  {
    id: "cream",
    name: "奶油晨光",
    note: "米白紙張 · 乾燥玫瑰",
    colors: ["#fbf6ed", "#e7d9c3", "#91616d"],
  },
  {
    id: "rose",
    name: "櫻花手帳",
    note: "花瓣粉 · 莓果紅",
    colors: ["#fff3f4", "#eed3dd", "#98536c"],
  },
  {
    id: "sage",
    name: "鼠尾草庭院",
    note: "霧白綠 · 森林綠",
    colors: ["#f3f6ee", "#d7e3d0", "#526e56"],
  },
  {
    id: "lilac",
    name: "紫藤微光",
    note: "柔霧紫 · 灰紫色",
    colors: ["#f7f3fc", "#ded7ee", "#766091"],
  },
  {
    id: "night",
    name: "午夜星河",
    note: "低亮度 · 星藍紫",
    colors: ["#262a37", "#3c4358", "#d9b9e3"],
  },
];
export function normalizePixelPreferences(raw) {
  return {
    theme: THEMES.some((t) => t.id === raw?.theme) ? raw.theme : "cream",
  };
}
export function pixelPreferences(storage) {
  let value;
  try {
    value = normalizePixelPreferences(
      JSON.parse(storage.getItem(PIXEL_PREFERENCES_KEY)),
    );
  } catch {
    value = normalizePixelPreferences();
  }
  return {
    get: () => ({ ...value }),
    setTheme(id) {
      value = normalizePixelPreferences({ theme: id });
      try {
        storage.setItem(PIXEL_PREFERENCES_KEY, JSON.stringify(value));
      } catch {
        return { ...value, saved: false };
      }
      return { ...value, saved: true };
    },
  };
}
export function applyPixelTheme(theme) {
  document.documentElement.dataset.pixelTheme = normalizePixelPreferences({
    theme,
  }).theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute(
      "content",
      THEMES.find((t) => t.id === theme)?.colors[0] || THEMES[0].colors[0],
    );
}
