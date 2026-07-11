# Code Block

> "Code Block component used across Vercel and Next.js."

## Sections documented

- **Default** — a filename-headed, syntax-highlighted block (`Table.jsx`, `jsx` language) with a copy-to-clipboard button in the header. This is the baseline anatomy: header bar (dot/file icon + filename + copy button) over a `<pre>`/`<code>` body with gutter line numbers.
- **No filename** — same block with no `filename` prop passed; the header row and its icon/label are omitted entirely (not just hidden), so the copy button sits alone, floating over the code area rather than in a header bar.
- **Highlighted lines** — demonstrates `highlightedLinesNumbers` (e.g. lines 1 and 4 lit) to draw attention to specific lines without adding/removing anything.
- **Added & removed lines** — demonstrates `addedLinesNumbers` / `removedLinesNumbers` (diff-style green/red line treatment) shown against a `next.config.js` example, independent of the `diff` language grammar.
- **Referenced lines** — "You can link to lines. Just press on any line number." Every line number is a clickable button that writes a line-anchor into the URL (id pattern `C<hash>-L<n>`), for deep-linking to a specific line.
- **Language switcher** — demonstrates the `switcher` prop: a dropdown/select control in the toolbar that swaps between multiple language variants of the same example (JavaScript / TypeScript / Next.js / Lua in the demo), each with its own `code`, `filename`, and `language`.
- **Language switcher with tabs** — "Use the `tabs` prop for a tabbed language switcher instead of the default select." Same multi-language pattern as `switcher`, rendered as tabs instead of a dropdown.
- **Hidden line numbers** — demonstrates `hideLineNumbers`; the gutter numbers and their anchor buttons are removed from the DOM entirely, not just visually hidden.
- **Open in v0** — "Use the `v0` prop to add an Open in v0 action to the toolbar." Adds a v0 action button to the block's footer bar; two modes shown, `v0="ask"` and `v0="build"`, both demoed together in one example.
- **Best Practices** — an accordion of prose guidance in three parts: When to use, Behavior, Content (see below).

## API

Import:

```jsx
import { CodeBlock } from "@vercel/geistcn/components";
```

### `<CodeBlock>` props observed across examples

- `children` (required) — the raw code string to render/highlight.
- `aria-label` (string, required in every example) — accessible name for the block, e.g. `"Hello world"`.
- `language` (string) — grammar/highlighting language: `"jsx"`, `"tsx"`, `"next"`, `"lua"` all appear.
- `filename` (string, optional) — shown in the header bar with a small dot/file icon (e.g. `"Table.jsx"`, `"next.config.js"`, `"bloom-filter.lua"`, `"highlighted.jsx"`, `"hidden-line-numbers.jsx"`). Omitting it removes the whole header row, not just the label.
- `highlightedLinesNumbers` (number[]) — array of 1-indexed line numbers to visually emphasize, e.g. `[1, 4]`.
- `addedLinesNumbers` (number[]) — line numbers to mark as added (diff-green), e.g. `[5]`.
- `removedLinesNumbers` (number[]) — line numbers to mark as removed (diff-red), e.g. `[2, 3, 4]`.
- `hideLineNumbers` (boolean) — removes the line-number gutter (and its anchor buttons) entirely.
- `switcher` ({ options, value, onChange }) — renders a select-style language switcher in the header.
  - `options`: `{ label: string; value: string }[]`
  - `value`: current selected value (controlled)
  - `onChange`: `(value) => void`
- `tabs` (same shape as `switcher`: `{ options, value, onChange }`) — renders a tab-style language switcher instead of a select.
- `v0` (`"ask" | "build"`) — adds a v0 action to a footer bar under the code.
  - `"ask"` renders a single link/button labeled "Ask" (sr-only "Ask v0") that opens `https://v0.app/chat?q=<explain-the-code prompt>` in a new tab. The prefilled prompt is a fixed template: "Answer the following question or explain what the code does: <code>" followed by ~10 numbered instructions telling v0 to explain rather than implement.
  - `"build"` renders a primary "Open in v0" button plus an adjoining menu-button (split button, `aria-haspopup="true"`) that opens `https://v0.app/chat?q=<build-an-example prompt>` — prompt template: "Create a minimal example app for this code: <code>".

### Minimal usage patterns

```jsx
// Default
const code = `function MyComponent(props) {
  return (
    <div>
      <h1>Hello, {props.name}!</h1>
      <p>This is an example React component.</p>
    </div>
  );
}`;

export function Component() {
  return (
    <CodeBlock aria-label="Hello world" filename="Table.jsx" language="jsx">
      {code}
    </CodeBlock>
  );
}
```

