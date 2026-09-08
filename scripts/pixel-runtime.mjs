import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);

// Follow the application's ES module imports so release and offline downloads
// use the same dependency closure, including shared rules and phone views.
export async function pixelRuntimeFiles() {
  const seen = new Set();
  async function visit(url) {
    if (!url.href.startsWith(root.href))
      throw new Error(`Runtime import outside project: ${url.href}`);
    const path = url.href.slice(root.href.length);
    if (seen.has(path)) return;
    seen.add(path);
    const source = await readFile(url, "utf8");
    const imports = source.matchAll(/(?:\bfrom\s*|\bimport\s*(?:\(\s*)?)["'](\.[^"']+)["']/g);
    for (const [, specifier] of imports) await visit(new URL(specifier, url));
  }
  await visit(new URL("src/entry.js", root));
  await visit(new URL("src/privacy-page.js", root));
  await visit(new URL("src/pixel/main.js", root));
  return [...seen].sort();
}
