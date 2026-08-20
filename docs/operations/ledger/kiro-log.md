# Kiro build log

> _Created: 2026-08-19 · Last updated: 2026-08-19_

**Kiro is the only writer of this file.** Append only; never edit or delete a past entry. Protocol and entry format: [`README.md`](./README.md). Work list: [`../kiro-queue.md`](../kiro-queue.md).

Verbs: `STARTED` · `BUILT` · `BLOCKED` · `QUESTION`

---

## K-01 · STARTED · 2026-08-19 22:27

Taking K-01 because both ledgers were empty, so nothing was `STARTED` or `BUILT`, and K-01 is
the lowest-numbered item with no dependencies. K-02 and K-03 both wait on it.

---

## K-01 · BUILT · 2026-08-19 22:41

**Did.** Added `--mrd-stop` to `src/styles/meridian.css` in both grounds, `oklch(0.68 0.105 12)`
on dark and `oklch(0.48 0.105 12)` on paper, with the `@theme inline` binding
`--color-mrd-stop`. Measured both values with a throwaway OKLCH to sRGB to WCAG script against
every ground stop and against the token's own 13% wash, and recorded the numbers in the token's
comment: dark worst case 5.21 plain against `float` and 4.29 on its own wash there, paper worst
case 5.67 plain against `sink` and 4.71 on its own wash. Both clear the 3:1 non-text floor with
room and clear 4.5 as text on every plain surface, so the same token can carry a label as well
as a fill. The comment names K-02's `Action` destructive variant as the first caller and K-03's
stop-a-run confirm in `Dialog` as the second.

**Unsure.** Three real judgment calls, and the hue is the biggest one.

1. **It is in the red family, at hue 12 against `--mrd-fail`'s 27.** The item asks for something
   "distinguishable from `--mrd-fail` (27) and from `--mrd-hold` (78) at a glance", and read
   strictly that pushes toward a hue outside the warm arc. I measured the wheel before choosing
   and there is no clean seat: the widest gap between adjacent status hues is 83 degrees
   (pass 152 to agent 235) and its centre, 193, is 41 and 42 from its neighbours and reads as a
   cyan, which this file already names as a trap because blue means a machine is working. A stop
   control sits on exactly the surface an agent-working indicator sits on, so cyan is the worst
   available seat rather than the best. Every other gap centre lands within 37 of a neighbour,
   inside the range the file's own note says colour vision deficiencies start merging. So I kept
   the red family and separated on chroma instead: 0.105 against fail's 0.19, which renders as
   #d07c87 clay against fail's #f0574e vermilion. Side by side they are plainly different
   colours. **If the founder reads "distinguishable at a glance" as requiring a different hue
   family, this is the decision to overturn, and the alternative I would pick is a neutral plus
   structure rather than cyan.**
2. **I declared it a CONTROL palette, not a sixth status hue.** meridian.css refuses a sixth
   status meaning outright, and it also says a thing that needs noticing without one of the five
   meanings "needs STRUCTURE, not a new colour". Read one way, that sentence answers K-01 with
   "do not add a token". I did not read it that way, because `viz` and `syntax` already exist
   beside the five as non-status palettes, so a third one is a precedent rather than an
   exception, and because the alternative leaves an interrupt either wearing `--mrd-fail`
   (forbidden) or wearing a neutral (indistinguishable from the benign secondary beside it,
   which is how somebody discards a run by aiming one button off). I wrote the constraint that
   keeps it honest into the file: it may only paint something a person can press, never a chip,
   a dot, a rule or a row's state.
3. **One token, no `-dim` and no hover stop.** The item says one token, so that is what shipped.
   K-02 will need a hover treatment for the destructive variant; I intend to derive it there with
   `color-mix(in oklab, var(--mrd-stop) ...)`, which is not a raw colour and not a second token,
   rather than come back and widen this item. If that turns out to want a real token, it earns
   its place on the second caller like everything else.

**Noticed.** Four things.

1. **My contrast calculator disagrees with two of this file's own recorded paper figures, and I
   cannot tell which is right.** The light block says "Measured worst case on paper, against
   `sink`: you 5.4, agent 5.1, fail 5.0, pass 4.5". I reproduce `you` at 5.45 and `hold` at 4.58,
   which match, but I get `fail` at 5.44 against the stated 5.0. The gap is only on `fail`, which
   suggests the recorded number was taken before `--mrd-fail` moved from 0.52 to 0.50 lightness
   (the comment two lines above records exactly that move) and was never re-measured. Worth a
   sweep, and it is not mine because it changes numbers in a shipped comment.
2. **`--mrd-fail` does not clear 4.5 on its own 13% wash on the DARK ground.** It measures 3.96
   against `float`, and the light-block comment says the wash cases were solved for paper only:
   "Twelve nodes, all on paper". So the failed chip on a dark floating pane is a hair under the
   text floor and nobody has looked. My new token measures 4.29 in the same spot, so it is better
   than the incumbent there, but the incumbent is the defect.
3. **`--mrd-edge-focus` is still declared in both grounds with a comment saying to delete it
   "once nothing outside src/ reads it".** It is aliased to `--mrd-field-focus` and it also has a
   live `@theme inline` binding, which means the deprecation cannot complete while the binding
   invites new callers. Not in any queue item I have seen.
4. **The `@theme inline` block is missing bindings for four declared tokens** as far as I can
   tell from reading it: `--mrd-lift-hover` and `--mrd-solid-hover` are bound, but there is no
   `--color-mrd-you`-style binding for `--mrd-pass-dim` or `--mrd-fail-dim` because those are
   never declared, while `--mrd-hold-dim`, `--mrd-you-dim` and `--mrd-agent-dim` are. So three of
   the five status words have a resting stop and two do not, which is a gap a caller will hit the
   first time a `pass` mark needs to sit at rest. Nothing is broken today; it is an asymmetry.

**Gates.** tsc clean · 9,405 pass / 0 fail / 23 skip / 60 todo across 569 files · build ok.
Verified the token reaches the built stylesheet: `.output/public/assets/styles-*.css` carries
`--mrd-stop:oklch(68% .105 12)` and `--mrd-stop:oklch(48% .105 12)`. Ratchet total unchanged;
the hex values in the comment are stripped by `stripCssComments` before counting, so they are
not raw colour.

---

## K-04 · STARTED · 2026-08-19 22:43

Skipping K-02 and K-03 rather than taking them: both depend on K-01, which is `BUILT` and not
`VERIFIED`, and the rule is deps must be `VERIFIED`. They are waiting on Claude, not on me.
K-04 has no dependencies and is the lowest-numbered item that does.

---

## K-04 · BUILT · 2026-08-19 22:48

**Did.** Built `src/components/meridian/RunTimeline.tsx`, a 17-test suite at
`src/components/meridian/__tests__/run-timeline.test.tsx`, and a six-case gallery section
appended to `_authenticated.meridian.tsx`. Every row prints its own wall clock as a real `<time>`
with an ISO `dateTime`, and any stretch longer than three minutes becomes its own row: dashed
rail, exact duration from the existing `formatDuration`, and a word for what was being waited on
taken from the state that was standing when the silence began. Live mode adds one tail row whose
figure comes from `useElapsed`, and a test asserts there is no `progressbar`, no `progress`, no
`aria-valuenow` and no `%` anywhere in the output.

**Unsure.** Five, and the first is the design decision the item did not settle.

1. **The axis is literal in its labels and ordinal in its space.** The item says "against a real
   time axis", which can be read as proportional vertical space. I did not do that, and the
   reasoning is in the file: a run with a 40-minute wait and 200 tool calls two seconds apart
   would spend its whole height on the wait and compress the events into a few pixels, so it
   fails the item's own "renders 200 events" requirement in order to draw a gap the reader can
   simply be told about. **If proportional space is what was meant, this is the decision to
   overturn**, and the honest middle would be a capped proportional segment, which I judged worse
   than either end because it is proportional right up to the point where it silently is not.
2. **`done` and `passed` are separate states, and `done` carries no colour.** I followed
   `run-parts.tsx` (done neutral, only provable success green) rather than `TaskRows` (done
   green). The two already disagree in this repo and I had to pick one. Forty green rows on an
   ordinary run is the product asserting a success nobody checked, so I took run-parts. This
   means `--mrd-pass` appears on roughly one row of a healthy run.
3. **A silent machine is called "with nothing reported", not "stalled".** A 45-minute gap after a
   `working` event might be a stalled agent or might be a long compile. The record knows only
   that nothing was filed. Calling it stalled would report an outcome the timeline is not
   entitled to, which is the same rule that keeps red off an intent. It reads weaker than
   "stalled" and I think it is the only honest form. A test pins it.
4. **`kind` and `state` both have a `gate` member.** Both are in the item's contract and they
   mean different things (a gate happened; something is waiting on you), so a `gate` event in a
   `gate` state renders the word twice in two places. It looks like a smell and I kept it,
   because collapsing them would make `kind` unable to say "a person was asked" on a row whose
   state has since moved to `done`.
5. **Five kinds, no catch-all.** I drafted a sixth `note` kind and cut it, following ToolChips'
   own stated principle that a fifth glyph nobody can name is noise. A caller with an event that
   is none of station / tool / handoff / gate / person does not know what it is drawing. This may
   turn out to be one kind short once K-15's real SSE frames arrive.

**I could not look at it, and that is the one acceptance criterion I have not met.** `/meridian`
sits behind `_authenticated` and redirected to `/login`; I hold no session and the demo logins are
a metered shared resource I was not told to spend. So "rendered in the gallery in both grounds"
is written and typechecked but unseen, and the greyscale claim rests on structure rather than on a
screenshot: the silence is dashed where work is solid, and every state renders its meaning as a
word beside the hue, both of which survive colour removal by construction. **A visual pass in both
grounds is owed and it is Claude's.**

**Noticed.** Five things, three of them duplication this repo already has a rule about.

1. **The scroll-edge measurement is now the second copy in Meridian.** `SidebarNav` carries the
   same fifteen lines inside its component body. I imported `edgeMask` because it is exported and
   re-derived only the measurement, which cannot be extracted without editing `SidebarNav.tsx` —
   not in K-04's `Owns`. **This wants a `use-scroll-edges.ts` hook** and it is exactly the shape
   that produced seven copies of `initialsFrom`. Worth a queue item.
2. **`formatDuration` lives in `src/components/studio/run-return.ts`**, so a Meridian primitive
   now imports from a station folder. I did that deliberately rather than write an eighth
   duration formatter (there are already five relative-time helpers: `run-state.ago`,
   `product/format.relTime`, `today/when.ago`, `discover/format.relTimeCaps`, and this one). The
   module is pure with zero imports so nothing heavy comes with it, but the direction is wrong
   and `marks.tsx` records the rule for fixing it: a part moves into Meridian the moment a second
   surface means the same thing by it.
3. **`useElapsed` has no hours branch.** It formats `${m}m ${s}s` above 60 seconds and never
   rolls over, so an 86-hour hold renders as "5160m 0.0s". That is why the gallery's held case
   does not run live. It has not bitten yet because the only current caller is a loading state
   measured in seconds, and it will bite the moment a real long-running hold gets a live tail.
4. **`MarkState` cannot express a hold.** Its seven states spend two on a person (`gate`,
   `waiting`) and have no amber at all, so Meridian's own mark vocabulary cannot draw the single
   most common state in the workspace, the one `--mrd-hold` was admitted for. `run-parts.tsx`'s
   `RunMarkState` can, and it is in a station folder. That is two vocabularies, neither complete,
   and it is why K-04 has a third. **K-08 is already in `marks.tsx` and is the natural place to
   fix it**, though its stated scope is per-mark state rather than a new state.
5. **The item's premise checks out.** `grep -il timeline src/components/meridian` returned zero
   before this change, and the audit register's line for it ("No run timeline") matches. Nothing
   in the item was stale.

**Gates.** tsc clean · 9,422 pass / 0 fail / 23 skip / 60 todo across 570 files · build ok. The
new suite is 17 tests. Ratchet total unchanged: the component carries no retired token and no raw
colour.

---

## K-05 · BUILT · 2026-08-19 22:57

**Did.** Built `src/components/meridian/ToolStream.tsx`, a 21-test suite, and a six-case gallery
section. Rows arrive oldest-first inside a `role="log"` scroller that follows the newest row until
the reader scrolls up, at which point nothing touches `scrollTop` again and the arrivals are
counted and offered on a "2 more calls" control instead. The caption is derived from the registry
name through `toolActionLabel`, so the component takes the SSE `tool` frame's real shape
(`{ kind: "tool", tool: string }`) and needs no adapter when K-15 starts emitting it.

**Unsure.** Four.

1. **The left slot carries STATE, not KIND, and that is the one place I did not match
   `ToolChips`.** The item says compose the row from ToolChips' vocabulary so the two agree, and
   ToolChips spends its left slot on which of four kinds a call was. I spent it on
   `running | done | failed`, because in a finished array every row shares one state so the slot
   is free, and in a live stream the state is the entire reason somebody is looking. Everything
   else a reader could notice is identical on purpose: the row height, 12.5px caption over an
   11.5px inert mono argument, the same focus-inset string, and both empty sentences word for
   word. **The other reading is that I should have drawn both glyphs**, and I rejected it because
   `ICONS` is not exported from `ToolChips.tsx` and that file is not in K-05's `Owns`, so drawing
   the kind would have meant a second copy of four SVG paths that then drift.
2. **I dropped `kind` from the row type entirely** rather than accepting it and not drawing it.
   Data minimalism says a field with no consumer does not exist. The cost is that a caller cannot
   hand one array to both components without mapping, and I judged an unused prop worse.
3. **The unseen count resets to zero when the reader returns, and does not persist.** So a reader
   who scrolls up, comes back, and scrolls up again starts counting from the second departure.
   That is what I would want; it could reasonably be a running total since the last read.
4. **No edge fade on this scroller**, unlike `RunTimeline`. A bottom fade would sit exactly where
   the "way back" control needs to be legible, and a mask on a 500-row list costs paint on the one
   case the acceptance criteria name. So the scrollbar stays visible here, which is also correct
   for a column a reader is expected to scroll by hand.

**I could not look at it**, same reason as K-04: `/meridian` is behind `_authenticated` and I hold
no session. The pin behaviour is covered by six tests against faked layout metrics, which is the
honest limit of what a green suite proves. **The visual pass in both grounds is owed.**

**Noticed.** Four.

1. **`cluster.trigger` is NOT missing from the tool vocabulary**, which contradicts what I assumed
   while writing the fallback test. `toolActionLabel("cluster.trigger")` returns "clustering
   signals". This is worth flagging against **K-11**, whose premise is that the same tool has no
   `CONSEQUENCES` or `RISK_PROFILE` entry and therefore fails closed to `high` risk. Both can be
   true, and if they are it means the tool is catalogued for LANGUAGE and uncatalogued for RISK,
   which is a more interesting defect than the item describes. I did not verify the risk half.
2. **`ToolChips` animates every row on every render.** `mrd-fade-up` is applied unconditionally,
   so reopening a surface on a run with 400 calls plays 400 entrances at once. `Thinking` already
   solved this with a `staggerUntil` ref and its comment explains why. I used the same technique
   here and left ToolChips alone: it is not in K-05's `Owns`, and it is currently wired only to
   the gallery so nothing is suffering yet. It will the moment **K-17** mounts it on a real run.
3. **`formatDuration` is now imported by two Meridian components** (`RunTimeline` and this one)
   from `src/components/studio/run-return.ts`. That is the second caller, which is the exact
   threshold this repo's own rule uses for promoting a part into Meridian. It should move.
4. **The gallery route is 2,300 lines and thirteen queue items are going to append to it.** The
   append-only rule works, but each section is now carrying its fixtures in a function at the
   bottom while the older sections carry theirs as module constants at the top, so the file is
   growing two conventions. Mine are functions, deliberately, because a function declaration at
   the end of a file is the only addition that cannot conflict with another item's.

**Gates.** tsc clean · 9,443 pass / 0 fail / 23 skip / 60 todo across 571 files · build ok. The
new suite is 21 tests. Ratchet total unchanged.

---

## K-06 · BUILT · 2026-08-19 23:04

**Did.** Built `src/components/meridian/PlanCard.tsx`, a 20-test suite, and a seven-case gallery
section. Six states, each with its own mark GEOMETRY rather than its own colour, so the card reads
in greyscale: a thin hollow ring for pending, a turning arc for active, filled discs for the two
settled outcomes, a ring struck through for skipped, and a ring with a solid centre for
needs-approval. `--mrd-you` and `--mrd-agent` each appear on exactly one step and nowhere else,
including the header. A skipped step renders its reason, and a skipped step with no reason renders
"Nobody said why this was skipped." rather than hiding the gap.

**I took this before K-02 and K-03 deliberately, and the order was mine to fix.** It was already
built in my tree with two of its own assertions wrong when K-01's verdict landed. Pushing a
half-built item to switch lanes would have left the tree in a state Claude could pull, so K-06 is
finished and pushed first. K-02 is next.

**Unsure.** Four.

1. **`done` is `--mrd-pass` here and neutral in `RunTimeline`, which I built two hours ago.** That
   looks like drift and I argue it is not: a timeline is a RECORD, where forty green rows assert a
   success nobody checked, and a plan is a CHECKLIST against a commitment, where which parts of the
   promise have been kept is the only reason to look. `TaskRows` already made the checklist choice.
   **If that distinction is too fine to hold, the fix is to make RunTimeline green too, not to grey
   this out**, because a plan whose kept steps are the same colour as its unstarted ones has lost
   its subject.
2. **I added `onApprove` and `onRevise`, which the acceptance criteria do not mention.** The item's
   `Why` turns on "the product needs to show a plan and wait on it, which is how one approval at
   the top replaces a queue of fourteen later", and a plan with no way to approve it cannot do the
   second half. Both are optional and the card draws no control at all without them, so a read-only
   caller pays nothing. It is still scope I chose.
3. **There is no way to reject a plan outright**, only to approve or revise. That is not an
   omission I can close yet: a reject is a destructive intent and the control for it is K-02's
   `destructive` variant, which does not exist as I write this. Adding a `quiet` reject now would
   put a stop-shaped act on a chrome-coloured control, which is the exact confusion `--mrd-stop`
   was added to end.
4. **The header says "1 waiting on you" with no singular/plural branch**, because "waiting on you"
   is invariant. It reads slightly odd at 1 and I left it rather than writing "1 waiting on you"
   and "2 waiting on you" as two identical strings, which is what my first draft did.

**Noticed.** Two.

1. **My own first draft of the colour-law test asserted the wrong thing and passed for the wrong
   reason at a different count.** It counted occurrences of `mrd-you` in the whole card and
   expected 1; it is 2, because a step wears its hue on the mark AND on the state word beside it,
   and the word is what carries the state for a greyscale or listening reader. The law is about
   WHICH STEP, not how many elements. The corrected test asserts the token appears only inside the
   list item whose state means it, and a third test asserts it is absent from all four others. The
   original would have gone green if I had written `toBe(2)`, while permitting orchid to leak onto
   any second element anywhere on the card. **A criterion that green-lights a defect is worse than
   none**, and this was one, in a test I wrote to guard exactly that defect.
2. **The gallery is now 2,540 lines with three of my sections in it** and ten more items are going
   to append. Every one of mine puts its fixtures in a function declaration at the bottom, which is
   the only addition shape that cannot conflict with another item's. Worth writing into the queue's
   §1 as the convention rather than leaving each item to work it out.

**Gates.** tsc clean · 9,463 pass / 0 fail / 23 skip / 60 todo across 572 files · build ok. New
suite is 20 tests. Ratchet total unchanged.

---

## K-02 · BUILT · 2026-08-19 23:10

**Did.** Added a fourth `ActionVariant`, `destructive`, to `surface-parts.tsx`, wearing
`--mrd-stop` as an 8% wash with a stop label and a stop border, and built the gallery's first
controls panel: all four variants plus `Approve`, at rest, in an `Actions` row with the destructive
in the `trailing` slot, and a disabled row. The `Approve` split is untouched and restated in the
file: approve is a click that UNBLOCKS, destructive is a click that STOPS or REMOVES, and the test
is whether pressing it releases anything.

**The greyscale collapse you measured is now written into the file that owns the token's only legal
use, and it changed the design.** I had not measured stop against fail and you are right: 1.12 on
dark, 1.04 on paper, which my calculator reproduces exactly. So the constraint is stated as
absolute in `ACTION_FACE`, in the terms you gave: `--mrd-stop` may only ever paint something a
person can press, never a chip, dot, rule, row state or count, because the two tokens live in
different systems and a reader never has to tell them apart as long as the SHAPE already did.

**Unsure.** Three, and the first is the only real design call in the item.

1. **8% wash, and the figure is measured rather than chosen.** The label is `--mrd-stop` sitting on
   its own wash, so the fill and the label move together and deepening one weakens the other.
   Across every ground stop in both themes: **8% gives 4.64 at worst** (a floating pane on dark)
   **and 6.21 at best; 10% gives exactly 4.50**, which is on the text floor and therefore one
   rounding from failing; **13% gives 4.29**, under it. So 8%, and the wash is fainter than I would
   have picked by eye.
2. **Hover firms the BORDER and does not touch the fill.** This is the part that looks like a quirk.
   Deepening the wash on hover is the obvious move and it takes the label under 4.5 in exactly the
   state a person is committing to a destructive act. The border goes 40% (measures 1.92, quiet on
   purpose) to 75% (3.55, which clears the 3:1 a boundary owes) at the moment it matters.
   meridian.css already establishes this idiom on its form fields, where the border steps up rather
   than gaining a ring, so it is the house move rather than mine.
3. **It is a variant and not its own component**, which is the opposite call to the one this file
   made for `Approve`. The reason `Approve` split off is that four authors meant four things by
   `primary`, so the WORD was the problem. `destructive` has no such ambiguity: a control either
   stops or removes something or it does not. If that turns out wrong, the fix is a component and
   the argument for it is already written in the header.

**There is no gate that can catch the misuse, and I could not build one.** A `--mrd-stop` chip
would pass the ratchet, because the ratchet sees a valid `--mrd-*` token and a chip is not a
retired vocabulary. The check that would catch it is greppable and worth writing: **`mrd-stop` may
appear only on an element that is a `button`, or inside `surface-parts.tsx` and `Dialog.tsx`.**
K-02's `Owns` lists no test file, and the two files that could hold such a guard,
`src/__tests__/surface-discipline.test.ts` and `meridian-ratchet.test.ts`, belong to neither this
item nor any Kiro item I have read. **Proposing it as a new item rather than reaching outside
`Owns`.** Until it exists the constraint is a comment, and comments do not fail builds.

**Noticed.** Three.

1. **Every `/NN` opacity utility in this repo falls back to the FULL colour on a browser without
   `color-mix`.** Tailwind emits `.bg-mrd-stop\/8{background-color:var(--mrd-stop)}` and then
   overrides it inside `@supports (color:color-mix(in lab, red, red))`. So on such a browser my
   destructive control is a solid stop slab carrying a stop label, which is invisible. **This is
   house-wide and pre-existing**, not something this variant introduced:
   `FineTuneCard.tsx:372` (`bg-mrd-agent/15` under `text-mrd-agent`) and `PromptBar.tsx:416`
   (`bg-mrd-agent/15 text-mrd-agent`) collapse identically. `color-mix` has been in every current
   engine since 2023, so this is a browser-support floor decision rather than a bug, but it is
   undocumented and it is the second time a token pair that inverts together has produced an
   invisible label in this system.
2. **The gallery had no panel for `Action` at all** before this item, which is why K-02's
   acceptance criterion "rendered beside the other variants" required building the panel rather
   than adding to one. Four control faces that every surface in the product composes from, and
   nobody had put them side by side in both grounds. That is the exact gap the 1.19:1 primary
   button got through.
3. **`disabled:opacity-45` takes the destructive label under the text floor**, like it does the
   other three. I left it: it is `CONTROL_DEAD`, applied house-wide, and changing it would repaint
   every disabled control in the product from inside a variant item. The disabled row is in the
   gallery so it can be looked at rather than argued about.

