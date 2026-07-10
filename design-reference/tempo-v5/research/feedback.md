# Feedback

> "Gather text feedback with an associated emotion."

Source: https://vercel.com/geist/feedback (fetched 2026-07-10/11, raw HTML cached at `design-reference/tempo-v5/research/.cache/feedback.html`)

## Sections documented

- **Default** — the standard trigger. A `Feedback` button (label "Feedback") opens a popover/dialog containing: a 5-emoji emotion picker (radio group), a textarea for free text, an encryption/privacy note ("supported." next to a lock-like icon), and a "Send" submit button. Note: "Should only be used on desktop." — the demo itself is hidden on non-xl viewports and replaced by a `Note` explaining why (mobile/tablet visitors see the caveat instead of a broken layout).
- **Inline** — `type="inline"` renders the trigger as a compact pill (no popover open/close) directly in the page flow: "Was this helpful?" text + the 5 emoji radio buttons inline, fixed height 48px. This variant is shown on all breakpoints (no desktop-only gating), suggesting it is the responsive-safe form factor.
- **Feedback with Select** ("Feedback with pre-defined list of topics") — `showTopics` adds a topic dropdown/select to the panel so submissions get bucketed into predefined categories before the free-text step. Desktop-only, same hidden-on-mobile `Note` pattern as Default.
- **Feedback with metadata** — `metadata` prop accepts an arbitrary key/value object (`userId`, `location`, `orderId` shown) that rides along with the submission, invisible to the end user, for engineering/support triage context. Desktop-only.
- **Feedback with prefix** — `prefix` prop accepts a `JSX.Element` (icon) rendered before the trigger label, e.g. `IconFlagPriority`.
- **Feedback with suffix** — `suffix` prop, same icon slot but rendered after the trigger label.
- **Best Practices** accordion — When to use / Behavior / Content guidance (see below).

No dedicated "Sizes", "Types" (beyond inline vs. default), "States", or "Accessibility" subsection headings were present on this page beyond what's folded into Best Practices → Content/Behavior. No standalone Accessibility copy block was found in the page text (ARIA behavior is inferable from markup only — see Design notes).

## API

Package: `@vercel/geist/components` (primary export) and `@vercel/geist/components` also re-exports `Note` (used only in the docs demos to explain hidden states, not part of the Feedback component itself). Icons come from `@vercel/geistcn-assets/icons`.

### `<Feedback />`

Props observed across all code samples:

- `label: string` — trigger button label / inline prompt context. Required in every example (`label="vercel"`).
- `dryRun?: boolean` — present in every demo (`dryRun`), used to keep the docs-site sandboxed demo from actually submitting; implies a real integration omits this and wires a submit handler/endpoint.
- `type?: "inline" | (default trigger/popover)` — `type="inline"` switches from the button-that-opens-a-panel form factor to an always-visible inline pill.
- `showTopics?: boolean` — renders a `Select` of predefined topics inside the panel before/alongside the textarea.
- `metadata?: Record<string, string | number>` — arbitrary key-value pairs attached to the submission (example: `{ userId: 'user_12345', location: 'post-checkout', orderId: 'order_123456' }`).
- `prefix?: JSX.Element` — icon/element rendered before the label (example: `<IconFlagPriority />`).
- `suffix?: JSX.Element` — icon/element rendered after the label (same icon type shown).

### Composition / usage snippets (from the page's "Show code" blocks)

Default (desktop-only trigger + panel):
```tsx
import { Feedback, Note } from '@vercel/geistcn/components';
import type { JSX } from 'react';

export function Component(): JSX.Element {
  return (
    <>
      <div className="hidden justify-center xl:flex">
        <Feedback label="vercel" dryRun />
      </div>
      <div className="flex justify-center xl:hidden">
        <Note>
          This example is hidden because it is intended for only desktop.
        </Note>
      </div>
    </>
  );
}
```

Inline:
```tsx
import { Feedback } from '@vercel/geistcn/components';
import type { JSX } from 'react';

export function Component(): JSX.Element {
  return <Feedback dryRun label="vercel" type="inline" />;
}
```

With predefined topics:
```tsx
import { Feedback, Note } from '@vercel/geistcn/components';
import type { JSX } from 'react';

export function Component(): JSX.Element {
  return (
    <>
      <div className="hidden justify-center xl:flex">
        <Feedback label="vercel" showTopics dryRun />
      </div>
      <div className="flex justify-center xl:hidden">
        <Note>
          This example is hidden because it is intended for only desktop.
        </Note>
      </div>
    </>
  );
}
```

With metadata:
```tsx
import { Feedback, Note } from '@vercel/geistcn/components';
import type { JSX } from 'react';

export function Component(): JSX.Element {
  return (
    <>
      <div className="hidden justify-center xl:flex">
        <Feedback
          label="vercel"
          dryRun
          metadata={{
            userId: 'user_12345',
            location: 'post-checkout',
            orderId: 'order_123456',
          }}
        />
      </div>
      <div className="flex justify-center xl:hidden">
        <Note>
          This example is hidden because it is intended for only desktop.
        </Note>
      </div>
    </>
  );
}
```

