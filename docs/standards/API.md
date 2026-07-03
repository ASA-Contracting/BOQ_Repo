# API Standards

HTTP API conventions. **No routes exist yet.**

Business rules and workflows: [MASTER_SPECIFICATION.md](../MASTER_SPECIFICATION.md)

---

## Base path

```
/api/v1/{resource}
```

Version prefix required. Breaking changes need a version bump or migration path.

---

## REST conventions

- Nouns, not verbs · kebab-case paths
- Nested resources when owned: `/api/v1/boqs/:boqId/items`

| Method | Pattern | Action |
|--------|---------|--------|
| GET | `/api/v1/{resource}` | Paginated list |
| GET | `/api/v1/{resource}/:id` | Get one |
| POST | `/api/v1/{resource}` | Create |
| PATCH | `/api/v1/{resource}/:id` | Partial update |
| DELETE | `/api/v1/{resource}/:id` | Soft delete where applicable |

---

## Response envelopes

**Success:**

```json
{
  "data": {},
  "meta": { "page": 1, "pageSize": 20, "total": 142 }
}
```

**Error:**

```json
{
  "error": {
    "code": "BOQ_NOT_FOUND",
    "message": "Human-readable message",
    "details": {}
  }
}
```

---

## HTTP status codes

| Code | When |
|------|------|
| 200 | Successful GET, PATCH |
| 201 | Successful POST |
| 204 | Successful DELETE |
| 400 | Validation failed |
| 401 | Unauthenticated |
| 403 | Forbidden |
| 404 | Not found |
| 409 | Conflict |
| 422 | Domain rule violation |
| 429 | Rate limit |
| 500 | Unexpected (no stack trace in production) |

---

## Handler flow

1. Auth → `RequestContext` ([MASTER §10.4](../MASTER_SPECIFICATION.md#104-request-context-v1))
2. Parse with shared Zod schema from `application/dto/`
3. Execute use case
4. Map domain result → DTO → JSON

Target **~30 lines per handler**.

Map domain errors to HTTP in the route layer only. Use cases return `Result<T, DomainError>`.

---

## Validation

- One Zod schema per input shape in `application/dto/`
- Same schema for route handlers and forms
- Zod guards shape; domain guards business meaning

---

## Prohibited

- Business logic, SQL, or ORM in route files
- GET that mutates state
- Leaking stack traces or internal details in production
- Duplicated inline Zod schemas per route

---

## v1 routes (to implement)

Exact shapes **TBD** where noted in [MASTER §12](../MASTER_SPECIFICATION.md#12-open-decisions-tbd).

| Area | Prefix |
|------|--------|
| Health | `/api/health` |
| Projects | `/api/v1/projects` |
| BOQs | `/api/v1/boqs` |
| Families | `/api/v1/families` |
| Workshop | `/api/v1/workshop-batches` |
| Publish | TBD — likely under workshop-batches |
| Reports | `/api/v1/reports/*` |

OpenAPI spec → `docs/api/` when API stabilizes.

---

## Idempotency

Retried mutations accept `Idempotency-Key` — deduplicate in infrastructure.