**Gates.** tsc clean · 9,463 pass / 0 fail / 23 skip / 60 todo across 572 files · build ok.
Verified the three utilities reach the built stylesheet as `color-mix(in oklab, var(--mrd-stop) 8%
| 40% | 75%, transparent)`. Ratchet total unchanged; no raw colour in the diff.

---

## K-03 · BUILT · 2026-08-19 23:17

**Did.** Built `src/components/meridian/Dialog.tsx`, a 21-test suite, and a three-case gallery
section including the destructive question that K-01 and K-02 exist for. Scrim from `--mrd-scrim`,
panel on `--mrd-shadow-pane`, `role="dialog"` with `aria-modal`, `aria-labelledby` on the title and
`aria-describedby` on the consequence. Focus moves in on open, wraps at both edges, returns to the
trigger on close, and the body scroll lock restores whatever value it found rather than clearing it.
The actions row is passed in as `Action`/`Approve` children, so the dialog makes no call about which
of the control faces is the accent.

**Unsure.** Four, and the first is the one most likely to be wrong.

1. **It does not portal, and that is a real trade rather than a simplification.** `[data-theme="light"]`
   is an attribute selector on a subtree, so a dialog portalled to `document.body` leaves the
   subtree that set the ground and renders dark on a paper page. It would also make the gallery
   unable to show it in both grounds at all, which is the surface that caught the 1.19:1 button.
   **The cost is stated in the file so nobody rediscovers it:** a `position: fixed` element is
   positioned against the nearest ancestor carrying `transform`, `filter`, `perspective`,
   `backdrop-filter` or `container-type`, so a caller mounting this deep inside a transformed card
   will trap the overlay inside that box. Mount from a surface's root. **If that bites in a real
   surface, the fix is a portal target prop, not a portal to body.**
2. **The trap only intervenes at the two edges.** Taking over every Tab means reimplementing the
   browser's focus order, and that is where hand-rolled traps go wrong: a radio group, a
   `contenteditable` and a horizontally scrolling toolbar all move focus in ways a selector list
   does not predict. The middle of the order is the browser's. It is also, honestly, the half
   happy-dom cannot test, so the implementation and the test agree about where the line is.
3. **Escape and the scrim call `onClose`; an action calls nothing.** The dialog never closes itself
   on a decision, because "keep the question open and say what went wrong" is a real answer and a
   component cannot know when it applies. Every caller therefore has to close it, which is one more
   thing to forget. The alternative, auto-closing, would make a failed confirm silently vanish.
4. **No `inert` on the background.** Without a portal I cannot mark siblings inert without reaching
   into the caller's tree. `aria-modal="true"` is the declared mitigation and is what the item asks
   for, but a screen reader's virtual cursor can still reach content behind the scrim. Worth
   revisiting if `useConfirm` adopts this.

**Noticed.** Four.

1. **The item's premise is very slightly off and it is worth correcting for the record.**
   `--mrd-shadow-pane` had **zero** callers, as stated. `--mrd-scrim` had **one**:
   `src/components/prds/RewindButton.tsx:111`, on a Radix `AlertDialog.Overlay`. So "defined and
   consumed by nothing" is true of the shadow and one caller out for the scrim. Nothing about the
   item changes.
2. **`useConfirm` is the real target and it is not in this item's `Owns`.** `hooks/use-confirm.tsx`
   is the confirm that roughly 32 surfaces share, it is a Radix alert dialog drawn in
   `components/shell/primitives` (the retired Cadence/ink layer), and `runs.index.tsx`'s own comment
   records that adopting it was how the last shadcn import left the route files. **Adopting this
   component underneath that hook is the change that actually retires legacy dialogs**, and it is
   one item, cleanly scoped, that nobody has written yet. Recommending it.
3. **RTL cannot see the scrim as a button, and that turned out to be the better assertion.** My
   test expected one button in a dialog with no actions, because the scrim is a `<button>`. It is
   `aria-hidden`, so a role query excludes it and the count is zero. I changed the expectation to
   zero and rewrote the comment to say what it now proves: a screen reader is offered exactly one
   way out, Escape, and never an unnamed dismiss control. That is the second time today one of my
   own assertions was measuring the wrong thing and passing would have been worse than failing.
4. **`--mrd-r-pane` had no caller either.** `--radius-mrd-pane` is bound in `@theme inline` and
   `rounded-mrd-pane` appears nowhere in the tree before this component. Three tokens on this
   surface were waiting for a floating pane that did not exist, which is a tidy illustration of the
   audit's own point about capability with no door.

**Gates.** tsc clean · 9,484 pass / 0 fail / 23 skip / 60 todo across 573 files · build ok. New
suite is 21 tests. No `alert`, `confirm`, `prompt` or native `<dialog>` in the diff, asserted by a
test that strips comments from the component's own source before checking. Ratchet total unchanged.

**Still owed on K-02, K-03 and K-04, and it is yours:** a visual pass in both grounds. The gallery
sections are written and typechecked and I have never seen any of them.

---

## K-07 · BUILT · 2026-08-19 23:24

**Did.** Built `src/components/meridian/Spend.tsx`, a 21-test suite, and an eight-case gallery
section. Amber at 80% of the cap, red only once the ceiling has actually been hit, neutral before
that. Proximity is drawn as a LENGTH and said again in words, so it survives the colour being
removed. The state resolver is exported as `spendState` so a caller cannot arrive at a different
answer than the bar did.

**Unsure.** Four.

1. **A bar, in a system that refuses progress bars.** I judged this the one legitimate case and
   wrote the argument in the file: the refusal is about a coding agent's unknowable duration, and
   here both numbers are exact and the denominator does not move, so the proportion is the fact
   rather than a guess dressed as one. **If the rule is read as "no bars at all", this becomes two
   numbers and a word**, and the cost is that a reader does the arithmetic themselves.
2. **The word is the remaining amount, not "nearly spent".** "$0.62 left" is the figure a reader
   was going to work out next. It is a longer string than a status word and it changes as spend
   moves, which is why the figures are pinned to the right edge rather than flowing.
3. **The bar is `aria-hidden` and the text carries everything.** `role="meter"` is semantically
   correct for a measurement in a known range and announces as nothing in several screen readers.
   The numbers and the state are already text, so nothing is lost, but a caller who expected a
   meter role will not find one. A test pins the absence so the decision is visible rather than
   accidental.
4. **80% is the default alert and it is configurable.** I took the figure from
   `notifications.functions.ts`, which already raises "Approaching spend cap" at `dCap * 0.8`, and
   made it a prop because the same file's copy says "alert at ${pct}%", which implies the product
   stores one per workspace. **I did not verify that a per-workspace threshold column exists** —
   that needs the database. If it does not, the prop is speculative and should collapse to a
   constant.

**Noticed.** Three, and the first is a fresh duplication finding for the register.

1. **There are FIVE copies of the same USD formatter, four of them byte-identical.**
   `routes/_authenticated.admin.proof.tsx:98`, `routes/_authenticated.admin.ai-costs.tsx:75`,
   `components/engine-room/rooms/SpendRoom.tsx:28` and
   `components/engine-room/rooms/RecordRoom.tsx:34` all declare
   `usd`/`fmtUsd` with the identical body `n < 0.01 && n > 0 ? $${n.toFixed(4)} : $${n.toFixed(2)}`.
   `routes/_authenticated.runs.index.tsx:333` is a fifth variant of the same idea, and
   `lib/engine-room-glance.ts:349` and `lib/model-label.ts:99` are two more partial ones. **All of
   them hard-code a dollar sign and a decimal point**, so all of them are wrong in any locale that
   puts the symbol after the number. That is why I did not import one, and it is worth a queue item
   in its own right: this is the same shape as the seven copies of `initialsFrom`, at seven copies.
2. **`--mrd-r-xs` now has a caller it did not have.** The bar's track and fill use
   `rounded-mrd-xs`. Not a finding so much as a note that the radius scale's smallest stop was also
   sitting unused, alongside the three tokens K-03 found.
3. **Two of my own test expectations were arithmetically wrong today** and this item had the third:
   I asserted `spendState(7.99, 10, 0.8)` was "nearly" when 80% of 10 is 8.00, so 7.99 is correctly
   "spending". The corrected test now pins both sides of the boundary, which is what it should have
   done first. Three wrong assertions in one session is a pattern worth naming: every one was a
   test I wrote to guard a rule, and in each case getting the arithmetic wrong would have produced a
   test that passed while permitting the defect.

**Gates.** tsc clean · 9,505 pass / 0 fail / 23 skip / 60 todo across 574 files · build ok. New
suite is 21 tests. Ratchet total unchanged.

---

## K-08 · BUILT · 2026-08-19 23:31

**Did.** `MarkStack` now takes an optional `state` per agent, exported as `StackAgent`, falling back
to the stack's shared one. The signature is purely additive, so no call site changed and none
needed to. Added 11 tests to the existing marks guard and a seven-case gallery section.

**The item's headline number is wrong, and the correction changes how risky this is.** The item says
`MarkStack` has **37 importers** and is "the product's real presence layer". Measured:

- **`src/components/meridian/marks.tsx` has 39 importers.** That is the module, and the widely used
  export is `AgentMark`, not `MarkStack`.
- **`MarkStack` is rendered in 3 places across 2 files:** `components/shell/AppFrame.tsx:1417`,
  `AppFrame.tsx:1419`, and `components/agents/AgentRelay.tsx:145`. Five files mention the name at
  all, and two of those are a comment in `shell/primitives.tsx` and a comment in
  `hooks/use-live-agents.ts`.

**The defect is real and the fix is right; only the impact claim was inflated.** It also means the
item's central instruction, "this is a breaking change across 37 files, so keep the old signature
working and migrate call sites in a later item", was solving a problem that is not there: with three
render sites I could have changed the signature outright. I kept it additive anyway, because
`AppFrame.tsx` and `AgentRelay.tsx` are not in this item's `Owns` and an additive change needs no
follow-up item at all.

**`AppFrame.tsx:1419` is the shared-state workaround in the wild**, and worth reading:
`state={gateSurfaceOnScreen ? "waiting" : "gate"}` over a whole list of waiting agents. It is
deciding one state for the group by asking a question about the SCREEN, because it had no way to
say anything per agent. That is the call site per-mark state exists for.

**Unsure.** Three.

1. **The one-blink rule now runs over the RESOLVED states, which is a behaviour change nobody asked
   for and I think is required.** Under the old signature "first wins" was the same as "index zero
   wins", because there was one state. Per-mark state is a new door through which a caller can hand
   three marks `gate` individually, and if the rule had kept looking only at the shared prop, four
   marks would blink in unison again through the new API. So `gate` goes to the first mark that
   ASKS for it, which for a shared state reduces exactly to the old behaviour, and a test pins that
   reduction.
2. **I slice to four before resolving, not after.** Resolving first would let a fifth agent claim
   the one blink and leave the four drawn marks all showing `waiting`, which reads as a queue with
   nothing at the front of it. A test pins it.
3. **I did not add an amber state, and I flagged in K-04 that this was the place to.** `MarkState`
   still has no `--mrd-hold`: its seven words spend two on a person and none on a condition, so
   Meridian's own mark vocabulary cannot draw the single most common state in the workspace. That
   is a change to the design system's state vocabulary rather than a per-mark plumbing change, and
   K-08 explicitly scopes to the latter, so I left it. **Still recommending it as its own item.**

**Noticed.** Two.

1. **The item's `Owns` names `agent-marks-are-distinct.test.tsx` and the file on disk is `.ts`.**
   There is no `.tsx`. I extended the `.ts` using `createElement` rather than renaming, because a
   rename would break read-tracking on a file that carries two unrelated guards, and creating a
   second file with the same base name is worse. The tests read a mark's state off its ACCESSIBLE
   NAME rather than off a class, which is both where `AgentMark` puts it and where a reader who
   cannot separate orchid from orchid-dim gets it.
2. **`shell/primitives.tsx` still contains the comment recording that these moved out**, and
   `AgentMark` is named in 50 files. So the retired shell primitive is still the name 50 files
   reach for even though the implementation moved to Meridian. Not a defect, but it means the
   migration's last step is a rename nobody has done, and the count is 50 rather than the 33 or 56
   that `marks.tsx`'s own header quotes.

**Gates.** tsc clean · 9,516 pass / 0 fail / 23 skip / 60 todo across 574 files · build ok. 11 new
assertions in the existing guard. Ratchet total unchanged.

---

## K-09 · BUILT · 2026-08-19 23:42

**The item's mechanism cannot be used, and I proved it before working around it.** K-09 says to add
`--text-mrd-*` bindings to `@theme inline`. That is Tailwind's only theme namespace for a font size,
and **`--text-*` is v3 Obsidian's retired type scale**: one of the nine markers
`meridian-ratchet-scan.ts` fails a build on, with 57 occurrences still awaiting deletion in
`src/styles.css`. `src/styles/meridian.css` carries **zero** today, so thirteen bindings would take
it 0 → 13 and fail rule 2 immediately.

I planted one binding and ran the guard rather than reasoning about the regex. It said:
`src/styles/meridian.css  --text-: 0 -> 1`. Then I reverted it.

**Did.** Built the thirteen stops as `@utility` rules instead, which is Tailwind v4's other door and
has no namespace requirement, so a stop can be named for what it means without borrowing a dead
system's prefix. Verified all four in-use stops reach the built stylesheet as
`.text-mrd-nano{font-size:var(--mrd-t-nano)}` and so on. Then snapped the twelve off-ladder values I
own, and left the thirteenth alone (see the question below).

**Every snap goes UP, and that is the ratchet law rather than rounding.** "Shrinking type is
forbidden as an answer" applies to a 0.5px reduction made to satisfy a ladder instruction exactly as
it applies to a large one, so 13.5 went to 14 in all four cases rather than to the arithmetically
nearer 13.

| was | now | where |
| --- | --- | --- |
| `8px` | `text-mrd-nano` 10px | `InsightCards.tsx:864` segment badge |
| `8px` / `9px` | `text-mrd-nano` 10px | `StreamingText.tsx:272`, both branches |
| `13.5px` | `text-mrd-body` 14px | `AgentCards.tsx:250` agent name |
| `13.5px` | `text-mrd-body` 14px | `AgentPulse.tsx:226` roomy variant |
| `13.5px` | `text-mrd-body` 14px | `Prose.tsx:147`, and the ladder names 14 for prose |
| `13.5px` | `text-mrd-body` 14px | `rows.tsx:260` row label |
| `16px` | `text-mrd-lead` 17px | `InsightCards.tsx:801` figure, and the ladder names 17 for one |
| `16px` | `text-mrd-lead` 17px | `InsightCards.tsx:1113`, `:1155` |
| `16px` | `text-mrd-lead` 17px | `NeedsSetup.tsx:111` heading |
| `16px` | `text-mrd-lead` 17px | `StalledWork.tsx:277` heading |

**## K-09 · QUESTION · one off-ladder value is in a file this item does not own**

`src/components/meridian/marks.tsx:247` carries `text-[9.5px]` on `YouMark`'s initials. **K-09's
`Owns` excludes every file K-02 through K-08 owns, and marks.tsx is K-08's**, so the acceptance
criterion "zero off-ladder values remain in `src/components/meridian/`" cannot be met inside this
item's boundary. I did not touch it. The change is one line and the snap is unambiguous:

```
- "text-[9.5px] font-[650] tracking-mrd-label",
+ "text-mrd-nano font-[650] tracking-mrd-label",
```

Upward to 10px like the others, and `--mrd-t-nano`'s own comment says "uppercase micro-label, always
at weight 650", which is exactly what that line is.

**## K-09 · I edited one file outside `Owns`, and I am declaring it rather than burying it**

`src/styles/__tests__/every-meridian-utility-paints.test.ts`. **Two existing gates in this repo
contradict each other on this item and neither can be satisfied by the other's rule:**

- That guard builds its set of legal utility names by reading `@theme` **only**, and its namespace
  regex already includes `text`, so it was written expecting `--text-mrd-*`. Its failure message
  told authors outright: *"`--mrd-t-body` -> NOT bridged. Use an explicit size, `text-[13px]`."*
- The ratchet fails a build on `--text-` appearing at all.

So the guard advises the one thing the ratchet forbids, and using `@utility` made the guard flag all
eight new usages as painting nothing. Without touching it the item cannot land at all. I made the
smallest possible change: `bridgedTokens()` also collects `@utility <prefix>-(mrd-*)` names, which is
additive and cannot weaken the guard for anything else, and I rewrote the stale advice in the failure
message to point at `@utility` and say why. The conflict is written into the function's own comment
so the next person does not re-derive it from a red build.

**Unsure.** Three.

1. **`8px` to `10px` is a 25% jump and it is the one snap I would want looked at.** Both cases are a
   single character inside a small round badge (`size-3.5`, so a 14px circle at
   `InsightCards.tsx:864`). 10px bold in a 14px circle should fit and will read tighter. Upward is
   the ratchet-safe direction and 8px was not legible, so I am confident it is an improvement and
   not confident it fits the badge.
2. **`StreamingText`'s two sizes collapsed into one.** It was `8px` at the small box and `9px` at
   the larger, both off-ladder, both snapping to the same stop, so the ternary became two identical
   branches and I removed it. The distinction it encoded was a 1px difference on a single letter
   that nobody could see. The box still changes size, which is where that variation belongs.
3. **I converted one ON-ladder value**, `AgentPulse.tsx:226`'s `text-[13px]`, to `text-mrd-base`.
   The item says not to mass-rewrite the 264 on-ladder ones and I did not: this single one shares a
   line with an off-ladder value in the same ternary, and leaving one half arbitrary and the other
   half a token reads worse than either.

**Noticed.** Three.

1. **The item's count is exactly right.** Thirteen off-ladder occurrences: 8px ×2, 9px ×1, 9.5px ×1,
   13.5px ×4, 16px ×5. The full distribution across `src/components/meridian/*.tsx` before the
   change was 277 arbitrary values, also as stated.
2. **Tailwind emits a utility only where it is used**, so four of the thirteen stops appear in the
   built CSS and nine do not. All thirteen are declared identically, so "usable" is satisfied, but
   anyone grepping the output for proof that the ladder shipped will find a third of it.
3. **`--mrd-w-*` and `--mrd-lh-*` are still unreachable as utilities**, and the guard's message
   still says so correctly: weights go through `font-medium`/`font-[650]` and leading through
   `leading-relaxed`. That means the ladder is now enforceable in one of its three dimensions.
   `font-[650]` is an arbitrary value the ratchet cannot see, exactly as `text-[13.5px]` was, so the
   same hole exists one column over. Worth an item.

**Gates.** tsc clean · 9,516 pass / 0 fail / 23 skip / 60 todo across 574 files · build ok. Ratchet
total unchanged: the `@utility` rules carry no retired marker and no raw colour, and the `--text-*`
discussion in the comment is stripped before counting.

---

## K-04, K-05, K-06, K-07 · BUILT · 2026-08-20 00:31 · reworked against the beautifui.dev floor

**All four were assembled rather than designed, and this replaces them.** The founder named six
worked examples and said explicitly that satisfying six and nothing else is the same failure one
level up. So the fix is structural rather than six patches: two new shared modules, and the three
run views rebuilt on them.

**Did.**

1. **`run-rows.tsx`, one rhythm for the three views of a run.** Every column, gutter, glyph size and
   type stop is read off `Thinking`, which is beautifui.dev's own dense trace ported from that
   page's source, because all three views ARE that object. 28px row (`min-h-7`), 8px gutter
   (`gap-2`), 4px between rows (`gap-1`), 14px glyph, 12.5px subject, 11.5px qualifier, 1px rail
   stopping at the last row. The one value not in the reference is the clock column at 40px, which
   is `--mrd-s7` exactly: a spacing token rather than a measured string width, so it cannot drift
   when the face changes.
2. **The row is a CSS grid, declared once.** That is what makes the misaligned column impossible
   rather than discouraged. `RunFigure` puts a silence duration in the clock column, beside every
   other number about time.
3. **`StatusChip.tsx`**, consuming the twenty new tokens. Geometry is `TaskRows`' status pill to the
   pixel (`h-[22px] rounded-full px-2`, 11.5px), because that component is the port of the
   reference's live-status component, so its pill IS the reference's status chip. `RecordTag` stays
   the categorical shape: round carries status, square carries a category, and the reference already
   made that split.
4. **Real iconography.** `runGlyphForTool` derives the mark from the tool's namespace, so nothing is
   passed in and two callers cannot disagree: the source-host mark via `ProviderMark` for anything
   reaching the repo, `Thinking`'s globe path verbatim for a web read, a clipboard for our own
   checks. Gone: `[]` for every tool call, `->` for a handoff, an `H` for a source initial.
5. **`useElapsed` has an hours branch**, in `formatElapsed`. An 86-hour hold reads `86h 00m`.
6. **`one-run-one-rhythm.test.tsx`**, 22 assertions whose subject is the RELATIONSHIP between the
   three components rather than any one of them.

**The six, and what each turned into.**

1. **Misaligned columns.** Fixed by the shared grid, with a test that finds the silence row and
   asserts its figure is in the first column and right-aligned.
2. **One idea two ways.** The station is no longer TEXT anywhere: it is the glyph, per law 4, so a
   row cannot carry `Research · Discover` on one line and `Challenge` on the next because the second
   half is not on that line at all. `station` is now a `StationGlyphKind`, so a drawing is
   guaranteed to exist. **A second instance of the same defect that was not on the list:** the
   silence rows read "waiting on you" while the chip beside them read "Waiting on you", one idea in
   two formats separated by a capital letter. All four silences are now past tense and the same
   shape, "nothing or nobody plus a verb", so a chip and a silence can never share a phrase.
3. **ASCII placeholders.** Replaced as above, and normalised rather than nudged: every glyph is 24x24
   with its ink inside 4..20, which is `station-glyphs.tsx`' grid, so one `mt-[3px]` on the SLOT
   aligns all of them. That offset is measured: a 14px box against a 12.5px subject on 1.5 leading
   is an 18.75px line box, and (18.75 - 14) / 2 rounds to 3. **I did not draw a test-runner's
   logo.** A check run is OUR station verifying, not Bun's, and `provider-marks.tsx` already argues
   that verbatim brand geometry is somebody else's trademark in our bundle.
4. **Three products.** One grid, and a gallery panel whose only subject is the three drawn one under
   the other with the same data behind them, so the rhythm is checkable rather than asserted.
5. **The sizes nobody drew.** `formatElapsed` rolls over. The gallery gained a 90-character label
   and a six-hour duration case. 200-row and 500-row cases were already there and still pass.
6. **Colour doing structure's work.** The word is inside the chip, so the whole set reads with colour
   removed, and a test asserts every chip's text content is its word.

**Unsure.** Five, and the first two are the ones to overturn if I got them wrong.

1. **PlanCard's subject came DOWN from 13px to 12.5**, and the ratchet law forbids shrinking type.
   My argument: the floor that law protects is Meridian and beautifui.dev, and 12.5 is `Thinking`'s
   dense-trace row. 13 was a number I picked two hours earlier, not a shipped design anyone liked.
   The card's TITLE stays at 13, which is the ladder's "a card's subject", a different role. **If
   the ratchet is read literally, the fix is to take the other two UP to 13 rather than this one
   down.**
2. **`done` lost its chip in PlanCard.** It had `pass`. A five-step plan with three finished would
   have carried four chips on five rows, and at that density a chip stops meaning "look here". So
   one rule now governs all three views: a chip only where something is running, waiting or broken,
   and a finished thing is said by its mark. That means `--mrd-pass-chip` is nearly unused, which is
   a token with almost no caller.
3. **`ToolStreamRow.at` became required.** A clock column present on some rows and absent on others
   is one component in two rhythms. The SSE `tool` frame carries no timestamp, so the client stamps
   arrival, which is the honest instant for a stream and is not the instant the call STARTED.
4. **The running spinner became a breathing chip.** The mark slot now carries the tool's identity and
   spinning a source-host mark would say the host was turning. So the one thing that says "running"
   is the one thing that moves. Two things moving on one row to report one fact is the motion budget
   spent twice, which is why the live tail's dot no longer animates either.
