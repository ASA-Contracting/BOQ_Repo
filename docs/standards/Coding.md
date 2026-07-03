# Coding & Testing Standards

TypeScript, quality, git, and testing conventions.

Domain language and layer rules: [MASTER_SPECIFICATION.md](../MASTER_SPECIFICATION.md)

---

## TypeScript

`"strict": true` — fix types; do not weaken compiler options.

**Forbidden:** `any` · unchecked `@ts-ignore` · non-null `!` without invariant · `as Type` to silence errors · untyped JSON at boundaries

**Required:**

- Branded ids: `type BoqId = string & { readonly __brand: 'BoqId' }`
- `Result<T, E>` from use cases for expected failures
- Named exports in `domain/` and `application/`
- Explicit return types on public APIs and `execute()`
- `type Input = z.infer<typeof schema>` for DTOs

Domain terms: see [MASTER §4](../MASTER_SPECIFICATION.md#4-terminology).

---

## Layer placement

| Code | Location |
|------|----------|
| Invariants | `domain/` |
| Use cases | `application/use-cases/` |
| Zod schemas | `application/dto/` |
| Repositories | `infrastructure/persistence/` |
| Route wiring | `app/` |
| UI | `components/` |

Identify feature slice before adding files ([MASTER §10.3](../MASTER_SPECIFICATION.md#103-folder-structure-v1)).

---

## Quality

- Functions ≤ 40 lines · max 3 nesting levels
- Comment **why**, not **what**
- `npm run lint` must pass
- Remove dead code in the same PR as replacement

---

## Error handling

- Domain errors: typed classes in `domain/shared/errors/`
- HTTP mapping: route layer only
- Log `correlationId` + `userId` server-side; safe messages client-side

---

## Testing

**Pyramid:** domain unit (most) → application → integration → E2E (few)

**Tooling:** Vitest · Playwright · Testing Library · test PostgreSQL for integration

**Layout:**

```
domain/**/*.test.ts
application/**/*.test.ts
tests/integration/
tests/e2e/
tests/factories/
```

| Change | Tests |
|--------|-------|
| New domain rules | Unit tests |
| New use cases | Application tests (mocked repos) |
| Bug fix | Regression test |

- Mock repository interfaces — not Drizzle internals
- No live LLM calls in tests
- Inject `Clock` for time-dependent logic

---

## Git

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready |
| `feature/*` | New work |
| `fix/*` | Bug fixes |
| `chore/*` | Tooling |

Imperative commit messages · focused PRs · migrations with schema changes · never force-push `main` · never commit secrets

---

## Code review checklist

- [ ] Aligns with [MASTER_SPECIFICATION.md](../MASTER_SPECIFICATION.md)
- [ ] Business logic not in routes/components
- [ ] Workshop actions do not write production
- [ ] Publish writes `BoqItem.FamilyId` only
- [ ] AI output Zod-validated before persist
- [ ] Reporting changes are read-only
- [ ] Migration included if schema changed
- [ ] No `any`; explicit use case return types

---

## Pre-PR checklist

- [ ] `npm run lint` passes
- [ ] Types compile
- [ ] Tests pass
- [ ] No debug logging
