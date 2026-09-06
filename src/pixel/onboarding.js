import { ABILITIES } from "../data/abilities.js";
import { randomInt } from "../core/rng.js";
import { withCore } from "./core-bridge.js";
import { normalizeBirthday } from "../core/birthday.js";
import { SCENES } from "../views/prologue.js";
import { ASPIRATIONS } from "../logic/city-progression.js";
import { portraitAsset } from "../data/wardrobe.js";
export function refreshCreationStats(state, root) {
  for (const value of root.querySelectorAll("[data-creation-stat]"))
    value.textContent = state.life.game.stats[value.dataset.creationStat];
}
export function creationFields(state, esc) {
  const g = state.life.game;
  return `<div class="creation-fields"><label>本名<input data-create-field="realName" maxlength="16" value="${esc(g.realName || state.playerName)}" autocomplete="name"></label><label>藝名（選填）<input data-create-field="stageName" maxlength="16" value="${esc(g.stageName)}" autocomplete="nickname"></label><label>生日月份<input data-create-field="birthMonth" type="number" min="1" max="12" value="${g.birthMonth}"></label><label>生日日期<input data-create-field="birthDay" type="number" min="1" max="31" value="${g.birthDay}"></label></div><details class="creation-stats"><summary>我的初始能力 · 可以重新擲骰</summary><div class="ability-grid">${Object.entries(
    g.stats,
  )
    .map(
      ([name, v]) =>
        `<div><small>${name}</small><b data-creation-stat="${esc(name)}">${v}</b></div>`,
    )
    .join(
      "",
    )}</div><div class="reroll-bar"><button data-onboarding="reroll">⚄ 重新擲骰</button><span role="status" id="reroll-status">找到喜歡的起點，就出發吧。</span></div><p class="tiny-note">21 項能力各為 0～150；隱藏特質會在故事中逐漸表現。</p></details>`;
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
    title: i === 5 ? "你的第一個夢想" : scene.title,
    portrait: portraitAsset(state.avatarId, state.outfitId),
    portraitKind: "player",
    context: `${state.playerName} · 來到星望市`,
    contextNote: `序章 ${i + 1} / 6`,
    text:
      i === 4
        ? "地圖上的教室、演出場所和零工據點擠在一起，沒有哪個圖示寫著「由此爆紅」。走進教室就能查看課程；公司則要準備履歷、投遞與面談。你先把路線記下來。今晚的第一項成果，是明天不至於迷路。"
        : i === 5
          ? "先選一件明天願意起床去做的事：演好一句台詞、唱穩一個音、把話接住，或寫下自己的故事。這個方向不會鎖定職涯。把便條貼好，就從地圖出發。"
          : scene.text,
    choices:
      i === 5
        ? Object.entries(ASPIRATIONS).map(([id, a]) => ({
            label: a.label,
            attrs: `data-choose-aspiration="${id}"`,
            note: {
              acting: "從台詞與角色開始",
              vocal: "讓聲音成為第一束光",
              speech: "練習串起每個人的故事",
              creation: "把靈感寫成自己的作品",
            }[id],
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
