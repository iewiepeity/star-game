import { personalStoryPanel, personalStoryReminder } from "./personal-stories.js";
import { npcInvitationPanel } from "./npc-invitation.js";
import { characterMemoryPanel } from "./character-memory.js";
import { NPCS } from "../data/npcs.js";
import { NPC_INTERACTIONS } from "../data/npc-network.js";
import { state } from "../core/state.js";
import { esc, money } from "../core/utils.js";
import {
  hostilitySignal,
  npcFirstMeeting,
  npcStoryStatus,
  relationshipStance,
} from "../logic/npc-engine.js";
import { npcCareerSnapshot, npcNetworkFor } from "../logic/npc-ecosystem.js";
import {
  affectionSignal,
  romanceProgress,
  ensureRomanceFields,
  romanceEligibility,
  romanceRoute,
  romanceStageLabel,
  trustSignal,
} from "../logic/romance-engine.js";

const row = (label, value) =>
  `<div><dt>${label}</dt><dd>${esc(value)}</dd></div>`;
const section = (title, items, open = false) =>
  `<details class="npc-info-section" data-disclosure-key="npc-section:${esc(title)}" ${open ? "open" : ""}><summary>${title}<span>展開</span></summary><dl>${items.map(([label, value]) => row(label, value)).join("")}</dl></details>`;
const trendLabel = (t) =>
  ({ up: "上升中", stable: "穩定", down: "低潮" })[t] || "穩定";
const romanceRank = (id) =>
  [
    "none",
    "interested",
    "ambiguous",
    "dating",
    "committed",
    "engaged",
    "married",
  ].indexOf(id);
const friendshipRank = (id) =>
  ["acquaintance", "familiar", "friend", "confidant", "bonded"].indexOf(id);
const visibilityLabel = (value) =>
  ({
    private: "尚未形成正式關係",
    underground: "地下戀情",
    public: "公開戀情",
  })[value] || "尚未公開";

function interactionButtons(current, story, rel) {
  return (
    `<button data-chat-open="${current}">開啟對話 · 不占一天</button><button data-romance-talk="${current}">聊聊我們的關係</button><p>每人每週短聯絡 2 次，合計 5 次；下列正式邀約占一天。</p>` +
    Object.entries(NPC_INTERACTIONS)
      .map(([id, d]) => {
        const conflict = rel.hostility || 0;
        if (id === "reconcile" && conflict < 20) return "";
        const friendshipOk =
            !d.minStage ||
            friendshipRank(story.stage.id) >= friendshipRank(d.minStage),
          romanceOk =
            !d.minRomance ||
            romanceRank(rel.romance) >= romanceRank(d.minRomance),
          hostilityOk =
            id === "reconcile"
              ? conflict >= 20
              : conflict < 70 &&
                !(
                  conflict >= 45 &&
                  ["collaborate", "personal", "date"].includes(id)
                ),
          disabled = !friendshipOk || !romanceOk || !hostilityOk,
          title = !hostilityOk
            ? id === "reconcile"
              ? "目前沒有需要和解的衝突"
              : "必須先處理彼此之間的裂痕"
            : !friendshipOk
              ? "彼此還不夠熟悉"
              : !romanceOk
                ? "正式交往後才會開放"
                : "",
          reasonId = `npc-action-reason-${current}-${id}`;
        return `<span class="npc-action-option"><button class="${id === "reconcile" ? "reconcile" : ""}" data-npc-interact="${id}" data-npc-id="${current}" ${disabled ? `disabled aria-describedby="${reasonId}"` : ""}>${esc(d.label)}${d.cost ? `・${money(d.cost)}` : ""}</button>${disabled ? `<small id="${reasonId}">${esc(title)}</small>` : ""}</span>`;
      })
      .join("")
  );
}

function romanceActions(current, rel) {
  if (!["dating", "committed", "engaged", "married"].includes(rel.romance))
    return "";
  return `<div class="romance-actions"><span>關係選擇</span>${rel.visibility !== "public" ? `<button data-romance-action="public" data-npc-id="${current}">公開戀情</button>` : ""}${rel.visibility !== "underground" && rel.romance !== "married" ? `<button data-romance-action="underground" data-npc-id="${current}">轉為地下戀</button>` : ""}<button class="danger" data-romance-action="breakup" data-npc-id="${current}">提出分手</button></div>`;
}

