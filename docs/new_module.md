# Adding a New Module

This is the standard checklist/reference for adding a new CRUD module to this project. It mirrors the architecture documented in `AGENTS.md` — read that first for the full rules (types, validators, response format, folder boundaries). This file is the step-by-step "how" with copy-paste-ready snippets and the two decision points you'll hit every time: **list view** and **create/edit UI**.

Use the **Notes** module (`src/server/models/Note.ts`, `src/app/api/(user)/note/*`, `src/app/(user)/notes/*`) as the reference implementation — every step below points at the actual file.

---

## 0. Decide where the module lives

| Area                        | Route group                    | Auth                          | Example        |
| --------------------------- | ------------------------------- | ------------------------------ | --------------- |
| Admin-managed entity         | `src/app/admin/(admin)/<name>/` | `withAdminAuth`                | Blog, Page, User |
| Authenticated user's own data | `src/app/(user)/<name>/`        | `withUserAuth`                 | Notes, Account   |
| Public content              | `src/app/(public)/<name>/`      | `withPublic` / none            | Blog list, Contact |

If the entity is scoped to the logged-in user (each user only sees their own rows), add a `user_id` FK to the table even if not explicitly requested — otherwise every user sees every other user's data. Filter every query in the service by `req.user.id`.

---

## 1. Database layer

### 1a. Drizzle model — `src/server/models/<Entity>.ts`

```ts
import { pgTable, serial, text, timestamp, index } from "drizzle-orm/pg-core";
import { users } from "@/server/models/User";

export const notes = pgTable(
  "notes",
  {
    id: serial("id").primaryKey(),
    user_id: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    note: text("note"),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("notes_user_idx").on(t.user_id)],
);

export type INote = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;

export default notes;
```

- Use `serial("id")` for every table except the `user` table and tables directly attached to auth (sessions, passkeys, two-factor, verification, activity, device). This applies even when the table has a `user_id` FK (like `notes` above) — the FK column itself stays `text` to match `users.id`, but the table's own PK is a plain incrementing `int`.
- Reach for `text("id")` + `genId()` (`src/server/lib/auth/ids.ts`, wraps `crypto.randomUUID()`) only for those auth-adjacent tables.
- Add an `index()` on any foreign key you'll filter by.

### 1b. Register in the schema barrel — `src/server/models/schema.ts`

```ts
export { notes, type INote, type NewNote } from "@/server/models/Note";
```

### 1c. Generate + apply the migration

```bash
npm run db:generate -- --name=create_notes_table
npm run db:migrate
```

Never hand-write migration SQL — always generate it from the schema so the drizzle journal/snapshot stays consistent.

---

## 2. Validator — `src/validators/<entity>.validator.ts`

Single source of truth for server validation + client form validation.

```ts
import { z } from "zod";

// no `id` field — create (POST) never has one, update (PATCH /:id) takes it
// from the URL param, not the body.
export const noteSaveSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  note: z.string().trim().optional(),
});

export type NoteSaveInput = z.input<typeof noteSaveSchema>;

export const noteFormSchema = noteSaveSchema;

export type NoteFormInput = z.infer<typeof noteFormSchema>;
```

Rules (from `CLAUDE.md`):
- Never define schemas inline in a component or route.
- Never write `z.enum([...])`/magic strings for a field that already has a shared schema (e.g. `userStatusSchema`) — import it.
- `xxxFormSchema` (fed into `zodResolver`) must not use `.default()` on any field.

---

## 3. Client type — `src/types/<entity>.types.ts`

```ts
export interface Note {
  id: number;
  title: string;
  note?: string | null;
  created_at?: string;
  updated_at?: string;
}
```

Barrel-export it from `src/types/index.ts`:

```ts
export type { Note } from "@/types/note.types";
```

---

## 4. Service — `src/server/services/<entity>Service.ts` (or `services/admin/<entity>Service.ts` for admin modules)

