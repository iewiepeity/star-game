import { state } from "../core/state.js";
import { normalizeAgencyAgreements } from "../core/agency-agreement-state.js";
export { normalizeAgencyAgreements } from "../core/agency-agreement-state.js";

export const AGENCY_RESOURCES = {
  starlight: { label: "跨部門選案與行程緩衝", categories: ["電影", "電視劇", "廣告", "綜藝"], prep: 4, promotion: .12, restExpiry: 2, text: "許芮安把新人組、商務與節目窗口放在同一張表上。她願意替你調整優先順序，但要先知道哪一件事可以等。", reply: "先把能完成的範圍寫清楚，窗口收到的會是同一份安排。" },
  mirror: { label: "劇本讀解與影視選角", categories: ["電影", "電視劇"], prep: 7, promotion: .08, restExpiry: 2, text: "沈靜禾先翻作品，再看邀請的名字。她能替影視角色多做一輪準備；大量曝光不是映界最擅長的交換條件。", reply: "我會從角色需要什麼開始找。若要跨出影視，我們先做短期試行。" },
  clearvoice: { label: "錄音、舞台與發行宣傳", categories: ["歌曲", "廣告"], prep: 5, promotion: .22, restExpiry: 1, text: "韓知勳把錄音、舞台與宣傳的窗口分開列出。澄音能把作品推得更遠，但休息與創作時間必須事先講明。", reply: "我需要一個清楚的方向。作品真的交付後，宣傳資源才會跟上。" },
  tide: { label: "主持排練與新媒體宣傳", categories: ["綜藝", "廣告"], prep: 4, promotion: .18, restExpiry: 1, text: "羅沐晴帶來訪談和短內容的兩種提案。浪潮擅長找新的入口，但她也想知道你願意把自己放進哪種內容。", reply: "把想做的和不願意的都說出來，我們才知道要用什麼方式被看見。" },
};
const kinds = new Set(["direction", "rest", "promotion"]);
const cats = new Set(["歌曲", "電影", "電視劇", "綜藝", "廣告"]);
export function activeAgencyAgreements(game = state) {
  if (!game.currentAgencyId || game.week > game.agencyContractEndWeek) return [];
  return normalizeAgencyAgreements(game.agencyAgreements).records.filter(r => r.agencyId === game.currentAgencyId && r.status === "active" && r.sinceWeek <= game.week && r.untilWeek >= game.week);
}
export function applyAgencyAgreementEffect(payload = {}, game = state) {
  const agencyId = game.currentAgencyId, resource = AGENCY_RESOURCES[agencyId], kind = payload.kind;
  if (!resource || game.week > game.agencyContractEndWeek || game.endingResult) return { ok: false, message: "目前沒有有效的公司合約可談。" };
  if (!kinds.has(kind) || (kind === "direction" && !cats.has(payload.category))) return { ok: false, message: "請選擇想談的具體方向。" };
  game.agencyAgreements = normalizeAgencyAgreements(game.agencyAgreements);
  if (game.agencyAgreements.records.some(r => r.agencyId === agencyId && r.kind === kind && r.sinceWeek === game.week)) return { ok: false, message: "這週這項安排已談妥，先讓窗口照這個版本準備。" };
  for (const record of game.agencyAgreements.records) if (record.agencyId === agencyId && record.kind === kind && record.status === "active") record.status = "cancelled";
  const trial = kind === "direction" && !resource.categories.includes(payload.category) && (game.managerState?.trust || 0) < 60;
  const duration = kind === "rest" || trial ? 2 : 4;
  const record = { id: `${agencyId}:${game.week}:${kind}`, agencyId, kind, category: kind === "direction" ? payload.category : null,
    mode: payload.mode === "launch" ? "launch" : "steady", sinceWeek: game.week, untilWeek: Math.min(game.agencyContractEndWeek, game.week + duration - 1), status: "active", trial, deliveries: [] };
  game.agencyAgreements.records.push(record);
  const detail = kind === "direction" ? `${trial ? "先試行" : "優先接觸"}${record.category}；同類邀約優先整理，試鏡準備＋${trial ? 2 : resource.prep}。`
    : kind === "rest" ? `新邀約每週最多整理 1 份，回覆期限多留 ${resource.restExpiry} 週；既有通告與你排好的日子維持原約。`
      : `${record.mode === "launch" ? "集中推廣" : "作品訪談"}：有效期內實際完成的作品，另有 ${Math.round(resource.promotion * (record.mode === "launch" ? 1 : .5) * 100)}% 粉絲回響，上限每作 120 人；沒有完成作品就不會先加曝光。${record.mode === "steady" ? "另整理作品說法，期間試鏡準備＋2。" : "資源集中在發行曝光，沒有額外的訪談準備。"}`;
  return { ok: true, record, message: `${resource.reply} ${detail} 有效至第 ${record.untilWeek} 週。` };
}
export function agencyOfferPolicy(game = state) {
  const active = activeAgencyAgreements(game), rest = active.find(r => r.kind === "rest"), direction = active.find(r => r.kind === "direction");
  return { category: direction?.category || null, limit: rest ? 1 : Infinity, expiryBonus: rest ? AGENCY_RESOURCES[rest.agencyId].restExpiry : 0 };
}
export function agencyAgreementPrep(job, game = state) {
  const active = activeAgencyAgreements(game);
  const agreement = active.find(r => r.kind === "direction" && r.category === job?.category);
  const interviewPrep = active.some(r => r.kind === "promotion" && r.mode === "steady") ? 2 : 0;
  return (agreement ? agreement.trial ? 2 : AGENCY_RESOURCES[agreement.agencyId].prep : 0) + interviewPrep;
}
export function recordAgencyWorkDelivery(work, game = state) {
  if (!work?.id || !game.completedWorks?.some(w => w.id === work.id)) return 0;
  const active = activeAgencyAgreements(game);
  const promo = active.find(r => r.kind === "promotion");
  if (!promo || work.completedWeek < promo.sinceWeek || work.completedWeek > promo.untilWeek) return 0;
  game.agencyAgreements = normalizeAgencyAgreements(game.agencyAgreements);
  if (game.agencyAgreements.records.some(r => r.deliveries.some(d => d.workId === work.id))) return 0;
  const record = game.agencyAgreements.records.find(r => r.id === promo.id);
  const fans = Math.min(120, Math.max(0, Math.round((work.fans || 0) * AGENCY_RESOURCES[promo.agencyId].promotion * (promo.mode === "launch" ? 1 : .5))));
  record.deliveries.push({ workId: work.id, week: game.week, fans });
  game.fans = (game.fans || 0) + fans;
  work.agencyPromotion = { agencyId: promo.agencyId, agreementId: promo.id, fansBonus: fans };
  return fans;
}
export function tickAgencyAgreements(game = state) {
  game.agencyAgreements = normalizeAgencyAgreements(game.agencyAgreements);
  for (const r of game.agencyAgreements.records) if (r.status === "active") {
    if (r.agencyId !== game.currentAgencyId) r.status = "cancelled";
    else if (r.untilWeek < game.week) r.status = "expired";
  }
  return game.agencyAgreements;
}
