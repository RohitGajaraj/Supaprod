# IX-A: The Mark

> _Created: 2026-07-28 · Last updated: 2026-08-03_

**Direct manipulation and agent-mediated editing.** The complete interaction model for pointing at
a thing and changing it, across every surface.

> Written 2026-07-28 against the founder's mandate. Binding docs honoured:
> [`craft-law.md`](../craft-law.md) (anti-slop, the real brand mark),
> [`ia/FINAL-ia.md`](../ia/FINAL-ia.md) (the Room, six regions, the URL grammar, the modal law),
> [`language/lang-a-lexicon.md`](../language/lang-a-lexicon.md) (one word per concept),
> [`conventions/humanized-output.md`](../../../conventions/humanized-output.md).
> Every mechanism below is wired to code that exists today, cited by file and line.

---

## 0. THE ONE PARAGRAPH

Every design so far is a layout: rectangles you look at. The founder wants software you reach into.
So: **you point at a thing, you say what should change, and that becomes a mark.** A mark is a
numbered pin on the artifact and a line in the Thread beside it, carrying the exact element it
points at, that element's role, its properties and its place in the tree. Text you can just type
into, you type into, and it saves instantly with no model call. Anything structural, you say in
words and the crew does. Marks pile up, go together on `⌘⏎`, come back as one proposal you scrub
Before against After, and land as a real revision or a real changeset, never a picture of one. The
same four verbs, **point, say, send, keep**, work on a button in a prototype, a clause in a spec, a
row in a roadmap, a step in a plan, and a line in a diff. The only thing that changes per artifact
is what counts as a target and which tool executes.

**The single sentence for the board:** every other tool lets you comment on a preview; ours turns
the comment into an attributable hunk in a real pull request, writes it to the Ledger, and teaches
the workspace what you like so the next render does not need the mark at all.

---

## 1. WHAT I READ, AND WHAT IT CHANGED

### 1.1 The four references, as interaction models

| Reference | What I took | What I refused |
| --- | --- | --- |
| **Vercel Toolbar comments** | The anchor model is right: a comment is pinned to an element plus a viewport, survives redeploys by re-anchoring, and shows as a numbered pin. Also right: the preview is a real deployment at a real URL before it is real in production. | Their comment **never changes the code**. It is a note for a human to go implement. That gap is the entire product opportunity and we close it. |
| **devouringdetails.com** (Rauno) | Hit targets larger than their visual bounds. State in the URL, always. Optimistic writes, so the interface never waits to acknowledge you. Feedback at the pointer, not in a corner toast. | Nothing. This is the standard. |
| **interfacecraft.dev** | The system's state must be legible at rest, without hovering to discover it. Motion confirms, it does not perform. | Nothing. |
| **Figma** | Selection carries the object's properties. Comments are numbered pins with a resolved/unresolved state and a thread. Modifier-held tool switching (space to pan, alt to measure) is muscle memory a designer already owns. | Their properties panel: 40 fields you edit numerically. A PM does not want a `justify-content` dropdown. Properties are **context for the sentence you type**, not a form. |
| **Linear** | Click to edit in place. No dialogs. Optimistic. Keyboard-first with single unmodified letters. | Nothing. |
| **Cursor / GitHub PR review** | Hunk-level accept and reject, and the human judging the diff is the job, not the friction. | GitHub's review comment is a note on a line that changes nothing until a human pushes. Ours pushes. |
| **Lovable / v0 / Claude artifacts** | The artifact is the interface. The conversation is a thin layer over the object. | Their select mode is a hidden toggle you discover by accident, and one comment fires one full rewrite. Both are fixed below (§2.3, §5.1). |

### 1.2 Ground truth verified in this repo

**What exists and is load-bearing for this design.**

| Fact | Where |
| --- | --- |
| Generated mockup HTML is real, persisted, and rendered in an iframe via `srcDoc` | `design-scaffold.functions.ts:245` `generateDesignScaffold`, `:268` `getPersistedScaffold`, rendered at `faces.tsx:1283`, `DesignScaffoldPanel.tsx:272`, `PreviewPanel.tsx:171`, `p.$slug.tsx:141` |
| The generator is instructed to use a **fixed class vocabulary**: `btn btn-primary`, `btn-secondary`, `input`, `.card`, `.badge`, plus `MOCKUP_CSS`'s `.form-group .section-title .empty-state .sidebar` | `design-scaffold.functions.ts:99` and `MOCKUP_CSS` at `:44-83` |
| `prototype_messages` exists, is empty, and has exactly the right columns: `role` (`user`/`assistant`/`system`), `content` text, `changes_json` jsonb, `applied` boolean, workspace-scoped | `supabase/migrations/20260602204826_*.sql:390`, workspace column added `20260619212731_*.sql:430` |
| `prototype_attachments` exists, is empty, and carries `message_id` (an attachment belongs to a comment), `kind`, `storage_path`, `size_bytes`, `extracted_text` | same migrations, `:411` and `:443` |
| Hunk-level accept and reject on a staged change **already works**, with optimistic concurrency | `studio.functions.ts:1816` `applyStagedHunkSelection` (takes `rejectedHunkIds` + `expectedUpdatedAt`), `:1872` `rejectStagedFile` |
| A declared touch list plus a max-files cap already constrains a run | `studio.functions.ts:1904` `setChangesetConstraints`, `:1967` `enforceTouchList`, `dispatchStudioSession` accepts `allowedPaths`/`maxFiles` at `:179` |
| Mid-run steering exists and is never both applied and lost | `studio.functions.ts:974` `steerStudioSession` |
| Revise-in-place tools exist for spec, decision and roadmap, each snapshotting the prior value for one-key rewind and attributing the edit to the acting agent | `registry.server.ts:2489` `prd.revise`, `:2565` `decision.revise`, `:2636` `roadmap.move` |
| Full-file staging into a DB changeset | `registry.server.ts:1398` `studio.stage` |
| Pure, unit-tested hunk maths | `src/lib/ai/studio-hunks.ts`: `computeHunks`, `applyHunkSelection`, `applyChangesetHunkSelections`, `matchesTouchList` |
| A spec already has a parsed section and clause ontology | `faces.tsx:620` `parseSpecSections()` returns `{ overview, sections: [{ title, items: [{ num, text }], prose }] }` |
| Workspace taste memory, written back from design verdicts | `design-memory.functions.ts:104` `getActiveDesignMemoryForWorkspace`, `:538` `recordDesignScaffoldFeedback` |
| `CallSurface` union already contains `"prd"`, which `design-scaffold` uses. No union change needed. | `runtime.server.ts:313` |

**The correction that reshaped the design.** The brief says the Design face ships a "same-origin
`srcDoc` iframe". It does not. All four render sites set `sandbox="allow-scripts"` (plus
`allow-forms allow-modals` on three) and **none sets `allow-same-origin`**. A sandboxed frame
without that flag runs at an opaque origin, so the parent cannot touch `contentDocument` at all.
The comment at `faces.tsx:1150` saying "rendered same-origin via srcDoc" is wrong and should be
fixed.

This is not a problem, it is the constraint that makes the design safe. `allow-scripts` plus
`allow-same-origin` together is a documented sandbox escape: the frame can reach
`parent.frameElement.removeAttribute('sandbox')` and free itself. So we must never add it, and the
selection channel must be `postMessage`. Everything in §3 follows from that.

**Defects found while reading, worth fixing regardless of this proposal.**

1. `faces.tsx:1267` hardcodes `relay.heliolabs.com/inbox/digest` into the device frame's URL bar,
   and `:1276` hardcodes the badge `Interactive · V4`. Demo fiction inside a shipped component.
2. `faces.tsx:1228-1246` renders four state chips (`Default`, `Loading`, `Empty`, `Error`) whose
   `Loading`/`Empty`/`Error` bodies are hardcoded English about a digest that does not exist
   (`:1293-1315`). Three of four chips show a lie. §5.4 gives the honest path.
