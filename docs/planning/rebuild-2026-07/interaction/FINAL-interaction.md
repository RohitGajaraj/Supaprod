# FINAL: the Supaprod interaction contract

> _Created: 2026-07-29 · Last updated: 2026-08-03_

> **The ruling.** Head of Product Design, 2026-07-28, under the founder's mandate of the same day,
> which grants authority to override any earlier decision including his own.
>
> Merges [`ix-a-direct-manipulation.md`](./ix-a-direct-manipulation.md) (the Mark),
> [`ix-b-surface-depth.md`](./ix-b-surface-depth.md) (per-surface depth),
> [`ix-c-screen-economy.md`](./ix-c-screen-economy.md) (the block axis).
> Every conflict between them is resolved in §16 with the reason and the loser named.
>
> Binding above this document: [`craft-law.md`](../craft-law.md),
> [`ia/FINAL-ia.md`](../ia/FINAL-ia.md), [`language/FINAL-language.md`](../language/FINAL-language.md),
> [`conventions/humanized-output.md`](../../../conventions/humanized-output.md).
> Where this document extends those, it says so. Where it corrects them, it shows the arithmetic
> or the line of code.

---

## 0. THE DOCTRINE, IN THREE SENTENCES

**You point at a thing and change it.** Text you can type into, you type into, and it saves with no
model call and no cost. Anything structural, you point at it and say what should change in your own
words, and the crew does it, and what comes back is the actual next revision that you scrub against
the current one and approve or send back.

**Selection is the whole mechanism.** One piece of room state says what you are pointing at; the
composer, the crew, the scope of the run and the record all read it, which is why the agent knows
what "this" means and why the conversation never needs a column of its own.

**Every gesture costs zero pixels, which is why it fits.** A properties panel is a column, a comment
sidebar is a column, a chat pane is a column, and at the height and width of the laptop the founder
actually uses there is no third column to give away. The manipulation layer is an overlay on the
object, never a region beside it.

**The one sentence for the board:** every other tool lets you comment on a preview; ours turns the
comment into an attributable group of hunks in a real pull request, writes it to the record, and
teaches the workspace what you like so the next render does not need the comment at all.

---

## 1. GROUND TRUTH, CORRECTED

The three lanes disagreed on four load-bearing facts. Every one was checked against the tree this
session. Two of the three lanes were right and one inherited an error from the brief.

### 1.1 The four corrections

| # | Claim | Verified | Consequence |
| --- | --- | --- | --- |
| **G1** | The Design face renders "same-origin `srcDoc`" (brief, and IX-C §9.2 repeats it) | **False.** All four render sites are `sandbox="allow-scripts"` with **no `allow-same-origin`**: `faces.tsx:1284`, `DesignScaffoldPanel.tsx:273`, `PreviewPanel.tsx:171`, `p.$slug.tsx:141`. A sandboxed frame without that flag runs at an opaque origin, so the parent cannot touch `contentDocument` at all. The comment at `faces.tsx:1150` saying "rendered same-origin via srcDoc" is wrong and is deleted. | Reach-in is **`postMessage` only**, forever. `allow-scripts` plus `allow-same-origin` is a documented sandbox escape (the frame reaches `parent.frameElement.removeAttribute('sandbox')`), so adding it is banned and lint-enforced. Every design in §3 follows from this. IX-A and IX-B win; IX-C's §9.2 mechanism survives, its premise does not. |
| **G2** | Hunk-level accept and reject "exists in the backend and is not surfaced" | **Half false.** It is surfaced, in `src/components/studio/ChangesPanel.tsx` (1367 lines): `computeHunks` at `:24`, per-hunk reject list at `:1259-1362`, `applyStagedHunkSelection` at `:176`, `rejectStagedFile` at `:177`. Its one importer is `_authenticated.build.$missionId.tsx`. **There are three `computeHunks` call sites**: `ChangesPanel.tsx:408`, `VerifyCockpit.tsx:348`, and a second hand-rolled line differ at `faces.tsx:1705-1875`. | The work is not "surface a hidden capability". It is: the interaction is **reject-only and framed as damage** (`Apply (2 rejected)` gives no signal when you agree), and there are **three diff renderers and two diff algorithms**. §7.3 rewrites one and deletes the others. IX-B wins this correction outright. |
| **G3** | `prototype_messages` / `prototype_attachments` are unused tables | **True, and better than that.** `prototype_messages` (migration `20260602204826_*.sql:390`) carries exactly `role ('user'/'assistant'/'system')`, `content`, `changes_json jsonb`, `applied boolean`, `created_at`; `prototype_attachments` (`:405`) carries `message_id`, `kind`, `storage_path`, `size_bytes`, `extracted_text`. Both got `workspace_id` backfilled NOT NULL, indexed, with a `set_row_workspace_from_user` trigger and an RLS policy in `20260619212731_*.sql:430-452`. Both appear in `types.ts:6139` and `:6240`. Neither is referenced anywhere in `src/`. | **The founder's headline ask needs zero migration for its storage.** `changes_json` is where a `SelectionRef` lives, `applied` is the whole proposal state machine, and `message_id` on an attachment means "this screenshot belongs to this comment". Somebody designed this and stopped. |
| **G4** | (unstated by the brief; found by IX-C) A generated prototype has history | **False, and this is the most important honesty item in the document.** `prd_scaffolds` is **one row per PRD**: `persistScaffold` upserts `onConflict: "prd_id"` (`design-scaffold.functions.ts:225-238`) and `getPersistedScaffold` reads `.maybeSingle()` (`:274`). There is no `prd_scaffold_revisions` table anywhere in `supabase/migrations/` or `src/`. | **A direct edit today has nothing to undo to.** Shipping "type on it and it saves" onto an upsert with no history is a one-way door, and nobody uses a one-way door twice. `prd_scaffold_revisions` is a **required migration in phase 1**, not phase 5. IX-C found this and it changes the build order. |

### 1.2 What we build on, all real

| Capability | Where |
| --- | --- |
| Generated mockup HTML, persisted, rendered in a device frame | `design-scaffold.functions.ts:245` `generateDesignScaffold`, `:268` `getPersistedScaffold`, `:294` `prepareScaffoldSpeculative` (fire and forget, idempotent, never throws into its caller: the named `speculative prep` pattern) |
| A **pre-agreed element vocabulary the generator already emits**: `btn btn-primary`, `btn btn-secondary`, `input`, `.card`, `.badge`, plus `MOCKUP_CSS`'s `.form-group .section-title .empty-state .sidebar .brand` | `design-scaffold.functions.ts:99`, `MOCKUP_CSS` at `:44-83` |
| Hunk-level accept and reject with optimistic concurrency (`expectedUpdatedAt`) | `studio.functions.ts:1816` `applyStagedHunkSelection`, `:1872` `rejectStagedFile` |
| Declared scope enforcement on a run | `studio.functions.ts:1904` `setChangesetConstraints`, `:1967` `enforceTouchList`, `dispatchStudioSession({ allowedPaths, maxFiles })` at `:179` |
| Mid-run steering, consumed only after the checkpoint persists, so a steer is never both applied and lost | `studio.functions.ts:974` `steerStudioSession` |
| Changeset revision trail and rewind (the pattern the scaffold lacks) | `studio.functions.ts:1036` `getChangesetRevisions`, `:1235` `revertToRevision` |
| A previewable HTML file picked out of a changeset for the iframe | `studio.functions.ts:2061` `getStudioPreview` |
| Pure, unit-tested hunk maths | `src/lib/ai/studio-hunks.ts`: `computeHunks`, `applyHunkSelection`, `applyChangesetHunkSelections`, `matchesTouchList` |
| Structured run steps, a discriminated union of `thought` / `tool_call` / `final` | `loop.server.ts:214-227`, carried to the client by `studio.functions.ts:104` |
| Revise-in-place tools that snapshot the prior value and attribute the edit | `registry.server.ts:2489` `prd.revise`, `:2565` `decision.revise`, `:2636` `roadmap.move` |
| A parsed clause ontology for specs, already returning `{ num, text }` per item | `faces.tsx:620` `parseSpecSections()` |
| Workspace taste memory, written back from design verdicts | `design-memory.functions.ts:104` `getActiveDesignMemoryForWorkspace`, `:538` `recordDesignScaffoldFeedback` |
| `CallSurface` already contains `"prd"`, which `design-scaffold` uses | `runtime.server.ts:313`. **No union change, no new gateway call, no `runtime.server.ts` edit.** |
| tiptap and monaco are installed dependencies | `package.json` |

### 1.3 Defects fixed as a consequence, not as a favour

1. `faces.tsx:1267` hardcodes `relay.heliolabs.com/inbox/digest` into the device frame's URL bar and
   `:1276` hardcodes the badge `Interactive · V4`. Demo fiction inside a shipped component. The URL
   comes from the prototype; the version comes from the revision count that G4's migration creates.
2. `faces.tsx:1228-1246` renders four state chips whose `Loading` / `Empty` / `Error` bodies are
   hardcoded English about a digest that does not exist (`:1293-1315`). Three of four chips render a
   lie. Honest replacement in §7.2.
3. `faces.tsx:1046` `DesignRail()` is a read-only annotation rail with no data behind it. Right
   instinct, no substance. Marks replace it.
4. `faces.tsx:1340` states "1 screen, 4 states, 3 clickable paths" as a literal string, uncounted.
   Either count it or do not say it.
5. `CanvasFace.tsx:212` wraps all `children` in one `overflow-y-auto`, so **every face's receipt and
   forward door scroll out of view**. This single defect explains most of "too much scroll". Fixed
   structurally in §9.3.
6. Nested scrolls: `SpecDoc` sets `max-h-[460px] overflow-y-auto` (`faces.tsx:682`) inside a body
   that is 280px tall at the floor, so the inner never scrolls and the outer always does. The device
   frame is `min-h-[440px]` with a `min-h-[400px]` iframe (`faces.tsx:1249, 1285`) inside the same
   280px. On the surface whose entire job is showing the artifact, the artifact does not fit.

---

## 2. THE SIX LAWS

Everything below is generated by these. If a spec and a law disagree, the law wins.

**L1. Selection is the address.**
Anything a user can point at can be selected, and selecting it changes what the composer means. If a
thing renders and cannot be selected, either give it a selection or stop rendering it as an object.
No artifact is allowed to be a picture.

**L2. If changing it changes only what it says, you change it. If changing it changes how it works,
you say what you want and the crew changes it.**
This sentence appears exactly once in the product, in the Design face's first-run state. After that
the interface carries it without words, through the cursor (§5.3).

**L3. Machine output is a proposal until a human approves it.**
Never an in-place mutation discovered afterwards. The single exception is a change the user typed
themselves, which commits directly, because it was already their judgment.

**L4. Hover reveals, it never adds.**
Affordances occupy reserved space at rest at `--ink-faint` and rise to `--ink-body` on hover or
focus. Nothing shifts layout on hover. A control that exists only on hover does not exist on touch,
on a keyboard, or in a demo recording, and it is the most common reason a product tests as "I did
not know I could do that". **Budget 17: zero hover-only affordances.**

**L5. One primary gesture per artifact, and it is the same gesture as reading.**
The primary gesture is the one a naive user performs by accident: clicking a hunk, clicking an
element, clicking a row. If your primary gesture needs instruction, it is wrong.

**L6. The manipulation layer is an overlay on the object. A gesture that requires a new region has
failed and must be redesigned.**
Enforced by budget 20 (`[data-region]` count is exactly 8, and no feature may add a ninth). This is
not an aesthetic preference. It is the arithmetic of §9.

---

## 3. THE SELECTION MODEL

### 3.1 The gesture, and the word

> **Point at a thing. Say what should change. It becomes a mark. Marks go to the crew together,
> come back as one proposal, and you approve it or send it back.**

Four verbs: **point, say, send, judge.** They do not change per surface. Only two things change per
artifact: what counts as a target, and which tool executes.

A **mark** is a proof reader's mark. You point at a spot on the page, you write a terse instruction
in the margin, and someone else executes it. The craft is four hundred years old, it is unambiguous,
and it hands us the whole visual grammar for free: a numbered pin, a margin, a caret for insert, a
strike for cut. It is the one word for this concept per the lexicon's law.

