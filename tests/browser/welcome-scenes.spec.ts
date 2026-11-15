import { test, expect } from "@playwright/test";
const sceneIds = [
  "pool-deck",
  "piano-lounge",
  "sunset-deck",
  "island-beach",
  "ship-promenade",
  "moonlit-deck",
];
const hour = 3600000;

test("welcome characters fade through the full crew and pause for reduced motion", async ({
  page,
}) => {
  await page.clock.install();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const portrait = page.locator(".skipper > .character-portrait");
  await expect(portrait).toHaveAttribute("data-character", "skipper");
  await page.clock.runFor(100);
  for (const character of [
    "sunny",
    "pip",
    "finn",
    "clawdia",
    "pearl",
    "skipper",
  ]) {
    await page.clock.runFor(3250);
    await expect(portrait).toHaveAttribute("data-character", character);
  }
  await expect(portrait).toHaveCSS("transition-duration", "0.25s");
  await page.screenshot({
    path: "test-results/welcome-characters.png",
    animations: "disabled",
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const stopped = await portrait.getAttribute("data-character");
  await page.clock.fastForward(20000);
  await expect(portrait).toHaveAttribute("data-character", stopped!);
  await expect(portrait).toHaveCSS("opacity", "1");
});

test("without a sailing only setup actions are available", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu", exact: true }).click();
  const nav = page.getByRole("navigation", { name: "Main navigation" });
  await expect(nav.getByRole("button")).toHaveCount(1);
  await expect(
    nav.getByRole("button", { name: "New sailing", exact: true }),
  ).toBeVisible();
  for (const name of [
    "Home",
    "Log a drink",
    "Drink log",
    "Drink passport",
    "Menus & prices",
    "Sailing & crew",
    "Your sailings",
  ])
    await expect(nav.getByRole("button", { name, exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Welcome aboard", exact: true }),
  ).toBeVisible();
});

test("navigation and relaunch choose a different random scene after an hour without resetting the timer early", async ({
  page,
}) => {
  const initial = new Date("2026-11-14T12:00:00Z");
  await page.clock.install({ time: initial });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Take a look with sample data" })
    .click();
  const scene = page.locator(".sailing-scene");
  await expect(scene).toBeVisible();
  const first = await scene.getAttribute("data-scene");
  const firstChanged = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("sipahoy-opening-scene")!)
        .lastChanged as number,
  );
  const navigate = async (name: string) => {
    await page.getByRole("button", { name: "Open menu", exact: true }).click();
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("button", { name, exact: true })
      .click();
  };
  await page.clock.setSystemTime(new Date(initial.getTime() + hour - 1000));
  await page.reload();
  await expect(scene).toHaveAttribute("data-scene", first!);
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("sipahoy-opening-scene")!).lastChanged,
    ),
  ).toBe(firstChanged);
  await page.clock.setSystemTime(new Date(initial.getTime() + hour + 10000));
  await expect(scene).toHaveAttribute("data-scene", first!);
  await navigate("Drink log");
  await navigate("Home");
  await expect(scene).not.toHaveAttribute("data-scene", first!);
  const second = await scene.getAttribute("data-scene");
  await page.reload();
  await expect(scene).toHaveAttribute("data-scene", second!);
  await page.clock.setSystemTime(new Date(initial.getTime() + 3 * hour));
  await page.reload();
  await expect(scene).not.toHaveAttribute("data-scene", second!);
  const third = await scene.getAttribute("data-scene");
  await page.clock.setSystemTime(new Date(initial.getTime() + 5 * hour));
  await expect(scene).toHaveAttribute("data-scene", third!);
  await page.evaluate(() =>
    document.dispatchEvent(new Event("visibilitychange")),
  );
  await expect(scene).not.toHaveAttribute("data-scene", third!);
});

test("all six backgrounds are readable offline and on phone layouts", async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Take a look with sample data" })
    .click();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await context.setOffline(true);
  for (let index = 0; index < sceneIds.length; index++) {
    await page.evaluate(
      (index) =>
        localStorage.setItem(
          "sipahoy-opening-scene",
          JSON.stringify({ index, lastChanged: Date.now() }),
        ),
      index,
    );
    await page.reload();
    const scene = page.locator(".sailing-scene");
    await expect(scene).toHaveAttribute("data-scene", sceneIds[index]);
    expect(
      await scene
        .locator("img.scene-backdrop")
        .evaluate(async (image: HTMLImageElement) => {
          await image.decode();
          return image.naturalWidth;
        }),
    ).toBe(1536);
    await page.locator(".hero").screenshot({
      path: `test-results/scene-${sceneIds[index]}.png`,
      animations: "disabled",
    });
  }
});
