import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { posix, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "espree";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const ENTRY_POINTS = ["src/entry.js", "src/privacy-page.js", "src/pixel/main.js"];
const EXCLUDED_FILES = new Set([
  "assets/vendor/phaser.esm.min.js",
  "src/pixel/release-notes.js",
  "src/data/portraits.js",
  "src/data/work-art.js",
  "src/data/story-art.js",
]);
const NON_TEXT_FIELDS = new Set([
  "id", "key", "src", "href", "url", "class", "className", "selector",
  "asset", "assetId", "texture", "textureKey", "image", "portrait", "file", "path",
]);
const HAN = /\p{Script=Han}/gu;
const TEMPLATE_SLOT = "${…}";

export const TEXT_INVENTORY_METHOD = {
  version: 1,
  scope: "pixel-runtime.mjs 的相同三個入口，沿靜態相對 ES module import/export 與字面值 dynamic import 追蹤的 src JavaScript 依賴閉包；工作樹含已接入但未追蹤的新檔案。",
  entries: ENTRY_POINTS,
  exclusions: [...EXCLUDED_FILES].sort(),
  extraction: "用 espree AST 擷取含漢字的字串值及完整 template literal；排除註解、非文本識別欄位、物件鍵、成員索引鍵、import/export 路徑與素材 metadata。HTML 標籤剝除但保留 alt/title/placeholder/aria-label 的可讀內容。",
  templates: "每個完整模板的靜態片段以 ${…} 接合，算一條，不展開任何插值排列。插值中的獨立中文字串／巢狀模板另外依相同規則擷取；動態填入的作品名、人物名和數字不灌入模板字數。",
  deduplication: "Unicode NFC 與連續空白正規化後，依完整靜態文本去重；跨檔重複只算一次。分組各自去重，群組可能重疊，不能相加。",
  counts: "uniqueTexts 是獨立靜態文本數（含 UI、名稱與短句，並非劇情事件數）；hanCharacters 只計去重文本中的 Unicode Script=Han 字元，不計標點、數字、英文字及模板插值。longTexts/longHanCharacters 限單條至少 20 漢字，是長度篩選，不保證都是敘事。",
  groups: {
    allRuntime: "上述正式遊戲執行期依賴閉包中的所有合格文本。",
    contentData: "其中 src/data/ 的資料文本，含敘事、選項、名稱和資料標籤，不宣稱全數為劇情。",
    creativeWorks: "其中檔名以 creative、work-echo 或 original-work 開頭的模組（自製作品流程、後續回響及其 UI）。",
  },
  comparison: "before/after 使用相同口徑；delta 為淨增減。added/removed 是完整去重靜態文本集合差，改寫舊句會同時列為 removed 和 added，不能把 added 當成淨增字數。",
  limitations: "靜態依賴可達不代表每個 export 或每條分支都會在單輪遊戲觸發；不估算排列組合、重播次數、玩家自訂名稱或讀完所需時間。",
};

function walk(node, visit, parent = null, field = null) {
  if (!node || typeof node !== "object") return;
  if (typeof node.type === "string" && visit(node, parent, field) === false) return;
  for (const [key, value] of Object.entries(node)) {
    if (key === "parent") continue;
    if (Array.isArray(value)) {
      for (const child of value) if (child && typeof child === "object") walk(child, visit, node, key);
    } else if (value && typeof value === "object") walk(value, visit, node, key);
  }
}

function normalizeText(value) {
  return value
    .replace(/<\/?[a-z][^>]*>/gi, tag => {
      const visible = [...tag.matchAll(/\b(?:alt|title|placeholder|aria-label)\s*=\s*(["'])(.*?)\1/gi)];
      return visible.length ? ` ${visible.map(match => match[2]).join(" ")} ` : " ";
    })
    .replace(/&#(?:x([0-9a-f]+)|(\d+));/gi, (whole, hex, decimal) => {
      const codepoint = Number.parseInt(hex || decimal, hex ? 16 : 10);
      return codepoint <= 0x10ffff ? String.fromCodePoint(codepoint) : whole;
    })
    .normalize("NFC").replace(/\s+/gu, " ").trim();
}

function isNonTextLocation(node, parent, field) {
  if (!parent) return false;
  if (["Property", "PropertyDefinition", "MethodDefinition"].includes(parent.type) && field === "key") return true;
  if (parent.type === "MemberExpression" && field === "property") return true;
  if (["ImportDeclaration", "ExportNamedDeclaration", "ExportAllDeclaration", "ImportExpression"].includes(parent.type) && field === "source") return true;
  if (parent.type === "Property" && field === "value" && !parent.computed && ["Literal", "TemplateLiteral"].includes(node.type)) {
    return NON_TEXT_FIELDS.has(parent.key.name ?? parent.key.value);
  }
  return false;
}

export function extractStaticTexts(source, filename = "<source>") {
  let ast;
  try {
    ast = parse(source, { ecmaVersion: "latest", sourceType: "module" });
  } catch (error) {
    throw new Error(`無法解析 ${filename}: ${error.message}`, { cause: error });
  }
  const texts = new Set();
  const imports = new Set();
  walk(ast, (node, parent, field) => {
    if (["ImportDeclaration", "ExportNamedDeclaration", "ExportAllDeclaration", "ImportExpression"].includes(node.type)) {
      if (typeof node.source?.value === "string" && node.source.value.startsWith(".")) imports.add(node.source.value);
    }
    if (isNonTextLocation(node, parent, field)) return false;
    const value = node.type === "Literal" && typeof node.value === "string" ? node.value
      : node.type === "TemplateLiteral" ? node.quasis.map(quasi => quasi.value.cooked ?? quasi.value.raw).join(TEMPLATE_SLOT)
      : null;
    if (value === null) return;
    const text = normalizeText(value);
    if (text.match(HAN)?.length) texts.add(text);
  });
  return { texts, imports };
}

export function summarizeTexts(texts) {
  let hanCharacters = 0;
  let longTexts = 0;
  let longHanCharacters = 0;
  for (const text of texts) {
    const count = text.match(HAN)?.length || 0;
    hanCharacters += count;
    if (count >= 20) {
      longTexts += 1;
      longHanCharacters += count;
    }
  }
  return { uniqueTexts: texts.size, hanCharacters, longTexts, longHanCharacters };
}

export function resolveGitRef(ref, root = ROOT) {
  if (typeof ref !== "string" || !/^[a-zA-Z0-9][a-zA-Z0-9._/-]{0,199}$/.test(ref)) {
    throw new Error("ref 必須是安全的 commit SHA、branch 或 tag 名稱，不接受選項或 revision 運算式。");
  }
  return execFileSync("git", ["rev-parse", "--verify", "--end-of-options", `${ref}^{commit}`], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

export function collectTextInventory({ ref = null, root = ROOT, readSource = null, entryPoints = ENTRY_POINTS } = {}) {
  const commit = ref ? resolveGitRef(ref, root) : null;
  const read = readSource || (path => commit
    ? execFileSync("git", ["show", `${commit}:${path}`], { cwd: root, encoding: "utf8", maxBuffer: 16 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] })
    : readFileSync(resolve(root, path), "utf8"));
  const files = new Map();
  function visit(path) {
    if (files.has(path)) return;
    if (path.startsWith("assets/") && EXCLUDED_FILES.has(path)) {
      files.set(path, new Set());
      return;
    }
    if (!path.startsWith("src/") || path.split("/").includes("..")) throw new Error(`Runtime import outside src: ${path}`);
    const extracted = extractStaticTexts(read(path), path);
    files.set(path, extracted.texts);
    for (const specifier of extracted.imports) visit(posix.normalize(posix.join(posix.dirname(path), specifier)));
  }
  for (const entry of entryPoints) visit(entry);
  const groups = { allRuntime: new Set(), contentData: new Set(), creativeWorks: new Set() };
  const groupFiles = { allRuntime: [], contentData: [], creativeWorks: [] };
  for (const [path, texts] of [...files].sort(([a], [b]) => a.localeCompare(b))) {
    if (EXCLUDED_FILES.has(path)) continue;
    const selected = ["allRuntime"];
    if (path.startsWith("src/data/")) selected.push("contentData");
    if (/\/(?:creative(?:[.-]|$)|work-echo(?:es)?(?:[.-]|$)|original-works?(?:[.-]|$))/.test(path)) selected.push("creativeWorks");
    for (const name of selected) {
      groupFiles[name].push(path);
      for (const text of texts) groups[name].add(text);
    }
  }
  return {
    source: commit ? { type: "git", ref, commit } : { type: "working-tree" },
    reachableFiles: files.size,
    excludedFiles: [...files.keys()].filter(path => EXCLUDED_FILES.has(path)).sort(),
    groups,
    groupFiles,
  };
}

export function inventoryReport(inventory) {
  return {
    source: inventory.source,
    reachableFiles: inventory.reachableFiles,
    excludedFiles: inventory.excludedFiles,
    groups: Object.fromEntries(Object.entries(inventory.groups).map(([name, texts]) => [name, {
      files: inventory.groupFiles[name].length,
      ...summarizeTexts(texts),
      ...(name === "creativeWorks" ? { filePaths: inventory.groupFiles[name] } : {}),
    }])),
  };
}

export function compareInventories(before, after) {
  return Object.fromEntries(Object.keys(before.groups).map(name => {
    const previous = summarizeTexts(before.groups[name]);
    const current = summarizeTexts(after.groups[name]);
    return [name, {
      delta: Object.fromEntries(Object.keys(previous).map(key => [key, current[key] - previous[key]])),
      added: summarizeTexts(new Set([...after.groups[name]].filter(text => !before.groups[name].has(text)))),
      removed: summarizeTexts(new Set([...before.groups[name]].filter(text => !after.groups[name].has(text)))),
    }];
  }));
}

export function runTextInventory(args = process.argv.slice(2)) {
  if (args.length === 1 && ["--help", "-h"].includes(args[0])) {
    return { usage: ["node scripts/audit-text-inventory.mjs", "node scripts/audit-text-inventory.mjs --ref <commit-or-branch>", "node scripts/audit-text-inventory.mjs --compare <baseline-commit>"] };
  }
  if (args.length && (args.length !== 2 || !["--ref", "--compare"].includes(args[0]))) {
    throw new Error("使用 --ref <commit> 或 --compare <baseline>，或不帶參數統計工作樹。");
  }
  if (args[0] === "--compare") {
    const before = collectTextInventory({ ref: args[1] });
    const after = collectTextInventory();
    return { method: TEXT_INVENTORY_METHOD, before: inventoryReport(before), after: inventoryReport(after), comparison: compareInventories(before, after) };
  }
  return { method: TEXT_INVENTORY_METHOD, ...inventoryReport(collectTextInventory({ ref: args[0] === "--ref" ? args[1] : null })) };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    console.log(JSON.stringify(runTextInventory(), null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
