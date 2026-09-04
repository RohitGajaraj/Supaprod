# S4-192 · Four numbers, four populations, and the instruction I gave was wrong

> _Created: 2026-09-01 · Last updated: 2026-09-01_

**2026-09-01. S3 measured the screen signed in; I traced the counts. Lane `lane/proof`.**

## What S3 measured on `/start`, signed in, one viewport

**The good half first, because it is real.** No scroll, no click: heading *"What
needs you"*, a tabbed queue reading **All 65 / Proposals 43 / Gates 16 / Memory
6**, the first item **named** — *"Batch firmware push to monitors already in the
field"*, waiting 53 days — with *"Why this needs your call"* spelled out, four
actions with keycaps, and *"Walk the queue · 63 more"*. **A count, a nameable
item, and the action, above the fold.** That is standing question 1 answered
well.

**And then four numbers for what looks like one question, no two equal:**

| on screen | value |
| --- | --- |
| `All` | **65** |
| `Waiting on you` | **93** |
| `Gates` | **16** |
| my `agent_approvals` read | **77** (9 on harbor's own workspace) |

S3's line is the one that matters: *"I could not reconcile them **with the
database open**. A reader has no chance at all."*

## The diagnosis: they are not four counts of one thing

`src/lib/approvals-queue.functions.ts` builds the queue as a **union across
fifteen distinct tables** — `prds` five times over, `approval_snoozes` twice,
plus `agent_approvals`, `decisions`, `opportunities`, `memory_candidates`,
`assumption_challenges`, `playbook_proposals`, `missions`, `assumptions`,
`tool_calls`, `agent_runs`, `projects` and `workspaces`.

So:

- **All 65** is a deduped union over up to fifteen populations.
- **Gates 16** is one facet of that union.
- **Waiting on you 93** is a different composition again — and it **prints its
  own inflation**: *"17 of these repeat others on this list, and 5 ask for work
  this board already shows as finished."*
- **`agent_approvals` 77** is **one contributing table**, not a rival total.

**These numbers were never comparable, and nothing on the screen says so.**
Reconciling them requires knowing a fifteen-table union definition that appears
nowhere on the surface. That is why a reader with the database open could not do
it.

**It sharpens S4-191 rather than repeating it.** That finding was uncoordinated
*loading* — eight `useQuery` calls with no shared idea of done. This is
uncoordinated **definitions**: every number is true of its own population, no
number says which population, and they are presented as siblings.

## The instruction I gave was wrong, and it cost S3 part of a unit

I asked S3 to *"cross-check any count against `agent_approvals` for the
`60000000` prefix."* **`agent_approvals` is one of fifteen sources.** A mismatch
was guaranteed by construction and means nothing on its own.

I did the thing this verdict is about: **I named a table as if it were the
population.** S3 carried out the check faithfully and got a number that could
not agree, and the failure to reconcile was designed into my instruction.

Measured on harbor's own workspace (`60000000-…`), the contributing sources are
`opportunities` backlog **67**, `prds` design-gate pending **32**,
`agent_approvals` undecided and unexpired **9**, `decisions` pending **8**,
`assumption_challenges` open **8**, `memory_candidates` pending **2**. **Nothing
sums to 65 or 93 without the dedup and eligibility rules**, which is the point:
the composition is the definition, and it is invisible.

## Three more S3 found, and one is a new variant

- **The 93 disowns itself and headlines the uncorrected total anyway.** The
  screen knows 22 of its items are noise and prints 93. **False composure with
  the volume up** — honest prose sitting under a number the prose has just
  disowned.
- **The oldest-item line cannot be sourced.** The list says *"The oldest has been
  waiting 44 days, and is not on this page"* beside a card reading *"Waiting 53
  days"*, and the oldest undecided approval is **38 days**. The 44 comes from
  neither.
- **`Board.tsx:2073` — the first variant where the sentence is not wrong.**
  *"Nothing has happened yet, so undo is free."* sits between the heading *"What
  needs you"* and the count *"All 65"*. **Read the comment before judging it:**
  the author meant *nothing has happened on this pending call*, which is a
  judgement no count can carry, and they were right. **The subject is elided, the
  nearest referent is the queue, and a stranger reads "there is nothing here"
  above 65 things that need them.** A true sentence made to read as its own
  contradiction by what it leaves out.

## Standing question 4, answered at last

**979 ms warm, in-app, to a readable count** — loading states cleared at 104 ms,
count painted at 925 ms, from the click on the rail's Work link. **Zero clicks to
see it, one to act on it.**

Cold load **9.3 s, upper bound only** and not usable: everything had settled
before the first observation could run, and it includes Vite's first compile,
which production does not pay. Both numbers **flatter** — localhost, warm dev
server, hot query cache. A real cold number needs an instrument that starts
inside the page at load.

## S3's instrument failed twice before the measurement was right

Worth more than the number it produced:

- The first probe searched `innerText` for *"Ready for your review"*. **It is an
  `aria-label`**, so it is not in `innerText` at all, and the probe reported the
  queue as never settling.
- The second matched the count beside *"Waiting on you"* with a regex that also
  matched *"Waiting 53 days"* and returned **53** for a group of **93**.

Both were caught only because the result disagreed with a screen S3 had already
read with their own eyes. **The accessibility tree, not `innerText`, is what
finally gave structured numbers** — and that belongs somewhere durable, because
`innerText` is the obvious tool and it is **silently blind to exactly what a
screen reader is meant to hear.**

## Not chased, and correctly not called

*"$0.83 spent on runs."* on the same screen against the billing page's **23,218
credits** debited this cycle. Different units, possibly different windows — so
S3 declined to call it a contradiction. **But nobody can convert one to the other
from the screens, and both claim to say what this has cost.** Open.
