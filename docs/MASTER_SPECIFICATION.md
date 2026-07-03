# Master Specification

**Version:** 1.0  
**Status:** Confirmed — single source of truth for Version 1  
**Audience:** Product, engineering, AI agents  
**Change policy:** Business changes require product approval and a version bump of this document. Engineering standards change via PR with no business-rule edits here.

**Related (reference only — do not duplicate content from this file):**

- [Roadmap.md](./Roadmap.md) — implementation phases and post-v1 features
- [standards/](./standards/) — engineering how-to guides

---

## §0 Authority

| Priority | Document | Owns |
|----------|----------|------|
| 1 | **This file** | Business concepts, workflows, terminology, v1 architectural decisions |
| 2 | [Roadmap.md](./Roadmap.md) | Delivery sequencing, deferred features |
| 3 | [standards/](./standards/) | Implementation conventions |
| 4 | `.cursor/rules/` | File-scoped guardrails; must link here, not restate rules |

---

## §1 Mission

Build a **trustworthy, auditable AI-assisted BOQ categorization platform** for an **electromechanical (MEP) contracting company**. AI accelerates Family classification; humans retain control over what reaches production.

### Guiding principles

1. **Production data is sacred** — production is modified only through Publish.
2. **Workshop isolation** — all pre-production work happens in the Workshop staging environment.
3. **Human approval always** — AI suggests; humans approve; confidence never bypasses review.
4. **Audit everything important** — publish and AI suggestions are fully traceable.
5. **Business rules over technical convenience** — when in conflict, business rules win.
6. **Simplicity over premature scalability** — build v1 only; defer complexity to [Roadmap.md](./Roadmap.md).

---

## §2 Version 1 scope

### In scope

| Capability | Notes |
|------------|-------|
| Authentication | Supabase Auth — email and password |
| Projects | Required fields; lifecycle rules in §6 |
| BOQs | Belong to a project; reference quantity and unit rate preserved |
| Families | Hierarchical MEP classification knowledge base |
| Import old BOQs | Creates Workshop Batch snapshot |
| Workshop | Isolated staging — §5, §6 |
| AI categorization | Suggestions only — §8 |
| Human review & approval | In Workshop — §5, §7 |
| Publish | Only production write path — §6 |
| Audit trail | Indefinite retention — §9 |
| Dashboards | Operational views |
| Exports | Excel, PDF, CSV |

### Out of scope (see [Roadmap.md](./Roadmap.md) only)

ERP · Pricing engine · Margin calculations · Procurement · Inventory · Construction execution · Multi-tenancy · SSO · Advanced BI

Do not design, scaffold, or document v1 implementations for out-of-scope features.

---

## §3 Platform workflow

There is **no direct AI → Production path**.

```
Production BOQ
      ↓
Import (creates immutable Import Snapshot)
      ↓
Workshop Batch
      ↓
AI Analysis
      ↓
AI Suggestions  (ProposedFamilyId — traceable, never writes production)
      ↓
Human Review
      ↓
Approval        (in Workshop — not Publish)
      ↓
Publish         (authorized roles only — writes BoqItem.FamilyId on production)
      ↓
Production BOQ  (updated)
      ↓
Reporting       (read-only dashboards and exports)
```

### Environment boundaries

| Environment | Allowed | Forbidden |
|-------------|---------|-----------|
| **Workshop** | Import snapshots, AI analysis, suggestions, human review, edits, approvals, experiments | Any write to production BoqItem data |
| **Production** | Read by Workshop/reporting; **write FamilyId only via Publish** | Direct AI writes; import writes; review writes |
| **Reporting** | Read all upstream data; export | Any write to domain aggregates |

---

## §4 Terminology

Use these terms consistently in code, UI, APIs, and documentation.