3. `faces.tsx:1046` `DesignRail()` is a read-only annotation rail with no data behind it. Right
   instinct, no substance. Marks replace it.
4. `faces.tsx:1340` states "1 screen, 4 states, 3 clickable paths" as a literal string, uncounted.

---

## 2. THE GESTURE

> **Point at a thing. Say what should change. It becomes a mark. Marks go to the crew together,
> come back as one proposal, and you keep it or send it back.**

Four verbs: **point, say, send, keep**. They do not change per surface. What changes is only what
counts as a target and which tool executes.

### 2.1 The name, and why

A **mark** is a proof reader's mark: you point at a spot on a page, you write a terse instruction
in the margin, and someone else executes it. That craft is four hundred years old, it is
unambiguous, and it is the exact shape of this interaction. It gives us the whole visual grammar
for free: a numbered pin, a margin, a caret for insert, a strike for cut, an arrow for move.

It is also the one word for this concept, per the lexicon's law. Banned beside it: `annotation`,
`comment` (as a noun for this object), `feedback`, `note` (note is taken), `suggestion`, `request`,
`ticket`, `todo`.

The verb is **mark**. The plural surface is **the marks**. The pin is **a pin**. Never "commenting
mode", never "annotation layer".

> Code-name collision, resolved: `SupaprodMark` in
> [`src/components/supaprod/SupaprodMark.tsx`](../../../../src/components/supaprod/SupaprodMark.tsx)
> is the seven-petal brand glyph and stays exactly as it is (craft law §1). It is never rendered as
> the word "mark", so the user-facing noun and the component name never meet. New components are
> namespaced `Mark*` under `src/components/mark/`.

### 2.2 The states of a mark

Six, and every one is visible without hovering.

| State | Pin | Thread row | Means |
| --- | --- | --- | --- |
| `open` | `◉n` ember filled | full colour | placed, not sent |
| `sent` | `◉n` ember outline, slow 1.4s pulse | full colour, working caret | in flight to the crew |
| `done` | `✓n` in `--verdict-pass` | full colour, verdict line | the proposal addressed it |
| `cant` | `×n` in `--ink-subtle` | full colour, the reason | the crew could not, and says why |
| `orphaned` | none | `--ink-subtle`, struck target | the thing it pointed at is gone |
| `kept` | none | collapses into the revision line | landed, folded into history |

A mark in `cant` **does not close when you keep the revision.** It survives with your original
words. A system that silently drops what it could not do is a system you stop trusting.

### 2.3 The mode problem, and the answer

The founder wants prototypes that are clickable **and** markable. Those two want the same click.
Lovable and v0 resolve this with a toggle you find by accident. We resolve it by showing the mode
at all times, in the frame chrome, as a two-position segmented control:

```
┌──────────────────────────────────────────────────────────────┐
│ ● ● ●   relay/inbox/digest              ┌──────┬───────┐     │
│                                         │ Use  │ Point │     │
│                                         └──────┴───────┘     │
├──────────────────────────────────────────────────────────────┤
```

- **Use** (default): clicks go to the prototype. It behaves like the real thing.
- **Point**: clicks select instead of activate. The cursor is a crosshair. The frame's inner border
  goes from `--ink-hairline` to a 1px ember hairline at 40%, so at a glance across the room you
  know which mode the screen is in.

Three ways in, because a mode you can only reach one way is a mode people forget exists:

1. Press **`p`**. Toggles. (`p` is free: the Spine owns `1`-`7`, the depth rail owns `g k r m t c e`.)
2. **Hold `⌥`** for momentary Point, released back to Use. This is the measuring-tool convention a
   designer already has in their hands.
3. **Double-click anything, in either mode.** A double-click is a deliberate act, so it may bypass
   the mode. This is the escape for the person who never learned the toggle.

**Escape** leaves Point mode. Per FINAL-ia §6.3, Escape closes exactly one layer, innermost first;
Point mode sits above the pane layer and below an open composer.

Surfaces with no Use mode (a spec, a roadmap, a diff) have **no toggle at all**. Everything is
markable always, because there is nothing to activate. Do not render a control for a choice that
does not exist.

---

## 3. (a) THE SELECTION MODEL

### 3.1 Inside the iframe: the probe

A ~4KB script string, `src/lib/mark/probe.ts`, appended into `srcDoc` before `</body>` by
`withProbe(html, nonce)`. It is the only code that touches the generated DOM.

```
parent (Supaprod)                          iframe (opaque origin)
──────────────────                         ──────────────────────
  MarkProvider ───── srcDoc: html + probe ──▶ probe boots
                                              │
       ◀── sp.ready { nonce, docSize } ───────┤
       ─── sp.setMode { mode:"point" } ──────▶│  crosshair on, listeners on
       ◀── sp.hover  { nonce, ref } ──────────┤  (rAF-throttled)
       ─── sp.highlight { path } ────────────▶│
       ◀── sp.select { nonce, ref } ──────────┤  on click
       ◀── sp.viewport { nonce, rects[] } ────┤  on scroll/resize, rAF, max 40
       ─── sp.scrollTo { path } ─────────────▶│
       ─── sp.beginInline { path } ──────────▶│  contenteditable on, caret placed
       ◀── sp.inlineCommit { nonce, ref, text }┤  on Enter
       ─── sp.preview { html } ──────────────▶│  (parent swaps srcDoc instead; see 5.3)
```

**Security, stated because it is load-bearing.**

- **Never add `allow-same-origin`.** With `allow-scripts` present it is an escape hatch. The
  postMessage design exists so this stays true forever. Put it in a lint rule.
- The probe must call `parent.postMessage(msg, "*")`, because an opaque origin has no origin to
  target. Therefore origin string checks are useless: every sandboxed frame reports `"null"`.
- The parent's guard is **two-factor and both factors are required**:
  `e.source === iframeRef.current.contentWindow` (window identity, not a string) **and**
  `e.data.nonce === thisMountNonce` (a per-mount `crypto.randomUUID()` baked into the probe string
  at render time). Identity blocks a sibling frame; the nonce blocks a nested frame the generated
  HTML might contain.
- The probe never `eval`s. It never posts more than 4KB. It never reads cookies, storage, or the
  parent. It has no network access to add.
- The probe's own styles are injected by the probe itself, into ids prefixed `__sp_`, so
  `MOCKUP_CSS` stays clean and a generated class can never collide.
- **`p.$slug.tsx` (the public share viewer) never gets the probe.** A public viewer has no marks
  and no session. `withProbe` is called at the three authenticated sites only.

### 3.2 What counts as a target

Not `event.target`. A click on the `<span>` inside a button's label must select the button.

The probe walks up from the hit node until it finds the first **nameable** ancestor, which is any
element satisfying one of, in priority order:

1. It is a form control: `input`, `textarea`, `select`, `button`.
2. It carries a class from the generator's declared vocabulary: `.card`, `.btn`, `.badge`,
   `.form-group`, `.section-title`, `.empty-state`, `.sidebar`, `.nav-links`, `.brand`.
   This is why `design-scaffold.functions.ts:99` mandating those class names is load-bearing: it
   is already a pre-agreed element ontology, shipping today, that nobody has used yet.
3. It has an ARIA role, or is a landmark: `nav`, `main`, `header`, `footer`, `section`, `table`,
   `tr`, `th`, `td`, `li`, `form`.
4. It is a heading `h1`-`h6`, or a `p`, or a `label`.
5. Fallback: the nearest block-level ancestor with a non-zero box.

Walking stops at `<body>`. If the hit is `<body>` itself, the selection is refused and the frame
shows one line in the corner: `nothing to point at here`.

