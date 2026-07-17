# Dialogs, drawers & sheets

> Interrupt the user only as much as the moment deserves: a centered Modal for a focused
> decision, a Sheet for a contextual side task, a Drawer for a small-viewport equivalent of
> both.
> Extension — base: Geist `Drawer`, `DestructiveActionModal`, `Collapse`, the `material-modal`
> / `material-fullscreen` presets, `--ds-z-drawer` / `--ds-z-modal` layering, the `Button`
> variant set (`default`, `secondary`, `tertiary`, `error`, `warning`) · inspiration: Stripe
> Apps' ContextView/FocusView split (non-blocking side context vs. blocking focused workflow,
> paraphrased as a principle, not their component names), general modal-vs-panel product
> guidance (use a blocking Modal only for a genuinely high-stakes decision; prefer a
> non-blocking side panel whenever the user should keep their place on the page).

## Anatomy

Every floating surface in this family is built from the same five parts. What differs
between Modal, Drawer, and Sheet is position, motion axis, and which parts are mandatory.

```
Overlay (backdrop)
└── Surface (material-modal / material-large / material-fullscreen)
    ├── Header
    │   ├── Title (required)
    │   ├── Description (optional, one line of context under the title)
    │   └── Close affordance (icon-only "X", top-right — omit ONLY when the surface
    │       is a required gate with no dismiss path, e.g. a blocking first-run step)
    ├── Body (scrollable region; the only part that scrolls internally)
    ├── Irreversibility band (destructive flows only — see Variants)
    └── Footer
        ├── Secondary / Cancel action (left of the primary, sentence-case, literal "Cancel"
        │   unless a more specific dismiss verb reads better)
        └── Primary action (right-most, Button variant carries the meaning: `default` for a
            neutral confirm, `error` for a destructive one)
```

Modal (desktop, centered):

