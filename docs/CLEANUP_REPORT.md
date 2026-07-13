# Safe Project Cleanup Report

**Date:** 2026-07-12  
**Scope:** Remove only provably unused files with 100% confidence.

## Summary

| Metric | Value |
|--------|-------|
| Files deleted | 7 |
| Folders deleted | 0 |
| Packages removed | 0 |
| Space saved | ~0.51 MB |
| Production build | Pass |
| TypeScript | Pass (via `next build`) |

---

## Deleted Files

| File | Why unused | References checked | Confidence |
|------|------------|-------------------|------------|
| `app/(dashboard)/classification/components/category-tree.tsx` | Legacy `CategoryTree` component; workspace uses `CategoryExplorerTree` → `ExplorerTree` | `grep` imports of `category-tree`, `CategoryTree` across all `.ts/.tsx/.js/.mjs` — zero runtime imports | 100% |
| `components/shared/DataTable.tsx` | Re-export barrel only; all code imports `@/components/ui/data-table` or `@/components/ui/data-grid` directly | `grep` `shared/DataTable` — only `docs/standards/DESIGN_SYSTEM.md` (updated) | 100% |
| `components/shared/TopNav.tsx` | Superseded by `AppShell` / `CommandBar`; zero imports | `grep` `TopNav` in `.ts/.tsx` — definition only | 100% |
| `components/shared/SidebarNav.tsx` | Superseded by `AppShellSidebar`; zero imports | `grep` `SidebarNav` in `.ts/.tsx` — definition only | 100% |
| `components/shared/SideNav.tsx` | Only imported by deleted `SidebarNav.tsx` | `grep` `SideNav` imports — `SidebarNav.tsx` only | 100% |
| `scripts/verify-category-tags-ui-failure.png` | Playwright failure screenshot artifact; regenerated on test failure | `grep` filename — written by `verify-category-tags-ui.mjs` only | 100% |
| `tsconfig.tsbuildinfo` | TypeScript incremental cache (gitignored) | Listed in `.gitignore`; not imported by any module | 100% |

---

## Deleted Folders

None removed. Empty placeholder directories were identified but not deleted (uncertainty around future routes / agent rule layout).

---

## Removed Packages

None. All dependencies have at least one import path in source (direct or via UI primitives).

---

## Space Saved

| File | Bytes |
|------|------:|
| `category-tree.tsx` | 4,617 |
| `DataTable.tsx` | 432 |
| `TopNav.tsx` | 2,202 |
| `SidebarNav.tsx` | 713 |
| `SideNav.tsx` | 2,657 |
| `verify-category-tags-ui-failure.png` | 131,960 |
| `tsconfig.tsbuildinfo` | 388,746 |
| **Total** | **~531 KB (0.51 MB)** |

---

## Validation Results

| Check | Result |
|-------|--------|
| `npm run build` | Pass — compiled successfully, zero TS errors |
| `npm run lint` | Pre-existing errors (react-hooks/set-state-in-effect, etc.) — **not introduced by cleanup** |
| `npm test` | 214 passed; 6 failed in `infrastructure/di/*` due to missing Supabase env in test runner — **pre-existing** |

---

## Remaining Warnings

- ESLint reports existing issues across import wizard, classification components, filter engine, etc. (unchanged by this cleanup).
- 6 unit tests fail without `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` in the vitest environment (unchanged).
- `scripts/verify-category-tags-ui-failure.png` will be recreated if the UI verification script fails again.

---

## Files Kept Due to Uncertainty

| Item | Reason kept |
|------|-------------|
| `public/*.svg` (5 files) | Default Next.js static assets; no code references found, but may be served directly by URL |
| `.kiro/steering/*.md` | Duplicate of `.cursor/rules`; agent tooling — may be intentional for Kiro IDE |
| `.cursor/rules/00-project` … `10-workflow` (empty dirs) | Legacy rule layout placeholders |
| `app/(dashboard)/crm` (empty) | Possible future route stub |
| `app/api/projects/search`, `app/api/projects/sync-abrd` (empty) | Possible planned API routes |
| `docs/architecture`, `docs/development`, `docs/domain` (empty) | Planned documentation sections |
| `infrastructure/ai/providers/openai` (empty) | Planned AI provider stub |
| `components/ui/accordion.tsx` + `@radix-ui/react-accordion` | Exported from design-system barrel; no app usage found, but part of UI kit |
| `scripts/port-abrd-*.mjs` | One-time CSS/token porting tools; not in `package.json` but may be needed for parity updates |
| `scripts/diagnose-tag-names.mjs` | Manual diagnostic script |
| `data/tender-projects-with-owners-2026-07-06.csv` | Import test sample data |
| All API routes, pages, hooks, styles, tests | Active or potentially referenced via Next.js routing / dynamic loading |

---

## Documentation Updated

- `docs/standards/DESIGN_SYSTEM.md` — import map and navigation section updated to reflect `AppShell` instead of removed `TopNav` / `SideNav` / `shared/DataTable`.
