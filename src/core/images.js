// 先在畫面外完成下載與解碼，再切換整張立繪。這能保留舊畫面直到新圖可用，避免慢速裝置出現白屏。
const ready=new Set();

export function preloadImage(src){
 if(ready.has(src))return Promise.resolve(src);
 return new Promise(resolve=>{const image=new Image();let settled=false;const done=()=>{if(settled)return;settled=true;ready.add(src);resolve(src)};image.onload=done;image.onerror=done;image.decoding="async";image.src=src;if(image.complete)done()});
}

export async function swapImageWhenReady(element,src,shouldApply=()=>true){
 if(!element)return;
 element.closest(".create-avatar-preview,.wardrobe-art")?.classList.add("image-loading");
 await preloadImage(src);
 if(shouldApply())element.src=src;
 element.closest(".create-avatar-preview,.wardrobe-art")?.classList.remove("image-loading");
}