```
┌───────────────────────────── overlay ─────────────────────────────┐
│                                                                    │
│            ┌──────────────────────────────────────┐              │
│            │ Title                          [ X ]  │  ← Header    │
│            │ Description (optional)                │              │
│            ├──────────────────────────────────────┤              │
│            │                                        │              │
│            │  Body (scrolls internally if tall)     │  ← Body      │
│            │                                        │              │
│            ├──────────────────────────────────────┤              │
│            │ ░ cannot be undone ░ (destructive only)│  ← band      │
│            ├──────────────────────────────────────┤              │
│            │                     Cancel   Primary  │  ← Footer    │
│            └──────────────────────────────────────┘              │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

Sheet (desktop/tablet, edge-anchored — right is the default edge):

```
┌──────────────────────────────────────┬─────────────────────┐
│                                       │ Title          [ X ]│
│         page content behind,         │ Description         │
│      dimmed but not interactive      │──────────────────────│
│         (Focus sheet) or             │ Body (scrolls)       │
│      left fully interactive          │                      │
│         (Context sheet)              │──────────────────────│
│                                       │        Cancel Primary│
└──────────────────────────────────────┴─────────────────────┘
```

Drawer (mobile/small viewport, bottom-anchored, content-driven or fixed height):

```
┌────────────────────────────────────┐
│         page content, dimmed       │
│  ┌───────────────────────────────┐ │
│  │        — grab handle —        │ │
│  │ Title                         │ │
│  │ Body (scrolls internally)     │ │
│  │──────────────────────────────│ │
│  │            Cancel   Primary   │ │
│  └───────────────────────────────┘ │
└────────────────────────────────────┘
```

## Variants

Pick the lightest surface that still earns the interruption. In order of how much of the
user's context they take away:

| Variant                      | Blocking?                                                | When to use                                                                                                                                                                                                                                                                                                                                    |
| ---------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Context sheet**            | No — page stays lightly dimmed but interactive behind it | Peeking or lightly editing one record while the list/board stays live (e.g. reading a PRD's linked evidence while Discovery stays scrollable behind it). Paraphrased from the Stripe Apps ContextView principle: side-by-side context, not full attention capture.                                                                             |
| **Focus sheet**              | Yes — full backdrop, page inert behind it                | A deeper, longer edit that still belongs beside its source rather than replacing it (editing a roadmap item's full detail form). Paraphrased from the Stripe Apps FocusView principle: same edge-anchored shape as Context sheet, but attention-capturing.                                                                                     |
| **Standard modal**           | Yes                                                      | A short, self-contained task that has nothing to do with what's behind it: a single form, a settings sub-screen, a picker. `material-modal` (12px radius), centered, width from the size ladder below.                                                                                                                                         |
| **Confirm modal**            | Yes                                                      | A yes/no decision with real but reversible consequence (discard changes, leave a run, disconnect a non-destructive integration). Smallest width on the ladder; body copy is one or two sentences, never a form.                                                                                                                                |
| **Destructive action modal** | Yes                                                      | Delete, revoke, rotate, disconnect, or any action that destroys data or access. Always the type-to-confirm gate (see Interaction model); always an `error`-variant trigger and primary action. Never demoted to Drawer even on mobile — the friction is the point.                                                                             |
| **Fullscreen takeover**      | Yes                                                      | A genuinely multi-step or immersive flow (a build wizard, a multi-field import mapper) that needs the whole viewport but is conceptually still "on top of" the page, not a route change. `material-fullscreen` (16px radius, the only elevation role above modal). Use sparingly — if it always deserves its own URL, make it a route instead. |
| **Drawer**                   | Yes, mobile only                                         | The small-viewport substitute for Modal, Sheet, or Confirm modal alike. Bottom-anchored, content-height by default, `height` override only when the default height would clip the primary action. Never the substitute for Destructive action modal (§ above).                                                                                 |

Size ladder (Modal / Fullscreen width; Sheet width is fixed per breakpoint, see Responsive
behavior):

| Size             | Width         | Use                                                                   |
| ---------------- | ------------- | --------------------------------------------------------------------- |
| Small            | ~400px        | Confirm modal, Destructive action modal                               |
| Medium (default) | ~480–560px    | Standard modal — one form, one picker                                 |
| Large            | ~720px        | Standard modal with denser content (multi-field form, embedded table) |
| Fullscreen       | 100vw / 100vh | Fullscreen takeover only                                              |

## States

| State                      | Applies to                                            | Tokens                                                                                                                                                                                                                    |
| -------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Default                    | Surface fill                                          | `--ds-background-100` background, radius + shadow from the material class (`material-modal` = `--ds-radius-medium` + `--ds-shadow-border-medium`; `material-fullscreen` = `--ds-radius-large` + `--ds-shadow-fullscreen`) |
| Overlay                    | Backdrop                                              | `background: var(--ds-overlay-backdrop-color)` at `--ds-overlay-backdrop-opacity` (0.8)                                                                                                                                   |
| Close affordance — default | Header "X"                                            | transparent background, icon `--ds-gray-900`                                                                                                                                                                              |
| Close affordance — hover   | Header "X"                                            | background `--ds-gray-100`, icon `--ds-gray-1000`                                                                                                                                                                         |
| Close affordance — active  | Header "X"                                            | background `--ds-gray-200`, icon `--ds-gray-1000`                                                                                                                                                                         |
| Close affordance — focus   | Header "X"                                            | `--ds-focus-ring-outline`, background unchanged from resting state                                                                                                                                                        |
| Disabled (footer buttons)  | Confirm/Primary while gate unmet or request in flight | Follows the `Button` component's own disabled treatment (see `research/button.md`); always paired with the reason surfaced in body copy, never a bare disabled control                                                    |
| Loading                    | Destructive/confirm modal mid-request                 | Both footer buttons disabled together; spinner renders on the primary button itself (no separate overlay); surface never self-dismisses                                                                                   |
| Empty                      | Body, e.g. a sheet with nothing to show yet           | One small `empty-state` composition (per `research/empty-state.md` — max one per surface), instructive copy, no apology                                                                                                   |
| Error                      | Body, inline field or load failure                    | Text `--ds-red-900`, border `--ds-red-400` on the offending input, background wash `--ds-red-100` for a load-failure banner; icon `--ds-red-900`. Modal/Sheet/Drawer stays open so the user doesn't lose typed state.     |
| Irreversibility band       | Destructive action modal only                         | Diagonal hazard stripe alternating `--ds-red-100`/`--ds-red-200`, top border `--ds-red-400`, text `--ds-red-900`, warning icon `--ds-red-900` marked `aria-hidden` (the sentence already carries the meaning)             |

Note on skeletons: if the body is fetching content (e.g. a Focus sheet opened before its
record has loaded), use flat `--ds-gray-100` placeholder blocks at the real content's
proportions. Do not add a shimmer sweep — shimmer is retired system-wide (§10 of the
contract); the flat block plus the surface's own entrance motion is the only affordance.

## Interaction model

**Pointer**

- Trigger click opens the surface; focus moves into it (see Accessibility).
- Clicking the overlay dismisses Modal, Sheet, and Drawer — _unless_ an unsaved-changes guard
  is armed (see below), or the surface is a Destructive action modal mid-`loading` request.
- Drawer additionally supports swipe-down-to-dismiss (native to the underlying primitive).
- Never open a second Modal, Sheet, or Drawer from inside one that is already open. If a
  deeper step is genuinely needed, replace the current surface's content in place (a
  "step" pattern within one Sheet/Modal) rather than stacking a second floating layer —
  the contract permits at most one floating surface at a time. Non-modal floating elements
  that already have their own z-index band (menus at `--ds-z-menu`, toasts at
  `--ds-z-toast`, tooltips at `--ds-z-tooltip`) are exempt and may render above an open
  Modal/Sheet/Drawer, since they're momentary, not a second competing surface.

**Unsaved-changes guard**

- Arm the guard only when the surface holds dirty, unsubmitted input.
- While armed: overlay click and Escape open a small Confirm modal ("Discard changes?" /
  "Your edits have not been saved.") instead of dismissing immediately; confirming that
  prompt closes both surfaces, canceling it returns focus to the still-open original surface.
- Never arm the guard for a surface that only _displays_ data (Context sheet, read-only
  Modal) — the guard exists for genuine data loss, not as reflexive friction.

**Keyboard**

| Key                          | Effect                                                                                                                                      |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `Tab` / `Shift+Tab`          | Cycle focusable elements; focus is trapped inside the surface while open                                                                    |
| `Escape`                     | Dismiss (routes through the unsaved-changes guard if armed; inert while a request from this surface is in flight)                           |
| `Enter`                      | Activates the focused button; in a Destructive action modal, submits the primary action only once the typed phrase matches, otherwise inert |
| `Space`                      | Activates the focused button/checkbox                                                                                                       |
| System back gesture (mobile) | Dismisses the Drawer, same rules as Escape                                                                                                  |

**Screen-reader behavior**

- Modal, Sheet, Drawer: `role="dialog"`, `aria-modal="true"`.
- Destructive action modal: `role="alertdialog"` (the stronger interruption semantics match
  the stakes).
- `aria-labelledby` points at the Title node, `aria-describedby` at the Description node.
- Focus moves to the first focusable element on open (or the verification input,
  autofocused, for a Destructive action modal); on close, focus returns to the trigger that
  opened it — never left floating on `<body>`.

**Motion**

- Modal / Fullscreen: scale in from `--ds-motion-overlay-scale` (0.96) to 1 while fading in,
  timed with `--ds-motion-overlay-timing` (`--ds-motion-timing-swift`) over
  `--ds-motion-overlay-duration` (0.3s). Reverse on close.
- Sheet / Drawer: translate in along their anchored axis (from off-screen to resting
  position) rather than scale — same timing function and duration token
  (`--ds-motion-overlay-timing` / `--ds-motion-overlay-duration`) so every floating surface in
  this family reads as one motion language even though the axis differs.
- Backdrop fades in to `--ds-overlay-backdrop-opacity` (0.8) simultaneously with the surface.
- `prefers-reduced-motion`: replace scale/translate with a plain opacity crossfade capped at
  150ms; the backdrop still fades but never scales/slides.

## Responsive behavior

- **Desktop**: Modal centered on the size ladder; Sheet anchored to its edge (right by
  default) at a fixed width per breakpoint; Drawer is never used.
- **Tablet**: Same as desktop down to the point where a Sheet's fixed width would exceed
  roughly half the viewport — at that breakpoint, promote the Sheet's width to fill enough
  of the viewport to stay legible (still edge-anchored, not centered) rather than shrinking
  its content.
- **Mobile**: Sheet and standard Modal both collapse to Drawer at the mobile breakpoint —
  swap the component, don't just restyle the Sheet/Modal to look like a Drawer. Destructive
  action modal is the one exception: it stays a (narrower) Modal at every breakpoint,
  because Geist's own guidance is explicit that a Drawer's lighter dismiss affordances
  undersell a destructive action's stakes.
- Confirm modal narrows to the mobile Modal width but is not promoted to Drawer either — it
  is short enough that a Modal reads fine at any width, and keeping it a Modal avoids an
  extra component swap for a one-decision surface.

## Accessibility

- Roles and labeling: see Interaction model's "Screen-reader behavior" above — this is not
  optional, it's how a screen-reader user knows they've entered a distinct interruption.
- Focus order inside the surface: Title (not focusable itself, but the labeling target) →
  body controls in visual order → footer, Cancel/secondary before Primary in the DOM (so
  Cancel announces first) while both remain visually right-aligned with Primary right-most.
- Contrast: body/heading text on `--ds-background-100` uses `--ds-gray-1000` (primary) or
  `--ds-gray-900` (secondary) per the role model — both are the system's pre-validated
  accessible pairings, don't introduce a third gray for surface text.
- Background scroll lock while any surface is open; restore scroll position on close.
  Specifically matters on iOS to stop rubber-band scroll bleeding through behind a Drawer.
- `prefers-reduced-motion` handling is mandatory, not a nice-to-have — see Motion above.
- Icon-only close affordance requires `aria-label="Close"` (or a more specific label if the
  surface's title makes a generic "Close" ambiguous, e.g. `aria-label="Close filter panel"`).

## Tokens used

| Token                                                                   | Role in this pattern                                                                                  |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `--ds-background-100`                                                   | Surface fill (Modal/Sheet/Drawer/Fullscreen), also the page behind                                    |
| `--ds-radius-medium`                                                    | Modal, Sheet, Drawer corner radius (via `material-modal`/`material-large`)                            |
| `--ds-radius-large`                                                     | Fullscreen takeover corner radius (via `material-fullscreen`)                                         |
| `--ds-shadow-border-medium`                                             | Modal/Sheet/Drawer elevation (via `material-modal`/`material-large`)                                  |
| `--ds-shadow-fullscreen`                                                | Fullscreen takeover elevation                                                                         |
| `--ds-overlay-backdrop-color` / `--ds-overlay-backdrop-opacity`         | Backdrop fill (`#000` at 0.8)                                                                         |
| `--ds-z-drawer` (200)                                                   | Drawer/Sheet stacking context                                                                         |
| `--ds-z-modal` (300)                                                    | Modal/Fullscreen stacking context                                                                     |
| `--ds-z-menu` (2001) / `--ds-z-toast` (5000) / `--ds-z-tooltip` (99999) | Momentary floating elements exempt from the one-surface rule, always above an open Modal/Sheet/Drawer |
| `--ds-motion-timing-swift`                                              | Entrance/exit easing for every variant                                                                |
| `--ds-motion-overlay-scale` (0.96)                                      | Modal/Fullscreen entrance scale-from value                                                            |
| `--ds-motion-overlay-duration` (0.3s)                                   | Entrance/exit duration, all variants                                                                  |
| `--ds-gray-100` / `--ds-gray-200`                                       | Close affordance hover/active background                                                              |
| `--ds-gray-900` / `--ds-gray-1000`                                      | Close affordance and body text, secondary/primary                                                     |
| `--ds-focus-ring-outline`                                               | Focus state on close affordance and all interactive children                                          |
| `--ds-red-100` / `--ds-red-200`                                         | Irreversibility band stripe, error banner wash                                                        |
| `--ds-red-400`                                                          | Irreversibility band top border, invalid-input border                                                 |
| `--ds-red-900`                                                          | Irreversibility band text/icon, inline error text                                                     |
| `text-heading-20` / `text-heading-16`                                   | Title (size by Modal size ladder: 20 for Medium/Large, 16 for Small/Confirm)                          |
| `text-copy-14`                                                          | Description and body copy                                                                             |
| `text-button-14`                                                        | Footer button labels (inherited from `Button`)                                                        |
| `--geist-space-6x` (24px)                                               | Header/body/footer padding rhythm                                                                     |
| `--geist-gap-quarter` (8px)                                             | Tight internal gaps (icon-to-label in the irreversibility band, etc.)                                 |

