# Toggle

> "Displays a boolean value."

Source: https://vercel.com/geist/toggle (Vercel Geist Design System). Fetched as static server-rendered HTML (no browser execution); code examples recovered from the Next.js flight payload (`self.__next_f.push` chunks).

## Sections documented

- **Default** — two `Toggle` instances side by side, one unchecked and one checked, each wired to its own `useState` boolean via `checked` + `onChange`. Demonstrates the baseline controlled usage and `aria-label` for an unlabeled toggle.
- **Disabled** — two toggles with the `disabled` prop set, one `checked={false}` and one `checked` (on), showing the disabled visual treatment in both the off and on positions.
- **Sizes** — two toggles side by side, default size vs `size="large"`, both unchecked, to contrast the two available control sizes.
- **Custom Color** — a 2x2 grid crossing `color="amber"` / `color="red"` with default size / `size="large"`, each toggle paired with an `icon` prop supplying distinct checked/unchecked icons (`IconLockClosedSmall` / `IconLockOpenSmall`). Demonstrates the color override and the icon-swap-on-state feature together.
- **With Label** — an 8-toggle grid (4 rows x 2 columns) all bound to the same `checked` state, showing `children`-as-label usage crossed with: default direction vs `direction="switch-first"`, default size vs `size="large"`, and plain vs icon variants. This is the composition matrix for label placement, size, and icon simultaneously.
- **Best Practices** — accordion of prose guidance covering when to use Toggle vs Checkbox/Switch, controlled-state ownership, persistence/toast feedback, disabled-state rules, label semantics (`children` vs `aria-label`), description text, `labelCasing`, and accessible-name requirements.

Each demo section has a "Show code" expander revealing the exact JSX used to build it (all five variants recovered below). No additional linked sub-pages were found; the right-rail nav lists all other Geist components (Avatar, Badge, ... Toggle, Tooltip, ...) but none needed to be followed for this spec.

## API

**Component:** `Toggle` from `@vercel/geistcn/components`.

### Props observed in code examples

- `checked: boolean` — required, controlled. No internal state; the consuming app owns it.
- `onChange: () => void` — change handler; examples always call `setChecked(!checked)` inline (no event arg is read in any example, i.e. `onChange={(): void => setChecked(!checked)}`).
- `disabled?: boolean` — presence-only boolean attribute (`disabled`), shown with both `checked={false}` and `checked` (true).
- `size?: "large"` (and an implicit default, medium/small, never named explicitly in examples — only the non-default `size="large"` ever appears as an explicit prop).
- `color?: "amber" | "red"` (and an implicit default color when omitted). Only these two override values appear in the docs; more may exist but are not demonstrated.
- `icon?: { checked: ReactNode; unchecked: ReactNode }` — object with two slots, one icon rendered in the ON state, one in the OFF state. Demonstrated with `IconLockClosedSmall` (checked) / `IconLockOpenSmall` (unchecked) from `@vercel/geistcn-assets/icons`.
- `children?: ReactNode` — the visible label; Best Practices explicitly says "The label is `children`, not a `label` prop."
- `direction?: "switch-first"` (default direction places the switch after the label; `switch-first` puts the switch before the label/children).
- `aria-label?: string` — accessible name when there is no visible `children` label (used in Default/Disabled/Sizes/Custom Color demos, all of which pass no children).
- `labelCasing?: "title" | "normal"` — mentioned only in Best Practices prose (not shown in a code sample): default is `"title"`; set to `"normal"` only when sentence-case content sits inline next to the toggle.
- `aria-labelledby?: string` — mentioned in Best Practices as a third way (with `children` and `aria-label`) to provide an accessible name; Geist warns in dev if all three are missing.

### Usage snippets (verbatim, minimal API demonstrations)

Default:

```tsx
import { Toggle } from "@vercel/geistcn/components";
import { useState, type JSX } from "react";

export function Component(): JSX.Element {
  const [checked, setChecked] = useState(false);
  const [checked2, setChecked2] = useState(true);

  return (
    <div className="flex relative min-w-px max-w-full flex-col flex-1">
      <div className="flex relative min-w-px max-w-full flex-col flex-1">
        <Toggle
          aria-label="Enable Firewall"
          checked={checked}
          onChange={(): void => setChecked(!checked)}
        />
      </div>

      <div className="flex relative min-w-px max-w-full flex-col flex-1">
        <Toggle
          aria-label="Enable Firewall"
          checked={checked2}
          onChange={(): void => setChecked2(!checked2)}
        />
      </div>
    </div>
  );
}
```

Disabled:

```tsx
import { Toggle } from "@vercel/geistcn/components";
import type { JSX } from "react";

export function Component(): JSX.Element {
  return (
    <div className="flex relative min-w-px max-w-full flex-col flex-1">
      <div className="flex relative min-w-px max-w-full flex-col flex-1">
        <Toggle aria-label="Enable Firewall" checked={false} disabled />
      </div>

      <div className="flex relative min-w-px max-w-full flex-col flex-1">
        <Toggle aria-label="Enable Firewall" checked disabled />
      </div>
    </div>
  );
}
```

Sizes:

```tsx
import { Toggle } from "@vercel/geistcn/components";
import type { JSX } from "react";

export function Component(): JSX.Element {
  return (
    <div className="flex relative min-w-px max-w-full flex-row flex-wrap flex-1">
      <div className="flex relative min-w-px max-w-full flex-col flex-1">
        <Toggle aria-label="Enable Firewall" checked={false} />
      </div>

      <div className="flex relative min-w-px max-w-full flex-col flex-1">
        <Toggle aria-label="Enable Firewall" checked={false} size="large" />
      </div>
    </div>
  );
}
```

Custom Color:

```tsx
import { Toggle } from "@vercel/geistcn/components";
import { useState, type JSX } from "react";
import { IconLockClosedSmall, IconLockOpenSmall } from "@vercel/geistcn-assets/icons";

export function Component(): JSX.Element {
  const [checked, setChecked] = useState(false);

  return (
    <div className="flex relative min-w-px max-w-full flex-col flex-1">
      <div className="flex relative min-w-px max-w-full flex-col flex-1">
        <Toggle
          aria-label="Enable Firewall"
          checked={checked}
          color="amber"
          icon={{
            checked: <IconLockClosedSmall />,
            unchecked: <IconLockOpenSmall />,
          }}
          onChange={(): void => setChecked(!checked)}
        />
      </div>

      <div className="flex relative min-w-px max-w-full flex-col flex-1">
        <Toggle
          aria-label="Enable Firewall"
          checked={checked}
          color="red"
          icon={{
            checked: <IconLockClosedSmall />,
            unchecked: <IconLockOpenSmall />,
          }}
          onChange={(): void => setChecked(!checked)}
        />
      </div>

      <div className="flex relative min-w-px max-w-full flex-col flex-1">
        <Toggle
          aria-label="Enable Firewall"
          checked={checked}
          color="amber"
          icon={{
            checked: <IconLockClosedSmall />,
            unchecked: <IconLockOpenSmall />,
          }}
          onChange={(): void => setChecked(!checked)}
          size="large"
        />
      </div>

      <div className="flex relative min-w-px max-w-full flex-col flex-1">
        <Toggle
          aria-label="Enable Firewall"
          checked={checked}
          color="red"
          icon={{
            checked: <IconLockClosedSmall />,
            unchecked: <IconLockOpenSmall />,
          }}
          onChange={(): void => setChecked(!checked)}
          size="large"
        />
      </div>
    </div>
  );
}
```

With Label:

