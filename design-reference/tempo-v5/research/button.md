# Button

> "Trigger an action or event, such as submitting a form or displaying a dialog."

Source: https://vercel.com/geist/button (fetched 2026-07-10). Page frontmatter: `title: "Button"`, `peek: "button-sizes"` (the default/anchor preview is the Sizes demo).

## Sections documented

Every section on the page, in order, with what it demonstrates:

- **(unnamed intro/default preview)** — a plain `<Button>` with no size/variant props, i.e. the baseline default render (medium size, default variant). Anchored by page `peek: "button-sizes"`.
- **Sizes** — `small` / default (medium) / `large`, shown side by side. Copy: "The default size is medium."
- **All Types and Sizes in comparison** — a grid crossing every `variant` (`default`, `error`, `warning`, `secondary`, `tertiary`) against every `size` (`small`, medium/default, `large`) — three rows of five variants each.
- **Shapes** — icon-only buttons (`svgOnly` + `aria-label`, no visible text) across `shape="square"` and `shape="circle"`, each at `size="tiny" | "small" | default | "large"`. Copy: "Icon-only buttons should include the `svgOnly` prop and an `aria-label`."
- **Prefix and suffix** — a leading icon (`prefix`), a trailing icon (`suffix`), and both combined, using icon components from `@vercel/geistcn-assets/icons`.
- **Rounded** — `shape="rounded"` combined with the `shadow` prop, across `small` / default / `large` sizes, on `variant="secondary"`. Copy: "Combination of `shape=\"rounded\"` and the `shadow` prop, often used on marketing pages."
- **Loading** — the `loading` prop across `small` / default / `large` sizes; button stays focusable, swaps in a spinner state, keeps its label.
- **Disabled** — the `disabled` prop across `small` / default / `large` sizes.
- **Disabled variants** — `disabled` combined with each `variant`: default, `secondary`, `tertiary`, `error`, `warning`.
- **Link** — the `ButtonLink` subcomponent, an anchor-rendering sibling of `Button` with the same prop surface, for navigation instead of actions. Copy: "Use `ButtonLink` for links with the same props as `Button`."
- **Custom** — the `CustomButton` subcomponent for fully custom coloring: separate `normal` / `hover` / `active` state objects, each with `foreground` / `background` / `border`, plus a `width` prop. Copy: "Use `CustomButton` to override colors for foreground, background, and border across normal, hover, and active states."
- **Best Practices** — an accordion of usage/behavior/accessibility rules (see below), covering Button vs ButtonLink vs Menu/Split Button, variant/type semantics, form submit typing, loading vs spinner, disabled + tooltip pairing, label copy rules, destructive-action naming, and icon-only accessibility requirements.

## API

Three exported components appear across the examples: **`Button`**, **`ButtonLink`**, **`CustomButton`** — all imported from `@vercel/geistcn/components`. Icons come from a separate package, `@vercel/geistcn-assets/icons` (e.g. `IconArrowUp`, `IconArrowLeft`, `IconArrowRight`).

### `Button` props observed in code examples

| Prop | Values seen | Notes |
|---|---|---|
| `size` | `"tiny"`, `"small"`, (default/unset = medium), `"large"` | `"tiny"` only appears on icon-only (`svgOnly`) buttons in the Shapes demo; text buttons only show `small` / default / `large`. |
| `variant` | `"default"`, `"error"`, `"warning"`, `"secondary"`, `"tertiary"` | Visual variant — this is the prop name used in the JSX examples. |
| `shape` | `"square"`, `"circle"`, `"rounded"` | `"square"`/`"circle"` used with `svgOnly` icon buttons; `"rounded"` used with the `shadow` prop for marketing-page buttons. |
| `svgOnly` | boolean flag | Icon-only rendering; MUST be paired with `aria-label` (Best Practices calls this validator-enforced — "the validator throws without them"). |
| `aria-label` | string | Required alongside `svgOnly`; should name the action + target (e.g. `"Copy deployment URL"`), not the icon (not just `"Copy"`). Must NOT be set on a button that already has visible text (creates a screen-reader mismatch). |
| `prefix` | JSX node (icon) | Leading icon, e.g. `prefix={<IconArrowLeft />}`. |
| `suffix` | JSX node (icon) | Trailing icon, e.g. `suffix={<IconArrowRight />}`. Can combine with `prefix` on the same button. |
| `shadow` | boolean flag | Combined with `shape="rounded"` for marketing-style buttons. |
| `loading` | boolean flag | Per Best Practices: pass `loading` instead of manually swapping in a spinner, so the button stays focusable and announces busy state to assistive tech. |
| `disabled` | boolean flag | Per Best Practices: only disable when the action is impossible right now (missing input, insufficient permission); pair with a Tooltip explaining why. |
| `className` | string | Standard passthrough (e.g. layout classes on wrapper `div`s in examples, not on `Button` itself in these samples). |
| children | text or icon | Button label. |

