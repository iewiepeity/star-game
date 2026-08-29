import { state } from "../core/state.js";

// 把「有人記得你的試鏡」從敘事回聲變成真的 gameplay opportunity。
// 不直接保送成功，只解除舊冷卻並在原通告上留下回邀提示。
export function applyFailureCallbackMechanics(callbacks = []) {
  const changed = [];
  for (const callback of callbacks) {
    const jobId = callback?.jobId;
    if (!jobId) continue;
    const record = state.activeJobs?.[jobId];
    if (!record || record.stage !== "failed") continue;
    record.lastAuditionWeek = Math.min(
      Number(record.lastAuditionWeek ?? state.week - 2),
      state.week - 2,
    );
    record.notice = "之前看過你試鏡的人再次想起你：如果還想爭取，這週可以直接回來再試一次。";
    record.callbackInviteWeek = state.week;
    changed.push(jobId);
  }
  return changed;
}
