import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

for (const destination of ["script", "image"]) {
  test(`erase acknowledgement drains ${destination} refresh and prevents later cache creation`, async () => {
    const handlers = {}, writes = [], tasks = [];
    let finishFetch, opens = 0;
    const network = new Promise(resolve => { finishFetch = resolve; });
    const cached = { cached: true };
    const cache = { match: async () => cached, put: async () => { writes.push("put"); } };
    const worker = {
      location: { origin: "https://example.com" },
      addEventListener: (name, fn) => (handlers[name] ||= []).push(fn),
    };
    runInNewContext(readFileSync(new URL("../service-worker.js", import.meta.url), "utf8"), {
      self: worker, URL, fetch: () => network,
      caches: { open: async () => { opens++; return cache; } },
    });
    const request = { url: "https://example.com/star-game/asset", method: "GET", destination, headers: { has: () => false } };
    let response;
    handlers.fetch[0]({ request, respondWith: task => { response = task; }, waitUntil: task => tasks.push(task) });
    let acknowledged = false;
    for (const handle of handlers.message) handle({
      data: { type: "STOP_GAME_CACHING" },
      ports: [{ postMessage: message => { assert.equal(message.type, "GAME_CACHING_STOPPED"); acknowledged = true; } }],
      waitUntil: task => tasks.push(task),
    });
    await Promise.resolve();
    assert.equal(acknowledged, false);
    finishFetch({ ok: true, clone: () => ({}) });
    await response;
    await Promise.all(tasks);
    assert.equal(acknowledged, true);
    assert.deepEqual(writes, ["put"]);
    const before = opens;
    handlers.fetch[0]({ request: { ...request, mode: "navigate", url: "https://example.com/star-game/privacy.html" }, respondWith: () => assert.fail("stopped worker must not cache"), waitUntil() {} });
    for (const handle of handlers.message) handle({ data: { type: "PIXEL_CACHE_ALL" }, waitUntil: () => assert.fail("stopped worker must not download") });
    assert.equal(opens, before);
  });
}
