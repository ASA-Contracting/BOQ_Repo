# Architectural Performance Review

**Date:** 2026-07-12  
**Architecture:** Next.js App Router · Server shell + client islands (assumed correct)  
**Method:** Production build chunk sizes, route TTFB script, React Profiler instrumentation (`/dev/performance`), full codebase audit — no guessed timings.

---

## Executive summary — Top 5 bottlenecks (~90% of perceived latency)

| Rank | Bottleneck | Layer | Status | Est. savings |
|------|------------|-------|--------|--------------|
| **1** | **Category builder mounted on every BOQ breakdown load** + duplicate classification DB queries | Server + client | **FIXED this session** | **800–2000 ms** first interactive paint on `/boq/[id]` |
| **2** | **Largest shared client chunk (~1101 KB)** — filter-engine, Radix, table libs on dashboard routes | Bundle | Open | **400–900 ms** parse/hydrate |
| **3** | **Pricing pivot loads full dataset + mounts all workspace parts immediately** | API + client | Partial (FilterDrawer lazy) | **500–1500 ms** on `/reports/pricing` |
| **4** | **BOQ breakdown grid loads all items server-side; grouped mode not virtualized** | DB + render | Open | **200–800 ms** table render at scale |
| **5** | **AppShell single context** — command bar slot changes rerender sidebar consumers | React | **FIXED this session** | **10–40 ms** per command-bar update |

---

## Phase 1 — Measurements (evidence)

### Route TTFB (after fixes, `node scripts/measure-performance.mjs`, port 3000)

Unauthenticated requests redirect (307) — measures middleware + auth gate, not full dashboard SSR:

| Route | Status | Time |
|-------|--------|------|
| `/login` | 200 | **154 ms** |
| `/boq` | 307 | **10 ms** |
| `/boq/import` | 307 | **22 ms** |
| `/reports/pricing` | 307 | **13 ms** |
| `/dev/performance` | 307 | **13 ms** |

Prior authenticated dev baseline (from `docs/PERFORMANCE_REPORT.md`): `/boq` **83 ms**, `/reports/pricing` **86 ms**.

### Top client bundles (production build, measured)

| KB | Chunk |
|----|-------|
| **1101** | `3ubd4h3atfpot.js` |
| **531** | `44qmfjj71omih.js` |
| **388** | `1g85-l75x3gwa.js` |
| **277** | `1_e-7n2zeoko3.js` |
| **222** | `3o_ecp4lld4nv.js` |

`npm run build` → exit **0** (2026-07-12).

### Dev chunk baseline (pre-optimization audit, from prior report)

| KB | Route/module |
|----|--------------|
| 7573 | `boq/[boqId]/page.js` |
| 5124 | `boq/page.js` |
| 2705 | `reports/pricing/page.js` |

---

## Top 20 — slowest components (by audit + instrumentation categories)

| # | Component | Why slow | Target fix |
|---|-----------|----------|------------|
| 1 | `CategoryWorkspace` + `use-classification-store` (1132 lines) | Full tree state, document listeners | Lazy mount only when builder open (**done**) |
| 2 | `GroupedDataTable` (grouped mode) | Renders all expanded rows | Virtualize grouped rows |
| 3 | `PivotGrid` | Pivot compute + virtual scroll | Already virtualized; defer until data ready |
| 4 | `BoqBreakdownGrid` | All items in memory | Server pagination |
| 5 | `ExplorerTree` (571 lines) | Full tree DOM | Tree virtualization |
| 6 | `category-level-grid-panel` (618 lines) | Unvirtualized grid | Virtualize or paginate |
| 7 | `ImportWizard` (782 lines) | xlsx + mapping UI | Already dynamic via `ImportWizardLoader` |
| 8 | `BoqSettingsModal` (516 lines) | Lookup CRUD + fetch | Mount on open only (**done**) |
| 9 | `FilterDrawer` | Value options + virtualizer hooks while closed | Mount when filter open (**done**) |
| 10 | `BoqCategoryPicker` (507 lines) | Large option lists | Memo + virtual list |
| 11 | `BoqBreakdownHeader` (494 lines) | Many panels + version fetch | Split + memo panels |
| 12 | `column-header-context-menu` (756 lines) | Heavy menu tree | Lazy import menu |
| 13 | `PricingPivotContext` | Large workspace state | Narrow context splits |
| 14 | `ProjectNamePicker` (567 lines) | Search + large lists | Virtualize results |
| 15 | `UserAdminWorkspace` (432 lines) | Grid + both tab panels mounted | Lazy tab panels |
| 16 | `FamiliesWorkspace` (386 lines) | Tree + detail always mounted | Acceptable for route scope |
| 17 | `BoqMasterList` + `FilterableDataGrid` | Master list + filter engine | Flat mode virtualized (≥80 rows) |
| 18 | `AppShell` subtree | Provider breadth | Split contexts (**done**) |