**Banned beside it:** `annotation`, `comment` (as a noun for this object), `feedback`, `note`,
`suggestion`, `request`, `ticket`, `todo`. The verb is **mark**; the plural surface is **the marks**;
the thing on the artifact is **a pin**. Never "commenting mode", never "annotation layer".

> Collision resolved: `SupaprodMark` (`src/components/supaprod/SupaprodMark.tsx`) is the seven-petal
> brand glyph and is untouched per craft law §1. It is never rendered as the word "mark", so the
> user-facing noun and the component name never meet. New components namespace as `Mark*` under
> `src/components/mark/`.

### 3.2 Two modes, not three, and the mode is always visible

The founder wants prototypes that are clickable **and** markable. Those two want the same click.
Lovable and v0 resolve it with a toggle you find by accident. We show the mode at all times, in the
frame chrome, as a two-position segmented control where a fake URL sits today:

```
┌──────────────────────────────────────────────────────────────┐
│ ● ● ●   relay/inbox/digest              ┌──────┬───────┐     │
│                                         │ Use  │ Point │     │
│                                         └──────┴───────┘     │
├──────────────────────────────────────────────────────────────┤
```

- **Use** (default): clicks go to the prototype. It behaves like the real thing.
- **Point**: clicks select instead of activate. The cursor changes per §5.3. The frame's inner border
  goes from `--ink-hairline` to a 1px ember hairline at 40%, so from across the room you know which
  mode the screen is in.

**Three ways in**, because a mode reachable one way is a mode people forget exists:

1. Press **`v`**. Toggles. (`v` is the select tool in Figma, Illustrator, Sketch and every design
   tool the user already owns. It is also free: the Spine owns `1`-`7`, the rail owns `g k r m t c e`,
   and the artifact band's `p` is "previous".)
2. **Hold `⌥`** for momentary Point, released back to Use.
3. **Double-click anything, in either mode.** A deliberate act may bypass the mode. This is the
   escape for the person who never learned the toggle.

`Escape` leaves Point mode, one layer at a time per FINAL-ia §6.3.

**Surfaces with no Use mode get no toggle at all.** A spec, a roadmap, a diff, a run log: everything
is markable always because there is nothing to activate. Never render a control for a choice that
does not exist. This kills IX-B's third mode ("Note"): a mark **is** the note, and a separate mode
for it is a third thing to learn for zero gain.

### 3.3 Inside the iframe: the probe

A ~4KB script string, `src/lib/mark/probe.ts`, appended into `srcDoc` before `</body>` by
`withProbe(html, nonce)`. It is the only code that touches the generated DOM. The generator is
already instructed to emit no `<script>` tags (`design-scaffold.functions.ts:93`), so ours is the
only script in the document.

```
parent (Supaprod)                          iframe (opaque origin)
──────────────────                         ──────────────────────
  MarkProvider ───── srcDoc: html + probe ──▶ probe boots
       ◀── sp.ready   { nonce, docSize } ────┤
       ─── sp.setMode { mode:"point" } ─────▶│  cursor on, listeners on
       ◀── sp.hover   { nonce, ref } ────────┤  rAF-throttled
       ─── sp.highlight { path } ───────────▶│
       ◀── sp.select  { nonce, ref } ────────┤  on click
       ◀── sp.viewport{ nonce, rects[] } ────┤  on scroll/resize, rAF, max 40
       ─── sp.scrollTo{ path } ─────────────▶│
       ─── sp.beginInline { path } ─────────▶│  contenteditable on, caret placed
       ◀── sp.inlineCommit { nonce, ref, before, after }
```

**Security, stated because it is load-bearing (G1).**

- **Never add `allow-same-origin`.** With `allow-scripts` present it is an escape hatch. Lint rule:
  `no-same-origin-sandbox` fails any `sandbox` attribute containing both.
- The probe posts `parent.postMessage(msg, "*")`, because an opaque origin has no origin to target.
  **Origin string checks are therefore useless**: every sandboxed frame reports `"null"`.
- The parent's guard is **two-factor, both required**: `e.source === iframeRef.current.contentWindow`
  (window identity, not a string) **and** `e.data.nonce === thisMountNonce` (a per-mount
  `crypto.randomUUID()` baked into the probe string at render time). Identity blocks a sibling frame;
  the nonce blocks a nested frame the generated HTML might contain.
- The probe never `eval`s, never posts more than 4KB, never reads cookies, storage or the parent, and
  has no network to add. Its styles inject into ids prefixed `__sp_` so a generated class can never
  collide with `MOCKUP_CSS`.
- **`p.$slug.tsx` (the public share viewer) never gets the probe.** A public viewer has no marks and
  no session. `withProbe` is called at the three authenticated sites only.
- **Open item O5 stands: security review signs off the probe before it ships publicly.** It is our own
  generated HTML, four message types, no same-origin. That is a defensible posture, not a proof.

### 3.4 What counts as a target

Not `event.target`. A click on the `<span>` inside a button's label must select the button.

The probe walks up from the hit node to the first **nameable** ancestor, in priority order:

1. A form control: `input`, `textarea`, `select`, `button`.
2. A class from the generator's declared vocabulary: `.card`, `.btn`, `.badge`, `.form-group`,
   `.section-title`, `.empty-state`, `.sidebar`, `.nav-links`, `.brand`. **This is why
   `design-scaffold.functions.ts:99` is load-bearing: it is already a pre-agreed element ontology,
   shipping today, that nobody has used yet.**
3. An ARIA role or a landmark: `nav`, `main`, `header`, `footer`, `section`, `table`, `tr`, `th`,
   `td`, `li`, `form`.
4. A heading `h1`-`h6`, a `p`, a `label`.
5. Fallback: the nearest block-level ancestor with a non-zero box.

Walking stops at `<body>`. A hit on `<body>` itself is refused, with one line in the frame corner:
`nothing to point at here`.

**`⌥`-click while selected walks the selection up one level** (button, then card, then row). The role
label updates as you go. Same convention as an editor's expand-selection. There is no tree view, ever.

### 3.5 The `SelectionRef`, which is the context the crew receives

This is the whole answer to "how selection becomes context". One type, server-free, unit-testable.

```ts
// src/lib/mark/ref.ts
export type SelectionRef = {
  artifact: {
    kind: "prototype" | "spec" | "roadmap" | "plan" | "diff" | "decision" | "signal" | "run";
    id: string;
    revision: string;          // prd_scaffolds.updated_at, or studio_changes.updated_at
  };
  target: {
    path: string;              // "body>main:1>div.card:2>button:1"  structural, deterministic
    fingerprint: string;       // sha1(tag | role | class list | trimmed text | nth-of-type)
    tag: string;               // "button"
    role: string;              // "primary action"  the product's words, never the DOM's
    text: string;              // visible text, clamped to 120 chars
    box: { x: number; y: number; w: number; h: number };
    place: {
      parentRole: string;      // "row of 2"
      index: number; of: number;
      ancestors: Array<{ role: string; text: string }>;   // up to 3, nearest first
      before: string | null; after: string | null;         // sibling role + text
    };
    look: {                    // the curated 14, never the full computed set
      display: string; flexDirection: string | null; justifyContent: string | null;
      alignSelf: string | null; textAlign: string; width: string;
      margin: string; padding: string; color: string; background: string;
      fontSize: string; fontWeight: string; borderRadius: string; position: string;
    };
    source: { file: string; line: number; snippet: string };   // 3 lines around the element
  };
  editable: "text" | "value" | "none";
  label: string;               // what the composer says out loud. Human words, never an id.
  quote?: string;              // verbatim content, capped at 4000 chars, truncation visible
};
```

**Why `look` is curated and not complete.** A model needs to know how a thing is positioned to honour
"move this right". It does not need `-webkit-font-smoothing`. Fourteen properties is roughly 400
tokens per mark; the full computed set is roughly 9,000. That is a cost decision with a number behind
it, and it is why five marks cost one call instead of five.

**How `role` is computed**, deterministically, no model, in `src/lib/mark/ontology.ts`:

| Match | Role rendered |
| --- | --- |
| `.btn.btn-primary` | `primary action` |
| `.btn.btn-secondary` | `secondary action` |
| `input[type=email]` with a `<label>` | `field · email` |
| `.card` | `card` · `.badge` | `status chip` |
| `h1` | `page title` · `h2`/`h3` | `heading` |
| `nav` | `top bar` · `table`/`tr` | `table` / `row` |
| `.empty-state` | `empty state` · `.sidebar` | `side column` |
| anything else | the tag, lowercased |

**`source.line`, obtained honestly.** The probe cannot know the source line; it only sees the DOM. So
the parent computes it: `withProbe` stamps `data-sp-n="<ordinal>"` on every element while walking the
HTML string server-side, recording `ordinal -> line`. The probe reports the ordinal, the parent looks
up the line. Deterministic, no guessing, and it survives reformatting because it is computed at render
time from the exact string being rendered.

### 3.6 The locus set, for artifacts that are not a DOM

Native React surfaces reach the same bus through one hook, with no bridge:

```ts
// src/lib/mark/useMarkable.ts
const { markProps, isMarked, markNumber } = useMarkable({
  kind: "spec", id: specId, revision: spec.updatedAt,
  path: "3.2", role: "acceptance clause", text: clause.text, editable: "text",
});
<li {...markProps}>{clause.text}</li>
```

`markProps` spreads `data-mark-path`, `data-mark-role`, `tabIndex` and the pointer handlers.
`MarkOverlay` is one portal-rendered component reading
`document.querySelector('[data-mark-path=...]').getBoundingClientRect()` and drawing the identical
corner ticks. **One implementation of the visual, two sources of geometry. There is no second design.**

The `locus` discriminant (IX-B's contribution, adopted whole) covers everything that is not an
element: `hunk`, `lines`, `element`, `text`, `row`, `rows`, `node`, `step`, `window`, `message`.

**Text ranges in prose.** Selecting text with the mouse wraps the range's client rects in the same
ticks (multi-line ranges get ticks at range start and range end only, never per line, or it becomes
confetti). Releasing over a selection of 3 or more characters opens the composer directly, with no
`v` and no Point mode: **in prose, selecting text is already the gesture, and nobody needs to be
taught that.**

### 3.7 What selection looks like

Craft law bans glow, bans soft shadows on everything, bans a second accent doing the same job. Ember
(`#FF6B2C`) already means "your attention is here". So ember, and nothing else.

**Hover, in Point mode.** Not a filled devtools box. **Corner ticks**: four 7px L-shaped 1px hairlines
at the box corners in `--ink-hairline-strong`, plus the role label in Geist Mono 10.5px at the top
left on a 2px-padded `--ink-raised` chip. Ticks read as a measuring instrument; a full rectangle reads
as browser chrome, and we are not devtools.

```
        ┌ primary action ─┐          <- mono label chip, sits ON the top tick line
        ╻                 ╻          <- 7px corner ticks, 1px, --ink-hairline-strong
             Send digest
        ╹                 ╹
```

**The one optical correction on this surface:** the ticks inset by **1px left and right, 0px top and
bottom**. A horizontal hairline reads heavier than a vertical one at the same weight, so
mathematically equal insets look wrong. Craft law asks for exactly one such decision per surface;
this is Design's.

**Selected.** Ticks go to full ember; a hairline joins them at 22% ember so the box closes without
shouting. The **pin** appears at the top right, outside the box by 6px: a 16px circle, ember fill,
the mark number in 10px mono in `--ink-bg`. **16px visually, 28px in hit area** (the
devouringdetails rule: hit targets exceed their visual bounds).

**Composing.** Only while the composer is open, the rest of the frame takes a flat 6% ink veil. Not a
scrim, not a blur (craft law bans blur as decoration): 6% is above the noticeability floor and below
the "look at me" threshold. It ends the instant the mark is placed.

**Nothing dims on plain hover.** Hovering is not a commitment and must not cost the room its legibility.

### 3.8 Re-anchoring, because the artifact gets rewritten under the mark

After a rewrite, `path` is often wrong and `fingerprint` is often still right. `reanchor(ref, newHtml)`:

1. Exact `fingerprint` match, unique. Silent.
2. Exact `fingerprint` match, multiple: pick the one whose `path` has the smallest edit distance to
   the original. Silent.
3. `path` match with a fingerprint differing only in `text`: the element survived, its words changed.
   Re-anchor, and the Thread row carries one line: `2 · the text changed under this mark.`
4. Nothing matches: the mark goes **orphaned**. Never silently deleted.

The same function serves text ranges using a text-quote selector
(`{ quote, prefix: 32, suffix: 32 }`), the W3C annotation model, which survives reflow, renumbering
and reformatting.

### 3.9 Selection is not in the URL. A placed mark is.

Resolved against all three lanes, because all three had a different answer.

- **Transient selection is not addressable.** `?focus=` is what is open; selection is what is pointed
  at. A pasted link should reproduce the screen, not someone else's cursor. IX-C's `?sel=<hash>` is
  rejected: a hash of a CSS selector is not a durable address, it churns the URL on every click, and
  it breaks FINAL-ia §6.3's orthogonality.
- **A placed mark is durable, has an id, has a row, and is addressable**, with one param orthogonal
  to everything else: `?stage=design&focus=prototype:pr_88&mark=mk_3`.

Opening that URL: the room opens on Design, the prototype loads, the frame scrolls the marked element
into view, the pin flashes once (400ms, opacity only), and the Thread scrolls to that row. Paste it to
a colleague and they see the thing you are pointing at. That is the whole reason the param exists.

Two further additive params, from IX-B: `&file=` + `&hunk=` on the mission child, and `#<blockId>`
block anchors on the spec child. Both are additions to FINAL-ia §6.1, neither is breaking.

---

## 4. HOW SELECTION REACHES THE CREW

### 4.1 The compiled mark block, at the wire

This is what "selection becomes context" actually means. Compact and human-readable, so that when it
appears in a receipt a person can read it.

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

One compiler, `src/lib/mark/compile.ts`, and **one call site into `steerStudioSession`**. The Thread's
free-text steer and a compiled mark block go through the same function. Do not add a second steer path.

### 4.2 The two send paths, both honest

**Path A: the artifact is a generated scaffold** (`prd_scaffolds.html`, not yet a repo file).

```
proposeMarkResolution  (src/lib/marks.functions.ts, new)
in:  { prdId, markIds[] }
     loads  prd_scaffolds.html
            the open marks in placement order, each with its SelectionRef
            formatDesignMemoryContext(getActiveDesignMemoryForWorkspace(ws))
     ONE callModel({ surface: "prd",                       // existing literal, no union change
                     surface_ref: `design-marks:${prdId}`,
                     model: "google/gemini-2.5-flash",     // same as buildDesignScaffoldHtml
                     messages: [system: scaffold rules + the mark contract,
                                user:   the html + the compiled mark block] })
out: { html, per_mark: [{ markId, verdict:'done'|'partly'|'cant', note, touched:[{path,anchor}] }] }
     writes prototype_messages { role:'assistant', changes_json:{ proposal:{...} }, applied:false }
```

**Path B: the artifact is a real repo file** (a promoted prototype, or any file in a live change).

- **A run is live on this file:** compile the marks into one steer, call `steerStudioSession`. The
  loop consumes a steer only after its checkpoint persists, so a mark is never both applied and lost.
  A perfect fit that already exists.
- **No run is live:** `dispatchStudioSession({ prdId, allowedPaths, maxFiles })`, where
  `allowedPaths` is **derived from the marks themselves** (the union of every
  `ref.target.source.file`) and `maxFiles` is that count.

**This is the strongest reuse in the document.** `setChangesetConstraints` and `enforceTouchList`
exist to stop an agent wandering outside a declared scope, and today a human types that scope by hand.
**The marks are the scope declaration.** You pointed at three things; the run may touch those three
files and no others; `enforceTouchList` drops anything else before the gated commit. Pointing at
things is now also how you constrain the crew, and the user never learns the phrase "touch list".

**Open guard (from IX-A, unclosed):** whether a promoted prototype's `prototype_files` rows and a live
`studio_changes` row can point at the same path at once. Today they cannot collide
(`prototypes.functions.ts` does not write `studio_changes`; `studio.stage` does not read
`prototype_files`), but the promote path is thin enough that a future change could make them. One
precedence guard, written when Path B ships.

---

## 5. THE DIVISION: WHAT YOU EDIT, WHAT THE CREW EDITS

### 5.1 The three classes, computed not configured

`classify(el)` in `src/lib/mark/ontology.ts`:

| Class | Test | Examples |
| --- | --- | --- |
| **text** | exactly one text-node child, no element children, no interactive descendants | a heading, a paragraph, a label, a button's label, a cell, a badge |
| **value** | an `input`/`textarea`/`select` with a value or placeholder, or a leaf whose whole text is a number, currency, date, or an enum from a known set | a price, a count, a date field, a roadmap bucket, an owner, an estimate |
| **none** | everything else | containers, layout, structure, nav, anything with element children, anything whose change moves other things |

The classification is honest about its own edges: a `<button>` containing only text is class **text**
for its words and class **none** for its position. Both are true, and the interface says both.

### 5.2 The two-cursor law: the cursor is the manual

- Over a **text** target: an **I-beam** cursor, and the role label gains a caret glyph: `⌶ heading`.
- Over a **value** target: an I-beam, and the label names the control: `⌥ bucket · Next`.
- Over a **none** target: a **crosshair**, and the label is the plain role: `card`, `row of 2`.

Text you can type into looks like text you can type into. That has been true of every computer since
1984 and it needs no onboarding, no tooltip, no coach mark, no dismissible tip. **This is the answer
to "it should not feel overwhelming or confusing about what to look at."**

The second signal is **who is named**:

- A direct edit shows **nothing at all**. No agent chip, no confirm, no toast. You typed, it saved.
  Silence is the strongest possible signal that you are simply editing.
- The mark composer shows a three-word head with the responsible crew member's chip:
  `Designer will do this` / `Engineer will do this` / `Writer will do this`. Naming who is on the hook
  is the difference between "I am editing" and "I am asking".

### 5.3 The gestures, exactly

**On a `text` target:**

| Input | Result |
| --- | --- |
| click | select (ticks, pin slot reserved, no pin yet) |
| click again, or `Enter`, or type any character | edit in place; `contenteditable` inside the frame, caret at the click point, or select-all if typed into |
| `Enter` in the field | commit |
| `Escape` | cancel, restore |
| `⌘⏎` in the field | **promote to a mark** instead of a direct edit |

The promote hatch matters. Sometimes you do not want to write the words, you want *better* words:
"make this shorter and less salesy". The hint sits at the field's right inner edge in 10px mono,
`--ink-faint`: `⌘⏎ ask instead`. **It is the only hint text in the entire model**, and it exists
because this is the one place where the same gesture can mean two things.

**Commit writes directly. Exactly this, and no more:**

1. The probe posts `sp.inlineCommit { ref, before, after }`.
2. `applyDirectEdit` (server fn) does an **exact string replacement on the stored source**, located by
   `source.line` plus the `before` text, and **verified by recomputing the fingerprint on the result**.
   It never serialises the live DOM back to the file: serialising would lose the model's formatting
   and would write the probe into the saved artifact.
3. **It writes a `prd_scaffold_revisions` row first** (G4), then updates `prd_scaffolds.html`, plus a
   `prototype_messages` row with `role:'user'`, `applied:true`,
   `changes_json:{ kind:'direct', ref, before, after }`.
4. If verification fails (the source moved under you), the edit **degrades into a mark** carrying your
   typed text, and the Thread says: `Saved as a mark instead. The file changed under you.` An honest
   failure that loses nothing.

**Zero model calls. Zero cost. Under 40ms. On the record and rewindable.** The `applied:true` row is
what makes a hand edit auditable without inventing a table.

**On a `value` target:** you get the right control, not a text field. Typing the word `Now` into a
box fails the "would you have loved this" test.

| Value kind | Control at the pin |
| --- | --- |
| enum (roadmap bucket) | 3-position segmented control, `Now / Next / Later`, 32px |
| person (owner) | person picker, 6 recent, then search |
| date | date field, with `today` and `+1w` shortcuts |
| number with unit | stepper, unit rendered after the field, `⌥` for x10 |
| free string in an input's placeholder | inline text field |

**The governance case, and the best thing in this design.** `roadmap.move`
(`registry.server.ts:2636`) enforces the rule that a Now/Next/Later commitment must carry a declared
outcome **and** a measure. A direct edit that skipped that would be a governance hole. So dragging a
bet into `Now` with no declared outcome does not fail and does not throw an error. It opens the
composer, pre-filled, with two fields and one line at the head:

```
 ┌──────────────────────────────────┐
 │ Now needs a promise.             │
 │ what will change  [            ] │
 │ measured by       [            ] │
 │            ⏎ commit    esc back  │
 └──────────────────────────────────┘
```

Four words teach a rule at the exact moment it applies. That is the founder's "even before you feel
'I should know information about this', it needs to be there", answered with a control rather than a
doc.

**On a `none` target:** typing does nothing. `Enter` or click-again opens the mark composer.

### 5.4 The one-way door, said once

**You cannot hand-edit generated layout.** There is no reverse hatch from a mark to a direct
structural edit, and there will not be one.

This is a product position and I will defend it: hand-edited layout produces a file the crew can no
longer reason about, which is precisely how prototype tools become dead ends. The moment a human drags
a div, the next agent rewrite either destroys the drag or refuses to touch the file.

Stated once, in the Design face's empty state, in the product's voice:

> Type on any words you want to change. For anything that moves, point at it and say so. Designer
> keeps the file coherent so the next change is still possible.

Never repeated. No tooltip, no modal, no "learn more".

---

## 6. THE COMMENT-TO-CHANGE LOOP, END TO END

### 6.1 The structural move: the Thread is the margin

The founder's diagnosis is that the conversation is architecturally separate from the artifact.
FINAL-ia §1.3 already gives a **380px Thread** immediately left of the Canvas, permanent, never
conditionally rendered.

**A mark placed on the canvas writes a Thread entry.** No new region, no floating panel, no sidebar
that appears and disappears (L6, budget 20). The conversation is beside the artifact, and each line of
it is anchored to a place in the artifact. **The Thread is the margin.**

### 6.2 Placing a mark

Typing 380px away from the thing you pointed at breaks the feeling of directness. So the composer
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

The composer opens below the element, or above it if there is no room below, clamped inside the frame.
**It never causes the page to scroll and never grows the layout.** It is not a dialog: per §8, dialogs
are for six specific acts and this is not one of them.

**On `Enter`**, the card travels to the Thread: 180ms, `transform: translate3d()` and `opacity` only,
`cubic-bezier(.22,1,.36,1)`. A numbered pin stays behind on the element with a 140ms
`scale(.7 -> 1)` on `cubic-bezier(.34,1.56,.64,1)` - the single overshoot in the whole model.

That motion does information work. It teaches, once and in one gesture, that a mark on the thing is a
line in the conversation. Craft law says motion confirms rather than performs: this confirms where the
thing went, and after the second time you stop watching it, which is the correct fate for good motion.

### 6.3 What happens on Enter: the data path

```
1. WRITE, optimistically, no model call
   prototype_messages { prototype_id, workspace_id, user_id,
                        role: 'user', content: 'move this right',
                        changes_json: { kind:'mark', n:1, ref: SelectionRef, status:'open' },
                        applied: false }
   Attachments (drag a screenshot onto a mark) write prototype_attachments
   { message_id, kind:'image', name, storage_path, size_bytes, extracted_text }
   ...message_id is precisely "this file belongs to this comment". Already there (G3).

2. The Thread row appears instantly. The pin appears. Status = open.

3. NOTHING RUNS.
```

**Marks accumulate. One mark does not dispatch a run.** The second decision I would defend to a board:

- Five sequential agent rewrites of one file produce five diffs nobody reads. One rewrite addressing
  five marks produces one diff a human can actually judge.
- It is roughly 5x cheaper, and cost per change is a number on our own pricing page.
- It lets you place five marks in twenty seconds without five runs racing on one file, which is a
  correctness problem, not a taste one.

**The founder's "hit enter and it changes" is still one keystroke away: `⌘⏎` in the composer places
and sends immediately.** Both paths exist, both are labelled in the composer's own footer, and the
default is the one that produces reviewable work.

The Thread footer carries the count and the send: `3 marks · Send ⌘⏎`.

### 6.4 The states of a mark

Six, and every one is visible without hovering (L4).

| State | Pin | Thread row | Means |
| --- | --- | --- | --- |
| `open` | `◉n` ember filled | full colour | placed, not sent |
| `sent` | `◉n` ember outline, 1.4s pulse | full colour, working caret | in flight to the crew |
| `done` | `✓n` in `--verdict-pass` | full colour, verdict line | the proposal addressed it |
| `cant` | `×n` in `--ink-subtle` | full colour, the reason | the crew could not, and says why |
| `orphaned` | none | `--ink-subtle`, struck target | the thing it pointed at is gone |
| `landed` | none | collapses into the revision line | approved, folded into history |

**A mark in `cant` does not close when you approve the revision.** It survives with your original
words. A system that silently drops what it could not do is a system you stop trusting.

### 6.5 The proposal grammar: five parts, everywhere

Every machine proposal renders **on the thing it changes**, judged at the smallest meaningful unit.
Five parts, always in this order, always these words.

| Part | Rule |
| --- | --- |
| **1. The claim** | One sentence naming who proposed it and why: `Designer changed 3 things you marked.` Sourced from the `tool_call.reason` on the step that produced it. Never "AI suggested changes". |
| **2. The units** | The judgeable atoms: hunks, revised elements, suggested spans, moved rows. Each carries `in` or `out`. **Default is `in`**, because the machine already argued for it and a wall of undecided checkboxes taxes the common case. |
| **3. The count** | Live, in the header, mono: `3 files · 9 hunks · 8 in, 1 out`. Never a percentage, never a progress bar. |
| **4. The commit** | One button naming its blast radius: `Approve 8 changes`, never `Apply`. Disabled with a stated reason when zero units are in. |
| **5. The send back** | Quiet, secondary, and it says where the work goes: `Send back` returns it to the crew with your reason, and the work is kept. |

**Two keys everywhere:** `y` keeps the focused unit, `x` drops it. `⌘⏎` commits. (`n` and `p` are
next and previous, and `g k r m t c e` belong to the rail, which is why keep and drop are not the
more obvious letters.)

**The vocabulary is the lexicon's, not mine.** FINAL-language §2.4 reserves **Keep** for ranking a bet
into Now, so IX-A's `Keep` button is renamed. **Approve** = you accept it and your crew continues.
**Send back** = you reject the attempt but keep the work, with a reason attached. Those two definitions
already describe exactly this act, so the language contract wins and nothing is lost.

**The dissent rule.** Dropping a unit always asks for one optional line ("why not?"), inline, never a
modal, never blocking. That line goes to two places: the crew's send-back context, and
`recordGateSignal`, which FINAL-ia §2.3 identifies as fully written and called from nowhere.
**Every dissent teaches the Brain.** This is the single cheapest way to make the compounding claim
true rather than aspirational, and it costs one optional text input.

This also fills a real gap in the current backend: today `applyStagedHunkSelection` lets you reject
hunks but **carries no reason anywhere**, so the agent learns nothing and the next run makes the same
mistake. With marks, rejecting and saying why produces both: the hunk reverts to base via the existing
call, and the reason compiles into a steer. A real capability gain, from a gesture, with zero new
tables.

### 6.6 The preview: the actual next revision, never a picture of one

**Path A.** The proposal's HTML is rendered into the same iframe by swapping `srcDoc`. Not a
screenshot, not a second frame, not a modal: the same frame you were just clicking in, now showing the
next revision. The frame chrome changes in three ways and no more.

```
┌──────────────────────────────────────────────────────────────────────┐
│ ● ● ●  relay/inbox/digest        V5 · proposed      [Use│Point]      │  <- badge goes ember
├──────────────────────────────────────────────────────────────────────┤
│         ┌───────────────────────┐                              ✓1    │
│         │      Send digest      │                                    │
│         └───────────────────────┘                                    │
├──────────────────────────────────────────────────────────────────────┤
│ hold b for before   [ ] step marks   Approve 3 changes   Send back   │  <- the proposal bar
└──────────────────────────────────────────────────────────────────────┘
```

- **Hold `b`** to see Before; release for After. One key, held, no toggle to get stuck in, and
  releasing always returns you to the truth. The swap is a 120ms opacity cross-fade with **no
  transform**, because the content moving is exactly what you are judging and the transition must not
  add motion of its own.
- **`[` and `]`** step to the previous and next mark, scrolling the frame to it.
- Each pin becomes its verdict: `✓1` done, `~3` partly, `×4` could not. Clicking a pin scrolls the
  Thread to that row and reveals the crew's one line.
- **Nothing is written yet.** The proposal lives in the `prototype_messages` row with `applied:false`.
  That column is the whole state machine and it was already there.

**`Approve 3 changes` does five things, all real:**

1. Writes a `prd_scaffold_revisions` row for the outgoing HTML (G4), then sets
   `prd_scaffolds.html = proposal.html` via the existing `persistScaffold` upsert path.
2. Sets `prototype_messages.applied = true` on the assistant row; each user mark whose verdict was
   `done` moves to `landed`; **each `cant` stays open**.
3. Writes a Receipt to the record, naming the marks and the crew member.
4. Calls `recordDesignScaffoldFeedback({ prdId, approved: true, specExcerpt })`
   (`design-memory.functions.ts:538`), so the accepted change becomes a candidate design-memory entry.
   **The mark is how the brain learns what you like, without asking one preference question.**
5. Renumbers marks from 1 for the new revision.

**`Send back`** leaves `applied:false`, stores `changes_json.sent_back_reason`, reopens the marks,
restores the frame, and puts one line in the Thread: `Sent back. Nothing runs without you.`

**Path B: the diff, with mark-level judgment.** This is where it stops being a preview and becomes a
changeset, using only primitives that ship today.

1. The run stages via `studio.stage`, producing `studio_changes` rows with `base_content` and
   `new_content`.
2. If a previewable HTML file exists, `getStudioPreview` (`studio.functions.ts:2061`) already picks
   the best one and returns it for the iframe. Reuse verbatim. Above the fold: the rendered result.
   Below: the diff.
3. `computeHunks(base, new)` produces the hunks. **Attribution:** each mark's proposal returned
   `touched: [{ path, anchor }]`; a hunk belongs to the mark whose anchor text falls inside it. Hunks
   nobody claims go into a `shared` group.
4. **The diff panel groups hunks by mark, not by file.** That inversion is what makes a diff readable
   by a PM: `1 · move this right` opens to two hunks in one file.
5. Rejecting one mark calls
   `applyStagedHunkSelection({ changesetId, path, rejectedHunkIds, expectedUpdatedAt })` with exactly
   that mark's hunk ids. Dropping a whole file calls `rejectStagedFile`. The `expectedUpdatedAt` token
   already produces the right error, surfaced verbatim: `This file changed since you opened it.
   Refresh and reapply.`
6. **The `shared` group can only be approved or sent back whole**, and we say so in one line rather
   than pretending perfect attribution: `4 changes belong to more than one mark.` Honesty about an
   ambiguity is cheaper than a wrong confident answer.

**The sentence that makes it real: a mark becomes a named group of hunks in a pull request that a
human accepted or rejected individually, on a branch, with CI, merged only on green.** All of that
machinery already exists. The mark is what finally gives a rejected hunk a *reason*.

---

## 7. MANY MARKS, AND THE OTHER SURFACES

### 7.1 The Thread group

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

- **The header is the only place the count lives.** One count, one source (FINAL-ia's law).
- **Numbering is placement order and stable.** Dropping mark 2 does not renumber 3. Renumbering breaks
  the map between the pin you are looking at and the line you are reading, and that map is the entire
  mechanism. Numbers reset per artifact revision, on approve.
- A `⌶` at a row's right edge marks a direct edit rather than a request, so scanning the group tells
  you what you did yourself and what you asked for.
- **Cap at 5 visible rows**, then `+3 more` peels open in place (budget 21). The Thread never scrolls
  the room.

**Batched or one at a time, with one mechanism.** Batched is the default. One at a time is not a
separate mode: select a row, press `⌘⏎`, and only that mark sends. The header reads
`2 marks · 1 sending`. There is no "apply individually" toggle, because there is no second mechanism,
only a selection.

**Three kinds of conflict, three readings:**

1. **Same target, two intents.** Detected **client-side before sending**, by ref path equality or
   containment. It costs nothing and happens before we spend a model call.
   `⌐ 1 and 3 both move this button. 3 wins if you send both.` with `drop 1` / `keep both`.
   The rule (last placed wins) is **stated, not hidden**. `keep both` sends them in order and lets the
   crew reconcile, which is sometimes right ("move it right", then "and make it smaller").
2. **Nested target.** Mark 2 on a card, mark 5 on a button inside it. Not a conflict, a hierarchy.
   Mark 5 renders indented under mark 2 with `inside 2` in `--ink-faint`. The crew receives them outer
   first. No control, no warning, no decision asked of the user.
3. **The crew could not.** The mark keeps its number, the pin becomes `×`, the row carries the reason
   in the crew's own words, and `re-point` returns you to Point mode carrying your text.

**Other people.** `prototype_messages` is workspace-scoped, so this is already supported at the data
layer. A pin authored by someone else shows their initials instead of the number in 8px mono under the
pin; the Thread row shows their name; a send takes all open marks including theirs and says
`Priya sent 5 marks, 2 of them yours.`

### 7.2 The per-surface table: primary gesture, target, executor

The gesture is fixed. Three things vary, and only three.

| Artifact | Primary gesture (L5) | Target unit | Ontology source (exists) | Direct-edit classes | Executes via (exists) | Lands in |
| --- | --- | --- | --- | --- | --- | --- |
| **Prototype**, scaffold | click an element in Point mode | DOM element, text range | probe + the `MOCKUP_CSS` class vocabulary | text, value | `callModel` surface `prd` + `persistScaffold` | `prd_scaffolds.html` + revisions |
| **Prototype**, promoted | same | same | same | text, value | `dispatchStudioSession` with a mark-derived touch list | `prototype_files`, `studio_changes` |
| **Code diff** | click a hunk (toggles `in`/`out`, and becomes the selection) | hunk, line range, file | `computeHunks()` `studio-hunks.ts:90` | none | `applyStagedHunkSelection`, `rejectStagedFile`, `steerStudioSession` | `studio_changes.new_content` |
| **Run log** | click a step row (peels in place) | one `LoopStep` | `loop.server.ts:214` discriminated union | none | `setChangesetConstraints`, `decideApprovalItem`, `steerStudioSession`, `refreshStudioCi` | nothing; reading writes nothing |
| **Spec** | select text (the QuillBar appears) | heading, numbered clause, paragraph, table row | `parseSpecSections()` `faces.tsx:620` | text (a clause's words), value (a number in a metric) | `prd.revise({prd_id, instruction})`, which already snapshots `snapshot_before` and writes the `revised` lineage edge | `prds.body_md` |
| **Roadmap** | drag a card between buckets | bet row, bucket | `opportunities` rows | value (bucket, owner, date) | `roadmap.move`, `updateRoadmapItem`, `bulkUpdateRoadmapItems` | `opportunities` |
| **Decision** | click to peel (reading what else was considered) | rationale paragraph | `decisions.rationale` | none | `createDecision` (supersede) only. **A decision is never edited.** | new decision + `supersedes` edge |
| **Metric** | drag across the series (a time window) | a window, a point | `getOutcomeData` | the **target** only, never the measurement | `recordOutcome`, `suggestOutcomeVerdict` | outcomes |
| **Table** | click a row to open; `Space` to select without opening | row, rows | the domain's list query | cells the domain allows | the domain's own mutation, named in the button | the domain |
| **Thread** | select text in a message | message, text range | messages | your own last message, briefly | `Turn into...` → `signals.log` / `tasks.create` / `createDecision` + a lineage edge back | the target domain |
| **Graph** | click a node (it becomes focus; rings recompute) | node, edge | `nodeKey()` in `knowledge-graph-view.ts` | none | nothing. Read-only by design; one affordance flags a wrong edge for review, never deletes. | nothing |

**Two surfaces need a real specialisation. The rest take the gesture unchanged.**

**The spec: marks live in the gutter.** A spec is prose read top to bottom, and a pin *in* the text
breaks the reading line, which is the one thing you must not do to a document. So marks sit in a
**28px gutter** at the left of the document column, aligned to the marked line's baseline, with a 2px
ember bar. No dimming, no highlight behind the text, no yellow. And the gutter shows the **clause
number** (`3.2`), not the mark number, because in a spec the clause number is the thing people say out
loud in a meeting, and `parseSpecSections()` already parses it for free.

```
      │ ## 3. What done means
 ▌3.2 │ 3.1  A digest sends at 5pm local time.
      │ 3.2  The digest lists at most 12 items.
      │ 3.3  An empty digest does not send.
```

**The diff: no mode, and the gesture is clicking the line number**, which is the universal review
gesture every engineer already owns from GitHub and Cursor. And there is no Use mode because there is
nothing to activate, so there is no toggle.

**The four fake state chips, honestly replaced.** `faces.tsx:1228-1246` keeps its four chips, but
`Empty` and `Error` render only if the generator actually produced those variants. If it did not, the
chip becomes a **mark affordance**: click `Empty` and the composer opens pre-filled with
`there is no empty state yet`, addressed to Designer. **A missing state becomes a request instead of
a fake.**

---

## 8. THE DIALOG GRAMMAR

FINAL-ia §6.4 fixed six shapes. This contract adds **inline** and **popover** (both were implicit),
formally kills the word **drawer**, and supplies the deciding rule and the modal whitelist.

### 8.1 The deciding rule: four questions, first yes wins

1. **Can it be edited where it reads?** Then edit it there. **Inline.**
2. **Is it one more level of the row I am already on?** Then push the siblings down. **Peel.**
3. **Is it consulted while working, and does it need a URL?** Then it is a right-edge over-panel.
   **Pane.**
4. **Will someone spend more than a minute on it, or hand it to a person outside this room?**
   Then it is a **page** (a workbench child).

Anything left over is a **popover** if it is a pick with no data fetch, and a **modal** only if it
passes §8.3. Nothing else exists.

### 8.2 The eight shapes

| Shape | Use for | Width / anchor | URL | Escape | Hard limits |
| --- | --- | --- | --- | --- | --- |
| **Inline** | editing a value where it reads | in flow | no | reverts the edit | the default; never asks permission |
| **Peel** | one more level of the row you are on | in flow, pushes siblings | no | collapses | never nests: a second peel promotes to a page |
| **Popover** | a pick, a key legend, an agent card | anchored, ≤ 280px | no | closes | no data fetch, at most one input, **never contains a decision** |
| **Pane** | reference consulted while working | 420px right over-panel | `?pane=` | closes the pane | everything behind stays live |
| **Tray** | judgment | ember over-panel | `?gate=` | closes the tray | distinct chrome, because judging is a distinct act |
| **Overlay** | configuration | full-screen scrim | `?config=` | returns exactly | room stays mounted, polling suspended |
| **Page** | deep work, or handoff | the canvas, room chrome kept | route | back | may own tabs; nothing else may |
| **Modal** | see §8.3 | ≤ 480px, focus-trapped | no | cancels | ≤ 3 fields; never the only home of a capability |

**"Drawer" is deleted from our vocabulary.** It was a fifth word for pane, tray and overlay, which is
how a shape system rots. One concept, one word.

Carried forward: anything with its own data fetch is addressable; maximum depth room → child → tab →
peel, four levels, hard cap. **New: a popover may never contain a decision.** If a user can get it
wrong, it needs the room's attention, and a popover dismisses on a stray click.

### 8.3 Modals: the six times they are right

A modal stops everything to ask a question. Reaching for one is usually admitting you could not design
the inline path. Three conditions, and **all three must hold**: irreversible or externally visible;
the decision needs information not currently on screen; undo is physically impossible.

**The whole product's modal whitelist. Six. Anything else is a defect.**

| Modal | Must show |
| --- | --- |
| Merge to main | the CI verdict, the file count, the target branch |
| Delete a product or workspace | the exact counts that will be deleted |
| Revoke a member | who, and what they lose access to |
| Paste an API key | the scope it grants (`ApiKeyConnectDialog.tsx` already exists) |
| Grant or deduct credits (admin) | the delta, the balance after, the target user (today: **no confirm at all**) |
| Resolve a sync conflict | **the diff of what will be lost** (today: one click, no diff, no confirm) |

**Everything else that is a modal or a confirm today becomes optimistic plus undo.** Approve, send
back, snooze, archive, rename, reprioritise, move, drop a hunk, resolve a mark: all land immediately
with a 6-second undo line in the WorkingStrip. A confirm dialog protects the product from the user;
an undo protects the user. We build for the second one.

**The corollary that makes it safe:** an optimistic action must show its own reversal. The undo line
names what happened in the past tense and offers the exact inverse: `Sent back to Engineer. Undo.`

**And the mechanism that makes the whitelist survivable is the consequence line** (§10.2): one
sentence, from real data, on hover of any irreversible button. **No confirmation dialog exists for
anything whose consequence line is accurate and whose action is reversible.** A dialog costs the
entire screen momentarily, and it costs the user their place.

**The whole mark model contains exactly one dialog: `Drop all 5 marks?`**, which is destructive and
therefore correct.

---

## 9. THE ONE-SCREEN CONTRACT

### 9.1 The arithmetic nobody can argue with

The shell is `h-dvh` (`MissionShellView.tsx:255`), so its block-size is the browser's `innerHeight`.

| Machine, maximized | Shell block-size |
| --- | --- |
| 1280x800 laptop, macOS, Dock visible | **618** |
| Windows 1366x768, Chrome | **641** |
| MacBook Pro 14" (1512x982), Dock visible | **800** |
| Windows 1920x1080 | **953** |
| 27" 1440p, and 34" ultrawide | **1258 (identical)** |

**Buying a bigger monitor buys width, not height.** A 3440x1440 and a 2560x1440 present the same 1258.
Every proposal in `adaptive/` is about the inline axis. This is the axis that does not improve when you
spend money.

Chrome, derived from `--ink-control-*` (`ink.css:67-69` = 32/36/40) and `--space-*`:

```
shell block-size                                600      <- the contract floor
  topbar 52 · spine 64 · strip 34 · composer 68 · 4 hairlines   = 222  (37% of the screen)
  WORK ROW                                      378
    SurfaceHeader                                52
    face body, scrolls                          280
    face footer (proposed, does not exist today) 44
```

> **At the contract floor, a Supaprod stage face has 280 vertical pixels.**
> **280px is three 72px objects, or six 44px rows. That is the whole first screen.**

A face designed for three objects on a 1366x768 Windows laptop reads as calm on a 27" monitor. A face
designed for the 27" monitor is a wall on the laptop, and a wall is what the founder is looking at.

**And this is the argument for the entire doctrine.** At 1366 inline there are exactly two columns:
Thread and Canvas. A properties panel is a column. A comment sidebar is a column. A chat pane is a
column. **There is no third column to give away.** So the choice is not "direct manipulation, or a
panel". The choice is "direct manipulation, or the feature does not fit". That is also why Lovable, v0
and Claude artifacts feel the way they do: they are not doing something expensive, they are doing
something cheap, and the cheapness is the point.

### 9.2 The law

> **On a shell 600px tall, at scroll position zero, with no gesture of any kind, every surface renders
> five things: what it is, what state it is in, the object it is about, the one next action, and an
> exact count of what is below. A surface missing any of the five is not done.**

| # | Name | Rendered by |
| --- | --- | --- |
| 1 | **Identity** | `SurfaceHeader` stage marker plus title |
| 2 | **State** | `SurfaceHeader` state chip plus the agent attribution atom |
| 3 | **Subject** | at least one whole object, never a fragment of one |
| 4 | **Act** | the face footer's primary, **pinned outside the scroll** |
| 5 | **Horizon** | the exact count at the scroll container's bottom edge |

**What goes above, in two rules a designer can hold at 2am:**

> **The Judgment Test.** A pixel earns a place above the fold if a competent user cannot make the next
> decision without it. Everything else goes below. There is no third category. "Useful to have up top"
> is exactly how a surface becomes a wall.

> **The Recurrence Rule.** When two things both pass and only one fits, the one seen **less often**
> goes above. Frequency builds memory: a daily user finds the artifact title with a saccade and has
> never seen this particular precedent warning. This is why a one-time warning outranks a permanent
> label, and why the gate outranks the artifact.

**Never above:** a zero count that has never had content here; a control only relevant after the
primary action; an explanation of a thing visible on the same screen; a second rendering of a number
already on screen; decoration of any kind.

**Never below:** the surface's primary action; an open gate's claim, evidence and both buttons; the
cancel of any destructive confirmation; **any state that changes the meaning of the primary action**
(concretely: if CI is red, `CiStrip` is above `Approve`, never below it - approving a change whose
failing check is off-screen is a product defect, not a layout preference); the horizon count itself.

### 9.3 The structural fix

Defect 5 (§1.3) is fixed by one change to the one component every face renders through:

```tsx
// src/components/mission/CanvasFace.tsx
<div data-face className="grid min-h-0 flex-1"
     style={{ gridTemplateRows: "var(--face-header-h) auto minmax(0,1fr) auto" }}>
  <SurfaceHeader ... />
  <FaceLead lead={working ?? foresight ?? null} />        {/* one shared 40px slot, §10.3 */}
  <div data-face-body data-scroll-type={scrollType}>{children}</div>
  <FaceFooter receipt={receipt} primary={primary} doors={doors} />   {/* never scrolls */}
</div>
```

`CanvasFaceProps` gains `receipt`, `primary: { label, onAct }`, `doors`, `scrollType`. **`primary` and
`scrollType` are required, and that is the point: a face that cannot name its one next action does not
compile.**

Defects 6 and the rest are one mistake, fixed by one lint rule: **`no-fixed-block-size` fails any
`max-h-[...]`, `min-h-[...]`, `maxHeight` or `minHeight` inside `[data-face-body]` that is not a
`calc()` over `--face-body-h`.** A child that wants the body's height asks for `100%`; a child that
wants to scroll declares a scroll type and inherits.

**One custom property is required of whichever `adaptive/` proposal wins**, and it is the mechanical
root of all six defects: no component knows how tall it may be because no token tells it.

```css
[data-shell] {
  --work-h:       calc(100dvh - var(--topbar-h) - var(--spine-h) - var(--strip-h) - var(--dock-h) - 4px);
  --face-header-h: 52px;
  --face-footer-h: 44px;
  --face-lead-h:   40px;
  --face-body-h:   calc(var(--work-h) - var(--face-header-h) - var(--face-footer-h) - var(--face-lead-h));
}
```

### 9.4 The scroll typology

Every scrolling region declares `data-scroll-type`. An undeclared one fails CI.

| Type | Contract | Where |
| --- | --- | --- |
| **T0 None** | never scrolls at any height, ever. If it would, it recomposes. | the gate card, the composer, the Spine, every face footer, the map, the prototype face |
| **T1 One reach** | at most two screens; the horizon carries an **exact** count; the end carries a terminal line, never a blank stop | every stage face body, every pane landing |
| **T2 Document** | a **section rail** on the region's right edge, 4px, one mark per section with per-section read state; the primary stays pinned; position persists per artifact | the spec, release notes, a transcript |
| **T3 Ledger** | never auto-loads more than two pages; a dated separator every day; a pinned `Jump to now` once you are a screen back | receipts, traces, threads, memory |
| **T4 Code** | scrolls on both axes inside itself; the page never scrolls horizontally; a **gutter minimap** with one mark per hunk, ember where the hunk touches a file outside the declared touch list | diffs, run output, wide tables |

**T2's section rail is the answer to "too much scroll" on documents.** A spec is genuinely long and
shortening it would be a lie. What is fixable is not knowing where you are, how much is left, and what
you have not read. The rail costs 4px and answers all three.

**T3's rule about not auto-loading is a screen-economy rule, not a performance one.** Infinite scroll
destroys the horizon: if the count is unknowable, the scent is gone.

**The horizon**, on every T1/T2/T3/T4 region: a 24px strip pinned inside the scroll container's bottom
edge, `+9 more signals`. The count is exact or it says it is not (`more loading`); a rounded `9+` is a
guess wearing a number's clothes. The noun is always present. It disappears at scroll end, replaced by
the region's own terminal line, never `No more items`. It is a grid row, never an absolutely
positioned scrim, because a gradient fade over text is decoration that makes the last line unreadable.
**Scrollbars are visible in the work row, never overlay**: the thumb is the best proportional indicator
of how much is below, and macOS overlay scrollbars hide it until you are already scrolling, which is
after the moment it was useful.

### 9.5 Stage mode: the one sanctioned exception

**`f`**, available only on surfaces whose subject is a rendered artifact: the Design face, the
prototype child, the map child, and the diff in canvas focus.

Spine goes numeric (64 → 32), the WorkingStrip merges into the composer's top line (34 → 0), the lead
slot is suppressed (40 → 0). **It buys 106 block pixels**, taking the artifact from 280 to 386 at the
floor, and it combines with canvas focus (`⌘.` region focus) for the full inline width.

You lose the Spine's stage labels (recoverable by the numbers, `1`-`7`, or the Spine popover) and the
strip's per-agent detail (recoverable from the merged line's count). You lose no invariant, no ember,
no composer. It lives in the URL as `?stage_mode=1`, so a demo is recorded by pinning a param rather
than resizing a window.

**It is offered exactly once**, as a quiet line in the Design face footer the first time the artifact
is taller than the body: `Press f to give this the screen.` It never asks again. A product that nags
about its own affordances has admitted they are not discoverable.

### 9.6 The per-surface first-screen contract

| Surface | ABOVE, at the 600 floor | PRIMARY | HORIZON | Scroll |
| --- | --- | --- | --- | --- |
| 01 Discover | three top-ranked themes, each with its evidence count and one-line why | `Rank these into bets` | `+9 more signals` | T1 |
| 02 Decide | the top bet with its verdict and ICE; the precedent card beneath it; the second bet clipped | the gate's `Approve` / `Send back` pair | `+4 more bets` | T1 |
| 03 Plan | spec title, outcome contract (3 lines), first section heading | `Approve the spec` | `9 sections, 2 unread` | T2 |
| **04 Design** | **the device frame filling the entire body** | `Approve the design` | none: the artifact has no below | T0, artifact scrolls inside itself |
| 05 Build | the plan line (`4/7`), the changeset card with its three highest-risk files, `CiStrip` | `Approve the changeset` | `+11 files` | T1 face, T4 diff |
| 06 Ship | the promotion gate card, three lines of release notes, the armed outcome date | `Promote to production` | `+2 announcements` | T1 |
| 07 Learn | the outcome form with the spec's assumptions pre-filled, the impact line | `Record how it landed` | `+3 learnings` | T1 |
| Any pane | six 44px rows whole (290px of body after a 44px header and a 44px filter row) | the pane's own | `+14 beliefs, 3 expire in 6 days` | T1 |
| The Thread | **at most three cards, and a gate card always displaces the oldest** | n/a | n/a | T1 |

**Two corrections to FINAL-ia, both arithmetic, both with the fix attached:**

1. **§2.2's seven-tile rail** needs 308px of block size (7 × 44), and the work row is `shell - 222`, so
   it fits only when the shell is **at least 530px tall**. Below that the promise is arithmetically
   false. Honest compression: 448-530 renders **one 44px tile** carrying the summed delta and a ring
   segmented into seven arcs, each lit in proportion to its own delta; click or `⌥D` opens a 7-row
   menu with the full scent triple. It stays named, counted, keyed and addressable (`?pane=`
   unchanged). It loses per-tile resolution at rest, which is the honest price.
2. **§3.2's seven full-size journey cards** need 504px and the body has 280. Honest version, and
   better: **three journey cards whole plus a horizon reading `+4 more ways in`** - J1 (what should we
   build next), J3 (just write the PRD), J4 (build this feature), because those are the three the
   founder named and `FULL_LOOP_CHAIN` puts them first, third and fifth. All seven render above 950px
   of shell. The horizon count is exact and the deep link is identical either way.

### 9.7 The fold ladder: what falls first as height shrinks

| # | What gives | Recovered by |
| --- | --- | --- |
| 1 | the Spine return edge and the `Starts from:` caps | nothing lost, it is ornament |
| 2-3 | the face's third, then second object | the horizon count, one flick |
| 4 | the foresight line collapses into **a mark on the object it warns about** | hover or focus peeks the full sentence |
| 5-6 | the working triple's chips, then its plan becomes `4/7` in the lead slot | the WorkingStrip's live verb; the mission child |
| 7-8 | the Spine goes labeled, then numeric; the strip merges into the composer | the Spine popover; `1`-`7` still work |
| 9 | the rail compresses to one tile | the 7-row menu |
| 10 | the face footer's receipt collapses to its mono id | the kebab |
| **STOP at 448** | identity, one whole object, the primary, the horizon, the composer, the live verb, the loop position, one counted door | **Eight things, and it is still the product.** Screenshot it so nobody has to imagine it. |

---

## 10. ANTICIPATION

The founder's sentence is the specification: *"even before you feel 'I should know information about
this, where should I look' - it needs to be there."* That is not a feature, it is an ordering
constraint.

### 10.1 The three laws

> **A1. The answer arrives before the question, as a quiet fact, never as an interruption.**
> The product gets **one** interruption per session and it is spent on the repeat-mistake warning.
> Everything else is already drawn.

> **A2. Anticipation is pre-render, not pre-fetch.** `prepareScaffoldSpeculative`
> (`design-scaffold.functions.ts:294`) is the existing proof of the pattern in this codebase: fire and
> forget, never awaited, idempotent upsert, never throws into its caller. **Generalise it as the named
> pattern `speculative prep`** and apply it to precedent lookup, design parity and citation resolution.

> **A3. An anticipated answer must be layout-neutral.** It is resolved in the same query pass as the
> surface's own data, so it is present at first paint or it is never present. **Nothing may be injected
> after paint.** An anticipation that arrives late and pushes the primary action below the fold has done
> more harm than the question it answered.

A3 is where anticipation meets screen economy, and it is why most "smart" interfaces feel chaotic:
they know things, they tell you at the wrong moment, and the layout jumps.

### 10.2 The next-question table

| Moment | The question forming | Where the answer already sits |
| --- | --- | --- |
| First frame after sign-in | *What happened while I was gone?* | the rail deltas and the Thread's briefing card, both painted before you focus anything |
| Scanning a bet | *Have we tried this before?* | the precedent card under the bet, at rest, not behind a click |
| Reading a spec | *What did I not read?* | the T2 section rail: hollow ticks for sections you never reached |
| Hovering `Approve the spec` | *What am I agreeing to?* | the consequence line: the assumptions that go on watch, with their dates |
| A build is running | *How long, and can I leave?* | the lead slot's `4/7` plus the strip's honest time |
| A build went green | *What actually changed?* | the file list already open, **ranked by risk, not alphabetically** |
| Staring at a diff | *Which hunk is the risky one?* | the T4 gutter minimap mark, ember where a hunk touches a file outside the touch list |
| **Prototype rendered** | ***Is this on brand?*** | **the critic's verdict is already three pins on the artifact, not a panel beside it.** This is why the Design face needs no critic panel, which is why it fits. |
| **Point mode on** | ***What can I actually change here?*** | **the cursor. I-beam means type; crosshair means say.** No legend, no tour. |
| **A mark is open** | ***Did it understand me?*** | the Thread row restates the target in the product's words (`primary action, in card 2`) before anything runs |
| **A proposal returns** | ***What exactly changed?*** | hold `b`. The thing you are judging moves and nothing else does. |
| A gate is open | *What happens if I say no?* | the `Send back` consequence line |
| Just shipped | *When will I know if it worked?* | the armed date in the Ship footer, repeated in the Thread handoff |
| An error | *Is this me or them?* | the blocked receipt names the actor and the recovery verb |
| Hovering any mono chip | *What is `SIG-204`?* | the level-1 peek |

**The consequence line, the mechanism that deletes most dialogs.** One sentence on hover of an
irreversible button, built from real data, never a tooltip explaining what a button is:

| Button | Consequence line | Source |
| --- | --- | --- |
| `Approve the changeset` | `Opens PR on relay/main. 7 files, 2 outside your touch list.` | `getChangesetDiff`, `enforceTouchList` |
| `Send back` | `Returns to Engineer with your note. The branch stays; nothing is lost.` | `sendBackApprovalItem` |
| `Promote to production` | `Live for everyone. Last time you skipped the canary it cost 2 days.` | `promoteToProduction` + the Brain's belief row |
| `Approve the design` | `Build inherits this mockup. Design parity is checked against it.` | `decideDesignGate`, `checkDesignParity` |

### 10.3 The peek, with real timings

| Level | Gesture | What renders | Fetches? | URL |
| --- | --- | --- | --- | --- |
| **0 Trace** | none, at rest | noun, count, age | no | no |
| **1 Peek** | 180ms hover hold, or `Space` on a focused row | a 320px card: the first three facts and the receipt | **never** | no |
| **1.5 Consequence** | hover an irreversible button | one sentence of what will change, from real data | no | no |
| **2 Open** | click, or the door's letter | the surface | yes | `?pane=` |
| **3 Row** | click a row, or `Enter` | an in-place peel | maybe | `&item=` |
| **4 Work** | `o` | the workbench child | yes | child route |

**180ms is not a round number picked for tidiness.** Below ~150ms peeks fire on pointer pass-through
and the screen strobes as you move across a list. Above ~250ms the user has already clicked and the
peek arrives as an annoyance behind the thing they opened. 180ms, with a 60ms fade in and no fade out.

**Peek sessions:** once one peek has opened, the next is instant until 400ms passes with no peek target
under the pointer. That is exactly how a native menu bar behaves, it is fifteen lines in one hook, and
it is the detail that separates something a person tuned from something a machine generated.

**A peek never fetches.** It renders only from data the list already has. If the list cannot peek, widen
the list query by three fields; do not add a spinner. A peek that spins teaches the user that pointing
at things costs time, which is the opposite of this entire doctrine.

**Levels 1 and 1.5 must not reflow.** If a peek pushed content, hovering a list would move the list,
and pointing at things would become dangerous.

### 10.4 The lead slot: one 40px line, shared, with a stated priority

Anticipation needs somewhere to render that cannot damage the layout. One slot, 40px, directly under
`SurfaceHeader`, three claimants, fixed priority:

| Priority | Claimant | Example |
| --- | --- | --- |
| 1 | **Working** (a run is live on this stage) | `4/7 · Engineer is writing tests · 40s` |
| 2 | **Foresight** (the Brain has something you need before you act) | `You shipped something like this in March. It moved retention 0.4 points.` |
| 3 | **empty** | the slot collapses to 0 and the body gains 40px |

Only one renders. Working beats foresight because a live machine outranks a memory, and the foresight
demotes to a mark on the object it concerns, where it peeks.

**This resolves the cost problem honestly: anticipation is paid for out of the object budget, not out
of a permanent reservation.** When a foresight line is present, the third object falls below the fold.
That is the Recurrence Rule applied, and we say it out loud rather than pretending it is free.

### 10.5 What anticipation is not

Not a suggestion carousel. Not "you might also like". Not a proactive modal (there is one interruption
and it has a job). Not a prediction of the next click - pre-drawing a wrong answer costs more attention
than it saves. Not a chatbot volunteering. The crew speaks in the Thread, in receipts, in past tense.

---

## 11. THE OVERWHELM BUDGET

Countable, so it can be enforced. Each number has a reason and the reason is not taste.

| # | Budget | Limit | Why this number |
| --- | --- | --- | --- |
| 1 | Primary actions per screen | **1** | Already the repo's law. Two primaries is no primary. |
| 2 | Secondary actions visible at once | **3** | One primary plus three secondaries is four choices, the top of comfortable choice without triage. The fourth goes in the kebab. |
| 3 | Whole objects above the fold, per face | **3** | Derived: 280px body / 72px object at the 600 floor. Not a preference. |
| 4 | Whole rows above the fold, per pane | **6** | Derived: 290px pane body / 44px row. |
| 5 | Cards above the fold in the Thread | **3** | Derived: 378px / (112 + 132 + 88 + gaps). |
| 6 | Attention hues on one screen | **2** | Ember means "needs you". Machine blue means "working". A third colour says what position or type already says. |
| 7 | Verdict hues on one screen | **1** | Pass green and fail red never appear together at the same rank. Red outranks and suppresses green siblings, because you will only act on the red one. |
| 8 | Simultaneous live regions | **2** | One locus (the WorkingStrip) plus one stream you chose to watch. A third is measured as noise. |
| 9 | `aria-live` regions mounted | **2** | Same limit, and a screen reader user suffers a third worse than anyone. |
| 10 | Numbers on the composite first screen | **9** | Seven rail deltas, one gate ember, one face count. A tenth is a second copy of one of those. |
| 11 | Distinct type sizes per surface | **4** | Header, body, meta, mono. Type does the hierarchy before colour is reached for. |
| 12 | Continuous motion at rest | **1** | The working pulse. Everything else moves to confirm a transition, and stops. |
| 13 | Interruptions per session | **1** | The repeat-mistake warning. Spend it once. |
| 14 | Depth doors visible at once | **7** | The rail. An eighth requires removing one, and that argument has to be won. |
| 15 | Simultaneously scrolling regions | **2** | Thread plus one. A third means one is not earning its space. |
| 16 | Nested scroll containers | **0** | Defect 6 is what this costs. A scroll inside a scroll has no correct wheel behaviour. |
| 17 | Hover-only affordances | **0** | L4. Every hover reveal has a visible or focus equivalent. |
| 18 | Words in a primary button | **3** | `Approve the spec`, `Send back`, `Approve 8 changes`. |
| 19 | Confirmation dialogs per reversible act | **0** | The consequence line replaces them. Dialogs are for the six in §8.3. |
| 20 | Shell regions | **8** | topbar, spine, thread, canvas, rail, strip, composer, one overlay slot. **A feature may not add a ninth. This is L6 with teeth.** |
| **21** | **Marks visible in the Thread group** | **5** | Then a counted peel. The Thread never scrolls the room. |
| **22** | **Pins rendered on one artifact at once** | **12** | Beyond 12 the artifact is confetti; the edge-tick map (§11.1) takes over and the pins thin to the 12 nearest the viewport. |
| **23** | **Model calls per send, regardless of mark count** | **1** | The batching argument (§6.3) as an enforceable number. n marks, one call, one diff. |
| **24** | **Modes on any surface** | **2** | Use and Point. A third mode is a third thing to learn, which is why IX-B's "Note" mode is cut. |

### 11.1 The edge ticks: seeing what is below without scrolling

A 2px ember tick on the frame's right inner edge at each off-screen mark's proportional scroll
position. **You can see there are two marks below the fold without scrolling to find out.** Click a
tick to scroll there. This is the scrollbar as a map, it is the single most direct answer to "what can
the user see within a particular screen", and it is the one idiosyncratic detail on the Design surface.

### 11.2 Enforcement

| Test | Fails when |
| --- | --- |
| `one-screen.spec.ts` | at 1366x600 or 1512x800, at `scrollTop: 0`, a surface's `[data-primary]` box is not fully in the viewport, or any of the five contract elements is absent |
| `fold.spec.ts` | a face renders more than 3 whole objects, or a pane more than 6 whole rows, above its fold |
| `horizon.spec.ts` | a region with `scrollHeight > clientHeight + 1` has no `[data-horizon]` with a numeric count and a noun |
| `scroll-typology.spec.ts` | a scrolling region has no `data-scroll-type`, or a T0 region scrolls, or any element has two scrolling ancestors |
| `face-footer.spec.ts` | a receipt or forward door has a scrolling ancestor inside `[data-region="canvas"]` |
| `peek.spec.ts` | a level-1 peek issues a network request, or reflows its container |
| `disclosure.spec.ts` | a capability has no level-0 trace at rest at the floor |
| `overwhelm.spec.ts` | any of the 24 budgets is exceeded |
| `no-new-region.spec.ts` | `[data-region]` count is not exactly 8 |
| `foresight.spec.ts` | any element enters the work row after first paint (CLS inside the canvas > 0) |
| `no-fixed-block-size.ts` (lint) | a fixed block size inside `[data-face-body]` that is not a `calc()` over `--face-body-h` |
| `no-same-origin-sandbox.ts` (lint) | a `sandbox` attribute contains both `allow-scripts` and `allow-same-origin` |
| `keymap.test.ts` | two bindings collide within one focus context |
| `mark-probe.test.ts` | the probe accepts a message without both `e.source` identity and the mount nonce |

**Screenshot set, every release, diffed:** 600 (the floor), 800 (the founder's laptop), 953 (a 1920
desktop), 1258 (the 27"), plus one at 448, the honest stop.

---

## 12. KEYS, COMPLETE

Four bands, disjoint by construction, so no binding can ever collide.

| Band | Keys | Owner | Live when |
| --- | --- | --- | --- |
| **Spine** | `1`-`7` | the seven stages | shell focus |
| **Rail** | `g k r m t c e` | the seven depth tiles | shell focus |
| **Global** | `⌘K` palette · `⌘J` composer · `⌘.` ask about the selection · `⌘Z` undo · `Esc` up one layer | the shell | always |
| **Artifact-local** | `n p y x o v f b [ ] \ / Space Enter` and arrows, plus `⇧`/`⌥` variants | the focused artifact | **only while that artifact holds focus**, and its legend is visible in its footer |

> **The collision rule, stated once so it cannot drift.** Artifact-local bindings draw **only** from
> that band, which is disjoint from `g k r m t c e` and `1`-`7` by construction. Rail letters always
> fire with `⌥` from anywhere, including inside an artifact. This also fixes a real live bug: on Today,
> `a` both approves the featured call and navigates to `/admin`, because two `window` listeners fire
> and `preventDefault` does not stop a sibling. Focus-scoping removes the class of bug, not the
> instance.

| Key | Context | Does |
| --- | --- | --- |
| `v` | canvas | toggle Point mode (the select tool, universally) |
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
| `⌘Enter` | Thread group, or a proposal | send all open marks / commit the proposal |
| `Escape` | composer / inline editor / Point mode | drop the mark / cancel the edit / leave the mode |
| `n` / `p` | any artifact | next / previous unit (hunk, step, row, card, mark) |
| `y` / `x` | any judgeable unit | keep it / drop it |
| `[` / `]` | proposal, diff | previous / next mark, or file |
| hold `b` | proposal | show Before, release for After |
| `o` | any artifact | open it whole, or its workbench child |
| `f` | artifact surfaces only | Stage mode (`?stage_mode=1`) |
| `/` | list surfaces only | search and filter (one key, not two) |
| `\` | run log | toggle raw output |
| `Space` | focused row | peek, or expand in place |
| `↑` / `↓` | Thread group | move between mark rows, scrolling the frame to each |

Every binding is announced through `aria-keyshortcuts` on its owning element, and the full set appears
in the palette under `marks`, which is how a keyboard is discovered without a cheat sheet.

---

## 13. MOTION

Craft law bans `linear` and `ease-in-out`, and bans animating `width`, `height`, `top`, `left`.
Everything here is `transform` and `opacity` only.

| Moment | Duration | Curve | Property |
| --- | --- | --- | --- |
| ticks appear on hover | 90ms | `cubic-bezier(.2,0,0,1)` | opacity |
| mark flies to the Thread | 180ms | `cubic-bezier(.22,1,.36,1)` | transform, opacity |
| pin appears | 140ms | `cubic-bezier(.34,1.56,.64,1)` | transform: scale |
| Before/After swap | 120ms | `cubic-bezier(.4,0,.2,1)` | **opacity only, no transform** |
| composing veil | 100ms | `cubic-bezier(.2,0,0,1)` | opacity |
| sent pulse | 1400ms loop | `cubic-bezier(.4,0,.6,1)` | opacity 1 → .45 |
| deep-link pin flash | 400ms | `cubic-bezier(.2,0,0,1)` | opacity |
| peek in | 60ms | `--ease` | opacity, no fade out |

**The pin's overshoot is the only overshoot in the model.** One piece of personality, per craft law's
"exactly one, or it becomes noise".

`prefers-reduced-motion: reduce`: every duration becomes 0ms; the fly-to-Thread becomes an instant
placement plus a 400ms opacity flash on the destination row, so the connection is still taught without
motion.

---

## 14. WHAT GETS BUILT

### 14.1 Components

```
src/components/mark/
  MarkProvider.tsx      mode, open marks, selected ref, send/judge. One context, one owner.
                        Mounts beside the Escape-stack owner: same architectural seam, build together
                        or the second will fight the first.
  MarkOverlay.tsx       the corner ticks + role label chip. Portal. ONE implementation of the visual,
                        fed by two geometry sources (the bridge, or getBoundingClientRect).
  MarkPin.tsx           numbered pin, state glyph, author initials, 28px hit area
  MarkComposer.tsx      the 260px at-element input
  MarkGroup.tsx         the Thread group: header, rows, conflict lines, the peel
  InlineText.tsx        the direct-edit field for class text
  ValueControl.tsx      segmented / date / person / stepper for class value
  ProposalBar.tsx       §6.5's five parts. Six surfaces share it.
  Judgeable.tsx         the keep/drop atom with y/x and the tally
  MarkEdgeTicks.tsx     the off-screen mark map on the frame's inner edge
  MarkDiffGroup.tsx     the diff, grouped by mark instead of by file

src/lib/mark/
  ref.ts        SelectionRef, LocusRef, fingerprint(), reanchor()
  probe.ts      the injected script as a string constant, plus withProbe(html, nonce)
  bridge.ts     the postMessage protocol, the two-factor guard, the rAF viewport pump
  ontology.ts   per-artifact target rules, the role table, classify()
  compile.ts    marks -> the instruction block (§4.1). ONE compiler, ONE steer call site.
  attribute.ts  hunk -> mark attribution, and the shared group

src/lib/marks.functions.ts   (server, TanStack, RLS-scoped like prototypes.functions.ts)
  listMarks · placeMark · dropMark · applyDirectEdit · reanchorMark
  proposeMarkResolution · approveProposal · sendBackProposal · revertScaffoldToRevision
```

Shared shell primitives this depends on: `ArtifactFrame` (title, verdict slot, own-scroll body,
receipt, chain strip, forward door - enforced by `artifact-frame.test.ts`), `FaceFooter`, `FaceLead`,
`UndoLine`.

### 14.2 Migrations

**For the mark loop on prototypes: one, and it is not the one you would guess.**

```sql
-- REQUIRED IN PHASE 1. Without it, direct editing is a one-way door (G4).
create table prd_scaffold_revisions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  prd_id uuid not null,
  html text not null,
  source text not null,             -- 'generate' | 'direct' | 'proposal'
  created_by uuid not null,
  created_at timestamptz not null default now()
);
create index on prd_scaffold_revisions (prd_id, created_at desc);
-- RLS: same workspace policy as prd_scaffolds. Trigger: set_row_workspace_from_user.
```

`prototype_messages` and `prototype_attachments` need **zero migration** (G3).

Extending marks to specs, roadmaps and diffs needs one generic table (`artifact_marks`: the same five
columns plus `artifact_kind` and `artifact_id`) **at phase 4, not before**. Prove the loop on the
tables that are already there.

### 14.3 What gets deleted

| Deleted | Why |
| --- | --- |
| `faces.tsx:1705-1875` (`lineDiff`, `DiffFile`, `DiffPanel`) | the second diff renderer and the second hand-rolled LCS. One diff, one hunk engine (`studio-hunks.ts`, already unit-tested). |
| `faces.tsx:1647-1688` `BuildTerminal`'s `<pre>` of `output.slice(-2000)` | the clearest case in the codebase of structure thrown away at the last inch. `LoopStep[]` is already on the client. |
| `faces.tsx:1046` `DesignRail()` | a read-only annotation rail with no data behind it. Marks replace it. |
| `faces.tsx:1267` the hardcoded `relay.heliolabs.com/inbox/digest` and `:1276` `Interactive · V4` | demo fiction in a shipped component |
| `faces.tsx:1150` the comment claiming same-origin | it is false (G1) and it misled a design lane |
| `faces.tsx:1340` "1 screen, 4 states, 3 clickable paths" | a literal string presented as a count |
| `ChangesPanel`'s reject-only framing and `Apply (2 rejected)` | frames the human as damage to the machine's work. The panel's other duties survive. |
| the word **drawer** | a fifth word for pane, tray and overlay |
| every modal outside the §8.3 whitelist | |
| the free-text steer box as the *primary* way to correct a run | it stays as an escape hatch; marks become primary because they carry scope, and scope is what makes a correction land |

### 14.4 Existing backends that finally get a surface

`applyStagedHunkSelection` (re-framed two-way) · `rejectStagedFile` · `enforceTouchList` ·
`getChangesetRevisions` · `revertToRevision` · `setChangesetConstraints` · `steerStudioSession` ·
`getStudioPreview` · `bulkUpdateRoadmapItems` · `getRoadmapHistory` · `resolveAssumptionChallenge` ·
`suggestOutcomeVerdict` · `recordDesignScaffoldFeedback` · **`recordGateSignal`** (written, called from
nowhere; §6.5's dissent rule is the cheapest thing that makes the compounding claim true).

---

## 15. BUILD ORDER

Each phase ends at something demonstrable, and "done" is testable, not a feeling.

**Phase 1 - the founder's example, end to end, Design face only. THE DEMO.**
`prd_scaffold_revisions` migration · `probe.ts` + `withProbe` + `bridge.ts` with the two-factor guard ·
`SelectionRef` + `ontology.ts` (`role`, `classify`) · Point mode with the Use/Point control ·
`MarkOverlay` corner ticks · `MarkComposer` · `MarkGroup` in the Thread · `proposeMarkResolution` ·
`srcDoc` preview with hold-`b` · `Approve N changes` / `Send back` · `applyDirectEdit` with fingerprint
verification and the degrade-to-mark failure path · `InlineText`.
*Done means:* click a button in a rendered mockup, type "move this right", press `⌘⏎`, watch the same
frame render the next revision, hold `b` to compare, approve, and the change is in `prd_scaffolds`, has
a revision row behind it, is on the record, and is still there tomorrow. And: click the heading, type
over it, and it saves with no model call, no spinner and no cost.

**Phase 2 - the screen contract.**
`CanvasFace` gains `FaceFooter` and `FaceLead`; `--work-h` and the derived tokens land;
`no-fixed-block-size` lint; the horizon strip; the scroll typology declarations; Stage mode (`f`);
`one-screen.spec.ts` + `fold.spec.ts` + `face-footer.spec.ts`.
*Done means:* at 1366x600, on every one of the seven faces, the primary action is visible without
scrolling and the exact count of what is below is on screen.

**Phase 3 - the division everywhere it is cheap, and the value controls.**
`ValueControl` · the two-cursor law on native surfaces via `useMarkable` · the roadmap's
`Now needs a promise` composer · the peek system (180ms, sessions, never fetches) · the consequence
line on the five buttons in §10.2 · `UndoLine` and the modal cull to the §8.3 six.

**Phase 4 - mark-level judgment on a real changeset.**
`artifact_marks` · `attribute.ts` · `MarkDiffGroup` · the one-diff rewrite (delete
`faces.tsx:1705-1875`, re-frame `ChangesPanel` two-way with `y`/`x` and the tally) · the mark-derived
touch list into `dispatchStudioSession` · the dissent line into `recordGateSignal`.
*Done means:* a mark on a prototype becomes a named group of hunks in a pull request that a human
accepted individually, and the pull request merged on green CI.

**Phase 5 - the other artifacts, and the compounding.**
the spec gutter + `prd.revise` binding · `StepLedger` replacing the `<pre>` · the QuillBar on spec and
thread · the repeated-mark pattern detector feeding `recordDesignScaffoldFeedback` · orphan re-anchor ·
multi-person pins.
*Done means:* after six marks moving a primary action right, the workspace is offered one
design-memory entry, and once accepted, the next generated mockup does not need the mark.

---

## 16. THE CONFLICT LEDGER

Every disagreement between the three lanes, resolved, with the loser named.

| # | Conflict | Ruling | Why |
| --- | --- | --- | --- |
| 1 | **Is the prototype iframe same-origin?** IX-C says yes, IX-A/IX-B say no. | **No.** IX-C loses on fact. | Verified at four render sites: `sandbox="allow-scripts"`, never `allow-same-origin`. The wrong comment at `faces.tsx:1150` is the source of the error and is deleted. IX-C's postMessage mechanism survives; its premise does not. |
| 2 | **How many modes?** IX-A: 2 (Use/Point). IX-B: 3 (Look/Point/Note). | **Two.** IX-B loses. | A mark **is** the note. A third mode is a third thing to learn for zero capability. Budget 24. |
| 3 | **What is the object called?** "mark" (IX-A) vs "note"/"comment" (IX-B, IX-C). | **Mark.** IX-A wins. | The lexicon's one-word-per-concept law, and the proof reader's mark hands us the entire visual grammar for free. |
| 4 | **Is selection in the URL?** IX-C: `?sel=<hash>`. IX-B: never. IX-A: `&mark=`. | **Transient selection is not; a placed mark is.** IX-B's principle + IX-A's exception. IX-C loses. | A pasted link should reproduce the screen, not someone else's cursor. But a placed mark has an id, a row, and a reason to be shared. A hash of a CSS selector is neither durable nor orthogonal. |
| 5 | **Point mode key.** IX-A: `p`. IX-B: `p` is "previous". | **`v`.** Both original answers lose. | Genuine collision. `v` is the select tool in Figma, Illustrator and Sketch, so the muscle memory is already in the user's hands, and it is inside IX-B's own artifact-local band. |
| 6 | **Keep/drop keys.** IX-B: `y`/`x`. IX-C: `A`/`X`. | **`y`/`x`.** IX-C loses. | IX-B's band reservation is the only collision-proof scheme, and `A` collides with the live `/admin` bug on Today. |
| 7 | **Filter key.** IX-B assigns both `f` (filter) and `/` (search). | **`/` only; `f` becomes Stage mode on artifact surfaces.** | Two keys for one job, and it freed the key IX-C needed. |
| 8 | **The commit word.** IX-A: `Keep`. IX-B: `Commit N hunks`. | **`Approve N changes` / `Send back`.** Both lose to the language contract. | FINAL-language §2.4 reserves **Keep** for ranking a bet into Now, and defines **Approve** as "you accept it and your crew continues" and **Send back** as "you reject the attempt but keep the work, with a reason" - which is exactly this act. IX-B's blast-radius law survives inside the label. |
| 9 | **Batch or send immediately?** IX-A: accumulate. IX-C: `⌘⇧Enter` dispatches one. | **Batch by default, `⌘⏎` sends one immediately.** IX-A wins with IX-C's path preserved. | Five rewrites produce five diffs nobody reads; one rewrite produces one diff a human can judge. 5x cheaper, and it removes a real race on one file. Budget 23. |
| 10 | **How many diff renderers?** IX-A assumes one. IX-B found two, plus a third `computeHunks` site. | **One.** IX-B wins. | `ChangesPanel.tsx:408`, `VerifyCockpit.tsx:348`, `faces.tsx:1705-1875`. Two hand-rolled LCS algorithms. Delete `faces.tsx:1705-1875`, keep `studio-hunks.ts`. |
| 11 | **Does the prototype have history?** IX-A assumes rewindable. IX-C found it does not. | **It does not; the migration is phase 1.** IX-C wins, and it reorders the build. | `persistScaffold` upserts `onConflict: "prd_id"`; there is no revisions table. Shipping direct edit onto that is a one-way door. |
| 12 | **Where does the proposal render?** IX-A: preview bar in the frame. IX-B: `ProposalBar` grammar. | **Same thing; merged.** `ProposalBar` is the grammar, hold-`b` is its prototype specialisation. | They were describing one component at two fidelities. |
| 13 | **`⌘.` = ask, or the composer = ask?** | **Both, and they are different acts.** `Enter` at an element = mark (change it). `⌘.` = ask about it (understand it). `⌘.` is cut from the deadline. | Guessing whether typed text is a question or an instruction is exactly the AI-slop failure this rebuild exists to avoid. |
| 14 | **The seven-tile rail at every breakpoint** (FINAL-ia §2.2). | **False below 530px of shell.** IX-C's compression adopted. | 7 × 44 = 308 and the work row is `shell − 222`. Arithmetic, not opinion. |
| 15 | **Seven full-size journey cards** (FINAL-ia §3.2). | **Three named cards plus an exact horizon.** IX-C wins. | 7 × 72 = 504 into a 280px body. |

---

## 17. WHAT CANNOT LAND BY 2026-07-31

The founder re-records the demo on the 31st. That is three days. **A small number of interactions done
to a truly high standard beats many done adequately**, and the fastest way to lose the demo is to ship
a thin version of everything.

**Ships (phase 1 only, Design face only):**
the revisions migration · the probe and the two-factor bridge · Point mode with the visible toggle ·
corner ticks and the role label · the at-element composer · one mark and many marks · `proposeMarkResolution` ·
the `srcDoc` preview with hold-`b` · `Approve N changes` / `Send back` · **direct text edit with the
degrade-to-mark failure path** · the Thread group with the client-side conflict line · the `cant` verdict
rendered honestly.

**Cut, and named so nobody quietly attempts them:**

1. **Path B end to end** (mark → `dispatchStudioSession` → changeset → hunks grouped by mark → PR). The
   backend is real; the attribution layer, `MarkDiffGroup` and the diff rewrite are not three days of
   work. **Demo it as the roadmap slide, not as a live click.**
2. **The one-diff rewrite.** Two renderers and three `computeHunks` call sites survive the demo. The
   mission workbench already renders `ChangesPanel`, which is good enough to show.
3. **Marks on specs, roadmaps, plans, decisions, metrics, threads, graphs.** `artifact_marks` does not
   exist. The gesture is demonstrated on one surface, honestly, and claimed for the rest as design.
4. **`StepLedger`.** Replacing the `<pre>` is mostly deletion of worse code, but it is not the demo.
5. **The peek system, the consequence lines, `UndoLine`, the modal cull.** All phase 3. Real work,
   invisible in a 40-second recording.
6. **The full enforcement battery.** Only three tests ship with phase 1: `mark-probe.test.ts`,
   `no-same-origin-sandbox` lint, and `one-screen.spec.ts` on the Design face alone. The other eleven
   are phase 2 and the budgets are aspirational until then. **Say that out loud rather than claiming a
   contract we do not enforce.**
7. **`⌘.` ask-about-selection**, multi-person pins, orphan re-anchoring beyond the fingerprint case,
   attachments on marks, and the repeated-mark pattern detector.
8. **The `CanvasFace` footer refactor.** It touches every face and it is the right fix, but doing it in
   the same 72 hours as the probe risks both. Stage mode (`f`) is the demo's answer to the 280px
   problem instead, and it is one component.

**The one thing that must not be cut, even under pressure:** `prd_scaffold_revisions`. Without it, the
second time the founder types on the mockup in the recording, there is no way back, and the demo has to
be shot in one take. That is not a demo, it is a magic trick.

---

## 18. THE 40 SECONDS

1. A rendered mockup of a real spec, in the customer's brand. `0:00`
2. Press `v`. The frame's border goes ember. Hover the primary button: corner ticks, and the label reads
   `primary action`. `0:04`
3. Click. Type `move this right`. Enter. The card flies into the Thread, a pin stays behind. `0:09`
4. Click the heading. The cursor is an I-beam. Type over it. It saves. **No spinner, no agent, no cost.**
   Say the sentence: *text you can change, you change.* `0:16`
5. Mark two more things. `⌘⏎`. One call, not three. `0:22`
6. The same frame renders the next revision. Hold `b`: the button snaps back left. Release: right. Pin 3
   shows `×` and one honest line: it could not, and why. `0:31`
7. `Approve 3 changes`. `⌘Z` still works; press it, then redo, to prove the revision trail is real. `0:36`
8. Open the Brain. One new line: *you have moved a primary action right six times. Should this be how we
   build them?* `0:40`

**The line:** every other tool lets you comment on a preview. Ours turns the comment into an attributable
group of hunks in a real pull request, writes it to the record, and teaches the workspace what you like so
the next render does not need the comment at all.

---

## 19. WHAT IS STILL OPEN

| # | Open | Why it is not closed here |
| --- | --- | --- |
| O1 | Whether a promoted prototype's `prototype_files` row and a live `studio_changes` row can point at the same path at once. | They cannot collide today; the promote path is thin enough that a future change could make them. One precedence guard, written when Path B ships. |
| O2 | The probe's threat surface. Our own generated HTML, no `allow-same-origin`, four message types, two-factor guard. | Defensible, not proven. Security review signs it off before it ships publicly. |
| O3 | Whether the T2 section rail sits on the region's right edge or its left. I lean right. | Needs a real spec at real length in front of a real reader. |
| O4 | Whether Stage mode persists per surface or per session. | Needs to be used before it is decided. |
| O5 | Multi-device semantics for the rail's `seen_at` delta. I think per user, not per device. | Founder call. |
