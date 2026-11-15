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
  await page.getByRole("button", { name: "Save sailor", exact: true }).click();
  await expect(
    page.locator('.sailor-closeup[data-selected="true"] .character-portrait'),
  ).toHaveAttribute("data-character", "pearl");
  await expect(
    page
      .getByRole("button", { name: "Show Sam's character", exact: true })
      .locator(".character-portrait"),
  ).toHaveAttribute("data-character", "pip");
  await page.reload();
  await expect(
    page.locator('.sailor-closeup[data-selected="true"] .character-portrait'),
  ).toHaveAttribute("data-character", "pearl");
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
  await page.getByRole("button", { name: "Save sailor", exact: true }).click();
  await restore(page, exported.data);
  await expect(
    page.locator('.sailor-closeup[data-selected="true"] .character-portrait'),
  ).toHaveAttribute("data-character", "pearl");
  await page
    .getByRole("button", { name: "Show Sam's character", exact: true })
    .click();
  await expect(
    page.locator('.sailor-closeup[data-selected="true"] .character-portrait'),
  ).toHaveAttribute("data-character", "pip");
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
  await page.getByRole("button", { name: "Add sailor", exact: true }).click();
  await expect(page.getByLabel("Sailor name")).toHaveValue("");
  // The suggested character is the first unused one, independent of the package template.
  await expect(
    page.getByRole("radio", { name: "Skipper, Octopus captain", exact: true }),
  ).toBeChecked();
});

