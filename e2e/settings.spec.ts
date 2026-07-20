import { test, expect } from "@playwright/test";

test.describe("Settings", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("admin@rai-dashboard.com").fill("admin@rai-dashboard.com");
    await page.getByPlaceholder("••••••••").fill("admin123");
    await page.locator('button[type="submit"]').click();
    await expect(page.locator("h1")).toContainText("Dashboard");
  });

  test("settings page loads", async ({ page }) => {
    await page.getByRole("link", { name: "Settings" }).click();
    await expect(page.locator("h1")).toContainText("Settings");
    await expect(page.getByText("Configure your dashboard preferences")).toBeVisible();
  });

  test("theme selector is visible", async ({ page }) => {
    await page.getByRole("link", { name: "Settings" }).click();
    await expect(page.getByText("Appearance")).toBeVisible();
    await expect(page.getByText("Theme")).toBeVisible();
  });
});