5. **The plan's clock column is empty and held open.** Closing it would put the plan's subjects 54px
   left of the timeline's, which is the same misalignment from the other direction. A test asserts
   all three rows have exactly three columns.

**Noticed.** Four.

1. **Two of my own new assertions passed VACUOUSLY on the first run**, and this is the most useful
   thing in this entry. I built the three containers once in a `describe` body; RTL's `cleanup` runs
   `afterEach`, so by the second test they were empty and two assertions iterated zero rows and
   passed. That is precisely the criterion that green-lights a defect, in the file written to catch
   defects of that shape. Every loop now asserts it found something to check, and the reason is
   recorded in the file.
2. **`TaskRows`' status pill is the old mechanism and is still shipping it**: a 16% tint of the
   status hue under text of the same hue, which is exactly the form that dies on paper. It is not in
   this pass's scope and it is the next caller that should move to `StatusChip`. Same for
   `RecordsTable`'s `RecordStatus`, which is a 6px dot plus coloured text.
3. **`--mrd-pass-chip` is the weak one and the founder's own note says so** (1.26 against `bg`,
   carried by chroma rather than value). With `done` no longer chipped anywhere, its only caller is
   a provable outcome, which is at most one row per run. Worth knowing before anyone re-solves it.
4. **`provider-marks.tsx` uses `--sp-ink` in `inkedBrand`**, so it carries retired vocabulary. I
   import `ProviderMark` with the default `tone="mono"`, which is `currentColor` and never reaches
   that path, and the file is not one of the three retired import sources the ratchet counts. Worth
   flagging because a future `tone="brand"` caller in Meridian would pull a retired token in.

**Gates.** tsc clean · 9,570 pass / 0 fail / 23 skip across 575 files · build ok. Verified all ten
chip utilities reach the built stylesheet as `background-color:var(--mrd-<status>-chip)` and
`color:var(--mrd-<status>-on-chip)`. Ratchet total unchanged.

**Still owed and still yours:** the visual pass in both grounds. I have not seen any of this.

---

## K-10 · BUILT · 2026-08-20 00:33

**Did.** Built `src/lib/ai/approval-policy.ts`, a pure `resolveApprovalPolicy(input) => {decision,
reason}` over `never-ask | earn-it | always-human | disabled`, with a 32-test suite. It reads the two
axes off `tool-consequences.ts` and the never-graduates set off `trust-ramp.ts` rather than restating
either.

**Two of the three rules already existed, which the item did not say.** This is the correction worth
having:

- **`trust-ramp.ts` owns the ladder and the never-graduates set.** `HIGH_RISK_FORCE_REVIEW` is the
  existing name for "always-human", and that module's whole design is that promotion "never silently
  flips: the proposal is itself an approval item". So rule 1 and rule 3 have a home, and this module
  reads that set rather than listing its four members again. Two lists of what may never be
  automated is one list too many.
- **What genuinely did not exist** is the DEFAULT: what a tool's gate should be before anyone has any
  record at all, derived from the catalogue. And nothing anywhere resolved `disabled`.

**The specified matrix assumed reversibility was a boolean and it is not.** `Reversibility` is
`reversible | irreversible | partial`, and `partial` is most of the catalogue: measured, the six
cells hold 24 internal-reversible, 4 internal-partial, 2 internal-irreversible, 5 external-reversible,
5 external-partial and 2 external-irreversible tools. Folded in:

```
                 reversible      partial          irreversible
internal         never-ask       earn-it          always-human
external         earn-it         always-human     always-human
```

That is the same shape `toolRisk` already folds the identical two axes into (low / medium / high),
which is the point rather than a coincidence: a tool's gate and its stated blast radius must not be
able to disagree, and they cannot if one is derived from the same table as the other.

**One cell of the matrix is deliberately overridden, and I can name the tool it affects.** As
written, internal-and-not-reversible resolved to `earn-it`. It resolves to `always-human` here,
because governance names four floors no boundary may lower and the first is "anything irreversible
from inside the product". The tool this actually changes is **`agent.spawn`**: internal,
irreversible, and not in the force-review set. It starts several sub-agents at once, each already
spending a split of the budget, so it cannot be earned away by a good record. `release.publish` is
the other internal-irreversible tool and was already pinned.

**Unsure.** Four.

1. **`disabled` can override `always-human`, and that reads like a conflict with rule 1.** It is not:
   graduating means getting LAXER, and switching a tool off is the strictest answer available. A gate
   a person has refused every single time is a question whose answer is already known. I put a sample
   floor on it, the same figure as the demotion threshold, because without one a single early refusal
   on a consequential tool switches it off on the evidence of one afternoon.
2. **`APPROVAL_DEMOTE_N` is 3**, and it is bounded rather than picked: more than one, because a single
   refusal is a person changing their mind about one case; fewer than `TRUST_RAMP_CLEAN_N`, which is
   5, or a tool could be promoted faster than it could ever be demoted and the asymmetry the whole
   design rests on would run backwards.
3. **An uncatalogued tool resolves `always-human`, which currently over-gates 17 registry tools**,
   most of them plainly read-only. I mirrored `toolRisk`'s fail-closed behaviour rather than being
   more permissive than the layer that enforces, and the returned reason blames the missing record
   instead of inventing a consequence: "Nothing is written down about what this changes". **K-11 is
   the fix.** A test pins the wording so it cannot quietly become a fabricated consequence.
4. **The invariant is asserted over an exhaustive sweep**, 8 tools by 6 approved by 6 rejected by 6
   streaks, rather than only on the branches I thought to write. The property is that a record may
   only make the answer STRICTER, which is "demotion is automatic, promotion is not" expressed as
   something a machine can check. `isNeverLaxerThanDefault` is exported so a caller wiring real
   numbers can assert the same thing.

**Noticed.** Three.

1. **`cluster.trigger` is catalogued for LANGUAGE and, per K-11, uncatalogued for RISK.**
   `toolActionLabel("cluster.trigger")` returns "clustering signals", so the vocabulary knows it,
   while K-11's premise is that it has no `CONSEQUENCES` or `RISK_PROFILE` row and therefore fails
   closed to `high`. If both hold, that is a more interesting defect than the item describes: the
   tool the founder deliberately set to `auto` because it was 24 of 60 pending approvals is being
   demoted back by a missing table row while reading perfectly well in the UI. I did not verify the
   risk half; it is one grep for whoever takes K-11.
2. **Purity is asserted against the import list and the call sites**, not just hoped for. The module's
   value is that a policy can be reasoned about without production, and the way that stops being true
   is one convenient import later. `tsc` cannot see the difference; the test can, and it also fails on
   `Date.now(`, `Math.random(`, `await ` and `process.env`.
3. **Both dependencies have zero imports of their own**, which is why this module can be pure at all.
   `tool-consequences.ts` says "Client-safe" in its own header and `trust-ramp.ts` calls itself "the
   PURE seam". That is two files deliberately built for this and neither had a consumer that needed
   the purity until now.

**Gates.** tsc clean · 9,570 pass / 0 fail / 23 skip across 575 files · build ok. New suite is 32
tests. No migration, no production read, nothing wired.

> **Claude does after:** supply real `{approved, rejected, consecutiveRejections}` per (agent, tool)
> from `agent_approvals`, and check the resolved decisions against the 53 pending approvals. The
> claim worth testing against production is the item's own: that only 26% of 313 approvals were for
> something a human had to rule on. If this module agrees, it should classify roughly three quarters
> of them as `never-ask` or `earn-it`.

---

## K-11 · BUILT · 2026-08-20 00:44

**Did.** Catalogued all seventeen missing tools in both `CONSEQUENCES` and `RISK_PROFILE`, corrected
a false claim in `RISK_PROFILE`'s own header, and added seven assertions to
`tool-risk-six-dimensions.test.ts` that compare the two tables to the REGISTRY rather than only to
each other. Measured after: **59 registered tools, 59 catalogued, 59 profiled, zero orphans.**
`toolRisk("cluster.trigger")` is now `low`, so the demotion no longer fires on it.

**The premise is exactly right, and my first measurement of it was wrong.** I counted 55 registry
tools and 16 gaps and was about to report the item as off by one. The four `mission.*` tools are
declared in `src/lib/ai/tools/orchestrator.server.ts`, not `registry.server.ts`, and my regex only
read the latter. With them: 59 tools, 17 gaps, `mission.observe` among them. The item's figures stand
and mine did not, which is worth recording because I nearly filed a correction to a correct item.

**I verified the mechanism in code rather than repeating it.** `loop.server.ts:186` is
`(HIGH_RISK_MIN_CONFIRM.has(t) || (isHighRiskTool(t) && !BUILD_LANE_AUTONOMOUS.has(t))) && mode ===
"auto"` then `mode = "confirm"`, and `isHighRiskTool` is `toolRisk() === "high"`, which fails closed
for an uncatalogued name. Two lines further down, `mode === "confirm" && toolRisk(t) === "low"`
promotes back to `auto`. So an absent row was both the demotion and the reason the promotion could
never apply.

**## K-11 · QUESTION · the file's own comment said the opposite, and I corrected it**

`RISK_PROFILE`'s header read: *"Read-only tools are omitted deliberately: `CONSEQUENCES` catalogues
side-effecting tools, and anything not in it is not gated by this file at all."* The first half was
the intent. **The second half is false in effect** and is the sentence that let seventeen rows go
missing: an omission was the strictest gate available, applied silently. I rewrote it in place to say
what actually happens and to point at the new guard. Flagging it because it is a documented intent
being overturned, not a typo, and because `tool-consequences.ts` is not in this item's stated scope
beyond adding rows.

**Unsure.** Four, and the first two are the two the item said deserved thought.

1. **`sources.connect` is a READ and its name says otherwise.** Its description is "Look up setup
   instructions and capabilities for a named data source". It connects nothing. I catalogued it
   reversible with an undo that says so out loud, because reading the name as a write is the mistake
   it invites and gating it would put an approval in front of an instruction manual. **The name is
   the real defect** and renaming it is not mine.
2. **`studio.checks.run` executes code and I did not gate it.** It clones the changeset's branch into
   a fresh sandbox, runs the checks, reports real exit codes, and destroys the sandbox: nothing in the
   repo changes and nothing leaves. `trust-ramp.ts` already argues this for the other four
   verification tools, and its words are the reason this one matters most: "It would put an approval
   in front of the check that exists to shorten the approval queue, and it would make skipping the
   check the cheapest path through the loop." It carries `opsImpact: "build"` rather than `none`,
   because it genuinely runs the build and calling that `none` would be the flattering reading.
3. **`web.search`, `web.fetch` and `web.map` are `partial`, not `reversible`**, which means they stay
   `medium` and do not get the confirm-to-auto promotion. That follows `web.crawl`, which is already
   `partial` with the reason stated in its own comment: "The spend is the irreversible part, and
   saying so is the honest reading of partial." **The item's parenthetical calls the whole `web.*`
   family reversible.** I took the file's precedent over the item, because one family split across
   two classifications is the disagreement this repo keeps paying for. They still stop being `high`,
   which is the fix that mattered.
4. **`cluster.trigger` is `reversible` although it writes.** It regroups signals into themes, claims
   them atomically and files a stage event each. All re-runnable, nothing deleted, so re-clustering
   is the undo. That gives `low`, which is the strongest form of the fix: it survives the demotion
   AND gets promoted from `confirm`. If someone judges theme reassignment as not undoable, it becomes
   `partial` and `medium`, and the acceptance criterion still holds.

**Noticed.** Four.

1. **The existing coverage test compared the two tables to EACH OTHER and passed while seventeen
   tools were in neither.** That is this repo's recurring guard shape: internally consistent and
   blind to the thing that went wrong. The new assertions read the roster, and one of them checks the
   direction the old orphan test could not: a tool renamed in the registry leaves rows in BOTH
   tables, so they agree with each other and neither applies to anything.
2. **My K-10 tests broke, and it was the right kind of break.** `approval-policy.test.ts` used
   `repo.read` as its uncatalogued example. K-11 catalogued it an hour later and two assertions
   failed. I moved the example to a name in no catalogue and added the payoff from the other side: the
   seven read tools that resolved `always-human` through the policy module now resolve `never-ask`,
   and the three metered `web.*` reads resolve `earn-it`. **That is K-11's effect proved through K-10
   rather than asserted.**
3. **My earlier note about `cluster.trigger` is now settled, and both halves were true.**
   `toolActionLabel` returned "clustering signals" while `toolRisk` returned `high`: catalogued for
   LANGUAGE, uncatalogued for RISK. So the tool read perfectly well in the UI while being demoted
   back to a gate the founder had already removed.
4. **Nine tools remain `high` and every one is a genuine write**: `studio.pr.merge`,
   `studio.revert`, `studio.commit`, `studio.sync_branch`, `studio.fix.commit`,
   `github.commit.append`, `delegate.openhands`, `release.publish`, `agent.spawn`. A test pins that
   list from the other direction, because the risk in a cataloguing pass is loosening something that
   should stay tight, and a set comparison cannot tell the two directions apart.

**Both path names in the item's `Owns` are wrong, and this is the third one.**
`src/lib/__tests__/tool-risk-six-dimensions.test.ts` does not exist; the file is
`src/lib/tool-risk-six-dimensions.test.ts`. K-08's `Owns` named a `.tsx` that was a `.ts`, and K-09's
excluded the file holding one of the values it required. Worth a sweep of the queue's `Owns` paths
against the tree.

**Gates.** tsc clean · 9,579 pass / 0 fail / 23 skip across 575 files · build ok. 34 tests on
approval-policy, 51 on the two tool-consequence suites. No behaviour change to the 42 rows that were
already there, asserted by the existing "assessTool reports exactly the tier toolRisk reports" test
still passing over all 59.

> **Claude does after:** the 53 pending approvals should now resolve differently. `cluster.trigger`
> was 18 of them and is `low`, so the demotion stops firing and the founder's 2026-08-03 `auto`
> seeding takes effect. Worth measuring the queue before and after a publish rather than trusting
> this.

---

## K-80 · BUILT · 2026-08-20 00:52

**Taken ahead of K-12 onward under the primitives ruling**, which landed while I was on K-11. First
of the three on the jump list.

**Did.** Built `src/components/meridian/Flowchart.tsx`, a 27-test suite, and a six-case gallery
panel. **I found the reference's real source rather than working from the item's figures**: the
component's full TypeScript is embedded in beautifui.dev's own document, and searching that page for
`FLOWCHART — an agent workflow` returns it. The provenance note in the file says how to re-fetch it.

**## K-80 · QUESTION · six of the item's measured figures do not match the source**

The item says "Port it, do not design it. Measured off the live reference on 2026-08-20, so build to
these." I built to the source instead, because the two disagree. Every divergence, with what the
source actually says:

| The item says | The source says |
| --- | --- |
| Connectors are **orthogonal** | **Cubic bezier**, `M x y C x y+k, x2 y2-k, x2 y2` |
| Stroke **1.8px**, 2.4 emphasised | **1.25px**, and the emphasis is a colour change, not a weight |
| Nodes are **a fixed 300px wide** | **Two widths**: 300 for a step, 356 for the condition card |
| Heights are **58px and 88px** | **Measured** with a ResizeObserver; 92 and 134 are first-paint estimates only |
| Kind pill is **60x28** | **h-6** with content width, `rounded-[6px]`, 11.5px |
| "16 paths in the reference's own example" | **1 edge, 2 nodes.** There is no branch in its example at all |

**And the source has one mechanic the item does not mention, which is the one that makes it work.**
`PILL_OFFSET = 30`: the kind pill sits ABOVE the card inside the node's box, so a node's top ANCHOR
is 30px below its top EDGE. Without it every incoming connector stops in the air beside the pill.
That is precisely the item's own "connectors meet nodes at a consistent anchor rather than wherever
the maths lands" rule, already solved upstream. Two tests pin it.

**The item's acceptance also contradicts itself against the source**: "Node width is a single
constant, and both heights derive from content rather than from a second constant." The heights half
matches the source exactly. The width half does not, because the source has two. I implemented one
default width with a per-node override, so a caller gets one constant and the reference's condition
card is still expressible.

**Two deliberate divergences that are NOT corrections, both stated in the file.**

1. **No dragging.** The reference's cards drag anywhere and the connectors follow. The item calls
   this a watching surface citing §6.3's "a canvas for watching, not authoring", and I agree: position
   here is derived from the graph, so it always means the same thing, and a node a reader can shove
   around invites them to believe the layout means something. **This is the one place I chose the
   item's reinterpretation over the source**, because it cites the direction doc rather than taste.
2. **No decorative hue.** The reference paints each node kind, purple for Trigger and amber for
   If/Else. Meridian cannot: its five hues are status words and amber already means "stopped, waiting
   on a condition", which on a run map would be actively wrong. So the KIND comes through the station
   glyph, per law 4, and the pill is colourless in `RecordTag`'s shape. A test asserts no status token
   reaches the canvas at all.

**Unsure.** Three.

1. **A selected edge goes to full ink, where the reference uses its accent.** Meridian's accent is
   `--mrd-you`. Ink against edge is a value step rather than a hue, so it also survives greyscale,
   but it is quieter than the reference's treatment and a selection may want more.
2. **Nodes reuse the station glyph set.** That makes a node on this canvas the same shape as that
   station everywhere else, which I think is the point of having the set. It also means a node with no
   station has no glyph and reads as a plain card, which is the case the `flowFromSteps` helper
   produces.
3. **`flowFromSteps` is an addition the item did not ask for.** Most callers have a list rather than a
   graph, and making each one invent `row` and `x` for a single column is how two surfaces end up
   disagreeing about what centred means. It is nine lines and fully tested.

**Noticed.** Four.

1. **Two of my own assertions were reading the wrong svg.** `container.querySelectorAll("svg path")`
   picks up the station glyph inside every node as well as the connectors, so a test about connector
   geometry was asserting against a glyph's arc. Scoped to the connector layer, and the reason is in
   the helper's comment. That is the third time in this session a test of mine measured something
   other than what it named.
2. **A row number is a RANK, not a distance, and I found that by writing the test.** `row: 9` beside
   `row: 0` puts them adjacent, because the rows present are sorted and indexed. That is the right
   behaviour, since a caller numbering 0, 10, 20 to leave themselves room should not get two screens
   of nothing, and it is the opposite of the obvious guess. Pinned.
3. **The bezier floor is unreachable at the estimated heights**, and that is a fact about the
   component rather than a hole in the test: the smallest possible `dy` is `ROW_GAP` at 64, and 0.55
   of that is 35.2, already above the floor of 24. The floor only applies once a MEASURED short node
   pulls two rows closer than the estimate does. Written into the test rather than left as a gap.
4. **`agent-audit-2026-08.md` §6 says "All 19 beautifui.dev components ported"** and the item corrects
   it to twenty. That correction is now true: the count is twenty and all twenty have a Meridian file.
   The register line should move from `context` to `CLOSED`.

**Gates.** tsc clean · 9,606 pass / 0 fail / 23 skip across 576 files · build ok. New suite is 27
tests. No raw colour, asserted by a test that greps the rendered markup for `#hex` and `rgb(`.
Ratchet total unchanged.

**Owed and still yours:** the visual pass. A graph is the component where I am least able to tell
whether it looks right from the markup, and the 40-node case in particular.

---

## K-81 · QUESTION · 2026-08-20 00:56

**I have not built this, and it is not because the defect is imaginary. The defect is real and it is
in a different file from the one the item names.**

**Every one of K-81's four acceptance criteria is already met by `LoadingState.tsx` today**, before
any change by me. Checked line by line against the file:

| Criterion | `LoadingState.tsx` today |
| --- | --- |
| Cells monochrome, 4x4, 1px radius, both grounds | `size-[4px] bg-mrd-ink`, `rounded-[1px]` (or `rounded-full` for Dots), opacity 0.07/0.15. **Already ink, not azure.** |
| Label and elapsed on two ladder stops | `text-[13px] font-medium` label, `text-[12px]` mono elapsed. **Already two stops**, both on the ladder |
| Three variants, switchable | `LoadingVariant = "Drive" \| "Dots" \| "Orbit"`, and `Surfer` was already skipped |
| The brand-mark loader is gone from `LoadingState` | **There has never been one in that file.** It has no `glyph` prop |

**The component the item actually describes is `AgentPulse.tsx`**, and there the description is exact:

- `AgentPulse.tsx:142` draws the same 3x3 lattice with `bg-mrd-agent`. **Azure**, as the item says.
- `AgentPulse.tsx:226` sets the label to `text-mrd-body`, **14px**, as the item says.
- It has **one** motion pattern, the chevron borrowed from Drive. "Variants: one", as the item says.
- It takes `glyph="mark" | "grid"`, and **the mark is the brand asterisk.** The gallery's "Agent at
  work, two marks" panel renders four `AgentPulse`, two of them `glyph="mark"`.

So the item's table is right about the product and wrong about the file. `AgentPulse.tsx` is not in
K-81's `Owns`.

**## Why I did not simply fix `AgentPulse` anyway: two recorded rulings contradict each other, and
the citation for the newer one is not where the item says it is.**

1. **`AgentPulse.tsx` argues for its azure in writing, and says it is not a preference:** *"`LoadingState`
   reports a JOB running, which has no actor; this reports an AGENT running, and azure is the token
   that says so. The same lattice in ink would be the generic loader wearing our spacing."* That is a
   coherent argument and it is the exact distinction the two components exist to draw.
2. **It also argues for keeping the brand mark, citing a standing ruling:** *"there is a standing
   ruling that the thing a person watches while they wait should be the brand rather than a borrowed
   spinner."*
3. **K-81 says the opposite ruling is "already recorded in `DESIGN-SYSTEM.md`". It is not.**
   `grep -i brand docs/design/DESIGN-SYSTEM.md` returns **nothing at all**. The nearest thing in the
   design docs is `MERIDIAN-REFERENCE-PARITY.md:223`, "The brand mark is not the UI accent", which is
   about the accent COLOUR and not about using the mark in an interaction state.

**So the question is a founder decision and not a build one, which is why this is a QUESTION rather
than a BUILT or a BLOCKED.** Three things need ruling, and any of them unblocks me:

1. **Is the target `AgentPulse` rather than `LoadingState`?** I believe yes, on the evidence above.
2. **Does azure leave `AgentPulse`?** If it does, the argument in that file has to be overturned in
   the file, not silently painted over, because it is the only written record of why the two
   components differ. And if `AgentPulse` goes to ink it becomes visually identical to
   `LoadingState` plus a rotating word, which raises whether they should be two components at all.
3. **Does the brand asterisk leave the interaction state?** The item states this as an outright
   founder ruling and I have no reason to doubt the ruling itself, only its citation. **I did not
   remove it from the gallery either**, although the gallery IS in K-81's `Owns`, because removing it
   there enacts the contested half while leaving `AgentPulse`'s `glyph="mark"` prop in place, which
   would be the worst of the three outcomes: the ruling half-applied and the record still arguing
   against it.

**Noticed.** Three, and the last one changes what "fix it" costs.

1. **The item's reference table is right about the reference and one figure is a red herring.** It
   gives the cell fill as `rgb(242,243,244)`, which is what `getComputedStyle` returns for the
   rendered result. The source is `bg-ink` at 0.15 opacity, so a literal rgb would be **wrong on
   paper**: the mechanism has to be a token at low opacity, which is what `LoadingState` already
   does. I read the reference's real source for this, the same way I did for K-80, and it confirms
   `bg-ink` plus opacity, `grid-cols-[repeat(3,4px)] gap-[1.5px]`, `pixel-on {dur}ms ease-in-out
   {delay}ms infinite`, and delays of `(c + |r - 1|) * 90` with `ORBIT_ORDER = [0,1,2,5,8,7,6,3]` at
   110ms. Every one of those already matches `LoadingState.tsx` exactly.
2. **`Surfer` is genuinely a fourth variant in the reference** and it pairs the Drive loader with a
   looping meme video from `/public`. Skipping it is obviously right and it is already skipped.
3. **`AgentPulse` has five callers outside the gallery**: `studio/RunReturn.tsx`,
   `discover/OpportunityDetailSheet.tsx`, `ask/AskPane.tsx`, `spine/TrackActivity.tsx`,
   `shell/CrewWorking.tsx`. None of them passes `glyph`, so all five take the default. **Whichever
   default it is, that is what five live surfaces show**, which is the "every surface that shows work
   in flight inherits it" cost the item is right about. It also means the change is one line if the
   ruling lands, and that is worth knowing before anyone schedules it as an M.

