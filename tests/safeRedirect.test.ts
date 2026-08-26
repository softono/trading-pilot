import { describe, it, expect } from "vitest";
import { safeRedirect } from "@/utils/safeRedirect";

describe("safeRedirect", () => {
  it("allows same-origin relative paths", () => {
    expect(safeRedirect("/dashboard", "/")).toBe("/dashboard");
  });

  it("falls back for external URLs", () => {
    expect(safeRedirect("https://evil.com", "/")).toBe("/");
  });

  it("falls back for protocol-relative URLs", () => {
    expect(safeRedirect("//evil.com", "/")).toBe("/");
  });

  it("falls back for empty or missing values", () => {
    expect(safeRedirect("", "/home")).toBe("/home");
    expect(safeRedirect(null, "/home")).toBe("/home");
    expect(safeRedirect(undefined, "/home")).toBe("/home");
  });

  it("maps bare /admin to the admin dashboard", () => {
    expect(safeRedirect("/admin", "/")).toBe("/admin/dashboard");
  });
});
