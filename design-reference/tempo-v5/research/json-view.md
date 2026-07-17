# JSON View

> "Render JSON objects and arrays as a collapsible tree with syntax coloring, keyboard navigation, search highlighting, and selectable text."

Source: https://vercel.com/geist/json-view

## Sections documented

- **Default** — `JsonView` rendering a plain object with `defaultExpandDepth={1}`. Copy: "JSON View expands levels strictly below `defaultExpandDepth`. Use `defaultExpandDepth={1}` when the first level helps users scan the object without opening every nested value." Demonstrates the baseline tree: keys, nested objects, arrays, primitives (string/number/boolean/null).
- **Collapsed** — Same component with `defaultExpandDepth={0}` (root starts fully collapsed). Copy: "Use `defaultExpandDepth={0}` when the surrounding surface needs to stay compact and users can choose which object to inspect." Demonstrates a dense/compact usage (e.g. inside a table row or list item).
- **Highlighted** — `JsonView` combined with `makeJsonViewHighlightPattern` to drive `highlightPattern`, simulating an active search state that highlights matching keys/values (e.g. matches on `"request"` and `"failed"` in an error payload). Copy: "Use `makeJsonViewHighlightPattern` to build the `highlightPattern` prop from search terms. The pattern highlights matching field names and primitive values."
- **Best Practices** — accordion with three subsections: "When to use", "Behavior", "Accessibility" (full text captured below).

Only these three interactive demos exist on the page (no separate Sizes/Types/Variants/States sections) — JSON View has a single visual style, varied only by expand-depth and highlight state.

## API

Package: `@vercel/geistcn/components`

```tsx
import { JsonView } from "@vercel/geistcn/components";
```

### `JsonView` props seen in examples

- `data` — the JSON value to render. Must be a live JS object/array, **not** a pre-stringified JSON string (per Behavior guidance).
- `defaultExpandDepth` — `number`. Controls how many levels are expanded on mount; nodes strictly below this depth start collapsed. Values observed: `0` (fully collapsed root) and `1` (top level open, nested objects/arrays collapsed).
- `highlightPattern` — the return value of `makeJsonViewHighlightPattern(...)`; when set, matching keys/values are visually highlighted (search-match state). Omit / pass `null` when there is no active search.

### `makeJsonViewHighlightPattern(terms: string[])`

Helper exported alongside `JsonView` from the same package. Takes an array of search term strings and returns a pattern object consumable by `JsonView`'s `highlightPattern` prop.

```tsx
import { JsonView, makeJsonViewHighlightPattern } from "@vercel/geistcn/components";
```

### Composition patterns (verbatim minimal usage from the three demos)

**1. Default (expand depth 1)**

```tsx
import { JsonView } from "@vercel/geistcn/components";
import type { JSX } from "react";

const data = {
  deployment: {
    id: "dpl_9WjH8QFQySx7",
    project: "docs",
    target: "production",
    state: "ready",
  },
  request: {
    method: "GET",
    path: "/api/search",
    status: 200,
    durationMs: 42,
  },
  cached: false,
  error: null,
};

export function Component(): JSX.Element {
  return <JsonView data={data} defaultExpandDepth={1} />;
}
```

**2. Collapsed (expand depth 0)**

```tsx
import { JsonView } from "@vercel/geistcn/components";
import type { JSX } from "react";

const data = {
  trace: {
    spanId: "span_7Qk9b4",
    parentId: "span_root",
    service: "api",
  },
  request: {
    id: "req_00042",
    path: "/api/projects",
    method: "GET",
  },
  flags: ["enable-logs-json-rendering", "observability-panel"],
};

export function Component(): JSX.Element {
  return <JsonView data={data} defaultExpandDepth={0} />;
}
```

**3. Highlighted (search-match state)**

```tsx
import { JsonView, makeJsonViewHighlightPattern } from "@vercel/geistcn/components";
import type { JSX } from "react";

const data = {
  level: "error",
  requestId: "req_00042",
  deploymentId: "dpl_9WjH8QFQySx7",
  message: "Deployment request failed",
  statusCode: 500,
};

const highlightPattern = makeJsonViewHighlightPattern(["request", "failed"]);

export function Component(): JSX.Element {
  return <JsonView data={data} defaultExpandDepth={1} highlightPattern={highlightPattern} />;
}
```

Note: every example data set is styled as a Vercel-platform-flavored payload (deployment/trace/request objects with ids like `dpl_...`, `span_...`, `req_...`) — a deliberate documentation convention worth mirroring in our own examples (use Supaprod-flavored ids instead, e.g. `mission_...`, `agent_...`).

