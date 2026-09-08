// VisualViewport.scale is read-only. Change the initial scale slightly so the
// browser actually reapplies it, then restore the original zoomable viewport.
export function createViewportControls(button, panel) {
  const viewport = window.visualViewport;
  const meta = document.querySelector('meta[name="viewport"]');
  const original = meta?.getAttribute("content");
  let resetting = null, previousHeight = 0;

  function sync() {
    const scale = viewport?.scale || 1;
    if (viewport && Math.abs(scale - 1) < 0.02) {
      panel.style?.setProperty("--usable-panel-height", `${Math.max(120, viewport.height - 24)}px`);
      panel.style?.setProperty("--visible-panel-top", `${viewport.offsetTop + 12}px`);
      const editing = document.activeElement?.matches?.("input, textarea, select");
      if (panel.dataset) panel.dataset.keyboard = String(!!editing && viewport.height < window.innerHeight * 0.8);
      if (editing && previousHeight !== viewport.height) window.requestAnimationFrame(() => document.activeElement?.scrollIntoView?.({ block: "nearest" }));
      previousHeight = viewport.height;
    } else {
      panel.style?.removeProperty("--usable-panel-height");
      if (panel.dataset) panel.dataset.keyboard = "false";
    }
    button.hidden = Math.abs(scale - 1) < 0.02;
    const parent = panel.open ? panel : document.body;
    if (button.parentElement !== parent) parent.append(button);
    if (button.hidden) return;
    // Stay reachable even when pinch zoom has panned ordinary fixed controls
    // offscreen. A native dialog requires the shortcut inside its top layer.
    const style = getComputedStyle(button);
    const right = Math.max(12, parseFloat(style.getPropertyValue("--reset-safe-right")) || 0);
    const top = Math.max(12, parseFloat(style.getPropertyValue("--reset-safe-top")) || 0);
    button.style.left = `${viewport.offsetLeft + viewport.width - (button.offsetWidth + right) / scale}px`;
    button.style.top = `${viewport.offsetTop + top / scale}px`;
    button.style.setProperty("--reset-scale", 1 / scale);
  }

  function reset() {
    if (resetting) return resetting;
    document.activeElement?.matches("input, textarea, select") && document.activeElement.blur();
    if (!meta || !viewport || Math.abs(viewport.scale - 1) < 0.02) {
      sync();
      return Promise.resolve(true);
    }
    // Repeating initial-scale=1 can leave the user's current zoom untouched.
    meta.setAttribute("content", "width=device-width, initial-scale=1.0001, minimum-scale=1, maximum-scale=1.0001, viewport-fit=cover");
    resetting = new Promise(resolve => {
      window.setTimeout(() => {
        meta.setAttribute("content", original);
        window.requestAnimationFrame(() => {
          sync();
          resetting = null;
          resolve(Math.abs(viewport.scale - 1) < 0.02);
        });
      }, 300);
    });
    return resetting;
  }

  viewport?.addEventListener("resize", sync);
  viewport?.addEventListener("scroll", sync);
  window.addEventListener("resize", sync);
  panel.addEventListener("close", sync);
  sync();
  return { sync, reset };
}