**Important nuance from Best Practices prose (not the JSX samples):** the prose refers to a `type` prop (not `variant`) for semantic role — `type="secondary"` for supporting actions, `type="error"` for destructive confirmations, default/unset `type` = primary — and explicitly says `primary`, `success`, `ghost`, and `violet` are NOT valid `type` values. It also references `typeName="submit"` for HTML form-submit wiring, clarifying that the native HTML `type` attribute is exposed via a prop called `typeName`, because `type` itself is reserved for the visual variant. This is a naming mismatch vs. the code samples (which use `variant`, not `type`) — likely the docs prose uses an older/alternate prop name than the current JSX examples, or `type` is an alias for `variant`. Flag this for verification against the actual `@vercel/geistcn` source before implementing; on our stack we'd standardize on one prop name (e.g. `variant`) and expose `type="submit"|"button"|"reset"` natively for form semantics as React does by default.

### `ButtonLink` props observed

Same prop surface as `Button` ("same props as `Button`" per docs copy), renders an anchor tag. Only prop combination shown:

```tsx
import { ButtonLink } from '@vercel/geistcn/components';

<ButtonLink className="w-fit" href="#">
  Sign Up
</ButtonLink>
```

`href` is the anchor destination; `className` passthrough confirmed here.

### `CustomButton` props observed

```tsx
import { CustomButton } from '@vercel/geistcn/components';

<CustomButton
  active={{
    foreground: '#fff',
    background: 'var(--ds-blue-700)',
    border: 'var(--ds-blue-700)',
  }}
  hover={{
    foreground: '#fff',
    background: '#0B7BFE',
    border: 'var(--ds-blue-700)',
  }}
  normal={{
    foreground: '#fff',
    background: 'var(--ds-blue-700)',
    border: 'var(--ds-blue-700)',
  }}
  width={160}
>
  Upgrade to Pro
</CustomButton>
```

- `normal` / `hover` / `active`: each an object `{ foreground, background, border }` (CSS color strings — raw hex or `var(--ds-*)` tokens both accepted).
- `width`: numeric pixel width override.
- Used for one-off branded CTAs (example: an "Upgrade to Pro" button) that don't fit the standard variant palette.

### Full JSX usage snippets (as shown in demos)

**Sizes:**
```tsx
import { Button } from '@vercel/geistcn/components';
import type { JSX } from 'react';

export function Component(): JSX.Element {
  return (
    <div className="flex flex-col md:flex-row items-start gap-4 flex-initial">
      <Button size="small">Upload</Button>
      <Button>Upload</Button>
      <Button size="large">Upload</Button>
    </div>
  );
}
```

**All Types and Sizes in comparison:**
```tsx
import { Button } from '@vercel/geistcn/components';
import type { JSX } from 'react';

export function Component(): JSX.Element {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button size="small" variant="default">Upload</Button>
        <Button size="small" variant="error">Upload</Button>
        <Button size="small" variant="warning">Upload</Button>
        <Button size="small" variant="secondary">Upload</Button>
        <Button size="small" variant="tertiary">Upload</Button>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="default">Upload</Button>
        <Button variant="error">Upload</Button>
        <Button variant="warning">Upload</Button>
        <Button variant="secondary">Upload</Button>
        <Button variant="tertiary">Upload</Button>
      </div>
      <div className="flex items-center gap-3">
        <Button size="large" variant="default">Upload</Button>
        <Button size="large" variant="error">Upload</Button>
        <Button size="large" variant="warning">Upload</Button>
        <Button size="large" variant="secondary">Upload</Button>
        <Button size="large" variant="tertiary">Upload</Button>
      </div>
    </div>
  );
}
```

