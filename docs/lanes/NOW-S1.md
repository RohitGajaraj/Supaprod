# NOW — S1 · THE RUN

**Unit:** RUN-163 · the evidence door is mounted and **driven**, and driving moved it once.
**DEVSERVER 8080, killed and verified clear. ONE RED and it is S0's line.**

**Live, on `/start`, typing *"tablet checkout address abandonment"*:**
> *"Already here, from session replay archive, analytics dashboard, workspace.brief: address 76 ·
> abandonment 34 · checkout 20."*

**And "Start it" stayed enabled** — S0's *"nothing here may become a gate"* tested, not asserted.

**DRIVING MOVED THE MOUNT.** I put it in `spine/TrackStart.tsx`, the obvious component. On `/start`
the field never appeared: that page's composer is `_authenticated.start.tsx`'s `<Composer>`. A source
read would not have told me.

**And I nearly logged a worse error.** My grep said `TrackStart` had **zero importers** and I was
about to call it dead. **It is not** — `plan.index.tsx:126` imports it, `:902` renders it; comment
hits crowded out the real import in a 5-line grep. **Third incomplete-sample error today, first one
caught before publishing.** So: **two doors start work**; I mounted and drove one, and record the
`/plan` one as **owed, not done**, because I have not seen it render.

**The guard caught me twice with the same line.** `if (q.isLoading) return null` failed
`a-null-under-a-heading-is-a-broken-promise` — the guard I obeyed this morning, then re-violated in a
new file. My reasoning was half the rule: `RunPresence` says a state derived during a first read must
be TRUE, not that nothing may be drawn. Now: *"Checking what this workspace already holds about
this."*

**The red:** `remove them from KNOWN_UNREACHED: evidence` — S0 predicted it and owns the line.
**Not reporting the suite green.**
