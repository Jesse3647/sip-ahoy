import { test, expect } from "@playwright/test";
import { navigate, openLog } from "./navigation";

test("clear buttons reset each search, keep filters and input focus, and never submit a log", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Take a look with sample data" })
    .click();
  await navigate(page, "Drink log");
  const logSearch = page.getByRole("searchbox", {
    name: "Search drink log",
    exact: true,
  });
  await logSearch.fill("zzzz-no-match");
  await expect(page.locator(".log-row")).toHaveCount(0);
  await expect(logSearch).toHaveCSS("outline-style", "none");
  await page
    .locator(".log-toolbar .search")
    .screenshot({ path: "test-results/search-clear.png" });
  await page.getByRole("button", { name: "Clear search", exact: true }).click();
  await expect(logSearch).toHaveValue("");
  await expect(logSearch).toBeFocused();
  await expect(page.locator(".log-row")).toHaveCount(18);
  for (const [destination, label, cards] of [
    ["Menus & prices", "Search ship menu", ".menu-item"],
    ["Drink passport", "Search drink passport", ".passport-stamp"],
  ]) {
    await navigate(page, destination);
    await page
      .getByLabel("Catalog category", { exact: true })
      .selectOption("Cocktail");
    const search = page.getByRole("searchbox", { name: label, exact: true });
    await search.fill("zzzz-no-match");
    await expect(page.locator(cards)).toHaveCount(0);
    await page
      .getByRole("button", {
        name: "Clear search",
        exact: true,
      })
      .click();
    await expect(search).toHaveValue("");
    await expect(search).toBeFocused();
    await expect(
      page.getByLabel("Catalog category", { exact: true }),
    ).toHaveValue("Cocktail");
    expect(await page.locator(cards).count()).toBeGreaterThan(0);
  }
  await openLog(page);
  const dialog = page.getByRole("dialog", { name: "Log a drink", exact: true });
  const picker = dialog.getByRole("searchbox", {
    name: "Search drinks",
    exact: true,
  });
  await picker.fill("zzzz-no-match");
  await dialog
    .getByRole("button", { name: "Clear search", exact: true })
    .click();
  await expect(picker).toHaveValue("");
  await expect(picker).toBeFocused();
  await expect(dialog.locator(".drink-browser")).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "Save drink", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await navigate(page, "Drink log");
  await expect(page.locator(".log-row")).toHaveCount(18);
});
