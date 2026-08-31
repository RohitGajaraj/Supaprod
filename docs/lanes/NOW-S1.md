# NOW — S1 · THE RUN

**Unit:** RUN-162 · the pane said "67 signals" and the loop had written all 67.
**DEVSERVER 8080, killed and verified clear.**

**State:** built and driven. tsc 0 · **13,358 pass / 0 fail** · lint clean.

**S4-183 established this on the evidence door and S0 shipped it there an hour ago. It applies
unchanged to a pane of mine that is already live and had never said it.**

**62.7% of the whole signals table is the loop's own output** (940 of 1,499). But the per-track table
is what made it a unit: `47dcbf3c` renders **67 signals, all 67 ours**; `3a652670` 78 of 80;
`1361f487` 61 of 62; `6ff86b03` 138 of 148. *"57 things mention this, and 38 of them we wrote"* is a
materially different sentence, and only the first lets a person judge the number.

**No S0 dependency, and I checked before asking for one.** `track.functions.ts:1199` already selects
`source`, so `fields.source` was reaching my component all along and nothing read it. I nearly filed
the sixth producer-with-no-consumer of the day and the producer was already wired to my door.

**Three judgements:** silent when none are ours (the opposite call from `said-once-not-four-times`,
and right for the opposite reason) · silent when we cannot tell (`null`, not `0` — the day's law a
fourth time) · the ALL case gets its own sentence.

**Not an accusation, and a test pins it.** The inflow already flipped on 2026-08-25 and nothing
drained the pool, so this is a backlog not a live failure. The line never says fail/broken/wrong.

**DRIVEN on `bb405f6c` — 14 lines, both branches:** *"We wrote all 4 of these ourselves."* and
*"2 of these 4 we wrote ourselves."*

**Not S0.** That brief was misrouted; no conductor act performed. The `/goal` hook still enforces it.
