# ADR 0001: Clean Architecture and Pipeline Organization

> **Superseded by [ADR 0002](./0002-master-specification.md).** Active truth: [MASTER_SPECIFICATION.md](../MASTER_SPECIFICATION.md).

**Status:** Superseded  
**Date:** 2026-07-02  
**Deciders:** Engineering team

## Context

The BOQ platform is an enterprise internal application requiring auditability, multi-tenancy, AI integration, and future ERP connectivity. We need an architecture that keeps business rules testable, prevents framework lock-in in core logic, and scales across multiple business domains.

## Decision

Adopt **clean architecture** with four layers (domain, application, infrastructure, presentation) organized by an **eight-stage business pipeline**:

```
Projects → BOQs → Pricing → Knowledge → AI Categorization → Construction → Reporting → ERP
```

- Domain defines entities, invariants, and repository interfaces
- Application contains use cases and DTOs
- Infrastructure implements persistence, AI, auth, and future ERP adapters
- Presentation (`app/`, `components/`) handles HTTP and UI wiring only

## Consequences

**Positive:**
- Business rules testable without database or UI
- Pipeline stages provide clear feature boundaries
- ERP and AI integrations isolated behind ports

**Negative:**
- More files and folders than a monolithic approach
- Requires discipline to keep route handlers thin

## Related

- [ADR 0002: Master Specification](./0002-master-specification.md)
- [MASTER_SPECIFICATION.md](../MASTER_SPECIFICATION.md)
