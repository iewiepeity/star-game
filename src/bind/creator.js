import { state } from "../core/state.js";
import { render } from "../render.js";
import { scheduleActivity } from "../logic/scheduled-activities.js";
import { CREATOR_FORMATS, CREATOR_TOPICS, CREATOR_INVESTMENTS } from "../data/creator-content.js";
import { creatorUnlocked } from "../logic/creator.js";

export function bindCreator() {
  document.querySelectorAll("[data-creator-format]").forEach((button) => button.onclick = () => { state.creatorFormat = button.dataset.creatorFormat; render(); });
  document.querySelectorAll("[data-creator-topic]").forEach((button) => button.onclick = () => { state.creatorTopic = button.dataset.creatorTopic; render(); });
  document.querySelectorAll("[data-creator-investment]").forEach((button) => button.onclick = () => { state.creatorInvestment = button.dataset.creatorInvestment; render(); });
  document.querySelector("[data-creator-schedule]")?.addEventListener("click", () => {
    if (!creatorUnlocked()) return;
    const format = CREATOR_FORMATS[state.creatorFormat], topic = CREATOR_TOPICS[state.creatorTopic], investment = CREATOR_INVESTMENTS[state.creatorInvestment];
    if (state.money < investment.cost) { state.creatorNotice = "目前資金不足以選擇這個製作規格。"; render(); return; }
    const result = scheduleActivity("creator_content", { format: state.creatorFormat, topic: state.creatorTopic, investment: state.creatorInvestment }, `${format.label}：${topic.label}`, { cost: investment.cost, fatigue: investment.fatigue, stamina: investment.fatigue });
    state.creatorNotice = result.message;
    render();
  });
}
