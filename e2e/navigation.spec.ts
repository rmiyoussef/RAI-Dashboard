import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("admin@rai-dashboard.com").fill("admin@rai-dashboard.com");
    await page.getByPlaceholder("••••••••").fill("admin123");
    await page.locator('button[type="submit"]').click();
    await expect(page.locator("h1")).toContainText("Dashboard");
  });

  test("sidebar shows all nav items", async ({ page }) => {
    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Projects" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sessions" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Memory" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Plans" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Skills" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Terminal" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Settings" })).toBeVisible();
  });

  test("admin can see Users in sidebar", async ({ page }) => {
    await expect(page.getByRole("link", { name: "Users" })).toBeVisible();
  });

  test("navigates to all main pages via sidebar", async ({ page }) => {
    const pages = ["Projects", "Sessions", "Memory", "Plans", "Skills", "Terminal", "Settings", "Users"];
    for (const name of pages) {
      await page.getByRole("link", { name }).first().click();
      await expect(page.locator("h1")).toBeVisible();
    }
  });

  test("dashboard shows stat cards", async ({ page }) => {
    await expect(page.getByText("Projects", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Active Sessions").first()).toBeVisible();
    await expect(page.getByText("Memory Files").first()).toBeVisible();
    await expect(page.getByText("System Status")).toBeVisible();
    await expect(page.getByText("Recent Activity").first()).toBeVisible();
  });
});
