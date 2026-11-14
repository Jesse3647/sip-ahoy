import { test, expect, type Page } from "@playwright/test";

test("drink descriptions are editable, searchable, backed up, and available offline", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Take a look with sample data" })
    .click();
  await page
    .getByRole("button", { name: "Menus & prices", exact: true })
    .click();
  await page.getByLabel("Search ship menu").fill("Piña Colada");
  const card = page.locator(".menu-item").filter({
    has: page.getByRole("heading", { name: "Piña Colada", exact: true }),
  });
  await expect(card.locator(".drink-description")).toContainText("pineapple");
  await card.click();
  await expect(
    page.getByLabel("Description (optional)", { exact: true }),
  ).toHaveValue("Frozen rum drink with pineapple and coconut cream.");
  await expect(
    page.getByRole("link", { name: "Reference description source" }),
  ).toHaveAttribute(
    "href",
    "https://www.royalcaribbean.com/guides/caribbean-drinks",
  );
  await page
    .getByRole("button", { name: "Save menu drink", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  // An unchanged reference must not become a local override just because a price editor was opened.
  const readExport = async () => {
    await page
      .getByRole("button", { name: "Backups and exports", exact: true })
      .click();
    const downloadPromise = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Export full JSON backup", exact: true })
      .click();
    const download = await downloadPromise;
    const fs = await import("node:fs/promises");
    const data = JSON.parse(
      await fs.readFile((await download.path())!, "utf8"),
    );
    await page
      .getByRole("button", { name: "Close dialog", exact: true })
      .click();
    return data;
  };
  const unchanged = await readExport();
  expect(
    unchanged.data.drinks.find(
      (d: { name: string }) => d.name === "Piña Colada",
    ).description,
  ).toBeUndefined();

  await card.click();
  const custom =
    "Silky coconut and pineapple with rum; ask for less sweetness.";
  await page.getByLabel("Description (optional)", { exact: true }).fill(custom);
  await page
    .getByRole("button", { name: "Save menu drink", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByLabel("Search ship menu").fill("Silky");
  await expect(card.locator(".drink-description")).toHaveText(custom);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "test-results/descriptions-mobile.png" });
  await page
    .getByRole("button", { name: "Drink passport", exact: true })
    .click();
  await page.getByLabel("Search drink passport").fill("Silky");
  await expect(page.locator(".passport-stamp")).toHaveCount(1);
  await expect(page.locator(".passport-stamp .drink-description")).toHaveText(
    custom,
  );
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect(
    page.getByRole("heading", {
      name: "A little Caribbean escape",
      exact: true,
    }),
  ).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await page.getByRole("button", { name: "Log a drink", exact: true }).click();
  await page
    .getByRole("searchbox", { name: "Search drinks", exact: true })
    .fill("Silky");
  await expect(
    page.getByRole("button", { name: "Select Piña Colada", exact: true }),
  ).toContainText(custom);
  await page
    .getByRole("button", { name: "Select Piña Colada", exact: true })
    .click();
  await expect(page.locator(".selected-drink .drink-description")).toHaveText(
    custom,
  );
  await page.getByRole("button", { name: "Save drink", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const exported = await readExport();
  expect(exported.version).toBe(5);
  expect(
    exported.data.drinks.find((d: { name: string }) => d.name === "Piña Colada")
      .description,
  ).toBe(custom);
});

test("search fields stay usable across pages and screen sizes", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Take a look with sample data" })
    .click();
  for (const width of [1440, 900, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const [tab, label] of [
      ["Drink log", "Search drink log"],
      ["Menus & prices", "Search ship menu"],
      ["Drink passport", "Search drink passport"],
    ]) {
      await page.getByRole("button", { name: tab, exact: true }).click();
      const input = page.getByLabel(label, { exact: true });
      await expect(input).toBeVisible();
      const sizes = await input.evaluate((element) => {
        const field = element.getBoundingClientRect();
        const wrapper = element.closest(".search")!.getBoundingClientRect();
        const toolbar = element.closest(".toolbar")!.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
          field: field.width,
          height: field.height,
          wrapper: wrapper.width,
          toolbar: toolbar.width,
          border: style.borderLeftWidth,
          background: style.backgroundColor,
          right: toolbar.right,
          viewport: document.documentElement.clientWidth,
        };
      });
      expect(sizes.field).toBeGreaterThan(width <= 700 ? 160 : 250);
      expect(sizes.height).toBeGreaterThanOrEqual(44);
      expect(sizes.wrapper / sizes.toolbar).toBeGreaterThan(
        width <= 700 ? 0.95 : 0.45,
      );
      expect(sizes.border).toBe("0px");
      expect(sizes.background).toBe("rgba(0, 0, 0, 0)");
      expect(sizes.right).toBeLessThanOrEqual(sizes.viewport);
      if (tab === "Menus & prices" && [1440, 390].includes(width)) {
        await page.screenshot({
          path: `test-results/search-${width}.png`,
          fullPage: true,
        });
      }
    }
    await page
      .getByRole("button", { name: "Log a drink", exact: true })
      .click();
    const picker = page.getByRole("searchbox", {
      name: "Search drinks",
      exact: true,
    });
    const pickerBounds = await picker.boundingBox();
    expect(pickerBounds!.width).toBeGreaterThan(120);
    await picker.fill("Colada");
    await expect(
      page.getByRole("button", { name: "Select Piña Colada", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Close dialog", exact: true })
      .click();
  }
});

async function selectDrink(page: Page, name: string) {
  await page
    .getByRole("searchbox", { name: "Search drinks", exact: true })
    .fill(name);
  await page
    .getByRole("button", { name: `Select ${name}`, exact: true })
    .click();
}
test("setup, venue prices, package cap, logging, backups, and offline persistence", async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByRole("button", { name: "Create your first sailing" }).click();
  await page.getByLabel("Sailing name", { exact: true }).fill("Caribbean week");
  await page
    .getByRole("combobox", { name: "Ship", exact: true })
    .selectOption("Wonder of the Seas");
  await expect(
    page.getByRole("combobox", { name: "Ship", exact: true }),
  ).toHaveValue("Wonder of the Seas");
  await page.getByLabel("First day").fill("2026-11-14");
  await page.getByLabel("Last day").fill("2026-11-20");
  await page
    .getByRole("button", { name: "Create sailing", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Caribbean week", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Sailing & crew", exact: true })
    .click();
  await page.getByRole("button", { name: "Edit sailing", exact: true }).click();
  await expect(
    page.getByRole("combobox", { name: "Ship", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Save sailing", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Overview", exact: true }).click();
  await page.getByRole("button", { name: "Add traveler", exact: true }).click();
  await page.getByLabel("Traveler name").fill("Jesse");
  await page.getByLabel("This traveler has a drink package").check();
  await page.getByLabel("Package cost per day").fill("60");
  await page.getByLabel("Days charged").fill("7");
  await page.getByLabel("Gratuities in this price?").selectOption("included");
  await page.getByLabel("Maximum covered per drink").fill("12");
  await page.getByRole("button", { name: "Save traveler" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Menus & prices", exact: true })
    .click();
  await page.getByLabel("Search ship menu").fill("Piña Colada");
  await page
    .getByRole("button", { name: /Piña Colada.*Default price/ })
    .click();
  await page.getByLabel("Default price").fill("15");
  await page.getByLabel("Pool Bar · USD", { exact: true }).fill("17");
  await page.getByRole("button", { name: "Save menu drink" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Log a drink", exact: true }).click();
  await expect(page.locator(".selected-drink")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Save drink", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByLabel("Menu price · USD", { exact: true }),
  ).toHaveValue("");
  await selectDrink(page, "Piña Colada");
  await expect(
    page.getByLabel("Menu price · USD", { exact: true }),
  ).toHaveValue("17.00");
  await expect(page.getByLabel("Covered by package")).toHaveValue("12.00");
  await page.getByLabel("Date", { exact: true }).fill("2026-11-14");
  await page.getByText("Coverage & notes (optional)", { exact: true }).click();
  await page.getByLabel("Notes (optional)").fill("First sip at sea");
  await page.getByRole("button", { name: "Save drink" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Overview", exact: true }).click();
  await expect(page.locator(".stat").nth(1)).toContainText("$17.00");
  await expect(page.locator(".package-numbers")).toContainText(
    "$408.00 to break even",
  );
  await page.getByRole("button", { name: "Drink log", exact: true }).click();
  await page.getByRole("button", { name: /Piña Colada Jesse/ }).click();
  await page.getByLabel("Menu price · USD", { exact: true }).fill("18");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".log-price")).toContainText("$18.00");
  await page
    .getByRole("button", { name: "Backups and exports", exact: true })
    .click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export full JSON backup" }).click();
  const backup = await download;
  const path = await backup.path();
  expect(path).toBeTruthy();
  await page.getByLabel("Choose JSON backup").setInputFiles({
    name: "invalid.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"version":99}'),
  });
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "invalid",
  );
  await page.getByLabel("Choose JSON backup").setInputFiles(path!);
  await expect(page.getByText("Backup ready to restore")).toBeVisible();
  await page
    .getByRole("button", { name: "Replace journal with this backup" })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  // The first installed worker controls the next navigation.
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator(".log-price")).toContainText("$18.00");
  await expect(page.getByText("Offline", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Log a drink", exact: true }).click();
  await expect(page.locator(".selected-drink")).toHaveCount(0);
  await selectDrink(page, "Piña Colada");
  await page.getByLabel("Date", { exact: true }).fill("2026-11-14");
  await page.getByRole("button", { name: "Save drink" }).click();
  await expect(page.locator(".log-row")).toHaveCount(2);
  await page.reload();
  await page.getByRole("button", { name: "Drink log", exact: true }).click();
  await expect(page.locator(".log-row")).toHaveCount(2);
  await page
    .getByRole("button", { name: "Repeat Piña Colada", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "Save drink" }).click();
  await expect(page.locator(".log-row")).toHaveCount(3);
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: "Delete Piña Colada", exact: true })
    .first()
    .click();
  await expect(page.locator(".log-row")).toHaveCount(2);
  expect(errors).toEqual([]);
});
test("sample dashboard and mobile layouts stay usable", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Take a look with sample data" })
    .click();
  await expect(
    page.getByRole("heading", { name: "A little Caribbean escape" }),
  ).toBeVisible();
  await page.getByRole("status").waitFor({ state: "hidden" });
  await page.screenshot({
    path: "test-results/sipahoy-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole("button", { name: "Log a drink", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/sipahoy-mobile.png",
    fullPage: true,
  });
  for (const section of [
    "Drink log",
    "Drink passport",
    "Menus & prices",
    "Sailing & crew",
  ]) {
    await page.getByRole("button", { name: section, exact: true }).click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.getByRole("button", { name: "Add traveler", exact: true }).click();
  await page.getByLabel("Traveler name").fill("Guest");
  await page.getByRole("button", { name: "Save traveler" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Guest", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "New sailing" }).click();
  await page
    .getByLabel("Sailing name", { exact: true })
    .fill("Another adventure");
  await page
    .getByRole("combobox", { name: "Ship", exact: true })
    .selectOption("Wonder of the Seas");
  await page.getByLabel("First day").fill("2027-01-01");
  await page.getByLabel("Last day").fill("2027-01-07");
  await page
    .getByRole("button", { name: "Create sailing", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Menus & prices", exact: true })
    .click();
  await page.getByLabel("Search ship menu").fill("Piña Colada");
  await expect(page.locator(".menu-item")).toHaveCount(1);
  await page.getByLabel("Active sailing").selectOption({ index: 0 });
});

test("daily and trip bundles show separate paid and drink-only totals, including unknown extras", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Take a look with sample data" })
    .click();
  await page
    .getByRole("button", { name: "Sailing & crew", exact: true })
    .click();
  await page
    .getByRole("button")
    .filter({ has: page.getByRole("heading", { name: "Alex", exact: true }) })
    .click();
  await expect(page.getByLabel("Days charged")).toHaveValue("7");
  await page.getByLabel("Package cost per day").fill("80");
  await page.getByLabel("Days charged").fill("6");
  await page.getByLabel("Gratuities in this price?").selectOption("percent");
  await page.getByLabel("Gratuity percentage").fill("18");
  await page
    .getByRole("button", { name: "Beach Club admission", exact: true })
    .click();
  await expect(
    page
      .getByLabel("Package cost breakdown")
      .getByText("Not yet known", { exact: true }),
  ).toHaveCount(2);
  await page.getByLabel("Extra 1 non-drink value").fill("100");
  const breakdown = page
    .getByRole("dialog")
    .getByLabel("Package cost breakdown");
  await expect(breakdown).toContainText("$566.40");
  await expect(breakdown).toContainText("$466.40");
  await breakdown.scrollIntoViewIfNeeded();
  await page.screenshot({ path: "test-results/package-pricing.png" });
  await page
    .getByRole("button", { name: "Save traveler", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".package-numbers").first()).toContainText(
    "$378.40 to break even (estimate)",
  );
  await page
    .getByRole("button")
    .filter({ has: page.getByRole("heading", { name: "Alex", exact: true }) })
    .click();
  await page.getByLabel("Price entered as").selectOption("trip");
  await page.getByLabel("Package cost for whole trip").fill("600");
  await page.getByLabel("Gratuities in this price?").selectOption("included");
  await page.getByLabel("Other taxes / fees").fill("10");
  await expect(breakdown).toContainText("$510.00");
  await page
    .getByRole("button", { name: "Save traveler", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.reload();
  await page
    .getByRole("button", { name: "Sailing & crew", exact: true })
    .click();
  await expect(page.locator(".package-numbers").first()).toContainText(
    "$510.00 drink-only cost",
  );
  await page
    .getByRole("button")
    .filter({ has: page.getByRole("heading", { name: "Alex", exact: true }) })
    .click();
  await page.getByLabel("Extra 1 non-drink value").fill("");
  await page
    .getByRole("button", { name: "Save traveler", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".package-numbers").first()).toContainText(
    "Bundled extra value not entered",
  );
  await expect(page.locator(".package-numbers").first()).toContainText(
    "Comparison unavailable",
  );
});

test("community drink search, traveler recents, local price overrides, custom drinks, and offline library", async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page
    .getByRole("button", { name: "Take a look with sample data" })
    .click();
  await page.getByRole("button", { name: "Log a drink", exact: true }).click();
  await page
    .getByRole("searchbox", { name: "Search drinks", exact: true })
    .fill("Toasted Marshmallow");
  await page
    .getByRole("button", {
      name: "Select Toasted Marshmallow Old Fashioned",
      exact: true,
    })
    .click();
  await expect(page.locator(".selected-drink")).toContainText(
    "Toasted Marshmallow Old Fashioned",
  );
  await expect(
    page.getByRole("link", { name: "View menu source" }),
  ).toHaveAttribute("href", /cruiserhacks.com\/ships\/royal-caribbean\/wonder/);
  await page.getByLabel("For whom?").selectOption({ label: "Alex" });
  await page.getByLabel("Where?").selectOption({ label: "Schooner Bar" });
  await expect(
    page.getByLabel("Menu price · USD", { exact: true }),
  ).toHaveValue("14.00");
  await page.getByRole("button", { name: "Save drink", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Log a drink", exact: true }).click();
  await expect(
    page.getByLabel("For whom?").locator("option:checked"),
  ).toHaveText("Alex");
  await expect(page.getByLabel("Where?").locator("option:checked")).toHaveText(
    "Schooner Bar",
  );
  await page
    .getByRole("button", {
      name: "Recent Toasted Marshmallow Old Fashioned",
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: "Save drink", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Menus & prices", exact: true })
    .click();
  await page.getByLabel("Search ship menu").fill("Toasted Marshmallow");
  await page.locator(".menu-item").click();
  await page.getByLabel("Default price · USD", { exact: true }).fill("13.25");
  await page.getByLabel("Schooner Bar · USD", { exact: true }).fill("13.25");
  await page
    .getByRole("button", { name: "Save menu drink", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Log a drink", exact: true }).click();
  await expect(page.locator(".selected-drink")).toHaveCount(0);
  await page
    .getByRole("button", {
      name: "Recent Toasted Marshmallow Old Fashioned",
      exact: true,
    })
    .click();
  await expect(
    page.getByLabel("Menu price · USD", { exact: true }),
  ).toHaveValue("13.25");
  await page
    .getByRole("searchbox", { name: "Search drinks", exact: true })
    .fill("Jesse Sunset Fizz");
  await page
    .getByRole("button", {
      name: "Add “Jesse Sunset Fizz” as a new drink",
      exact: true,
    })
    .click();
  await expect(page.getByLabel("New drink name")).toHaveValue(
    "Jesse Sunset Fizz",
  );
  await page.getByLabel("New drink category").selectOption("Mocktail");
  await page.getByLabel("Menu price · USD", { exact: true }).fill("8.50");
  await page.getByRole("button", { name: "Save drink", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await page.getByRole("button", { name: "Log a drink", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Recent Jesse Sunset Fizz", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("searchbox", { name: "Search drinks", exact: true })
    .fill("Iced Cafe Latte");
  await page
    .getByRole("button", { name: "Select Iced Café Latte", exact: true })
    .click();
  await expect(
    page.getByLabel("Menu price · USD", { exact: true }),
  ).toHaveValue("4.50");
  await expect(
    page.getByRole("link", { name: "View menu source" }),
  ).toHaveAttribute("href", /candidcruisetravel.com/);
  await page.getByLabel("Where?").selectOption({ label: "Other" });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "test-results/sipahoy-drink-picker.png" });
  await page.getByRole("button", { name: "Save drink", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.reload();
  await page.getByRole("button", { name: "Drink log", exact: true }).click();
  await expect(
    page.locator(".log-row").filter({ hasText: "Iced Café Latte" }),
  ).toHaveCount(1);
  await expect(
    page.locator(".log-row").filter({ hasText: "Iced Café Latte" }),
  ).toContainText("Other");
  expect(errors).toEqual([]);
});

test("Chandon aliases collapse in menus and search, and fresh logs never preselect a drink", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Take a look with sample data" })
    .click();
  await page
    .getByRole("button", { name: "Menus & prices", exact: true })
    .click();
  await page.getByLabel("Include community drinks from other ships").check();
  await page.getByLabel("Search ship menu").fill("Chandon");
  await expect(page.locator(".menu-item")).toHaveCount(9);
  await page.getByRole("button", { name: "Log a drink", exact: true }).click();
  await expect(page.locator(".selected-drink")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Save drink", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByLabel("Menu price · USD", { exact: true }),
  ).toHaveValue("");
  await page
    .getByRole("searchbox", { name: "Search drinks", exact: true })
    .fill("Chandon");
  await expect(page.locator(".picker-results button")).toHaveCount(9);
  await page
    .getByRole("button", { name: "Select Chandon Brut Classic", exact: true })
    .click();
  await page.getByRole("button", { name: "Save drink", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Log a drink", exact: true }).click();
  await expect(page.locator(".selected-drink")).toHaveCount(0);
  await expect(
    page.getByRole("button", {
      name: "Recent Chandon Brut Classic",
      exact: true,
    }),
  ).toHaveAttribute("aria-pressed", "false");
  await expect(
    page.getByRole("button", { name: "Save drink", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page.getByRole("button", { name: "Drink log", exact: true }).click();
  await page
    .getByRole("button", { name: "Repeat Chandon Brut Classic", exact: true })
    .click();
  await expect(page.locator(".selected-drink")).toContainText(
    "Chandon Brut Classic",
  );
  await expect(
    page.getByRole("button", { name: "Save drink", exact: true }),
  ).toBeEnabled();
});

test("Bionic Bar is available on Wonder and time is captured on save without a time picker", async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date("2026-11-14T15:00:00.000Z"));
  await page.goto("/");
  await page
    .getByRole("button", { name: "Take a look with sample data" })
    .click();
  await page.getByRole("button", { name: "Log a drink", exact: true }).click();
  await selectDrink(page, "Piña Colada");
  await page.getByLabel("Where?").selectOption({ label: "Bionic Bar" });
  await expect(
    page.locator('input[type="datetime-local"],input[type="time"]'),
  ).toHaveCount(0);
  await page.getByLabel("Date", { exact: true }).fill("2026-11-13");
  await page.clock.setFixedTime(new Date("2026-11-14T15:07:00.000Z"));
  await page.getByRole("button", { name: "Save drink", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const readBackup = async () => {
    await page
      .getByRole("button", { name: "Backups and exports", exact: true })
      .click();
    const pending = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Export full JSON backup", exact: true })
      .click();
    const file = await (await pending).path();
    const { readFile } = await import("node:fs/promises");
    const backup = JSON.parse(await readFile(file!, "utf8"));
    await page
      .getByRole("button", { name: "Close dialog", exact: true })
      .click();
    return backup.data.entries.find(
      (e: { venueName: string }) => e.venueName === "Bionic Bar",
    );
  };
  const logged = await readBackup();
  expect(logged.time).toBe("2026-11-14T15:07:00.000Z");
  expect(logged.createdAt).toBe(logged.time);
  expect(logged.sailingDate).toBe("2026-11-13");
  await page.reload();
  await page.getByRole("button", { name: "Log a drink", exact: true }).click();
  await expect(page.getByLabel("Where?").locator("option:checked")).toHaveText(
    "Bionic Bar",
  );
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page.clock.setFixedTime(new Date("2026-11-14T15:17:00.000Z"));
  await page.getByRole("button", { name: "Drink log", exact: true }).click();
  await page.locator(".log-row").filter({ hasText: "Bionic Bar" }).click();
  await page.getByLabel("Notes (optional)").fill("Updated note");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const edited = await readBackup();
  expect(edited.time).toBe(logged.time);
  expect(edited.createdAt).toBe(logged.createdAt);
  expect(edited.notes).toBe("Updated note");
});

test("drink log combines search with traveler filtering and new travelers inherit independent package settings", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Take a look with sample data" })
    .click();
  await page.getByRole("button", { name: "Drink log", exact: true }).click();
  await expect(page.getByLabel("Search drink log")).toBeVisible();
  await expect(page.locator(".log-row")).toHaveCount(18);
  await page.getByLabel("Filter by traveler").selectOption({ label: "Alex" });
  await expect(page.locator(".log-row")).toHaveCount(9);
  const drinkName = await page.locator(".log-row h3").first().textContent();
  await page.getByLabel("Search drink log").fill(drinkName!);
  await expect(page.locator(".log-row").first()).toContainText(drinkName!);
  expect(await page.locator(".log-row").count()).toBeLessThan(9);
  await page.getByLabel("Search drink log").fill("no matching drink");
  await expect(page.locator(".log-row")).toHaveCount(0);
  await page.getByLabel("Search drink log").fill("");
  await expect(page.locator(".log-row")).toHaveCount(9);
  await page.getByRole("button", { name: "Log a drink", exact: true }).click();
  await expect(
    page.getByRole("searchbox", { name: "Search drinks", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page
    .getByRole("button", { name: "Sailing & crew", exact: true })
    .click();
  await page
    .getByRole("button")
    .filter({ has: page.getByRole("heading", { name: "Sam", exact: true }) })
    .click();
  await page.getByLabel("This traveler has a drink package").check();
  await page.getByLabel("Price entered as").selectOption("trip");
  await page.getByLabel("Package cost for whole trip").fill("600");
  await page.getByLabel("Gratuities in this price?").selectOption("fixed");
  await page.getByLabel("Gratuity total for whole trip").fill("75");
  await page.getByLabel("Other taxes / fees").fill("10");
  await page
    .getByRole("button", { name: "Beach Club admission", exact: true })
    .click();
  await page.getByLabel("Extra 1 non-drink value").fill("100");
  await page.getByLabel("Extra 1 value source").selectOption("receipt");
  await page.getByLabel("Maximum covered per drink").fill("15");
  await page
    .getByRole("button", { name: "Save traveler", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Add traveler", exact: true }).click();
  await expect(page.getByLabel("Traveler name")).toHaveValue("");
  await expect(
    page.getByLabel("This traveler has a drink package"),
  ).toBeChecked();
  await expect(page.getByLabel("Price entered as")).toHaveValue("trip");
  await expect(page.getByLabel("Package cost for whole trip")).toHaveValue(
    "600.00",
  );
  await expect(page.getByLabel("Gratuities in this price?")).toHaveValue(
    "fixed",
  );
  await expect(page.getByLabel("Gratuity total for whole trip")).toHaveValue(
    "75.00",
  );
  await expect(page.getByLabel("Other taxes / fees")).toHaveValue("10.00");
  await expect(page.getByLabel("Extra 1 name")).toHaveValue(
    "Beach Club admission",
  );
  await expect(page.getByLabel("Extra 1 non-drink value")).toHaveValue(
    "100.00",
  );
  await expect(page.getByLabel("Extra 1 value source")).toHaveValue("receipt");
  await expect(page.getByLabel("Maximum covered per drink")).toHaveValue(
    "15.00",
  );
  await page.getByLabel("Traveler name").fill("Jess");
  await page.getByLabel("Package cost for whole trip").fill("650");
  await page.getByLabel("Extra 1 non-drink value").fill("90");
  await page
    .getByRole("button", { name: "Save traveler", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page
    .getByRole("button")
    .filter({ has: page.getByRole("heading", { name: "Sam", exact: true }) })
    .click();
  await expect(page.getByLabel("Package cost for whole trip")).toHaveValue(
    "600.00",
  );
  await expect(page.getByLabel("Extra 1 non-drink value")).toHaveValue(
    "100.00",
  );
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page.getByRole("button", { name: "Add traveler", exact: true }).click();
  await expect(
    page.getByText("Package settings copied from Jess. Edit them as needed.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByLabel("Package cost for whole trip")).toHaveValue(
    "650.00",
  );
  await expect(page.getByLabel("Extra 1 non-drink value")).toHaveValue("90.00");
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page.getByRole("button", { name: "New sailing", exact: true }).click();
  await page.getByLabel("Sailing name", { exact: true }).fill("Separate crew");
  await page
    .getByRole("combobox", { name: "Ship", exact: true })
    .selectOption("Wonder of the Seas");
  await page.getByLabel("First day").fill("2027-01-01");
  await page.getByLabel("Last day").fill("2027-01-07");
  await page
    .getByRole("button", { name: "Create sailing", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Overview", exact: true }).click();
  await page.getByRole("button", { name: "Add traveler", exact: true }).click();
  await expect(page.getByLabel("Traveler name")).toHaveValue("");
  await expect(
    page.getByLabel("This traveler has a drink package"),
  ).not.toBeChecked();
});
