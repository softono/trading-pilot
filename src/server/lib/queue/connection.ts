import Redis from "ioredis";
import config from "@/server/config";

// BullMQ needs its own dedicated ioredis connection (maxRetriesPerRequest: null is required by
// BullMQ's blocking commands) — never the CacheClient wrapper in lib/cache.ts/lib/redis.ts, which
// exists for the app's key/value cache, not for queue semantics.
if ((config.CACHE_DRIVER || "").toLowerCase() !== "redis") {
  throw new Error(
    `CACHE_DRIVER must be "redis" (found "${config.CACHE_DRIVER}") to use the job queue`,
  );
}

export const queueConnection = new Redis(config.REDIS_URL, {
  maxRetriesPerRequest: null,
});