```jsx
// No filename
<CodeBlock aria-label="Hello world" language="jsx">
  {code}
</CodeBlock>
```

```jsx
// Highlighted lines
<CodeBlock
  aria-label="Hello world"
  filename="highlighted.jsx"
  highlightedLinesNumbers={[1, 4]}
  language="jsx"
>
  {code}
</CodeBlock>
```

```jsx
// Added & removed lines
<CodeBlock
  aria-label="Hello world"
  filename="next.config.js"
  addedLinesNumbers={[5]}
  removedLinesNumbers={[2, 3, 4]}
  language="jsx"
>
  {code}
</CodeBlock>
```

```jsx
// Hidden line numbers
<CodeBlock
  aria-label="Hello world"
  filename="hidden-line-numbers.jsx"
  hideLineNumbers
  language="jsx"
>
  {code}
</CodeBlock>
```

```jsx
// Language switcher (select)
const languages = [
  { label: "JavaScript", value: "js" },
  { label: "TypeScript", value: "ts" },
  { label: "Next.js", value: "next" },
  { label: "Lua", value: "lua" },
];

const [language, setLanguage] = useState("js");

<CodeBlock
  aria-label="Hello world"
  filename="language-switcher.jsx"
  language="jsx"
  switcher={{
    options: languages,
    value: language,
    onChange: (l) => setLanguage(l),
  }}
>
  {code}
</CodeBlock>;
```

```jsx
// Language switcher with tabs — identical shape, swap `switcher` for `tabs`
<CodeBlock
  aria-label="Hello world"
  filename="language-switcher.tsx"
  language="tsx"
  tabs={{ options: languages, value: language, onChange: (l) => setLanguage(l) }}
>
  {codeTs}
</CodeBlock>
```

```jsx
// Open in v0
<CodeBlock aria-label="Hello world" filename="Table.jsx" language="jsx" v0="ask">
  {code}
</CodeBlock>
<CodeBlock aria-label="Hello world" filename="Table.jsx" language="jsx" v0="build">
  {code}
</CodeBlock>
```

### Composition / sibling components referenced in the docs (not this component, but named as the decision boundary)

- `<Code>` ("Inline Code") — for a single inline token (env var, function name, file path) inside prose; use instead of `<CodeBlock>` for one word/token.
- `<Snippet>` — for a copy-to-clipboard shell command or a one-line key reveal; ships with its own prompt glyph (`$`) and copy affordance, so callers should not prepend `$` themselves.

## Best practices

**When to use**

- Reach for `<CodeBlock>` only for multi-line, syntax-highlighted source meant to be scanned or copy-pasted as a unit.
- A lone token (env var, function name, file path) belongs in inline `<Code>`, not a full block.
- A single copyable shell command or a one-off secret/key reveal belongs in `<Snippet>`, not `<CodeBlock>` — `<Snippet>` already has the prompt glyph and copy button built in.

**Behavior**

- Always set a language/syntax value (`tsx`, `bash`, `json`, `diff`, etc.) — accurate highlighting is the entire reason to pick `<CodeBlock>` over a bare `<pre>`.
- Highlight sparingly: only the specific lines relevant to the point being made. Highlighting every line is equivalent to highlighting none.
- Represent diffs with the `diff` grammar or the dedicated added/removed line props — don't fake a diff with `// added` / `// removed` comments, since that corrupts anything copied out of the block.
- Only show the filename header when the snippet has a real destination file (`app/page.tsx`, `vercel.json`); leave it off for throwaway/illustrative snippets.

**Content**

- Snippets must stay runnable/pasteable as shown: don't turn real code into pseudo-code, and don't manually prefix shell lines with `$` (that's `<Snippet>`'s job, and doing both doubles up to `$ $ command`).
- Surrounding prose should stay in sentence case, with inline CLI flags wrapped in backticks (e.g. `` `--prebuilt` ``).

## Design notes

**Outer/anatomy (from rendered markup, `Default` example):**

