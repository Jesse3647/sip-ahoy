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

test("scene choices are not persisted: new sailings change immediately, pages change after an hour, and relaunch picks fresh", async ({
  page,
}) => {
  const initial = new Date("2026-11-14T12:00:00Z");
  await page.clock.install({ time: initial });
  await page.addInitScript(() => {
    Math.random = () =>
      Number(sessionStorage.getItem("test-scene-draw") ?? "0");
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Take a look with sample data" })
    .click();
  const scene = page.locator(".sailing-scene");
  await expect(scene).toHaveAttribute("data-scene", "pool-deck");
  const navigate = async (name: string) => {
    await page.getByRole("button", { name: "Open menu", exact: true }).click();
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("button", { name, exact: true })
      .click();
  };
  await navigate("New sailing");
  await page.getByLabel("Sailing name", { exact: true }).fill("Another cruise");
  await page
    .getByRole("combobox", { name: "Ship", exact: true })
    .selectOption("Wonder of the Seas");
  await page.getByLabel("First day").fill("2027-02-01");
  await page.getByLabel("Last day").fill("2027-02-08");
  await page
    .getByRole("button", { name: "Create sailing", exact: true })
    .click();
  await expect(scene).not.toHaveAttribute("data-scene", "pool-deck");
  const second = await scene.getAttribute("data-scene");
  await navigate("Drink log");
  await navigate("Home");
  await expect(scene).toHaveAttribute("data-scene", second!);
  await page.clock.setSystemTime(new Date(initial.getTime() + hour + 10000));
  await navigate("Drink log");
  await navigate("Home");
  await expect(scene).not.toHaveAttribute("data-scene", second!);
  const third = await scene.getAttribute("data-scene");
  const target = (sceneIds.indexOf(third!) + 1) % sceneIds.length;
  await page.evaluate(
    (value) => sessionStorage.setItem("test-scene-draw", String(value)),
    (target + 0.5) / sceneIds.length,
  );
  await page.reload();
  await expect(scene).toHaveAttribute("data-scene", sceneIds[target]);
  expect(
    await page.evaluate(() => localStorage.getItem("sipahoy-opening-scene")),
  ).toBeNull();
});

test("all six backgrounds are readable offline and on phone layouts", async ({
  page,
  context,
}) => {
  await page.addInitScript(() => {
    Math.random = () =>
      Number(sessionStorage.getItem("test-scene-draw") ?? "0");
  });
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
      (value) => sessionStorage.setItem("test-scene-draw", String(value)),
      (index + 0.5) / sceneIds.length,
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

test("an old persisted background cannot pin the scene on a new launch", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "sipahoy-opening-scene",
      JSON.stringify({ index: 5, lastChanged: Date.now() + 86400000 }),
    );
    Math.random = () => 0;
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Take a look with sample data" })
    .click();
  await expect(page.locator(".sailing-scene")).toHaveAttribute(
    "data-scene",
    "pool-deck",
  );
});
