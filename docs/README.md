# Engineering Handbook

AI-assisted BOQ categorization platform for electromechanical (MEP) contracting.

## Authority

| Priority | Document |
|----------|----------|
| 1 | **[MASTER_SPECIFICATION.md](./MASTER_SPECIFICATION.md)** — business, workflows, terminology, v1 architecture |
| 2 | **[Roadmap.md](./Roadmap.md)** — implementation phases and post-v1 features |
| 3 | **[standards/](./standards/)** — engineering how-to (links to Master, no duplicated rules) |
| 4 | `.cursor/rules/` — file-scoped guardrails |

**Rule:** If content exists in the Master Specification, other documents link to it — they do not copy it.

## Documents

| Document | Purpose |
|----------|---------|
| [MASTER_SPECIFICATION.md](./MASTER_SPECIFICATION.md) | **Single source of truth** — Version 1 only |
| [Roadmap.md](./Roadmap.md) | Phases 0–9 + deferred features |
| [getting-started.md](./getting-started.md) | Local setup and scripts |
| [standards/Database.md](./standards/Database.md) | Drizzle, migrations, PostgreSQL |
| [standards/API.md](./standards/API.md) | REST conventions, handlers |
| [standards/UI.md](./standards/UI.md) | Components, shadcn/ui, a11y |
| [standards/Coding.md](./standards/Coding.md) | TypeScript, testing, git |
| [adr/](./adr/) | Architecture decision records |
| [api/](./api/) | OpenAPI (when implemented) |

## Status

| Item | State |
|------|-------|
| Next.js bootstrap | ✅ |
| Master Specification | ✅ |
| Application code | ⬜ Not started — see [Roadmap.md](./Roadmap.md) Phase 1 |

## Agents

Quick reference: [`.cursor/context.md`](../.cursor/context.md)
