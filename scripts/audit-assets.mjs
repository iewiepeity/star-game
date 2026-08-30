import { readdir, stat } from "node:fs/promises";
import { join, relative, extname } from "node:path";
const ROOT = new URL("../assets/", import.meta.url),
  WARN_BYTES = 750_000,
  FAIL_BYTES = 2_100_000,
  large = [];
async function walk(dir) {
  for (const name of await readdir(dir)) {
    const path = join(dir, name),
      info = await stat(path);
    if (info.isDirectory()) await walk(path);
    else if (
      [".png", ".jpg", ".jpeg", ".webp", ".avif"].includes(
        extname(name).toLowerCase(),
      ) &&
      info.size > WARN_BYTES
    )
      large.push({ path: relative(ROOT.pathname, path), bytes: info.size });
  }
}
await walk(ROOT.pathname);
large.sort((a, b) => b.bytes - a.bytes);
console.log(
  JSON.stringify(
    { warningBudget: WARN_BYTES, failureBudget: FAIL_BYTES, large },
    null,
    2,
  ),
);
const failures = large.filter((item) => item.bytes > FAIL_BYTES);
if (failures.length)
  throw new Error(
    `${failures.length} 張圖片超過 ${FAIL_BYTES} bytes 的硬性上限`,
  );
