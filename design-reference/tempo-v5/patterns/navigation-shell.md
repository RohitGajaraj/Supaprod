# Navigation shell & sidebar

> The permanent frame every authenticated Cadence screen lives inside: a left rail holding the seven fixed destinations (IA 2026-07-11), a topbar carrying clickable location crumbs, and a page header that introduces whatever the rail brought the user to. Ask lives on Cmd+J and the palette, not the rail.
> Extension — base: Geist `Entity`, `Badge`, `Breadcrumb`/`BreadcrumbItem`, `DotsMenu`/`MenuItem`, `ContextMenu` (best-practice guidance only), Separator, Tooltip, plus the `--ds-*` color/materials/spacing/motion tokens · inspiration: Linear (rail density and row alignment discipline), Arc (the sidebar as a calm, permanent space rather than a chrome afterthought).

## Anatomy — the parts, named, with layout relationships

The shell is a two-column frame: a fixed-width **rail** on the left and a fluid **content column** on the right. The content column stacks a **topbar**, an optional **page header**, and the scrollable page body.

```
┌──────────────┬──────────────────────────────────────────────────────────┐
│ RAIL         │ TOPBAR                                                    │
│              │  [≡ mobile]  Breadcrumb trail            [Ask]  [avatar]  │
│ Workspace     ├──────────────────────────────────────────────────────────┤
│ switcher      │ PAGE HEADER (optional)                                    │
│ (Entity)      │  Heading                                    [Primary]    │
│ ────────────  │  One-line description                                    │
│ Today      1  │  Section nav (tabs), if the surface has sub-views         │
│ Discover   2  ├──────────────────────────────────────────────────────────┤
│ Plan       3  │                                                            │
│ Build      4  │ PAGE BODY (scrolls independently of the rail)             │
│ Brain      5  │                                                            │
│ ────────────  │                                                            │
│ Engine Room g │                                                            │
│ Settings      │                                                            │
│ ────────────  │                                                            │
│ User chip     │                                                            │
│ (Entity)      │                                                            │
└──────────────┴──────────────────────────────────────────────────────────┘
```

Named parts:

