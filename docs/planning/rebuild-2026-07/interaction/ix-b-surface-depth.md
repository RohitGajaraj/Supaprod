# IX-B: Per-surface interaction depth

> _Created: 2026-07-28 · Last updated: 2026-08-03_

> Lane B of the interaction rebuild, 2026-07-28. Head of Product Design.
> Scope: what a user can **do** with every artifact type the product renders, at the level of
> gesture, key, and the exact server function each gesture writes to.
>
> Every file, line, table, enum and function named below was read or run against live code in
> this session. Where the brief's ground truth was wrong, this document says so and carries the
> corrected fact.
>
> Binding on this lane: [`craft-law.md`](../craft-law.md) (anti-slop, brand mark, banned defaults)
> and [`ia/FINAL-ia.md`](../ia/FINAL-ia.md) (the room, the rail, the URL grammar, the shape law).
> Where this document extends the IA's §6.4 shape law it says so explicitly and gives the reason.

---

## 0. What this document decides

The founder's sentence is the whole brief: *"how are we showcasing the code snippet in the Build
screen, how is the design mockup interactive."* Asked of every surface.

Three answers, in order of consequence:

1. **One selection bus.** A single piece of room state, `SelectionRef`, that anything on screen can
   write and the composer always reads. This is the mechanism behind "point at the thing and talk
   about it", and it is one primitive, not eleven features. §3.
2. **One proposal grammar.** Every time the machine proposes a change to something, it renders as a
   reviewable overlay **on that thing**, judged at the smallest meaningful unit, with a live count
   and one commit. Code hunks, spec edits, prototype revisions, roadmap moves, memory promotions:
   the same five parts, the same two keys. §4.
3. **Eleven artifact contracts.** Each artifact type gets a filled-in twelve-row contract. Uniform
   on purpose: a user learns the product once. §5.

Then the dialog grammar (§6), the keyboard reservation (§7), and the anti-scroll density law (§8),
which is the direct answer to "too much scroll, what can the user see within a particular screen."

**The line this lane holds:** a layout is something you look at. This is software you reach into.
No palette, spacing scale or motion curve closes that gap. Selection does.

---

## 1. Corrections to the ground truth

The brief was right about the shape of the problem and wrong on four facts. Correcting them changes
what gets built.

| # | The brief said | Verified reality | Consequence |
| --- | --- | --- | --- |
| C1 | Hunk-level accept and reject "exists in the backend and is not surfaced" | **It is surfaced.** `src/components/studio/ChangesPanel.tsx` (1367 lines) imports `computeHunks` at line 24, renders a per-hunk tap-to-reject list at lines 1259 to 1362, and calls `applyStagedHunkSelection` (line 176) and `rejectStagedFile` (line 177). It has exactly one importer: `src/routes/_authenticated.build.$missionId.tsx`. | The work is not "surface a hidden capability". It is: (a) the interaction is **reject-only** and framed as damage, not judgment; (b) it lives on a route [FINAL-ia §7.2](../ia/FINAL-ia.md) re-homes; (c) the room's own Build face renders a **second, entirely read-only** diff. Two diff implementations, neither one judgeable. §5.1 rewrites one and deletes the other. |
| C2 | (implied) one diff renderer | **Two.** `ChangesPanel.tsx` (curation, `--hairline` / `--surface-raised` / `--text-*` / `--geist-space-2x` tokens) and `faces.tsx:1696-1875` (`lineDiff`, `DiffFile`, `DiffPanel`, read-only, `--ink-*` tokens). Two line-diff algorithms too: `studio-hunks.ts:diffLines` and `faces.tsx:lineDiff`, both hand-rolled LCS. | One diff component, one hunk engine (`studio-hunks.ts`, already unit-tested), one token set. Delete `faces.tsx:1705-1875` outright. |
| C3 | `prototype_messages` / `prototype_attachments` are "unused tables" | True, and better than the brief implies: both are **fully provisioned**. `supabase/migrations/20260619212731_*.sql:430-447` gives each a `workspace_id` (backfilled, NOT NULL, indexed), a `set_row_workspace_from_user` trigger, and an RLS policy `own X in member workspace`. They appear in `src/integrations/supabase/types.ts:6139` and `:6240`. | **Comment-on-prototype needs zero migration.** The founder's headline ask ships on storage that already exists and is already secured. §5.3. |
| C4 | prototypes render "same-origin `srcDoc` with a scripts-only sandbox" | The `srcDoc` string is same-origin **at authoring time**; the frame itself is `sandbox="allow-scripts"` with no `allow-same-origin`, so it executes at a **null origin** (`faces.tsx:1284`). | The parent **cannot** touch the iframe DOM. All reach-in must be `postMessage`, and the parent must validate `event.source === frameRef.current.contentWindow`, **not** `event.origin` (which is the string `"null"` and proves nothing). This is a correctness fact, not a preference. §5.3. |

Two further facts this lane depends on, both verified:

- **`LoopStep` is structured.** `src/lib/ai/loop.server.ts:214-227`: a discriminated union of `thought`,
  `tool_call` (with `name`, `args`, `reason`, `ok`, `result`, `error`, `approval_id`, `status`), and
  `final`. `StudioRunDetail.steps` carries it to the client (`studio.functions.ts:104`). Today
  `faces.tsx:1647-1688` renders `output.slice(-2000)` into a `<pre>`. We are throwing away structure
  we already have and calling the result a terminal. §5.2.
- **`applyStagedHunkSelection` already has optimistic concurrency.** `studio.functions.ts:1824-1827`
  takes `expectedUpdatedAt` and fails loudly when the row moved. The judgment UI inherits a correct
  concurrency story for free.

---

## 2. The five laws

Everything in §5 is generated by these. If a spec below and a law here disagree, the law wins.

**L1. Selection is the address.**
Anything a user can point at can be selected, and selecting it changes what the composer means. No
artifact is allowed to be a picture. If a thing renders and cannot be selected, either give it a
selection or stop rendering it as if it were an object.

**L2. Every artifact is a three-part instrument: judge, reach, trace.**
- *Judge*: the verdict bar. What is being asked of you, and the two or three answers.
- *Reach*: the body. What you can change, at the smallest unit that means anything.
- *Trace*: the receipt footer plus `ChainStrip`. Who made this, when, from what, and what it fed.
An artifact missing one of the three is unfinished. This is enforceable: `artifact-frame.test.ts`
fails when a registered artifact renderer does not mount all three slots.

**L3. Hover reveals, it never adds.**
Affordances occupy reserved space at rest, drawn at `--ink-faint`, and rise to `--ink-body` on
hover or focus. Nothing shifts layout on hover. A control that only exists on hover does not exist
on a trackpad-less demo, on touch, or for anyone using a keyboard, and it is the single most common
reason a product tests as "I did not know I could do that".

**L4. One primary gesture per artifact, and it is the same gesture as reading.**
The primary gesture must be the one a naive user performs by accident. On a diff, that is clicking a
hunk. On a prototype, clicking an element. On a table, clicking a row. Everything else is secondary
and is allowed to need a key or a hover. If your primary gesture needs instruction, it is wrong.

**L5. Machine output is a proposal until a human commits it.**
Never an in-place mutation the user discovers afterwards. See §4. The one exception is a change the
user themselves typed, which commits directly, because it was already their judgment.

---

## 3. The selection bus

One provider at the room level. One hook. This is the load-bearing new primitive in this document.

