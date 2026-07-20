import { test, expect } from "@playwright/test";

test.describe("Authenticated API", () => {
  test("GET /api/stats returns dashboard metrics", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("admin@rai-dashboard.com").fill("admin@rai-dashboard.com");
    await page.getByPlaceholder("••••••••").fill("admin123");
    await page.locator('button[type="submit"]').click();
    await expect(page.locator("h1")).toContainText("Dashboard");

    // The stats are loaded on the dashboard page
    await expect(page.getByText("Projects", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Active Sessions").first()).toBeVisible();
  });

  test.describe("Projects CRUD", () => {
    test("full project lifecycle", async ({ page }) => {
      await page.goto("/login");
      await page.getByPlaceholder("admin@rai-dashboard.com").fill("admin@rai-dashboard.com");
      await page.getByPlaceholder("••••••••").fill("admin123");
      await page.locator('button[type="submit"]').click();
      await expect(page.locator("h1")).toContainText("Dashboard");

      // Navigate to Projects
      await page.getByRole("link", { name: "Projects" }).click();

      // Create project
      await page.getByRole("button", { name: "Add Project" }).click();
      await page.getByPlaceholder("My Project").fill("API Test Project");
      await page.getByPlaceholder("/var/www/my-project").fill("/var/www/api-test");
      await page.getByRole("button", { name: "Create" }).click();

      // Dialog should close and project appears in list
      await expect(page.getByText("API Test Project")).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("Terminal", () => {
    test("runs a command and shows output", async ({ page }) => {
      await page.goto("/login");
      await page.getByPlaceholder("admin@rai-dashboard.com").fill("admin@rai-dashboard.com");
      await page.getByPlaceholder("••••••••").fill("admin123");
      await page.locator('button[type="submit"]').click();

      // Go to terminal
      await page.getByRole("link", { name: "Terminal" }).click();
      await expect(page.locator("h1")).toContainText("Terminal");
    });
  });
});
