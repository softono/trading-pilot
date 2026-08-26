# Backend

Detailed reference for the data layer, date/timezone handling, caching, and config. For the short version, see the "Database Overview" and "Backend Overview" sections in `AGENTS.md`. Auth-specific backend detail lives in `docs/authentication.md`.

## Data layer

- **Database**: PostgreSQL via **Drizzle ORM** (`drizzle-orm` + `postgres` driver).
- **Schema**: `src/server/models/schema.ts` re-exports all tables from individual model files. Tables: `users`, `userSession`, `userAccount`, `verifications`, `userTwoFactor`, `userPasskeys`, `settings`, `pages`, `emailTemplates`, `seo`, `contactMessages`, `userActivity`, `userDevice`, `blogs`, `notes`.
- **Client**: `src/server/lib/core/db.ts` exports the Drizzle `db` instance.
- **Migrations**: managed by drizzle-kit with Laravel-style timestamped filenames (`db/migrations/<timestamp>_<name>.sql`, configured via `migrations.prefix: 'timestamp'` in `drizzle.config.ts`). Generate with `npm run db:generate -- --name=create_posts_table`, apply with `npm run db:migrate`. Seed with `npm run db:seed`. Never hand-write migration SQL — always generate it from the schema.
- **Models**: `src/server/models/*.ts` — Drizzle table definitions and row-type exports. `EmailTemplate.ts` also exports `getEmailTemplateByKey`.
- **User model**: No `name` column. Uses `first_name` (notNull) and `last_name` (notNull). Passwords stored as argon2id hashes in `user_account.password` (`provider_id = "credential"`). Drizzle variable: `userAccount` (type `IUserAccount`).
- **User Service**: `src/server/services/userService.ts` — helper queries on top of Drizzle (e.g. `getUserById`, `getUserByEmail`).
- **API routes**: `src/app/api/` — Next.js route handlers (server-side).
- **Client services**: use `httpClient` (axios-based, see `src/lib/httpClient.ts`) for calling API routes from the browser.

### Primary key convention

- `text` PK + `genId()` (`crypto.randomUUID()` via `src/server/lib/auth/ids.ts`) is reserved for the `user` table and tables directly attached to auth (`userSession`, `userAccount`, `userTwoFactor`, `userPasskeys`, `verifications`, `userActivity`, `userDevice`).
- Every other table — including user-owned content tables like `notes` — uses `serial` (plain incrementing `int`), even when the table has a `user_id` FK. Keep it simple; reach for `text`/UUID only when a table is genuinely auth-adjacent, not just because it happens to reference a user.

## Date & timezone

- **Storage**: All timestamps are Postgres `timestamptz` (`withTimezone: true`) — stored as UTC. No conversion at the DB layer.
- **Timezone detection**: An inline `<head>` script (`clientTimezoneScript` from `src/lib/date.ts`) writes the browser's IANA timezone to the `{APP_UID}_tz` cookie on every page load.
- **Server-side formatting**: `dateTimeFormat(date, timeZone?, format?)` from `src/server/lib/date.ts` uses **Luxon** (`DateTime.fromJSDate().setZone().toFormat()`). Format strings use **Luxon tokens** (e.g. `yyyy-MM-dd HH:mm:ss`, `dd-MM-yyyy`, `hh:mm a`). The app-wide patterns are stored in settings as `setting.date_format` and `setting.date_time_format`. **Always use `dateTimeFormat` with `getClientTimezone(req)` in server-side code** to ensure dates are formatted in the user's timezone: `dateTimeFormat(created_at, getClientTimezone(req))`.
- **Client-side formatting**: `formatDateTime(date, format)` from `src/lib/date.ts` also uses **Luxon**. Format strings use the same Luxon tokens.
- `getClientTimezone(req: NextRequest)` from `src/server/lib/date.ts` reads the `{APP_UID}_tz` cookie and resolves timezone aliases. Falls back to `NEXT_PUBLIC_APP_TIMEZONE` or `"UTC"`.

## Caching

`src/server/lib/core/cache.ts` provides `setCache` / `getCache` / `delCache` / `incrCache`. Backed by Redis when `CACHE_DRIVER=redis` and `REDIS_URL` is set, by a `node:sqlite` file at `CACHE_SQLITE_PATH` when `CACHE_DRIVER=sqlite`; falls back to in-memory `node-cache` otherwise.

Auth sessions and user lookups are Redis-cached with 300s TTL + explicit invalidation on mutations (see `docs/authentication.md`).

## Config

- `src/config.ts` — client config (`NEXT_PUBLIC_*` vars, API URLs, app metadata). Import as `import config from "@/config"`.
- `src/server/config.ts` — server-only secrets (`DATABASE_URL`, `SECRET_KEY`, `ENCRYPTION_KEY`, etc.). Import as `import config from "@/server/config"`. Never import from client modules. SMTP configuration is stored in the `settings` DB table (not env vars). Google OAuth credentials are also in the `settings` table (`google_client_id`, `google_client_secret`).

Required env vars: `DATABASE_URL`, `ENCRYPTION_KEY`, `SECRET_KEY`. `REDIS_URL` is required only when `CACHE_DRIVER=redis`. `CACHE_SQLITE_PATH` (default `./storage/cache/cache.sqlite`) is used only when `CACHE_DRIVER=sqlite`.

Key `NEXT_PUBLIC_*` vars for the client: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_BASE_URL`.
