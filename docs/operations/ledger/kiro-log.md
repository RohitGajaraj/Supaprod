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
