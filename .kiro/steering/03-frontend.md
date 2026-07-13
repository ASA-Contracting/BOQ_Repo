---
inclusion: fileMatch
fileMatchPattern: ['app/**/*', 'components/**/*']
---

# Frontend

See `docs/standards/UI.md` and `docs/MASTER_SPECIFICATION.md` §8.4 (AI suggestion UI).

- Server Components by default; `"use client"` only when needed.
- shadcn/ui in `components/ui/` — no domain imports in components.
- **Data tables** — use `FilterableDataGrid` from `components/filter-engine/` (grouping, filtering, sorting, column layout, saved views). Do not build plain HTML tables for new list views.
- Zod schemas from `application/dto/` for forms.
- Read `node_modules/next/dist/docs/` — Next.js 16 breaking changes.
