---
inclusion: fileMatch
fileMatchPattern: ['**/*.test.ts', '**/*.test.tsx', 'tests/**/*']
---

# Testing

See `docs/standards/Coding.md`.

- Mock repository interfaces — not Drizzle.
- No live LLM calls in tests.
- Domain rules → unit tests; use cases → application tests; bugs → regression tests.
