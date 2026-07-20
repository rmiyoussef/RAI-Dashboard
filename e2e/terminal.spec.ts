import { test, expect } from "@playwright/test";

test.describe("Terminal", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("admin@rai-dashboard.com").fill("admin@rai-dashboard.com");
    await page.getByPlaceholder("••••••••").fill("admin123");
    await page.locator('button[type="submit"]').click();
    await expect(page.locator("h1")).toContainText("Dashboard");
  });

  test("terminal page loads", async ({ page }) => {
    await page.getByRole("link", { name: "Terminal" }).click();
    await expect(page.locator("h1")).toContainText("Terminal");
    await expect(page.getByText("Run commands in project directories")).toBeVisible();
  });

  test("terminal shows project selector", async ({ page }) => {
    await page.getByRole("link", { name: "Terminal" }).click();
    await expect(page.locator("h3").filter({ hasText: "Projects" })).toBeVisible();
  });
});
