import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { basename } from "node:path";
import { pixelRuntimeFiles } from "./pixel-runtime.mjs";

const root = new URL("../", import.meta.url);
const dist = new URL("../dist/", import.meta.url);
const packageJson = JSON.parse(
  await readFile(new URL("../package.json", import.meta.url)),
);
const files = [
  "index.html",
  "privacy.html",
  "privacy.css",
  "pixel.html",
  "pixel.css",
  "pixel-ui.css",
  "pixel-apps.css",
  "pixel-theme.css",
  "phone.css",
  "pixel.webmanifest",
  "pixel-offline.json",
  "service-worker.js",
  ".nojekyll",
];

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
for (const file of files)
  await cp(new URL(file, root), new URL(basename(file), dist));
for (const file of (await pixelRuntimeFiles()).filter(path => path.startsWith("src/"))) {
  const target = new URL(file, dist);
  await mkdir(new URL("./", target), { recursive: true });
  await cp(new URL(file, root), target);
}
for (const directory of ["assets"])
  await cp(new URL(`${directory}/`, root), new URL(`${directory}/`, dist), {
    recursive: true,
  });
await writeFile(
  new URL("release.json", dist),
  `${JSON.stringify({ name: packageJson.name, version: packageJson.version, builtAt: new Date().toISOString() }, null, 2)}\n`,
);
console.log(
  `Release ${packageJson.version} built in dist/ without tests or project-only files.`,
);