Owns the Drizzle queries. List methods use `Pagination.paginate()` (`src/server/lib/pagination`) — the caller builds a `.$dynamic()` query with base filters/search applied, the service handles limit/offset/count/sort.

```ts
import { and, eq, ilike } from "drizzle-orm";
import { NextRequest } from "next/server";
import db from "@/server/lib/core/db";
import { notes } from "@/server/models/schema";
import { Pagination } from "@/server/lib/pagination";
import { dateTimeFormat, getClientTimezone } from "@/server/lib/date";
import type { ApiResult } from "@/types/common";
import type { PaginationInput } from "@/validators/pagination";
import type { NoteSaveInput } from "@/validators/note.validator";

export class NoteService {
  static async list(userId: string, body: PaginationInput, req: NextRequest): Promise<ApiResult> {
    const search = (body.search?.value || "").trim();
    const conditions = [eq(notes.user_id, userId)];
    if (search) conditions.push(ilike(notes.title, `%${search}%`));

    const query = db
      .select({ id: notes.id, title: notes.title, note: notes.note, created_at: notes.created_at, updated_at: notes.updated_at })
      .from(notes)
      .where(and(...conditions))
      .$dynamic();

    const tz = getClientTimezone(req);
    return Pagination.paginate(
      query,
      body,
      { title: notes.title, created_at: notes.created_at, updated_at: notes.updated_at },
      {
        defaultSort: { field: "created_at", direction: "desc" },
        mapRow: (row) => ({
          ...row,
          created_at: dateTimeFormat(row.created_at as Date, tz),
          updated_at: dateTimeFormat(row.updated_at as Date, tz),
        }),
      },
    );
  }

  // upsert: id undefined = insert (serial id auto-assigned), id defined = update by id
  static async save(userId: string, id: number | undefined, data: NoteSaveInput): Promise<ApiResult> { /* ... */ }
  static async delete(userId: string, id: number): Promise<ApiResult> { /* delete scoped by userId */ }
}
```

Always format dates server-side with `dateTimeFormat(date, getClientTimezone(req))` — never send raw `Date` objects to the client.

---

## 5. API routes — `src/app/api/(user)/<entity>/route.ts` + `[id]/route.ts`

Standard REST CRUD, split across two files (see `docs/api.md` for the full contract):

```
<entity>/
├── route.ts        # GET (list), POST (create)
└── [id]/
    └── route.ts     # GET (single), PATCH (update), DELETE
```

```ts
// route.ts
async function getHandler(req: NextRequestWithUser) {
  const userId = req.user?.id;
  if (!userId) return sendError(401, "Unauthorized");

  const body = parsePaginationQuery(req.nextUrl.searchParams);
  const validated = validateData(paginationSchema, body);
  if (!validated.status) return sendResult(validated);

  const result = await NoteService.list(userId, validated.data, req);
  return sendResult(result);
}

async function postHandler(req: NextRequestWithUser) {
  const userId = req.user?.id;
  if (!userId) return sendError(401, "Unauthorized");

  const body = await req.json().catch(() => ({}));
  const validated = validateData(noteSaveSchema, body);
  if (!validated.status) return sendResult(validated);

  const result = await NoteService.save(userId, undefined, validated.data);
  return sendResult(result);
}

export const GET = withUserAuth(getHandler);
export const POST = withUserAuth(postHandler);
```

```ts
// [id]/route.ts
async function patchHandler(
  req: NextRequestWithUser,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = req.user?.id;
  if (!userId) return sendError(401, "Unauthorized");

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const validated = validateData(noteSaveSchema.partial(), body);
  if (!validated.status) return sendResult(validated);

  const result = await NoteService.save(userId, Number(id), validated.data);
  return sendResult(result);
}
// same shape for GET (single fetch) and DELETE, reading `id` from `params`

export const GET = withUserAuth(getHandler);
export const PATCH = withUserAuth(patchHandler);
export const DELETE = withUserAuth(deleteHandler);
```