```tsx
import { Toggle } from "@vercel/geistcn/components";
import { useState, type JSX } from "react";
import { IconLockClosedSmall, IconLockOpenSmall } from "@vercel/geistcn-assets/icons";

export function Component(): JSX.Element {
  const [checked, setChecked] = useState(false);

  return (
    <div className="flex flex-col items-start justify-start gap-4 flex-initial">
      <div className="flex flex-row items-stretch justify-start gap-4 flex-initial">
        <Toggle checked={checked} onChange={(): void => setChecked(!checked)}>
          Enable Firewall
        </Toggle>
        <Toggle
          checked={checked}
          direction="switch-first"
          onChange={(): void => setChecked(!checked)}
        >
          Enable Firewall
        </Toggle>
      </div>
      <div className="flex flex-row items-stretch justify-start gap-4 flex-initial">
        <Toggle checked={checked} onChange={(): void => setChecked(!checked)} size="large">
          Enable Firewall
        </Toggle>
        <Toggle
          checked={checked}
          direction="switch-first"
          onChange={(): void => setChecked(!checked)}
          size="large"
        >
          Enable Firewall
        </Toggle>
      </div>
      <div className="flex flex-row items-stretch justify-start gap-4 flex-initial">
        <Toggle
          checked={checked}
          icon={{
            checked: <IconLockClosedSmall />,
            unchecked: <IconLockOpenSmall />,
          }}
          onChange={(): void => setChecked(!checked)}
        >
          Enable Firewall
        </Toggle>
        <Toggle
          checked={checked}
          direction="switch-first"
          icon={{
            checked: <IconLockClosedSmall />,
            unchecked: <IconLockOpenSmall />,
          }}
          onChange={(): void => setChecked(!checked)}
        >
          Enable Firewall
        </Toggle>
      </div>
      <div className="flex flex-row items-stretch justify-start gap-4 flex-initial">
        <Toggle
          checked={checked}
          icon={{
            checked: <IconLockClosedSmall />,
            unchecked: <IconLockOpenSmall />,
          }}
          onChange={(): void => setChecked(!checked)}
          size="large"
        >
          Enable Firewall
        </Toggle>
        <Toggle
          checked={checked}
          direction="switch-first"
          icon={{
            checked: <IconLockClosedSmall />,
            unchecked: <IconLockOpenSmall />,
          }}
          onChange={(): void => setChecked(!checked)}
          size="large"
        >
          Enable Firewall
        </Toggle>
      </div>
    </div>
  );
}
```

### Composition patterns

- Toggle is always controlled — no uncontrolled/defaultChecked variant appears anywhere.
- Label can come from `children` (rendered inline, and it also doubles as the accessible name when present) or, with no visible label, from `aria-label`/`aria-labelledby`.
- `direction="switch-first"` reorders the switch to precede the label; the default order is label-then-switch.
- `icon` is an all-or-nothing object prop — both `checked` and `unchecked` icon slots are supplied together in every example; there's no single-icon partial usage shown.
- `color` and `size` are independent axes and compose freely with `icon` and `children`/label usage (see the With Label 4x2 matrix).

## Best practices

