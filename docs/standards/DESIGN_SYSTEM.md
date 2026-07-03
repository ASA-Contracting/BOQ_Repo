# Design System

Enterprise workspace UI for BOQ Platform. Optimized for long daily sessions — dense information, maximum usable area, zero visual noise.

**Token source:** `app/globals.css`  
**Interactive patterns:** `lib/design/interactive.ts`  
**Components:** `components/ui/` (primitives) → `components/shared/` (shells)

---

## Design principles

1. **Workspace first** — every screen maximizes content area; chrome stays thin.
2. **Border over shadow** — elevation is subtle; borders define structure.
3. **14px base type** — readable at density without feeling consumer-grade.
4. **Token-only styling** — no one-off hex values or duplicated focus/hover strings.
5. **Human approval always** — AI suggestions use dedicated tokens, never auto-applied styling.

### Never use

- Oversized cards, glassmorphism, neumorphism, decorative gradients
- Consumer-style hero sections or marketing layouts inside the app
- Color-only status indicators (always pair with icon or label)

---

## Typography

| Token | Size | Use |
|-------|------|-----|
| `text-xs` | 11px | Captions, table headers, badges |
| `text-sm` | 13px | Body default, nav, form labels |
| `text-base` | 14px | Root body size |
| `text-lg` | 16px | Section headings |
| `text-xl` | 18px | Page subheadings |
| `text-2xl` | 22px | Page titles |

**Components:** `Heading`, `Text`, `LabelText`, `Code` from `@/components/ui/typography`

```tsx
<Heading level="h1">Families</Heading>
<Text variant="muted" size="sm">Manage classification hierarchy</Text>
```

Font stack: Geist Sans (UI), Geist Mono (codes, keyboard hints).

---

## Spacing

| Token | Value | Use |
|-------|-------|-----|
| `--space-page` | 24px | Page padding |
| `--space-section` | 16px | Panel internal padding |
| `--space-inline` | 12px | Toolbar, compact groups |
| `--space-compact` | 8px | Tight inline gaps |

Use Tailwind spacing (`gap-2`, `p-3`) for micro-layout; use CSS vars for page-level rhythm.

---

## Color palette

Semantic tokens in `:root` / `.dark`. Always reference by name:

| Token | Purpose |
|-------|---------|
| `background` / `foreground` | App canvas and primary text |
| `muted` / `muted-foreground` | Secondary surfaces and helper text |
| `primary` | Primary actions, focus ring |
| `secondary` | Secondary buttons, subtle fills |
| `accent` | Hover states, selection |
| `destructive` | Delete, errors |
| `success`, `warning`, `info` | Status (always with icon/label) |
| `sidebar-*` | Side navigation shell |
| `ai-suggestion-*` | AI-proposed values (Master §8.4) |

**Badge variants:** `default`, `outline`, `muted`, `primary`, `success`, `warning`, `destructive`, `info`, `ai`

---

## Border radius

| Token | Value | Use |
|-------|-------|-----|
| `--radius-sm` | 4px | Badges, kbd, checkboxes |
| `--radius-md` | 6px | Buttons, inputs, panels (default) |
| `--radius-lg` | 8px | Dialogs, notifications |

Avoid `rounded-xl` or pill shapes except for avatars.

---

## Shadows & elevation

Prefer borders. Shadows only when layering above content:

| Class | Level | Use |
|-------|-------|-----|
| `elevation-0` | None | Flat panels, tables |
| `elevation-1` | xs | Cards |
| `elevation-2` | sm | Dropdowns |
| `elevation-3` | md | Notifications |
| `elevation-4` | lg | Rare popovers |
| `elevation-overlay` | overlay | Modals |

---

## Icons

| Size | Class | Use |
|------|-------|-----|
| 14px | `h-3.5 w-3.5` | Inline with xs text, tree chevrons |
| 16px | `h-4 w-4` | Default — nav, buttons, inputs |
| 20px | `h-5 w-5` | Empty states (sparingly) |

Library: Lucide. One icon per action; no decorative icon clusters.

---

## Button hierarchy

| Variant | Use |
|---------|-----|
| `default` | Primary action (one per view) |
| `secondary` | Secondary commit actions |
| `outline` | Tertiary / cancel-adjacent |
| `ghost` | Toolbar, icon-adjacent, nav |
| `link` | Inline text actions |
| `destructive` | Irreversible delete |