`POST` and `PATCH` call the same upsert service method (`NoteService.save`) — the route forks on whether `id` comes from nowhere (create) or the URL param (update); the service doesn't need separate create/update methods. There's no `PUT` — no module needs full-replace semantics distinct from partial update.

Custom one-off actions (e.g. `activate`/`deactivate`) get their own `[id]/<action>/route.ts` exporting `POST` — never overload `PATCH` with a generic `{action}` body.

For admin modules: same shape, but middleware is `withAdminAuth`, and routes live at `src/app/api/admin/<entity>/...`.

Never re-shape a validation failure — `return sendResult(validated)` forwards `data.errors` as-is.

Reference implementation: `src/app/api/admin/seo-meta/`.

---

## 6. Frontend list page — pick a list view

Two components are available in `src/components/tsgrid/`, both server-driven (pagination/sort/search/filter, URL sync, loading/empty/error states built in):

| Component   | Renders                          | Use when                                                             | Example                               |
| ----------- | --------------------------------- | ---------------------------------------------------------------------- | -------------------------------------- |
| `DataTable` | HTML table (rows/columns)         | Structured data, many columns, admin/back-office screens               | `src/app/admin/(admin)/blog/page.tsx` |
| `TsGrid`    | Card grid (masonry-style, `renderCard`) | Visual/content-heavy items (images, excerpts), public-facing browsing | `src/app/(public)/blog/BlogListPage.tsx` |

**Default to `DataTable`** for admin/management screens and any list with actions (edit/delete dropdowns). Use `TsGrid` only when the content is inherently visual (thumbnails, cards) and doesn't need per-row action menus.

`DataTable` usage:

```tsx
<DataTable<Note>
  columns={columns}
  queryKey={NOTES_QUERY_KEY}
  fetcher={(body) => httpClient.get<ApiResult>("notes", toListQueryParams(body))}
/>
```

`TsGrid` usage (card view):

```tsx
<TsGrid<BlogListItem>
  columns={columns}
  queryKey={["blogs"]}
  fetcher={(body) => httpClient.get<ApiResult>("blogs", toListQueryParams(body))}
  renderCard={(row) => <BlogCard row={row} />}
  getRowId={(row) => row.id}
  gridClassName="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
/>
```

Both take the same `columns`/`queryKey`/`fetcher` contract — `columns` still drives sorting/filtering even in `TsGrid` (the `header`/`cell` rendering is just unused there).

Delete flow, regardless of list view: `useDeleteEntity` hook (`src/hooks/useDeleteEntity.ts`) + `ConfirmationDialog` (`src/components/common/ConfirmationDialog.tsx`). It invalidates `queryKey` on success, which both `DataTable` and `TsGrid` are already subscribed to via `useServerData`/`useInfiniteServerData` — so the list refreshes automatically.

```tsx
const { deleteItem } = useDeleteEntity<number>(
  (id: number) => httpClient.delete<ApiResult>(`notes/${id}`),
  NOTES_QUERY_KEY,
  "Note",
);
```

---

## 7. Create/edit UI — dialog vs. separate page

**Rule of thumb: ≤3 fields → dialog. >3 fields → separate page.**

| Fields | Pattern         | Placement                                              | Example                                              |
| ------ | ---------------- | ------------------------------------------------------- | ------------------------------------------------------ |
| 1–3    | Dialog (modal)   | Component lives **beside** the list page, not in `components/` | `src/app/(user)/notes/NoteForm.tsx`                  |
| 4+     | Separate route/page | `<entity>/create/page.tsx`, `<entity>/update/[id]/page.tsx` | `src/app/admin/(admin)/blog/create/page.tsx`         |

Why the cutoff: a dialog with more than ~3 fields (especially rich text, images, multi-select, nested sections) becomes cramped and hard to scroll/validate inside a modal — a dedicated page with a normal layout handles that better. A 1–2 field dialog (e.g. Notes: title + note) keeps the user in list context and avoids an unnecessary navigation round-trip.

### 7a. Dialog pattern (≤3 fields)

