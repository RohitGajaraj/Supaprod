# Settings screens

> Where a Cadence workspace configures itself: one page per domain (general, members, billing, connected accounts, API keys, notifications, security, danger zone), each domain a vertical stack of setting cards that pair a plain-language title and description with exactly one control and an optional footer for status and save actions.
> Extension — base: Geist `Fieldset`/`FieldsetContent`/`FieldsetFooter`, `Card`, `Entity`/`EntityList`, `Badge`, `Button`, `Input`, `Combobox`, `Checkbox`, `CopyButton`, `EmptyState`/`EmptyStateIcon`, `DestructiveActionModal`, plus the `--ds-*` color/materials/spacing/motion tokens · inspiration: Vercel project settings (the canonical setting-card and danger-zone shape), Stripe settings (billing/invoice row conventions, role-based member rows).

## Anatomy — the parts, named, with layout relationships

Settings is a two-column frame nested inside the app shell's own content column (see `navigation-shell.md`): a persistent **settings sub-nav** on the left, and a scrollable **domain page** on the right built from a stack of **setting cards**.

```
┌──────────────────┬──────────────────────────────────────────────────────────┐
│ SETTINGS SUB-NAV  │ PAGE HEADER                                              │
│                   │  Workspace settings                                     │
│ General        ●  │  Manage how this workspace looks, bills, and who is in it│
│ Members           ├──────────────────────────────────────────────────────────┤
│ Billing           │ SETTING CARD (Fieldset)                                  │
│ Connected         │  Title                                                   │
│  accounts         │  One-line description                                   │
│ API keys          │  [ control: input / toggle / combobox / table ]         │
│ Notifications     │  ──────────────────────────────────────────────────────  │
│ Security          │  Footer status (left)            Footer actions (right) │
│ ────────────────  ├──────────────────────────────────────────────────────────┤
│ Danger zone        │ SETTING CARD (repeat, 24px gap stacked)                 │
│                   │  ...                                                     │
│                   ├──────────────────────────────────────────────────────────┤
│                   │ DANGER ZONE CARD (last card on its own page)             │
└──────────────────┴──────────────────────────────────────────────────────────┘
```

Named parts:

1. **Settings sub-nav** — a fixed-width (240px, same constant as the rail per `navigation-shell.md`) vertical list of domain rows, one per settings page. Reuses the shared popover-row anatomy (`--ds-popover-row-height` 36px, `--ds-popover-row-radius` 6px) so it reads as one family with every other row list in the product. A `Separator` splits the routine domains from **Danger zone**, which always sits last, exactly like the rail's own footer-group separation.
2. **Page header** — `text-heading-24` domain title (for example "Workspace settings", "Members", "Billing") plus a `text-copy-14` one-line description of what the page controls. No page-header primary action here — each card owns its own action, so the header never competes with a card's Save/Invite button for the one-ember-per-view budget.
3. **Setting card** — the unit of the whole pattern, built on `Fieldset`:
   - **`FieldsetTitle`** — `text-heading-16`, names the setting in plain words ("Workspace name", "Two-factor authentication"), never the underlying mechanism.
   - **`FieldsetSubtitle`** — `text-copy-13`/`text-copy-14`, one sentence stating what the control does or why it matters.
   - **Control region** — the part Geist's own Fieldset demo page never renders (its demos only show text/`ErrorText`/`WarningText`/`DisabledWall` in this slot) but which is exactly what Vercel's live product settings pages put here: the actual `Input`, `Combobox`, `Checkbox`/toggle, `EntityList`, or badge/value display. This is a Cadence composition judgment on top of the documented `FieldsetContent` slot, not a literal Fieldset-doc example — flagged here so it's never mistaken for an observed Vercel demo.
   - **`FieldsetFooter`** — split into **`FieldsetFooterStatus`** (left: last-saved timestamp, a doc link, a row count, or a permission-gate sentence) and **`FieldsetFooterActions`** (right: up to one secondary + one primary `Button`, both `size="small"`). Optional — omit entirely for a card whose control applies instantly and needs no explanation.
