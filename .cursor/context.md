# BOQ Platform — Agent Context

**Read first:** [docs/MASTER_SPECIFICATION.md](../docs/MASTER_SPECIFICATION.md)

## v1 workflow (summary)

Production → Import Snapshot → Workshop Batch → AI Suggestions → Human Review → Approval → **Publish** → Production

- AI **never** writes production.
- Publish writes **`BoqItem.FamilyId` only**.
- Post-v1 features: [docs/Roadmap.md](../docs/Roadmap.md)

## Stack

Next.js · React · TypeScript · Tailwind · shadcn/ui · Supabase · Drizzle · Zod · Vercel

## State

Bootstrap only — begin at [Roadmap Phase 1](../docs/Roadmap.md#phase-1--core-infrastructure-).

## Standards

[docs/standards/](../docs/standards/) — API, UI, Database, Coding