**Modifier for the parent:** `⌥`-click while already selected walks the selection **up one level**
(button, then card, then row). The role label updates as you go. Same convention as an editor's
expand-selection. There is no need for a tree view, ever.

### 3.3 The SelectionRef, which is the context the crew receives

This is the whole answer to "how selection becomes context".

```ts
// src/lib/mark/ref.ts
export type SelectionRef = {
  artifact: {
    kind: "prototype" | "spec" | "roadmap" | "plan" | "diff" | "decision" | "signal";
    id: string;
    revision: string;         // prd_scaffolds.updated_at, or studio_changes.updated_at
  };
  target: {
    path: string;             // "body>main:1>div.card:2>button:1"  structural, deterministic
    fingerprint: string;      // sha1(tag | role | class list | trimmed text | nth-of-type)
    tag: string;              // "button"
    role: string;             // "primary action"   the product's words, not the DOM's
    text: string;             // visible text, clamped to 120 chars
    box: { x: number; y: number; w: number; h: number };   // frame-relative, at select time
    place: {
      parentRole: string;     // "row of 2"
      index: number;          // 1
      of: number;             // 2
      ancestors: Array<{ role: string; text: string }>;    // up to 3, nearest first
      before: string | null;  // previous sibling's role + text
      after: string | null;
    };
    look: {                   // the curated 14, never the full computed set
      display: string; flexDirection: string | null; justifyContent: string | null;
      alignSelf: string | null; textAlign: string; width: string;
      margin: string; padding: string; color: string; background: string;
      fontSize: string; fontWeight: string; borderRadius: string; position: string;
    };
    source: { file: string; line: number; snippet: string };  // 3 lines around the element
  };
  editable: "text" | "value" | "none";
};
```

**Why the `look` set is curated and not complete.** A model needs to know how a thing is positioned
in order to honour "move this right". It does not need `-webkit-font-smoothing`. Fourteen
properties is roughly 400 tokens per mark; the full computed set is roughly 9,000. That is a cost
decision with a number behind it, and it is the reason five marks cost one call rather than five.

**How `role` is computed, because "BUTTON" is not a role a PM says out loud.** A small table in
`src/lib/mark/ontology.ts`, deterministic, no model:

| Match | Role rendered |
| --- | --- |
| `.btn.btn-primary` | `primary action` |
| `.btn.btn-secondary` | `secondary action` |
| `input[type=email]` with a `<label>` | `field · email` |
| `.card` | `card` |
| `.badge` | `status chip` |
| `h1` | `page title` |
| `h2` / `h3` | `heading` |
| `nav` | `top bar` |
| `table` / `tr` | `table` / `row` |
| `.empty-state` | `empty state` |
| `.sidebar` | `side column` |
| anything else | the tag, lowercased |

**`source.line` and how we get it honestly.** The probe cannot know the source line, it only sees
the DOM. So the parent computes it: `withProbe` stamps a `data-sp-n="<ordinal>"` attribute onto
every element while it walks the HTML string server-side, recording `ordinal -> line`. The probe
reports the ordinal, the parent looks up the line. Deterministic, no guessing, and it survives
reformatting because it is computed at render time from the exact string being rendered.

### 3.4 Re-anchoring, because the artifact will be rewritten under the mark

After the crew rewrites the file, `path` is often wrong and `fingerprint` is often still right.
`reanchor(ref, newHtml)` tries, in order:

1. Exact `fingerprint` match, unique. Best case, silent.
2. Exact `fingerprint` match, multiple: pick the one whose `path` has the smallest edit distance
   to the original. Silent.
3. `path` match with a fingerprint differing only in `text`: the element survived, its words
   changed. Re-anchor, and the Thread row carries one line: `2 · the text changed under this mark.`
4. Nothing matches: the mark goes **orphaned** (§2.2). Never silently deleted.

The same function serves text ranges in prose, using a text-quote selector
(`{ quote, prefix: 32 chars, suffix: 32 chars }`), which is the W3C annotation model and it is the
right one because it survives reflow, renumbering and reformatting.

### 3.5 What selection looks like

Craft law bans glow, bans soft shadows on everything, bans a second accent doing the same job.
Ember (`#FF6B2C`) is already the accent that means "your attention is here", which is the same job
here as in the calls tray. So ember, and nothing else.

**Hover, in Point mode.** Not a filled devtools box. **Corner ticks**: four 7px L-shaped 1px
hairlines at the box corners, in `--ink-hairline-strong`, plus the role label in Geist Mono 10.5px
at the top left, on a 2px-padded `--ink-raised` chip. The ticks read as a measuring instrument.
A full rectangle reads as browser chrome, and we are not devtools.

```
        ┌ primary action ─┐            <- mono label chip, sits ON the top tick line
        ╻                 ╻            <- 7px corner ticks, 1px, --ink-hairline-strong
             Send digest
        ╹                 ╹
```

Optical correction, because craft law asks for one and this is where it belongs: the ticks are
inset by **1px on the left and right, 0px on top and bottom**. A horizontal hairline reads heavier
than a vertical one at the same weight, so mathematically equal insets look wrong. Someone noticed.

**Selected.** The ticks go to full ember. A hairline joins them at 22% ember so the box closes
without shouting. The **pin** appears at the top right corner, outside the box by 6px: a 16px
circle, ember fill, the mark number in 10px mono in `--ink-bg`. The pin is 16px visually and
**28px in hit area**, per the devouringdetails rule.

**Composing.** Only while the composer is open, the rest of the frame takes a 6% ink veil. Not a
scrim, not a blur (craft law bans blur as decoration): a flat 6% is above the noticeability floor
and below the "look at me" threshold. It ends the instant the mark is placed.

**Nothing dims on plain hover.** Hovering is not a commitment and must not cost the room its
legibility.

### 3.6 Selection outside the iframe

Native React surfaces get the identical grammar with no bridge. One hook:

```ts
// src/lib/mark/useMarkable.ts
const { markProps, isMarked, markNumber } = useMarkable({
  kind: "spec", id: specId, revision: spec.updatedAt,
  path: `3.2`, role: "acceptance clause", text: clause.text,
  editable: "text",
});
<li {...markProps}>{clause.text}</li>
```

`markProps` spreads `data-mark-path`, `data-mark-role`, `tabIndex`, and the pointer handlers.
`MarkOverlay` is a single portal-rendered component that reads
`document.querySelector('[data-mark-path=...]').getBoundingClientRect()` and draws the same corner
ticks. One implementation of the visual, two sources of geometry. There is no second design.

**Text ranges in prose.** Selecting text with the mouse produces the same ticks wrapped around the
range's client rects (multi-line ranges get ticks at the range start and range end only, not per
line, or it becomes confetti). Releasing the mouse over a selection of 3 or more characters opens
the composer directly, with no `p` and no Point mode: **in prose, selecting text is already the
gesture.** Nobody needs to be taught that.

---

## 4. (c) THE DIVISION: what you edit, what the crew edits

Placed before the loop deliberately, because it decides what happens when you press Enter.

### 4.1 The rule, in one sentence

> **If changing it changes only what it says, you change it. If changing it changes how it works,
> you say what you want and the crew changes it.**

This sentence appears exactly once in the product, in the Design face's first-run state. After that
the interface carries it without words.

### 4.2 The three classes, computed not configured

`classify(el)` in `src/lib/mark/ontology.ts`:

| Class | Test | Examples |
| --- | --- | --- |
| **text** | exactly one text-node child, no element children, no interactive descendants | a heading, a paragraph, a label, a button's label, a cell, a badge |
| **value** | an `input`/`textarea`/`select` with a value or placeholder, or a leaf whose whole text is a number, currency, date, or an enum from a known set | a price, a count, a date field, a roadmap bucket, an owner, an estimate |
| **none** | everything else | containers, layout, structure, nav, anything with element children, anything whose change moves other things |

