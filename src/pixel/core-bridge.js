import { hydrateState, state as core } from "../core/state.js";

// Only synchronous rules enter this transaction. The pixel save owns the RNG
// cursor and all business state; a failed command never partially replaces it.
export function withCore(life, fn) {
  hydrateState(structuredClone(life.game));
  const result = fn(core);
  life.game = structuredClone(core);
  return result;
}