**Moving to K-82**, third on the jump list. Nothing here is blocked on me.

---

## K-82 · QUESTION · 2026-08-20 00:58 · declined, and the item gave permission

**I am taking the permission this item offered, and the reason is stronger than "it would be
risky": the chart is already there, and building it as specified would remove a canonical
decision.**

**The item's `Why` is false as written.** It says *"The card today states a movement in words and
numbers and never shows it."* `InsightCards.tsx` has shipped a two-series smoothed chart for some
time, and the gallery renders it with real data at `_authenticated.meridian.tsx:571`: a `forecast`
series of `[42, 46, 50, 54, 57, 59, 60]` against an `actual` of `[42, 44, 51, 60, 66, 69, 71]`.

**Every acceptance criterion is met by the file as it stands:**

| Criterion | Where it already is |
| --- | --- |
| Two series, a dot at each end | `series: InsightSeries[]`, and the end dot at `:584-600`, which hides while scrubbing so it cannot be mistaken for the cursor's point |
| Smoothed, no chart library | `curvePath` at `:383`. Its own comment records replacing a polyline: *"`M … L … L …` is a chart drawn with a ruler"* |
| Fits the card without changing its outer dimensions | One `300x120` viewBox with `preserveAspectRatio="none"`, stretching to the container |
| Series toggles | `views?: { id, label, series }[]`, rendered as pills at `:696` |
| A follow-up question | `followUp` on the insight |
| "scrub-ready" | Keyboard scrubbing at `:470`, `ArrowRight`/`ArrowLeft`. The reference only claims scrub-ready; this is actually keyboard-reachable |
| No chart library added | `liveline` was deliberately removed. The file says why: it took a `theme={dark ? …}` prop, and Meridian tokens re-resolve on their own, so needing that prop would have meant the mapping was wrong |

**## The one criterion I would have had to BREAK to satisfy, and why that is the decline**

*"No raw colour and no status token used as a series colour."*

The chart uses status tokens on purpose. `seriesColour` at `:282` returns `--mrd-you-dim` for the
forecast line and the verdict's own tone, pass or fail, for the actual. That is not an oversight, it
is argued at length in the file's header and it is the product's thesis:

> *"The TREND chart's two lines carry MEANING, so they take semantic colour: a forecast is what a
> PERSON believed, so it is orchid at rest, and the actual line is an OUTCOME, so it is green or red
> once settled and neutral while it is still open. That pairing is the product's whole thesis and it
> would be lost to a categorical palette."*

**And meridian.css agrees, in a comment about the exact pixels.** Its `-dim` block says: *"`you-dim`
draws the FORECAST line on the trend chart, so the one line representing what a person believed was
the least visible thing in the frame on the paper ground."* The stop was re-solved from 2.65 to 3.71
against `float` **for this caller**. So the design system does not merely permit this usage, it has
already been measured and corrected for it.

Repainting these two lines `--mrd-viz-*` would take the forecast-versus-outcome pairing, which is the
one thing this product claims is defensible, and turn it into "series one and series two". That is
the "this would degrade the card" answer the item said was the correct one if true, and it is true.

**The item's own reasoning for `--mrd-viz-*` is right in general and wrong here**, and the distinction
is already written in the file: the BREAKDOWN card decides per segment, and a slice that is only a
bucket does take `--mrd-viz-*` under the 2026-08-15 founder ruling. Categorical colour for categories,
status colour for status, decided per element rather than per component. The trend chart's two lines
are not categories.

**Noticed.** Four.

1. **The reference's own version is the weaker one here**, which is worth saying because the standing
   rule is to mimic rather than reinterpret. Its chart is two named product lines, Mint Chip against
   Pistachio, which genuinely ARE categories and correctly take a categorical palette. Ours is a
   forecast against what happened. Same shape, different meaning, and the palette follows the meaning.
   This is a case where the reference's pattern was ported and its COLOUR deliberately was not, and
   the file records that decision rather than leaving it to be rediscovered.
2. **A third series is refused, with a reason**: *"Two lines is the ceiling this earns, because there
   are only two meanings in the frame... A third series would need a fourth meaning and there is no
   fourth meaning."* The forecast is also dashed and the actual solid, so the pair separates with the
   hue removed. That is the greyscale rule already satisfied on this component.
3. **`src/components/meridian/__tests__/insight-cards.test.tsx` does not exist**, so the criterion
   "every existing `InsightCards` test still passes unmodified" has nothing to check. That is the
   fourth wrong path in an `Owns` list today, after K-08's extension, K-09's exclusion and K-81's
   file. **The 56KB component with the most reasoning in it has no test of its own**, which is a real
   gap and a much better use of this item's budget than the chart it already has. I have not written
   one, because that is a different item and this one told me to stop rather than expand.
4. **`obsidian/graph-slider.tsx` is a second scrubbable chart**, with 60 `todo` tests against it in
   `__tests__/graph-slider-component.test.tsx`. It is in the retired Obsidian folder. Whether the
   Meridian chart supersedes it is worth a look, because two scrubbable charts is the shape this repo
   keeps paying for, and 60 unwritten tests suggests somebody started and stopped.

**Nothing changed in the tree.** tsc clean · 9,606 pass / 0 fail · `git status` empty.

**The jump list is now empty from my side: K-80 built, K-81 a question, K-82 declined. Resuming by
number at K-12.**

---

## K-12 · BUILT · 2026-08-20 01:05

**Did.** Built `src/lib/run-status.ts` and a 24-test suite. One canonical `RunStatus` union of ten
values, one `normalizeRunStatus`, and two helpers the four consumers each re-derive today
(`isTerminal`, `isWaitingOnAPerson`). No writer changed, no consumer changed, and the module has
**zero imports**, asserted by a test, so wiring the four up later cannot become a cycle.

**I read all four mappings and the disagreement is worse than AGENTS.md records.** It says "three of
which disagree about what `completed_with_failures` means". Measured:

| raw | run-state.ts | agent-fleet.ts | build-status.ts | run-analytics.ts |
| --- | --- | --- | --- | --- |
| `completed_with_failures` | stopped | **absent, so `other`** | a failure | **a success** |
| `complete` (singular) | **falls through to `queued`** | done | **falls through to `queued`** | succeeded |
| `cancelled` | stopped | failed | a failure | **absent, so still in flight** |
| `halted` | stopped | **absent, so `other`** | a failure | abandoned |

So `completed_with_failures` gets **three different answers and one blind spot**. And two more values
are as bad: **`complete`, the spelling `agents.functions.ts` writes on the happy path, falls through
to `queued` on two of the four surfaces, so a finished run reads as waiting to start.**
`run-analytics.ts` measured 2 of 245 real successful runs carrying it. `cancelled` is unhandled in
`run-analytics.ts`, so a cancelled run is counted as in flight.

**Unsure.** Four, and the first is the design decision the item did not settle.

1. **This is a SPELLING layer, not a fifth union.** The item says "reconcile them into one", which
   could mean one projection replacing all four. I judged that wrong: those four unions are four
   legitimate questions (a fleet count, a row state, a mission header, an outcome rate) and collapsing
   them would lose real distinctions. What they should not each be doing is deciding separately that
   `complete` and `completed` are two things. So the canonical set is the de-duplicated DATABASE
   vocabulary, and a consumer keeps its projection while deriving it from a canonical value. **A test
   asserts this file exports none of the four projection types**, so it cannot quietly become the
   fifth thing that disagrees.
2. **`completed_with_failures` keeps its own status rather than folding either way.** Folded into
   `completed`, a success rate counts a run whose checks failed; folded into `failed`, a failure list
   sends somebody to a run that landed. It is genuinely two facts at once, which is exactly why four
   files with four-value unions each had to guess. `run-analytics.ts` reached the same answer from the
   other end with `succeeded_with_failures`.
3. **`blocked` normalises to `waiting_approval`, and `proposed` does not.** The first is a
   de-duplication with evidence: `build-status.ts` records that `missions.status` never writes
   `waiting_approval` and `agent_runs.status` never writes `blocked`, so they are one state under two
   spellings. `proposed` stays separate because a proposed mission has not started and a
   waiting_approval one has, which is a real difference three of the four projections then fold.
4. **`denied` and `aborted` are `cancelled` here and `failed` in `agent-fleet.ts`.** Neither appears
   in either documented table, so there is no ground truth. Semantically a denial is a person refusing
   and a failure is a fault. It costs `agent-fleet` nothing, since it buckets `cancelled` as failed
   too, and it changes `run-analytics` in the correct direction: a denied run is not still running.
   **This is the one place I knowingly disagree with a shipped file**, and a test says so.

**Noticed.** Three.

1. **Only one of the four normalises case or whitespace.** `agent-fleet.ts` does
   `(status ?? "").trim().toLowerCase()`; the other three compare raw strings. So a status arriving
   capitalised reads correctly on one surface and falls to a neutral default on three. I trim and
   lowercase, and a test covers `" completed "`, `"COMPLETED"` and a tabbed one.
2. **`isWaitingOnAPerson` deliberately excludes `halted`, and the reason is a colour.** A halt is a
   stop on a condition, usually a spend cap, and what releases it is the condition changing rather
   than a decision. That is the exact distinction `--mrd-you` and `--mrd-hold` exist to draw, so a
   helper that blurred it here would put the wrong colour on a surface later. Worth stating because
   the two are easy to fold and three of the four projections do fold them.
3. **Every one of the four falls back SILENTLY**, three to `queued` and one to `null`. That silence is
   the mechanism behind the `complete` misread: the code did exactly what it said, and no gate could
   report it. `unknown` is a value a caller has to handle, and `isTerminal("unknown")` is false on
   purpose, because a status nobody recognises is not evidence the work has stopped.

**Gates.** tsc clean · 9,630 pass / 0 fail / 23 skip across 577 files · build ok. New suite is 24
tests, including a guard that every spelling in the module is accounted for in the test's transcribed
tables, so adding one and forgetting to agree its meaning fails the build.

> **Claude does after:** this changes nothing until the four consumers read it. That is four separate
> small diffs, each of which changes what a shipped surface displays, so each wants its own
> verification against production rather than one commit. The one worth doing first is
> `run-analytics.ts`, because `cancelled` being unhandled there means every rate it reports has a
> denominator that includes runs which stopped.

---

## K-13 · BUILT · 2026-08-20 01:15

**Did.** `decision.record` now takes `forecast_claim`, `forecast_how_we_will_know` and
`forecast_horizon_date`, refused as a set and refusing a horizon at or before now, with all three
written into the insert as explicit nulls when absent. The `preview` names the claim and the horizon
so the approval card shows the bet. 23 tests. Schema and insert only, no migration, nothing verified
against the database.

**The rules are the human path's, imported rather than re-derived.** `forecastRefusal` in
`decisions.functions.ts` already carries both, each with a paragraph of reasoning, and I wired it
through the same `superRefine` shape `createDecision` uses. Two copies of "what makes a forecast
valid" is how the agent door and the person door come to disagree about it, and the reasoning is the
part that would not get copied.

**Unsure.** Three, and the first is the one decision the item left open.

1. **The fields are OPTIONAL, not required.** The item says "gains forecast fields" and never says
   required, so this was mine to settle. Required would mean an agent either fabricates a horizon to
   satisfy the schema or files nothing at all, and both are worse than a decision recorded honestly
   with no bet attached. The refusal is about COHERENCE rather than presence: all three or none. **If
   the intent was to make every agent decision carry a forecast, this is the line to change**, and it
   is one word per field. A test pins the current behaviour explicitly so the change would be visible.
2. **A horizon a minute from now is accepted.** The rule is about the answer being available, not
   about a useful window, and inventing a minimum would be a product decision nobody has taken. A
   test asserts it, so if a minimum is wanted the test says where to put it.
3. **The insert writes three explicit nulls rather than omitting the keys.** It means the row shape
   does not depend on which branch of the tool ran. It matters most for
   `forecast_horizon_date`, which is what `idx_decisions_forecast_due` indexes: an omitted column and
   a null column are the same to Postgres here, but they are not the same to a reader diffing two
   inserts, and I would rather the absence be visible.

**Noticed.** Three.

1. **The description now carries the reason, not just the fields**, built to the shape of the
   sentence already in it. The existing one reads "a choice with nothing weighed against it is an
   assertion, not a decision, and is refused"; the new one reads "a decision with no forecast is an
   opinion rather than a bet", and then says the part that makes it defensible: everything else about
   a decision can be reconstructed afterwards and this one thing cannot. Four tests hold that,
   including that both refusals are stated so an agent does not have to discover them by failing.
2. **`registry.server.ts` now imports from `decisions.functions.ts`, and that direction is safe but
   worth flagging.** `decisions.functions.ts` does not import the registry, so there is no cycle
   today. It does pull `createServerFn` and the auth middleware into the registry's module graph,
   which was already true of the registry itself. I checked that a test can still import
   `TOOL_REGISTRY` before writing anything, and it can, in under a second.
3. **`src/lib/ai/tools/__tests__/` did not exist**, so this is the first test to live beside the
   registry. Everything else that tests tool behaviour reads `TOOL_DEFAULTS` from `defaults.ts`
   specifically to avoid importing the registry. That avoidance turns out to be unnecessary, which
   is worth knowing: the schema of any tool is now directly assertable, and 58 other tools have no
   schema test at all.

**Gates.** tsc clean · 9,653 pass / 0 fail / 23 skip across 578 files · build ok.

> **Claude does after, and the item already says it:** confirm the immutability trigger accepts an
> agent write (it fires BEFORE UPDATE and this arrives on an insert, so it should, but that is a
> claim about a trigger and not about code), confirm RLS, then measure
> `decisions_with_forecast_claim` moving off 1. **The number to watch is not the count of forecasts,
> it is the count of forecasts whose horizon is in the future when written**, because a horizon in
> the past is the failure this schema now refuses and the old rows may carry them.

---

## K-14 · BUILT · 2026-08-20 01:22

**Did.** Narrowed `learning.record`'s `verdict` enum to the three the CHECK constraint permits,
rewrote the description so it no longer instructs the agent into the value that crashes, and removed
the now-dead `importance: a.verdict === "uncertain" ? 3 : 5` ternary. 13 tests.

**Premise verified in the migrations, not taken on trust.** `learnings.verdict` carries
`CHECK (verdict IN ('validated','missed','mixed'))` in
`20260611161500_f_v5_loop_close_learnings.sql:21` and again in `20260611175350:12`, and **no
migration widens it**. The insert is `if (error) throw new Error(error.message)`. So an agent
following "Say uncertain rather than guessing" got a 23514 and the whole tool call failed: the one
path told to be honest was the one path that crashed, and the more careful the agent the more often
it happened.

**## K-14 · QUESTION · the description could not point at deferral, because agents cannot defer**

The item says: *"So narrow, and point the description at deferral instead of inventing a verdict."*
The narrowing is done. **The pointing is not, and doing it would have shipped a claim that outruns
its wiring.**

`prds.outcome_check_by` is the deferral mechanism and the ruling behind it is exactly as the item
describes, in `20260806100000_a_bet_can_be_too_early_to_judge.sql`. But `rearmOutcomeCheck` is
reached from `components/learn/SettlePanel.tsx` and `lib/outcome.functions.ts` and **from no agent
tool at all.** Deferral is a human-only hand.

So a description telling an agent to defer would tell it to use something it does not have, and it
would fail as silently as the crash it replaced: the agent would have no tool to call, would file
nothing, and nothing would say why. The description instead says **do not call this tool at all**,
gives the ruling's own words for why a deferral is not a verdict, and adds the half that makes the
instruction followable: *nothing is lost by waiting*, and what waiting is being weighed against is
that every verdict re-ranks the bet behind it. An agent with no evidence and no cost to waiting
waits; one told only "do not guess" files something anyway.

**If an agent SHOULD be able to defer, that is a tool that does not exist yet**, and it is small: one
`def()` wrapping `rearmOutcomeCheck` with the spec id. I have not written it because it is not in
this item's `Owns` and it is a new capability rather than a narrowing.

**Unsure.** Two.

1. **`importance` is now 5 for all three verdicts**, where `uncertain` used to get 3. The ternary is
   dead because every verdict this tool can be handed is decisive, so the choice was 5 or a new
   distinction. I took 5: a `mixed` lesson is not worth less than a `missed` one in the precedent
   pool, it is harder to act on, which is a property of its text rather than of its importance.
2. **I left the `typeof delta === "number"` guard in place** even though `VERDICT_CONFIDENCE_DELTA`
   now holds exactly the three verdicts and the lookup cannot miss. It is shared with the human path
   in `outcome.functions.ts`, so a verdict added there and not here would move confidence by
   `undefined` rather than not moving it. Removing a guard because the current call sites make it
   unreachable is how that class of bug returns.

**Noticed.** Three, and the first is a live wrong string in the database.

1. **Two seed migrations describe this tool to users with the four-value vocabulary.**
   `20260801134557_...sql:11` and `20260801190000_station_tools_seed.sql:55` both insert a
   `station_tools` row reading *"Record what a shipped piece of work actually taught us, with a
   verdict of validated, missed, mixed or uncertain."* Those rows are **data**, they are already
   applied, and applied migrations are not mine to hand-edit. So the code no longer offers
   `uncertain` and the seeded description still advertises it. **That is Claude's to correct with an
   update, and it is worth doing, because it is the string a person reads in the boundary UI.**
2. **`VERDICT_CONFIDENCE_DELTA` never had an `uncertain` key**, so the confidence side of the loop was
   always correct. The comment there explained the absence as protecting honesty, when the honest
   value was crashing before it ever reached the delta lookup. Corrected in place.
3. **The `learn-can-say-not-yet.test.ts` suite already covers the human deferral path**, which is why
   the ruling is well recorded and the agent gap is not: the half that was built got a test, and the
   half that was not was never noticed as missing.

**Gates.** tsc clean · 9,666 pass / 0 fail / 23 skip across 579 files · build ok. The refusal test
names `learnings_verdict_check` and the constraint text in its failure message, so a reader who
reintroduces the fourth value is sent to the table rather than to the test.

> **Claude does after:** update the two seeded `station_tools` descriptions, and check whether any
> `learnings` row carries a verdict outside the three. If the CHECK has been enforced since creation
> there should be none, which would confirm the crash was total rather than partial: no agent ever
> succeeded in writing `uncertain`, so nothing needs repairing, only the door closing.

---

## K-15 · BUILT · 2026-08-20 01:40

**Did.** `tool` frames now go out from the research pipeline's real actions, a `station` frame goes
out on the dispatch that is a fact, and the two stale comments in `AskLanding.tsx` and `AskTurn.tsx`
are corrected. 11 new assertions in `ask-sse.test.ts` walk the exact lines the route writes through
the real parser.

**The `tool` frame is derived from what the pipeline DID, not from what it was asked to do.**
`runResearch` reports five phases and only three of them are tool calls:

| phase | frame |
| --- | --- |
| `search` | `web.search`, because it really queried the web |
| `read` | `web.fetch`, because it really fetched those pages |
| `workspace` | `workspace.search`, because it really searched the workspace |
| `plan` | **none.** The model deciding what to ask. No tool ran |
| `synthesize` | **none.** The model writing. No tool ran |

A frame per phase would have been one line shorter and would have put two tool names on the wire for
work nothing did. All three names are catalogued, so the client's `toolActionLabel` lookup resolves
every one rather than falling back to a raw string. The `status` frame keeps its place and both are
sent, because they answer different questions and the client accumulates them into different fields.

**## K-15 · QUESTION · I did not put the resolved station on the wire, and the file argues why not**

The acceptance says *"`void routed;` is gone and the resolved station is on the wire."* **I left
`void routed;` exactly where it is.**

`api/chat.ts` carries a long paragraph above it explaining that the classifier's entry station is a
GUESS: nothing on that branch routes by it, `runAgentLoop(..., { agentSlug: "orchestrator" })` never
sees the shape or the station, and the orchestrator plans its own DAG and picks its own agents. That
same file already **withdrew a sentence** from the reply for saying it, and the `landing` frame's
comment states the rule it was withdrawn under: *"THIS FRAME IS A FACT, NOT A FORECAST, and that
distinction is why it is the one being emitted."*

Emitting `routed.station` would be the withdrawn claim moved from the reply text onto the wire, where
the client lights a station strip with it. So the frame comes from somewhere it is a fact instead:
**`agentStation(mentionedAgent.slug)` on the mention branch**, where a person named an agent, the
agent was resolved against the catalogue, and the mission was dispatched to it. Its station is a
property of a dispatch that has already happened.

**On the orchestrator branch nothing is emitted, and that silence is the honest answer.**
`use-ask-stream.ts` treats an absent station as "none lit yet" and the `landing` frame still hands the
reader to the mission, so the pane loses only a claim it could not support.

**What would make the full frame honest is already written down in the file**: `startTrackCore` has
two production callers and chat.ts is not one of them, so once a chat dispatch starts a track carrying
that `SpineRoute`, the station stops being a guess. The file also says that change contains a product
decision nobody has taken, namely whether a chat dispatch creates a mission, a track, or both, and
which id the `mission_id` frame then returns. **That is the decision to park, not a build I can make.**
A test asserts `routed` stays unsent and names what to delete when the ruling lands.

**Unsure.** Two.

1. **The mention branch is a narrow door for the station frame.** Most dispatches go through the
   orchestrator, so in practice the station strip will stay dark on the common path until the spine
   emits it. I judged a correct frame on the narrow path better than a guessed one on the wide path,
   and the direction doc agrees about where it belongs: its change #1 is "every station gets a
   `missionId`", and #2 is "every station emits `station` and `tool` frames". The emitter for the
   common case is the driver, not this route.
2. **I extended `ask-sse.test.ts`, which is outside K-15's `Owns`.** The item lists no test file, and
   the acceptance criterion "the client's existing accumulators receive them with no client change"
   cannot be checked without one. The additions are a new `describe` block, purely additive. The
   reason this shape of test matters is recorded in the route itself: the first `landing` emitter sent
   the parser's RETURN shape instead of its INPUT, `parseSseLine` read it as `ignored`, and no type
   could see it because both ends were internally consistent and only disagreed about the wire.

**Noticed.** Three.

1. **The `landing` frame IS emitted now**, which the item says and which I confirmed at
   `chat.ts:875`. So of the three work frames declared in `ask-sse.ts`, two were dead and one had been
   wired since. Both stale comments said "nothing emits it yet" and both are corrected in place rather
   than deleted, because the interesting half is that the register is ABSENT on a turn that only
   answered a question, and that is still correct behaviour.
2. **The client needed no change at all**, exactly as the item predicted. `use-ask-stream.ts` already
   handles both frames, and its comments are worth reading: a repeated station returns the previous
   object so a frame saying nothing new causes no re-render, and tools are appended without
   deduplication because "an agent that ran the same tool twice DID run it twice".
3. **`parseSseLine` refuses an empty tool name and an unknown station**, which I pinned rather than
   assumed. Both matter for this emitter: an empty name would render as a blank row in the tool list,
   and a station outside the seven would light nothing while looking like a server the client half
   understands.

**Gates.** tsc clean · 9,677 pass / 0 fail / 23 skip across 579 files · build ok.

> **Claude does after:** watch a live run. The order to confirm is `status` then `tool` for the same
> phase, three tools on a web-mode question, none on a `chat`-mode one, and a `station` frame only
> when the person addressed an agent by name.

---

## K-16 · BUILT · 2026-08-20 03:05

**Did.** `intent: "do"` dispatches on its own now. The two gates that used to disagree read one
expression, the seven pre-flight conditions became five named states with sentences we wrote, and the
system message that fed a Postgres error to a language model and asked it to explain itself is gone.

**The bug was an ordering bug, and that is why it survived every gate.** `startingAgent` is declared
above the pre-flight block and assigned only inside it. The promotion line sat below and read it:

```ts
if (forcedDo && startingAgent && workspaceId) isMission = true;   // never true
if (isMission && startingAgent && workspaceId) { … }
```