| Term | Definition |
|------|------------|
| **Project** | Root container for BOQs — client, status, audit history |
| **BOQ** | Bill of Quantities — structured document scoped to one project |
| **BoqItem** | Single line in a BOQ (production or workshop snapshot line) |
| **Family** | Hierarchical MEP work-item classification in the knowledge base — independent of any single project. **Not** subcontractors, crews, or trade packages |
| **FamilyId** | Identifier of the assigned Family on a BoqItem |
| **Workshop** | Isolated **staging** environment for all pre-production work |
| **Import Snapshot** | Immutable copy of BOQ data at import time — basis of a Workshop Batch |
| **Workshop Batch** | One batch created per import operation; holds snapshot + review state |
| **AI Suggestion** | AI-proposed FamilyId for a workshop line — traceable, pending human decision |
| **Proposed category** | Workshop state: AI or import suggestion not yet approved |
| **Approved category** | Workshop state: human accepted categorization for a line — still **not** production until Publish |
| **Publish** | Controlled operation copying approved FamilyId from Workshop to production `BoqItem.FamilyId` |
| **Audit event** | Immutable record of a significant action (AI suggestion, review, publish, admin) |

### Code naming (v1)

```
Project, ProjectId
Boq, BoqId, BoqItem, BoqItemId
Family, FamilyId
WorkshopBatch, WorkshopBatchId
ProposedCategory, ApprovedCategory
UserId, Role
```

Avoid generic names: `Item`, `Row`, `Data`, `Record`.

**TBD:** Exact table/column names for Workshop vs production BoqItem storage — §12.

---

## §5 Core workflows

### 5.1 Import → Workshop Batch

1. User imports an old BOQ (file format **TBD** — §12).
2. System creates a **new Workshop Batch** with an **immutable Import Snapshot**.
3. Each import creates a **new** batch — prior batch snapshots are not mutated.
4. Multiple AI analysis and human review cycles may occur **within the same batch**.

### 5.2 AI categorization (inside Workshop)

1. AI analyzes workshop lines in batch context.
2. AI produces **suggestions** (proposed FamilyId + rationale + confidence).
3. Every suggestion is **persisted and traceable** (§9).
4. AI **never** modifies production data.

### 5.3 Human review and approval (inside Workshop)

1. Reviewers inspect AI suggestions and may edit proposed categorizations.
2. **Approval** accepts categorization **in Workshop** — this is **not** Publish.
3. Approved lines are eligible for Publish; unapproved lines are not.

**Approval roles (confirmed):** Estimator, Reviewer, AI Reviewer.

**TBD:** Whether General Manager and Technical Office Manager may approve in Workshop — §12.

### 5.4 Publish (Workshop → Production)

1. Authorized user initiates Publish for a Workshop Batch (or subset).
2. System writes **`FamilyId` only** onto production **BoqItem** rows for approved lines.
3. System creates a full **audit record** for the publish operation.
4. Unapproved production lines remain **unchanged** (partial publish — default mode).

**Publish roles (confirmed):** General Manager, Technical Office Manager, System Administrator.

Estimators, Reviewers, and AI Reviewers **cannot** Publish.

### 5.5 Publish modes (confirmed)

| Mode | Behavior |
|------|----------|
| **Partial (default)** | Only approved lines in scope are published; `FamilyId` written on those production BoqItems only |
| **Full** | When all in-scope lines are approved — publishes all approved lines in batch scope |

### 5.6 Reporting

1. Dashboards and exports read production and audit data.
2. Reporting **never** writes to Projects, BOQs, Workshop, or production BoqItems.

---

## §6 Domain concepts and invariants

### 6.1 Project

**Required fields (confirmed):**

| Field | Required |
|-------|----------|
| Project Name | Yes |
| Client | Yes |
| Status | Yes |
| Created Date | Yes (system-set) |

**Lifecycle (confirmed):**

| Rule | Detail |
|------|--------|
| Deletion | Projects are **never physically deleted** |
| Close | **General Manager** or **System Administrator** only |
| Closed projects | Remain searchable and auditable |

**TBD:** Whether new imports are blocked on closed projects — §12.

### 6.2 BOQ and BoqItem

