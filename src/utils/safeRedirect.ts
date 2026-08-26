export function safeRedirect(
  raw: string | null | undefined,
  fallback: string,
): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return fallback;
  if (raw === "/admin") return "/admin/dashboard";
  return raw;
}