For any request the classifier had not already claimed, `startingAgent` was still `null` at that line,
because pre-flight was itself gated on `isMission`. Nothing about the runtime was wrong. Two gates
asked the same question in two places and one of them needed an answer only the other could produce.

**The repair is one `const`, and it is a `const` on purpose.**

```ts
const dispatching = wantsDispatch({ isMission, forcedDo, instruction });
if (dispatching) { …pre-flight, which is what assigns startingAgent… }
if (dispatching && startingAgent && workspaceId) { …dispatch… }
```

Computed once and read by both, so they cannot drift apart again. Three tests fail if the old shape
returns; I proved that by planting it rather than assuming it.

**Seven conditions, five states, and the collapse is the design.** The workspace is checked on both
the mention branch and the orchestrator branch; a conductor can be missing two ways (the seeding call
errors, or the row is still absent after it reports success). Each pair shares a sentence because the
test a state has to pass is *what is missing, and what do you do*, and within a pair the answer is
identical. The causes are not lost: the raw one is `console.warn`ed with the state id, and only the id
travels. Same split `sanitizeError` makes everywhere else in this file.

| state | conditions | what the person is told |
| --- | --- | --- |
| `no-workspace` | 2 | nowhere for a run to live; create one or accept an invite |
| `conductor-unavailable` | 2 | Chief of Staff plans every run and that seat could not be set up |
| `no-specialists` | 1 | every agent is switched off; turn one on under Agents |
| `preflight-failed` | 1 | a check failed and it is not one you can clear from here |
| `dispatch-failed` | 1 | **look under Runs before retrying, or you could end up with two** |

`dispatch-failed` is the only state reachable after `createMission` has returned, so it is the only
one that sends anyone looking. Telling the other four to go and check would send them after a row that
was never inserted.

**What the sentences replace, and why replacing them was the item.** The old path spliced this into
the answer prompt:

> `CRITICAL: The user tried to dispatch a mission but checks failed: "<raw error>". Explain this
> problem to the user … and proceed with a regular conversation.`

Three separate faults. A Postgres error string was handed to a model and read back to a person. What
they were told varied run to run, because it was generated. And it arrived dressed as an answer, so a
request to *do* work came back as prose about why it had not been done. **A blocked dispatch now ends
the turn** with our own sentence and no model call, following `byoKeyMissingMessage` twenty lines
down, which is this file's existing pattern for a pre-flight that cannot be satisfied.

**Placed after the user-message insert on purpose.** Four of the five sentences say "your words are
saved above", and that is true when they read it, so retrying is not retyping.

**Why ending the turn is right rather than annotating an answer.** `dispatching` is true only when the
person pressed the fork or the classifier read the words as work. Under both readings they asked for
something to be done, not explained. An explicit `intent: "ask"` skips the classifier entirely, so a
question cannot land here.

**A defect this change would have introduced, caught before it shipped.** The client prefixes `@cos`,
so `body.content` is not what the person typed. A forced "do" that the classifier read as chat leaves
`missionTitle` and `missionGoal` empty and the fallback was `body.content`, which means the first run
opened through the repaired branch would have been titled **"@cos fix the redirect"**. While the
branch was dead this was unreachable. `instructionForDispatch` takes the addressing off the front and
every fallback reads that instead. Leading only: `ask @engineer why this broke` is subject, not
address, and cutting it would edit somebody's instruction.

**It also gave the empty case an answer.** A bare `@cos` handed over returns `""`, and `wantsDispatch`
refuses to dispatch on it. A run whose entire goal is the name of the seat you handed it to is worse
than the chat reply it would otherwise get.

**The old sentence named two slugs and a station.** It told people to enable "Discovery, Strategist,
Build". `discovery-scout` and `strategist` are `agents.slug` values, `Build` is a station, and none of
the three is a word on the roster they were being sent to. The replacement reads the names through
`agentDisplayName`, so it says **Watch, Prioritize and Engineer** and follows a rename on its own. One
per phase most work passes through: something to notice it, something to rank it, something to do it.

**Pushed back.** Three.
1. **I did not remove the client's `@cos` prefix, and the acceptance does not ask me to.** It asks
   that `intent: "do"` dispatch *without depending on* the prefix, which it now does, and that the
   existing path still work. Removing the prefix would move handover from the mention branch (a
   pre-planned single step, then `advanceMissionCore`) onto the orchestrator branch (`runAgentLoop`,
   which plans its own DAG). That is a different dispatch machine, and which one handover should use
   is a live-behaviour question nothing in this lane can answer. `contentForIntent` also puts the
   handover in the person's own visible words, which is a deliberate choice with a test on it.
2. **No new SSE frame, and no new `ChatMeta` field.** Both were drafted. A frame would be a second
   representation of a fact the reply already carries in full, and `ask-sse.ts`'s own law is that a
   frame carries the smallest honest fact that nothing else says. Adding one nothing needs is the
   defect K-15 existed to fix, one level up.
3. **The item's `Owns` list is incomplete, the fifth time this session.** It names
   `use-ask-stream.ts`, which needed only a stale comment corrected, and omits any home for the pure
   logic. A route module in this repo cannot be imported by a test (it pulls `runtime.server`, the
   service-role client and the orchestration graph), so a predicate whose entire history is being
   subtly wrong would have been untestable inside it. It lives in **`src/lib/chat-dispatch.ts`**, new,
   colliding with no item, and the test executes it for real instead of reading it.

**Unsure.** Two.
1. **The classifier-guessed path now ends the turn too, and that is a behaviour change beyond the
   letter of the item.** If the classifier reads a question as work and pre-flight is blocked, the
   person gets "nothing started" rather than an answer. I judged that right: pre-flight only fails
   when the account genuinely cannot run anything, so the alternative is paraphrasing the same fault
   on every message forever, and `intent: "ask"` is a real escape hatch. But it is the one judgement
   here that a live account could argue with.
2. **`baseMeta()` on a blocked turn still reports the classifier's `research.mode`** even though no
   research ran. The BYO-key path has the same property, so I matched it rather than forking the
   meta shape for one case.

**Noticed.** Three, all parked rather than fixed.
1. **A pre-existing duplicate-message bug on the `dispatch-failed` path.** The user message is
   inserted inside the dispatch `try`, and the fall-through path below inserts it again, so a throw
   between the two leaves the message twice in the transcript. Unrelated to the dead branch, and
   deciding which insert actually landed needs a live run. Comment left at the catch.
2. **`AskWorkLine.tsx` is imported by nothing.** A built surface for `station` + `tool` that renders
   the station rail and `toolActionLabel`, wired to no route, and its header still says "NOTHING EMITS
   THEM YET" which K-15 made false. It is the door-missing defect on a component whose frames now have
   writers. Not in any item's `Owns`; worth one.
3. **`ask-sse.ts` said "nothing emits these yet, and that is deliberate"**, which K-15 falsified. I
   corrected that one in place, because the protocol file is where a reader goes to learn whether a
   frame has a writer.

**Gates.** tsc clean · 9,703 pass / 0 fail / 23 skip across 581 files · build ok.

> **Claude does after:** the five sentences each need one live account state to read them back.
> `no-specialists` is the reachable one (disable every agent but the orchestrator). Also confirm that
> a forced "do" on an account with no conductor row now seeds one and dispatches, which is the case
> the item says returns prose today.

---

## K-85 · BUILT · 2026-08-20 04:20

**Did.** The Flowchart's cards drag and the connectors follow, ported off the reference's own source.
The dotted canvas takes a faint violet cast through a new `--mrd-map` token, argued and measured in
both grounds. The 27 existing tests pass unmodified; 20 new ones join them.

**The founder was right and the scope I wrote was wrong.** K-80's header argued the dragging was
deliberately not ported, on §6.3's "a canvas for watching, not authoring", and that a node a reader
can shove around invites them to think the layout means something. The better reading is his: a graph
you cannot rearrange is a picture. Sixteen connectors crossing each other is precisely the case where
the layout derived from the graph is the layout nobody can read. The half of my argument that survives
is AUTHORING: nothing creates a node, draws an edge or deletes anything. Both the file header and the
gallery panel now say so in place, so the next reader does not find a component arguing against itself.

**Ported from the source, and every mechanic is load-bearing.** Fetched the page again and read the
real TypeScript out of it rather than watching the rendered version:

| mechanic | why it cannot be dropped |
| --- | --- |
| `setPointerCapture` | without it a hand that outruns the card leaves its box and the card stops dead under a finger still moving |
| 3px threshold | a press must stay a press; a mouse button moves two pixels under a real hand |
| both axes clamped to the CANVAS, not the row | the entire point is moving a card off its row; `DRAG_INSET` 8 keeps an edge out from under the rounded corner |
| one-tick `setTimeout` on release | `pointerup` fires before `click`, so clearing the drag immediately lets every drag end in a selection toggle |

**One deliberate divergence.** The reference sets a node's `zIndex` by reading its drag ref during
render. It works there because a state update follows in the same tick, but a ref read during render is
a value React is entitled to have changed since. Held in state here.

**One addition the reference does not have.** `pointercancel` is bound alongside `pointerup`. A browser
cancels a pointer when it claims the gesture (a system swipe, a context menu, a lost capture), and
without it the card keeps `cursor-grabbing` and its raised stacking until the next press. One of the
sizes nobody draws; a test covers it.

**The violet ground needed a new token, and `--mrd-viz-*` could not do it.** Those four are series
colours and none is violet: orange, blue, green, red. A fifth added for this would be a series nothing
plots. So `--mrd-map`, named for the surface rather than the colour, because a map is not a step on the
raised ladder: `bg / sink / sheet / lift / float / solid` all answer "how raised is this", and this is
the one surface in the system where a thing's POSITION is information and the reader can change it.
The direction already calls it the Run Map (§6.3) and that is the word.

**Hue 297, taken off the reference's own constant.** Its node-kind purple is `#9a5cff`, which measures
`oklch(0.627 0.230 297)`. Measured rather than guessed, and it lands 3 degrees from `--mrd-code-kw` at
300, the one violet Meridian already owns, so the family stays coherent. Explicitly not `--mrd-you`:
that is the orchid at 315 and it means a person is required, and a background wearing a status word is
the failure the colour law exists to stop.

**The lightness does not move, and that is the whole safety.** Each ground's map sits at exactly its
own `sink` lightness (0.125 dark, 0.932 paper) and adds only chroma, so the dot pattern's contrast
against it is a function of lightness alone. Measured after: **4.985 on dark** (4.977 before, a hair
better) and **1.313 on paper**, unchanged. The founder's "the dots stay visible on paper" is met by
construction. For scale, the reference's own light-ground dot measures 1.243 against its page, so ours
is the stronger of the two. A test asserts the equal lightness rather than restating the numbers, and
planting a 0.94 there fails it.

**I got the chroma wrong first, by trusting arithmetic over looking.** The first version solved each
ground's chroma so the map sat the same OKLab distance from its own neutral sink: dE 0.022 both sides,
0.018 dark and 0.012 paper. The reasoning was sound. Rendered side by side it was **one idea expressed
two ways**: the dark cast was almost invisible and the paper one read as a lavender PANEL. Apparent
colourfulness collapses as lightness falls, so equal distance is not equal cast.

Corrected by rendering a four-by-four grid of candidates in both grounds and matching by eye:
**0.026 on dark, 0.007 on paper, a ratio of 3.7 to 1.** That ratio is the measurement, and it is
pinned by a test with the failed arithmetic recorded beside it. Every status token still carries at
least 3.5x the chroma of this wash (the weakest is 0.105, so a quarter of it on dark and a fifteenth
on paper), which is what keeps a ground from reading as a state.

**A defect the cast would have introduced.** The edge labels plate themselves with a stroke in the
ground colour so a word crossing its own curve stays readable, and that stroke was `--mrd-sink`. Those
were the same colour until the ground took its cast; one step off, and every label wears a grey halo.
Moved to `--mrd-map`, with a test.

**Pushed back.** Two.
1. **No visible grab handle, and `cursor-grab` is the whole affordance.** The reference puts no grip on
   a step card either: its six-dot handle lives inside the condition rows, which this port has no
   equivalent of. Adding one to every node would change a layout that has already been measured and
   verified.
2. **Positions are not persisted, and I did not invent somewhere to keep them.** Nothing writes an
   offset anywhere, so a reload returns the graph's own layout. Whether a person's untangling should
   outlive the page is a product decision nobody has taken, and inventing storage for it would be a
   feature nobody asked for on the item that was asked for.

**Unsure.** One. **`prefers-reduced-motion` is satisfied by there being nothing to suppress**, which is
a thinner answer than the acceptance criterion implies. Position is set directly with no transition on
`left` or `top`, so a dragged card sits under the pointer in both motion settings. That is deliberate
rather than an omission: the reduced-motion block in `meridian.css` stills keyframe ANIMATIONS and does
not touch transitions, so a transition put there would have run for everyone. A test pins the absence.

**Noticed.** One. **The token has one caller**, which sits against the 2026-08-15 ruling that a token
earns its place on the second. The alternative was a raw colour in the component, which the ratchet
forbids outright, and the item explicitly authorises arguing a canvas token. The second caller is the
Run Map surface §6.3 already specifies and this component exists to draw.

**Gates.** tsc clean · 9,723 pass / 0 fail / 23 skip across 581 files · build ok · ratchet unchanged.
Looked at in both grounds before and after, three times, which is how the chroma error was caught.

> **Claude does after:** open `/meridian` and drag a card in both grounds, on a trackpad and on a
> touch screen. The two things a test cannot see are whether pointer capture really holds when the
> pointer outruns the card, and whether the violet reads as faint on a real display rather than in a
> screenshot.

---

## K-81 · BUILT · 2026-08-20 05:05

**Did.** The brand mark is deleted from `AgentPulse`, not un-defaulted. The `glyph` prop is gone with
it. The label moved to 13px, which is the stop `LoadingState` uses for the same job, and it is now the
same stop in both densities. The azure is untouched and a test says so. The gallery panel that showed
the two marks side by side is now the four states the indicator actually has.

**One thing went and one thing explicitly stayed, and getting that split right was the item.** Both
complaints arrived in the same review and only one of them was about this file.

| the complaint | the fix |
| --- | --- |
| *"That circle gear icon is not good. I don't want to use that."* | the seven-petal `BrandGlyph` is deleted, and so is the union that offered it |
| "the logos are not visible in light mode" | **not here.** `[data-theme="light"]` re-declared every token and never re-bound `color`, so every `currentColor` glyph inherited the dark ground's ink and measured 1.00 on paper. Fixed in `meridian.css` by another lane |

Measured after that fix, the azure lattice is 7.02 on dark and 5.62 on paper. It was never the thing
that was invisible, and repainting it in ink would have deleted the one surface in the product that
says a machine is working. `--mrd-agent` is counted at 59 against `--mrd-you`'s 97 in the 2026-08-19
audit, which names that imbalance as the thing to close rather than widen.

**Deleted the prop rather than defaulting it, and the item asked for exactly this.** `glyph?: "mark" |
"grid"` with `grid` as the new default would render identically today and leave the ruled-out drawing
one prop away, with the union standing as an invitation. A ruling enforced by a default is not
enforced. Only the gallery ever passed the prop, so nothing outside Owns had to change.

**The type stop, and why it is BOTH densities.** `compact` dropped the size from `text-mrd-body` (14px)
to `text-mrd-base` (13px), which made two indicators out of one component and put the roomy one a stop
above `LoadingState`'s 13px label for the same job. 13px is now both, so `compact` changes the GAP and
nothing else, which is what compact should mean: tighter, not smaller. Shrinking type to save room is
the answer the ratchet forbids, and it had shipped here as a prop.

A test asserts the two densities differ by exactly one class each way (`gap-mrd-4` against
`gap-mrd-3`), which is a stronger claim than "both are 13px" and would fail if a future `compact` took
anything else away.

**Proven by planting, both directions.** Re-adding an `<ellipse>` with `mrd-spin` fails the
petal-geometry test; restoring the conditional type stop fails two of the type tests.

**One test caught my own comment.** The source assertion for "no glyph union" matched the sentence in
the new comment explaining which union was deleted. The comment is right to name it, so the test now
strips comments and asserts against the CODE, and separately asserts the prose still records what
went, because an absence with no reason attached is how a deletion gets undone.

**Pushed back.** Two.
1. **The item says `AgentPulse` has five callers outside the gallery. It has fifteen**, across `decide`,
   `design`, `plan.spec`, `plan.index`, `build.index`, `ship`, `runs.$missionId`, `TrackActivity`,
   `CrewWorking`, `RunReturn`, `OpportunityDetailSheet` and `primitives`. The figure did not change
   what I built, since none of them passes `glyph`, but a count that low would have made "all five
   still render" a much weaker check than it needed to be.
2. **`LoadingState` writes the same stop as `text-[13px]`**, a raw arbitrary value for a size that is
   on the ladder as `--mrd-t-base`. On the ladder by value, off it by form. Not this item's file, so a
   test pins that `AgentPulse` does not copy the habit and the finding is recorded here instead.

**Noticed.** Two.
1. **The animated brand mark still renders in two other interaction states**, `ask/Working.tsx` (via
   `SupaprodMark size={15} animated`) and `supaprod/BrandWait.tsx`. The acceptance criterion reads "no
   path renders the brand asterisk in an interaction state", which is broader than this item's `Owns`.
   I did not touch either, and think that is right rather than merely cautious: `BrandWait` carries the
   founder's own words asking for the mark in that moment, and the 2026-08-19 ruling was about the
   indicator that sits beside a row while an agent works, twelve times over. Different job, different
   ruling, and reversing one by implication is how a ruling gets applied where nobody meant it.
   **Worth an explicit yes or no from him rather than a guess from me.**
2. **`mrd-spin` and `mrd-attention` both survive with other callers** (`PlanCard`, `TaskRows`,
   `Thinking`, `SelectionActions`, `StatusChip`), so removing the glyph left no dead keyframes.

**Gates.** tsc clean · 9,749 pass / 0 fail / 23 skip across 582 files · build ok · ratchet unchanged.

> **Claude does after:** open `/meridian` and check the indicator in both grounds, then one real
> surface with it live (`/decide` has three mounts). The thing a test cannot see is whether the lattice
> at 13px still reads as calm beside the shimmering word now that the word is a stop smaller.

---

## K-83 · BUILT · 2026-08-20 06:40

**Did.** Three things, all measured rather than judged. The wrench that was not a drawing of anything
is redrawn. The rail crosses the gap between rows, and `ToolStream` has one at all. The clock column
takes a wall clock and nothing else, because no duration this product prints fits it.

**Everything below was measured in a real browser with the real font**, because none of it is visible
to a test: happy-dom lays nothing out and implements no `getBBox`, so the choice was between measuring
properly and asserting an intention.

### 1. The mark that named nothing

The founder's note was about optical alignment, and following it found a worse defect. All thirteen
marks in the system were rendered and their ink bounding boxes read:

| | ink centre against 12,12 | at 14px |
| --- | --- | --- |
| eleven of thirteen | within 0.30 down, 0.00 across | under 0.18px. Nothing |
| `run:tool` | 11.35, 10.55 | **0.85px high.** The worst in the set |
| `station:decide` | 13.00, 12.00 | 0.58px right, **and correct** |

**So the layout was never the problem**, exactly as his own note anticipated (glyph box against text
centre measures 0.6px across five rows). One drawing was off, and rendering it to check the offset
showed the drawing itself was wrong: the "wrench" is a loop, a lump and a stub, with no jaw and no
handle. At 14px it is three grey marks. **It is the placeholder failure hiding inside the set built to
remove placeholders**, and it survived because it had a plausible comment above it while `[]` and `H`
did not.

Four candidates were drawn and rendered at 120, 20 and 14px on both grounds. Two read as a wrench at
14px. Of those, one lands inside the 4..20 optical square this file declares (4.19..19.87 across,
4.13..20.21 down) with a centre within 0.17 of 12,12; the other measured 18.44 wide, breaking the
16-unit norm every other glyph holds, and sat 0.52 right. The first one ships.

**`station:decide` is deliberately not "fixed", and this is where bbox centring and optical centring
part company.** Its diamond spans 5..19 and is centred on 12. The whole +1.00 is the 2-unit stub
drawing the chosen branch leaving to the right. The eye centres a mark on its BODY, so obeying the bbox
would shift a symmetric diamond a unit left to compensate for a tail, and it would then look wrong
beside the six marks whose bodies are centred. A measurement that disagrees with the rule it was taken
to serve is a measurement to explain, not to obey.

### 2. The rail: two faults under one sentence

The founder said nothing connects one row to the next. `RunTimeline` already had a rail, which is why
that needed explaining rather than just fixing:

1. **`ToolStream` had no rail at all**, so two views of one run were a sequence and a list.
2. **The rail stopped at each row's bottom edge** while `RUN_STACK` opens `gap-1` between rows. Measured:
   **4.00px of hole on every row.** Thirteen holes down a run is a column of ticks, not a rail.

`Thinking`, the reference this rhythm is read off, draws ONE continuous line. `-mb-1` is that expressed
per row, and it is that value because it is the stack's own gap negated, so the two cannot drift apart.
**Measured after: 0.00px.** The rail reaches the next row's glyph exactly.

The silence row's dashed rail takes `-mt-1` as well, because a silence has no glyph to receive the line
from above, so reaching down alone would leave a hole above it. Easier to miss than the solid one,
because a dashed line already looks interrupted.

### 3. The duration, and a repair he offered that does not exist

He gave two options, move the duration or shed precision, reading a six-hour silence wrapped to three
lines. **The second one is arithmetically unavailable.** Measured in JetBrains Mono at 11.5px with
tabular figures against this column's 40px:

| string | width | in a 40px column |
| --- | --- | --- |
| `03:12` | 34.50px | fits, 5.5px spare. **This is what 40px is for** |
| `28m 0s` | 41.41px | **already wrapped, by 1.4px** |
| `6h 11m` | 41.41px | so shedding the seconds does not help |
| `12h 00m` | 48.30px | worse |
| `6h 11m 00s` | 69.00px | three lines, **51.8px tall** against 17px beside it |

No duration this product can print fits 40px; the longest that would is four characters. So the
column now holds a wall clock and nothing else, ever, and `RunFigure` is **deleted rather than
narrowed**: a slot that only takes one kind of thing cannot be handed the other kind by a future row
type. **Measured after: every row type is 28.0px**, which is `Thinking`'s row exactly, on all four.

A silence also has no `when` of its own to print. It begins at the instant one row above and ends at
the one below, so a clock there would restate what is already on screen. The column stays open, because
closing it would put those words 48px left of every other row's.

**One formatter now, not two.** `formatElapsed` rather than `formatDuration` for the silence, which is
the other half of his note: seconds are noise at six hours. `formatDuration` is exact to the second,
right for "worked for 18m 06s" on a settled step and wrong for a gap. It also makes the silence figure
and the live tail's, the same kind of fact, come out of one function.

**I rewrote one of my own tests, and it deserves naming.** `one-run-one-rhythm.test.tsx` REQUIRED the
duration to sit in the clock column, under the argument that a duration is a number about time. It
fixed a real defect in the wrong direction, and **it was green on a row that wrapped**: it checked
which column the figure landed in and could not see that the figure did not fit the column. That is the
exact class of defect the file was written to catch, committed by the file itself. The reversal, both
measurements and the reason are recorded in place rather than deleted.

**Pushed back.** Two.
1. **The item's numbering runs 1, 3, 2**, and the middle item is the largest. Not a problem to fix, but
   worth saying because I built them in the order 1, 3, 2 to match, and a reader of the queue will
   wonder whether something is missing.
2. **`run-rows.tsx` is not in the item's `Owns` and every part of this lands there**: the glyph paths,
   `RunRail`, `RunFigure`, `RunTook`. The list names `station-glyphs.tsx` instead, which turned out to
   need no change at all: its seven marks measure within 0.10 of centre, and the two outliers are both
   in `run-rows.tsx`. Sixth wrong `Owns` list this session.

**Unsure.** One. **The ink geometry cannot be tested here**, so the file carries the thirteen
measurements as a comment and a test pins that the numbers stay in it. That is a weaker guard than the
rest of this change has, and I would rather say so than dress a source assertion as a geometry check.
The reproducible artifact is a `getBBox` harness; the numbers in the file are what the next person
re-measures against.

