import test from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import {
  waitForPixelUpdate,
  activatePixelUpdate,
} from "../src/pixel/update-flow.js";

class Worker extends EventEmitter {
  constructor(state = "installed") {
    super();
    this.state = state;
    this.messages = [];
  }
  addEventListener(name, listener) {
    this.on(name, listener);
  }
  removeEventListener(name, listener) {
    this.off(name, listener);
  }
  postMessage(message) {
    this.messages.push(message);
  }
  become(state) {
    this.state = state;
    this.emit("statechange");
  }
}

test("checking an update waits for installation instead of reporting an unfinished download as current", async () => {
  const worker = new Worker("installing");
  let ready = false;
  const pending = waitForPixelUpdate({ installing: worker }).then(() => {
    ready = true;
  });
  await Promise.resolve();
  assert.equal(ready, false);
  worker.become("installed");
  await pending;
  assert.equal(ready, true);
  assert.equal(worker.listenerCount("statechange"), 0);
});

test("an installation failure or timeout is reported instead of silently waiting", async () => {
  const worker = new Worker("installing");
  const failed = assert.rejects(
    waitForPixelUpdate({ installing: worker }),
    /下載未完成/,
  );
  worker.become("redundant");
  await failed;
  worker.state = "installing";
  await assert.rejects(
    waitForPixelUpdate({ installing: worker }, 5),
    /仍在準備/,
  );
  assert.equal(worker.listenerCount("statechange"), 0);
});

test("an update activated by another tab still allows the saved page to reload", async () => {
  const serviceWorkers = new Worker();
  await activatePixelUpdate(
    { waiting: null, active: new Worker("activated") },
    serviceWorkers,
  );
  assert.equal(serviceWorkers.listenerCount("controllerchange"), 0);
});

test("activation completes even if the browser does not dispatch controllerchange", async () => {
  const worker = new Worker(),
    serviceWorkers = new Worker();
  const pending = activatePixelUpdate({ waiting: worker }, serviceWorkers);
  assert.deepEqual(worker.messages, [{ type: "SKIP_WAITING" }]);
  worker.become("activated");
  await pending;
  assert.equal(serviceWorkers.listenerCount("controllerchange"), 0);
  assert.equal(worker.listenerCount("statechange"), 0);
});

test("an already activating worker is awaited without sending a second activation", async () => {
  const worker = new Worker("activating"),
    serviceWorkers = new Worker();
  const pending = activatePixelUpdate({ active: worker }, serviceWorkers);
  assert.deepEqual(worker.messages, []);
  worker.become("activated");
  await pending;
});

test("controller handoff completes once and removes both observers", async () => {
  const worker = new Worker(),
    serviceWorkers = new Worker();
  serviceWorkers.controller = new Worker("activated");
  let done = false;
  const pending = activatePixelUpdate({ waiting: worker }, serviceWorkers).then(
    () => {
      done = true;
    },
  );
  serviceWorkers.emit("controllerchange");
  await Promise.resolve();
  assert.equal(done, false);
  serviceWorkers.controller = worker;
  serviceWorkers.emit("controllerchange");
  await pending;
  assert.equal(serviceWorkers.listenerCount("controllerchange"), 0);
  assert.equal(worker.listenerCount("statechange"), 0);
});

test("a stalled or discarded activation reports failure and can be retried", async () => {
  const worker = new Worker(),
    serviceWorkers = new Worker();
  await assert.rejects(
    activatePixelUpdate({ waiting: worker }, serviceWorkers, 5),
    /比預期久/,
  );
  assert.equal(serviceWorkers.listenerCount("controllerchange"), 0);
  assert.equal(worker.listenerCount("statechange"), 0);
  const failed = assert.rejects(
    activatePixelUpdate({ waiting: worker }, serviceWorkers),
    /切換未完成/,
  );
  worker.become("redundant");
  await failed;
  worker.state = "installed";
  const retry = activatePixelUpdate({ waiting: worker }, serviceWorkers);
  worker.become("activated");
  await retry;
});
