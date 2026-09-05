import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { initialState, state } from "../src/core/state.js";
import { roomView } from "../src/views/room.js";

const root = new URL("../", import.meta.url);

async function readLegacyCss() {
  const html = await readFile(new URL("index.html", root), "utf8");
  const files = [...html.matchAll(/href="\.\/(legacy-[^"]+\.css)"/g)].map(
    match => match[1],
  );
  assert.ok(files.length > 0);
  return (
    await Promise.all(files.map(file => readFile(new URL(file, root), "utf8")))
  ).join("\n");
}

test("首頁依職涯階段給出下一步，而不是把全部 App 當成教學", () => {
  Object.assign(state, initialState(), { screen: "room", name: "Beta 新人" });
  const rookie = roomView();
  assert.match(rookie, /尋找第一個真正的機會/);
  assert.match(rookie, /去城市找徵選/);
  state.currentAgencyId = "starlight";
  assert.match(roomView(), /查看工作機會/);
  state.completedWorks = [{ id: "work-1", title: "第一次演出", category: "廣告" }];
  assert.match(roomView(), /房間裡的第一份紀念/);
});

test("部署只會在 CI 成功後發布乾淨 dist", async () => {
  const workflow = await readFile(
    new URL("../.github/workflows/pages.yml", import.meta.url),
    "utf8",
  );
  assert.match(workflow, /workflow_run:/);
  assert.match(workflow, /workflow_run\.conclusion == 'success'/);
  assert.match(workflow, /workflow_run\.event == 'push'/);
  assert.match(workflow, /workflow_run\.head_branch == 'main'/);
  assert.match(workflow, /persist-credentials: false/);
  assert.match(workflow, /path: dist/);
  assert.doesNotMatch(workflow, /path: \.$/m);
});

test("網頁提供基本 CSP，阻擋任意腳本、外掛與 base URL 注入", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /http-equiv="Content-Security-Policy"/);
  assert.match(html, /script-src 'self'/);
  assert.match(html, /object-src 'none'/);
  assert.match(html, /base-uri 'self'/);
});

test("共用確認視窗維持最上層互動與背景取消功能", async () => {
  const [css, binding] = await Promise.all([
    readLegacyCss(),
    readFile(new URL("../src/bind/room.js", import.meta.url), "utf8"),
  ]);
  assert.doesNotMatch(css, /\.confirm-backdrop\{pointer-events:none/);
  assert.match(binding, /state\.confirmDialog \? "\.confirm-dialog" : "\.app-window"/);
});

test("瀏覽器分頁與 iOS 主畫面使用正式品牌圖示", async () => {
  const [html, worker] = await Promise.all([
    readFile(new URL("../index.html", import.meta.url), "utf8"),
    readFile(new URL("../service-worker.js", import.meta.url), "utf8"),
  ]);
  assert.match(html, /rel="icon" href="\.\/assets\/icons\/app-icon\.svg"/);
  assert.match(html, /rel="apple-touch-icon"/);
  assert.match(worker, /app-icon\.svg/);
  assert.match(worker, /apple-touch-icon\.png/);
});