| Size | Height | Use |
|------|--------|-----|
| `sm` | 28px | Dense toolbars |
| `default` | 32px | Standard |
| `lg` | 36px | Prominent CTAs (rare) |
| `icon` / `icon-sm` | 32px / 28px | Icon-only |

---

## Form controls

All inputs share `inputBase` from `lib/design/interactive.ts`:

- `Input`, `Textarea`, `Select` — consistent height, border, focus
- `FormField` — label, description, error wiring with `aria-*`
- `Checkbox` / `CheckboxField` — Radix checkbox with token styling

Heights: `sm` (28px), `md` (32px), `lg` (36px).

---

## Data display

### Tables

Primitives: `Table`, `TableHeader`, `TableRow`, `TableHead`, `TableCell`  
Shell: `DataTable` in `components/shared/DataTable.tsx`

- Sticky headers for long lists
- Right-align numeric columns
- Row hover: `hover:bg-muted/50`
- Selected row: `data-state="selected"`

### Trees

`Tree`, `TreeItem`, `TreeSkeleton` — keyboard-focusable rows, expand/collapse, selection state.

---

## Navigation

### Side navigation

`SideNavShell` + `SideNav` + `SideNavSection` in `components/shared/SideNav.tsx`

- Width: `--sidebar-width` (240px)
- Active item: `bg-sidebar-accent`
- Brand bar height matches top nav: `--topnav-height`

### Top navigation

`TopNav` + `Toolbar` in `components/shared/TopNav.tsx` — for workspace headers inside content area.

### Breadcrumbs

`Breadcrumbs` — truncate on small screens; current page is non-link, `font-medium`.

### Tabs

- **Segmented:** `TabsList` + `TabsTrigger` — filter/mode switching
- **Underline:** `UnderlineTabsList` + `UnderlineTabsTrigger` — page sections

---

## Feedback states

| State | Component |
|-------|-----------|
| Empty | `EmptyState`, `EmptyPanel` |
| Loading | `LoadingState`, `InlineLoading`, `Skeleton*` |
| Error | `ErrorState`, `InlineError` |
| Notification | `NotificationsProvider` + `useNotifications()` |

```tsx
const { notify } = useNotifications();
notify("Family saved", "success");
```

Legacy `Toast` remains for backward compatibility.

---

## Dialogs

`Dialog` — native `<dialog>` with token elevation. Sizes: `sm`, `md`, `lg`.  
`ConfirmDialog` — destructive action confirmation.  
Always provide explicit footer actions; never rely on backdrop click for destructive flows.

---

## Focus & hover

Global utilities in `globals.css`:

- `.focus-ring` — 2px ring, 2px offset, `ring-ring` color
- `.interactive` — 150ms color transition

Import shared strings from `lib/design/interactive.ts` inside CVA definitions. Never duplicate.

---

## Keyboard shortcuts

Display with `Kbd`, `KeyboardShortcut`, `ShortcutHint`.  
In dropdowns, use `DropdownMenuShortcut` aligned right.

---

## Layout shells

| Component | Use |
|-----------|-----|
| `PageHeader` | Title, description, breadcrumbs, actions, tabs |
| `PageContent` | Padded main area (`--space-page`) |
| `WorkspaceLayout` | Full-height flex column |
| `Panel` / `PanelHeader` | Bordered content regions |
| `SplitPane` | Master-detail workspaces |

---

## Component import map

```tsx
// Primitives
import { Button, Input, DataTable } from "@/components/ui";

// Shells
import { PageHeader, PageContent } from "@/components/shared/PageHeader";
import { SideNavShell } from "@/components/shared/SideNav";
import { TopNav } from "@/components/shared/TopNav";
import { DataTable } from "@/components/shared/DataTable";
```

---

## AI suggestion styling

When displaying AI-proposed values (Workshop only):

```tsx
<Badge variant="ai">AI suggestion</Badge>
<div className="rounded-md border border-ai-suggestion-border bg-ai-suggestion p-3">
  {/* proposed value + rationale + accept/reject */}
</div>
```

Publish remains a separate, confirmed action.

---

## Adding new components

1. Define tokens in `globals.css` if new semantic color/spacing is needed.
2. Add shared interactive classes to `lib/design/interactive.ts`.
3. Build primitive in `components/ui/` with CVA + `cn()`.
4. Compose shells in `components/shared/` if cross-feature.
5. Export from `components/ui/index.ts`.
6. Update this document.
