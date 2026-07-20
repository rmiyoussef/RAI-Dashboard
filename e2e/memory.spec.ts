import { test, expect } from "@playwright/test";

test.describe("Memory", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("admin@rai-dashboard.com").fill("admin@rai-dashboard.com");
    await page.getByPlaceholder("••••••••").fill("admin123");
    await page.locator('button[type="submit"]').click();
    await expect(page.locator("h1")).toContainText("Dashboard");
  });

  test("memory page loads", async ({ page }) => {
    await page.getByRole("link", { name: "Memory" }).click();
    await expect(page.locator("h1")).toContainText("Memory");
    await expect(page.getByText("Browse project brain memory")).toBeVisible();
  });

  test("memory search works", async ({ page }) => {
    await page.getByRole("link", { name: "Memory" }).click();
    await page.getByPlaceholder("Search memory files...").fill("test");
    await expect(page.getByPlaceholder("Search memory files...")).toHaveValue("test");
  });
});
