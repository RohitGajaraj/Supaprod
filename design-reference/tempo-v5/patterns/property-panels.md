# Property & inspector panels

> The right-rail surface that shows and edits everything known about whatever is currently selected: one row per property, grouped into named sections, collapsed by default until someone needs the advanced ones.
> Extension — base: Geist `Fieldset`, `Description`, `Collapse`/`CollapseGroup`, `Context Card`, `Input`, `Combobox`, `Checkbox`, `Button` (see `research/`) + the color/typography/materials/spacing tokens · inspiration: Figma's right-side inspector (property grouping by relevance, the mixed-value dash, sections that change shape with the selection), Notion's page properties (icon-plus-label rows, click straight into the value to edit it, "Mixed" copy for divergent multi-select) — principles only, paraphrased below, never copied.

## Anatomy — the parts, named, with layout relationships

A property panel is four stacked zones inside one docked or floating shell: **Header** → **Body** (one or more **Section groups**, each holding **Property rows**) → **Footer**. Nothing here is a new elevation: the shell itself is page chrome (a docked rail) or a floating material (drawer/sheet) per Variants below; sections and rows never carry their own shadow or border ring.

```
┌─ PropertyPanel (docked right rail, 320-360px) ───────────────────────┐
│ ‹ Back              ROADMAP ITEM                              ⋯     │  ← Header, 56px
│                     Ship the Q3 pricing page                        │    eyebrow text-label-12/gray-900
│                                                    text-heading-16/gray-1000
├───────────────────────────────────────────────────────────────────┤  ← border-gray-400, 1px
│                                                          (scrolls ↕) │
│  Overview                                text-label-12/gray-900      │  ← Section header (static, no disclosure)
│  ┌ Status              ▾   In progress                          ┐   │  ← Property row, select-type, click-to-edit
│  ┌ Owner                    Priya Shah                          ┐   │  ← Property row, entity-type (Context Card on hover)
│  ┌ Target release       ▾   Q3 2026                             ┐   │
│  ┌ Tags                     Pricing · Growth                    ┐   │  ← Property row, multi-value chips
│                                                                       │  ← geist-gap (24px) between groups
│  ▸ Details                               text-label-12/gray-900      │  ← Section header (Collapse, closed default)
│                                                                       │
│  ▾ Advanced                              text-label-12/gray-900      │  ← Section header (Collapse, open)
│  ┌ Created                  Jul 3, 2026                         ┐   │
│  ┌ Last edited by            —                                  ┐   │  ← em dash = unset value
│  ┌ Internal ID               rm_9f2a1c        [copy]            ┐   │  ← mono value, copy-button suffix
│                                                                       │
├───────────────────────────────────────────────────────────────────┤  ← border-gray-400, sticky
│ Saved a moment ago                       [ Cancel ]  [ Save ]       │  ← Footer, 64px, pinned to bottom
└───────────────────────────────────────────────────────────────────┘
```

**Named parts:**

