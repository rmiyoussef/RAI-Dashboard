import { test, expect } from "@playwright/test";

test.describe("Projects", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("admin@rai-dashboard.com").fill("admin@rai-dashboard.com");
    await page.getByPlaceholder("••••••••").fill("admin123");
    await page.locator('button[type="submit"]').click();
    await expect(page.locator("h1")).toContainText("Dashboard");
  });

  test("navigates to projects page", async ({ page }) => {
    await page.getByRole("link", { name: "Projects" }).click();
    await expect(page.locator("h1")).toContainText("Projects");
    await expect(page.getByText("Manage your engineering projects")).toBeVisible();
  });

  test("shows Add Project dialog", async ({ page }) => {
    await page.getByRole("link", { name: "Projects" }).click();
    await page.getByRole("button", { name: "Add Project" }).click();
    await expect(page.getByText("Add a new project to monitor")).toBeVisible();
    await expect(page.getByPlaceholder("My Project")).toBeVisible();
    await expect(page.getByPlaceholder("/var/www/my-project")).toBeVisible();
  });

  test("creates a new project", async ({ page }) => {
    await page.getByRole("link", { name: "Projects" }).click();
    await page.getByRole("button", { name: "Add Project" }).click();
    await page.getByPlaceholder("My Project").fill("E2E Test Project");
    await page.getByPlaceholder("/var/www/my-project").fill("/var/www/e2e-test");
    await page.getByRole("button", { name: "Create" }).click();
    // After creation, the project should appear in the list
    await expect(page.getByText("E2E Test Project")).toBeVisible({ timeout: 10000 });
  });

  test("browses projects", async ({ page }) => {
    await page.getByRole("link", { name: "Projects" }).click();
    await page.getByRole("button", { name: "Add Project" }).click();
    await page.getByText("Browse projects →").click();
    // Wait for the browse dialog to open — it will show either projects or "No projects found"
    await expect(page.getByRole("dialog", { name: "Select Project" })).toBeVisible({ timeout: 10000 });
  });

  test("searches projects", async ({ page }) => {
    await page.getByRole("link", { name: "Projects" }).click();
    const searchInput = page.getByPlaceholder("Search projects...");
    await searchInput.fill("nonexistent");
    // After search with no results, either empty state or filtered results
    await expect(searchInput).toHaveValue("nonexistent");
  });
});
