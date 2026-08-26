const env = process.env;

const trimSlash = (value: string = ""): string => value.replace(/\/+$/, "");
const normalizeUrl = (value?: string, fallback: string = ""): string =>
  trimSlash((value || fallback).trim());

const appOrigin = normalizeUrl(
  env.NEXT_PUBLIC_BASE_URL || env.NEXT_PUBLIC_BASE_URL || "",
);
const apiUrl = normalizeUrl(env.NEXT_PUBLIC_API_URL || "/api");

const clientConfig = {
  APP_NAME: env.NEXT_PUBLIC_APP_NAME || "Next",
  BASE_URL: appOrigin,
  API_URL: apiUrl,
  APP_UID: env.NEXT_PUBLIC_APP_UID || "",
  APP_TIMEZONE: env.NEXT_PUBLIC_APP_TIMEZONE || "UTC",

  APP_LOGO: env.NEXT_PUBLIC_APP_LOGO || "/storage/assets/images/logo.png",
  APP_FAVICON: env.NEXT_PUBLIC_APP_FAVICON || "/storage/assets/images/logo.png",
  DEFAULT_IMAGE:
    env.NEXT_PUBLIC_DEFAULT_IMAGE || "/storage/assets/images/no-image.jpg",
  FILESYSTEM_URL: (env.NEXT_PUBLIC_FILESYSTEM_URL || "").replace(/\/+$/, ""),
};

export type AppConfig = typeof clientConfig;
export default clientConfig;
