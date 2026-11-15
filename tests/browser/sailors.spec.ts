import { test, expect, type Page } from "@playwright/test";
import { navigate } from "./navigation";
async function start(page: Page) {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Take a look with sample data" })
    .click();
  await navigate(page, "Sailing & crew");
}
async function edit(page: Page, name: string) {
  await page
    .locator(".crew-card")
    .filter({ has: page.getByRole("heading", { name, exact: true }) })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Edit sailor", exact: true }),
  ).toBeVisible();
}
test("sailor wording, deletion cancellation, persistence, and replacing the final sailor", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await start(page);
  await expect(
    page.getByRole("heading", { name: "Sailors", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Live six-hour reactions, not an intoxication estimate.", {
      exact: true,
    }),
  ).toHaveCount(0);
  await expect(page.locator(".content")).not.toContainText(/\btravelers?\b/i);
  await edit(page, "Alex");
  page.once("dialog", (dialog) => dialog.dismiss());
  await page
    .getByRole("button", { name: "Delete sailor", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Edit sailor", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".crew-card")).toHaveCount(2);
  await page.screenshot({ path: "test-results/delete-sailor.png" });
  page.once("dialog", async (dialog) => {
    expect(dialog.message()).toContain("9 drink logs");
    await dialog.accept();
  });
  await page
    .getByRole("button", { name: "Delete sailor", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".crew-card")).toHaveCount(1);
  await navigate(page, "Overview");
  await expect(page.locator(".stat").first().locator("strong")).toHaveText("9");
  await expect(page.locator(".sailor-closeup")).toHaveAccessibleName(/Sam/);
  await page.reload();
  await navigate(page, "Sailing & crew");
  await expect(page.locator(".crew-card")).toHaveCount(1);
  await edit(page, "Sam");
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: "Delete sailor", exact: true })
    .click();
  await expect(page.locator(".crew-card")).toHaveCount(0);
  await page.getByRole("button", { name: "Add sailor", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Delete sailor", exact: true }),
  ).toHaveCount(0);
  await page.getByLabel("Sailor name", { exact: true }).fill("Jesse");
  await page.getByRole("button", { name: "Save sailor", exact: true }).click();
  await expect(page.locator(".crew-card")).toHaveCount(1);
  await navigate(page, "Overview");
  await expect(page.locator(".stat").first().locator("strong")).toHaveText("0");
  await expect(page.locator(".sailor-closeup")).toHaveAccessibleName(/Jesse/);
});
test("a failed sailor deletion keeps the edit dialog, sailor and their logs", async ({
  page,
}) => {
  await start(page);
  await edit(page, "Alex");
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (
      ...args: Parameters<IDBObjectStore["put"]>
    ) {
      if (this.name === "state")
        throw new DOMException("Full", "QuotaExceededError");
      return original.apply(this, args);
    };
  });
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: "Delete sailor", exact: true })
    .click();
  await expect(
    page
      .getByRole("dialog", { name: "Edit sailor", exact: true })
      .getByRole("alert"),
  ).toContainText("could not be saved");
  await expect(page.getByLabel("Sailor name", { exact: true })).toHaveValue(
    "Alex",
  );
  await page.reload();
  await navigate(page, "Sailing & crew");
  await expect(page.locator(".crew-card")).toHaveCount(2);
  await navigate(page, "Overview");
  await expect(page.locator(".stat").first().locator("strong")).toHaveText(
    "18",
  );
});