function routeHint(current, rel) {
  if ((rel.hostility || 0) >= 70)
    return "對方目前拒絕私下往來；若想修復關係，必須先正視造成交惡的原因。";
  if ((rel.hostility || 0) >= 20)
    return "彼此仍有尚未處理的芥蒂，繼續累積好感無法取代真正的和解。";
  const route = romanceRoute(current);
  if (!route || route.tier === "disabled")
    return "你們以工作與朋友的身分往來。";
  if (rel.romance === "broken")
    return "你們已經分手。接下來如何相處，需要重新確認彼此的界線。";
  if (rel.romance === "rejected")
    return "這次心意沒有被接受，先尊重對方的回答。";
  if (["dating", "committed", "engaged", "married"].includes(rel.romance))
    return "你們已確認彼此的心意，可以一起決定如何安排相處與公開關係。";
  if (rel.romance === "ambiguous")
    return "你們比朋友更靠近了一些，還沒有正式約定這段關係。";
  if (rel.romance === "interested")
    return "你開始在意對方，也在相處中留心彼此的回應。";
  if (route.tier === "hidden")
    return "你們已交換聯絡方式，還有許多事情可以慢慢認識。";
  const eligibility = romanceEligibility(current);
  if (!eligibility.ok) return eligibility.reason;
  return "從聊近況與一起相處，慢慢認識對方。";
}

// The author bible is not a dossier. Only public facts and experienced records
// belong here; trust alone is not evidence that a private fact was disclosed.
function publicIntroduction(npc) {
  return npc.special
    ? "銀灰長髮、灰藍眼眸，說話時帶著若有似無的笑意。"
    : npc.profile.publicImage;
}
function observedNetwork(id, edges) {
  return edges.flatMap((edge) => {
    if (!state.knownPeople.includes(edge.other)) return [];
    const other = NPCS[edge.other],
      names = [NPCS[id].name, other.name];
    const news = (state.industryNews || []).find(
      (item) =>
        String(item.key || "").startsWith("npc-rel:") &&
        names.every((name) =>
          `${item.title || ""} ${item.body || ""}`.includes(name),
        ),
    );
    if (news)
      return [
        { name: other.name, label: "圈內消息", text: news.body || news.title },
      ];
    const pairs = [`${id}:${edge.other}`, `${edge.other}:${id}`];
    const event = [...(state.eventHistory || [])]
      .reverse()
      .find((item) =>
        pairs.some((pair) =>
          String(item.id || "").startsWith(`ensemble:${pair}:`),
        ),
      );
    if (event)
      return [{ name: other.name, label: "共同經歷", text: event.title }];
    const work = [...(state.completedWorks || [])]
      .reverse()
      .find(
        (item) =>
          item.npcCast?.includes(id) && item.npcCast.includes(edge.other),
      );
    return work
      ? [
          {
            name: other.name,
            label: "共同合作",
            text: `你們一起參與過《${work.title}》。`,
          },
        ]
      : [];
  });
}

function sharedMemoryPanel(id) {
  const items = (state.sharedMemories || [])
    .filter((item) => item.npcId === id)
    .slice(-8)
    .reverse();
  if (!items.length) return "";
  return `<section class="npc-shared-memories"><header><span>SHARED MEMORIES</span><h3>你們共同記得的事</h3></header>${items.map((item) => `<article><small>第 ${item.type === "first_meeting" ? state.relationships[id]?.firstMet?.week || state.relationships[id]?.metWeek || item.week : item.week} 週・相處紀錄</small><b>${esc(item.title)}</b><p>${esc(item.text)}</p></article>`).join("")}</section>`;
}