With prefix icon:
```tsx
import { Feedback } from '@vercel/geistcn/components';
import { IconFlagPriority } from '@vercel/geistcn-assets/icons';
import type { JSX } from 'react';

export function Component(): JSX.Element {
  return <Feedback dryRun label="vercel" prefix={<IconFlagPriority />} />;
}
```

With suffix icon:
```tsx
import { Feedback } from '@vercel/geistcn/components';
import { IconFlagPriority } from '@vercel/geistcn-assets/icons';
import type { JSX } from 'react';

export function Component(): JSX.Element {
  return <Feedback dryRun label="vercel" suffix={<IconFlagPriority />} />;
}
```

Note: the package import path shown in the code samples is `@vercel/geistcn/components` (the "geistcn" / shadcn-flavored distribution), while the rendered markup elsewhere on the docs site references `@vercel/geist` generically — treat both as the same design-system package family; re-implement against whichever internal package alias the team standardizes on.

## Best practices (paraphrased)

**When to use**
- Drop Feedback at the tail of a completed experience — end of a page, a doc, or a finished flow — once the user actually has an opinion to give. Do not surface it the moment a surface opens.
- Reach for the topic-select variant only when responses map to categories your team actually triages (bug / pricing / docs); if a free-text box is enough, skip the extra step.
- Feedback is not a replacement for a support ticket form, bug-report intake, or a dedicated NPS survey — those need their own purpose-built surfaces.

**Behavior**
- The panel stays closed until the user deliberately opens it; do not auto-expand it, since that interrupts whatever task prompted the feedback in the first place.
- When using the metadata variant, attach non-identifying context (route, build/version id, plan tier, viewport) so engineering can reproduce an issue without asking a follow-up question.
- Submitting the form closes the panel and returns focus to the trigger — that closing motion is the acknowledgment; do not also pop a generic "thanks" toast on top of it.

**Content**
- `label` reads as Title Case and stays short. The default word "Feedback" is fine as-is; only override it when scoping to a specific flow, e.g. "Feedback on Imports" or "Report a Bug." Never end it with a question mark.
- `copy` (or whatever prop drives the header line above the emoji row) should read as a sentence-case question, e.g. "How did the import go?" — strip filler like "please" and "we're sorry."
- The textarea's placeholder text ("Your feedback...") is fixed by the design system itself — don't try to swap it out with custom children.

## Design notes

**Inline variant (`type="inline"`)**
- Fixed pill container: `height: 48px`, `width: 274px`, `border-radius: 30px`.
- Background: `var(--ds-background-100)`; shadow: `var(--ds-shadow-border-small)`; `transition-colors duration-200`.
- Inner padding: `py-2 pl-4 pr-2`; internal layout `flex items-center justify-center gap-2`.
- Prompt text: `text-copy-14 text-gray-900` ("Was this helpful?").

**Emotion picker (shared by both Default and Inline)**
- 5 emoji buttons in a `role="radio"` group (native radio semantics via `aria-checked` + `role="radio"`, not a native `<input type=radio>`), each `aria-label="Select {Emotion} emoji"`.
- Emotion set/order observed: **Hate it → Not great → It's okay → Love it! → (5th, amber-accented sparkle icon, appears to be an intensified "amazing/love" state)**. Labels found verbatim in markup: "Hate it", "Not great", "It's okay", "Love it!".
- Button: `size-8` (32px), fully round (`rounded-[50%]`), `bg-transparent`, no border, `cursor-pointer`.
- Icon color at rest: `text-[var(--ds-gray-900)]`.
- Hover state: `bg-[var(--ds-blue-300)]`, `border-[var(--ds-blue-300)]`, icon fill → `var(--ds-blue-900)`.
- Selected state (`aria-checked="true"`): identical treatment to hover (`bg`/`border` → `--ds-blue-300`, icon fill → `--ds-blue-900`) — hover and selected share the same blue "active" visual, no separate third state.
- One icon (the "Love it!" / amazed one) has an additional amber accent path (`fill="var(--ds-amber-800)"`) for sparkle/stars details layered over the base gray-900 face — the only emotion icon with a secondary color.
- Focus state: `focus-visible:shadow-[var(--ds-focus-ring)]`, `focus-visible:outline-hidden`.
- Icon transition: `[&_svg_path]:transition-all transition-[background,border-color] duration-200`.

**Textarea**
- Wrapper: `rounded-md`, `shadow-[0_0_0_1px_var(--ds-gray-alpha-400)]` at rest, hover raises to `--ds-gray-alpha-500`, focus is a two-layer shadow: `0 0 0 1px var(--ds-gray-alpha-600), 0 0 0 4px rgba(0,0,0,0.16)` (light) / `rgba(255,255,255,0.24)` (dark theme).
- Fixed height `h-[100px]`, `resize-none`, `py-2.5 px-3`.
- `spellCheck="false"`, `placeholder="Your feedback..."`, `id="feedback-textarea"`.
- Disabled state: `bg-[var(--ds-gray-100)]`, `text-[var(--ds-gray-700)]`, `cursor-not-allowed`.

