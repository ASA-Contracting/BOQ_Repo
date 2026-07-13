---
inclusion: always
---

# Architecture

Full specification: `docs/MASTER_SPECIFICATION.md` §10.

## Dependency rule

```
app/, components/, hooks/  →  application/  →  domain/
infrastructure/             →  domain/
```

- Business logic in `domain/` + `application/` — never in UI or route handlers beyond wiring.
- Route handlers: Zod validate → use case → DTO (~30 lines).
- Wire repos in `infrastructure/di/` — not per-route.
- Feature folders: `project/`, `boq/`, `family/`, `workshop/`, `reporting/` — see Master §10.3.

## Forbidden imports

- `domain/` → React, Next.js, Drizzle, AI SDKs
- `application/` → UI, ORM
- `components/` → `domain/`, `application/`, `infrastructure/`