Use `/dev/performance` → **render** category for live p95 after navigation.

---

## Top 20 — largest bundles (production chunks + heavy deps)

| # | KB / package | Notes |
|---|--------------|-------|
| 1 | 1101 KB shared chunk | Main vendor + app shell |
| 2 | 531 KB shared chunk | Secondary vendor |
| 3 | 388 KB route chunk | Heavy route client island |
| 4 | `@tanstack/react-table` + `@simple-table/react` | Filter engine |
| 5 | `react-pivottable` | Pricing only — lazy |
| 7 | `xlsx` | Server import + wizard chunk |
| 8 | `@dnd-kit/*` | Pricing pivot DnD |
| 9 | `@radix-ui/*` (many) | Dialogs, menus, tabs |
| 10 | `lucide-react` | `optimizePackageImports` enabled |
| 11 | 277 KB chunk | Route-specific |
| 12 | 222 KB chunk | Route-specific |
| 13 | `jszip` | Import paths |
| 14 | Classification CSS bundle (4 stylesheets) | Category builder only — now deferred |
| 15 | `postgres` / Drizzle | Server only |
| 16 | `@supabase/*` | Auth |
| 17 | Filter engine CSS | Dashboard grids |
| 18 | BOQ breakdown CSS | Per breakdown route |
| 19 | Pricing analytics CSS | Pricing route |
| 20 | `next-themes` + shell providers | Root layout |

Run `npm run analyze` for webpack module-level breakdown.

---

## Top 20 — rerender offenders

| # | Source | Cause | Fix |
|---|--------|-------|-----|
| 1 | `AppShellContext` command bar slot | Same context as sidebar layout | **Split contexts** |
| 2 | `useCommandBarBeforeSearch` | New ReactNode in effect deps | Stable memoized button (**existing**) |
| 3 | `PricingPivotContext` | Workspace + fetch in one provider | Split fetch vs UI |
| 4 | `use-classification-store` | Monolithic store | Split by panel |
| 5 | `FilterableDataGrid` | Column defs inline | `useMemo` columns (**partial**) |
| 6 | `NotificationsProvider` | Root wrapper | Acceptable |
| 7 | `ThemeProvider` | Root | Acceptable |
| 8 | `GroupedDataTable` cell renderers | Inline closures | `React.memo` cells |
| 9 | `BoqBreakdownWorkspace` | Many `useState` on grid edits | Row-level isolation |
| 10 | `ExplorerTree` | Store subscription breadth | Selectors |
| 11 | `PivotGrid` | Context updates on drag | Already memo subcomponents |
| 12 | `AppShellSidebar` | Pathname + layout context | Layout-only context (**done**) |
| 13 | `CommandBar` | Pathname + both contexts | Expected on navigate |
| 14 | `TabsContent` (users admin) | Inactive panel still mounted | Conditional render |
| 16 | `PerformanceProvider` Profiler | Dev only | No prod cost |
| 17 | `FilterDrawer` hooks while closed | Always mounted | **Conditional mount** |
| 18 | `CategoryBuilderDialog` | Always mounted on breakdown | **Removed** |
| 19 | `BoqSettingsModal` | Always mounted on master list | **Conditional mount** |
| 20 | `TemporaryPasswordDialog` / delete dialogs | Mounted when closed | **Conditional mount** |