The classification is honest about its own edges: a `<button>` containing only text is class
**text** for its words, and class **none** for its position. Both are true, and the interface says
both. See §4.4.

### 4.3 How the interface teaches this without a manual: the two-cursor law

**The cursor is the manual.**

- Over a **text** target, the cursor is an **I-beam** and the role label gains a caret glyph:
  `⌶ heading`.
- Over a **value** target, the cursor is an I-beam and the label names the control:
  `⌥ bucket · Next`.
- Over a **none** target, the cursor is a **crosshair** and the label is the plain role: `card`,
  `row of 2`, `top bar`.

Text you can type into looks like text you can type into. That has been true in every computer
since 1984 and it needs no onboarding, no tooltip, no coach mark, no dismissible tip. This is the
answer to "it should not feel overwhelming or confusing about what to look at".

The second signal is **who is named**:

- Direct edit shows **nothing at all**. No agent chip, no confirm, no toast. You typed, it saved.
  Silence is the strongest possible signal that you are simply editing.
- The mark composer shows a 3-word head with the responsible crew member's chip:
  `Designer will do this` / `Engineer will do this` / `Writer will do this`. Naming who is on the
  hook is the difference between "I am editing" and "I am asking".

### 4.4 The gestures, exactly

**On a `text` target:**

| Input | Result |
| --- | --- |
| click | select (ticks, pin slot reserved, no pin yet) |
| click again, or `Enter`, or type any character | edit in place. `contenteditable` inside the frame, caret at the click point or select-all if typed into |
| `Enter` in the field | commit |
| `Escape` | cancel, restore |
| `⌘⏎` in the field | **promote to a mark** instead of a direct edit |

The promote hatch matters. Sometimes you do not want to write the words, you want better words:
"make this shorter and less salesy". The hint sits at the field's right inner edge in 10px mono,
`--ink-faint`: `⌘⏎ ask instead`. It is the only hint text in the whole model, and it is there
because this is the one place where the same gesture can mean two things.

**Commit writes directly. Exactly this, and no more:**

1. The probe posts `sp.inlineCommit { ref, before, after }`.
2. The parent calls `applyDirectEdit` (server fn), which does an **exact string replacement on the
   stored source**, located by `source.line` plus the `before` text, and **verified by recomputing
   the fingerprint on the result**. It never serialises the live DOM back to the file. Serialising
   would lose the model's formatting and would write the probe into the saved artifact.
3. If verification fails (the source moved under you), the edit **degrades into a mark** carrying
   your typed text, and the Thread says: `Saved as a mark instead. The file changed under you.`
   An honest failure that loses nothing.
4. On success it writes `prd_scaffolds.html` (via the existing `persistScaffold` upsert path) or
   `studio_changes.new_content`, plus a `prototype_messages` row with `role:'user'`,
   `applied:true`, `changes_json:{ kind:'direct', ref, before, after }`.

**Zero model calls. Zero cost. Under 40ms. On the record and rewindable.** The `applied:true` row
is what makes a hand edit auditable without inventing a table.

**On a `value` target:** you get the right control, not a text field. This is the "would you have
loved this" test, and typing the word `Now` fails it.

| Value kind | Control at the pin |
| --- | --- |
| enum (roadmap bucket) | 3-position segmented control, `Now / Next / Later`, 32px |
| person (owner) | person picker, 6 recent, then search |
| date | date field, with `today` and `+1w` shortcuts |
| number with unit | stepper, unit rendered after the field, `⌥` for x10 |
| free string in an input's placeholder | inline text field |

**The governance case, and why it is the best thing in this design.** `roadmap.move`
(`registry.server.ts:2636`) enforces the H2 rule: a Now/Next/Later commitment must carry a declared
outcome **and** a measure. A direct edit that skipped that would be a governance hole. So dragging
a bet into `Now` with no declared outcome does not fail and does not throw an error. It opens the
composer, pre-filled, with two fields, and one line at the head:

```
 ┌──────────────────────────────────┐
 │ Now needs a promise.             │
 │ what will change  [            ] │
 │ measured by       [            ] │
 │            ⏎ commit    esc back  │
 └──────────────────────────────────┘
```

Four words teach a rule at the exact moment it applies. That is the founder's "even before you feel
'I should know information about this', it needs to be there", answered with a control rather than
a doc.

**On a `none` target:** typing does nothing. `Enter` or click-again opens the mark composer.

### 4.5 The one-way door, said once

You cannot hand-edit generated layout. There is no reverse hatch from a mark to a direct structural
edit, and there will not be one.

This is a product position and I will defend it: hand-edited layout produces a file the crew can no
longer reason about, which is precisely how prototype tools become dead ends. The moment a human
drags a div, the next agent rewrite either destroys the drag or refuses to touch the file.

It is stated once, in the Design face's empty state, in the product's voice:

> Type on any words you want to change. For anything that moves, point at it and say so. Designer
> keeps the file coherent so the next change is still possible.

Never repeated. No tooltip, no modal, no "learn more".

---

## 5. (b) THE COMMENT-TO-CHANGE LOOP

### 5.1 The structural move: the Thread is the margin

The founder's diagnosis is that the conversation is architecturally separate from the artifact.
FINAL-ia §1.3 already gives us a **380px Thread** immediately left of the Canvas, permanent, never
conditionally rendered.

**A mark placed on the canvas writes a Thread entry.** No new region, no floating panel, no
sidebar that appears and disappears. The conversation is beside the artifact, and each line of it
is anchored to a place in the artifact. The Thread *is* the margin.

### 5.2 Placing a mark, drawn

Typing 380px away from the thing you pointed at breaks the feeling of directness, so the composer
opens **at the element** and **lands in the Thread**.

```
CANVAS
   ┌ primary action ─┐
   ╻                 ╻
        Send digest
   ╹                 ╹
   ┌───────────────────────────────────┐   260px, 1px hairline, --ink-raised
   │ Designer will do this             │   12px, --ink-subtle, Designer chip at left
   │ ┌───────────────────────────────┐ │
   │ │ move this right               │ │   14px, 1 line, grows to 3 then scrolls
   │ └───────────────────────────────┘ │
   │ ⏎ mark   ⌘⏎ send now   esc drop   │   10px mono, --ink-faint
   └───────────────────────────────────┘
```

Placeholder: `What should change?` Four words, a question, the product's voice. Not "Describe your
change", not "Tell the AI what to do".

The composer opens **below** the element, or above it if there is no room below, and is clamped
inside the frame. It never causes the page to scroll. It never grows the layout. It is not a
dialog: per FINAL-ia §6.4, dialogs are for confirm, name, connect and destroy, and nothing else.
The founder specifically complained about "all those dialogue boxes"; this whole model contains
exactly one dialog, and it is `Drop all 5 marks?`.

**On `Enter`**, the card travels to the Thread: 180ms, `transform: translate3d()` and `opacity`
only, `cubic-bezier(.22,1,.36,1)`. A numbered pin stays behind on the element with a 140ms
`scale(.7 -> 1)` on `cubic-bezier(.34,1.56,.64,1)`, the single overshoot in the model.

That motion does information work: it teaches, in one gesture and once, that a mark on the thing is
a line in the conversation. Craft law says motion must confirm rather than perform. This confirms
where the thing went, and after the second time you stop watching it, which is the correct fate for
good motion.

### 5.3 What happens on Enter: the data path

```
1. WRITE, optimistically, no model call
   prototype_messages {
     prototype_id, workspace_id, user_id,
     role:        'user',
     content:     'move this right',
     changes_json: { kind:'mark', n: 1, ref: SelectionRef, status:'open' },
     applied:      false
   }
   ...the unused table, used for exactly the columns it has.
   Attachments (drag a screenshot onto a mark) write prototype_attachments
   { message_id, kind:'image', name, storage_path, size_bytes, extracted_text }
   ...message_id is precisely "this file belongs to this comment". Also already there.

2. The Thread row appears instantly. The pin appears. Status = open.

3. NOTHING RUNS.
```