test("live reactions update per sailor after saves and removals", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const fixture = demoData();
  const sailor = fixture.travelers[0];
  const day = fixture.sailings[0].start;
  const cocktail = fixture.entries.find((e) => e.category === "Cocktail")!;
  fixture.entries = Array.from({ length: 5 }, (_, i) => ({
    ...cocktail,
    id: `daily-${i}`,
    time: new Date().toISOString(),
    travelerId: sailor.id,
    sailingId: sailor.sailingId,
    sailingDate: day,
  }));
  await restore(page, fixture);
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
  await expect(
    page.locator('.sailor-closeup[data-selected="true"] .character-portrait'),
  ).toHaveAttribute("data-mood", "water");
  await page.getByRole("button", { name: "Dismiss celebration" }).click();
  await page.locator(".crew-reactions").screenshot({
    path: "test-results/sailor-daily-reactions.png",
    animations: "disabled",
  });
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

test("sailor close-ups are passive, blink without body motion, and stay available offline", async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  const fixture = demoData();
  const base = fixture.travelers[0];
  const day = fixture.sailings[0].start;
  fixture.travelers = [
    "Alex",
    "Sam",
    "Jesse",
    "Morgan",
    "A sailor with a very long name",
    "Pearl",
  ].map((name, index) => ({
    ...base,
    id: `portrait-${index}`,
    name,
    characterId: (
      ["skipper", "pip", "finn", "sunny", "clawdia", "pearl"] as const
    )[index],
  }));
  const cocktail = fixture.entries.find(
    (entry) => entry.category === "Cocktail",
  )!;
  fixture.entries = fixture.travelers.flatMap((sailor, index) =>
    Array.from({ length: [0, 1, 3, 6, 0, 1][index] }, (_, n) => ({
      ...cocktail,
      id: `${sailor.id}-${n}`,
      travelerId: sailor.id,
      sailingId: sailor.sailingId,
      sailingDate: day,
      time: new Date().toISOString(),
    })),
  );
  await restore(page, fixture);
  const scene = page.locator(".sailing-scene");
  await scene.scrollIntoViewIfNeeded();
  await expect(
    page.locator(".hero button, .hero a, .hero [tabindex]"),
  ).toHaveCount(0);
  await expect(scene.locator(".sailor-closeup")).toHaveCount(4);
  await expect(scene.locator(".sailor-blink").first()).toHaveCSS(
    "animation-name",
    "sailor-eyelids",
  );
  await expect(scene.locator(".character-portrait").first()).toHaveCSS(
    "animation-name",
    "none",
  );
  const selected = page.locator('.sailor-closeup[data-selected="true"]');
  for (const [index, name] of fixture.travelers.map((t) => t.name).entries()) {
    await page
      .getByRole("button", { name: `Show ${name}'s character`, exact: true })
      .click();
    await expect(selected.locator(".character-portrait")).toHaveAttribute(
      "data-character",
      fixture.travelers[index].characterId!,
    );
    await expect(selected.locator(".character-portrait")).toHaveAttribute(
      "data-mood",
      ["ready", "cheerful", "merry", "water", "ready", "cheerful"][index],
    );
  }
  await page
    .getByRole("button", { name: "Show Alex's character", exact: true })
    .click();
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.evaluate(() => window.scrollTo(0, 0));
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    const stage = (await scene.boundingBox())!;
    const faces = await scene.locator(".sailor-face").all();
    const bounds = await Promise.all(faces.map((face) => face.boundingBox()));
    for (const box of bounds) {
      expect(box!.x).toBeGreaterThanOrEqual(stage.x);
      expect(box!.x + box!.width).toBeLessThanOrEqual(stage.x + stage.width);
      expect(box!.y).toBeGreaterThanOrEqual(stage.y);
      expect(box!.y + box!.height).toBeLessThanOrEqual(stage.y + stage.height);
    }
    if (width > 700)
      expect(bounds[0]!.x + bounds[0]!.width).toBeGreaterThan(bounds[1]!.x);
    else {
      const frontLeft = bounds[2]!.x + bounds[2]!.width / 2;
      const frontRight = bounds[3]!.x + bounds[3]!.width / 2;
      for (const [index, rear] of bounds.slice(0, 2).entries()) {
        expect(rear!.x + rear!.width / 2).toBeGreaterThan(frontLeft);
        if (index === 0)
          expect(
            Math.abs(rear!.x + rear!.width / 2 - (frontLeft + frontRight) / 2),
          ).toBeLessThan(1);
        else expect(rear!.x + rear!.width / 2).toBeGreaterThan(frontRight);
        const depth = bounds[2]!.y + bounds[2]!.height - rear!.y - rear!.height;
        expect(depth).toBeGreaterThan(0);
        expect(depth).toBeLessThan(80);
      }
      const layers = await scene
        .locator(".sailor-closeup")
        .evaluateAll((els) =>
          els.map((el) => Number(getComputedStyle(el).zIndex)),
        );
      expect(layers[2]).toBeGreaterThan(layers[0]);
    }
    await expect(scene.locator(".sailor-crop").first()).toHaveCSS(
      "overflow",
      "visible",
    );
    await expect(scene.locator(".scene-backdrop")).toHaveCSS("filter", "none");
    await page.locator(".hero").screenshot({
      path: `test-results/quiet-sailors-${width}.png`,
      animations: "disabled",
    });
  }
  await page.addStyleTag({
    content:
      ".sailor-blink { animation: none !important; opacity: 1 !important; }",
  });
  await scene.screenshot({ path: "test-results/quiet-sailors-blink.png" });
  await page.reload();
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(
    await scene
      .locator("*")
      .evaluateAll((els) =>
        els.every((el) => getComputedStyle(el).animationName === "none"),
      ),
  ).toBe(true);
  await expect(scene.locator(".sailor-blink").first()).toHaveCSS(
    "opacity",
    "0",
  );
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await context.setOffline(true);
  await page.reload();
  expect(
    await scene
      .locator(".scene-backdrop")
      .evaluate(async (image: HTMLImageElement) => {
        await image.decode();
        return image.naturalWidth > 0;
      }),
  ).toBe(true);
  await expect(scene.locator(".sailor-closeup")).toHaveCount(4);
});

