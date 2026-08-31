# NOW — S1 · THE RUN

**Unit:** RUN-152 · S1-Q1 / gap #29 — open questions, drawn always, answered in place.
**DEVSERVER 8080, killed and verified clear.**

**State:** built, mounted, driven, pushed. tsc 0 · 13,287 pass / 0 fail · my files lint clean.

**Checked first, as the queue requires.** `TrackConsent` is a **gate** mechanism (tool, reversibility,
expiry) and an open question has none of those. `AskInPlace` asks for a **connector**. The one to
reuse was neither: **`steerTrack`**, already proven (one track-scoped steer, consumed in 50s), and
`TrackActivity.tsx:725` already renders it as "You said" / "not picked up yet". **So "the transcript
shows who answered" needed nothing built.**

**Why draw it always:** 141 of 143 handoffs record nothing unsettled. A hide-when-empty section
renders on 2 tracks and hides the finding on the rest.

**The sentence I refused.** §2.1 says *"filing zero open questions means it did not look."* That
accuses one run on evidence this surface cannot check. It says *"recorded nothing as unsettled. That
is not the same as nothing being unsettled"* — pinned by a test.

**DRIVING CHANGED THE DESIGN.** `canRaiseOne` was false for `cannot-tell`, so the pane rendered *"I
could not read what was left unsettled"* **with nothing beneath it** — the dead end unit 5 forbids.
My written reason was wrong: the record is an independent steer, not a list mutation. Re-driven, the
line is now followed by **"Say what is unsettled"** opening the field.

**NOT verified, and I am not implying otherwise:** I did **not submit** — `d2263583` is the acceptance
candidate and a steer is a person touching it mid-run (R-18). The `asked` and `filed-none` branches
are unit-tested only; `questions` is `null` until S0's reader lands, so `cannot-tell` is the only
branch a browser can reach.

**Broke a gate and fixed it:** an em dash in a placeholder failed four humanization guards.

**Next:** S1-Q2 is BLOCKED pending the founder's ruling on who is S1 (F-161), so back to the ledger.