One component, reused for both create and edit, controlled by the parent list page (`open`/`onOpenChange`/`note` props). Lives next to the page:

```
app/
└── (user)/notes/
    ├── page.tsx       # list + "Add" button + owns dialog open state
    └── NoteForm.tsx   # <Dialog> wrapping the form, used for both create & edit
```

```tsx
// NoteForm.tsx — key shape
export default function NoteForm({ open, onOpenChange, note, queryKey }: NoteFormProps) {
  const isEdit = Boolean(note);
  const form = useForm<NoteFormInput>({ resolver: zodResolver(noteFormSchema) });

  useEffect(() => {
    if (open) form.reset({ title: note?.title ?? "", note: note?.note ?? "" });
  }, [open, note, form]);

  const saveMutation = useMutation({
    mutationFn: (values: NoteFormInput) =>
      note
        ? httpClient.patch<ApiResult>(`notes/${note.id}`, values)
        : httpClient.post<ApiResult>("notes", values),
    onSuccess: (response) => {
      if (response.status === 1) {
        showSuccess(response.message);
        queryClient.invalidateQueries({ queryKey });
        onOpenChange(false);
      } else {
        showError(response.message);
      }
    },
    onError: (error) => {
      const errors = (error as { data?: { errors?: Record<string, string> } })?.data?.errors;
      if (errors) applyServerErrors(form.setError, errors);
      else showError("Failed to save note");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{isEdit ? "Edit Note" : "Add Note"}</DialogTitle></DialogHeader>
        <Form form={form} onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))}>
          {/* FormField per input, FormMessage for errors */}
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

The list page owns `formOpen`/`editingNote` state and passes an `onEdit`/`handleAdd` callback into the row actions and the "Add" button — see `src/app/(user)/notes/page.tsx`.

### 7b. Separate-page pattern (4+ fields)

Follow the Page/Blog admin pattern:

```
app/admin/(admin)/blog/
├── page.tsx              # list
├── create/page.tsx       # renders <BlogForm isEdit={false} />
└── update/[id]/page.tsx  # renders <BlogForm isEdit id={params.id} />
```

The form component (e.g. `_form.tsx` or `BlogForm.tsx`) fetches the record itself via `GET <entity>/:id` on mount when `isEdit`, calls `POST <entity>` (create) or `PATCH <entity>/:id` (update) on submit, and navigates back to the list (`router.push("/admin/blog")`) on success — instead of taking `open`/`onOpenChange` props like the dialog variant.

---

## 8. Navigation

- **Admin sidebar**: add an item to `sidebarData.navGroups[].items` in `src/app/admin/(admin)/layout/main/main_sidebar.tsx` with a `permission` key.
- **User-facing top nav**: add `{ title, href, isActive: true }` to the `navLinks` array in `src/app/layout/main/index.tsx`.

---

## 9. Verify

```bash
npm run format && npm run typecheck && npm run lint
```

Fix all type and lint errors before considering the module done. Also start the dev server and exercise create/edit/delete/list in a real browser against a live DB — type-checking proves the code compiles, not that the feature works.

---

## File checklist (copy for a new module named `<entity>`)

- [ ] `src/server/models/<Entity>.ts`
- [ ] Export added to `src/server/models/schema.ts`
- [ ] `npm run db:generate -- --name=create_<entities>_table` + `npm run db:migrate`
- [ ] `src/validators/<entity>.validator.ts`
- [ ] `src/types/<entity>.types.ts` + export from `src/types/index.ts`
- [ ] `src/server/services/<entity>Service.ts` (or `services/admin/`)
- [ ] `src/app/api/(user|admin)/<entity>/route.ts` (`GET` list, `POST` create) + `[id]/route.ts` (`GET`, `PATCH`, `DELETE`)
- [ ] List page: `DataTable` or `TsGrid` (§6)
- [ ] Create/edit UI: dialog (≤3 fields) or separate page (4+ fields) (§7)
- [ ] Nav entry (§8)
- [ ] `npm run format && npm run typecheck && npm run lint` clean
