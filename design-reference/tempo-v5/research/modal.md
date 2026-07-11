# Modal

> "Display popup content that requires attention or provides additional information."

Source: https://vercel.com/geist/modal — fetched and parsed from the server-rendered HTML + Next.js flight payload (script `self.__next_f.push`), which contains the full JSX behind every "Show code" toggle.

## Sections documented

- **Default** — baseline Modal: header (title + subtitle), a paragraph of body copy, and a two-action footer (Cancel / Submit).
- **Sticky** — `sticky` prop on `Modal`; body content is long (many paragraphs) and scrolls internally while header and actions stay pinned/visible.
- **Single button** — `ModalActions` with one `ModalAction`, `fullWidth`, and no secondary/Cancel button — an acknowledgment-style footer.
- **Disabled actions** — the primary `ModalAction` rendered with `disabled`, showing the disabled visual state on the primary button inside a Modal footer.
- **Inset** — `ModalInset` wraps a sub-block of body content that gets distinct (inset/recessed) styling, contrasted with normal content that sits outside the inset in the same body.
- **Control initial focus** — `initialFocusRef` prop on `Modal`, pointed at a ref on a specific action button (not the default first-focusable element), so focus programmatically lands on Submit when the Modal opens.
- **Focus an input on open** — same `initialFocusRef` pattern but pointed at an `Input` field instead of a button, so a text field is focus-ready and typing can start immediately, verified on both desktop and the mobile bottom-sheet form.
- **Mobile sheet with inputs** — on mobile viewports the Modal collapses into a bottom sheet; demonstrates multiple `Input` fields (Name, Email) inside the body and confirms both receive focus/keyboard input in that mode.
- **Toasts and focus trap** — demonstrates that the Modal's focus trap (Tab stays inside it) coexists with toasts: a toast fired from inside the Modal renders above it and stays interactive (its action, e.g. "Undo", is clickable) while the Modal itself remains open and focus returns to the Modal afterward.
- **Best Practices** (accordion) — four subsections: **When to use**, **Behavior**, **Content**, **Accessibility**.

Related/adjacent pages linked from the same sidebar group: **Destructive Action Modal** (a specialized variant, documented separately), **Drawer**, **Sheet** (referenced in the "when to use" guidance as the non-blocking alternatives).

## API

Package: `@vercel/geistcn/components`

### Components / subcomponents seen in code

- `Modal` — the root/overlay container.
  - `active: boolean` — controls open/closed state (controlled component).
  - `onClickOutside: () => void` — dismiss callback for outside-click (and, per Best Practices, Escape) on non-destructive modals.
  - `sticky?: boolean` — pins header/actions and makes body internally scrollable for long content.
  - `initialFocusRef?: React.Ref<HTMLElement>` — ref to the element that should receive focus when the Modal opens (overrides default focus target).
- `ModalBody` — wraps the scrollable/body content area (header + freeform content).
- `ModalHeader` — wraps `ModalTitle` (+ optional `ModalSubtitle`).
- `ModalTitle` — the heading text node.
- `ModalSubtitle` — optional supporting/explanatory text under the title.
- `ModalInset` — wraps a sub-region of body content with distinct (inset) container styling; content placed as a sibling outside `ModalInset` (e.g. in a `<div className="pt-6">`) renders without that styling.
- `ModalActions` — footer container for action buttons; can hold either a single `ModalAction` (optionally `fullWidth`) or two, split with a Cancel/secondary group and a primary group (a nested `<div>` groups Cancel + a "Previous" secondary button on one side, primary Submit on the other, in the Sticky example).
- `ModalAction` — a footer button.
  - `variant="secondary"` — used for Cancel / Previous.
  - default variant (no `variant` prop) — primary action (e.g. Submit, Send Invite, Done).
  - `disabled` — disables the action.
  - `fullWidth` — stretches a single action to fill the footer width.
  - `prefix={<IconArrowLeft />}` — icon-prefixed secondary action ("Previous").
  - `ref` — can be the `initialFocusRef` target.
  - `onClick`.

Composed with, but not part of Modal itself: `Button` (the trigger that sets `active`/open state), `Input` (form fields inside the body), `useToasts()` (toast hook, demonstrated to confirm it layers above the Modal and stays interactive while the Modal holds focus).

### Minimal usage (Default)

```tsx
import {
  Button,
  Modal,
  ModalBody,
  ModalHeader,
  ModalTitle,
  ModalSubtitle,
  ModalActions,
  ModalAction,
} from "@vercel/geistcn/components";
import { useState, type JSX } from "react";

export function Component(): JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} size="small">
        Open Modal
      </Button>

      <Modal active={open} onClickOutside={() => setOpen(false)}>
        <ModalBody>
          <ModalHeader>
            <ModalTitle>Create Token</ModalTitle>
            <ModalSubtitle>
              Enter a unique name for your token to differentiate it from other tokens and then
              select the scope.
            </ModalSubtitle>
          </ModalHeader>

          <p className="text-copy-14">Some content contained within the modal.</p>
        </ModalBody>

        <ModalActions>
          <ModalAction onClick={() => setOpen(false)} variant="secondary">
            Cancel
          </ModalAction>

          <ModalAction onClick={() => setOpen(false)}>Submit</ModalAction>
        </ModalActions>
      </Modal>
    </>
  );
}
```