**Marks accumulate. One mark does not dispatch a run.** This is the second decision I would defend
to a board:

- Five sequential agent rewrites of one file produce five diffs nobody reads. One rewrite
  addressing five marks produces one diff a human can actually judge.
- It is roughly 5x cheaper, and cost per change is a number on our own pricing page.
- It lets you place five marks in twenty seconds without five runs racing on one file, which is a
  real correctness problem, not a taste one.

The founder's "hit enter and it changes" is still one keystroke away: **`⌘⏎`** in the composer
places and sends immediately. Both paths exist, both are labelled in the composer's own footer, and
the default is the one that produces reviewable work.

The Thread footer carries the count and the send: `3 marks · Send ⌘⏎`.

### 5.4 Sending: two honest paths

**Path A: the artifact is a generated scaffold** (`prd_scaffolds.html`, not yet a repo file).

New server fn `proposeMarkResolution` in `src/lib/marks.functions.ts`:

```
in:  { prototypeId | prdId, markIds[] }
     loads: prd_scaffolds.html
            the open marks, in placement order, each with its SelectionRef
            formatDesignMemoryContext(getActiveDesignMemoryForWorkspace(ws))
     one callModel({
       surface: "prd",                                  // existing literal, no union change
       surface_ref: `design-marks:${prototypeId}`,
       model: "google/gemini-2.5-flash",                // same as buildDesignScaffoldHtml
       messages: [ system: the scaffold rules + the mark contract,
                   user:   the html + the compiled mark block ]
     })
out: { html, per_mark: [{ markId, verdict:'done'|'partly'|'cant', note, touched:[{path, anchor}] }] }
     writes prototype_messages { role:'assistant', content: summary,
                                 changes_json:{ proposal:{html, per_mark} }, applied:false }
```

