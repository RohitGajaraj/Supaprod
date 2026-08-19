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
