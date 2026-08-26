import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

/**
 * Route-path audit: every string-literal httpRequest("<verb>", "<path>") call
 * in src/ must resolve to a real route.ts under src/app/api that exports that
 * HTTP verb. This automates the singular/plural path-drift bug class that
 * previously broke most admin CRUD flows.
 */

const SRC = path.resolve(__dirname, "../src");
const API_ROOT = path.join(SRC, "app", "api");

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

interface Call {
  file: string;
  verb: string;
  url: string;
}

function extractCalls(): Call[] {
  const calls: Call[] = [];
  const files = walk(SRC).filter(
    (f) => /\.(ts|tsx)$/.test(f) && !f.includes(`${path.sep}app${path.sep}api${path.sep}`),
  );
  const re =
    /httpRequest(?:<[^>]*>)?\(\s*["'](get|post|put|patch|delete)["']\s*,\s*(["'`])((?:(?!\2).)*)\2/g;

  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    for (const m of text.matchAll(re)) {
      calls.push({ file: path.relative(SRC, file), verb: m[1], url: m[3] });
    }
  }
  return calls;
}

/** "/admin/blogs/${id}?x=1" -> ["admin", "blogs", "[param]"] */
function toSegments(url: string): string[] {
  return url
    .split("?")[0]
    .replace(/\$\{[^}]*\}/g, "[param]")
    .split("/")
    .filter(Boolean);
}

const isGroup = (name: string) => name.startsWith("(") && name.endsWith(")");
const isDynamic = (name: string) => name.startsWith("[") && name.endsWith("]");

/** Find route.ts files reachable from `dir` after consuming all `segments`,
 *  where route groups are transparent and [param] dirs match any segment. */
function resolveRoutes(dir: string, segments: string[]): string[] {
  if (!fs.existsSync(dir)) return [];
  const results: string[] = [];

  if (segments.length === 0) {
    const routeFile = path.join(dir, "route.ts");
    if (fs.existsSync(routeFile)) results.push(routeFile);
  }

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const sub = path.join(dir, entry.name);
    if (isGroup(entry.name)) {
      results.push(...resolveRoutes(sub, segments));
    } else if (segments.length > 0) {
      if (entry.name === segments[0] || isDynamic(entry.name)) {
        results.push(...resolveRoutes(sub, segments.slice(1)));
      }
    }
  }
  return results;
}

function routeExportsVerb(routeFile: string, verb: string): boolean {
  const text = fs.readFileSync(routeFile, "utf8");
  const method = verb.toUpperCase();
  return new RegExp(
    `export\\s+(?:const|async\\s+function|function)\\s+${method}\\b`,
  ).test(text);
}

describe("frontend httpRequest paths resolve to real API routes", () => {
  const calls = extractCalls();

  it("finds calls to audit", () => {
    expect(calls.length).toBeGreaterThan(20);
  });

  for (const call of calls) {
    it(`${call.verb.toUpperCase()} ${call.url}  (${call.file})`, () => {
      const routes = resolveRoutes(API_ROOT, toSegments(call.url));
      expect(
        routes.length,
        `no route.ts found under src/app/api for "${call.url}"`,
      ).toBeGreaterThan(0);
      expect(
        routes.some((r) => routeExportsVerb(r, call.verb)),
        `route exists but none export ${call.verb.toUpperCase()}: ${routes
          .map((r) => path.relative(SRC, r))
          .join(", ")}`,
      ).toBe(true);
    });
  }
});