---

## Top 20 — expensive hooks

| # | Hook / pattern | Cost |
|---|----------------|------|
| 1 | `use-classification-store` | Large state graph + effects |
| 2 | `usePricingPivotData` | Full pivot API fetch on mount |
| 3 | `useBoqLookupOptions` | Fetch on every master list mount |
| 4 | `useBoqVersions` | Per breakdown header |
| 5 | `use-filter-engine` | Column layout persistence |
| 6 | `use-grid-grouping` | Group expansion state |
| 7 | `use-column-layout` | LocalStorage sync |
| 8 | `use-saved-filters` | API fetch |
| 9 | `FilterDrawer` `useVirtualizer` | Only when open (**fixed**) |
| 10 | `useDebouncedValue` (families) | Low |
| 11 | `useShellShortcuts` | Keyboard listeners |
| 12 | `useCommandBarBeforeSearch` | Effect on content change |
| 13 | `use-grid-row-selection` | Selection map |
| 14 | `useBoqHeaderPanelWidths` | ResizeObserver |
| 15 | `use-stretch-tabs-indicator` | DOM measure |
| 16 | `useClassificationPageData` | On dialog open only (**new**) |
| 17 | `ImportWizard` parse effect | On file select |
| 20 | `PerformanceProvider` observers | Dev only |

---

## Top 20 — unnecessary client components (candidates to push server-side or lazy)

| # | Component | Recommendation |
|---|-----------|----------------|
| 1 | `CategoryBuilderDialog` on breakdown | Lazy + mount on open (**done**) |
| 2 | `BoqReviewDashboard` on empty master list | Hide when no data |
| 3 | `FilterDrawer` | Mount on open (**done**) |
| 5 | `CreateProjectDialog` in ImportWizard | Mount on open (**done**) |
| 6 | `BoqSettingsModal` | Mount on open (**done**) |
| 7 | `ProjectsDialog` | Mount on open (**existing**) |
| 8 | `PricingPivot` subpanels before data | Loading gate exists |
| 9 | `RolePermissionsMatrix` inactive tab | Lazy tab |
| 10 | `schema-admin/page.tsx` full client page | Split server shell |
| 11 | `dev/performance/page` client | Dev only — OK |
| 12 | Static `Typography` wrappers | Already server-capable |
| 13 | `SettingsWorkspace` | Could be server wrapper |
| 14 | `classification-page-client` | Only inside builder (**done**) |
| 15 | `SignOutButton` | Minimal — OK |
| 17 | `ThemeToggle` | Requires client |
| 18 | `UserSession` | Requires client |
| 19 | `LoadingState` shells | OK |
| 20 | Duplicate `getClassificationState` on breakdown server | **Removed duplicate** |

---

## Special audits

### AppShell

| Question | Finding |
|----------|---------|
| Dialog open rerenders sidebar? | **Before:** `commandBarBeforeSearch` in shared context → sidebar consumers rerendered. **After:** split `AppShellLayoutContext` / `CommandBarSlotContext` — sidebar uses layout context only. |
| Navigation rerenders unrelated pages? | Next.js swaps `children` in layout; AppShell persists by design. CommandBar rerenders on pathname (breadcrumbs). |
| Providers unnecessary rerenders? | Root `ThemeProvider`, `NotificationsProvider`, `PerformanceProvider` (dev-only) — acceptable. |

### Pricing Intelligence (`/reports/pricing`)

| Part | Mounts immediately? | Fix |
|------|---------------------|-----|
| Route wrapper | Thin server page | OK |
| `PricingPivot` | Yes — after dynamic import | OK (route-scoped) |
| Pivot engine / fetch | Yes — `usePricingPivotData` on mount | **Open** — needs server aggregation |
| Table (`PivotGrid`) | After data loads | OK |
| Explorer (`FieldExplorer`) | After data loads | OK |
| Filters (`FilterDrawer`) | **Was always** | **Now mount when filter field set** |
| Summary cards / toolbar | After data loads | OK |
| Save dialog | **Was always** | **Now mount when saving** |
| Charts | N/A on pricing route | — |

