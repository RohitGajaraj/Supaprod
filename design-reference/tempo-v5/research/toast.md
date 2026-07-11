# Toast

> "A succinct message that is displayed temporarily."

Source: https://vercel.com/geist/toast (Geist Design System, Vercel). Fetched 2026-07-10/11, HTTP 200, ~291KB raw HTML (server-rendered Next.js flight payload).

## Sections documented

- **Default** — baseline toast: a button that calls `toasts.message()` with a single-sentence `text` string. Auto-dismisses.
- **Multi-line** — same API, but `text` is a long string that wraps across multiple lines inside the toast body (tests text-wrap behavior/max-width).
- **With jsx** — `text` accepts a JSX node (`<>...</>` fragment), not just a string; shown with an inline `<span className="text-heading-14">` for emphasis of one word/phrase within the message. Uses `preserve: true` so it doesn't auto-dismiss while demoing rich content.
- **With a link** — `text` JSX can embed an interactive `Link` component (`@vercel/geistcn/components`) inside the message, with `data-zone="same"` and `isDifferentZone={false}` props (site-internal-link routing metadata). Also uses `preserve: true`.
- **Preserve** — demonstrates the `preserve: true` option alone: the toast stays on screen instead of auto-dismissing after the default timeout.
- **Action** — demonstrates the `action` option: a string label (`'Undo'`) renders an action button inside the toast.
- **Undo** — demonstrates `onUndoAction`, a callback fired when the user clicks the action button (paired with `action`/the undo pattern specifically, distinct from a generic `action` string).
- **Success** — the `toasts.success(text)` convenience method — a themed/colored variant of the toast for success state.
- **Warning** — the `toasts.warning(text)` convenience method — themed for warning state.
- **Error** — the `toasts.error(text)` convenience method — themed for error state.
- **Best Practices** (accordion) — three subsections: When to use, Behavior, Content, Accessibility (see below).

Every demo section has a "Show code" toggle revealing the exact JSX used to produce it (all captured verbatim below).

## API

**Hook-based API** — no `<Toast>` JSX component is rendered directly by consumers; instead a hook returns an imperative toasts controller.

```tsx
import { Button, useToasts } from "@vercel/geistcn/components";
import type { JSX } from "react";

export function Component(): JSX.Element {
  const toasts = useToasts();

  return (
    <Button
      onClick={(): void => {
        toasts.message({ text: "..." });
      }}
    >
      Show Toast
    </Button>
  );
}
```

### `useToasts()` return shape (methods observed)

- `toasts.message(options)` — generic/neutral toast. `options`:
  - `text: string | JSX.Element` — required. Accepts plain string or JSX (fragments, embedded `Link`, embedded styled `span`).
  - `preserve?: boolean` — if `true`, disables auto-dismiss; toast stays until manually cleared.
  - `action?: string` — label for an action button rendered in the toast (e.g. `'Undo'`).
  - `onUndoAction?: () => void` — callback invoked when the action button (undo pattern) is clicked.
- `toasts.success(text: string)` — shorthand for a success-styled toast, single string arg (no options object shown).
- `toasts.warning(text: string)` — shorthand for a warning-styled toast.
- `toasts.error(text: string)` — shorthand for an error-styled toast.

### Full captured JSX examples (verbatim, one per demo)

1. Default:

```tsx
import { Button, useToasts } from "@vercel/geistcn/components";
import type { JSX } from "react";

export function Component(): JSX.Element {
  const toasts = useToasts();
  return (
    <Button
      onClick={(): void => {
        toasts.message({ text: "The Evil Rabbit jumped over the fence." });
      }}
    >
      Show Toast
    </Button>
  );
}
```

2. Multi-line (same shape, long repeated sentence as `text` to force wrap).

3. With jsx:

```tsx
toasts.message({
  text: (
    <>
      <span className="text-heading-14">The Evil Rabbit</span> jumped over the fence.
    </>
  ),
  preserve: true,
});
```

4. With a link:

```tsx
import { Button, useToasts } from "@vercel/geistcn/components";
import { Link } from "@vercel/geistcn/components";
import type { JSX } from "react";

toasts.message({
  text: (
    <>
      The Evil Rabbit jumped over the fence. The Evil Rabbit jumped over the{" "}
      <Link data-zone="same" href="/geist" isDifferentZone={false}>
        fence again
      </Link>
      .
    </>
  ),
  preserve: true,
});
```

5. Preserve:

```tsx
toasts.message({
  text: "The Evil Rabbit jumped over the fence.",
  preserve: true,
});
```

6. Action:

```tsx
toasts.message({
  text: "The Evil Rabbit jumped over the fence. The Evil Rabbit jumped over the fence again.",
  action: "Undo",
});
```

7. Undo:

```tsx
toasts.message({
  text: "The Evil Rabbit jumped over the fence. The Evil Rabbit jumped over the fence again.",
  onUndoAction: () => 0,
});
```

8. Success:

```tsx
toasts.success("The Evil Rabbit jumped over the fence.");
```

9. Warning:

```tsx
toasts.warning("The Evil Rabbit jumped over the fence.");
```

10. Error:

```tsx
toasts.error("The Evil Rabbit jumped over the fence.");
```

### Composition pattern

