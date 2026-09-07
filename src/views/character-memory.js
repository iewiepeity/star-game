import { state } from "../core/state.js";
import { esc } from "../core/utils.js";
import { MEMORY_TOPICS, characterMemory } from "../logic/character-memory.js";

export function characterMemoryPanel(npcId, game = state) {
  if (!game.knownPeople?.includes(npcId)) return "";
  const memory = characterMemory(npcId, game), blocked = game.endingResult || (game.relationships?.[npcId]?.hostility || 0) >= 45;
  const promise = memory.promises.find(item => item.key === "work-check-in");
  const status = promise?.status === "pending" ? "下週以後有空再聊；沒有截止日" : promise?.status === "fulfilled" ? `第 ${promise.week} 週，你回來聽了後續` : promise?.status === "released" ? "你們已說好先放下" : "還沒有這項約定";
  return `<section class="npc-shared-memories character-memory"><header><span>THINGS WE REMEMBER</span><h3>讓對方更懂你</h3></header><p>把喜好和界線親口告訴對方，也可以隨時重新說明。</p>${MEMORY_TOPICS.map(topic => {
    const current = memory[topic.kind === "preference" ? "preferences" : "boundaries"][topic.key];
    return `<article><b>${esc(topic.label)}</b><div class="npc-actions">${topic.choices.map(([value, label]) => `<button data-character-memory="${npcId}" data-memory-key="${topic.key}" data-memory-value="${value}" aria-pressed="${current === value}" ${blocked ? "disabled" : ""}>${esc(label)}</button>`).join("")}</div></article>`;
  }).join("")}<article><b>再聽一次工作近況</b><p>${esc(status)}</p><button data-character-promise="${npcId}" data-promise-action="${promise?.status === "pending" ? "release" : "promise"}" ${blocked ? "disabled" : ""}>${promise?.status === "pending" ? "告訴對方：這陣子先放著" : "約好下週以後再聊"}</button></article>${memory.history.length ? `<details><summary>對方記得的話與回應（${memory.history.length}）</summary>${memory.history.slice(-12).reverse().map(item => `<article><small>第 ${item.week} 週・${esc(item.source || "相處紀錄")}</small><b>${esc(item.label || item.key)}</b><p>${esc(item.text || item.value)}</p></article>`).join("")}</details>` : ""}</section>`;
}
