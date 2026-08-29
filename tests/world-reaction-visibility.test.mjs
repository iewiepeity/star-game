import test from"node:test";
import assert from"node:assert/strict";
import{state,resetState}from"../src/core/state.js";
import{WORLD_REACTION_SIGNALS}from"../src/data/living-world-content.js";
import{tickDeepeningSystems}from"../src/logic/deepening-engine.js";

test("世界反應會輪替尚未曝光的高值特質，而非永遠只顯示最高值",()=>{
 resetState();
 for(const name of Object.keys(WORLD_REACTION_SIGNALS.hidden))state.hidden[name]=700;
 for(const name of Object.keys(WORLD_REACTION_SIGNALS.rep))state.rep[name]=700;
 for(let week=4;week<=64;week+=4){state.week=week;tickDeepeningSystems()}
 const signatures=state.worldSignalHistory.map(item=>item.signature);
 assert.equal(new Set(signatures).size,16);
 assert.ok(Object.keys(WORLD_REACTION_SIGNALS.hidden).every(name=>signatures.includes(`hidden:${name}`)));
 assert.ok(Object.keys(WORLD_REACTION_SIGNALS.rep).every(name=>signatures.includes(`rep:${name}`)));
});
