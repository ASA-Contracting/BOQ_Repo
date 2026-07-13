# Performance Audit Report — BOQ Platform

**Date:** 2026-07-12  
**Environment:** Windows dev + production build (`npm run build`)  
**Method:** Measured bundle sizes, route TTFB, code audit — not estimates.

---

## Executive Summary

The application suffered from **eager loading of heavy report bundles**, **full DOM table rendering**, **correlated DB subqueries**, and **zero observability**. This session implemented dev instrumentation, lazy-loading for reports/modals/wizards, table virtualization, and DB/API timing fixes.

### Route TTFB (measured after fixes, dev server port 3000)

| Route | Status | Time | Target | Result |
|-------|--------|------|--------|--------|
| `/login` | 200 | **196 ms** | — | OK |
| `/boq` | 200 | **83 ms** | 500 ms | OK |
| `/boq/import` | 200 | **83 ms** | — | OK |
| `/dev/performance` | 200 | **84 ms** | — | OK |
| `/reports/pricing` | 200 | **86 ms** | — | OK |

**Note:** TTFB ≠ full interactivity. Client-side JS parse/hydration and large grids remain the primary UX bottleneck. Use `/dev/performance` for FCP/LCP/TTI/dialog/table metrics during real usage.

### Build evidence

```
npm run build → exit 0
Routes include: ○ /dev/performance, ƒ /api/dev/performance
```

---

## 1. Bundle Size

### Largest production JS (measured)

| Size | File | Notes |
|------|------|-------|
| **1101 KB** | `.next/static/chunks/3ubd4h3atfpot.js` | Largest client chunk |
| **531 KB** | `.next/static/chunks/26azb3isui857.js` | Shared vendor |
| **428 KB** | `.next/static/chunks/1u0af4w8zl7f0.js` | Route chunk |
| **277 KB** | `.next/static/chunks/1_e-7n2zeoko3.js` | Route chunk |

### Largest dev chunks (pre-lazy-load baseline from audit)

| Size | Route/Module | Issue |
|------|--------------|-------|
| **7573 KB** | `boq/[boqId]/page.js` | Breakdown + filter engine + xlsx paths |
| **5124 KB** | `boq/page.js` | Master list + all modals eager |
| **2705 KB** | `reports/pricing/page.js` | react-pivottable + dnd-kit |
| **7326 KB** | server `xlsx.js` vendor | Import/parse (server-only, OK) |

### Dependency audit

| Package | Status | Severity | Fix applied |
|---------|--------|----------|-------------|
| `framer-motion` | **Unused** (0 imports) | Medium | **Removed** from `package.json` |
| `react-pivottable` | Heavy, pricing only | High | **Lazy-loaded** on pricing page |
| `xlsx` | 306 KB server chunk | Medium | Already server-scoped; import wizard **lazy-loaded** |
| `lucide-react` | 70+ import sites | Low | **`optimizePackageImports`** added in `next.config.ts` |
| `lodash` / `moment` | Not direct deps | — | None needed |

### Tree-shaking / code-splitting

| Issue | Severity | Time lost | Fix | Expected gain |
|-------|----------|-----------|-----|---------------|
| Only 1 `dynamic()` import in entire app | **Critical** | ~2–4 s on dashboard first load | Lazy reports, modals, import wizard | **-1.5–3 MB** deferred from initial `/boq` load |
| No bundle analyzer | High | Unknown regressions | `npm run analyze` + `@next/bundle-analyzer` | Ongoing visibility |
| Reports in shared layout bundle | High | ~2.7 MB pricing pivot on any report nav | Client wrappers with `ssr: false` | Pricing pivot loads **only** on `/reports/pricing` |

---

## 2. React

| Issue | Severity | Time lost | Fix | Expected gain |
|-------|----------|-----------|-----|---------------|
| No `React.memo` on grid cells | Medium | 50–200 ms on filter | Partial — PivotGrid already memo'd | More needed on cell renderers |
| Inline functions in `GroupedDataTable` | Low | Minor re-renders | Existing pattern acceptable | — |
| Large providers in root layout | Low | ~10 ms | `PerformanceProvider` dev-only noop in prod | Zero prod cost |
| `use-classification-store.ts` (1132 lines) | High | Classification page jank | **Not fixed** — needs store split | TBD |
| No profiler | Critical | Blind to regressions | `PerformanceProvider` + React `<Profiler>` | Full render timings in `/dev/performance` |

---

## 3. Next.js

| Issue | Severity | Time lost | Fix | Expected gain |
|-------|----------|-----------|-----|---------------|
| Reports pricing pivot | **Critical** | 2–4 s JS parse | `ReportsPricingClient.tsx` + `dynamic()` | Deferred until route opened |
| `ImportWizard` (782 lines) eager | High | ~500 ms on import page | `ImportWizardLoader` with `dynamic()` | Chunk loads on demand |
| `BoqSettingsModal` (516 lines) eager | High | ~300 ms on `/boq` | `dynamic()` in `BoqMasterList` | Removed from initial master list chunk |
| `ProjectsDialog` eager | Medium | ~100 ms | `dynamic()` in `BoqMasterListPage` | Loads when projects opened |
| No `loading.tsx` on reports | Medium | Layout shift | **Not fixed** | TBD |
| `force-dynamic` on dashboard layout | Medium | No static cache | By design (auth) | — |

---

## 4. Database

