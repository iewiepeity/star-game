import { normalizeTrainingProgress } from "../core/training-narrative-state.js";

export const TRAINING_TECHNIQUES = Object.freeze({
  acting: {
    categories: ["電影", "電視劇"],
    label: "用即興接住現場變化",
    text: "你把練習過的即興方法帶進試鏡，接住對手臨時改變的節奏。",
  },
  vocal: {
    categories: ["歌曲"],
    label: "用呼吸控制保留情緒",
    text: "你把突破時找到的呼吸位置帶進演唱，讓情緒留在穩定的聲音裡。",
  },
  speech: {
    categories: ["綜藝"],
    label: "用救場節奏接回話題",
    text: "你運用練熟的接話節奏，讓現場短暫的空白成為自然轉場。",
  },
  dance: {
    categories: ["綜藝", "廣告"],
    label: "用身體節奏完成變化",
    text: "你用熟悉的身體控制完成臨時變拍，沒有讓動作蓋過表現。",
  },
  creation: {
    categories: ["綜藝", "廣告"],
    label: "換個角度呈現企劃",
    text: "你把創意課上練出的拆題方法，變成現場看得懂的新呈現。",
  },
  songwriting: {
    categories: ["歌曲"],
    label: "以詞曲結構安排演唱",
    text: "你先讀懂詞曲的轉折，再讓演唱層次跟著段落推進。",
  },
  script: {
    categories: ["電影", "電視劇"],
    label: "從人物動機重讀台詞",
    text: "你運用編劇課累積的方法，讓台詞背後的動機進入表演。",
  },
  image: {
    categories: ["廣告"],
    label: "以鏡頭儀態傳達品牌",
    text: "你把儀態練習轉成有目的的停頓與視線，讓產品訊息更清楚。",
  },
  networking: {
    categories: ["綜藝"],
    label: "觀察來賓再調整接話",
    text: "你讀出對話中的界線，調整提問方式，讓來賓願意繼續說。",
  },
});
export function techniqueChoices(job, game) {
  const progress = normalizeTrainingProgress(game.trainingNarrativeProgress);
  return Object.entries(TRAINING_TECHNIQUES)
    .filter(
      ([id, technique]) =>
        progress[id]?.unlocked && technique.categories.includes(job.category),
    )
    .map(([id, technique]) => ({
      id: `technique:${id}`,
      label: technique.label,
      text: technique.text,
      note: "突破技巧・提高試鏡基礎成功率，仍受狀態影響，並非保證錄取",
    }));
}