4. **Card-header action** (collection cards only) — for cards that list rows (Members, API keys, Connected accounts) rather than holding a single value, the "add a new row" action (Invite Member, Create Key, Connect account) sits top-right of the title/subtitle line instead of the footer, since it isn't "save this section," it's "add to this collection."
5. **Danger zone card** — always the last card on whatever page it lives on (most often its own "Danger zone" sub-nav entry). One or more destructive rows, each an `EntityContent` (title + one-sentence consequence) paired with a `Button variant="error" size="small"` that opens a `DestructiveActionModal`. The card carries a subtle `border-[var(--ds-red-400)]` accent (the same token Fieldset's own documented `type="error"` state uses for its border) as a permanent, quiet marker that this card holds irreversible actions — this is narrower than Fieldset's full `type="error"` tinting, which signals an active alarm (a failed payment), not a standing capability. Treat the subtle-border danger card as a Cadence extension judgment, not a demoed Fieldset variant.

## Variants — every sanctioned variant and when to use each

- **Inline control card** — title/description on the left, a single compact control (toggle, small `Combobox`, a value + Badge) right-aligned on the same row. Use for one boolean or one small enumerated choice (for example "Require two-factor authentication").
- **Full-width control card** — control sits on its own line below the subtitle, spanning the card's width. Use whenever the control needs room: a text `Input`, a multi-field form, an `EntityList`.
- **Explicit-save card** — has `FieldsetFooterActions` with a primary "Save changes" (and, when there is something to lose, a secondary "Discard"). Use for anything typed (workspace name, slug, webhook URL) where an accidental keystroke shouldn't apply itself.
- **Instant-apply card** — no footer actions; the control applies the moment it changes (a toggle, a role change in a member row) and `FieldsetFooterStatus` (or a transient toast) confirms it, worded in plain past tense ("Saved."). Never pair an instant-apply control with a Save button — that duplicates the action and asks the user to confirm something that already happened.
- **Card-header-action collection card** — see Anatomy §4. Use for Members, API keys, Connected accounts, and any other list-of-rows domain.
- **Disabled / permission-gated card** — `FieldsetContent disabled` with a `FieldsetFooter highlight` explaining the gate ("You need the Owner role to change billing.") instead of showing dead controls with no explanation. Direct from the Fieldset spec's documented "Disabled" and "With Disabled Wall" sections.
- **Inline validation vs. whole-card alert** — a single failing field gets an inline `ErrorText`/`WarningText` block inside `FieldsetContent` (the rest of the card stays neutral); a condition that blocks the *entire* card (a failed payment method blocking billing changes, a trial about to lapse) gets `Fieldset type="error"`/`type="warning"` on the whole card, per the Fieldset spec's own "Error Type"/"Warning Type" sections.
- **Danger zone card** — see Anatomy §5. Never mixed with routine settings cards on the same page; always segregated to the bottom of a page or its own sub-nav entry.
- **Empty collection card** — a collection card with zero rows renders `EmptyState`/`EmptyStateIcon` in place of the `EntityList` (zero connected accounts, zero API keys) instead of a blank card or a "No items" string with no next step.
- **Settings-in-a-modal (lightweight)** — for a single-field edit reachable from somewhere other than the Settings page itself (for example renaming a resource from its detail view), the same title/description/control/footer shape can be reused inside `Modal`/`ModalInset` (the composition `Combobox` already documents nesting inside). Reserve this for one or two fields; anything larger belongs on the real settings page, not a modal standing in for it.

## States — default/hover/active/focus/disabled/loading/empty/error

**Setting card container** (`Fieldset`, via `.material-base` or `.material-small`):

| State | Background | Border | Notes |
| --- | --- | --- | --- |
| Default | `--ds-background-100` | `--ds-shadow-border` (hairline, `#ffffff25`-equivalent dark / `#00000014` light) | Neutral, no hover state on the card itself — only its controls react |
| Disabled (gated) | `--ds-background-100`, content at reduced opacity | unchanged | Paired with `FieldsetFooter highlight` explaining the gate, never a bare dimmed card |
| Error type | `--ds-background-100` | `border-[var(--ds-red-400)]` | Whole-card alarm; text inside stays `--ds-gray-1000`, the border alone signals it |
| Warning type | `--ds-background-100` | `border-[var(--ds-amber-400)]` | Same pattern, amber hue |
| Loading | `--ds-background-100` with `Skeleton` placeholders in place of title/subtitle/control | unchanged | Never render an empty card while data resolves |

**Settings sub-nav item** (36px row, shares the rail's row anatomy but drops the ember active-icon tint — a settings page already spends its one ember mark on the primary card action, so the sub-nav's own "you are here" signal stays neutral):

| State | Background | Text |
| --- | --- | --- |
| Default | transparent | `--ds-gray-900` |
| Hover | `--ds-gray-100` | `--ds-gray-1000` |
| Active (current domain) | `--ds-gray-100` (persistent) | `--ds-gray-1000` |
| Focus-visible | as default/hover | `--ds-focus-ring-outline` ring added |
| Disabled (role cannot access this domain) | transparent | `--ds-gray-700`, paired with a `Tooltip` naming the required role |

**Inline control row** (a passive label+toggle or label+badge row inside a card): the row itself never takes a hover background (it isn't clickable as a unit); only the embedded control (toggle, `Combobox` trigger) shows its own documented hover/focus states. Reserve a whole-row hover wash (`--ds-gray-alpha-100`) for rows that are themselves `as="button"` — for example a collection row that opens a detail view.

**Footer save button** — inherits `Button`'s documented states in full (see `research/button.md`): default (ember-800 fill per Tempo's brand substitution, `--ds-contrast-fg` text), hover/active per the button's own family transition, `loading` (spinner, stays focusable, label unchanged), `disabled` (paired with a `Tooltip` naming why — for example "Enter a workspace name to save"). On success, `FieldsetFooterStatus` swaps in a transient confirmation in plain past tense ("Saved just now.") rather than the button changing its own label.

**Member / billing row** (`Entity`, not rendered `as="button"` since it already holds independent interactive children — a role control and a `DotsMenu`): the row background never changes on hover; only its own controls do. The row's `DotsMenu` inherits its documented states exactly (`research/dots-menu.md`): icon `--ds-gray-1000`, hover wash a themed near-black/near-white fill, focus-visible `--ds-focus-ring`, disabled text `--ds-gray-700` / background `--ds-gray-100` / border `--ds-gray-400`.

**Danger row button** (`Button variant="error"`): Button's own doc page doesn't expose the error variant's concrete fill token, so this pattern derives it from Badge's confirmed color-role generator (`research/badge.md`: solid = `{hue}-800` fill + `--ds-contrast-fg` text) applied to red — `--ds-red-800` fill by default, disabled per Button's documented disabled treatment (dimmed, paired with a `Tooltip` if the action is currently unavailable, for example "Only the workspace Owner can delete it").

**Loading** (member/billing table resolving): reuse `Entity`'s own documented Skeleton composition verbatim (`research/entity.md`) — one full-width `Skeleton height={20} width="100%"` line, then three shorter pills at `height={20}`, widths `70`/`60`/`68`, laid out `flex flex-row items-center gap-2` beneath a `flex flex-col gap-2` wrapper. Render three to five skeleton rows, never a spinner in place of the whole card.

**Empty** (zero members beyond the owner, zero API keys, zero connected accounts): `EmptyState` with `EmptyStateIcon` wrapping a 32px lucide icon, `title` naming the absence ("No API keys yet"), `description` naming the next action ("Create a key to call the Cadence API from your own scripts."), and one `Button variant="secondary"` CTA — `research/empty-state.md` never demonstrates a primary-variant CTA inside `EmptyState`, so this pattern follows the documented secondary treatment rather than inventing an undemoed primary example.

**Error** (a single card's data failed to load — for example the billing card can't reach the payment provider): `Fieldset type="error"` wrapping a one-sentence explanation and a `Button variant="secondary"` "Try again," directly matching the Fieldset spec's own payment-failed example shape. For a whole-page failure (the entire domain won't load), use `EmptyState`'s documented error convention instead: body copy plus a copyable request ID and a "Try again" button.