```ts
// src/lib/selection.ts  (types only, server-free, unit-testable)
export type SelectionLocus =
  | { type: "hunk";    path: string; hunkId: number }
  | { type: "lines";   path: string; from: number; to: number }
  | { type: "element"; selector: string; tag: string; rect: DOMRectLike }
  | { type: "text";    blockId: string; from: number; to: number }
  | { type: "row";     rowId: string }
  | { type: "rows";    rowIds: string[] }
  | { type: "node";    nodeKey: string }        // matches nodeKey() in knowledge-graph-view.ts
  | { type: "step";    index: number }
  | { type: "window";  fromTs: string; toTs: string; series: string }
  | { type: "message"; messageId: string };

export type SelectionRef = {
  /** The artifact, in the SAME grammar as ?focus= (FINAL-ia §6.1). */
  artifact: { kind: string; id: string };
  locus?: SelectionLocus;
  /** What the composer says out loud. Human words, never an id. */
  label: string;
  /** Verbatim content sent as context. Capped at 4000 chars, truncation is visible. */
  quote?: string;
};
```

**Where it lives.** `SelectionProvider` mounts once in the room shell, beside the Escape-stack owner
that [FINAL-ia §6.3](../ia/FINAL-ia.md) lifts out of `RoomDetail.tsx:209-226`. Exactly one selection
exists at a time, across the whole room.

**Deliberately not in the URL.** `?focus=` is *what is open*; selection is *what is pointed at*. A
pasted link should reproduce the screen, not someone else's cursor. The one exception: a comment pin
on a prototype is durable, addressable, and lives in `prototype_messages` (§5.3).

**How it renders, everywhere, identically.**

| Surface | Rendering |
| --- | --- |
| The thing itself | 1px `--voice-human` inset ring plus a 2px `--ink-bg` gap. Never a fill, never a shadow. |
| The composer placeholder | swaps from `Ask or tell Supaprod to do something` to `Ask about hunk 3 of studio.functions.ts` |
| The composer, left of the caret | a dismissable mono chip carrying `label`, with an `×`. `Esc` clears the selection before it closes anything else. |
| The `AskAnchor` | a single quiet affordance next to the selection reading `⌘.`, appearing on selection, not on hover. The only floating element in the design. |

**Keys.** `⌘.` opens the composer with the selection attached (the pre-loaded door). `⌘J` opens it
empty (the blank door). Same panel. `.` is Cursor's inline-edit key, so the muscle memory is already
in our user's hands.

**What "attached" means mechanically.** The composer's existing `supaprod:open-ask` path is unchanged.
`formatSelection(ref)` builds one context block prepended to the user's message. No new
`CallSurface` literal, no new gateway call, no change to `runtime.server.ts`.

**Why this is the whole design.** In Lovable, v0 and Claude artifacts the artifact *is* the interface:
you do not describe a change in a box far from the thing, you point at the thing. That is one piece
of state and one context formatter. Build it once and eleven surfaces get deep at the same time.

---

## 4. The proposal grammar

**Every machine proposal renders on the thing it changes, judged at the smallest meaningful unit.**

Five parts, always in this order, always these words:

| Part | Rule |
| --- | --- |
| **1. The claim** | One sentence naming who proposed it and why. `Engineer staged 3 files to add the rollout gate.` Sourced from the `tool_call.reason` on the step that produced it. Never "AI suggested changes". |
| **2. The units** | The judgeable atoms. Hunks, suggested spans, revised elements, moved rows. Each carries `in` or `out`. **Default is `in`**, because the machine already argued for it and a wall of undecided checkboxes is a tax on the common case. |
| **3. The count** | Live, in the header, mono: `3 files · 9 hunks · 8 in, 1 out`. Never a percentage. Never a progress bar. |
| **4. The commit** | One button that says exactly what it will do: `Commit 8 hunks`, not `Apply`. Disabled with a stated reason when zero units are in. |
| **5. The discard** | Quiet, secondary, and it says where the work goes: `Send back with a note` (returns to the agent with your reason), not `Cancel`. |

**Two keys, everywhere:** `y` keeps the focused unit, `x` drops it. Chosen because `n` and `p` are
next and previous, and `k` and `c` and `e` belong to the depth rail (§7). `⌘⏎` commits.

**The dissent rule.** Dropping a unit always asks for one optional line ("why not?"), inline, never a
modal, never blocking. That line goes to two places: the agent's send-back context, and
`gate-signals.functions.recordGateSignal`, which [FINAL-ia §2.3](../ia/FINAL-ia.md) identifies as
fully written and called from nowhere. **Every dissent teaches the Brain.** This is the single
cheapest way to make the compounding claim true rather than aspirational, and it costs one optional
text input.

**Where the grammar applies:** §5.1 code diff, §5.4 spec suggestions, §5.3 prototype revisions,
§5.6 roadmap moves that contradict a belief, §5.7 bulk table edits, and memory promotion in the
Brain pane. Six surfaces, one thing to learn.

---

## 5. The eleven artifacts

Each spec is one paragraph on the hard part, then the uniform twelve-row contract, then the writes.

Shared to all eleven, stated once:
- **Frame:** every artifact mounts inside `ArtifactFrame` (title row, verdict-bar slot, body with its
  own scroll, `ReceiptLine` footer, `ChainStrip`, `NextLine` door). L2, enforced.
- **Focus:** `Tab` reaches the frame; the frame's local keys arm only while it holds focus, and the
  frame's footer shows its key legend, right-aligned, at `--ink-faint`, while focused. Nothing else
  in the product teaches keys.
- **Ask:** `⌘.` always. The "asked in context" row below states what the agent receives.
- **Error:** never a toast alone. The frame keeps its chrome and states the real message with a
  retry, per [FINAL-ia §4.3](../ia/FINAL-ia.md).

---

### 5.1 A code diff

**The hard part: a diff must be judgeable.** Today it is not, in either implementation. `ChangesPanel`
lets you tap hunks to *reject* and then press `Apply (2 rejected)`, which frames the human as damage
to the machine's work and gives no signal at all when you agree. `faces.tsx`'s `DiffPanel` renders
lines with no judgment path whatsoever, capped at 200 lines with a `n more lines` stub. Both miss the
same thing: **you are not judging code, you are judging a decision.** The staged hunk exists because
a `tool_call` had a `reason`. Surface the reason on the hunk and the whole act changes from code
review to approval, which is the job our user actually has.

The rewrite: one `DiffFile` per path, hunks as the atom, `in` by default, per-hunk `y`/`x`, the
count in the file header, and on each hunk a one-line `why` sourced from the `studio.stage` step that
produced it, whose mono `trc_*` chip peels the trace step. `faces.tsx:1705-1875` is deleted; the room
and the mission workbench render the same component.

