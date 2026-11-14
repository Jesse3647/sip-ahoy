import { test, expect, type Page } from "@playwright/test";
import { openBackups } from "./navigation";

async function openInstall(page: Page) {
  await page.getByRole("button", { name: "Open menu" }).click();
  await page
    .getByRole("button", { name: "Install SipAhoy", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Install SipAhoy" }),
  ).toBeVisible();
}
async function offerInstall(
  page: Page,
  outcome: "accepted" | "dismissed" | "error",
) {
  await page.evaluate((outcome) => {
    const event = new Event("beforeinstallprompt", { cancelable: true });
    Object.assign(event, {
      prompt: async () => {
        if (outcome === "error") throw new Error("Unavailable");
      },
      userChoice: Promise.resolve({ outcome }),
    });
    window.dispatchEvent(event);
  }, outcome);
}

test("clean header, menu backups, and installation instructions fit a phone", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/");
  await expect(page.locator(".topbar").getByRole("button")).toHaveCount(2);
  await expect(
    page.getByRole("button", { name: "Backups and exports" }),
  ).toHaveCount(0);
  await openBackups(page);
  await expect(
    page.getByRole("dialog", { name: "Backups & exports" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.getByText("Good days, great company.")).toHaveCount(0);
  await page.screenshot({
    path: "test-results/install-menu.png",
    animations: "disabled",
  });
  await page
    .getByRole("button", { name: "Install SipAhoy", exact: true })
    .click();
  const guide = page.getByRole("dialog", { name: "Install SipAhoy" });
  for (const platform of ["ios", "android", "desktop", "safari"]) {
    await page
      .getByLabel("Installation instructions for")
      .selectOption(platform);
    await expect(guide.locator(".install-steps li")).toHaveCount(3);
    expect(await guide.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
      true,
    );
    await expect(
      guide.getByRole("link", { name: /installation guide/ }),
    ).toHaveAttribute("href", /^https:\/\/support\.(apple|google)\.com\//);
  }
  await page.getByLabel("Installation instructions for").selectOption("ios");
  await expect(guide).toContainText("Add to Home Screen");
  await expect(guide).toContainText("Open as Web App");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "test-results/install-iphone.png",
    animations: "disabled",
  });
});

test("native install prompt is optional, one-use, and handles dismissal, errors, and installation", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();
  await offerInstall(page, "dismissed");
  await openInstall(page);
  await page.getByRole("button", { name: "Install now" }).click();
  await expect(page.getByRole("status")).toContainText("install later");
  await expect(page.getByRole("button", { name: "Install now" })).toHaveCount(
    0,
  );
  await offerInstall(page, "error");
  await page.getByRole("button", { name: "Install now" }).click();
  await expect(page.getByRole("alert")).toContainText("steps below");
  await offerInstall(page, "accepted");
  await page.getByRole("button", { name: "Install now" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Installation requested",
  );
  await page.evaluate(() => window.dispatchEvent(new Event("appinstalled")));
  await expect(
    page.getByRole("heading", { name: "You’re all set" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(
    page.getByRole("button", { name: "Install SipAhoy", exact: true }),
  ).toHaveCount(0);
});

for (const mode of ["ios", "standalone"]) {
  test(`installation entry is hidden in an installed ${mode} app`, async ({
    page,
  }) => {
    await page.addInitScript((mode) => {
      if (mode === "ios")
        Object.defineProperty(navigator, "standalone", { value: true });
      else {
        const original = window.matchMedia.bind(window);
        window.matchMedia = (query) => {
          const result = original(query);
          if (query === "(display-mode: standalone)")
            Object.defineProperty(result, "matches", { value: true });
          return result;
        };
      }
    }, mode);
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();
    await expect(
      page.getByRole("button", { name: "Install SipAhoy", exact: true }),
    ).toHaveCount(0);
  });
}

async function simulateIOS(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "userAgent", {
      value:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1",
    });
  });
}

test("iOS offers home-screen guidance, remembers dismissal, and keeps manual installation available", async ({
  page,
}) => {
  await simulateIOS(page);
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/");
  const offer = page.getByRole("complementary", {
    name: "Add SipAhoy to your Home Screen",
  });
  await expect(offer).toBeVisible();
  expect(await offer.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
    true,
  );
  await offer.getByRole("button", { name: "Show me how" }).click();
  const guide = page.getByRole("dialog", { name: "Install SipAhoy" });
  await expect(guide).toContainText("Share menu");
  await expect(guide.getByRole("button", { name: "Install now" })).toHaveCount(
    0,
  );
  await expect(page.getByLabel("Installation instructions for")).toHaveValue(
    "ios",
  );
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.reload();
  await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();
  await expect(offer).toHaveCount(0);
  await openInstall(page);
  await expect(guide).toContainText("Add to Home Screen");
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.evaluate(() =>
    localStorage.removeItem("sipahoy-ios-install-dismissed"),
  );
  await page.reload();
  await offer.getByRole("button", { name: "Not now" }).click();
  await page.reload();
  await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();
  await expect(offer).toHaveCount(0);
});

test("iOS home-screen windows never show the installation offer", async ({
  page,
}) => {
  await simulateIOS(page);
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "standalone", { value: true }),
  );
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();
  await expect(
    page.getByRole("complementary", {
      name: "Add SipAhoy to your Home Screen",
    }),
  ).toHaveCount(0);
});

test("iOS touch guard blocks top-edge pulls while preserving inner scrolling and pinch zoom", async ({
  page,
}) => {
  await simulateIOS(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  const result = await page
    .getByRole("dialog", { name: "All aboard" })
    .evaluate((dialog) => {
      const scroller = document.createElement("div");
      scroller.style.cssText =
        "height:100px;overflow-y:auto;overscroll-behavior-y:contain";
      scroller.innerHTML = '<div style="height:500px">Scroll content</div>';
      dialog.append(scroller);
      const target = scroller.firstElementChild!;
      const pull = (dx: number, dy: number, fingers = 1) => {
        const touches = (x: number, y: number) =>
          Array.from(
            { length: fingers },
            (_, identifier) =>
              new Touch({
                identifier,
                target,
                clientX: x + identifier * 20,
                clientY: y,
              }),
          );
        target.dispatchEvent(
          new TouchEvent("touchstart", {
            bubbles: true,
            touches: touches(100, 100),
          }),
        );
        const move = new TouchEvent("touchmove", {
          bubbles: true,
          cancelable: true,
          touches: touches(100 + dx, 100 + dy),
        });
        target.dispatchEvent(move);
        target.dispatchEvent(
          new TouchEvent("touchend", { bubbles: true, touches: [] }),
        );
        return move.defaultPrevented;
      };
      const top = pull(0, 40);
      const upward = pull(0, -40);
      const sideways = pull(40, 5);
      const pinch = pull(0, 40, 2);
      scroller.scrollTop = 100;
      const scrolling = pull(0, 40);
      scroller.remove();
      return { top, upward, sideways, pinch, scrolling };
    });
  expect(result).toEqual({
    top: true,
    upward: false,
    sideways: false,
    pinch: false,
    scrolling: false,
  });
});