## Interaction model — pointer, keyboard, and screen-reader behavior

**Pointer**: click a sub-nav row to switch domains (client-side route change, no reload); click an inline toggle or a member's role control to apply instantly; type into an explicit-save card's field(s) then click its primary footer button to persist; click a collection card's header action to open its add flow (usually a `Modal`); click a row's `DotsMenu` for secondary per-row actions; click a danger row's button to open its `DestructiveActionModal`, which then requires typing the exact verification phrase before Confirm unlocks (per `research/destructive-action-modal.md`).

**Keyboard** (full map):

| Key | Effect |
| --- | --- |
| `Tab` / `Shift+Tab` | Move focus in visual order: sub-nav rows -> page header -> each card top-to-bottom (title/subtitle are not focus stops, only interactive controls are) -> footer actions -> next card |
| `Arrow Down` / `Arrow Up` | While focus is inside the sub-nav list, move between domain rows (roving tabindex), same convention as the rail |
| `Home` / `End` | Jump to the first / last sub-nav row |
| `Enter` / `Space` | Activate the focused control or button; inside an explicit-save card's single text field, `Enter` triggers the same action as clicking the primary footer button |
| `Escape` | Close whatever menu, `Combobox` popover, or modal is open and return focus to its trigger |
| `Tab` inside a member row | Moves from the role control to that row's `DotsMenu`, never skipping either |
| `Cmd/Ctrl+K` | Opens the global Command Menu, which can jump straight to a named settings domain (for example typing "billing") rather than requiring the user to click through the sub-nav |

