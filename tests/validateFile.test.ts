import { describe, it, expect } from "vitest";
import { validateFile, MIME_IMAGE } from "@/server/lib/file/validateFile";

// Minimal real PNG: signature + IHDR chunk (enough for magic-byte sniffing).
const PNG_BYTES = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
  0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89,
]);

describe("validateFile", () => {
  it("accepts a real PNG and reports the sniffed mime", async () => {
    const file = new Blob([PNG_BYTES], { type: "image/png" });
    const result = await validateFile(file, { allowedMimeTypes: MIME_IMAGE });
    expect(result.isValid).toBe(true);
    expect(result.mime).toBe("image/png");
  });

  it("rejects non-image content even with a spoofed image/png type", async () => {
    const file = new Blob(["#!/bin/sh\necho pwned"], { type: "image/png" });
    const result = await validateFile(file, { allowedMimeTypes: MIME_IMAGE });
    expect(result.isValid).toBe(false);
  });

  it("rejects an SVG (stored-XSS vector) even when content is a real SVG", async () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>`;
    const file = new Blob([svg], { type: "image/svg+xml" });
    const result = await validateFile(file, { allowedMimeTypes: MIME_IMAGE });
    expect(result.isValid).toBe(false);
  });

  it("rejects files over maxSize", async () => {
    const file = new Blob([PNG_BYTES], { type: "image/png" });
    const result = await validateFile(file, { maxSize: 10 });
    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/exceeds/i);
  });

  it("rejects non-Blob input", async () => {
    const result = await validateFile(null as unknown as Blob);
    expect(result.isValid).toBe(false);
  });
});
