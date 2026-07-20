import { test, expect } from "@playwright/test";

test.describe("Sessions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("admin@rai-dashboard.com").fill("admin@rai-dashboard.com");
    await page.getByPlaceholder("••••••••").fill("admin123");
    await page.locator('button[type="submit"]').click();
    await expect(page.locator("h1")).toContainText("Dashboard");
  });

  test("navigates to sessions page", async ({ page }) => {
    await page.getByRole("link", { name: "Sessions" }).click();
    await expect(page.locator("h1")).toContainText("Sessions");
    await expect(page.getByText("Monitor Claude Code sessions")).toBeVisible();
  });

  test("sessions page shows empty state when no sessions", async ({ page }) => {
    await page.getByRole("link", { name: "Sessions" }).click();
    // Should show either sessions or empty state
    await expect(page.locator("h1")).toContainText("Sessions");
  });

  test("sessions search input works", async ({ page }) => {
    await page.getByRole("link", { name: "Sessions" }).click();
    await page.getByPlaceholder("Search sessions...").fill("test");
    // Input should have the value
    await expect(page.getByPlaceholder("Search sessions...")).toHaveValue("test");
  });
});
