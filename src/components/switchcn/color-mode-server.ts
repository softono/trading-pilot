import { cookies } from "next/headers";

export const getColorMode = async () => {
  const cookieStore = await cookies();
  const colorMode = cookieStore.get("app-color-mode")?.value || "system";
  const prefersDark =
    cookieStore.get("app-system-prefers-dark")?.value === "true";
  return colorMode === "dark" || (colorMode === "system" && prefersDark)
    ? "dark"
    : "light";
};
