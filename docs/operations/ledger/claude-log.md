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
