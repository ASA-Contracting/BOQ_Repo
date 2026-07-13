---
inclusion: fileMatch
fileMatchPattern: ['app/api/**/*', 'application/**/*']
---

# Backend

See `docs/standards/API.md` and `docs/standards/Coding.md`.

- Handlers: auth → Zod → use case → DTO (~30 lines).
- Zod in `application/dto/` — domain validates business rules.
- Use cases return `Result<T, DomainError>`.
- No Drizzle or business logic in route files.