### Sticky, long-body, split footer groups

```tsx
<Modal active={open} onClickOutside={() => setOpen(false)} sticky>
  <ModalBody>
    <ModalHeader>
      <ModalTitle>Create Token</ModalTitle>
    </ModalHeader>
    {/* many <p className="text-copy-14"> paragraphs — body scrolls, header/actions stay put */}
  </ModalBody>

  <ModalActions>
    <div>
      <ModalAction onClick={() => setOpen(false)} variant="secondary">
        Cancel
      </ModalAction>
      <ModalAction onClick={() => setOpen(false)} prefix={<IconArrowLeft />} variant="secondary">
        Previous
      </ModalAction>
    </div>

    <ModalAction onClick={() => setOpen(false)}>Submit</ModalAction>
  </ModalActions>
</Modal>
```

### Single full-width action

```tsx
<ModalActions>
  <ModalAction fullWidth onClick={() => setOpen(false)}>
    Cancel
  </ModalAction>
</ModalActions>
```

### Disabled primary action

```tsx
<ModalAction disabled onClick={() => setOpen(false)}>
  Submit
</ModalAction>
```

### Inset content block

```tsx
<ModalBody>
  <ModalHeader>
    <ModalTitle>Modal</ModalTitle>
    <ModalSubtitle>This is a modal.</ModalSubtitle>
  </ModalHeader>

  <ModalInset>
    <p className="text-copy-14">Content within the inset.</p>
  </ModalInset>

  <div className="pt-6">
    <p className="text-copy-14">Content outside the inset.</p>
  </div>
</ModalBody>
```

### Initial focus onto a button

```tsx
const initialFocusRef = useRef<HTMLButtonElement>(null);

<Modal active={open} initialFocusRef={initialFocusRef} onClickOutside={() => setOpen(false)}>
  <ModalBody>
    <ModalHeader>
      <ModalTitle>Initial Focus</ModalTitle>
      <ModalSubtitle>
        This Modal is set up to programmatically move the focus onto the Submit button, making it
        possible to promptly continue with the Enter key.
      </ModalSubtitle>
    </ModalHeader>
  </ModalBody>

  <ModalActions>
    <ModalAction onClick={() => setOpen(false)} variant="secondary">
      Cancel
    </ModalAction>
    <ModalAction onClick={() => setOpen(false)} ref={initialFocusRef}>
      Submit
    </ModalAction>
  </ModalActions>
</Modal>;
```

### Initial focus onto an input field

```tsx
const initialFocusRef = useRef<HTMLInputElement>(null);

<Modal active={open} initialFocusRef={initialFocusRef} onClickOutside={() => setOpen(false)}>
  <ModalBody>
    <ModalHeader>
      <ModalTitle>Invite Member</ModalTitle>
      <ModalSubtitle>
        On both desktop and the mobile bottom sheet, the Name field receives focus when the Modal
        opens so the user can start typing immediately.
      </ModalSubtitle>
    </ModalHeader>

    <div className="flex flex-col gap-3">
      <Input
        aria-labelledby="modal-initial-focus-input-name"
        label="Name"
        onChange={(e) => setName(e.target.value)}
        placeholder="Jane Doe"
        ref={initialFocusRef}
        value={name}
      />
    </div>
  </ModalBody>

  <ModalActions>
    <ModalAction onClick={() => setOpen(false)} variant="secondary">
      Cancel
    </ModalAction>
    <ModalAction onClick={() => setOpen(false)}>Send Invite</ModalAction>
  </ModalActions>
</Modal>;
```

### Multiple inputs / mobile bottom sheet

```tsx
<ModalBody>
  <ModalHeader>
    <ModalTitle>Invite Member</ModalTitle>
    <ModalSubtitle>
      On a mobile viewport this opens as a bottom sheet. Verify that both inputs receive focus and
      accept keyboard input.
    </ModalSubtitle>
  </ModalHeader>

  <div className="flex flex-col gap-3">
    <Input
      aria-labelledby="modal-mobile-inputs-name"
      label="Name"
      onChange={(e) => setName(e.target.value)}
      placeholder="Jane Doe"
      value={name}
    />
    <Input
      aria-labelledby="modal-mobile-inputs-email"
      label="Email"
      onChange={(e) => setEmail(e.target.value)}
      placeholder="jane@example.com"
      value={email}
    />
  </div>
</ModalBody>
```

### Toasts inside a Modal (focus trap coexistence)

