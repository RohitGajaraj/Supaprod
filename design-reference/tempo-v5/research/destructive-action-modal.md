# Destructive Action Modal

> "Confirm destructive actions with a required type-to-confirm gate and an optional irreversibility band."

Source: https://vercel.com/geist/destructive-action-modal (fetched via curl, server-rendered HTML + Next.js flight payload — no browser used).

## Sections documented

- **Default** — the baseline demo: a `Button` (variant `error`) opens the modal; type-to-confirm gate disables submit until the exact verification phrase is typed; red striped band at the bottom names what cannot be undone (`irreversibleDescription` present).
- **Reversible** — same gate, but `irreversibleDescription` is omitted for actions that can be re-enabled/undone/rolled back (e.g. disabling an auth toggle). The typed-confirmation friction stays; only the red irreversibility band is skipped.
- **Loading** — `loading` prop disables both Cancel and Confirm buttons and shows a spinner on the primary action, for use while the destructive API call is in flight. The modal's `open` state stays caller-controlled; the component must not self-dismiss.
- **With error** — `error` prop (string or `Error`) surfaces an inline error under the verification input; the modal stays open so the user can retry rather than losing the typed state.
- **Best Practices** (accordion, 4 subsections) — When to use, Behavior, Content, Accessibility. See below.

## API

Import:
```tsx
import { Button, DestructiveActionModal } from '@vercel/geistcn/components';
```

### `DestructiveActionModal` props (observed across all 4 examples)

| Prop | Type (inferred) | Notes |
|---|---|---|
| `open` | `boolean` | Caller-controlled; component never self-dismisses, even in `loading`/`error` states. |
| `onConfirm` | `() => void` | Fires only once the typed verification phrase matches. |
| `onCancel` | `() => void` | Fires on Cancel click, outside-click, or Escape. |
| `title` | `string` | Title Case, `Verb + Noun`, a statement, not a question — e.g. `"Delete Project"`. |
| `description` | `string \| JSX.Element` | Sentence case; names the consequence; can interpolate the resource name with inline markup (e.g. `<span className="font-medium">next-year-boilerplate</span>`). |
| `irreversibleDescription` | `string` (optional) | Renders the red striped "cannot be undone" band. Omit entirely (not falsy) for reversible actions. Ends with literal "cannot be undone." |
| `confirmLabel` | `string` | Must match `title` 1:1 — never generic (`Confirm`, `OK`, `Continue`), never a bare verb (`Delete`). |
| `verificationPhrase` | `string` | The exact string the user must type to unlock submit. For entity deletes: the resource name itself (e.g. `"next-year-boilerplate"`, `"my-project"`). For non-entity actions: a lowercase verb phrase (e.g. `"disable vercel authentication"`). |
| `verificationLabel` | `string` (optional) | Paired with an entity-name `verificationPhrase` to produce the prompt `To confirm, type the project name "my-project"` — e.g. `"project name"`. Omitted in the verb-phrase (non-entity) example. |
| `loading` | `boolean` (optional) | Disables both buttons, shows a spinner on the confirm button. |
| `error` | `string \| Error` (optional) | Renders inline under the verification input; modal stays open on error. |

### Composition pattern (all 4 examples share this shape)

```tsx
import { Button, DestructiveActionModal } from '@vercel/geistcn/components';
import { useState, type JSX } from 'react';

export function Component(): JSX.Element {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConfirm = (): void => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setOpen(false);
    }, 1500);
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} size="small" variant="error">
        Delete Project
      </Button>
      <DestructiveActionModal
        confirmLabel="Delete Project"
        description={
          <>
            <span className="font-medium">next-year-boilerplate</span> and all
            its deployments, domains, and environment variables will be
            permanently deleted.
          </>
        }
        irreversibleDescription="Deleting next-year-boilerplate cannot be undone."
        loading={loading}
        onCancel={() => setOpen(false)}
        onConfirm={handleConfirm}
        open={open}
        title="Delete Project"
        verificationLabel="project name"
        verificationPhrase="next-year-boilerplate"
      />
    </>
  );
}
```