- Outer demo wrapper: `rounded-lg border` with `border-gray-alpha-400` and `bg-background-100`.
- Block container: `relative my-4 rounded-md border overflow-hidden`, border color `var(--ds-gray-400)`, background `var(--ds-bfackground-100)` (sic — literal typo'd CSS var seen in the markup, effectively a near-white/near-black background token).
- Header/toolbar row (only present when `filename` is set): `h-12` (48px) flex row, `bg-[var(--ds-background-200)]`, bottom border `border-[var(--ds-gray-400)]`, padding `py-0 pr-3 pl-4`.
  - Left: a small 16x16 dot/atom-style icon + filename text at `text-[13px]`, color `var(--ds-gray-900)`, truncating with `truncate break-normal max-w-full min-w-0`.
  - Right: icon-only copy button, `!size-8` (32px square), `!rounded-[5px]`, geist "tertiary" button styling (`geist-new-tertiary geist-new-tertiary-fill`), `aria-label="Copy to clipboard"`, `data-testid="copy/button"`. Two overlapping SVGs (copy icon / checkmark) cross-fade via `opacity`/`scale` transition classes (`transition-all duration-200 ease-in-out`) — a copy → checkmark swap animation, no separate toast.
- Code body: `<pre class="prism-code language-<lang> code-block-module__..._pre">` wrapping `<code data-geist-code-block="true">`. Text: `text-[13px]` / `leading-[20px]`, `font-mono`, `hyphens-none`, font-feature-settings `"liga" off` (ligatures disabled). Text color `var(--ds-gray-1000)`.
  - Each source line is `<div class="line" data-geist-code-block-line="true" id="C<hash>-L<n>">`.
  - Line-number gutter is a `<button aria-label="Add line anchor to the URL" class="code-block-module__..._lineNumber">` per line — i.e. the gutter number is an interactive control, not static text, confirming the "Referenced lines" click-to-anchor behavior.
  - `hideLineNumbers` prop adds a `code-block-module__..._hideLineNumbers` class to the `<pre>` AND removes the line-number `<button>` elements from the DOM (not a CSS-only hide).
  - Highlighted lines get `data-highlighted="true"` on the line `<div>`.
  - Added/removed lines get `data-added="true"/"false"` and `data-removed="true"/"false"` on the line `<div>` (both present on every line, only one flips true at a time).
- v0 footer bar (only when `v0` prop set): separate row under the `<pre>`, `h-12`, `bg-[var(--ds-background-200)]`, top border `border-[var(--ds-gray-400)]`, right-aligned (`justify-end p-3`).
  - `v0="ask"`: single link, `target="_blank"`, href `https://v0.app/chat?q=<explain-code template>`, visible label "Ask" + v0 glyph icon, `sr-only` text "Ask v0". Rendered as a bordered secondary-style button, `height:32px`.
  - `v0="build"`: primary-filled button (`bg-[var(--themed-bg,_var(--ds-gray-1000))]`, inverted foreground) labeled "Open in v0" + v0 glyph, immediately followed by a second menu-trigger button (`aria-haspopup="true"`, `aria-controls="menu-..."`) forming a split-button, presumably exposing "Ask" as a secondary option in the dropdown.

**Tokens seen:** `--ds-background-100`, `--ds-background-200`, `--ds-bfackground-100` (typo variant), `--ds-gray-100/200/300/400/700/900/1000`, `--ds-gray-alpha-100/200/400/500/600`, `--ds-blue-300/700/900`, `--ds-amber-800`, `--ds-focus-color`, `--ds-focus-ring`, `--ds-shadow-border`, `--ds-shadow-border-small`, `--ds-size-medium`. Typography classes: `text-copy-13/14/16/20`, `text-heading-16/20/24/40`, `text-label-12`, `text-gray-700/900/1000`.

**Motion:** copy button glyph swap uses a 150-200ms `ease-in-out` cross-fade/scale (`opacity-0 scale-50` → `opacity-100 scale-100`) rather than a separate success toast; no other block-level motion documented (no enter/exit animation for the block itself, no animated diff reveal beyond the static added/removed line styling).

**Syntax highlighting:** implemented via Prism (`class="prism-code language-<lang>"`), token classes like `token keyword`, `token function maybe-class-name`, `token punctuation`, `token literal-property property`, `token operator`, `token plain` — i.e. standard PrismJS tokenization rather than Shiki in the actual live-rendered demo (the docs' own code-snippet-of-snippets uses Shiki-style inline `style={{color:...}}` spans with GitHub Dark/Light hex palettes, e.g. `#F97583` keyword / `#9ECBFF` string / `#E1E4E8` plain on dark, `#D73A49` keyword / `#032F62` string / `#24292E` plain on light — but that's the docs page's own "show code" viewer, not necessarily `<CodeBlock>`'s internal engine, which renders via Prism in the live demo markup).
