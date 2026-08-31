# S4-188 · The component half asked the server half's question, and 17 of 45 rows were wrong

**Measured 2026-09-01. Lane `lane/proof`. Found by S1, sized and fixed here.**

## What S1 found

S1 traced two rows my gate reported and found **both reachable by a person
opening a route**:

```
src/routes/_authenticated.ship.tsx:248   imports { NoReleaseYet, WhatShipped }
WhatShipped                              renders <AssembledRelease>  at :1197
AssembledRelease                         renders <ReleaseDocument>   at :1151
```

The only thing importing either **across a file boundary** is
`WhatShipped.test.tsx`. So they are exported for their test and rendered
internally by a reachable parent.

The rule that produced it: the component half asked *"does another **file**
import this"*. That is exactly right for a server function — the server half's
own header says so, *"the function exists, runs, has tests sometimes, and cannot
be reached by anything a person opens"* — and **wrong for a component**, because
a component can be reached through its parent without any file importing it.

**S1 verified two and refused to guess at the size**, saying naming the class
was worth more than a number they had not measured. That was the right call and
it is why this is a change rather than a note.

## The size: 17 of 45. Thirty-eight percent

| | |
| --- | --- |
| component rows reported | 45 |
| used inside their own file (reachable if the file is) | **17** |
| not used in their own file either | 28 |

Both of S1's are in the 17. So are the four `Mock*`/`Station*` components in
`landing/replay/Replay.tsx`, three in `track/ArtifactPane.tsx`, and
`ShareControl` and `ReceiptDetail` in `trust/ReceiptDetailSheet.tsx`.

## And the tool already said so, in prose, and counted them anyway

This is the part worth keeping. The printout has carried this line since the
component half was written:

> THIS HALF IS NOISIER THAN THE SERVER HALF. A helper component that is exported
> but used only inside its own file counts here, which is a hygiene question
> rather than a screen nobody can reach.

**It warned, and then put them in the number.** That is this same file's own
lesson from the `React.lazy` fix, unlearned one section later — the lesson being
*"a list that has to travel with a verbal caveat is a list nobody can act on,
which is the whole point of the gate."* I wrote a caveat instead of a rule, and a
caveat in the output does not reach the count anybody quotes.

## The fix, and what it does NOT do

Self-used exports are **printed separately and not counted**. They are not
excused: an export nothing outside the file uses can usually go, and the test
can render through the parent. It is simply not the defect this number is about,
and mixing the two dilutes the one that is.

**Components 44 → 27 at the same commit.** Measured the same way as last time and
for the same reason: the **new** detector was run against the **baseline
commit's** tree, so both sides of the comparison are one instrument. Server
functions stayed at 140 there, which is the control — the change touched only
the half it was supposed to.

`_components_dropped_from_44` now sits beside `_components_dropped_from_80` in
the baseline. Two instrument changes in two days, both recorded, because anybody
comparing 80 to 44 to 27 across them is comparing nothing.

**The signal survives and is sharper.** The four newcomers are still named, and
`IconApprovals` and `IconRuns` are still orphans — they are not used in their own
file either, so the new rule does not reach them:

```
NEW SINCE THE BASELINE -- these are the ones to read:
  getSubjectEvidence  (src/lib/evidence.functions.ts)   [server function]
  getLineageCounts  (src/lib/lineage-graph.functions.ts)   [server function]
  IconApprovals  (src/components/shell/icons.tsx)   [component]
  IconRuns  (src/components/shell/icons.tsx)   [component]
```

## Mutation-proven, because a guard never made to fail is not evidence

Added `function __probe() { return <IconRuns />; }` to `icons.tsx`:

- orphans **28 → 27**, self-used **17 → 18**
- `IconRuns` appears exactly once, in the self-used section
- removing it again returns 28

So the rule moves the row in both directions on the same subject, and does not
move anything else.

## S1's question, answered: the export is not the smell worth churning for

S1 asked whether they should un-export theirs so the gate becomes right about
them, and deliberately did not, because *"churning working tests to satisfy a
rule that may itself want one line is the wrong order."*

**They were right and the rule wanted the line.** The gate exists to find what a
person cannot reach; `ReleaseDocument` is reachable, so the gate was wrong and
the code was not. Un-exporting would have made the number correct by damaging
the thing it measures — and §0.7 puts that near polish besides.