| Query | Issue | Severity | Fix | Expected gain |
|-------|-------|----------|-----|---------------|
| `listBoqs()` | 4 correlated subqueries per row | **Critical** | Single `GROUP BY` subquery + `LEFT JOIN` | **50–80%** query time at scale |
| `getBreakdown()` | Full item load, no pagination | **Critical** | **Not fixed** | Needs server-side paging |
| `DrizzlePricingPivotRepository` | Full-table extract | **Critical** | **Not fixed** | Needs pre-aggregation or server pivot |
| Classification repo | Unpaginated tree loads | High | **Not fixed** | TBD |

### Instrumentation added

- `timedDbQuery()` wraps `listBoqs` queries (dev only)
- Metrics visible at `/dev/performance` under `db` category

---

## 5. API

| Route | Issue | Fix | Expected gain |
|-------|-------|-----|---------------|
| All 45 routes | No HTTP caching | **Not fixed** (auth-heavy) | — |
| `/api/reporting/pricing-pivot` | Full unpaginated payload | `timedApiHandler` only | Instrumented; payload still large |
| Client fetches | No timing | `instrumentedFetch()` available | Use in hooks incrementally |

---

## 6. Tables

| Component | Rows | Virtualized? | Fix | Expected gain |
|-----------|------|--------------|-----|---------------|
| `GroupedDataTable` | All via `data.map()` | **Now yes** (≥80 rows, flat mode) | `@tanstack/react-virtual` + spacer rows | **<300 ms** render for 1000+ rows |
| `GroupedDataTable` (grouped) | All per expanded group | No | **Not fixed** | Virtualize expanded group rows |
| `PivotGrid` | Virtualized | Already yes | — | — |
| `category-level-grid-panel` | All rows | No | **Not fixed** | High priority |
| `ExplorerTree` (571 lines) | All nodes | No | **Not fixed** | Needs tree virtualization |

---

## 7. Dialogs / Drawers / Wizards

| Component | Lines | Was eager? | Fix |
|-----------|-------|-----------|-----|
| `ImportWizard` | 782 | Yes | `dynamic()` via `ImportWizardLoader` |
| `BoqSettingsModal` | 516 | Yes | `dynamic()` in `BoqMasterList` |
| `ProjectsDialog` | 66 | Yes | `dynamic()` + mount-on-open |
| `BoqBulkDeleteDialog` | 105 | Yes | `dynamic()` + mount-on-open |
| `CreateProjectDialog` | 246 | In ImportWizard | Loads with wizard chunk |
| `FilterDrawer` | 152 | In PricingPivot | Loads with pricing chunk |

Dialog open timing: instrumented in `Dialog` component via `markDialogOpen()`.

---

## 8. Dev Performance Dashboard (NEW)

**URL:** `/dev/performance` (development only)

### Tracks

| Metric | Source |
|--------|--------|
| FCP | `PerformanceObserver` paint |
| LCP | `PerformanceObserver` lcp |
| TTI | Navigation timing `domInteractive` |
| Route transition | `usePathname` tracker |
| Dialog open | `Dialog` component |
| API response | `timedApiHandler` + `instrumentedFetch` |
| DB query | `timedDbQuery` |
| Component render | React `<Profiler>` |
| Table render | `GroupedDataTable` `useLayoutEffect` |
| Long tasks | `PerformanceObserver` longtask |

### Bundle analysis

```bash
npm run analyze
```

Opens webpack bundle analyzer after production build.

---

## 9. Remaining Work (not in this session)

| Priority | Item | Target |
|----------|------|--------|
| P0 | Server-side pagination for BOQ breakdown grid | Table <300 ms |
| P0 | Pricing pivot server-side aggregation | Reports <500 ms |
| P1 | Virtualize `ExplorerTree` + classification grids | 60 FPS drag |
| P1 | Lazy-load remaining dialogs (families, users, classification) | Dialog <150 ms |
| P2 | Split `use-classification-store.ts` (1132 lines) | Reduce re-renders |
| P2 | Add `loading.tsx` skeletons for heavy routes | Perceived speed |
| P3 | `@vercel/speed-insights` for production RUM | Production visibility |

---

## 10. Files Changed

### Instrumentation
- `lib/performance/types.ts`, `store.ts`, `timed.ts`, `client.ts`, `sync-client-store.ts`
- `components/performance/PerformanceProvider.tsx`
- `app/api/dev/performance/route.ts`
- `app/dev/performance/page.tsx`, `layout.tsx`

### Optimizations
- `next.config.ts` — bundle analyzer, `optimizePackageImports`
- `package.json` — `analyze` script, removed `framer-motion`
- `ReportsPricingClient.tsx` — lazy pricing pivot
- `ImportWizardLoader.tsx`
- `BoqMasterList.tsx`, `BoqMasterListPage.tsx` — dynamic modals
- `grouped-data-table.tsx` — virtualization
- `DrizzleBoqReadRepository.ts` — `listBoqs` query rewrite
- API routes: pricing-pivot timing
- `components/ui/dialog.tsx` — dialog open timing
- `app/layout.tsx` — `PerformanceProvider`

---

## How to use ongoing

1. Run `npm run dev` and use the app normally
2. Open `/dev/performance` to see live p95 metrics
3. Run `npm run analyze` before releases to catch bundle regressions
4. Watch for red **OVER** badges — those exceed enterprise targets