**Privacy/encryption note row**
- `text-label-12 text-gray-900`, small lock/shield SVG icon (`fill="var(--ds-gray-700)"`) + the word "supported." (full sentence likely truncated by an ellipsis/tooltip in the live UI, e.g. "End-to-end encryption supported.").

**Footer / Send button**
- Footer bar: `flex justify-between`, `bg-[var(--accents-1)]`, `border-t border-[var(--accents-2)]`, `p-3`; content right-aligned (`justify-content:flex-end`) when there's nothing else in the footer.
- Send button is the standard Geist primary button: `h-[32px]` (`--height:32px`), `rounded-md`, dark fill `bg-[var(--themed-bg,_var(--ds-gray-1000))]` with `text-[var(--themed-fg,_var(--ds-background-100))]` (i.e. inverted/high-contrast primary), hover darkens/lightens via `hsl(0,0%,22%)` (light theme) / `hsl(0,0%,80%)` (dark theme).
- Disabled state: `bg-[var(--ds-gray-100)]`, `text-[var(--ds-gray-700)]`.

**Default trigger button (opens the panel)**
- Rendered as a standard secondary Geist button: `height 32px`, width pinned to `var(--navbar-secondary-button-width)` in the docs demo (i.e. matches neighboring nav buttons — not a fixed component width, just how the docs page sizes it).
- `aria-haspopup="dialog"`, `aria-expanded`, `aria-controls` wired to a Radix-generated id (`radix-_R_xxx_`) — confirms the panel is a Radix-based popover/dialog under the hood.
- Secondary-button visual: transparent background with a 1px border (`shadow-[0_0_0_1px_var(--themed-border,transparent)]`), `--themed-border: var(--ds-gray-400)`, `--themed-fg: var(--ds-gray-1000)`, hover background `var(--ds-gray-alpha-200)`.

**"Show code" toggle**
- Rendered as an accordion trigger: `h-[48px]`, full width, `rounded-b-lg`, `bg-background-200`, `border-t border-gray-400`; chevron icon rotated `-rotate-90` when collapsed (rotates to point down when expanded, standard accordion affordance). Radix `data-state="open"|"closed"` drives it.

**General tokens seen across the page (shared design-system vars, not Feedback-exclusive but relevant for reimplementation):**
- Color roles: `--ds-gray-100/200/400/700/900/1000`, `--ds-gray-alpha-100/200/400/500/600`, `--ds-blue-300/700/900`, `--ds-amber-800`, `--ds-background-100`.
- Shadows: `--ds-shadow-border`, `--ds-shadow-border-small`, `--ds-focus-ring`, `--ds-focus-color`.
- Sizing: `--ds-size-medium`, `--ds-control-decoration-size`.
- Typography scale classes seen: `text-copy-14` (body/prompt text), `text-label-12` (the encryption note).
- Radii: `rounded-md` (4-ish/8px scale button/textarea), `rounded-lg` (demo card container), `rounded-full` / `rounded-[50%]` (emoji buttons), `rounded-b-lg` (accordion footer).

**Motion**
- All interactive color/background transitions use `duration-200` (hover/selected states on emoji buttons, inline pill background) or `duration-150` (buttons generally) with `ease-in-out`; no bespoke enter/exit animation copy was described in the prose — motion is implied entirely through Tailwind transition utility classes in the markup, not documented explicitly.

## Notes / anomalies

- The page fetched cleanly (220KB HTML, no 404). No slug variants were needed.
- Code examples were NOT behind a separate lazily-fetched endpoint — they were embedded as `__rawString__` template literals inside one giant inlined Next.js RSC flight payload script tag (`self.__next_f.push([1, "..."])`), decoded via `json.loads` on the outer array then regex-extracted (6 raw code blocks found, matching the 6 demo sections that have a "Show code" toggle: Default, Inline, Select, metadata, prefix, suffix).
- No distinct "States" or "Accessibility" prose sections exist on this page (unlike some other Geist component pages) — accessibility behavior (role="radio", aria-checked, aria-haspopup=dialog, aria-controls, focus-visible rings) had to be reverse-engineered from the rendered markup rather than documented copy.
- The component's full prop list is inferred only from the 6 demo variants shown; there may be additional props (e.g. an `onSubmit`/submit-handler prop, since `dryRun` implies a non-dry submit path exists) not exercised by any visible example on this page.
- Package import path in code samples is `@vercel/geistcn/components` — double-check against whichever actual package name your BYOK/Radix reimplementation targets; the docs site itself mixes `@vercel/geist` (URL/brand) and `@vercel/geistcn` (import path) naming.
