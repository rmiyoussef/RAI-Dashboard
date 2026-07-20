import { describe, it, expect } from "vitest";
import { cn, formatDate, timeAgo } from "../utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("merges tailwind classes (later wins)", () => {
    expect(cn("px-4", "px-2")).toBe("px-2");
  });

  it("handles empty inputs", () => {
    expect(cn()).toBe("");
  });
});

describe("formatDate", () => {
  it("formats a date string", () => {
    const result = formatDate("2026-07-20T12:00:00Z");
    expect(result).toContain("Jul 20");
    expect(result).toContain("2026");
  });

  it("formats a Date object", () => {
    const result = formatDate(new Date("2026-01-15T08:30:00Z"));
    expect(result).toContain("Jan 15");
    expect(result).toContain("2026");
  });
});

describe("timeAgo", () => {
  it('returns "Xs ago" for recent dates', () => {
    const recent = new Date(Date.now() - 30000).toISOString();
    expect(timeAgo(recent)).toMatch(/^\d+s ago$/);
  });

  it('returns "Xm ago" for minutes', () => {
    const minutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(timeAgo(minutesAgo)).toBe("5m ago");
  });

  it('returns "Xh ago" for hours', () => {
    const hoursAgo = new Date(Date.now() - 3 * 3600 * 1000).toISOString();
    expect(timeAgo(hoursAgo)).toBe("3h ago");
  });

  it('returns "Xd ago" for days', () => {
    const daysAgo = new Date(Date.now() - 2 * 86400 * 1000).toISOString();
    expect(timeAgo(daysAgo)).toBe("2d ago");
  });
});