| --- | --- |
| --- | --- |
| **Primary gesture** | Click a hunk. It toggles `in`/`out` and becomes the selection. (Today's tap-to-reject, made two-way and given a count.) |
| **Hover** | The hunk's left gutter rises from `--ink-faint` to `--ink-body` and shows `y  x`. The `why` line and the `trc_*` chip are present at rest, dimmed. Zero layout shift (L3). |
| **Selection** | `{ kind:"changeset", id }`, locus `{type:"hunk", path, hunkId}`. Drag-select across lines instead gives `{type:"lines", path, from, to}`. |
| **Keyboard** | `n`/`p` next/previous hunk · `y` keep · `x` drop · `Space` expand full context · `o` open the file whole · `[`/`]` previous/next file · `⌘⏎` commit · `⌘C` copy the hunk as a unified patch |
| **Copyable** | The hunk as unified diff; the file's new content whole; the path; the `trc_*` id. `⌘C` copies the selection, never the page. |
| **Editable** | No. A diff is judged, not typed into. Typing a fix is a *steer*: `⌘.` on the hunk, say what is wrong, which posts through `steerStudioSession`. The agent re-stages, which produces a revision, which is the honest record. |
| **Expandable** | Hunk to full context (`Space`); file to whole content; changeset to `getChangesetRevisions`, rendered as a version trail, not a modal. |
| **Deep-links** | `/$ws/$product/mission/$id?tab=diff&file=<path>&hunk=<n>`. Every hunk is a pasteable link. `?file=` and `?hunk=` are new params on the mission child, additive to [FINAL-ia §6.1](../ia/FINAL-ia.md). |
| **Empty** | Staged-but-zero-files: `The agent finished without changing anything. Here is what it read.` plus the read list from the run's `repo.read` steps. Never a blank panel. |
| **Loading** | The file list, real, immediately (`getChangesetDiff` returns paths with content in one call). Each file body draws a hunk-shaped skeleton at the file's true hunk count. Never a spinner, never a wrong number. |
| **Asked in context** | `⌘.` on a hunk sends: path, op, the hunk's base and modified lines, the staging step's `reason`, and the file's policy status from `evaluateFileSetPolicy`. Standing asks offered as chips: *why this change · what breaks if I drop it · is this in scope*. |
| **Writes** | keep/drop is local until commit. Commit calls `applyStagedHunkSelection({ changesetId, path, rejectedHunkIds, expectedUpdatedAt })` per touched file, plus `rejectStagedFile` when a whole file is out. Scope violations offer `enforceTouchList`. A dissent line also calls `recordGateSignal`. |

**The one idiosyncratic detail (craft-law §3):** the file header's count is a **physical tally**, drawn
as hairline ticks, one per hunk, filled for `in` and hollow for `out`. You read the shape of your own
judgment before you read the number. One per surface, and this is Build's.

---

### 5.2 A terminal or run log

**The hard part: it must be scannable, not a wall.** We already hold `LoopStep[]`. Rendering it as a
`<pre>` of the last 2000 characters is the single clearest case in the codebase of structure being
discarded at the last inch. A run log is a **ledger of decisions with outcomes**, and it reads like
one: one line per step, collapsed, with failures already open.

```
RUN  ms_44 · builder · gemini-2.5-flash              9 steps · 2 errors · 41s · $0.014
────────────────────────────────────────────────────────────────────────────────────
 ▸ 14:22:01  thought    picking the smallest file that satisfies the touch list
 ▸ 14:22:03  repo.read  src/lib/studio.functions.ts                    ok    0.4s
 ▾ 14:22:07  studio.stage  3 files                                   error   1.2s
      touch list allows src/lib/**; src/routes/api/chat.ts is outside it
      [ widen the touch list ]  [ ask why ]                              trc_9 →
 ▸ 14:22:14  studio.stage  2 files                                     ok    0.9s
 ⏸ 14:22:20  studio.pr.open                                        waiting on you
────────────────────────────────────────────────────────────────────────────────
 all · tools · errors · files                                    / filter   \ raw
```

Four rules make this work: one line per step, errors expanded by default and everything else
collapsed, every failure carrying its own recovery door, and the raw stream still exactly one key
away (`\`) so nobody feels lied to.

| --- | --- |
| --- | --- |
| **Primary gesture** | Click a step row. It expands in place (a peel, no URL) showing `args`, `result` or `error`, and the recovery door. |
| **Hover** | Row background to `--ink-raised`; the duration and the `trc_*` chip rise from `--ink-faint`. |
| **Selection** | `{ kind:"run", id: run_id }`, locus `{type:"step", index}`. |
| **Keyboard** | `n`/`p` step · `Space` expand · `e` is reserved (rail), so **`⇧E` jumps to the next error** · `f` filter · `/` search within the log · `\` toggle raw · `o` open the trace child · `End` follow live |
| **Copyable** | One step as JSON; the whole log as text; the error message alone (its own copy affordance, because that is the string people paste into a search). |
| **Editable** | No. A log is a record. But it is **steerable while running**: the composer is live under it and `steerStudioSession` posts guidance the loop consumes at its next checkpoint. The steer appears in the ledger as a human-voice line, so your intervention is on the record beside the machine's. |
| **Expandable** | Step to detail; `tool_call` to the approval card when `status === "queued"`; the whole run to the trace child. |
| **Deep-links** | `/$ws/$product/trace/$traceId?step=<n>` ([FINAL-ia §6.1](../ia/FINAL-ia.md), unchanged). The step row's `trc_*` chip is that link. |
| **Empty** | Queued: `Queued. The runner picks this up within a minute.` plus the work order it will execute, readable now. Never an empty black rectangle. |
| **Loading** | Rows stream in and the newest is pinned to the bottom **only while you are at the bottom**. Scrolling up detaches and shows `3 new steps ↓`. Auto-scroll that fights the reader is the classic terminal defect. |
| **Asked in context** | `⌘.` on a step sends the step kind, tool name, `args`, `error`, and the two steps either side. Chips: *why did this fail · try again differently · what did it read*. |
| **Writes** | Reading writes nothing. Recovery doors call real functions: `setChangesetConstraints` (widen touch list), `decideApprovalItem` (approve a waiting tool), `steerStudioSession` (redirect), `refreshStudioCi` (re-read checks). |

---

### 5.3 A design prototype

**The founder's headline example, and the one that ships on existing storage.** The reference loop is
Lovable and v0: point at an element, say what is wrong, watch it change; and for text, just type. We
have the iframe (`faces.tsx:1279-1287`), the HTML (`prd_scaffolds.html`, `prototype_files.content`),
the brand (`design-memory.functions.ts`), the critic (`runScaffoldDesignCritic`), the gate
(`decideDesignGate`), and the comment tables (C3). What is missing is the reach-in, and the reach-in
is a `postMessage` protocol plus one injected script.

**Three modes, and the mode is visible at all times** in the frame's chrome, which today wastes that
row on a fake URL (`relay.heliolabs.com/inbox/digest`, `faces.tsx:1267`, a hardcoded lie that goes).

| Mode | Key | What a click does |
| --- | --- | --- |
| **Look** | `1` (frame-local) | The prototype behaves as the real thing. Clicks go to the page. |
| **Point** | `2` | Click selects an element. Double-click on a text node makes it editable in place. |
| **Note** | `3` | Click drops a numbered pin and opens a one-line input. |

**The protocol.** `instrumentScaffold(html)` injects one script we author before `srcDoc` is set.
The frame is at a null origin (C4), so the parent validates
`event.source === frameRef.current?.contentWindow` and **never** `event.origin`.

```
parent -> frame   { t:"sp:mode",  mode:"look"|"point"|"note" }
                  { t:"sp:focus", selector }
                  { t:"sp:pins",  pins:[{id,selector,x,y,n,resolved}] }
frame  -> parent  { t:"sp:ready",  v:1 }
                  { t:"sp:hover",  selector, tag, label, rect }
                  { t:"sp:select", selector, tag, label, rect, text }
                  { t:"sp:edit",   selector, before, after }
                  { t:"sp:pin",    selector, x, y }
                  { t:"sp:size",   h }
```

**Two different edit paths, and the difference is the design.**

- **Text you type yourself commits directly.** `sp:edit` calls `applyPrototypeTextEdit({ prototypeId,
  selector, before, after })`, a deterministic anchored string replacement on the stored HTML. No
  model call, no cost, no latency, no proposal grammar (L5's exception: it was already your
  judgment). This is the founder's *"certain text I can edit myself"*, and it is the cheapest
  interaction in the product.
- **Everything structural goes through a scoped revision.** "move this button right", "make these
  cards two columns", "use the brand orange here" call `reviseScaffoldElement({ prototypeId,
  selector, instruction })`, which sends **only the selected subtree** plus the design-memory block
  to the model and swaps the returned subtree back. Small prompt, small diff, fast, and it renders
  through the proposal grammar (§4): the changed region outlined, `Keep` / `Put it back`, one line of
  what changed. A full-page regeneration for a button nudge is the thing that makes these tools feel
  like slot machines. We do not do that.

**Notes are the batch path.** A pin is a `prototype_messages` row (C3, zero migration). Pins render as
numbered dots on the frame and as a numbered list in the right rail, the two always in sync. When you
have four, `Apply all 4 notes` dispatches **one** revision carrying all four selectors and
instructions, which is both cheaper and produces a coherent result. Each note resolves to
`applied`, `skipped` with the agent's reason, or `needs you`.

| --- | --- |
| --- | --- |
| **Primary gesture** | Click an element (in Point mode). Outline plus label chip: `button.btn-primary "Send digest"`. |
| **Hover** | 1px `--voice-machine` outline on the element under the cursor, plus a small tag label at its top-left corner, inside the frame. Nothing outside the frame moves. |
| **Selection** | `{ kind:"prototype", id }`, locus `{type:"element", selector, tag, rect}`. |
| **Keyboard** | `1`/`2`/`3` mode (frame-local, live only while the frame has focus) · `Esc` clear selection · `↑` select parent element · `⌥↑`/`⌥↓` previous/next sibling · `⌘⏎` apply pending notes · `o` open full screen |
| **Copyable** | The element's selector; its text; the whole HTML; the share URL `/p/$shareSlug`. |
| **Editable** | Text nodes, directly (`applyPrototypeTextEdit`). Everything else through a scoped revision or a note. Never a raw HTML text area: that is a developer tool wearing a designer's label. |
| **Expandable** | Frame to full-screen (`o`); breakpoint switcher (desktop / tablet / phone) which resizes the frame, never re-generates; the states row (`Default / Loading / Empty / Error`) which exists today at `faces.tsx:1228-1246` and stays, because it is genuinely good. |
| **Deep-links** | `/$ws/$product/prototype/$id?note=<n>` opens with that pin focused and the frame scrolled to it. A note is the one durable selection in the product, so it is the one selection with a URL. |
| **Empty** | `No prototype yet. Design renders the approved spec as a clickable mockup in your brand.` plus the `Design this` door (`j5`). Already correct at `faces.tsx:1181`; keep the words. |
| **Loading** | The device frame draws immediately with its chrome, and the viewport shows the **brand's** background colour from design memory with a single settling line of type. Generation takes seconds; showing a grey box for those seconds is what makes it feel like a form submission instead of a workshop. |
| **Asked in context** | `⌘.` on an element sends the selector, tag, the element's own HTML (capped), the nearest heading for context, and the design-memory summary. Chips: *move it · restyle it · what does this do · is this in the spec*. |
| **Writes** | `applyPrototypeTextEdit` (new, deterministic) · `reviseScaffoldElement` (new, scoped model call, `surface:"prd"`, reusing the existing `CallSurface`) · `prototype_messages` insert/resolve (new server fns over an existing table) · `runScaffoldDesignCritic` (exists) · `decideDesignGate` (exists) · `togglePrototypeShare` (exists). |

**What I would demo from this section alone:** open a generated mockup, double-click the headline,
retype it, watch it stick. Then click the button, type "move this right and use our orange", watch
that region change with a keep-or-revert bar. Two gestures, no chat panel, no page reload. That is
the difference between okay and great, and it is roughly one protocol plus two server functions.

---

### 5.4 A spec document

**The hard part: an AI writing surface that does not overwrite you.** Verified today
(`clicks-b-surfaces.md` finding 9): the four assist buttons on `_authenticated.plan.spec.$id.tsx`
render on every tab, make a **real paid model call**, and then discard the result because
`taRef.current` is null outside edit mode. Silent, billed, useless. The cause is architectural: the
assist is a page-level button with no idea what it is acting on. Selection fixes it by construction.

Tiptap is installed and `DocEditor.tsx` exists. The spec editor is a tiptap document with a
**QuillBar**: select text, a small anchored bar appears with `Rewrite · Tighten · Cite · Challenge ·
Ask ⌘.`. The result never replaces your text. It renders as a `SuggestionOverlay` inside the
document, insertions in `--verdict-pass` tint, deletions struck through, with `⌘⏎` accept and `Esc`
discard. Same grammar as a code diff (§4). A PM who has judged one hunk knows how to judge a
paragraph.

| --- | --- |
| --- | --- |
| **Primary gesture** | Select text. The QuillBar appears anchored below the selection. |
| **Hover** | A claim with citations shows its `CitationList` chips at rest, dimmed; hover raises them and reveals the source title. (`CitationList.tsx`, 53 lines, currently unmounted, homed here by [FINAL-ia §2.7](../ia/FINAL-ia.md).) |
| **Selection** | `{ kind:"prd", id }`, locus `{type:"text", blockId, from, to}` with the `quote`. |
| **Keyboard** | Standard editing throughout · `⌘.` ask about the selection · `⌘⏎` accept the focused suggestion · `Esc` discard it · `⌘S` explicit save (autosave runs anyway) · `⌥↑`/`⌥↓` move a block |
| **Copyable** | Selection as markdown; the whole spec as markdown; the spec's stable id; a share link. |
| **Editable** | Everything, directly, with autosave every 2s idle and a `Saved 14:22` line in the footer. This kills `clicks-b` finding 19 (no dirty flag, no beforeunload guard, edits lost on a crumb click) by removing the concept of unsaved work. |
| **Expandable** | A citation chip peels its source text in place. An assumption peels its history and its watch date. A section collapses. The Thread column carries provenance ([FINAL-ia §2.6](../ia/FINAL-ia.md)). |
| **Deep-links** | `/$ws/$product/spec/$specId?tab=doc#<blockId>`. Block anchors, so review comments point at a paragraph. Fixes `clicks-b` finding 18 (tab held in local state, address bar lies) by putting `tab` in the URL, functional-form only. |
| **Empty** | A new spec opens with its section skeleton visible and greyed, plus one line: `Say what you are building and the crew drafts this.` A blank page is a demand; a skeleton is an offer. |
| **Loading** | Streaming generation renders into the real document with the machine-voice caret already used at `faces.tsx:1681`. You watch it write in the place it will live, not in a chat bubble that later teleports. |
| **Asked in context** | `⌘.` on a selection sends the quote, its section heading, and the spec's citations for that block. Chips: *tighten this · what is this based on · challenge this · what breaks if we ship it*. |
| **Writes** | `prdAssist` (`discovery.functions.ts:1738`) for suggestions · direct autosave for typed edits · `generateTaskGraph` from the tasks tab · `resolveAssumptionChallenge` on an assumption · `recordGateSignal` when a suggestion is discarded. |

---

### 5.5 A decision record

**The hard part: it must be immutable in body and alive in consequence.** A decision you can quietly
edit is not a record, and the Brain's whole claim rests on decisions being trustworthy. So: the body
is read-only forever, and the affordances are all forward. You supersede a decision; you never edit
one. `decisions.functions.ts` already has `updateDecision`, which is a hazard: it becomes internal
(status transitions only), not a user-facing edit path.

The primary gesture is deliberately not an action. It is **reading what else was considered.** A
decision card's most valuable region is the alternatives and the reason, and today that is the region
nobody renders.

| --- | --- |
| --- | --- |
| **Primary gesture** | Click the decision. It peels to show: what was decided, by whom, when, what else was considered, why not, and what evidence existed **at the time**. |
| **Hover** | The `ReceiptLine` and the `/d/$slug` share affordance rise. The decision body itself has no hover state, on purpose: nothing here is clickable, and pretending otherwise is a lie. |
| **Selection** | `{ kind:"decision", id }`, no locus. |
| **Keyboard** | `Space` peel · `o` open its chain in the Map · `⌘C` copy as a citable block (title, date, decider, one-line reason, permalink) |
| **Copyable** | The citable block above. This is what a PM pastes into Slack, and it is the highest-frequency copy in the product. |
| **Editable** | **No.** Two forward doors instead: `Supersede this` (writes a new decision plus a `supersedes` edge, already in `GRAPH_RELATIONS`) and `Challenge an assumption` (`resolveAssumptionChallenge`). |
| **Expandable** | The evidence chain; the assumptions with their watch dates; the outcome that judged it once one exists. That last link is [FINAL-ia §5.7](../ia/FINAL-ia.md)'s closure link and the single most important door in the product. |
| **Deep-links** | `?pane=brain&pview=calls&item=<id>` for the private read; `/d/$slug` for the public share. |
| **Empty** | Zero decisions: `Nothing has been decided here yet. The first call you make at a gate lands here.` A record's empty state should teach what fills it. |
| **Loading** | A card-shaped skeleton at the true row count from the list query. |
| **Asked in context** | `⌘.` sends the decision, its alternatives, its assumptions and their status. Chips: *has this held up · what did it change · who else has decided this*. |
| **Writes** | `createDecision` (supersede) · `resolveAssumptionChallenge` · nothing else. Reading a decision must never mutate it. |

---

### 5.6 A roadmap

**The hard part: a drag is a promise, and promises need memory.** `updateRoadmapItem` already reads
the prior state before writing so the audit records where a commitment moved **from**
(`roadmap.functions.ts:141-150`). That is an unusually careful backend and the UI should be worthy of
it. The move that matters: when a drag contradicts something the Brain believes, we do not block with
a confirm dialog. The move lands, and a quiet line appears under the board: *"You moved Rollout gate
to Now. Last time you shipped without one it cost about two days."* with `Undo` and `See the chain`.
Interruption is a cost; a footnote with an undo is not.

| --- | --- |
| --- | --- |
| **Primary gesture** | Drag a card between Now / Next / Later. Optimistic, instant, with an undo line. |
| **Hover** | The card's ICE bar and its `updated_at` tail rise from `--ink-faint`. A grab affordance appears in reserved space (L3). |
| **Selection** | `{ kind:"roadmap_item", id }`; multi-select `{type:"rows", rowIds}` via `Shift`+click. |
| **Keyboard** | `n`/`p` card · `←`/`→` move a bucket · `Space` select · `Enter` open the bet · `⌘Z` undo the last move · `⇧R` rewind to the captured snapshot (`hasSnapshot` already exists on `RoadmapItem`) |
| **Copyable** | The board as a markdown table (the thing that goes into a status update); one item's outcome and measure. |
| **Editable** | Inline: `outcome` and `measure` edit in place on the card (`updateRoadmapItem` already accepts both). Bucket edits by drag or arrow. Nothing opens a form. |
| **Expandable** | A card peels to its evidence chain and its decision. `getRoadmapHistory` peels as a version trail. |
| **Deep-links** | `?stage=plan&view=roadmap&focus=roadmap_item:<id>`. |
| **Empty** | Per bucket, a `WarmSlot` naming who acts next: `Nothing in Now. Approve a bet in Decide and it lands here.` Three separate empty states, because an empty Later means something different from an empty Now. |
| **Loading** | Column-shaped skeletons at the true per-bucket counts, which `getRoadmap` returns in one call. |
| **Asked in context** | `⌘.` on a card sends title, ICE, bucket, outcome, measure, and the contradicting belief if any. Chips: *why is this ranked here · what does this depend on · what happens if we cut it*. |
| **Writes** | `updateRoadmapItem` (drag, inline edits) · `bulkUpdateRoadmapItems` (multi-select) · `commitRoadmapItem` · `getRoadmapHistory` (rewind). `governanceGaps` from `getRoadmap` renders as a single honest line: `2 bets in Now have no measure`, with the gap inline-fixable. |

---

### 5.7 A data table

The generic contract every list inherits. Four rules kill the four ways tables usually fail.

1. **The selection bar replaces the header row; it never floats over content.** A floating action bar
   covers the rows you are deciding about.
2. **Bulk actions state their blast radius in the button**: `Move 4 to Next`, never `Apply`.
3. **Every ranked table carries one line saying why it is in that order**, at `--ink-subtle`, above
   the header. A ranked list that does not explain itself is asserting neutrality it does not have.
4. **Sort, filter and page live in the URL** (`&sort=`, `&q=`), functional form only, per
   [FINAL-ia §6.4](../ia/FINAL-ia.md).

| --- | --- |
| --- | --- |
| **Primary gesture** | Click a row: opens it (peel or child, per the row's kind). `Space` selects without opening. The two must never be the same gesture. |
| **Hover** | Row background to `--ink-raised`; row-end actions rise in reserved space; a checkbox appears in the reserved gutter. |
| **Selection** | `{type:"row"}` or `{type:"rows"}`. `Shift`+click ranges, `⌘A` selects the filtered set (never the unfiltered set: that is the classic destructive surprise). |
| **Keyboard** | `n`/`p` row · `Space` select · `⇧n`/`⇧p` extend · `Enter` open · `f` filter · `/` search · `⌘A` select filtered · `Esc` clear |
| **Copyable** | Selected rows as TSV (pastes into a spreadsheet correctly); one cell's value; the filtered view as a link. |
| **Editable** | Cells the domain allows, in place: `Enter` to edit, `⇥` to the next editable cell, `Esc` to revert. Never a row dialog. |
| **Expandable** | A row peels one level (L2's trace: receipt, agent, chain). Deeper than one level promotes to a child page, per [FINAL-ia §6.4](../ia/FINAL-ia.md). |
| **Deep-links** | `?pane=<p>&pview=<v>&item=<id>&q=&sort=`. Copying the address bar reproduces the exact view. |
| **Empty** | Three distinct states, never one: **never had any** (the tile's one-line invitation and the action that fills it), **filtered to nothing** (`No rows match "beta". Clear the filter.`), **all done** (`Nothing waiting. Last cleared Tuesday.`). Conflating these is why empty states read as broken. |
| **Loading** | Skeleton rows at the true count when known, else 5. Column widths fixed before data so nothing reflows. |
| **Asked in context** | `⌘.` sends the selected rows (capped, truncation stated) plus the active filter. Chips: *summarise these · what do they have in common · rank these for me*. |
| **Writes** | The domain's own mutation, always named in the button. Bulk operations are one call, not N. |

---

### 5.8 A graph or lineage view

**The hard part: it must be navigable, not a hairball.** Force-directed layouts are the default and
the default is the tell (craft-law §2). The fix is architectural, not visual: **never render the whole
graph.** `knowledge-graph-view.ts` already computes `ring` (graph distance from focus), `influence`
(degree), bounded `MAX_NODES` / `MAX_DEPTH`, deterministic layout, and a `truncated` flag. The design
uses all of it.

The Map is **two columns**: the chain as sentences on the left, the picture on the right. The left is
readable, linkable, and the thing you screenshot. The right is orientation. This is why
[FINAL-ia §2.6](../ia/FINAL-ia.md) promotes Map to a workbench child: a graph at 420px is a diagram
you cannot read.

Layout: focus node centred, ring 1 in a circle around it, ring 2 as a dimmed outer band, ring 3 not
drawn but counted (`+14 further`). Edge labels are the real relation words already in
`GRAPH_RELATIONS` (`promoted`, `cites`, `derived-from`, `depends-on`, `validates`, `supersedes`,
`contradicts`), drawn on the edge, always. An unlabelled edge is a decoration.

| --- | --- |
| --- | --- |
| **Primary gesture** | Click a node: it becomes the focus, rings recompute, history pushes. Navigation by re-focus, never by pan and zoom. |
| **Hover** | Node and its incident edges to full opacity, everything else to 30%. The node's title and kind appear in reserved space in the corner, never as a cursor-following tooltip. |
| **Selection** | `{ kind:"<node kind>", id }`, locus `{type:"node", nodeKey}` matching `nodeKey()` exactly, so one grammar spans the Map, `?focus=`, and the panes. |
| **Keyboard** | `n`/`p` cycle ring-1 neighbours · `Enter` refocus · `[`/`]` history back/forward along your own path · `1`/`2`/`3` depth (frame-local, mirrors `&depth=`) · `o` open the focused entity's home |
| **Copyable** | The chain as sentences (`Signal SIG-204 → Bet "Digest" → Spec SPEC-52 → shipped 12 Jul`). That is the artifact people actually want out of a graph. |
| **Editable** | No. Edges are derived from `artifact_lineage` and v1 never fabricates one. One human affordance: mark an edge wrong, which writes a flag for review, not a delete. |
| **Expandable** | Depth 1 to 2 to 3. `truncated` renders honestly: `14 more beyond this depth`, with the control that shows them. |
| **Deep-links** | `/$ws/$product/map?focus=spec:SPEC-52&depth=2` ([FINAL-ia §6.1](../ia/FINAL-ia.md)). |
| **Empty** | A node with no edges: `Nothing links to this yet. Links appear when the crew uses it.` A workspace with no graph at all: the first-light invitation, not an empty canvas. |
| **Loading** | The focus node draws first, from data already in hand, then rings settle in with a 150ms stagger on transform and opacity only (craft-law §2 bans width/height/top/left animation). |
| **Asked in context** | `⌘.` on a node sends the node, its ring-1 neighbours and the edge relations. Chips: *how did this happen · what did this cause · what contradicts this*. |
| **Writes** | Nothing. The Map is read-only by design. It becomes genuinely useful only after [FINAL-ia §5.1](../ia/FINAL-ia.md) lands: `GRAPH_NODE_KINDS` is 10 kinds today and stops at the spec, so today the Map cannot draw the back half of the loop at all. |

---

### 5.9 A metric

**The hard part: a number alone is not an artifact.** A metric earns its place only when it carries
the ship that moved it and the assumption it tests. `getOutcomeData` already assembles what happened
against the outcome contract **and states plainly what it cannot measure**, which is the honest
posture and must survive into the UI.

Anatomy, fixed: `value · delta with its window · the deploy markers on the series · the assumption
this was meant to validate · who attested it`. And the copy law from
[FINAL-ia §4.2](../ia/FINAL-ia.md) holds: `record how it landed`, never `we measured how it landed`.

| --- | --- |
| --- | --- |
| **Primary gesture** | Hover the series: a vertical rule tracks the cursor and the header value swaps to that point's value, in place. The number you are reading is always the number under your cursor. |
| **Hover** | A deploy marker shows the release title and its `ReceiptLine`. The number is `PixelStat` blue per the applied rulings; the marker is machine-voice. |
| **Selection** | Drag across the series gives `{type:"window", fromTs, toTs, series}`. This is the highest-value selection in the product: it turns "what happened here" into one keystroke. |
| **Keyboard** | `←`/`→` step through points · `⇧←`/`⇧→` extend the window · `Esc` clear · `o` open the outcome record |
| **Copyable** | The value with its window and unit as a sentence (`Digest opens: 34% over 14 days, up 6 points since 12 Jul`). Never a bare number: a bare number pasted into Slack is how metrics get misquoted. |
| **Editable** | The **target** is editable inline (it is a commitment, and commitments change with a record). The **measurement** is not. |
| **Expandable** | Peels to the outcome contract, the deployment that armed it, and the decision it judges. |
| **Deep-links** | `?stage=learn&focus=outcome:<id>&from=&to=`. |
| **Empty** | Two honest states: **armed but not due** (`Arrives 4 Aug, 14 days after the ship.` with the date), and **not measurable** (`No instrumentation for this. Record how it landed instead.` plus the record door). Never a zero on a chart. |
| **Loading** | The axis, the label and the deploy markers draw from data already known; only the series line is skeletal. The frame is never empty. |
| **Asked in context** | `⌘.` on a window sends the series, the window, the points, and every deploy inside it. Chips: *what happened here · what shipped in this window · did this validate the assumption*. |
| **Writes** | `recordOutcome` (human-attested) · `suggestOutcomeVerdict` (a proposal, judged per §4, never auto-applied) · `resolveAssumptionChallenge`. |

---

### 5.10 An agent run timeline

Distinct from §5.2: the log is one run's steps; the timeline is **many runs across time**, the answer
to "what has the crew been doing". `AgentActivityTimeline.tsx` (108 lines) exists with no real mount
and is homed in the Crew pane by [FINAL-ia §2.7](../ia/FINAL-ia.md).

**The hard part: honest time.** Agent runs are bursty. A linear time axis renders as a wall of
whitespace with three clumps. So the axis is **event-proportional with real gaps stated**: runs pack
tightly and an idle stretch collapses to a labelled break (`4 hours quiet`). Time is respected without
being obeyed.

| --- | --- |
| --- | --- |
| **Primary gesture** | Click a run: peels to its verdict, cost, duration, and the door to its log. |
| **Hover** | The lane's agent name and the run's outcome glyph rise. A run that is still going carries the live caret already in use at `faces.tsx:1681`. |
| **Selection** | `{ kind:"run", id }`. |
| **Keyboard** | `n`/`p` run · `⇧n` next run **by this agent** · `Space` peel · `o` open the trace · `f` filter by agent or outcome |
| **Copyable** | A run summary line: agent, goal, verdict, duration, cost, `trc_*`. |
| **Editable** | No. One forward door on a failed run: `Try again with what we learned`, which re-dispatches the same intent with the failure attached ([FINAL-ia §4.3](../ia/FINAL-ia.md)). |
| **Expandable** | Run to steps (in place); agent lane to that agent's scorecard in the Crew pane. |
| **Deep-links** | `?pane=crew&item=<agentSlug>` for the lane; `/$ws/$product/trace/$id` for the run. |
| **Empty** | `The crew has not run yet. Ask for something and this fills in.` Never an empty axis with tick marks: an empty chart looks broken, empty prose looks new. |
| **Loading** | Lanes and agent names draw first (a known, static set of 13), runs fill in. |
| **Asked in context** | `⌘.` on a run sends goal, agent, verdict, duration, cost, error. Chips: *why did this take so long · what did it change · has it failed like this before*. |
| **Writes** | Nothing from reading. `dispatchStudioSession` from a retry door. |

---

### 5.11 A thread

**The hard part: a conversation is an archive of decisions people cannot get back out.** The fix is
message-level extraction. The highest-value control in a thread is not `Copy`, it is **`Turn into`**:
a paragraph becomes a signal, a task, a spec section, or a decision, with the message recorded as its
source. That is how a chat log stops being sediment.

| --- | --- |
| --- | --- |
| **Primary gesture** | Select text inside a message. The same QuillBar as §5.4 appears, with thread verbs: `Turn into... · Quote · Ask ⌘.`. One selection primitive, two surfaces. |
| **Hover** | Message-end actions rise in reserved space: `Copy · Quote · Turn into... · ⋯`. Reserved, not conjured (L3). |
| **Selection** | `{ kind:"thread", id }`, locus `{type:"text", blockId: messageId, from, to}` or `{type:"message", messageId}`. |
| **Keyboard** | `n`/`p` message · `Space` expand a long message · `⌘.` ask about the selection · `⌘⇧C` copy as a quote block · `t` **not used** (`t` is the Threads rail tile); `Turn into` opens from the hover control or `⌘K` |
| **Copyable** | The message; the selection as a quote block with attribution and a permalink; the whole thread as markdown. |
| **Editable** | Your own last message, within a short window, with an `edited` mark. Machine messages, never. A rewritten record is not a record. |
| **Expandable** | A message expands to its full text; a machine message expands to the run that produced it (`trc_*`); a thread expands to its artifacts. |
| **Deep-links** | `?pane=threads&item=<threadId>#<messageId>`. Message-level anchors. |
| **Empty** | `Nothing said here yet.` plus the composer focused. A thread's empty state is a composer, not a paragraph. |
| **Loading** | Newest-first, with the composer live before history finishes. You can always type. |
| **Asked in context** | `⌘.` sends the selection, its message, the two messages either side, and any artifact the thread references. Chips: *what did we decide · turn this into a spec · what happened after this*. |
| **Writes** | `createConversation` · `renameConversation` · `deleteConversation` (all exist). `Turn into...` calls the target domain's create (`signals.log`, `tasks.create`, `createDecision`) and writes an `artifact_lineage` edge back to the message, so the thread becomes a real source in the chain rather than a dead end. |

---

## 6. The dialog grammar

[FINAL-ia §6.4](../ia/FINAL-ia.md) fixed the shapes: page, pane, tray, overlay, peel, dialog. This
lane adds **inline** and **popover** (both were implicit), formally kills the word **drawer**, and
supplies the deciding rule and the modal whitelist.

### 6.1 The rule that decides, in order

Ask four questions. The first `yes` is the answer.

1. **Can it be edited where it reads?** Then edit it there. **Inline.**
2. **Is it one more level of the row I am already on?** Then push the siblings down. **Peel.**
3. **Is it consulted while working, and does it need a URL?** Then it is a right-edge over-panel.
   **Pane.**
4. **Will someone spend more than a minute on it, or hand it to a person outside this room?**
   Then it is a **page** (a workbench child).

Anything left over is a **popover** if it is a pick with no data fetch, and a **modal** only if it
passes §6.3. Nothing else exists.

### 6.2 The eight shapes

| Shape | Use for | Width / anchor | URL | Escape | Hard limits |
| --- | --- | --- | --- | --- | --- |
| **Inline** | editing a value where it reads | in flow | no | reverts the edit | the default; never asks permission |
| **Peel** | one more level of the row you are on | in flow, pushes siblings | no | collapses | never nests: a second peel promotes to a page |
| **Popover** | a pick, a key legend, an agent card | anchored, ≤ 280px | no | closes | no data fetch, at most one input, never contains a decision |
| **Pane** | reference consulted while working | 420px right over-panel | `?pane=` | closes the pane | everything behind stays live and interactive |
| **Tray** | judgment | ember over-panel | `?gate=` | closes the tray | distinct chrome, because judging is a distinct act |
| **Overlay** | configuration | full-screen scrim | `?config=` | returns exactly | room stays mounted, polling suspended (R7) |
| **Page** | deep work, or handoff | the canvas, room chrome kept | route | back | may own tabs; nothing else may |
| **Modal** | see §6.3 | ≤ 480px, focus-trapped | no | cancels | ≤ 3 fields; never the only home of a capability |

**"Drawer" is deleted from our vocabulary.** It was a fifth word for pane, tray and overlay, which is
how a shape system rots. One concept, one word.

**Two prohibitions carried forward and one added:**
- Anything with its own data fetch is addressable ([FINAL-ia §6.4](../ia/FINAL-ia.md)).
- Maximum depth: room → child → tab → peel. Four levels, hard cap.
- **New:** a popover may never contain a decision. If a user can get it wrong, it needs the room's
  attention, and a popover dismisses on a stray click.

### 6.3 Modals: mostly a failure of nerve, and the six times they are right

A modal stops everything to ask a question. Reach for one and you are usually admitting you could not
design the inline path. But three conditions do exist, and **all three must hold**:

1. **Irreversible or externally visible.** Money moves, a PR merges to main, a member is revoked, a
   document side is discarded, a credential is stored.
2. **The decision needs information not currently on screen.** The list of what dies, the diff of
   what gets discarded, the amount and the recipient.
3. **Undo is physically impossible.** If you can offer undo, offer undo.

Fail any one and it is an inline confirm, or an optimistic action with an undo line.

**The whole product's modal whitelist. Six. Anything else is a defect.**

| Modal | Why all three hold | Must show |
| --- | --- | --- |
| Merge to main | external, irreversible, no undo | the CI gate verdict, the file count, the target branch |
| Delete a product or workspace | irreversible, cascades | the exact counts that will be deleted |
| Revoke a member | external, immediate | who, and what they lose access to |
| Paste an API key | stored credential, cannot be shown again | the scope it grants (`ApiKeyConnectDialog.tsx`, 85 lines, already exists) |
| Grant or deduct credits (admin) | money, irreversible | the delta, the balance after, the target user (currently **no confirm at all**, `clicks-b` finding 25) |
| Resolve a sync conflict | discards one side of a document permanently | **the diff of what will be lost** (currently one click, no diff, no confirm, `clicks-b` finding 26) |

**Everything else that is a modal or a confirm today becomes optimistic plus undo.** Approve, send
back, snooze, archive, rename, reprioritise, move, drop a hunk, resolve a note: all land immediately
with a 6-second undo line in the WorkingStrip. This is not laxity. A confirm dialog protects the
product from the user; an undo protects the user. We are building for the second one.

**The corollary that makes it safe:** an optimistic action must show its own reversal. The undo line
names what happened in the past tense and offers the exact inverse: `Sent back to Engineer. Undo.`

---

## 7. The keyboard reservation

Two axes exist globally ([FINAL-ia §2.2](../ia/FINAL-ia.md)) and this lane must not collide with
them. The reservation is the contract.

| Band | Keys | Owner | Live when |
| --- | --- | --- | --- |
| **Spine** | `1`-`7` | the seven stages | shell focus |
| **Rail** | `g k r m t c e` | the seven depth tiles | shell focus |
| **Global** | `⌘K` palette · `⌘J` composer · `⌘.` ask about selection · `⌘Z` undo · `Esc` up one layer | the shell | always |
| **Artifact-local** | `n p y x o f v Space Enter [ ] \ / ← ↑ → ↓` and `⇧`-variants | the focused artifact | **only while that artifact holds focus**, and its legend is visible in its footer |

**The collision rule, stated once so it cannot drift:** artifact-local bindings draw **only** from the
band above, which is disjoint from `g k r m t c e` and `1`-`7` by construction. This is why keep and
drop are `y` and `x` rather than the more obvious `a` and `d` or `y` and `n`: `n` is next, and the
rail owns the letters that would otherwise be natural. Where a frame genuinely needs digits (prototype
modes, graph depth), they are frame-local and the frame states them in its legend, and the Spine
remains reachable by clicking a stage, which is the one-click path anyway.

**Fixes a real live bug:** `clicks-b` finding 1 records that on Today, `a` both approves the featured
call and navigates to `/admin`, because two `window` listeners fire and `preventDefault` does not stop
a sibling. The focus-scoped band removes the class of bug, not just the instance: `GotoShortcuts`
binds at the shell and stands down whenever an artifact frame holds focus.

---

## 8. Density: what fits on one screen

The founder's other sentence: *"too much scroll we need to avoid: what can the user see within a
particular screen."*

**The structural law: the artifact owns its scroll, the page never scrolls.** The room is already a
fixed-height composition (TopBar, Spine, Thread, Canvas, WorkingStrip, Composer, rail). No canvas face
may add page scroll. Overflow is always inside a named container with `overflow-y:auto` and a visible
edge, so you can always see that there is more and where it ends.

**Every artifact declares a first-screen contract**: what is visible at 1440x900 with the Thread open
and no pane, before any gesture.

| Artifact | Visible without scrolling | One gesture away |
| --- | --- | --- |
| Code diff | verdict bar, count tally, up to 8 file rows, first file's first 2 hunks | remaining files (`[`/`]`), full context (`Space`) |
| Run log | header (steps, errors, duration, cost), last 12 steps, every error expanded | older steps (scroll the ledger), raw (`\`) |
| Prototype | full device frame, mode row, states row, up to 5 notes in the rail | full screen (`o`), remaining notes |
| Spec | title, section index, the current section, `Saved` line | any section (index click), suggestions inline |
| Decision | the call, the decider, the date, the one-line reason, forward doors | alternatives and evidence (`Space`) |
| Roadmap | three buckets, up to 6 cards each, the governance line | overflow per column, history (`⇧R`) |
| Table | 12 rows, the order line, the filter row | more rows, filters (`f`) |
| Graph | focus, all of ring 1, ring 2 dimmed, the chain sentences | ring 3 (`3`), refocus (`Enter`) |
| Metric | value, delta, series, deploy markers, the assumption | the outcome record (`o`) |
| Timeline | 13 agent lanes, the last 24 hours packed | older (scroll), one run (`Space`) |
| Thread | the last 4 exchanges, the composer | older messages, message actions (hover) |

**Density varies with importance** (craft-law §3). The verdict bar is the loosest region on any
artifact; lists are the tightest. Uniform density is a template, and a template is what "okay but not
great" looks like.

---

## 9. Loading and empty, as a system

Three rules, applied identically everywhere, because inconsistency here is what makes a product feel
assembled rather than built.

**Loading.** Never a centred spinner. Draw everything already known (chrome, axes, column headers,
agent names, file paths, device frame), then skeleton **only** the unknown region, at the true count
where the count is known and 5 where it is not. A skeleton that shows the wrong number of rows and
then reflows is worse than no skeleton, because it moves the thing you were about to click.

**Empty.** Three different states, never conflated (§5.7): never-had-any, filtered-to-nothing,
all-done. Each carries one sentence and one door. The zero-count law from
[FINAL-ia §2.2](../ia/FINAL-ia.md) applies to artifacts too: silence is the enemy, not emptiness.

**Error.** The frame keeps its chrome, states the real message, and offers a retry. The nine
mutations that currently render errors as **green success toasts carrying the error string**
(`clicks-b` finding 2, `today.tsx` and `approvals.tsx`, `toast.success(e.message)` where `toast.error`
exists) are the sharpest example of why this needs to be a system and not nine judgements.

---

## 10. What gets built

### 10.1 New client primitives

| Component | Job |
| --- | --- |
| `SelectionProvider` / `useSelection()` | §3. The bus. Mounted once, beside the Escape-stack owner. |
| `formatSelection(ref)` | §3. The one context formatter feeding the existing composer path. |
| `AskAnchor` | the `⌘.` affordance on any selection. The only floating element in the design. |
| `ArtifactFrame` | L2. Title, verdict slot, own-scroll body, `ReceiptLine`, `ChainStrip`, `NextLine`. |
| `ProposalBar` | §4. Claim, count, commit, send-back. Six surfaces share it. |
| `Judgeable` | §4. The keep/drop atom with `y`/`x` and the tally. |
| `HunkList` + `DiffFile` (rewrite) | §5.1. Replaces `ChangesPanel`'s curation block **and** deletes `faces.tsx:1705-1875`. One diff, one hunk engine (`studio-hunks.ts`). |
| `StepLedger` | §5.2. Replaces `BuildTerminal`'s `<pre>` with `LoopStep[]` rendered as structure. |
| `LiveFrame` + `instrumentScaffold()` | §5.3. The instrumented iframe and the `sp:*` protocol, with `event.source` validation (C4). |
| `PinLayer` | §5.3. Comment pins over `LiveFrame`, backed by `prototype_messages`. |
| `QuillBar` + `SuggestionOverlay` | §5.4, §5.11. Selection-scoped assist, results as judgeable overlays. |
| `RingMap` | §5.8. Focus plus rings plus labelled edges. No force layout. |
| `SeriesStrip` | §5.9. Value, delta, deploy markers, window selection. |
| `UndoLine` | §6.3. The 6-second inverse in the WorkingStrip. One implementation. |

### 10.2 New server functions (small, and mostly over existing tables)

| Function | Table | Migration |
| --- | --- | --- |
| `applyPrototypeTextEdit({ prototypeId, selector, before, after })` | `prototype_files` / `prd_scaffolds` | none |
| `reviseScaffoldElement({ prototypeId, selector, instruction })` | same, `surface:"prd"` reused | none |
| `listPrototypeNotes` / `addPrototypeNote` / `resolvePrototypeNote` | `prototype_messages` | **none** (C3) |
| `applyPrototypeNotes({ prototypeId, noteIds })` | batched revision | none |
| `flagLineageEdge({ edgeId, reason })` | `artifact_lineage` | one nullable column |

### 10.3 Existing backends that finally get a surface

`applyStagedHunkSelection` (re-framed two-way) · `rejectStagedFile` · `enforceTouchList` ·
`getChangesetRevisions` · `revertToRevision` · `setChangesetConstraints` · `steerStudioSession` ·
`bulkUpdateRoadmapItems` · `getRoadmapHistory` · `resolveAssumptionChallenge` ·
`suggestOutcomeVerdict` · **`recordGateSignal`** (written, called from nowhere, and §4's dissent rule
is the cheapest thing that makes the Brain compound).

### 10.4 What gets deleted

`faces.tsx:1705-1875` (`lineDiff`, `DiffFile`, `DiffPanel`: the second diff) · `faces.tsx:1647-1688`
(`BuildTerminal`'s `<pre>`) · the hardcoded fake URL at `faces.tsx:1267` · `ChangesPanel`'s
reject-only framing (the panel's other duties survive) · the word "drawer" · every modal outside the
§6.3 whitelist.

### 10.5 Order

1. `SelectionProvider` + `formatSelection` + `AskAnchor` + `ArtifactFrame`. Nothing else can land
   first, and everything else is cheaper after.
2. `ProposalBar` + `Judgeable` + the diff rewrite (§5.1). Proves the grammar on the hardest case.
3. `LiveFrame` + `instrumentScaffold` + text edit (§5.3). The founder's headline, and the demo.
4. `StepLedger` (§5.2) and `QuillBar` (§5.4). Both are mostly deletion of worse code.
5. Notes and batched revision (§5.3), the table and roadmap contracts (§5.6, §5.7).
6. `RingMap` (§5.8). Gated on [FINAL-ia §5.1](../ia/FINAL-ia.md)'s lineage work, honestly: today the
   graph stops at the spec, and a beautiful map of half a loop is worse than no map.

---

## 11. Handoff

**To the IA lane.** Three additive requests, none breaking: `&file=` and `&hunk=` on the mission
child (§5.1); `&note=` on the prototype child (§5.3); block anchors `#<blockId>` on the spec child
(§5.4). Selection itself is deliberately **not** in the URL (§3) and I am holding that line: `?focus=`
is what is open, selection is what is pointed at, and a pasted link should reproduce the screen, not
someone else's cursor. Confirmed adopted from your side: the shape law (§6.4), the depth cap, the
functional-form navigate, and the Escape stack, which §3 now depends on having exactly one owner.

**To the language lane.** Nine strings are load-bearing here and I have written them to be replaced
by your ruling, not defended: `Commit N hunks` · `Send back with a note` · `why not?` · `Apply all N
notes` · `Put it back` · `Try again with what we learned` · `record how it landed` (never "measured",
per [FINAL-ia §4.2](../ia/FINAL-ia.md)) · `Turn into...` · `Undo`. Two are non-negotiable regardless of
wording: a commit button must name its blast radius, and an undo line must be past tense.

**To whoever builds the shell.** `SelectionProvider` and the Escape-stack owner are the same
architectural seam. Build them together or the second one will fight the first.

---

## 12. What I would say to the board

Every tool in this category shows you what an agent did. You read a wall of output, and if you
disagree, you type a paragraph into a box somewhere else and hope.

We built the other half. You point at the hunk and keep it or drop it, and the reason you dropped it
teaches the system. You point at the button in the mockup and say move it right, and only that button
changes. You double-click the headline and just type. You drag across two weeks of a metric and ask
what happened there. Every one of those gestures leaves a receipt with an agent's name on it, and
every receipt is a door to the thing before it and the thing after it.

It is one mechanism, eleven times: **what you are pointing at is what you are talking about.** That
is why it feels like one product instead of eleven screens, and it is why the judgment we capture
compounds instead of evaporating into a chat log.

The engine was already there. What was missing was a way to reach into it.
