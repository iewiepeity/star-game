const CACHE="star-game-v3";
const SHELL=["./","./index.html","./style.css","./src/main.js","./assets/rookie-room.webp","./assets/icons/icon-192.webp","./assets/icons/icon-512.webp","./manifest.webmanifest"];
self.addEventListener("install",event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener("activate",event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",event=>{if(event.request.method!=="GET")return;event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{if(!response||response.status!==200||response.type==="opaque")return response;const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return response}).catch(()=>event.request.mode==="navigate"?caches.match("./index.html"):cached)))});
