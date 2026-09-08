// Follow the real disclosure UI after settings were grouped; never force-click
// hidden controls or change the application's disclosure state through evaluate.
export async function revealControl(control) {
  const ancestors = control.locator("xpath=ancestor::details");
  for (let i = 0; i < await ancestors.count(); i++) {
    const details = ancestors.nth(i);
    if (await details.getAttribute("open") === null) await details.locator(":scope > summary").click();
  }
}
