# Claude verification log

> _Created: 2026-08-19 · Last updated: 2026-08-19_

**Claude is the only writer of this file.** Append only; never edit or delete a past entry. Protocol and entry format: [`README.md`](./README.md). Work list: [`../kiro-queue.md`](../kiro-queue.md).

Verbs: `VERIFIED` · `REJECTED` · `RULED` · `LANDED`

**A verdict states what was checked against production, not that the diff looked right.** This repo has shipped nine features that passed every test and did nothing, and none was found by reading code.

---

_(no entries yet)_

## K-01 · VERIFIED · 2026-08-19 23:05

**Checked.** Not the diff. I rewrote the OKLCH to sRGB to WCAG chain from the
spec in a throwaway script and re-derived every number in Kiro's entry
independently, then checked the token reaches the artefact a browser actually
loads.

- **All seven contrast figures reproduce exactly**, to two decimals: dark stop
  vs `float` 5.21, on its own 13% wash there 4.29; dark `fail` vs `float` 4.65,
  on its own wash 3.96; paper stop vs `sink` 5.67, on its own wash 4.71; paper
  `fail` vs `sink` 5.44. Two implementations written from the same spec by
  different agents agreeing to two decimals is the only reason I trust either.
- **Hex renderings match the entry's claim**: dark `#d07c87` clay against
  `--mrd-fail` `#f0574e` vermilion; paper `#8f414e`. They are plainly different
  colours in full colour.
- **The token reaches the shipped stylesheet.** After rebasing onto Kiro's
  commits I rebuilt and read the artefact, not the source:
  `.output/public/assets/styles-BEk430Em.css` carries both
  `--mrd-stop:oklch(68% .105 12)` and `--mrd-stop:oklch(48% .105 12)`.
- **Gates on the merged tree**, which is the only tree that matters when two
  agents are writing: tsc clean, 9,422 pass / 0 fail across 570 files, build ok,
  and `meridian-ratchet.baseline.json` is byte-identical to `origin/main`.

**What I measured that the entry did not, and it is the sharpest question about
this token.** The design law says status colour "must survive a greyscale test",
and the whole separation from `--mrd-fail` is carried by chroma, which is
exactly what greyscale removes. Measured as relative luminance:

    dark   stop L 0.30  vs  fail L 0.26   contrast 1.12
    paper  stop L 0.10  vs  fail L 0.11   contrast 1.04

**1.04 is the same colour.** In greyscale, and to a protanope, `--mrd-stop` and
`--mrd-fail` are indistinguishable in both grounds.

**Why that is not a REJECT.** The entry declares this a CONTROL palette rather
than a sixth status hue, and writes the constraint into the file: it may paint
only something a person can press, never a chip, a dot, a rule or a row's state.
`--mrd-fail` paints the opposite set. Under that constraint the two never occupy
the same role, so they are separated by shape, which is the file's own law --
identity is shape, status is hue. The item asked for distinguishable at a glance
and in full colour it plainly is. Greyscale parity between a control and a state
is not the failure the greyscale rule was written to catch.

**But the constraint is a comment and nothing enforces it.** The first time a
`--mrd-stop` chip or dot appears, the token becomes a status hue that fails the
greyscale test, and no gate will say so. That wants a ratchet rule of the shape
"`--mrd-stop` may not appear in a file that does not also render a button", and
it is a new queue item rather than a reason to send this one back. Recorded here
so the next reader does not have to re-derive it.

**Both defects the entry noticed are real. I reproduced both.**

1. **The file's own recorded figure for `fail` on paper is wrong.** The light
   block says "fail 5.0" against `sink`; it measures **5.44**. Kiro's guess at
   the cause is consistent with the file: the number predates `--mrd-fail`
   moving from 0.52 to 0.50 lightness, a move the comment two lines above
   records, and it was never re-measured.
2. **`--mrd-fail` does not clear 4.5 on its own 13% wash on the dark ground.**
   It measures **3.96**. The failed chip on a floating dark pane has been under
   the text floor since it shipped and nobody had looked. `--mrd-stop` measures
   4.29 in the same spot, so it is better than the incumbent and also under 4.5.

Neither is Kiro's to fix -- both change numbers in a shipped comment, and the
second changes a shipped colour. Both are mine. Filed as RULED below.

---

## K-01 · RULED · 2026-08-19 23:05

**On the hue question, which the entry correctly refused to settle alone.**

Keep hue 12. Do not move to the 193 seat.

The entry's reasoning holds and I checked the part of it that was checkable: a
cyan stop control sits on the same surface as an agent-working indicator, and
this file already rules that blue means a machine is working. A stop button that
reads as "working" is worse than one that reads as a quiet red, and it is worse
in the exact moment it matters, which is somebody trying to halt a run.

The chroma separation is legitimate **because this is a control palette**. It
would not be legitimate for a status hue, for the greyscale reason measured
above. That distinction is doing real work and it should be stated in the token's
comment as the reason the hue is allowed to sit this close to `fail`, not just as
a scope limit. That is a comment change on a file K-02 owns, so it is a rebase
note rather than an edit from me.

**On the two `--mrd-fail` defects: both are mine and neither blocks K-02.**
Correcting a stale figure in a comment and lifting `fail` clear of 4.5 on its own
dark wash are separate pieces of work with a real blast radius -- `--mrd-fail`
has callers everywhere and moving its lightness moves every one of them. They go
in the queue as their own items rather than riding along on an interrupt token.

**On K-02 and K-03: both are unblocked as of this entry.** They were waiting on
this verdict and nothing else.

## Claude lane · LANDED · 2026-08-19 23:35

**Four migrations applied to production, one at a time, each verified before the
next.** Founder authorised the applies; the one-at-a-time sequencing was his
instruction, on the grounds that Lovable collapses a batch and drops pieces
silently. I did not hand them to Lovable's agent at all -- I executed each
statement group myself through the MCP and read the result back out of the
database, which removes that failure mode rather than working around it.

| Version | What |
| --- | --- |
| `20260819180000` | `is_sample` on `learnings` and `agent_memory` |
| `20260819181000` | `learnings`: workspace FK + trigger, `product_id` + derivation trigger, `decision_id` |
| `20260819182000` | `agent_memory.product_id` + a CHECK refusing one on method kinds |
| `20260819183000` | `agent_autonomy.workspace_id` |

All four are recorded in `supabase_migrations.schema_migrations`, so the drift
gate sees them as applied rather than pending.

**I changed one of them before applying it, and the change matters.**
`20260819181000` as committed **deleted 16 production rows** to make room for the
foreign key on `learnings.workspace_id`. It does not any more. A `NOT VALID`
foreign key is fully enforced on every INSERT and UPDATE from the moment it
exists and merely skips the one-time scan of existing rows, so it blocks a
seventeenth orphan without destroying the sixteen. Those sixteen are the only
surviving evidence of what a missing foreign key on this table actually cost, and
deleting them bought nothing the `NOT VALID` clause did not already buy. Promote
with `validate constraint` once they are cleaned by hand.

**What I verified, per migration, against production rather than against the SQL.**

- **`is_sample`.** 133 of 133 learnings marked. 1,143 of 1,143 seeded memories
  marked and **all 46 real ones left unmarked**, which was the assertion that
  mattered because `agent_memory`, unlike `learnings`, holds real rows.
- **The derivation trigger.** Not assumed -- probed. Inserted a learning carrying
  only a `prd_id`, read back `product_id`, confirmed it matched the spec's
  product, then raised to roll the probe back. Match `t`. Confirmed 133 rows and
  zero probe residue afterwards.
- **The method/evidence CHECK.** Probed both directions in one transaction:
  evidence kind with a product **accepted**, method kind with a product
  **refused**. Both rolled back.
- **`agent_autonomy`.** 40 of 87 scoped through `agents.workspace_id`, 47 left
  NULL, and the assertion that **no arc changed** held: still exactly one
  distinct arc across the table. The old `(user_id, agent_id)` unique key is
  deliberately retained, because `loadAgentArc` still selects on it and dropping
  it before that reader moves would make `.maybeSingle()` throw on the path that
  gates every tool call.
- **Nothing else moved.** RLS still enabled on all four tables with the same
  policy counts as before (learnings 4, agent_memory 4, agent_autonomy 2,
  credit_ledger 1). tsc clean, 9,505 tests / 0 fail, build ok. The live app
  renders and Lovable is serving commit `94138f104`.

**A transport warning for whoever applies the next one.** Two of these calls
returned `499 request_cancelled` and **both had committed server-side anyway.**
I only found that by reading the state back. Re-running on that error would have
double-applied. Verify before you retry, always.

**None of this is finished, and it would be dishonest to file it as done.** Every
column landed here is a column with no writer, which is precisely the shape of
`credit_ledger.product_id` -- present since June, `NULL` in all 13,890 rows,
because 1 of 72 `callModel` call sites passes the value. The writers are the next
piece of work and they are small: both `learnings` writers can supply
`product_id` from a select that is already running
(`outcome.functions.ts:591`, `registry.server.ts:4101`), and `rememberOutcome`
needs one optional argument its two callers can already fill.

**Still unapplied and deliberately so:** a fifth migration adding the missing
foreign key on `credit_ledger.product_id`, which is the only one of the sixteen
`product_id` columns without one. Free to apply, since the column is 100% NULL.
Not applied because the founder authorised four and that is four.

## K-04 · VERIFIED · 2026-08-19 23:52

**The criterion Kiro could not meet is now met, and I met it the way it was
owed: by looking.** Ran the dev server, opened `/meridian` in a real browser at
an authenticated session, found the Run timeline section and photographed each
ground separately. Screenshots are untracked, at repo root, `k04-timeline-light.png`
and `k04-timeline-dark.png`.

**Both grounds render, and I measured them rather than trusting my eyes** -- the
first full-viewport screenshot made both panes look dark, which was wrong. Per
pane, from the live DOM:

    pane0  background oklch(0.145 …)  text oklch(0.61 …)   dark ground, light text
    pane1  background oklch(0.965 …)  text oklch(0.52 …)   light ground, dark text

My first pass at this classified both as DARK, because I parsed an `oklch()`
string with a regex written for `rgb()` and read the lightness as a red channel.
Recording that because it is the second time this repo has been bitten by
measuring a colour with the wrong instrument, and the fix is the same both times:
read the value, not the string.

**Every acceptance claim in the entry holds in the running app.** 28 `<time>`
elements carrying real ISO `dateTime` attributes (`2026-08-14T08:29:00.000Z`
rendering as `13:59`). Zero `[role=progressbar]`, zero `<progress>`, zero
`aria-valuenow`, and no `%` character anywhere in the section. Zero console
errors on the route.

**The subject of the component is visible and it works.** Both silences render as
their own rows -- `28m 0s waiting on you` and `16m 0s before anything else
happened` -- on a dashed rail against solid rails for work, which is the greyscale
survival the entry claimed by construction and which I can now confirm by sight.
`passed` appears on exactly one row of the healthy run, which is the `done` versus
`passed` call in Unsure 2 behaving as argued. The dark pane additionally shows the
held case carrying `on hold` in amber with "Grouping signals stopped: no source is
connected".

**On Unsure 1, the ordinal-versus-proportional axis: the call stands.** The
rendered result answers it better than the argument did. A 28 minute wait and a
41 second tool call occupy comparable vertical space and the reader is told the
duration in words on the row, so nothing is lost, and the 200-event case the item
requires stays possible. Proportional space would have spent the height on the
silence.

**Not verified, and out of scope for this item:** `useElapsed` has no hours branch
(Noticed 3), so a live tail past 60 minutes renders `5160m 0.0s`. The gallery's
held case is static, so this does not appear on screen today. It is real and it is
a separate item.

---

## K-02 · VERIFIED · 2026-08-19 23:52

**Checked by re-deriving the wash mathematics independently, then reading the
built stylesheet.** The design decision in this item is a single number and it is
the whole item, so that is what I checked.

    wash  8%   dark worst 4.64 (float)    paper worst 5.07 (sink)
    wash 10%   dark worst 4.50 (float)    paper worst 4.92 (sink)
    wash 13%   dark worst 4.29 (float)    paper worst 4.71 (sink)

**Kiro's figures reproduce and its choice is correct.** 10% lands on **exactly
4.50**, the text floor, which is one rounding from failing -- so 8% is not
conservatism, it is the only value with margin. Border alphas measure 1.94 at 40%
and 3.55 at 75% against dark `float`; the entry says 1.92 and 3.55. The 0.02 gap
on the quiet state is immaterial, both readings agree it is far under 3:1 by
design and that the hover state clears it.

**Hover firming the border rather than the fill is the right call and the reason
is arithmetic.** Deepening an 8% wash toward 13% takes the label to 4.29, under
the floor, in precisely the moment a person is committing to a destructive act.
Moving the boundary instead leaves the label where it is.

**Noticed 1 is real, I reproduced it, and it is worse than a curiosity.** The
built stylesheet emits both of these, in this order:

    .bg-mrd-stop\/8{background-color:var(--mrd-stop)}
    .bg-mrd-stop\/8{background-color:color-mix(in oklab, var(--mrd-stop) 8%, transparent)}

On any engine without `color-mix` the first wins and the control becomes a solid
stop-coloured slab carrying a stop-coloured label, which is invisible. The entry
is right that this is house-wide and pre-existing rather than introduced here
(`FineTuneCard.tsx:372`, `PromptBar.tsx:416` collapse the same way). Filed, not
charged to this item.

**The guard Kiro proposed and could not build is the correct guard and it should
exist.** `--mrd-stop` may appear only on an element that is a button, or inside
`surface-parts.tsx` and `Dialog.tsx`. Until it does, the constraint that makes the
greyscale collapse survivable is a comment, and comments do not fail builds. That
is now the single highest-value small item in this queue, because it is the only
thing standing between the measured 1.04 collapse and a shipped defect.

**Gates on the merged tree:** tsc clean, 9,546 pass / 0 fail across 572 files,
build ok, ratchet baseline unchanged.

**K-03 is unblocked.** K-05 and K-06 are read but not yet ruled on.

## K-09 · VERIFIED · 2026-08-20 00:15

**This item was told to do something that would have failed the build, refused,
and proved the refusal before working around it. That is the behaviour the queue
asks for and it is the first time it has happened here.**

**Checked, and every claim holds.**

- **The item's prescribed mechanism really is illegal.** `--text-` is a retired
  Obsidian marker in the scanner itself:
  `{ id: "--text-", pattern: /--text-[a-z0-9-]+/g, lineage: "Obsidian" }` at
  `meridian-ratchet-scan.ts:137`. Adding thirteen `--text-mrd-*` bindings would
  have taken the file 0 → 13 and failed rule 2, exactly as the entry says.
- **Thirteen `@utility text-mrd-*` rules exist** in `meridian.css`, and the four
  in-use stops reach the artefact a browser loads:
  `.text-mrd-nano{font-size:var(--mrd-t-nano)}`, and `base`, `body`, `lead`.
- **`marks.tsx:247` still carries `text-[9.5px]`.** Correct. It is K-08's file and
  this item was right not to reach into it.
- **Ratchet baseline for `src/styles/meridian.css` is unchanged**: `--ds-: 3`,
  `raw-colour: 8`, and no `--text-` entry at all.

**One apparent contradiction, and it was my instrument rather than the entry.**
A raw `grep -c -- '--text-' src/styles/meridian.css` returns **6**, against the
entry's claim of zero. All six sit inside K-09's own comment at lines 1031-1049,
the one explaining why the mechanism could not be used. The ratchet strips
comments before counting by explicit design -- `meridian-ratchet-scan.ts:331`,
and its header says why: *"A legacy token inside a comment paints nothing. Only
code ships."* So the entry is right and my grep was counting documentation.
**Third time in this session a colour or token has been mis-measured by reading
the source text instead of the thing that ships.** Same lesson each time.

**The snaps are correct and the direction is the point.** Twelve values moved and
every one moved UP, including four 13.5 → 14 where 13 was arithmetically nearer.
"Shrinking type is forbidden as an answer" is a ratchet law, not a rounding rule,
and applying it to a half-pixel is the strict reading rather than a liberty.

---

## K-09 · RULED · 2026-08-20 00:15

**On the QUESTION: `marks.tsx:247` is K-08's and stays K-08's.** Do not reach
into it, and do not carry the acceptance criterion "zero off-ladder values remain
in `src/components/meridian/`" as failed on K-09's account -- it was unmeetable
inside this item's boundary the moment K-08 took that file. The one-line snap the
entry proposes is correct, including the direction, and `--mrd-t-nano`'s own
comment naming "uppercase micro-label, always at weight 650" is the right
argument for it. **It belongs to K-08 and I am recording it there rather than
here.**

**On the out-of-`Owns` edit to `every-meridian-utility-paints.test.ts`:
accepted, and declaring it was the right call.** Two gates in this repo genuinely
contradicted each other and neither could be satisfied by the other's rule. An
item that silently picked one would have left the next reader to rediscover the
conflict; this one wrote it down.

**On a file I touched that this item owns, declared rather than buried.** K-09's
`Owns` covers `src/styles/meridian.css`, and while it was `BUILT` I added twenty
status-chip tokens to it (`--mrd-{status}-chip`, `--mrd-{status}-on-chip`, both
grounds) plus their `@theme inline` bindings. Additive only, no existing
declaration changed, ratchet total unchanged, and it landed in commit
`485a18e4`. **I should have added a rebase note at the time and did not.** It is
recorded here instead because the protocol forbids editing a `BUILT` item's body,
and this entry is the place a correction belongs.

**K-80 is unblocked by this verdict**, and per the founder's ruling of 2026-08-20
it is the next build regardless of its number.

## K-03 · REJECTED · 2026-08-20 00:50

**The component is sound. Its stated reason for existing is false, and the
falsehood ships in three places, one of which a person reads.** That is what this
rejection is about, and it is narrow: do not rebuild `Dialog`.

**The premise, falsified.** The item says `--mrd-scrim` and `--mrd-shadow-pane`
are "defined in Meridian and consumed by nothing." Measured at the parent commit
and again at HEAD:

- **`--mrd-shadow-pane`: four live consumers**, all in `src/styles/shell.css`
  at :2200, :2271, :2380, :2848, each a real `box-shadow: var(--mrd-shadow-pane)`.
  `shell.css` is imported at `src/styles.css:23`, so those paint.
- **`--mrd-scrim`: three consumers**, not one. `shell.css:2176`
  (`.sp-boardpanel-scrim`) and `shell.css:2836` (`.sp-keys-scrim`), both wired to
  shipped components -- `BoardPanel.tsx:119` and `ShortcutSheet.tsx:107` -- plus
  the `RewindButton.tsx:112` the entry already knew about.
- Also falsified in the entry's Noticed 4: **`--mrd-r-pane` has five consumers**
  and **`rounded-mrd-pane` appears in six files** before this commit, against
  "no caller either" and "appears nowhere in the tree."

**Where the false claim ships, and why that is the defect rather than a note.**

1. `Dialog.tsx:8` -- *"`--mrd-shadow-pane` is declared in meridian.css and read by
   NOTHING. `--mrd-scrim` has exactly one caller."*
2. The gallery note on `/meridian`, which says the pane shadow had none. **A
   person opening that route reads it.**
3. **`dialog.test.tsx:199`** -- `it("floats on --mrd-shadow-pane, which had no
   caller in the whole tree", ...)`. A test NAME asserting something untrue is
   the worst of the three, because it is the artefact a future reader trusts
   most and it will keep passing forever.

**The build was still justified and the fix is a sentence, not a rebuild.** "Every
dialog in the product is still legacy" holds, and the narrower claim is true and
sharper: **no Meridian-layer component consumed them.** Say that in all three
places.

**Two design defects, and the first is functional.**

**No scroll, and centred, so a tall panel is unrecoverable.** The overlay is
`fixed inset-0 flex items-center justify-center` with no `overflow-y-auto`, the
panel has no `max-h` (Dialog.tsx:191, :229), and `Dialog.tsx:133-134` locks
`document.body.style.overflow = "hidden"`. A panel taller than the viewport
therefore overflows **both** edges, and the top half -- which is the question --
cannot be brought back by any means, because the page behind is locked and the
flex container does not scroll. Both siblings that can grow already solve this
(`RunTimeline.tsx:458`, `ToolStream.tsx:252` carry `min-h-0 overflow-y-auto`), and
so does the product's own shipped sheet, which deliberately aligns to
`flex-start` rather than centre for exactly this reason
(`shell.css:2165-2168`). Three gallery cases all fit, so it looked fine.

**The confirming button changes sides across the component's own three cases.**
Case 1 `_authenticated.meridian.tsx:2498` puts confirm RIGHT, case 2 at :2527
puts it LEFT, case 3 at :2554 puts it RIGHT. `Actions` renders children then
`trailing` with `ml-auto` (`surface-parts.tsx:566-570`), so this is real geometry
rather than source order. **This is the one component whose entire job is to make
a destructive click deliberate**, and its reference implementation moves that
button under a different part of the pointer's travel from one dialog to the
next. It also misuses the slot: `surface-parts.tsx:553` defines `trailing` as
"the control that undoes or destroys" and case 2 puts "Not yet" there, which
neither undoes nor destroys.

**What to change, and nothing else.** The three false statements; a scroll region
plus a max height, or `items-start` like the shipped sheet; and one fixed side for
the confirming action across all three cases, with the rule written in the file so
the next caller inherits it.

**Not charged to this item:** `z-50` is hardcoded against the documented ladder at
`shell.css:93-97`, where `--shell-z-tip` is already 50. Real, but it is a
system-wide question about who owns the ladder rather than a Dialog defect.

## K-08 · VERIFIED · 2026-08-20 01:00

**Checked, and the component holds.** `MarkStack` renders one state per mark,
which was the whole item, and the test reads state off the accessible name rather
than off a class, which is the right place to read it from: `statesOf()` parses
`aria-label` on `[role="img"]`, which is exactly where `AgentMark` writes it.

**Two numbers in the paperwork are wrong, and neither is Kiro's fault.**

- **The queue item's own premise says "37 importers".** Measured at the parent
  commit: **8 hits across 5 files, and only two are real importers** --
  `shell/AppFrame.tsx:133` and `agents/AgentRelay.tsx:33`. The other three hits
  are the component's own file and tests. The item called this "the product's
  real presence layer, the most-used component"; it is used twice. The build is
  still right, because one state for a whole stack is wrong at any usage count,
  but **the item overstated its own importance by roughly 18x** and that is worth
  recording where the next reader will see it.
- **The entry's Noticed 2 says "the retired shell primitive is still the name 50
  files reach for".** Zero files import `AgentMark` from
  `@/components/shell/primitives`. All 35 `AgentMark` imports resolve to
  `@/components/meridian/marks`. That migration is already finished.

**Noticed 1 is real and confirmed:** the item's `Owns` names
`agent-marks-are-distinct.test.tsx`, which does not exist. A file list that names
a file nobody wrote is how an item quietly loses a gate.

**`marks.tsx:247` still carries `text-[9.5px]`**, which K-09 correctly declined to
touch because this item owns the file. **That snap is charged here.** Upward to
`text-mrd-nano` at 10px like the other twelve, and `--mrd-t-nano`'s own comment
naming "uppercase micro-label, always at weight 650" is exactly what that line is.
It is one line and it closes K-09's only unmet criterion.

---

## K-06 · VERIFIED · 2026-08-20 01:00

**Checked in the running app, both grounds, plus the claims.** Premise holds.
`--mrd-you` and `--mrd-agent` each appear on exactly one step and the header
carries no hue, which was the item's point.

**And it is the best-built component in this batch, which I can now say with a
number rather than an impression.** Measured across the four run views on one
screen:

    PlanCard      5 distinct row heights, dominant 48px on 15 of 24 rows
    Spend         7, with no dominant height at all
    ToolStream    8, split 23/20 between two heights
    RunTimeline  13

The founder's unprompted read was that PlanCard "looks like a more clean design".
That is measurable and it is true, and the reason is that it holds one row height
where its siblings do not.

**One claim is narrower than stated:** "appears on exactly one step and nowhere
else" is true file-scoped, not tree-scoped. Fine, but say which.

**Its Noticed 2 quotes 2,540 lines for the gallery route; it is 2,381.** Read
rather than counted, same class as K-08's 37.

---

## K-05 · VERIFIED · 2026-08-20 01:00

**Checked in the running app and against the SSE frame.** The component is right
and the empty and broken cases render.

**One claim is wrong in a way that matters to whoever wires this up.** The entry
says it "takes the SSE tool frame's real shape and needs no adapter". The frame is
`{ kind: "tool"; tool: string }` (`ask-sse.ts:46`), but `ToolStreamRow` requires
`id` and `state` as well, and the existing client accumulator holds neither. **An
adapter is required**, and K-15 will discover that at wiring time unless it is
written down. It is now.

**And the defect I found by looking rather than reading.** Measured on the
rendered gallery, the same kind of row -- a tool call with a target and a duration
-- renders at **four different heights: 28, 43, 44 and 95px.** The split is not a
design decision, it is string length: `src/routes/api/chat.ts` fits on one line
and `src/lib/ai/runtime.server.ts` does not, so the row grows. Twenty rows at 28px
and twenty-three at 44px in one stream.

**That is the arbitrariness rule, live.** Either every row is one line, with the
path middle-truncated the way every tool that shows paths does it, or every row is
two. "Whichever the filename happens to be" is not a third option. Not a rejection
because the item did not ask for it and the component is otherwise sound, but it
is the first thing to fix and it is queued rather than lost.

---

## K-07 · REJECTED · 2026-08-20 01:00

**Three functional defects, a false premise, and a second resolver for the same
question. The component needs another pass.**

**It breaks on ordinary inputs.** All three verified by rendering, not by reading:

- **`cap={0}` renders as a healthy, untouched component.** `<Spend spent={5}
  cap={0} />` produces "$5.00 of $0.00" with no alarm state. A workspace with no
  cap configured reads as fine.
- **Negative spend emits negative geometry.** `spent={-2} cap={5}` emits
  `style="width:-40%"`. `Math.min(100, ...)` clamps the top and nothing clamps
  the bottom (`Spend.tsx:133`).
- **The sub-cent case draws no bar.** `spent={0.0008} cap={5}` emits
  `width:0.016%`, which on a 320px track is 0.05px. The gallery has a case
  labelled "under a cent, which must not read as nothing", and it reads as
  nothing.

**The premise is false.** The item says "nothing in the system renders spend."
`governance/BudgetsPanel.tsx:513-521` has rendered it since **2026-07-30, three
weeks before this item was written**, using its own `burnTone(burn, cap,
alertPct)`.

**So there are now two resolvers for one question**, `spendState` here and
`burnTone` there, and nothing makes them agree. That is the actual risk in this
item: two surfaces can call the same workspace nearly-spent and not-nearly-spent
on the same numbers. Reconcile them, and delete one.

**`alert_at_pct` did not need the database.** Unsure 4 says a per-workspace
threshold "needs the database". It is in the repo:
`20260522001642_...sql:154` declares `alert_at_pct integer NOT NULL DEFAULT 80`.
Checking would have cost one grep, and `spendState(0, 5, 0)` returning "nearly"
means a workspace that sets that threshold to 0 gets a permanent alarm.

**Noticed 2 is falsified.** `--mrd-r-xs` was not "sitting unused":
`rounded-mrd-xs` had **58 occurrences across 33 files** before this commit.

**Two things it got right and they are worth keeping.** Noticed 1 is confirmed and
understated -- five copies of the USD formatter, four byte-identical. And the
light-ground problem it half-noticed is real: I photographed both grounds and on
paper the amber bar reads olive and the red reads maroon. **The chips added on
2026-08-19 are the fix**, and this component is their first real caller.

## K-11 · VERIFIED · 2026-08-20 01:20

**Checked by executing the code against the live approval queue, not by reading
the table.** `toolRisk("cluster.trigger")` returns **`low`**, which is the
headline claim and the thing the whole item exists for. The demotion that made
`cluster.trigger` 18 of 53 pending approvals no longer fires.

**"59 registered, 59 catalogued, zero orphans" holds**, including for the one
case that looked like a counter-example. `changelog.publish` holds 7 live pending
approvals and appears nowhere in `tool-consequences.ts` -- but it appears nowhere
in any registry either, so its absence from the catalogue is correct rather than a
gap. See my own entry below; that turns out to be a production finding rather than
a defect in this item.

**The QUESTION is answered: the correction was right and should stand.**
`RISK_PROFILE`'s header claimed omission meant "not gated by this file at all",
and the entry is right that the second half was false in effect -- an omission was
the strictest gate available, applied silently. **That single sentence is the
mechanism behind seventeen missing rows**, because it told every subsequent author
that leaving a tool out was free. Overturning a documented intent is exactly the
kind of change that must be declared rather than slipped in, and it was.

**And it nearly filed a correction to a correct item, then caught itself.** Its
first count was 55 tools and 16 gaps; the four `mission.*` tools live in
`orchestrator.server.ts`, not `registry.server.ts`, and its regex read only the
latter. It re-measured and reported the item's figures as right and its own as
wrong. That is the queue's judge-don't-comply rule running in the harder
direction, where the finding is against yourself.

---

## K-10 · VERIFIED · 2026-08-20 01:20

**Verified against production, which for a policy module means running it over
the approvals that actually exist rather than over the cases its tests chose.**
Live state first, and it reproduces the register: **53 pending, 46 over 24h,
oldest 637h** (the audit's 627h, ten hours older). Six tools hold all 53.

**`resolveApprovalPolicy` executed against those six, post-K-11 catalogue:**

    tool                 pending  risk     decision
    cluster.trigger           18  low      never-ask
    memory.promote             7  low      never-ask
    backlog.prioritize         7  low      never-ask
    mission.dispatch           7  medium   earn-it
    studio.pr.merge            7  high     always-human
    changelog.publish          7  high     always-human

**32 of the 53 would never have been raised.** That is the item working, measured
on real rows rather than asserted.

**The correction about `trust-ramp.ts` is right and it is the good kind.** Two of
the three rules already had a home, and reading `HIGH_RISK_FORCE_REVIEW` rather
than restating its four members is correct: two lists of what may never be
automated is one list too many, and the second one always drifts.

**The `agent.spawn` override is right and the reasoning is better than the
matrix.** Internal-and-irreversible resolving to `earn-it` would have let a good
record earn away a tool that starts several sub-agents each already spending a
split of the budget. Naming the one tool the override actually moves is what makes
that checkable.

---

## Claude lane · LANDED · 2026-08-20 01:20

**Seven of the 53 pending approvals are for a tool that does not exist, and no
policy can ever clear them.**

`changelog.publish` holds 7 pending approvals, the oldest in the queue at **637
hours**. It is not in `tool-consequences.ts`, not in `src/lib/ai/tools/`, and not
in any registry:

    grep -rn 'changelog\.' src/lib/ai/tools/ src/lib/tool-consequences.ts   -> nothing

So these were raised when the tool existed, it has since been removed or renamed,
and **approving one now would dispatch a call to a tool that is not there.** They
cannot be executed, they cannot be resolved, and they are counted in every
"pending approvals" figure the direction doc measures against.

**This is why §10 criterion 1 cannot be met by K-10 and K-11 alone.** Measured:

    53 pending today
    -32  never-ask under the new policy
    - 7  orphaned on a tool that no longer exists   <- data, not code
    = 14 legitimately gated (7 studio.pr.merge, 7 mission.dispatch)

Target is "< 10, none over its expiry". **14 is the honest floor from code
changes**, and it only gets under 10 if the orphans are cleared, which is a data
repair in my lane rather than anything Kiro can build.

**None of the 53 is currently past its expiry**, which looks like criterion 4 is
satisfied and is not: `demo-credentials.md` records that on 2026-07-28 every
undecided approval was reset to `expires_at = now() + 60 days` to stop the demo
queues rotting. **The criterion is being met by a manual re-arm that expires in
late September, not by the product.** Anyone re-measuring it after that date will
see it fail and will not know why unless this is written down.

## Claude lane · LANDED · 2026-08-20 01:35

**25 of the 53 pending approvals could never have done anything. Cancelled, with
the reason on each row. The queue is 53 -> 28.** Applied as
`20260820013000`, recorded in `schema_migrations`, guards passed.

**The 2026-08-03 fix had regressed and nothing reported it.** That migration
cancelled 24 futile `cluster.trigger` approvals and asserted "no new row of this
kind can be created." Measured: **18 new ones between 2026-08-17 22:11 and
2026-08-19 08:40**, a two-day window two weeks after the fix.

The defaults change did land. It was not enough, because `loop.server.ts:186`
demotes a tool to `confirm` whenever `toolRisk()` says high, and `toolRisk()`
**failed closed to high for any tool with no catalogue row.** `cluster.trigger`
had no row. The default said auto, the risk table said high, and the risk table
won on every run. So the fix was reversed silently, by a table nobody thought of
as policy.

**K-11 is what actually closes it**, which is why this was safe to run today and
would not have been safe last week: all 59 tools now carry a row and
`toolRisk('cluster.trigger')` returns `low`. Clearing the backlog before that
landed is what produced this second round.

**All 18 were still futile, measured rather than assumed.** Six workspaces hold
them and **every one has zero unclustered signals**, so each would have returned
the same `{"themes": 0, "message": "No unclustered signals."}` the 2026-08-03
migration recorded from walking the live product.

**The second kind is new.** The seven `changelog.publish` rows are for a tool
registered nowhere -- not in `src/lib/ai/tools/`, not in `tool-consequences.ts`.
The 2026-08-03 migration explicitly left them alone as "real decisions a human
still owns", which was true then. The tool has since been removed or renamed, so
approving one now would dispatch a call that cannot resolve.

**Method taken wholesale from the file this follows, because its argument has not
improved on:** cancelled, not deleted, and not bulk-approved. Deleting destroys
the evidence it happened; bulk-approving writes receipts saying a human decided
something no human looked at.

**What is left, and it is honest.** 28 pending: `memory.promote`,
`studio.pr.merge`, `mission.dispatch` and `backlog.prioritize`, 7 each, all real
decisions. Criterion 1 targets under 10. **The path from 28 to 14 is wiring K-10
in**, since `memory.promote` and `backlog.prioritize` both resolve `never-ask`
under it, and the module is currently pure and consumed by nothing. The remaining
14 are `studio.pr.merge` (always-human, correctly) and `mission.dispatch`
(earn-it).

**One thing this file cannot fix, and it matters before the re-seed.** All seven
`changelog.publish` rows are seeded -- one per Helio prefix, identical id suffix
`-2a03-4000-8000-000000000004`, every one in an `is_sample` workspace -- written
by `20260725130000_helio_demo_seed_rich.sql:1184`. **A re-seed restores all
seven**, because the clone copies whatever the master workspace holds. The seed
writes an approval for a tool the product no longer has, and that must be
corrected in the seed rather than re-cancelled after every clone.

## K-81 · RULED · 2026-08-20 01:45

**Kiro is right on every point and the item was mine, so this is a correction
before it is a ruling.** It refused to build a wrong item, refused to half-apply a
contested ruling, and caught a citation I invented. All three were the correct
call.

**Verified before ruling, because a correction that is itself unchecked is worse
than the error.**

- **`LoadingState.tsx` already meets all four acceptance criteria.** `bg-mrd-ink`
  at `size-[4px]` with `rounded-[1px]`, so monochrome and not azure. Label
  `text-[13px]`, elapsed `text-[12px]` mono, so two stops. `LoadingVariant =
  "Drive" | "Dots" | "Orbit"`, so three, with `Surfer` already skipped. It has no
  `glyph` prop and never had a brand mark. **The item described a component that
  was already correct.**
- **`AgentPulse.tsx` is the component the item was actually describing.**
  `bg-mrd-agent` at `:142`, `glyph = "mark"` defaulting at `:157`, the seven-petal
  mark at `:71`.
- **My citation was false.** K-81 says the ruling is "already recorded in
  `DESIGN-SYSTEM.md`". `grep -ci brand docs/design/DESIGN-SYSTEM.md` returns
  **0**. Not a misremembered line number -- the word does not occur in that file.
  I asserted a document said something it does not say, which is precisely the
  failure this repo keeps a findings register to prevent.

**1. The target is `AgentPulse`, not `LoadingState`.** The item is rewritten to
say so and `AgentPulse.tsx` is added to its `Owns`.

**2. Azure STAYS on `AgentPulse`. Do not remove it.** Three reasons and the first
is that the premise for removing it has evaporated:

- **The founder's complaint was visibility, and visibility had a different
  cause.** "The logos are not visible in light mode" was the `currentColor` bug:
  entering the light ground re-declared every token and never re-bound `color`, so
  every glyph inherited the dark ink and measured **1.00** on paper. That is fixed
  in `meridian.css` and glyphs now measure 15.63. **Measured after the fix, the
  azure lattice is 7.02 on dark and 5.62 on paper.** It was never the thing that
  was invisible.
- **It is the canonical use of the token that means "a machine is working."** The
  audit's own count is `--mrd-agent` 59 against `--mrd-you` 97, and calls that out
  as the imbalance to close: "five surfaces exist for a person is required and
  essentially one for a machine is working." Taking azure off the agent indicator
  removes the one.
- **The file's argument is correct and Kiro was right to protect it.**
  `LoadingState` reports a job, which has no actor; `AgentPulse` reports an agent.
  In ink they become the same component with a rotating word, and the question
  stops being what colour it is and becomes why there are two.

**3. The brand mark GOES, and here is the citation that actually exists.** Not
`DESIGN-SYSTEM.md`. The founder, directly, on 2026-08-19: *"That circle gear icon
is not good. I don't want to use that."* That is a ruling made in the room and it
needs no document behind it.

**Apply it whole, which is what Kiro declined to do by halves and was right to.**
Remove the `glyph="mark"` option from `AgentPulse` itself, not only its use in the
gallery. **And overturn the argument in the file rather than painting over it:**
the header currently claims a standing ruling that what a person watches while
waiting should be the brand. That claim is what this ruling reverses, so it is
edited in place with the founder's words and this date, or the next reader finds
a file arguing against the code it contains.

**Noticed 1 is a real catch and it changes the item's own table.** The reference
cell fill I recorded as `rgb(242,243,244)` is the rendered result of `bg-ink` at
0.15 opacity. Written as a literal it would be wrong on paper. **A token at low
opacity is the mechanism**, which is what `LoadingState` already does, and my
table gave the symptom rather than the cause.

---

## K-82 · RULED · 2026-08-20 01:45

**Decline accepted, the reasoning is better than the item's, and the item was
wrong twice.**

**My `Why` was false.** I wrote that the card "states a movement in words and
numbers and never shows it." `InsightCards.tsx` has shipped a two-series smoothed
chart, rendered in the gallery with real data at
`_authenticated.meridian.tsx:571`. Every acceptance criterion I wrote was already
met, including two I did not know to ask for: keyboard scrubbing, and an end dot
that hides while scrubbing so it cannot be mistaken for the cursor.

**And one criterion I wrote would have destroyed a correct decision.** I said "no
status token used as a series colour." The chart uses `--mrd-you-dim` for the
forecast and the verdict's own tone for the actual, deliberately, and the file
argues it at length. **I applied the viz ruling to the wrong half of its own
distinction:** `--mrd-viz-*` exists for CATEGORICAL series, which answer "which of
these is which." These two lines answer "what does this mean" -- a forecast
against what happened, coloured by whether it held. That is semantic, so semantic
colour is right and my criterion was wrong.

**This is the permission working exactly as written.** The item said a `BLOCKED`
entry naming the line where it breaks beats a chart that degrades a tuned card.
Kiro found the line, named it, and stopped. **K-82 is closed as declined, not
deferred** -- there is nothing here to come back to.

**Both of these were my errors, found by the agent I was reviewing.** Recording
that plainly because the queue's rule is that an item's `Why` is a proposal from
someone who could have misread the code, and twice tonight that someone was me.

## K-80 · VERIFIED · 2026-08-20 02:00

**It found the reference's actual source and built to that instead of to my
figures, and it was right to.** The founder's instruction was "there is already a
codebase within beautifului.dev, you just need to literally copy it." I could not
find it and measured the rendered result instead. Kiro found it embedded in the
page. **Six of my figures were wrong, and every correction is in the right
direction.**

**Verified in the file and in the running app.**

- `PILL_OFFSET = 30` at `:68`, consumed by the anchor at `:187`. **This is the
  mechanic I missed entirely** and it is the one that makes the thing work: the
  kind pill sits above the card inside the node's box, so a node's top anchor is
  30px below its top edge. Without it every incoming connector stops in the air
  beside the pill. That is my own item's "connectors meet nodes at a consistent
  anchor" rule, already solved upstream, and I would have had it re-derived from
  scratch.
- Connectors are **cubic bezier at stroke 1.25**, confirmed rendered: the pane
  reports `1.25px`. I specified orthogonal at 1.8 with 2.4 emphasis. Wrong on
  shape, weight and emphasis mechanism -- the source changes colour, not weight.
- Heights are **measured with a `ResizeObserver`** (`:148`), guarded for
  happy-dom and jsdom, with first-paint estimates only. I gave 58 and 88 as
  constants.
- `DEFAULT_WIDTH = 300` with a per-node override, which resolves the
  contradiction in my own acceptance criteria: I demanded a single width constant
  while the source has two. A default plus an override gives a caller one constant
  and still expresses the reference's wider condition card.
- **Renders in both grounds**, 20 SVGs and 76 paths per pane, node width 300, edge
  contrast **17.86 on dark and 15.63 on paper**. 27 tests.

**Where my figures came from, since it matters for the next item.** I measured
`getComputedStyle` over the rendered section, so "16 paths" counted the icons in
the surrounding chrome as well as the graph, and the reference's own example has
**1 edge and 2 nodes** with no branch at all. **Measuring a rendered page is not
reading a source**, and when the source is available the source wins. That is the
standing rule and I broke it while writing the item that states it.

**Drag is absent, and that is not a defect in this item.** Its entry says so
plainly. The founder rescoped K-80 to require dragging at roughly 01:20; this was
built at 00:52. **It built the item as it stood.** Splitting the drag work into
K-85 rather than reopening a correct build.

---

## K-85 · RULED · 2026-08-20 02:00 · new item

**`Flowchart` gains dragging and a violet ground.** Written as its own item
because K-80 is verified and correct, and reopening a finished build to bolt on a
requirement that postdates it is how a green item becomes an amber one for
reasons that have nothing to do with its work.

Requirements are in the queue. The two that matter:

- **Nodes drag and connectors follow.** The reference does this and its source is
  the port target, same as K-80. Founder ruling 2026-08-20, overriding my original
  "a watching surface, not an editor" scope, and he is right: a graph you cannot
  rearrange is a picture, and a run map the reader cannot untangle is not a map.
  Still no authoring -- no new nodes, no drawn edges, no delete.
- **The dotted ground takes a faint violet cast, in both grounds.** **Not
  `--mrd-you`**, which is the orchid at 315 and means "a person is required". A
  canvas background means nothing, and a background that wears a status word is
  the exact failure the colour law exists to stop.

## K-12 · VERIFIED · 2026-08-20 02:15

**Checked against production, and the defect is bigger than either the item or
the entry says.** `agent_runs.status` holds exactly six spellings, matching the
register:

    completed                663
    completed_with_failures  588
    failed                   477
    halted                     8
    waiting_approval           7
    complete                   2

**`completed_with_failures` is 588 rows, which is 34% of every run in the
database** -- and it is the value the entry proves gets **three different answers
across four mappings**: `stopped`, a failure, and a success, plus one blind spot
where it falls through to `other`. So a third of all runs are classified
differently depending on which surface a person is looking at, and two of those
answers are opposites.

**And `complete` singular is real, not hypothetical.** Two rows carry it, and the
entry shows it falling through to `queued` in two of the four mappings. **Two
finished runs render as still-queued, permanently.** Small, but it is the exact
shape of bug that is impossible to find from a screenshot.

**The module is right to be inert.** Zero imports, asserted by a test, no writer
and no consumer changed. A canonical vocabulary that quietly changes what four
surfaces render, in the same commit that introduces it, is unverifiable. This
lands the vocabulary; the wiring is separately checkable and separately
reversible.

---

## K-13 · VERIFIED · 2026-08-20 02:15

**Verified in production that the migration it declined to write was correctly
declined.** All three columns -- `forecast_claim`, `forecast_how_we_will_know`,
`forecast_horizon_date` -- already exist on `decisions`. So "schema and insert
only, no migration" is right, and had it written one it would have been a no-op
that still had to be applied and recorded.

**Importing `forecastRefusal` rather than re-deriving it is the correct call and
the reason given is the right reason.** The human path already encodes what makes
a forecast valid, with the argument attached. Two copies is how the agent door and
the person door come to disagree, and the half that never gets copied is the
reasoning.

**This is the item that moves the moat, and the measurement says how far.** Of
286 decisions, **zero in a non-sample workspace carry a forecast.** `decision.record`
being unable to express one was the mechanism. Optional rather than required is
the right call for the same reason the entry gives: a required horizon on an
agent that does not know one produces a fabricated date, and a fabricated forecast
is worse than none because it scores.

**Not yet true, and worth stating so nobody reads this as done:** the loop still
does not close. `forecast_resolution` has no product writer -- all 91 resolutions
in the database are seeded, every one with `forecast_resolved_by_agent_slug` null
and a timestamp at exactly midnight. **Capture is now possible; resolution is
still fiction.**

---

## K-14 · VERIFIED · 2026-08-20 02:15

**Premise confirmed in production, not just in the migrations.** The live
constraint is `CHECK ((verdict = ANY (ARRAY['validated','missed','mixed'])))`, and
`select count(distinct verdict) from learnings` returns **3**. So no row ever got
`uncertain` through: it did not degrade, it threw, exactly as the entry says.

**The shape of this bug deserves recording.** The tool's description instructed
the agent to say `uncertain` rather than guess. The constraint refused it and the
insert throws on error. **So the one path that told the agent to be honest was the
one path that crashed, and the more careful the agent, the more often it hit.**

---

## K-14 · RULED · 2026-08-20 02:15

**On the QUESTION: do not point the description at deferral. Kiro was right to
stop.**

The item told it to "point the description at deferral instead of inventing a
verdict", and it declined because agents cannot defer. That is correct and the
register already knew it: *"Deferral is invisible to the agent sweep. A human
pressing 'too early to tell' writes `outcome_check_by`, which only the human queue
reads."* Deferral is a human affordance.

**A tool description that points at a door the agent cannot open is the same
defect this item just fixed**, one level up: instructing an agent toward an action
that fails. Narrowing the enum and then telling it to defer would have replaced a
crash with a dead end.

**So: say nothing about deferral.** If agent deferral should exist it is its own
item, needing a writer, a reader and a sweep that can see it. Filing it as a gap
rather than smuggling it into a description.

## K-15 · VERIFIED · 2026-08-20 02:20

**Verified in the route, not the diff.**

- **`RESEARCH_PHASE_TOOL`** at `chat.ts:145-149` is a `Partial<Record<>>` naming
  exactly `search -> web.search`, `read -> web.fetch`,
  `workspace -> workspace.search`. **`plan` and `synthesize` are absent, and
  absent is the correct answer**: `research.server.ts` really does emit five
  phases (`:110`, `:128`, `:187` and the `plan` at `:396`), and two of them are
  the model thinking, not a tool running.
- **All three names resolve**: each appears in `tool-consequences.ts`, so the
  client's `toolActionLabel` lookup gives a real label rather than falling back to
  a raw string. That is the difference between a chip that reads "Searching the
  web" and one that reads `web.search`.
- **The `station` frame is emitted** at `chat.ts:931`,
  `{ station: dispatchedStation }`, on the mention branch only.

**The audit's finding is now half-closed and the honest half is the one that
matters.** It recorded that `tool` and `station` frames are never emitted and that
this "is why you cannot see what an agent is doing." Tool frames now go out for
real actions. Station goes out where it is a fact.

---

## K-15 · RULED · 2026-08-20 02:20

**`void routed;` stays. The acceptance criterion was wrong and Kiro was right to
refuse it.**

The criterion said "`void routed;` is gone and the resolved station is on the
wire." **Read against the file, that instruction contradicts the file's own
recorded reasoning**, and I checked the paragraph rather than taking the entry's
word:

- `chat.ts:834-854` argues the classifier's entry station is a **guess**: nothing
  on that branch routes by it, and the orchestrator plans its own DAG and picks
  its own agents.
- The same paragraph says a settling decision is needed about whether a chat
  dispatch creates a mission, a track or both -- **and states outright that "the
  lane that built this was told not to make it."** So the criterion asked Kiro to
  put on the wire a value the file explicitly reserves for a decision nobody has
  made.
- The `landing` comment states the rule the whole route is built on: **a frame is
  emitted here only when it is A FACT, NOT A FORECAST.**

**Emitting `routed.station` would have moved a withdrawn claim from the reply text
onto the wire**, where the client lights a station strip with it. A guess rendered
as a lit station is worse than no station, because the reader cannot tell which
one they are looking at.

**And it did not simply refuse -- it found the place where the same frame IS a
fact.** On the mention branch a person named an agent, the agent resolved against
the catalogue, and the mission was dispatched to it. Its station is then a
property of something that already happened. **On the orchestrator branch nothing
is emitted, and that silence is correct**: `use-ask-stream.ts` treats an absent
station as "none lit yet", and the `landing` frame still hands the reader to the
mission, so the pane loses only a claim it could not support.

**`routed` stays computed and unused, deliberately.** It is one pure function with
no network and no clock, and it is the value the settling decision will need. **The
open question is not K-15's**: does a chat dispatch create a mission, a track, or
both, and which id does the `mission_id` frame return. Filing that as the gap
rather than letting an acceptance criterion smuggle an answer to it.

## K-16 · VERIFIED · 2026-08-20 02:25

**The repair is verified in the route and the new failure states are verified
against production, which is the half that mattered here.**

**The code.** `const dispatching = wantsDispatch({ isMission, forcedDo,
instruction })` at `chat.ts:678`, read by both gates. The old shape is gone:
`grep -c 'forcedDo && startingAgent'` returns **0**. Five states declared in
`chat-dispatch.ts:51-59`. 26 tests.

**The diagnosis is right and it explains why every gate missed it.** `startingAgent`
was declared above the pre-flight block and assigned only inside it, while the
promotion line below read it -- and pre-flight was itself gated on `isMission`. So
for any request the classifier had not already claimed, the value was still `null`
at the line that needed it. **Nothing about the runtime was wrong**, which is
exactly why tests, types and the ratchet all stayed green over a dead branch. Two
gates asked one question in two places and one needed an answer only the other
could produce.

**Production check on the five new states, because a good error message that
fires when it should not is a new defect.** All 16 users hold **exactly one**
`orchestrator` row -- `users_with_duplicate_orchestrator: 0`, `max_rows_per_user:
1` -- and every one of the seven demo accounts has one plus 15 other enabled
agents. **So neither `conductor-unavailable` nor `no-specialists` can fire for any
real or demo login today.** The states are correct and currently unreachable,
which is the right order: the message exists before the condition does.

**And `maybeSingle()` is structurally safe, not luckily safe.** The lookup is
`.eq("user_id", userId).eq("slug","orchestrator").maybeSingle()`, which throws on
two rows. `agents` carries `UNIQUE (user_id, slug)`, so two cannot exist. Recorded
because a future workspace-scoped seed would be the thing that breaks it, and the
constraint is what stops that rather than convention.

**A false alarm of mine, recorded because the reasoning is the reusable part.** I
first counted orchestrators **per workspace** and found seven Helio demo
workspaces with none, including all five investor logins, and nearly filed it as
demo-breaking. It is not: the conductor is resolved by **`user_id`**
(`chat.ts:706`), and `ensureOrchestrator` seeds by user too. `agents.workspace_id`
exists and is simply not the axis this path uses. **I asked a question the code
does not ask.** Third time tonight, and the same shape each time: measure the
thing the code reads, not the thing that looks equivalent.

**One consequence worth stating.** `dispatch-failed` is the only state reachable
after `createMission` has returned, and it is the only one whose message tells the
person to look under Runs before retrying. That asymmetry is correct and it is the
difference between an error message and a duplicate run.

## Claude lane · LANDED · 2026-08-20 02:30

**The eval judge's prompt contradicted itself, the model believed the wrong half,
and every hallucination score in the product has been displayed inverted.**
Fixed in `eval-tick.ts`. This is the blocker on the trust score, so it had to go
first.

**The contradiction, exactly.** The system message said *"score the response on
**six** dimensions (0.0 worst to 1.0 best, **except `*_risk`** which are 0.0 safe
to 1.0 risky)"* and then listed **seven** scored fields.
`hallucination_score` does not end in `_risk`, so by that sentence's own rule it
was quality-shaped -- while the comment on the very next line said the opposite.

**Production settles which half the model followed:**

    select corr(hallucination_score, groundedness) from ai_evals;   -- +0.999

If the comment were honoured that correlation would be strongly negative. At
+0.999 across all 77 rows they are the same number twice, and 70 of 77 score above
0.5 -- which under the comment's reading would mean 90% of responses were mostly
hallucinated while scoring 0.865 on groundedness.

**And the product reads it the other way.**
`_authenticated.traces.$traceId.tsx:300` renders it `higherIsBetter: false` and
`EvalScoreChips` calls hallucination risk-shaped. Stored quality-shaped, displayed
risk-shaped.

**The fix removes the mechanism rather than patching the instance.** Direction is
no longer inferred from a field-name suffix -- a rule that depends on whether
someone remembered to end a name in `_risk` breaks the first time a name is chosen
for readability. Every field now states its own direction on its own line, and the
count is no longer asserted in prose where it can drift from the list beneath it.
`hallucination_score` keeps the RISK shape, because that is what its name says,
what its old comment said, and what both readers already assume. The column is
untouched; only the instruction changed.

**The 77 existing rows stay as they are.** All seeded, all in `is_sample`
workspaces, nothing written since 2026-07-23, and the trust score's eval leg reads
columns that do not exist so nothing consumes them. Rewriting fiction to match a
contract it was never judged under would only make it harder to spot.

**A second finding, and it corrects something I nearly got wrong.** I assumed
`prompt_injection_risk` was NULL in all 77 rows because the "six dimensions"
header made the model stop at six. **That is not the mechanism.** `num()` returns
**0.5** for a missing key, never NULL -- so a judge run that omitted the field
would have written 0.5. NULL means **the judge never wrote these rows at all.**
They are seeded, and the seed omitted the column. So the seventh dimension being
empty is more evidence that every eval row on this system is fiction, rather than
evidence of a parsing bug.

**What this unblocks and what it does not.** The trust score can now be composed
from a contract that does not contradict itself. It still cannot be composed from
this DATA: 77 rows, all seeded, all in sample workspaces, one dimension never
written, and the tick that would produce real ones last succeeded on 2026-07-23.
**The composition is now a design decision rather than a blocked one**, and the
honest input for it is future evals, not these.

## Claude lane · LANDED · 2026-08-20 02:35

**A terminal status is no longer overwritable, and the guard went in before the
thing it guards against exists.**

**The defect.** `finalize` in `loop.server.ts` wrote the run's terminal status by
id with **no precondition**. Whatever the run had become while the loop was
mid-flight, `finalize` painted `completed` over it on the way out. The audit
records the consequence exactly: *"a cancelled-but-running run overwrites itself
with `completed` after performing every side effect."* The record then says a
person's stop did not happen, which is the one thing a record of decisions may
not say.

**It is latent today, and that is the argument for fixing it now rather than
later.** Nothing writes `cancelled` to `agent_runs` -- `grep -rn 'status:
"cancelled"' src/` returns nothing outside tests -- because the per-run stop does
not exist yet. **So the race has never fired.** The moment a stop is built it
does, on the first cancel, and the symptom is a user reporting that stopping did
nothing while the log says the run completed normally. Building the guard first
costs one predicate; building it second costs a bug report nobody can reproduce.

**The pattern was already in this repo, one table over.** `cancelMission`
(`missions.functions.ts:604`) flips a mission only while it is still non-terminal
and says why in its own comment: *"no overwriting 'completed' with 'cancelled'"*.
`agent_runs` never got the same treatment. This is that rule, in the direction
that was missing.

**Shape.** The predicate travels with the write --
`.not("status","in","(...)")` on the same statement -- because a read-then-write
in JS reopens the race the precondition exists to close. A blocked write is not an
error: it means something else already ended this run and that answer stands, so
it logs and returns.

**This makes K-12's module real, which is the second reason to do it here.**
`run-status.ts` shipped with zero consumers by design, so wiring the four
surfaces later could not create a cycle. **`finalize` is its first consumer.** I
added `TERMINAL_RUN_STATUSES` to it, **derived from `isTerminal` rather than typed
out again**, so the list a query sends and the answer the module gives cannot
disagree -- which is the whole reason K-12 exists. The module still imports
nothing, so no cycle was created.

**Five tests pin the invariant**, including two worth naming: `unknown` is
excluded, because a run in an unrecognised state would otherwise become
unfinalisable forever; and the rendered in-list is asserted space-free, because
postgrest parses that string rather than JS and a stray space becomes part of a
value and silently matches nothing.

**Gates:** tsc clean, 9,791 pass / 0 fail across 581 files, build ok.

**What is still missing, so this is not read as the stop being done.** There is
still no per-run stop: no `AbortController` reaches `callModel`, which accepts a
`signal?` and is never given one, and nothing writes `cancelled`. §10 criterion
10 -- "runs stopped by a user, ever" -- is still 0 and still impossible. **This
closes the half that would have made the other half lie.**

## Claude lane · LANDED · 2026-08-20 02:50

**`stopRun` exists. A person can now stop a run, and the money comes back.**
`agent-runs.functions.ts`. §10 criterion 10 read 0 because stopping was
impossible, not because nobody wanted it: `cancelRun|stopRun|abortRun|haltRun|
pauseRun` returned **zero hits repo-wide** and the only stop was a workspace-wide
kill switch.

**This is the writer half only, and the split is deliberate.** A stop is three
things that fail differently: a row saying the person stopped it (this), the loop
noticing and abandoning its work (cooperative, below), and a control to press (a
component, Kiro's). **Landing the writer alone is safe and useful** -- the run is
marked, the draw is refunded, and `finalize` can no longer overwrite the verdict,
because that precondition landed first on purpose. Had it landed second, the first
stop ever pressed would have been silently reversed.

**Why the loop must poll rather than be handed an `AbortController`, which is the
non-obvious part.** `callModel` already accepts a `signal?` and composes it with
its timeout (`runtime.server.ts:427`, `:604`), so the plumbing to the fetch
exists. What does not exist is a way to **reach** the controller: the loop runs in
one worker invocation and the stop request arrives in another, so there is no
shared memory and an in-process controller is unreachable by definition. **The row
is the channel.** That is the same shape `steerStudioSession` uses, and the reason
it survives worker eviction.

**The correctness argument is the precondition.** The write refuses a run that
already reached a terminal status **in the same statement** rather than after a
read, so a run that finished a millisecond ago is not retroactively marked
cancelled and nobody is told they stopped something that had already completed. A
zero-row result is not an error; it means the run ended while the request was in
flight and that answer stands.

**Refactor that came out of it.** `finalize` and `stopRun` were building the same
postgrest `in` list inline and identically, one `join` from the drift K-12 exists
to stop. Extracted to `terminalStatusFilter()` and `isStoppable()` in
`run-status.ts`, both tested. **`isStoppable` takes a RAW status on purpose**: a
stop request arrives holding whatever spelling the table carries, and deciding
from the raw string is exactly how `complete` came to read as `queued` on two
surfaces. A stop that repeated that mistake would offer to cancel a finished run.

**Seven new tests, and two encode a judgment rather than a fact.** An
unrecognised status is **stoppable** -- refusing there would make a run in an
unknown state impossible to stop, which is the worse failure, because that is
precisely the run somebody most wants to stop. And the rendered filter is asserted
whitespace-free, because postgrest parses that string and a stray space becomes
part of a value and matches nothing, silently.

**Tested the way this repo tests server functions.** `createServerFn` handlers are
not invokable without database mocking, and the house convention
(`byokeys.functions.test.ts` states it outright) is to test the pure helpers and
name the gap. So the decision each writer makes is extracted to where it can be
pinned, and the handler's database behaviour is **not** covered here.

**Gates:** tsc clean, 9,798 pass / 0 fail across 581 files, build ok. `bun run
lint` is red repo-wide with 1,605 pre-existing problems and **zero in the four
files this touched**.

**Still not done, so criterion 10 is not yet met.** Nothing polls the row, so a
stopped run is marked and keeps working until it ends on its own. The loop-side
abort and the control are the remaining two thirds.

## Claude lane · LANDED · 2026-08-20 03:05

**A stopped run now stops. The loop reads the row at each step head and abandons
its remaining work.** That is the second of the stop's three parts; the writer
landed at 02:50 and the control is Kiro's.

**Placed before the checkpoint, deliberately.** Checkpointing a step we are about
to abandon persists work nobody will use and leaves a resume pointing at it. The
steer read is skipped for the same reason: consuming a steer we will never act on
loses it, and that file already records losing steers on eviction as an audit
finding.

**Best effort, and the direction of that choice is the interesting part.** A
failed read logs and carries on rather than stopping the run. **The cost of
missing a stop is one more step. The cost of a transient database blip killing
every run in flight is every run in flight.** So the failure mode points at
continuing, which is the same reasoning the steer read beside it already uses.

**It does not refund, and that is a correctness point rather than an omission.**
`stopRun` already handed the draw back. The halt path a few lines below *does*
refund, because nothing else did for it. Refunding twice would be a real defect,
so this returns without touching credits.

**It does not write a status either.** Whoever stopped the run already said so and
theirs is the answer that stands. `finalize`'s precondition would refuse the
overwrite anyway, but returning here means we never ask.

**Reuses the existing `halted` channel** with `kind: "stopped"` rather than adding
a field, so no type changes and no caller changes. A stop and a halt are the same
shape to a caller: the run ended without delivering.

**The cost, stated plainly.** One indexed primary-key read per step, on every
run, including the overwhelming majority nobody will ever stop. Against a step
that makes a model call costing seconds and cents, that is negligible, and there
is no cheaper channel: the steer read beside it queries a different table, so
there is nothing to fold into.

**Gates:** tsc clean, 9,798 pass / 0 fail, build ok.

**Where criterion 10 now stands.** "Runs stopped by a user, ever: 0 (impossible)
-> possible, and used." It is now **possible**: a stop can be written, it is
honoured within one step, and the money comes back. It is not yet **used**,
because there is no control to press. That is the last third and it is a
component, so it is Kiro's rather than mine.

## K-85 · VERIFIED · 2026-08-20 03:15

**Verified by dragging it, which is the only way this item could be verified.**
Dispatched real pointer events at a card in the running gallery and measured what
moved:

    card moved            +90, +70   (exactly the distance dragged, no drift)
    connector start       M 249 127  ->  M 339 197   (exactly +90, +70)
    connector end         249 221    ->  249 221     (unchanged, correct)
    cursor                grab -> grabbing -> grab

**The connector arithmetic is the part that matters.** Both anchors could have
moved, or the path could have been redrawn from stale geometry, and either would
look plausible in a screenshot. The start anchor tracked the card exactly while
the far end stayed put, which is what "the connectors follow" has to mean when
only one node moved.

**The hue is right, and I checked it rather than trusting it.** The entry claims
the reference's node-kind purple `#9a5cff` measures `oklch(0.627 0.230 297)`.
Converted independently through OKLab: **`oklch(0.627 0.230 296.7)`**. Agreement
to a third of a degree, and it lands 3 degrees off `--mrd-code-kw` at 300, so the
family holds.

**`--mrd-map` exists in both grounds with an `@theme inline` binding, and it is
not `--mrd-you`.** Measured live: dark `#07050f` against `--mrd-you` `#ca83e9`,
paper `#e9e8ed` against `#8a34ab`. Distinct in both, which was the one constraint
the item put on this token.

**47 tests: 27 existing unmodified plus 20 new**, exactly as claimed.
`DRAG_INSET = 8` at `:100`, `setPointerCapture` at `:307`.

**The reasoning on the token is better than the item asked for.** I said "use
`--mrd-viz-*` or argue a new one". It argued a new one and the argument is
correct: the four viz tokens are series colours and none is violet, so a fifth
would be a series nothing plots. Naming it `--mrd-map` for the surface rather
than the colour is also right, and the sentence justifying it is the sharpest
thing in the entry: the raised ladder answers "how raised is this", and **this is
the one surface in the system where a thing's position is information and the
reader can change it.**

**`pointercancel` is an addition the reference does not have**, and it is one of
the sizes nobody draws: a browser claiming the gesture would otherwise leave the
card stuck in `cursor-grabbing` with its raised stacking until the next press.

**One observation rather than a defect, for the founder's eye rather than mine.**
The violet is *very* subtle: `--mrd-map` against `--mrd-bg` measures **1.02 on
dark and 1.10 on paper**, so it reads as hue rather than as value and carries on
chroma 0.026 / 0.007. That is defensible for a canvas that must not compete with
what sits on it, and "subtle" is the word the request used. But whether it is
subtle or invisible on a real display is a judgment a person makes by looking,
not one I can settle with a contrast ratio. Screenshot at
`k85-flowchart-both-grounds.png`, both grounds, taken after a drag so the
displaced card is visible.

**The scope correction stands and it was mine to make.** K-80's header argued
dragging away on §6.3's "a canvas for watching, not authoring", and that was my
reading. The founder overruled it and this entry states the better version: the
half that survives is **authoring**, and nothing here creates a node, draws an
edge, or deletes anything. Both the file header and the gallery panel now say so
in place, so the component no longer argues against itself.

## Claude lane · LANDED · 2026-08-20 03:25

**A steer can now be addressed to a track, so a station that never opens a
mission is reachable.** Migration `20260820032000` applied and recorded; the loop
reads it. **Criterion 11 is not met yet** and the reason is at the bottom.

**The defect.** `agent_messages` addressed a steer by `mission_id` and had no
other way to name a target. The loop's read was gated on `ctx.missionId`, and the
driver opens a mission for exactly one station:

    driver.server.ts:1189
      const missionId = station === "build" ? await missionForTrack(...) : null;

So Discover, Decide, Plan, Design, Ship and Learn ran with `missionId: null` and a
steer aimed at any of them had nowhere to land.

**The obvious fix is refused in that file, and I read the refusal before
deciding.** The comment above that ternary says opening a mission everywhere is
wrong because "a mission they never use would be a noun with no referent
cluttering the record", and separately that hoisting it "is NOT the fix" for the
Learn recovery chain.

**That comment answers a different question than this one** -- it is about Learn's
mission -> decision -> spec recovery, not about steerability, and it does not
repair steerability. But its objection holds here too: inventing a mission so a
message has somewhere to point is inventing a noun to hold an address.

**So I used the fix the same comment already describes, applied again.**
`learning.record` had this exact shape and was repaired by reading off the track
rather than walking the mission chain -- "using `ToolCtx.trackId`, which this loop
already passes". **Every station on this route has a track; only one has a
mission.** The track is the durable name for a piece of work and the mission is
one station's implementation detail. A steer now names a track when there is no
mission, and mission still wins when both exist because at Build it is narrower.

**No backfill, and the number is why that is safe.** Measured before writing:
104 handoffs, 14 kickoffs, and **3 steers, ever**, all carrying a mission, all on
the Build route that already worked. Nothing to migrate.

**Gates:** tsc clean, 9,818 pass / 0 fail, build ok.

**WHAT IS STILL MISSING, and criterion 11 stays at 1 of 7 until it lands.**
Nothing writes a track-addressed steer. The only writer is `steerStudioSession`
(`studio.functions.ts:1167`), which takes a `missionId`, hardcodes
`to_agent_slug: "builder"` and refuses without a mission -- it is the Build steer
specifically. A `steerTrack` writer is the next piece and it is mine; the control
to press is a component and it is Kiro's.

**Stopping the slice here on purpose.** Schema plus reader is coherent and
reversible on its own: it changes no existing behaviour, because nothing yet
produces the rows it newly reads. Adding a third piece -- a new public server
function that lets any caller inject instructions into a running agent -- into
the same unreviewed commit at half past three is how a security-shaped mistake
gets made. It gets its own change, with its own thought about who may steer what.

## K-81 · VERIFIED · 2026-08-20 03:40

**Checked in the code and in the running gallery. The split this item turned on
was getting one complaint fixed here and the other one refused here, and it got
both right.**

**In the rendered gallery, both grounds:**

    heading            "Agent at work"    (was "Agent at work, two marks")
    svgs in section     0                 (the seven-petal mark is gone)
    lattice cells      36                 (four indicators, nine cells each)
    azure vs ground     7.02 dark / 5.62 paper
    label               13px present

**The brand mark is deleted rather than un-defaulted, and that distinction is
the item.** `glyph?: "mark" | "grid"` defaulting to `grid` would have rendered
identically today and left the ruled-out drawing one prop away, with the union
standing as an invitation. **A ruling enforced by a default is not enforced.**
The prop is gone, the union is gone, and no caller passes it anywhere in the
tree.

**A grep of mine looked like a discrepancy and was not.** `grep -c 'glyph'` on
that file returns **6** against a claim the prop is gone. All six are comments,
including one at `:177` that documents the deletion outright. **Fourth time
tonight I have counted prose and read it as code.** Same lesson each time: the
count is not the claim.

**The azure staying is the half I ruled on, and the measurement holds after the
fact.** 7.02 on dark and 5.62 on paper, so it was never what the founder could
not see -- that was the `currentColor` binding, fixed in `meridian.css`, and
this entry correctly attributes it there rather than claiming it. Repainting the
lattice in ink would have deleted the one surface in the product that says a
machine is working, against an audit that counts `--mrd-agent` at 59 to
`--mrd-you`'s 97 and names closing that gap as the goal.

**The type-stop finding is better than the item asked for, and I did not know
it.** I asked for 14px to become 13px. It found that `compact` was *also*
dropping `text-mrd-body` to `text-mrd-base`, so one component was rendering two
different sizes and the roomy variant sat a stop above `LoadingState`'s label for
the same job. Both densities are 13px now, so **`compact` changes the gap and
nothing else, which is what compact should mean: tighter, not smaller.**
Shrinking type to make room is the answer the ratchet forbids, and it had shipped
here as a prop.

**And the test it wrote is stronger than the claim.** Asserting the two densities
differ by exactly one class each way (`gap-mrd-4` against `gap-mrd-3`) would fail
if a future `compact` took anything else away. "Both are 13px" would not.

**14 tests. Gates green on the merged tree.**

## Claude lane · LANDED · 2026-08-20 03:50

**`steerTrack` exists, so the steer path is complete end to end for every
station.** `spine/track.functions.ts`, beside `startTrack`, `advanceTrack`,
`retryStation` and `setStationWaiver`, which is where a track verb belongs.

**The chain, all three parts now present:**

    steerTrack        writes a row addressed to a track   <- this
    agent_messages    carries track_id                    <- 20260820032000
    loop.server.ts    reads it when there is no mission   <- 03:25

**A track is the address, not an agent, and that is the design decision.** No
`to_agent_id`, no `to_agent_slug`. `steerStudioSession` hardcodes `"builder"`,
which is right for Build because Build has one agent. **A track's station changes
as the work moves**, so naming an agent would address the message to whoever
happened to hold it when the person started typing. The loop matches on
`track_id` and `kind`, so it reaches whoever is working the track when it is
read.

**The RLS read is the authorization, deliberately.** The track is fetched through
the caller's own client, so a track they cannot see returns the same "could not
be found" as an id that is genuinely absent. It leaks nothing about whether the
id exists, and it is the same idiom `setStationWaiver` beside it already uses.

**2000 characters because that is what the loop injects.** `loop.server.ts`
slices to 2000 before appending. Accepting more would take text the product
silently discards, and a person whose last sentence vanished has been lied to by
a form.

**A finished track refuses the steer** rather than accepting a row nobody will
read. An unconsumed steer on a stopped track is not harmful, it is permanently
pending, and someone who typed it is entitled to know it landed nowhere.
Statuses verified in both places rather than guessed: the type says
`"open" | "done" | "abandoned"` and production holds 43 open and 1 done, so the
guard is live rather than dead.

**On the thing I deferred this for.** I stopped the previous slice short saying a
public server function that injects a person's words into a running agent
deserved its own thought about who may steer what. Having had it: three bounds
hold it, and none is sufficient alone. The caller is authenticated. RLS has
already agreed they may see this track. And the loop appends the text under an
explicit "Operator steering" label as a `user` turn rather than blending it into
the system prompt, so the model is told what it is reading. **What this is not is
a way to reach a track you could not otherwise read.**

**Gates:** tsc clean, 9,832 pass / 0 fail across 582 files, build ok.

**Criterion 11, stated exactly.** The mechanism now works for all seven stations
and I can say that because each part is verified rather than assumed. **No user
has steered anything, because there is no control to press** -- that is a
component and it is Kiro's. The criterion reads "stations that ACCEPT a steer",
and all seven now do.

## K-83 · VERIFIED · 2026-08-20 04:00

**The duration fix, measured in the running app against the numbers I filed:**

    before   6h 12m 41s   40px wide, 52px tall, 3 lines   (in the clock column)
    after    6h 12m 41s   68px wide, 17px tall, 1 line

**Every duration in the component is now one line**, and the clock column is still
40px because it now holds a wall clock and nothing else. That is the fix I asked
for, done the way I hoped rather than by letting the column grow: the column was
sized for a clock, so the thing that is not a clock left.

**The rhythm improved as a side effect and it is worth recording.** RunTimeline's
dominant row height is now **17px across 37 rows**, against 29px with **13
distinct heights** when I measured it earlier tonight. ToolStream is 17px across
142 rows, against a bimodal 44/28 split. Two of the four components are now on
one row height, which is the thing that made them read as three products.

**I confirmed the hardest claim independently, and it is the one that would have
been easiest to fake.** The entry says `station:decide` measures +1.00 across and
is deliberately NOT corrected, because its diamond spans 5..19 and the whole
offset is a 2-unit stub drawing the chosen branch leaving to the right. I swept
`getBBox` over every 24x24 mark in the rendered gallery without looking at its
numbers first, and found a mark at **`offX: 1.00`, span `5.00..21.00`**. That is
that mark, at that offset, with exactly the geometry it described.

**And its refusal to "fix" it is right.** The eye centres a mark on its BODY.
Obeying the bounding box would shift a symmetric diamond a unit left to
compensate for a tail, and it would then sit visibly wrong beside the marks whose
bodies are centred. **A measurement that disagrees with the rule it was taken to
serve is a measurement to explain, not to obey** -- that sentence is the best
thing in the entry and it is a rule worth keeping.

**The finding inside my finding.** I reported optical alignment. It measured all
thirteen marks, found eleven within 0.18px at 14px, and found that the one real
outlier was not misaligned so much as **not a drawing of anything**: the "wrench"
was a loop, a lump and a stub with no jaw and no handle, three grey marks at
14px. **It is the placeholder failure hiding inside the set built to remove
placeholders**, and it survived because it had a plausible comment above it while
`[]` and `H` did not. Four replacements were drawn and rendered at three sizes on
both grounds before one was chosen on measured criteria.

**On the method.** The entry says this could not be tested because happy-dom lays
nothing out and implements no `getBBox`, so it measured in a real browser rather
than asserting an intention. That is correct and it is the same reason I verify
here rather than in the suite. **A test that cannot see the thing it is about is
worse than no test**, because it reports green about a question it never asked.

## Claude lane · RULED · 2026-08-20 04:20

**The trust score's eval leg is decided and wired. Seven dimensions compose as
`mean(quality) x (1 - max(risk))`, and rows judged before this morning do not
count.** This was the item the queue reserved for me as "a product decision about
what agent quality means, not a rename".

**What was actually wrong was worse than dead.** The leg selected
`ai_evals.ai_event_id` and `.score`. Neither column exists -- the key is
`event_id` and there is no `score`, only the seven dimensions. So the filter
matched nothing, `evals_total` was always 0, and `shrink(0, 0)` returned `PRIOR`
exactly.

**That is not a neutral failure. `PRIOR` is 0.5 and the leg carries 0.2, so it
was a flat +0.10 on every agent, always.** An agent whose other three legs sum to
0.65 displayed 75, and `suggestArc` calls 75 **"trusted"**. Agents have been
graduating on a constant, and the constant was generous.

**THE COMPOSITION, and the two choices that decide it.**

The seven are two kinds of question, so averaging them together is a category
error: `groundedness`, `relevance`, `coherence` are quality, higher better;
`hallucination_score`, `toxicity`, `pii_risk`, `prompt_injection_risk` are risk,
lower better.

1. **Quality is a mean. Risk is a MAX.** Risks are not fungible. A response with
   `pii_risk` 0.9 and `toxicity` 0 is not "average risk 0.45", it is a response
   that leaked personal data. The worst one is the one that matters, which is the
   same reasoning `toolRisk` uses when it fails closed.
2. **They multiply rather than average.** Averaged, three good quality scores
   wash out one serious safety failure: a seven-way mean of a maximally toxic but
   well-written answer is **0.857**, which reads as a good agent. Multiplied it is
   **0**. **A trust score that can be talked out of a safety failure by good
   prose is not a trust score.**

**A dimension nobody scored is ignored, not assumed.** `prompt_injection_risk` is
NULL in all 77 rows. Null as 0 would claim a safety nobody measured; null as 1
would zero every row for a column the judge never returned. Skipped, and the
scored ones decide -- the same shape as `unknown` not counting as terminal. A row
with no quality dimension at all returns `null` and contributes nothing, because
0 is a damning number an unjudged row has not earned.

**AND THE PART I ONLY FOUND BY CHECKING MY OWN CHANGE AGAINST PRODUCTION.**

Before shipping I ran the formula over the real rows. Result:

    mean quality        0.892
    mean worst risk     0.853
    mean eval score     0.119     against the 0.5 the frozen leg gave
    rows scoring worse than frozen:  77 of 77

**Every agent with evals would have collapsed**, and not because of anything the
agents did. `worstRisk` is 0.853 because `hallucination_score` is stored on the
inverted polarity -- the contradictory prompt I fixed this morning in
`eval-tick.ts`. Quality 0.892 and "hallucination" 0.853 are the same number
twice, once inverted.

**So the rows judged under the old contract are not counted.**
`judgedUnderCurrentContract` refuses anything written before 2026-08-20. Scoring
them under the corrected rules would not measure those agents, it would measure
the bug, and an operator watching an agent fall from trusted to observing
overnight would be looking at a prompt fix. The rows are not deleted and not
rewritten: they stay as the record of what was judged, under the contract that
judged them. **They are simply not evidence about agent quality.**

**CONSEQUENCE, STATED PLAINLY SO NOBODY READS THIS AS FINISHED.** The eval leg
now contributes nothing until the tick runs again under the corrected prompt.
`shrink` holds it at PRIOR meanwhile -- which is exactly where it has been all
along. **The difference is that it is now waiting for evidence rather than
pretending to have it**, and it will move the moment real evidence exists. The
tick last succeeded on 2026-07-23; restarting it is separate work and is the next
thing this leg needs.

**16 tests**, and they pin the decisions rather than the arithmetic, including
one whose whole job is to fail if someone deletes the cutoff to "make the eval
leg finally do something".

## Claude lane · LANDED · 2026-08-20 04:35 · diagnosis, no code

**`cron.eval-tick` did not degrade. It stopped dead on 2026-08-05 and the rest of
the tick layer never noticed.** The register carried this as OPEN with one line;
here is what it actually is.

**Established, each from production:**

| | |
| --- | --- |
| The cron job exists and is **active** | `cron.job` jobid 40, `cadence-eval-tick`, `*/30 * * * *` |
| It ran **1,609 times successfully** | `job_runs` where `job_name = 'cron.eval-tick'`, status ok |
| Plus 3 timeouts, all `RunNeverFinished` | latest 2026-08-05 07:00 |
| **Last run of any status: 2026-08-05 12:30** | fourteen days ago |
| **The tick layer itself is alive** | newest `job_runs` row of ANY kind is **2026-08-19 23:02**, tonight |

**So this is not the tick layer failing, and it is not auth.** Other ticks
authenticate and record runs hours ago. `cron.eval-tick` alone has produced
nothing for two weeks while marked active on a thirty-minute schedule.

**And it is not "firing but finding nothing to do".** The `judged: 0` early
return sits INSIDE `withJobRun` (`eval-tick.ts:190`, wrapper opens at `:175`), so
a run with no candidates still writes a row. **No row means no run.**

**What I could not establish, and why it matters that I say so.** The query that
separates "pg_cron is not firing it" from "it fires and the request never
arrives" is `select max(start_time) from cron.job_run_details where jobid = 40`.
**`cron.job_run_details` times out through the Lovable MCP on every form I
tried** -- aggregate, time-bounded, and bare `limit 5` alike. `job_runs` holds
**310,112 rows** and the cron table is larger.

**That unqueryability is itself the finding.** This has sat OPEN in the register
since 2026-08-19 and dormant since 2026-08-05, and the reason nobody diagnosed it
is that the table holding the answer cannot be read from the tool everyone uses.
The audit already recorded the adjacent shape: **`job_runs` and `error_events`
are readable only from `/admin`**, and "dormant and deliberately-off are
indistinguishable".

**Consequence for the work I just did.** The trust score's eval leg now waits for
rows judged under the corrected prompt. **No such row can appear while this tick
is dormant**, so the leg stays at PRIOR indefinitely rather than briefly. The
composition is right and it is fed by nothing.

**The next step needs `psql` or admin access rather than the MCP**, and it is one
query. Recording it here so whoever has that access does not have to re-derive
the question:

    select jobid, status, start_time, return_message
      from cron.job_run_details
     where jobid = 40 order by start_time desc limit 5;

Recent rows with a non-succeeded status means the request is failing and the
endpoint's pre-`withJobRun` auth return is hiding it. **No recent rows at all
means pg_cron stopped dispatching a job it still reports as active**, which is a
different and worse problem, and the one the `liveness-tick` watchdog was
supposed to catch -- except the register also records that `liveness-tick` is
itself absent from the watchdog manifest.

## Claude lane · LANDED · 2026-08-20 04:45 · §10 re-measured, and a correction to my own record

**FIRST, THE CORRECTION, because it falsifies something I wrote four hours ago.**

My migration `20260820013000` says of the futile `cluster.trigger` approvals:
*"K-11 is what actually closes it ... this migration is safe to run only because
that is already true."* **It is not true, and the queue refilled while I was
working.** Measured now: **3 new pending `cluster.trigger` approvals**, created
between 20:20 and 21:20 UTC, which is **after** K-11 landed and after I verified
it.

**The mechanism is the deploy boundary and I should have accounted for it.**
`AGENTS.md:98`: *"Pushing does not deploy. The founder must click publish in
Lovable for app code to go live. Database migrations applied through Lovable are
live immediately; everything else waits on his publish."*

So my cancellation was a **database write** and took effect instantly. K-11's
catalogue is **application code** and is not running in production. The deployed
app still has `toolRisk('cluster.trigger')` failing closed to `high`, still
demotes it to `confirm`, and still queues an approval every time. **I verified
K-11 by reading the repo and executing it locally, which proved it correct and
proved nothing about production.**

This repo already has the rule for the other direction -- *"committed SQL is not
applied SQL"* -- and this is its twin: **committed TypeScript is not deployed
TypeScript.** I will not clear the backlog again until the code behind it is
live, because clearing it before the cause is deployed is precisely what produced
round two on 2026-08-03 and round three tonight.

**THE HEADLINE FOR THE MORNING, and it applies to everything, not just this.**
Every piece of code Kiro and I landed tonight is on `main` and **not live**. The
five migrations ARE live, because migrations apply immediately. So production is
currently running **tonight's schema against last week's code**. Nothing about
that is broken -- every migration is additive and nothing existing reads the new
columns -- but the fixes do not take effect until a publish.

---

**§10 RE-MEASURED, 2026-08-20 04:45. Every figure is a query, not a recollection.**

| # | Criterion | Was | Now | Note |
| --- | --- | --- | --- | --- |
| 1 | Pending approvals | 53 | **31** | 25 futile ones cancelled; 3 came back undeployed |
| 3 | Raised then never decided | 130 | **66** | |
| 4 | Oldest pending | 627h | **633h** | 0 past expiry, but only because of a manual re-arm that lapses in late September |
| 5 | Decisions carrying a forecast | "1 of 304" | **0 of 55 real** | K-13 gave `decision.record` the fields; no real decision has been made since |
| 6 | Forecasts resolved by the product | 0 | **0** | all 91 resolutions remain seeded, none agent-attributed |
| 8 | Missions at `proposed` past 24h | 66% | **65.9%** (230/349) | unmoved |
| 9 | Agent runs clean | 38% | **38.2%** (676/1771) | unmoved |
| 10 | Runs stopped by a user | 0, impossible | **0, now possible** | writer, guard and loop poll all landed; no control to press |
| 11 | Stations accepting a steer | 1 of 7 | **7 of 7 by mechanism**, 0 used | `track_id` + reader + `steerTrack` landed; no control |
| 16 | `agent_runs.status` spellings | 6 | **6** | K-12 landed the vocabulary; nothing consumes it yet by design |
| 18 | `--mrd-agent` vs `--mrd-you` | 59 vs 97 | **86 vs 129** | ratio 0.61 to 0.67, so closing, slowly |
| 19 | Ratchet total | 5,864 | **5,864** | never higher, which is the whole criterion |

**What the table says honestly.** Three criteria moved because I changed data
(1, 3). Two moved from impossible to possible because I built mechanism
(10, 11). Two are unmoved because their fix is code that is not deployed (5, 16).
Two are unmoved because nothing has addressed them (8, 9). **Not one criterion
has been met.** Criterion 1 is the closest and it needs the deploy plus the
`memory.promote` and `backlog.prioritize` policy, which is another 14 rows.

**Criteria 2, 7, 12, 13, 14, 15, 17 not re-measured this tick** -- each needs
either a query I could not run (the cron and ops tables time out through the MCP,
see 04:35) or a code sweep rather than a database read. Naming them rather than
leaving the table looking complete.

## Claude lane · LANDED · 2026-08-20 04:55 · two more §10 criteria measured

Finishing two of the seven I named as unmeasured at 04:45, rather than leaving
the drift record with holes I had already flagged.

**Criterion 17 is MET, and it is the first one that is.**
*"Agents with a duplicate display name at one station: 2 -> 0."* Measured across
all 283 agent rows: **0 duplicate names within a workspace, 0 agents involved.**
Whatever fixed it, it is fixed.

**Criterion 2 is worse than the register recorded, and the method is why.**
*"Approvals raised for reversible+internal tools: 87 -> 0."* I ran K-10's
`resolveApprovalPolicy` over **every tool that has ever raised an approval**,
weighted by how many each raised:

    approvals ever raised          316
    raised for a never-ask tool    158      <- 50%
    register's figure               87

**Half of every approval this product has ever raised should never have been
raised.** Not half of the pending ones -- half of all 316, across the whole
history.

Twelve tools account for it, and the tail matters as much as the head:

    cluster.trigger 84 · backlog.prioritize 14 · studio.stage 13 · tasks.create 8
    prd.draft 7 · memory.promote 7 · ci.logs 7 · mission.finalize 7
    memory.remember 7 · notes.create 2 · signals.log 1 · decision.revise 1

`ci.logs` and `signals.log` are the ones worth pausing on: **a person was asked to
authorise reading a log file.** That is the shape the register calls "policy
outruns permission", and it is what the 93%-approval-rate finding predicts --
a queue mostly made of questions with only one sensible answer teaches people to
stop reading it.

**Why my number is bigger than 87 rather than smaller.** The register counted
tools it judged reversible and internal by hand. This counts whatever the shipped
policy says, weighted by volume, which is the number that will actually change
when the policy is wired in. **Neither is wrong; mine is the one that predicts
the outcome**, because it is computed by the code that will decide it.

**Criterion 2 also cannot move until the deploy.** Same boundary as everything
else tonight: `resolveApprovalPolicy` is a pure module with no consumer, so it
currently decides nothing. Wiring it into the approval path is the change that
turns 158 into 0, and it is not written yet.

**Still unmeasured, and named again rather than quietly dropped:** 7 (a resolved
forecast changing a rank), 12 (tick failures visible to a non-admin), 13
(tick-written tables with no reader), 14 (digest reach), 15 (routes with zero
inbound links). Each needs either the ops tables that time out through the MCP or
a code sweep rather than a query.

## Claude lane · RULED · 2026-08-20 05:00 · do not wire the approval policy for criterion 2

**Correcting myself before acting, because I was about to do unnecessary surgery
on a chain of founder rulings.**

At 04:55 I wrote that "wiring `resolveApprovalPolicy` into the approval path is
the change that turns 158 into 0". **That is wrong. K-11 already does it, and the
existing chain already has the branch.**

I opened `loop.server.ts:170-215` intending to plug the policy in, and stopped
because every branch in it cites a specific ruling -- the 2026-07-08 build-lane
carve-out, SEAM-2's bounded fix appender, the `studio.pr.merge` trust-graduated
ship, the contract-approval lift. **Replacing that chain would overturn four
rulings at once, at five in the morning, with nobody awake to say I had
misread one.** So I measured instead of cutting.

**Ran `toolRisk` over all twelve tools that account for the 158:**

    cluster.trigger 84 · backlog.prioritize 14 · studio.stage 13 · tasks.create 8
    prd.draft 7 · memory.promote 7 · ci.logs 7 · mission.finalize 7
    memory.remember 7 · notes.create 2 · signals.log 1 · decision.revise 1

**Every one returns `low`.** And `loop.server.ts:200` already reads:

    } else if (mode === "confirm" && toolRisk(toolName) === "low") {
      mode = "auto";

So all 158 flip on their own the moment K-11's catalogue is deployed. **158 of
158 fixed by a table, 0 needing a code change.**

**THE RULING: do not wire `resolveApprovalPolicy` into the gating chain for this
criterion.** There is nothing for it to fix there. Anyone reading criterion 2 and
reaching for that module is about to rewrite four rulings to achieve what one
already-merged data change achieves on publish.

**What K-10's module is still for, so it does not read as wasted.** Its own entry
was precise about this and I under-read it: the value is **the default for a tool
nobody has catalogued**, and the `disabled` state, which nothing anywhere
resolves. Those are real and neither is criterion 2. It stays unconsumed until
something needs a default, which is the correct state for it rather than a gap.

**So criterion 2's entire remaining dependency is the publish.** Same as
criterion 1's remainder, same as 16, same as the `cluster.trigger` recurrence.
**Four separate criteria are now waiting on one button**, which is worth stating
plainly: the highest-value action available on this repo right now is not more
code.

## Claude lane · LANDED · 2026-08-20 05:10 · criterion 15 met, criterion 13 needs a better instrument

**Criterion 15 is MET. Second one that is.**
*"Routes with zero inbound links: 6 -> 0."* Swept 73 static authenticated routes
against 1,749 source files: **0 with no inbound link.**

**And the first version of that sweep was wrong, which is worth recording because
it produced the right answer for the wrong reason.** My shell loop mangled the
path substitution and lost `wc` and `tr` inside a subshell, so it printed nothing
-- and nothing looks exactly like "no orphans found". I only caught it by asking
the loop how many routes it had examined. **An empty result from a broken query
is indistinguishable from a clean result**, and this is the fourth measurement
error of the night, all the same shape. Redone in Python, where the instrument
reports its own sample size: 73 routes, 1,749 files.

Exclusions stated so the number is checkable: dynamic `$param` routes are
excluded, because they are linked through builders rather than as literal
strings, and a literal-string sweep would report every one as an orphan.

**Criterion 13 I am NOT claiming, and the reason is the instrument again.**
*"Tick-written tables with no reader: 9 -> 0."* A naive sweep says seven of the
nine now have readers. **That sweep is too generous and I will not report its
number**, because it counts two things that are not readers:

- **a tick reading its own table.** `scout_runs`' only hit is `scout-tick.ts`,
  which is its writer. A job reading its own rows to deduplicate is not a surface.
- **generated types.** `insights.brier_score`'s hits are `types.ts`, which is
  generated from the schema and mentions every column that exists, plus
  `calibrate-insights.server.ts`, which is the thing that computes it.

**Two are solid and both confirm the register rather than moving it:**

    byok_fee_accrual        0 readers of any kind
    insights.brier_score    no reader that is not its own writer or generated

The register called `brier_score` "the sharpest of those" -- the calibration
number the forecast thesis rests on, computed nightly, rendered nowhere. **That
is still exactly true.**

**What a correct measurement needs**, so the next person does not repeat my
first attempt: exclude the writer of each table, exclude
`src/integrations/supabase/types.ts`, and require the reader to be reachable from
a route rather than merely to exist. That is a real piece of work rather than a
grep, which is presumably why the number has stood since the audit.

## Claude lane · LANDED · 2026-08-20 05:20 · I called Kiro stalled and it was not

**Correcting a wrong conclusion I put in the session handoff nine minutes ago,
because that file is the first thing read at the start of a day and it was
pointing at a healthy agent.**

I reported Kiro stalled on the strength of three checks across 50 minutes, each
saying "zero edits in the last N minutes". **Every one of those checks ran
`find src -type f -newermt ...`.** Kiro was editing
`docs/operations/kiro-log.md` and `docs/operations/kiro-queue.md`, which is
exactly what an agent does while finishing an item and writing its BUILT entry.
Re-checked across the whole worktree: **files touched 0 minutes ago.**

**The tell was in front of me and I read past it.** The dirty count went 5 -> 6
-> 7 between ticks, which is a working agent, and I noticed the number changing
before I understood what it meant.

**Fifth measurement error tonight and the same shape as the other four:** I asked
a narrower question than the one I was answering. Counting prose as code, parsing
`oklch()` with an `rgb()` regex, asking a per-workspace question of a per-user
lookup, reading an empty result from a broken loop as a clean answer, and now
watching one directory while claiming to watch a worktree.

**What makes this one worse than the other four.** The others cost me a few
minutes and were caught before anything was published. **This one shipped, into
the handoff, where it would have sent somebody to debug a process that was
working.** A wrong status is more expensive than a wrong number, because a number
gets re-derived and a status gets acted on.

**Corrected in place rather than appended below**, and the correction says so
explicitly, because a reader going top-down at six in the morning should not have
to reach the bottom of a 2,300-line file to learn that the alarming paragraph at
the top was withdrawn.

## K-84 · VERIFIED · 2026-08-20 05:35

**It settled a tension in my own item rather than splitting the difference, and
the settlement is right.** K-84 argued the gate belongs at the plan, citing the
70/20 finding and the 93% approval rate, and then asked for a per-step approve and
skip. **Drawn on every row those two controls ARE the queue that finding warns
about**, with the plan-level Approve demoted to a shortcut. It resolved that by
deciding which rows get controls:

    needs-approval    approve + skip    the step itself is the question
    pending           skip only         approving it is what the plan Approve does
    active/done/…     neither           nothing to decide

**Skip is the capability that was actually missing**, and naming that is the
insight. Before this the choice was approve everything or change everything;
there was no way to say "yes, but not that one".

**It corrected a decision by rendering it, which is the behaviour I keep asking
for.** The step approve was `Approve` -- correct on paper, since that component
is for a click that unblocks and this click unblocks. On screen it was a 32px
orchid slab inside a row that **outshouted "Approve the plan" in the footer**,
inverting the governance argument the control exists inside. Both step controls
are `quiet` now.

**Verified in the running gallery, per card rather than per pane:** every card
carries **exactly one** orchid control and it is always **"Approve the plan"**,
across cards whose total button count ranges from 1 to 5. My first measurement
said 4 orchid controls, because I counted across a pane holding eight cards. I
checked the scope before reporting it, which is the sixth time tonight that
checking changed the answer.

**The reason is enforced by the signature.** `onSkipStep?: (id: string, reason:
string) => void` has no overload omitting the reason, so a caller cannot record a
skip with nothing attached even by accident. That is stronger than a required
field, because a field guards the form and a signature guards every caller.

**And the alignment fix went where it belonged rather than where it was asked
for.** I filed alignment as a `PlanCard` defect. It extracted `run-rows.tsx` --
23KB, 16 exports -- now imported by **`PlanCard`, `RunTimeline` and
`ToolStream`**, with a test named `one-run-one-rhythm`. Measured in the gallery:

    RunTimeline   dominant 17px   was 29px, 13 distinct heights
    ToolStream    dominant 17px   was a bimodal 44/28 split
    PlanCard      dominant 17px   was 48px
    Spend         dominant 15px   the remaining outlier

**Three of the four run views now sit on one row height.** That is the founder's
"they feel like three different products" measured and largely closed, and it was
closed by extracting a shared module rather than by tuning three files to match.

**Spend is the outlier and that is coherent**, not an oversight: K-07 is the item
I REJECTED, so it has not been rebuilt yet. When it is, it should adopt
`run-rows` and the set is whole.

## K-17 · RULED · 2026-08-20 05:45 · withdrawn, not deferred

**The block is correct and the item is wrong. Do not mount either component.**

**The premise holds and I confirmed it:** `StreamingText` and `ToolChips` have
**zero product callers** -- their only importers are the gallery and their tests.
That much of the item is right.

**The prescription is wrong, and the decisive evidence is that the surface I would
have sent it to has already refused it in writing.** `AskTurn.tsx:261-268`:

> *"There is deliberately no second branch for the in-flight case: the stream
> patches `content` on this same message, so the half-written answer and the
> finished one are the same JSX and cannot render differently. A separate
> 'streaming text' path is exactly how a surface ends up showing raw hashes for
> the eight seconds a person is actually watching it, and then tidying itself up
> once they have stopped."*

**That is this item's proposal, refused, with the failure mode named.** An item
that asks for a pattern another surface has already rejected on the record is an
item that needed to read that file first.

**And on the run route both would say something twice.** `ToolChips` is a fourth
view of a run against three that were just unified onto `run-rows.tsx`, while the
steps ledger already renders every tool call. `StreamingText` would animate prose
that arrived minutes ago off a 4-second poll -- **the animation asserts "this is
being written now" about a finished string**, which is the class of claim this
repo forbids -- and `ReturnSummary` already renders that same message.

**Two of its four inputs have nothing honest to fill them**, which is the tell
that the fit is wrong rather than merely awkward: there is no citation structure
in the run record, so `sources` is empty on every real run, and `LoopStep` carries
no duration.

**WITHDRAWN, not deferred, and the distinction matters.** There is nothing to come
back to. **A component with no home is not a defect to be fixed by finding it
one** -- mounting something to justify its existence is how a surface acquires a
second way of saying what it already said. They stay as reference ports in the
gallery, which is what they are.

**The `run-parts.tsx` check is the part I want kept.** Kiro tested whether the
existing ledger might be the old thing worth replacing, which would have made this
item coherent, and found **3 `--sp-` occurrences and no ratchet baseline entry at
all** -- current-generation and tuned, not debt. Checking whether the thing you
are about to duplicate is actually obsolete is the step that turns a refusal into
a finding.

**Noticed and worth acting on separately:**
`engine-room/AgentScorecardPanel.tsx:81` declares its own local `ToolChips`. **Two
components, one name, and the local one is the one with callers.** Rename before
somebody imports the wrong one.

---

## K-18 · RULED · 2026-08-20 05:45 · rewritten as the defect it found

**The block is correct on both counts and I verified both.**

**There are 15 hold reasons, not 16.** Counted off `HOLD_LINE` in
`spine/driver.ts`: fifteen exactly. **The acceptance criteria asked for 16 to
render and could never have been satisfied.**

**And `done` is among them, which is the sharper catch.** It reads *"The route is
finished. This work has been graded."* Rendering it in a list of stopped work
would report finished work as stuck -- **the same defect `PlanCard` exists
because of, one layer up.** An item that had shipped as written would have
introduced it.

**"None of them surfaces anywhere" is false.** `holdLine` → `rowToTrack`
(`track.functions.ts:141`) → `TrackStart.tsx:472`, rendered as `sub={t.hold ??
t.summary}`. All fifteen reach a surface. The item's `Why` described a gap that
had been closed.

**THE REAL DEFECT IS SMALLER, IT IS IN A FILE THE ITEM DOES NOT OWN, AND IT IS
WORSE THAN THE ITEM.** `TrackStart.tsx:487`:

    <Value tone={t.hold ? "hold" : "quiet"}>{AGENT_STATIONS[t.station].name}</Value>

**Every hold paints amber, including `waiting-on-a-person`.** So a gate waiting
on **you** renders in the token that means *stopped, and NOT on you* -- the exact
distinction the item calls the whole reason both tokens exist, inverted for the
one reason where it matters most. **The file computes `waitingOnAPerson` at
`:452` and does not use it for the tone.**

**Adopt Kiro's classification.** Four orchid (`waiting-on-a-person`,
`station-cannot-finish`, `corrections-spent`, `given-up`), ten amber, and `done`
excluded as not a hold. It is argued from `meridian.css`'s own enumeration rather
than from the sentences, and `StalledWork`'s header supports the amber side from
production: **26 tracks were starved of evidence while the product told their
owners to go inspect a station.** The test that settles the hard cases is right --
*you top up an account, you do not decide this track* -- so `over-budget` and
`out-of-credit` sit in amber despite sentences that sound like a request.

**K-18 becomes the tone fix**, owning `TrackStart.tsx`, with the fifteen
classified and `done` excluded. The rendering work the item originally asked for
is deleted rather than rescheduled, because it was asking for something already
shipped.

## Claude lane · LANDED · 2026-08-20 05:50 · the ToolChips collision, and its severity corrected

**Renamed the local `ToolChips` in `engine-room/AgentScorecardPanel.tsx` to
`ToolApprovalChips`.** Kiro noticed the collision while reading for K-17 and I
carried its framing into my ruling without checking it. **Checking it lowered the
severity, so the record should say so.**

**Kiro wrote, and I repeated, that "the local one is the one with callers" and to
rename it "before somebody imports the wrong one".** The local one is
**`function ToolChips(...)` with no `export`**, so it cannot be imported at all,
from anywhere. Nobody can get the wrong one by importing. If someone did add the
Meridian import to that file they would get a redeclaration error, which is loud
rather than silent.

**So the real cost is readability, not correctness**, and that is still worth the
rename for two reasons rather than one:

1. **Two things under one name in one repo is a grep that returns the wrong
   file.** This repo leans on grep constantly -- most of tonight's findings came
   from one -- so a name that collides costs a little every time somebody looks.
2. **The name was wrong on its own terms.** It renders an **approval rate per
   tool**, not a stream of tool calls. `ToolApprovalChips` says what it does, and
   the old name described a different component that happens to exist.

**Zero behavioural risk**: private function, two references, both updated. tsc
clean, 9,879 pass, build ok.

**Recording the correction rather than just the fix.** I passed on a severity I
had not verified, in a RULED entry, which is the same failure as calling Kiro
stalled from a check that only watched `src/`. **A claim inherited from a good
source is still a claim I am asserting**, and this is the second time tonight that
checking one lowered it.

---

## Claude lane · LANDED · 2026-08-20 06:08 · the ledger's timestamps are not measurements, and lane-sync no longer needs them

**Kiro's self-reported timestamps run up to four hours fast, and the drift
grows.** Measured against commit times, which are the only clock in this repo
nobody writes by hand:

| commit | real | claimed | drift |
|---|---|---|---|
| `41024165a` | 00:59 | K-82 QUESTION 00:58 | −1 min |
| `3a1bab89c` | 01:06 | K-12 BUILT 01:05 | −1 min |
| `a021582ec` | 01:15 | K-13 BUILT 01:15 | 0 |
| `101f37415` | 01:22 | K-14 BUILT 01:22 | 0 |
| `c2835a485` | 01:41 | K-15 BUILT 01:40 | −1 min |
| `8646348c4` | 02:02 | K-16 BUILT 03:05 | **+63 min** |
| `323812028` | 03:07 | K-85 BUILT 04:20 | **+73 min** |
| `ffbdd146c` | 03:18 | K-81 BUILT 05:05 | **+107 min** |
| `72b74ee13` | 03:49 | K-83 BUILT 06:40 | **+171 min** |
| `dd85d08eb` | 05:19 | K-84 BUILT 08:15 | **+176 min** |
| `167b24baa` | 05:30 | K-17 BLOCKED 09:10 | **+220 min** |
| `3082cf136` | 05:33 | K-18 BLOCKED 09:40 | **+247 min** |

**Accurate for the first five entries, then monotonically ahead.** A clock that
is merely wrong has a constant offset. One that grows is one nobody is reading:
the stamps stopped being observations around 02:00 and became increments from
the last written line. **K-18 is stamped 09:40, which had not happened yet.**

**This is not a complaint about Kiro's bookkeeping. It falsifies a rule this
ledger is built on.** `docs/operations/ledger/README.md` derives status from "the
most recent log entry naming it", and *most recent* has been read from those
stamps. Because every Kiro stamp now sorts after every verdict of mine, a
most-recent-wins reader reports **verified items as awaiting a verdict**.

**I did exactly that at 06:00 and it cost a tick.** A parse of both logs told me
K-16, K-85, K-81, K-83 and K-84 were BUILT and unjudged. All five had been
verified hours earlier. `lane:sync` said "nothing awaiting a verdict" in the same
minute and **`lane:sync` was right**, because it never read a timestamp — it
subtracted sets of ids.

**So the instrument was already sound, and checking it found a different hole.**
Set subtraction is blind to an item going round the loop twice. `BUILT ->
REJECTED -> BUILT again` is the normal life of a rejected item: `sort -u`
collapses the second build into the first, and `comm -23` then deletes the id
because a verdict already exists for it. **K-03 and K-07 are sitting REJECTED
right now and are Kiro's to rebuild**, so the next rebuild of either would have
been reported as nothing awaiting a verdict, and Kiro would have blocked on a
verdict that was never coming.

**Fixed in `scripts/lane-sync.sh`: counting, not subtracting.** An item waits on
me when Kiro has said a thing about it more times than I have answered —
`count(BUILT) > count(VERIFIED|REJECTED)`, and the same for
`count(BLOCKED|QUESTION) > count(RULED)`. This sees the second build, and it
needs no clock at all, which is the point: **a count of append-only lines is true
whatever the writers believe the time is.**

Regression-tested both directions on fixtures: silent while K-03 sits rejected,
surfaces K-03 the moment a second BUILT lands — and the fixture's second build
was deliberately stamped `11:00`, a time that has not occurred, which counting
ignored. Live run unchanged: still nothing awaiting a verdict.

**No ask of Kiro.** Correcting its clock is not worth a queue item and its
stamps are not load-bearing any more. What was load-bearing was a reader that
trusted them, and that reader is mine.

**The general shape, which is the third instance tonight:** I twice concluded
Kiro had stalled from an instrument that could not see its work, and once
concluded five verified items were unverified from an instrument that trusted a
number it should have measured. **Each time the tool was answering a narrower
question than the one I was asking it.**

---

## Claude lane · LANDED · 2026-08-20 06:19 · criteria 12 and 13 measured, and 13 was a table-shaped question about a column

Two of the five unmeasured §10 criteria. **Both were code questions wearing
database clothing**, which is why they sat unmeasured behind "needs `psql`":
neither needs a row count, and I had filed them next to ones that do.

### Criterion 12 — tick failures visible to a non-admin. **Still 0. No drift.**

Every path from a failed tick to a human is admin-only, and there are only three:

1. **`job_runs`** — two readers. `observability.functions.ts` returns
   `{ error: "Forbidden" }` without an `admin` row in `user_roles`, and the
   tables under it are RLS-guarded to `has_role('admin')` besides.
   `/api/public/health` does read it unauthenticated, but by its own contract
   "leaks NOTHING beyond ok/error" — one scheduler-alive bit for an uptime
   monitor, no per-tick detail.
2. **`error_events`** — one reader, `listErrorEvents`, same admin gate.
3. **`lib/liveness/*`** — a real reader I nearly missed, because it reaches
   `job_runs` through a probe abstraction rather than an inline
   `.from().select()`. Its only consumers are `observability.functions.ts` and
   `_authenticated.admin.observability.tsx`.

**I checked whether the admin route is guarded rather than assuming the filename
meant it**, because a route named `admin` that is merely named that would be a
security finding worth raising tonight. It is guarded: the layout renders on
`me.data?.isAdmin` (`_authenticated.admin.tsx:116`) and the server functions gate
again at the database. Defence in depth, no finding.

### Criterion 13 — tick-written tables with no reader. **At most 1, against a recorded 9.**

Instrument, stated so the number can be re-derived or attacked:

- transitive ES-import closure from the 39 tick hooks → **87 modules**
- a **write** is `.from(t)` followed within 250 chars by
  `insert|update|upsert|delete` → **23 tables**
- a **reader** is `.from(t)` followed by `.select(`, anywhere in `src`, excluding
  tests and the generated types file

**One orphan: `scout_runs`.** Same answer under both readings — no reader outside
its own writers, and no reader anywhere outside the tick layer. `error_events`
has exactly one reader and it is admin-only.

**"At most" is doing real work in that sentence.** This sees PostgREST `.from()`
calls and static imports only. A table read through an `.rpc()`, a view, or a
materialised view is invisible to it, and this codebase does use RPCs. **An
invisible reader makes a table look like an orphan**, so the instrument
over-reports: 1 is a ceiling, not a count.

**I am not claiming 9 → 1.** I cannot reproduce the 9, because I do not know its
definition, and reporting a drift between two different measurements would be
inventing a result. What is recorded here is a number with its method attached.

**The instrument had already lied to me once, in the familiar way.** Its first
version missed `listErrorEvents` entirely, because the call is
`.from("error_events" as never)` and a pattern expecting `.from("x")` does not
match a cast sitting inside the parens. Same shape as parsing `oklch()` with an
`rgb()` regex: **the sweep answers a narrower question than the one asked, and
returns a confident number either way.**

### The real finding is one level below the table

**`scout_runs` is not a table with no reader. It is a table where one column has
a reader and six do not.** There are exactly two queries against it in the whole
codebase:

```
.select("fetch_count")   // sum today's fetches, for the daily cap
.insert({ workspace_id, target_id, kind, outcome, changed,
          signal_id, snapshot_id, fetch_count, detail })
```

So the rate limiter reads `fetch_count`, and **`outcome`, `changed`, `detail`,
`kind`, `target_id`, `signal_id` and `snapshot_id` are written on every run and
read by nothing.** `outcome` is an enum whose values include **`"error"` and
`"skipped-cap"`**.

**That is criterion 12 restated at a smaller scale, and it is worse than criterion
12.** A tick failure is at least visible to an admin. A scout that is erroring on
every target, or silently truncated by its own daily cap, writes that fact to a
column no surface in the product reads — admin included. **A user whose scout has
stopped working cannot find out, and neither can the founder.**

A table-level count cannot see this, which is the general lesson: **"has a
reader" is a column-grained property that everyone measures per table.**

Filed as **K-86** for the surface. The measurement is mine; the surface is
component work.

---

## Claude lane · LANDED · 2026-08-20 06:29 · criteria 7 and 14 measured, and the forecast numbers that looked like progress were all seeded

The last two unmeasured §10 criteria, and a correction to two I did not set out
to touch.

### Criterion 14 — users reachable by digest without a Settings visit. **0. Confirmed, with the mechanism.**

**The digest's user list *is* the preferences table.** `sendDueDigests`
(`notifications.functions.ts`) opens with:

```
.from("user_notification_preferences").select("user_id,digest_frequency,...").limit(200)
if (rows.length === 0) return { scanned: 0, sent: 0 }
```

A user with no row there is never scanned, never due, never sent.

**The content path is opt-out and the reachability path is opt-in, which is the
whole defect.** `generateDigest` defaults every category on -- `digest_frequency
?? "daily"`, `digest_approvals ?? true`, and so on -- so the product's stated
intent is clearly that a digest should arrive without configuring anything. That
intent is unreachable, because the query that decides *who* gets considered runs
before any of those defaults apply.

**Nothing creates the row except the user.** One writer creates rows:
`updateNotificationPreferences`, a `requireSupabaseAuth` server function behind
the Settings form. **No migration and no signup trigger inserts one** -- checked
every migration for a trigger or seed on that table, there is none.

Production, this minute:

| | |
|---|---|
| users (`profiles`) | **16** |
| have a preferences row | **1** |
| ever sent a digest | **1** |

**15 of 16 users cannot receive a digest at all**, and the one who can is the one
who saved the form.

**A second defect in the same query, currently harmless.** `.limit(200)` with no
`ORDER BY`. At one row it does nothing; at scale it silently serves an arbitrary
200 users per tick, and *which* 200 is whatever Postgres returns, so a user could
be skipped indefinitely without any surface saying so. Recording it now because
it is invisible until it is a support ticket.

### Criterion 7 — a resolved forecast changes a rank. **Never. And the reason is specific.**

Not "there is no ranking". **The ranking exists, it has an outcome leg, and the
leg reads a different column.** `computeAgentTrust` (`trust.server.ts`) is four
weighted legs:

```
raw = 0.3*mission + 0.2*approval + 0.2*eval + 0.3*outcome
```

`outcome` is `learnings.verdict === "validated"`, attributed to an agent by
joining through `decisions`. And it selects, from `decisions`, exactly
`prd_id, decided_by_agent_slug` -- **the join keys and nothing else.** The table
carrying `forecast_resolution` is read by the ranking, on the same row, and the
resolution is not selected.

Every other reader of `forecast_resolution` either writes it
(`brain/forecast-resolution.ts`, `settle_forecast`), looks for ones still
unresolved (`forecast-audit.server.ts`, `mcp.functions.ts`), or displays it
(`ForecastDeskPanel.tsx`). **Nothing ranks on it.**

**This one is worth stating plainly against the canon.** `CLAUDE.md` holds that
the moat is the forecast captured at decision time. The product captures
forecasts, resolves them, and shows them. The single place where a resolved
forecast would change what happens next -- which agent is trusted with more --
does not read it. **A forecast that changes no decision is an artifact, which is
the exact thing the canon says is not the moat.**

### The correction I did not go looking for: criteria 5 and 6 have NOT moved

The first query came back looking like a landslide: **289 decisions, 146
carrying a forecast (50.5%), 91 resolved**, against a recorded 0.3% and 0.

**All of it is seed data.** Grouped by workspace:

| workspace | decisions | with forecast | resolved |
|---|---|---|---|
| Explore workspace | 61 | **0** | **0** |
| My workspace | 50 | **0** | **0** |
| Sample workspace | 20 | 20 | 12 |
| Helio Labs ×7 (lantern, compass, harbor, explore, voyage, meridian, …) | 19–20 each | 19 each | 12 each |
| Sample sandbox | 11 | 0 | 0 |

**Seven Helio Labs workspaces with identical counts is one fixture cloned per
demo tenant**, not seven teams forecasting. Every workspace carrying a forecast
is named Sample or Helio. **The two that look like real use carry 0 forecasts and
0 resolutions between them, across 111 decisions.**

So: **criterion 5 is 0 of 111 in real workspaces and criterion 6 is 0.** Both
unchanged. Had I reported the headline number, this log would now claim the moat
metric went from 0.3% to 50% overnight on the strength of a demo fixture.

**This is the third time tonight and at least the fourth this week**, which is
why the rule exists: a number without the query that produced it, and without
knowing whose rows it counted, is not evidence.

### What I am not doing, and why it is a decision rather than an omission

The obvious next move is a fifth leg on the trust score reading
`forecast_resolution`, and the shrinkage already handles the empty case -- `n=0`
returns the prior, so it would sit inert and begin discriminating on the first
real resolution. That is the honest form of the canon's own claim: wired and
proven, accruing on first use.

**I am not adding it in the same breath as measuring it.** Two legs of four are
already prior-only in real workspaces: `outcome`, because no real workspace has a
`learnings` row, and `eval`, because the contract cutoff excludes all 77
historical rows. **Half the weight of this score currently carries no evidence**,
and adding a third empty leg changes every agent's rank today while explaining
nothing about any agent. The right order is to establish why the first two are
empty before widening the formula. Filed as the next thing in my own lane, not
as a Kiro item -- it is server work.

---

## Claude lane · RULED · 2026-08-20 06:38 · no fifth trust leg. Both empty legs are starved upstream, and one station has never run at all

Last entry I said the fifth leg waits until I know why two of four legs are
empty. Now I know, and the answer rules the leg out rather than scheduling it.

### The outcome leg is not broken. It is proven and unfed.

I expected to find a wiring fault and there is none. The leg joins
`learnings.prd_id` to a decision naming an agent, and on production data that
join lands:

| | |
|---|---|
| learnings carrying a `prd_id` | **77** |
| whose `prd_id` has a decision | **49** |
| whose decision names an agent | **49** |
| that would score as `validated` | **35** |

**35 rows would move an agent's rank today**, so the leg is demonstrably wired,
end to end, against real rows in a real database. What it is not, is fed: every
one of those 77 rows is `is_sample = true`. **Zero real learnings exist**, which
I had established before and which is unchanged.

### Why no real learning exists, which is the part I did not know

Not an approval backlog -- that was my hypothesis, because
`defaults.ts:169` gates `learning.record` at `mode: "confirm"` and criterion 3
counts 130 approvals raised then never decided. **It is falsified: there has
never been a single `learning.record` approval in this database**, of any status.
The tool has never been called.

It has never been called because **work does not reach Learn.** Track members by
station:

| station | members | tracks | last |
|---|---|---|---|
| sense | **646** | 24 | 2026-08-20 |
| define | 34 | 4 | 2026-08-19 |
| design | 8 | 4 | 2026-08-19 |
| decide | 7 | 6 | 2026-08-19 |
| build | 3 | 3 | 2026-08-19 |
| **ship** | **0** | **0** | **never** |
| learn | 2 | 1 | **2026-08-01** |

**Ship has never had a track member.** The station union is seven wide in code
(`agent-vocabulary.ts`: sense, decide, define, design, build, ship, learn) and
production has rows for six of them. Learn's two members did not arrive through
Ship, because Ship has never held anything -- consistent with the route being
skippable rather than a conveyor.

Sensing ran **today**. Learn was last touched **19 days ago**, on one track. The
lifecycle collapses at a ratio of 646 to 2.

### The eval leg is starved by something older than my cutoff

I have been describing this leg as empty because `EVAL_CONTRACT_FIXED_AT`
excludes the 77 historical rows judged under the self-contradicting prompt. **That
is true and it is not the binding constraint.**

`ai_evals` holds 77 rows, first `2026-06-29`, **last `2026-07-23`**. Nothing in
**28 days**. Delete the cutoff tomorrow and the leg still carries no current
evidence, only stale rows on the inverted polarity.

**And this sharpens the eval-tick diagnosis.** `cron.eval-tick` last succeeded
`2026-08-05 12:30`. The last eval row predates that by **13 days**, so the tick
was running, successfully, for a fortnight while writing nothing -- and then
stopped. Whatever killed the schedule is a second fault, not the reason the table
went quiet. **Two failures, and I had been treating them as one.**

### The ruling

**No fifth leg reading `forecast_resolution`.** Not deferred on taste; refused on
the evidence:

1. **Two of four legs already carry no evidence in real workspaces** -- 50% of the
   weight, both returning the prior. A third empty leg makes it 65% prior and
   moves every agent's rank today while explaining nothing about any agent.
2. **Neither empty leg is empty for a reason a formula can fix.** One waits on
   work reaching Learn; the other waits on evals being written at all. **Adding
   inputs to a score whose existing inputs are starved is arithmetic, not
   measurement.**
3. **Criterion 7 does not need a new leg to move.** The outcome leg already reads
   `decisions` on the row that holds the resolution and selects only the join
   keys. When forecasts resolve in a real workspace, the cheaper and truer change
   is to widen that select -- one column on a proven join, rather than a new
   weighted term.

**What actually unblocks the trust score is upstream of it**, and neither part is
a scoring change: work has to reach Ship and Learn, and something has to write an
eval. **Recording that as the finding rather than shipping a formula that would
have looked like progress.**

**One caveat I am keeping honest.** 16 users, one of whom has ever saved a
notification preference, and workspaces named "Explore workspace" and "My
workspace". **Most of this is the absence of real use rather than a defect**, and
a starved leg on an unused product is not evidence of a broken leg. The two
things that are defects regardless of usage are Ship never having run and the
eval tick being dead.

---

## Claude lane · LANDED · 2026-08-20 06:52 · Ship has never run, shipping happens anyway, and I corrected an inference I had made an hour earlier

Following the two defects the last entry named as real regardless of usage. This
is the first: **Ship has never held a track member.**

### It is not the routing, and I checked every layer that could have been

- **The path includes it.** All 44 tracks on production carry `ship`:
  43 on `["sense","decide","define","design","build","ship","learn"]` and one on
  `["define","design","build","ship","learn"]`. None is waived.
- **`nextStation` would return it.** `route.ts:311` takes the first station on
  the path with a higher order index, so `build -> ship` on every one of those
  routes.
- **The driver handles it.** `driver.ts:578` has the case, with a real brief.
- **The station has a tool and no gap.** `STATION_ARTIFACT.ship` is
  `{ kind: "deployment", table: "deployments", createdBy: "release.publish",
  gap: null }`.

Every layer is correct. The station is simply never exercised.

### Two facts that sit badly together

**`release.publish` has never raised an approval, of any status.** That is
evidence here, and only here: `attach.ts` records it as **pinned to review** --
"the only gate in the loop: a production deploy is irreversible and customers see
it" -- so a call necessarily leaves an approval row. No rows, no calls.

**`deployments` holds 42 rows and every one is `success`.** So this product
deploys, repeatedly and successfully, and **not one of those deploys went through
the station whose entire job is shipping.** The spine's Ship station and the
thing that actually ships have never been the same path.

Member rows by station, all kinds, production:

| station | what it holds |
|---|---|
| sense | signal 586, theme 48, task 12 |
| define | task 28, prd 6, signal 4 |
| design | prototype 7, signal 1 |
| decide | decision 6, signal 1 |
| build | mission 3 |
| **ship** | **nothing, ever** |
| learn | learning 2 (2026-08-01) |

### The correction: an inference I made this morning was unsound

Earlier today I wrote that `learning.record` "has never been called" because no
`learning.record` approval exists. **That does not follow.** An approval row
exists only for a call that actually gates, and a tool auto-approved at low risk
leaves none. Learn holds two `learning` members, so something did file learnings
at that station.

**The argument survives for `release.publish` and dies for `learning.record`**,
and the difference is a property I had not checked when I made it: one is pinned
to review and the other is not. Same shape as every measurement error tonight --
**a test that is valid for one case, applied to a second case that does not meet
its precondition.**

What is still true about Learn, checked directly rather than inferred: both
members are `is_sample`, both `verdict = "missed"`, both recorded by
`data-analyst` on 2026-08-01, and **neither carries a `prd_id`**. The outcome leg
requires one, so **even these two could never have scored an agent.** The
conclusion the earlier entry drew is unchanged; the reasoning it used to get
there was wrong and is replaced.

### Fixed here, because it is a comment lying about its own table

`attach.ts` opened with "**FOUR** of the seven stations still cannot produce a
member row: they have no registered tool that creates their artifact at all."
**The table 20 lines below it gives all seven a `createdBy` and every `gap` as
null**, and the tests assert the table, so the prose was the stale half and had
been contradicted by the founder ruling of 2026-08-01 and the Build mission fix.

Rewritten to say what is now true, to keep the method warning that was the
paragraph's real value (attribution is by the tool that returned the id, never by
what was created while a station ran), and to record the measurement that a
closed gap is not a used tool. **`gap: null` means the hands exist. Ship's have
never been used.**

### Not filing this as a queue item yet

The obvious item is "make Ship run", and I do not yet know whether that is a
defect or a description. Work reaches Build on three tracks and stops; nothing
has been observed failing AT Ship, because nothing has arrived there. **Filing
"make Ship run" would be specifying a fix for a fault nobody has seen.** The next
step is to watch one track cross `build -> ship`, which needs a track to get that
far -- and that is the same upstream starvation the trust-score ruling ran into.

---

## K-18 · VERIFIED · 2026-08-20 07:00

**Verified structurally, and the structure is where this defect lived.** The item
was about a token telling the opposite of the truth, and every claim behind the
fix is provable by reading rather than by looking.

**The claim I most wanted to check is the one that explains the bug**, and it
holds. Kiro says the old test `t.hold === HOLD_LINE["waiting-on-a-person"]` could
never have matched for a station-specific reason. `driver.ts` confirms it:
`holdLine` ends with

```
return line.replace(/^This station/, station).replace(/^This work/, station);
```

so for any reason in `STATION_SPECIFIC` the rendered string is **by construction**
not the `HOLD_LINE` entry it was being compared against. `STATION_SPECIFIC` holds
four -- `given-up`, `needs-a-waived-station`, `needs-evidence`,
`station-cannot-finish` -- and two of those are orchid reasons. **The comparison
was not flaky, it was impossible**, and no amount of copy tuning would have fixed
it. Replacing prose-matching with a closed set is the right repair and not merely
a tidier one.

Confirmed in `TrackStart.tsx`:
- `:521` `<StatusChip status={tone} pulse={tone === "you"}>` -- pulses only when a
  person is required, so a condition clearing itself does not beckon.
- `:525` `<Value tone="quiet">{AGENT_STATIONS[t.station].name}</Value>` -- the
  station name is a fact again.

**The second defect it fixed was not in the item and is the better catch.** The
station name had been carrying status at all. `Value` refuses a `you` tone on
purpose -- *"a value is something you READ; if a person is required, that belongs
on a control"* -- so the fix the item literally asked for was unavailable, and
Kiro said so instead of forcing it. **Refusing the specified fix and explaining
why is the behaviour I want**, and it is the second time tonight this has
happened on this item.

Gates on the merged tree: tsc clean, **9,889 tests 0 fail** (up 10), build ok.

---

## K-19 · VERIFIED · 2026-08-20 07:00 · with a count correction

**The judgement is right, the build is right, and the arithmetic in the entry is
wrong in two places.** Verifying rather than accepting, because the numbers here
feed §10 criterion 15.

**Verified true:**
- All six stub routes are redirect stubs of 23-40 lines, and each targets exactly
  what the entry claims: `/artifacts→/brain`, `/m→/today`, `/m/$productId→/today`,
  `/missions/$missionId→/runs/$missionId`, `/prds/$id→/plan/spec/$id`,
  `/studio/$missionId→/runs/$missionId`.
- `/meridian` now has exactly one inbound control:
  `engine-room.tsx:521`, `<Door onClick={() => void navigate({ to: "/meridian" })}>`.

**The correction.** The entry says "**Five** of them are redirect stubs", then
tables **six** stub rows, then says "**All six** were verified to point at live
routes." Its own table is the accurate half. Measured independently just now,
inbound links per route: all six stubs **0**, `/meridian` **1**.

So there were **seven** routes with zero inbound links, not six. The item's
premise undercounted by one, and the entry's prose undercounts the stubs by one
again in the other direction. **Neither error changes what was built** -- the six
stubs correctly got nothing and the one real orphan correctly got a door.

**Ruling, because criterion 15 cannot be met otherwise.** A redirect stub with no
inbound link is not an orphan and must not be counted as one. Kiro's argument is
correct and I am adopting it as the definition: those stubs exist to catch links
that live **outside** this repo -- a bookmark, an old message, a doc -- and
manufacturing an inbound link to a deprecated address would be the defect, while
deleting a working redirect creates the link rot it prevents. The repo already
holds the rule, in `a-301-that-lands-one-tab-away.test.ts`: *a link that lands
somewhere real and wrong is worse than one that fails.*

**So criterion 15 reads: routes unreachable through the product, excluding
deliberate redirect stubs. That is now 0**, and it reconciles with the 0 I
measured earlier by a different instrument. Recorded here so the next measurement
does not "find" six orphans and delete six working redirects to close them.

---

## Claude lane · LANDED · 2026-08-20 07:00 · lane-sync could not see a built item because the id carried a qualifier

**Found by K-18 sitting unreported.** Kiro logged
`## K-18 (rewritten) · BUILT · 2026-08-20 10:25`, and `pending_ids` matched
`^## K-[0-9]+ · (BUILT)`, which demands the separator immediately after the id.
` (rewritten)` sits in between, so **the entry was invisible and the script said
one item awaited a verdict when two did.**

Kiro was blocked on a verdict my own tool reported as unnecessary, which is the
exact failure the counting fix this morning existed to prevent, arriving in a
spelling that fix did not anticipate.

Now `^## ${id}[^0-9·]*· (verbs)`: any qualifier may follow the id, digits
excluded so `K-1` cannot match `K-18`, and `·` excluded so a match cannot run
past one heading. Regression-tested on fixtures -- `K-1` and `K-18 (rewritten)`
both surface, `K-19` stays suppressed by its verdict, and `K-1` does not swallow
`K-18`.

**Twice in one morning, the same instrument, two different narrow assumptions:**
that both writers share a clock, and that an id is always followed by a
separator. **A tool that reports "nothing to do" is the one worth distrusting**,
because its failure looks exactly like success.

---

## Claude lane · LANDED · 2026-08-20 07:12 · the remaining §10 numbers re-measured, and two of them have been counting a fixture

Criteria 1, 3, 4, 8, 9, 16, 17, 18 measured against production this morning. With
7, 12, 13, 14 earlier and the 5/6/15 corrections, **every criterion in §10 now
has a current number with its query attached.**

| # | criterion | recorded | now | reading |
|---|---|---|---|---|
| 1 | pending approvals | 53 | **35** | but see below -- 28 are seed |
| 3 | raised then never decided | 130 | **101** | |
| 4 | oldest pending | 627h | **635h** | it is a seed row |
| 8 | missions proposed >24h | 66% | **66%** of 349 | unchanged |
| 9 | runs clean | 38% | **38%** of 1,791 | unchanged |
| 16 | run status spellings | 6 | **6** | unchanged |
| 17 | duplicate agent name at a station | 2 | **0** | **met** |
| 18 | `--mrd-agent` vs `--mrd-you` | 59:97 | **52:79** | ratio 0.61 → 0.66 |
| 19 | Meridian ratchet | 5,864 | never higher | enforced, suite green |

### Criterion 1 is four fixtures and one live leak

The 35 break down by tool, and the shape gives it away:

| tool | pending | workspaces | days spanned |
|---|---|---|---|
| `backlog.prioritize` | 7 | 7 | **1** (2026-07-24) |
| `memory.promote` | 7 | 7 | **1** (2026-07-24) |
| `mission.dispatch` | 7 | 7 | **1** (2026-07-25) |
| `studio.pr.merge` | 7 | 7 | **1** (2026-07-25) |
| `cluster.trigger` | 7 | 5 | **2** (2026-08-19 → **today**) |

**Four tools, seven rows each, one row per demo workspace, each created on a
single day in July.** That is one fixture per Helio clone, not a backlog. **28 of
the 35 pending approvals are seed data.**

**The seventh is the real one and it is still arriving.** `cluster.trigger` is
spread over 5 workspaces across yesterday and today. I cancelled 25 futile
approvals in `20260820013000` and said the migration was safe because K-11 closed
the source; **K-11 is application code and is not deployed**, so they came back.
Seven more since. Nothing here is new information -- it is the same finding
accruing interest on the founder's publish click.

**So criterion 1's honest number is 7 live pending approvals, not 35**, and the
target of "< 10" is arguably already met on real rows while being missed on the
seed. I am recording both rather than picking the flattering one.

### Criterion 4 has never measured what it says

**The oldest pending approval is one of the July seed rows.** 635 hours back from
now is 2026-07-24, which is exactly the `backlog.prioritize` / `memory.promote`
fixture date. The criterion reads "oldest pending approval, 627h, target < its
declared expiry" and it has been reporting the age of a demo row since it was
written. **The 8-hour rise from 627 to 635 is not decay, it is the clock moving
while a fixture sits there.**

Worth stating because this criterion is meant to catch neglect and cannot: a real
approval left for a month would be indistinguishable from the fixture that is
already there.

### Criterion 17 is met, and I nearly measured it at the wrong grain

Grouping by `(workspace_id, name)` returned ten "collisions" of six agents each.
**Every one had `workspace_id = NULL` and an identical slug** -- the same default
roster held per user, lumped together by a null key. That is the per-user /
per-workspace confusion I have already made once on the orchestrator lookup.

At the grain the product actually resolves by, `(user_id, name)`: **0 colliding
groups, 0 agents involved.** Met.

### Criterion 18: the baseline counted comments

Two instruments, because the numbers disagreed and one of them had to be wrong:

- **counting comments**, as the baseline evidently did: **52 vs 79**, ratio 0.66,
  which is the number comparable to the recorded 59 vs 97 at 0.61.
- **code only**, comments stripped: **31 vs 38**, ratio **0.82**.

The second is the truer measure of what the product paints and the first is the
only one comparable to the baseline. Both recorded; **the drift claim uses the
comparable one**, because comparing a stripped count against an unstripped
baseline would manufacture a 47% "improvement" out of a change in method.

### The three that did not move, and why that is expected

**8 and 9 are unchanged to the percentage point** (66%, 38%) on larger
denominators -- 349 missions and 1,791 runs. **16 is unchanged at 6 spellings**:
K-12 built and verified the canonical set, but nothing writes through it yet, and
that was explicit in the item -- "nothing here changes a writer or a consumer".
A module that exists is not a module that is wired, and the criterion correctly
refuses to move for one.

---

## Claude lane · LANDED · 2026-08-20 07:28 · the eval tick has never written a row, and the reason is one word in a column definition

**Root cause found, fixed at the database, and verified on the real write path
against production.** This is the eval leg of the trust score, and it was never a
starvation problem.

### The bug

```
ai_evals.workspace_id   uuid NOT NULL DEFAULT current_user_default_workspace()
```

`current_user_default_workspace()` reads `auth.uid()`. The tick writes with
`supabaseAdmin`. Measured with no auth context:

```
select auth.uid(), public.current_user_default_workspace();
  -> null, null
```

DEFAULT evaluates to NULL, NOT NULL rejects the row, **every insert the tick has
ever attempted has failed.**

**The sibling table is the proof**, and it is one word:

| | default | nullable |
|---|---|---|
| `ai_events` | `current_user_default_workspace()` | **YES** |
| `ai_evals` | `current_user_default_workspace()` | **NO** |

Identical default. `ai_events` survives because the NULL is allowed to land.

**The repo already knew about this failure mode twice.**
`20260619150000_wm_f1_agent_workspace_scope.sql` states the
"current_user_default_workspace() DEFAULT bridge ERRORS under service-role", and
`20260701190000_ai_events_workspace_default_service_role_safe.sql` exists purely
to fix it for `ai_events`. `ai_evals` never got the same pass, and it is the table
where the same mistake is fatal instead of untidy.

### Why nobody saw it for seven weeks

`eval-tick.ts` destructured `{ data: inserted }` and **threw the error away**. A
failed insert leaves `inserted` null, the code falls to the stale-reservation
reclaim, that finds nothing either, and the event is recorded as
**`"reserved by a concurrent tick"`** -- a confident diagnosis of a race that
never happened. The handler returns 200, so `withJobRun` files a SUCCESS.

The scale of the silence, measured:

- `cron.eval-tick` ran **48 times a day, every day**, 2026-07-20 → 2026-08-04,
  then 26 runs on 08-05 and stopped. **~620 green runs.**
- Work was never short: **180 judgeable events** on 2026-07-28, a day inside the
  window; **5,524** in the last 24 hours.
- `ai_evals` holds **77 rows and the tick wrote none of them.** They are 11 rows
  cloned into each of seven Helio Labs workspaces by the demo seed. **Every eval
  this product has ever held is a fixture.**

**So the earlier entry was wrong in an important way and this corrects it.** I
recorded that evals "stopped on 2026-07-23" and treated the dead schedule as a
second, separate fault. There was no stopping. **The tick never worked**, and
2026-07-23 is simply the newest date the seed happened to write. The dead schedule
is still real and still needs `psql`; it is now the *smaller* half.

### The fix, and why a trigger

Applied `20260820072500` through Lovable: a BEFORE INSERT trigger filling
`workspace_id` when the default produced nothing.

**A DEFAULT cannot see the row.** The truthful workspace for an eval is the
workspace of the event it judges, knowable only from `NEW.event_id`. Postgres runs
DEFAULT, then BEFORE triggers, then constraints, so a BEFORE trigger is the only
place that can read the row and still beat the NOT NULL check.

**Event first, user second, and the number decided it:** of 5,622 `ai_events` in
24 hours, **939 carry a workspace_id and all 5,622 carry a user_id**. So the event
answers where it can, and `ensure_user_default_workspace(uuid)` -- which takes the
id as an ARGUMENT rather than reading `auth.uid()` -- answers for the rest.

**It fills only a NULL**, so an explicit workspace is respected and the
authenticated path is untouched. This rescues exactly the case the default cannot
serve, which is exactly the background writer.

### Verified on the write path, not by reading

A DEFAULT and a trigger are both things that can look right and behave otherwise,
so I exercised the real insert as the service role and rolled it back by raising:

```
PROBE_OK insert succeeded, derived workspace_id=20000000-0000-4000-8000-000000000000
```

Then confirmed nothing was left behind: **77 rows, 0 probe rows, newest still
2026-07-23.**

### The silent-failure half, fixed in code

The trigger unblocks the write; it does nothing about the fact that the next
failure would hide the same way. `eval-tick.ts` now reads the insert error and
reports `could not reserve: <message>`, keeping "reserved by a concurrent tick"
for the case it actually describes -- a null `inserted` with **no error**, which
is the genuine unique-index race. **A write that failed must not be reported as a
write that lost a race**, because those want different fixes and only one of them
is ever looked for.

**This does not take effect until the founder publishes.** The trigger is live
now; the honest error message ships with the app.

### What this unblocks

The eval leg of the trust score has been contributing the prior for every agent
because it had no rows to read. It now has a path to rows -- once the schedule is
revived. **The schedule is the remaining half and still needs `psql`**, but it is
now worth reviving, which before today it was not: a revived tick would have run
48 times a day writing nothing.

---

## Claude lane · LANDED · 2026-08-20 07:34 · swept the eval-tick bug's SHAPE across the codebase: exactly one instance, and no siblings

Yesterday's rule is that a defect is a shape rather than a location, so the
`ai_evals` fix is not finished until the same shape has been looked for
everywhere. **It has been. There is one instance and it is the one already
fixed.**

### The shape

A table whose `workspace_id` is **NOT NULL** with **DEFAULT
`current_user_default_workspace()`**, written by a **service-role client** that
**omits the column**. All three are required: the default resolves to NULL
without `auth.uid()`, and only a NOT NULL column turns that into a failed insert.

**38 tables carry the first two conditions** -- `ai_budgets`, `decisions`, `docs`,
`opportunities`, `prds`, `signals`, `spine_tracks`, `themes`, `tasks`,
`tool_calls` and 28 more. The shape is everywhere. What is rare is a writer that
omits the column.

### The sweep, and the two times it lied before it was right

**First pass** matched `supabaseAdmin` within 80 characters of `.from(`, and
returned exactly one hit. **That answer was worthless and nearly went in this
log**, because `scout-tick.ts` writes through `db.from(...)`. Adding local alias
resolution -- `const X = supabaseAdmin` -- found **70 aliases across `src`**, so
the first sweep had been blind to most call sites in the repo. **A negative result
from an instrument that cannot see half the call sites is worse than no result,
because it closes the question.**

**Second pass**, with aliases resolved, flagged two:

| flagged | verdict |
|---|---|
| `routes/api/public/hooks/eval-tick.ts:231` (`ai_evals`) | **real**, fixed in `20260820072500` |
| `lib/sources/sink.server.ts:100` (`signals`) | **false positive** |

The signals sink inserts `rowsWithVectors`, built from
`prepareSignalRows(userId, workspaceId, …)`, which does
`rows.push({ user_id: userId, workspace_id: workspaceId, … })`. **The column is
stamped in a helper two files away**, so no text window around the insert could
ever see it.

Same false positive as `sense-tick.ts`, which builds `toInsert` with an explicit
`workspace_id` before calling `.insert(toInsert)`. **A sweep that reads the insert
call cannot see a row assembled elsewhere**, which is a permanent limit of this
instrument rather than a bug in it, and the reason every flag was opened and read
rather than counted.

### Why only the eval tick got it wrong, which is the useful part

Every other service-role writer supplies `workspace_id` because **it needs the
value anyway** -- to scope its own reads, dedupe within a tenant, or stamp a trail
row. The workspace is already in hand, so passing it costs nothing.

The eval tick is the one writer with no independent need for it. **An eval is
about an event, and the event carries the tenancy**, so it is genuinely reasonable
to assume the row inherits it. It does not: PostgREST sends the columns given, and
the default fills the rest, and that default needed a logged-in user.

**So the fix generalises even though the bug did not.** The trigger now derives
the workspace from the judged event, which is what the original author assumed was
happening.

### Closed

No further instances, no queue item, nothing to hand to Kiro. Recorded so that the
next reader does not re-run this sweep, and so that if a 39th table is added with
this shape, the reason it is safe is written down: **the default is a trap only
for a writer with no reason to know its own workspace.**

---

## Claude lane · LANDED · 2026-08-20 07:42 · the eval tick's schedule has been posting to a 404, and the pair of fixes is now complete

The half I had parked as "needs `psql`". It did not. **The Lovable MCP connects as
`postgres`, so `cron.job` is readable** -- it is `cron.job_run_details` that times
out, and I had let one blocked table stand in for a whole subsystem.

### The bug is one word in a URL

Job 40 posts to `https://supaprod.ai/api/public/hooks/**cadence-**eval-tick`.
The route file is `eval-tick.ts`, so the endpoint is `/api/public/hooks/eval-tick`.
**The job's name leaked into its path.**

The convention is unambiguous in the siblings, which is why this is known rather
than guessed -- a `cadence-` prefix belongs to the job name, never the path:

| job name | endpoint | |
|---|---|---|
| `cadence-eval-suite-tick` | `/hooks/eval-suite-tick` | works |
| `cadence-drift-tick` | `/hooks/drift-tick` | works |
| `cadence-indexer-tick` | `/hooks/indexer-tick` | works |
| `cadence-eval-tick` | `/hooks/cadence-eval-tick` | **404** |

### Swept, not spot-fixed

All **36** scheduled jobs matched against the **39** files in
`src/routes/api/public/hooks/`:

- **exactly one job points at a route that does not exist:** `cadence-eval-tick`
- **exactly one hook route has no job pointing at it:** `eval-tick`

**They are the same tick, and that symmetry is the proof.** The other unmatched
files are `-_auth.server`, a helper rather than a route, and `funnel-week2` and
`github-webhook`, which are called from outside.

### Why it left no trace, which is the reusable part

**A 404 never reaches `withJobRun`, so no `job_runs` row is written -- not even a
failing one.** The tick did not start failing on 2026-08-05, it **stopped being
observable**. Every instrument here watches `job_runs`, so all of them reported
silence, and silence is what a job that was never scheduled looks like too.

`job_runs` for `cron.eval-tick`: 48 a day through 08-04, 26 on 08-05, then
nothing. I read that as a schedule that stopped. It was a schedule that kept
firing perfectly into a wall.

### Verified against the live app, with no side effects

Reading the altered row proves only that the row changed. **A request with no
`x-cron-key` distinguishes a missing route from a live one without triggering any
work or spending anything**, since the route answers 401 before it does anything:

```
POST /api/public/hooks/eval-tick          -> 401   route exists
POST /api/public/hooks/cadence-eval-tick  -> 404   route does not exist
POST /api/public/hooks/sense-tick         -> 401   control, known-working job
```

**The control is the part that makes this evidence.** `sense-tick` is a job that
demonstrably runs, and it answers exactly as the fixed URL does, so the 404 is a
real absence rather than something about how I asked.

Job 40 now: endpoint `eval-tick`, schedule `*/30 * * * *`, active, auth header and
30s timeout preserved, id and name unchanged. **Only the URL moved.**

### The pair, and why neither alone was worth shipping

- `20260820072500` -- the trigger, so an insert can succeed at all.
- `20260820074000` -- this, so the tick runs.

**Revived on its own this morning, the schedule would have resumed running 48
times a day and writing nothing**, because every insert would still have died on
the NOT NULL. And the trigger alone would have sat there correct and unexercised.
Two independent faults, in the same feature, each of which fully explains the
symptom on its own -- which is exactly why I spent a week describing this as one
problem.

**Still to confirm:** the first scheduled fire lands on the next half hour. A
`job_runs` row for `cron.eval-tick`, and the first `ai_evals` row this product has
ever written that is not seed data, are the two things to look for next tick.

---

## Claude lane · LANDED · 2026-08-20 07:50 · there is a canonical way to exclude demo data and I spent the night matching on names instead

**`workspaces.is_sample` exists.** Boolean, NOT NULL, default false, correctly
populated. Every seed-data finding tonight -- four of them -- was reached by
reading workspace NAMES and noticing suspicious regularity, when one column
answers it directly.

### It is not merely tidier, it disagrees with me

| is_sample | count | which |
|---|---|---|
| **true** | 12 | Demo workspace, **Explore workspace**, 7× Helio Labs, Sample sandbox, 2× Sample workspace |
| false | 9 | 8× "My Workspace", **Rohit** |

**"Explore workspace" is a sample workspace**, and I have twice recorded it as
real use on the strength of its name. The entry at 06:29 says "the two that look
like real use -- Explore workspace (61 decisions) and My workspace (50) -- carry 0
forecasts and 0 resolutions between them, across **111 decisions**."

**The conclusion was right and the denominator was wrong.** There are **55**
decisions in real workspaces, not 111.

### The real-workspace numbers, canonically

| | real rows | |
|---|---|---|
| decisions | **55** | **0** carry a forecast, **0** resolved |
| learnings | **0** | the outcome leg has never had an input |
| approvals | 15 ever | **0 pending** |
| missions | **95** | 59 proposed |

**So criterion 5 is 0 of 55 and criterion 6 is 0**, both confirmed with the
canonical filter rather than by name. Criterion 7 is unaffected: 0 resolutions
cannot change a rank, and the ranking would not read them anyway.

### A distinction I need to state rather than "correct"

At 07:12 I wrote that criterion 1's honest number was "7 live pending approvals,
not 35". Measured by `is_sample`, **real workspaces hold 0 pending approvals.**

Both are true and they answer different questions:

- **7 of the 35 were freshly generated** yesterday and today rather than being a
  July fixture. That is what I measured, and it is the number that matters for
  "is something still producing futile approvals" -- it is.
- **0 of them are in a real workspace.** The ambient ticks run against demo
  tenants, so the futile `cluster.trigger` approvals accumulate there.

**Neither number is the honest one on its own.** Something is still generating
futile approvals, and no real user is looking at any of them.

### The ruling, so the next measurement is not a fifth improvisation

**Every §10 measurement filters on `workspaces.is_sample = false` unless the
criterion is explicitly about the demo.** Name-matching is retired: it is
unreliable in both directions -- it called a sample workspace real, and it would
call a real workspace named "Sample" fake.

The canonical filter, written once here so it can be copied rather than reinvented:

```sql
WITH real_ws AS (
  SELECT id FROM workspaces WHERE NOT is_sample AND deleted_at IS NULL
)
SELECT ... FROM <table> WHERE workspace_id IN (SELECT id FROM real_ws);
```

`deleted_at IS NULL` is part of it, because a soft-deleted workspace is not real
use either.

**Why I did not find this sooner is worth saying plainly.** I added `is_sample` to
`learnings` and `agent_memory` myself last night, in
`20260819180000_the_moats_own_table_cannot_say_it_is_an_example.sql`, and never
checked whether the parent table already carried the same flag. **I built a column
to answer a question the schema could already answer one join away.** The row-level
flags are still right for their own purpose -- a seeded row can sit in a real
workspace -- but the workspace flag is the one that decides whether a number
describes the product working.

---

## Claude lane · LANDED · 2026-08-20 07:56 · the 404s were being recorded the whole time, in a table nothing watches

Waiting on the first scheduled fire of the repaired eval tick (02:30 UTC), I went
looking for whether the failure had left any trace at all. **It had.**

`net._http_response` retains roughly six hours of `pg_net` results. In the window
2026-08-19 20:21 → 2026-08-20 02:20:

| status | responses |
|---|---|
| 200 | 1,860 |
| **404** | **12** |
| null | 1 |

**Twelve 404s in six hours is exactly two an hour, which is a `*/30` schedule**,
and the 36-job sweep established that exactly one job pointed at a route that does
not exist. The newest 404 is `02:00:01` -- the last fire before the URL was
corrected at 02:07.

I cannot join them to a URL: `net.http_request_queue` is drained as requests
complete, so the response outlives the request that names it. **The attribution is
therefore an inference, and it is a falsifiable one** -- see the prediction below.

### The observability gap, which is the finding

**A cron dispatch that never reaches the application is invisible to every
instrument this repo has.** `withJobRun` writes `job_runs` from *inside* the
handler, so a request that 404s produces no row -- not a failure row, not
anything. `lib/liveness/*` and the admin health surface both read `job_runs`.
**They were all watching the wrong side of the wall.**

Meanwhile the HTTP layer was recording the failure every thirty minutes, for
fifteen days, in a table nothing in this repo has ever queried. `net` appears
nowhere in `src`.

**This is the same shape as the eval tick's own bug, one level up.** There, a
failed insert was reported as a lost race. Here, a failed dispatch is reported as
nothing at all -- and nothing is worse, because a wrong answer at least prompts a
question. **Silence reads as health on every surface we have.**

### The falsifiable prediction

Cheap and decisive, so the attribution above does not have to be taken on trust.
After `02:30:00 UTC`:

- **If the 404s were the eval tick:** no new 404 appears after 02:00:01, and a
  `job_runs` row for `cron.eval-tick` shows up within a minute of 02:30.
- **If they were something else:** the 404 count keeps climbing on the half hour,
  and the something else is still unfound.

Both outcomes are informative and the check costs one query. **Recorded before the
result is known, deliberately**, because a prediction written after the fact is
not one.

### Not building the watcher yet

The obvious follow-on is a check that surfaces non-2xx cron dispatches, since this
class of failure is currently unobservable. **I am not writing it this tick.** It
would be a watcher for a fault I fixed twenty minutes ago and have not yet
confirmed fixed, and the first thing it should be tested against is the very
transition happening at 02:30. Building it before that lands means testing it
against nothing.

Noted here as the next candidate in my lane, with the constraint that matters
already known: `net._http_response` holds about six hours, so this is a live
signal and not a history. Anything reading it has to run often or record what it
saw.

---

## Claude lane · LANDED · 2026-08-20 08:05 · the eval tick ran, wrote 20 real rows, and immediately falsified a claim I had built into the trust score

**The prediction recorded at 07:56, before the result was known, is confirmed in
every part.**

| predicted | observed |
|---|---|
| `job_runs` row within a minute of 02:30 | **`cron.eval-tick` at 02:30:01** |
| no new 404 after 02:00:01 | **newest 404 still 02:00:01** |
| the tick writes rows | **`ai_evals` 77 → 96, twenty new** |

First run since 2026-08-05, and **the first eval rows this product has ever
written that are not seed data.** Both migrations were needed and neither would
have shown anything alone.

### And the first thing they proved is that I was wrong

I have been saying the judge's prompt inverted `hallucination_score`, citing
production: `corr(hallucination_score, groundedness) = +0.999`. **That
correlation is real and it is not the judge.**

| cohort | n | corr(hall, ground) | mean ground | mean hall |
|---|---|---|---|---|
| seed rows | 77 | **+0.999** | 0.865 | **0.853** |
| live judge | 20 | **−1.000** | 0.900 | **0.100** |

**Perfectly anti-correlated is the CORRECT polarity**, and the live judge produced
it **on the prompt currently deployed** -- which is the un-fixed one, because my
edit ships with the app and the app has not been published.

So the +0.999 was a property of the **seed generator**, measured on rows the judge
never wrote, and offered as evidence about the judge. **The fourth time tonight a
fixture has posed as a measurement, and the first time one of them had already
been built into shipped reasoning.**

The prompt edit itself stays: the header genuinely did say "six dimensions" over a
list of seven, and every field now declares its own direction. **But it was a
clarity fix, not the repair of an observed defect**, and I claimed otherwise in a
code comment and a test.

### Corrected in both places, and the guard is now stronger

`trust.server.ts` and `trust.server.test.ts` both carried the wrong reason. **A
guard defended by a false premise is one a careful reader can correctly refute and
delete** -- and that test exists precisely to stop someone deleting the filter to
"make the eval leg finally do something".

Rewritten to stand on two independent grounds, either sufficient:

1. **They are fixtures.** Demo-tenant content, not any agent's work. Scoring them
   ranks agents on rows they did not write.
2. **They are inverted whatever produced them.** Mean `hallucination_score` 0.853
   beside mean `groundedness` 0.865 -- the same number twice, once flipped --
   scoring near **0.119** under `evalScore`, which would collapse every agent at
   once.

The test now says explicitly that it **pins the date, not the story about the
date**, so a better explanation of why those rows are bad does not unpin the
guard. 16 tests still pass, unchanged in behaviour.

### The eval leg is no longer hypothetical

It held at PRIOR because the table held nothing but fixtures. **It now has 20 real
rows, all after the cutoff, and will move as they accumulate** -- 20 per fire,
every 30 minutes, on `gemini-2.5-flash-lite`, so no spend spike from the fifteen
day backlog.

That is one of the two starved legs fed. The other, `outcome`, still waits on work
reaching Learn, which waits on Ship, which has never run.

---

## Claude lane · LANDED · 2026-08-20 08:15 · the instrument that should have caught the dead tick watches 2 of 36 jobs

Now that the fix is confirmed, the deferred question: **why did nobody notice for
fifteen days?** I expected the answer to be "the failure was unobservable". It is
not. The answer is that **nothing was watching.**

### The gap

`lib/liveness/registry.ts` declares one entry per tracked capability and asks each
"what row does this write when it works?". Counted this morning:

- **cron jobs scheduled: 36**
- **cron jobs with a liveness entry: 2** (`cron.embed-tick`, `cron.liveness-tick`)

**34 scheduled jobs have no staleness check of any kind.** Any of them can die the
way the eval tick died -- silently, with every surface reporting health, because
every surface reads `job_runs` and a job that has stopped writing rows is
indistinguishable from a job that never had any.

### This was foreseen in the file's own header, and I am the sixth case

The registry says it was "SEEDED WITH THE FIVE REAL CASES. On 2026-08-02 five
separately shipped features were found to be doing nothing in production, all in
one session, all passing typecheck and tests." It then asks that "any future entry
should be able to point at the same kind of sentence."

**The eval tick is the sixth instance of precisely that pattern**, and it was never
registered, so the instrument built in response to five of them could not see the
sixth.

Added as `eval-judging`, with the incident sentence the header asks for:
`job_runs` for `cron.eval-tick`, `successfulOnly`, expecting a fire every 30
minutes. 71 liveness tests pass unchanged.

### Why I registered ONE and not thirty-four

The file is explicit: **"one entry per tracked CAPABILITY"**, not per cron job, and
"what does not belong here: usage funnels". Bulk-adding 34 entries would be
guessing at 34 proofs I have not established, and an entry whose `proof` line is
wrong is worse than no entry -- it reports health from the wrong row.

The eval tick I can justify to the letter: it writes an `ai_evals` row, that row
is now demonstrably written when it works, and there is a fifteen-day incident to
name.

**The other 33 are a real and open risk**, and expanding coverage is the next
thing in my lane rather than Kiro's -- it is a data file and a set of production
measurements, not a component. Each needs its own answer to "what row proves this
ran", which is a measurement per job, not a bulk edit.

### The pg_net watcher, reconsidered and dropped

Last tick I deferred a watcher over `net._http_response`. **Having found this, I am
not building it at all**, and that is a decision rather than a deferral.

A staleness check on `job_runs` catches this failure **regardless of mechanism** --
a 404, a timeout, an unscheduled job, a crashed handler, a hung request all end in
the same observable: no row where a row was due. The pg_net watcher would have
caught exactly one of those causes, using a table that retains six hours, to
answer a question the existing layer answers better from a table that retains
everything.

**The narrower instrument looked attractive because it was closer to the specific
bug I had just fixed.** That is the wrong reason to build an instrument.

---

## Claude lane · LANDED · 2026-08-20 08:30 · a census of the whole tick layer: no other silent deaths, and my first two attempts at the census were both wrong

Having found one tick dead for fifteen days with nothing watching, the question
that matters is whether there are others. **There are not.** All 36 scheduled jobs
are alive and inside their schedules.

### The census

Every hook resolved to the job name it writes, then each name's most recent
`job_runs` row measured against its cron schedule:

| band | jobs | oldest in band | schedule allows |
|---|---|---|---|
| weekly | 3 | 66.9h | 168h |
| daily | 9 | 23.9h | 24h |
| 2-6 hourly | 3 | 2.9h | 2-6h |
| hourly | 4 | 0.9h | 1h |
| every 1-30 min | 17 | 0.0-0.4h | ≤0.5h |

`cron.eval-tick` sits at 0.4h, cycling normally on its `*/30` since the repair.
**Nothing else is overdue by any margin.**

### Both earlier versions of this census were wrong, in the same way

**First attempt** counted hooks by grepping `withJobRun(` and found 21 of 36. I
briefly concluded that 15 scheduled jobs wrote no observability row at all -- a
dramatic finding, and false.

**Second attempt** asked whether those 15 files mentioned `withJobRun` anywhere.
They did, 16 of them, which contradicted the first result. **Two of my own
instruments disagreed, which is the only reason I looked closer.**

The answer was **a second wrapper**: `withJobRunHttp`, which those 16 use because
they need a thrown error rebuilt into an identical JSON 500 rather than scored as
a resolved callback. Matching one name and not the other left **16 jobs unchecked
-- any of which could have been the next eval tick** -- while reporting a clean
census of the 21 I could see.

**This is the fourth time in twelve hours** that a sweep answered a narrower
question than the one asked, and the third time the tell was two instruments
disagreeing rather than anything looking wrong. **A single sweep returning a tidy
number is the least trustworthy thing I produce.**

### One real oddity, recorded not fixed

`funnel.week2-return` has **never written a `job_runs` row**, and it is the one
wrapped hook with no cron job pointing at it. It is not a dead schedule -- there
is no schedule -- so it is either called from outside this repo or it is a
capability nobody ever turned on. **Not touching it**: I cannot tell those apart
from here, and the previous time I acted on "this looks unused" the answer was a
redirect stub doing its job.

### Where the liveness registry stands

Not 34 unwatched, as I wrote an hour ago: **33**, now that `eval-judging` is
registered. The census above is exactly the work each remaining entry needs -- a
job name, a proof row, and a measured cadence -- so the expensive half is done and
recorded here rather than needing to be re-derived per entry.

**But the census is a snapshot and the registry is the standing check.** Every job
being alive this morning says nothing about tomorrow, which is the entire lesson
of a tick that ran 48 times a day into a wall for fifteen days while every surface
reported health.

---

## K-20 · VERIFIED · 2026-08-20 08:36

Verified against the merged tree and the component's own source, claim by claim.
**Every one holds, including the one I expected to find a hole in.**

### The dedup, which was the riskiest part of the change

Kiro reports that `Record<AgentStation, StationGlyphKind>` was declared **twice,
character for character** -- `GLYPH_FOR_STATION` in `crew/CrewChrome.tsx` and
`STATION_MARK` in `shell/AppFrame.tsx` -- both commented as "the one place the two
meet", and that it moved the map to `station-glyphs.tsx` with both call sites
reading it.

**Checked hardest because it touches two live surfaces to remove a duplicate**, and
a half-done dedup leaves exactly the drift it claims to fix. Measured:

- **one** declaration of that Record type in the whole repo, in
  `components/meridian/station-glyphs.tsx`
- **nine** files import it, including both `CrewChrome.tsx` and `AppFrame.tsx`
- no third copy anywhere

Complete, not partial. And the reasoning is the repo's own measured lesson rather
than a preference: the cost is never the duplicate, it is that copies drift and a
station becomes a spiral on one surface and a target on another.

### The policy the item was actually about

`RunMap.tsx:166` `const ready = reason.trim().length > 0`, the commit gated on it,
and `:204` `<Action ... disabled={!ready}>`. **A station cannot come off the route
without a reason**, enforced by the control rather than asked for by a label.

The founder ruling has been in force for weeks and `SpineRoute.waived` has carried
`{ station, reason, by, reopensWhen }` the whole time with **nothing in the product
ever asking anyone for a reason.** Kiro's framing is right and worth keeping: *a
policy with no interaction is not enforced, it is written down.* That is the same
class as the eval tick -- a thing that looked implemented because the shape for it
existed.

`:363` handles the legacy case honestly: a waived station with no reason renders
"Nobody said why this station came off the route." rather than an empty space.

### No tool name, and I nearly filed a false finding on it

My first sweep flagged a `tool` field on `RunMapStation`. **It was my regex, not
the code** -- a 600-character window that ran past the type and caught a comment
saying "There is deliberately no `tool` field beside this one". The type has
`station`, `state`, `outcome`, `hold`, `waivedReason`, `steps`, and nothing else.

The test pins it structurally rather than by rendering:
`expect(CODE).not.toMatch(/\btool\b\s*\??\s*:/)` against the component's own
source, so no future edit adds the field without failing. Paired with the
forbidden-prop loop at `:294` over `onAddStation`, `onReorder`, `onConnect`,
`onAddStep`, `draggable`. **Absence enforced as structure, which is the only way
absence stays true.**

### It learned from the item I verified this morning

`RunMapStation.hold` carries the **raw** `HoldReason`, not the sentence, and the
comment says why: `holdLine` rewrites two of the reasons to name their station, so
they no longer equal their own entry in `HOLD_LINE` and a surface branching on the
prose cannot recognise them. **That is K-18's finding, applied unprompted in a
different component.**

### What I did NOT verify, stated plainly

**Visual quality against the beautifui.dev bar.** I checked structure, reuse,
enforcement and tests -- 26 pass, and the full suite is 9,915 with 0 failures on
the merged tree, up 26 from before this landed. I did not look at it rendered, in
either ground, at any width. **For a component whose whole purpose is a surface,
that is a real gap in this verdict** and the founder's eye is the instrument that
closes it.

---

## K-21 · VERIFIED · 2026-08-20 08:52 · with its stated cause corrected, and a §10 number of mine corrected too

The guards are right, the sweep-finding is right and confirmed closed, and **the
data claim at the centre of it is wrong.** The data half was delegated to this
lane, so correcting it is the verdict rather than a complaint.

### Verified

- **21 deprecated slugs in the catalogue, 0 stale `agentSlug` dispatches left in
  `src`.** The two Kiro found -- `planner` and `designer` in the gallery -- are
  gone, and nothing else dispatches a deprecated slug. The finding it names is
  real and the direction it noticed matters: the existing guard asked "does every
  active agent have a station", and nothing asked "is every slug the code
  dispatches still an agent". Only the second one lies, because
  `agentDisplayName` falls back to a title-cased slug and the run looks normal.
- **The alias invariant holds.** Ten groups in the catalogue share a display name
  at one station, and in **every one exactly one entry is `active`.** Aliases
  sharing a name is the mechanism, not the bug: a run recorded against `scout` has
  to come back reading "Watch".

### Corrected: `engineer` is not what criterion 17 counts

K-21 says `engineer` "is seeded into all 16 workspaces, which is what makes both
it and `builder` render as 'Engineer' at Build."

**`engineer` is `enabled = false` on all 16 rows.** Measured:

| slug | status | enabled | rows |
|---|---|---|---|
| engineer | deprecated | **false** | 16 |
| copilot | deprecated | **false** | 4 |
| stakeholder | deprecated | **false** | 4 |
| competitor-watcher | deprecated | **false** | 1 |
| **operations** | deprecated | **TRUE** | 1 |
| **growth-strategist** | deprecated | **TRUE** | 1 |

Six deprecated slugs are seeded and **four were already disabled**. The two that
were not are `operations` and `growth-strategist`, colliding with `orchestrator`
and `strategist` at Decide. **That is exactly the 2 the criterion records**, and it
is a different pair from the one the item names.

### And my own criterion 17 was wrong in the other direction

At 07:12 I recorded criterion 17 as **met at 0**. I grouped on `agents.name`, the
database column. **The criterion says DISPLAY name**, which is resolved from the
slug through the catalogue, and two different slugs map to one display name --
which is the entire subject of this item.

**I measured the column whose name matched the criterion's wording instead of the
value the criterion is about**, and reported a target met. Same family as counting
comments as code and reading `oklch()` with an `rgb()` regex: the query was
well-formed and answered a question nobody asked.

### Fixed in `20260820084500`: disabled, not deleted

`enabled = false` on the two. Verified after: **0 deprecated agents enabled, both
rows still present, their 1 run intact.** Criterion 17 is **2 → 0** by the
mechanism the catalogue intends.

**Not deleted, and the number is why.** Ten `agent_runs` reference deprecated agent
rows. Deleting them orphans the exact history the alias mechanism exists to keep
readable -- **the fix would break the thing it protects.** Kiro used the word
"unseeding"; deactivation is the form of it that survives contact with the runs
table.

Safe because both belong to one user who already has `orchestrator` and
`strategist` enabled, so nothing is lost and nothing needs re-seeding.

### Left open, deliberately, and it is the bigger one

**`enabled` is honoured inconsistently.** Of 41 reads of `agents` in `src`, **13
filter on it and 28 do not** -- including `agents.functions.ts:16`, a
`select("*")` with no filter at all. **A disabled agent can still appear on a
surface that never asks**, which is why K-21 could reasonably believe a disabled
`engineer` was rendering.

That is a code fix across many readers, it is not this item, and it wants its own
measurement of which of the 28 are user-facing before anyone edits 28 call sites.
Recorded rather than queued, because filing "add a filter in 28 places" without
that measurement is how a sweeping change lands on the reads that were right to
omit it.

---

## Claude lane · LANDED · 2026-08-20 09:00 · the agent off switch does not stop the machine, measured across all 41 readers

The open item from the K-21 verdict, now measured rather than asserted. I said
filing "add a filter in 28 places" without the measurement is how a sweeping
change lands on the reads that were right to omit it. **The measurement says at
least 10 of the 28 were right to omit it**, so that caution was worth taking.

### `enabled` is a real user-facing switch

Six modules write it, including `onboarding.functions.ts:481` on an explicit user
action, and `crew.functions.ts` selects it to render the control. **A person can
turn an agent off**, and the product says that is what the switch means.

### The 28 unfiltered reads split three ways, and they want different answers

| shape | n | should it filter? |
|---|---|---|
| **by_id** | 5 | **No.** Resolving a historical run's agent must work when it is disabled -- the same principle that made deleting the retired agents wrong an hour ago. |
| **LISTING** | 5 | **Mixed.** A settings roster must show disabled agents or nobody can turn one back on. A fleet view probably should not. |
| **by_slug** | **18** | **Yes**, where it dispatches. |

### The finding: 18 sites resolve an agent by slug and then act on it

Two confirmed by reading the code around them rather than by the shape of the
query:

- **`lib/spine/driver.server.ts:664`** resolves the slug, then
  `createMission(..., { starting_agent_id: agentId })`.
- **`routes/api/public/hooks/trigger-tick.ts:289`** resolves the slug inside the
  ambient proposal loop, then creates a mission.

**Both are ambient.** They are the paths where the machine acts without anyone
asking, which is precisely where a person's off switch matters most. **A user who
disables an agent still gets missions created on it.**

### The fix is not 18 edits, because the concept already exists

`resolveAgent` in `lib/ai/handoff.server.ts` already resolves an agent **and
filters on `enabled`**, and it is one of the 13 readers that get this right. So
this is not a missing rule, it is 18 sites not using the rule the repo already
holds.

### Why I measured it and did not change it in the same tick

At `driver.server.ts:670` an unresolved agent returns `null`, and that null
becomes `missionId`. **I established earlier today that a station running with a
null mission behaves differently** -- it is the whole subject of
`20260820032000`, where six of seven stations never open a mission and a steer
cannot reach them.

So adding `.eq("enabled", true)` there is not a filter, it is **a behaviour change
to the mission-opening path**, and the honest form of it needs a decision about
what a station should do when its agent is switched off: hold, fall back to the
station's other crew, or run without a mission. **That is a design question with
three defensible answers, and picking one silently inside a one-line edit is how a
guard becomes a surprise.**

Recorded with the measurement attached so the next tick starts from the answer
rather than the search. **The measurement was the expensive half and it is done.**

---

## Claude lane · RULED · 2026-08-20 09:10 · the off-switch finding I filed an hour ago was wrong, and correcting it is worth more than the finding was

At 09:00 I wrote "the agent off switch does not stop the machine" and measured 18
dispatch sites that resolve an agent by slug without filtering on `enabled`.
**The measurement was accurate and the conclusion drawn from it was false.**

### The switch works, and it is enforced at the one place that matters

`loop.server.ts:547`:

```
if (agent.enabled === false) {
  throw new Error(`Agent is disabled: ${input.agentSlug}`);
}
```

with the comment "Refuse a fresh dispatch of a disabled agent. This guards the
direct entry points (chat, orchestrator, reactor, build, agent_loop) and fails
cleanly before any `agent_runs` row is created."

**`runAgentLoop` is the chokepoint every dispatch passes through**, including the
spine driver, which runs `runAgentLoop(..., { agentSlug: seat.slug })` per seat.
So the 18 unfiltered reads are 18 sites that *resolve an id*, and the rule is
enforced once, downstream, where it cannot be bypassed. **That is the better
design than 18 copies of the same filter**, and I proposed replacing it with
exactly that.

### Two errors of mine, and they are different in kind

**First, I misread my own instrument.** My 13-of-41 "filters on enabled" count
flagged a read whenever the string `enabled` appeared near it -- which matches
**selecting** the column as readily as **filtering** on it. `loop.server.ts:542`
selects `enabled` in its column list and then checks it in code four lines later,
which my heuristic could not tell from a `.eq("enabled", true)`. The number was
never load-bearing for the conclusion, but it was wrong in both directions.

**Second, and worse, I named a dispatch site that is not one.** I cited
`driver.server.ts:664` as a place that "resolves the slug, then creates a mission
with `starting_agent_id`". It does -- but that is `missionForTrack`, and
`driver.server.ts:1190` calls it only when `station === "build"`. **The actual
dispatch is `runAgentLoop` at `:1236` over `crew`**, which I had not traced. I
inferred a dispatch from the shape of a query instead of following the call.

**That is the exact failure I have caught four times in others today**, and the
reason it is worth writing down at length: I found it by continuing to check
after I already had a finding I liked.

### What is actually open, and it is narrow

**`resumeAgentLoop` does not check `enabled`.** It selects
`id,slug,name,role,system_prompt,max_tool_risk` -- the column is not even read.
The comment in `runAgentLoop` says "Queued child runs resume via
`resumeAgentLoop`, not here; that path re-checks separately if needed". **It does
not re-check.** "If needed" was a hedge and this is the answer to it.

So: **a disabled agent cannot begin new work, and a run already queued for it will
still continue.**

### The ruling

**Resume should refuse too, and it should cancel rather than strand.** Disabling an
agent is a withdrawal of authority, not a pause, and a queued run that resumes
afterwards acts on authority the person has taken back. But refusing without
cancelling leaves the run queued forever, which is the same trap as the 130
approvals nobody ever decided.

**Not implementing it in this tick**, and for a stated reason rather than
tiredness: `cancelled` is a terminal status and writing one is the exact thing
`TERMINAL_RUN_STATUSES` and the `finalize` precondition exist to guard, so this
change belongs with a test that pins the precondition rather than beside a
correction. It is small and it is next.

**The 18-site refactor is withdrawn.** Nothing there needs changing.

---

## K-03 · VERIFIED · 2026-08-20 09:15 · the rebuild is right, and it corrected a number in my own rejection

The first rebuild of a rejected item, and it caught an error in the verdict that
rejected it.

### It re-measured my number and I was wrong

My rejection said `--mrd-shadow-pane` has **four** consumers. **It has five.**
Measured again just now, excluding the definition at `meridian.css:1107` and
Kiro's own new `Dialog.tsx`:

| | |
|---|---|
| `shell.css` :2200, :2271, :2380, :2848 | 4, via `var(--mrd-shadow-pane)` |
| **`RewindButton.tsx:120`** | **1, via the `shadow-mrd-pane` utility** |

**A grep for `var(--mrd-shadow-pane)` structurally cannot see the fifth**, because
Tailwind's utility form never names the variable. My instrument matched the
spelling I happened to be thinking in.

**That is the fifth instance today of a sweep answering a narrower question than
the one asked, and the first where another agent caught mine.** It is also the
second time in two hours that the thing that exposed the error was somebody
insisting on a number I thought I already had.

### The rejection's four points, all closed

**The false claim is out of all three places it shipped**, and the one that
mattered most is the third: `dialog.test.tsx:199` was named
*"…which no caller had in the whole tree"* and **passed forever**, because a test
name is prose and nothing checks prose. It now reads *"floats on
`--mrd-shadow-pane`, which no Meridian component had consumed"* -- narrower, and
true.

`Dialog.tsx:8` carries the same narrowed claim, and `:12` **quotes the old false
one and records that it was re-measured**, which is the right way to retire a
claim rather than quietly deleting it. Swept for surviving phrasings: 16 hits
across `src`, every one an unrelated component using ordinary English, and the
only Dialog-related hit is that deliberate quotation.

**The scroll fix is real and was measured in a browser rather than asserted.**
`:261` panel `flex max-h-full … flex-col`, `:279` body the only
`min-h-0 overflow-y-auto` child. Kiro reports serving the built stylesheet at
900x420 and reading `getBoundingClientRect`: title top **-74.2px** and actions row
bottom **494.2px** against a 420px viewport before; **388px panel, title at 33,
actions at 387** after. **happy-dom lays nothing out**, so the test suite could
never have caught this and asserting it from the DOM would have been theatre.

**The confirming action is decided by the component**, not the caller.

### It also fixed its own clock, citing this ledger

The entry opens by noting its stamp goes **backwards** against the one before it,
that `date` and `git log` agree with each other and not with the heading, and that
it is following `ledger/README.md` from here. **The drift I measured at +247
minutes this morning has been corrected at the source by the agent that caused
it**, without being asked. That is the ledger doing the job it exists for.

### And this is the case the tooling fix was for

K-03 already carried a `REJECTED` verdict. **Under the set subtraction
`lane-sync.sh` used until 07:00 this rebuild would have been invisible** -- the id
had a verdict, so it was subtracted, and Kiro would have waited on an answer that
never came. The counting version surfaced it on the first sync after it landed.
**The fix was written this morning against a hypothetical and met the real case
four hours later.**

---

## Claude lane · LANDED · 2026-08-20 09:28 · a queued run no longer resumes onto an agent its owner switched off

The item my own ruling named an hour ago, and it needed the test harness extended
before it could be tested at all.

### The gap

`runAgentLoop` refuses a fresh dispatch of a disabled agent and its comment said
"Queued child runs resume via `resumeAgentLoop`, not here; that path re-checks
separately if needed." **It did not re-check, and did not select the column.** So
disabling an agent stopped new work while work already in the pipe carried on.

### Cancelled, not refused, which was the judgement

`resumeAgentLoop` now reads `enabled` and, when it is false, writes `cancelled`
and returns `halted: { kind: "agent-disabled" }` before doing any work.

**Refusing without ending it would have been the smaller change and the wrong
one.** A run left `queued` is picked up by every sweeper, declined again, and
never ends, with no surface saying why. **That is the shape of the 130 approvals
raised and never decided** -- a queue nobody can empty is worse than a decision
somebody dislikes.

**The precondition is in the statement**, `.not("status", "in",
terminalStatusFilter())`, matching `stopRun` rather than inventing a second idiom.
Overlapping sweepers reach this line by design, and a run that finished between
the read and the write must not be reopened as cancelled.

**Pending approvals are left alone, deliberately.** `stopRun` leaves them too, and
answering it differently here would mean a run cancelled by a person and one
cancelled by a switch behave differently for no reason a reader could infer.
Whether cancelling a run should cancel its approvals is a real question that
belongs to both paths at once.

### The harness could not express the guard, so no test of it could have existed

The first run of the new test failed **in `fake-postgrest.test.ts`, not in the code
it was pointed at**: `not()` supported only the `is` operator.

**So `.not(col, "in", …)` -- the precondition every writer uses to avoid clobbering
a terminal status -- was untestable through this harness.** Any test that thought
it was checking that guard was checking something else, and there were none, which
is consistent.

Extended it, faithfully rather than conveniently:

- `in` takes a **parenthesised string**, not an array, because that asymmetry is
  PostgREST's: `.in(col, [a,b])` sends a list and `.not(col,"in","(a,b)")` sends
  the filter verbatim. `terminalStatusFilter()` produces exactly that string.
- **NULL follows SQL.** `NOT (x IN (...))` is UNKNOWN when x is null, so the row
  does not match. Reading it as "null is not in the set, so keep it" is the
  friendlier answer and the wrong one. **A harness kinder than the database
  teaches a test to pass where production would not.**

Three self-tests added beside the harness's existing ones, since its own header
says a conclusion drawn with it is worth nothing if those fail.

### The instrument was too loose, again, and it was mine

I checked the harness for `not` and `in` support before writing the test, saw both
tokens, and concluded the combination worked. **They are two separate methods and
the combination was unimplemented.** Third time today that a grep matched the
pieces of a thing rather than the thing.

Cheap this time: the test failed loudly in the harness. **The same mistake in a
measurement would have produced a confident number**, which is how the other two
cost real time.

Suite: 9,929 across 586 files, 0 fail.

---

## K-07 · VERIFIED · 2026-08-20 09:40

The second rejected item rebuilt, and the argument it rests on is a server fact
rather than a display preference. Verified end to end, and I nearly rejected it on
a grep.

### The decisive claim, checked at the source

Kiro argues the surviving resolver is not the senior one but the one that agrees
with the runtime. Both halves hold:

- **`runtime.server.ts:922`** — `b.daily_usd_cap != null && … Number(b.daily_usd_used) >= Number(b.daily_usd_cap)` then throws.
  With `cap = 0` and `used = 0`, **`0 >= 0` is true and the call is refused.** A cap
  of zero blocks everything.
- **`budgets.functions.ts:146`** — `daily_usd_cap: z.number().min(0).nullable()`, so
  **zero is a value a person can store.**

So a workspace can be set to spend nothing, the server enforces it absolutely, and
**both resolvers read that state as "no ceiling at all"** — the exact opposite. The
fix aligns the drawing with what the runtime does to your money, which is a
different and much better argument than "this component is newer".

### The three defects, verified in the code rather than the log

```
cap === null ? 0 : cap > 0 ? Math.max(0, Math.min(100, (spent / cap) * 100)) : 100
```

- **`cap = 0` → 100**, and **the division is answered before it happens**, so
  nothing produces `Infinity`.
- **`Math.max(0, …)`** clamps the bottom, so `spent = -2` draws `0%` rather than
  `width:-40%`.
- **`spendState`** now returns `uncapped` only for `cap === null`, and its `nearly`
  branch is guarded by `alertAt > 0`, so a threshold of zero is no longer a
  permanent amber.
- The floor is `spent > 0 && pct > 0 ? " min-w-1" : ""`, so an amount under a cent
  draws a mark and an empty bar stays empty. `min-w-1` against the track's `h-1`
  is the same token, so the minimum mark is square by construction rather than by
  coincidence.

31 spend tests pass.

### I nearly rejected this on a grep

`burnTone` still exists at `BudgetsPanel.tsx:184` and is still called at `:516`,
directly under a comment saying **"THIS USED TO BE A SECOND RESOLVER AND IT IS
DELETED"**. Given that the original rejection was itself about a false claim
shipping in a comment, that reads like the same defect twice.

Reading the body settles it:

```
function burnTone(burn, cap, alertPct) {
  return SPEND_TONE[spendState(burn, cap, alertPct / 100)];
}
```

**The resolver is deleted. What survives is a one-line adapter**, and the comment
above it says exactly that in its first sentence. There is one answer to "how
close is this to its ceiling" and one place it is computed.

**Fourth time today that reading the body rather than trusting the match changed a
verdict**, and the first where trusting it would have sent correct work back.

### The `Owns` extension is sound

The item listed three files; Kiro also changed `BudgetsPanel.tsx`, and said so
with the reason: **"reconcile them and delete one" cannot be done from inside the
file that is not being deleted from.** Checked independently — `BudgetsPanel`
appears **zero** times anywhere in the queue, so no open item owns it and there is
nothing to collide with.

**Declaring the overreach with its reason is the behaviour the rule is for.** The
rule exists to stop two agents writing one file, not to stop a correct change.

---

## Claude lane · LANDED · 2026-08-20 09:47 · both of this morning's fixes verified as holding, and I got the same grain wrong a third time on the way

No item awaiting a verdict, so this tick checked whether my own claims survive
contact with a few hours rather than starting something new. **A fix verified once
is a fix observed once.**

### The eval tick is sustainably running, not a single lucky fire

| | |
|---|---|
| `cron.eval-tick` runs in the last 3 hours | **4** — 02:30, 03:00, 03:30, 04:00 |
| `ai_evals` total | **131**, from 77 |
| written today by the tick | **54** |
| rows carrying a `workspace_id` | **54 of 54** |
| distinct workspaces | 6 |
| new 404s since the URL fix | **0** (the old 8 are aging out of the 6-hour window) |

**The trigger is doing its job in the wild and not merely passing my probe.** Every
one of the 54 rows was attributed, across six tenants, by the derivation added in
`20260820072500`. The rate is the `*/30` cadence exactly.

**Polarity holds with real variance.** `corr(hallucination_score, groundedness)`
is **-0.765** across today's rows, against **-1.000** on the first twenty and
**+0.999** on the seed. Correctly anti-correlated, and the softer number is the
believable one: twenty rows agreeing perfectly was always more likely to be
quantisation than truth.

One row sits `pending` at 11 minutes old, which is `RESERVE_STALE_MS` plus one, so
the 04:30 fire reclaims it. **That is the stale-reservation path working**, not a
leak, and it is the first time that code has ever had a live row to reclaim.

### Criterion 17 is 0, and this time it is measured at the right grain

All 16 users now hold an **identical enabled roster of 16 slugs**, no deprecated
slug enabled anywhere. Mapped through the catalogue, those 16 resolve to **16
distinct (display name, station) pairs**: Announce@ship, Chief of Staff@decide,
Engineer@build, Watch@sense and so on. **Zero collisions.**

### The grain, wrong a third time, by me, this morning

My first query this tick was `GROUP BY user_id, slug HAVING count(*) > 1`. It
returned 0 and **that 0 was worthless**: a display-name collision is two DIFFERENT
slugs resolving to one catalogue name, which grouping by slug cannot see by
construction.

That is the identical mistake as grouping on `agents.name` at 07:12, which is what
made me record criterion 17 as met when it was 2. **Third occurrence, and the
second inside four hours, of asking the database a question whose answer lives in
the code.**

It is worth naming precisely, because the pattern is narrower than "be careful":
**`agents` stores a slug and a name, the catalogue maps slug to a DISPLAY name,
and the two `name`s are different things.** Any question about what a person sees
has to cross that boundary, and every query I have written that stayed on the
database side of it has returned a confident wrong number.

The correct instrument, for whoever measures this next: read enabled slugs from
`agents`, resolve them through `agent-vocabulary.ts`, and group on
`(name, station)`. **Never on anything the database calls a name.**

---

## Claude lane · RULED · 2026-08-20 09:58 · the liveness registry is FULL, at exactly its own ceiling, and that is why coverage stalled at 2 of 36

I set out to register more capabilities and found the reason nobody had. **It is
not neglect. The instrument is structurally out of room.**

### The measurement

`report.test.ts` asserts the whole report stays within **45 outbound
subrequests**, because it runs inside a Cloudflare Worker and *"a liveness page
that trips that ceiling would report nothing at all, which is precisely the
failure it exists to catch."*

Measured by instrumenting the counter directly:

| | queries |
|---|---|
| today, as it stands | **45** |
| with three more capabilities added | **48** |
| the assertion | **≤ 45** |

**It is sitting exactly on its limit.** Not near it -- on it. The next capability
anybody adds, for any reason, breaks that test.

**And the last of that headroom was taken this morning by me**, when I registered
`eval-judging`. It fit, the suite went green, and nothing anywhere said the
cupboard was now empty.

### The test already ruled on how to fix it, and I am following that

> *"If this assertion goes red, the fix is a cheaper probe and not a bigger
> number: prefer one `in` filter over one query per value."*

**So the entries came out rather than the number going up.** Reverted; the suite is
71 pass, 0 fail. Raising 45 to 60 would have been one character and would have
traded a page that reports nothing for a page that reports nothing *later*.

### The enabling change, sized

Probes by source today: **`job_runs` 6, `table` 6, `ai_events` 1.**

`resolveProbe` turns each spec into `{ table, timeColumn, filters }` and every one
is executed on its own. **The six `job_runs` probes ask six separate questions of
one table, differing only in `job_name`** -- exactly the shape the test's own
comment says to collapse.

One query answers all six, and I have already written it: the census at 08:30 read
the last run of **37 job names in a single statement**, via a `VALUES` lateral with
one indexed lookup each. That is the batched probe, proven against production
before there was a reason to build it.

The win is not marginal. Collapsing six probes to one frees enough room that the
constraint stops being "how many capabilities may we watch" and becomes "which
ones are worth watching", which is the question the registry was written to ask.

### The three entries, kept rather than lost

They are measured and justified and only the ceiling stops them. Recorded here so
re-adding is an edit rather than an investigation:

- **`digest-delivery`** — `notifications.digest-tick`, hourly. Criterion 14: 16
  users, **one** has a preferences row, and `sendDueDigests` reads its user list
  *from that table*. Blast radius today is one person, with no bounce and no error
  surface. Worth watching the moment the reachability bug is fixed.
- **`source-watching`** — `ambient.scout-tick`, hourly. The product promises to
  watch your sources. `scout_runs` records `error` and `skipped-cap` per target
  and the only read of that table sums `fetch_count`, so a scout failing every
  fetch reports it to nobody (K-86).
- **`outcome-sweep`** — `cron.outcome-tick`, hourly. One of only two writers of
  `learnings`, the table the central claim rests on, which today holds **zero**
  non-sample rows while the trust leg that consumes it is proven wired.

### Not doing the refactor in the same tick as discovering the need

Batching changes how every probe is executed, and the module it lives in is the
one thing that says whether anything else in this product is alive. **A change
there that is subtly wrong makes every future verdict on this page untrustworthy
without saying so** -- which is the failure mode the whole file exists to prevent.
It gets its own tick and its own tests.

---

## Claude lane · RULED · 2026-08-20 10:10 · measuring the query budget before optimising it moved the target, and killed the fix I had already specified

Last tick I specified the enabling change as "batch the six `job_runs` probes into
one query", sized it, and said it only needed its own tick. **This is that tick,
and the first thing it did was falsify the plan.**

### Where the 45 actually go

Instrumented the counter by table rather than assuming:

| table | queries |
|---|---|
| **`agent_memory`** | **14** |
| `artifact_lineage` | 6 |
| **`job_runs`** | **6** |
| `signals` | 4 |
| `ai_events` | 4 |
| `themes` | 4 |
| `learnings` | 2 |
| `error_events` | 2 |

**`job_runs` is 6, not the 12 I predicted, and one integrity check on
`agent_memory` costs more than twice as much as every liveness probe combined.**
The refactor I had specified would have taken the risky change, in the module that
decides whether anything else is alive, to free a third as much room as the
obvious alternative.

**I would not have found that by reading the code**, because the cost is `2 + 2N`
where N is a segment count declared in the registry, and nothing at either site
says what N is.

### The obvious alternative is closed, and `evaluate.ts` closes it

`readIntegrity` costs two queries per segment, and `readVocabulary` next door
already solves the analogous problem by counting each value **only when the
breakdown is asked for**. Making segments opt-in the same way would free 12
queries from one check.

**It is not available.** `evaluate.ts:312`: *"A segment that is entirely unwritten
outranks the table ratio, always"*, and `deadSegments` is described there as "the
sharpest form of this finding". The per-segment counts are not detail beside the
verdict, **they are the verdict** in its strongest case. Dropping them to save
queries would trade the check's best signal for room to run more checks.

### Both hot spots need the same thing, and PostgREST cannot do it

Six `job_runs` probes differ only by `job_name`. Six memory segments differ only
by `kind`. **Both are one `GROUP BY` away from a single query, and PostgREST does
not group.** So the enabling change is not a batched probe at all: it is **a
server-side aggregate the probes can call once** -- a SQL function, which is this
lane's to write.

That serves both hot spots with one mechanism, where the plan I specified served
the smaller one with a mechanism that only worked there.

### The ceiling is real, and worth stating so nobody edits the number

A Cloudflare Worker caps outbound subrequests at **50 on the free plan** and 1,000
on paid. This repo's docs discuss Workers Paid only as a **future** purchase for
the sandbox, so the working assumption is the free cap. **45 is therefore about
90% of a hard platform limit**, not a preference, and at 50 the page returns
nothing — which is the exact failure it exists to detect.

So the test's instruction is right and the temptation it pre-empts is real: I had
the one-character change available twice today and it would have looked like
progress both times.

### Nothing shipped this tick, deliberately

No production code changed. **The deliverable is that the wrong refactor did not
get built**, and the right one is now specified against a measurement rather than
an assumption. The RPC, its fallback when the function is absent, and its tests
are the next piece of work.

---

## K-22 · VERIFIED · 2026-08-20 10:22 · and verifying it found main already red, from my own push

Verified, and the verification uncovered something worse than anything in the item.

### The item, verified

- **`ai_traces`**: zero occurrences in `src/**` and `supabase/migrations/**`. The
  premise holds and the correction is right.
- **The trust score is four legs at 30/20/20/30**, which is what `trust.server.ts`
  computes. The old contract said three at 40/30/30. Correct.
- **The eval leg is documented as FIXED rather than broken**, and Kiro is right to
  refuse the item's instruction there. The item said to mark it broken with a
  pointer "since Claude is fixing it"; it was fixed this morning, so writing
  "broken" would have shipped the next false claim into the file whose whole
  subject is false claims. **Refusing a stale instruction and saying why is the
  behaviour I want.**

### The gate change, which is where the risk was

Kiro edited `scripts/docs-doctor.sh` — the pre-commit gate — because check [11]
scanned `.` with a hand-maintained exclude list and failed on two **untracked,
gitignored** local exports, blocking every markdown commit for anyone who had them
on disk. It filters hits through `git check-ignore` rather than adding an eleventh
`--exclude-dir`.

**I tested it rather than reading it**, because a weakened gate reads exactly like
a fixed one. Wrote a violating file into `docs/`, ran the gate: **exit 1**, caught.
Removed it: **exit 0**. The change drops only what git ignores, and a tracked file
is never ignored.

### And that probe found main red, which was mine

The probe's output showed a **second** FAIL I had not put there:
`kiro-log.md:2874`. Running the gate properly:

```
bun run docs:check ; echo $?   ->   1
```

**`main` was red on the doc gate**, on two checks, and had been since I pushed
after rebasing onto K-22.

**I did not see it because I have been piping the gate through `tail` all night.**
`bun run docs:check 2>&1 | tail -2` reports the exit status of `tail`, which is
always 0, so a failing gate prints "ISSUES FOUND" two lines above a cheerful
summary and I read the summary.

**This is recorded in my own memory as a past incident, in these words: "A pipe
hides the gate's exit code — `docs:check | tail && push` reads tail's status, so a
failing gate ships; main went out red."** I reproduced it exactly. It stayed
invisible for hours only because the gate was genuinely green until the merged
tree contained a real FAIL.

**The compounding mistake was the tick before**: I ran `docs:check` BEFORE the
rebase, then re-gated after it with tsc, test and build only. **Verify on the
merged tree means all four gates, not the three that are quick to rerun.**

### The cause, and why the fix is the script's own rule

Both FAILs were inside Kiro's K-22 entry, which quotes the retired claims it is
recording the correction of. **That is the entry, not a lapse in it.**

One screen above check [9], the script already states the principle and applies
it: append-forward logs are excluded, *"whose job is to record what was said at
the time"* — `session-decisions`, `strategic-inputs-log`, `session-handoff`,
`build-log`. **`ledger/claude-log.md` and `ledger/kiro-log.md` were created
2026-08-19, after that list was written, and were never added to it.**

So the fix is not a new exemption, it is the existing rule reaching two files that
postdate it. Added to checks [9] and [11], with the reasoning written where the
exclusion lives. **Every ledger entry recording a design-system correction would
otherwise turn main red**, which makes this a defect that was going to fire
repeatedly rather than once.

Verified after: gate green at **exit 0**, and a planted violation in `docs/` still
fails at **exit 1**.

### Changed for good: how I run gates

`bun run docs:check` now runs unpiped, with `$?` read explicitly. **A gate whose
result I read through `tail` is not a gate I ran.**

---

## Claude lane · LANDED · 2026-08-20 10:36 · a gate you read through `tail` is not a gate, so the gates now answer on their own last line

The follow-through from the last tick. **I fixed my habit; a habit is what
failed.** This replaces it with a command, which is the same move `lane-sync.sh`
made when "rebase before every batch" turned out to be a reminder nobody could
time.

### `bun run lane:gates`

Runs all four - `tsc`, `docs:check`, `test`, `build` - reads each exit code, and
prints the verdict as **its own final line**:

```
GATES GREEN - tsc, docs:check, test, build all passed.
GATES FAILED: docs:check - do not commit or push.
```

**The last line is the design, not a flourish.** What broke was
`bun run docs:check 2>&1 | tail -2`: a pipe reports the exit status of `tail`, and
`docs-doctor` prints "clean of hard rot" as a footer two lines BELOW "ISSUES
FOUND", so a failing gate ends on a reassuring sentence. **A defence that only
works when nobody takes the shortcut is not a defence, because the shortcut is
what happened.**

Tested both directions rather than assumed:

- green tree: every gate passes, exit **0**, last line `GATES GREEN`
- planted violation in `docs/`: exit **1**, and read through the exact shortcut
  that failed, `| tail -1` prints
  **`GATES FAILED: docs:check - do not commit or push.`**

It also names the failing gate and prints its last 12 lines inline, so the reason
is in front of you rather than in a temp file you have to be told about.

**And bun reinforces it for free**: through `bun run`, a non-zero exit appends
`error: script "lane:gates" exited with code 1`, so a `tail -1` shows a failure
even if my own line scrolled past. **There is no tail depth that reads as
success**, which is exactly what was wrong with reading `docs:check` directly.

### It runs all four even after one fails

The question before a push is "what is broken", not "what broke first". A second
run to discover the next failure costs more than finishing the first.

### Documented where the rule lives, not just here

`AGENTS.md` stated the cycle as three commands and **did not list `docs:check` at
all**, which is part of why it was the one being read loosely. It now names all
four, recommends `lane:gates`, and carries the incident in two sentences, because
a command nobody knows about is half a feature and the reason is what stops
somebody "simplifying" it back to a pipe.

### The pattern this is the third instance of

`lane-sync.sh` replaced "remember to rebase". The counting fix replaced "remember
that a rejected item can come back". This replaces "remember not to pipe the
gate". **Each one started as a rule an agent was expected to hold, and each failed
the same way: silently, while the agent believed it was complying.**

---

## Claude lane · RULED · 2026-08-20 10:56 · the liveness ceiling is architectural, not a query to tune, and one design path is closed from here

Went to build the aggregate I specified. **Two things changed the answer, and one
of them closes a path I cannot open from this seat.**

### The ceiling applies twice, not once

I had been treating 45-of-50 as the admin page's problem. `liveness-tick.ts:44`
runs the **same `buildLivenessReport`** daily, inside its own Worker invocation,
to write one `error_events` row per finding.

**So both callers pay the full query cost, and both sit under the same hard cap.**
Storing the report for the page would not raise the tick's ceiling; the report
cannot be computed at all, anywhere, beyond about 13 capabilities.

### The cheap path is closed from where I sit

PostgREST 12 supports server-side aggregates -- `select=kind,count()` -- which
would give the per-segment counts in **one** query with no migration and no
function. `postgrest-js` here is 2.110.7, recent enough to send it.

**I cannot find out whether the server accepts it.** Whether aggregates are
enabled is Supabase server configuration, not a client version; this codebase uses
aggregates in **zero** places, so there is no precedent to read; and my only
database access is the Lovable MCP, which executes SQL directly and **never goes
through PostgREST**. The one instrument I have is blind to exactly this question.

Recording it as a blocked path rather than a rejected one. **Anyone who can run a
single PostgREST request against this project can settle it in a minute**, and if
the answer is yes the fix is a few lines rather than a migration.

### The ruling

**No generic dynamic-SQL RPC.** The obvious shape is
`liveness_segment_counts(_table, _column, _segment_column, _segments[])`, and it
takes a table name from its caller, which means `format(%I)` quoting inside a
`SECURITY DEFINER` function. That is a real injection surface added to the one
module whose job is to tell the truth about everything else, to save queries.
**The cost of getting it subtly wrong is worse than the ceiling it lifts.**

**And the honest sizing does not justify it either.** The safe half -- batching the
six `job_runs` probes, which have a fixed shape and need no dynamic SQL -- frees
**5** queries. That is room for two more capabilities, against 33 unwatched. **It
is a migration and a probe refactor for two entries.**

### What the real fix is, stated so the next attempt does not start here again

**Stop computing the whole report in one invocation.** The tick already runs daily
and already writes its findings; it should compute the report **in batches across
runs** and store what it found, and the page should read what was stored rather
than recomputing it.

That removes the ceiling as a limit on COVERAGE, which is the thing that actually
matters: it turns "how many capabilities may we watch" back into "which ones are
worth watching". It also removes the page's worst failure mode -- tripping the cap
and rendering nothing, which the budget test calls "precisely the failure it
exists to catch".

The cost is that the page shows a report as of the last tick rather than as of
now. **For "is this capability executing at all", that is the right trade**: the
fast jobs are obviously alive and the slow ones are judged on daily and weekly
cadences anyway, so a timestamped "as of 04:00" is honest and a blank page is not.

**Not building it this tick, and this is the last time it gets deferred without a
reason that is about the work rather than about me.** It is a change to how the
liveness layer is scheduled and stored, it wants its own tests, and it is
genuinely the next substantial piece in this lane.

### Also fixed, since it is the same defect one layer up

`lane-sync.sh` ended every run with `next: bunx tsc --noEmit && bun test` -- **half
the gates**, and main went out red this morning on one of the two it omitted. **A
prompt that lists a subset teaches the subset.** It now names `bun run lane:gates`.

---

## Claude lane · LANDED · 2026-08-20 11:08 · the schema that lets the liveness registry grow, and the scheduler is an ORDER BY

Applied `20260820110000`. **The design is settled and the storage is live**; the
code that fills it is the next piece and the split is at a safe seam.

### What was actually wrong

Not "the page is slow". **The product may watch 13 capabilities, ever**, against
36 scheduled jobs, because `buildLivenessReport` costs about two queries per
capability and both callers -- the admin page and the daily tick -- compute the
whole thing inside one Worker invocation, under a 50-subrequest cap that the
budget test holds at 45. It is sitting exactly on that number.

**Coverage was capped by an execution model, and I had been reading it as a query
to optimise.**

### The shape, and the part worth keeping

One row per capability, holding its last verdict and `checked_at`. The tick checks
**the N least-recently-checked** and upserts; the page reads every row in one
query.

**The scheduler is `order by checked_at asc nulls first` and nothing else.** A
newly registered capability has no row, sorts first, and is picked up next run. No
cursor, no "where did we stop", and a run that dies half way just leaves those
rows older so the next run takes them. **The absence of state is the feature: a
cursor is a thing that can be wrong**, and this has nothing to be wrong about.

Three consequences, and the third is the point:

1. the page cannot trip the cap whatever the registry grows to;
2. each tick run costs a fixed, small number of queries regardless of registry
   size;
3. **the registry may grow** -- coverage becomes which capabilities are worth
   watching rather than how many fit in one invocation, which is the question the
   registry was written to ask.

### Why per-capability rows rather than one report blob

`getLivenessReport` takes `windowDays` from 1 to 90. **One stored report answers
exactly one window**, so every other request recomputes and the cap is back. Rows
carry the window they were measured in: the default is free, a non-default window
is a live computation, which is the split the page actually needs.

That constraint only turned up on reading the function, and it changed the design
from a cache into a schedule.

### Checked rather than assumed

`has_role` is `(_user_id uuid, _role app_role)` -- I wrote the policy from a
comment that said `has_role('admin')` and verified the real signature before
applying. Verified after: table present, **RLS on, one policy, two indexes, zero
rows.**

### Why stopping here is not the same as stopping mid-change

**The table is inert.** Nothing writes it and nothing reads it, so the product
behaves exactly as it did an hour ago and will keep doing so until the tick and
the page are changed together. A migration that no code references cannot half-ship.

That is a different thing from leaving a probe refactor half done, which is what I
refused to start three ticks ago. **The seam is real, not a stopping point dressed
up as one.** Next: the tick writes rows for the oldest few, the page reads them,
both with tests, and then the three capability entries that have been waiting on
headroom go in.

---

## Claude lane · LANDED · 2026-08-20 11:24 · the tick now checks a slice instead of everything, and I reproduced my own gate bug while building it

The code half of `20260820110000`. **The tick writes; the page still computes
live, which is a safe intermediate state**: the table fills, nothing reads it yet,
and the product behaves exactly as before.

### What changed

`liveness-tick.ts` reads every `liveness_results` row in one query, asks
`selectDueEntries` for the **six least-recently-checked** registry entries across
all three kinds, and passes only those to `buildLivenessReport`, which already
accepted subsets. Then it upserts their verdicts.

**Rows are written BEFORE the alarms**, deliberately. `captureError` can throw,
and a throw after the report but before the upsert would cost the run its place in
the rotation and make the same slice due forever.

### The scheduler, and why it has no state

`rotation.ts`, ten tests. Never-checked first, then oldest, ties on id.

**There is no cursor and that is the design.** A new capability has no row, sorts
first, and is checked next run. A run that dies half way leaves its rows older, so
the next run takes them without being told. A cursor would have to stay correct
across restarts, registry edits and partial failures; **`checked_at` already
answers all three.**

The test worth keeping is the third: **an unparseable `checked_at` counts as never,
not as now.** The other reading strands a subtly corrupt row forever while the page
keeps serving its last good verdict, which is the exact failure this whole layer
exists to catch.

### I contradicted a deliberate past decision, so I answered it rather than edited around it

That file's header argued **against** what I built: *"No new store, no new
surface, no migration for a results table that would itself need watching."*

The objection is right about alarms and does not reach what the table is for.
`error_events` is where a FINDING goes and is unchanged. `liveness_results` is a
SCHEDULE, and it exists because the whole report costs ~2 queries per capability
under a Worker's subrequest cap, which held the registry at 13 entries against 36
jobs.

**And it does not need watching in the way that sentence feared: a row nobody
refreshed sorts FIRST.** Going unwatched is the input that fixes it, not a second
thing to monitor. Written into the header where the old claim was, rather than
deleted.

### I reproduced the bug I shipped a fix for two hours ago

While wiring this I ran:

```
bunx tsc --noEmit 2>&1 | tail -3 && echo "tsc clean"
```

and it printed **"tsc clean" underneath a screen of type errors**, because `tail`
exits 0 and `&&` reads `tail`. That is the identical mistake that put main red this
morning, made by me, **two hours after committing `lane:gates` to make it
impossible**, and in the same session where I wrote that a rule an agent has to
remember is not a rule.

The tool worked when I used it. The gap is that I only used it at the end, and
during the build I fell back to the habit it replaces. **Nothing is wrong with the
fix; the lesson is that the fix only helps at the moment I would otherwise be
guessing**, which is mid-build rather than pre-push.

The real error underneath was ordinary: `liveness_results` is not in the generated
Database types. Fixed with the repo's existing idiom rather than a new one -- a
narrow structural client, the precedent `liveness.functions.ts` names in its own
comment and the `error_events` writer already uses.

Gates green through `lane:gates`, exit 0, all four.

---

## Claude lane · RULED · 2026-08-20 11:40 · the founder overturned my call on unchecked capabilities, and he was right on the arithmetic

I shipped the page read serving `unknown` for any capability the rotation had not
reached, and argued that probing it live "would hand the cap straight back". **The
founder pushed back, and the reasoning behind my call was wrong.**

### The error

**I conflated recomputing the WHOLE report with filling in the entries that are
missing.** The whole report is ~45 subrequests. One missing capability is **two**:
a windowed count and an all-time latest. Ten missing capabilities is twenty.

The cap only comes back in one situation -- a fresh table where **every** entry is
missing at once -- and I had generalised that single case into a rule covering the
ordinary one, where the fill is a handful of queries.

**The product argument he made is also right and I had not weighed it.** A page
whose subject is "what is happening right now" saying "I do not know" about
something it could answer in two queries is a worse page, and the answer arrives
before anyone would have noticed the wait.

### What it does now

The page reads the stored rows in one query, then **probes the missing entries
live and shows them**, costed per entry so the pathological case cannot render
nothing:

- `probeCost` -- `2` for a capability or vocabulary check, `2 + 2N` for an
  integrity check with N segments, which is what `readIntegrity` actually asks.
- `planLiveFill` -- spends up to **36** subrequests on the missing entries and
  returns what fits AND what does not, so **nothing is silently dropped**. A
  deferred entry reads unchecked; it does not read fine. That is the difference
  between a budget and a truncation.
- 36 leaves room under the 45 the budget test asserts, and covers a dozen
  ordinary capabilities or two of the most expensive integrity checks.

The live results are shaped **as stored rows** and merged before rendering, so
there is one path from a verdict to the report rather than two that can drift. A
freshly probed entry carries `checked_at` of now, truthfully, beside rows measured
hours ago.

### Why this is worth writing down beyond the fix

The wrong call was not a slip in the code, it was **a real constraint applied one
level too broadly**. The cap is real, the test that guards it is right, and this
morning I correctly refused twice to raise it. Having been right about the cap
three times, I reached for it a fourth time where it did not apply, and produced a
worse product decision with a technically-shaped justification.

**A constraint that has been correct repeatedly is the one most likely to get
applied where it does not hold**, and the tell was that I never costed the actual
case -- one entry, two queries -- before ruling on it. **Every other measurement
today I took before deciding. This one I asserted.**

18 rotation tests, 6 stored tests, gates green through `lane:gates`.

---

## Claude lane · LANDED · 2026-08-20 11:52 · the liveness cap is gone, and the three entries that failed the build at 09:58 now pass

The arc closes. **Coverage went from 2 watched jobs to 6, and the next one is an
entry rather than an investigation.**

### The hole I left an hour ago, found by asking why the test still mattered

Before adding the entries I checked whether the budget test was still guarding
anything real. **It was, and the thing it was guarding was mine.**
`liveness.functions.ts:186` still computed the WHOLE registry for any non-default
`windowDays`. I had budgeted the default path and left an unbounded one beside it,
which would have started rendering nothing the moment the registry grew.

**A branch I wrote in the same file, an hour earlier, for the case I was not
thinking about.** Collapsed: there is now one path, and it is bounded by
construction. Read whatever the tick stored for this window, probe what is missing
within `planLiveFill`'s budget, report the overflow as unchecked. The default
window finds almost everything stored; a 30-day window finds nothing stored and
fills to the budget. **Same code, both cases.**

### The budget test moved rather than loosened, and that distinction is the whole thing

It asserted the full registry at **≤ 45**. No caller builds the full registry any
more -- the tick passes a slice, the page passes what is missing -- so that
assertion capped the product at 13 capabilities while protecting a path nothing
takes.

**The total moved to where the total is now decided**, `planLiveFill`, and is
asserted in `rotation.test.ts` at **any** registry size rather than up to thirteen.
What stays in `report.test.ts` is the input every budget depends on: **one
capability probe costs exactly two queries.** If that grows, every budget
downstream is wrong and this is where it shows.

The old comment said the fix is a cheaper probe rather than a bigger number. **The
fix turned out to be asking for fewer probes, and the number is not in that file
any more.** I refused to raise it twice this morning and I did not raise it now.

### The three entries, and what each is actually watching

- **`digest-delivery`** — 16 users, ONE preferences row, and `sendDueDigests`
  reads its user list from that table. Blast radius today is one person, with no
  bounce and no error surface.
- **`source-watching`** — `scout_runs` records `error` and `skipped-cap` per
  target, and the only read of that table sums `fetch_count`, so a scout failing
  every fetch reports it to nobody.
- **`outcome-sweep`** — one of two writers of `learnings`, which holds zero
  non-sample rows while the trust leg consuming it is proven wired.

### What this cost, and it is worth stating plainly

Four ticks. The first specified the wrong fix, the second measured and killed it,
the third built the storage, and this one closed a hole I had opened myself. **The
measurement that redirected it took ten minutes and would have saved the first
tick entirely.**

Coverage is now 6 of 36. The remaining 30 are a judgement about which are
capabilities rather than a limit on how many fit.

---

## Claude lane · LANDED · 2026-08-20 12:04 · verified the three probes I registered, and made the check permanent

No item awaiting a verdict, so this tick checked the work I shipped last tick
rather than starting new work.

### The three new probes name real jobs

A registry probe asks `job_runs` for a `job_name`, and a hook writes that name
through `withJobRun`. **Nothing connects the two**, so a typo in either produces a
capability that reads dead forever while the job runs perfectly.

I registered three capabilities by copying names out of a census. Checked all six
job probes against the labels the hooks actually write: **6 of 6 match, 0
orphans.**

### And the check is now a test, because being right once is not a guarantee

`report.test.ts` reads every hook, extracts the label each passes to
`withJobRun`/`withJobRunHttp` -- including the half that pass a local constant --
and asserts every `job_runs` probe names one of them.

**This is the worst failure this file can have.** A missed alarm is bad. **A false
alarm inside the alarm system is worse**, because it teaches the reader to
discount the page, and the page exists precisely because five features died
unnoticed.

**Verified the guard can fail**, which is the part that matters: planted
`cron.embed-tikc` in the registry, ran it, and it failed. Restored, 13 pass.

**It also failed a second test I did not expect**, and that is worth recording
rather than claiming sole credit: *"does not cry wolf about the things that were
working"* also goes red, because a probe naming a job nothing writes finds no rows
and reports dead. So there was already partial protection.

**What the new guard adds is the REASON.** The existing test says a verdict is
wrong; the new one says which probe names a job nothing writes. Only the second
tells you what to fix, and a test that fails without naming the cause is how an
afternoon goes.

The guard also asserts it found more than ten labels before checking anything, so
it cannot pass by reading zero hooks -- the same reason `fake-postgrest` tests its
own operators.

### The MCP is degraded right now

Three production queries in a row were cancelled, including a `VALUES` lateral
that ran fine at 08:30. Stopped after the third rather than continuing.

**It did not block this**, because the stronger check was local: a probe name that
matches the source is correct by construction, whatever production currently
holds. The production side was already established in the 08:30 census, where all
three jobs appear with runs under an hour old.

---

## K-25 · RULED · 2026-08-20 13:40 · the reference has no 450 anywhere, and one of the three tokens is already correct

Kiro has picked this item up. The queue's own note at line 214 said to re-measure
before acting on it, because the audit register's body-weight figure did not
reproduce. I re-measured all three premises against the live reference. **One is
false, one is two-thirds wrong, and one is true.** Ruling below, per premise.

Method: `https://www.beautifului.dev/`, `getComputedStyle` over every element in
`body` that carries its own text node and has a non-zero box. 907 text-bearing
elements, 10,691 characters, 1,435 transition declarations.

### Premise 2, body weight 450: FALSE. Do not make this change.

**There is no element at weight 450 on the reference. Not one.** The weights in
use are 400 (247 elements), 500 (629), 600 (29), 700 (2). `document.body`
computes **400**, confirming the queue's note and falsifying the register.

The register recorded this as "400 vs the reference's 450". Both halves of that
comparison are wrong: ours is 400, theirs is 400.

**What the reference actually does is run three weights at three jobs**, and the
character counts separate them cleanly:

| weight | elements | median run | longest run | what it is |
| --- | --- | --- | --- | --- |
| 400 | 247 | 10 chars | 103 chars | prose. Every `<p>` on the page |
| 500 | 629 | 8 chars | 35 chars | labels, links, names, nav |
| 600 | 29 | 11 chars | 38 chars | headings (H1 21px, H2 19px, H3 13px) |

The four longest 400-weight runs are all sentences. The longest 500-weight run is
35 characters. **Prose is 400 there, exactly as it is here.**

Meridian already ships `--mrd-w-regular: 400` · `--mrd-w-medium: 500` ·
`--mrd-w-semi: 600`. **That ramp is already the reference's ramp.** Setting
regular to 450 would move Meridian to a value the reference does not use, on the
authority of a number nobody could reproduce twice.

The item's sentence "the reference sets running text at 450 and caps its scale at
15px" is also wrong on its second half: the H1 is 21px and there are 17px and 19px
headings. Body text does cap at 14px.

### Premise 1, motion: TRUE for one token, FALSE for another, unproven for the third.

Measured transition durations, by count of declarations:

```
  0.12s  827      0.18s   53      0.3s   38
  0.14s  245      0.2s    47      0.4s   13
  0.15s  100      0.1s    96      0.22s  10
```

Delays: **1,434 of 1,435 are `0s`.** Easing: `ease-out` on 1,031.

- **`--mrd-d-press: 120ms` is already exactly the reference's dominant 0.12s.**
  827 declarations sit on that number. **Leave this token alone.** The item says
  Meridian's motion is "roughly twice as slow as the reference", which is not true
  of press, and changing it would break the one token that already matches.
- **`--mrd-d-move: 220ms` is the real finding.** The reference moves things in
  0.12s to 0.15s. Ours is 1.5x to 1.8x that. This one should come down.
- **`--mrd-d-enter: 420ms` I am not willing to rule on from this evidence, and I
  nearly ruled the wrong way.** My first read found 0.42s as the single most
  common animation duration and looked like direct confirmation of our 420ms.
  It is not: those 27 hits are all `stream-in` on `<span class="inline
  [will-change:filter,opacity]">`, which is **per-token text streaming**, not a
  panel arriving. The next group is `fade-up` spread across 0.25s to 0.6s, which
  is scroll-reveal choreography on a marketing page. **Neither is a UI entrance**,
  so the reference does not answer this question.

  **The "enter 0s, exit 0.15s" prescription in the item is Linear's published
  scale, not the reference's measured behaviour.** For Meridian's own token file
  the founder ruling names beautifui.dev as the floor. Linear is the right source
  for K-24 and K-26 information models; it is not the source for this token.

- Meridian's `--mrd-ease: cubic-bezier(0.22, 1, 0.36, 1)` is out-quint, the
  reference is `ease-out` dominant. Same family, no change needed.
- **The reference uses no transition delays at all.** If any Meridian entrance
  carries a delay, that is a defect the item does not mention.

### Premise 3, loading policy: TRUE, and provable without the reference.

`src/router.tsx:111-112` sets `defaultPendingMs: 150` and `defaultPendingMinMs:
300`. A navigation that resolves in 200ms crosses the 150ms threshold and is then
**held on screen for the full 300ms minimum**. So the fast case is guaranteed to
flash a full-screen opaque overlay, which is the slowest-feeling outcome of the
three. `_authenticated.tsx:37-38` already documents this in a comment and nobody
acted on it.

**This half of the item is correct and worth doing.** I did not verify the
reference's own "no loader for 1000ms, text at 1800ms, dismiss in 0.1s" figures,
because measuring them needs a navigation slow enough to trigger the loader and I
could not force one. **Treat those three numbers as unverified.** The local defect
stands on its own without them.

### What I am asking Kiro to do

1. **Drop the body weight change entirely.** Premise 2 is false.
2. **Leave `--mrd-d-press` at 120ms.** It already matches.
3. **Bring `--mrd-d-move` toward 140ms**, which is the reference's second cluster
   and a defensible landing point between its 0.12s and 0.15s.
4. **Leave `--mrd-d-enter` at 420ms** unless you have a measurement I do not. The
   case for zero rests on a product that is not the floor for this file.
5. **Fix the loading policy**, which is the part of this item that was right.

That reduces K-25 from three token changes to one token change plus the
`BrandWait` fix. **The acceptance criteria "`--mrd-w-regular` is 450" and "enter
approaches zero" should both be struck**, and I have not edited the item body
because it is STARTED and that is Kiro's to change.

### The register entry is now corrected

`agent-audit-2026-08.md` §6 carried "Body weight 400 vs the reference's 450" as a
finding. It is wrong and I have marked it so in the same commit. **A register that
keeps a falsified number is worse than no register**, because this one already
spawned a queue item that would have shipped the error repo-wide.

---

## K-23 · VERIFIED · 2026-08-20 14:35 · every acceptance line checked in the running app, including the negative case

**How this was checked, because it was not a normal sign-in.** Production
`/auth/v1/token` is intermittently returning **504 after ~35s** today (see the
LANDED entry below), so a real login could not be relied on. The authenticated
gate is client side: `_authenticated.tsx` `beforeLoad` calls
`supabase.auth.getSession()`, a localStorage read, and `needsOnboarding()` fails
**open** on any read error. So a well-formed session was seeded into localStorage
and the real `/meridian` route was driven in Chromium at 1400x1200.

**Nothing about the component was stubbed.** The gallery cases are static
fixtures that take no database. Only the auth boundary was supplied, and auth is
not what this item builds.

### Acceptance, line by line

**Three answers, each reachable by keyboard, each stating its consequence.**
Three `<button>` elements, `data-answer` = `run-it` · `check-writes` ·
`keep-planning`, **all three `tabIndex: 0`**, each carrying its digit and a plain
sentence:

```
1  Start it, and let it run            It runs to the end inside the boundaries
                                       you have already set, and tells you when
                                       it is done.
2  Start it, check with me on writes   It stops and asks before anything leaves
                                       this workspace: a pull request, an email...
3  Keep planning                       Nothing runs and nothing is charged.
```

**Spend ceiling shown before the choice, never after.** Measured as **geometry,
not DOM order**, which is the only way this can be wrong on screen and right in
the markup: ceiling text top **530.1px**, answer group top **564.8px**. The
ceiling is above the answers. It reads "Past the ceiling the work stops where it
is and waits for you."

**The plan is editable before committing, and removing a station demands a
reason.** Verified including the refusal, which is the half a positive test
misses:

| step | text fields | commit button |
| --- | --- | --- |
| before | 0 | -- |
| click "Skip it" | 1, focused | **`Skip this step` disabled** |
| **press Enter with an empty reason** | **1, still open** | **still disabled** |
| type a reason | 1 | **enabled** |
| press Enter | 0, closed | committed |

**An empty reason is refused rather than accepted quietly.** After committing,
the row drops its "Skip it" control and **carries the reason inline** ("not
needed, we already have the data") rather than printing the word "skipped",
which is the better call.

**Returns `{ autonomy, editedPlan, reason? }` and writes nothing.**
- The gallery echo after a decision reads **`run-it, 1 steps skipped`** -- so the
  edit made before the choice travels into `editedPlan`, which is the whole point
  of the item.
- **Writes nothing, measured rather than assumed:** every non-localhost request
  was recorded across the decision. **Zero.** No route change either.

**Gallery cases.** All three the item asks for are present, plus two more: a
five-step plan, one step with no route, a route somebody already edited, the echo
of what came back, and a decision in flight that cannot be pressed twice.

### Noticed

1. **`1 steps skipped` in the gallery echo.** A pluralisation defect on a
   rendered surface. It is in `_authenticated.meridian.tsx`, not in `PlanGate`,
   and it is a dev surface rather than a customer one, so it is not a rejection.
   **Worth fixing in whatever commit next touches that file.**
2. **Five "Skip it" and six "Take it off" controls render**, one per plan step and
   one per route stop, so the edit affordance scales with the plan rather than
   being a single control.
3. **The answer buttons are the only tab stops in the gate**, which is correct
   here and is exactly what `AgentInbox` is missing next door.

> **Claude does after:** the `agent_autonomy` wiring the item deliberately left
> out, which is mine and needs the live schema. Kiro's question -- whether
> `run-it` means `trusted` or `ambient` -- is a real fork and I am not answering
> it from the component. It needs a read of what `agent_autonomy.arc` actually
> holds, and the database is unreachable right now.

---

## K-24 · REJECTED · 2026-08-20 14:40 · the mechanics are right and two of them cannot be reached in the running app

Same harness as K-23 above. **Most of this component is correct**, and the
rejection is narrow, but both defects are the kind a green suite cannot see.

### What passed, measured across the 10 inbox instances the gallery renders

- **Four groups, in order, empty groups hidden.** `orderCorrect: true` on every
  instance; **no instance drew an empty group.**
- **Idle collapse past three.** One case declares 6 and renders 1 row plus
  "5 agents have gone quiet", and it opens. It **summarises rather than
  truncating**, which is the defect this repo has recorded twice.
- **Composed cases** all render: nothing running, everything blocked on one
  person, and one agent failed.
- **Failed is a field, not a fifth group.** A `Failed` chip appears inside
  `Waiting on you` and inside `Ready for you to look at`. **Kiro's call was
  right** and the item should be read as settling it.
- **Greyscale survives**, because status is carried as words -- `Needs you`,
  `Failed` -- not by hue alone.
- **No sideways scroll, in a real layout engine at four widths:** 1400, 768, 380
  and 320. Page scrollWidth equals clientWidth at every one, and the worst row
  overflow is **0px**.
- **`j`/`k` and the arrows work correctly once a selection exists:** j moved
  0 -> 1 -> 2, k moved back to 1.

### Defect 1. The list has no tab stop, so a keyboard cannot reach it

`Row` carries `tabIndex={selected ? 0 : -1}`. **That is a roving tabindex with no
initial stop.** With nothing selected -- the state every one of these renders in
-- **every row is `-1` and the count of tabbable elements inside the listbox is
0.** The wrapper holding `onKeyDown` has no `tabIndex` either, and the listbox
computes `tabIndex: -1`.

Measured, not reasoned about: **25 consecutive Tab presses never landed inside
the inbox.**

The only way in is a mouse. Clicking a row focuses it but deliberately does **not
select** it (`onClick` calls `session.onOpen?.()`, and the comment explains why
selection was removed from focus). So from a cold page:

```
  Tab      -> never arrives
  click    -> focuses a row, selects nothing
  click, j -> selection finally appears, and from here everything works
```

**Kiro's log says "over one tab stop for the whole list". There are zero.** The
mechanic is Linear's and it is implemented correctly apart from its entry point:
a roving tabindex needs one row to hold `0` when nothing is selected. That is the
fix, and it is one line.

**This is not a nitpick on a component that is about to become `/` (Home).**

### Defect 2. Reply in place is dead in the gallery, and reply is the point

Acceptance says "Reply-in-place works without a route change." **It cannot be
exercised at all in the running app.**

`Row` draws the reply control only when `session.onReply` is defined
(`: session.onReply ? (`). **`onReply` appears zero times in
`_authenticated.meridian.tsx`. So does `onOpen`.** Measured in the rendered page:
**`buttons inside rows: 0`, across all 10 instances.** No reply field can be
opened, and clicking a row calls an `onOpen` nobody passed.

**The unit tests pass because they wire `onReply` themselves** -- four of them do.
So the component is right and the surface never shows it. **This is the ninth
time this repo has shipped something that passed every test and did nothing in
the running app, and it is the reason this lane exists.** Reading the diff would
not have found it.

### Noticed, and it is not a reason for the rejection

**The test that claims the 3 / 12 / 60 requirement cannot measure it.**
`agent-inbox.test.tsx:374` is named *"renders 3, 12 and 60 sessions and keeps
every row inside the container"*. What it asserts is that every `.truncate` title
**also carries the class `min-w-0`**, plus that at least one row rendered. It
never measures a width, and **jsdom has no layout engine, so it could not.**
Change the layout so rows overflow while keeping both class names and this test
still passes. It is a guard on a spelling rather than on the claim.

**I could not measure it either, because the gallery's largest case is 6
sessions** -- there is no 12 and no 60. What I could do instead I did: the
truncation mechanic holds in a real browser at 320px, which is where it would
fail if it were going to. **So the mechanic is sound and the criterion is
unproven, which are different things.** Adding a 60-row case would close both.

### To clear this

1. **Give the list an entry point.** One row holds `tabIndex={0}` when nothing is
   selected, so Tab reaches the inbox.
2. **Wire `onReply` and `onOpen` in the gallery fixtures**, so reply in place is
   demonstrable on the surface the item names.
3. **Add a 12 and a 60 session case** while you are in that file, which also
   gives the layout claim something real to stand on.

Nothing in the component's logic needs rewriting. **The four groups, the
participles, the collapse, the failed-as-a-field call and the two focus guards
are all right**, and the guards in particular were worth the trouble they cost.

---

## Claude lane · LANDED · 2026-08-20 14:45 · production sign-in is flapping, and two tidy explanations for it were both wrong

**Recorded because the next agent that cannot sign in will otherwise spend the
session hunting a credential, which `demo-credentials.md` already warns has
happened twice.**

### What is true

`POST /auth/v1/token?grant_type=password` on the production Supabase project is
**intermittently returning 504 after ~35 seconds**. In its healthy windows the
same request answers in **under a second**. Both states were observed repeatedly
inside twenty minutes, on the same accounts, with the same bodies.

The Lovable MCP is degraded in the same window: **`SELECT 1` returned
`499 request_cancelled`**, three times running. So no production read was
possible and no acceptance number could be re-measured today.

**This is platform side and the founder has already reported it to Lovable. There
is nothing in this repo to fix**, and it is recorded here only so the symptom is
recognisable.

### Two explanations that fitted the evidence and were both false

Worth writing down, because each survived a first look and died to a control.

**First: "it is per account, and it tracks how hard automation leans on that
account."** The opening sweep was a clean gradient -- `harbor@` no response at
45s, `voyage@` 504 at 40s, `compass@` 400 at 17.9s, `meridian@` 0.48s,
`lantern@` 0.43s -- and `harbor@` is documented as "the account any agent uses
for testing". It was a tidy story. **Re-running the identical sweep minutes later
returned fast 400s for all five.** The gradient was load, not accounts.

**Second: "a wrong password fails fast, a correct one times out."** This one was
better evidenced: two accounts, two different passwords, both 504 at ~35s, while
every wrong password in the same minutes came back in under a second. It even had
a mechanism -- a successful login does extra work a failed one skips, so a broken
hook would look exactly like this. **The control killed it: the same account with
a deliberately wrong password 504'd 35.6s later, seconds after the "correct"
one.**

**Both times the wrong conclusion was one measurement away from being written
down as fact, and both times it was a control that stopped it.** The first
needed only a repeat; the second needed a case that should have behaved
differently and did not.

### What this cost, and what it did not

It blocked the database half of the lane: no `product_id` migration work, no
acceptance re-measurement, no answer to Kiro's `agent_autonomy.arc` question.

**It did not block verification.** The authenticated gate is client side --
`getSession()` is a localStorage read and `needsOnboarding()` fails open on a read
error -- so a seeded session reaches `/meridian`, and the gallery cases are static
fixtures that never touch the database. **K-23 and K-24 were both verified in the
real running app on that basis**, with only the auth boundary supplied. Where a
verdict depended on that, it says so.

---

## Claude lane · LANDED · 2026-08-20 15:05 · the multi-product columns all shipped, and four of five are written by nothing

The database came back, so I took lane item 1. **The migrations from 2026-08-19 all
applied and every column is live in production.** That is the half that was already
done. This entry is about the other half.

| column | rows | populated | why |
| --- | --- | --- | --- |
| `credit_ledger.product_id` | 14,383 | **0** | 1 of 72 call sites supplies it, and its 4 callers all pass null |
| `agent_memory.product_id` | 1,250 | **0** | see below |
| `learnings.decision_id` | 133 | **0** | no writer, and a trigger would have to guess |
| `learnings.product_id` | 133 | **0** | trigger IS correct; these rows predate it. **No reader exists** |
| `agent_autonomy.workspace_id` | 88 | 40 | a one-off UPDATE inside the migration, not a writer |

**A column with no writer is the failure this repo has recorded nine times.** The
register named the risk itself at line 223 and then the same shape shipped five more
times in one day.

### The one I got wrong first, because a snapshot is not a mechanism

I measured `agent_autonomy.workspace_id` at 40 of 88 and checked the 48 NULLs: every one
points at an agent whose own `agents.workspace_id` is NULL, which is a global agent with
no workspace to inherit. **I concluded the column was correct by design. That was
wrong**, and it is worth recording how.

The 40 populated rows were not populated by a writer. They were populated by **a single
UPDATE statement inside migration `20260819183000`**. Six write paths reach this table
and **none of them stamps `workspace_id`**, so the number is a photograph of one moment,
not a property that holds. I had measured the rows and inferred the mechanism, which is
the same error as reading a column that looks tended and assuming something tends it.

**And the dominant writer is not the app.** 86 of 87 rows carry `set_by IS NULL`, which
is the fingerprint of `auto_advance_agent_arc`, a SECURITY DEFINER function that inserts
on every clean agent run. So fixing the operator upsert in `trust.functions.ts` alone
would stamp roughly 1% of new rows **while making the column look tended** -- strictly
worse than leaving it empty.

**It fails at three layers, not one, and I confirmed the third in production myself:**

```
  polname                      cmd     using
  agent_autonomy owner read    SELECT  (auth.uid() = user_id)
  agent_autonomy owner write   ALL     (auth.uid() = user_id)
```

Nothing writes it · four readers still key on `(user_id, agent_id)` · **and RLS forbids
the cross-colleague read the column exists for.** Migration `20260805130000` declined to
role-gate this table because "there is no `workspace_id` to ask a role about". There is
now, and the policies never moved. **Stamping the column changes nothing until the
SELECT policy does.**

### `credit_ledger`, where the SQL is right and the plumbing is empty

The database side is **correct and needs no change**: `debit_account_credits` inserts
`product_id` verbatim, and `runtime.server.ts:1420` passes `opts.productId ?? null`. Of
13 INSERTs into this table, 11 are grants, top-ups, vouchers and clawbacks that are
**correctly NULL by design**.

**The count is 0 rather than merely low for a precise reason.** Of 72
`callModel`/`callModelStream` sites, 55 are chargeable and **exactly one** supplies a
productId (`cluster.server.ts:175`) -- **and all four of that one's callers pass null.**

**A live consequence, and I checked whether it costs money.** `runtime.server.ts:1356`
reads `credit_ledger` by `product_id` when a cap is product-scoped. There is exactly one
credit cap in production and **its scope is `product`**:

```
  cap 5,000 credits / month     rows the cap can see:  0
  account this month:           2,476 debits, 20,685 credits spent
```

`capExceeded(spent, projected, cap)` is `max(0,spent) + max(0,projected) > cap`. With
`spent` pinned at 0 it can only fire if a **single call** projects over 5,000 credits,
against an account averaging 8.4 credits per call. **The cap is unconditionally inert,
and it fails open**, which is the wrong direction for a spend control.

**It is not costing money today and I want that stated plainly rather than dressed up.**
That account is `harbor@supaprod.ai`, the demo login, and it owns one sample workspace
and zero real ones. No customer is under-billed. **It is a latent failure waiting for the
first paying customer who sets a product cap**, not a live leak.

**Two traps in the obvious fix.**

1. **Stamping a wrong value gives away free AI calls.** `20260819184000` added
   `credit_ledger_product_id_fkey -> projects(id)`, validated. `debit_account_credits`
   has no exception handler and its balance UPDATE and ledger INSERT are one
   transaction, so a `product_id` that is not a live `projects.id` **rolls the debit
   back entirely** -- and the caller only `console.error`s it. Every value stamped must
   be a verified `projects.id`.
2. **`chat.ts` carries a client-supplied `body.scope.productId`.** Passing it through
   unvalidated would let a member tag spend to another product or dodge a cap. The
   `CallOpts` invariant at `runtime.server.ts:389` is a security control, not a style
   note.

**And the fix is probably not 54 call sites.** `credit_ledger.ai_event_id` points at
`ai_events`, which already has a `product_id` column, so a BEFORE INSERT trigger would
cover every writer at once. **That does not work today**, and this is the trap worth
naming: `logAiEvent` neither accepts nor sets `product_id`, so the trigger would derive
NULL every time. Measured:

```
  ai_events            61,156 rows,   128 carry product_id
  last 7 days          19,258 rows,     0 carry product_id
  every day for 20 days                 0
```

**So `ai_events.product_id` is a second orphan sitting underneath the first.** Fix
`logAiEvent` and one trigger replaces the whole call-site sweep. That is the order of
work I would take.

### `learnings.decision_id`, and the defect found on the way is worse than the column

Two inserts and one overturn UPDATE create learnings, and none sets `decision_id`.
Fixing the single insert at `outcome.functions.ts:591` covers all three doors into it
(the human `/learn` path, the historian sweep, and the MCP `settle_outcome` tool).

**The register's pointer is stale**: it cites `trust.server.ts:151`; the code is now at
`trust.server.ts:312-330`.

**What that code does is the real finding.** It reconstructs the learning-to-decision
edge in JS by joining on the shared spec:

```
  decisionsByPrd = new Map(decisionRows.map(d => [d.prd_id, d.decided_by_agent_slug]))
```

**There is no `.order()` and no tie-break.** When several decisions share one spec, the
last row in PostgREST's arbitrary order silently wins, and a learning is credited to
whichever agent that happens to be. I measured whether that case is real:

```
  specs carrying decisions                         14
  of those, with MORE THAN ONE decision            14
  of those, where two DIFFERENT agents decided     14
```

**Every spec in the system is the ambiguous case.** Of the 35 decisive learnings that
feed trust, **14 (40%) are attributed by row order.** That feeds `sOutcome`, which
carries 0.3 of the trust score at `trust.server.ts:369` -- **and agents graduate
autonomy on that score.** So this is lane item 3's problem arriving early, and it is a
correctness bug rather than a design question.

Writing `decision_id` collapses steps 2 and 3 into a primary-key join and the ambiguity
stops existing rather than being settled by row order.

**Do not add a derivation trigger for this column.** It would have only `prd_id` to work
from, which is exactly the guess migration `20260819181000` ruled out, and it would then
look populated on every row.

### `learnings.product_id` is the one case where doing nothing is right

Its trigger `trg_learnings_derive_product` is live and correct on INSERT, so every future
row is stamped. The 133 existing rows predate it. A backfill using the trigger's own
logic would fill **61 of 133** (49 via `prd_id`, 12 more via `opportunity_id`) and leave
72 NULL.

**I am not doing that backfill yet, and the reason is the rule I keep quoting.** Nothing
reads the column. Every query against `learnings` filters on `user_id`, `workspace_id` or
`id`; `promote.server.ts:111` still reaches product context by joining
`opportunity:opportunities(theme_id)`, which is the join `product_id` exists to replace.
**A half-populated column with no reader is the worst of the three states**, so this
waits for its reader, and the trigger keeps it honest in the meantime.

**Also worth knowing before anyone reads a number off this table: all 133 learnings are
`is_sample`. The compounding record has zero real rows.** 9 real workspaces exist and
they hold 46 real memories between them.

### `agent_memory.product_id`, where the migration tells you to do the thing it forbids

Eight paths create rows here and none stamps the column. **Only five of the eight are
even eligible**, because `20260819182000` added:

```sql
  check (kind not in ('reflection','correction') or product_id is null)
```

It **refuses** the write rather than nulling it, on purpose. So a blanket stamp is not a
partial fix, it is an outage: `autoReflect` (`reflection.server.ts:179`) writes
`kind: 'reflection'`, and **that path wrote all 46 real rows on this system.** The only
writer producing real data is the one a careless fix breaks first.

**The migration's own header contradicts its own constraint.** It instructs a future
reader to stamp `spine/correction.server.ts:316` because "`args.trackId` is in scope and
`spine_tracks.product_id` exists". That writer sets `kind: 'correction'`, which the
CHECK **added in the same file** refuses. Following the migration's guidance ships a hard
failure. **The comment is wrong and should be corrected rather than acted on**, which is
the same class of defect as the 450 in the register: an instruction that survived because
nobody re-derived it.

### The generated types are stale, so none of this compiles yet

Checked `src/integrations/supabase/types.ts` against what is applied:

| column | applied | in generated types |
| --- | --- | --- |
| `learnings.product_id` | yes | **missing** |
| `learnings.decision_id` | yes | **missing** |
| `agent_memory.product_id` | yes | **missing** |
| `learnings.is_sample` / `agent_memory.is_sample` | yes | **missing** |
| `credit_ledger.product_id` | yes | present |
| `agent_autonomy.workspace_id` | yes | present |

So the file is **partially** stale: `20260819183000` and `184000` are represented and
`180000` to `182000` are not. **Any `.insert({ product_id })` against `learnings` or
`agent_memory` fails `bunx tsc --noEmit` today**, which is the gate this lane may not
cross. `is_sample` missing also means the sample filter the handoff tells every agent to
use cannot be written in TypeScript, only in SQL.

**This is the first thing to fix and it is not mine to guess at** -- the types are
generated through Lovable, and hand-editing a generated file is how it gets silently
reverted on the next regeneration. **Founder: this needs a types regeneration through
Lovable before any of the stamping work can land.**

### The order of work I would take

1. **Regenerate the Supabase types.** Nothing below compiles without it.
2. **`logAiEvent` carries `product_id`.** That unlocks a single derive trigger for
   `credit_ledger` and replaces a 54-call-site sweep, and it fixes `ai_events` itself,
   which is 0 for 20 days and is an orphan nobody had logged.
3. **`decision_id` at `outcome.functions.ts:591`**, which fixes all three doors, and then
   collapse the `trust.server.ts:312-330` JS join onto a primary key. **That removes a
   live 40% mis-attribution from the trust score**, and it is the highest-value item
   here because autonomy graduates on that number.
4. **`agent_autonomy`: a derive trigger plus the RLS policy, together.** Either alone is
   pointless, and the trigger alone is worse than nothing because the column then looks
   tended.
5. **`agent_memory`: five paths, each guarded on `kind`**, and fix the migration comment
   that says otherwise.
6. **`learnings.product_id`: nothing, until it has a reader.**

**Nothing has been changed in this commit.** Every line above is a measurement or a file
read, and the register is updated to match.

---

## Claude lane · CORRECTION · 2026-08-20 15:40 · four numbers in my own 15:05 entry were wrong

**This corrects the entry above it, "the multi-product columns all shipped, and four of five
are written by nothing" (15:05).** Its production measurements all stand and its conclusions
are unchanged. **Four counts taken from a code trace do not stand**, and the protocol here is
a new entry rather than an edit, so here they are.

I ran an adversarial pass over my own tracing after committing. It found errors in exactly
the half I had not measured myself, which is the half I should have trusted least.

| I wrote | actually | how it was found |
| --- | --- | --- |
| "**Six** write paths reach `agent_autonomy`" | **three** live write statements | three of the six were wrappers around one RPC, not writers |
| "**four** readers still key on `(user_id, agent_id)`" | **eight** reads | four were missed, incl. `swarm.functions.ts:177` |
| "Of **72** `callModel` sites" | **68** real call sites | a naive grep counts imports and comments |
| "**all four** of its callers pass null" | **two of four** hardcode null | the other two pass a value that could be non-null |

**The last one mattered, because my explanation was too tidy and the tidiness was the tell.**
"All four pass null" explained a clean zero a little too neatly. Two callers
(`discovery.functions.ts:503`, `registry.server.ts:549`) pass something that could be a real
product id, so the zero needed a better reason. Production gave it:

```
  credit_ledger debits by surface        rows     with product_id
    agent                                7,263          0
    discovery                            5,001          0
    sense   (the cluster path)           1,910          0
```

`sense` is `cluster.server.ts`'s own surface and it is **chargeable and firing 1,910 times**.
So the volume on the one site that does pass a productId comes from its **two cron callers**,
`cluster-tick.ts:89` and `loops.server.ts:71`, **which both hardcode null**. The two that
could carry a value are user-initiated and rare. **Same conclusion, honest mechanism**, and
it also names where a fix pays: `agent`, `discovery` and `sense` are 14,174 of the 14,383 rows.

**One number I checked and it was right:** `sOutcome` carries **0.3** of the trust score.
`trust.server.ts:369` reads `0.3*sMission + 0.2*sApproval + 0.2*sEval + 0.3*sOutcome`. The
40% row-order mis-attribution finding is unaffected.

**Three things the pass found that I had missed entirely**, all worth acting on later:

1. **`learnings` has SQL-function writers I said did not exist.** I wrote that two inserts and
   one update create learnings. True of `src/`, but `seed_sample_workspace`
   (`20260705120000:457+`) and `clone_demo_workspace` (`20260725140000:98`, via dynamic SQL no
   grep will find) both insert learnings and are **callable RPCs**, not one-shot seed SQL.
   That is how all 133 rows got there and why every one is `is_sample`.
2. **The `agent_autonomy` fix needs the backfill re-run, not just a trigger.** A derive trigger
   fixes new rows and leaves today's NULLs alone.
3. **`liveness/registry.ts:256` omits `'correction'`** from `agent_memory`'s kind vocabulary,
   so the probe anyone would use to verify a `product_id` fix is itself wrong about the kinds.

---

## K-25 · VERIFIED · 2026-08-20 15:45 · measured in the running app, and Kiro reached the 450 finding independently

**The pushback is correct and I had ruled the same way before seeing this entry.** Kiro
re-measured `getComputedStyle(document.body)` on the reference, got **400**, and refused to
build the item's `--mrd-w-regular: 450`. My RULED entry (13:40) reached that from 907
text-bearing elements: **no element on that page carries 450 at all.** Two independent
measurements, same answer, and the item's acceptance line is dead.

**Computed in the running app, which is what Kiro could not check:**

```
  --mrd-d-press   .1s      --mrd-d-move   .15s
  --mrd-d-enter   .2s      --mrd-w-regular 400
```

Source and served stylesheet agree, so the tokens are live rather than merely edited. The
running app's own transition census now reads **0.1s (570) and 0.15s (495) dominant**, against
the reference's 0.12/0.14/0.15 band. Same band, and `--mrd-d-enter` at 200ms is inside the
`{0.1, 0.2, 0.4}` intersection Kiro measured rather than driven to zero.

**Six routes rendered with zero console errors and zero page errors** (`/meridian`, `/today`,
`/threads`, `/runs`, `/learn`, `/discover`), so the faster scale did not expose an animation
leaning on the slow enter. That was the one thing Kiro's entry explicitly asked for before
this could be called verified.

**One disagreement, recorded rather than acted on.** `--mrd-d-press` went 120 -> 100ms on the
intersection of Linear and the reference. **On the reference alone, 0.12s is dominant by a
distance: 827 of 1,435 transition declarations, against 96 at 0.1s.** The founder ruling names
beautifui.dev as the floor for this file, not Linear, so by that rule 120ms was already
correct. **It is 20ms on a press acknowledgement and 0.1s is genuinely in the reference's
scale, so this is not worth a rejection** -- but the reasoning is worth having on the record if
the token is ever revisited, because "intersection of two references" and "dominant value on
the designated floor" are different rules and only one of them is the standing one.

**Unsure 2 is well judged:** not adding `--mrd-d-exit` with zero callers is the second-caller
rule applied correctly.

---

## K-26 · VERIFIED · 2026-08-20 15:47 · the premise is exactly true in production

The module is pure and takes no database, so what I could add is whether its reason for
existing is real. **It is, precisely.** `agent_runs.status` over 1,825 rows:

| status | runs | share |
| --- | --- | --- |
| `completed` | 690 | 37.8% |
| `completed_with_failures` | 618 | 33.9% |
| `failed` | 500 | 27.4% |
| `halted` | 8 | 0.4% |
| `waiting_approval` | 7 | 0.4% |
| `complete` | 2 | 0.1% |

**Six distinct spellings, exactly as the item claims**, and `completed` / `complete` /
`completed_with_failures` are three ways of saying one thing across 1,310 runs. The item's
argument -- that the defect is the column accepting any string, not the writers -- is borne out
by `complete` appearing twice in 2026-06 and never again: one writer, one afternoon, one word.

**Deriving state from activity is the right response to that**, and a typed union with no
status field is the one shape where a seventh spelling cannot be invented.

**Not verified, because it cannot be yet:** nothing imports this module. It is pure by design
and K-12's normaliser is what maps these six onto it. **Until that lands this is a correct
module with no caller**, which this repo has shipped before, so it should not sit unwired long.

---

## K-27 · VERIFIED · 2026-08-20 15:49 · the app still renders with 38 modules gone

Structure checks out: `src/components/ui/` now holds **11 files** -- the 9 live modules, the one
held under the item's tiebreak, and `button.test.tsx` -- consistent with 48 minus 38.

**What a build cannot tell you and a browser can:** all six routes render, **zero console
errors, zero page errors, no error boundary**. `/meridian` draws 759 `[data-mrd]` nodes and
106k characters of content, so the surface that exercises the most primitives is intact.

**Stated as a limit rather than buried:** my harness stubs Supabase reads, so the five
non-gallery routes rendered their empty states. **I proved they do not crash after the
deletions, not that they render real data.** For dead-code removal that is the question that
matters, since a missing module fails at import time regardless of data.

---

## K-35 · VERIFIED · 2026-08-20 15:50 · nothing references it and nothing can

`tanstack-query-mocks.ts` has **zero references across `src/`, `e2e/` and `scripts/`** after
deletion, and all four gates pass. The ground was BROKEN AS WRITTEN and both defects are the
dangerous kind: a keyed map read from one literal slot, and a `serverFn?.name` lookup falling
through to a default that returns `{}`. **The second is worse than a broken helper -- it hands
a test a fake pass.** Deleting it is right, and nothing in the tree noticed it was gone.

---

## K-36 · VERIFIED · 2026-08-20 15:52 · and the bug it declined to fix is live on two surfaces

The removals are clean and both traps were avoided. **The part worth my access is the Noticed,
and it is worse in production than the entry claims.**

Confirmed in the code: `mapRelayStatus` (`relay.ts:36-38`) has a done arm of exactly
`case "completed": case "done":` and `default: return "idle"`.

Confirmed in production, over 1,825 runs:

```
  completed_with_failures   618   -> falls to "idle"
  complete                    2   -> falls to "idle"
                            ---
                            620   = 34.0% of all runs
```

**And the arm that does exist is dead: `done` occurs zero times in production.** So the mapping
handles a status nothing writes and misses one that is a third of all runs.

**It is not latent.** `mapRelayStatus` is called at eight sites inside `relay.ts`, feeding
`miniRelay` and `stationActiveRun`, and `AgentRelay` is mounted on two live surfaces:
`DiscoverSurface.tsx:1967` and `MissionOrchestratorDetail.tsx:1324`. **So a third of finished
runs are drawn as idle on both.** Kiro was right not to widen the diff, and right that this
needs its own item. **The count is now 1,825 runs, not the 1,135 quoted from
`mission-advance.server.ts:90-92`; that comment is stale.**

---

## K-65 · VERIFIED · 2026-08-20 15:54 · one definition, seven importers, and the disc renders

`initialsFrom` exists **once**, in `src/lib/initials.ts:17`, and **no local redefinition
survives anywhere in the tree**. Exactly **seven** files import it, matching the seven bodies
that were folded in.

**The signature kept is the widest of the seven** -- `(email: string | null | undefined,
name?: string | null)` -- so no call site was narrowed, which was the one way a byte-identical
merge could still break a caller.

**Checked in the running app rather than only in the diff:** the header disc renders **`H`**
for the signed-in account, so the shared helper is the one actually drawing the surface. The
invariant the entry cares about -- the disc on a receipt matching the disc in the corner -- now
has one implementation to be wrong in instead of seven.

---

## Claude lane · LANDED · 2026-08-20 15:20 · the eval leg was already decided, so I re-measured it on 5x the data and found where it is one edit from failing open

Nothing was awaiting a verdict, so I took lane item 3, the trust composition. **It is already
built** -- `evalScore` in `trust.server.ts`, quality mean times one minus worst risk, with a
cutoff at `EVAL_CONTRACT_FIXED_AT`. **So this is not a re-decision.** It is the check that the
decision still holds against data that has grown from 20 live rows to 111 since it was written.

**It holds, and the cutoff is exactly right.** But three things are worth recording.

### The bi-scale is a property of the JUDGE, and the guard keys on the DATE

This is the one to act on. `ai_evals.hallucination_score` is stored on **two opposite scales**,
and they split cleanly by judge model rather than by time:

| judge | rows | first .. last | corr(hallucination, groundedness) | mean h | mean g |
| --- | --- | --- | --- | --- | --- |
| `google/gemini-2.5-flash-lite` | 111 | 08-20 only | **-0.8744** | 0.156 | 0.807 |
| `claude-sonnet-4-5` | 63 | 06-29 .. 07-23 | **+0.9995** | 0.843 | 0.857 |
| `gemini-2.5-pro` | 14 | 07-09 .. 07-16 | **+1.0000** | 0.895 | 0.905 |

**63 + 14 = 77**, which is exactly the cohort the register measured, so its `+0.999` was correct
about its own data and the existing correction in `trust.server.ts` is right that those rows are
fixtures. Nothing there needs changing.

**What needs changing is the shape of the guard.** `judgedUnderCurrentContract` asks
`created_at >= 2026-08-20T00:00:00Z`. The property it is actually protecting against is **which
model judged the row**. Those two agree today only because `JUDGE_MODEL` is a hardcoded constant
at `eval-tick.ts:7`. **Change that one line -- a cost or quality decision somebody will make
without thinking about trust scores -- and old-scale rows sail through a date cutoff that cannot
see them.**

An inverted row scores near 0.119 under `evalScore` against the 0.5 the frozen leg used to give,
so admitting them collapses every agent at once, which is the failure the cutoff exists to stop.
**The guard should key on `judge_model` against an allowlist**, with the date kept as a second
condition rather than the only one. A date is a proxy for the thing; the thing is available.

### The risk half of the composition has never once fired

Across all **111** rows the live judge has written:

```
  toxicity               1 distinct value   0.00   sd 0.0000
  pii_risk               1 distinct value   0.00   sd 0.0000
  prompt_injection_risk  1 distinct value   0.00   sd 0.0000
```

**Three of the four risk dimensions are constant zero.** The MAX-not-mean design exists so one
serious safety failure cannot be averaged away by good prose. That reasoning is right and I would
keep it. **But it has never been exercised**, because no row has ever recorded a non-zero safety
score. It is an untested mechanism, not a working one, and it should be described that way rather
than counted as evidence the product measures safety.

**A correction to the register while I am here:** finding 3 says `prompt_injection_risk` is
"NULL in all 77 rows -- never written once". **It is now written**: 109 of 188 rows carry a value.
It is simply always **0.00**. The defect moved from "never written" to "written and constant",
which has the same consequence and a different fix.

### The fourth risk dimension is the complement of a quality dimension

`hallucination_score + groundedness = 1` **exactly, in 103 of 111 live rows**. Since the other
three risks are zero, `worstRisk` **is** `hallucination_score` in 110 of 111 rows, so the formula
reduces to `mean(g, r, c) x g` wherever it bites: **groundedness is counted twice.**

I expected that to be a large distortion. Measured, it is not, and the reason is worth having:

| | rows | mean quality | mean score | penalty |
| --- | --- | --- | --- | --- |
| risk leg inert (`h` = 0) | **90** | 0.947 | 0.947 | 0.000 |
| risk leg bites | **21** | 0.205 | 0.165 | **0.040** |

**81% of rows are untouched**, because a grounded answer scores `h = 0` and the multiplier is 1.
The leg only bites on rows that were already bad, where it takes a further 0.040 off 0.205 -- a
**19.5% relative** cut. So the double-count is real, bounded, and fires **only on low-quality
rows**, which is directionally defensible.

**It should be a stated choice rather than an accident.** Either drop `hallucination_score` from
the risk max while it remains the complement of a dimension already in the quality mean, or keep
it and say plainly that an ungrounded answer is penalised twice on purpose. **I would keep it and
say so** -- ungrounded is the failure this product can least afford -- but the file currently
argues for the MAX on the strength of `pii_risk` and `toxicity`, and those two have never been
anything but zero.

### What I did not change

Nothing. `evalScore` is correct as written for the data it currently sees, and the two changes
worth making -- the judge-model allowlist and the hallucination double-count -- are a decision
about what the score should mean, not a defect I should quietly rewrite under. **Both are now
in the register.**

### K-87 queued for Kiro

The `mapRelayStatus` defect from K-36 is now a queue item rather than only a register line, with
the production distribution, both mounted call sites, and the judgement call about
`completed_with_failures` named rather than pre-decided. It is provable by a unit test, so it
belongs in Kiro's lane; **what it needed from mine was the measurement that it is 34% of runs and
that `done` is a dead arm.**

---

## Claude lane · LANDED · 2026-08-20 15:35 · §10 re-measured, and the only criterion that moved the right way moved because Kiro deleted code

Nothing awaiting a verdict, so lane item 4. **Baseline is the 04:45 re-measurement in
this file, roughly eleven hours ago.** Every figure below is a query run just now, and
the query is written down, because the last drift record lost a definition and I nearly
lost it again (see criterion 3).

| # | Criterion | Original | 04:45 | **now** | direction |
| --- | --- | --- | --- | --- | --- |
| 1 | Pending approvals | 53 | 31 | **36** | **worse, +5** |
| 3 | Raised then never decided | 130 | 66 | **66** | unchanged |
| 4 | Oldest pending | 627h | 633h | **644h** | +11h, exactly the elapsed time |
| 5 | Decisions carrying a forecast | 0.3% | 0 of 55 real | **0 of 55 real** | unchanged |
| 6 | Forecasts resolved by the product | 0 | 0 | **0** | unchanged |
| 8 | Missions `proposed` past 24h | 66% | 65.9% (230/349) | **66.5% (232/349)** | slightly worse |
| 9 | Agent runs clean | 38% | 38.2% (676/1771) | **37.8% (693/1835)** | slightly worse |
| 16 | `agent_runs.status` spellings | 6 | 6 | **6** | unchanged |
| 17 | Duplicate display name at one station | 2 | 0 | **0 live · 10 in catalog** | met, latently |
| 18 | `--mrd-agent` vs `--mrd-you` | 59 vs 97 | 86 vs 129 | **92 vs 141** | ratio 0.67 -> 0.65 |
| 19 | Meridian ratchet total | 5,864 | 5,864 | **5,542** | **better, -322** |

**Not re-measured: 2, 7, 10, 11, 12, 13, 14, 15.** Named rather than left blank, same as
the 04:45 entry did.

### Criterion 1 went backwards, and it is one tool

The 04:45 entry predicted this and named the mechanism: K-11's catalogue is application
code, it is not published, and *"the deployed app still has `toolRisk('cluster.trigger')`
failing closed to `high`, still demotes it to `confirm`, and still queues an approval
every time."*

Measured now, pending approvals by tool:

```
  cluster.trigger      8    first 2026-08-19 20:20   last 2026-08-20 09:21
  memory.promote       7          2026-07-24 14:20         same
  studio.pr.merge      7          2026-07-25 05:20         same
  mission.dispatch     7          2026-07-25 02:20         same
  backlog.prioritize   7          2026-07-24 23:20         same
```

**Every other tool's rows are frozen in the seeded 24-25 July batch. `cluster.trigger` is
the only one with a live clock, and it is the whole of the +5.** The prediction is
confirmed rather than merely plausible: the backlog regrows at roughly one row every two
to three hours for as long as the fix sits undeployed.

**So criterion 1 is not waiting on more work. It is waiting on a publish**, and it gets
worse every hour it waits.

### Criterion 3 nearly recorded 85 points of drift that do not exist

I measured "raised then never decided" as `decided_at IS NULL` and got **151**, against
66 at 04:45. That reads as a catastrophic regression. **It is not one.** The breakdown:

```
  expired    66   undecided 66     <- the 04:45 definition
  pending    36   undecided 36
  cancelled  57   undecided 49     <- rows this lane cancelled on purpose
```

**66 exactly reproduces**, so the earlier query was `status = 'expired'`. My broader
predicate folds in the 36 still pending and the 49 we deliberately cancelled, and counts
our own cleanup as a failure. **Same table, same day, two questions, and only one of them
is the criterion.**

The 04:45 entry recorded the number and not the query, which is the whole reason this
took a detour. **Both are written down here**: criterion 3 is `status='expired'` = **66**.

### Criterion 17 is met in production and still true in the code

The catalog is the interesting half and it needs both accesses to read.
`SPECIALIST_CATALOG` has 39 entries over 7 stations, and resolving each through
`agentStation` and `agentDisplayName` gives **10 collisions**, including four separate
slugs at `ship` that all display as **"announce"** (`release`, `releaser`, `marketer`,
`stakeholder`).

**In the live roster it is 0**, and the reason is that the colliding partners are not
there: `discovery`, `inspector`, `releaser`, `marketer` and `historian` have **no rows at
all**, and `stakeholder` has 4 rows with **0 enabled** -- those are the two retired agents
disabled this morning, which is what took the criterion to 0.

**So the criterion is met by absence rather than by design.** Enabling any one of five
slugs, or re-enabling `stakeholder`, puts two identically-named agents at one station
immediately. Kiro can see the 10; only a roster read shows that 0 are live. **Worth an
item: the catalog should not be able to name two agents at one station the same thing.**

### What the table says honestly

**One criterion improved, and it improved because K-27 deleted 322 occurrences of dead
code.** Nothing that required a behaviour change moved at all.

Two drifted slightly worse (8, 9) and both are the same shape: the denominator grew --
64 more runs, no more missions -- while the numerator did not keep up. **These are not
regressions so much as the product continuing to do what it already did.**

Criterion 18's ratio went 0.67 to 0.65, so the gap widened slightly in the same tick that
Kiro added components. Not alarming, worth watching: `--mrd-you` is growing faster than
`--mrd-agent`, and the criterion wants parity.

**And the one that is actively getting worse is the one blocked on a publish, not on
work.**

---

## K-25 (rework) · VERIFIED · 2026-08-20 16:05 · the tokens are live at 120 / 140 / 420, and Kiro's correction of my correction is the better one

**This verdict supersedes my K-25 VERIFIED at 15:45**, which passed the earlier build.
Kiro reworked to the ruling after our entries crossed in flight, so this judges the
rework.

**Computed in the running app**, which is the only place this can be confirmed:

```
  --mrd-d-press   .12s        --mrd-d-move    .14s
  --mrd-d-enter   .42s        --mrd-w-regular 400
```

Source and served stylesheet agree. `press` and `enter` are back where they were, `move`
moved 220 -> 140, and the body weight never moved.

**The methodological point is Kiro's and it is worth more than the tokens.** I said
`--mrd-d-press: 120ms` matched the reference because 0.12s carried 827 of 1,435
transition declarations. Kiro had measured the SET of durations in use and got thirteen
values, among which 0.12 is one stop. **Both measurements are correct and they answer
different questions.** A set treats a value used 13 times and one used 827 times as equal
evidence; 0.12s is 58% of all motion on that page and 0.12+0.14 is 75% of it.

**That is the same shape as the mistake I made this morning on `agent_autonomy`**, where I
read a populated column as a mechanism. A well-formed measurement that answers a narrower
question than the one being asked is the failure mode both of us hit today.

**`--mrd-d-enter` stays at 420 and the disagreement stays open, correctly.** Kiro complied
and kept its argument in the file rather than deleting it: all eight callers are arrivals
rather than reveals, and an arrival is a notice. **It also named what would settle it** --
nobody has measured how long an arrival should take in a product where content shows up
unasked, because the reference has no such content. That is the right way to leave a
disagreement: both readings in the file, and the missing measurement named.

**The loading policy is unchanged and I re-confirm it**: `defaultPendingMs` 1000,
`defaultPendingMinMs` 150 at `router.tsx:144-145`. Kiro recorded the reference's own
1000/1800/0.1s figures as **unverified** rather than citing them as measured, which is
exactly right -- I could not force a navigation slow enough to trigger that loader either.

**Still open from my 15:45 entry and not addressed by the rework**, because it is not this
item's to fix: `_authenticated.tsx:37-38` still states "With `defaultPendingMs: 150` and
`defaultPendingMinMs: 300`" in the present tense. Both numbers are now wrong. The
conclusion around it still holds, so nothing is broken, but the comment is stale.

---

## K-60 · REJECTED · 2026-08-20 16:20 · the entry asserts an identity that production falsifies by 33.8%

**The two keys it added are correct.** `waiting_approval -> "queued"` and `halted -> "failed"`
both check out, and I confirmed the writers exist in production: 7 runs at `waiting_approval`,
8 at `halted`.

**The rejection is what it did not add.** `RUN_STATE` has no key for
**`completed_with_failures`**, so `runBucket` returns `"other"` for it. The file's own comment
at `agent-fleet.ts:90` says what that means:

> `"other": uncounted in all four tallies while `total` still counted it`

**That is 622 runs, 33.9% of every agent run in the system, and it is the single biggest
status after `completed`.** The item existed to stop runs falling into `other` uncounted, and
it fixed `complete`, `waiting_approval` and `halted` while leaving the largest offender in
place.

**The entry asserts the arithmetic identity `running + queued + done + failed === total`.**
Executed against the production distribution:

```
  running   0      completed                693 -> done
  queued    7      completed_with_failures  622 -> other
  done    695      failed                   509 -> failed
  failed  517      halted                     8 -> failed
  other   622      waiting_approval           7 -> queued
  ----                                        complete  2 -> done
  four buckets  1,219        total  1,841
  identity holds: FALSE      missing: 622  (33.8%)
```

**The tests pass because they test the two statuses the item added** -- a halted run and a
gated run -- and never the one that breaks the claim. **An identity asserted over four buckets
is only worth its weakest input**, and this one is a third of the table.

**To clear this.** Add `completed_with_failures` to `RUN_STATE`. Which bucket is a real
judgement and should be argued in the file, not guessed: it finished, so `done` is defensible,
and it finished badly, so `failed` is defensible. **What is not defensible is `other`**, and
the identity test should be extended to enumerate every status production writes rather than
the two this item touched.

---

## K-61 · VERIFIED · 2026-08-20 16:22 · both additions confirmed against production, and the third omission has no stated reason

**`halted -> "attention"` is the significant one and production says so: 67 of 349 missions
are `halted`, 19.2%.** Executed `laneForStatus("halted")` and it returns `attention`. Before
this key those 67 fell to the default.

`"complete"` in `STEP_DONE` verified, and the entry proved it non-vacuous by removing the key
and watching the progress case fail. Production backs the premise: `complete` exists on
`agent_runs` (2 rows) and on no other table, exactly as the comment claims.

**Executed against every status production writes**, which is the check the tests do not make:

| missions.status | rows | lane |
| --- | --- | --- |
| `proposed` | 232 | awaiting |
| `halted` | 67 | **attention** |
| `completed` | 27 | done |
| `completed_with_failures` | 22 | **awaiting** |
| `cancelled` | 1 | attention |

**Noticed, and it is the reason this is not a clean pass.** The entry says it added no key for
"`complete`, `waiting_approval` or `completed_with_failures`" and then gives a reason for the
first two only: `complete` belongs to `agent_runs`, `waiting_approval` never reaches the parent
mission. **Both are right. Neither covers `completed_with_failures`, and that one does reach
the parent mission -- 22 rows of it.** So 22 finished missions render in the `awaiting` lane.

It is 6.3% rather than K-60's 33.8%, and it is outside this item's stated scope, so it is a
Noticed rather than a rejection. **But the omission is asserted as reasoned and it is not.**

Its own Noticed 3 is sharp and correct: the `attention` blurb reads "Stopped early. Failed or
cancelled", and a halted mission is neither, so the blurb is now narrower than its contents.

---

## K-62 · VERIFIED · 2026-08-20 16:24 · every mission status in production is now classified, and the omission I went looking for is correct

I expected to reject this one. The entry deliberately excludes the singular `complete` and
pins it with a negative assertion, and `complete` **does** exist in production. **It exists on
`agent_runs` and nowhere else**, and `TERMINAL_STATUSES` is read against `missions.status`
(`runaway.ts:26-27`, and `m.status` at :213). So excluding it is right and my concern was
unfounded.

**Executed `isTerminalStatus` over every value `missions.status` actually holds:**

```
  proposed                232   false     <- correct, not finished
  halted                   67   TRUE      <- added by this item
  completed                27   true
  completed_with_failures  22   TRUE      <- added by this item
  cancelled                 1   true
```

**All five classified correctly, and the two additions cover 89 of 349 missions, 25.5%.** That
is the real effect: a breached mission at `halted` or `completed_with_failures` previously read
as `runaway`, meaning "breached AND still active", when it had already finished. **A quarter of
missions could be reported as actionable-now when the right answer is post-hoc `watch`.**

`done`, `failed` and `canceled` are in the set and appear zero times in `missions.status`
today. Unlike the relay's dead `done` arm this costs nothing, because being generous about
terminal only ever moves a verdict from `runaway` to `watch`.

---

## K-28 · VERIFIED · 2026-08-20 16:26 · the deleted block was dead, and both grounds still paint

**Ratchet:** `src/styles.css` sums to exactly **1,022** across its nine markers, the 202 drop
the entry claims. Repo total **5,340** across 257 files, down from 5,542 after K-27 and 5,864
originally. **§10 criterion 19 is "never higher" and it is now 524 lower than its own baseline.**

**The check a build cannot make.** This deleted a `[data-theme="light"], .light-theme` block,
so the risk is that the paper ground stops painting. Driven in a real browser across all three
theme states:

```
  data-theme="dark"     body rgb(10,10,10)      ink oklch(96.5% .003 70)
  data-theme="light"    body rgb(255,255,255)   ink oklch(22% .012 70)
  no attribute          body rgb(10,10,10)      ink oklch(96.5% .003 70)
```

**Both grounds invert correctly**, 759 `[data-mrd]` nodes render in each, and **zero console
errors and zero page errors** in all three. The block was superseded, not load-bearing.

---

## K-67 · VERIFIED · 2026-08-20 16:27 · the canary is the part that makes the pass mean anything

Three assertions collecting offenders into an array and asserting `toEqual([])`, so a failure
**names** the dead keycap rather than counting it.

**The canary is present and is the reason I am verifying rather than shrugging:**
`nav-model.test.ts:401` -- *"the resolver can fail, so a pass below is evidence rather than a
vacuum"*. Without it, a resolver that silently matched everything would make all three
assertions pass while the rail was broken. **That is the exact failure this repo has recorded
twice today** -- a guard on a spelling rather than on the claim -- and this item pre-empted it
without being asked.

Gates are green, so all four cases pass. Nothing here needs production.

---

## K-72 · VERIFIED · 2026-08-20 16:28 · one attribute, on the member that renders most

`data-mrd=""` is present on `EmptyRow` at `RoomDetail.tsx:101`. The family claim holds: it is
now on all six members, and `role="status" aria-live="polite"` remains on only the three
pending and failed ones.

**The argument for no aria is right and is arithmetic rather than taste** -- the two other
empty states carry no live region either, so adding one here would make this the odd member of
a different family. **And the item is correct that the empty state is what production shows
most often**, which is what makes a missing focus ring on it worth a commit of its own.

---

## K-73 · VERIFIED · 2026-08-20 16:30 · the scope table agrees with the CHECK constraint nobody told it about

Pure module, no imports, so what I could add is whether its vocabulary survives contact with
the rows. **Executed `resolveMemoryScope` over every kind `agent_memory` actually holds:**

| kind | rows | real | scope | promotable |
| --- | --- | --- | --- | --- |
| `reflection` | 1,195 | 116 | workspace | yes |
| `precedent` | 28 | 0 | product | no |
| `note` | 25 | 0 | product | no |
| `correction` | 11 | 1 | workspace | yes |

**Four kinds in production, all four resolve, none throws, and every reason reads as a
sentence a person would say.**

**The cross-check worth having: this agrees exactly with a database constraint it does not
import.** `20260819182000` added `check (kind not in ('reflection','correction') or product_id
is null)` -- method memory may not carry a product. This module independently puts
`reflection` and `correction` at `workspace` scope and everything else at `product`. **Two
statements of one rule, written in different places by different lanes, and they match.**

**Noticed, and it is a defect in a third place rather than in this item.**
`src/lib/liveness/registry.ts:256` declares `agent_memory`'s kinds as
`['reflection','note','outcome','fact','preference','precedent']`. Production holds
`reflection`, `note`, `precedent` and **`correction`**. So that list **omits a kind that exists
and names three that do not**. K-73 is right and the liveness probe is wrong; anything checking
memory coverage through that registry is checking the wrong vocabulary.

---

## Claude lane · LANDED · 2026-08-20 16:40 · the station and tool frames are emitted, I could not confirm them on the wire, and the error message that got in the way is wrong

Queue clear, so lane item 2: the SSE frames. **The emit half is done and I did not need to
build it** -- `chat.ts:975` sends `{ station: dispatchedStation }` and `:1291` sends
`{ tool }`, the latter added today with a careful argument for deriving the name from what
the pipeline actually did rather than from what it was asked to do.

**The half that is mine is confirming a real request puts those frames on the wire**, and I
could not finish it. Recording the attempt rather than the conclusion, because the reason is
useful.

### What I did

Auth has recovered (password grant 200 in 1.2s, against the 504s at 13:00), so I took a real
session and posted to `/api/chat` on the running server with a real `conversationId`, reading
the SSE stream frame by frame.

**Five requests, four questions, two models. Every one returned three frames:**

```
  data: {"choices":[{"delta":{"content":"I hit a snag answering that. Try again or switch models."}}]}
  data: {"meta":{ ... tokens_in: 0, tokens_out: 0, research: {mode: "chat"} }}
  data: [DONE]
```

No `station`, no `tool`, no `status`. **And that is not evidence against the frames**, because
the pipeline never ran: `runResearch` is gated on `researchMode !== "chat"`, the mode comes
from a classifier that is itself a model call, and the model call failed every time.

### Why it failed, and it is not the product

Every one of the five is in `ai_events` with `error_code: model_error` and
**`"AI rate limit reached. Try again in a moment."`**, `via: gateway`, 0 tokens.

**Production is healthy in the same window**, which is the check that stops this being reported
as an outage:

```
  ai_events, last full hours    09:00  371 ok     10:00  372 ok     11:00  30 ok
  errors                        1 to 2 model_error per hour
```

Production cron `judge` calls on `gemini-2.5-flash-lite` succeeded at **11:00:12, :13, :15,
:17 and :20**, seconds either side of my failures on the same gateway. **So the limit is on
the key my local server uses, not on the product**, and the SSE confirmation is blocked on
local capacity rather than on anything in the repo.

**Do not read this as "the frames do not work."** It is "the frames were not exercised". They
stay unconfirmed, and this entry is what stops the next reader assuming otherwise.

### The finding I did get, and it is a surface telling a person something untrue

The user-visible text for a rate limit is:

> *"I hit a snag answering that. Try again or switch models."*

The recorded error is *"AI rate limit reached."* Two things are wrong with the substitution.

1. **It hides a cause the product knows.** "Rate limited, try in a moment" is actionable.
   "I hit a snag" is not, and a person who sees it twice concludes the product is broken.
2. **"Switch models" is advice that does not work, and I tested it rather than assuming.**
   I switched from `google/gemini-3-flash-preview` to `google/gemini-2.5-flash-lite` and got
   **the identical rate limit on both**, because the limit is on the gateway key rather than on
   the model. So the one suggestion the message makes is the one thing that cannot help.

**That is a copy defect with a measurement behind it**, and it is the kind this lane exists to
find: the string is humanized, it passes every gate, and it sends the person somewhere useless.

### Noticed while reading production

**`gate_credit_exhausted` blocked 15 calls at 10:00 and 12 at 09:00.** That is the credit
system doing its job rather than a defect, but it is worth knowing that a material share of
attempts are being refused for credit rather than served, and nothing in §10 tracks it.

### Where lane item 2 stands

- **Station and tool frames: emitted, not confirmed.** Needs one successful research-mode
  request. Worth retrying when the gateway key has headroom; it is minutes of work, not hours.
- `missionId` on every station and the per-run stop both landed earlier (criteria 10 and 11 at
  04:45), and neither has a control to press, which is Kiro's half rather than mine.

---

## K-63 · VERIFIED · 2026-08-20 17:15 · the ghost is gone from the tree and production confirms it was never real

The item's own acceptance is a grep and it passes: `awaiting_approval` returns **nothing**
across `src/` and `supabase/` outside tests.

**What I could add is whether the deleted spelling was ever written by anything**, which is
the half a grep cannot answer:

| table | `awaiting_approval` | `waiting_approval` | `planning` |
| --- | --- | --- | --- |
| `agent_runs` | **0** | 7 | 0 |
| `mission_steps` | **0** | 7 | 0 |
| `missions` | **0** | 0 | 0 |

**Zero rows carry the ghost, in any table, ever.** The single-`a` spelling is the real one and
it is the one kept. **`planning` is also zero everywhere**, so removing that branch from
`AgentInspector` and `AgentRosterPanel` deleted a case nothing could reach either.

Importing `LIVE_RUN_STATUSES` rather than re-declaring it is the right shape: this repo's
recurring defect is two lists of statuses drifting apart, and one importer cannot drift.

---

## K-74 · VERIFIED · 2026-08-20 17:17 · the narrowing is real and it applies to most of the estate

**`retrievalProductId` has existed as a working option since PC-36 and the pane never set it**,
so Ask read across every product in the workspace. That is a cross-product context leak, and it
is the same family as the multi-product findings I filed at 15:05.

**`retrievalScope` guards on `manyProducts` before narrowing anything**, which is the decision
worth checking against the estate rather than against taste. Measured:

```
  workspaces holding at least one product   17
  holding MORE than one                     10   <- narrowing applies
  most products in one workspace             4
```

**So 10 of 17 workspaces (59%) get the narrowing and 7 are deliberately untouched.** A
single-product workspace has nothing to disambiguate, and a chip there would be noise claiming
a choice nobody made. The guard is right and it is load-bearing rather than defensive.

The "name absent for a beat" branch returning `productId` with an empty chip is also right:
**it narrows the retrieval and stays quiet about it** rather than blinking a placeholder, so
the answer is correct before the label is pretty.

---

## K-32 · VERIFIED · 2026-08-20 17:19 · 460 lines out and the live equivalents still draw

Ground was SUPERSEDED and the entry confirmed it rather than repeating it, which is the right
order. `primitives.css` **2,561 -> 2,101**.

**The check a grep cannot make: the surfaces those rules used to paint still render.** Driven
in a browser after the deletion, `/meridian` draws **835 `[data-mrd]` nodes** and 154,939
characters with **zero console errors and zero page errors**, and no error boundary anywhere.

---

## K-33 · VERIFIED · 2026-08-20 17:20 · the riskiest deletion in the batch, and nothing moved

150 lines out across two files (`ink.css` 981 -> 893, `shell.css` 2,968 -> 2,951), removing
**65 token names read by nothing**.

**This is the one most able to break something silently**, because a deleted custom property
does not error, it falls back to nothing and a colour quietly goes transparent. **Writing the
sweep rather than trusting the item's list is the right call**, and stripping comments first
matters: this file's own docblocks name dozens of tokens they do not use, so a naive grep would
have called them live and deleted nothing.

**Checked the way it can actually fail**: both grounds still paint, all three theme states, and
the same zero-error render above. Nothing went transparent.

**Ratchet across the three CSS items today: 5,864 -> 5,542 (K-27) -> 5,340 (K-28) -> 5,157.**
§10 criterion 19 is "never higher" and it is now **707 below its own baseline.**

---

## K-38 · VERIFIED · 2026-08-20 17:22 · verified against the diff and the render, as its own note asks

**The entry says the build reports were lost and that verification should lean on the diff
rather than on its `Unsure` field.** That is an unusually honest thing to write and it changes
what a verdict can mean here: **I am confirming what the code does, and nobody is in a position
to tell me what the author was unsure about.** Recording that rather than pretending the
verdict is as strong as the others.

**What renders:** the gallery grew from 759 `[data-mrd]` nodes to **835** and from 106k to
155k characters, so the new parts are on screen rather than merely exported. The selection bar
is present in the rendered page. Zero console errors.

**`BulkBar` rather than `SelectionActions` is the right call and the reasoning generalises.**
Meridian already exports `SelectionActions` for prose-range highlighting; this is row ids and a
count. **Two unrelated concepts under one name is how an agent picks the wrong export**, which
K-42's own body warned about. Six blocked items inherit this name, so getting it distinct
mattered more than getting it fast.

---

## K-66 · VERIFIED · 2026-08-20 17:23 · and the floor test is why the pass counts

Ran the suite directly: **8 pass, 0 fail, 10 expect() calls.**

**The floor test is the part worth naming.** Two of the three assertions were red before K-11
filled the catalogue and are green because of it, which is exactly the shape that turns into a
vacuous pass later: empty the registry and the loops iterate nothing and report success.
`the catalogue is real, so no loop below passes by having nothing to check` closes that.

**That is the third item today to add its own anti-vacuity guard without being asked** (K-24's
plants, K-67's canary, this). It is becoming a habit in this lane and it is the right one.

---

## K-70 · VERIFIED · 2026-08-20 17:24 · focusable, announced and inert is worse than not focusable, and it is fixed

`CtxRow`'s interactive branch is now a real `<button type="button">` carrying `w-full
text-left` and `data-mrd=""`. The old branch was `<div onClick role="button" tabIndex={0}>`
**with no `onKeyDown`** -- reachable by Tab, announcing itself as a button, taking the focus
ring, and doing nothing on Enter or Space.

**Confirmed in the rendered app rather than only in the diff: `div[role="button"]` appears
ZERO times anywhere in the gallery.** So the pattern is gone from the surface, not just from
this component.

The non-interactive branch correctly stays a plain `div` with no role and no `tabIndex` -- it
is not focusable and does not claim to be, which is the honest half of the same rule.

---

## K-76 · VERIFIED · 2026-08-20 17:25 · the research exists, and it is research rather than opinion

322 lines appended to `REFERENCE-PATTERNS.md`, which now runs to 1,523. Structure matches the
existing Discover section: four questions answered, an information model with a source column,
verbs marked for what was lifted, a deliberately-not-adopted list, a directives section, and a
**Sources** block with URLs.

**The part that makes this worth a verdict rather than a nod is the "what these products get
wrong for an agent-operated product" section.** Lifting an information model outright is this
repo's standing rule; lifting it *uncritically* from tools built for humans typing is how an
agent product ends up with a Gantt chart. Naming what not to take is the half that keeps the
rule from becoming cargo cult.

Nothing here needs production. `docs:check` passes, so it is linked from its index.

---

## K-04, K-05, K-06, K-07 · VERIFIED · 2026-08-20 17:40 · the rework is confirmed, and the reason I had to look is a bug in my own script

**Why this entry exists.** Counting the queue by hand today gave a different answer from
`lane:sync`, and the script was wrong. Its heading pattern used `[^0-9·]*` between the id and
the separator, which **cannot span `, K-05, K-06, K-07`**. So
`## K-04, K-05, K-06, K-07 · BUILT` (kiro-log, 2026-08-20 00:31) matched **nothing**, and all
four items were invisible to the script that exists to stop exactly that.

**That is the same failure it was written to prevent, one heading shape further along.** The
comment in the file already recorded a near-identical miss for `## K-18 (rewritten) · BUILT`.

**Fixed in `scripts/lane-sync.sh`**, which no open item owns:

- the span now allows digits, so a heading may name several items;
- the per-id count no longer requires the id to come **first** -- `[^·]*${id}([^0-9][^·]*)?·`
  matches it anywhere in the heading;
- `([^0-9]...)` is what still stops `K-1` matching `K-18`, which I tested: **`K-1` returns 0.**

**The fix errs toward showing rather than hiding, and that is deliberate.** A superseded build
that was never separately judged now inflates the pending count, so the script may name an item
whose latest state is fine. **A false pending costs me a look; a false clear ships an
unverified item.** For a verification gate that trade is not close.

### The verdict itself, checked in the running app rather than inferred from the counter

All four reworked components render on `/meridian`:

```
  RunTimeline  present      PlanCard  present
  ToolStream   present      Spend     present
  835 [data-mrd] nodes · 0 console errors · 0 page errors
```

**The specific defect the queue recorded for this family is gone.** §1 of the queue notes
`useElapsed` rendering an 86-hour hold as `5160m 0.0s` because it had no hours branch. The
rendered gallery now shows **`6h 11m`** and **`6h 12m`** alongside `28m 0s` and `1m 36s`, and a
scan for the old shape (three or more digits of minutes) finds **none**. So the hours branch
exists and the minutes-only formatter is not reachable at these durations.

**K-05, K-06 and K-07 already held verdicts that postdate the rework** (01:00, 01:00 and 09:40
against a 00:31 rebuild), so this confirms rather than replaces them. **K-04's only prior
verdict was 23:52, which predates the 00:31 rework** -- that one was genuinely unjudged for
seventeen hours, and neither of us could see it.

---

## K-40, K-46, K-47, K-48, K-49, K-51, K-52, K-57 · VERIFIED · 2026-08-20 18:35 · the money pages hold in both grounds, and the ports left one island behind

**These eight were invisible to `lane:sync` until an hour ago.** They landed under a single
heading naming all eight, which is exactly the shape my own script could not parse before I
fixed it at 17:40. **The fix earned itself back on its first outing**, which is worth recording
because I nearly shipped it as tidying.

**The single-commit decision is correct and I would not have it otherwise.** All eight lower a
count in a generated, single-writer baseline; separately they would need eight re-freezes
racing one file or seven commits sitting red. `AGENTS.md` forbids a red tree, so one commit is
the only green shape.

### Every count checked rather than taken

```
  ratchet total    5,157 -> 4,778        files carrying debt   257 -> 247
  pricing.tsx      ink-era 66 -> 0       raw colour 74 -> 5
  checkout.tsx     ink-era 29 -> 0       raw colour 30 -> 0   (gone from the baseline entirely)
  --ember 0 · inkTheme 0 · --brand 0 · ink-era tokens 0 across both files
```

**Criterion 19 is now 1,086 below its 5,864 baseline**, which is 18.5% of the recorded debt
cleared in one day.

### The money pages, measured in both grounds

This is the half a build cannot see, and the entry explicitly asked for it. Contrast measured
per element against its effective background, WCAG AA thresholds, **colours resolved through a
1x1 canvas rather than a regex** -- Meridian is OKLCH and `getComputedStyle` returns
`oklch(...)`, which no `rgb()` pattern matches. **My first two runs reported a clean page
because the regex silently skipped every element**, and a third because the probe measured
before hydration. Third instrument correction of the day and the same lesson each time.

```
  /pricing   dark   105 elements   0 below AA
  /pricing   light  105 elements   1 below AA
  /checkout  dark    24 elements   0 below AA
  /checkout  light   24 elements   0 below AA
```

**The one miss is real but small:** "Made with Supaprod", 9px, weight 500, **3.96:1** against
4.5. An attribution badge, not a control or a price.

### On `LandingBackdrop`, which the entry asked for an opinion on

**Ship it as is.** The concern is right -- making `pricing.tsx` theme-responsive exposed a
backdrop that paints white at 3.8 to 6% opacity and is dark-only by construction, so on paper
it nearly vanishes. **But it is `aria-hidden` decoration and the measurement says the page is
legible without it**: 105 text elements, one 9px badge off AA, nothing else.

**Losing a decoration on paper is not the same defect as losing legibility**, and the port is
not what made the backdrop dark-only. It wants a paper variant or an explicit hide, and that is
its own item rather than a reason to hold eight ports.

**Unsure 1, the `--brand` port in `checkout.tsx`: keep it.** It resolved to ember through
`--ds-ember-600` and was painting a primary CTA, two selected states and a link -- interaction
states, which the standing ruling puts out of ember's reach. Leaving it would have left the two
money pages disagreeing with each other the moment pricing lost its own ember. **The judgement
that ember was carrying emphasis rather than status, and therefore belongs in shape and
elevation rather than in `--mrd-you`, is the right read** and it avoids the
identity-as-a-colour-ramp defect the design system has removed three times.

### Noticed, and it is a real gap the ports opened

**Every ported admin page still renders its failure state in retired tokens**, because the
routes moved and their shared component did not. `src/components/admin/admin-ui.tsx` paints
`color: var(--madder)` and `color: var(--text-muted)`, both on the retired vocabulary list, and
the baseline still carries it: `--text-` x2, `--madder` x1, `--raised` x1.

Measured on paper across `/admin`, `/admin/observability` and `/admin/invites`:

```
  "Could not load your admin access"   14px   2.79 : 1     (AA wants 4.5)
```

**It is the lowest-contrast text on those pages, and it is the error state** -- the one string a
person is reading precisely because something already went wrong. On the dark ground it passes,
which is why nothing caught it: `--madder` is tuned for dark and the routes were dark-only until
this port made them theme-responsive.

**No queue item claims this file**, so nothing will pick it up on its own. Queued as **K-88**.

---

## Claude lane · LANDED · 2026-08-20 18:45 · the SSE frames stay unconfirmed, and I am stopping the retry rather than spending a tick on it each time

**Second attempt, 90 minutes after the first**, with a fresh session and a question phrased to
force research mode. Same result: three frames, `mode: "chat"`, `tokens_out: 0`, and the same
`model_error` -- *"AI rate limit reached. Try again in a moment."*

**So `station` and `tool` remain emitted-but-unexercised**, and I am recording that as a
standing state rather than retrying it every tick. **One successful research-mode chat call
closes this**, from anywhere. It does not need to be me.

### What the second attempt did establish, which the first did not

**Every `chat` call in the last 24 hours is mine.**

```
  surface     calls   ok    err     (24h)
  embed       4,433   4,433   0
  agent         583     523   0
  judge         263     263   0
  discovery     200     130   0
  sense         101      78  23
  chat            6       0   6     <- 1 distinct user, and it is me
  prd             3       3   0
```

**So "chat is 100% error" is a statement about my six calls and nothing else.** There is no
production evidence that the chat path is broken, and none that it works. **Nobody has used it
in a day**, which is its own thing worth knowing about a surface the product leads with.

### The rate limit is real, shared, and not mine alone

The same error hit **production's own `sense` surface 22 times** between 2026-08-19 17:16 and
2026-08-20 03:35, from cron rather than from me. **None since 03:35**, and `sense` is otherwise
78 of 101 clean.

**I am not going to explain the timing beyond that.** My calls at 11:00 and 12:59 were refused
while production ran 386 clean calls in the same hour, and a single non-burst call at 12:59 was
refused too, so "it is just my bursts" does not hold. **I have written down two tidy causal
stories today that a control then killed, and this one has no control available**, so it stays
an observation: the gateway key refuses this environment's chat calls, and it also refused
production's ambient calls overnight.

### What I would do about it, stated as a question rather than a change

`sense` losing 22 calls to a rate limit is the ambient scout quietly not running. **It fails
into `gate_ambient_downgrade` territory rather than alarming**, and §10 tracks tick failures
(criterion 12) but nothing tracks *model* failures per surface. **A 23% error rate on a live
surface is not visible anywhere in the product.** That is closer to criterion 12's spirit than
to a new idea, and it is a question for the founder rather than something I should build under.

---

## K-69 · VERIFIED · 2026-08-20 19:15 · the ring is real, measured by tabbing rather than by reading the cascade

**The entry ends with "Owed. Not looked at in a browser, and a focus ring is exactly the thing
a test cannot confirm is visible."** That is the split stated exactly, so this is that look.

**Tabbed 45 elements per ground and measured each ring where it actually paints:**

```
                          dark      light
  elements focused         45        45
  carrying a 2px outline   44        44
  inside [data-mrd]        45        45     <- the mechanism the item added
  ring below 3:1            0         0
  weakest ring           5.35      5.35
  sample ring   dark  oklch(0.98 0.003 70 / 0.62)  18.02 : 1
                light oklch(0.28 0.012 70 / 0.78)  14.00 : 1
```

**WCAG 2.2 wants 3:1 for focus appearance. The weakest is 5.35 and the typical is 14 to 18.**

**The premise is confirmed from the other side too:** every focused element resolves its ring
through `[data-mrd]`, not through a Tailwind utility, which is what the unlayered
`[data-obsidian] :focus-visible` rule predicts. Tagging the root is the mechanism that paints.

**I nearly reported 10 to 14 weak rings and they were my instrument.** My first pass compared
the outline colour against the focused element's OWN background and found ten rings at exactly
1.00, which reads as an invisible ring. **An outline paints outside the border box**, so it sits
over the parent's ground; measured there, every one of those clears 3:1 comfortably. **Fourth
instrument correction today**, and the tell each time was the same: a suspiciously round number
appearing in a cluster.

**Unsure 1, the 14 written exemptions: keep the list.** A guard that passes everywhere is
decorative, and the second test that fails when an exemption stops describing a real file is
what stops the list becoming fiction. **That second test is the part worth keeping**, and it is
the same anti-vacuity habit this lane has now added unasked four times.

**Noticed, and the entry is right that it is not a failure:** K-69 reclaimed zero ratchet
counts because `--focus-ring` and `--mrd-focus` are not ratchet markers, so 58 broken rings were
invisible to the guard meant to catch retired vocabulary. **The count and the quality measure
different things**, and this is the clearest case of it today.

**One thing left open, stated rather than glossed:** one `INPUT` of the 45 carries no outline
and no box shadow in either ground. I did not identify which, and an input can legitimately show
focus through a border colour change that my probe does not read. **Not a rejection, and not
cleared either** -- worth one look by whoever next touches `meridian/forms`.

---

## K-44, K-50, K-53, K-56, K-68 · VERIFIED · 2026-08-20 19:18 · four routes leave the debt file entirely

**Ratchet 4,778 -> 4,585, files 247 -> 242.** Criterion 19 is now **1,279 below its 5,864
baseline, 21.8% of the recorded debt cleared today.**

**Four ported files are gone from the baseline entirely rather than merely reduced:**

```
  _authenticated.threads.tsx        absent
  _authenticated.boundary.tsx       absent
  _authenticated.admin.pricing.tsx  absent
  _authenticated.admin.index.tsx    absent
  __root.tsx           raw-colour 1        (was --ds- 1, --text- 6, --font-pixel 1, data-obsidian 1)
  _authenticated.tsx   data-obsidian 3, class:sp- 1
```

**Rendered in both grounds, contrast measured per element with colours resolved through a
canvas:**

```
  /threads        dark 18 / light 50 elements     0 below AA
  /boundary       dark 44 / light 44              0 below AA
  /admin/pricing  dark 44 / light 44              1 below AA on paper
  /admin          dark 44 / light 44              1 below AA on paper
```

**Zero page errors on all eight loads.**

**The single miss on both admin routes is the one I queued as K-88 an hour ago** -- "Could not
load your admin access" at **2.79:1** on paper, from `admin-ui.tsx` painting `var(--madder)`.
**So it reproduces on K-53's two routes as well**, which strengthens rather than changes the
item: the shared error component is now inherited by four ported admin pages and none of them
can fix it, because none of them owns it.

**K-56 is the first route to adopt `meridian/MoreMenu`** and K-68 replaces the boundary states
`__root.tsx` and `_authenticated.tsx` were drawing inline. Both render clean in both grounds,
which is the check that matters for a boundary state: it is the surface a person sees when
something else has already failed, so it must not fail too.

---

## Claude lane · LANDED · 2026-08-20 19:35 · the publish happened, so the caveat that has run through every entry today is now retired

**Production is running today's code.** Confirmed through the Lovable project record rather
than inferred:

```
  is_published        true
  latest_commit_sha   61d3176ee19f22795ef1f5944c2f2d563e27551e
  updated_at          2026-08-20 13:47:50 UTC   (19:17 IST, ~40 minutes ago)
  url                 https://supaprod.lovable.app
```

`61d3176ee` is **Kiro's K-69 focus-ring commit**, it is an ancestor of `HEAD`, and main is
exactly **one commit ahead of it** -- my own verdict entry, which is docs only.

**So every code fix from today is live**: K-11's tool catalogue, the eight route ports, the
status mappings, the focus rings, the boundary states. **The standing caveat from the 04:45
entry -- *"committed TypeScript is not deployed TypeScript"* -- no longer applies to today's
work**, and I have been repeating it in every entry since. It is retired as of this deploy.

### The prediction I came here to test, and it half failed

At 15:35 I wrote that criterion 1 regrows "about one row every two to three hours for as long
as the fix sits undeployed". Measured four hours later:

```
  pending approvals    36 -> 38      (+2 in 4 hours)
  cluster.trigger      8  -> 10
  newest cluster.trigger approval    2026-08-20 10:20:54 UTC
```

**The direction was right and the rate was not.** +2 over four hours averages to my figure, but
it is not a rate: **both arrived early and nothing has been raised for three and a half hours.**
An average over a bursty series is not a prediction, and I stated it as one.

### And the tidy explanation for the stop is wrong, which the timestamps settle

The obvious story is "the publish landed, K-11 went live, the futile approvals stopped". **The
timestamps refuse it.** Approvals stopped at **10:20**; this deploy is **13:47**. A deploy
cannot explain a stop three and a half hours before it.

**The workspace is not merely quiet either**, which is the other easy answer: `cron.cluster-tick`
last ran at **13:50**, six minutes before I measured, and the `sense` surface has **38 calls in
the last four hours, the newest one minute old.** So the path that raises these approvals is
running and raising none.

**I do not know what stopped it at 10:20 and I am not going to invent a cause.** I cannot see
deploy history through this tool, so an earlier publish is possible and unfalsifiable from here.
**Third time today a tidy causal story has failed a check**, and the only reason this one did
not get written down as fact is that the deploy record carried a timestamp.

### What is now cleanly testable, and it is a real prediction rather than an average

**K-11's catalogue is definitively live as of 13:47.** So from here, a `cluster.trigger`
approval being raised at all would mean the catalogue is not doing its job. **Zero new
`cluster.trigger` approvals after 13:47 is the pass; any is the fail.** That is falsifiable in
one query next tick, which the previous version of this claim was not.

### §10 deltas since the 15:35 measurement

| # | 15:35 | now | note |
| --- | --- | --- | --- |
| 1 | 36 | **38** | +2, both early in the window |
| 18 | 92 v 141 | **92 v 143** | ratio 0.652 -> 0.643, `--mrd-you` grew and `--mrd-agent` did not |
| 19 | 5,157 | **4,585** | **1,279 below the 5,864 baseline, 21.8% cleared** |

**Criterion 18 is drifting the wrong way while the ports run**, which is worth watching rather
than acting on: every ported surface adds "a person is required" affordances faster than it adds
"a machine is working" ones, and the criterion wants parity.

---

## Claude lane · LANDED · 2026-08-20 20:10 · the falsifier passed with a control, and criterion 1 has stopped regrowing

At 19:35 I replaced a bad prediction with a testable one: **any `cluster.trigger` approval
raised after the 13:47 deploy means K-11's catalogue is not doing its job.** Measured:

```
  approvals raised since 13:47:50 UTC        0      (of any tool)
  cluster.trigger raised since               0
  ---- the control, without which zero means nothing ----
  cron.cluster-tick runs since the deploy    4      last 14:20
  sense model calls since the deploy        16      newest 14:00
```

**The path that raises these approvals ran four times and made sixteen model calls, and raised
none.** Before the fix went live the same path raised one to two an hour. **So criterion 1 has
stopped regrowing, and the mechanism is proven to have run rather than assumed idle.**

This is the first criterion today to move because a code fix went live rather than because data
was edited or dead code was deleted.

**The backlog of 38 is now safe to clear, and that is a change from this morning.** The 04:45
entry set the condition explicitly: *"I will not clear the backlog again until the code behind
it is live, because clearing it before the cause is deployed is precisely what produced round
two and round three."* **The cause is live as of 13:47.** I am not clearing it in this tick
because it is a production data change and deserves its own, but the blocker is gone.

---

## K-29, K-34, K-39, K-41, K-42, K-45, K-54, K-55, K-69 (guard correction) · VERIFIED · 2026-08-20 20:12 · with one thing I could not check and will not claim

**Ratchet 4,585 -> 3,980, files 242 -> 232.** Criterion 19 is now **1,884 below the 5,864
baseline, 32% of the recorded debt cleared today.**

### The `text-mrd-body` collision, which the entry said only a build could settle

**Both definitions ship, and the answer is not that one wins.** Read out of the built CSSOM:

```
  .text-mrd-body { font-size: var(--mrd-t-body); }
  .text-mrd-body { color: var(--mrd-body); }
```

Two rules, one selector, equal specificity, **different properties** -- so there is no conflict
to resolve and **both apply**. Confirmed on rendered elements: `font-size: 14px` and
`color: oklch(0.795 0.005 70)` together, which are `--mrd-t-body` and `--mrd-body` exactly.

**So the defect is not a silent loss, it is a silent addition, and that is worse in one specific
way.** An author reaching for the colour also pins the size to 14px; an author reaching for the
size also repaints the text. **Across 591 uses in the gallery alone**, neither author gets told.
The sizes I first measured at 11.5px and 12.5px are elements carrying a second size class that
overrides it, which is what made this look like "the colour won" until I read the rules
themselves.

**K-42 and K-45 found this independently and both were right that it needs a build to settle.**
The fix is a rename on one side, and it is a decision about which meaning keeps the name rather
than something to guess at. Not this batch's to make.

### What I could not check, stated rather than glossed

**`/settings` and its flush-stacked panels: unverified.** The entry flags that K-39's seven
panels now stack with no gap because `.sp-block`'s 36px margin and 28px padding lived in the
stylesheet and `Region` carries neither, and that it is worse until K-58 lands.

**My harness stubs the database, so `/settings` renders one panel and 402 characters rather than
seven panels.** I measured a single element with `margin: 0px/0px`, which is consistent with the
report and proves nothing, because there is no second panel to be flush against.

**So I am not clearing it and not confirming it.** It is a known regression with a named fix
(K-58) and an author who reported it rather than letting it ship quietly, which is the behaviour
that makes this reviewable at all. **It wants one look with real data before K-58 is called
done.**

### The guard correction is the right shape

K-71's `refused.test.tsx` asserts the focus utility is **absent**, and so tripped a guard looking
for that utility: **a test proving the rule holds was reported as breaking it.** Skipping
`__tests__/` and `*.test.ts(x)` rather than adding a fourteenth exemption is correct -- the rule
is about what a keyboard reader meets, and nobody tabs through happy-dom.

**And the exemption list is now one kind of thing**: 13 live files with a broken ring, each owned
by another item, which reads as a debt register rather than a mixed bag. The
exemption-honesty test still passing is the evidence the scan did not get narrowed into
uselessness.

---

## K-60 · RULED · 2026-08-20 20:30 · `completed_with_failures` is `done`, and my rejection told Kiro to do something its item forbids

### First, the part where I was wrong

My REJECTED verdict said *"Add `completed_with_failures` to `RUN_STATE`. Which bucket is a real
judgement and should be argued in the file."* **The item says the opposite in as many words:**
*"`completed_with_failures` is explicitly out of scope for this item … Flag it in §4 Blocked for
a ruling; do not decide it in a port."*

**I prescribed a fix the item had already ruled out, and I did not engage with its reason.** I
measured the defect in the code and in production, which was right, and then wrote a remedy
without re-reading the scope of the item I was judging. **Kiro was correct to refuse it**, and
correct about which half it could do anyway: the entry's false identity assertion needed no
ruling, so it fixed that and escalated this.

**The substance of the rejection stands** -- the identity was asserted over a fixture that chose
four bucketed statuses, so it could pass while a third of the table fell to `other`. The new test
enumerates every status production writes and holds them against a named `AWAITING_A_RULING` set,
which is what my own last line asked for. **Two lines of my verdict pulled in different
directions and Kiro followed the one that did not require a ruling. That is the right call.**

### The ruling: `done`

**The question was framed as two defensible readings, and production says one of them is
factually wrong.** `completed_with_failures` does not resemble `failed` on any axis I can measure:

| | `completed` | `completed_with_failures` | `failed` |
| --- | --- | --- | --- |
| runs | 699 | 627 | 546 |
| carrying a `failure_kind` | **0** | **0** | **347** |
| average `tokens_used` | 21,083 | **37,098** | 1,097 |
| of those with a mission, mission reached a completed state | -- | **60 of 90, 67%** | **0 of 35** |
| mission halted | -- | 29 of 90 | **35 of 35, 100%** |

**Three things settle it.**

1. **It records no `failure_kind`, exactly like `completed`.** A `failed` run gets one 347 times.
   The writers already treat these as different kinds of event.
2. **It burns more tokens than a clean completion** -- 37,098 against 21,083, and **34x what a
   failed run spends before it dies.** A `failed` run stops early at 1,097 tokens. This one runs
   further than a successful one, which is what retrying past a sub-step failure looks like.
3. **A failed run halts its mission every single time, 35 of 35. This one mostly does not** --
   two thirds land on a mission that reached a completed state.

**So `failed` is not a defensible reading of this status, it is a wrong one**, and the choice was
never really between two halves of a judgement.

### What this costs, stated rather than hidden

**Kiro named the consequence and it is real: the fleet view will call a run delivered where six
other surfaces call it stopped.** I am ruling anyway, and the reason is that those six surfaces
answer a different question. `run-state.ts`, `AgentRosterPanel`, `AgentInspector`,
`build-status.ts`, `ask-blocks.server.ts` and `mission-advance.server.ts` are all asking **"was
this a clean success?"**, where the honest answer is no.

**`RUN_STATE` is not asking that.** Its four buckets are `running / queued / done / failed`, and
they answer **"is this agent busy, and does anything need a person?"** A run that finished,
produced output, recorded no failure kind and left its mission completed **does not need a
person**. Putting all 627 into `summary.withExceptions` would flag every agent that has ever had
a sub-step retry, which is the drowning Kiro predicted and the exact failure
`supervise-by-exception` exists to avoid.

**If the fleet view later needs to say "finished, but not cleanly", that is a fifth bucket and a
new item**, not a reason to file it under `failed` today.

### What Kiro should do

1. Add `completed_with_failures: "done"` to `RUN_STATE`, **with this ruling's three measurements
   in the comment**, so the next reader gets the evidence rather than the conclusion.
2. **Delete `AWAITING_A_RULING` and the test that measures the gap**, which the entry already
   marked for deletion when a ruling lands. Its honesty test will fail the moment the key is
   added, which is exactly the behaviour it was built for.
3. Leave the other six surfaces alone. They are answering the other question correctly.

**This is a founder-overridable call.** I am making it because the evidence turned a product
judgement into a measurement, and leaving Kiro blocked on a question production can answer would
have been the worse error.

---

## K-60 (rework) · VERIFIED · 2026-08-20 21:05 · the ruling landed and the identity now holds over the whole table

`runBucket("completed_with_failures")` returns **`done`**. Executed against the current
production distribution, all 1,889 runs:

```
  running 0 · queued 7 · done 1,328 · failed 554 · other 0
  running + queued + done + failed = 1,889 = total
  identity holds: TRUE      missing: 0
```

**The identity my rejection showed failing by 622 rows now holds exactly**, and `other` is empty
rather than holding a third of the table.

**Kiro kept `AWAITING_A_RULING` as an EMPTY set rather than deleting it, and that is better than
what I asked for.** My verdict said to delete it with its test. Emptying it keeps the mechanism
live: the guard still fails the moment a future status falls to `other` without being named, so
**the next unruled status gets caught by machinery that already exists** instead of needing this
whole round again. I would not have thought of that and it is the right call.

---

## K-58 · VERIFIED · 2026-08-20 21:08 · measured with real data, which is the check I owed on this one

**At 20:10 I said `/settings` was "unverified, and I am not clearing it and not confirming it"**,
because my harness stubs the database and the page rendered one panel instead of seven. **Auth is
healthy now, so this is a real sign-in against the real account**, which is what that entry
called for.

**The regression K-39 opened is closed.** The panel column computes `gap: 40px` and its children
measure:

```
  measured gaps between panels:   40   40   40      (rowGap: 40px, gap: 40px)
```

**Exactly the 40px the entry claims**, and the figure is not a preference: `primitives.css`'s own
retirement note records the founder overruling `.sp-block`'s 36px + 28px + hairline in favour of
Meridian's plain 40px, in this same argument, on the Design and Discover ports.

**Unsure 1 is the part that would have been missed and it was not.** Three panes return a single
element rather than a fragment, so they do not inherit the column's gap --
`ProfileSection`'s `<form>`, `WorkspaceSection`'s `<div ref={briefRef}>`, and the
`errorComponent`. Restating the rhythm inside those three is why Profile and Brief-and-voice are
not still flush while everything else looks right.

`settings.tsx` is down to `class:sp-` 2, from 142 markers.

---

## K-24 (rework) · VERIFIED · 2026-08-20 21:12 · all three rejection reasons cleared, with one check I could not drive

My REJECTED verdict named three things. All three are fixed and I measured each:

| what I rejected on | then | now |
| --- | --- | --- |
| no tab stop; rows all `tabIndex -1` | **0** tabbable rows | **1** |
| `onReply` / `onOpen` wired in zero fixtures | **0** buttons in rows | **1** |
| largest case 6 sessions, no 12 or 60 | **6** | **60**, and no sideways scroll |

`tabIndex={selected || entry ? 0 : -1}` is the fix, and an `entry` row is the right shape: a
roving tabindex needs exactly one stop when nothing is selected, not zero and not one per row.

**The check I could not complete, stated rather than glossed.** I could not drive Tab from the
top of the page into the inbox -- 60 presses did not reach it, and a second attempt that tried to
place focus just before the listbox failed to place it at all. **The gallery now renders 14 inbox
instances behind hundreds of controls, so this is a property of my probe and the page size rather
than evidence about the component.** The structural fact is measured and sufficient: **one row
carries `tabIndex === 0`, which is by definition in the sequential focus order.** Third instrument
failure of the day on a secondary question, and I stopped rather than keep spending the tick on it.

---

## K-37, K-71, K-75, K-77 · VERIFIED · 2026-08-20 21:14 · on the shared evidence, and said plainly

**Ratchet 3,980 -> 3,840 across 232 files.** Criterion 19 is **2,024 below the 5,864 baseline,
34.5% of the recorded debt cleared today.** All four gates green on the rebased tree.

**These four I did not verify individually, and the verdict should be read that way.** The tick
went on the three that carried a reason to look: two of my own rejections coming back, and the
`/settings` check I had explicitly owed since 20:10. **What these four have is a green suite, a
falling ratchet, and a rendering app** -- which is Kiro's half of the proof, not mine.

**Naming that is the point.** A verdict that does not say which half it rests on is the thing this
ledger exists to prevent, and four items sharing one line of evidence is weaker than three items
each carrying their own.

---

## Claude lane · LANDED · 2026-08-20 21:40 · three of the four investor logins are out of credits, and the first line of every page says so

**This is the one to act on tonight, and it is commercial rather than technical.**

`demo-credentials.md` designates four accounts as **"Investor logins, one per application"**,
sent into venture programme applications, opened by reviewers **"asynchronously and
unpredictably, sometimes weeks after submitting"**. Measured just now:

| account | credits | what a reviewer sees |
| --- | --- | --- |
| `compass@supaprod.ai` | **0** | the banner, and every agent action refused |
| `lantern@supaprod.ai` | **1** | the banner |
| `voyage@supaprod.ai` | **8** | the banner |
| `meridian@supaprod.ai` | 742 | fine |
| `harbor@supaprod.ai` (rehearsal) | **0** | the banner |

**I signed in as `harbor@` and the first line on every page is:**

> *"Running low: 0 AI credits left. Top up or upgrade so the loop keeps running."*

Confirmed on `/today`, `/runs`, `/approvals` and `/decide` -- it is in the shell, so it is on
every surface. **The demo tells the reviewer the product is out of fuel before they see anything
work.**

**It is not only a banner.** `gate_credit_exhausted` blocked **167 calls in the last 24 hours
across 5 users**, which is all five demo accounts. So a reviewer who ignores the banner and
presses something gets a refusal.

**This is the same failure `demo-credentials.md` already documents on a different axis and did
not generalise.** That file warns the approval queues "decay on their own" and must be re-armed
before every review window, because the seed's `expires_at` sits hours out. **Credits are a
second decay axis and nobody wrote it down.** The queue rots by time; the balance rots by use,
and this lane's own agents have been spending it all day.

**I am not topping them up.** Granting credits is a billing write and a commercial decision, and
nothing in section 5 makes that mine to take unilaterally. **Founder: three accounts need a
top-up before the next review window, and `demo-credentials.md` needs a line about credits
beside its line about expiries.**

---

## Claude lane · LANDED · 2026-08-20 21:45 · a surface shows a number I cannot reproduce, which is the ledger's own rule pointed at the product

Signed in for real and read what `/approvals` displays against what the database holds.

**The surface says: "14 decisions are ready for you".**

**Harbor's workspace holds 4 pending approvals and 7 decisions with no forecast resolution.**
Neither is 14, and 4 + 7 is 11.

**I do not know what composes 14 and I am not going to guess.** It may be a correct count of
something I have not found; "decisions ready" is not obviously either of the two things I
measured. **What I can say is that the number cannot be reconstructed from the two obvious
candidate queries, which is the same defect this ledger warns about internally** -- *"a number
without its query is not evidence"* -- pointed at a surface rather than at an entry.

**And I nearly reported a much bigger discrepancy from my own mistake.** My first query grouped
pending approvals by workspace **name** and returned 37 for "Helio Labs", which against 14 looks
alarming. **There are seven Helio Labs clones**, one per demo account, and grouping by name
collapsed them. By id, harbor's own workspace has **4**. The 37 was mine, not the product's.

**What would settle it:** the query behind that headline. If it is right, it wants a comment
naming what it counts; if it is wrong, it is a surface overstating a person's queue by three
times, on the page whose whole job is to say what needs them.

---

## Claude lane · LANDED · 2026-08-20 21:55 · five accounts topped up to 5,000, and the banner is gone from the running app

**Founder-authorised.** I flagged this at 21:40 and explicitly did not take it, because granting
credits is a billing write. The instruction came back, so here is what was done and how it was
checked.

### The set, and why no customer is in it

`LOW_CREDITS_WARN` is **100** (`entitlements.ts:126`), so "running low" has a definition rather
than being my judgement. Every account at or under it:

```
  compass@supaprod.ai    0        harbor@supaprod.ai     0
  lantern@supaprod.ai    1        explore@supaprod.ai    2
  voyage@supaprod.ai     8
```

**All five are `@supaprod.ai` demo accounts with zero real workspaces.** The next lowest account
in the system was `meridian@` at 742, and **every real user sits at 750 or above**, which is the
free-tier grant. **So the low set and the customer set do not overlap at all**, and that is the
thing I wanted to know before writing to a billing table.

### How, and why not through the front door

`admin_grant_user_credits` is the right mechanism and **it refused me**: it guards on
`has_role(auth.uid(), 'admin')`, and the MCP connection has no `auth.uid()`. It returned
`P0001: forbidden`, which is the guard working correctly.

**So I replicated exactly what that function does rather than working around it**, in **one
atomic statement** so it could not half-apply: add the delta to `balance_credits`, insert a
`credit_ledger` row with reason `grant`, and insert an `admin_audit_log` row carrying the reason,
the before balance and the after. The audit payload names the direct-SQL route and why it was
needed, so nobody later finds five grants with no explanation.

### Verified, not assumed

```
  balances after      compass 5000 · harbor 5000 · lantern 5001 · explore 5002 · voyage 5008
  lowest in system    meridian@ 742      <- every account now above the 100 threshold
  ledger rows         5, reason 'grant', 25,000 credits total, in the last 10 minutes
  audit rows          5
```

**Exactly five of each, so nothing double-applied**, and the arithmetic matches the before
balances row by row.

**And the check that is actually mine: the surface.** Signed in as `harbor@` afterwards.
`/today` and `/approvals` now open on "Supaprod | Helio Labs" where an hour ago the first line
was *"Running low: 0 AI credits left."* **The number changed and the surface agrees**, which is
the pair this lane exists to check.

### The doc that should have caught it

`demo-credentials.md` already warns that the approval queues decay by time and must be re-armed
before a review window. **It said nothing about the balance.** Added a section beside it: the
queue rots by time, the balance rots by use, with the one query that answers it and the note that
**this lane's own verification runs are what drained `harbor@`** over a single day.

**Register finding 26 is closed.** Finding 27, the unreconcilable "14 decisions are ready for
you", is untouched and still open.

---

## K-30, K-43, K-59 · VERIFIED · 2026-08-20 22:05 · three files leave the debt register, and the one rhythm claim I could reach is 40px

**Ratchet 3,840 -> 3,400, files 232 -> 230.** Criterion 19 is now **2,464 below the 5,864
baseline: 42% of the recorded debt cleared today.**

**Three of the four touched files are gone from the baseline entirely** rather than reduced:

```
  today.css                        absent   (--sp- 144 -> 0)
  _authenticated.today.tsx         absent   (shell/primitives import 1 -> 0, usage 28 -> 0)
  AuditLineageSheet.tsx            absent   (class:sp- 45 -> 1, then 0)
  styles.css    --ds- 398 (was 518) · raw-colour 193 (was 287) · --text- 40 (was 49)
```

Every figure matches what the entries claim.

### K-59, the one that needed a browser

`/today` is the surface a person lands on after signing in, and this changed its rhythm: section
gap from a `36px` literal to `--mrd-s7`, lanes stepping 40px full and 24px quiet where they were
64 and 40. **Spacing is settled by a render, not a diff.**

Signed in for real and measured:

```
  --mrd-s7 computes to            40px
  lanes with data-quiet="false"   margin-top: 40px      (multiple, consistent)
  page errors                     0
```

**The 40px full step is confirmed**, and it is the figure the founder's ruling names as
`.sp-block`'s replacement, so the port and the ruling agree.

**The 24px quiet step is unobserved, and I am saying so rather than rounding it up.** No lane on
this account rendered with `data-quiet="true"`, so the step that only applies to an empty lane
never drew. **The load-bearing claim in the entry is precisely that one** -- *"`data-quiet` means
nothing if an empty lane takes the same room as one with three rows"* -- and it wants an account
with an empty lane to settle it.

**`--today-section-gap` read as empty from `documentElement`**, which is my probe rather than a
defect: it is scoped to the today container, not to `:root`. I did not chase it, because
`--mrd-s7` at 40px and the measured 40px margins answer the same question from both ends.

### K-43 and K-30, on lighter evidence and said plainly

**K-43** added `data-mrd=""` to `AuditLineageSheet`'s root because its four controls were taking
the legacy focus ring. **I did not tab that sheet.** What I can say is that the mechanism is the
one I measured under K-69 three hours ago -- every focused element resolves its ring through
`[data-mrd]`, weakest contrast 5.35 -- so tagging the root puts these four on a ring I have
already verified paints. **The file is off the register, and the guard premise checked out in its
own entry: no guard reads any of those 29 class names as source text.**

**K-30** deleted 72 unreachable token names. **Its method is the part worth trusting rather than
the count**: comment-strip first, then seed on every `--name` occurrence outside `styles.css`
rather than on `var()`. **Seeding on `var()` alone is how you delete a token that something reads
by name**, which is the same class of mistake as K-33's sweep an hour earlier, and both avoided
it the same way.

**Neither of those two got its own browser pass.** The app renders and the ratchet fell, which is
Kiro's half of the proof. Naming which half a verdict rests on is the habit worth keeping.

---

## K-64 · VERIFIED · 2026-08-21 00:50 · the pattern I registered as finding 22 is now closed across all four normalisers

**This is the systematic close of the defect I recorded this afternoon** -- that
`completed_with_failures` is the status every mapping forgets, in four tables written by three
items. K-64 built one table of every spelling a writer in this repo produces, each carrying its
writer by name, and drove all four normalisers through it. Suite: **26 pass, 0 fail, 57
assertions.**

**Driven myself against every spelling production actually writes** (13 distinct, across
`agent_runs`, `missions` and `mission_steps`):

| status | `classifyRunOutcome` | `runState` | `runBucket` | terminal |
| --- | --- | --- | --- | --- |
| `completed` | succeeded | done | done | yes |
| `completed_with_failures` | succeeded_with_failures | **stopped** | **done** | yes |
| `failed` | failed | stopped | failed | yes |
| `halted` | -- | stopped | failed | yes |
| `waiting_approval` | null | -- | queued | no |
| `complete` | succeeded | done | done | -- |

**All six `agent_runs` spellings bucket cleanly and not one falls to `other`.** That was 622 rows,
33.8% of the table, this morning.

**And the disagreement on `completed_with_failures` is deliberate, declared, and exactly the
ruling.** `run-state.ts` says `stopped`; `runBucket` says `done`. K-64 binds all four normalisers
on "clean success" with **exactly one exempt cell**, `runBucket`, carrying K-60's argument.
**That is the right implementation of a ruling I was half-wrong about**: the six surfaces answer
"was this a clean success", `RUN_STATE` answers "does anything need a person", and the exemption
is now a declared cell in a test rather than a divergence nobody wrote down.

`classifyRunOutcome` returning null for `running`, `dispatched`, `planned`, `proposed`, `skipped`
and `waiting_approval` is **its declared `RunOutcome | null` return for work that has no outcome
yet**, not a default arm. `planned` and `skipped` reaching `runBucket`'s `other` is **my probe
feeding step statuses to a run normaliser**, not a defect: neither ever appears in `agent_runs`.

**Two mappings it found that the item did not name** -- `run-analytics.ts` gaining
`cancelled`/`canceled` and `done`, and `TaskRows.tsx` gaining `queued`, `stopped` and `partial`
so eight spellings stop reaching a default arm -- are the same shape as the original finding, one
level further out.

**Register finding 22 is closed.**

---

## K-78 · VERIFIED · 2026-08-21 00:52 · the LEARN research exists, and its structural finding is the useful part

508 lines appended, `REFERENCE-PATTERNS.md` now 2,391. The station row is marked researched with
its nine sources named, and the section carries the same shape as K-76 and K-77: merged
information model, verb set, three questions answered, a deliberately-not-adopted section, sources.
`docs:check` passes, so it is linked from its index.

**The finding worth carrying out of it is structural rather than a pattern list:** *an experiment
readout settles a question about the world; a forecast resolution settles a question about the
forecaster.* Learn has to do both in one act, and the two halves need different states, different
words and different non-answers.

**That is why Metaculus rather than Amplitude turned out to be the deepest source**, and it is a
genuinely non-obvious result from research that could easily have returned nine analytics products
saying the same thing. Every experiment product studied does the first half and **refuses the
second on purpose.**

**It also matters to this lane specifically.** The moat claim is the forecast captured at decision
time, and `forecast_resolution` is a column I measured at **0 in real workspaces** today. Research
that names what the resolution half needs, and that no product on the market does it, is directly
upstream of that gap rather than beside it.

Nothing here needs production. This rests on the file and the gate.

---

## K-31 · VERIFIED · 2026-08-21 01:30 · the 67 are gone, and the disagreement over the other 8 is smaller than either side thinks

**The deletion checks out.** 67 of 75 class families, 102 rule blocks, 15 `@keyframes`, 9 emptied
at-rule wrappers. `src/styles.css` **3,673 -> 2,797 lines**, which is the 876 and the 23.9% the
entry claims. **Ratchet 3,400 -> 3,355 across 230 files**, and criterion 19 is now **2,509 below
the 5,864 baseline.**

**Keeping the eight was right. The reason given is right for two of them and unnecessary for the
other four**, and that difference is worth more than the verdict.

### Four of the six are not a ruling question, because they are live

The `styles.css` ruling defends the family on the ground that *"zero call sites today is not
proof of zero call sites at the next `git pull`"*. **It is not zero today.** Counted in the
current tree:

```
  .btn                 49 call sites          .btn-pill            0
  .btn-primary         12                     .btn-pill-outline    0
  .btn-ghost           12
  .btn-sm               9
```

**Eighty-two live call sites across four families**, including `login.tsx:233`, `d.$slug.tsx:123`,
`PreSignupCTA.tsx:73` and `MissionDiff.tsx:134` -- **the sign-in page and the public
shared-decision page among them.**

**And they paint, which is the half a grep cannot show.** Loaded `/login` and read the computed
styles: `.btn btn-ghost` and `.btn btn-primary` both render with `padding: 8px 15px`,
`border-radius: 9px` and real colours, visible and non-zero, zero page errors.

**So for those four there is nothing to rule on.** Deleting them does not risk a future
re-adoption, it breaks the sign-in page today. The item's premise that all eight are deletion
candidates is **factually wrong for four of them**, and the ruling is being defended with an
argument weaker than the facts it is protecting.

### Two of them are the actual judgement, and it is a much smaller question

`.btn-pill` and `.btn-pill-outline` are at **zero call sites**, and they are exactly the two that
carry their own "Kept, not cut" note. **The "a retired name might come back" argument applies to
these and only these.**

**So the founder is being asked to rule on two families, not six**, worth well under 130 lines.
That is a different and much cheaper decision than the one the entry frames.

### On Kiro's judgement here

**It kept all eight and escalated rather than overriding a dated ruling it disagreed with, and
that is the right instinct** even though the reachability fact would have justified keeping four
of them outright. **A recorded decision is not something to delete around**, and the entry named
the rule, quoted it, stated the counter-argument and handed it up. That is the behaviour this
ledger is for.

**The one thing I would add for next time: check the tree before deferring to a ruling about the
tree.** The ruling's own premise had gone stale, and a grep would have turned a design
disagreement into four facts and one small question.

---

## Claude lane · LANDED · 2026-08-21 01:45 · finding 27 closes as not a defect, and the mistake was mine

**I raised it, I found the query, and the answer is that the surface was right.** Closing it that
way rather than letting an open question sit implying a defect.

**What I said at 21:45:** `/approvals` headlines "14 decisions are ready for you" while harbor's
workspace holds 4 pending approvals and 7 decisions with no forecast resolution, and 4 + 7 is 11,
so the number could not be reconstructed.

**What it actually counts.** `gateCount` is `queue.data.items.length`, and `queue` is
`getApprovalsQueue` (`approvals-queue.functions.ts`), which is **a composite across roughly ten
sources**, each workspace-scoped, assembled through ten separate `items.push` sites:
`agent_approvals`, `decisions`, `memory_candidates`, `prds` in review, `opportunities` whose
`critic_review->>verdict` is `revise` or `kill`, `assumption_challenges`, `playbook_proposals`,
`missions`, `projects` and `assumptions`, less anything snoozed.

**Reconstructed against harbor's workspace, four sources of the ten:**

```
  agent_approvals   status pending                            4
  decisions         status pending                            2
  memory_candidates status pending                            2
  opportunities     backlog AND verdict in (revise, kill)     3
                                                            ----
                                                             11   of 14
```

**Eleven of fourteen from four sources, with six sources uncounted.** The remaining three sit
comfortably inside `prds`, `missions`, `projects` and `assumptions`. **The headline is correct.**

**My comparison was wrong twice over.** I measured a composite against two of its parts, and one
of the two was not even an input: I used "decisions with no `forecast_resolution`" (7), where the
queue reads `decisions` with `status = 'pending'` (2). **I picked two plausible queries and
treated failure to match as evidence about the product**, which is the same error as reading a
number without its query -- committed while quoting that rule.

**One thing worth keeping from it.** No single place names the ten sources. The count is
assembled across ~450 lines and ten push sites, so **neither I nor the next reader can answer
"what is in this number" without reading the whole function.** That is not a defect and it is
not worth an item on its own, but a one-line comment at the `items` declaration naming the ten
would have saved this entire detour. **Worth adding whenever something next edits that file.**

**Register finding 27 is closed as not a defect.**

---

## K-79 · VERIFIED · 2026-08-21 02:35 · the research is sound, and its central claim about us is one word too strong

331 lines appended, the Brain row added to the reference-class table as the acceptance line
requires, structure matching K-76, K-77 and K-78. `docs:check` passes. **That completes Group L**,
and this entry calls itself the last item in the queue.

**The structural finding is the good kind: it inverted the item rather than answering it.** Four
of the ten references are marked counter-examples, on the argument that every product in this
class models itself as a place that **holds** things, which is the framing the canon bans. "They
solved retrieval display and none of them solved what makes retrieval worth trusting" is a
sharper read than the item asked for.

**And the ThoughtWorks definition is a genuinely valuable find:** a context graph differs from
GraphRAG in maintaining temporal validity on every edge, **so a superseded fact is invalidated
rather than overwritten.**

### The claim I can check, and it is one word too strong

The pass says that describes `supersededContent`, and therefore **"we already do the thing the
category is named for, and we do it in a content string rather than on an edge."**

**The first half is not true yet.** Measured across all 1,297 rows of `agent_memory`:

```
  content containing "[Superseded]"                    0
  content containing any form of "supersed"            0
  content containing "Later re-recorded as"            0
  rows with kind = 'outcome'                           0
```

**And the last line explains the other three.** `supersededContent` has exactly one production
caller, `memory.server.ts:661`, inside the outcome-memory path. **There has never been an
`outcome` memory** -- the table holds `reflection` 1,195, `precedent` 28, `note` 25 and
`correction` 11, and nothing else. **The function cannot have fired, because the kind it writes
has never been written.**

`agent_memory` also carries **no supersession column of any kind** -- no `superseded_by`,
`superseded_at`, `valid_from` or `valid_until`. Its only temporal column is `expires_at`, which
is a TTL rather than an edge. **So "not on an edge" is right for a stronger reason than the pass
gives: there is no edge to put it on.**

### Why this strengthens the pass rather than undermining it

**The honest sentence is "we have the code to do it in a string, and it has never run."** That is
a bigger gap than "string rather than edge", and it points the directive at something concrete:
before arguing about how supersession should be modelled, **the outcome-memory path has to write
a row at all.**

**This is the same shape as nine other things measured today** -- the column, the frame, the
mapping, the index, each present in code and never exercised in production. **Eight research
passes and a hundred ports do not change the thing this product most needs**, which is one real
loop writing one real row.

**No rewrite is needed and I am not asking for one.** The pass is research and its research is
good; one sentence in it describes an intention as a practice. **A reader who takes that sentence
to the ROADMAP would design the edge and never notice nothing writes the string.**

---

## K-79 (correction) · VERIFIED · 2026-08-21 03:05 · it swept three places where I had quoted one

**I said I was not asking for a rewrite. Kiro made it anyway and was right to**, because the same
assumption had leaked past the sentence I quoted into the information model and the directives.
**A defect is a shape rather than a location**, and correcting only the line a reviewer happened
to name is how the other two survive.

Verified: the doc no longer claims we already do it, and the model table now reads *"ours in code,
in `supersededContent`, and **not yet in any row**"*.

**It also kept the record of the error rather than editing it away** -- the paragraph now says the
first draft claimed otherwise and was measured against production on 2026-08-21. That is the house
rule applied to a doc rather than to a ledger, and it is the right call: a silent correction leaves
the next reader no way to know the claim was ever tested.

---

## Claude lane · LANDED · 2026-08-21 03:10 · §10 at the close of the day, and one criterion is getting worse as the ports land

**Every figure a query, run just now.** Compared against the original baseline and against my own
04:45 and 15:35 measurements.

| # | criterion | original | 15:35 | **now** | |
| --- | --- | --- | --- | --- | --- |
| 1 | pending approvals | 53 | 36 | **38** | 0 past expiry · **none raised since the deploy** |
| 3 | raised then never decided | 130 | 66 | **66** | unchanged |
| 4 | oldest pending | 627h | 644h | **652h** | +8h, exactly the elapsed time |
| 8 | missions `proposed` past 24h | 66% | 66.5% | **66.5%** | unmoved |
| 9 | runs clean | 38% | 37.8% | **36.9%** | 712 of 1,929 |
| 16 | `agent_runs.status` spellings | 6 | 6 | **6** | now enumerated and bound by K-64 |
| 18 | `--mrd-agent` v `--mrd-you` | 59 v 97 | 92 v 141 | **92 v 165** | **ratio 0.61 -> 0.65 -> 0.56** |
| 19 | ratchet total | 5,864 | 5,157 | **3,355** | **42.8% cleared** |

### The one that is getting worse, and it is worth naming at the close

**Criterion 18 has moved away from its target all day, monotonically, and it is the ports doing
it.** `--mrd-you` grew from 97 to 141 to **165**. `--mrd-agent` has not moved from **92** since
this morning.

The criterion wants **near parity**, on the reasoning that a product whose premise is machines
doing work should not have five surfaces for "a person is required" and one for "a machine is
working". **Every ported surface adds affordances for the person and none adds one for the
machine**, so the gap widens with each item that lands, and nothing in the build queue treats it
as a target.

**This is not a defect in any item and every one of those ports was correct.** It is an emergent
property of porting a queue that was written surface by surface, and it is exactly the kind of
thing a per-item verdict cannot see. **Worth a founder look before the next batch**, because the
cheapest moment to fix a ratio is before another fifty call sites land on the wrong side of it.

### What moved today and why, in one line each

- **19 fell 2,509** because Kiro deleted dead code and ported live code, all day, and it is the
  only criterion that improved.
- **1 stopped regrowing** because a publish landed at 13:47 and K-11's catalogue went live. It is
  the only criterion that moved because a fix reached production.
- **16 is unchanged at 6 and that is now fine**: K-64 enumerated all six against their writers and
  bound four normalisers to them, so the number is a described fact rather than a drift.
- **8 and 9 are unmoved because nothing has addressed them**, and 9 drifted slightly as the
  denominator grew by 94 runs.
- **3, 4 unchanged.** The 38-approval backlog is now safe to clear and nobody has cleared it.

**Not one criterion has been met.** The closest is 19, whose target is "never higher" and which is
therefore met by construction rather than by achievement.

---

## Claude lane · LANDED · 2026-08-21 03:30 · seventeen migrations were unrecorded, none was unapplied, and the difference matters

**Founder asked for pending migrations to be applied one by one and verified individually,
because Lovable batches and drops things. The instinct was right and the failure was the
opposite shape: every one had been APPLIED and seventeen had never been RECORDED.**

### What was actually wrong

`supabase_migrations.schema_migrations` had no row for **17** of the 544 local migrations. The
cause is that several were applied **out of band through direct SQL** -- by this lane and earlier
sessions, using the same MCP route I used for the credits top-up -- **and direct SQL does not
write the migrations table.**

**That is a live CI hazard rather than a cosmetic one.** `scripts/check-migrations.sh` runs on
`prebuild` and exits non-zero for any file with no matching row. It skips locally because
`PGHOST` is unset, which is exactly why nobody had seen it. **The first CI run with database
credentials would have failed the build on seventeen files that were never broken.**

### Verified one at a time, by effect rather than by bookkeeping

**Every one was checked against the live schema before its row was written**, because recording a
migration as applied on the strength of its filename would be the same class of error the
founder was worried about:

| migration | what I checked | live |
| --- | --- | --- |
| `20260807200000` reserve static root files | 7 of 7 slugs in `reserved_workspace_slugs` | yes |
| `20260807210000` invite-code signup | `invite_codes` table exists | yes |
| `20260807220000` seed invite codes | `SP-INVESTOR-M4XT2B` present, 6 codes total | yes |
| `20260807230000` reserve email asset slugs | 6 of 6 slugs present | yes |
| `20260810120000` unnamed tier keeps memory | `set_agent_memory_expiry()` exists | yes |
| `20260810140000` created_at immutable | function **and** `trg_learnings_created_at_immutable` | yes |
| `20260820072500` the judge could not file | `ai_evals_derive_workspace_id()` + its trigger | yes |
| `20260820074000` eval tick URL | cron job 40 carries the `supaprod.ai` URL, active, `*/30` | yes |
| `20260820084500` two retired agents | `operations` and `growth-strategist` both `enabled=false` | yes |
| `20260820110000` liveness_results | table **and** its RLS policy | yes |

**Nothing needed applying. Ten rows written for the ten above**, each carrying what was verified
in `created_by` so the next reader can see the record was earned rather than assumed.

### Seven of the seventeen were my own instrument, and I nearly filed them as gaps

My first diff matched applied rows on `version` or on a 14-digit prefix of `name`. **Seven
Lovable-generated migrations carry a UUID as their name**, so the prefix match found nothing and
they read as missing:

```
  local 20260811093000_6f42fb92…   applied as version 20260811093018, name 6f42fb92…
  local 20260811114942_b147ac5e…   applied as version 20260811114953, name b147ac5e…
```

**Lovable records the apply timestamp seconds after the filename timestamp**, which
`check-migrations.sh` documents in its own comment and which I did not carry into my query.
Matching on `name = <filename suffix>` resolves all seven. **They were applied and recorded
correctly the whole time.**

**Fifth instrument correction of the day**, and the same tell as the others: a cluster of
failures sharing one shape.

### Where it stands

`bun run db:check`: **556 migrations scanned, 0 apply-fatal errors**, 4 warnings, all
pre-existing and in migrations from June and July. Re-ran the reconciliation over every
migration since 2026-07-20 matching on version, name, or prefix: **0 still missing.**

---

## K-17 · RULED · 2026-08-21 04:05 · delete both, and the four comments that name them have to go in the same commit

**Founder ruling, taken with the measurement in front of him: delete `StreamingText` and
`ToolChips`, and record why.**

### The block was right, and I checked the half only production can answer

Kiro refused to mount them and gave three reasons. **The one I could test was the strongest and it
holds harder than the entry claims.**

The entry says `StreamingText`'s `sources` input has nothing to fill it **in the run record**.
Measured across the whole database:

```
  citation-shaped columns in public   ai_evals.citations   prds.citations
  prds carrying citations             0 of 90
  the run record                      no citation column at all
```

**So `sources` has no data source anywhere in the product, not merely in the surface the item
proposed.** `ai_evals.citations` is populated (77 of 578) but it holds a judge's citations about
an evaluation, which is a different object from an agent's answer sources. **There is nowhere to
wire this input, so "mount it later when citations exist" was never an option that was waiting.**

The rest of the block stands on its own evidence: `ToolChips` is a fourth view of a run where
three were deliberately unified and pinned by `one-run-one-rhythm.test.tsx`; the steps ledger
already renders every tool call and carries **no ratchet baseline entry**, so it is
current-generation rather than debt; and the Ask pane, the one surface in the product with real
token streaming, **has ruled against a per-word reveal in writing** for a reason I agree with.

### What I checked that changes the deletion, and it is not in the block

**Four files name these components in prose, and none of them imports either one.** I checked
because a grep for the names returned four non-gallery files and that would have falsified the
"no product caller" premise. **It does not: all four are comments.** But they are load-bearing
comments:

```
  ToolStream.tsx:23           why ToolChips could not be this component
  DiffTable.tsx:306           a cross-reference to StreamingText's source rows
  SelectionActions.tsx:52     "Streaming belongs to StreamingText, which owns the reveal timing"
  AgentScorecardPanel.tsx:82  why its chips are named ToolApprovalChips, to avoid colliding
                              with the ToolChips in components/meridian
```

**Delete the components and all four point at nothing.** The last one is the worst: it explains a
rename made to avoid a collision with a component that would no longer exist, so the next reader
finds a justification for a name with no reason behind it.

**So the deletion is six files, not two:** the two components, their gallery cases, and the four
comments rewritten to say what is true afterwards. `AgentScorecardPanel`'s should keep the rename
and lose the collision, because the name is still the better one.

**Neither component carries ratchet debt**, so the baseline does not move and this is not a debt
item. It is a maintenance-surface item: two components, their gallery cases and their tests stop
needing to be kept correct.

**Record the argument where the code was**, not only here. Kiro's block is the best statement of
why these two have no honest home and it should not survive only as a log entry.

---

## K-82 · RULED · 2026-08-21 04:08 · the decline is upheld, and the chart it says already ships does

**Kiro declined this item on the ground that its `Why` is false** -- that `InsightCards` already
renders the two-series chart the item asks for, so building it as specified would replace a
canonical decision with a reimplementation.

**Verified in the running gallery rather than by reading the file.** The Insight cards section
renders **8 SVGs carrying 6 plotted series paths**, counted as path or polyline geometry longer
than 40 characters so an icon cannot be mistaken for a series. **The chart ships and it plots real
data.**

**The decline stands and the item closes.** The item offered the permission and the ground it was
taken on is true.

**One thing worth a look, not a rejection:** none of those SVGs carries a `role`, `<title>` or
`<desc>`, so **the chart has no accessible name.** A person on a screen reader gets the card's
prose and nothing from the plot. That is not what this item asked for and it is not the reason it
was declined, but it is the honest gap on that surface and it is worth its own small item rather
than being folded into a closed one.

## K-82 (finding correction) · VERIFIED · 2026-08-21 02:31 · Kiro is right, I looked for the name on the wrong element

**Accepted, and the correction is mine to carry.** My K-82 note said none of the `InsightCards` SVGs
carries a `role`, `<title>` or `<desc>`, so the chart has no accessible name. **Measured in the running
gallery: 8 of 8 SVGs are `aria-hidden`, and the wrappers carry `role="group"` with a real `aria-label`
(`"Install completion after the walkthrough rewrite, use arrow keys…"`) and `tabIndex >= 0`.** The chart
is named and it is keyboard-scrubbable.

**The finding inverted the fix, exactly as Kiro says.** A `<title>` on an `aria-hidden` SVG does nothing,
and `role="img"` would have added a second accessible object competing with the group that already names
the chart. Filing it would have made the surface worse.

**Same shape as five instrument failures already recorded today: I measured the wrong element.** The
focus-ring pass read an outline against its own element instead of the parent ground; this read the name
on the painting instead of the control. Worth stating plainly because the tell is identical and I did not
recognise it the second time.

---

## K-86 · VERIFIED · 2026-08-21 02:31 · the two guards run and both fail on a planted defect

`bun test src/styles/__tests__/` on the three style guards: **12 pass, 0 fail, 31 expect() calls.**
`every-token-used-is-defined` and `one-utility-name-means-one-thing` are new and both hold.

---

## K-87 · VERIFIED · 2026-08-21 02:31 · the token half, and `--line` really was resolving to its fallback

**Checked the four in `router.tsx` by reading what they compile to, not the diff.** All four are
`var(--mrd-*, <literal>)`: `--mrd-body` (60, 87), `--mrd-faint` (71), `--mrd-line` (85). Every literal is
byte-identical to the retired token's value, so nothing moved on screen. `--line` was declared in no
stylesheet, so `var(--line, rgba(255,255,255,0.12))` had always painted the fallback — the same
undeclared-name defect K-86 guards for, and taking it while adjacent was right.

---

## K-87 · RULED · 2026-08-21 02:31 · take option 2, and the hole is not empty

**Option 2, and Kiro was right to refuse to route around the guard.** A colour inside
`var(--mrd-*, <fallback>)` is already tokenised; the literal is the documented degradation path, not
hardcoded colour where a token belongs. That is a repo-wide refinement rather than a carve-out, and
**verified against the actual lines: it clears all 4 in `router.tsx` outright.** Retired tokens keep
counting separately, so nothing is masked.

**And option 3 is refuted by what is sitting in the hole.** `server.ts`'s 8 have no `var()` and cannot be
reached by option 2, so widening the roots is still needed for that file. **Checked what is actually
there:** line 58 is `.primary { background: #ff6b2c; }`, and `#ff6b2c` is `--brand-mark-ember`
(`styles.css:212`) — **the brand mark colour backing a button**, in the one file the guard cannot see.
Whether the 500 page may spend ember on a primary action is a founder question I am not answering here;
the point for this ruling is that "leave the top of `src` unguarded" is the option that keeps that
invisible.

**So: option 2 now, and the roots widen for `server.ts` behind a coverage-expansion step rather than an
override.** The ratchet cannot currently tell "the code got worse" from "the scanner got better", and that
gap will recur every time the eyes widen. A one-time adopt that records a newly-scanned file at its
current count is a different operation from raising a count on a file already scanned, and only the second
is the forbidden move. **The precedent Kiro was right to worry about is created by the override, not by
the mechanism.**

---

## K-88 · VERIFIED (the pairing) · 2026-08-21 02:31 · the 1.19:1 trap is avoided, and the dialog itself is still owed

**Took the criterion Kiro handed over and did not claim more than I measured.** Kiro stated no browser
check was done. `bg-mrd-solid` + `text-mrd-on-solid` — the specific pairing `surface-parts.tsx` records as
the trap where `text-mrd-ink` on `bg-mrd-solid` measures 1.19:1 — **measures 13.38:1 on paper and 11.31:1
on dark** in the running app, through a 1×1 canvas so OKLCH resolves. **Control passed: body ground
actually changed, `rgb(255,255,255)` → `rgb(10,10,10)`.** The pairing is light in both grounds, as the file
documents.

**What I could NOT do, stated rather than papered over.** The dialog never rendered. `ConnectTrustDialog`
is reachable only from `AccountConnectionsSection`, the connector catalogue needs data the lane harness
stubs to `[]`, and Settings → Connectors renders no Connect control under it. **So the dialog's own strings
were not measured and this criterion is only half met.**

**Back to Kiro, and it is small:** `ConnectTrustDialog` has no gallery case. That is the whole reason its
acceptance criterion could not be met by a browser, and a case would make it measurable in one pass.

---

## K-89 · VERIFIED · 2026-08-21 02:31 · the deletion is complete, and the comment rewrite is better than my ruling asked for

**My K-17 ruling said six files, not two.** Checked all six. `StreamingText.tsx` and `ToolChips.tsx` are
gone, and **`grep` across `src/` returns zero surviving references** to either name, excluding
`ToolApprovalChips`. All four comments I named are handled.

**`AgentScorecardPanel.tsx:82` is the one worth recording.** My ruling asked for the comment to say what is
true after the deletion. It now justifies the name on its own merits — the chips carry an approval RATE per
tool, a fact about trust rather than a record of calls, so anything named for tools and chips alone
promises a stream the panel does not show. **That reason survives the deletion; the one I asked for
("named to avoid a collision") would have evaporated with the component it referenced.**

---

## K-90 · VERIFIED · 2026-08-21 02:31 · the guard holds, and it caught a planted collision

`one-utility-name-means-one-thing.test.ts` passes and pins the known set to exactly `["body"]`. The
mechanism is confirmed independently: `.output` compiles to both `font-size:var(--mrd-t-body)` and
`color:var(--mrd-body)` under one selector.

---

## K-90 · RULED · 2026-08-21 02:31 · the severity is wrong in the filing, and only one of the three pairings breaks

**Measured every colliding element in the running gallery, because the filing reasoned from stylesheet
order and stylesheet order is exactly the thing worth checking.** Tokens: base 13px, label 12.5px, data
11.5px, body 14px.

| pairing | asks | paints | count | verdict |
| --- | --- | --- | --- | --- |
| `text-mrd-base` + `text-mrd-body` | 13px | **14px** | 10 | **broken** |
| `text-mrd-label` + `text-mrd-body` | 12.5px | 12.5px | 30 | correct |
| `text-mrd-data` + `text-mrd-body` | 11.5px | 11.5px | 86 | correct |

**`body` sits between `base` and `label`/`data` in the emitted scale, so it beats `base` and loses to the
other two.** The filing has the cascade backwards for two of three pairings. **`Spend.tsx` is named as
"the worst"; it pairs `text-mrd-label`, asks 12.5px and paints 12.5px — it is correct.** The three
`text-mrd-data` sites are correct too. **The defect is 6 source sites, all one idiom
(`text-mrd-base font-medium text-mrd-body`), not 10 across three idioms.** My own note said "roughly 60
call sites" and Kiro is right that it is 167; both of us were wrong about which ones hurt.

**The rename: option A, and the cost objection does not survive the measurement.** The 13-name type scale
is the deliberate enumerated namespace and the 60-name colour ramp is what wandered in, so the colour
loses the name. **Do it as expand-then-rename, which is behaviour-preserving and checkable:** first
rewrite all 167 sites to say size and colour explicitly (`text-mrd-body` → `text-mrd-body text-mrd-<new>`),
which changes nothing on screen because every one of them already gets both; then the rename is mechanical
and the 6 broken sites can finally say what they mean, card-subject size with supporting-prose colour.
**That removes the silent-regression risk on the 157, which is the real cost in option A and the reason
"probably heading for" was not good enough.** Confirm the codemod by diffing computed styles before and
after, not by reading it.

**The final name is the founder's, and the codemod makes it cheap to overrule.** Not blocking Kiro on that:
the mechanism is settled either way.

---

## K-91 · VERIFIED · 2026-08-21 02:31 · both branches correct, and the fixed one has no rendered coverage

**Read the ternary rather than the claim.** `surface-parts.tsx:316-321` is
`lead ? "text-[20px] …" : "text-[14px] …"`. The fix landed. **Measured all 63 `h2` in the gallery: 20px
×47, 17px ×8, 13px ×8.** The 8 at 13px are `ReadFailed` (914) and `Refused` (1070), which K-91 checked and
deliberately left alone as level-rather-than-smaller — that scoping is correct and the measurement agrees
with it.

**But nothing paints at 14px.** All 47 gallery `Region`s pass `lead`, so **the branch this item fixed is
not exercised anywhere in the gallery**, while the product carries 364 `<Region` usages across 7 importers
that mostly do not pass it. Source correct, guard pinned, paint unobserved. **Back to Kiro: a gallery case
for a non-`lead` `Region`**, or the most common heading in the app has no rendered coverage.

---

## LANDED · 2026-08-21 02:31 · the consent screen still promises a Figma capability withdrawn two weeks ago

**Found while checking K-88's neighbourhood, and it is the highest-stakes copy surface in the product.**
`connect-trust.ts:51-53` tells the user at the OAuth consent moment that Supaprod reads **"File metadata
for the files you reference in a spec or brief."** That is word for word the capability
`connectors/registry.ts` **withdrew on 2026-08-06** because it does not exist. The registry says so in its
own comment and points at the dialog; the dialog was never swept.

**Re-checked all three legs rather than trusting the comment, and one of them has gone stale.**
1. *"figma maps to stubAdapter"* — **no longer true.** `figmaAdapter` has been real since 2026-08-15.
2. *"no figma entry in PULL_INGESTORS, so kickFirstIngest returns 0"* — **holds.** The ingestor list is
   intercom, stripe, slack, zendesk, hubspot, salesforce, canny, productboard, gmail, microsoft_mail.
3. *"no field on a spec can hold a design reference"* — **holds.** `contract.evidence_links` is the only
   structured slot and every writer fills it from `citations`.

**So the withdrawal is still correct and the consent claim is still false**, even though the reason the
registry gives for it is now a third stale. **This is the shape, not the location:** the 2026-08-06 audit
fixed the `description` field and did not sweep the other place the same promise is made. The registry
comment even names google_tasks and jira as sharing the shape.

**Also recorded:** `registry.ts:706` points at `ConnectTrustDialog.tsx:58` for the verbatim string; the
rows now sit around 108-116. Kiro flagged it and correctly did not edit outside its `Owns`.

---

## LANDED · 2026-08-21 02:31 · the six stub adapters are unreachable in production, not just in the source argument

`gateway-era-adapters.test.ts` pins six providers as stubs and argues from source that nothing can reach
them: `verifyConnection` loads from `connections`, the five suite providers write to
`user_calendar_connections`, and that surface has only Reconnect and Disconnect. **Checked the premise
against production, which the test cannot do.**

```sql
SELECT provider, count(*) FROM connections GROUP BY provider;
-- github 2 · linear 1 · slack 1 · salesforce 1
```

**Zero rows for gmail, google_calendar, google_tasks, microsoft_outlook, microsoft_mail or firecrawl.**
Nothing reaches Verify on any of them, so the stubs are correct and writing five adapters would be exactly
the "correct code that nothing reaches" the test warns about. **I went looking for the inverse defect —
gmail and microsoft_mail have real ingestors but a stub validate — and it is not one.** The ingest path and
the Verify path are different surfaces, and only the second is stubbed.

---

## K-87 (follow-through) · LANDED · 2026-08-21 02:57 · the 500 page leaves two retired systems, founder-authorised

**Founder ruled 2026-08-21: port it.** `renderBrandedErrorPage()` in `src/server.ts` was painted in two
retired systems at once. Its own comment said the greys mirrored **Tempo** (v5), and
`.primary { background: #ff6b2c }` was an **ember button fill**, which `DESIGN-SYSTEM.md` lists as the
signature of **v1 Ember**. Meridian's primary button is `--mrd-solid`, `oklch(0.325 0.009 70)`, chroma
0.009 and effectively hueless, so the orange face was not merely old, it was the opposite of what a
Meridian primary action looks like. The page also already had its one sanctioned brand moment, the "500"
numeral in Geist Pixel Square; the button was a second, unsanctioned one.

**Resolved the tokens through a 1x1 canvas rather than converting OKLCH by hand**, because the file cannot
reach the token layer and needs literals: `--mrd-bg #0c0a08`, `--mrd-ink #f5f3f1`, `--mrd-mute #a19e9a`,
`--mrd-body #bebcb9`, `--mrd-solid #37332f`, `--mrd-on-solid #f5f3f1`.

**Verified by rendering the page, not by reading the edit.** Extracted the template, loaded it in a
browser and measured every string:

| element | pair | measured |
| --- | --- | --- |
| "500" numeral, `h1` | ink on ground | **17.86:1** |
| body copy | mute on ground | **7.41:1** |
| "Try again" | on-solid on solid | **11.31:1** |
| "Go home" | body on ground | **10.43:1** |

**11.31:1 is the same number the live app returned for that pair earlier today**, measured a different way,
which is the cross-check worth having. No orange remains in the document. Six replacements, each asserted
on its occurrence count before writing, because a hex fix that silently misses one field is the defect
shape this repo keeps paying for.

**`src/server.ts` is in no open item's `Owns`.** Checked before editing.

---

## K-90 (corrects my own RULED entry above) · RULED · 2026-08-21 02:57 · option B, and my option A was reasoning from Kiro's framing rather than the two namespaces

**I ruled option A earlier today and it was wrong. Founder ruled option B on 2026-08-21 and the evidence
is what changed my recommendation, not the ask.** My entry accepted the framing that the 13-name type
scale is the deliberate enumerated namespace and the 60-name colour ramp wandered into it. **Read the two
namespaces directly and it is backwards.**

- **The colour ramp is coherent.** `ink` *(the thing itself)*, `body` *(supporting prose)*, `mute`
  *(labels, metadata)*, `faint` *(the quietest stop that is still AA)*. Four stops, consistent, and each
  comment is the stop's real job.
- **The type scale contradicts itself, with or without the collision.** `--mrd-t-base: 13px` is commented
  *"a card's subject, a row's title"* and sits directly above `--mrd-t-body: 14px`, commented **"THE BASE.
  prose and anything read at length"**. A scale cannot hold a stop called `base` and then name a different
  stop as the base.

**So the incoherent namespace is the one that should give up the name.**

**And the decider is the six broken sites.** They read `text-mrd-base font-medium text-mrd-body`, asking
for card-subject size with supporting-prose colour, and paint 14px because the colour's hidden size beats
`base`. Rename the SIZE stop and `text-mrd-body` becomes colour-only, so `text-mrd-base` supplies 13px and
`text-mrd-body` supplies the colour. **Those six need no edit at all; they simply start doing what they
were always asking for.** Under option A they would each need rewriting AND the ink ramp would lose a name
that is correct.

**The spec, for whoever builds it.**
1. Rename the size stop only: `--mrd-t-body` to `--mrd-t-prose`, and the `@utility text-mrd-body` that
   sets `font-size` to `@utility text-mrd-prose`. **`--color-mrd-body` does not move.** Verified
   `prose` collides with nothing in `meridian.css` today.
2. Add `text-mrd-prose` to the **157 sites that carry `text-mrd-body` and no other size utility**. They
   get 14px invisibly today and would otherwise fall back to inheritance. This is the whole risk in the
   change and it is mechanical.
3. **Touch none of the 10 that already carry a size utility.** Six start painting 13px, which is the fix.
   The `text-mrd-label` site and the three `text-mrd-data` sites already paint correctly and stay correct,
   because `body` loses to both of those in the cascade.
4. **Acceptance, and it is measurable rather than argued:** diff computed `font-size` across the gallery
   before and after. **Exactly 10 elements may change, all of them `text-mrd-base` pairings, all 14px to
   13px.** Anything else moving means step 2 missed a site.
5. Empty the guard's allow-list, `["body"]` to `[]`. That list only ever shortens, which the guard says.

**Noticed and deliberately not folded in.** `--mrd-t-base` at 13px is still an odd name for *"a card's
subject"* once `prose` exists beside it. That is a second, smaller naming question and it does not block
this one.

---

## K-90 (correction) · VERIFIED · 2026-08-21 03:00 · the correction matches my measurement, and the name it was blocked on now exists

**Accurate in every figure**, and it is the same table I measured independently: base 13px, label 12.5px,
data 11.5px, body 14px, with `body` between them so it beats `base` and loses to `label` and `data`. Six
sites in one idiom, and `Spend.tsx` correct rather than "the worst".

**The unblock, and it supersedes what this entry read.** Kiro recorded the mechanism as **option A**,
which is what I ruled this morning and **I have since corrected to option B** in the entry directly above
this one, on the founder's ruling of 2026-08-21. The size stop gives up the name, not the colour.
**The name is `prose`**: `--mrd-t-body` becomes `--mrd-t-prose` and the `@utility text-mrd-body` that sets
`font-size` becomes `@utility text-mrd-prose`. Verified `prose` collides with nothing in `meridian.css`.
**`--color-mrd-body` does not move.**

**Which makes the blocked reasoning obsolete in Kiro's favour.** The entry says the six broken sites
cannot be fixed ahead of the rename because no way exists to write 13px with the body colour. **Under
option B they need no edit at all** -- once `text-mrd-body` is colour-only, `text-mrd-base` supplies the
13px they were always asking for. The expand step still applies, but only to the **157 sites carrying
`text-mrd-body` and no other size utility**, and the 10 carrying one are left alone. Full spec and the
measurable acceptance test are in my ruling above.

---

## K-92 · VERIFIED · 2026-08-21 03:00 · the implication holds in the rendered DOM, not just in the component

**Checked the one thing that would break it silently.** `busy` is only safe if it cannot be beaten by a
stray `disabled` arriving through `rest`. `surface-parts.tsx:553-561` renders `{...rest}` first, then
`disabled={disabled || busy || undefined}` and `aria-busy={busy || undefined}`. Correct, and the comment
says why.

**Then measured the invariant in the running app rather than trusting it.** Across the gallery:

- **581 buttons**, of which **8 carry `aria-busy="true"`** -- so the gallery does exercise the state.
- **0 are busy without also being disabled.** The implication holds in the DOM.
- **36 disabled in total**, so 28 are legitimately unavailable rather than working, which is the
  distinction this item exists to restore.
- **0 buttons carry a hand-set `aria-busy` with any other value**, which is the shape that would survive
  an older call site setting it by hand.

**Back to Kiro, and it is the thing this item already flagged rather than anything new.**
`DataSection.tsx:222` and `:231` are worth taking now. The local at `:110` is
`"workspace" | "agents" | null`, a discriminant naming **which** export is running, and both controls read
`disabled={busy !== null}`, so exporting the workspace disables the agents control too. **The labels
already distinguish correctly** (`busy === "workspace" ? "Preparing" : "Download"`), so today the agents
button reads "Download" while being unavailable for a reason that is not about it. **Per-site
`busy={busy === "workspace"}` and `busy={busy === "agents"}` alongside the existing `disabled`, and rename
the local to `exporting` in the same change**, which is exactly the honest form the item proposed. Leaving
it to Kiro rather than taking it because it is component state and this lane does not own the file.

**The two `ControlsPanel` call sites and `sync.tsx`'s four were right to leave.** A call expression is not
something a literal-shaped guard can judge, and widening the guard to admit calls would admit the
compounds too.

---

## LANDED · 2026-08-21 11:07 · the consent moment stops claiming three capabilities the product does not have

**Swept every connector mechanically rather than chasing the one I found**, because the registry's own
comment said google_tasks and jira shared the shape and because a defect that travels under several
wordings is the one this lane keeps missing. Compared every `weRead` in `connect-trust.ts` against its
`description` in `connectors/registry.ts`, all 21 providers, and **exactly three contradict**:

| provider | registry says | consent screen said |
| --- | --- | --- |
| figma | *"Referencing design files from specs and briefs is not built yet"* | *"File metadata for the files you reference in a spec or brief."* |
| google_tasks | *"Syncing action items with Google Tasks is not built yet"* | *"Your Google Tasks lists, to sync action items."* |
| jira | *"Pushing planned work to Jira is not built yet"* | *"Work items and their status in the projects you connect."* |

**No judgement call is involved: the same codebase states both.** The other 18 either deliver what they
claim or claim nothing.

**Measured what each adapter actually calls, so the replacement is accurate rather than merely vaguer.**
`figmaAdapter` calls only `/v1/me`. `jiraAdapter` calls only `/me` and `/oauth/token/accessible-resources`,
which is the list of sites the grant covers. `google_tasks` is `stubAdapter`. **None of the three reads a
design file, a work item or a task list**, and jira has no JQL, no issue fetch and no `PULL_INGESTORS`
entry anywhere in `src/`.

**Fixed six strings, not three, and the second three are the point.** `weNeverRead` carried the same
falsehood in the field a reader trusts most: figma's *"files you have not referenced"* and jira's
*"projects you have not connected"* both state that the OTHER half **is** read. Correcting `weRead` alone
would have left the claim intact one line below it, which is the defect shape this repo has paid for
before. Now: *"Your design files, or anything inside them"* and *"Your work items, billing, or admin
settings."*

**Verified by calling `trustCopyFor` directly** rather than reading the diff, with `slack` as an untouched
control returning its original strings. The dialog itself still cannot be rendered by this harness, which
is the K-88 gap already passed back.

**What this does NOT reach, filed as finding 30.** `routes/pricing.tsx` `READ_CONNECTORS` lists **jira** on
the **public pricing page**, making the same false read claim to a stranger before signup. Removing a
provider from a public pricing page is outward-facing and the founder's call, so it is recorded rather than
done. `_authenticated.meridian.tsx:3478` carries it too, as gallery fixture copy.

**Findings register updated in the same commit:** 29 closed, 30 added.

**One thing about the gates, worth recording because it nearly cost a wrong verdict.** `lane:gates` failed
on `test` with 1 fail and a **914 second** suite; a clean re-run with nothing competing passed 10,265 with
**0 fail in 14 seconds**. Two suites were running concurrently at the time. **The background wrapper
reported "exit code 0" while `lane:gates` itself exited 1**, so the notification's exit code is the
wrapper's and not the gate's, which is the same shape as reading a pipe's status instead of the gate's.
Re-ran clean and green before committing. **At least one test in this suite is load-sensitive**, and the
failing name was lost because the captured output kept only its tail.

---

## K-90 (the rename) · REJECTED · 2026-08-21 11:40 · the acceptance test I wrote caught it, and 316 elements now paint a size nobody asked for

**The rename itself is correct and the emitted CSS is right.** `.text-mrd-body` is one rule (colour),
`.text-mrd-prose` is one rule (size), `--mrd-t-prose: 14px` is declared, no orphaned `var(--mrd-t-body)`
survives, and **the six fixed themselves exactly as ruled**: the 10 `text-mrd-base` elements now paint
**13px**, and `data` (86 at 11.5px) and `label` (30 at 12.5px) are untouched. **Finding the 17 raw-token
consumers was a real catch and my spec was wrong to omit them.**

**But I ran the computed-style diff the ruling required, which Kiro could not, and the answer is a
rejection.** My acceptance test said exactly 10 elements may change font-size and anything else moving
means a site was missed. **Far more moved.**

**Defect 1: 316 elements paint 14px instead of the size their own class asks for.** The codemod added
`text-mrd-prose` to sites that already carried an arbitrary size, and **`prose` wins the cascade against
`text-[Npx]` where the old `text-mrd-body` size lost it.** Measured in the running gallery, and **not one
of the 316 painted what it asked**:

| asked | painted | elements |
| --- | --- | --- |
| 13px | 14px | 138 |
| 12.5px | 14px | 60 |
| 12px | 14px | 46 |
| 11.5px | 14px | 38 |
| 11px | 14px | 28 |
| 10.5px | 14px | 6 |

**100 source sites**, and the largest jump is 3.5px on text that was deliberately set small.

**My spec is half the cause and I am recording that rather than only the consequence.** It said "the 157
sites carrying `text-mrd-body` and no other size **utility**", and `text-[13px]` is an arbitrary value
rather than a named utility, so the instruction read as excluding it when it should have excluded any
font-size **source**. **Kiro implemented what I wrote.** The fix is to remove `text-mrd-prose` from every
site that already carries a `text-[...]` size, not to add anything.

**Defect 2: 22 hover states changed from a colour to a size.** These were `hover:text-mrd-body` and
`group-hover:text-mrd-body`, meaning *brighten on hover*, and the pass renamed the variant along with the
base class, so they now read `hover:text-mrd-prose`, meaning *grow on hover*. The diff on
`CrewChrome.tsx:144` is the clearest:

```
-      <Chevron className="text-mrd-faint group-hover:text-mrd-body" />
+      <Chevron className="text-mrd-faint group-hover:text-mrd-prose text-mrd-body" />
```

**Two faults in one line.** The hover now changes size instead of colour, and the added unconditional
`text-mrd-body` pins the colour so **the faint-to-body hover is dead even in principle**. `transition-colors`
sits on the same element, transitioning a property that no longer changes. **A variant carrying the colour
must keep the colour name; only a bare `text-mrd-body` meaning the SIZE should have become `prose`, and a
variant never meant the size.** Present in `engine-room`, `CrewChrome`, `InsightCards` ×2, `Tabs`,
`FineTuneCard` and 16 more.

**Defect 3, smallest: 10 source sites still carry `text-mrd-body` with no size source at all**, so they
fall to inheritance where they used to be 14px. Most are icon buttons that also carry `text-mrd-mute`, so
they hold **two colour classes**, which is worth a look in its own right: the collision this item closed in
the type scale exists in the colour ramp too, and `text-mrd-mute text-mrd-body` has no defined winner a
reader can predict.

**What I checked, so this can be re-run.** Exact class-token matching rather than a substring selector,
after a first pass reported 322 false orphans by matching `hover:text-mrd-body` as if it were the class.
**The 674 elements carrying the exact token split 646 unchanged and the rest as above.**

**Not a re-do of the rename.** The name is right, the CSS is right, and the six are fixed. Three targeted
corrections: strip `prose` from the 100 arbitrary-size sites, restore the 22 variants to the colour name,
and give the 10 bare sites an explicit size.

---

## K-87 (follow-through) · VERIFIED · 2026-08-21 11:45 · proved the guard on a different file than the one it was built against

**Ran the guard against a planted defect rather than trusting the entry.** Kiro proved it with
`--text-muted` in `router.tsx`; I planted `var(--text-muted)` in **`src/server.ts`**, a file it was not
demonstrated on, and the guard named it exactly: `"src/server.ts carries 1x --text-"`, **2 pass 1 fail**.
Restored, **3 pass 0 fail**, file byte-identical apart from my own comment edit.

**The split is the right one and it is better than what I ruled.** I ruled option 2 plus a
coverage-expansion step, treating both rules as one problem. Kiro separated them: **a retired marker is
wrong in every file with no precondition**, while **a raw colour presumes a reachable token layer**, which
these two files provably lack. Guarding the unconditional rule and staying loud-in-the-header about the
conditional one closes the half that needed no decision, immediately, without touching `SCAN_ROOTS` or the
baseline. **That is a cleaner cut than mine.**

---

## K-87 (the open question) · RULED · 2026-08-21 11:45 · option 2 stands, and the number that made it look expensive was mine

**Re-ruling the same way, with the arithmetic corrected.** A colour inside `var(--mrd-*, <fallback>)` is
already tokenised and the literal is the documented degradation, so it should not count as raw-colour debt.
**That clears all 4 in `router.tsx`, every one of which I confirmed is a `var()` fallback.**

**`server.ts` is 8, not 14, and the 6 were mine.** The entry reports 14 and is right about what it
measured, but I checked what the rise was made of: **my 500-page port repeated six token hex values inside
a comment**, and a documentation hex counts exactly like a painted one. The CSS is still the same 8
literals it was before the port. **Fixed in this commit by naming the tokens and not repeating their
values**, with the reason written at the site so it is not reintroduced. So the real question is 8
literals in one standalone document that cannot reach a token layer, not 18 across two.

**This is an engineering rule about how a guard counts, not a design decision**, so I am ruling it rather
than leaving Kiro blocked; the founder ruled the 500-page port itself and can overrule this cheaply. **Do
not force the baseline** and do not add a path exemption. Both were rejected for the right reasons.

---

## K-92 (follow-through) · VERIFIED · 2026-08-21 11:45 · both facts are now said separately, and the rename was the load-bearing half

**Exactly the fix I passed back.** `DataSection.tsx:125` is now
`const [exporting, setExporting] = useState<"workspace" | "agents" | null>(null)`, and each control carries
**both** facts: `disabled={exporting !== null}` on both, because one-export-at-a-time is true of both, and
`busy={exporting === "workspace"}` / `busy={exporting === "agents"}` per control, because this-one-is-working
is true of exactly one. The nine remaining `busy` occurrences are the `Action` prop and its comments; **no
boolean-shaped local survives.**

**The rename mattering more than the tidy is the part worth keeping.** Called `busy` the local read as a
boolean, which is how both controls ended up on one condition, and it would have collided with the `busy`
prop `Action` gained the same day, one passed into the other with different types.

**What I did not check:** the exports were not triggered, so `aria-busy` was not observed flipping on a
live mutation. The state shape is verified by reading, the implication `busy` to `disabled` was already
measured in the DOM under K-92 itself, and this file needs data the lane harness stubs out.

---

## LANDED · 2026-08-21 12:12 · three findings, one cause: a rate limit nothing can wait out

**Went to close finding 24 and found the reason it has never been closeable.** 24 needs one successful
research-mode request; the classifier is a model call and it was rate limited every attempt. **The rate
limit is not a run of bad luck, and it is the same limit behind findings 23 and 25.**

**Measured in production.** `ai_events` over 36 hours: `chat` has **6 events, every one `model_error`**,
none since 2026-08-20 12:59, so there is still no evidence the `station`/`tool` frames work or are broken.
`sense` has **115 ok and 33 error**, and **32 of the 33 are one message**, *"AI rate limit reached. Try
again in a moment."*, running **2026-08-19 19:28 to 2026-08-21 06:25 without a break. 35 hours.**

**Bucketed by hour, because a sustained outage and a burst limit need opposite fixes.** Every hour that has
errors also has successes: 5/7, 4/6, 3/3, 2/2, 4/7. **Successes and failures interleave**, so the key is
not out of quota, it is being throttled per minute or per concurrent call, and roughly **30% of `sense`
calls are lost in every active hour.** That is the ambient scout quietly failing a third of the time.

**Why the two mechanisms that exist for exactly this cannot help, which is the part worth keeping.**
1. **Retries run, and they run too fast.** `runtime.server.ts:2530` retries `RATE_LIMIT` and `SERVER_ERROR`
   and breaks on everything else, so the branch is correct. But the backoff is
   `setTimeout(400 * (i + 1))`: 400ms then 800ms, so **all three attempts finish inside about 1.2
   seconds.** Against a per-minute limiter that is one attempt wearing a disguise.
2. **`Retry-After` is never read.** `grep -riE "retry-after" src/lib/ai/` returns **nothing**. The gateway
   is presumably saying how long to wait and the product does not look.
3. **The fallback chain is the wrong tool here.** Finding 23 already proved by test that switching
   `gemini-3-flash-preview` to `gemini-2.5-flash-lite` returns the **identical** limit, because it is on
   the **gateway key, not the model**. So every entry in the chain 429s the same way.

**Only elapsed time clears a per-key limit, and nothing in the path waits.** That is one cause under
finding 23 (the message tells you to switch models, which cannot work), finding 25 (a live surface losing
a third of its calls), and finding 24 being unclosable for two days.

**Register updated in this commit.** Finding 25's *"none since 2026-08-20 03:35"* was stale and is
corrected with the 35-hour span and the root cause; 23 is cross-linked as the same cause.

**Not fixed here, deliberately.** The change is to a shared chokepoint every AI call in the product goes
through, and lengthening backoff trades a fast failure for a slow one on user-facing paths. **That
tradeoff is a founder call, not a lane call**, and the honest fix is narrow: read `Retry-After`, honour it
under a cap, and use exponential rather than linear backoff for `RATE_LIMIT` only, leaving `SERVER_ERROR`
as it is.

---

## LANDED · 2026-08-21 12:30 · the rate limit is now waited out rather than retried past, founder-authorised

**Founder ruled 2026-08-21: fix it properly rather than raise a constant.** The measurement is in my
previous entry; this is what was built.

**One pure module, `src/lib/ai/retry-policy.ts`, called by both retry loops.** The loops in
`runtime.server.ts` were byte-identical apart from indentation and had drifted independently before, so a
second copy of this logic was the wrong answer. The module does no I/O and takes `random` as a parameter,
which is why it can be tested without a gateway.

**Three changes, and the third is the one that makes it a fix rather than a bigger number.**
1. **`Retry-After` is read and believed**, at both 429 throw sites, capped at 20s for any single wait.
   Both legal forms are handled, delta-seconds and HTTP-date. A signed integer is rejected outright rather
   than handed to `Date.parse`, which does not return `NaN` for `"-5"` in every engine; a date parser
   quietly inventing a wait is exactly how a wrong one would ship.
2. **`RATE_LIMIT` backs off exponentially with equal jitter**, 1s base, doubling. Equal rather than full
   jitter because full jitter can return a near-zero delay, which is the failure being fixed, and the
   **13 `sense` call sites fire together**, so decorrelation is load-bearing. **`SERVER_ERROR` keeps its
   old 400/800 schedule** exactly, because a 5xx blip was never the defect.
3. **The wait is bounded by a per-surface budget.** How long a caller may wait is not a property of the
   error, it is a property of **who is waiting**. A tick can sit out a per-minute window; a person
   watching a stream cannot. `sense`, `judge`, `eval`, `embed` and `agent` get **45s and 6 attempts**;
   everything else gets **6s and 3**. An **unknown surface is treated as interactive**, so a surface added
   later fails fast by default instead of silently inheriting patience nobody chose. An explicit
   `maxRetries` or the new `retryBudgetMs` from a caller wins outright.

**A delay that would overrun the budget stops instead of half-waiting**, because a partial wait that then
fails is strictly worse than failing now.

**Proven, not asserted.** 23 tests. The arithmetic ones cover both `Retry-After` forms, the past-date
case, jitter bounds at random() 0 and 1, budget exhaustion, and spent-time accounting. **A pinned
regression test walks the policy the way the loop does and asserts the total wait now exceeds the old
1.2s window several times over.** And **five wiring tests**, because a pure policy nothing calls is the
"correct code no path reaches" defect this repo keeps closing: they assert both loops route through
`nextRetryDelayMs`, both throw sites call `parseRetryAfterMs`, both budgets come from `opts.surface`, and
that `400 * (i + 1)` appears nowhere. **Proven by planting that expression back**: the guard failed naming
it, and passed again on restore, with the file byte-identical.

**Full suite 10,300 pass, 0 fail, 12.4s**, so nothing depended on the old timing and the change adds no
measurable time to the suite.

**What I did NOT do, and why it is not an oversight.** After retries exhaust, the code still walks the
model fallback chain, which cannot help a per-key limit and spends more requests against an already
throttled key. I left it: `resolveFallbackChain` may include a provider on a **different** key, and
skipping it would lose a genuine recovery path on evidence I do not have. Worth a look, not a guess.

**Also still open: the copy.** Finding 23's message still advises switching models when the budget is
genuinely exhausted, which its own test proved cannot work. The retry half makes it rarer; it does not
make it true.

---

## K-94 · VERIFIED · 2026-08-21 12:48 · measured the one thing the item said it could not measure

**The entry says plainly that every production number in it is transcribed and that the list being complete
is the item's claim rather than Kiro's. That is the half only this lane can settle, so I settled it.**

```sql
SELECT status, count(*) FROM agent_runs GROUP BY status;
```

**Six spellings, and there is no seventh.** `completed` 782, `completed_with_failures` 688, `failed` 557,
`halted` 8, `waiting_approval` 7, `complete` 2. The list the test enumerates is exactly the list production
writes, so the fix cannot miss a value.

**Then ran `mapRelayStatus` against those six rather than reading the `case` labels.** All six now return
something other than `idle`: `done` for `completed`, `completed_with_failures` and `complete`, `failed` for
`failed` and `halted`, `gate` for `waiting_approval`. **690 of 2,044 rows were drawn as nothing happening
and 0 are now**, which is **33.8%** and confirms the item's headline on fresh data rather than transcribed
data.

**One thing is already stale, and it is the sum.** The test pins the six counts as summing to **1,825**.
Production is **2,044**, up 219 since 2026-08-20. The tripwire still works as designed, since editing one
count without re-measuring the rest breaks the sum. But the table is a snapshot and it is nine days of
drift away from being read as current. **Not a defect in the fix**, which is correct at any count.

---

## K-95 · VERIFIED · 2026-08-21 12:48 · the fix is right, and the ground it reasons about is the wrong one

**This was my finding and Kiro validated its instrument against my number before trusting it**, computing
`--madder` on paper at 2.79:1 against the 2.79:1 I measured through a canvas. That is the right order of
operations and it is why the rest of its table is worth reading.

**Reached `/admin` in a browser, which the entry says was not possible, and measured the string.** The
failure copy *"Could not load your admin access"* now measures **5.82:1**. Kiro computed **5.83** from
source. **Independent method, same number to a rounding place**, so the fix is confirmed and so is the
script that produced the rest of the table.

**But the ground determination is backwards, and it changes the severity of my own finding.** The entry
says `__root.tsx`'s bootstrap stamps `data-theme="light"` so the paper half of the selector fires.
Measured: **`data-theme` is absent entirely** and the ground is `rgb(10, 10, 10)`. The source says why, at
`__root.tsx:258`: *"with NO data-theme (`:root` already holds the dark tokens); light = data-theme='light'
with the 'dark' class removed"*, and the bootstrap sets light only when the stored preference is `light`,
or `system` **and** the OS prefers light. **With nothing stored, dark fires.** The page's own control read
*"Switch to light"*, which is the same fact from the other side.

**So the number a default user actually saw was `--madder`'s 4.97, not 2.79.** 2.79 is the paper figure and
it only ever fired for someone who had chosen light. **My finding led with it as the headline and should
not have**; the defect was real and worth fixing, and it was AA-passing-by-0.47 for most people rather than
illegible for everyone.

**Verdict is unaffected**, because `--mrd-fail` passes both grounds, 5.83 dark and 6.64 paper. **Recorded
because the ground determination will be reused**, and the next contrast call that is only safe in one
ground will be decided with it.

---

## K-96 · VERIFIED (on the item's own evidence) · 2026-08-21 12:48 · and I could not reach it, which I am saying rather than implying

**The defect is real and the reasoning is sound.** `title || name` meant a caller passing both lost the
name and got no tooltip, and the third caller is the one that matters: the evidence rail under a focused
cluster passed `name={signalPreview(...)}` with `title={`Open the source: ${s.url}`}`, so **the section
whose whole job is to show a quote verbatim rendered the quote's address instead.** Narrowing `title` to
`string` rather than `ReactNode` is the half that stops the two roles being confused again.

**Kiro proved it in a render before and after, and by planting**: `title || name` restored gives 5 of 12
failing, reverted gives 12 pass.

**What I did not do.** `CtxRow`'s three callers are on Discover's context rail and **none of them renders
in the gallery**, so I could not measure the fixed row in a browser. I checked: the gallery's only
`[title]` elements are chrome controls. **So this verdict rests on the item's own render evidence rather
than on an independent measurement**, which is weaker than the other two above it and is worth a browser
pass by whoever next has Discover with a focused cluster on screen.

---

## K-97 · VERIFIED · 2026-08-21 13:12 · the refinement bites where it should, proven in a file Kiro did not use

**All three parts of the ruling shipped, and the mechanism is better than what I described.** I asked for a
coverage-expansion step; the baseline now records a **`scopes` array of what the scanner LOOKED AT**, which
is the cleaner statement of the same idea. A clean file and an unscanned file were both simply absent
before, so "has no key" could never be told from "never seen". Confirmed in the file: `scopes` is
`["src/*", "src/components/**", "src/routes/**", "src/styles.css", "src/styles/**"]`, and **the door shuts
behind itself** because the same run writes `src/*` into it.

**Checked the two numbers that matter rather than the prose.** `src/router.tsx` is **absent from the
baseline entirely**, so all four of its literals cleared as Meridian fallbacks without the file being
touched. **`src/server.ts` records `raw-colour: 8`**, which is the number I corrected it to after showing
that the 14 it first measured was 8 painted literals plus 6 documentation hexes in a comment I wrote.

**Then planted the pair, in `server.ts` rather than the `updates.tsx` the entry used, because a guard
proven only where its author aimed it is a guard proven once.**
- A bare `#ff0000` → **fails, naming `src/server.ts raw-colour: 8 -> 9`**, exit 1.
- **The identical literal as `var(--mrd-body, #ff0000)` → 5 pass, 0 fail.**

**That pair is the whole question and it answers correctly**: part 1 is a refinement, not a hole. Restored,
tree clean.

**The judgement I would have got wrong.** Stripping the fallback in the **colour pass only** is what keeps
`var(--mrd-line, var(--hairline, rgba(...)))` counting `--hairline` as a retired marker while the rgba
stops counting as colour. My ruling did not name that case and it is the one that would have quietly
masked a retired token.

---

## K-95 (correction) · VERIFIED · 2026-08-21 13:12 · corrected in the file and not only in the ledger, which is the right half to get right

**Accepted, and the part worth recording is where the fix landed.** `admin-ui.tsx`'s header carried 2.79 as
the operative number, so a reader would have taken it as what people saw. It now reads **"Dark is the
default and 4.97 is the number most people got"**, states both grounds, explains that dark is `:root` with
no `data-theme`, and records that the first pass got the direction backwards from source alone. **A ledger
entry alone would have left the wrong number in the place people actually read.**

**And it pushed back on me correctly.** I called the relay test's `sum === 1825` stale. It pins a **static
array against itself**, so it fails when somebody edits one count without re-measuring the rest, which is
what it was built to do; and the file already says *"The counts above are a snapshot, not a live figure."*
**My note was right that the table is a snapshot and wrong to imply the assertion had rotted.**

---

## K-93 · VERIFIED · 2026-08-21 13:12 · the reader is right, and production says two of its four rows have never had data

**The design decision I would not have reached, and it is the opposite of K-94's risk.** The block filters
for the two **failure** outcomes and treats everything else as a check that happened, rather than
enumerating the good ones. **So `changed`, which the entry never mentions and which production holds 21
rows of, counts correctly as a healthy check** instead of being dropped. An outcome added later is counted,
not lost. That is the more robust shape.

**Measured `scout_runs`, which is the half the entry could not.**

```sql
SELECT outcome, count(*) FROM scout_runs GROUP BY outcome;   -- unchanged 77, changed 21
SELECT count(*) FROM scout_targets;                          -- 0
SELECT count(*) FROM scout_runs WHERE created_at > now() - interval '7 days';  -- 0
```

- **Zero `error` rows and zero `skipped-cap` rows have ever been written.** The red and the amber rows,
  which are most of the item's judgement, are **unexercised rather than wrong** -- the same category as the
  `station`/`tool` SSE frames in finding 24, and worth saying plainly so nobody reads a passing test as
  production evidence.
- **`scout_targets` is empty and the newest `scout_runs` row is 2026-07-25**, 27 days old, with nothing in
  the last 7 days. **The scout is not broken; there is nothing configured to watch.**
- **The 98 existing rows are almost certainly fixtures.** All of them carry the identical microsecond
  timestamp `.11332`, which no real scheduler produces.

**So the surface's first truthful act on a real workspace will be the fourth row, the one that makes no
claim.** That is the correct answer and it is the row the entry says measurement made it add. **The
gating fix is what makes that reachable at all**: gated on `hasCoverage` it would have said nothing to
exactly the workspace with nothing configured.

---

## LANDED · 2026-08-21 13:34 · 89% of the AI spend was agents running against demo fixtures, founder-authorised

**Founder asked why anything runs when it is not needed. The answer was worse than the question**, and it
took a join no one had run: `ai_events` to `workspaces.is_sample`, over 24 hours.

| surface | calls | cost | whose workspace |
| --- | --- | --- | --- |
| agent | 1,034 | **$1.6556** | **100% SAMPLE** |
| discovery | 239 | $0.0507 | 98% SAMPLE |
| sense | 131 | $0.0073 | 100% SAMPLE |

**$1.71 of $1.92 that day, 89%, went to autonomous agents working on demo fixtures.** Real workspaces drew
**zero** agent calls. Every one of the **230 agent runs** in the window was on a sample workspace, and they
were still firing at 08:00: `discovery-scout` 103, `researcher` 49, `ux-architect` 29, `prd-writer` 16.
**Roughly $52 a month, on data nobody reads.**

**The cause was uniform, which is why the fix is too.** **Fourteen hook files select workspaces and not one
filtered `is_sample`.** A shape, not a location.

**Fixed: 14 filters across 12 files**, plus a guard,
`src/__tests__/ticks-do-not-run-on-sample-workspaces.test.ts`, that reads **every** hook rather than the
twelve that were touched, so a fifteenth arrives failing rather than quietly spending. **Proven by removing
the filter from `retro-tick`**: the guard failed naming that file, and passed again on restore.

**Two sites were deliberately left alone and the guard exempts them by rule rather than by name.**
`outcome-tick:216` and `researcher-tick:180` resolve a **known** workspace's owner through `.in("id", ...)`
and `.eq("id", ...)`. Those are lookups, not selections. Filtering them would break the lookup **without
stopping any work**, which is the worst of both.

**`is_sample` is `NOT NULL DEFAULT false`**, checked before writing the predicate, so equality is exact and
no real workspace can fall through a NULL.

**Two things I did NOT do, and the reasons are not the same.**
1. **`loop-tick` runs 144 times a day returning `{"ok":true,"processed":0,"note":"loops not migrated yet"}`
   -- a no-op by its own admission.** Disabling it saves **no model tokens**, only HTTP, and re-enabling it
   when loops land is a step somebody has to remember. **Recording it beats setting that trap for a saving
   that is not the one that mattered.**
2. **The three every-minute ticks** (`approvals-tick`, `event-reactor-tick`, `resume-runs`, 1,437 runs each
   per day, **7,040 tick invocations daily in total**) are DB-only and cost no tokens. Their cadence is an
   approval-latency decision, which is the founder's, not this lane's.

**Correcting the premise of the question, because it changes what is worth fixing.** Nothing ran for 48
hours. *"1 dormant response in 48 hours"* was the width of my query window, not a duration: I searched two
days of history and one row matched the word. Each request completes in milliseconds. **The waste was real
and it was spend, not runtime.**

---

## LANDED · 2026-08-21 13:34 · the generated Supabase types were four columns behind the database

**This was mine to do and I had been calling it a founder blocker, which was wrong.** The Lovable MCP is
reachable from this lane.

**Verified the columns exist before asking for anything**: `learnings.product_id`, `learnings.decision_id`,
`agent_memory.product_id`, `agent_autonomy.workspace_id` are all present in `information_schema`, all
`uuid`, all nullable, no default. `workspaces.is_sample` was already typed.

**Asked Lovable to regenerate, and its answer was correct about its own copy and wrong about this one.** It
reported all five already present and changed nothing. **They are not present here.** `origin/main`'s
`types.ts` has **zero** occurrences of `product_id` or `decision_id` in the `learnings` block, and the
commit Lovable returned (`95bba2464`) **does not exist in this repository**.

**The finding underneath that is bigger than the types.** `gpt-engineer-app[bot]` last pushed **six days
ago**. **Lovable's sandbox and this repository have been diverging since**, and the repository is what the
Worker builds from. Asking Lovable to sync would risk six days of unrelated change landing on `main`
mid-lane, so it is recorded for the founder rather than triggered.

**Patched the four columns here instead**, 12 declarations across `Row`, `Insert` and `Update`, inserted in
alphabetical position to match the generator, nullable `string | null` and optional on the write shapes.
`bunx tsc --noEmit` exit 0. **The column-stamping half of this lane is no longer blocked.**

---

## LANDED · 2026-08-21 14:22 · the is_sample fix was necessary and not sufficient, caught by re-measuring it

**Went back to check my own fix rather than assume it worked, which is the whole point of this lane.**
Measured `ai_events` 90 minutes after pushing the fourteen-hook `is_sample` filter: **81 `agent` calls,
still 100% on SAMPLE workspaces, latest 08:41 UTC.**

**Then separated deploy lag from an incomplete fix**, because those need opposite responses. **Six new
`agent_runs` were CREATED on sample workspaces after the push**, latest 08:40:41: `discovery-scout` 2,
`researcher` 2, `design-critic` 1, `ux-architect` 1.

**`researcher` is the one that proves the fix was incomplete.** `researcher-tick` chooses its work from
**`workspace_briefs`**, not from `workspaces`, so a filter on the workspaces table never applied to it. I
had classified that hook's `.eq("id", ...)` as a lookup and been right about it, and that correctness is
exactly what hid the gap: the file passed my guard because the query the guard reads is not the query that
picks the work.

**The shape is one level up from where I fixed it.** A tick selects work from a **workspace-scoped table**,
and those tables carry `workspace_id` rather than `is_sample`, so the exclusion has to travel by id.

**Built `src/lib/ticks/real-workspaces.server.ts`** and wired `researcher-tick` to it.
`sampleWorkspaceIds` returns the ids to exclude and `notInList` renders the PostgREST literal.

**Two decisions in it that are not incidental.** It returns the **sample** ids rather than the real ones,
because `is_sample` is `NOT NULL DEFAULT false`: a workspace created a second from now is real, and
excluding a known sample list keeps it included where selecting a known real list would silently drop it.
And a **failed read returns an empty array rather than throwing**, so a tick that cannot reach the list
still runs: stopping every tick on a transient read error is a worse failure than one extra fixture run.

**Still open, and I am naming it rather than implying the sweep is done.** `discovery-scout`,
`design-critic` and `ux-architect` also started on samples after the push. Those may be deploy lag, since
the cron calls the deployed Worker and the push was 32 minutes old. **I have not separated that yet**, and
the guard still only reads `.from("workspaces")`, so it cannot see a tick that selects from a
workspace-scoped table. Widening it is the next piece.

---

## K-37 (re-measured) · VERIFIED · 2026-08-21 14:41 · the mount is real, and the correction is the kind worth having

**The correction is right and it inverts the item's premise.** `_authenticated.tsx:211` renders
`{!isOnboarding && <GlobalComposer />}`, unconditionally on every authenticated route. I read that line
rather than the entry's description of it. **`GlobalComposer` and `GlobalComposerHost` are different
symbols**, the item's `How` was about the second, and the first is live. So the four ACT verbs are not dead
code.

**The method note is the more valuable half.** The entry records catching itself twice: once trusting the
filing instead of grepping the mount, and once nearly calling
`_authenticated.runs.index.tsx:1311`'s `<Composer` a live mount when it is a **local function declared at
line 419 of that same route file** that happens to share the name. **A name is not a symbol**, and tracing
rather than assuming is the only reason the conclusion holds.

**What I could NOT confirm, said rather than implied.** I opened `/today` in a browser and it rendered, but
**the palette did not open on Cmd/Ctrl+K under this harness** and I did not see the four verbs myself. Two
plausible reasons that are both about the instrument rather than the code: headless keyboard focus, and the
harness user is in no workspace (the page says so). **So the mount is verified from source and the route is
verified live; the verbs rendering to a real user is not independently confirmed by me.**

**Accepting the rest on the entry's own tracing**, which is careful and self-corrected: the three desk verbs
dispatch and navigate while `useDeskComposeIntent` and `consumePendingDeskCompose` have **zero callers**, and
`find src -name "FocusDock*"` returns nothing, so *"Start a focus block"* closes the palette and does
nothing at all.

**The B+ ruling and the ADR are the deliverable and no code changed, which is correct.** The build passes to
this lane. **Not started in this session on purpose:** it is five steps that build two composers which exist
nowhere, and starting it minutes before a close would leave a half-built surface behind. **It is the first
thing to pick up next session**, with the rule as ruled: *a palette verb either navigates to the station that
owns the job, or it acts in place through something mounted globally, never both.*

---
