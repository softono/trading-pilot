# API Conventions

Detailed reference for API route conventions. For the short version, see the "API Overview" section in `AGENTS.md`. Validation and response-helper *rules* (which helper to call, when) live in `AGENTS.md` under "Coding Rules & Conventions" — this document expands on the shapes and the list/pagination contract specifically.

## Response shapes

```ts
// src/types/common.ts
export interface ApiResponse<T = any> {
  status: number; // 1 = success, 0 = failure
  message: string;
  data?: T;
}

export interface ApiResult<T = any> extends ApiResponse<T> {
  http_status: number; // added by service methods, consumed by sendResult
}
```

`ApiResult` is frozen — never add top-level fields. Anything extra (pagination meta, field errors, etc.) nests inside `data`.

## Response helpers (`src/server/utils/response.ts`)

| Helper                                   | Use for                                                              |
| ----------------------------------------- | ---------------------------------------------------------------------- |
| `sendResult(result: Partial<ApiResult>)`  | Forwarding a service's `ApiResult` straight to the client               |
| `sendResultWithHeaders(result, headers)`  | Same, but also needs to set cookies (login, logout, 2FA)               |
| `sendError(http_status, message)`         | Guard clauses / early-exit errors (401 unauthorized, 400 missing id)   |
| `sendResponse(http_status, partial)`      | Low-level helper the others wrap; rarely called directly               |

## Validation (`src/server/lib/validator.ts`)

`validateData(schema, body)` runs a Zod schema and returns an `ApiResult`:

- Success: `{ http_status: 200, status: 1, message: "ok", data: <parsed> }`
- Failure: `{ http_status: 422, status: 0, message: <joined issues>, data: { errors: Record<string, string> } }` — one message per field path.

Route handlers always check the result before continuing:

```ts
const validated = validateData(noteSaveSchema, body);
if (!validated.status) return sendResult(validated); // forwards data.errors as-is
const data = validated.data;
```

Never re-shape a validation failure — the field-keyed `errors` map is what the client's `applyServerErrors(form.setError, errors)` (`src/lib/formErrors.ts`) expects.

## CRUD routes

Every module follows standard REST CRUD, split across two files:

| File | Exports | Purpose |
| --- | --- | --- |
| `<entity>/route.ts` | `GET`, `POST` | `GET` = list (paginated), `POST` = create |
| `<entity>/[id]/route.ts` | `GET`, `PATCH`, `DELETE` | single resource: fetch, update, delete |
| `<entity>/[id]/<action>/route.ts` | `POST` | one-off custom actions (e.g. `activate`, `deactivate`) — never overload `PATCH` with an `{action}` body |

`POST` (create) and `PATCH /:id` (update) call the **same upsert service method** — the route layer forks (POST passes no id; PATCH passes `id` from the URL param), the service doesn't need separate `create`/`update` methods. There is no `PUT` — no module has full-replace semantics distinct from partial update, so `PATCH` covers both.

See `docs/new_module.md` for the full file-by-file walkthrough, and `src/app/api/admin/seo-meta/` for the reference implementation.

## List/pagination endpoints

Every list view (`DataTable` / `TsGrid` on the frontend) talks to a `GET <entity>` route with a standard query-param contract.

**Query params:**

- `page`, `limit` — plain integers
- `sortField`, `sortDir` — plain strings (`sortDir` is `"asc"` or `"desc"`)
- `search` — plain string
- `filter` — base64-encoded JSON (the one field with arbitrary nested shape — a column→values map). Query strings can't cleanly carry nested objects/arrays, so this is the one deliberate exception to "plain query params".

Example: `GET /api/admin/seo-meta?page=1&limit=20&sortField=created_at&sortDir=desc&search=foo&filter=eyJzdGF0dXMiOlsiYWN0aXZlIl19`

On the server, `parsePaginationQuery(searchParams)` (`src/server/lib/pagination/index.ts`) decodes this back into the same shape `paginationSchema` (`@/components/tsgrid/pagination.validator`) validates:

```json
{
  "page": 1,
  "limit": 20,
  "sort": { "field": "created_at", "direction": "desc" },
  "search": { "value": "quarterly report" },
  "filter": { "status": ["active"] }
}
```

On the client, `toListQueryParams(body)` (`src/components/tsgrid/Pagination.tsx`) does the reverse — serializes a `PaginationInput` into the query-param shape above. Module fetchers call it directly so every module gets the same encoding for free (see `docs/tsgrid.md`).

**Response** (`ApiResult`):

```json
{
  "status": 1,
  "message": "Data retrieved successfully",
  "data": {
    "list": [ /* rows */ ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 137,
      "pages": 7,
      "count": "Showing 1-20 of 137 items"
    }
  }
}
```

### Building the list route

```ts
async function getHandler(req: NextRequestWithUser) {
  const body = parsePaginationQuery(req.nextUrl.searchParams);
  const validated = validateData(paginationSchema, body);
  if (!validated.status) return sendResult(validated);

  const result = await SomeService.list(req.user!.id, validated.data, req);
  return sendResult(result);
}
export const GET = withUserAuth(getHandler);
```

### `Pagination.paginate()` (`src/server/lib/pagination/index.ts`)

```ts
static paginate<T>(
  query: PgSelect,              // a .$dynamic() query with base filter + search + column filters already applied
  body: PaginationInput,
  sortMap: Record<string, PgColumn>,   // whitelist: only these fields may be sorted
  options?: {
    defaultSort?: { field: string; direction: "asc" | "desc" };
    mapRow?: (row) => T;               // e.g. format dates, relabel enums
  },
): Promise<ApiResult>
```

It caps `limit` at 100, counts the filtered set via a subquery, applies the whitelisted sort (falling back to `defaultSort` if the requested field isn't in `sortMap`), paginates, and returns the `ApiResult` shape above. The caller is responsible for what to `select()` and which `where()` conditions to apply (including scoping by `user_id` for user-owned data) — the pagination service only owns sort/limit/offset/count.

## Error responses

Guard clauses use `sendError`:

```ts
if (!userId) return sendError(401, "Unauthorized");
if (!id) return sendError(400, "Missing id");
```

Produces:

```json
{ "status": 0, "message": "Unauthorized", "data": [] }
```

with the given HTTP status code.