export function npcApp() {
  const ids = state.knownPeople.filter((id) => NPCS[id]);
  if (!ids.length)
    return `<div class="tablet-empty"><span>◈</span><h3>還沒有認識任何人</h3><p>安排自由活動或參加工作，認識的人會記在這裡。</p><button data-go-free>去安排自由活動</button></div>`;
  const current = ids.includes(state.selectedNpc) ? state.selectedNpc : ids[0],
    npc = NPCS[current],
    p = npc.profile,
    rel = ensureRomanceFields(current),
    story = npcStoryStatus(current),
    career = npcCareerSnapshot(current),
    network = observedNetwork(current, npcNetworkFor(current)),
    meeting = npcFirstMeeting(current),
    familiar = state.familiarNpcs.includes(current),
    artView = state.npcArtView === "full" ? "full" : "bust",
    art =
      artView === "full" ? npc.portrait || npc.bust : npc.bust || npc.portrait;
  const tabs = {
    overview: "人物速覽",
    relationship: "關係與邀約",
    memories: "共同回憶",
    about: "背景資料",
  };
  const tab = Object.hasOwn(tabs, state.npcProfileTab)
    ? state.npcProfileTab
    : "overview";
  const relationship = `<section class="relationship-panel ${rel.hostility >= 45 ? "conflict" : ""}"><header><span>RELATIONSHIP</span><h3>${esc(story.stage.label)}・${esc(romanceStageLabel(rel.romance))}</h3><small>${esc(visibilityLabel(rel.visibility))}</small></header><div class="relationship-signals"><article><span>相處感覺</span><b>${esc(affectionSignal(current))}</b></article><article><span>信任觀察</span><b>${esc(trustSignal(current))}</b></article><article><span>衝突跡象</span><b>${esc(hostilitySignal(current))}</b></article></div><p class="relationship-hint">${esc(romanceProgress(current))}</p></section>`;
  const meetingCard = `<article class="npc-first-meeting npc-memory-card"><small>FIRST ENCOUNTER・第 ${meeting.week} 週</small><h3>初次相遇・${esc(meeting.title)}</h3><p>${esc(meeting.text)}</p><small>${esc(meeting.source)}</small></article>`;
  const careerCard = `<article class="npc-career-card"><small>職涯近況・${esc(npc.special ? npc.job : career.field)}</small><h3>${trendLabel(career.trend)}</h3><p>近期作品 ${career.works}・獎項 ${career.awards}</p><small>擅長領域：${career.specialties.map(esc).join("、") || "跨領域"}</small></article>`;
  const content = {
    overview:
      relationship + personalStoryReminder(current) +
      `<div class="npc-overview-cards">${careerCard}<article class="npc-memory-card"><small>初次相遇・第 ${meeting.week} 週</small><p>${esc(meeting.title)}</p><button data-npc-profile-tab="memories">翻翻共同回憶 →</button></article></div>`,
    relationship: `<section class="npc-relationship-actions"><h3>把關係放進生活裡</h3><p>${esc(routeHint(current, rel))}</p>${npcInvitationPanel(current)}<div class="npc-actions">${interactionButtons(current, story, rel)}</div>${romanceActions(current, rel)}</section>`,
    memories:
      meetingCard +
      personalStoryPanel(current) +
      characterMemoryPanel(current) +
      sharedMemoryPanel(current) +
      (story.events.length
        ? `<p>你們留下了 ${story.events.length} 次關係變化的紀錄。</p>`
        : ""),
    about:
      section(
        "基本資料",
        [
          ["性別", npc.gender],
          ["生日", npc.birthday],
          ["血型", npc.bloodType],
          ["身高", npc.height],
          ["職業", npc.job],
          ["出沒地點", npc.location],
        ],
        true,
      ) +
      section(
        "工作資料",
        [
          ["職業", npc.job],
          ["擅長", p.strengths],
        ],
        true,
      ) +
      `<section class="npc-network"><h3>你知道的關係網</h3>${network.length ? network.map((item) => `<article><span>${esc(item.label)}</span><b>${esc(item.name)}</b><small>${esc(item.text)}</small></article>`).join("") : "<p>目前還沒有一起參與的工作或聽說的圈內近況。</p>"}</section>`,
  };
  return `<div class="npc-dossier"><nav class="npc-list" aria-label="人物名單">${ids
    .map((id) => {
      const n = NPCS[id],
        r = state.relationships[id],
        stance = relationshipStance(r || {});
      return `<button class="${id === current ? "active" : ""}" data-select-npc="${id}" aria-current="${id === current ? "true" : "false"}"><i style="--npc-accent:${n.accent}">${n.avatar}<img class="portrait-img" src="${n.head}" alt="" loading="lazy" decoding="async" data-remove-on-error></i><span><b>${esc(n.name)}</b><small>${esc((r?.hostility || 0) >= 20 ? stance.label : r?.romance && r.romance !== "none" ? romanceStageLabel(r.romance) : n.job)}</small></span></button>`;
    })
    .join(
      "",
    )}</nav><section class="npc-profile"><header class="npc-profile-header"><div class="npc-figure ${artView}" style="--npc-accent:${npc.accent}"><div class="npc-portrait-frame"><img src="${art}" alt="${esc(npc.name)}${artView === "full" ? "全身" : "半身"}立繪" decoding="async"></div><nav aria-label="立繪顯示方式"><button class="${artView === "bust" ? "active" : ""}" data-npc-art="bust" aria-pressed="${artView === "bust"}">半身</button><button class="${artView === "full" ? "active" : ""}" data-npc-art="full" aria-pressed="${artView === "full"}">全身</button></nav></div><div class="npc-profile-identity"><span>PERSONAL FILE・${npc.age} 歲</span><h2>${esc(npc.name)}</h2><b>${esc(npc.job)}</b><p>${esc(publicIntroduction(npc))}</p><small>已認識${familiar ? "・似曾相識" : ""}</small><button data-chat-open="${current}">✉ 傳訊息</button></div></header><nav class="npc-profile-tabs" aria-label="檔案章節">${Object.entries(
    tabs,
  )
    .map(
      ([id, label]) =>
        `<button data-npc-profile-tab="${id}" aria-pressed="${tab === id}" aria-controls="npc-profile-content">${label}</button>`,
    )
    .join(
      "",
    )}</nav><div id="npc-profile-content" class="npc-profile-copy" data-profile-section="${tab}">${content[tab]}</div></section></div>`;
}
