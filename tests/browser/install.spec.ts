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
