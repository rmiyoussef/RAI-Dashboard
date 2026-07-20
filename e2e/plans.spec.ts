import { test, expect } from "@playwright/test";

test.describe("Plans", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("admin@rai-dashboard.com").fill("admin@rai-dashboard.com");
    await page.getByPlaceholder("••••••••").fill("admin123");
    await page.locator('button[type="submit"]').click();
    await expect(page.locator("h1")).toContainText("Dashboard");
  });

  test("plans page loads", async ({ page }) => {
    await page.getByRole("link", { name: "Plans" }).click();
    await expect(page.locator("h1")).toContainText("Plans");
    await expect(page.getByText("View and edit engineering plans")).toBeVisible();
  });

  test("plans search works", async ({ page }) => {
    await page.getByRole("link", { name: "Plans" }).click();
    await page.getByPlaceholder("Search plans...").fill("test");
    await expect(page.getByPlaceholder("Search plans...")).toHaveValue("test");
  });

  test("new plan button is visible", async ({ page }) => {
    await page.getByRole("link", { name: "Plans" }).click();
    await expect(page.getByRole("button", { name: "New Plan" })).toBeVisible();
  });
});
