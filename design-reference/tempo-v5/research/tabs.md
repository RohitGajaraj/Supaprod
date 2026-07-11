# Tabs

> "Display tab content."

Source: https://vercel.com/geist/tabs (Vercel Geist Design System)

## Sections documented

- **Default** — baseline `Tabs` usage with three plain-text tabs (Apple / Orange / Mango), controlled via `selected` + `setSelected` state.
- **Disabled** — the whole `Tabs` control disabled at once via a top-level `disabled` prop (all three tabs non-interactive).
- **Disable specific tabs** — per-tab disabling: one tab (`mango`) carries `disabled: true` plus a `tooltip` string explaining why it's disabled, while the other tabs stay active.
- **With icons** — each tab entry carries an `icon` node (brand logos: GitHub, GitLab, Bitbucket) alongside its title; shows icon + label composition and that icon components can take their own props (e.g. `colored`).
- **Secondary** — same three tabs (GitHub/GitLab/Bitbucket, one disabled) rendered with `variant="secondary"` to show the alternate visual style; default variant is implicitly "primary"/unstyled-prop.
- **Best Practices** (accordion, three sub-groups: When to use / Behavior / Content / Accessibility — see below).

## API

Import:

```tsx
import { Tabs } from "@vercel/geistcn/components";
```

Component: **`Tabs`** (single exported component, no separate `TabsList`/`TabsTrigger`/`TabsContent` subcomponents shown — Geist's `Tabs` is a self-contained tab-strip control, not a compound-component pattern like Radix's).

### Props observed

| Prop          | Type (inferred)                                       | Notes                                                               |
| ------------- | ----------------------------------------------------- | ------------------------------------------------------------------- |
| `selected`    | `string`                                              | currently active tab's `value`, externally controlled               |
| `setSelected` | `(value: string) => void`                             | callback invoked with the clicked tab's `value`; wire to `useState` |
| `tabs`        | `Array<{ title, value, icon?, disabled?, tooltip? }>` | ordered list of tab definitions                                     |
| `disabled`    | `boolean`                                             | top-level — disables the entire control                             |
| `variant`     | `"secondary"` (enum, default presumably `"primary"`)  | only `"secondary"` value shown in examples                          |

### `tabs[]` entry shape

| Field      | Type                   | Notes                                                                                                                        |
| ---------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `title`    | `string`               | visible label, Title Case per best practices                                                                                 |
| `value`    | `string`               | identity used by `selected` / `setSelected`                                                                                  |
| `icon`     | `ReactNode` (optional) | e.g. `<LogoIconGithubSvg />`, `<LogoIconBitbucket colored />` — icon components imported from `@vercel/geistcn-assets/logos` |
| `disabled` | `boolean` (optional)   | disables just this one tab                                                                                                   |
| `tooltip`  | `string` (optional)    | shown on hover for a disabled tab, explaining the constraint                                                                 |

### Usage snippets (as shown, minimal each)

**Default:**

```tsx
import { Tabs } from "@vercel/geistcn/components";
import { useState, type JSX } from "react";

export function Component(): JSX.Element {
  const [selected, setSelected] = useState("apple");
  return (
    <Tabs
      selected={selected}
      setSelected={(t) => setSelected(t)}
      tabs={[
        { title: "Apple", value: "apple" },
        { title: "Orange", value: "orange" },
        { title: "Mango", value: "mango" },
      ]}
    />
  );
}
```

**Disabled (whole control):**

```tsx
<Tabs
  disabled
  selected={selected}
  setSelected={(t) => setSelected(t)}
  tabs={[
    { title: "Apple", value: "apple" },
    { title: "Orange", value: "orange" },
    { title: "Mango", value: "mango" },
  ]}
/>
```

**Disable specific tab + tooltip:**

```tsx
<Tabs
  selected={selected}
  setSelected={(t) => setSelected(t)}
  tabs={[
    { title: "Apple", value: "apple" },
    { title: "Orange", value: "orange" },
    {
      title: "Mango",
      value: "mango",
      disabled: true,
      tooltip: "Mangos are not allowed",
    },
  ]}
/>
```

**With icons:**

```tsx
import { Tabs } from "@vercel/geistcn/components";
import {
  LogoIconBitbucket,
  LogoIconGithubSvg,
  LogoIconGitlabSvg,
} from "@vercel/geistcn-assets/logos";
import { useState, type JSX } from "react";

export function Component(): JSX.Element {
  const [git, setGit] = useState("github");
  return (
    <Tabs
      selected={git}
      setSelected={(t) => setGit(t)}
      tabs={[
        { title: "GitHub", value: "github", icon: <LogoIconGithubSvg /> },
        { title: "GitLab", value: "gitlab", icon: <LogoIconGitlabSvg /> },
        {
          title: "Bitbucket",
          value: "bitbucket",
          icon: <LogoIconBitbucket colored />,
        },
      ]}
    />
  );
}
```

