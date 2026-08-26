import { describe, it, expect } from "vitest";
import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import {
  buildFilter,
  type FilterMap,
} from "@/server/lib/pagination/buildFilter";

const t = pgTable("test_rows", {
  id: serial("id").primaryKey(),
  name: text("name"),
  status: text("status"),
  created_at: timestamp("created_at"),
});

const filterMap: FilterMap = {
  name: { column: t.name, type: "text" },
  status: { column: t.status, type: "multiSelect" },
  created_at: { column: t.created_at, type: "date" },
};

describe("buildFilter", () => {
  it("returns undefined without a filter", () => {
    expect(buildFilter(filterMap)).toBeUndefined();
    expect(buildFilter(filterMap, {})).toBeUndefined();
  });

  it("builds a condition for whitelisted text columns", () => {
    expect(buildFilter(filterMap, { name: ["jane"] })).toBeDefined();
  });

  it("skips columns not in the whitelist", () => {
    expect(buildFilter(filterMap, { password: ["x"] })).toBeUndefined();
  });

  it("skips non-array and empty values", () => {
    expect(
      buildFilter(filterMap, {
        name: "jane" as unknown as string[],
      }),
    ).toBeUndefined();
    expect(buildFilter(filterMap, { name: [""] })).toBeUndefined();
  });

  it("combines multiple whitelisted columns", () => {
    expect(
      buildFilter(filterMap, {
        name: ["jane"],
        status: ["active", "inactive"],
        created_at: ["2026-01-01", "2026-02-01"],
      }),
    ).toBeDefined();
  });
});