**Shapes (icon-only):**
```tsx
import { Button } from '@vercel/geistcn/components';
import type { JSX } from 'react';
import { IconArrowUp } from '@vercel/geistcn-assets/icons';

export function Component(): JSX.Element {
  return (
    <div className="flex flex-col md:flex-row items-start gap-4 flex-initial">
      <Button aria-label="Upload" shape="square" size="tiny" svgOnly><IconArrowUp /></Button>
      <Button aria-label="Upload" shape="square" size="small" svgOnly><IconArrowUp /></Button>
      <Button aria-label="Upload" shape="square" svgOnly><IconArrowUp /></Button>
      <Button aria-label="Upload" shape="square" size="large" svgOnly><IconArrowUp /></Button>
      <Button aria-label="Upload" shape="circle" size="tiny" svgOnly><IconArrowUp /></Button>
      <Button aria-label="Upload" shape="circle" size="small" svgOnly><IconArrowUp /></Button>
      <Button aria-label="Upload" shape="circle" svgOnly><IconArrowUp /></Button>
      <Button aria-label="Upload" shape="circle" size="large" svgOnly><IconArrowUp /></Button>
    </div>
  );
}
```

**Prefix and suffix:**
```tsx
import { Button } from '@vercel/geistcn/components';
import type { JSX } from 'react';
import { IconArrowLeft, IconArrowRight } from '@vercel/geistcn-assets/icons';

export function Component(): JSX.Element {
  return (
    <div className="flex flex-col md:flex-row items-start gap-4 flex-initial">
      <Button prefix={<IconArrowLeft />}>Upload</Button>
      <Button suffix={<IconArrowRight />}>Upload</Button>
      <Button prefix={<IconArrowLeft />} suffix={<IconArrowRight />}>Upload</Button>
    </div>
  );
}
```

**Rounded (marketing style):**
```tsx
import { Button } from '@vercel/geistcn/components';
import type { JSX } from 'react';

export function Component(): JSX.Element {
  return (
    <div className="flex flex-col md:flex-row items-start gap-4 flex-initial">
      <Button shadow shape="rounded" size="small" variant="secondary">Upload</Button>
      <Button shadow shape="rounded" variant="secondary">Upload</Button>
      <Button shadow shape="rounded" size="large" variant="secondary">Upload</Button>
    </div>
  );
}
```

**Loading:**
```tsx
import { Button } from '@vercel/geistcn/components';
import type { JSX } from 'react';

export function Component(): JSX.Element {
  return (
    <div className="flex flex-col md:flex-row items-start gap-4 flex-initial">
      <Button loading size="small">Upload</Button>
      <Button loading>Upload</Button>
      <Button loading size="large">Upload</Button>
    </div>
  );
}
```

**Disabled:**
```tsx
import { Button } from '@vercel/geistcn/components';
import type { JSX } from 'react';

export function Component(): JSX.Element {
  return (
    <div className="flex flex-col md:flex-row items-start gap-4 flex-initial">
      <Button disabled size="small">Upload</Button>
      <Button disabled>Upload</Button>
      <Button disabled size="large">Upload</Button>
    </div>
  );
}
```

**Disabled variants:**
```tsx
import { Button } from '@vercel/geistcn/components';
import type { JSX } from 'react';

export function Component(): JSX.Element {
  return (
    <div className="flex flex-col md:flex-row items-start gap-4 flex-initial">
      <Button disabled>Default</Button>
      <Button disabled variant="secondary">Secondary</Button>
      <Button disabled variant="tertiary">Tertiary</Button>
      <Button disabled variant="error">Error</Button>
      <Button disabled variant="warning">Warning</Button>
    </div>
  );
}
```

**Link:**
```tsx
import { ButtonLink } from '@vercel/geistcn/components';
import type { JSX } from 'react';

export function Component(): JSX.Element {
  return (
    <ButtonLink className="w-fit" href="#">Sign Up</ButtonLink>
  );
}
```

