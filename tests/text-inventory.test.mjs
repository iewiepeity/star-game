import test from "node:test";
import assert from "node:assert/strict";
import { pixelRuntimeFiles } from "../scripts/pixel-runtime.mjs";
import {
  collectTextInventory,
  compareInventories,
  extractStaticTexts,
  inventoryReport,
  resolveGitRef,
  runTextInventory,
  summarizeTexts,
} from "../scripts/audit-text-inventory.mjs";

test("text inventory extracts values, not comments, property keys, IDs or member lookups", () => {
  const source = [
    '// 這是註解，不是故事。',
    'const row = { "中文物件鍵": "你把最後一頁翻了回去。", id: "內部中文識別", key: `內部${"中文識別插值"}`, src: "./中文圖像.webp" };',
    'const read = row["中文物件鍵"];',
    'const duplicate = "你把最後一頁翻了回去。";',
    'const noNarrative = /中文正規表示式/;',
  ].join("\n");
  assert.deepEqual([...extractStaticTexts(source).texts], ["你把最後一頁翻了回去。"]);
});

test("image and other system-named content branches are not mistaken for scalar asset metadata", () => {
  const { texts } = extractStaticTexts('const training = { image: { label: "形象儀態課", scenes: ["你終於不用盯著鏡子，也能自然抬起頭。"] }, path: ["路上的小故事"] };');
  assert.deepEqual([...texts], ["形象儀態課", "你終於不用盯著鏡子，也能自然抬起頭。", "路上的小故事"]);
});

test("templates count authored static copy once and do not multiply interpolation combinations", () => {
  const source = [
    'const first = `你讀完${work.title}，聽見${npc.name}說晚安。`;',
    'const duplicate = `你讀完${other.title}，聽見${someone.name}說晚安。`;',
    'const nested = `${good ? "平靜" : "猶豫"}，你收起${`寫著${name}的信`}。`;',
  ].join("\n");
  const texts = extractStaticTexts(source).texts;
  assert.deepEqual([...texts], [
    "你讀完${…}，聽見${…}說晚安。",
    "${…}，你收起${…}。",
    "平靜", "猶豫", "寫著${…}的信",
  ]);
  assert.deepEqual(summarizeTexts(texts), { uniqueTexts: 5, hanCharacters: 19, longTexts: 0, longHanCharacters: 0 });
});

test("HTML syntax is excluded while readable attributes, visible copy and Unicode Han survive", () => {
  const { texts } = extractStaticTexts('const view = `<section class="中文內部分類"><img src="中文路徑.png" alt="晚上的房間"><input placeholder="請寫下作品名稱"><p>你抬起頭。 &#x661F;</p></section>`;');
  assert.deepEqual([...texts], ["晚上的房間 請寫下作品名稱 你抬起頭。 星"]);
  assert.deepEqual(summarizeTexts(new Set(["甲".repeat(19), "乙".repeat(20), "𠀀"])), {
    uniqueTexts: 3, hanCharacters: 40, longTexts: 1, longHanCharacters: 20,
  });
});

test("dependency traversal follows game imports, exports and dynamic imports, including new source files", () => {
  const files = {
    "src/entry.js": 'import "./data/creative-fresh.js"; export { item } from "./data/other.js"; import("./logic/work-echoes.js"); import "./pixel/release-notes.js"; const unusedPath = "./data/unreachable.js";',
    "src/data/creative-fresh.js": 'export const item = "你看著今晚留下的那一盞燈，開始替下一個故事記下開場。";',
    "src/data/other.js": 'export const item = "你看著今晚留下的那一盞燈，開始替下一個故事記下開場。";',
    "src/logic/work-echoes.js": 'export { item } from "../data/creative-fresh.js"; export const line = "你把回信摺好了。";',
    "src/pixel/release-notes.js": 'export const title = "更新紀錄不是遊戲文本。"; export { item } from "../data/from-notes.js";',
    "src/data/from-notes.js": 'export const item = "這段資料仍被正式入口間接引用。";',
    "src/data/unreachable.js": 'export const item = "這個孤立檔案不可以灌進統計。";',
  };
  const inventory = collectTextInventory({ entryPoints: ["src/entry.js"], readSource: path => {
    assert.ok(Object.hasOwn(files, path), path);
    return files[path];
  } });
  const report = inventoryReport(inventory);
  assert.equal(report.reachableFiles, 6);
  assert.equal(report.groups.allRuntime.files, 5);
  assert.equal(report.groups.allRuntime.uniqueTexts, 3);
  assert.equal(report.groups.contentData.uniqueTexts, 2);
  assert.equal(report.groups.creativeWorks.uniqueTexts, 2);
  assert.deepEqual(report.groups.creativeWorks.filePaths, ["src/data/creative-fresh.js", "src/logic/work-echoes.js"]);
  assert.equal(inventory.groups.allRuntime.has("更新紀錄不是遊戲文本。"), false);
});

test("comparison reports net change separately from added and replaced authored text", () => {
  const make = value => collectTextInventory({ entryPoints: ["src/entry.js"], readSource: () => `const lines = ${JSON.stringify(value)};` });
  const report = compareInventories(make(["你回家。", "晚安。"]), make(["你終於回家。", "晚安。", "窗外下起雨。"]));
  assert.deepEqual(report.allRuntime.delta, { uniqueTexts: 1, hanCharacters: 7, longTexts: 0, longHanCharacters: 0 });
  assert.equal(report.allRuntime.added.uniqueTexts, 2);
  assert.equal(report.allRuntime.removed.uniqueTexts, 1);
});

test("CLI rejects unsafe revision arguments and contradictory modes without invoking a shell", () => {
  for (const ref of ["--help", "HEAD~1", "main;echo unsafe", "$(echo unsafe)", "main:src/entry.js", ""]) {
    assert.throws(() => resolveGitRef(ref), /安全/);
  }
  assert.throws(() => runTextInventory(["--ref"]), /使用/);
  assert.throws(() => runTextInventory(["--ref", "main", "--compare", "main"]), /使用/);
  assert.equal(runTextInventory(["--help"]).usage.length, 3);
});

test("measured runtime file closure agrees with the actual pixel release dependency graph", async () => {
  const inventory = collectTextInventory();
  assert.deepEqual(
    [...inventory.groupFiles.allRuntime, ...inventory.excludedFiles].sort(),
    (await pixelRuntimeFiles()).sort(),
  );
});