The compiled mark block, per mark, is a compact and readable thing (this is what "selection becomes
context" actually means at the wire):

```
MARK 1
  target   primary action, text "Send digest"
  place    inside card 2, item 1 of 2 in a row, next to "Snooze"
  looks    inline-flex, in a flex row, justify-content: flex-start,
           padding 7px 14px, background #4f46e5, radius 7px
  source   index.html:118
             <div class="flex gap-2">
               <button class="btn btn-primary">Send digest</button>
               <button class="btn btn-secondary">Snooze</button>
  asked    move this right
```

**Path B: the artifact is a real repo file** (a promoted prototype, or any file in a live change).

- **A Run is live on this file:** compile the marks into one steer and call
  `steerStudioSession({ missionId, message })` (`studio.functions.ts:974`). The loop consumes a
  steer only after its checkpoint persists, so a mark is never both applied and lost. This is a
  perfect fit that already exists.
- **No Run is live:** call `dispatchStudioSession({ prdId | prompt, allowedPaths, maxFiles })`,
  where `allowedPaths` is **derived from the marks themselves**, the union of every
  `ref.target.source.file`, and `maxFiles` is that count.

That last point is the strongest reuse in this document. `setChangesetConstraints` and
`enforceTouchList` (`studio.functions.ts:1904`, `:1967`) exist to stop an agent wandering outside a
declared scope, and today a human has to type that scope by hand on the Changes tab. **The marks
are the scope declaration.** You pointed at three things; the run may touch those three files and
no others; `enforceTouchList` drops anything else before the gated commit. Pointing at things is
now also how you constrain the crew, and the user never learns the word "touch list".

### 5.5 The preview: the actual next revision, not a picture of one

The founder's line was "how the change previews before it commits, and how it lands as a real
changeset rather than as a fake preview". So:

**Path A preview.** The proposal's HTML is rendered into the same iframe by swapping `srcDoc`. Not
a screenshot, not a second frame, not a modal: the same frame you were just clicking in, now
showing the next revision. The frame chrome changes in three ways and no more:

```
┌──────────────────────────────────────────────────────────────────────┐
│ ● ● ●  relay/inbox/digest        V5 · proposed      [Use│Point]      │  <- badge goes ember
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│         ┌───────────────────────┐                              ✓1    │
│         │      Send digest      │                                    │
│         └───────────────────────┘                                    │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│ hold b for before   [ ] step marks    Keep ⌘⇧K    Send back ⌘⇧B      │  <- the preview bar
└──────────────────────────────────────────────────────────────────────┘
```

- **Hold `b`** to see Before. Release for After. One key, held, no toggle to get stuck in, and
  releasing always returns you to the truth. The swap is a 120ms opacity cross-fade with **no
  transform**, because the content moving is exactly what you are judging and the transition must
  not add motion of its own.
- **`[` and `]`** step to the previous and next mark, scrolling the frame to it.
- Each pin becomes its verdict: `✓1` done, `~3` partly, `×4` could not. Clicking a pin scrolls the
  Thread to that mark's row and reveals the crew's one line.
- **Nothing is written yet.** The proposal lives in the `prototype_messages` row with
  `applied:false`. That column is the whole state machine and it was already there.

**Keep (`⌘⇧K`)** does four things, all real:

1. `prd_scaffolds.html = proposal.html` via the existing `persistScaffold` upsert path.
2. `prototype_messages.applied = true` on the assistant row; each user mark whose verdict was
   `done` moves to `kept`; each `cant` **stays open**.
3. Writes a Receipt to the Ledger (existing machinery), naming the marks and the crew member.
4. Calls `recordDesignScaffoldFeedback({ prdId, approved: true, specExcerpt })`
   (`design-memory.functions.ts:538`), so the accepted change becomes a candidate design-memory
   entry. **The mark is how the brain learns what you like, without asking you one preference
   question.**

**Send back (`⌘⇧B`)** leaves `applied:false`, stores `changes_json.sent_back_reason`, reopens the
marks, restores the frame, and puts one line in the Thread using the string the lexicon already
ruled on: `Sent back. Nothing runs without you.`

**Path B preview: the diff, with mark-level accept.**

This is where it stops being a preview and becomes a changeset, using only primitives that ship
today.

1. The run stages via `studio.stage` (`registry.server.ts:1398`), producing `studio_changes` rows
   with `base_content` and `new_content`.
2. If a previewable HTML file exists, `getStudioPreview` (`studio.functions.ts:2061`) already picks
   the best one and returns it for the iframe. Reuse verbatim. Above the fold: the rendered result.
   Below: the diff.
3. `computeHunks(base, new)` (`studio-hunks.ts:90`) produces the hunks. **Attribution:** each mark's
   proposal returned `touched: [{ path, anchor }]`; a hunk belongs to the mark whose anchor text
   falls inside it. Hunks nobody claims go into a `shared` group.
4. The diff panel groups hunks **by mark**, not by file. That is the inversion that makes a diff
   readable by a PM: `1 · move this right` opens to two hunks in one file.
5. Rejecting one mark calls
   `applyStagedHunkSelection({ changesetId, path, rejectedHunkIds, expectedUpdatedAt })`
   (`studio.functions.ts:1816`), passing exactly that mark's hunk ids. Dropping a whole file calls
   `rejectStagedFile`. The `expectedUpdatedAt` token is already there and already produces the right
   error, which we surface verbatim: `This file changed since you opened it. Refresh and reapply.`
6. The `shared` group can only be accepted or rejected whole. We say so in one line rather than
   pretending perfect attribution: `4 changes belong to more than one mark.` Honesty about an
   ambiguity is cheaper than a wrong confident answer.

**This is the sentence that makes it real: a mark becomes a named group of hunks in a pull request
that a human accepted or rejected individually, on a branch, with CI, merged only on green.** All
of that machinery already exists; the mark is what finally gives a rejected hunk a *reason*, which
today it does not have.

### 5.6 Addressability

Per FINAL-ia §6.1, anything with its own data fetch is addressable. A mark gets one param, added to
the room's grammar, orthogonal to everything else:

```
?stage=design&focus=prototype:pr_88&mark=mk_3
```

Opening that URL: the room opens on Design, the prototype loads, the frame scrolls the marked
element into view, the pin flashes once (400ms ember, opacity only), and the Thread scrolls to that
row. Paste it to a colleague and they see the thing you are pointing at. That is the whole reason
the param exists.

---

## 6. (d) MANY MARKS AT ONCE

### 6.1 The Thread group, drawn

```
 ── 3 marks on V4 ────────────────────── Send ⌘⏎ ──
 ◉1  move this right
     primary action, in card 2
 ◉2  make this shorter                              ⌶
     heading, direct edit
 ◉3  why are there two of these?
     card, row of 2
     ⌐ 1 and 3 both move this button. 3 wins.
       drop 1    keep both
```

- The header is the only place the count lives. One count, one source, per FINAL-ia's law.
- Numbering is **placement order and stable**. Dropping mark 2 does not renumber 3. Renumbering
  breaks the map between the pin you are looking at and the line you are reading, and that map is
  the entire mechanism.
- Numbers reset per artifact revision, on Keep.
- A `⌶` at the row's right edge marks a direct edit rather than a request, so scanning the group
  tells you what you did yourself and what you asked for.
- Cap at 5 visible rows, then `+3 more` expands **in place** (a peel, no URL, per FINAL-ia §6.4).
  The Thread never scrolls the room.

### 6.2 Batched, or one at a time, with one mechanism

Batched is the default and §5.3 argues why. One at a time is not a separate mode: **select a row
and press `⌘⏎`** and only that mark sends. The header count updates to `2 marks · 1 sending`.
There is no "apply individually" toggle, because there is no second mechanism, only a selection.

Order is placement order, and the crew is told the marks are ordered and may interact.

### 6.3 Conflicts, three kinds, three readings

**1. Same target, two intents.** Detected **client-side before sending**, by ref path equality or
containment. It costs nothing and it happens before we spend a model call.

```
 ⌐ 1 and 3 both move this button. 3 wins if you send both.
   drop 1    keep both
```

The rule (last placed wins) is **stated, not hidden**. `keep both` sends them in order and lets the
crew reconcile, which is sometimes right ("move it right" then "and make it smaller").

**2. Nested target.** Mark 2 on a card, mark 5 on a button inside that card. That is not a conflict,
it is a hierarchy. Mark 5 renders indented under mark 2 with `inside 2` in `--ink-faint`. The crew
receives them outer first. No control, no warning, no decision asked of the user.

**3. The crew could not.** After the proposal returns, that mark keeps its number, its pin becomes
`×`, and the row carries the reason in the crew's own words:

```
 ×4  put this above the card
     couldn't: the card is a grid with one column. There is no "above" here
     that isn't the page header.                       re-point    drop
```

The mark **stays open** through Keep. `re-point` returns you to Point mode carrying your text.

### 6.4 Stale, orphaned, and other people

- **Stale anchor:** re-anchored by fingerprint (§3.4). If that fails, orphaned, never deleted.
- **A second person marking the same artifact:** `prototype_messages` is workspace-scoped since
  `20260619212731_*.sql:430`, so this is already supported at the data layer. A pin authored by
  someone else shows their initials instead of the number, in 8px mono under the pin. The Thread
  row shows their name. A send takes all open marks, including theirs, and the Thread says
  `Priya sent 5 marks, 2 of them yours.`
- **Stale send:** the send carries the artifact revision it saw. A stale send fails with the
  existing idiom's message shape from `applyStagedHunkSelection`:
  `This changed since you opened it. Refresh and send again.` One error string, reused, not
  reinvented.

---

## 7. (e) BEYOND PROTOTYPES: the general gesture and its seven specialisations

The gesture is fixed. Three things vary, and only three.

| Artifact | Target unit | Ontology source (exists today) | Direct-edit classes | Executes via (exists today) | Lands in |
| --- | --- | --- | --- | --- | --- |
| **Prototype**, scaffold | DOM element, text range | probe + `MOCKUP_CSS` class vocabulary | text, value | `callModel` surface `prd` + `persistScaffold` | `prd_scaffolds.html` |
| **Prototype**, promoted | same | same | text, value | `dispatchStudioSession` with a mark-derived touch list | `prototype_files`, `studio_changes` |
| **Spec** | a heading, a numbered clause, a paragraph, a table row | `parseSpecSections()` `faces.tsx:620`, which already returns `{title, items:[{num,text}], prose}` | text (a clause's words), value (a number in a metric) | `prd.revise({prd_id, instruction})` `registry.server.ts:2489`, which already snapshots `snapshot_before` for one-key rewind and writes the `revised` lineage edge | `prds.body_md` |
| **Roadmap** | a bet row, a bucket | `opportunities` rows | value (bucket, owner, date) | `roadmap.move` `registry.server.ts:2636` | `opportunities` |
| **Plan** | a step, a dependency edge | task graph nodes | text (title), value (estimate, owner) | `tasks.update_status`, `backlog.prioritize` | `tasks` |
| **Diff** | a hunk, a line, a file | `computeHunks()` `studio-hunks.ts:90` | none | steer, or `studio.stage` inside a Run | `studio_changes.new_content` |
| **Decision** | a rationale paragraph | `decisions.rationale` | none | `decision.revise` `registry.server.ts:2565` | `decisions.rationale` |
| **Signal** | a quoted line | text-quote selector | none | `memory.remember`, `notes.create` | signals, notes |
| **Belief** (Brain) | a claim row | Beliefs list | none | challenge, never edit | brain |

Three of these need a real specialisation, because a generic gesture would feel wrong on them. The
rest take the gesture unchanged.

### 7.1 The spec: marks live in the gutter

A spec is prose you read top to bottom. A pin **in** the text breaks the reading line, which is the
one thing you must not do to a document.

So the spec's marks sit in a **28px gutter** at the left of the document column, aligned to the
marked line's baseline. The marked line takes a 2px ember bar in the gutter. No dimming, no
highlight behind the text, no yellow. Hovering a gutter bar highlights the matching Thread row and
nothing else moves.

**The one idiosyncratic detail on this surface:** the gutter shows the **clause number** (`3.2`),
not the mark number. In a spec, the clause number is the thing people say out loud in a meeting.
`parseSpecSections()` already parses `{ num, text }` per item, so the number is there for free and
it is the number that matters.

```
      │ ## 3. What done means
      │
 ▌3.2 │ 3.1  A digest sends at 5pm local time.
      │ 3.2  The digest lists at most 12 items.
      │ 3.3  An empty digest does not send.
```

Marking a clause and typing `12 is arbitrary, tie it to what fits one screen` compiles into
`prd.revise({ prd_id, instruction })` with the clause quoted verbatim as the anchor. `prd.revise`
already snapshots the prior body and writes a lineage edge attributed to Writer, so the rewind and
the Trust Ledger entry come along with no new code.

### 7.2 The roadmap: the value case, done properly

A roadmap row's markable parts are almost all class **value**, which means almost every change here
is direct and instant: bucket, owner, date. §4.4's controls apply, and §4.4's `Now needs a promise`
composer is the governance gate.

The only class **none** targets on a roadmap are the ones that change what a commitment *means*:
adding a bet, removing a bet, and reordering in a way that changes sequencing. Those get the
composer and name Strategist.

### 7.3 The diff: no mode, and the reason a rejection finally gets one

A diff has no Use mode because there is nothing to activate, so it has **no toggle**. Every line is
markable always, and the gesture is **click the line number**, which is the universal review
gesture every engineer already owns from GitHub and Cursor.

This fills an honest gap in the current backend. Today `applyStagedHunkSelection` lets you reject
hunks but carries **no reason anywhere**. The agent learns nothing from a rejection, and the next
run makes the same mistake. With marks, rejecting a hunk and saying why produces both: the hunk
reverts to base via the existing call, and the reason compiles into a steer via
`steerStudioSession`. A real capability gain, from a gesture, with zero new tables.

### 7.4 Everything else takes the gesture unchanged

That is the point of designing the gesture first. Signals, decisions and plan steps need a target
ontology entry and a tool binding, both of which are table rows in `ontology.ts`, and then they
work.

---

## 8. THE SCREEN: what fits, what never scrolls

The founder: "Too much scroll we need to avoid: what can the user see within a particular screen".

```
┌───────────────────────────────────────────────────────────────────────┬──┐
│ ◈ helio-labs / relay ▾                       ⌘K   Ask ⌘J   ⚙   ◉      │◆3│
├───────────────────────────────────────────────────────────────────────┤12│
│ PRODUCT  01 Discover ─ 02 Decide ─ 03 Plan ─[04 Design]─ 05 Build ─ ..│ 7│
│              done         done       done      marking       ·        │ 4│
├──────────────────────────┬────────────────────────────────────────────┤ ·│
│ THREAD             380px │ CANVAS                                     │ 2│
│                          │ ┌────────────────────────────────────────┐ │ ·│
│ Designer rendered V4     │ │ ● ● ● relay/inbox/digest   [Use│Point] │ │ !│
│ from Spec 3 · 09:41      │ ├────────────────────────────────────────┤ │  │
│ ▸ read the spec          │ │                                     ▌  │ │  │
│                          │ │  Daily digest                       ▌  │ │  │
│ ── 3 marks on V4 ── ⌘⏎ ─ │ │  ┌──────────────────────────────┐   ▌  │ │  │
│ ◉1 move this right       │ │  │ ⌶ heading               ◉2   │      │ │  │
│    primary action        │ │  │ Everything since 5pm         │      │ │  │
│ ◉2 make this shorter   ⌶ │ │  └──────────────────────────────┘      │ │  │
│    heading, direct       │ │                                        │ │  │
│ ◉3 why two of these?     │ │      ┌ primary action ────────┐        │ │  │
│    card, row of 2        │ │      ╻                    ◉1  ╻        │ │  │
│    ⌐ 1 and 3 overlap     │ │           Send digest               ◉3 │ │  │
│      drop 1  keep both   │ │      ╹                        ╹        │ │  │
│                          │ └────────────────────────────────────────┘ │  │
├──────────────────────────┴────────────────────────────────────────────┤  │
│ ○ Nothing running · 3 marks waiting                          Send ⌘⏎  │  │
├───────────────────────────────────────────────────────────────────────┤  │
│ [ Ask or tell Supaprod to do something ]   next?  send marks  build   │  │
└───────────────────────────────────────────────────────────────────────┴──┘
                                                          the depth rail, 48px
```

**Five anti-scroll rules, each with a mechanism:**

1. **The composer never grows the page.** 260px wide, 1 line growing to 3, then it scrolls
   internally. It is positioned inside the frame and clamped to it.
2. **The Thread group caps at 5 rows**, then `+3 more` peels open in place. The Thread never pushes
   the WorkingStrip off screen.
3. **The frame does not grow.** The artifact scrolls inside the frame, which keeps its size.
4. **The edge ticks** (the `▌` marks on the frame's right inner edge in the drawing): a 2px ember
   tick at each off-screen mark's proportional scroll position. **You can see there are two marks
   below the fold without scrolling to find out.** Click a tick to scroll there. This is the scroll
   bar as a map, it is the one idiosyncratic detail on this surface, and it is the most direct
   possible answer to "what can the user see within a particular screen".
5. **Zero dialogs**, except `Drop all 5 marks?`, which is destructive and therefore correct.

---

## 9. KEYS, COMPLETE

Reserved and untouched: `1`-`7` (Spine), `g k r m t c e` (depth rail), `⌘K` (palette), `⌘J` (Ask).

| Key | Context | Does |
| --- | --- | --- |
| `p` | canvas | toggle Point mode |
| hold `⌥` | canvas | momentary Point mode |
| click | Point mode | select |
| double-click | any mode | select, bypassing the mode |
| `⌥`-click | selected | expand selection to the parent |
| `Enter` / any character | selected, class text or value | edit in place |
| `Enter` | selected, class none | open the composer |
| `Enter` | composer | place the mark |
| `⇧Enter` | composer | new line |
| `⌘Enter` | composer | place and send now |
| `⌘Enter` | inline editor | promote to a mark instead of editing |
| `⌘Enter` | Thread | send all open marks, or the selected one |
| `Escape` | composer | drop the mark |
| `Escape` | inline editor | cancel the edit |
| `Escape` | Point mode | leave Point mode |
| `[` / `]` | preview | previous / next mark |
| hold `b` | preview | show Before, release for After |
| `⌘⇧K` | preview | Keep |
| `⌘⇧B` | preview | Send back |
| `↑` / `↓` | Thread group | move between mark rows, scrolling the frame to each |

Every one of these is announced through `aria-keyshortcuts` on its owning element, and the full set
is in the palette under `marks`, which is how a keyboard is discovered without a cheat sheet.

---

## 10. MOTION

Craft law bans `linear` and `ease-in-out`, and bans animating `width`, `height`, `top`, `left`.
Everything here is `transform` and `opacity` only.

| Moment | Duration | Curve | Property |
| --- | --- | --- | --- |
| ticks appear on hover | 90ms | `cubic-bezier(.2,0,0,1)` | opacity |
| mark flies to the Thread | 180ms | `cubic-bezier(.22,1,.36,1)` | transform, opacity |
| pin appears | 140ms | `cubic-bezier(.34,1.56,.64,1)` | transform: scale |
| Before/After swap | 120ms | `cubic-bezier(.4,0,.2,1)` | opacity only, no transform |
| composing veil | 100ms | `cubic-bezier(.2,0,0,1)` | opacity |
| sent pulse | 1400ms loop | `cubic-bezier(.4,0,.6,1)` | opacity 1 to .45 |
| deep-link pin flash | 400ms | `cubic-bezier(.2,0,0,1)` | opacity |

The pin's overshoot is the only overshoot in the model. One piece of personality, per craft law's
"exactly one, or it becomes noise".

`prefers-reduced-motion: reduce`: every duration above becomes 0ms; the fly-to-Thread becomes an
instant placement plus a 400ms opacity flash on the destination row, so the connection is still
taught, without motion.

---

## 11. COMPONENTS AND FILES

```
src/components/mark/
  MarkProvider.tsx      mode, open marks, selected ref, send/keep. One context, one owner.
  MarkOverlay.tsx       the corner ticks + role label chip. Portal. One implementation of the
                        visual, fed by two geometry sources (the bridge, or getBoundingClientRect).
  MarkPin.tsx           numbered pin, state glyph, author initials, 28px hit area
  MarkComposer.tsx      the 260px at-element input
  MarkGroup.tsx         the Thread group: header, rows, conflict lines, the peel
  MarkRow.tsx           one mark in the Thread
  InlineText.tsx        the direct-edit field for class text
  ValueControl.tsx      segmented / date / person / stepper for class value
  MarkPreviewBar.tsx    hold-b scrub, step marks, Keep, Send back
  MarkEdgeTicks.tsx     the off-screen mark map on the frame's inner edge
  MarkDiffGroup.tsx     the diff, grouped by mark instead of by file

src/lib/mark/
  ref.ts                SelectionRef, fingerprint(), reanchor()
  probe.ts              the injected script, as a string constant, plus withProbe(html, nonce)
  bridge.ts             the postMessage protocol, the two-factor guard, the rAF viewport pump
  ontology.ts           per-artifact target rules, role table, classify()
  compile.ts            marks -> the instruction block (the wire format in 5.4)
  attribute.ts          hunk -> mark attribution, and the shared group

src/lib/marks.functions.ts   (server, TanStack, RLS-scoped like prototypes.functions.ts)
  listMarks · placeMark · dropMark · applyDirectEdit · reanchorMark
  proposeMarkResolution · keepProposal · sendBackProposal
```

**Migrations needed: for the prototype path, none.** `prototype_messages` and
`prototype_attachments` already carry every column this design uses. Extending marks to specs,
roadmaps and diffs needs one generic table (`artifact_marks`, same five columns plus
`artifact_kind` and `artifact_id`) at phase 3, not before. Prove the loop on the tables that are
already there.

**Call sites to change:**

- `faces.tsx:1283`, `DesignScaffoldPanel.tsx:272`, `PreviewPanel.tsx:171`:
  `srcDoc={scaffoldHtml}` becomes `srcDoc={withProbe(scaffoldHtml, nonce)}`.
- `p.$slug.tsx:141`: **unchanged**, deliberately. The public viewer gets no probe.
- `faces.tsx:1046` `DesignRail()`: deleted, replaced by `MarkGroup` in the Thread.
- `faces.tsx:1150`: fix the wrong comment about same-origin.
- `faces.tsx:1228-1315`, the four fake state chips: see §12.

---

## 12. WHAT THIS KILLS

| Killed | Why |
| --- | --- |
| `DesignRail()` `faces.tsx:1046` | Read-only annotation rail with no data behind it. Right instinct, no substance. |
| The hardcoded `relay.heliolabs.com/inbox/digest` `faces.tsx:1267` and `Interactive · V4` `:1276` | Demo fiction in a shipped component. The URL comes from the prototype, the version from the revision count. |
| The four state chips' hardcoded bodies `faces.tsx:1293-1315` | Three of four chips render a lie. Honest replacement: the chips stay, but `Empty` and `Error` render only if the generator produced those variants, and if it did not, the chip is a **mark affordance**: click `Empty`, and the composer opens pre-filled with `there is no empty state yet`, addressed to Designer. A missing state becomes a request instead of a fake. |
| `faces.tsx:1340` "1 screen, 4 states, 3 clickable paths" | A literal string presented as a count. Either count it or do not say it. |
| The free-text steer box as the primary way to correct a run | It stays as an escape hatch. Marks become the primary input because they carry scope, and scope is what makes a correction land. |

---

## 13. BUILD ORDER

Each phase ends at something demonstrable, and "done" is testable.

**Phase 1: the founder's example, end to end, prototype only.**
probe + bridge + `SelectionRef` + Point mode + composer + `MarkGroup` + `proposeMarkResolution` +
`srcDoc` preview + Keep.
*Done means:* click a button in a rendered mockup, type "move this right", press `⌘⏎`, watch the
same frame render the next revision, hold `b` to compare, press `⌘⇧K`, and the change is in
`prd_scaffolds`, on the Ledger, and still there tomorrow.

**Phase 2: the division.**
`classify()` + the two-cursor law + `InlineText` + `ValueControl` + `applyDirectEdit` with
fingerprint verification and the degrade-to-mark failure path.
*Done means:* a heading is typed over and saved with no model call and no cost, and a card cannot
be typed over at all, and nobody had to be told which is which.

**Phase 3: the other artifacts.**
`artifact_marks` + spec gutter + roadmap value controls + diff line marks + the ontology rows for
each.
*Done means:* the same four keys work on a clause, a roadmap row and a diff line.

**Phase 4: mark-level accept on a real changeset.**
`attribute.ts` + `MarkDiffGroup` + the wiring into `applyStagedHunkSelection` and
`rejectStagedFile` + the mark-derived touch list into `dispatchStudioSession`.
*Done means:* a mark on a prototype becomes a named group of hunks in a pull request that a human
accepted individually, and the pull request merged on green CI.

**Phase 5: the compounding.**
`recordDesignScaffoldFeedback` on Keep + the repeated-mark pattern detector + orphan re-anchor +
multi-person pins.
*Done means:* after six marks moving a primary action right, the workspace is offered one
design-memory entry, and once accepted, the next generated mockup does not need the mark.

---

## 14. THE 40 SECONDS I WOULD PUT IN FRONT OF THE BOARD

1. A rendered mockup of a real spec, in the customer's brand. `0:00`
2. Press `p`. The frame's border goes ember. Hover the primary button: corner ticks, and the label
   reads `primary action`. `0:04`
3. Click. Type `move this right`. Enter. The card flies into the Thread, a pin stays behind. `0:09`
4. Click the heading. The cursor is an I-beam. Type over it. It saves. **No spinner, no agent, no
   cost.** Say the sentence: *text you can change, you change.* `0:16`
5. Mark two more things. `⌘⏎`. `0:22`
6. The same frame renders the next revision. Hold `b`: the button snaps back left. Release: right.
   Pin 3 shows `×` and one honest line: it could not, and why. `0:31`
7. `⌘⇧K`. Now the part nobody else has: open the Build face. That change is staged in a real
   changeset, on a branch, and the diff is **grouped by the marks you made**. Reject mark 1's hunk
   alone. `0:38`
8. Open the Brain. One new line: *you have moved a primary action right six times. Should this be
   how we build them?* `0:40`

**The line:** every other tool lets you comment on a preview. Ours turns the comment into an
attributable hunk in a real pull request, writes it to the Ledger, and teaches the workspace what
you like so the next render does not need the mark at all.

---

## 15. WHAT I DO NOT OWN, AND WHAT I NEED FROM THE OTHER TWO

**Handoff to the conversation angle (IX-B):**

- I write into the Thread and I define one entry type, `MarkGroup`. I do not own the Thread's other
  content, its scroll behaviour, its hydration, or the Ask history. The interface I need is:
  *the Thread accepts a pinned group that sits at its foot while any mark is open, and returns to
  normal flow when the group resolves.*
- The Composer's intent chips include `send marks` when marks are open. That chip is mine to
  populate, the chip system is yours.
- **The requirement I am asserting:** `steerStudioSession` is now called from two places (the
  Thread's free-text steer, and a compiled mark block). One compiler, one call site,
  `src/lib/mark/compile.ts`. Do not add a second steer path.

**Handoff to the state and depth angle (IX-C):**

- **The Spine must stay in Product mode while marks are open.** Placing a mark is not starting a
  run. It flips to Run mode only when a real `dispatchStudioSession` fires (Path B), never on Path
  A, which is one model call and not a run.
- The WorkingStrip line while marks are open is `Nothing running · 3 marks waiting`, and it must
  not claim work is happening when none is.
- The depth rail's `What we made` tile (`?pane=made`) should show a mark count per artifact. I need
  a count, you own the tile.

**Handoff to the adaptive lane:** below roughly 900px the Thread collapses. Marks then live in a
bottom sheet at 40% height with the same group, the same numbers, the same keys. The pins and the
overlay do not change. I am asserting the contract, not the breakpoint mechanics.

**Handoff to the directions lane:** I used exactly one accent, ember, doing exactly one job. If the
chosen direction assigns ember a different job, marks take whatever colour means "your attention is
here" on that surface, and nothing else changes. No second hue is introduced by this model.

**Open question I could not close from code:** whether a promoted prototype's `prototype_files`
rows and a live `studio_changes` row can point at the same path at once. If they can, Path B needs
a precedence rule. `prototypes.functions.ts` does not write `studio_changes` and `studio.stage`
does not read `prototype_files`, so today they cannot collide, but the promote path is thin enough
that a future change could make them. Worth one guard.
