// Resolve only usable images; failed requests stay retryable and never authorize a purchase.
const ready = new Set();
export function preloadImage(src) {
  if (ready.has(src)) return Promise.resolve(src);
  return new Promise((resolve) => {
    const image = new Image();
    let settled = false;
    const done = (success) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (success) ready.add(src);
      resolve(success ? src : null);
    };
    const timer = setTimeout(() => done(false), 15000);
    image.onload = () => done(image.naturalWidth > 0);
    image.onerror = () => done(false);
    image.decoding = "async";
    image.src = src;
    if (image.complete) done(image.naturalWidth > 0);
  });
}
export async function swapImageWhenReady(
  element,
  src,
  shouldApply = () => true,
) {
  if (!element) return;
  element
    .closest(".create-avatar-preview,.wardrobe-art")
    ?.classList.add("image-loading");
  const loaded = await preloadImage(src);
  if (loaded && shouldApply()) element.src = src;
  element
    .closest(".create-avatar-preview,.wardrobe-art")
    ?.classList.remove("image-loading");
}