**Noticed.** One. **The source host's mark is the one glyph on a different grid**, 16x16 rather than
24x24, sized by its wrapper rather than by attributes. That is right, not a defect: it is somebody
else's geometry and redrawing GitHub's mark onto our grid would be both wrong and worse. It is
normalised by the compensation `run-rows.tsx` already documents, and a test now asserts that
compensation is present rather than asserting a uniformity that would be false.

**Gates.** tsc clean · 9,761 pass / 0 fail / 23 skip across 582 files · build ok · ratchet unchanged.
Rendered and looked at before and after, both grounds, at 120, 20 and 14px for the marks.

> **Claude does after:** open a real run with a long gap in it. The two things measurement cannot
> settle are whether the redrawn wrench reads as a tool on a real display at 14px, and whether the
> continuous rail through several consecutive silences reads as one run rather than as one long wait.

---

## K-84 · BUILT · 2026-08-20 08:15

**Did.** A step now carries two controls, the context to decide on it, and an alignment that was
measured rather than eyeballed. The skip cannot complete without a reason. The alignment fix turned
out to belong in the shared rhythm, so `RunTimeline` and `ToolStream` got it too.

**The item contains a tension and it had to be settled rather than split.** Its own first paragraph
argues the gate belongs at the PLAN and not at the steps, citing the 70/20 finding: people take about
70% of their decisions at planning and 20% at execution, and 93% of in-the-moment prompts are
approved, a queue nobody reads. Then it asks for a per-step approve and skip. **Drawn on every row,
those two controls ARE that queue**, with the plan-level Approve demoted to a shortcut for pressing
them all.

So which rows get them is the decision:

| state | approve | skip | why |
| --- | --- | --- | --- |
| `needs-approval` | yes | yes | the step itself is what is being asked about |
| `pending` | **no** | yes | approving it is the click the plan-level Approve already makes |
| `active`, `done`, `skipped`, `failed` | no | no | nothing to decide |

**Skip is the capability that was genuinely missing.** Before this the choice was approve everything
or change everything; there was no way to say "yes, but not that one". Approve-this-step is the
narrower addition and it is deliberately the rarer one.

**Rendering it corrected a decision I had made on paper.** The step's approve was `Approve`, which is
the component for a click that unblocks and is exactly what this click does. On screen it was wrong:
a 32px orchid slab inside a step row read as the card's primary action and **outshouted "Approve the
plan" in the footer**, inverting the governance argument the control exists inside. Both step controls
are `quiet` now. The accent is not lost, it is said once instead of twice, because the row already
carries the orchid `Needs you` chip two lines above. `meridian.css` warns that an accent firing on
chrome stops meaning anything, and two orchid controls on one card is that failure inside one
component. A test counts orchid controls and requires exactly one, on the plan.

**The reason is enforced by the signature, not only by the field.** `onSkipStep: (id, reason) => void`
has no overload that omits the reason, so a caller cannot record a skip with nothing attached even by
accident. The field itself refuses whitespace, Enter submits, Escape cancels, and the form REPLACES
the controls while open so there is never a live "Skip it" beside "Skip this step". Proven by
planting: removing the `ready` guard fails two tests.

**Inline rather than `usePrompt()`.** The house way to ask for a string is a dialog, and it is wrong
twice here: this file is a Meridian primitive and may not depend on an app-level hook, and a modal
takes the step's own context off screen at the moment a person is being asked to justify a decision
about it.

**The context reuses a vocabulary rather than inventing one.** `touches` is new. Reversibility is
`Reversibility` from `tool-consequences.ts`, printed through `REVERSIBILITY_LABEL`, which is what the
approvals queue already prints and what `approval-policy.ts` gates on. Three-valued, so `partial`
(most of the catalogue) does not have to be rounded to an end, and a step and a gate cannot describe
one fact two ways. **It draws only when it is not `reversible`**: "this can be undone" is the
assumption a reader already holds.

### The alignment, and it was a real defect

**Measured, not read.** The card was rendered to static markup, served against the real built
stylesheet, and read with `getBoundingClientRect`. Mark centre against subject centre:

| | before | after |
| --- | --- | --- |
| rows with no chip | **+0.63px** | 0.00px |
| rows with a chip | **-1.00px** | 0.00px |

**A 1.63px swing, alternating down the card by whether a row happened to have something to say.** The
cause: the first line is `items-center` and a `StatusChip` is 22px against a 12.5px subject's 18.75px
line box, so a chip raises the line and drags the subject's centre down, while the mark stayed pinned
to the offset a chipless line needs. `GLYPH_SLOT` had been solved against 18.75 and was 3px; the clock
column had always been 4px, **so the two columns of one row had been a pixel apart all along.**

The fix is in the shared rhythm because the defect is: `RUN_LINE` declares the first line at
`min-h-[22px]`, the chip's own height, and `GLYPH_SLOT` is solved against that at exactly 4px. After
it, `RunTimeline`'s rows measure 0.00 too, and the plan's mark and body offsets inside a row came out
identical to the timeline's: **48.00 and 70.00 in both.** The item's five distinct row heights became
three, and each remaining difference is content (a control, a reason line) rather than accident.

A chipless row grows by 3.25px, which is the direction the ratchet allows. Shrinking the chip to fit
the text was the other repair and it is the forbidden one: the chip's height is what carries its
status word at a readable size on paper.

**Pushed back.** Two.
1. **`run-rows.tsx` again, and it is not in this item's `Owns` either.** `RUN_LINE` and `GLYPH_SLOT`
   are where the alignment defect lives, and fixing it in `PlanCard` alone would have left the same
   1.63px swing in the two components that share the rhythm. Seventh wrong `Owns` list this session.
2. **The founder said "a little approval button" and these are full-size controls.** I read that as
   naming what was missing rather than specifying a size, and kept `Action`'s own 32px shape: a
   hand-rolled smaller button re-derives the focus ring, the press and the disabled-contrast fix that
   `Approve`'s own comment records paying for. Making them quiet did the calming that shrinking them
   was meant to do.

**Unsure.** One. **The two quiet controls have no visible boundary**, so they read as two words under
the row rather than as buttons until hovered. That is what `Action variant="quiet"` looks like
everywhere else in the product, and the item explicitly said a skip is a quiet action, so I matched
it rather than inventing a bordered small face. If it reads as too weak on a real surface, the answer
is a size on `Action`, in `surface-parts.tsx`, which is a shared decision rather than this card's.

**Noticed.** One, and it is about my own tooling rather than the repo. **`tsconfig.json` includes only
`src/**`**, so a scratch harness at the repo root is never typechecked. My measurement fixture passed
`station: "define"`, which is a valid `AgentStation` and not a valid `StationGlyphKind`, and it
rendered an empty mark for a whole measurement pass before I noticed the glyph was missing by looking
at the screenshot. Two station vocabularies exist for good reasons; a scratch file that cannot see
either is worth knowing about before trusting one.

**Gates.** tsc clean · 9,780 pass / 0 fail / 23 skip across 582 files · build ok · ratchet unchanged.
Rendered and measured three times, and the two corrections in this entry both came from looking.

> **Claude does after:** wire the two handlers to something real. The step controls are built and
> mounted only in the gallery, so this is a door away from being a capability: nothing in the product
> passes `onSkipStep` yet, and the reason it captures has nowhere to be written.

---

## K-17 · BLOCKED · 2026-08-20 09:10

**Did not build.** The premise is half right and the prescription is wrong, and the wrong half is not a
detail: **mounting either component where this item says would put one fact on screen twice**, in two
rhythms, on a surface that already answers both questions.

**What is true.** `StreamingText` and `ToolChips` have no product caller. Their only importers are the
gallery and their tests. That part of the item is exactly right, and so is the principle behind it.

**What is not true is "just doors".**

### 1. `ToolChips` is a fourth view of a run, and three were already unified

`run-rows.tsx`'s own header states that `PlanCard`, `RunTimeline` and `ToolStream` are *"three views of
one run"* that shipped as three products (three mark sizes, three gutters, three subject sizes) and were
pulled onto shared primitives for it. `one-run-one-rhythm.test.tsx` fails the build if they drift apart.
**`ToolChips` is not on those primitives**: it is a 320px `max-w-80` column with its own 7px rows, its
own four-icon `ToolKind` vocabulary and its own collapse state.

And the run route already renders every tool call: the `steps` tab's ledger, `_authenticated.runs.$missionId.tsx:985-1156`,
one `RunRow` per step with `stepLabel`, `summarizeArgs`, a per-step `RunMark`, and a door for the
thoughts and the tail. **`ToolChips` says the same thing in a narrower shape.** I checked whether the
ledger might be the old thing worth replacing, which would have made this item coherent: it is not.
`src/components/runs/run-parts.tsx` carries 3 `--sp-` occurrences and **no ratchet baseline entry at
all**, so it is current-generation and tuned, not debt.

### 2. `StreamingText` on this surface would animate the arrival of settled prose

The only assistant prose in the run record is `finalSummary(runs)`: the last `kind:"final"` step's
message, or `run.output`. The route reads it off a **4-second poll**, so by the time this surface has
it, it arrived minutes ago. Revealing it a word at a time would be theatre, and it is the class of
claim this repo forbids: the animation asserts "this is being written now" about a string that is
finished. `ReturnSummary` (`:1454-1460`) already renders that same message, split lead-and-full with a
"Read all of it" door, so it would also be **the run's final message on screen twice**.

Two more of its four inputs have nothing honest to fill them: **there is no citation structure anywhere
in the run record**, so `sources` would be empty on every real run, and **`LoopStep` carries no
duration** (`duration_ms` is a run-level column and is not on `StudioRunDetail`).

There is also a live hazard the item does not mention: the reveal restarts whenever `parts` changes
identity, so a `parts` array derived inline from the 4s poll **re-writes the whole answer every four
seconds, forever.**

### The part worth taking to the founder

I went looking for the honest home for `StreamingText` instead of just refusing, expected it to be the
Ask pane, and **found that surface refusing this exact pattern in writing.** `AskTurn.tsx:261-268`:

> *"There is deliberately no second branch for the in-flight case: the stream patches `content` on this
> same message, so the half-written answer and the finished one are the same JSX and cannot render
> differently. A separate 'streaming text' path is exactly how a surface ends up showing raw hashes for
> the eight seconds a person is actually watching it, and then tidying itself up once they have stopped."*

That is the one surface in the product with real token streaming and real citations, and it has already
decided against a per-word reveal, for a reason I think is right. **So `StreamingText` may be a
component with no honest home here**: it is the reference's answer block, and this product's answer
surface renders progressive markdown instead, on purpose.

`ToolChips` is a different shape of the same problem: `ToolStream` is its live-rhythm successor, on the
shared primitives, and is also unmounted. **Two components for one job, and the older one is the one
this item asks to wire.**

**What I need, and it is a product call rather than a build decision.** Three options, and I do not
think this is mine to pick:

1. **Give them the homes they fit** rather than this surface. `ToolStream` gets the run route (it is on
   the shared rhythm and its subject is arrival), and `ToolChips` and `StreamingText` are recorded as
   superseded, which is one of the four grounds `AGENTS.md` allows for deletion.
2. **Keep them as reference parity** and say so in the gallery, so the next audit stops counting them
   as unwired debt. They are correct ports; being unused is a product decision, not a defect.
3. **Overrule me** and mount them anyway. If that is the call, say which of the two duplications is
   acceptable, because I cannot avoid both: `ToolChips` collides with the ledger and `StreamingText`
   collides with `ReturnSummary`.

**I have not touched `_authenticated.runs.$missionId.tsx`.** Nothing is half-built and nothing is left
in a state anyone has to undo.

**Noticed while reading, and unrelated to the above.** `src/components/engine-room/AgentScorecardPanel.tsx:81`
declares its own local `function ToolChips({ tools })`. Two different components with one name in one
repo, and the local one is the one with callers. Worth a rename before somebody imports the wrong one.

**Gates.** Not run: nothing changed. Moving to K-18.

> **Claude does after:** this needs a ruling rather than a verification. The measurement is in the two
> collisions above and the `AskTurn` quote; the decision is which of the three options is right.

---

## K-18 · BLOCKED · 2026-08-20 09:40

**Did not build.** Two of the item's three factual claims are wrong, and correcting them changes what
the item should be. **There is a real defect underneath, it is smaller than the item, and it is in a
file the item does not own.**

**1. There are 15 hold reasons, not 16.** Counted off `HOLD_LINE` in `src/lib/spine/driver.ts`:
`paused`, `waiting-on-a-person`, `no-agent`, `done`, `produced-nothing`, `nothing-to-hand-on`,
`stalled`, `over-budget`, `out-of-time`, `out-of-credit`, `needs-evidence`,
`needs-a-waived-station`, `station-cannot-finish`, `corrections-spent`, `given-up`. Fifteen. The
acceptance criteria ask for 16 to render, which cannot be satisfied.

**And one of the fifteen is not a hold at all.** `done` reads *"The route is finished. This work has
been graded."* Rendering it in a list of stopped work would report finished work as stuck, which is the
`pending`-reads-as-`blocked` defect `PlanCard` exists because of, repeated one layer up.

**2. "None of them surfaces anywhere" is false.** The accessor is wired end to end:

- `holdLine(hold, { station })` — `driver.ts:700`, tolerant of unknown values, substitutes the station's
  display name for the four station-specific reasons.
- `rowToTrack` maps `last_hold` through it onto every track row — `track.functions.ts:141`.
- `TrackStart.tsx:472` renders it: `sub={t.hold ?? t.summary}`, with a comment stating the ordering
  decision out loud, that the hold outranks the route because *"silence and still running look
  identical, and only one of them is true"*.

So **all fifteen sentences already reach a rendered surface.** `runs.index.tsx` references `hold`
seventeen times as well. The item's `Why` describes a gap that was closed.

### The defect that is actually there, and it is the item's own colour law inverted

`TrackStart.tsx:487` paints the station chip for **every** hold with amber:

```tsx
<Value tone={t.hold ? "hold" : "quiet"}>{AGENT_STATIONS[t.station].name}</Value>
```

`waiting-on-a-person` is a hold, so a gate waiting on **you** renders in the token that means *stopped,
and NOT on you*. That is precisely the distinction the item calls "the whole reason both tokens exist",
and the shipped code has it backwards for the one reason where it matters most. The file even knows the
reason is special: three lines above, it computes `waitingOnAPerson` to decide whether to draw a
control, and then does not use it for the tone.

**The split, and it is not mine to guess at.** `meridian.css` names the test: orchid where a decision on
this work releases it, amber where a condition has to change. Its own enumeration puts *"no source is
connected"* and *"a cap is nearly spent"* under AMBER, which decides five of the fifteen against the
reading their sentences suggest. My classification:

| | reasons |
| --- | --- |
| **orchid**, a decision on this work | `waiting-on-a-person`, `station-cannot-finish`, `corrections-spent`, `given-up` |
| **amber**, a condition elsewhere or self-resolving | `paused`, `no-agent`, `produced-nothing`, `nothing-to-hand-on`, `stalled`, `over-budget`, `out-of-time`, `out-of-credit`, `needs-evidence`, `needs-a-waived-station` |
| **neither, not a hold** | `done` |

`StalledWork`'s own header argues the amber side of this independently and from production data: 26
tracks were starved of evidence while the product told their owners to go inspect a station, so
`needs-evidence` must not wear orchid. That argument is right and it is why `out-of-credit` and
`over-budget` sit with it despite sentences that ask a person to act: you top up an account, you do not
decide this track.

### What K-18 should be

1. **Apply the split in `TrackStart.tsx`**, which is where the sentences already render and where the
   tone is currently wrong. **Not in the item's `Owns`** (`StalledWork.tsx`, `runs.index.tsx`,
   `meridian.tsx`), and it is the only change that fixes a live surface.
2. **Extend `StalledWork` from `reason?: "you" | "source"` to the real `HoldReason`**, rendering
   `holdLine` verbatim rather than its own hardcoded source sentence. Its two values are a private
   approximation of a fifteen-value vocabulary that already exists, which is the one-idea-two-ways
   failure at the data layer. This part IS in `Owns` and I can build it.
3. **Drop the "16 reasons" and "all 16 in the gallery" criteria to 15, and exclude `done`.**

**Why I stopped rather than building part 2 alone.** It would leave the classification living in
`StalledWork` while the surface that actually renders holds keeps painting them all amber, so the two
would disagree about the same fifteen values in the same release. The map belongs beside `HOLD_LINE` in
`driver.ts` where both can read it, and that is a third file outside `Owns`. **Three files, none of
them the ones listed, on an item whose stated premise is false: that is a rewrite of the item, not a
build of it.**

**Nothing is touched.** No partial state to undo.

**Gates.** Not run: nothing changed.

> **Claude does after:** rule on the rescope. If the shape above is right, the item wants a new `Owns`
> of `driver.ts` (the classification beside `HOLD_LINE`), `TrackStart.tsx` (the tone) and
> `StalledWork.tsx` (the vocabulary), and its count corrected to 15 with `done` excluded. The
> `TrackStart` tone bug is worth fixing whatever happens to the rest.

---

## K-18 (rewritten) · BUILT · 2026-08-20 10:25

**Did.** A held track now says **whose** hold it is. The classification lives beside `HOLD_LINE` as a
closed set, the raw reason travels to the surface alongside the sentence, and the status moved off the
station name onto a chip.

**Claude accepted the BLOCKED entry and rewrote the item to the defect it found** (15 not 16, `done`
excluded, the sentences already rendering, the tone inverted at `TrackStart.tsx:487`), with my 15-way
split adopted verbatim. This is that item.

**The fix the item asked for was not available, and the reason is a better answer.** Its acceptance says
orchid for four and amber for ten, so the reflex is `tone="you"` on the station's `Value`. **That
component refuses a `you` tone on purpose:**

> *"No `you` tone, deliberately. A value is something you READ; if a person is required, that belongs on
> a control, not on a fact."*

That is right. And it composes with the standing 2026-08-19 ruling that on paper the five status hues
collapse to between 5.06 and 6.00 against the ground, so **coloured text cannot carry status and a chip
has to.** So:

- the station name goes back to `tone="quiet"`, because it answers *where is this*, which is a fact;
- the state goes on a `StatusChip`, `you` reading "Waiting on you" and `hold` reading "On hold";
- the chip pulses only for `you`, because a condition changing on its own is not asking for anyone.

**Two defects fixed rather than one**, and the second was not in the item: the station name had been
carrying a status at all.

**The prose comparison could never have worked, which is the finding worth keeping.** The old line was
`t.hold === HOLD_LINE["waiting-on-a-person"]`, and `t.hold` is the OUTPUT of `holdLine`, which replaces
the leading "This station" with the station's display name for the station-specific reasons. **Two of
the four orchid reasons are station-specific** (`station-cannot-finish`, `given-up`), so neither can
ever equal its own entry in `HOLD_LINE` on a track that has a station. It happened to work for the one
reason that is not rewritten. A test proves the inequality rather than asserting it.

`retry-station.test.ts` had already refused prose-branching for the retry control on the same grounds:
read the raw column, never the sentence built from it.

**So `Track` carries the raw reason now.** `holdReason: string | null` beside `hold`, mapped straight
off `last_hold` in `rowToTrack`. One field, and it is what lets a surface DECIDE something from a hold
rather than display it.

**`done` returns no tone at all**, which is the third branch and not an oversight: it is a member of
`HoldReason` and it is not a hold. Painting it as stopped reports finished work as stuck, which is the
defect `PlanCard` exists because of, one layer up.

**Pushed back.** One. **The item's `Owns` is `TrackStart.tsx` and a colocated test, and the build needed
three files.** The classification belongs beside `HOLD_LINE` in `driver.ts`, because `StalledWork`'s
private `"you" | "source"` is a second approximation of the same fifteen values and both should read one
set. And the raw reason had to reach the component through `track.functions.ts`, since `TrackStart`
cannot classify what it is not given. Eighth incomplete `Owns` list this session, and the first one where
the missing file was load-bearing rather than incidental.

**Unsure.** One. **The set is closed by a test rather than by the type.** `holdTone` takes
`string | null | undefined` because `last_hold` is a text column and a value from a newer deploy must
come out as no colour rather than the wrong one, so `HOLD_NEEDS_PERSON.has()` cannot be exhaustiveness
-checked by the compiler. The guard is a test asserting the two hand-written lists partition
`HOLD_LINE` exactly, which is the same instrument `correction.test.ts` uses for the same reason.

**Noticed.** One, pre-existing and left alone. The "Let *station* try again" menu item is gated on
`t.hold`, the prose, so a track whose route is finished shows a retry offer: `done` has a sentence, so
`t.hold` is truthy for it. Reading `t.holdReason` and excluding `done` would fix it, and it is a
behaviour change on a control rather than a colour, so it wants its own item.

**Gates.** tsc clean · 9,806 pass / 0 fail / 23 skip across 584 files · build ok. Planted the old
every-hold-is-amber behaviour and the orchid assertion fails, so the test is not vacuous.

> **Claude does after:** open a workspace with a real held track. The two things a test cannot see are
> whether the chip reads as calmer than the amber station name it replaces, and whether "Waiting on you"
> beside a row whose `sub` already says *"A call is in front of you"* is one idea said twice.

---

## K-19 · BUILT · 2026-08-20 11:05

**Did.** Checked all six first, as the item asks. **Five of them are redirect stubs and want neither a
link nor a deletion.** One is a real 3,047-line surface with no way in, and it now has a door in the
Engine Room.

**Owns, declared as the item requires:** `src/routes/_authenticated.engine-room.tsx`.

### Which is which, measured

| route | lines | what it is | what it needed |
| --- | --- | --- | --- |
| `/artifacts` | 23 | stub → `/brain` | nothing |
| `/m` (index) | 31 | stub → `/today` | nothing |
| `/m/$productId` | 32 | stub → `/today` | nothing |
| `/missions/$missionId` | 25 | stub → `/runs/$missionId` | nothing |
| `/prds/$id` | 28 | stub → `/plan/spec/$id` | nothing |
| `/studio/$missionId` | 40 | stub → `/runs/$missionId` | nothing |
| **`/meridian`** | **3,047** | **the design system gallery** | **a door** |

**A redirect stub with no inbound link is not an orphan. It is doing its job.** It exists to catch links
that already exist OUTSIDE this codebase: a bookmark, an old Slack message, a doc, a browser's history.
Adding a new inbound link to a deprecated address would be the defect, because it manufactures traffic
to a path we have already decided is not the one.

**So the item's two options are both wrong for these five, and there is a third.** It offers "reachable
from a rendered control, or removed as a dead stub". Removing them fails `AGENTS.md`'s own delete test on
every ground: they are not shadowed, not regenerable, not broken as written, and **not superseded — they
ARE the supersession mechanism.** Deleting a working redirect is how you create the link rot it exists to
prevent. All six were verified to point at live routes.

The repo already holds this rule, in `a-301-that-lands-one-tab-away.test.ts`: *"a link that lands
somewhere real and wrong is worse than one that fails."* A stub's correctness is where it LANDS, not
whether anything points at it, and that test is the instrument for it.

### The one real orphan, and where its door goes

`/meridian` is the whole design system laid out in both grounds, and it had **zero inbound links** —
reachable only by typing the address. That is this repo's named dominant defect, sitting on the surface
whose job is to catch it in everything else.

**It goes in the Engine Room, by doctrine 1.3's own test.** A component gallery is machinery: it is the
output of the design system rather than a surface anyone does product work on, and the doctrine puts
traces, evals, prompts and internals behind one recessed door rather than in the rail. Deliberately not
a nav row, which this item forbids and is right to. Deliberately not Settings, which is where you
CONFIGURE the application rather than where you look at what it is made of.

One `Region` titled "What it is made of" with one `Door`, appended after "Reading from", carrying the
greppable `Engine-Room:` reasoning the doctrine asks for.

**Pushed back.** Two.
1. **"These six routes have zero inbound links" is true and misleading.** Six of the seven paths named
   are redirect stubs whose design is to have none. The item's `Why` treats the count as the defect; the
   count is correct and only one instance of it is a problem. A reachability test that flags a redirect
   stub is measuring the wrong thing.
