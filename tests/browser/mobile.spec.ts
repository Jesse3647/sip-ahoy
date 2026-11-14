import { test, expect } from "@playwright/test";
import { navigate } from "./navigation";

test("hamburger navigation, contextual logging, and dialog scroll restoration", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Take a look with sample data" })
    .click();
  await expect(
    page.getByRole("heading", { name: "A little Caribbean escape" }),
  ).toBeVisible();
  await expect(
    page.getByText("Ready for offline", { exact: true }),
  ).toHaveCount(0);
  for (const size of [
    { width: 320, height: 568 },
    { width: 390, height: 844 },
    { width: 667, height: 375 },
    { width: 1280, height: 800 },
  ]) {
    await page.setViewportSize(size);
    for (const name of [
      "Overview",
      "Drink log",
      "Drink passport",
      "Menus & prices",
      "Sailing & crew",
    ]) {
      await navigate(page, name);
      await expect(
        page.getByRole("heading", { name, exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Log a drink", exact: true }),
      ).toHaveCount(name === "Overview" || name === "Drink log" ? 1 : 0);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(size.width);
      await page.getByRole("button", { name: "Open menu" }).click();
      const active = page
        .getByRole("navigation")
        .getByRole("button", {
          name: name === "Overview" ? "Home" : name,
          exact: true,
        });
      await expect(active).toHaveAttribute("aria-current", "page");
      const bounds = await active.boundingBox();
      expect(bounds!.width).toBeGreaterThanOrEqual(44);
      expect(bounds!.height).toBeGreaterThanOrEqual(44);
      await page.getByRole("button", { name: "Close dialog" }).click();
      await expect(
        page.getByRole("button", { name: "Open menu" }),
      ).toBeFocused();
    }
    await navigate(page, "Menus & prices");
    await page.evaluate(() => window.scrollTo(0, 600));
    const scrollBefore = await page.evaluate(() => window.scrollY);
    expect(scrollBefore).toBeGreaterThan(100);
    await page.getByRole("button", { name: "Open menu" }).click();
    await page.keyboard.press("Escape");
    expect(await page.evaluate(() => window.scrollY)).toBe(scrollBefore);
    await page.getByRole("button", { name: "Open menu" }).click();
    await page
      .getByRole("navigation")
      .getByRole("button", { name: "Log a drink", exact: true })
      .click();
    const dialog = page.getByRole("dialog", {
      name: "Log a drink",
      exact: true,
    });
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole("heading", { name: "Log a drink", exact: true }),
    ).toBeFocused();
    expect(await page.evaluate(() => document.body.style.position)).toBe(
      "fixed",
    );
    expect(
      await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth),
    ).toBe(true);
    await page
      .getByRole("searchbox", { name: "Search drinks", exact: true })
      .fill("Colada");
    await page
      .getByRole("button", { name: "Select Piña Colada", exact: true })
      .click();
    const price = page.getByLabel("Menu price · USD", { exact: true });
    expect(
      await price.evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
    ).toBeGreaterThanOrEqual(16);
    await page
      .getByRole("button", { name: "Close dialog", exact: true })
      .click();
    await expect(dialog).toHaveCount(0);
    expect(await page.evaluate(() => window.scrollY)).toBe(scrollBefore);
    await page.getByRole("button", { name: "SipAhoy home" }).click();
    await expect(
      page.getByRole("heading", { name: "Overview", exact: true }),
    ).toBeVisible();
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("status").waitFor({ state: "hidden" });
  await page.screenshot({
    path: "test-results/hamburger-home.png",
    animations: "disabled",
  });
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.getByRole("dialog")).toHaveCSS("opacity", "1");
  await page.screenshot({
    path: "test-results/hamburger-menu.png",
    animations: "disabled",
  });
});

test("reduced motion removes decorative animations and onboarding fits a small phone", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Create a sailing", exact: true }),
  ).toBeVisible();
  expect(
    await page
      .locator(".skipper > .character-portrait")
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(320);
  await page
    .getByRole("button", { name: "Create your first sailing", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  expect(
    await dialog.evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page
    .getByRole("button", { name: "Take a look with sample data" })
    .click();
  expect(
    await page
      .locator(".skipper > .character-portrait")
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");
  expect(
    await page
      .getByRole("status")
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");
});
