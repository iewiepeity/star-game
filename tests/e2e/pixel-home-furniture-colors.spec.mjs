import { test, expect } from "@playwright/test";

// Use the shipped illustration: synthetic rectangles cannot catch a tint mask
// crossing its real sheet edge or picking up the sofa's wooden feet.
for (const itemId of ["linen_bed", "blush_bed", "rose_sofa", "blue_sofa"]) {
  test(`${itemId} follows the original fabric without colouring sheets or wood`, async ({ page }) => {
    await page.goto("/assets/pixel/home.png");
    const result = await page.evaluate(async (id) => {
      const { paintHomeFurniture } = await import("/src/pixel/home-furniture.js");
      const { initialHomeLife } = await import("/src/core/home-state.js");
      const source = new Image();
      source.src = "/assets/pixel/home.png";
      await source.decode();
      const slot = id.endsWith("bed") ? "bed" : "sofa";
      const render = (changed) => {
        const canvas = document.createElement("canvas");
        canvas.width = source.width;
        canvas.height = source.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(source, 0, 0);
        const home = initialHomeLife();
        if (changed) home.placedFurniture[slot] = id;
        paintHomeFurniture(ctx, home);
        return ctx.getImageData(0, 0, canvas.width, canvas.height);
      };
      const before = render(false), after = render(true);
      const pixel = (image, x, y) => [...image.data.slice((y * image.width + x) * 4, (y * image.width + x) * 4 + 4)];
      const preserved = slot === "bed"
        ? [[216, 427], [240, 423], [324, 490], [230, 514], [315, 544], [488, 518]]
        : [[1289, 596], [1055, 512], [1354, 560], [1140, 358], [1138, 420], [1270, 473]];
      const fabric = slot === "bed"
        ? [[300, 430], [270, 510], [310, 530], [343, 427]]
        : [[1200, 390], [1330, 530], [1190, 480], [1080, 470]];
      const bounds = slot === "bed" ? [210, 360, 494, 548] : [1048, 357, 1368, 598];
      let changed = 0, changedOutside = 0, changedAlpha = 0;
      for (let p = 0; p < before.data.length; p += 4) {
        const x = (p / 4) % before.width, y = Math.floor(p / 4 / before.width);
        if (before.data[p + 3] !== after.data[p + 3]) changedAlpha++;
        if ([0, 1, 2].some(k => before.data[p + k] !== after.data[p + k])) {
          changed++;
          if (x < bounds[0] || y < bounds[1] || x >= bounds[2] || y >= bounds[3]) changedOutside++;
        }
      }
      return {
        changed, changedOutside, changedAlpha,
        preserved: preserved.map(([x, y]) => ({ before: pixel(before, x, y), after: pixel(after, x, y) })),
        fabric: fabric.map(([x, y]) => ({ before: pixel(before, x, y), after: pixel(after, x, y) })),
      };
    }, itemId);
    expect(result.changed).toBeGreaterThan(20000);
    expect(result.changedOutside).toBe(0);
    expect(result.changedAlpha).toBe(0);
    for (const sample of result.preserved) expect(sample.after).toEqual(sample.before);
    for (const sample of result.fabric) expect(sample.after).not.toEqual(sample.before);
  });
}