- Toasts are always triggered imperatively from an event handler (`onClick`), never mounted as JSX in the render tree. This implies a `ToastProvider`/root portal is set up once (likely via `GeistProvider`, seen wrapping the whole doc site) and `useToasts()` just dispatches into it.
- `text` is the single content prop across all variants; richness (bold span, inline link) is achieved by passing JSX instead of a string, not by additional props.
- Shorthand methods (`success`/`warning`/`error`) take a bare string, not an options object — so `preserve`/`action`/`onUndoAction` are only available via the base `message()` call. To combine e.g. "success" styling with an action button, you'd presumably need a variant option not shown on this page (not documented — only `message`, `success`, `warning`, `error` were demoed).

## Best practices (paraphrased)

**When to use**

- Use a toast for a lightweight, non-blocking confirmation that something the user just triggered actually happened (their example nouns: domain added, project archived, deployment canceled).
- Don't rely on a toast alone for anything the user must act on to recover (billing failure, permission denial, a build failure needing triage). Keep the toast very short (their guidance: 6 words or fewer, e.g. "Build failed") and put the real recovery step in a persistent, addressable UI element (a row with a stable id), not in the transient toast.
- Field-level validation errors belong inline on the `Input` itself, not in a toast. Longer-lived configuration warnings belong in a `Note` or `Banner`, not a toast.
- Choose which method to call (`message` vs `success` vs `warning` vs `error`) based on how the event felt to the user, not the HTTP status code behind it. A user-initiated cancellation should read as a neutral `message()`, not a `success()`. A partial/degraded outcome (e.g., some routes skipped) should be a `warning()`, not silently treated as a full success.

**Behavior**

- Default toasts auto-dismiss on a timer; only opt into `preserve` when the message truly needs to be read or acted on before disappearing — don't make everything persistent by default.
- When pairing an undo action with a toast, keep it visible for roughly 5-10 seconds and give it exactly one action button labeled for the undo, not several actions.
- Don't chain multiple toasts to narrate the steps of one async operation — only fire the single terminal toast (the final success or error), not a play-by-play.

**Content**

- Keep it to one sentence, sentence case, and drop the trailing period on single-sentence toasts.
- Completion messages follow a "{Noun} {past participle}" shape (e.g. "Blob deleted", "Domain added", "Environment variable saved") and should never contain the word "successfully" — the past-tense verb already implies success.
- Error toasts get two full sentences with periods, and the second sentence is always the recovery step (e.g. "Couldn't verify domain. Try again.").
- Use "Couldn't **_" phrasing for errors caused by user/account state, and "Failed to _**" for system/infrastructure errors — pick one register and don't mix it mid-flow with whatever copy is already shipped nearby.
- Make the toast verb match the button verb that triggered it 1:1 (clicking "Delete Project" should produce "Project deleted", never a different verb like "Project removed").
- Undo actions must use the literal word "Undo" — never "Restore", "Bring Back", or "Cancel" — and this pattern should only be offered when the rollback is actually safe to perform.

**Accessibility**

- The toast region should announce politely (`aria-live="polite"`) by default; reserve the more interruptive `assertive` announcement level only for blocking errors that must interrupt whatever the user is doing.
- Never put primary navigation controls inside a toast — it's a transient, easily-missed surface, and keyboard users in particular may not reach it before it's gone.

## Design notes (concrete/observable)

- **Component import path**: `@vercel/geistcn/components` (note: `geistcn`, not `geist` — this is the shadcn-style/copy-paste flavor of the Geist system, consistent with other Vercel Geist doc pages).
- **Hook name**: `useToasts` (plural) — returns an object with methods, not a single dispatch function.
- **Trigger pattern in every example**: a `Button` (from the same package) with an `onClick` handler; button label in every demo is literally "Show Toast".
- **Inline emphasis token observed**: `text-heading-14` utility class used on a `<span>` to bold/emphasize a fragment of toast text (e.g. `<span className="text-heading-14">The Evil Rabbit</span>`) — this is the only Geist typography utility class directly visible in the captured code (their design token naming pattern is `text-{role}-{size}`, consistent with `text-copy-16`/`text-copy-20`/`text-heading-24`/`text-heading-40` seen elsewhere on the same page's own prose headers, e.g. the page's own `<h1>` uses `text-heading-24 md:text-heading-40 font-semibold` and intro paragraph uses `text-copy-16 md:text-copy-20`).
- **Link component props seen inside a toast**: `data-zone="same"` and `isDifferentZone={false}` — internal routing/zone metadata specific to Vercel's own docs site multi-zone Next.js setup; not part of a generic Toast API, but shows a `Link` can be embedded directly in toast content.
- No raw pixel dimensions, border-radius values, colors (hex/oklch), or `--ds-*` CSS custom properties were present anywhere in the captured HTML/flight payload for this page — Vercel's docs site does not expose the compiled component's internal style tokens on this route (the page only renders usage demos + prose, not a token/spec table). Treat sizing/color/motion/radius as NOT observable from this page; rely on the general Geist token conventions documented on other captured component pages (e2.g. `--ds-*` custom properties, `text-{role}-{size}` scale) as the best inference, and verify against actual rendered toast pixels via browser/screenshot if pixel-exact values are required.
- **Auto-dismiss timing**: not given as a literal number; best-practices text only says undo snackbars should persist "5-10 seconds" — no default auto-dismiss duration number is stated for a non-preserved toast.
- **State/variant naming**: exactly four call surfaces documented — `message` (neutral/default), `success`, `warning`, `error`. No `info` variant was shown, and no visual style/color per variant was described in text (only inferable that success/warning/error carry distinct theme colors by convention, but the page doesn't state the hex/role tokens for the container fill or icon per state).
