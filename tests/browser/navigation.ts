import { expect, type Page } from "@playwright/test";

export async function navigate(page: Page, destination: string) {
  await page.getByRole("button", { name: "Open menu", exact: true }).click();
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("button", {
      name: destination === "Overview" ? "Home" : destination,
      exact: true,
    })
    .click();
  await expect(page.getByRole("dialog", { name: "All aboard" })).toHaveCount(0);
}

export async function openLog(page: Page) {
  await page.getByRole("button", { name: "Open menu", exact: true }).click();
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("button", { name: "Log a drink", exact: true })
    .click();
}

export async function openBackups(page: Page) {
  await page.getByRole("button", { name: "Open menu", exact: true }).click();
  await page
    .getByRole("dialog", { name: "All aboard" })
    .getByRole("button", { name: "Backups & exports", exact: true })
    .click();
}