**Custom:** see `CustomButton` snippet above.

### Composition patterns referenced (not shown in code, from Best Practices prose)

- When more than one related action shares a row, use **Menu** or **Split Button** instead of stacking multiple `Button`s.
- Pair a `disabled` button with a **Tooltip** explaining why the action is unavailable.
- Destructive `Button` actions pair 1:1 with a **toast** confirming the result (e.g. `Delete Project` triggers `Project deleted`).

## Best practices

Paraphrased from the page's Best Practices accordion:

- **Pick the right primitive.** Use `Button` for actions that change state (deploy, save, delete). Use `ButtonLink` for actions that just navigate (change the URL). If a row needs more than one related action, reach for Menu or Split Button instead of piling on buttons.
- **Variant carries meaning, not decoration.** The unstyled/default variant is the primary action. Use the secondary variant for the supporting action and the error/destructive variant for confirms that delete or destroy something. Don't invent variants — primary, success, ghost, and violet are explicitly not real options; stick to the supported set.
- **Form submission is a separate concern from visual variant.** The prop that wires a button to native HTML form-submit behavior is distinct from the prop that controls its look — don't conflate them.
- **Loading state beats manual spinner-swapping.** Toggling a loading flag keeps the button focusable and lets assistive tech announce that it's busy; hand-rolling a spinner replacement loses both.
- **Disabling is a last resort, always explained.** Only disable a button when the action truly cannot happen right now (missing required input, no permission) — and when you do, add a tooltip that tells the user why, not just that it's off.
- **Label copy: Title Case, name the outcome.** Buttons should say what will happen — "Deploy Project," "Invite Member," "Rotate Key" — never a bare verb like "Submit" or a content-free confirm like "OK"/"Confirm."
- **Destructive buttons follow a strict Verb + Noun + toast contract.** E.g. "Delete Project" as the button, "Project deleted" as the resulting toast — keep them symmetric. Mode-switch buttons (offering an alternate path) append "Instead," e.g. "Use a Recovery Code Instead."
- **Icon-only buttons are accessibility-gated, not optional.** An icon-only button must ship both the icon-only flag and an `aria-label`; there's a validator that throws if either is missing. The label should name the action and its target ("Copy deployment URL"), not just describe the icon ("Copy").
- **Don't double-label.** Never set `aria-label` on a button that already has visible text — it silently overrides the visible label for screen readers and creates a mismatch between what's seen and what's announced.

## Design notes

Concrete, observable values pulled from the fetched markup/code (not paraphrased):

