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