| Part           | Built from                                                                                                | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| -------------- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Header         | Plain flex row, not a Geist component                                                                     | Eyebrow (`text-label-12`, `gray-900`, the entity type — "Roadmap item", "Agent", "PRD") over a truncated title (`text-heading-16`, `gray-1000`, one line, `ellipsis` per `description.md`'s truncation modifier). Overflow menu (`dots-menu.md`) on the trailing edge for cross-cutting actions (Duplicate, Archive, Delete) that don't belong to any single property. Overlay/mobile variants prepend a Back/Close control on the leading edge; the docked variant has no dismiss control at all — it closes by deselecting, not by an explicit close button. |
| Section header | `Collapse`/`CollapseGroup` trigger, or a static (non-interactive) label for a group that's never optional | `text-label-12`, `gray-900`, Title Case noun phrase ("Overview", "Details", "Advanced") — never a mono-caps eyebrow (that treatment is retired, contract §10). The panel's first/primary group ("Overview") is usually static, not collapsible — it's what the user came to see. Everything else (Details, Advanced, danger-zone-style groups) is wrapped in `Collapse`, closed by default per `collapse.md`'s own rule ("default to closed unless a first-time visitor must read the content before they can act").                                           |
| Property row   | `Description` (title/content pair), extended with an edit-in-place control                                | Label on the leading edge (`text-label-14`, `gray-900`, Title Case per `description.md`'s casing convention), value on the trailing edge (`text-label-14`, `gray-1000`) using the `right` layout variant from `description.md`. The value region is the click target that morphs into `Input` / `Combobox` / `Checkbox` on activation — this swap is this pattern's one true extension over `Description`, which Geist ships read-only.                                                                                                                        |
| Sticky footer  | `FieldsetFooter` anatomy (`FieldsetFooterStatus` + `FieldsetFooterActions`) from `fieldset.md`, pinned    | Left zone: save status ("Saved a moment ago", a timestamp, or nothing in autosave mode). Right zone: up to two `Button`s. A third action never appears here — it collapses into the header's overflow menu per the Button contract (more than two sibling actions become a Menu).                                                                                                                                                                                                                                                                              |

Section groups stack with `geist-gap` (24px) between them. Rows within one section stack with no extra gap beyond each row's own padding (rows are visually contiguous, distinguished by the `border-gray-400` hairline under each one, not by whitespace) — this mirrors `Description`'s definition-list model, where consecutive `dt`/`dd` pairs read as one list, not as separate cards.

## Variants — every sanctioned variant and when to use each

**Shell placement**

- **Docked right rail** (default, desktop) — a permanent column in the page's own grid, not an overlay. No material preset, no shadow ring — it's page chrome, separated from the content pane by a single `border-gray-400` left edge. Always visible when something is selected; shows the empty state (see States) when nothing is.
- **Overlay drawer** (tablet, and desktop when the layout has no room for a permanent rail) — slides in from the right using `material-modal` (12px radius, `--ds-shadow-border-medium`) at `--ds-z-drawer`. Dismissible by Escape, scrim click, or the header's Close control. Same header/body/footer anatomy as the docked rail.
- **Full-screen sheet** (mobile, `<768px`) — the drawer becomes a full-screen `material-fullscreen` sheet, mirroring `combobox.md`'s documented precedent ("the Modal automatically renders a Dialog on mobile"). Header's Back control replaces Close; footer actions go full-width and stack if there are two.
- **Collapsed rail** (optional, desktop power-user density) — the docked rail shrinks to a narrow icon strip (just the header's eyebrow icon and the overflow menu), sections and rows hidden; clicking expands back to full width. Use only where horizontal space is genuinely scarce (a three-pane layout under 1280px) — don't offer it as a default.

**Selection state**

- **Single-entity mode** — the default shape described in Anatomy: one entity's properties, editable inline.
- **Multi-select / bulk mode** — the header's title is replaced by a count ("12 roadmap items selected"); properties that share one value across the whole selection show that value normally, properties that differ show the **Mixed** state (see States); the footer's primary action reads as an explicit batch verb ("Apply to 12 items"), never a bare "Save" that hides the blast radius.
- **Read-only / locked mode** — every row renders as plain `Description` (no click-to-edit affordance, no hover state), and the header carries a small lock glyph next to the eyebrow. Use when the viewer lacks edit permission, the entity is archived, or the panel is a Context Card-style preview rather than the entity's true home.

Shell placement and selection state are orthogonal — a docked rail can be in multi-select mode, an overlay drawer can be read-only, and so on.

## States — default/hover/active/focus/disabled/loading/empty/error

**Section header (Collapse trigger)**

- Default: `text-label-12` in `gray-900`, transparent background, chevron in `gray-900`.
- Hover: background `gray-100`, text stays `gray-900` (a section header is chrome, not a promoted action — it never jumps to `gray-1000` on hover).
- Active/pressed: background `gray-200`.
- Focus (keyboard): `--ds-focus-ring` around the trigger row.
- Expanded: chevron rotates 90 degrees using `--ds-motion-timing-swift`; `aria-expanded="true"`.

**Property row, display mode**

- Default: transparent background, label `text-label-14`/`gray-900`, value `text-label-14`/`gray-1000`, bottom hairline `border-gray-400`.
- Hover (editable row only): background `gray-100` across the full row width, cursor pointer; a small pencil affordance may appear in `gray-900` on the trailing edge (optional — the background change alone is a sufficient affordance and is preferred where density matters).
- Active/pressed: background `gray-200` for the instant between click and the control mounting.
- Focus (keyboard-reached row, not yet editing): `--ds-focus-ring` around the row; Enter or Space commits to edit mode.
- Read-only row (locked mode, or a system-computed property like "Created"): no hover/active background at all — it never looks clickable, per `description.md`'s definition-list model.

**Property row, edit mode** (row has swapped to `Input` / `Combobox` / `Checkbox`)

- Default: whatever the underlying control's own default is — for `Input`/`Combobox`, that's `border-gray-400`, `background-100`, sized to one of `--ds-size-small`/`medium`/`large` (small is the docked-rail default given the narrow column; medium in the wider overlay/sheet variants).
- Focus: the control's own `--ds-focus-ring`, inherited unmodified — this pattern never re-styles a control's focus treatment.
- Error: `border-red-400` per `input.md`'s `error` prop, with the message rendered below the row using the same `ErrorText` treatment `fieldset.md` documents inside `FieldsetContent` (`text-label-13`, `red-900`).
- Committing: Enter (or blur, for a plain text `Input`) commits and the row returns to display mode; Escape cancels and reverts to the pre-edit value without saving — never silently keeps a half-typed value.

**Mixed-value state** (multi-select mode only, a state this pattern adds on top of `Description`)

- Renders the literal word "Mixed" in `text-label-14`/`gray-900` (one step down from the normal `gray-1000` value color, so it visibly reads as "not a real value" without borrowing the muted-italic look no available face supports).
- Deliberately distinct from the **unset/empty** convention (`context-card.md`'s documented rule: unknown values render as an em dash, never "N/A"/"null"). Reusing the em dash for "Mixed" would conflate "nothing is set" with "several different things are set" — two states an operator needs to tell apart before they overwrite twelve items with one value by accident.
- Clicking a Mixed row still opens its edit control; committing a value applies it to the whole selection and the row leaves Mixed state for all of them.

**Loading** (a row is fetching, or a save is in flight)

- Row content is replaced by `src/components/ui/skeleton.tsx` blocks sized to the label and value columns (`gray-100` base, standard skeleton pulse) — never a spinner glyph in place of the label.
- A row already showing a value that's being saved keeps that value visible (per `input.md`'s "keep the field focusable while an async save is in flight; only reach for disabled when input is genuinely impossible") and shows a small inline spinner beside the value instead of blanking it.

**Empty** (nothing selected — docked rail only; overlay/sheet variants simply don't open)

- Centered instruction copy, one line, phrased as an instruction not an apology ("Select an item to see its properties.") — never "Nothing selected" or "No properties found."
- At most one small geometric composition above the copy per the identity layer's empty-state rule (a grid-line/pixel-glyph mark, never stock illustration, never emoji).

**Disabled row** (a specific property the viewer can't edit, distinct from whole-panel read-only mode)

- Value text in `gray-600` instead of `gray-1000`, no hover background, cursor `not-allowed`.
- Always paired with a `Tooltip` explaining why, per both `checkbox.md` and `button.md`'s shared rule that an unexplained disabled control reads as broken rather than intentional.

**Error, panel-level** (the whole panel failed to load, not one field)

- This is a block failure, not a row failure — use the actual `Error` component (`error.md`) inside the body in place of the sections, with a retry action. Never repurpose per-row error styling for a load failure; that confuses "this field is invalid" with "we couldn't load this panel at all," the same distinction `forms.md` draws between field-level and block-level errors.

## Interaction model

**Pointer**

- Click a section header to toggle its `Collapse` panel.
- Click anywhere in an editable row's value region to enter edit mode; click elsewhere on the page (or press Escape) to cancel an in-progress edit without saving.
- Hover an entity-referencing value (an owner's name, a linked record) to reveal a `Context Card` preview, per `context-card.md`'s hover-or-focus-open, cursor-exit-close behavior, opening after its documented ~150ms delay so a fast sweep down the panel doesn't flash a card per row.
- Click the header's overflow menu for cross-cutting actions; click footer buttons for the panel-level commit/cancel actions.

**Keyboard** (full key map)

| Key                        | Context                                                  | Effect                                                                                                                                                                                                                                                                                                |
| -------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Tab` / `Shift+Tab`        | Anywhere in the panel                                    | Moves through: header controls → each section header → each row inside an expanded section → footer actions, in visual order. Rows inside a closed section are skipped (not tab-stopped, per `collapse.md`'s own accessibility note: keep the panel in the DOM but out of tab order while collapsed). |
| `Enter` / `Space`          | Section header focused                                   | Toggles that section's expanded state.                                                                                                                                                                                                                                                                |
| `Enter` / `Space`          | Property row focused, display mode                       | Enters edit mode for that row.                                                                                                                                                                                                                                                                        |
| `Enter`                    | Property row, edit mode (single-line `Input`/`Combobox`) | Commits the value and returns to display mode.                                                                                                                                                                                                                                                        |
| `Escape`                   | Property row, edit mode                                  | Cancels, reverts to the pre-edit value, returns to display mode.                                                                                                                                                                                                                                      |
| `Escape`                   | Overlay drawer / full-screen sheet                       | Closes the panel and returns focus to whatever triggered it, per `context-card.md`'s documented Escape contract.                                                                                                                                                                                      |
| `Arrow Up` / `Arrow Down`  | Row focused, display mode                                | Moves focus to the adjacent row (an enhancement over plain Tab order for fast scanning down a long panel; optional, not required for a correct implementation).                                                                                                                                       |
| `Arrow Left/Right/Up/Down` | Inside an open `Combobox`/`Select` control               | Standard listbox navigation, unchanged from `combobox.md`/`select.md`.                                                                                                                                                                                                                                |

**Screen reader**

- The panel shell carries `role="complementary"` (docked rail) or the native dialog role (overlay drawer/sheet, via the underlying `Dialog`/`Sheet` primitive) with an `aria-label` naming the selected entity ("Ship the Q3 pricing page, properties").
- Each section is a real disclosure: trigger is a `<button>` with `aria-expanded`/`aria-controls`, per `collapse.md`'s documented accessibility contract — this pattern doesn't reinvent it.
- Each property row renders through `Description`'s own `<dl>`/`<dt>`/`<dd>` structure, so a screen reader announces label and value as a proper key/value pair even before a row is activated for editing.
- On entering edit mode, the row's control carries a real, associated `<label>` (matching `input.md`'s rule that a string `label` requires a paired `id`) rather than relying on the now-hidden `dt` text alone.
- Mixed-value rows announce the literal word "Mixed," not a bare dash, so the divergence is legible to non-visual users too.

**Motion**

- Section expand/collapse: `--ds-motion-timing-swift`, matching the popover-class duration (~200ms) rather than the overlay-class one — a section is a page-level disclosure, not a floating surface, so it never gets the 0.96-scale overshoot reserved for `--ds-motion-overlay-*`.
- Overlay drawer and full-screen sheet entrance/exit: `--ds-motion-overlay-timing`, `--ds-motion-overlay-duration` (300ms), scale from `--ds-motion-overlay-scale` (0.96) — these are floating surfaces, so they get the full overlay treatment.
- Row display-to-edit swap: a fast crossfade (~150ms, no scale, no easing overshoot) between the static value and the mounted control — matching `context-card.md`'s ~150ms guidance for avoiding flash during quick interaction, not the springier overlay timing.
- `Context Card` preview open/close: per `context-card.md`, ~150ms open delay, no other timing disclosed — inherit its own motion, don't add extra.
- Every transition above gates on `prefers-reduced-motion`: swap to an instant show/hide with no crossfade, no scale, no rotation.

## Responsive behavior

- **Desktop (≥1024px)** — docked right rail, fixed 320-360px width, part of the page's own three-pane grid (list, detail, inspector), independently scrollable from the content pane beside it. The optional collapsed-icon-rail variant is available under about 1280px if the layout is otherwise cramped.
- **Tablet (768-1023px)** — the docked rail becomes an overlay drawer, triggered by an explicit "Properties" control in the detail view's toolbar (an icon button, `aria-label="Show properties"`). Same header/body/footer content, now floating at `material-modal` over a scrim.
- **Mobile (<768px)** — the drawer becomes a full-screen sheet, matching the documented Modal-to-Dialog swap in `combobox.md`. Footer actions stack full-width if there are two; a lone primary action stays full-width regardless.

## Accessibility

- Landmark: `role="complementary"` for the docked rail; the underlying `Dialog`/`Sheet` primitive's own dialog role for overlay/mobile variants — don't double up both roles on the same element.
- Focus order: header → static sections in visual order → collapsible sections in visual order (only when expanded) → footer actions. Opening an overlay/sheet variant moves focus to the panel's heading; closing it returns focus to the control that opened it.
- Every row's value both looks and is announced as editable before activation — never rely on a bare hover-only affordance with no focus-visible equivalent.
- Contrast: property values always use `gray-1000` (never `gray-800`/`gray-700`, which are border/decoration steps, not text steps, per the contract's role model); secondary text (labels, section headers, status text) uses `gray-900` at minimum. Run the grayscale test from the Tempo test before shipping any new section layout.
- `prefers-reduced-motion`: every animation listed under Motion has a no-motion fallback; none of them are load-bearing for comprehension (nothing "appears" only via animation with no static equivalent).
- Disabled rows are never the only way a viewer learns they lack permission — the paired `Tooltip` (or, in fully locked mode, the header's lock glyph) always states the reason in text.

## Tokens used

| Token / class                                                                  | Used for                                                                                                              |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `--ds-background-100`                                                          | Panel shell background, control backgrounds                                                                           |
| `--ds-gray-100`                                                                | Row/section-header hover background                                                                                   |
| `--ds-gray-200`                                                                | Row/section-header active/pressed background                                                                          |
| `--ds-gray-400`                                                                | Row hairlines, panel edge border (docked variant), disabled-control border baseline                                   |
| `--ds-gray-600`                                                                | Disabled row value text                                                                                               |
| `--ds-gray-700`                                                                | (Not used for text — reserved for border/decoration steps per the color role model; flagged here only to rule it out) |
| `--ds-gray-900`                                                                | Row labels, section headers, Mixed-value text, secondary status text                                                  |
| `--ds-gray-1000`                                                               | Row values (default, editable, non-disabled)                                                                          |
| `--ds-red-400`                                                                 | Edit-mode control border, error state                                                                                 |
| `--ds-red-900`                                                                 | Inline error message text                                                                                             |
| `--ds-focus-ring` / `--ds-focus-color`                                         | Focus treatment on rows, section headers, controls (all inherited, never re-implemented)                              |
| `--ds-shadow-border-base` / `--ds-shadow-background-border`                    | Docked-rail edge border (left-edge use only, not the full-ring `material-*` form)                                     |
| `--ds-shadow-border-medium` (`material-modal`)                                 | Overlay drawer surface                                                                                                |
| `--ds-shadow-fullscreen` (`material-fullscreen`)                               | Full-screen mobile sheet surface                                                                                      |
| `--ds-radius-medium`                                                           | Overlay drawer corner radius                                                                                          |
| `--ds-radius-large`                                                            | Full-screen sheet corner radius (top corners on mobile sheet presentation)                                            |
| `--ds-size-small` / `--ds-size-medium`                                         | Edit-mode control heights (small default in the docked rail, medium in wider overlay/sheet contexts)                  |
| `--ds-popover-padding` / `--ds-popover-row-height` / `--ds-popover-row-radius` | Any `Combobox`/`Select` popover opened from a property row                                                            |
| `--ds-motion-timing-swift`                                                     | All motion in this pattern                                                                                            |
| `--ds-motion-overlay-duration` / `--ds-motion-overlay-scale`                   | Drawer/sheet entrance and exit                                                                                        |
| `--ds-z-drawer`                                                                | Overlay drawer stacking context                                                                                       |
| `--ds-z-tooltip`                                                               | Disabled-row explanatory tooltip, Context Card preview                                                                |
| `--geist-gap` (24px)                                                           | Spacing between section groups                                                                                        |
| `--geist-gap-quarter` (8px) / `--geist-space-4x` (16px)                        | Internal row padding, footer button gap                                                                               |
| `text-label-12`                                                                | Section headers, header eyebrow                                                                                       |
| `text-label-14`                                                                | Row labels and values                                                                                                 |
| `text-label-13`                                                                | Inline error message under a row                                                                                      |
| `text-heading-16`                                                              | Header title (entity name)                                                                                            |
| `text-copy-14`                                                                 | Footer status text, empty-state instruction copy                                                                      |

## Implementation guidance

**Radix primitive mapping**

- `Collapse` (single) → Radix `Collapsible`, already vendored at `src/components/ui/collapsible.tsx`.
- `CollapseGroup` → Radix `Accordion` (`type="single"` for accordion behavior, `type="multiple"` for the `multiple` prop from `collapse.md`), already vendored at `src/components/ui/accordion.tsx`.
- `Context Card` → Radix `HoverCard` (`src/components/ui/hover-card.tsx`) for the hover-reveal behavior, composed with `src/components/ui/popover.tsx` if a click-to-pin variant is ever needed.
- Edit-mode controls → existing `src/components/ui/input.tsx`, `src/components/ui/select.tsx` (Radix `Select`, for a short fixed list where typing doesn't help, per `combobox.md`'s own When-to-use split), `src/components/ui/checkbox.tsx`. A filterable long-list property (e.g. picking an owner from hundreds of teammates) needs a new `Combobox` port — none exists yet — built on `src/components/ui/popover.tsx` + `src/components/ui/command.tsx` (already vendored, cmdk-based).
- Overlay drawer → `src/components/ui/drawer.tsx` (Vaul-based) anchored to the right edge.
- Full-screen mobile sheet → `src/components/ui/sheet.tsx` (Radix `Dialog`-based), matching the documented auto-swap behavior.
- Loading rows → existing `src/components/ui/skeleton.tsx`.

**New shared primitives to build** (none of these exist yet — `Description`, `Fieldset`, and `Collapse`'s Geist-flavored wrapper are still research-only)

- `src/components/ui/description.tsx` — the `title`/`content` pair with `right` and `ellipsis` modifiers, per `description.md`.
- `src/components/ui/fieldset.tsx` — `Fieldset`/`FieldsetContent`/`FieldsetTitle`/`FieldsetSubtitle`/`FieldsetFooter`/`FieldsetFooterStatus`/`FieldsetFooterActions`, per `fieldset.md`. The footer pieces are what this pattern's sticky footer reuses directly.
- `src/components/ui/context-card.tsx` — thin wrapper around `hover-card.tsx` implementing the fixed content shape from `context-card.md` (heading + identifying subline + 2-4 label/value rows + at most one CTA).

**Pattern-level composition** (new, one layer above the primitives — this is the actual deliverable of this doc)

- `PropertyPanel` — the shell (header/body/footer), taking a `placement` prop (`"docked" | "drawer" | "sheet"`) that switches its own root element between a plain `<aside>`, `drawer.tsx`, and `sheet.tsx` without changing anything below it.
- `PropertySection` — wraps `Collapse`/`CollapseGroup` (or renders as a static, non-collapsible header) for one named group of rows.
- `PropertyRow` — wraps `Description` and owns the display-mode/edit-mode swap, the Mixed-value rendering, and the disabled/error/loading visuals described above.
- Place these under `src/components/shared/` (the existing home for cross-surface UI, alongside `StageTimeline.tsx`) rather than inside any one domain folder — every surface below composes the same three components instead of hand-rolling its own inspector.

**Composition with existing Cadence code**

- `src/components/cockpit/AgentInspector.tsx` is the closest existing surface to this pattern today, but it predates Tempo (it's built on legacy `--ink-*` tokens, not `--ds-*`) and hand-rolls its own row markup rather than using `Description`/`Fieldset`. When it's next touched, port it onto `PropertyPanel`/`PropertySection`/`PropertyRow` rather than reworking its bespoke styles in place.
- Any future PRD, roadmap-item, or trust-ledger-entry detail view that needs a right-rail inspector (per the v13 build queue) should reach for `PropertyPanel` from the start rather than composing `Fieldset`/`Description` ad hoc per surface.
- Server-side field updates from a `PropertyRow` commit follow the existing `src/lib/<domain>.functions.ts` server-function convention — the row's `onCommit` calls a TanStack mutation, the row shows its own loading/error state locally while that mutation is in flight, and the panel never needs its own separate save-state machine for simple single-field edits (only the explicit-save/batch footer variant needs one, per the multi-select mode above).

## Usage examples

**1. Roadmap item, single selection, docked rail**

```tsx
<PropertyPanel placement="docked" entity={{ type: "Roadmap item", name: item.title }}>
  <PropertySection title="Overview" static>
    <PropertyRow
      label="Status"
      value={item.status}
      control={{ kind: "select", options: STATUS_OPTIONS }}
      onCommit={(status) => updateRoadmapItem({ id: item.id, status })}
    />
    <PropertyRow
      label="Owner"
      value={item.ownerName}
      control={{ kind: "combobox", source: teammates }}
    />
    <PropertyRow
      label="Target release"
      value={item.targetRelease}
      control={{ kind: "select", options: RELEASE_OPTIONS }}
    />
    <PropertyRow
      label="Tags"
      value={item.tags}
      control={{ kind: "multiselect", source: allTags }}
    />
  </PropertySection>

  <PropertySection title="Advanced" defaultExpanded={false}>
    <PropertyRow label="Created" value={item.createdAt} readOnly />
    <PropertyRow label="Internal ID" value={item.id} readOnly mono copyable />
  </PropertySection>

  <PropertyPanelFooter status="Saved a moment ago" />
</PropertyPanel>
```

**2. Bulk edit across a multi-select, overlay drawer**

```tsx
<PropertyPanel placement="drawer" selection={{ count: 12, entityType: "Roadmap item" }}>
  <PropertySection title="Overview" static>
    <PropertyRow
      label="Status"
      value={aggregate.status}
      mixed={aggregate.statusIsMixed}
      control={{ kind: "select", options: STATUS_OPTIONS }}
      onCommit={(status) => bulkUpdateRoadmapItems({ ids: selectedIds, status })}
    />
    <PropertyRow
      label="Target release"
      value={aggregate.targetRelease}
      mixed={aggregate.releaseIsMixed}
    />
  </PropertySection>

  <PropertyPanelFooter primaryLabel="Apply to 12 items" secondaryLabel="Cancel" />
</PropertyPanel>
```

**3. Agent run inspector, read-only, full-screen sheet on mobile**

```tsx
<PropertyPanel
  placement="sheet"
  locked
  lockedReason="You have view-only access to this agent."
  entity={{ type: "Agent", name: agent.name }}
>
  <PropertySection title="Overview" static>
    <PropertyRow label="Role" value={agent.role} readOnly />
    <PropertyRow label="Last run" value={lastRun?.completedAt} readOnly />
    <PropertyRow label="Memory scope" value={agent.memoryScope} readOnly />
  </PropertySection>

  <PropertySection title="Recent runs" defaultExpanded>
    {runs.map((run) => (
      <ContextCardTrigger key={run.id} content={runSummary(run)} side="left">
        <PropertyRow label={run.missionTitle} value={run.status} readOnly />
      </ContextCardTrigger>
    ))}
  </PropertySection>
</PropertyPanel>
```

## Do / Don't

- Do collapse everything except the one section a user needs on first glance ("Overview"); don't ship a panel where every section is expanded by default — that's not disclosure, that's just a long page.
- Do use the word "Mixed" for divergent multi-select values; don't reuse the em dash for it — the em dash means "unset," and conflating the two risks an operator overwriting a dozen different values with one value by mistake.
- Do keep a row's value focusable and its old value visible while a save is in flight; don't blank the row or disable it just because a request is pending.
- Do put a third footer action in the header's overflow menu; don't add a third button to the sticky footer — two is the ceiling, per the Button contract.
- Do pair every disabled row with a `Tooltip` (or a header-level lock glyph in fully locked mode) stating why; don't ship a greyed-out row with no explanation.
- Do reuse `Description`'s `<dl>`/`<dt>`/`<dd>` semantics for every row, even mid-edit; don't strip that structure just because the value slot became interactive.
- Do gate every transition in this pattern on `prefers-reduced-motion`; don't make the display-to-edit swap or a section's expand/collapse the only way information becomes visible.
- Don't stack a `material-*` preset on top of the docked rail's own edge border — it's page chrome, not a floating surface; only the drawer/sheet variants get a material.
- Don't put a destructive action (delete, archive) inside a property row's inline edit affordance — route it through the header's overflow menu with its own confirming step, per the contract's destructive-action-to-confirming-flow rule.
- Don't invent a new eyebrow treatment for section headers (no mono-caps, no middots) — that styling was retired with the pre-Tempo systems; Title Case `text-label-12`/`gray-900` is the only sanctioned form.
