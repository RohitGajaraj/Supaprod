# Sheet

> "Display content in a side panel that slides in from the edge of the screen."

Source: https://vercel.com/geist/sheet

## Sections documented

- **Default** — a full sheet composition (trigger button, header with title + description paragraph, a `SheetDescription` body block, and a footer with a secondary "Close" button and a primary "Next" button). Caption: "In combination with styles overrides most commonly used in front apps." Demonstrates the fully custom-styled variant (rounded corners, inset margin, fixed width on large screens) that Vercel actually uses in production, layered on top of the primitive.
- **With Side** — four buttons ("Open top" / "Open right" / "Open bottom" / "Open left"), each opening an unstyled default `SheetContent` from a different edge via the `side` prop. Caption: "Use the `side` prop to control which edge the sheet slides in from." Demonstrates the `side` enum and default (unstyled) panel appearance/positioning per edge.
- **Best Practices** — an accordion-style block with four subsections: "When to use", "Behavior", "Content", "Accessibility" (see below).

Only two live demo sections are documented for Sheet (no separate Sizes/Types/Variants/States galleries the way some other Geist components have) — Sheet's variation surface is covered entirely by `side` plus the modal/style overrides shown in "Default".

## API

Subcomponents (from `@vercel/geistcn/components`): `Sheet`, `SheetTrigger`, `SheetContent`, `SheetHeader`, `SheetTitle`, `SheetDescription`, `SheetFooter`, `SheetClose`.

Composition pattern:

```
<Sheet modal>
  <SheetTrigger asChild><Button>...</Button></SheetTrigger>
  <SheetContent side="..." noOverlay={false} className="...">
    <SheetHeader>
      <SheetTitle>...</SheetTitle>
      {/* optional description paragraph directly under title */}
    </SheetHeader>
    <SheetDescription>...</SheetDescription>
    <SheetFooter>
      <SheetClose asChild><Button variant="secondary">Close</Button></SheetClose>
      <Button>Next</Button>
    </SheetFooter>
  </SheetContent>
</Sheet>
```

Props observed in the code examples:

- `Sheet`
  - `modal` (boolean) — present as a bare boolean prop (`<Sheet modal>`) in both examples. Best Practices notes the **default is `modal=false`** (non-modal) so the underlying page and high-z elements like toasts stay reachable; pass `modal` explicitly to opt into a blocking/modal sheet.
- `SheetContent`
  - `side` — enum `'top' | 'right' | 'bottom' | 'left'`, demoed by mapping over `const sides = ['top', 'right', 'bottom', 'left'] as const`. Default (unset) side in the "Default" example is the standard/right-hand panel (no `side` passed there).
  - `noOverlay` (boolean) — shown explicitly set to `false` in the styled example (`noOverlay={false}`), implying an overlay-suppression escape hatch exists (some sheets can render without a backdrop overlay).
  - `className` — full Tailwind override support; the Default example overrides margin/height/width/radius/background/padding/flex layout directly (see Design notes).
- `SheetTrigger`
  - `asChild` — Radix-style slot composition, used to render a `Button` as the actual trigger element rather than wrapping it.
- `SheetClose`
  - `asChild` — same slot pattern, wraps a `Button` (`variant="secondary"`) as the dismiss control.
- `SheetHeader` / `SheetFooter` — layout/grouping wrappers; both accept `className` for spacing/alignment overrides (`text-left`, `p-6`, `gap-2 flex-row justify-end mt-auto`, etc.).
- `SheetTitle` — plain text title node, no special props shown.
- `SheetDescription` — body/description slot, distinct from the short paragraph sometimes placed under the title in `SheetHeader`; takes `className` for typography/spacing (`px-6 py-4 text-copy-14`).
- `Button` — reused from the shared kit; `variant="secondary"` shown for the Close action, default (primary) variant for the main trigger and the "Next" action.

## Best practices (paraphrased)

**When to use**