- **Sizes:** three named sizes appear for standard buttons — `small`, default (unlabeled, i.e. medium), `large`. Icon-only (`svgOnly`) buttons additionally support a fourth, smaller size: `tiny`. No literal pixel dimensions were present in the captured HTML/flight payload (Geist's actual px values live in the compiled component CSS, not in this page's JSON payload) — treat `tiny < small < medium(default) < large` as the confirmed ordinal scale and measure actual computed heights from a rendered instance before hardcoding px in our implementation.
- **Shapes:** `square`, `circle`, `rounded` are the three shape keywords seen. `circle` and `square` are used specifically for icon-only buttons; `rounded` is paired with the `shadow` boolean for a distinct "marketing CTA" look (fully pill/rounded corners + drop shadow), applied on the `secondary` variant in the demo.
- **Variants (visual role, from JSX `variant=` prop):** `default`, `secondary`, `tertiary`, `error`, `warning`. Five total. All five are shown at all three sizes in the "All Types and Sizes" comparison grid, confirming variant x size is a full cross-product, not size-restricted.
- **Color tokens referenced:** the only concrete design tokens visible in this page's captured payload come from the `CustomButton` example, using Vercel's CSS custom-property scheme: `var(--ds-blue-700)` (used for both `background` and `border` in `normal` and `active` states) and a raw hex `#0B7BFE` for the `hover` background (an accent blue distinct from the token, i.e. hover intentionally deviates from the flat `--ds-blue-700` token to a brighter blue). Foreground in all three states is flat white `#fff`. This confirms Geist's convention: `--ds-*` custom properties for the design-token layer, with escape hatches to raw hex for one-off brand buttons.
- **Icon package:** icons used in these examples (`IconArrowUp`, `IconArrowLeft`, `IconArrowRight`) come from a sibling package, `@vercel/geistcn-assets/icons`, separate from the component package `@vercel/geistcn/components`. Any reimplementation should keep icon assets similarly decoupled from the component library.
- **Fonts referenced in the surrounding page shell** (not the Button component itself, but the site's own type system, visible in the HTML `<head>`/font links): `Geist_Variable` (sans, variable font) and a `GeistPixel_*` family (`_Circle`, `_Grid`, `_Line`, `_Square`, `_Triangle` — decorative/pixel display cuts), loaded as `.woff2`. Not button-specific but confirms the base typeface family to match for pixel-closeness (`Geist_Variable`) if we're also matching the docs site chrome, not just the component.
- **Class-name conventions seen in the docs-site chrome** (for context, not the Button component itself): CSS module class hashes like `header-module__-YN6XW__header`, `grid-module__AMTIxG__grid` — confirms the docs site itself uses CSS Modules, not a token like `text-label-14` (no such utility class was found anywhere in this page's captured payload; Tailwind utility classes seen in the shell are generic layout ones like `flex items-center gap-4`, `bg-background-200`, `text-gray-1000`, `text-heading-16`, `border-gray-alpha-400` — these are Vercel's own internal Tailwind config classes for their docs site, not necessarily exposed as part of the public Button component API).
- **Motion/interaction behavior:** no explicit transition-duration or easing values were present in the captured JSON/HTML (Geist ships compiled CSS separately, referenced only as hashed `.css` chunk URLs like `/_next/static/immutable/chunks/0jn_xpwsg7r4o.css`, not inlined). The Best Practices text implies the only special-cased interaction state is `loading` (a distinct focusable, ARIA-busy-announcing state, not just a visual overlay) — no other timing/easing details were documented on this page. To get concrete `transition`/`ease` values you'd need to fetch and diff the compiled CSS chunk, which was out of scope for this headless HTML fetch.
- **Peek/default state:** the page's own frontmatter sets `peek: "button-sizes"`, meaning the "Sizes" demo (not the plain unnamed default preview) is the one Vercel treats as the component's canonical/anchor illustration for shared links and previews.

## Notes on capture completeness

- The page returned HTTP 200 and ~421KB — well-formed, no 404/redirect encountered; no slug variants were needed.
- All prose (frontmatter description, section headings, inline paragraph copy, and the full nine-item Best Practices list) was recovered verbatim from the Next.js RSC flight payload (`self.__next_f.push` chunks), not just the static HTML shell — the visible page text is client-hydrated from this payload, so a raw-HTML-only scrape would have missed most of it.
- 10 distinct JSX code examples were recovered in full (Sizes, All Types and Sizes, Shapes/icon-only, Prefix and suffix, Rounded, Loading, Disabled, Disabled variants, Link, Custom). No "Show code" toggle appears to have been missed — every `Preview` block in the payload had a matching `__rawString__` code block.
- One naming inconsistency worth flagging to the team before implementation: the Best Practices prose references a `type` prop (`type="secondary"`, `type="error"`) and a `typeName="submit"` prop for native form semantics, but every JSX code example instead uses `variant="secondary"` etc. and no example demonstrates `typeName` at all. This is either (a) stale prose that predates a prop rename from `type` to `variant`, or (b) `type` is a real alias not exercised in any shown example. Recommend verifying against the actual `@vercel/geistcn` package source (not available in this headless HTML fetch) before deciding what to name the equivalent prop in our own implementation.
- No sub-pages were linked or needed — this is a single component page. Sibling component pages exist in the same nav (Badge, Split Button, Menu, Tooltip, etc., referenced by Best Practices text) but were not fetched as part of this task.
- Concrete pixel sizes, radii, and CSS-level values (transitions, exact color scales beyond the two tokens seen in the `CustomButton` example) were not present in the captured JSON payload — they live in compiled, hashed CSS chunk files referenced only by URL, not inlined into this page's markup. Recommend a follow-up pass (rendering the page and inspecting computed styles, or fetching the linked CSS chunks directly) if pixel-exact sizing is required beyond what's captured here.
