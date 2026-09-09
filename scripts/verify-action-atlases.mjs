// Verify the new art only: every exported crop must match its retained source.
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const sharp = require(require.resolve("sharp", { paths: [process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES || process.cwd(), process.cwd()] }));
const root = new URL("../", import.meta.url);
const manifest = JSON.parse(await readFile(new URL("assets/pixel/actions/manifest.json",root)));
let count = 0;
const hashes = new Set();
for (const sheet of Object.values(manifest.sheets)) {
  const packed = await readFile(new URL(sheet.url,root));
  const size = await sharp(packed).metadata();
  assert.equal(size.width,sheet.width); assert.equal(size.height,sheet.height);
  for (const [name, [left,top,width,height]] of Object.entries(sheet.frames)) {
    const source = sheet.sourceRects[name];
    const bytes = await readFile(new URL(`docs/art/2026-09-09/sources/${source.source}.png`,root));
    assert.equal(createHash('sha256').update(bytes).digest('hex'),source.source.endsWith('-patch') ? sheet.patchSha256 : sheet.sourceSha256);
    const [sx,sy,sw,sh] = source.rect;
    const original = await sharp(bytes).extract({left:sx,top:sy,width:sw,height:sh}).ensureAlpha().raw().toBuffer();
    const exported = await sharp(packed).extract({left,top,width,height}).ensureAlpha().raw().toBuffer();
    assert.deepEqual(exported,original,`${sheet.url}:${name} must be lossless`);
    hashes.add(createHash('sha256').update(exported).digest('hex'));
    count++;
  }
}
assert.equal(count,552); assert.equal(hashes.size,552,'each source frame must be distinct');
console.log(`Verified ${count} unique frames: exact source pixels, source hashes and image bounds.`);