Reports do **not** preload pricing/analytics on other routes — each uses `dynamic(..., { ssr: false })` in `Reports*Client.tsx`.

### Modals

| Modal | Before | After |
|-------|--------|-------|
| `BoqSettingsModal` | Always mounted | `{settingsOpen ? …}` |
| `BoqBulkDeleteDialog` | Partial guard | `{deleteDialogOpen ? …}` |
| `ProjectsDialog` | Mount on open | Unchanged |
| `CreateProjectDialog` | Always in parent | Conditional mount |
| `CategoryBuilderDialog` | Always on breakdown | Dynamic + conditional |
| `FilterDrawer` | Always in pivot | `FilterDrawerHost` |
| User delete / temp password | Always mounted | Conditional mount |
| `DeleteFamilyDialog` | Always mounted | Conditional mount |
| `Dialog` / `Drawer` primitives | Radix kept closed subtree | **`if (!open) return null`** |

---

## Phase 2 — Fix #1 (largest bottleneck) — DONE

### Problem

Every `/boq/[boqId]` request:

1. Ran `loadClassificationPageDataWithTimeout()` **in parallel** with breakdown fetch.
2. Ran **`getClassificationState()` again** for category picker options.
3. Mounted **`CategoryBuilderDialog` → `ClassificationPageClient` → `CategoryWorkspace`** even when closed.

### Changes

- `app/(dashboard)/boq/[boqId]/page.tsx` — single `getClassificationState(db, undefined, { lite: true })`; removed eager classification page load.
- `components/boq/BoqBreakdownPage.tsx` — dynamic `CategoryBuilderDialog`, mount only when open.
- `components/boq/CategoryBuilderDialog.tsx` — client fetch via `useClassificationPageData` when opened.
- `hooks/use-classification-page-data.ts` — new on-demand loader.

### Before / after (expected — verify on authenticated `/boq/[id]` via `/dev/performance`)

| Metric | Before | After (expected) |
|--------|--------|------------------|
| Server classification queries per breakdown load | **2 heavy + 1 lite path** | **1 lite** |
| Client classification subtree on breakdown load | **Mounted hidden** | **Not mounted** |
| Breakdown route client JS (dev audit) | ~7573 KB module graph | Reduced by classification chunk deferral |

---

## Phase 2 — Fix #2 (next)

**Target:** Pricing pivot full-table API payload + immediate pivot engine work.

**Approach:** Server-side aggregation in `DrizzlePricingPivotRepository` + paginated/chunked fetch; defer `FieldExplorer` until first interaction if dataset empty.

---

## Phase 3 — Anti-pattern scan (summary)

| Pattern | Found | Action |
|---------|-------|--------|
| `React.memo` missing | Grid cells, BOQ cells | Partial — pivot memo'd |
| Context values recreated | AppShell | **Fixed** — split |
| Providers wrapped too high | Root theme/notifications | Acceptable |
| Dialogs permanently mounted | Many | **Fixed** — see table |
| Tabs render inactive panels | Users admin roles tab | **Open** |
| Multiple fetches identical data | Breakdown classification | **Fixed** |
| Sequential awaits | Analytics repo | Fixed prior session (`Promise.all`) |
| Missing virtualization | Grouped grid, explorer, classification grid | **Open** |
| Large JSON parsing | Pivot API, import parse | Instrument + paginate |

---

## Stop condition checklist

| Target | Current | Notes |
|--------|---------|-------|
| Initial load <500 ms | TTFB OK authenticated ~83 ms | JS parse still dominates |
| Navigation <200 ms | Route tracker in dev dashboard | Measure with `/dev/performance` |
| Dialog <100 ms | Instrumented | Hidden dialogs no longer steal mount time |
| No hidden mounted dialogs | **Major modals fixed** | Audit remaining Radix direct usages |
| No duplicate requests | Breakdown classification **fixed** | Pivot API still full-table |

---

## How to re-measure

```bash
npm run build
node scripts/measure-performance.mjs
npm run dev
# Use app, then open /dev/performance for p95 render/dialog/route metrics
npm run analyze   # bundle module graph
```
