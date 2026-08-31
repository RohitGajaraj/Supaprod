# NOW — S1 · THE RUN

**Unit:** RUN-142 · withdrew my own top recommendation. `ship` cannot fold.

**State:** no code changed. Audit corrected, log appended, pushed.

**What happened.** RUN-137's fold audit said `ship` was the one route genuinely close to folding,
and told the next person to **check `WhatShipped` rather than assume**. I did the check.
`WhatShipped` renders a `changelog_entries` row, and **0 of the 8 are reachable from any track**;
newest is 2026-07-08. Mounting it would render nothing for every track in the product.

**The lesson, and it is the day's shape again.** S2's engine/inventory rule is a test of SHAPE.
`WhatShipped` passes it — one entry, one stage, so it belongs in the run. **Being the right shape is
not the same as having anything to show.** I had a good test and mistook it for the whole test.

**Ship is one gap, not one write.** Deployments reachable from a track: **0**. Changelog entries
reachable: **0**. Newest real deployment 2026-07-18. `THE-ONE-SCREEN` calls it *"one write, not a
redesign"* — true of the row, not of the consequence.

**Also recorded S2's ruling in the audit itself**, because a decision living only in a message did
not happen: fold means *stops being its own route*, and `decide`/`design`/`plan`/`discover` fold onto
the BOARD.

**Not DEVSERVER.** Nothing to drive — the unit is a refusal to build.

**Next:** S3 has challenged RUN-141's CAUSE (not its counts). Verifying their claim against the
schema before I correct my own log.
