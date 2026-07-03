# Database Standards

Engineering conventions for PostgreSQL + Drizzle. **No schema exists yet.**

Business rules: [MASTER_SPECIFICATION.md](../MASTER_SPECIFICATION.md)

---

## Stack

| Choice | Rule |
|--------|------|
| Database | PostgreSQL via Supabase |
| ORM | Drizzle |
| Access | Repository pattern in `infrastructure/persistence/` only |

Domain and application layers must **not** import Drizzle.

---

## Migrations

All schema changes via versioned migration files.

1. Edit `drizzle/schema/*.ts`
2. `npx drizzle-kit generate`
3. Review SQL in `drizzle/migrations/`
4. `npx drizzle-kit migrate` (local)
5. Commit schema + migration together
6. CI/CD runs migrate on deploy

**Forbidden:** `drizzle-kit push` on staging/production · editing applied migrations · manual prod schema changes

---

## Naming

| Object | Convention | Example |
|--------|------------|---------|
| Tables | plural snake_case | `boqs`, `boq_items` |
| Columns | snake_case | `family_id`, `unit_rate` |
| Migrations | descriptive suffix | `0001_create_boqs.sql` |

---

## Column types

| Concept | PostgreSQL type |
|---------|-----------------|
| Primary keys | `UUID` |
| Money / rates (reference) | `NUMERIC(19,4)` — never float |
| Quantity | `NUMERIC(19,6)` + separate `unit` column |
| Timestamps | `TIMESTAMPTZ` UTC |
| Attribution | `created_by`, `updated_by` where required |

---

## v1 scoping

Version 1 is **single organization**. Do not require `tenant_id` on every table unless [MASTER §12](../MASTER_SPECIFICATION.md#12-open-decisions-tbd) decision #10 selects optional `organizationId` for future use.

Repository queries must not assume multi-tenant filters in v1.

---

## Indexes

- Index foreign keys used in JOINs
- Composite indexes: equality columns first
- Partial indexes for filtered subsets where justified
- Document non-obvious indexes in migration PR
- Verify hot paths with `EXPLAIN ANALYZE`

---

## Transactions

- Managed in infrastructure (`unitOfWork`)
- Required for: multi-table writes, **Publish** (FamilyId updates + audit)
- Keep transactions short — **no AI or HTTP calls inside a transaction**
- Default isolation: `READ COMMITTED`
- Idempotency keys for retried mutations

---

## Repository mapping

```
ORM row → Mapper.toDomain() → Domain entity → application layer
```

Never return Drizzle `$inferSelect` types to application, UI, or API DTOs.

---

## Layout

```
drizzle/schema/
drizzle/migrations/
infrastructure/persistence/db.ts    ← single db instance
```

Seeding: dev/staging scripts only. Never auto-seed production.
