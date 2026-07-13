---
inclusion: always
---

# Handbook

**Authoritative source:** `docs/MASTER_SPECIFICATION.md`  
**Implementation phases:** `docs/Roadmap.md`

Do not restate business rules in code comments, PRs, or other rules files — link to the Master Specification.

## Non-negotiable (v1)

1. **Production data is sacred** — Publish is the only production write path.
2. **Workshop is isolated staging** — imports, AI, review, approval happen in Workshop only.
3. **AI never modifies production** — suggestions only; every suggestion traceable.
4. **Human approval always** — confidence never auto-applies.
5. **Publish writes `BoqItem.FamilyId` only** — fully auditable.
6. **Approval ≠ Publish** — separate actions, separate role gates.
7. **Reporting is read-only.**
8. **Version 1 only** — no ERP, pricing engine, construction, multi-tenancy, SSO, advanced BI (see Roadmap.md).

## When unsure

Mark **TBD** — do not invent business rules.
