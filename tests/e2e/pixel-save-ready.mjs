import { expect } from "@playwright/test";

// Opening a scene does not guarantee its startup save has committed. The
// original page may win with its periodic save while this page loads assets.
// Establish the page the test intends to edit through the same explicit resume
// action a player uses, then wait for its transaction to complete.
export async function resumePixelSave(page) {
  await expect
    .poll(
      async () => {
        if (await page.locator("[data-storage-latest]").isVisible())
          return "conflict";
        return (await page.locator("#save-status").textContent()) === "● 已儲存"
          ? "saved"
          : "pending";
      },
      { timeout: 15000 },
    )
    .not.toBe("pending");
  if (await page.locator("[data-storage-latest]").isVisible())
    await page.locator("[data-storage-latest]").click();
  await expect(page.locator("#save-status")).toHaveText("● 已儲存", {
    timeout: 15000,
  });
}