## Best practices (paraphrased)

**When to use**

- Reach for JSON View whenever a user needs to actually work with a JSON value — scan it, expand/collapse nested parts, select a node, or copy text out of it — not just glance at it once.
- It beats a plain stringified JSON blob whenever nesting matters, or when a log line carries a structured payload the user might drill into.
- If the JSON is static, illustrative documentation content rather than a live, inspectable product value, use a plain code block instead — JSON View is for interactive data, not doc snippets.

**Behavior**

- Default to `defaultExpandDepth={1}` on any log/detail surface — showing the top-level keys immediately gives users useful context without forcing them to open every field.
- Drop to `defaultExpandDepth={0}` when JSON View sits inside something already dense (a table cell, a compact preview row) so the collapsed tree doesn't crowd out the row's primary content; let the user opt into expanding it.
- Only supply `highlightPattern` while a search is actually active. When there's nothing being searched, leave it unset/`null` rather than passing an empty or stale pattern.
- Always hand `data` a real object/array. Don't `JSON.stringify` it first — the component owns the traversal and formatting itself.

**Accessibility**

- The tree is keyboard-navigable: arrow keys move focus between visible nodes, Enter/Space toggle an expandable node open or closed, and Home/End jump to the first/last visible node.
- The tree's accessible name is literally "JSON" — so don't rely on the component to self-describe; place it directly under the heading/label/control that identifies what the JSON actually represents (e.g. "Response body", "Deployment record").
- Text inside the tree stays selectable — this matters because a common real use is copying a value straight out of a log or trace into another tool (search, a bug report, a support ticket), so never intercept or block native text selection inside it.

## Design notes

- **Rendering approach**: renders as an ARIA tree (keyboard semantics match a tree widget — arrow/Home/End navigation, Enter/Space to toggle), not a plain `<pre>` block; nodes are individually focusable/selectable.
- **Syntax coloring**: the surrounding code-sample highlighter in the docs uses a light theme (`data-theme="light"`) token set — string literals `#032F62`, keywords (`import`/`from`/`type`/`const`) `#D73A49`, plain punctuation/identifiers `#24292E`, and a distinct blue `#005CC5` for a bound `const` identifier — and a separate dark theme set (`data-theme="dark"`) with keywords `#F97583`, plain text `#E1E4E8`, strings `#9ECBFF`. These are Shiki/rehype-pretty-code token colors for the _documentation's own code blocks_, not necessarily JSON View's internal value-coloring tokens, but they establish the same red-keyword/blue-string/gray-punctuation convention Geist uses everywhere and is a reasonable default if JSON View's own internal syntax coloring for keys/strings/numbers/booleans isn't independently discoverable from static markup.
- **Two states, one visual system**: the component doesn't have separate "sizes" or "variants" — its only documented axes of variation are (a) initial expand depth (`0` vs `1`, i.e. collapsed vs one level open) and (b) presence/absence of an active `highlightPattern` (search-match emphasis on specific keys/values). Build the component around those two state dimensions rather than inventing additional size/variant props.
- **Package path**: components ship from `@vercel/geistcn/components` (the shadcn-style "geistcn" distribution), consistent with other Geist components — not a `@vercel/geist` runtime package.
- **Data contract**: `data` prop is a live JS value (object/array), never a JSON string — the component performs its own traversal/rendering, so no client-side `JSON.parse`/`JSON.stringify` round-trip should sit between application state and the component.
- **Motion**: no motion/transition behavior was described in the captured text (no accordion-slide or fade language) — treat expand/collapse as instant/native for our port unless a later visual pass says otherwise.

## Notes / gaps

- The page's demo previews (`Preview` component instances) are hydrated client components — their live rendered pixel output (colors used _inside_ the tree itself for keys/strings/numbers/booleans, exact indentation, node spacing, expand-icon glyph) is not present in the static/flight-payload HTML and could not be captured headlessly. Only the three JSX usage snippets and their surrounding prose were recoverable.
- No formal props table was present on the page (Geist's docs site does not render one for this component) — the prop list above is inferred entirely from the three code examples plus the Behavior bullets; there may be additional undocumented props (e.g. size, className passthrough) not exercised by any example.
- No "Sizes", "Types", "Variants", or "States" sections exist for this component — confirmed by enumerating every `l.h2` heading on the page (`Default`, `Collapsed`, `Highlighted`, `Best Practices` only).
- No sub-pages or "See also" links specific to JSON View were found; the header's global component list was captured only to confirm this component's canonical name ("JSON View") and slug.
