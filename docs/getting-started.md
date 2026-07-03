# Getting Started

## Prerequisites

- Node.js 20+
- npm
- Supabase project (when database/auth work begins)
- PostgreSQL via Supabase (when persistence begins)

## Install

```bash
git clone <repo-url>
cd BOQ_Repo
npm install
```

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run lint` | ESLint |

Additional scripts (`test`, `typecheck`, `db:migrate`) will be added in [Roadmap Phase 1](./Roadmap.md#phase-1--core-infrastructure-).

## Environment variables

Create `.env.local` at the project root (not committed). Template will ship as `.env.example` in Phase 1.

```env
# Supabase (required when auth + DB are added)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Database (Supabase connection string)
DATABASE_URL=

# AI (required when AI features are added)
AI_API_KEY=
AI_PROVIDER=openai
```

Access env vars through typed config at `infrastructure/config/env.ts` once implemented.

## Path alias

`@/*` maps to the project root:

```typescript
import { CreateProjectUseCase } from '@/application/use-cases/project/CreateProjectUseCase';
```

## Read next

1. [MASTER_SPECIFICATION.md](./MASTER_SPECIFICATION.md) — §3 workflow and §5 core workflows
2. [Roadmap.md](./Roadmap.md) — implementation phases
3. [standards/Coding.md](./standards/Coding.md) — before writing code

## Next.js note

This project uses **Next.js 16** with breaking changes from older versions. Read `node_modules/next/dist/docs/` before implementing routes or data fetching.
