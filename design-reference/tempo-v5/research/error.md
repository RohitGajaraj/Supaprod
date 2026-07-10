# Error

> "Good error design is clear, useful, and friendly. Designing concise and accurate error messages unblocks users and builds trust by meeting people where they are."

Source: https://vercel.com/geist/error — package `@vercel/geistcn/components`, export `Error`.

## Sections documented

- **Default** — a bare `<Error>` with only children (the message text); renders the component's built-in default label.
- **Custom label** — the same block with an explicit `label` prop overriding the default heading text (e.g. `label="Email Error"`).
- **No label** — `label={false}` suppresses the label/heading entirely, leaving only the message body.
- **Sizes** — three instances side by side (`size="small"`, default/unset = medium, `size="large"`) laid out in a responsive flex row (`flex-col md:flex-row`), each showing the same message so the size scale is comparable.
- **With an error property** — an alternate composition where a structured `error` object (`message`, `action`, `link`) is passed instead of children, producing a message plus a labeled recovery action/link.
- **Best Practices** — an accordion with four subsections: When to use, Behavior, Content, Accessibility (full guidance below).

## API

Import:
```tsx
import { Error } from '@vercel/geistcn/components';
// aliasable on import, e.g.:
import { Error as GeistError } from '@vercel/geistcn/components';
```

### Props (as observed across examples)

- `children` — `ReactNode`. The error message body, used when not passing a structured `error` object.
  ```tsx
  <Error>This email address is already in use.</Error>
  ```
- `label` — `string | false`. Overrides the default label/heading text; pass `false` to render with no label at all.
  ```tsx
  <Error label="Email Error">This email address is already in use.</Error>
  <Error label={false}>This email address is already in use.</Error>
  ```
- `size` — enum `"small" | "medium" (default) | "large"`. Controls the visual scale of the block.
  ```tsx
  <Error size="small">This email is in use.</Error>
  <Error>This email is in use.</Error>
  <Error size="large">This email is in use.</Error>
  ```
- `error` — structured object, alternative to `children`, shaped as:
  ```ts
  {
    message: string;   // e.g. 'The request failed.'
    action: string;    // label for the recovery action/link, e.g. 'Contact Us'
    link: string;      // URL the action points to
  }
  ```
  ```tsx
  <Error
    error={{
      message: 'The request failed.',
      action: 'Contact Us',
      link: 'https://vercel.com/contact',
    }}
  />
  ```

### Composition patterns

- Default usage: message as `children`, no other props — component supplies its own default label.
- Custom-label usage: `label` string overrides the heading.
- Silent/no-label usage: `label={false}`.
- Size variants: `size` prop, three-way scale, commonly demoed in a responsive row (`flex flex-col md:flex-row items-stretch justify-start gap-6`).
- Structured usage: `error={{ message, action, link }}` in place of children — used when you have a message plus a single named recovery action that is a link (as opposed to a button handler).

## Best practices (paraphrased)

**When to use**
- Use `Error` as a block-level surface for a failed section or page-level resource: a panel, a dashboard card, a route boundary — not for one-off transient failures.
- Don't use it for transient action failures (use a toast, e.g. `toasts.error()`, for things like a failed save) and don't use it for field-level validation (use the `error` prop on `Input` instead). Error is a block replacement for those, not a stand-in.
- For platform/system failures, always surface a stable identifier (request ID, deployment ID, run ID, trace ID) so the user can reference it in support. Validation/permission errors are user-state, not system state, and don't need an ID.

**Behavior**
- Always give the user something concrete to do: a retry action (e.g. "Try Again") when the operation is safely retryable, or a specific named action (e.g. "Reconnect GitHub", "Update Payment Method") when it isn't just a retry.
- Never silently auto-retry in the background — the user landed on this surface to make a decision, so let them make it.
- For full-page route-level errors (e.g. a framework's `error.tsx` boundary), move focus to the primary recovery action as soon as it renders, so keyboard users don't have to hunt for it.

**Content**
- Lead with what happened, then what to do about it — that order, no exceptions. Skip apologetic filler ("Unfortunately", "Oops", "We're sorry").
- Match the verb to the error's source: "Couldn't" / "Can't" for user-state failures, "Failed to" for system/infra failures that mirror CLI-style output. Never use "Unable to" — it's explicitly disallowed.
- Avoid a generic "Something Went Wrong" title; name the specific resource that failed instead (e.g. "Couldn't Load Page", "Couldn't Load Deployments").
- Put any stable identifier on its own monospace line, tucked inside a collapsed disclosure (`<details>`), so it's out of the way but easy to copy for support.
- Keep the tone straight, never jokey — someone hitting an error is already frustrated, and levity reads as dismissive.

**Accessibility**
- When the error shows up asynchronously (e.g. after a failed fetch), wrap it in a polite live region (`aria-live="polite"`) so assistive tech announces it without interrupting whatever the user is doing.
- Reserve an assertive live region (`aria-live="assertive"`) only for genuinely blocking errors that must interrupt current input.

## Design notes

- Package path: `@vercel/geistcn/components`; component name `Error` (commonly aliased to avoid clashing with the JS built-in `Error`, as shown in the Sizes example: `Error as GeistError`).
- `size` is a three-step enum: `small` / `medium` (implicit default) / `large` — no explicit pixel values are exposed in the code samples; the demo simply stacks all three for visual comparison in a flex row with `gap-6`.
- Two mutually-exclusive content APIs: freeform `children` (string/JSX message, optionally with `label`) vs. structured `error={{ message, action, link }}` for a message + single link-style call to action.
- `label` is tri-state in effect: unset (component default label), a custom `string`, or `false` (no label rendered at all) — implies internal conditional rendering `label === false ? null : (label ?? defaultLabel)`.
- Accessibility guidance implies the component (or its usage) should be wrapped by the consumer in an `aria-live` region — this is guidance for integrators, not necessarily baked into the component itself, since no `aria-live` prop appears in any code sample.
- Copy conventions to bake into any accompanying content/humanization layer: banned word "Unable to"; verb choice keyed to error origin ("Couldn't"/"Can't" vs "Failed to"); no apology preambles; specific resource naming instead of generic titles; stable IDs rendered monospace inside a collapsed `<details>`.
- No explicit color tokens, radii, or motion values are present in the extracted code (the JSX examples show only usage, not the internal implementation styling) — the internal visual implementation (fill colors, border radius, icon, spacing) is not exposed on this documentation page and would need to be inferred from the rendered demo or the package source itself.
