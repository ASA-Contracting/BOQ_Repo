---
inclusion: fileMatch
fileMatchPattern: ['drizzle/**/*', 'infrastructure/persistence/**/*']
---

# Database

See `docs/standards/Database.md`.

- Drizzle only in `infrastructure/persistence/`.
- Migrations only — never `drizzle-kit push` on staging/production.
- Map ORM rows to domain entities — never leak `$inferSelect` to application.
- v1 single org — no mandatory tenant_id (Master §10.4).