## Implementation guidance

**Radix / primitive mapping**

- Modal, Standard/Confirm modal, Fullscreen takeover → `@radix-ui/react-dialog`, same
  primitive already wired in `src/components/ui/dialog.tsx`.
- Sheet (Context/Focus, either edge) → the same `@radix-ui/react-dialog` primitive,
  edge-positioned — already the shape of `src/components/ui/sheet.tsx` (its `side` variant
  covers `right` as default plus `left`/`top`/`bottom`; this pattern only sanctions `right`
  as the default edge and `bottom`-as-Drawer-substitute is out of scope here since Drawer
  itself covers that case).
- Drawer → `vaul`'s `Drawer` primitive, already wired in `src/components/ui/drawer.tsx`.
- Destructive action modal → `@radix-ui/react-alert-dialog` (`role="alertdialog"` built in),
  already wired in `src/components/ui/alert-dialog.tsx`. Compose the type-to-confirm gate
  (verification input + phrase match + `loading`/`error` props) as a new
  `src/components/ui/destructive-action-dialog.tsx` that wraps `AlertDialog*` — Geist's
  `DestructiveActionModal` is a flat, single component in their library (no compound
  sub-parts beyond the primitives above), so match that flat prop surface
  (`title`, `description`, `confirmLabel`, `verificationPhrase`, `verificationLabel`,
  `irreversibleDescription`, `loading`, `error`, `onConfirm`, `onCancel`) rather than
  inventing new subcomponents.

