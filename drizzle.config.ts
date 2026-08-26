import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/server/models/schema.ts",
  out: "./src/server/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  migrations: {
    prefix: "timestamp",
  },
  verbose: true,
  strict: true,
});
