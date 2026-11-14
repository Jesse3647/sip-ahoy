import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
const artwork = JSON.parse(
  readFileSync("src/data/ship-artwork.json", "utf8"),
) as Record<string, { file: string }>;

test("photo picker switches trips, restores focus, and persists the choice", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Take a look with sample data" })
    .click();
  const trigger = page.getByRole("button", { name: /^Change sailing:/ });
  await expect(trigger.locator("img")).toHaveJSProperty("naturalWidth", 800);
  await expect(page.locator(".toast")).toHaveCount(0, { timeout: 7000 });
  await page.screenshot({ path: "test-results/sailing-home.png" });
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("dialog", { name: "Your sailings" }),
  ).toBeVisible();
  await expect(
    page.locator(".sailing-option[aria-pressed=true]"),
  ).toContainText("A little Caribbean escape");
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.getByRole("button", { name: "Plan a new sailing" }).click();
  await expect(
    page.getByRole("dialog", { name: "Create sailing", exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Sailing name", { exact: true })
    .fill("Sunsets & sea days");
  await page
    .getByRole("combobox", { name: "Ship", exact: true })
    .selectOption("Odyssey of the Seas");
  await expect(page.locator(".sailing-ship-preview img")).toHaveJSProperty(
    "naturalWidth",
    800,
  );
  await page.getByLabel("First day").fill("2027-02-01");
  await page.getByLabel("Last day").fill("2027-02-08");
  await page
    .getByRole("button", { name: "Create sailing", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(trigger).toContainText("Sunsets & sea days");
  await trigger.click();
  await page
    .getByRole("dialog")
    .evaluate((el) =>
      Promise.all(el.getAnimations().map((animation) => animation.finished)),
    );
  await page.screenshot({ path: "test-results/sailing-picker.png" });
  await page
    .getByRole("button", {
      name: "Select A little Caribbean escape",
      exact: true,
    })
    .click();
  await expect(trigger).toContainText("Wonder of the Seas");
  await page.reload();
  await expect(trigger).toContainText("A little Caribbean escape");
});

test("fleet artwork is cached offline and cards fit small screens", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Take a look with sample data" })
    .click();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  for (const size of [
    { width: 320, height: 568 },
    { width: 390, height: 844 },
    { width: 667, height: 375 },
    { width: 1280, height: 800 },
  ]) {
    await page.setViewportSize(size);
    await page.getByRole("button", { name: /^Change sailing:/ }).click();
    const dialog = page.getByRole("dialog", { name: "Your sailings" });
    expect(
      await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth),
    ).toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(dialog.locator("img")).toHaveJSProperty("naturalWidth", 800);
    await page.keyboard.press("Escape");
  }
  const decoded = await page.evaluate(
    async (files) =>
      Promise.all(
        files.map(async (file) => {
          const image = new Image();
          image.src = `/ships/${file}`;
          await image.decode();
          return image.naturalWidth;
        }),
      ),
    Object.values(artwork).map((a) => a.file),
  );
  expect(decoded).toHaveLength(31);
  expect(decoded.every((width) => width === 800)).toBe(true);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "New sailing", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Ship", exact: true })
    .selectOption("Hero of the Seas");
  await expect(page.locator(".sailing-ship-preview img")).toHaveJSProperty(
    "naturalWidth",
    800,
  );
  await page
    .getByRole("dialog")
    .evaluate((el) =>
      Promise.all(el.getAnimations().map((animation) => animation.finished)),
    );
  await page.screenshot({ path: "test-results/sailing-setup.png" });
});
