# TSGrid — Server-Driven List Components

Detailed reference for the two list-view components in `src/components/tsgrid/`. For the short version, see the "Frontend Overview" section in `AGENTS.md`. The list/pagination *API contract* these components talk to is documented in `docs/api.md`. For the create/edit dialog-vs-page decision that usually pairs with these lists, see `docs/frontend.md`.

## `DataTable` vs `TsGrid`

Both components live in `src/components/tsgrid/` and are built on the same `useServerData`/`useInfiniteServerData` hooks (URL-synced page/sort/search/filter state, loading/empty/error states, TanStack Query caching):

| Component   | Renders                    | Use when                                                        |
| ----------- | --------------------------- | ------------------------------------------------------------------ |
| `DataTable` | HTML table                  | Structured data, many columns, admin/back-office screens, row actions |
| `TsGrid`    | Card grid (`renderCard`)    | Visual/content-heavy items (thumbnails, excerpts), public browsing UIs |

Default to `DataTable` for anything with row actions (edit/delete dropdowns); reserve `TsGrid` for genuinely card-shaped content.

## `DataTable` usage

Declare `columns` (TanStack `ColumnDef` with `meta: { sortable, filterVariant: 'text' | 'multiSelect' | 'date', options }`), pass a `queryKey` and a `fetcher(body) => Promise<ApiResult>`. The table owns everything else — pagination, sort headers, per-column filters, debounced search, column visibility (persisted to `localStorage`).

`body` is a `PaginationInput` (`page`/`limit`/`sort`/`search`/`filter`), not a query-string-ready object — list endpoints are `GET`, so the fetcher must serialize it with `toListQueryParams` (`@/components/tsgrid/Pagination`), which flattens `page`/`limit`/`sortField`/`sortDir`/`search` and base64-encodes `filter`. See `docs/api.md` for the query-param contract this produces.

```tsx
<DataTable<Note>
  columns={columns}
  queryKey={NOTES_QUERY_KEY}
  fetcher={(body) => httpClient.get<ApiResult>("notes", toListQueryParams(body))}
/>
```

For sub-tables on detail pages, pass `syncUrl={false}` to avoid clobbering the page's own URL query params.

## `TsGrid` usage

Same `columns`/`queryKey`/`fetcher` contract, plus `renderCard` (and usually `getRowId`, `gridClassName`):

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

`columns` still drives sorting/filtering in `TsGrid` even though `header`/`cell` rendering is unused — the filter sidebar and sort toggles read `meta`.