(Paraphrased from the page's Best Practices accordion, not copied verbatim.)

- **When to use:** pick Toggle for one boolean setting that takes effect immediately on flip (e.g. turning password protection on, or auto-cancelling builds). If the user is choosing several items from a list, use Checkbox instead; if they're picking one of 2-3 mutually exclusive views, use Switch instead.
- **State ownership:** Toggle has no internal state — `checked` is mandatory and the parent must hold the boolean and update it in `onChange`.
- **Feedback on change:** persist the change immediately and confirm it with a success toast naming what happened (e.g. "Password protection enabled") so the user isn't left guessing whether the flip registered. Only add a form Save-button footer around it if the underlying setting genuinely requires an explicit save step.
- **Disabling:** only disable the toggle when the action truly cannot be performed right now (wrong plan tier, a locked policy, etc.), and pair the disabled state with helper text or a Tooltip that explains what would unlock it.
- **Labeling:** the label lives in `children`, never a separate `label` prop. Keep it a short Title Case noun phrase (1-4 words) describing the state that's true when ON — "Password Protection", not an instruction like "Enable Password Protection".
- **Optional description:** if you need to explain more, add one short sentence as a sibling element under the label, and only describe what ON means — OFF is just its negation and doesn't need separate copy.
- **Casing:** leave `labelCasing` at its default (`"title"`) to stay consistent with other Title Case surfaces; only switch it to `"normal"` when the toggle sits inline inside sentence-case body copy.
- **Accessible name:** supply it via `children`, `aria-label`, or `aria-labelledby` — Geist will warn in development if none of the three is present. Use `aria-label` specifically when the visible label text lives elsewhere on the row (not adjacent to the control); otherwise let `children` do double duty so sighted users and screen readers see/hear the same text.

## Design notes

- **Component path:** `@vercel/geistcn/components` (Toggle); companion icons for the icon-slot examples come from `@vercel/geistcn-assets/icons` (e.g. `IconLockClosedSmall`, `IconLockOpenSmall` — note the "Small" icon variant naming convention, implying a matching icon-size family).
- **Sizes:** two sizes are exposed through the API — an unnamed default and an explicit `size="large"` override. The live page renders the actual pixel dimensions client-side (React hydration), so exact px values weren't present in the static HTML fetch; treat "large" as the enlarged control/hit-area variant and the default as the standard row-height control until confirmed against a rendered instance or the Figma kit.
- **Color roles:** two named override colors appear, `color="amber"` and `color="red"` — both demoed exclusively paired with a lock icon pair (amber = a cautionary/attention state, red = a destructive/blocking state), suggesting the base/default color for an affirmative ON state is Geist's standard accent (not amber/red) and these two are semantic overrides layered on top of it.
- **Design tokens visible in the page** (from the broader Geist stylesheet loaded by this doc, not confirmed as Toggle-specific but part of the same token system referenced): `--ds-amber-100/700/800/1000`, `--ds-red-100/600/1000`, `--ds-gray-100/200/400/500/600/700/900/1000` and `--ds-gray-alpha-100..600`, `--ds-background-100/200`, `--ds-blue-300/700/900`, `--ds-focus-color`, `--ds-focus-ring`, `--ds-shadow-border` / `--ds-shadow-border-small`, `--ds-size-medium`. Body/label copy on this page uses `text-copy-14` and list items use `text-label-12`-scale styling for metadata; treat these as the ambient Geist token vocabulary the Toggle inherits rather than component-unique values.
- **State model:** binary controlled boolean (`checked`), no indeterminate state exposed in any example.
- **Direction:** `direction="switch-first"` is the only documented direction override, confirming a two-value enum (default label-first vs switch-first) for where the switch sits relative to the label.
- **Icon swap:** the icon prop is a per-state pair, implying the visual motion is an icon crossfade/swap synchronized with the thumb's slide between off/on positions (typical toggle-thumb icon pattern) rather than a static icon.
- **Accessibility semantics:** the rendered control is expected to carry `role="switch"` + `aria-checked` (standard Radix/ARIA switch pattern) though the exact DOM wasn't recoverable from the static fetch since Toggle demo markup renders client-side; only the page's own feedback widget ("Was this helpful?") showed literal `aria-checked="false"` in the static HTML, which is a different button-based control, not the documented Toggle.

## Notes on capture completeness

- The fetch succeeded on the first try (323 KB, well above the 80-200 KB expectation) — no slug variants were needed.
- All five "Show code" JSX examples were recovered from the flight payload's syntax-highlighter source strings (found via `import {` search adjacent to `@vercel/geistcn/components`), each appearing twice in the payload (once as a raw string prefix, once re-rendered as syntax-highlighted spans) — the raw string version was used verbatim here.
- Exact pixel/radius/px values for the two sizes and the state color fills were NOT present in the static HTML — the demo previews render via client-side React and weren't materialized in the server HTML the way the surrounding page chrome (nav, best-practices list, feedback widget) was. Confirming those numbers requires either a live browser render (screenshot + inspect) or the Figma/token export, which was out of scope for a headless fetch.
- No 404s or broken links encountered; no additional sub-pages needed following.