1. **Rail** — the persistent left column. Two widths only: **expanded** (240px, label + icon) and **icon-rail** (56px, icon only, collapsed). Both are layout constants derived from the 4px spacing ramp (240 = 60x, 56 = 14x), not `--ds-*` tokens; Geist does not publish a sidebar-width token, so this pattern fixes one so it never drifts per-surface.
2. **Workspace switcher** — the rail's top row. An `Entity` (`left` = 24px workspace avatar/initial, center = `EntityContent` title = workspace name, `right` = a chevron-down icon). Clicking it opens a `material-menu` popover (Radix DropdownMenu) listing other workspaces, "Create workspace", and "Workspace settings".
3. **Primary destinations** — exactly seven rows (IA 2026-07-11), in fixed order: **Today** (pinned above the groups, unnumbered, carries the ONE attention badge fed by the server-computed needsYouCount), the **WORKFLOW** group with mono indexes **01 Discover, 02 Plan, 03 Design, 04 Build** (indexes appear only here because only here is sequence real), then **Memory** and **Engine Room** as unnumbered single rows. Keys 1-7 map to the seven rows and are DERIVED from PRIMARY_NAV (src/lib/nav-model.ts) along with the palette JUMP section - a parity test enforces it. This order is IA law; new capability is a tab or a panel inside one of the seven, never a new rail row. Decide is absorbed as Discover's Queue tab; the Ledger is the Record room's Paper trail tab.
4. **The Engine Room door** — the last primary row (key 7, plus the legacy 'g' alias rendered as a hint on the row). It is the single entry point to every piece of machinery (the verify cockpit, receipts/Paper trail, traces, evals, drift, budgets, connections). Inside, a persistent vertical room switcher (rooms as a left tab rail with view sub-tabs, the Vercel project-settings pattern) keeps the machinery map visible at any depth.
5. **Footer group** — Settings (always visible), then a Separator, then the **user chip** (another `Entity`: avatar left, name + workspace role center, chevron right opening the account menu: switch workspace, invite, sign out).
6. **Collapse control** — a small icon button at the rail's bottom edge (or on its right border, Linear-style) that toggles expanded/icon-rail. Persisted (cookie or local storage) so the choice survives reload.
7. **Topbar** — a 48px-tall strip at the top of the content column, never the full window width (the rail sits beside it, not under it). Holds, left to right: a mobile-only menu trigger (hidden ≥768px), the **breadcrumb trail** (`Breadcrumb`/`BreadcrumbItem`), a flexible spacer, the **Ask** entry (a small tertiary button, icon + "Ask" + a `Cmd J` hint rendered in `text-label-12-mono`), and the account avatar is intentionally NOT duplicated here (it already lives in the rail's user chip — one artifact, one home).
8. **Page header** — sits directly under the topbar, only on surfaces that need to introduce themselves (most do). A `text-heading-24` or `text-heading-20` title, a `text-copy-14` one-line description of the outcome the page delivers, and up to one primary action button on the right (never two primary buttons side by side; a second action is secondary or tertiary).
9. **Section nav** — page-header tabs for a surface with sub-views (for example Build's mission list vs. mission detail tabs). Lives directly under the header text, above the Separator that closes the header block.

## Variants — every sanctioned variant and when to use each

- **Expanded rail (default, desktop)** — icon + label + optional badge on every row. Use whenever the viewport has room (≥1024px) and the user has not explicitly collapsed it.
- **Icon-rail (collapsed, desktop/tablet)** — icon only, label suppressed, shown on hover/focus as a `material-tooltip`. Use when the user collapses it deliberately, or as the tablet default (768 to 1023px) to give page content more width. The seven destinations, Settings, and the user chip all keep their row position; only the label disappears.
- **Off-canvas drawer (mobile, <768px)** — the rail is not rendered inline at all; the mobile-only topbar trigger opens it as a `Sheet` (Radix Dialog) sliding in from the left, full rail content (expanded style), with a scrim behind it.
- **Text breadcrumb vs. menu breadcrumb** — `type="text"` (plain trail) for a strict, non-branching path (for example Build > a single mission); `type="menu"` when a level has real siblings worth jumping to directly from the trail (for example Plan > a spec, where sibling specs exist).
- **Page header with vs. without section nav** — a detail surface with exactly one view omits the tabs row entirely; do not render an empty/single-tab nav.
- **Page header with vs. without a primary action** — omit the action button entirely on read-only or purely navigational surfaces (for example Brain's landing view) rather than rendering a disabled placeholder button.

## States — default/hover/active/focus/disabled/loading/empty/error

**Rail nav row** (a 36px `--ds-size-medium` control; treat it exactly like the shared popover-row anatomy: `--ds-popover-row-radius` 6px, `--ds-popover-row-padding` horizontal 8px):

| State                                               | Background                                            | Border                                 | Text / icon                                                                                    |
| --------------------------------------------------- | ----------------------------------------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Default                                             | transparent                                           | none                                   | `--ds-gray-900` (icon and label both secondary)                                                |
| Hover                                               | `--ds-gray-100` -> `--ds-gray-200` on continued hover | none                                   | `--ds-gray-1000`                                                                               |
| Active (selected route)                             | `--ds-gray-100` (persistent, not just on hover)       | none                                   | `--ds-gray-1000` text, icon tinted `--ds-ember-600` (the one chromatic mark of "you are here") |
| Focus-visible                                       | as default/hover                                      | `--ds-focus-ring-outline` (2px, ember) | unchanged                                                                                      |
| Disabled (rare: a destination gated pre-onboarding) | transparent                                           | none                                   | `--ds-gray-700`, `cursor: not-allowed`, paired with a `Tooltip` explaining the gate            |
| Loading (workspace list still resolving)            | `--ds-gray-100` skeleton bar                          | none                                   | Geist `Skeleton`, not a spinner, not an empty row                                              |

**Engine Room door** shares the row anatomy above but never carries the ember active tint on its icon even when a child surface (traces, drift, budgets) is open; instead the row itself gets the `active` background so the door reads "you are inside it" without borrowing the brand color reserved for the primary destinations.

**Workspace switcher / user chip (`Entity`)**:

| State               | Treatment                                                                                                                          |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Default             | `--ds-background-100` row background, `--ds-gray-900` secondary line                                                               |
| Hover               | `--ds-gray-alpha-100` wash over the whole row (both are `as="button"` rows)                                                        |
| Open (menu showing) | row background pinned to `--ds-gray-100` while `material-menu` is open, chevron rotates 180deg over `--ds-motion-popover-duration` |
| Focus-visible       | `--ds-focus-ring-outline` around the row                                                                                           |
| Loading             | `Entity`'s documented Skeleton composition (one full-width line + three short pills) in place of `EntityContent`                   |

**Badge on a nav row** (unread/needs-you counts): `variant="ember" contrast="low"` (bg `--ds-ember-200`(light)/`--ds-ember-100`(dark) equivalent low tone, text `--ds-ember-900`) for something the user must act on; plain `variant="gray"` for a neutral count. Never a second ember badge on the same screen as the header's primary action, per the one-brand-mark-per-view discipline — a count is information, not a second call to action.

**Topbar Ask button**: default = tertiary button styling (transparent, `--ds-gray-900` text); hover = `--ds-gray-100` background; while the Ask panel is open, the button gets the same persistent `active` background as an open menu trigger so the user can see the panel's summon point stays "on."

**Breadcrumb item** (per the Geist spec): default = plain text/link, `--ds-gray-900`; `active` (current page) = `--ds-gray-1000`, not a link; `disabled` = `--ds-gray-700`, non-interactive, still rendered for context.

**Mobile drawer**: closed (not mounted / `display:none`), opening/closing (300ms `--ds-motion-overlay-duration`, scale-and-slide per the overlay preset, scrim fading to `--ds-overlay-backdrop-opacity` 0.8 over `--ds-overlay-backdrop-color`), open (scrim intercepts outside clicks, focus trapped inside the sheet).

**Empty/error**: the rail itself has no empty state (the seven destinations are fixed and always render); the only thing that can be empty or error is the workspace switcher's menu list (no other workspaces: still shows "Create workspace" as the only row, never a blank popover) or a badge's source count failing to load (badge is simply omitted, never rendered as "0" or an error glyph, since a nav badge is not the place to surface a fetch failure).

## Interaction model — pointer, keyboard, screen-reader behavior, motion

**Pointer**: click a rail row to navigate; click the workspace switcher or user chip to open its `material-menu` popover anchored below the row; click the collapse control to toggle rail width (the content column reflows immediately, no page reload); hover an icon-rail row to reveal its label as a `material-tooltip` after the standard hover-intent delay; right-click or long-press a workspace/user row for the equivalent power actions via `ContextMenu` if the surface offers any (mirrored as a visible `DotsMenu` on the row too, since ContextMenu must never be an action's only path).

**Keyboard** (full map):

| Key                                     | Effect                                                                                                                                                                                                                                                                            |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Tab` / `Shift+Tab`                     | Move focus through the rail in visual order: workspace switcher -> seven destination rows -> Settings -> user chip -> topbar crumbs -> page content                                                                                          |
| `Arrow Down` / `Arrow Up`               | While focus is inside the destination-row list, move between rows without leaving the list (roving tabindex)                                                                                                                                                                      |
| `Home` / `End`                          | Jump to the first / last row in the focused list                                                                                                                                                                                                                                  |
| `Enter` / `Space`                       | Activate the focused row (navigate) or open the focused menu trigger                                                                                                                                                                                                              |
| `Escape`                                | Close whatever popover, menu, or mobile sheet is open and return focus to its trigger                                                                                                                                                                                             |
| `1`...`5` (bare key press, no modifier) | Jump straight to Today / Discover / Plan / Build / Brain, in that order. Suppressed while focus is in an `input`, `textarea`, or `contentEditable` element, while any modifier key is held, or while a modal dialog is open, so typing into a form or a dialog is never hijacked. |
| `g` (bare key press)                    | Open the Engine Room door directly                                                                                                                                                                                                                                                |
| `Cmd/Ctrl+B`                            | Toggle the rail between expanded and icon-rail (desktop only)                                                                                                                                                                                                                     |
| `Cmd/Ctrl+K`                            | Open the global Command Menu (jump-to-anything search); its trigger lives in the topbar, not the rail                                                                                                                                                                             |
| `Cmd/Ctrl+J`                            | Summon or dismiss the Ask panel from anywhere in the app, including while typing in most fields (a modifier chord, unlike the bare `1`-`5`/`g` rail shortcuts)                                                                                                                    |

**Screen reader**: the rail is a `<nav aria-label="Primary">` landmark; the seven destinations render as a `role="list"` of links, with the active one carrying `aria-current="page"`. The workspace switcher and user chip are buttons with `aria-haspopup="menu"` and `aria-expanded`. The mobile drawer is a Radix `Dialog` (`role="dialog"`, `aria-modal="true"`, labelled by an accessible-only "Navigation" title) so focus is trapped and restored to the trigger on close. The Ask button announces its shortcut in its accessible name ("Ask, keyboard shortcut Command J").

**Motion**: rail expand/collapse animates `width` over `--ds-motion-popover-duration` (200ms) on `--ds-motion-timing-swift`; the mobile sheet slides and the scrim fades over `--ds-motion-overlay-duration` (300ms) scaling in from `--ds-motion-overlay-scale` (0.96) on the same swift easing; the workspace-switcher chevron rotates over the same 200ms popover duration. All of it gates on `prefers-reduced-motion` (rail width and drawer position simply snap, no scale/slide). Nothing here ever uses a bounce; the swift easing's slight overshoot is the only character allowed, and only on the floating surfaces (popovers, the mobile sheet), never on the rail's own row hover states, which are a flat 150ms color transition.

## Responsive behavior — desktop / tablet / mobile

- **Desktop (≥1024px)**: rail expanded by default, user-collapsible to icon-rail; topbar spans the content column only; page header keeps its title + description + action on one line where width allows.
- **Tablet (768 to 1023px)**: rail defaults to icon-rail to give the content column room, still user-expandable; topbar's breadcrumb trail truncates the middle segments into a single "..." menu crumb before it truncates the current page's label; page header stacks the action button under the title if the description would otherwise wrap awkwardly.
- **Mobile (<768px)**: rail is not rendered inline at all; a menu-icon trigger appears at the topbar's left edge, opening the rail's full expanded content as an off-canvas `Sheet`. The breadcrumb trail collapses to only the current page's label (no trail) with a back-style affordance one level up, since horizontal space is the scarcest resource; the page header drops the description to one truncated line and the primary action moves to a fixed bottom bar if it is the surface's one required action (for example a Build "Approve" gate), otherwise it stays inline.

## Accessibility

- Rail landmark: `<nav aria-label="Primary">`; Engine Room door and footer rows share the same list, not a second unlabeled landmark.
- Focus order matches visual order top-to-bottom, rail first, then topbar, then page header, then page body; the mobile sheet, while open, becomes the entire focus order (trap), returning focus to its trigger on close.
- Every icon-only control (collapse toggle, mobile menu trigger, workspace-switcher chevron-only rendering in icon-rail mode) carries `aria-label`; no icon ever ships without one.
- Contrast: rail text on `--ds-background-100` uses `--ds-gray-900`/`--ds-gray-1000`, both meeting 4.5:1 against the dark and light background tokens at their respective theme; the ember active-icon tint (`--ds-ember-600` dark theme use, `--ds-ember-700` light) is a decorative addition on top of already-legible text, never the sole carrier of "this is the active page" (the persistent background + `aria-current="page"` carry that meaning too).
- `prefers-reduced-motion`: every transition named in Interaction model above collapses to an immediate state change; nothing here is essential to comprehension, so removing it loses no information.
- Focus ring is never suppressed on any rail row, menu trigger, or topbar control; `--ds-focus-ring-outline` always wins over any hover-only styling.

## Tokens used

| Token                                                                                                       | Used for                                                                                                       |
| ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `--ds-background-100`                                                                                       | Rail, topbar, and page background                                                                              |
| `--ds-background-200`                                                                                       | Rare subtle differentiation (for example the mobile sheet's own backdrop panel if distinguished from the page) |
| `--ds-gray-100` / `--ds-gray-200`                                                                           | Row hover/active backgrounds                                                                                   |
| `--ds-gray-400`                                                                                             | Rail-to-content divider border (via `--ds-shadow-border-base`)                                                 |
| `--ds-gray-700`                                                                                             | Disabled row text                                                                                              |
| `--ds-gray-900`                                                                                             | Default row/breadcrumb/description text                                                                        |
| `--ds-gray-1000`                                                                                            | Active row/breadcrumb text, primary labels                                                                     |
| `--ds-gray-alpha-100`/`--ds-gray-alpha-200`                                                                 | Hover wash on `Entity` rows over the page background                                                           |
| `--ds-ember-600` / `--ds-ember-700`                                                                         | Active destination icon tint (dark/light theme respectively)                                                   |
| `--ds-ember-100`/`--ds-ember-200`/`--ds-ember-900`                                                          | Ember-subtle nav badge (fill/text pair)                                                                        |
| `--ds-focus-ring` / `--ds-focus-ring-outline`                                                               | Focus states on every interactive rail/topbar element                                                          |
| `--ds-overlay-backdrop-color` / `--ds-overlay-backdrop-opacity`                                             | Mobile drawer scrim                                                                                            |
| `--ds-radius-small` (6px)                                                                                   | Nav row radius, popover row radius                                                                             |
| `--ds-radius-medium` (12px)                                                                                 | `material-menu` popovers (workspace switcher, user chip, dots menus)                                           |
| `--ds-radius-large` (16px)                                                                                  | The mobile sheet's leading edge (`material-fullscreen`-adjacent takeover)                                      |
| `--ds-shadow-border` / `--ds-shadow-border-small`                                                           | Rail/topbar hairline separation from the page                                                                  |
| `--ds-shadow-menu`                                                                                          | `material-menu` popovers                                                                                       |
| `--ds-shadow-tooltip`                                                                                       | Icon-rail hover tooltips                                                                                       |
| `.material-menu`                                                                                            | Workspace switcher, user-chip menu, row `DotsMenu`s                                                            |
| `.material-tooltip`                                                                                         | Collapsed-rail row labels                                                                                      |
| `.material-large` / `.material-fullscreen`                                                                  | The mobile off-canvas sheet                                                                                    |
| `--ds-motion-timing-swift`                                                                                  | Every eased transition in this pattern                                                                         |
| `--ds-motion-popover-duration` (200ms)                                                                      | Rail expand/collapse, menu open/close, chevron rotation                                                        |
| `--ds-motion-overlay-duration` (300ms) / `--ds-motion-overlay-scale` (0.96)                                 | Mobile sheet open/close                                                                                        |
| `--ds-size-medium` (36px)                                                                                   | Nav row height, topbar control height                                                                          |
| `--ds-size-small` (32px)                                                                                    | Collapse toggle, mobile menu trigger                                                                           |
| `--ds-popover-padding` / `--ds-popover-row-height` / `--ds-popover-row-radius` / `--ds-popover-row-padding` | Shared anatomy between rail rows and every popover row in this pattern                                         |
| `--geist-space` / `--geist-space-2x` / `--geist-space-3x`                                                   | Icon-to-label gaps, row internal padding                                                                       |
| `--geist-gap-quarter` (8px)                                                                                 | Tight gaps within a row                                                                                        |
| `--geist-gap-half` (12px)                                                                                   | Gap between the topbar's clustered controls                                                                    |
| `--geist-gap` (24px)                                                                                        | Gap between rail groups (destinations / Engine Room / footer), gap above/below the page header                 |
| `--ds-page-width` (1400px)                                                                                  | Max width of the page body inside the content column                                                           |
| `--ds-z-drawer`                                                                                             | Mobile sheet z-index                                                                                           |
| `--ds-z-menu`                                                                                               | Workspace switcher / user chip / dots menus                                                                    |
| `--ds-z-tooltip`                                                                                            | Icon-rail tooltips                                                                                             |
| `text-label-14`                                                                                             | Rail row labels, breadcrumb items                                                                              |
| `text-label-13` / `text-label-12-mono`                                                                      | User chip secondary line; the `Cmd J` shortcut hint                                                            |
| `text-heading-24` / `text-heading-20`                                                                       | Page header title                                                                                              |
| `text-copy-14`                                                                                              | Page header description                                                                                        |
| `text-button-14`                                                                                            | Topbar and page-header action buttons                                                                          |
| `--font-sans`                                                                                               | Every string in this pattern (no Mono, no Pixel — see Do/Don't)                                                |

## Implementation guidance

- **Radix primitive mapping**: rail container and mobile behavior on the existing `src/components/ui/sidebar.tsx` (Radix `Slot` + a `Sheet`/`Dialog` for the off-canvas mobile drawer + `Tooltip` for icon-rail labels) — restyle its Loom-era custom properties (`--surface-active`, `--raised`, `--ember-tint`) to the Tempo `--ds-*` tokens and `material-*`/`text-*` classes rather than rewriting the primitive from scratch. Workspace switcher and user chip: an `Entity` component (`src/components/ui/entity.tsx`, built per the Geist spec: `left`/`right` slots + `EntityContent`, polymorphic `as="button"`), its `right` chevron opening the existing `src/components/ui/dropdown-menu.tsx` (Radix `DropdownMenu`) styled with `.material-menu`. Breadcrumbs: `src/components/ui/breadcrumb.tsx` (`Breadcrumb`/`BreadcrumbItem`, `type` prop). Badges: `src/components/ui/badge.tsx`. Section-nav tabs: Radix `Tabs` via `src/components/ui/tabs.tsx` (shadcn structure) — no Geist `tabs` research spec exists yet in this survey pass; build it from the contract's control-height and role-color law (36px tab row, active tab underlined/tinted ember, everything else gray) and flag it for its own `research/tabs.md` pass rather than inventing a divergent anatomy later.
- **shadcn/ui structure**: one component per file under `src/components/ui/` (`sidebar.tsx`, `entity.tsx`, `breadcrumb.tsx`, `badge.tsx`, `dots-menu.tsx`, `tabs.tsx`, `separator.tsx`, `tooltip.tsx`, `sheet.tsx`), each exporting the compound-component pieces named in its Geist spec. Never restyle any of these inline in a page file; a page composes them, it does not reimplement them.
- **Composition with existing Cadence code**: the shell itself is authored once in `src/components/cadence/AppShell.tsx` (already the shell's home) and mounted once in `src/routes/_authenticated.tsx`, never per-page. The nav data model (`PRIMARY_NAV`, the Engine Room door, footer rows, and the pure `navItemActive`/`engineRoomActive` helpers) stays in `src/lib/nav-model.ts`, kept free of JSX so its active-state math stays unit-tested (`nav-model.test.ts`). The bare `1`-`5`/`g` shortcuts and the guard against firing under an open dialog live in `GotoShortcuts` (`src/components/cadence/CommandPalette.tsx`); Ask's own summon/close/toggle state and its `Cmd/Ctrl+J` binding live in `src/lib/ask-context.tsx`, whose `contextForPath` helper is also what should drive the topbar breadcrumb's leaf label so breadcrumb and Ask's "what am I looking at" context never disagree.
- **Migration note (flag for founder review, not resolved here)**: the codebase's nav-model.ts as of this writing additionally carries a sixth destination ("Decide", between Discover and Plan) and renders the Engine Room and Trust Ledger as two direct, always-visible rows rather than one recessed door — a deliberate 2026-07-04 change made when a hover-menu door was found to hide real surfaces from new users. This pattern document specs the fixed five-destinations-plus-one-door IA exactly as the task brief states it. Reconciling "Decide" (fold into Plan, or keep as a sixth durable destination and update this doc) and whether the Engine Room door should stay a single row with everything one level deeper, or keep Trust Ledger visible alongside it, needs an explicit founder call before the rail is re-ported to Tempo tokens.

## Usage examples

**1. Today, desktop, expanded rail** — the default composition:

```tsx
import { AppShell } from "@/components/cadence/AppShell";
import { Breadcrumb, BreadcrumbItem } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";

export function TodayPage() {
  return (
    <AppShell
      topbar={
        <Breadcrumb type="text">
          <BreadcrumbItem active>Today</BreadcrumbItem>
        </Breadcrumb>
      }
      header={{
        title: "Today",
        description: "What needs you, what changed, and what to push next.",
        action: (
          <Button variant="primary" size="medium">
            Review calls
          </Button>
        ),
      }}
    >
      {/* page body */}
    </AppShell>
  );
}
```

**2. Discover, tablet, icon-rail collapsed, hover tooltip** — the rail renders icon-only; hovering the Discover row shows its label:

```tsx
// AppShell internal — one rail row, icon-rail mode
<Tooltip>
  <TooltipTrigger asChild>
    <Link
      to="/discover"
      aria-current={active ? "page" : undefined}
      className="material-base flex h-[36px] w-[36px] items-center justify-center rounded-[var(--ds-radius-small)]"
      style={{
        background: active ? "var(--ds-gray-100)" : "transparent",
      }}
    >
      <CompassIcon
        size={16}
        strokeWidth={1.5}
        color={active ? "var(--ds-ember-600)" : "var(--ds-gray-900)"}
      />
    </Link>
  </TooltipTrigger>
  <TooltipContent className="material-tooltip text-label-13">Discover</TooltipContent>
</Tooltip>
```

**3. Build, mobile, off-canvas drawer + topbar Ask entry**:

```tsx
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu as MenuIcon } from "lucide-react";
import { useAsk } from "@/lib/ask-context";

function MobileTopbar() {
  const { summon } = useAsk();
  return (
    <div className="flex h-[48px] items-center gap-[var(--geist-gap-half)] px-[var(--geist-space-4x)]">
      <Sheet>
        <SheetTrigger asChild>
          <button
            aria-label="Open navigation"
            className="flex h-[32px] w-[32px] items-center justify-center"
          >
            <MenuIcon size={16} strokeWidth={1.5} />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="material-large w-[240px] p-0">
          {/* full expanded rail content */}
        </SheetContent>
      </Sheet>
      <span className="text-label-14 flex-1 truncate">Build</span>
      <button
        onClick={summon}
        className="text-label-12-mono flex items-center gap-[var(--geist-gap-quarter)]"
      >
        Ask <kbd className="text-label-12-mono">Cmd J</kbd>
      </button>
    </div>
  );
}
```

## Do / Don't

- Do keep the rail to exactly five destinations plus one Engine Room door plus the footer group. Don't add a sixth top-level row for a new feature; it is a tab or panel inside one of the five, or it lives behind the door.
- Do let the Engine Room door's own row take the persistent "active" background when the user is anywhere inside it. Don't tint its icon ember; ember on the rail belongs only to the five primary destinations, so "you're in the engine room" never gets confused with "this is a brand moment."
- Do use `Entity` for the workspace switcher and user chip. Don't hand-roll a flex row with an avatar and a name; that is exactly the row shape `Entity` already specs, and a bespoke version will drift from it silently.
- Do size every rail row, topbar control, and popover row to the 32/36/40 grid. Don't introduce a 28px or 44px row anywhere in this pattern; if a designer's mock shows one, it is wrong, not a new size to add.
- Do keep `--ds-ember-*` as the only chromatic color in the rail (active-icon tint, the one nav badge that needs it). Don't use blue, purple, or any other scale for "this is selected" — those scales are reserved for informational and data-viz roles elsewhere in the system.
- Do use Geist Sans (`--font-sans`) for every string in the shell. Don't use Geist Pixel anywhere in this pattern; the rail, topbar, and page header are dense, everyday chrome, exactly the case the brand-moment law excludes.
- Do gate every animated transition on `prefers-reduced-motion` and keep the focus ring visible on every interactive element. Don't ship a rail, menu, or drawer where either of those is missing; both are Tempo-test gates, not nice-to-haves.
- Do reuse the popover row anatomy (`--ds-popover-row-height`, `--ds-popover-row-radius`) for rail nav rows so the rail and every dropdown menu in the product read as one visual language. Don't invent a second row anatomy for the rail alone.
- Do put the Ask entry point in exactly one place (the topbar) with its `Cmd/Ctrl+J` shortcut always live. Don't duplicate an Ask trigger in the rail footer as well; one artifact, one home, per the surface-placement rule.
- Do keep destructive workspace actions ("Delete workspace", "Leave workspace") in the workspace-switcher menu worded as Verb + Noun and separated by a divider from the neutral rows above them. Don't render a bare "Delete" or "Leave" with no object, and don't skip the confirming destructive-action modal before either one executes.
