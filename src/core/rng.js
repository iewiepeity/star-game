// Deterministic per-run RNG. All gameplay randomness should go through this module.
import{state}from"./state.js";

function hashSeed(input){let h=2166136261>>>0;for(const ch of String(input)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
export function ensureRngState(){if(!Number.isInteger(state.rngSeed))state.rngSeed=hashSeed(`${Date.now()}-${state.name||"new-run"}`);if(!Number.isInteger(state.rngCursor))state.rngCursor=0;return state.rngSeed}
export function setSeed(seed){state.rngSeed=hashSeed(seed);state.rngCursor=0;return state.rngSeed}
export function randomFloat(){ensureRngState();let x=(state.rngSeed+Math.imul(++state.rngCursor,0x6D2B79F5))>>>0;x=Math.imul(x^(x>>>15),x|1);x^=x+Math.imul(x^(x>>>7),x|61);return((x^(x>>>14))>>>0)/4294967296}
export function randomInt(min,max){return Math.floor(randomFloat()*(max-min+1))+min}
export function chance(percent){return randomFloat()*100<percent}
export function pick(list){return list?.length?list[Math.floor(randomFloat()*list.length)]:null}