**Restyling the existing primitives to Tempo**

- Replace ad-hoc Tailwind (`bg-background`, `border`, `shadow-lg`, `text-lg font-semibold`,
  `bg-black/50`) in `dialog.tsx` / `sheet.tsx` / `drawer.tsx` / `alert-dialog.tsx` with the
  material classes (`material-modal`, `material-large`, `material-fullscreen`) plus the
  type classes (`text-heading-20`, `text-copy-14`) and the literal overlay tokens
  (`--ds-overlay-backdrop-color` / `-opacity`) — never leave a Tailwind default color/shadow
  utility on a surface that a `--ds-*` token already covers.
- Swap `z-50` for the named bands: `--ds-z-drawer` on `SheetOverlay`/`SheetContent` and
  `DrawerOverlay`/`DrawerContent`, `--ds-z-modal` on `DialogOverlay`/`DialogContent` and the
  `AlertDialog` equivalents.

**Responsive component swap (Sheet/Modal ↔ Drawer)**

- Drive the swap from a single viewport hook (e.g. a `useIsMobile()` matching the mobile
  breakpoint) at the call site, rendering `<Sheet>`/`<Dialog>` above the breakpoint and
  `<Drawer>` below it, sharing the same header/body/footer children — don't fork the
  content, only the outer shell.

