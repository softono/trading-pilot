//import "server-only";

const env = process.env;

const trimSlash = (value: string = ""): string => value.replace(/\/+$/, "");
const normalizeUrl = (value?: string, fallback: string = ""): string =>
  trimSlash((value || fallback).trim());

const appOrigin = normalizeUrl(
  env.NEXT_PUBLIC_BASE_URL || env.NEXT_PUBLIC_BASE_URL || "",
);

const serverConfig = {
  APP_NAME: env.NEXT_PUBLIC_APP_NAME || "Next",
  APP_UID: env.NEXT_PUBLIC_APP_UID || "next",
  BASE_URL: normalizeUrl(
    env.NEXT_PUBLIC_BASE_URL || env.NEXT_PUBLIC_BASE_URL || "",
  ),
  APP_ENV: env.APP_ENV || "development",
  APP_DEBUG: env.APP_DEBUG === "true",
  CORS_ORIGIN: env.CORS_ORIGIN
    ? env.CORS_ORIGIN.split(",").map((v) => v.trim())
    : [appOrigin].filter(Boolean),
  DATABASE_URL: env.DATABASE_URL || "",
  ENCRYPTION_KEY: env.ENCRYPTION_KEY || "",
  REDIS_URL: env.REDIS_URL || "",
  CACHE_DRIVER: env.CACHE_DRIVER || "memory",
  CACHE_SQLITE_PATH: env.CACHE_SQLITE_PATH || "./storage/cache/cache.sqlite",

  FILESYSTEM_DISK: env.FILESYSTEM_DISK || "local",
  FILESYSTEM_PATH: env.FILESYSTEM_PATH || ".",
  FILESYSTEM_URL: normalizeUrl(env.NEXT_PUBLIC_FILESYSTEM_URL, `${appOrigin}`),
  AWS_REGION: env.AWS_REGION || "us-east-1",
  AWS_BUCKET: env.AWS_BUCKET || "",
  AWS_ACCESS_KEY_ID: env.AWS_ACCESS_KEY_ID || "",
  AWS_SECRET_ACCESS_KEY: env.AWS_SECRET_ACCESS_KEY || "",
  AWS_URL: normalizeUrl(env.AWS_URL),
  AWS_ENDPOINT: normalizeUrl(env.AWS_ENDPOINT),
  IMGPROXY_ENABLED: env.IMGPROXY_ENABLED || "false",
  IMGPROXY_KEY: env.IMGPROXY_KEY || "",
  IMGPROXY_SALT: env.IMGPROXY_SALT || "",
  IMGPROXY_URL: env.IMGPROXY_URL || "",

  OTP_EXPIRE_SEC: 600,
  LOGIN_LINK_EXPIRE_SEC: 300,
};

function validateConfig(cfg: typeof serverConfig) {
  const required: string[] = ["DATABASE_URL", "ENCRYPTION_KEY"];

  if (cfg.CACHE_DRIVER?.toLowerCase() === "redis") {
    required.push("REDIS_URL");
  }

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }

  if (cfg.ENCRYPTION_KEY.length < 32) {
    throw new Error("ENCRYPTION_KEY must be at least 32 characters");
  }
}

validateConfig(serverConfig);

export default serverConfig;
