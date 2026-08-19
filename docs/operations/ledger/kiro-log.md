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
