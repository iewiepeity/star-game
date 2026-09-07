const CACHE="star-game-runtime-v1.43.0";
const AUDIO_SHELL=["tap","open","close","back","confirm","schedule","warning","reward","message","paper","scroll","select","switch","tick"].map(name=>`./assets/audio/kenney-interface/${name}.ogg`);
const SHELL=["./pixel.html","./pixel.css","./pixel-ui.css","./pixel-apps.css","./pixel-theme.css","./phone.css","./assets/fonts/Cubic_11.woff2","./pixel.webmanifest","./pixel-offline.json","./","./index.html","./src/entry.js","./assets/city/starwish-city-soft.jpg","./assets/rookie-room.webp","./assets/icons/app-icon.svg","./assets/icons/favicon-32.png","./assets/icons/apple-touch-icon.png","./assets/icons/icon-192.webp","./assets/icons/icon-512.webp",...AUDIO_SHELL];
self.addEventListener("install",event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL))));
self.addEventListener("activate",event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith("star-game-runtime-")&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener("message",event=>{if(event.data?.type==="SKIP_WAITING")self.skipWaiting()});
async function networkFirst(request){const cache=await caches.open(CACHE);try{const response=await fetch(request);if(response?.ok)cache.put(request,response.clone());return response}catch{const cached=await cache.match(request,{ignoreSearch:true});if(cached)return cached;if(request.mode==="navigate")return cache.match(new URL(request.url).pathname.endsWith("pixel.html")?"./pixel.html":"./index.html");throw new Error("offline")}}
async function staleWhileRevalidate(request,event){const cache=await caches.open(CACHE),cached=await cache.match(request),refresh=fetch(request).then(async response=>{if(response?.ok)await cache.put(request,response.clone());return response}).catch(()=>null);if(cached){event.waitUntil(refresh);return cached}const response=await refresh;if(response)return response;throw new Error("offline")}
function isCacheable(request,url){
 if(request.method!=="GET"||url.origin!==self.location.origin||request.headers.has("authorization"))return false;
 if(url.pathname.startsWith("/api/")||url.pathname.startsWith("/auth/"))return false;
 return request.mode==="navigate"||["script","style","image","audio","font","manifest"].includes(request.destination)||url.pathname.includes("/assets/")||url.pathname.endsWith(".json");
}
self.addEventListener("fetch",event=>{const url=new URL(event.request.url);if(!isCacheable(event.request,url))return;const dynamic=event.request.mode==="navigate"||["script","style"].includes(event.request.destination)||url.pathname.endsWith(".json");event.respondWith(dynamic?networkFirst(event.request):staleWhileRevalidate(event.request,event))});

let pixelDownload=null;
async function cachePixelWorld(source) {
 const cache=await caches.open(CACHE);
 const manifest=await fetch("./pixel-offline.json",{cache:"no-cache"}).then(r=>{if(!r.ok)throw new Error("manifest");return r.json();});
 const entries=manifest.entries.filter(e=>new URL(e.url,self.registration.scope).origin===self.location.origin);
 let done=0,index=0,failures=0;
 const report=(finished=false)=>source?.postMessage({type:"PIXEL_OFFLINE_PROGRESS",percent:Math.round(done/entries.length*100),done:finished,message:finished?(failures?`有 ${failures} 個檔案尚未準備完成，請連線後重試。`:"完整離線內容已準備好，可以離線遊玩。"):`準備離線內容 ${done} / ${entries.length}`});
 await Promise.all(Array.from({length:4},async()=>{
  while(index<entries.length){const entry=entries[index++];try{if(!await cache.match(entry.url)){const response=await fetch(entry.url);if(!response.ok)throw new Error("asset");await cache.put(entry.url,response);}}catch{failures++;}done++;if(done%10===0)report();}
 }));
 if(!failures)await cache.put("./pixel-offline-ready",new self.Response(manifest.version));
 report(true);
}
self.addEventListener("message",event=>{
 if(event.data?.type!=="PIXEL_CACHE_ALL")return;
 if(!pixelDownload)pixelDownload=cachePixelWorld(event.source).catch(()=>event.source?.postMessage({type:"PIXEL_OFFLINE_PROGRESS",percent:0,done:true,message:"離線內容未完成，請確認連線與儲存空間後重試。"})).finally(()=>{pixelDownload=null;});
 event.waitUntil(pixelDownload);
});
