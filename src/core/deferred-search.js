const pending = new Map();

export function bindDeferredSearch(selector, update, commit, { delay = 200 } = {}) {
  const input = document.querySelector(selector);
  if (!input) return;
  let skipCommittedInput = false;
  const key = input.dataset.focusKey || selector;
  const cancelPending = () => {
    const timer = pending.get(key);
    if (timer) clearTimeout(timer);
    pending.delete(key);
  };
  const value = () => input.value.trimStart().slice(0, 200);
  const apply = () => {
    cancelPending();
    update(value());
    commit();
  };
  const schedule = () => {
    cancelPending();
    pending.set(key, setTimeout(apply, delay));
  };

  input.addEventListener("compositionstart", cancelPending);
  input.addEventListener("compositionend", () => {
    skipCommittedInput = true;
    apply();
  });
  input.addEventListener("input", (event) => {
    update(value());
    if (skipCommittedInput) {
      skipCommittedInput = false;
      return;
    }
    if (!event.isComposing) schedule();
  });
  input.addEventListener("blur", () => {
    if (pending.has(key)) apply();
  });
}
