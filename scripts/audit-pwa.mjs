import { PIXEL_VERSION, CORE_VERSION } from "../src/pixel/release-notes.js";
import{readFile}from"node:fs/promises";
const pkg=JSON.parse(await readFile(new URL("../package.json",import.meta.url),"utf8")),worker=await readFile(new URL("../service-worker.js",import.meta.url),"utf8"),expected=`star-game-runtime-v${pkg.version}`;
if(!worker.includes(expected))throw new Error(`Service Worker cache 必須與 package version 同步：${expected}`);
if(!worker.includes("url.origin!==self.location.origin"))throw new Error("Service Worker 不應快取第三方來源");
if(!worker.includes("pixel-theme.css"))throw new Error("Service Worker 必須離線提供像素主題樣式");
if(!worker.includes("SKIP_WAITING"))throw new Error("Service Worker 更新必須由玩家明確確認");
console.log(`PWA cache version verified: ${expected}`);

if(pkg.version!==CORE_VERSION)throw new Error("版本紀錄的核心版本必須與 package version 同步");
const pixel=await readFile(new URL("../pixel.html",import.meta.url),"utf8");
if(!pixel.includes(`STARLIGHT DAYS · v${PIXEL_VERSION}</span>`))throw new Error("像素頁預設版號必須與版本紀錄同步");