**Unsaved-changes guard composition**

- Track dirty state locally (form library's `isDirty`/`formState` or a simple boolean ref)
  and gate the primitive's `onOpenChange`/`onDismiss` callback: if dirty, open a small
  Confirm modal instead of forwarding the dismiss; only forward it once the guard confirms.

**Where these compose with existing Supaprod surfaces**

- Engine Room advanced settings and connector configuration: Standard modal or Focus sheet,
  per the engine-room doctrine's "one door, revealed on demand" — never a second nested
  floating layer once inside.
- Migration-safety / destructive DB or connector actions: the Destructive action modal above,
  never a plain Confirm modal — the stakes call for the typed gate.
- Record peek-and-edit inside a list/board (Discovery, Roadmap, Traces): Context sheet if
  the user should keep the list live behind it; Focus sheet only if the edit is long enough
  to deserve full attention.

## Usage examples

**1. Destructive action modal — deleting a workspace connector**

```tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DestructiveActionDialog } from "@/components/ui/destructive-action-dialog";

function DisconnectGithubButton({ connectorName }: { connectorName: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  return (
    <>
      <Button variant="error" size="small" onClick={() => setOpen(true)}>
        Disconnect GitHub
      </Button>
      <DestructiveActionDialog
        open={open}
        title="Disconnect GitHub"
        description={
          <>
            Supaprod will stop reading <strong>{connectorName}</strong> and any builds that depend on
            it will fail until you reconnect it.
          </>
        }
        irreversibleDescription={`Disconnecting ${connectorName} cannot be undone.`}
        verificationLabel="repository name"
        verificationPhrase={connectorName}
        confirmLabel="Disconnect GitHub"
        loading={loading}
        onCancel={() => setOpen(false)}
        onConfirm={async () => {
          setLoading(true);
          await disconnectConnector(connectorName);
          setLoading(false);
          setOpen(false);
        }}
      />
    </>
  );
}
```

**2. Context sheet — peeking a PRD's linked evidence from Discovery**

```tsx
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

function EvidenceSheet({ prdId, open, onOpenChange }: EvidenceSheetProps) {
  const { data, isLoading } = usePrdEvidence(prdId);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="material-large">
        <SheetHeader>
          <SheetTitle className="text-heading-20">Linked evidence</SheetTitle>
          <SheetDescription className="text-copy-14">What backs this requirement</SheetDescription>
        </SheetHeader>
        {isLoading ? <EvidenceSkeleton /> : <EvidenceList items={data} />}
      </SheetContent>
    </Sheet>
  );
}
```

**3. Mobile drawer with an unsaved-changes guard — Roadmap filter panel**

```tsx
import { useIsMobile } from "@/hooks/use-is-mobile";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { useConfirmDiscard } from "@/hooks/use-confirm-discard";

function RoadmapFilterPanel({ open, onOpenChange, draft, isDirty }: FilterPanelProps) {
  const isMobile = useIsMobile();
  const guardedOnOpenChange = useConfirmDiscard(isDirty, onOpenChange);
  const Shell = isMobile ? Drawer : Sheet;
  const ShellContent = isMobile ? DrawerContent : SheetContent;

  return (
    <Shell open={open} onOpenChange={guardedOnOpenChange}>
      <ShellContent className={isMobile ? undefined : "material-large"}>
        <FilterForm draft={draft} />
      </ShellContent>
    </Shell>
  );
}
```

## Do / Don't

- Do pick the lightest surface that earns the interruption: Context sheet before Focus
  sheet, Focus sheet before Modal, Modal before Fullscreen.
- Do keep exactly one floating surface open at a time; route a deeper step by replacing
  content inside the current surface, never by opening a second one on top.
- Do reserve the type-to-confirm gate for genuinely destructive or high-stakes reversible
  actions; a plain Confirm modal is enough for "discard changes" or "leave without saving."
- Do trap focus, restore it to the trigger on close, and lock background scroll — every
  single time, not just when it's convenient.
- Do swap Sheet/Modal for Drawer at the mobile breakpoint by swapping the component, not by
  restyling one to fake the other.
- Don't stack a second Modal, Sheet, or Drawer while one is already open — that's a contract
  violation (§4, "never stack two materials on one element" extends to never stacking two
  floating surfaces).
- Don't invent a radius, shadow, or backdrop opacity by hand — every value here traces to a
  `--ds-*` token or a `material-*` preset; if a surface needs an elevation this doc doesn't
  cover, that's a gap to raise, not a value to guess.
- Don't demote a Destructive action modal to a Drawer on mobile — the friction is
  deliberate and a Drawer's lighter dismiss affordances undercut it.
- Don't let a loading destructive/confirm action self-dismiss; the caller owns `open` and
  closes it only after the request settles (success), or keeps it open with an inline error
  (failure) so the user can retry without losing typed state.
- Don't add a shimmer sweep to a loading body — shimmer is retired system-wide; use flat
  `--ds-gray-100` placeholder blocks instead.
- Don't skip the unsaved-changes guard on a surface holding dirty input, and don't add it to
  a read-only surface where there is nothing to lose.
- Don't write an icon-only close affordance without `aria-label`, and don't add `aria-label`
  to a close affordance that already has visible text.
