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

test("leave the demo, reopen saved trips, and delete inactive, active and final sailings", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Take a look with sample data" })
    .click();
  const menuAction = async (name: string) => {
    await page.getByRole("button", { name: "Open menu", exact: true }).click();
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("button", { name, exact: true })
      .click();
  };
  const create = async (name: string) => {
    await menuAction("New sailing");
    await page.getByLabel("Sailing name", { exact: true }).fill(name);
    await page
      .getByRole("combobox", { name: "Ship", exact: true })
      .selectOption("Wonder of the Seas");
    await page.getByLabel("First day").fill("2027-02-01");
    await page.getByLabel("Last day").fill("2027-02-08");
    await page
      .getByRole("button", { name: "Create sailing", exact: true })
      .click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  };
  await create("My cruise");
  const trigger = page.getByRole("button", { name: /^Change sailing:/ });
  await expect(trigger).toContainText("My cruise");
  await expect(page.locator(".stat").first().locator("strong")).toHaveText("0");
  await menuAction("Your sailings");
  await page
    .getByRole("button", {
      name: "Select A little Caribbean escape",
      exact: true,
    })
    .click();
  await expect(page.locator(".stat").first().locator("strong")).toHaveText(
    "18",
  );
  await page.reload();
  await expect(trigger).toContainText("A little Caribbean escape");
  await menuAction("Your sailings");
  await page
    .getByRole("button", { name: "Select My cruise", exact: true })
    .click();
  await menuAction("Your sailings");
  page.once("dialog", (dialog) => dialog.dismiss());
  await page
    .getByRole("button", {
      name: "Delete A little Caribbean escape",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Select A little Caribbean escape",
      exact: true,
    }),
  ).toBeVisible();
  await page.screenshot({ path: "test-results/manage-sailings.png" });
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", {
      name: "Delete A little Caribbean escape",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Select A little Caribbean escape",
      exact: true,
    }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await expect(trigger).toContainText("My cruise");
  await create("Second cruise");
  await menuAction("Your sailings");
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: "Delete Second cruise", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Select My cruise", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page.reload();
  await expect(trigger).toContainText("My cruise");
  await menuAction("Your sailings");
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: "Delete My cruise", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Create your first sailing" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Create your first sailing" }),
  ).toBeVisible();
});

test("a failed deletion preserves the saved sailing", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Take a look with sample data" })
    .click();
  await page.getByRole("button", { name: /^Change sailing:/ }).click();
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (
      ...args: Parameters<IDBObjectStore["put"]>
    ) {
      if (this.name === "state")
        throw new DOMException("Storage full", "QuotaExceededError");
      return original.apply(this, args);
    };
  });
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", {
      name: "Delete A little Caribbean escape",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Your sailings" }).getByRole("alert"),
  ).toContainText("could not be saved");
  await expect(
    page.getByRole("button", {
      name: "Select A little Caribbean escape",
      exact: true,
    }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: /^Change sailing:/ }),
  ).toContainText("A little Caribbean escape");
});
