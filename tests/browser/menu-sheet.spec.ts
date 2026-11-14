import { test, expect, type Page, type CDPSession } from "@playwright/test";
import { navigate } from "./navigation";

test.use({
  isMobile: true,
  hasTouch: true,
  viewport: { width: 390, height: 844 },
});

async function pull(
  page: Page,
  touch: CDPSession,
  distance: number,
  cancel = false,
  inspect?: () => Promise<void>,
) {
  const handle = page.locator(".sheet-handle");
  const box = (await handle.boundingBox())!;
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  const point = (top: number) => [
    { x, y: top, radiusX: 4, radiusY: 4, force: 1 },
  ];
  await touch.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: point(y),
  });
  for (let step = 1; step <= 6; step++) {
    await touch.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: point(y + (distance * step) / 6),
    });
  }
  if (inspect) await inspect();
  await touch.send("Input.dispatchTouchEvent", {
    type: cancel ? "touchCancel" : "touchEnd",
    touchPoints: [],
  });
}

test("menu ignores surrounding taps and requires a one-third drag to slide closed", async ({
  page,
}) => {
  const touch = await page.context().newCDPSession(page);
  await page.goto("/");
  await page
    .getByRole("button", { name: "Take a look with sample data" })
    .click();
  await navigate(page, "Menus & prices");
  await page.evaluate(() => window.scrollTo(0, 500));
  const scrollBefore = await page.evaluate(() => window.scrollY);
  await page.getByRole("button", { name: "Open menu" }).click();
  const menu = page.getByRole("dialog", { name: "All aboard" });
  await expect(menu).toHaveCSS("opacity", "1");
  const compact = (await menu.boundingBox())!;
  await page.touchscreen.tap(12, compact.y - 12);
  await expect(menu).toBeVisible();
  // The sheet's own padding above/beside the grip is not a dismiss target either.
  await page.touchscreen.tap(8, compact.y + 8);
  await expect(menu).toBeVisible();
  await pull(page, touch, -140, false, async () => {
    expect((await menu.boundingBox())!.y).toBeLessThan(compact.y - 90);
    await expect(menu).toHaveAttribute("data-dragging", "true");
  });
  await expect(menu).toHaveAttribute("data-sheet", "expanded");
  await expect
    .poll(async () => (await menu.boundingBox())!.height)
    .toBeGreaterThan(compact.height + 100);
  await page.screenshot({
    path: "test-results/menu-sheet-expanded.png",
    animations: "disabled",
  });
  const expanded = (await menu.boundingBox())!;
  await pull(page, touch, 100);
  await expect(menu).toHaveAttribute("data-sheet", "expanded");
  await expect
    .poll(async () => Math.abs((await menu.boundingBox())!.y - expanded.y))
    .toBeLessThan(1);
  await page.locator(".sheet-handle").tap();
  await expect(menu).toHaveAttribute("data-sheet", "compact");
  await expect
    .poll(async () =>
      Math.abs((await menu.boundingBox())!.height - compact.height),
    )
    .toBeLessThan(1);
  await pull(page, touch, compact.height * 0.32);
  await expect(menu).toBeVisible();
  await expect
    .poll(async () => Math.abs((await menu.boundingBox())!.y - compact.y))
    .toBeLessThan(1);
  await pull(page, touch, compact.height * 0.4, true);
  await expect(menu).toBeVisible();
  await expect
    .poll(async () => Math.abs((await menu.boundingBox())!.y - compact.y))
    .toBeLessThan(1);
  await page.screenshot({
    path: "test-results/menu-snap-back.png",
    animations: "disabled",
  });
  await pull(page, touch, compact.height * 0.35, false, async () => {
    await expect
      .poll(async () => (await menu.boundingBox())!.y)
      .toBeGreaterThan(compact.y + compact.height / 3);
  });
  await expect(menu).toHaveAttribute("data-closing", "true");
  await expect(menu).toHaveCount(0);
  expect(await page.evaluate(() => window.scrollY)).toBe(scrollBefore);
  await expect(page.getByRole("button", { name: "Open menu" })).toBeFocused();
  // An expanded sheet uses the same one-third rule, without an intermediate collapse.
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.locator(".sheet-handle").tap();
  await expect
    .poll(async () => (await menu.boundingBox())!.height)
    .toBeGreaterThan(compact.height + 100);
  await pull(page, touch, (await menu.boundingBox())!.height / 3 + 15);
  await expect(menu).toHaveCount(0);
  await touch.detach();
});

test("handle supports taps and keyboard, reflows on rotation, and respects reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  const menu = page.getByRole("dialog", { name: "All aboard" });
  const handle = page.locator(".sheet-handle");
  await handle.tap();
  await expect(handle).toHaveAccessibleName("Collapse navigation menu");
  await expect(menu).toHaveAttribute("data-sheet", "expanded");
  await expect(menu).toHaveCSS("transition-duration", "0s");
  await handle.press("ArrowDown");
  await expect(menu).toHaveAttribute("data-sheet", "compact");
  await handle.press("ArrowUp");
  await expect(menu).toHaveAttribute("data-sheet", "expanded");
  await page.setViewportSize({ width: 667, height: 375 });
  await expect(menu).toHaveAttribute("data-sheet", "compact");
  expect((await menu.boundingBox())!.height).toBeLessThanOrEqual(359);
  const touch = await page.context().newCDPSession(page);
  await page.screenshot({
    path: "test-results/menu-sheet-landscape.png",
    animations: "disabled",
  });
  // Content scrolling remains separate from the sheet handle, including in landscape.
  await touch.send("Input.synthesizeScrollGesture", {
    x: 200,
    y: 180,
    yDistance: -100,
    gestureSourceType: "touch",
    speed: 400,
  });
  await expect(menu).toBeVisible();
  await expect
    .poll(() => menu.locator(".sheet-content").evaluate((el) => el.scrollTop))
    .toBeGreaterThan(20);
  await pull(page, touch, (await menu.boundingBox())!.height / 3 + 10);
  await expect(menu).toHaveCount(0);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(handle).toBeHidden();
  await page.keyboard.press("Escape");
  await expect(menu).toHaveCount(0);
  await touch.detach();
});