test("a solo sailor stays fully inside the banner without visible captions", async ({
  page,
}) => {
  await page.goto("/");
  const fixture = demoData();
  fixture.travelers = [
    { ...fixture.travelers[0], name: "Jesse", characterId: "finn" },
  ];
  fixture.entries = fixture.entries.filter(
    (entry) => entry.travelerId === fixture.travelers[0].id,
  );
  await restore(page, fixture);
  const scene = page.locator(".sailing-scene");
  await expect(scene.locator("figcaption")).toHaveCount(0);
  await expect(scene.locator("figure")).toHaveAccessibleName(/Jesse/);
  for (const width of [1440, 768, 640, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    const stage = (await scene.boundingBox())!;
    const face = (await scene.locator(".sailor-face").boundingBox())!;
    expect(face.y).toBeGreaterThanOrEqual(stage.y + 11);
    expect(face.y + face.height).toBeLessThanOrEqual(
      stage.y + stage.height - 11,
    );
    expect(face.x).toBeGreaterThanOrEqual(stage.x);
    expect(face.x + face.width).toBeLessThanOrEqual(stage.x + stage.width);
    await page.locator(".hero").screenshot({
      path: `test-results/solo-sailor-${width}.png`,
      animations: "disabled",
    });
  }
});

test("live reactions update as water and alcohol leave the six-hour window without another save", async ({
  page,
}) => {
  const reference = new Date("2026-11-15T02:00:00Z");
  await page.clock.install({ time: reference });
  await page.clock.pauseAt(new Date(reference.getTime() + 1000));
  await page.goto("/");
  const fixture = demoData();
  const sailor = fixture.travelers[0];
  const base = fixture.entries.find((entry) => entry.category === "Cocktail")!;
  fixture.entries = Array.from({ length: 6 }, (_, index) => ({
    ...base,
    id: `rolling-${index}`,
    travelerId: sailor.id,
    sailingId: sailor.sailingId,
    sailingDate: fixture.sailings[0].start,
    time: new Date(reference.getTime() - 6 * 3600000 + 60000).toISOString(),
  }));
  fixture.entries.push({
    ...fixture.entries[0],
    id: "water",
    category: "Water",
    name: "Water",
    time: new Date(reference.getTime() - 6 * 3600000 + 30000).toISOString(),
  });
  await restore(page, fixture);
  const portrait = page
    .getByRole("button", { name: "Show Alex's character", exact: true })
    .locator(".character-portrait");
  const banner = page.locator(
    '.sailor-closeup[data-selected="true"] .character-portrait',
  );
  await expect(portrait).toHaveAttribute("data-mood", "merry");
  await expect(page.getByLabel("Character day", { exact: true })).toHaveCount(
    0,
  );
  await page.clock.fastForward(30000);
  await expect(portrait).toHaveAttribute("data-mood", "water");
  await expect(banner).toHaveAttribute("data-mood", "water");
  await page.clock.fastForward(30000);
  await expect(portrait).toHaveAttribute("data-mood", "ready");
  await expect(banner).toHaveAttribute("data-mood", "ready");
  await expect(
    page.getByRole("button", { name: "Show Alex's character", exact: true }),
  ).toContainText("0 logged · 0 alcohol");
});

test("three sailors keep the rear sailor exactly centered between the foreground pair", async ({
  page,
}) => {
  await page.goto("/");
  const fixture = demoData();
  fixture.travelers.push({
    ...fixture.travelers[0],
    id: "third-sailor",
    name: "Jesse",
    characterId: "finn",
  });
  await restore(page, fixture);
  const scene = page.locator(".sailing-scene");
  await expect(scene.locator(".sailor-face")).toHaveCount(3);
  for (const width of [320, 390, 640]) {
    await page.setViewportSize({ width, height: 900 });
    const stage = (await scene.boundingBox())!;
    const boxes = await Promise.all(
      (await scene.locator(".sailor-face").all()).map((face) =>
        face.boundingBox(),
      ),
    );
    const centers = boxes.map((box) => box!.x + box!.width / 2);
    expect(Math.abs(centers[0] - (centers[1] + centers[2]) / 2)).toBeLessThan(
      1,
    );
    for (const box of boxes) {
      expect(box!.x).toBeGreaterThanOrEqual(stage.x);
      expect(box!.x + box!.width).toBeLessThanOrEqual(stage.x + stage.width);
    }
    if (width === 390)
      await page
        .locator(".hero")
        .screenshot({
          path: "test-results/three-sailors-centered.png",
          animations: "disabled",
        });
  }
});
