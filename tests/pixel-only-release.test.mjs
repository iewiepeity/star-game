import test from "node:test";
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import vm from "node:vm";
import { pixelRuntimeFiles } from "../scripts/pixel-runtime.mjs";

const root = new URL("../", import.meta.url);
const retired = /(?:classic\.html|manifest\.webmanifest|legacy-[^/]+\.css|src\/(?:main|render|bind)\.js|src\/bind\/)/;

test("pixel release contains its complete import graph and no classic runtime", async () => {
  execFileSync(process.execPath, ["scripts/build-release.mjs"], { cwd: root });
  const files = await pixelRuntimeFiles();
  assert.ok(files.includes("src/pixel/main.js"));
  assert.ok(files.includes("src/logic/job-engine.js"));
  assert.ok(files.includes("src/views/jobs.js"));
  assert.ok(files.includes("src/data/prologue.js"));
  for (const file of files) {
    assert.doesNotMatch(file, retired);
    await access(new URL(`dist/${file}`, root));
  }
  for (const file of ["classic.html", "manifest.webmanifest", "src/main.js", "src/render.js", "src/bind.js"])
    await assert.rejects(access(new URL(`dist/${file}`, root)), { code: "ENOENT" });
  for (const entry of ["index.html", "pixel.html"]) {
    const html = await readFile(new URL(`dist/${entry}`, root), "utf8");
    for (const [, file] of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
      // Canonical links describe the public page; they are not local assets.
      if (/^https?:\/\//.test(file)) continue;
      await access(new URL(`dist/${file}`, root));
    }
  }
});

test("offline installation requests existing pixel files and activation removes the previous cache", async () => {
  const events = {}, removed = [];
  let shell;
  const worker = await readFile(new URL("service-worker.js", root), "utf8");
  const pkg = JSON.parse(await readFile(new URL("package.json", root), "utf8"));
  const current = `star-game-runtime-v${pkg.version}`;
  vm.runInNewContext(worker, {
    self: { addEventListener: (name, handler) => { events[name] = handler; }, clients: { claim() {} } },
    caches: {
      open: async () => ({ addAll: async files => { shell = [...files]; } }),
      keys: async () => ["star-game-runtime-v1.41.0", current, "unrelated-cache"],
      delete: async key => { removed.push(key); },
    },
  });
  let pending;
  const event = { waitUntil: promise => { pending = promise; } };
  events.install(event);
  await pending;
  for (const file of shell) {
    assert.doesNotMatch(file, retired);
    await access(new URL(file, root));
  }
  events.activate(event);
  await pending;
  assert.deepEqual(removed, ["star-game-runtime-v1.41.0"]);
  const offline = JSON.parse(await readFile(new URL("pixel-offline.json", root), "utf8"));
  for (const { url } of offline.entries) {
    assert.doesNotMatch(url, retired);
    await access(new URL(url, root));
  }
  const listed = new Set(offline.entries.map(entry => entry.url));
  for (const file of await pixelRuntimeFiles()) assert.ok(listed.has(`./${file}`), file);
});
