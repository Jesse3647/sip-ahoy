import { navigate, openLog, openBackups } from "./navigation";
import { test, expect, type Page } from "@playwright/test";
import { backup, demoData, type Data } from "../../src/model";

async function restore(page: Page, data: Data) {
  await openBackups(page);
  await page.getByLabel("Choose JSON backup").setInputFiles({
    name: "characters.json",
    mimeType: "application/json",
    buffer: Buffer.from(backup(data)),
  });
  await page
    .getByRole("button", {
      name: "Replace journal with this backup",
      exact: true,
    })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
}

test("each sailor keeps an independent character through reload, backup restore, and offline use", async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const fixture = demoData();
  await restore(page, fixture);
  await expect(
    page.getByRole("button", { name: /Pause animations|Play animations/ }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Change character", exact: true })
    .click();
  await expect(page.getByRole("radio")).toHaveCount(6);
  await page
    .getByRole("radio", { name: "Pearl, Seahorse", exact: true })
    .check();
  expect(
    await page
      .getByRole("dialog")
      .evaluate((el) => el.scrollWidth <= el.clientWidth),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/sailor-character-picker.png",
    animations: "disabled",
  });
  await page
    .getByRole("button", { name: "Save traveler", exact: true })
    .click();
  await expect(page.locator(".hero-art .character-portrait")).toHaveAttribute(
    "data-character",
    "pearl",
  );
  await expect(
    page
      .getByRole("button", { name: "Show Sam's character", exact: true })
      .locator(".character-portrait"),
  ).toHaveAttribute("data-character", "pip");
  await page.reload();
  await expect(page.locator(".hero-art .character-portrait")).toHaveAttribute(
    "data-character",
    "pearl",
  );
  await openBackups(page);
  const downloadEvent = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export full JSON backup", exact: true })
    .click();
  const download = await downloadEvent;
  const path = (await download.path())!;
  const { readFile } = await import("node:fs/promises");
  const exported = JSON.parse(await readFile(path, "utf8"));
  expect(exported.version).toBe(6);
  expect(
    exported.data.travelers.find((t: { name: string }) => t.name === "Alex")
      .characterId,
  ).toBe("pearl");
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page
    .getByRole("button", { name: "Change character", exact: true })
    .click();
  await page.getByRole("radio", { name: "Finn, Dolphin", exact: true }).check();
  await page
    .getByRole("button", { name: "Save traveler", exact: true })
    .click();
  await restore(page, exported.data);
  await expect(page.locator(".hero-art .character-portrait")).toHaveAttribute(
    "data-character",
    "pearl",
  );
  await page
    .getByRole("button", { name: "Show Sam's character", exact: true })
    .click();
  await expect(page.locator(".hero-art .character-portrait")).toHaveAttribute(
    "data-character",
    "pip",
  );
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await context.setOffline(true);
  await page.reload();
  await page
    .getByRole("button", { name: "Change character", exact: true })
    .click();
  const loaded = await page
    .locator(".character-options .character-portrait")
    .evaluateAll(async (elements) =>
      Promise.all(
        elements.map(async (el) => {
          const image = new Image();
          image.src = getComputedStyle(el).backgroundImage.slice(5, -2);
          await image.decode();
          return image.naturalWidth === 768;
        }),
      ),
    );
  expect(loaded).toEqual([true, true, true, true, true, true]);
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await navigate(page, "Sailing & crew");
  await page.getByRole("button", { name: "Add traveler", exact: true }).click();
  await expect(page.getByLabel("Traveler name")).toHaveValue("");
  // The suggested character is the first unused one, independent of the package template.
  await expect(
    page.getByRole("radio", { name: "Skipper, Octopus captain", exact: true }),
  ).toBeChecked();
});

test("daily reactions update per sailor after saves and removals without leaking between days", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const fixture = demoData();
  const sailor = fixture.travelers[0];
  const day = fixture.sailings[0].start;
  const cocktail = fixture.entries.find((e) => e.category === "Cocktail")!;
  fixture.entries = Array.from({ length: 4 }, (_, i) => ({
    ...cocktail,
    id: `daily-${i}`,
    travelerId: sailor.id,
    sailingId: sailor.sailingId,
    sailingDate: day,
  }));
  await restore(page, fixture);
  await page.getByLabel("Character day", { exact: true }).fill(day);
  const alex = page.getByRole("button", {
    name: "Show Alex's character",
    exact: true,
  });
  const sam = page.getByRole("button", {
    name: "Show Sam's character",
    exact: true,
  });
  await expect(alex.locator(".character-portrait")).toHaveAttribute(
    "data-mood",
    "merry",
  );
  await expect(sam.locator(".character-portrait")).toHaveAttribute(
    "data-mood",
    "ready",
  );
  await openLog(page);
  await expect(
    page.getByRole("dialog", { name: "Log a drink", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "For whom?", exact: true })
    .selectOption(sailor.id);
  await page
    .getByRole("searchbox", { name: "Search drinks", exact: true })
    .fill("Piña Colada");
  await page
    .getByRole("button", { name: "Select Piña Colada", exact: true })
    .click();
  await page.getByLabel("Date", { exact: true }).fill(day);
  await page.getByRole("button", { name: "Save drink", exact: true }).click();
  await expect(
    page.locator(".celebration-card .character-portrait"),
  ).toHaveAttribute("data-character", "skipper");
  await expect(
    page.locator(".celebration-card .character-portrait"),
  ).toHaveAttribute("data-mood", "water");
  await expect(page.locator(".celebration-particles")).toBeHidden();
  await expect(alex.locator(".character-portrait")).toHaveAttribute(
    "data-mood",
    "water",
  );
  await expect(page.locator(".hero-art .character-portrait")).toHaveAttribute(
    "data-mood",
    "water",
  );
  await page.getByRole("button", { name: "Dismiss celebration" }).click();
  await page.locator(".crew-reactions").screenshot({
    path: "test-results/sailor-daily-reactions.png",
    animations: "disabled",
  });
  await page
    .getByLabel("Character day", { exact: true })
    .fill(fixture.sailings[0].end);
  await expect(alex.locator(".character-portrait")).toHaveAttribute(
    "data-mood",
    "ready",
  );
  await page.getByLabel("Character day", { exact: true }).fill(day);
  await navigate(page, "Drink log");
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: "Delete Piña Colada", exact: true })
    .first()
    .click();
  await navigate(page, "Overview");
  await expect(alex.locator(".character-portrait")).toHaveAttribute(
    "data-mood",
    "merry",
  );
  await expect(sam.locator(".character-portrait")).toHaveAttribute(
    "data-mood",
    "ready",
  );
});
