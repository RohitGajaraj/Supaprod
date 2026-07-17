# Audit trace-tag (the clickable id chip)

> A trace tag is the small mono `PREFIX·XXXXXX` chip that shows an entity's platform-generated
> audit id (`OPP·005C82`, `MIS·7E7D59`). It looks like the quiet metadata ref it has always
> been, but it is now a live control: click it to open that entity's verifiable lineage, and
> (in detail views) copy the full id. It is the single, uniform way an id becomes a door to its
> own audit trail.
>
> Extension — base: the `--ds-*` mono type + color-role tokens, `loom-press` press affordance,
> the Sheet/drawer pattern it opens ([`dialogs-drawers-sheets.md`](./dialogs-drawers-sheets.md)),
> and the AI-interfaces receipts/trust-evidence family ([`ai-interfaces.md`](./ai-interfaces.md)) ·
> inspiration: Linear's issue-id chips and Stripe's object-id copy affordance (principles only,
> re-derived below). · Founder ruling 2026-07-13: "everything should have a traceable audit id
> generated out of this platform." Component: `src/components/supaprod/AuditTag.tsx`. Feature:
> [`docs/features/audit-id-lineage.md`](../../../docs/features/audit-id-lineage.md).

## Anatomy — the parts, named

```
 plain (lists, cards)              copyable (entity detail views)
┌───────────────┐                 ┌───────────────┬────┐
│  OPP·005C82   │                 │  OPP·005C82   │ ⧉  │
└───────────────┘                 └───────────────┴────┘
   └ trace label                     └ trace label   └ copy affordance
     role=button                       role=button     role=button (icon)
     click → lineage                    click→lineage    click→copy full id
```

- **Trace label** — the canonical tag `formatAuditId(kind, id)` = uppercase stage prefix + `·`
  - the first six alphanumerics of the uuid. Mono, `text-faint`, letter-spacing 0.06em. This is
    the whole control in the plain variant.
- **Copy affordance** (copyable variant only) — a 12px lucide `Copy` icon to the right, its own
  small control, that writes the **full uuid** (not the short tag) to the clipboard and briefly
  swaps to a `Check` on success. Replaces the old standalone "copy trace id" button so one chip
  both traces and copies.

The chip carries **no border or fill at rest** — it is inline metadata, not a button-shaped
thing. The affordance is revealed on hover/focus (see States), keeping the restraint budget: a
screen full of ids does not read as a screen full of buttons.

## Variants

| Variant      | Where                                                                                             | Composition             |
| ------------ | ------------------------------------------------------------------------------------------------- | ----------------------- |
| **plain**    | lists, cards, table cells, graph node story                                                       | trace label only        |
| **copyable** | entity detail views / slide-overs (spec, decision, learning, signal record, mission, opportunity) | trace label + copy icon |

There is exactly one component (`AuditTag`); `copyable` is a boolean prop. Do not fork it.

## States

