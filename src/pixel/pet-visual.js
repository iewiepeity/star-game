// Small original pixel silhouettes, drawn locally; no new remote asset is required.
const CAT = [
  ".aa...aa....",
  ".aaaaaaa....",
  ".aebebaa....",
  "..aaaaa.....",
  "..aaaaaa...a",
  "..aaaaaaa.aa",
  "..aaaaaaa.a.",
  "...aa.aa....",
];
const DOG = [
  ".ccaaaac....",
  ".caaaaac....",
  "..aebea.....",
  "..aabaaa....",
  "..aaaaaaa..a",
  "..aaaaaaa.aa",
  "..aaaaaaa.a.",
  "...aa.aa....",
];
export function drawPet(graphics, kind) {
  const colors = {
    a: kind === "cat" ? 0xcab6a0 : 0xc48a50,
    b: 0x805744,
    c: 0x805744,
    e: 0x302c35,
  };
  graphics.clear();
  (kind === "cat" ? CAT : DOG).forEach((row, y) =>
    [...row].forEach((color, x) => {
      if (colors[color])
        graphics
          .fillStyle(colors[color], 1)
          .fillRect((x - 6) * 2, (y - 8) * 2, 2, 2);
    }),
  );
}
export function petVisible(state) {
  return (
    !!state.life.game.cityLife?.pet &&
    (state.sceneId === "home" ||
      (state.sceneId === "park" &&
        state.life.pending?.assignment.id === "pet_walk"))
  );
}
