import { describe, it, expect } from "vitest";
import { hasPermission, tabLabel } from "../permissions";

// Mock next-auth to avoid module resolution issues in Vitest
vi.mock("next-auth", () => ({
  default: () => ({
    auth: vi.fn(),
    handlers: {},
    signIn: vi.fn(),
    signOut: vi.fn(),
  }),
}));
vi.mock("next-auth/providers/credentials", () => ({
  default: () => ({}),
}));
vi.mock("@/lib/db", () => ({
  prisma: {},
}));
vi.mock("bcryptjs", () => ({}));

describe("hasPermission", () => {
  const adminUser = { role: "SUPER_ADMIN" };
  const regularUser = {
    role: "USER",
    permissions: [
      { tabId: "PROJECTS", canRead: true, canWrite: false },
      { tabId: "SESSIONS", canRead: true, canWrite: true },
      { tabId: "USERS", canRead: false, canWrite: false },
    ],
  };
  const userWithNoPerms = { role: "USER", permissions: [] };

  it("grants full access to SUPER_ADMIN regardless of tab", () => {
    expect(hasPermission(adminUser, "PROJECTS", "read")).toBe(true);
    expect(hasPermission(adminUser, "PROJECTS", "write")).toBe(true);
    expect(hasPermission(adminUser, "USERS", "read")).toBe(true);
    expect(hasPermission(adminUser, "USERS", "write")).toBe(true);
  });

  it("grants read if user has canRead", () => {
    expect(hasPermission(regularUser, "PROJECTS", "read")).toBe(true);
  });

  it("denies write if user lacks canWrite", () => {
    expect(hasPermission(regularUser, "PROJECTS", "write")).toBe(false);
  });

  it("grants write if user has canWrite", () => {
    expect(hasPermission(regularUser, "SESSIONS", "write")).toBe(true);
  });

  it("denies access if no permission found for tab", () => {
    expect(hasPermission(regularUser, "SETTINGS", "read")).toBe(false);
  });

  it("denies access if permissions array is empty", () => {
    expect(hasPermission(userWithNoPerms, "PROJECTS", "read")).toBe(false);
  });

  it("handles null/undefined user gracefully", () => {
    expect(hasPermission(null, "PROJECTS", "read")).toBe(false);
    expect(hasPermission(undefined, "PROJECTS", "read")).toBe(false);
  });
});

describe("tabLabel", () => {
  it("returns correct labels for all tabs", () => {
    expect(tabLabel("DASHBOARD")).toBe("Dashboard");
    expect(tabLabel("PROJECTS")).toBe("Projects");
    expect(tabLabel("SESSIONS")).toBe("Sessions");
    expect(tabLabel("MEMORY")).toBe("Memory");
    expect(tabLabel("PLANS")).toBe("Plans");
    expect(tabLabel("SKILLS")).toBe("Skills");
    expect(tabLabel("USERS")).toBe("Users");
    expect(tabLabel("TERMINAL")).toBe("Terminal");
    expect(tabLabel("SETTINGS")).toBe("Settings");
  });
});