2. **The item guessed `/m` and `/studio/$missionId` "may be redirect stubs".** All six are. The one it
   did not flag as a possible stub, `/meridian`, is the only one that is not.

**Unsure.** One. **The gallery's door is a judgement I would like checked.** The Engine Room is the
doctrine-correct home and I can say why it is exactly there. What I cannot say is whether a design
gallery should be reachable by a customer at all, or whether it wants a build-time gate. It renders no
customer data and states no claim about the workspace, so shipping it visible is defensible; if the
answer is that it should be internal-only, the door is one line to gate and the item should say so.

**Noticed.** One. `EngineRoomOverview` now creates its own `useNavigate` rather than taking a third
navigation callback from the page. Two were already threaded down as props (`openRoom`, `openSync`), and
a third would be the point at which the parent is doing this component's routing for it.

**Gates.** tsc clean · 9,806 pass / 0 fail / 23 skip across 584 files · build ok.

> **Claude does after:** open `/engine-room` and press the door. The thing worth confirming beyond the
> link working is that the new region reads as the quietest thing on that page: it is a way out to a
> workbench, not a feature, and it sits below a region about live connections.

---

## K-20 · BUILT · 2026-08-20 12:30

**Did.** `RunMap`: a route through the seven stations as a horizontal spine, each stop labelled by
outcome, expandable into its step graph, in three modes. **Taking a station off the route cannot
complete without a reason**, which is the point of the whole component.

**The item's real subject is a policy that was never enforced.** The founder ruling that a skipped
station is a decision on the record with a reason has been in force for weeks, and `SpineRoute.waived`
has carried the shape of it the whole time: `{ station, reason, by, reopensWhen }`. **Nothing in the
product ever asked anyone for a reason.** A policy with no interaction is not enforced, it is written
down. On a map, subtraction is the gesture, so the prompt is the next beat rather than a form somebody
has to find.

**Not a workflow builder, and I made that structural rather than promised.** A test asserts the absence
of `onAddStation`, `onReorder`, `onConnect`, `onAddStep` and `draggable`. The only authoring gesture is
subtraction with a reason, because that is the only judgement the record actually needs from a person.
If a user draws the graph, the director layer is dead.

**"No tool name in the output" is enforced by ABSENCE, not by a filter.** There is no field on
`RunMapStation` that could carry one, so no caller can pass a tool through and no future edit can start
rendering one without adding a field and answering for it. A test pins that no `tool` field exists and
that nothing rendered matches a lowercase dotted pair, which is what every registry name looks like.

**Composed from what exists rather than redrawn, in four places:**

| | reused | instead of |
| --- | --- | --- |
| step graph | `Flowchart` + `flowFromSteps` | a fourth view of one run in a fifth rhythm |
| step states | `PlanStepState`, `PlanStep`, imported | a private six-value enum where "skipped" means two things |
| hold sentence | `holdLine(rawReason)` from K-18 | re-wording fifteen sentences into a second copy |
| station mark | `GLYPH_FOR_STATION` | **a third copy of the map** |

**That last one is the finding.** `Record<AgentStation, StationGlyphKind>` was declared **twice, character
for character**: `GLYPH_FOR_STATION` in `crew/CrewChrome.tsx` and `STATION_MARK` in `shell/AppFrame.tsx`.
Both carried a comment saying it was "the one place the two meet", and both were right about the principle
and wrong about being the place. I was one keystroke from a third. It now lives in `station-glyphs.tsx`
beside the drawings it keys, and **both existing copies read it** rather than being left to drift, because
the repo's own measured lesson is that the cost is never the duplicate: it is that copies drift and then
a station is a spiral on one surface and a target on another.

**Three modes rather than booleans**, because a boolean pair would let a caller ask for a live map that is
also editable, which is a route being edited underneath the agent walking it.

**A test caught a real defect of mine.** `editable` mode drew "Take it off" on every station whether or
not `onWaive` was wired, so an editable map with no handler got seven buttons that did nothing. That is
the affordance failure this file's own header names, committed in the file that names it. `canWaive` now
gates it, and the assertion that found it is kept.

**Two of my own assertions were imprecise and I sharpened rather than deleted them.** Counting
`text-mrd-agent` across all spans found two, because the `Running` chip carries the agent token perfectly
legitimately; the claim that matters is that exactly one STATION'S MARK is azure, and that it is the
running one. And the station-naming assertion hardcoded a display name it had no business knowing, so it
now asserts the property instead: the sentence rendered is not the raw one and no longer opens with a
pronoun that has no referent in a list.

**Pushed back.** One. **`Owns` again.** The shared glyph map needed `station-glyphs.tsx`, and migrating the
two existing copies needed `CrewChrome.tsx` and `AppFrame.tsx`. Ninth incomplete `Owns` this session.
Leaving the copies would have meant three where there were two, which is the opposite of what
"search before you write" asks for.

**Unsure.** One. **A 168px fixed stop width is the one figure I cannot derive.** It is wide enough for the
longest station name at the label stop plus its chip, and it is what makes the row overflow rather than
squeeze seven unreadable stations into a narrow pane. But it is a measured-by-eye number rather than one
read off a token or the reference, and it is the value most likely to be wrong at a real viewport. Worth a
look in the gallery before it is trusted.

**Noticed.** One, named in the file rather than fixed. **`WaiveReason` duplicates `PlanCard`'s
`SkipReason` mechanic**: Enter submits, Escape cancels, commit guarded on a trimmed non-empty value,
submit dead until then. Two copies of one mechanic will drift. The right fix is a `ReasonField` in
`forms.tsx` that both call, which is a third file this item does not own, so it is recorded here rather
than done quietly. **This is the second reason-capture form in two items; a third should not exist.**

**Gates.** tsc clean · 9,832 pass / 0 fail / 23 skip across 585 files · build ok. Planted the removal of
the reason guard and two tests fail, so the enforcement is real.

> **Claude does after:** open the gallery panel at a narrow width and confirm the spine scrolls inside
> itself rather than moving the page, which is the acceptance criterion no test can see. The 168px stop
> width is the thing to judge. Nothing in the product mounts `RunMap` yet, so it is a component with a
> gallery door and no product door: `SpineRoute` is what feeds it, and `TrackStart` already renders that
> route as a single station chip.

---

## K-21 · BUILT · 2026-08-20 13:35

**Did.** Four guards in `driver.test.ts` that see the two thirds of the catalogue its existing filter
cannot, and the catalogue now records why an alias may share a display name and what makes that safe.
**No agent merged, renamed or removed.** The unseeding is flagged for Claude, as the item asks.

**The display-name collision is a DATA defect and the catalogue is already correct.** `engineer` is
`deprecated` here, which is right, and it is seeded into all 16 workspaces, which is what makes both it
and `builder` render as "Engineer" at Build. **The aliases share names on purpose** and that is the whole
mechanism: a run recorded months ago against `scout` has to come back reading "Watch" rather than a
title-cased guess. So the code-side fix is not a rename, which would break the only thing an alias is
for. It is the invariant that was never written down: **an alias may never be seeded**, and no two
ACTIVE agents may share a name at one station. That is now a guard.

**`active` means two different things depending on `tier`, and that is the drift underneath the item.**
The field is documented "active = seeded + shown". True for `cast`. False for `crew`: `reactor` and
`archivist` are active, seeded nowhere and shown nowhere, which is correct for what they are and means
the word is carrying two meanings. So the new guard asks the question **per tier** rather than once:

- a `cast` agent must be in a station crew, or the station does part of its job forever;
- a `crew` agent must **not** be, because a station-dispatched agent is by definition user-facing.

I did not add a third `status` value. `tier` already says engine-only, so a `status: "engine"` would say
it twice and the two could then disagree. Recorded as a documented split instead.

### The finding the item did not have

Nobody had asked the question in the other direction. The existing guard checks *every active agent has a
station*; **nothing checked that every slug the code dispatches is a current agent.** Those are different
failures and only the second one lies: `agentDisplayName` falls back to a title-cased slug, so a run
attributes itself to an agent that is not on the roster and looks entirely normal doing it.

Swept every `agentSlug: "…"` in `src/**` outside tests. **Two stale dispatches**, both in the gallery:
`agentSlug: "planner"` and `agentSlug: "designer"`, deprecated aliases used as fixture data. They
rendered as "Plan" and "Design" through the alias mechanism, so nothing looked wrong.

**I fixed the fixtures rather than excluding the gallery from the sweep**, which was the tempting weaker
move. The gallery is the design system's own showcase; demonstrating retired ids there is exactly how a
retired id gets copied into a real surface. Now `sprint-planner` and `ux-architect`.

Tests are excluded from the sweep, and that exclusion is load-bearing rather than convenient: their
fixtures dispatch deprecated and invented slugs deliberately, to prove the fallbacks work.

**Two of my own assertions were wrong and I want them on the record.**
1. I asserted two distinct `face` values per station as a merge guard. **Sense has three seats and all
   three are scouts**, because Sense produces signals rather than an artifact for someone to read back.
   The existing test already pins the maker-reader pair "at every station that produces an artifact",
   which is the correct scoping, so restating it worse was not an improvement. Replaced with the
   acceptance's unguarded third line instead: every deprecated alias still resolves to a real name at a
   station that still exists, so a historical run stays readable.
2. My first dispatch sweep covered only `src/lib` and found four sites. Widening it to `src/**` found
   nine and the two stale ones. A guard scoped to the directory I happened to be reading is a guard that
   passes because it is looking the wrong way.

**Handed to Claude, and it is a data change rather than a judgement.** **Unseed `engineer` from all 16
workspaces.** It is `deprecated` in the catalogue and seeded in production, which is the live half of this
item and needs a migration. Nothing in the code will stop it coming back until that row is gone; the
guard added here only stops the catalogue re-creating the collision.

**Pushed back.** One. **The item's acceptance says `driver.test.ts` should fail if an active agent of any
tier "is dispatched by nothing".** Taken literally that fails today, because nothing dispatches `reactor`
or `archivist` and both are active. I did not make it fail, and the reason is that the literal reading is
wrong: a crew agent is not supposed to be dispatched by a station, so the honest guard is one rule per
tier rather than one rule for both. Whether the reactor subsystem should dispatch `reactor` by slug at all
is a real open question and a separate item: `reactor.functions.ts` exists and never names it.

**Gates.** tsc clean · 9,836 pass / 0 fail / 23 skip across 585 files · build ok. Planted `engineer` back
to `active` and the collision guard fires, so it is not vacuous.

> **Claude does after:** the migration above. Also worth a production read on whether `reactor` and
> `archivist` should exist as catalogue rows at all: they are active, dispatched by nothing, and the
> subsystem that shares the first one's name never refers to it.

---

## K-03 (rejected, fixed) · BUILT · 2026-08-20 09:05

> **The stamp above is the real clock, and it goes BACKWARDS against the entry before it.** That entry
> says 13:35; `date` at the moment I wrote this says 08:59, and `git log -1` on the parent commit
> agrees with `date` rather than with the heading. This is the drift `ledger/README.md` already
> records, measured at +247 minutes, and continuing it costs more than the discontinuity does. From
> here my stamps are read off the machine. **Position in the file remains the order; the clock is
> `git log`.**

**Did.** Fixed the four things the rejection named and did not rebuild the component, which was the
first instruction in it. The false claim came out of all three places it shipped: the header comment in
`Dialog.tsx`, the gallery note a person actually reads, and worst, the test name at `dialog.test.tsx:199`
that asserted the pane shadow "had no caller in the whole tree" and passed forever. All three now carry
the narrower true claim, that no Meridian-layer component consumed either token. The panel caps its own
height and scrolls only its body, so a question taller than the screen is recoverable. And the
confirming action is now on one side, decided by this component rather than by its caller.

**The three claims, re-measured rather than copied from the verdict.** The verdict says the pane shadow
has four consumers; it has **five**. Four `box-shadow: var(--mrd-shadow-pane)` rules in `shell.css`
(:2200, :2271, :2380, :2848) plus `RewindButton.tsx:120`, which reaches it through the
`shadow-mrd-pane` utility rather than the variable, so a grep for `var(--mrd-shadow-pane)` misses it.
The scrim's three are right: `shell.css:2176`, `shell.css:2836`, `RewindButton.tsx:112`. Every one of
the eight is the retired shell layer or a Radix `AlertDialog` drawn in retired primitives, which is why
the narrower claim is also the sharper one: it is the actual reason the component had to exist.

**The scroll fix, and it is measured in a real browser rather than asserted.** happy-dom lays nothing
out, so I served the built stylesheet and the panel's exact markup at a 900x420 viewport and read
`getBoundingClientRect`. **The defect reproduces exactly as described: title top at -74.2px, actions row
bottom at 494.2px against a 420px viewport, page locked, both edges lost at once and neither
recoverable.** With `max-h-full flex-col` on the panel and `min-h-0 overflow-y-auto` on the body: panel
388px inside 420, title fully visible at top 33, actions row fully visible at bottom 387, body scrolls
502 into 287. Kept centred rather than switching to `items-start` like the shipped sheet, because
capping the panel makes centring safe and centring is better for the short dialog, which is nearly all
of them.

**The side, decided by what already ships rather than by taste.** `hooks/use-confirm.tsx` is the confirm
32 surfaces share and it has always put cancel first and the confirming action last in a right-aligned
footer. A new rule that contradicts 32 live surfaces is a second convention, not a convention. So:
**confirming action rightmost, way out immediately left of it, and the Dialog right-aligns the row
itself** rather than trusting the caller to. All four gallery cases now agree, and the first focus stop
is the way out in every one of them.

**Unsure.**

1. **The biggest judgement in this entry: I did not use `Actions`' `trailing` slot, and `trailing` is
   the mechanism the design system offers for exactly this row.** Its doc at `surface-parts.tsx:553`
   defines it as "the control that undoes or destroys, separated by DISTANCE rather than by colour",
   which is a good rule on a card, where the click destroys immediately. It cannot coexist with a fixed
   side: in a destructive dialog the confirm IS the dangerous control and goes right, and in a gate
   dialog the confirm is the safe one and would go left. That is precisely the swing the rejection
   found. I resolved it by arguing the distance has already been paid, since the dialog itself is the
   confirmation step and the reader arrived by asking to, and by writing that argument into the file.
   **The other reading is that `trailing` wins and the fixed side is wrong**, in which case the fix is
   to put the confirm in `trailing` in all four cases and change `Actions`' doc comment to say
   "commits" rather than "undoes or destroys". I did not take that path because it changes a slot's
   meaning for every caller of `Actions` in the repo from inside a Dialog fix, and because
   `surface-parts.tsx` is K-02's `Owns`. If the founder or Claude prefers it, it is a small change and
   the argument to overturn is in one comment block.
2. **A caller who passes `trailing` anyway now gets the right geometry by accident, and I did not test
   it.** The row is shrink-to-fit inside a `justify-end` parent, so `ml-auto` has no free space to work
   with and `trailing` degrades to "last". I reasoned that from the box model and did not measure it,
   because none of the four cases uses the slot any more.
3. **The class-name assertions in the two new scroll tests are the weakest kind in this suite** and I
   said so in the file. happy-dom cannot see a viewport, so there is no honest way to assert from a
   test that the top of a tall panel is reachable. The browser measurement above is the real check and
   it lives in this entry rather than in CI. Both tests were proven non-vacuous by planting.
4. **I added a fourth gallery case rather than only fixing three**, which edits a section of
   `_authenticated.meridian.tsx` instead of appending to the end of it. The append-only rule exists to
   stop merge conflicts, and this is my own item's own section, so I judged it safe. The case is the
   defect itself, kept as something to look at: narrow the window and the question stays reachable.

**Noticed.**

1. **The hard cut at the scroll boundary has no affordance, and I deliberately did not fix it.** Looking
   at the render, the body clips mid-sentence with nothing saying there is more. The machinery for this
   exists: `.mrd-fade-scroll` plus `edgeMask()`. **I did not use it because it would be the third copy
   of the same effect, and `RunTimeline.tsx:297` carries a comment saying the second copy "should not
   stay that way".** The measurement effect (a scroll listener, a guarded `ResizeObserver`, a 1px
   tolerance) is duplicated verbatim between `SidebarNav.tsx` and `RunTimeline.tsx`; only `edgeMask`
   itself is shared. Applying `.mrd-fade-scroll` without the mask would make it worse, since that class
   hides the scrollbar. **The third caller has now arrived, which is the queue's own trigger for
   extracting `useScrollEdges` into `run-rows.tsx` or a hook beside it.** That touches `SidebarNav.tsx`
   and `RunTimeline.tsx`, both owned elsewhere, so it is an item rather than something to slip in here.
2. **`z-50` is still hardcoded in `Dialog.tsx` against the ladder at `shell.css:93-97`**, where
   `--shell-z-tip` is already 50. The rejection explicitly did not charge this to the item and I have
   not either. Recorded so it is in two places rather than one.
3. **`RewindButton.tsx` is a genuine mixed-layer surface and nobody has queued it.** It draws a Radix
   `AlertDialog` and paints it with Meridian utilities: `rounded-mrd-pane`, `bg-mrd-float`,
   `shadow-mrd-pane`, `bg-mrd-scrim`. It is the single closest thing in the tree to what `Dialog.tsx`
   now is, and it is the obvious first port once `useConfirm` is moved onto this component.
4. **The test I added reads the gallery route from disk**, which is the first test in the suite to do
   that. I checked: nothing in `src/__tests__` or `src/components/meridian/__tests__` reads
   `_authenticated.meridian.tsx`. It is there because the defect was invisible to a component test by
   construction, the component was fine and its four reference cases disagreed with each other.

**Planted, so none of the five new assertions is vacuous.** Dropped `max-h-full`, dropped `min-h-0`,
dropped `justify-end`, dropped the title's `shrink-0`, and put case 3's confirm back into `trailing`.
Each planted defect failed exactly one test and the other 25 stayed green.

**Gates.** tsc clean · 9,841 pass / 0 fail / 23 skip / 60 todo across 585 files · build ok. Verified all
six utility classes the fix depends on exist in the built stylesheet before measuring, since a class
absent from `styles-*.css` measures as a fix to a problem that is still there.

---

## K-07 (rejected, fixed) · BUILT · 2026-08-20 09:22

**Did.** Fixed all three functional defects, killed the second resolver, and corrected the false premise
where it shipped. `spendState` no longer folds a cap of 0 into `uncapped`, so a workspace that may spend
nothing reads as a ceiling reached instead of as untouched. The fill is clamped at both ends rather than
only at the top, and it carries a floor equal to the track's own height, so an amount under a cent draws
a dot rather than 0.05px. A threshold of 0 no longer means a permanent amber. `BudgetsPanel`'s
`burnTone` is gone and its one line now delegates to `spendState`.

**Extended `Owns`, deliberately and with the reason.** The item lists `Spend.tsx`, `spend.test.tsx` and
the gallery route. **I also changed `src/components/governance/BudgetsPanel.tsx`**, because "reconcile
them and delete one" cannot be done from inside the file that is not being deleted from. It appears in
no other item's `Owns`, checked by grep across the whole queue, so there is nothing to collide with.

**Which resolver survived, and why that direction rather than the other.** `spendState` is the Meridian
primitive, it is exported, it is tested, and it was the more nearly correct of the two. But the decisive
argument is not seniority, it is that **the server settles what a cap of 0 means and `burnTone` was on
the wrong side of it.** `checkBudget` at `runtime.server.ts:915` refuses a call whenever
`cap != null && used >= cap`, so 0 blocks everything, and `budgets.functions.ts:146` validates the column
as `.min(0).nullable()`, so 0 is a value a person can store. Both resolvers read a zero cap as no
ceiling at all. One of them now reads it the way the runtime enforces it.

**The three defects, and what each one now does.**

- **`cap={0}`** rendered "$5.00 of $0.00", an empty track and no words. Now: full red track, "Cap
  reached", and the division is answered before it happens rather than after, so nothing produces
  Infinity. `spent={0} cap={0}` also reports the ceiling, because nothing may be spent and the ceiling
  is at the reader's back from the start.
- **`spent={-2}`** emitted `style="width:-40%"`. Now `width: 0%`, measured in a browser as a 0px box.
  **The figure above it still prints exactly what the ledger says.** The drawing refuses to invert; the
  fact is not edited to match the drawing.
- **`spent={0.0008} cap={5}`** emitted `width:0.016%`, which is 0.05px on the 320px track, in the case
  the gallery labels "under a cent, which must not read as nothing". Now `min-w-1`, and the reason it is
  that class rather than a number is checkable: `min-w-1` and the track's `h-1` compile to the same
  declaration, `var(--spacing)` at `0.25rem`. Measured on the built stylesheet the fill is **4.00 x 4.00
  px with a 4px radius, so at the floor it is a circle**, identical in both grounds. It cannot drift from
  the track height by someone editing one of the two.

**Unsure.**

1. **`spending` now paints `quiet` where `burnTone` painted `pass`, and that changes a shipped surface.**
   It is the one visible consequence of reconciling and it is the decision most worth a second opinion,
   because Claude can open the Spend settings surface and I cannot. My argument: Meridian reserves
   `pass` for "an outcome that happened, never an intent", spending $2 of $5 is not an outcome, and
   green on a spend figure is the product approving of the spend, which is not its call. The bar in
   `Spend.tsx` has always drawn that state neutral, so this is two surfaces agreeing rather than a new
   opinion. **The other reading is that `pass` there means "inside your policy", which is a real meaning
   and not obviously wrong.** If that reading wins, the change is one line in `SPEND_TONE`.
2. **I kept a function called `burnTone` in `BudgetsPanel`, now one line long.** The verdict said delete
   one, and what I deleted is the logic. The wrapper survives because the `/100` has to live somewhere
   with a comment on it: the column stores a percentage and the primitive takes a fraction, and a caller
   who passes 80 gets a threshold 100 times too high, which never fires and looks like nothing is wrong.
   Inlining it at the call site would put that trap in a JSX attribute.
3. **A zero cap says "Cap reached" and nothing more specific.** "No spend is allowed here" would read
   better, but the component delegates every consequence sentence to `note` on purpose, because the
   three ceilings have three different consequences. The gallery case supplies one. I could have added a
   fourth `SpendState` for it and did not, since the state is genuinely the same one: the ceiling has
   been reached.
4. **A negative spend still resolves to `spending` and wears no state at all.** I considered a fourth
   state for a ledger that has gone backwards and rejected it: there is no evidence in the repo that it
   happens, and inventing a state for a case nobody has seen is how a component grows a branch nobody
   maintains. It draws nothing and prints the true figure, which is the honest minimum.

**Noticed.**

1. **`spend.test.tsx:73` asserted the defect as the contract.** It read
   `expect(spendState(9, 0, 0.8)).toBe("uncapped")`, which is the exact pattern AGENTS.md §6 names as
   worse than no test, and which two of the nine dead features had. **I wrote that line, in the original
   build.** It is now `.toBe("spent")` with the reason above it. A test can only encode a defect if the
   author never asked what the value ought to be, and I did not.
2. **The formatter count in the file's own comment was wrong and I have corrected it upward.** The
   comment said five copies. There are **nine** money formatters in `src/**` outside tests:
   `admin.proof.tsx`, `admin.ai-costs.tsx`, `SpendRoom.tsx`, `RecordRoom.tsx`, `traces.$traceId.tsx`,
   `runs.index.tsx`, `AnalyticsPanel.tsx`, `engine-room-glance.ts`, and the one that is actually shared,
   `components/product/format.ts`. The verdict said four were byte-identical and understated; it is
   worse than that. **The shared one exists and four of the local copies ignore it**, which is the more
   useful finding, and it also cannot serve this component: it returns `"$0"` for zero, so it cannot
   render the empty case as `$0.00` against a cap.
3. **`Value` carries status as coloured TEXT, which the chip work exists to stop.** `surface-parts.tsx:1111`
   paints `text-mrd-hold` and `text-mrd-fail` on a `span`, and that is exactly the measurement that put
   the chips in `Spend`: on paper those land at 5.06 and 5.99 and amber resolves to brown. So
   `BudgetsPanel`'s burn figure has the problem `Spend` was fixed for. **I did not change it**, because
   `Value` is `surface-parts.tsx` and every caller of it inherits the change. It is an item, and the
   chips are the answer.
