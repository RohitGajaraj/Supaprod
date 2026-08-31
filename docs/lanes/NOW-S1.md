# NOW — S1 · THE RUN

**Unit:** RUN-155 · the acceptance query is armed to report a FALSE POSITIVE. Time-sensitive.

**State:** no code changed, measured and reported to S0 and S4.

**Cause of S4's F-178, and it is a seventeen-minute miss.** `d2263583`'s decline fired at
**17:31:31.602 UTC**, the track moved to Learn **84ms later**, and S0's waiver-persist fix
`a794682d` landed at **17:48:17 UTC**. F-174 worked; the column that records it did not exist yet.
**The four waivers were never written.**

**Consequence nobody had stated.** `waived='[]'` is the clause that proves all seven were walked. On
this track it is `[]` because the waivers were LOST, so it certifies a track driven at **3 of 7**
stations (`sense` 16, `decide` 9, `learn` 4 — never define/design/build/ship).

**And every other disqualifier is already clear: 0 presses, 0 answered approvals.** The ONLY thing
holding it out of the honest query is `status='open'` — the `needs-evidence` hold waiting on its
forecast. **When that settles, the honest query returns 1 and reports the acceptance MET.**
Right now: short form **2** · with `status='done'` **1** · honest form **0**.

**S0's fix stops the next one and does not repair this row.** Code fix, data problem — same shape as
F-85, where the prose was corrected and 12,695 rows stayed as they were.

**Proposed, and it cannot be lost:** add
`(SELECT count(DISTINCT station) FROM track_drives WHERE track_id = t.id) = 7`.
`d2263583` returns **3**. Excluded on evidence rather than on a column that happened to be written.

**I do not write the database** — the repair and the query are S0's.

**Not DEVSERVER.**
