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
