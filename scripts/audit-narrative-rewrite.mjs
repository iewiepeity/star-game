import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { gzipSync, gunzipSync } from "node:zlib";

const root = resolve(new URL("..", import.meta.url).pathname);
const option = name => {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`Missing value for ${name}`);
  return value;
};
const base = option("--base") || "5d8cee0acc9627809f23606826ad9f54b1a4af71";
const directory = option("--directory") || "docs/narrative/2026-09-06";
if (!/^docs\/narrative\/[a-zA-Z0-9-]+$/.test(directory)) throw new Error("Use a dated folder under docs/narrative");
const auditCommand = `node scripts/audit-narrative-rewrite.mjs${option("--directory") ? ` --directory ${directory}` : ""}`;
const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: 30 * 1024 * 1024 });
const hash = value => createHash("sha256").update(value).digest("hex");
const han = value => [...value.matchAll(/\p{Script=Han}/gu)].length;

if (process.argv.includes("--write")) {
  await mkdir(resolve(root, directory), { recursive: true });
  const changed = new Set([
    ...git("diff", "--name-only", base, "--", "src").trim().split("\n"),
    ...git("ls-files", "--others", "--exclude-standard", "src").trim().split("\n"),
  ].filter(Boolean));
  const originals = {}, files = [];
  for (const path of [...changed].sort()) {
    let before = null;
    if (git("ls-tree", "--name-only", base, "--", path).trim()) before = git("show", `${base}:${path}`);
    const after = await readFile(resolve(root, path), "utf8");
    if (before !== null) originals[path] = before;
    files.push({ path, action: before === null ? "added" : "replaced", beforeSha256: before === null ? null : hash(before), afterSha256: hash(after), beforeHanCharacters: han(before || ""), afterHanCharacters: han(after), reason: path.startsWith("src/data/") ? "專屬文本、人物／題材一致性與分支後果" : "文本接入、階段前提、延遲回收與像素呈現一致性" });
  }
  // Stage source files before --write so git's patch includes added files too.
  const patch = git("diff", "--binary", base, "--", "src");
  const archive = JSON.stringify({ baseCommit: base, originals }, null, 2) + "\n";
  await writeFile(resolve(root, directory, "originals.json.gz"), gzipSync(archive));
  await writeFile(resolve(root, directory, "source-changes.patch.gz"), gzipSync(patch));
  await writeFile(resolve(root, directory, "manifest.json"), JSON.stringify({
    date: "2026-09-06", baseCommit: base,
    note: "字數是原始碼中的漢字數，含註解、重複與規則提示，不能當成不重複劇情字數。原文逐檔完整保留；已發生的玩家存檔歷史不在替換範圍。",
    archiveSha256: hash(archive), patchSha256: hash(patch), files,
  }, null, 2) + "\n");
  const rows = files.map(item => `| ${item.action === "added" ? "新增" : "替換"} | [${item.path}](../../../${item.path}) | ${item.beforeHanCharacters.toLocaleString("en-US")} | ${item.afterHanCharacters.toLocaleString("en-US")} | ${item.reason} |`).join("\n");
  await writeFile(resolve(root, directory, "REPLACEMENT-INDEX.md"), `# 文本替換備查索引\n\n日期：2026-09-06。基準提交：\`${base}\`。\n\n本次保留 ${files.filter(item => item.action === "replaced").length} 份既有來源的完整原文，另新增 ${files.filter(item => item.action === "added").length} 份來源。下列數字為原始碼漢字數，包含註解、重複及規則提示，不代表不重複劇情字數。\n\n[逐檔校驗清單](manifest.json)記錄替換前後完整 SHA-256；[原文封存](originals.json.gz)保留完整舊來源；[逐行差異](source-changes.patch.gz)可核對每一處修改。遊戲既有存檔中的歷史文字不在替換範圍。\n\n| 動作 | 來源檔案 | 原碼漢字（前） | 原碼漢字（後） | 替換原因 |\n| --- | --- | ---: | ---: | --- |\n${rows}\n\n在專案根目錄執行：\n\n\`\`\`sh\n${auditCommand}\n${auditCommand} --original ${files.find(item => item.action === "replaced")?.path || "src/pixel/city-catalog.js"}\n${auditCommand} --diff\n\`\`\`\n\n全文範圍與驗證限制請見[交付說明](NARRATIVE-REWRITE.md)及[編輯總綱](EDITORIAL-GUIDE.md)。\n`);
  console.log(`Archived ${files.filter(f => f.action === "replaced").length} original files; tracked ${files.length} source changes.`);
} else {
  const manifest = JSON.parse(await readFile(resolve(root, directory, "manifest.json"), "utf8"));
  const archiveText = gunzipSync(await readFile(resolve(root, directory, "originals.json.gz"))).toString("utf8");
  if (hash(archiveText) !== manifest.archiveSha256) throw new Error("Original archive checksum mismatch");
  const patch = gunzipSync(await readFile(resolve(root, directory, "source-changes.patch.gz"))).toString("utf8");
  if (hash(patch) !== manifest.patchSha256) throw new Error("Replacement patch checksum mismatch");
  const { originals } = JSON.parse(archiveText);
  const originalIndex = process.argv.indexOf("--original");
  if (originalIndex !== -1) {
    const path = process.argv[originalIndex + 1];
    if (!(path in originals)) throw new Error(`No replaced original: ${path}`);
    process.stdout.write(originals[path]);
    process.exit(0);
  }
  if (process.argv.includes("--diff")) { process.stdout.write(patch); process.exit(0); }
  for (const item of manifest.files) {
    if (item.beforeSha256 && hash(originals[item.path]) !== item.beforeSha256) throw new Error(`Original changed: ${item.path}`);
    if (!process.argv.includes("--historical") && hash(await readFile(resolve(root, item.path), "utf8")) !== item.afterSha256) throw new Error(`Later edit found: ${item.path}; use --historical to verify this preserved snapshot or --directory for a newer revision.`);
  }
  console.log(`Narrative archive verified: ${manifest.files.length} files, ${process.argv.includes("--historical") ? "preserved originals and recorded patch" : "exact originals and current replacements"}.`);
}