**Screen reader**: the sub-nav is a `<nav aria-label="Settings">` landmark holding a `role="list"` of links, the current domain carrying `aria-current="page"` (same convention as the primary rail). Each setting card is a `<section aria-labelledby="{card-id}-title">` so its `FieldsetTitle` supplies the section's accessible name. The danger zone card additionally sets `aria-describedby` pointing at its consequence sentence so assistive tech announces the stakes before any button inside it. `DestructiveActionModal` wires its verification input's prompt via `aria-labelledby`/`htmlFor` and marks its warning icon `aria-hidden` exactly as documented. A save confirmation renders in an `aria-live="polite"` region so it's announced without stealing focus from whatever the user does next.

**Motion**: sub-nav active-row background and any `Combobox`/`DotsMenu` popover open/close animate over `--ds-motion-popover-duration` (200ms) on `--ds-motion-timing-swift`. `DestructiveActionModal` and the Invite/Create modals open/close over `--ds-motion-overlay-duration` (300ms), scaling from `--ds-motion-overlay-scale` (0.96) on the same swift easing. A footer button's `loading` spinner and a transient "Saved." status swap are instant state changes, not eased transitions. Everything above gates on `prefers-reduced-motion` (transitions collapse to immediate state changes; nothing here carries meaning only through motion).

## Responsive behavior — desktop/tablet/mobile

- **Desktop (≥1024px)**: two columns as drawn in Anatomy — 240px sub-nav, content column capped inside `--ds-page-width`. Inline control cards keep label/description and control on one row.
- **Tablet (768–1023px)**: the vertical sub-nav collapses into a horizontal, scrollable tab strip pinned under the page header (36px row height, active tab underlined and tinted `--ds-ember-600`) — the same "Section nav" convention `navigation-shell.md` already defines for tabbed sub-views, reused here instead of inventing a second tablet pattern. Inline control cards that would crowd at this width drop to the full-width-control layout (control moves below the description).
- **Mobile (<768px)**: the sub-nav becomes its own standalone screen — a stacked list of domain rows (label + chevron-right), each `Entity` with `as="button"`. Tapping one navigates to that domain's page with a `Breadcrumb type="text"` back trail ("Settings" as the single crumb) at the top, mirroring the rail's own mobile drawer pattern. Cards go edge-to-edge with reduced internal padding (12px vs. the desktop 16px). Member/billing rows collapse from a three-zone `Entity` row to a two-line stacked `Entity` (name/email on the first line, role badge + `DotsMenu` on the second) — never a horizontally-scrolling table; stacking, not scrolling, is how this pattern handles narrow widths.

## Accessibility

