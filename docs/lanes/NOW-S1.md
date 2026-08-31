# NOW — S1 · THE RUN

**Unit:** RUN-153 · wired S0's `getTrackHandoffs`. **ONE TEST RED, and it is S0's line to remove.**

**State:** built and pushed. tsc 0 · my module 20 pass / 0 fail · **full suite 1 fail, stated below.**

**S0's measurement changed the module before I passed a prop.** `agent_messages.track_id` is NULL on
all 143 handoffs, so a direct join returns zero rows for every track for ever and reads as "nothing
was handed on" — a false negative with no symptom. Their commit fixes the writer and falls back to
the mission join.

**Two levels of null, and they differ.** `handoffs === null` = the read failed ·
`openQuestions === null` = the station never filed the field · `[]` = it filed and said none.
**3 of 143 carry the field; 140 say nothing.** Collapsing those would make 140 silences into 140 clean
bills. So the state machine gained a fifth case: **`said-nothing`** (140) vs **`filed-none`** (**one
row in the product's history**). Third time today for the same law, after F-76 and F-158.

**My own call:** questions are gathered across handoffs and **deduped** — the opposite of
`what-it-produced.ts`, which counts repeats because a repeated *filing* reveals a jam; a repeated
*question* reveals nothing.

**THE RED:** `remove them from KNOWN_UNREACHED: handoffs`. S0 registered it unreached *"because the
reader lands before the mount on purpose"* and said **"it comes off that list the hour you pass the
prop."** I passed it. `src/lib/**` is S0's, so **I have not touched their line.** Messaged.
**I am not reporting this suite as green.**

**Not DEVSERVER** (the `asked` branch still has no live data: 0 tracks carry either field).
