import { ABILITIES } from "../data/abilities.js";
import { randomInt } from "../core/rng.js";
import { withCore } from "./core-bridge.js";
import { normalizeBirthday } from "../core/birthday.js";
import { SCENES } from "../views/prologue.js";
import { ASPIRATIONS } from "../logic/city-progression.js";
export function creationFields(state, esc) {
  const g = state.life.game;
  return `<div class="creation-fields"><label>本名<input data-create-field="realName" maxlength="16" value="${esc(g.realName || state.playerName)}" autocomplete="name"></label><label>藝名（選填）<input data-create-field="stageName" maxlength="16" value="${esc(g.stageName)}" autocomplete="nickname"></label><label>生日月份<input data-create-field="birthMonth" type="number" min="1" max="12" value="${g.birthMonth}"></label><label>生日日期<input data-create-field="birthDay" type="number" min="1" max="31" value="${g.birthDay}"></label></div><details class="creation-stats"><summary>我的初始能力 · 可以重新擲骰</summary><div class="ability-grid">${Object.entries(
    g.stats,
  )
    .map(([name, v]) => `<div><small>${name}</small><b>${v}</b></div>`)
    .join(
      "",
    )}</div><button data-onboarding="reroll">↻ 重新擲骰</button><p class="tiny-note">21 項能力各為 0～150；隱藏特質會在故事中逐漸表現。</p></details>`;
}
export function editCreation(state, field, value) {
  if (
    state.identity.locked ||
    !["realName", "stageName", "birthMonth", "birthDay"].includes(field)
  )
    return;
  state.life.game[field] = field.startsWith("birth")
    ? Number(value)
    : String(value).slice(0, 16);
}
export function finishCreation(state) {
  const g = state.life.game;
  if (!g.realName?.trim()) g.realName = state.playerName;
  const b = normalizeBirthday(g.birthMonth, g.birthDay);
  g.birthMonth = b.month;
  g.birthDay = b.day;
  g.realName = g.realName.trim();
  g.stageName = g.stageName.trim();
  g.name = g.stageName || g.realName;
  state.playerName = g.name;
  g.pixelPrologueActive = true;
  g.prologueStep = 0;
  g.prologueCompleted = false;
}
export function rerollCreation(state) {
  if (state.identity.locked) return;
  withCore(state.life, (g) => {
    g.stats = Object.fromEntries(ABILITIES.map((n) => [n, randomInt(0, 150)]));
  });
}
export function prologueData(state) {
  const g = state.life.game,
    i = Math.max(0, Math.min(5, g.prologueStep || 0)),
    scene = SCENES[i];
  return {
    title: scene.title,
    text:
      i === 4
        ? "城市地圖列出了教室、產業據點和新人零工。走進教室就能上課，到服飾店就能購物；如果想簽經紀公司，仍得準備履歷、投遞與面談。沒有任何公司已經在等你簽約。"
        : scene.text,
    choices:
      i === 5
        ? Object.entries(ASPIRATIONS).map(([id, a]) => ({
            label: a.label,
            attrs: `data-choose-aspiration="${id}"`,
            note: "只是第一個方向，之後仍可自由發展",
          }))
        : [
            { label: scene.action, attrs: 'data-onboarding="next"' },
            { label: "跳過序章", attrs: 'data-onboarding="skip"' },
          ],
  };
}
export function advanceOpening(
  state,
  { skip = false, aspiration = null } = {},
) {
  const g = state.life.game;
  if (!g.pixelPrologueActive) return false;
  if (aspiration && ASPIRATIONS[aspiration]) g.aspiration = aspiration;
  if (skip || g.prologueStep >= 5) {
    g.pixelPrologueActive = false;
    g.prologueCompleted = true;
    g.screen = "game";
    return false;
  }
  g.prologueStep++;
  return true;
}