- Landmarks: settings sub-nav is `<nav aria-label="Settings">`; the domain page itself is the route's `<main>` region, already established by the app shell.
- Focus order matches visual order: sub-nav, then page header, then each card top-to-bottom, then that card's footer, before moving to the next card — never jump focus out of a card mid-way through its controls.
- Every icon-only control (a row's `DotsMenu` trigger, a `CopyButton` next to an API key, the mobile back-chevron) carries an `aria-label` naming the action and its target (for example "Actions for Priya Shah", "Copy API key", "Copy invoice number INV-1042") rather than a generic label — matching Button's documented icon-only rule verbatim.
- Contrast: card and sub-nav text on `--ds-background-100` uses `--ds-gray-900`/`--ds-gray-1000`, both meeting 4.5:1 in both themes; danger-card borders (`--ds-red-400`) are a decorative accent layered on top of already-legible text, never the sole carrier of "this action is destructive" — the button's own label and the modal's typed-confirmation gate carry that meaning too.
- `prefers-reduced-motion`: every animated transition named above collapses to an immediate state change; no information in this pattern is conveyed by motion alone.
- Focus ring (`--ds-focus-ring` on inputs/comboboxes/checkboxes, `--ds-focus-ring-outline` on buttons and rows) is never suppressed anywhere in this pattern, including inside a disabled card's still-focusable Tooltip trigger.

## Tokens used

| Token | Used for |
| --- | --- |
| `--ds-background-100` | Card, sub-nav, and page background |
| `--ds-background-200` | Rare subtle differentiation (for example a card's own header strip against its body) |
| `--ds-gray-100` / `--ds-gray-200` | Sub-nav row hover/active background |
| `--ds-gray-400` | Card hairline border component; `DotsMenu` disabled border |
| `--ds-gray-700` | Disabled sub-nav text, disabled `DotsMenu` text, disabled tooltip-explained state text |
| `--ds-gray-900` | Card subtitle/description text, default sub-nav text, secondary row text |
| `--ds-gray-1000` | Card title text, active sub-nav text, primary row text |
| `--ds-gray-alpha-100` | Hover wash on an `as="button"` collection row |
| `--ds-ember-600` / `--ds-ember-700` | Active tablet section-nav tab underline/tint (dark/light theme) |
| `--ds-ember-800` | Primary footer button fill (ember substitutes for Geist's brand-blue role per the Tempo color law) |
| `--ds-red-100`/`200`/`400`/`800`/`900` | Danger-card border accent; error-type Fieldset border; destructive Button fill; "Failed"/"Past due" Badge |
| `--ds-amber-100`/`200`/`400`/`800`/`900` | Warning-type Fieldset border; "Trial"/"Renewing soon" Badge |
| `--ds-green-200`/`800`/`900` | "Active"/"Paid" plan and invoice Badges |
| `--ds-blue-200`/`800`/`900` | "Pending invite" Badge, informational links |
| `--ds-contrast-fg` | Text on any solid-filled Badge or primary/error Button |
| `--ds-focus-ring` / `--ds-focus-ring-outline` / `--ds-focus-color` | Focus states on every interactive element in this pattern |
| `--ds-radius-small` (6px) | Card and popover-row radius |
| `--ds-radius-medium` (12px) | `Combobox`/`DotsMenu` popovers, modal corners |
| `--ds-radius-large` (16px) | Mobile off-canvas settings-nav sheet |
| `--ds-shadow-border` / `--ds-shadow-border-small` | Setting-card hairline |
| `--ds-shadow-menu` | `DotsMenu` and role `Combobox` popovers |
| `--ds-shadow-modal` | Invite/Create and `DestructiveActionModal` overlays |
| `.material-base` / `.material-small` | Setting card surface |
| `.material-menu` | Row-level popovers |
| `.material-modal` | Every modal in this pattern |
| `--ds-motion-timing-swift` | Every eased transition in this pattern |
| `--ds-motion-popover-duration` (200ms) | Sub-nav active state, popover open/close |
| `--ds-motion-overlay-duration` (300ms) / `--ds-motion-overlay-scale` (0.96) | Modal open/close |
| `--ds-size-small` (32px) | Footer/row action buttons, `DotsMenu` trigger |
| `--ds-size-medium` (36px) | Text `Input`/`Combobox` fields, sub-nav rows, tablet tab row |
| `--ds-popover-padding` / `--ds-popover-row-height` / `--ds-popover-row-radius` | Sub-nav rows, every popover row |
| `--geist-space` / `--geist-space-2x` / `--geist-space-3x` / `--geist-space-4x` | Card internal padding, icon-to-label gaps |
| `--geist-gap-quarter` (8px) | Tight gaps within a row |
| `--geist-gap-half` (12px) | Gap between a footer's status and action clusters |
| `--geist-gap` (24px) | Gap between stacked cards on a domain page |
| `--geist-gap-section` (32px) | Gap between the page header and the first card |
| `--ds-page-width` (1400px) | Max width of the content column |
| `--ds-z-modal` | Invite/Create and `DestructiveActionModal` layering |
| `--ds-z-menu` | `DotsMenu`/`Combobox` popovers |
| `--ds-z-toast` | Save-confirmation toast |
| `text-heading-24` | Domain page title |
| `text-heading-16` | Setting card title (`FieldsetTitle`) |
| `text-copy-14` / `text-copy-13` | Card subtitle, helper text |
| `text-label-14` | Sub-nav rows, form field labels |
| `text-label-13` | Row secondary text (email, timestamps) |
| `text-label-14-mono` / `text-label-13-mono` | API keys, ids, invoice numbers |
| `text-button-14` | Footer and header-action button labels |
| `text-tabular` | Billing amounts, member/invoice counts |
| `--font-sans` | Every string in this pattern except explicitly mono content |

## Implementation guidance

- **Radix primitive mapping**: setting cards (`Fieldset`) are a styled composition, not a Radix primitive — plain semantic markup (`<section>`, headings, paragraphs) wrapped in the material preset. Role control in a member row: prefer `src/components/ui/select.tsx` (Radix `Select`) sized small, since the role list is short and fixed (Owner/Admin/Member) — reach for the heavier `Combobox` (Radix `Popover` + filtering) only if custom, filterable roles are ever added. `DotsMenu` on `src/components/ui/dropdown-menu.tsx` (Radix `DropdownMenu`, `.material-menu`). Invite/Create flows and `DestructiveActionModal` both build on `src/components/ui/dialog.tsx` (Radix `Dialog`, `.material-modal`) — the destructive variant adds the type-to-confirm `Input` gate and the striped irreversibility band on top. Toggles: Radix `Switch` via `src/components/ui/switch.tsx`. Tablet section-nav tabs: Radix `Tabs` via `src/components/ui/tabs.tsx` — no Geist `tabs` research spec exists yet in this survey pass (same gap flagged in `navigation-shell.md`); build it from the contract's 36px control-height and role-color law until a dedicated `research/tabs.md` lands. A true sortable, multi-column billing/audit-log data grid likewise has no `research/table.md` spec yet in this pass — this pattern composes member and invoice lists from `Entity`/`EntityList` plus `Card`'s `borderBetween` prop instead, and that composition should be revisited once a real `Table` spec exists.
- **shadcn/ui structure**: `fieldset.tsx` (new — `Fieldset`, `FieldsetContent`, `FieldsetTitle`, `FieldsetSubtitle`, `FieldsetFooter`, `FieldsetFooterStatus`, `FieldsetFooterActions`), `card.tsx`, `entity.tsx`, `badge.tsx`, `button.tsx`, `input.tsx`, `select.tsx`, `switch.tsx`, `checkbox.tsx`, `dots-menu.tsx`, `dialog.tsx`, `destructive-action-modal.tsx` (new, composes `dialog.tsx` + `input.tsx` per its spec), `copy-button.tsx` (new, wraps the Clipboard API per its spec), `empty-state.tsx` (new), `tabs.tsx` — one component per file under `src/components/ui/`, each exporting the compound pieces its Geist spec names. A settings page composes these; it never restyles them inline.
- **Composition with existing Cadence code**: a `SettingsShell` (`src/components/cadence/SettingsShell.tsx`) renders the sub-nav and mounts once at the `_authenticated.settings` layout route; each domain is its own nested route (`_authenticated.settings.general.tsx`, `.members.tsx`, `.billing.tsx`, `.connected-accounts.tsx` — already the home of the existing Connected accounts UI per the repo's Settings conventions, `.api-keys.tsx`, `.notifications.tsx`, `.security.tsx`, `.danger.tsx`). Follow the repo's standing "two files in lockstep" rule: server logic per domain in its matching `src/lib/<domain>.functions.ts` (`members.functions.ts`, `billing.functions.ts`, and so on), consumed by the route via TanStack Query, never inlined ad hoc. The sub-nav's active-domain math stays in a pure helper (`src/lib/settings-nav-model.ts`), kept free of JSX so it can be unit-tested the same way `navigation-shell.md`'s `nav-model.ts` is.

## Usage examples

**1. General workspace settings — an explicit-save card and an instant-apply card:**

```tsx
import { Fieldset, FieldsetContent, FieldsetTitle, FieldsetSubtitle, FieldsetFooter, FieldsetFooterStatus, FieldsetFooterActions } from "@/components/ui/fieldset";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

function GeneralSettingsPage() {
  return (
    <div className="flex flex-col gap-[var(--geist-gap)]">
      <Fieldset>
        <FieldsetContent>
          <FieldsetTitle>Workspace name</FieldsetTitle>
          <FieldsetSubtitle>Shown across Cadence and in every email we send your team.</FieldsetSubtitle>
          <Input aria-label="Workspace name" className="mt-4 max-w-sm" defaultValue="Northwind Labs" size="medium" />
        </FieldsetContent>
        <FieldsetFooter>
          <FieldsetFooterStatus><span className="text-copy-13 text-gray-900">Saved 2 minutes ago</span></FieldsetFooterStatus>
          <FieldsetFooterActions>
            <Button size="small" variant="secondary">Discard</Button>
            <Button size="small">Save changes</Button>
          </FieldsetFooterActions>
        </FieldsetFooter>
      </Fieldset>

      <Fieldset>
        <FieldsetContent>
          <div className="flex items-start justify-between gap-4">
            <div>
              <FieldsetTitle>Require two-factor authentication</FieldsetTitle>
              <FieldsetSubtitle>Every member must enroll in 2FA before they can sign in.</FieldsetSubtitle>
            </div>
            <Switch aria-label="Require two-factor authentication" defaultChecked />
          </div>
        </FieldsetContent>
      </Fieldset>
    </div>
  );
}
```

**2. Members — a card-header-action collection card with row-level role control and overflow:**

```tsx
import { Fieldset, FieldsetContent, FieldsetTitle, FieldsetSubtitle } from "@/components/ui/fieldset";
import { Entity, EntityList, EntityContent } from "@/components/ui/entity";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import { DotsMenu, MenuItem } from "@/components/ui/dots-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function MembersSettingsPage() {
  return (
    <Fieldset>
      <FieldsetContent>
        <div className="flex items-start justify-between gap-4">
          <div>
            <FieldsetTitle>Members</FieldsetTitle>
            <FieldsetSubtitle>12 people have access to this workspace.</FieldsetSubtitle>
          </div>
          <Button size="small">Invite member</Button>
        </div>
        <EntityList className="mt-4">
          <Entity
            right={
              <div className="flex items-center gap-[var(--geist-gap-quarter)]">
                <Select defaultValue="admin">
                  <SelectTrigger aria-label="Role for Priya Shah" size="small" />
                  <SelectContent>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                  </SelectContent>
                </Select>
                <DotsMenu aria-label="Actions for Priya Shah">
                  <MenuItem>Resend invite</MenuItem>
                  <MenuItem>Remove member</MenuItem>
                </DotsMenu>
              </div>
            }
          >
            <EntityContent title="Priya Shah" description="priya@northwindlabs.com" />
          </Entity>
          <Entity
            right={
              <div className="flex items-center gap-[var(--geist-gap-quarter)]">
                <Badge variant="blue" contrast="low" size="sm">Pending</Badge>
                <DotsMenu aria-label="Actions for jordan@northwindlabs.com">
                  <MenuItem>Resend invite</MenuItem>
                  <MenuItem>Remove invite</MenuItem>
                </DotsMenu>
              </div>
            }
          >
            <EntityContent title="jordan@northwindlabs.com" description="Invited 3 days ago" />
          </Entity>
        </EntityList>
      </FieldsetContent>
    </Fieldset>
  );
}
```

**3. Danger zone — a subtle-accent card gating each row behind a type-to-confirm modal:**

```tsx
import { Fieldset, FieldsetContent, FieldsetTitle } from "@/components/ui/fieldset";
import { Entity, EntityContent } from "@/components/ui/entity";
import { Button } from "@/components/ui/button";
import { DestructiveActionModal } from "@/components/ui/destructive-action-modal";
import { useState } from "react";

function DangerZoneCard({ workspaceName }: { workspaceName: string }) {
  const [confirming, setConfirming] = useState<"transfer" | "delete" | null>(null);

  return (
    <>
      <Fieldset className="border-[var(--ds-red-400)]">
        <FieldsetContent>
          <FieldsetTitle>Danger zone</FieldsetTitle>
          <div className="mt-4 flex flex-col gap-4">
            <Entity
              right={<Button onClick={() => setConfirming("transfer")} size="small" variant="error">Transfer workspace</Button>}
            >
              <EntityContent title="Transfer workspace" description={`Move ${workspaceName} to another owner.`} />
            </Entity>
            <Entity
              right={<Button onClick={() => setConfirming("delete")} size="small" variant="error">Delete workspace</Button>}
            >
              <EntityContent title="Delete workspace" description={`Permanently remove ${workspaceName} and everything in it.`} />
            </Entity>
          </div>
        </FieldsetContent>
      </Fieldset>

      <DestructiveActionModal
        confirmLabel="Delete workspace"
        description={<>{workspaceName} and all its missions, specs, and connections will be permanently deleted.</>}
        irreversibleDescription={`Deleting ${workspaceName} cannot be undone.`}
        onCancel={() => setConfirming(null)}
        onConfirm={() => setConfirming(null)}
        open={confirming === "delete"}
        title="Delete workspace"
        verificationLabel="workspace name"
        verificationPhrase={workspaceName}
      />
    </>
  );
}
```

## Do / Don't

- Do build every setting card on `Fieldset`'s documented title/subtitle/footer anatomy. Don't hand-roll a bordered `div` with ad hoc padding — that's exactly the drift the material presets exist to prevent.
- Do put a collection card's "add a new row" action top-right of its title. Don't bury it inside the footer, which is reserved for saving or explaining the current card, not extending it.
- Do keep the danger zone segregated to the bottom of a page (or its own sub-nav entry) with a subtle red border accent. Don't scatter destructive actions across routine cards, and don't apply full `Fieldset type="error"` tinting to a danger zone that isn't currently in an alarm state.
- Do gate every destructive action behind `DestructiveActionModal`'s typed verification. Don't ship a plain browser `confirm()` or a single "Are you sure?" button for anything in a danger zone.
- Do reserve `Button variant="error"` for destructive actions and ember for the one primary action per card. Don't tint a danger button ember, and don't give a page two competing primary (ember) actions at once.
- Do use `text-label-14-mono`/`text-label-13-mono` for API keys, invoice numbers, and ids. Don't render technical strings in Geist Sans — they won't align, and they read as decoration rather than data.
- Do stack member/billing rows into two lines on mobile. Don't render a horizontally-scrolling table for these collections at any width — this pattern has no such control.
- Do use Geist Sans everywhere in this pattern. Don't reach for Geist Pixel on a settings screen — dense, everyday chrome is exactly the case the brand-moment law excludes.
- Do gate every animated transition on `prefers-reduced-motion` and keep the focus ring visible on every interactive element, including inside disabled/gated cards. Don't ship a card, modal, or sub-nav where either is missing.
- Do explain every disabled control with an adjacent Tooltip naming the reason. Don't leave a greyed-out toggle or button with no explanation of why it can't be used right now.
