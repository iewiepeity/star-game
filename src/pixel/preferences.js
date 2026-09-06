export const PIXEL_PREFERENCES_KEY = "star-game-pixel-preferences-v1";
export const THEMES = [
  {
    id: "cream",
    name: "奶油晨光",
    note: "奶油底 · 玫瑰與晴空藍",
    colors: ["#fbf6ed", "#e7d9c3", "#91616d"],
  },
  {
    id: "rose",
    name: "櫻花手帳",
    note: "櫻花粉 · 薄荷與奶油黃",
    colors: ["#fff3f4", "#eed3dd", "#98536c"],
  },
  {
    id: "sage",
    name: "鼠尾草庭院",
    note: "森林綠 · 杏桃與蜂蜜黃",
    colors: ["#f3f6ee", "#d7e3d0", "#526e56"],
  },
  {
    id: "lilac",
    name: "紫藤微光",
    note: "紫藤色 · 晴空與薄荷綠",
    colors: ["#f7f3fc", "#ded7ee", "#766091"],
  },
  {
    id: "night",
    name: "午夜星河",
    note: "星藍紫 · 琥珀與月光綠",
    colors: ["#262a37", "#3c4358", "#d9b9e3"],
  },
];
export function normalizePixelPreferences(raw) {
  return {
    fontSize: ["standard", "comfortable", "large"].includes(raw?.fontSize)
      ? raw.fontSize
      : "standard",
    musicVolume: Math.max(
      0,
      Math.min(
        1,
        Number.isFinite(Number(raw?.musicVolume))
          ? Number(raw.musicVolume)
          : 0.28,
      ),
    ),
    sfxVolume: Math.max(
      0,
      Math.min(
        1,
        Number.isFinite(Number(raw?.sfxVolume)) ? Number(raw.sfxVolume) : 0.42,
      ),
    ),
    audioMuted: raw?.audioMuted === true,
    tutorials: raw?.tutorials !== false,
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
  function set(key, next) {
    value = normalizePixelPreferences({ ...value, [key]: next });
    try {
      storage.setItem(PIXEL_PREFERENCES_KEY, JSON.stringify(value));
      return { ...value, saved: true };
    } catch {
      return { ...value, saved: false };
    }
  }
  return {
    set,
    get: () => ({ ...value }),
    setTheme(id) {
      return set("theme", id);
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

export function applyPixelFont(size) {
  document.documentElement.dataset.pixelFont = size;
  document.documentElement.style.setProperty(
    "--reading-scale",
    { standard: 1, comfortable: 1.1, large: 1.2 }[size] || 1,
  );
}
