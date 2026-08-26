# Frontend

Detailed reference for the frontend stack, layouts, and the create/edit UI pattern. For the short version, see the "Frontend Overview" section in `AGENTS.md`. The `DataTable`/`TsGrid` list components are documented separately in `docs/tsgrid.md`.

## UI stack

- **shadcn/ui** components in `src/components/ui/`.
- **Tailwind CSS v4** (PostCSS-based config, no `tailwind.config.js`).
- **TanStack React Table** (`@tanstack/react-table`) powers the server-driven list components.
- **TanStack Query** caches/refetches list data and drives mutation-triggered invalidation.
- **Toasts** via `react-hot-toast` — always use the helpers in `src/lib/message.ts` (`showMessage`, `showError`, `showSuccess`, `showInfo`), never call `toast(...)` directly.

## Layouts

- `src/app/layout.tsx` — root layout; wraps with `Providers` (TanStack Query), theme scripts, and `Toaster` (react-hot-toast).
- `src/app/admin/layout.tsx` — admin layout; wraps with `AuthProvider` from `@/context/AdminAuthContext`. Routes under `/admin/auth/*` get `BlankLayout`; all others get `AuthenticatedLayout` (sidebar + header) behind `ProtectedRoute`.
- `src/app/(user)/layout.tsx` — public/authenticated user layout; wraps with `AuthProvider` from `@/context/AuthContext` and the public `MainLayout` (header/top-nav/footer).

## List views

Server-driven list pages use `DataTable` or `TsGrid` from `src/components/tsgrid/` — see `docs/tsgrid.md` for the component comparison and usage examples.

## Create/edit UI: dialog vs. separate page

Two established patterns for create/edit forms, chosen by field count:

| Fields | Pattern              | Example                                        |
| ------ | ---------------------- | ------------------------------------------------- |
| ≤3     | Dialog beside the page | `src/app/(user)/notes/NoteForm.tsx`               |
| 4+     | Separate `create`/`update/[id]` route | `src/app/admin/(admin)/blog/create/page.tsx`   |

**Dialog pattern**: one form component, controlled by the list page's `open`/`onOpenChange`/`<entity>` props, used for both create and edit. On success it calls `queryClient.invalidateQueries({ queryKey })` and closes — the list refetches automatically since it shares the same `queryKey`.

**Separate-page pattern**: the form component fetches the record itself on mount (`isEdit` + `id`), submits to `<entity>/save`, and navigates back to the list on success (`router.push(...)`) instead of taking dialog props.

Delete (either pattern): `useDeleteEntity` (`src/hooks/useDeleteEntity.ts`) + `ConfirmationDialog` (`src/components/common/ConfirmationDialog.tsx`). The hook invalidates the list's `queryKey` on success.

```tsx
const { deleteItem } = useDeleteEntity(
  (id: string) => httpClient.post<ApiResult>("note/delete", { id }),
  NOTES_QUERY_KEY,
  "Note",
);
```

See `docs/new_module.md` for the full end-to-end checklist when adding a new module (model → validator → service → routes → list page → form).
