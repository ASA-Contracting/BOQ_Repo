# UI Standards

Presentation layer conventions. **Bootstrap UI only** (`app/page.tsx`).

**Design system:** [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) — tokens, components, patterns.

Business rules and AI behavior: [MASTER_SPECIFICATION.md](../MASTER_SPECIFICATION.md)

---

## Component taxonomy

```
components/ui/           shadcn/ui primitives — zero domain knowledge
components/shared/       DataTable, PageHeader, EmptyState
components/{feature}/    project/, boq/, family/, workshop/, reporting/
app/{route}/_components/ Route-colocated UI
```

| Layer | May import |
|-------|------------|
| `ui/` | React, Tailwind, shadcn/ui |
| `shared/` | `ui/` |
| Feature | `ui/`, `shared/` only |
| Feature | **Not** `domain/`, `application/`, `infrastructure/` |

Compose across features at the page level — no cross-feature imports.

---

## Server vs client

| Default | Use when |
|---------|----------|
| Server Component | Data fetching, static content |
| Client (`"use client"`) | Hooks, events, interactive forms |

Keep client boundaries low. No DB or use case calls from `components/ui/`.

Read `node_modules/next/dist/docs/` — Next.js 16 breaking changes.

---

## Forms

- Zod schema from `application/dto/` — shared with API
- Server always re-validates
- Confirm destructive and **Publish** actions
- AI-suggested values visually distinct until accepted

---

## Tables

- Shell: `components/shared/DataTable/`
- Columns in feature files
- Right-align numeric columns
- Stable row keys — not array index for editable rows
- Server-driven pagination for large datasets

---

## Styling

- Tailwind CSS utility-first
- shadcn/ui for interactive primitives
- Semantic tokens in `app/globals.css`
- Mobile-first responsive
- WCAG 2.1 AA: keyboard access, labels, focus, `aria-live="polite"` for AI status

---

## AI suggestion UI

Per [MASTER §8.4](../MASTER_SPECIFICATION.md#84-explainability-ui):

- Proposed Family, rationale, confidence (not color-only)
- “AI suggestion” badge
- Accept / Reject actions
- Publish is a **separate** action with confirmation

---

## Prohibited

- Business rules in components
- Direct DB/ORM access
- `useEffect` for data fetchable on server
- Client-only validation for fields that affect production