Reversible variant (drop `irreversibleDescription`, drop `verificationLabel` when there's no entity name):

```tsx
<Button onClick={() => setOpen(true)} size="small" variant="error">
  Disable Vercel Authentication
</Button>
<DestructiveActionModal
  confirmLabel="Disable Vercel Authentication"
  description="Anyone will be able to view your deployments without being a member of your team."
  onCancel={() => setOpen(false)}
  onConfirm={() => setOpen(false)}
  open={open}
  title="Disable Vercel Authentication"
  verificationPhrase="disable vercel authentication"
/>
```

Loading variant (`loading` set true, `onConfirm` becomes a no-op while loading):

```tsx
<DestructiveActionModal
  confirmLabel="Delete Project"
  description="my-project and all its deployments will be permanently deleted."
  irreversibleDescription="Deleting my-project cannot be undone."
  loading
  onCancel={() => setOpen(false)}
  onConfirm={() => {
    /* no-op while loading */
  }}
  open={open}
  title="Delete Project"
  verificationLabel="project name"
  verificationPhrase="my-project"
/>
```

Error variant (`error` string passed in, modal stays open):

```tsx
<DestructiveActionModal
  confirmLabel="Delete Project"
  description="my-project and all its deployments will be permanently deleted."
  error="Couldn't delete project. Try again."
  irreversibleDescription="Deleting my-project cannot be undone."
  onCancel={() => setOpen(false)}
  onConfirm={() => setOpen(false)}
  open={open}
  title="Delete Project"
  verificationLabel="project name"
  verificationPhrase="my-project"
/>
```

The trigger `Button` in every example uses `size="small"` and `variant="error"` — this is the standard pairing for a destructive-modal trigger.

## Best practices

**When to use**
- Pick this over a plain `Modal` when the action is destructive enough to warrant friction: delete, rotate, revoke, disconnect, downgrade, or disabling a security setting. The typed gate is what forces deliberate intent.
- It's also appropriate for reversible-but-serious actions (disabling deployment protection, revoking a shared token) — keep the typed gate, just drop `irreversibleDescription`.
- Don't reach for it on routine, low-stakes confirmations (save draft, discard changes, close without saving) — the typed gate reads as overkill there; use a plain `Modal` instead.

**Behavior**
- Autofocus the verification input on open so typing can start immediately.
- Submit stays disabled until the input value exactly matches `verificationPhrase`.
- Enter submits only once the gate is unlocked; it's inert before that. Cancel, outside-click, and Escape all dismiss unconditionally.
- `loading` disables both buttons; the component must never self-dismiss — the caller owns `open` and closes it after the request settles (on success, or keep it open on error so the user can retry).
- The success toast that follows a confirmed action should echo the button label 1:1 (a "Delete Project" button implies a "Project deleted" toast, never a paraphrase like "Project removed").

**Content**
- `title`: Title Case, `Verb + Noun`, phrased as a statement, never a question ("Delete Project", not "Delete this project?").
- `description`: sentence case, names the concrete consequence, and interpolates the specific resource name when there is one — bolding the resource name reads stronger than a generic sentence.
- `confirmLabel` must mirror the title exactly — never a generic label like "Confirm"/"OK"/"Continue", never a bare verb like "Delete".
- `verificationPhrase`: for entity deletion, use the resource's own name and pair it with `verificationLabel` (e.g. `"project name"`) so the rendered prompt reads naturally ("type the project name \"my-project\""). This is what proves the user knows exactly what they're acting on. Only fall back to a lowercase verb phrase when there's no single named entity.
- `irreversibleDescription` should name the specific action and resource and end with the literal "cannot be undone." rather than a generic sentence — and it should be omitted entirely (not passed as an empty/false value) for actions that are reversible; its mere presence is the signal.
- `error` messages should read like a real (Vercel-voice) sentence describing the failure, never a raw error object dump.

**Accessibility**
- The verification input's prompt text is wired to it via `aria-labelledby`/`htmlFor` so screen readers announce the full instruction on focus.
- The warning icon in the irreversibility band is `aria-hidden` since the accompanying sentence already carries the meaning — avoids double announcement.
- Focus is retained inside the modal across an error transition so a retry doesn't lose context; after a successful confirm, focus returns to the original trigger element.

## Design notes

- Trigger convention: `Button` with `variant="error"` and `size="small"` opens the modal in every example — treat `error` as the destructive button variant in this system.
- The irreversibility band is described as "the red striped band at the bottom" — a visually distinct (diagonal-striped, red-toned) footer region inside the modal, shown only when `irreversibleDescription` is supplied.
- Loading state: spinner rendered on the primary/confirm button itself (not a separate overlay); both Cancel and Confirm become disabled together.
- Error state: inline error text appears under the verification input, not as a toast or banner — this keeps the modal open and the typed value intact for retry.
- Warning icon appears specifically inside the irreversibility band and is marked `aria-hidden="true"`.
- No CSS custom-property / utility-class tokens (`--ds-*`, `material-*`, `text-label-14`, etc.) were exposed on this page — the code samples shown are minimal JSX *usage* snippets (consumer-facing API only), not the component's internal implementation/markup, so no internal class names or design tokens were observable from this page. Anatomy/visual sizing (px values, radii) is likewise not disclosed here; only the described visual behavior (striped red band, spinner-on-button, inline error text, autofocus) is available as a design cue.
- Composition is always `Button` (trigger, kept mounted alongside the modal) + `DestructiveActionModal` (controlled entirely by parent `open` state) — no compound/subcomponent parts (no `DestructiveActionModal.Trigger` or `.Content`) are shown; it's a single flat component with the props listed above.
