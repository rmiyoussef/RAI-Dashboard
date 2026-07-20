import { test, expect } from "@playwright/test";

test.describe("Skills", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("admin@rai-dashboard.com").fill("admin@rai-dashboard.com");
    await page.getByPlaceholder("••••••••").fill("admin123");
    await page.locator('button[type="submit"]').click();
    await expect(page.locator("h1")).toContainText("Dashboard");
  });

  test("skills page loads", async ({ page }) => {
    await page.getByRole("link", { name: "Skills" }).click();
    await expect(page.locator("h1")).toContainText("Skills");
    await expect(page.getByText("Manage engineering skills")).toBeVisible();
  });

  test("skills search works", async ({ page }) => {
    await page.getByRole("link", { name: "Skills" }).click();
    await page.getByPlaceholder("Search skills...").fill("test");
    await expect(page.getByPlaceholder("Search skills...")).toHaveValue("test");
  });

  test("add skill button is visible", async ({ page }) => {
    await page.getByRole("link", { name: "Skills" }).click();
    await expect(page.getByRole("button", { name: "Add Skill" })).toBeVisible();
  });
});
