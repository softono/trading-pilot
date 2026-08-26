import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { lookup } from "mime-types";
import { sendError } from "@/server/utils/response";
import { withUserAuth } from "@/server/middleware/withUserAuth";
import { NextRequestWithUser } from "@/server/middleware/types";

const STORAGE_ROOT = path.join(process.cwd(), "storage/app");
const ALLOWED_PREFIX = path.resolve(STORAGE_ROOT, "");

async function handler(req: NextRequestWithUser) {
  const encoded = req.nextUrl.searchParams.get("p");
  if (!encoded) return sendError(400, "Missing file parameter");

  let decoded: string;
  try {
    decoded = Buffer.from(encoded, "base64").toString("utf8");
  } catch {
    return sendError(400, "Invalid file parameter");
  }

  const resolved = path.resolve(STORAGE_ROOT, decoded);
  if (
    resolved !== ALLOWED_PREFIX &&
    !resolved.startsWith(ALLOWED_PREFIX + path.sep)
  ) {
    return sendError(403, "Access denied");
  }

  let fileBuffer: Buffer;
  try {
    fileBuffer = await fs.readFile(resolved);
  } catch {
    return sendError(404, "File not found");
  }

  const mimeType = lookup(resolved) || "application/octet-stream";
  const arrayBuffer = fileBuffer.buffer.slice(
    fileBuffer.byteOffset,
    fileBuffer.byteOffset + fileBuffer.byteLength,
  ) as ArrayBuffer;

  return new NextResponse(arrayBuffer, {
    status: 200,
    headers: {
      "Content-Type": mimeType,
      "Content-Length": String(fileBuffer.byteLength),
      "Cache-Control": "private, no-store",
    },
  });
}

export const GET = withUserAuth(handler);
