import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { basename } from "node:path";

const root = new URL("../", import.meta.url);
const dist = new URL("../dist/", import.meta.url);
const packageJson = JSON.parse(
  await readFile(new URL("../package.json", import.meta.url)),
);
const files = [
  "index.html",
  "manifest.webmanifest",
  "service-worker.js",
  ".nojekyll",
  "cascade.css",
  "legacy-foundation.css",
  "legacy-onboarding-settings.css",
  "legacy-career-agency.css",
  "legacy-people-wardrobe.css",
  "legacy-world-social.css",
  "legacy-career-feedback.css",
  "legacy-world-creative.css",
  "legacy-progression.css",
  "legacy-story-gallery.css",
  "legacy-late-passes.css",
  "ui-hardening.css",
  "design-system.css",
  "components-feedback.css",
  "a11y.css",
  "runner-flow.css",
  "audio.css",
];

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
for (const file of files)
  await cp(new URL(file, root), new URL(basename(file), dist));
for (const directory of ["src", "assets"])
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