```tsx
import { ..., useToasts } from '@vercel/geistcn/components';

const toasts = useToasts();

<Modal active={open} onClickOutside={() => setOpen(false)}>
  <ModalBody>
    <ModalHeader>
      <ModalTitle>Toasts and Focus Trap</ModalTitle>
      <ModalSubtitle>
        The Modal traps focus, so Tab stays within it. Toasts still render
        above the Modal and remain interactive — trigger one, then click
        its action. The Modal stays open and focus returns to it.
      </ModalSubtitle>
    </ModalHeader>

    <div className="flex flex-col gap-3">
      <Button
        onClick={() =>
          toasts.message({
            text: 'Project link copied',
            action: 'Undo',
            onAction: () => toasts.message({ text: 'Copy reverted' }),
          })
        }
        size="small"
        variant="secondary"
      >
        Show Toast
      </Button>
    </div>
  </ModalBody>

  <ModalActions>
    <ModalAction onClick={() => setOpen(false)}>Done</ModalAction>
  </ModalActions>
</Modal>
```

## Best practices (paraphrased)

**When to use**

- Reach for Modal only when the decision truly has to block the rest of the page.
- If context needs to persist alongside a still-readable page, use Sheet (desktop) or Drawer (mobile) instead of Modal.
- Always confirm destructive actions in a Modal — Drawer and Sheet don't dim the page enough and read as too soft for delete/revoke actions.
- Don't use a Modal for routine "create" flows that already have their own dedicated page; navigate to the page instead of popping a Modal.

**Behavior**

- On any destructive Modal, default focus to the Cancel button, not the destructive action — Enter should never fire a destructive action without an explicit typed confirmation.
- Non-destructive Modals should be dismissible via Escape or outside click; destructive Modals with unsaved/typed input should gate or block that dismissal.
- The Modal must trap focus while open and hand focus back to the trigger element on close; body scroll should restore in the same tick the Modal unmounts (no scroll-lock leakage).
- For genuinely high-stakes destructive actions (deleting a production resource, rotating a signing key, downgrading a plan), require the user to type the resource name as a match before the primary button becomes actionable.

**Content**

- The title (`ModalTitle`) is a Title Case statement, never phrased as a question — "Transfer Project," not "Transfer Project?"
- Body copy is sentence case and short (1-3 sentences); lead with the consequence, then mention any cascading effects.
- The primary button label is Verb + Noun and should echo the title's verb — a "Transfer Project" title pairs with a "Transfer Project" button, never a generic "Confirm"/"OK"/bare verb on a destructive primary.
- Cancel stays literally "Cancel." Acknowledgment-only Modals (e.g. after revealing a one-time key) use "Done," not "OK" or "Close."
- For irreversible actions say "This cannot be undone"; for partial/cascade-only consequences say "Some effects cannot be undone" — don't overstate irreversibility.
- Match the success toast's verb to the primary button 1:1 (e.g. "Delete Project" button -> "Project deleted" toast).

**Accessibility**

- Wire `aria-labelledby` to the `ModalTitle`'s id so screen readers announce the title as soon as the Modal opens.
- Keep the Cancel label literally "Cancel" everywhere so screen-reader users get one stable, predictable dismissal term across all destructive flows.
- After an in-Modal error, keep focus inside the Modal so the user can retry immediately; after success, return focus to the original trigger element.

## Design notes

- Body text uses `text-copy-14` (paragraph copy inside `ModalBody`); no other component-specific token/class names (e.g. `--ds-*`, `material-*`) were exposed in the rendered code examples — Modal's visual styling (radius, overlay color/opacity, width, shadow, animation timing) lives inside the compiled component CSS, not in the documented usage code, so it isn't independently verifiable from this page alone.
- Layout utility classes seen in examples: `flex flex-col gap-3` (stacking form fields in the body), `pt-6` (spacing content that sits outside a `ModalInset`).
- `sticky` is a boolean prop (not a numeric/enum) that switches the Modal into a fixed header/footer + internally-scrolling body layout — used in the docs specifically to demonstrate an overflowing body (many repeated placeholder paragraphs).
- Responsive behavior: the same `Modal` component collapses to a bottom sheet on mobile viewports (explicitly called out in two example subtitles: "mobile bottom sheet" and "opens as a bottom sheet on mobile viewport") — there is no separate mobile-only component; it's a responsive behavior of `Modal` itself. (Note: a dedicated `Drawer` component also exists and is recommended by Best Practices for non-blocking, persistent mobile context — distinct from Modal's own bottom-sheet responsive mode.)
- Footer (`ModalActions`) supports 1, 2, or a grouped-3 button layout: single (`fullWidth` optional), a Cancel/secondary + primary pair, or a group of two secondary actions (Cancel + icon-prefixed "Previous") wrapped in a plain `<div>` set against a single primary action.
- `initialFocusRef` is a generic ref prop accepting either a button ref or an input ref — Modal's default focus target (likely the first focusable element or the Modal container) is overridable per-instance.
- Toasts are confirmed to render with a higher stacking/interactive priority than the Modal's focus trap — i.e. the Modal's trap does not block toast interaction, and toast actions (e.g. "Undo") remain clickable while the Modal is open.
- No explicit pixel dimensions, corner radius values, or color tokens for the overlay/scrim or Modal surface were present in the page's visible prose or code — only the compiled/obfuscated inline `style` color hex values used for the syntax-highlighted code display itself (e.g. `#F97583`, `#9ECBFF`, `#24292E`, `#E1E4E8`), which are Prism/Shiki highlighting colors, not Modal design tokens, and should not be used as component styling.
