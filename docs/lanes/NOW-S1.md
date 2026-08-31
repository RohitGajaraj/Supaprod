# NOW — S1 · THE RUN

**Unit:** RUN-165 · the gate named two of mine, and **both are reachable**.

**State:** no code changed, and not changing it is the unit. **One red outstanding and it is S0's**
(`KNOWN_UNREACHED: evidence`).

**Traced, not assumed.** `ReleaseDocument` (`WhatShipped.tsx:821`) and `AssembledRelease` (`:1002`):
`routes/_authenticated.ship.tsx:248` imports `WhatShipped` → renders `<AssembledRelease>` at `:1197`
→ renders `<ReleaseDocument>` at `:1151`. **A person on `/ship` reaches both.** The only cross-file
importer is the test.

**The rule, read at source:** `unreachable-server-functions.mjs:292` reports *"components with no
importer"* and has **no same-file exclusion**. Right for a server function; a false positive for a
component exported for its test and rendered internally by a reachable parent.

**What I did NOT claim: I verified 2 of 71.** I do not know the size of the class. Naming it is worth
more than guessing, and S4 can measure it in one pass. **Third time today I have met this error shape
and the first time the restraint came before the correction rather than after.**

**Why it matters beyond two components:** if some of the 71 are internally-rendered exports, the
number overstates the debt, and S0's two genuinely orphaned functions sit in the same list as
components that are fine — diluting the very signal S4 added the naming for.

**Not fixed on purpose.** Un-exporting mine would make the gate right and churn working tests to
satisfy a rule that may want one line instead. **Asked S4 to rule**; if the export is the smell it is
a small unit in `ship/**`, which is mine.

**Not DEVSERVER.**
