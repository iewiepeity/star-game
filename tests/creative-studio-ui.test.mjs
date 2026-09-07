import test from "node:test";
import assert from "node:assert/strict";
import { initialPixelState } from "../src/pixel/model.js";
import { newProject } from "../src/pixel/life.js";
import { createLifeUI } from "../src/pixel/life-ui.js";
import { createFeatureUI } from "../src/pixel/feature-ui.js";

function studio() {
  const state = initialPixelState();
  const draft = newProject(state.life, "song", "還在寫的歌");
  const released = newProject(state.life, "script", "已上映的電影");
  const sold = newProject(state.life, "show", "已售出的節目");
  Object.assign(state.life.game.creativeProjects.find((p) => p.id === released.id), { status: "released", progress: 100, marketScore: 80 });
  Object.assign(state.life.game.creativeProjects.find((p) => p.id === sold.id), { status: "sold", progress: 100 });
  let html = "";
  const api = {
    state: () => state,
    escape: (value) => String(value),
    show: (_id, content) => { html = content; },
    checkpoint() {}, changed() {}, toast() {}, native: {},
  };
  const ui = createFeatureUI(api);
  return { state, draft, released, sold, ui, html: () => html };
}

test("創作筆記入口直接開啟完整工作室", () => {
  let opened;
  const ui = createLifeUI({ openApp: (id) => { opened = id; } });
  ui.creative();
  assert.equal(opened, "creative");
});

test("已發行與售出作品可分別收合，保留進行中的企劃和工作室完整功能", () => {
  const s = studio();
  s.ui.open("creative");
  assert.match(s.html(), /data-creative-new="song"/);
  assert.match(s.html(), /<dt>進行企劃<\/dt><dd>1<\/dd>/);
  assert.match(s.html(), new RegExp(`data-creative-work="${s.draft.id}"`));
  assert.doesNotMatch(s.html(), new RegExp(`data-creative-toggle="${s.draft.id}"`));
  for (const p of [s.released, s.sold]) {
    assert.match(s.html(), new RegExp(`data-creative-toggle="${p.id}" aria-expanded="true"`));
  }
  const details = { hidden: false };
  const button = {
    dataset: { creativeToggle: s.released.id },
    closest: () => true,
    getAttribute: () => `creative-details-${s.released.id}`,
    setAttribute(key, value) { this[key] = value; },
  };
  const originalDocument = globalThis.document;
  globalThis.document = { getElementById: () => details };
  try {
    const before = JSON.stringify(s.state.life.game.creativeProjects);
    assert.equal(s.ui.handle(button), true);
    assert.equal(details.hidden, true);
    assert.equal(button["aria-expanded"], "false");
    assert.equal(button.textContent, "展開作品");
    s.ui.open("phone");
    s.ui.open("creative");
    assert.match(s.html(), new RegExp(`id="creative-details-${s.released.id}" hidden`));
    assert.match(s.html(), new RegExp(`data-creative-toggle="${s.sold.id}" aria-expanded="true"`));
    s.ui.handle(button);
    assert.equal(details.hidden, false);
    assert.equal(button["aria-expanded"], "true");
    assert.equal(button.textContent, "縮起作品");
    assert.equal(JSON.stringify(s.state.life.game.creativeProjects), before);
  } finally {
    if (originalDocument === undefined) delete globalThis.document;
    else globalThis.document = originalDocument;
  }
});
