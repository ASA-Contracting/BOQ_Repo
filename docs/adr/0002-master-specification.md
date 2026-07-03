# ADR 0002: Master Specification as Single Source of Truth

**Status:** Accepted  
**Date:** 2026-07-02  
**Supersedes:** [ADR 0001](./0001-clean-architecture-and-pipeline.md)

## Context

The project requires one coherent engineering foundation before application code is written. Multiple handbook documents and Cursor rules contained duplicated business rules, conflicting pipeline definitions, and references to out-of-scope features (pricing, construction, ERP, multi-tenancy).

## Decision

1. **`docs/MASTER_SPECIFICATION.md`** is the canonical document for Version 1 business concepts, workflows, terminology, and architectural decisions.
2. **`docs/Roadmap.md`** owns implementation phases and all post-v1 features.
3. **`docs/standards/`** owns engineering how-to guides — they link to the Master Specification, never duplicate business rules.
4. All other documentation must reference the Master Specification or be deleted.
5. Version 1 pipeline: Production → Import Snapshot → Workshop Batch → AI → Review → Approval → Publish → Production. AI never writes production. Publish writes `BoqItem.FamilyId` only.

## Consequences

**Positive:**

- One place to resolve terminology and workflow disputes
- Onboarding reads Master Specification first
- Cursor rules become thin, file-scoped pointers

**Negative:**

- Large single document requires disciplined section updates
- Legacy doc paths removed — bookmarks must update

## Related

- [MASTER_SPECIFICATION.md](../MASTER_SPECIFICATION.md)
- [Roadmap.md](../Roadmap.md)
