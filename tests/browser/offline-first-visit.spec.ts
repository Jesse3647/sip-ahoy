import { test, expect } from "@playwright/test";
import { readdirSync } from "node:fs";

// Unlike a revisit/reload test, this catches first installs that cache files but
// never take control of the page that is already open.
test("a first visit serves every image offline without a reload or viewing it first", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  const files = (readdirSync("public", { recursive: true }) as string[]).filter(
    (path) => /\.(png|svg|jpg|webp)$/.test(path),
  );
  expect(files.length).toBeGreaterThan(50);
  const requested = await page.evaluate(() =>
    performance.getEntriesByType("resource").map((entry) => entry.name),
  );
  expect(
    requested.some((url) => url.includes("/scenes/island-beach.jpg")),
  ).toBe(false);
  expect(requested.some((url) => url.includes("/ships/hero.webp"))).toBe(false);
  await context.setOffline(true);
  const failures = await page.evaluate(async (files) => {
    const failures: string[] = [];
    for (const file of files) {
      try {
        const response = await fetch(new URL(file, location.href));
        if (
          !response.ok ||
          !response.headers.get("content-type")?.startsWith("image/")
        )
          failures.push(file);
      } catch {
        failures.push(file);
      }
    }
    return failures;
  }, files);
  expect(failures).toEqual([]);
  await page.getByRole("button", { name: "Open menu", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "All aboard" })).toContainText(
    "Offline files ready, including all images.",
  );
});