- Reach for Sheet when the user needs persistent, related context alongside the page they're already on — e.g. deployment details, inspecting a log row, or a member's profile — where the page underneath is still meaningfully usable.
- If the interaction is a blocking decision, use Modal instead; if it's a mobile-only bottom panel, use Drawer instead.
- Don't use Sheet to confirm a destructive action — its non-modal default leaves the underlying page interactive, which undersells the severity of something like a delete or revoke; use a real confirmation modal for those.

**Behavior**

- Sheet is non-modal (`modal=false`) by default specifically so toasts and other high-priority overlays remain reachable while it's open. Only flip that default when the sheet is meant to own the whole screen.
- Choose `side` based on where the trigger lives: a row-level inspector should slide from the `right`; a global filter panel should slide from the `left`. Don't switch sides for the same sheet mid-session — keep it consistent.
- Clicking outside the sheet does not auto-dismiss it, so every sheet must render an explicit, visible close control and must also respond to Escape.

**Content**

- Titles are Title Case and name the entity being shown (e.g. "Deployment Details", "Member Profile") — not the action that opened the sheet.
- Body copy is read-first: sentence-case prose, with Title Case for any sub-headings. Action buttons in the footer are optional; when present they follow a Verb + Noun label pattern (e.g. "Next").
- Don't restate the page's own header inside the sheet — the sheet exists to be the detail layer, not a duplicate banner.

**Accessibility**

- Trap keyboard focus inside the sheet while open, and return focus to the triggering row/element on close so keyboard users don't lose their place in a list.
- Always render a visible close affordance — either a button labeled "Close" or an icon button with `aria-label="Close"` — since outside-click won't dismiss it.
- Announce the sheet via `aria-labelledby` pointing at the title element; only add `aria-describedby` when the body content is short enough to be genuinely load-bearing as a description.

## Design notes

- **Styling classes observed on the customized `SheetContent`** (from the Default example, layered over the primitive default): `m-3 h-[calc(100%-1.5rem)] w-[calc(100%-1.5rem)] rounded-2xl bg-background-100 p-0 lg:w-[512px] sm:max-w-[auto] flex flex-col` — i.e. a card-like inset panel (12px/`m-3` margin on all sides, `calc(100%-1.5rem)` height/width so it floats off the viewport edges rather than flush), `rounded-2xl` corner radius, `bg-background-100` token for the panel fill, zero built-in padding (`p-0`, padding is pushed down into header/footer instead), and a responsive fixed width of `512px` at the `lg` breakpoint.
- **Header/footer spacing tokens**: `SheetHeader` gets `p-6 text-left`; `SheetDescription` gets `px-6 py-4 text-copy-14`; `SheetFooter` gets `p-6 gap-2 flex-row justify-end mt-auto` (footer pinned to the bottom of the flex column via `mt-auto`, buttons right-aligned with an 8px/`gap-2` gap).
- **Typography tokens**: `text-copy-14` for body/description text and the small paragraph under the title; `text-gray-900` for that secondary paragraph's color (a muted-but-legible foreground).
- **Color/background tokens seen**: `bg-background-100` (panel surface), `text-gray-900` (secondary text). No sheet-specific state colors (error/warning/etc.) are demoed on this page — Sheet has no built-in status/severity styling of its own.
- **Radius**: `rounded-2xl` on the customized panel (the unstyled default `SheetContent` in the "With Side" demo shows no radius override, implying the primitive ships with its own base radius/border rather than none).
- **Sides**: four physical edges supported — `top`, `right`, `bottom`, `left` — each presumably driving both the origin edge and the slide-in transform direction (motion itself is not described in prose on this page, only the props).
- **Overlay control**: `noOverlay={false}` is passed explicitly in the styled example, implying `noOverlay` is a real prop (likely defaulting to `false`, i.e. overlay shown by default) that can be flipped to `true` to remove the scrim entirely, e.g. for the non-modal, page-stays-interactive default behavior described in Best Practices.
- **Modality default**: confirmed in prose — `modal=false` is the component default, distinguishing Sheet from Modal/Dialog at the behavioral level, not just visually.
