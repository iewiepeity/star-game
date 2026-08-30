import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { initialState, state } from "../src/core/state.js";
import { roomView } from "../src/views/room.js";

test("首頁依職涯階段給出下一步，而不是把全部 App 當成教學", () => {
  Object.assign(state, initialState(), { screen: "room", name: "Beta 新人" });
  const rookie = roomView();
  assert.match(rookie, /新人起步/);
  assert.match(rookie, /安排一週/);
  state.currentAgencyId = "starlight";
  assert.match(roomView(), /第一份履歷/);
  state.completedWorks = [{ id: "work-1" }];
  assert.match(roomView(), /建立代表作/);
});

test("部署只會在 CI 成功後發布乾淨 dist", async () => {
  const workflow = await readFile(
    new URL("../.github/workflows/pages.yml", import.meta.url),
    "utf8",
  );
  assert.match(workflow, /workflow_run:/);
  assert.match(workflow, /workflow_run\.conclusion == 'success'/);
  assert.match(workflow, /path: dist/);
  assert.doesNotMatch(workflow, /path: \.$/m);
});

test("共用確認視窗背景不會攔截主要按鈕", async () => {
  const css = await readFile(new URL("../style.css", import.meta.url), "utf8");
  assert.match(css, /\.confirm-backdrop\{pointer-events:none!important\}/);
});