| Rule | Detail |
|------|--------|
| Ownership | Every BOQ belongs to exactly one valid project |
| Reference data | Quantity and unit rate preserved as **reference only** — no pricing engine in v1 |
| Empty publish | **Empty BOQs cannot be published** |
| Production write | Publish updates **`BoqItem.FamilyId` only** — no other production field via Publish |

### 6.3 Family

| Rule | Detail |
|------|--------|
| Structure | Hierarchical MEP classification maintained in knowledge base |
| Scope | Independent of any single project |
| Deprecation | Deprecated families **cannot** be assigned to new production BoqItems |
| AI | AI may suggest FamilyId — human approval in Workshop required before Publish |

**TBD:** Maximum hierarchy depth — §12.

### 6.4 Workshop Batch

| Rule | Detail |
|------|--------|
| One per import | Each import operation creates a **new** Workshop Batch |
| Snapshot | Import Snapshot is **immutable** |
| Review cycles | Multiple AI and human review cycles within the same batch |
| Re-import | New import → new batch; does not alter prior snapshots |
| Isolation | Workshop data is separate from production until Publish |

### 6.5 Audit

See §9.

---

## §7 Roles and authorization

### 7.1 Roles (v1)

| Role | Typical focus |
|------|----------------|
| System Administrator | Platform, users, Families admin, publish, close project, audit archival |
| General Manager | Oversight, publish, close project, reporting |
| Technical Office Manager | Technical alignment, publish |
| Estimator | Import, Workshop, categorization approval — **no publish** |
| Reviewer | Workshop review, categorization approval — **no publish** |
| AI Reviewer | AI output review, categorization approval — **no publish** |
| Viewer | Read-only |

Fine-grained permission matrix is **deferred** — do not design hundreds of permissions in v1.

### 7.2 Permission summary (confirmed)

| Action | Allowed roles |
|--------|----------------|
| Production publish | General Manager, Technical Office Manager, System Administrator |
| Close project | General Manager, System Administrator |
| Categorization approval (Workshop) | Estimator, Reviewer, AI Reviewer |
| User administration | System Administrator |
| Audit archival | System Administrator |

### 7.3 Enforcement

- **UI hides; server enforces** — authorization checks in use cases, not UI alone.
- Unauthorized actions return **403** and are logged server-side.
- **Approval ≠ Publish** — separate actions, separate role gates.

---

## §8 AI categorization

### 8.1 Scope (v1)

Line-item categorization — primarily **Family assignment**. Runs in **Workshop Batch** context only.

### 8.2 Provider architecture (confirmed)

| Rule | Detail |
|------|--------|
| Port | `ICategorizationService` in application layer |
| Default provider | OpenAI via `infrastructure/ai/providers/openai/` |
| Configuration | Provider selectable via system settings — business logic never hardcodes a vendor |
| Future providers | Additional adapters (e.g. Anthropic, Gemini) without use case changes — configuration only, not v1 delivery |

Vendor SDKs exist **only** in `infrastructure/ai/`.

### 8.3 Suggestions and confidence (confirmed)

| Rule | Detail |
|------|--------|
| Output | AI produces **suggestions** — not production writes |
| Confidence | Configurable display settings — **informational only** |
| Auto-apply | **Forbidden** — no confidence threshold may write production or skip human approval |
| Validation | All LLM JSON parsed through **Zod** before persistence |
| Traceability | Every suggestion logged with model, prompt version, correlation id — not full BOQ bodies in logs |

### 8.4 Explainability (UI)

Each suggestion displays: proposed Family, rationale, confidence (not color-only), “AI suggestion” badge, Accept/Reject actions. See [standards/UI.md](./standards/UI.md).

---

## §9 Audit and retention

| Rule | Detail |
|------|--------|
| Retention | Audit records are **never automatically deleted** |
| Scope | AI suggestions, review actions, approvals, publish operations, administrative actions |
| Archival | Removal only via explicit **System Administrator** archival operation |
| Publish | Every publish operation produces a complete audit trail |
| AI | Every AI suggestion is traceable to model, batch, user context, and timestamp |

---

## §10 Architecture (v1)

### 10.1 Pattern