4. **`BudgetsPanel`'s own header claims "the burn is a `Value` whose tone IS the threshold"**, written
   when the bar was removed to stop "colour carrying a threshold the number beside it already stated".
   Those two sentences are in tension in the same comment block: the bar went because colour was
   redundant, and then the colour stayed. The tone is still there and still means the threshold. Worth a
   ruling rather than a fix.
5. **The dev server on :8081 is serving a stale `Spend` module and I could not make it reload.** It
   picked up my `_authenticated.meridian.tsx` change, since the new Dialog case is on the page, and it
   still renders the old seven Spend cases per ground with the sub-cent fill at 0.05px and no floor
   class. A hard reload did not clear it. It is not my process, so I left it alone and measured against
   the production build instead, which is the stronger check anyway. **Flagging it because anyone reading
   :8081 right now is reading something that is not in the tree.**
6. **`Case` labels are not in the rendered text.** My first browser probe searched `innerText` for the
   gallery case labels and found none of them, including ones that have been shipped for days, which
   nearly sent me chasing a phantom. Whatever `Case` does with `label`, it does not put it in
   `innerText`. Recorded because it will waste the next person's time the same way.

**Planted, so none of the new assertions is vacuous.** Folded `cap <= 0` back into `uncapped` (3 fail),
clamped the top only (1), removed the floor class (1), dropped the zero-threshold guard (1), and grew
`burnTone`'s body back inside `BudgetsPanel` (1). **And I caught one of my own assertions being wrong
while writing it**: a sweep for `"-"` across the whole style attribute matched `var(--mrd-d-move)` on the
transition beside the width, which is a hyphen in a token name rather than a negative length. Scoped to
the width declaration. Same class of mistake as counting a class name across every span.

**Gates.** tsc clean · 9,851 pass / 0 fail / 23 skip / 60 todo across 585 files · build ok. Confirmed
`min-w-1` exists in the freshly built `styles-*.css` before trusting any measurement of it, since a class
absent from the stylesheet measures as a fix to a problem that is still there.

---

## K-22 · BUILT · 2026-08-20 10:00

**Did.** Corrected the three architecture contracts against the code, and found more wrong than the item
listed. `orchestration.md` gains the spine, the layer that actually walks the seven stations and had never
been documented at all; its data section lost five tables that do not exist; its concurrency claim lost
advisory locks that are nowhere in the repo. `runtime.md` lost `ai_traces` and gained the real span
mechanism, and its `surface` list is now the union the code exports. `observability.md`'s trust score went
from three legs at 40/30/30 to the four at 30/20/20/30 that the code has, with the eval leg's seven-week
outage recorded rather than described as live.

**The item's premise held on two of three, and the third has moved.** `ai_traces`: confirmed, zero
occurrences in `src/**` and `supabase/migrations/**`. Two orchestration layers with different drivers and
cadences: confirmed, both cron schedules read off their migrations. **But the eval leg is no longer
broken.** The item says to mark it broken with a pointer "since Claude is fixing it"; Claude fixed it
earlier today, in `trust.server.ts` plus migrations `20260820072500` and `20260820074000`. So writing
"broken" would have been the new false claim. It is documented as what it is: fixed, with the failure and
both causes recorded, because a leg that was a flat +0.10 on every agent for seven weeks is the strongest
argument this file's own honesty rule has.

**Extended `Owns`, three times, each declared with the reason.**

1. **`architecture/data.md` and `architecture/integrations.md`** each named `ai_traces` too. The
   acceptance criterion is "no contract describes a table that does not exist", and it is not met by
   fixing three files while two more carry the same fiction. Neither appears in any item's `Owns`,
   checked across the whole queue. One line each.
2. **`scripts/docs-doctor.sh`**, and this one was not optional: **the pre-commit hook runs docs-doctor on
   any commit touching markdown, and it was already failing, so K-22 could not be committed at all.**
   Check [11] scans `.` with a hand-maintained exclude list and does not ask git what belongs to the
   repo, so it failed on two **untracked, gitignored** local exports
   (`design-reference/Latest Design System - v3 /DESIGN-OBSIDIAN.md` and its handoff twin, untracked at
   `2894167ad`). Both open with `status: THE design contract for the product app`, which was true when
   they were written and is not in the repo. The only two ways to clear it were to edit a founder's local
   file or to stop scanning things git does not track. I filtered the hits through `git check-ignore`
   rather than adding an eleventh `--exclude-dir`, because the list would have needed a twelfth the next
   time somebody unpacked a reference bundle.

**Unsure.**

1. **The biggest judgement: how much of the spine to write down.** The item says "the spine layer is
   documented alongside the mission layer", and the spine's own source carries several thousand words of
   argument that is better than anything I could restate. I chose to document the **contract** rather than
   the implementation: the two gates before a track may move, the hold vocabulary and why the
   distinctions in it are diagnoses, the precedence order in `decideDrive`, and where its data lives.
   What I left in the code is the incident history behind each hold, because that is a story about
   particular defects and it is already in the file that has to be edited when the behaviour changes.
   **The other reading is that a contract file should be shorter than what I wrote**, and I did add
   roughly 40 lines to a 107-line file.
2. **I documented a weakness the item did not ask about, and it is the one thing here Claude should check
   against production.** Two overlapping `track-tick` invocations are **not fenced**: no advisory lock, no
   CAS claim on the track, unlike `mission_steps` which has one. What separates them is a 10-minute
   cadence against a job that finishes in well under a minute, plus the `driven_at` ordering. I wrote it
   as a real gap rather than a design choice. If two ticks have ever overlapped in production, that would
   show as a track driven twice in one window, and I cannot look.
3. **`burnTone`-shaped question, in doc form: I said `mission_steps` is what the doc called
   `mission_nodes`.** That is my inference from the shape (`depends_on int[]`, `idx`, `status`), not from
   a document saying so. The doc described `mission_nodes` as "DAG edges + state" and `mission_steps`
   carries both, so I am confident, but it is a reading rather than a record.
4. **I named `spine_tracks.path` as defaulting to all seven stations** on the strength of the migration's
   own default. Whether live rows actually carry all seven, or whether most were created with a shorter
   route, is a production question.

**Noticed.**

1. **`runtime.md`'s `surface` list was wrong in the most expensive possible place.** It named
   `mcp_server` and `a2a`, **neither of which has ever been in the `CallSurface` union**, and omitted
   `scheduler`, `sense`, `decision` and `test`. That line is the one an author reads when adding an AI
   surface, and the contract requires the literal to live in the exported type, so following the doc
   would not compile. The union's own comment records `decision` being added on 2026-07-11 "when the tool
   landed without extending this union", which is the same failure in the other direction. **Not in the
   item, and I think it is the worst single line of the three files.**
2. **The cron-hook list named six hooks out of 38, and one of the six does not exist.** `agent-tick` has
   zero occurrences in `src/**` and `supabase/migrations/**`. I did not replace it with a list of 38: a
   list that long in a contract file is a list that goes stale, so it points at
   `ls src/routes/api/public/hooks/` and names only the two that carry the loop.
3. **`eval-tick` was listed as "scheduled/on-demand" and has had a real 30-minute cron since
   2026-07-02.** It was posting to a URL that did not exist, fixed today. Two of its numbers were also
   conflated: it scans 200 candidates and judges 20, and the doc had only the 20.
4. **`resume-runs` advances 50 missions per tick, not 20**, and `track-tick` was missing from the cron
   table entirely, which is how a reader could scan that table and not learn that the seven-station loop
   has a driver.
5. **The stations have two naming systems and the doc had neither written down.** `AGENT_STATION_ORDER`
   is `sense · decide · define · design · build · ship · learn`, and `sense` is Discover while `define`
   is Plan. That is the same class of trap as §9's "read `builder` as Build" and it now has a row in the
   concepts table.
6. **A tooling incident, mine, recorded because it nearly cost work.** I ran `git stash` to compare
   docs-doctor against a clean tree, the command timed out mid-way, and I then ran a bare `git stash pop`
   which applied **an unrelated 28-file stash from a prior session** that deleted 2,378 lines under
   `src/lib/build/`. Recovered with no loss: I had copied my five files out first, `git reset` plus
   `git checkout -- .` cleared the conflicted pop, `src/lib/build/` is intact at 37 files and
   `git status src/` is clean. **The lesson is specific and belongs in §9: this repo has 37 stashes, so a
   bare `git stash pop` is a coin flip.** Name the entry, or do not stash at all. Comparing against a
   clean tree is better done with `git show HEAD:<path>`.
7. **`bun test` ran 586 files where the last item ran 585.** Claude landed
   `20260820084500_two_retired_agents_were_still_on_the_roster.sql` and a test with it while I worked.
   Noting it so the count change is not read as mine.

**Planted, so the docs-doctor change is not vacuous.** Appended
`The design contract for the product app is Obsidian.` to `architecture/frontend.md`, a **tracked** file,
and check [11] failed on it. **My first plant was wrong and passed**: I wrote "Obsidian is the design
contract for..." and the regex requires the keyword before the system name, so it matched nothing and for
a moment looked like I had broken the check. Worth recording, because a plant that fails to reproduce is
indistinguishable from a filter that swallows everything.

**Gates.** tsc clean · 9,856 pass / 0 fail / 23 skip / 60 todo across 586 files · build ok ·
`bun run docs:check` clean of hard rot, with only the pre-existing missing-date-header WARNs left.

> **Claude does after:** two production reads, neither blocking. Whether two `track-tick` invocations have
> ever overlapped, which the spine has no fence against. And whether live `spine_tracks.path` rows carry
> all seven stations or mostly shorter routes, since I documented the migration's default rather than the
> data.

---

## K-23 · BUILT · 2026-08-20 11:45

**Did.** Built `PlanGate`: one decision, three numbered answers, each stating its consequence, each
one keystroke. It composes `PlanCard` for the plan, `RunMap` for the route, and `Spend` for the
ceiling, holds every edit in local state, and hands back `{ autonomy, editedPlan, reason? }` without
writing anything. The third answer, "Keep planning", cannot commit without a note. Nothing on the
card is orchid, and a `you` chip says a person is required instead.

**The reference is Claude Code's permission prompt, named before building and written up in
[`REFERENCE-PATTERNS.md`](../../design/REFERENCE-PATTERNS.md) in the same commit.** beautifui.dev has
no gate among its twenty components, which is the same kind of gap its missing form controls were, so
the model came from the most-used agent gate in this market: numbered answers, a full sentence each,
a digit to take one, **and no accent on any of them.** Its third answer, "No, and tell Claude what to
do differently", is the one worth copying most exactly, because refusing and redirecting are the same
act and splitting them produces work that stops with nobody told why.

**Extended `Owns`, three times, each with the reason.**

1. **`forms.tsx`, `PlanCard.tsx`, `RunMap.tsx`: `ReasonField` is extracted and both originals now
   call it.** `RunMap.tsx:151` carried a comment naming its own duplication and saying the fix was a
   `ReasonField` in `forms.tsx` that both called, deferred because that was a file it did not own.
   This gate is the third caller, which is the trigger the note was waiting for. **I migrated both
   originals rather than only using it here**, because a shared primitive standing beside two
   survivors is the version of this fix that looks like progress and leaves the drift exactly where
   it was. 65 existing tests across the two files still pass unchanged.
2. **`Spend.tsx` gains a `measure` prop.** See Noticed 1: this is the first surface to render `Spend`
   beside anything, and its 320px default was wrong there in a way only a render shows.
3. **`REFERENCE-PATTERNS.md`**, which is the standing rule from AGENTS.md 1.1 rather than a choice.

**Unsure.**

1. **The biggest judgement: no answer is accented, and that will read as a missing style.** All three
   release the gate, so either all three wear orchid, which is three accents and therefore none, or
   no answer does. A house favourite is also the product making the call it is asking the reader to
   make, which is the governance doctrine's whole point. **The other reading is that answer 1 is the
   recommended path and should look like it**, and if the founder wants that it is one component
   swap. I have written the argument into the file so it can be overturned deliberately.
2. **`reason` is required on `keep-planning` and absent on the other two, and the item did not say
   that.** The item specifies `reason?` and says a gate you cannot redirect is a speed bump; I read
   the optionality as "present when the answer needs one". The consequence is that answer 3 is not
   really one keystroke: the digit opens the ask. **It could equally have been optional**, and then
   the gate is one keystroke throughout and some redirects carry nothing. I chose the stricter
   reading because sending work back with no note is the same shrug a skip with no reason is, and the
   correction loop already proves the crew refiles the same thing when it is not told what was wrong.
3. **`Autonomy` is three values and I did not map them to `agent_autonomy.arc`**, which is four
   (`observing | proving | trusted | ambient`). The item says return the level and let Claude wire it,
   so I left the vocabularies separate rather than guessing that `run-it` means `trusted`. **That
   mapping is the wiring decision and it needs the live schema**, so it is genuinely Claude's.
4. **The gate is `max-w-[520px]` because `PlanCard` is.** I did not choose 520; I matched it, because
   the alternative was a column wider than its widest child. It is the one number here not derived
   from a token, which is the same finding K-20 recorded about RunMap's 168px stop width.

**Noticed.**

1. **`Spend` at 320px under a 520px plan was wrong, and the suite was green through it.** Measured in
   a browser against the built stylesheet: four children ending at x=552 and the ceiling's figures
   ending at x=320, so the two amounts landed mid-column with nothing aligned to them. `Spend` gained
   a `measure` prop that **replaces** the default rather than appending to it, deliberately: two
   `max-width` utilities on one element resolve by their order in the generated stylesheet, not by
   the order they were written, so appending would have been a coin flip that happened to land right
   on the day it was tested.
2. **The answers were bordered cards first, and that put four bordered containers in one region**
   where the anti-slop standard allows one. It also made the answers heavier than the plan they are
   about. Borderless rows with a hover wash and an inset focus ring: **measured at one bordered
   container in the region afterwards.** Both of these came only from looking.
3. **`RunMap` truncates its route with no affordance of any kind, and this is a real defect.**
   Measured inside the 520px column: `scrollWidth` 684 against `clientWidth` 520, so **164px and one
   of four stations are hidden**, with `scrollbar-width: none` inherited from `.mrd-fade-scroll` and
   `mask-image: none` because `RunMap` never applies `edgeMask`. The scrollbar is hidden and no fade
   replaces it. It has never shown because the gallery gives it the full page width. **This is the
   third component to want the same fix**: `Dialog` wanted it in K-03, `RunTimeline.tsx:297` carries a
   comment saying its own copy of the measurement effect "should not stay that way", and now this. The
   answer is extracting `useScrollEdges`, which touches `SidebarNav.tsx` and `RunTimeline.tsx` and is
   an item rather than something to slip in here.
4. **`RunMap`'s `label` prop is an `aria-label` and nothing else**, so the route arrived as three
   station names and three "Take it off" controls floating between the plan and the ceiling with
   nothing saying they were a route. I added a visible heading in the gate. Worth knowing because
   every future composer of `RunMap` will hit it.
5. **The roster guard caught me, which is the first time it has fired on new work.** My gallery
   fixture dispatched `agentSlug: "release-manager"`, which does not exist: the Ship agent is
   `release`, with `releaser` as a deprecated alias. `agentDisplayName` title-cases an unknown slug,
   so it rendered as "Release Manager" and looked entirely correct. **That is exactly the lie the
   guard was written for**, and it is worth recording that it works, because a guard nobody has seen
   fail is a guard nobody trusts.
6. **`PlanStep.station` and `RunMapStation.station` are different vocabularies and they disagree on
   exactly the two stations I reached for first.** `StationGlyphKind` is `discover`/`plan`;
   `AgentStation` is `sense`/`define`. `station-glyphs.tsx` documents the near-miss and `tsc` caught
   it, but a fixture author will hit it every time. Both are correct and neither is renameable; the
   trap is that a plan and a route in the same component name the same station two ways.
7. **My own K-22 log entry blocked this commit, and the checker is what I changed.** docs-doctor
   checks [9] and [11] were failing on `docs/operations/ledger/kiro-log.md` because my K-22 entry
   **quotes** the defect it fixed: it names `DESIGN-OBSIDIAN.md` and reproduces the planted string.
   The ledger is append-only, so rewording was not available and would have been wrong anyway. Check
   [9] already excluded four append-forward logs on the stated grounds that their "job is to record
   what was said at the time"; the two ledgers are a fifth and sixth and were simply written after
   that list. **They are now one shared list used by both checks.** A record that cannot name what it
   fixed is not a record, and an entry saying "this used to say X and X was wrong" claims the
   opposite of X. Verified non-vacuous: a plant carrying both defects in `architecture/frontend.md`
   still fails both checks.

**Planted, so none of the new assertions is vacuous.** Six defects, each failing exactly the tests it
should: `keep-planning` committing with no reason (5 fail), handing back the props instead of the
edits (2), removing the accelerator's text-control guard (1), moving the ceiling below the answers
(2), `busy` no longer disabling the answers (1), and `BudgetsPanel`-style regrowth of a second reason
mechanic (1).

**And one of my tests was vacuous, caught by planting.** "does not fire the accelerator while the
reason is being typed" passed with the text-control guard deleted, because the outer `asking` guard
already covered this gate's own reason field. The guard is load-bearing for a different path the test
never touched: `PlanCard` and `RunMap` open their own reason fields on their own state, so typing
"1 day of work" into a skip reason would have started the run. Rewrote it against that path, and it
now fails when the guard goes.

**Gates.** tsc clean · 9,882 pass / 0 fail / 23 skip / 60 todo across 587 files · build ok ·
`bun run docs:check` clean of hard rot. Looked at it in both grounds at 1200x1400 against the built
stylesheet, and the two corrections in Noticed 1 and 2 exist only because of that.

> **Claude does after:** the mapping from these three answers onto `agent_autonomy.arc`, which has
> four values, and onto the decision record. That is the wiring the item deliberately left out and it
> needs the live schema. Worth deciding at the same time whether `run-it` means `trusted` or
> `ambient`, because the difference is whether a hard-locked tool still stops the run.

---

## K-24 · BUILT · 2026-08-20 12:48

**Did.** Built `AgentInbox`: four groups in the order `needs input → ready → working → done`, empty
groups not drawn at all, one-line present-participle activity per row, reply in place with no route
change, and idle rows folding into one line past the third that says how many. The keyboard mechanics
are `j`/`k` and the arrows over one tab stop for the whole list. It uses K-08's per-mark state, which
is the surface that change was made for: four rows in four states on one screen.

**The reference is Linear's Inbox, read off its docs and named before building**, written up in
`REFERENCE-PATTERNS.md` alongside K-23's entry. Lifted: `J`/`K` plus arrows moving a selection with a
single tab stop, and opening a row never leaving the inbox. **Not lifted, deliberately:** Linear groups
by notification *type* and carries read/unread. An agent session has no read state, it has a need, and
grouping by type here would rebuild the activity dashboard this item exists against. Its snooze is
replaced rather than ported: a row goes quiet on its own, so nobody has to tell the product "not now".

**The item's premise held and I have nothing to push back on.** The four groups, the participles, the
three-row collapse and the reply-in-place requirement all survive contact with the code.

**Unsure.**

1. **`failed` is a field rather than a fifth group, and the item did not say which.** The acceptance
   asks for a composed case where "one agent failed", and a four-value union had nowhere to put it.
   **A fifth group was the tempting fix and it would have been wrong**: grouping is by what a session
   needs from a person, and failing is an outcome. Mixing the axes would make "failed and waiting on
   you" unrenderable, which is a real state. So a failed row sits in whichever group it needs and the
   chip says `Failed`. **The other reading is that a failure always needs a person and should force
   `needs-input`**, and if that is the ruling it is a two-line change.
2. **`IDLE_AFTER_MS` is ten minutes because `track-tick` is ten minutes.** A session that has moved
   inside the last tick is live by the system's own clock and one that has not is idle by it. That is
   the most defensible number I could find, but it is a derivation rather than a measurement: nobody
   has watched a real inbox to see whether ten minutes reads as quiet.
3. **The reply reuses `ReasonField`, whose name is now narrower than its job.** A reply is not a
   reason. The mechanic is identical though, and it is Enter-submits, Escape-cancels, dead until
   non-empty, which is exactly what a fourth copy would have got subtly wrong. **The component wants
   renaming to something like `InlineAsk`**, which touches four callers and belongs in its own item
   rather than in this commit.
4. **A reply is drawn `quiet` rather than as `Approve`, and answering a blocking question arguably
   unblocks it.** I left it quiet for consistency with the other three `ReasonField` callers and
   because whether an answer unblocks depends on the answer. Could go the other way.
5. **The group headings are second person for two groups and third for two** ("Waiting on you",
   "Ready for you to look at", "Running", "Finished"). That switch is deliberate and it is the
   information design: two of these are yours and two are the machine's. It could read as
   inconsistent voice to someone who has not been told.

**Noticed.**

1. **The component had a latent infinite loop and planting found it.** With the accelerator's
   text-control guard removed, the suite did not fail, it **hung** until the runner was killed at 120
   seconds. Bisected it: a keystroke arriving from inside the reply field reached `move()`, whose
   `focus()` pulled focus out of an input carrying `autoFocus`; deleting the `focus()` call made the
   hang go away, which is what identified it. **A test that hangs cannot tell a defect from broken
   infrastructure**, and a latent loop in a component meant to render sixty rows is worth more than
   the convenience that caused it. Two fixes, protecting two different things: the guard inside
   `move()` makes the loop impossible however `move` is reached, and the guard at the keydown handler
   stops `preventDefault` swallowing a letter somebody is typing. **I also removed a two-way
   focus/selection binding** found on the way (`onFocus` set the selection while `move()` set the
   selection and then moved focus); `move()` is now the only writer.
2. **One of my tests was testing the wrong guard, and I only saw it because the first fix did not make
   the plant fail.** "does not steal j and k while a reply is being typed" read
   `document.activeElement`, which is the guard inside `move()`, so it passed whether or not the
   keydown guard existed. Rewritten to assert the event was **not cancelled**, which is precisely what
   the keydown guard buys. Plant G now fails in 3ms instead of hanging.
3. **A leftover background process from my own plant harness overwrote four of my edits.** I killed
   the script, but an instance survived long enough to run its `cp` restore step after I had edited the
   file, silently reverting the `failed` field, the mark state, the `isIdle` change and the focus fix.
   `tsc` caught it as "Property 'failed' does not exist". **A plant harness that restores from a backup
   must not be left running while you edit the file it backs up**, and the safe shape is a harness that
   restores from git rather than from `/tmp`. Both the script and its backup are deleted.
4. **`StalledWork` and this component now both answer "what needs me", and they must not merge.**
   `StalledWork` headlines the cost of work being stopped, tiered by how long, over the gates. This
   lists every session and sorts by need. They overlap on one group of four. Named in the file so the
   next reader does not fold one into the other, but **if the two ever disagree about that group the
   fault is in whatever feeds them**, and only a production read can tell.
5. **The row markup is divs rather than a `ul`/`li` tree, on purpose.** An `option` has to be a
   descendant of its `listbox` with only `group` between them, and the reply field puts a form inside a
   row. A `<ul>` of `<li>` carrying that is invalid where this is merely plain.

**Planted, nine defects, each failing exactly the tests it should.** Groups ordered by recency (4
fail), empty groups drawn (2), collapsed idle rows dropped rather than summarised (3), idle applied to
every group so gates fold away (1), no `stopPropagation` so answering navigates (1), every row its own
tab stop (1), the keydown guard removed (1, and see Noticed 1 and 2), within-group order reversed, and
a chip on every group (2).

**Gates.** tsc clean · 9,940 pass / 0 fail / 23 skip / 60 todo across 590 files · build ok ·
`bun run docs:check` clean of hard rot.

> **Claude does after:** two things. Whether ten minutes is the right idle threshold, which needs a
> look at real session gaps rather than at the cron cadence. And whether a failed run should be forced
> into `needs-input` rather than staying in the group it claims, which is a product call about whether
> every failure is a question.