**Secondary variant:**

```tsx
<Tabs
  selected={git}
  setSelected={(t) => setGit(t)}
  tabs={[
    { title: "GitHub", value: "github" },
    { title: "GitLab", value: "gitlab" },
    { title: "Bitbucket", value: "bitbucket", disabled: true },
  ]}
  variant="secondary"
/>
```

## Best practices

**When to use**

- Use Tabs to switch between sibling views that live inside one page and share the same scope/URL parent/data model (e.g. Overview / Logs / Settings on one entity's detail page).
- Don't use Tabs for navigation between genuinely unrelated pages — that's what a sub-menu is for; Tabs implies shared context, not just visual grouping.
- Keep a Tabs row to at most 5-7 items on desktop and 3-4 on mobile; beyond that, consolidate views or move the long tail into a `Menu`.

**Behavior**

- Tab switches must feel instant — no network round-trip confirmation, no toast, on tab change.
- Sync the active tab into the URL (query param or path segment) so a deep link or a page refresh restores the previously selected tab.
- Only disable an individual tab for a real permission or empty-state reason, and always pair a disabled tab with a tooltip naming the constraint (never disable silently).

**Content**

- `tabs[].title` is Title Case, one to two words, and names the destination as a noun (Overview, Logs, Settings) — verbs belong on buttons, not tabs (e.g. "View Logs" is wrong for a tab label).
- `tabs[].tooltip` is sentence case and explains the constraint causing the disabled state (e.g. "Only visible to project owners"), not a restatement of what the tab does.
- Don't bolt a count onto the title (e.g. "Logs (12)"); use a dedicated badge slot instead, and hide the badge entirely at zero.

**Accessibility**

- Left/Right arrow keys move focus across the tab strip; Enter/Space activates the focused tab — don't override this with app-level global shortcuts.
- Give the tablist an `aria-label` (e.g. `aria-label="Sections"`) whenever there's no visible heading directly above it.
- Keep a visible focus ring on the active/focused tab at all times; never strip focus styling purely for visual cleanliness.

## Design notes

- Composition is a single flat `Tabs` component driven by a `tabs` array prop, not a Radix-style compound API (`Tabs.Root`/`Tabs.List`/`Tabs.Trigger`/`Tabs.Content`) — content panels are the caller's responsibility; Geist's `Tabs` only renders and manages the tab strip/selector itself.
- State is fully externally controlled (`selected` + `setSelected`), no internal uncontrolled mode demonstrated.
- Two variants confirmed: default (unnamed/primary) and `"secondary"` — the secondary variant is demoed with the same tab set, implying a lighter/alternate visual treatment (exact colors not resolved client-side in the static payload; likely a filled-pill vs. underline-style distinction typical of Geist tab strips).
- Disabling operates at two levels: whole-control (`disabled` boolean on `Tabs`) and per-tab (`disabled: true` inside a `tabs[]` entry), with per-tab disabling expected to carry a `tooltip`.
- Icons are passed as raw `ReactNode` (imported SVG icon components from `@vercel/geistcn-assets/logos`), not an icon-name string — so any icon library/component can be slotted in, including ones taking their own props (`colored` on `LogoIconBitbucket`).
- Page-level design tokens observed in the surrounding site chrome (not confirmed as Tabs-specific, since the interactive demo itself renders client-side and its component-scoped classnames weren't present in the static HTML/flight payload): `--ds-gray-100` through `--ds-gray-1000`, `--ds-gray-alpha-100/200/400/500/600`, `--ds-background-100`, `--ds-blue-300/700/900`, `--ds-amber-800`, `--ds-focus-color`, `--ds-focus-ring`, `--ds-shadow-border`, `--ds-shadow-border-small`, `--ds-size-medium`. Treat these as the general Geist token vocabulary this component would draw from (focus ring, gray scale for inactive/active tab text, background surface, size scale) rather than confirmed exact values for Tabs.
- Demo section anchors in the page's internal data used the slugs `tabs-default`, `tabs-disabled`, `tabs-disabled-specific`, `tabs-with-icons`, `tabs-secondary` — useful as a naming convention reference for storybook/demo IDs.
- No explicit pixel sizes, radii, or per-state color mappings were exposed in the static payload for this specific component (the actual `Tabs` implementation lives in a separately-loaded JS chunk, `1knmr6-w9pwqs.js` and related chunk hashes, not inlined as readable source). Recommend cross-checking the rendered page visually or via computed styles if pixel-exact values are needed later.
