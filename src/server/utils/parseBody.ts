export async function parseBody(req: Request): Promise<{
  fields: Record<string, string>;
  files: Record<string, File | Blob>;
}> {
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const fields: Record<string, string> = {};
    const files: Record<string, File | Blob> = {};
    formData.forEach((value, key) => {
      if (value instanceof Blob) files[key] = value;
      else fields[key] = value;
    });
    return { fields, files };
  }
  const body = await req.json().catch(() => ({}));
  return { fields: body, files: {} };
}
