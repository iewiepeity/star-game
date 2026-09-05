// Reading position lives on the active event so autosave resumes the same scene.
export function scenePosition(item) {
  const count = item?.event?.beats?.length || 0;
  const raw = Number(item?.sceneIndex) || 0;
  return {
    count,
    index: Math.max(0, Math.min(count - 1, Math.floor(raw))),
    last: count === 0 || raw >= count - 1,
  };
}
export function moveScene(item, delta) {
  if (!item?.event?.beats?.length) return false;
  const position = scenePosition(item),
    index = Math.max(0, Math.min(position.count - 1, position.index + delta));
  if (index === position.index) return false;
  item.sceneIndex = index;
  return true;
}
