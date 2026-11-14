import { navigate, openLog } from "./navigation";
import { test, expect } from "@playwright/test";

test("new drinks and repeats celebrate after saving; edits do not", async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Take a look with sample data" })
    .click();
  await expect(
    page.locator('.sailor-closeup[data-selected="true"] .character-portrait'),
  ).toBeVisible();
  await openLog(page);
  await expect(
    page.getByRole("button", { name: "Save drink", exact: true }),
  ).toBeDisabled();
  await expect(page.locator(".save-celebration")).toHaveCount(0);
  await page
    .getByRole("searchbox", { name: "Search drinks", exact: true })
    .fill("Piña Colada");
  await page
    .getByRole("button", { name: "Select Piña Colada", exact: true })
    .click();
  await page.getByRole("button", { name: "Save drink", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const celebration = page.locator(".save-celebration");
  await expect(celebration.getByRole("status")).toContainText("Drink saved!");
  await expect(celebration.getByRole("status")).toContainText("Piña Colada");
  await expect(page.locator(".stat").first().locator("strong")).toHaveText(
    "19",
  );
  await expect(page.locator(".celebration-card")).toHaveCSS("opacity", "1");
  await page.locator(".celebration-card").evaluate((el) => {
    el.getAnimations({ subtree: true }).forEach((animation) =>
      animation.finish(),
    );
  });
  const portrait = (await page
    .locator(".celebration-card > .character-portrait")
    .boundingBox())!;
  const card = (await page.locator(".celebration-card").boundingBox())!;
  expect(portrait.height).toBeCloseTo(portrait.width, 0);
  expect(portrait.height).toBeGreaterThanOrEqual(80);
  expect(
    Math.abs(portrait.y + portrait.height / 2 - card.y - card.height / 2),
  ).toBeLessThan(2);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.screenshot({
    path: "test-results/skipper-celebration.png",
    animations: "disabled",
  });
  await page.getByRole("button", { name: "Dismiss celebration" }).click();
  await expect(celebration).toHaveCount(0);
  await navigate(page, "Drink log");
  await page.locator(".log-row").first().click();
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(celebration).toHaveCount(0);
  await expect(page.getByRole("status")).toHaveText("Drink updated");
  await page
    .getByRole("button", { name: "Repeat Piña Colada", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "Save drink", exact: true }).click();
  await expect(celebration).toBeVisible();
  // Opening another editor dismisses old feedback; it must not reappear on cancel.
  await openLog(page);
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await expect(celebration).toHaveCount(0);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator(".stat").first().locator("strong")).toHaveText(
    "20",
  );
  expect(
    await page
      .locator('.sailor-closeup[data-selected="true"] .character-portrait')
      .evaluate(async (el) => {
        const image = new Image();
        image.src = getComputedStyle(el).backgroundImage.slice(5, -2);
        await image.decode();
        return image.naturalWidth === 768;
      }),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/skipper-phone.png",
    animations: "disabled",
  });
});

test("failed writes never celebrate and keep the draft open", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Take a look with sample data" })
    .click();
  await openLog(page);
  await page
    .getByRole("searchbox", { name: "Search drinks", exact: true })
    .fill("Piña Colada");
  await page
    .getByRole("button", { name: "Select Piña Colada", exact: true })
    .click();
  await page.evaluate(() => {
    const transaction = IDBDatabase.prototype.transaction;
    IDBDatabase.prototype.transaction = function (names, mode, options) {
      if (mode === "readwrite")
        throw new DOMException("Test storage failure", "QuotaExceededError");
      return transaction.call(this, names, mode, options);
    };
  });
  await page.getByRole("button", { name: "Save drink", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("alert")).toContainText("Test storage failure");
  await expect(page.locator(".save-celebration")).toHaveCount(0);
  await expect(page.locator(".selected-drink strong")).toHaveText(
    "Piña Colada",
  );
});

test("old pause preferences are ignored and system reduced motion still suppresses effects", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("sipahoy-motion", "paused"),
  );
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: /Pause animations|Play animations/ }),
  ).toHaveCount(0);
  await expect(page.locator(".skipper > .character-portrait")).toHaveCSS(
    "animation-name",
    "sailor-greet",
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".skipper > .character-portrait")).toHaveCSS(
    "animation-name",
    "none",
  );
  await page
    .getByRole("button", { name: "Take a look with sample data" })
    .click();
  await openLog(page);
  await page
    .getByRole("searchbox", { name: "Search drinks", exact: true })
    .fill("Piña Colada");
  await page
    .getByRole("button", { name: "Select Piña Colada", exact: true })
    .click();
  await page.getByRole("button", { name: "Save drink", exact: true }).click();
  await expect(page.locator(".celebration-card")).toBeVisible();
  await expect(page.locator(".celebration-card")).toHaveCSS(
    "animation-name",
    "none",
  );
  await expect(page.locator(".celebration-particles")).toBeHidden();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(320);
  await expect(page.locator(".save-celebration")).toHaveCount(0, {
    timeout: 6000,
  });
});
