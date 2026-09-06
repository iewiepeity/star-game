import { PIXEL_VERSION } from "../src/pixel/release-notes.js";
import {readdir,stat,writeFile} from "node:fs/promises";
const root=new URL("../",import.meta.url);
async function walk(path){const entries=await readdir(new URL(path,root),{withFileTypes:true});return (await Promise.all(entries.map(e=>e.isDirectory()?walk(path+e.name+"/"):[path+e.name]))).flat();}
const paths=["index.html","pixel.html","pixel.css","pixel-ui.css","pixel-apps.css","pixel-theme.css","pixel.webmanifest",...(await walk("src/")).filter(p=>p.endsWith(".js")),...(await walk("assets/")).filter(p=>/\.(webp|jpg|jpeg|png|svg|ogg|js|json|woff2|txt)$/i.test(p))];
const entries=await Promise.all(paths.map(async url=>({url:"./"+url,bytes:(await stat(new URL(url,root))).size})));
await writeFile(new URL("pixel-offline.json",root),JSON.stringify({version:PIXEL_VERSION,bytes:entries.reduce((s,e)=>s+e.bytes,0),entries},null,2)+"\n");
console.log(`Pixel offline manifest: ${entries.length} files, ${Math.round(entries.reduce((s,e)=>s+e.bytes,0)/1024/1024)} MB`);
