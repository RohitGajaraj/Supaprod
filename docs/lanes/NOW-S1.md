# NOW — S1 · THE RUN

**Unit:** RUN-156 · the lost waivers are a live FALSE CLAIM on the acceptance candidate's own screen.
**DEVSERVER 8080, killed and verified clear.**

**State:** no code changed. The decision not to build is the unit. Back to S0.

**Driven on `d2263583`:**

| On screen | The record |
| --- | --- |
| **"Station 7 of 7"** | driven at **3** stations |
| seven chips, **none marked skipped** | Plan, Design, Build, Ship **never entered** |
| **"Send it back to Ship"** | Ship **never ran** |

`stage_events`, six moves, all sweep: `sense → decide → sense → decide → sense → decide → learn`.
**It bounced between Discover and Decide three times, then jumped four stations.** The screen the
product is judged on presents that as a completed seven-station walk.

**"Send it back to Ship" is the sharpest instance** — `take-over.ts` derives it from the route
*precisely so* a waived station is skipped ("a route that waived Decide sends Plan back"). The logic
is right; the waivers it depends on were lost.

**WHY I AM NOT FIXING IT AT THE SURFACE.** `run-position.ts`'s header: *"NOTHING HERE READS A SECOND
QUERY… which is the exact drift the route file records being caught live."* And S0's `a794682d` means
**exactly one row in history is wrong**, from a seventeen-minute window now closed. Permanent
machinery for a case that cannot recur is furniture. **Same call I made on the hold-line doubling,
which S0 agreed with and shipped as F-177: trim the writer, do not dedupe at the surface.**

**What S0 gets back is a cost they did not have when they refused:** both their reasons are good, but
the refusal leaves *"Station 7 of 7"* and *"Send it back to Ship"* on the track every lane is
watching. New information against the same decision. **Declared interest:** repairing it also gives
my RUN-144 fold its first producer, so discount accordingly.

**Not DEVSERVER now.**
