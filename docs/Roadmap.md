# Roadmap

**Version 1 implementation phases and post-v1 features.**

Business rules, workflows, and terminology: [MASTER_SPECIFICATION.md](./MASTER_SPECIFICATION.md) — do not duplicate here.

**Legend:** ✅ Done · ⬜ Not started · 🔜 Post-v1

---

## Current state

| Item | Status |
|------|--------|
| Next.js bootstrap | ✅ |
| Engineering handbook consolidated | ✅ |
| Domain / DB / API / feature UI | ⬜ Not started |

---

## Phase 0 — Foundation ✅

| Deliverable | Status |
|-------------|--------|
| Next.js + React + TypeScript + Tailwind bootstrap | ✅ |
| TypeScript strict | ✅ |
| Master Specification + standards + Cursor rules | ✅ |

---

## Phase 1 — Core Infrastructure ⬜

| Deliverable | Status |
|-------------|--------|
| Folder scaffold per [MASTER §10.3](./MASTER_SPECIFICATION.md#103-folder-structure-v1) | ⬜ |
| `domain/shared/` (Result, errors, branded ids) | ⬜ |
| Drizzle + PostgreSQL (Supabase) | ⬜ |
| Supabase Auth (email/password) | ⬜ |
| Typed env + `.env.example` | ⬜ |
| Composition root (`infrastructure/di/`) | ⬜ |
| Vitest + `/api/health` | ⬜ |
| Audit event scaffolding | ⬜ |

**Exit:** Database migrations run in CI; Supabase auth verified; health endpoint responds.

---

## Phase 2 — Projects & BOQs ⬜

| Deliverable | Status |
|-------------|--------|
| `Project` aggregate (Name, Client, Status, Created Date) | ⬜ |
| No physical project delete | ⬜ |
| Close project — GM or System Administrator only | ⬜ |
| BOQ + BoqItem production model | ⬜ |
| Import flow → Workshop Batch + Import Snapshot | ⬜ |
| API: `/api/v1/projects`, `/api/v1/boqs` | ⬜ |
| Empty BOQ publish guard | ⬜ |

**Exit:** Create project → import BOQ → Workshop Batch created.

---

## Phase 3 — Families ⬜

| Deliverable | Status |
|-------------|--------|
| Hierarchical `Family` model (MEP) | ⬜ |
| Family admin UI (System Administrator) | ⬜ |
| Deprecated family enforcement | ⬜ |

**Exit:** Maintain family tree independent of projects; AI can read hierarchy.

---

## Phase 4 — Workshop ⬜

| Deliverable | Status |
|-------------|--------|
| `WorkshopBatch` per import (immutable snapshot) | ⬜ |
| Human review and edit in batch | ⬜ |
| Approve / reject categorization (Estimator, Reviewer, AI Reviewer) | ⬜ |
| Workshop isolated from production writes | ⬜ |

**Exit:** Review cycles in batch; zero production writes from Workshop actions.

---

## Phase 5 — AI Categorization ⬜

| Deliverable | Status |
|-------------|--------|
| `ICategorizationService` port + OpenAI adapter | ⬜ |
| Provider configuration (no hardcoded vendor in use cases) | ⬜ |
| Categorize use case in Workshop Batch context | ⬜ |
| Traceable AI suggestions + audit | ⬜ |
| Confidence display only — no auto-apply | ⬜ |

**Exit:** AI suggests FamilyId; every suggestion traceable; no production write from AI.

---

## Phase 6 — Production Publish ⬜

| Deliverable | Status |
|-------------|--------|
| Partial publish (default) + full publish | ⬜ |
| Write `BoqItem.FamilyId` only on production | ⬜ |
| Role gate: GM, Technical Office Manager, System Administrator | ⬜ |
| Audit trail per publish | ⬜ |

**Exit:** Unauthorized roles blocked; every publish audited.

---

## Phase 7 — Reporting ⬜

| Deliverable | Status |
|-------------|--------|
| Operational dashboards | ⬜ |
| PDF, Excel, CSV export | ⬜ |
| Read-only report queries | ⬜ |

**Exit:** Exports work; reporting never writes domain data.

---

## Phase 8 — Roles & Authorization ⬜

| Deliverable | Status |
|-------------|--------|
| Seven v1 roles | ⬜ |
| Publish vs approval separation enforced server-side | ⬜ |
| Extensible policy module (minimal v1 checks) | ⬜ |

**Exit:** All permission rules in [MASTER §7](./MASTER_SPECIFICATION.md#7-roles-and-authorization) enforced in use cases.

**Note:** Begin minimal role checks from Phase 2; complete policy module by Phase 8. Publish gate required before production deploy (Phase 6).

---

## Phase 9 — Hardening ⬜

| Deliverable | Status |
|-------------|--------|
| E2E (Playwright): import → workshop → AI → approve → publish | ⬜ |
| Staging + CI pipeline (lint, typecheck, test, migrate, build) | ⬜ |
| Security review | ⬜ |

---

## v1 dependency graph

```
Phase 1 (Infrastructure)
  → Phase 2 (Projects + BOQs + Import)
    → Phase 3 (Families)
      → Phase 4 (Workshop)
        → Phase 5 (AI)
          → Phase 6 (Publish)
            → Phase 7 (Reporting)

Phase 8 (Roles) — start minimal checks at Phase 2; complete before production deploy
Phase 9 (Hardening) — continuous from Phase 1
```

---

## Post-v1 features 🔜

**Do not design or implement in Version 1.** Listed here for planning only.

### ERP integration

- Vendor adapters and sync jobs
- Outbound events from production publish
- Feature flag default off
- Sync rules and mapping **TBD** when product opens this phase

### Pricing engine

- Margins, SKU management, multi-currency
- Rate approval workflows
- Price lists and formulas
- Procurement integration

### Margin calculations & procurement & inventory

- Cost formulas, approved rates, procurement workflows
- Inventory tracking

### Construction execution

- Site plans, work assignments, feasibility
- Any execution workflow beyond BOQ categorization

### Multi-tenancy

- Tenant isolation at database and API layers
- Organization-scoped data access
- Per-tenant configuration and billing

### SSO / OIDC

- Enterprise identity (Azure AD, Google Workspace, etc.)
- Replaces or supplements email/password auth

### Advanced BI

- Financial analytics beyond operational dashboards
- Pricing variance reports
- Portfolio-level analytics

### AI expansion (post-v1)

- Rate or description generation
- Additional model providers beyond configuration scaffolding

---

## Related

- [MASTER_SPECIFICATION.md](./MASTER_SPECIFICATION.md)
- [getting-started.md](./getting-started.md)
