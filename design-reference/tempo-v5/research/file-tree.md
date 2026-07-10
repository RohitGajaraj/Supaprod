# File Tree

> "Display a hierarchical directory structure with expandable folders and files, useful for illustrating project layouts."

Source: https://vercel.com/geist/file-tree (Geist Design System, Vercel). Fetched headlessly (curl + Next.js flight-payload decode), no browser used.

## Sections documented

The page is minimal — a single demo, no variant grid and no Best Practices accordion were present in the server-rendered payload:

- **Default** — the only demo section. Renders a nested `Tree` showing a Vercel build-output layout: `.vercel/output/functions/edge.func/` (four levels of nested `Folder`s, all `defaultOpen`) containing `.vc-config.json` (with an `href`) and `index.js`, plus a sibling top-level `app` folder (collapsed, no `defaultOpen`) containing three `File` entries typed as `edge-function`, `lambda`, and `middleware`.
- **"Show code"** toggle under the demo, revealing the JSX source (captured in full below).
- **Feedback strip** — "Was this helpful?" with Send action (generic to all Geist pages, not component-specific content).
- **Prev/Next component nav** — Previous: Fieldset, Next: Gauge (confirms File Tree's position in the Components sidebar list, alphabetical between Fieldset and Gauge).

No "Sizes," "Types," "Variants," "States," or "Best Practices" sections exist on this page — the component doc is a single default example only.

## API

Import path and components used in the example:

```tsx
import { Tree, Folder, File } from '@vercel/geistcn/components';
import type { JSX } from 'react';

export function Component(): JSX.Element {
  return (
    <Tree>
      <Folder name=".vercel" defaultOpen>
        <Folder name="output" defaultOpen>
          <Folder name="functions" defaultOpen>
            <Folder name="edge.func" defaultOpen>
              <File name=".vc-config.json" href="/" />
              <File name="index.js" />
            </Folder>
          </Folder>
        </Folder>
      </Folder>
      <Folder name="app">
        <File name="main.tsx" type="edge-function" />
        <File name="dashboard.tsx" type="lambda" />
        <File name="dashboard.tsx" type="middleware" />
      </Folder>
    </Tree>
  );
}
```

Composition / subcomponents observed:

- **`Tree`** — root container; wraps one or more top-level `Folder`/`File` nodes. No props visible beyond `children`.
- **`Folder`** — recursive container node.
  - `name` (string, required) — the folder label, e.g. `".vercel"`, `"output"`, `"app"`.
  - `defaultOpen` (boolean prop, shorthand `defaultOpen`) — when present, the folder renders expanded on initial mount. Omitting it (as on the `app` folder) renders it collapsed by default — this is the toggle that drives the "expandable folders" behavior called out in the one-liner.
  - `children` — nested `Folder` and/or `File` elements; folders can nest arbitrarily deep (four levels deep in the example).
- **`File`** — leaf node.
  - `name` (string, required) — file label, including dotfiles (`.vc-config.json`) and extensions (`index.js`, `main.tsx`).
  - `href` (string, optional) — makes the file entry a link (example sets it to `"/"`, i.e., a placeholder/demo href — real usage would point at a file's location, likely a repo blob URL or in-app route).
  - `type` (string enum, optional) — semantic file-type tag used only on the `app` folder's children in the example, with three observed values: `"edge-function"`, `"lambda"`, `"middleware"`. Reads as a Vercel-deployment-specific classification (likely drives an icon/badge per type) rather than a generic file-type enum — treat these three as the only confirmed values; there may be more not shown on this page.

No props table was present in the fetched payload (Geist's props tables, where present on other component pages, are generated separately and were not part of this page's default-open content) — the prop set above is inferred solely from the one example's attribute usage, so treat it as a minimum confirmed set, not necessarily exhaustive.

## Best practices

None were present on the page — no "When to use / Behavior / Accessibility" accordion rendered in the fetched HTML/flight payload for this component (unlike richer Geist component pages). Do not fabricate guidance; if best-practice copy is needed, source it from a live browser render of the page (it may be a client-only reveal) or from behaviorally-similar Geist components (e.g. Collapse, Command Menu) as an approximation.

## Design notes

- **Nesting depth**: the example nests folders four levels deep (`.vercel` > `output` > `functions` > `edge.func`) — implies the component supports (and is demoed at) real-world deep nesting, not just one level.
- **Default expansion state is per-node, not global**: each `Folder` independently opts into `defaultOpen`; the top-level `app` folder is deliberately left collapsed alongside an all-open `.vercel` branch — shows the tree can mix expanded and collapsed subtrees simultaneously in one view.
- **Dotfile/dotfolder support**: `.vercel` and `.vc-config.json` render with no special-casing needed in the API — names are passed through verbatim as strings, so the component doesn't require extension metadata to render a leading-dot name correctly.
- **Type tagging is opt-in and file-specific**: only `File` nodes in the `app` folder carry `type`; the `.vercel` branch's `File` nodes have no `type`. This suggests `type` is optional/purely additive (likely renders a small icon or label per type) rather than required for baseline rendering.
- **Link-capable leaves**: `File` supports `href`, implying the rendered file row can act as an anchor (e.g. clicking `.vc-config.json` could navigate to view that file) — independent of `type`.
- **Syntax theme captured from the code sample**: the rehype-pretty-code block was rendered with `data-theme="light"` using a GitHub-light-like palette — keywords (`import`, `from`, `export`, `function`, `type`) in `#D73A49` (red), plain punctuation/identifiers in `#24292E` (near-black), string literals in `#032F62` (dark blue), and type/component identifiers (`Tree`, `Folder`, `File`, `Component`, `JSX`) in `#6F42C1` (purple) / `#005CC5` (blue) depending on token role. These are Shiki/rehype-pretty-code token colors, not Geist component tokens per se, but useful if replicating the docs' own code-block styling.
- No numeric sizing (row height, indent width, icon size), radius, or `--ds-*`/`material-*` token names were present in the fetched payload — the actual `Tree`/`Folder`/`File` component implementation (which would carry those values) lives in the `@vercel/geistcn/components` package source, not in this docs page's HTML. A pixel-exact rebuild will need either that package's source/CSS or a live browser inspection of the rendered demo's computed styles.
