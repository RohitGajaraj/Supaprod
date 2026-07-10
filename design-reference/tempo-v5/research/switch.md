# Switch

> "Choose between a set of options." (Vercel Geist, `/geist/switch`)

Note on naming: despite the name "Switch," this is NOT a boolean on/off toggle (that is Geist's separate `Toggle` component). Geist's `Switch` is a segmented, pill-style selector implemented with underlying radio semantics — pick exactly one option from a small (2-3) mutually exclusive set. Best practices explicitly tell you to reach for `Toggle` instead when you need true boolean on/off.

## Sections documented

Every section on the page, in order, each backed by a live demo + a "Show code" toggle:

- **Default** — a two-option `Switch` ("Source" / "Output") with one `SwitchControl` set to `defaultChecked`, demonstrating the baseline segmented-selector pattern and the `name` grouping prop.
- **Disabled** — the same two-option switch with both `SwitchControl`s marked `disabled`, showing the fully-disabled group state (disabling is applied per-control, not on the parent `Switch`, though in the example both controls are disabled together).
- **Sizes** — three `Switch` instances laid out side by side (row on larger viewports, column on small), one each for `size="small"`, the default (unset) size, and `size="large"`, showing the `size` prop's three-step scale applies at the `Switch` (parent) level.
- **Full width** — a single `Switch` stretched via `style={{ width: '100%' }}`, with its `SwitchControl`s set to `size="large"`, demonstrating the component fluidly fills a constrained/full-width container rather than sizing to content only.
- **Tooltip** — wraps each `SwitchControl` in a Geist `Tooltip` (`desktopOnly`, with a `text` label), for icon-only or ambiguous controls where a hover/focus tooltip should reinforce the option's meaning.
- **Icon** — three sizes (small/default/large) of a `Switch` whose `SwitchControl`s use `icon={<IconX />}` instead of (or alongside) `label`, sourced from `@vercel/geistcn-assets/icons` (e.g. `IconGridSquare`, `IconListUnordered`) — the icon-only control pattern.
- **Best Practices** — an accordion/list of usage, semantics, and accessibility guidance (see below).

## API

Package: `@vercel/geistcn/components`
Icons (optional, for icon controls): `@vercel/geistcn-assets/icons`

### Components

- **`Switch`** — the group/container. Props observed:
  - `name` (string) — groups the underlying radio inputs; required for correct mutual-exclusivity (see best practices).
  - `size` ("small" | default/unset | "large") — sets the scale for the whole group; the default size example passes no `size` prop at all, so `size` is optional and defaults to a mid/"default" size.
  - `style` (inline style object) — e.g. `style={{ width: '100%' }}` for full-width layouts.
  - Children: one or more `SwitchControl` (and optionally each wrapped in a `Tooltip`).

- **`SwitchControl`** — one selectable option/segment within a `Switch`. Props observed:
  - `label` (string) — the visible/accessible text for the option. Always required per best practices, even for icon-only controls (rendered visually hidden via `geist-sr-only` in that case).
  - `value` (string) — the option's value, e.g. `"source"` / `"output"`.
  - `defaultChecked` (boolean) — marks the initially-selected control (uncontrolled). Exactly one control in a group should carry this (or the controlled `checked` equivalent — not shown in these examples but implied by "or controlled `checked`" in best practices).
  - `disabled` (boolean) — disables that individual control.
  - `size` ("small" | default | "large") — can also be set per-control (seen in the Full width example, where each `SwitchControl` repeats `size="large"` alongside the parent not setting a `size`).
  - `icon` (ReactNode) — e.g. `icon={<IconGridSquare />}`, for icon-only or icon-plus-label controls.
  - `name` — also settable per-control in the Tooltip example (`name="tooltip"`), presumably overriding/mirroring the group's `name` for that radio input.

- **`Tooltip`** (composition partner, not part of Switch itself) — props observed in combination: `desktopOnly` (boolean), `text` (string). Wraps a single `SwitchControl` to add a hover/focus tooltip.

### Usage snippets

Default:
```tsx
import { Switch, SwitchControl } from '@vercel/geistcn/components';
import type { JSX } from 'react';

export function Component(): JSX.Element {
  return (
    <div className="flex relative min-w-px max-w-full flex-col items-start flex-1">
      <Switch name="default">
        <SwitchControl defaultChecked label="Source" value="source" />
        <SwitchControl label="Output" value="output" />
      </Switch>
    </div>
  );
}
```

Disabled:
```tsx
import { Switch, SwitchControl } from '@vercel/geistcn/components';
import type { JSX } from 'react';

export function Component(): JSX.Element {
  return (
    <div className="flex relative min-w-px max-w-full flex-col items-start flex-1">
      <Switch name="view-mode">
        <SwitchControl defaultChecked disabled label="Source" value="source" />
        <SwitchControl disabled label="Output" value="output" />
      </Switch>
    </div>
  );
}
```

Sizes:
```tsx
import { Switch, SwitchControl } from '@vercel/geistcn/components';
import type { JSX } from 'react';

export function Component(): JSX.Element {
  return (
    <div className="flex relative min-w-px max-w-full flex-col lg:flex-row lg:flex-wrap flex-1">
      <div className="flex relative min-w-px max-w-full flex-col items-start flex-1">
        <Switch name="sizes-small" size="small">
          <SwitchControl defaultChecked label="Source" value="source" />
          <SwitchControl label="Output" value="output" />
        </Switch>
      </div>

      <div className="flex relative min-w-px max-w-full flex-col items-start flex-1">
        <Switch name="sizes-default">
          <SwitchControl defaultChecked label="Source" value="source" />
          <SwitchControl label="Output" value="output" />
        </Switch>
      </div>

      <div className="flex relative min-w-px max-w-full flex-col items-start flex-1">
        <Switch name="sizes-large" size="large">
          <SwitchControl defaultChecked label="Source" value="source" />
          <SwitchControl label="Output" value="output" />
        </Switch>
      </div>
    </div>
  );
}
```

Full width:
```tsx
import { Switch, SwitchControl } from '@vercel/geistcn/components';
import type { JSX } from 'react';

export function Component(): JSX.Element {
  return (
    <Switch name="full-width" style={{ width: '100%' }}>
      <SwitchControl
        defaultChecked
        label="Source"
        size="large"
        value="source"
      />
      <SwitchControl label="Output" size="large" value="output" />
    </Switch>
  );
}
```

Tooltip:
```tsx
import { Switch, Tooltip, SwitchControl } from '@vercel/geistcn/components';
import type { JSX } from 'react';

export function Component(): JSX.Element {
  return (
    <div className="flex relative min-w-px max-w-full flex-col items-start flex-1">
      <Switch name="view-mode">
        <Tooltip desktopOnly text="View Source">
          <SwitchControl
            defaultChecked
            label="Source"
            name="tooltip"
            size="large"
            value="source"
          />
        </Tooltip>
        <Tooltip desktopOnly text="View Output">
          <SwitchControl
            label="Output"
            name="tooltip"
            size="large"
            value="output"
          />
        </Tooltip>
      </Switch>
    </div>
  );
}
```

Icon:
```tsx
import { Switch, SwitchControl } from '@vercel/geistcn/components';
import type { JSX } from 'react';
import {
  IconGridSquare,
  IconListUnordered,
} from '@vercel/geistcn-assets/icons';

export function Component(): JSX.Element {
  return (
    <div className="flex relative min-w-px max-w-full flex-col lg:flex-row lg:flex-wrap flex-1">
      <div className="flex relative min-w-px max-w-full flex-col items-start flex-1">
        <Switch name="icons-small" size="small">
          <SwitchControl
            defaultChecked
            icon={<IconGridSquare />}
            value="source"
          />
          <SwitchControl icon={<IconListUnordered />} value="output" />
        </Switch>
      </div>

      <div className="flex relative min-w-px max-w-full flex-col items-start flex-1">
        <Switch name="icons-default">
          <SwitchControl
            defaultChecked
            icon={<IconGridSquare />}
            value="source"
          />
          <SwitchControl icon={<IconListUnordered />} value="output" />
        </Switch>
      </div>

      <div className="flex relative min-w-px max-w-full flex-col items-start flex-1">
        <Switch name="icons-large" size="large">
          <SwitchControl
            defaultChecked
            icon={<IconGridSquare />}
            value="source"
          />
          <SwitchControl icon={<IconListUnordered />} value="output" />
        </Switch>
      </div>
    </div>
  );
}
```

## Best practices

Paraphrased from the page's Best Practices list:

- Reach for `Switch` when you need a segmented selector between 2-3 mutually exclusive views of the same surface (their example: "Source" vs "Output"), not for a general-purpose control.
- For a simple boolean on/off setting, use `Toggle` instead — `Switch` carries radio semantics under the hood, so it models "exactly one of N" rather than a single checkbox-like state.
- Once you're past three options, or once labels grow longer than a couple of words, move to `Tabs` or a `Select` — `Switch` is not meant to scale past a small, short-label set.
- Always set a `name` on the `Switch` group. Without it, the underlying radio inputs aren't grouped, and more than one control can end up visually/semantically selected at once.
- Give exactly one `SwitchControl` in the group an initial selected state — `defaultChecked` uncontrolled, or a controlled `checked` — so the group never renders with no defined selection.
- Size every `SwitchControl` to accommodate the widest label in the set up front. The selected-state pill should not resize when the user switches options, so test with your longest real copy before shipping.
- Use Title Case, short (one-to-two word), and grammatically parallel labels across controls — their example contrasts a good pair ("Source" / "Output") against a bad one ("Source" / "Show output").
- Never skip the `label` prop, even on icon-only controls — it's what a screen reader announces. The component visually hides it (via a `geist-sr-only`-style utility class) rather than dropping it, so icon-only controls stay accessible.
- When shipping icon-only controls, also wrap each one in a `Tooltip` so sighted users get the same identifying text that assistive tech already receives from the hidden label.

## Design notes

- **Composition shape**: `Switch` (group/radio-group root) wraps one or more `SwitchControl` (individual radio-like segment); `Tooltip` is an optional wrapper per-control, not part of the Switch API itself.
- **Sizes**: a 3-step scale — `size="small"`, default/unset (implied "medium"), `size="large"` — settable on the `Switch` parent (applies to the whole group) and/or overridden per `SwitchControl` (seen in the Full width and Tooltip examples, where the parent has no explicit `size` but every child control repeats `size="large"`). No literal pixel dimensions are exposed in the page's own markup/CSS (the compiled `@vercel/geistcn` component's internal styles aren't inlined into this doc page) — treat the three sizes as small / medium(default) / large and calibrate against Geist's other small/default/large controls (commonly ~28-32px / ~32-36px / ~36-40px height bands in Geist's system) when re-implementing, then verify visually against the live Vercel site.
- **Selection state rendering**: behaves like a pill/segmented control — an active "thumb" or filled background tracks the selected `SwitchControl` and should animate/slide between options on selection change (implied by the "pill resizing on selection" best-practice warning about padding), though the exact easing/duration isn't stated on the page.
- **Accessibility model**: implemented as a radio group (`Switch` = group, `SwitchControl` = radio option) rather than ARIA `switch`/checkbox roles, despite the "Switch" name — grouping is done via a shared `name` on the underlying inputs.
- **Icon-only accessibility**: icon-only controls still render a `label`, hidden with a screen-reader-only utility class (`geist-sr-only`) rather than omitted, confirming Geist's convention of always emitting an accessible name even when visually suppressed.
- **No exposed color/token names**: unlike some other Geist component pages, no `--ds-*` custom-property names, `material-*` classes, or `text-label-*` typography classes appear in this page's own HTML/flight payload — the demo wrapper only contributes generic Tailwind layout utility classes (`flex`, `flex-col`, `items-start`, `flex-1`, responsive `lg:flex-row lg:flex-wrap`) around the component; the component's internal visual tokens live inside the compiled `@vercel/geistcn` package and were not observable from the page source alone.
- **Responsive demo layout only** (not component behavior): the Sizes/Icon demo wrappers stack vertically on small viewports and go row + wrap (`lg:flex-row lg:flex-wrap`) on large viewports — this is the doc page's own preview layout, not a prop of `Switch`.

## Notes

- Fetch succeeded on first try (`https://vercel.com/geist/switch`, ~271KB HTML, no 404/slug variant needed).
- Page title / meta description confirm: title "Switch", description "Choose between a set of options."
- All 6 demo sections' code examples were fully recovered via the Next.js flight payload's `__rawString__` fields (the exact pre-highlighted source, not reconstructed from syntax-highlighting spans) — high confidence these are byte-exact to what's behind each "Show code" toggle.
- No linked sub-pages or additional variants were referenced from this component's content (only the global left-nav component list, which is out of scope).
- The component's actual internal CSS/tokens (pill thumb size, radii, exact px heights per size step, colors, transition timing) are NOT present in the page's server-rendered payload — they live inside the compiled `@vercel/geistcn` npm package. To get exact pixel/token values, either inspect the live rendered DOM in a browser (computed styles) or unpack the `@vercel/geistcn` package's source/CSS directly; this fetch only covers the documentation page's textual and code content.