**Clean Architecture** with **feature-based** vertical slices. Business logic in `domain/` and `application/`. Framework and drivers in `infrastructure/`. UI in `app/` and `components/`.

### 10.2 Dependency rule

```
app/, components/, hooks/  →  application/  →  domain/
infrastructure/             →  domain/  (implements interfaces)
```

| Layer | Must NOT import |
|-------|-----------------|
| `domain/` | React, Next.js, Drizzle, HTTP, vendor AI SDKs |
| `application/` | UI, route handlers, ORM |
| `components/` | `domain/`, `application/`, `infrastructure/` |

Route handlers: validate (Zod) → use case → map DTO (~30 lines). See [standards/API.md](./standards/API.md).

Wire repositories and use cases in `infrastructure/di/` (composition root) — not ad hoc in every route.

### 10.3 Folder structure (v1)

```
domain/
  project/     boq/     family/
  workshop/    reporting/    shared/

application/
  use-cases/   dto/   mappers/   ports/

infrastructure/
  persistence/   ai/   auth/   config/   di/
  reporting/

components/
  ui/   shared/   project/   boq/   family/   workshop/   reporting/

app/   drizzle/   tests/   hooks/   lib/
```

Do **not** create `domain/pricing/`, `domain/construction/`, or `domain/erp/` in v1.

### 10.4 Request context (v1)

v1 operates as a **single organization**. No multi-tenant isolation.

```typescript
type RequestContext = {
  userId: UserId;
  roles: Role[];
  correlationId: string;
};
```

Resolve identity at the request boundary (Supabase session). Pass context into every use case.

**TBD:** Whether to add optional `organizationId` column on tables for future use — §12.

### 10.5 Key ports (v1)

| Port | Purpose |
|------|---------|
| `ICategorizationService` | AI Family suggestions |
| Repository interfaces in `domain/` | Persistence abstractions |

No ERP or pricing ports in v1.

### 10.6 Domain events (v1)

Emit events for audit and future integration where cheap — e.g. `ProductionPublished`, `WorkshopItemApproved`, `AiSuggestionRecorded`.

Event payloads are defined during implementation. Do not implement ERP consumers in v1.

### 10.7 System settings

AI confidence display thresholds and provider selection live in configurable system settings — **not** hardcoded constants tied to auto-apply (auto-apply is forbidden).

**TBD:** Storage mechanism for system settings — §12.

---

## §11 Tech stack (v1)

| Layer | Technology |
|-------|------------|
| Frontend | Next.js, React, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Next.js Route Handlers, TypeScript |
| Database | PostgreSQL (Supabase), Drizzle ORM |
| Authentication | Supabase Auth (email/password) |
| Validation | Zod |
| AI | Provider abstraction; default OpenAI |
| Hosting | Vercel (app), Supabase (database + auth) |

Read `node_modules/next/dist/docs/` before implementing — Next.js 16 has breaking changes from older versions.

---

## §12 Open decisions (TBD)

Do not assume answers during implementation without product confirmation.

| # | Decision |
|---|----------|
| 1 | Workshop vs production **data model** — separate tables vs shared BoqItem with environment flag |
| 2 | **Import file formats** (Excel, CSV, etc.), validation rules, and max file size |
| 3 | **Publish API shape** — e.g. `/api/v1/workshop-batches/:id/publish` vs alternative |
| 4 | Whether **closed projects** block new imports |
| 5 | Whether **GM / TOM** may approve categorization in Workshop (in addition to Publish) |
| 6 | **Maximum Family hierarchy depth** |
| 7 | **Dashboard views** at launch — specific widgets and filters |
| 8 | **PII redaction** policy for exports |
| 9 | **System settings** storage (database table vs configuration) |
| 10 | Optional **`organizationId`** on schema for future multi-org — column now or defer |

---

## §13 Current state

Phase 0 complete: Next.js bootstrap, TypeScript strict, engineering handbook consolidated.

**No application code** beyond bootstrap — no domain layer, database schema, API routes, or feature UI.

Implementation sequence: [Roadmap.md](./Roadmap.md).