- **Rest** — `text-faint`, transparent border, no background. Reads as quiet metadata.
- **Hover** — label color lifts to `text-primary` and a hairline `ember-line` border appears
  (the brand's "this is interactive, and it is ours" cue). Copy icon lifts `text-faint → text-subtle`.
- **Focus-visible** — a 2px `focus-ring` outline at 2px offset (keyboard parity with all Tempo
  controls). Never suppress focus for aesthetics.
- **Active / press** — `loom-press` micro-scale.
- **Copied** (copyable) — the `Copy` glyph swaps to `Check` for ~1.2s, then reverts. No toast
  (the inline glyph is the whole feedback; a toast would be noise for a metadata action).
- **Unresolvable kind** — there is no disabled state on the chip itself; a kind with no standalone
  audit entity (theme, playbook, assumption, roadmap_item, task, design_memory) is simply **not
  rendered as an AuditTag** — it stays a plain, non-interactive `<span>` ref. The system never
  offers a trace it cannot fulfill.

## Interaction model

- **Click / Enter / Space on the label** → `openLineage(tag)` (dispatches the `supaprod:open-lineage`
  event; the global [`AuditLineageSheet`](../../../docs/features/audit-id-lineage.md) fetches and
  opens). Both handlers call `stopPropagation` so a tag living inside a clickable row `<button>`
  traces the entity instead of triggering the row.
- **Click / Enter / Space on the copy icon** (copyable) → copies the full uuid, shows `Check`.
- Naming the id in **Ask** opens the same sheet deterministically (no model call).

## Accessibility

- Rendered as **`<span role="button" tabIndex={0}>`**, NOT a `<button>`. This is deliberate:
  trace tags frequently live inside a clickable row `<button>`, and a `<button>` inside a
  `<button>` is invalid DOM / a React hydration error. `role="button"` + `tabIndex` + a keydown
  handler for Enter/Space gives full keyboard and AT parity without the nesting violation.
- **`aria-label`**: `Trace audit id OPP·005C82` on the label; `Copy the full trace id` on the
  copy control. The bare `·`-joined tag alone would read poorly to a screen reader, so the label
  names the action.
- Focus is always visible (see States). Both sub-controls are independently tabbable.
- The middot `·` is a visual separator only; it is inside the accessible name, not a control.

## Responsive

The chip is intrinsically sized and inline; it never wraps mid-tag (the tag is atomic). In dense
rows it sits in the metadata cluster (trace · time · status). No breakpoint-specific behavior.

## Tokens used

- Type: `--font-mono`, 10.5px, letter-spacing 0.06em (matches the retired static chip so the
  rollout is visually a no-op at rest).
- Color: `--text-faint` (rest label), `--text-primary` (hover label), `--text-subtle` (copy hover),
  `--ember-line` (hover border — the only brand touch), `--focus-ring` (focus outline).
- Radius 5px; 1px transparent border at rest (so the hover border does not shift layout);
  negative margin offsets the 1px/4px padding so the chip occupies the same box as bare text.
- Never invent a hex, radius, or easing here — compose the tokens above.

## Do / Don't

- **Do** use `AuditTag` for every entity id the app displays, so every id is a live, verifiable
  entry point (the founder ruling).
- **Do** pass `copyable` in entity detail views, and drop the old standalone copy button.
- **Do** map a local kind vocabulary to `AuditKind` and fall back to a plain ref for kinds with
  no audit entity (see `GRAPH_AUDIT_KIND`, `CALL_AUDIT_KIND`).
- **Don't** render it as a `<button>` or wrap it in one — it must nest inside clickable rows.
- **Don't** give it a rest-state fill/border or make it ember-colored — it is quiet metadata
  until hovered; the restraint budget (≥90% neutral) still holds on id-dense screens.
- **Don't** copy the short tag on the copy action — copy the full uuid (the tag is for reading,
  the uuid is for pasting).
- **Don't** fabricate a tag for an entity kind the lineage resolver cannot resolve.

## Usage examples

```tsx
// List / card — quiet, clickable ref.
<AuditTag kind="opportunity" id={opportunity.id} />

// Detail view — trace + copy in one chip (replaces the old copy button).
<AuditTag kind="mission" id={missionId} copyable />

// Dynamic surface — map the local kind, degrade to a plain ref otherwise.
{GRAPH_AUDIT_KIND[node.kind] ? (
  <AuditTag kind={GRAPH_AUDIT_KIND[node.kind]} id={node.id} title={node.id} />
) : (
  <span className="mono-ref">{kindTracePrefix(node.kind)}·{traceRef(node.id)}</span>
)}
```

## Why (the rationale, for tomorrow's builds)

The tag existed as a static label long before it was a control. Making it clickable — rather than
adding a separate "trace" button — keeps the surface calm (no new chrome, no new color) while
turning a decorative-looking id into genuine, verifiable provenance. The `<span role="button">`
choice is load-bearing: it is the only shape that survives nesting inside the clickable rows these
ids live in, and getting it wrong reintroduces hydration errors. Extending traceability to a new
entity is a one-line add to `AUDIT_KINDS` (`src/lib/audit-id.ts`); the tag, the lineage sheet, and
Ask all pick it up, so the pattern scales without new UI.
