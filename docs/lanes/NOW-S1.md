# NOW — S1 · THE RUN

**Unit:** RUN-154 · drove the wired reader. **DEVSERVER 8080, killed and verified clear.**

**State:** driven, no code changed. RUN-153's one red (S0's `KNOWN_UNREACHED: handoffs`) still stands
and is still not mine.

**It works on real rows.** `a30238f5`, 4 reachable handoffs, Discover pane: *"Nothing Discover handed
on says what is still unsettled…"* + **Say what is unsettled**. So `said-nothing` is **driven**, which
exercises S0's mission fallback, the narrowing, and the absent-vs-empty split on live data.

**Two corrections from driving:** the section is one click away on a track parked past Discover (right,
but worth knowing); and a track in another workspace renders *"That work could not be found"* — the 8
tracks with handoffs are **not all reachable by one signed-in person**.

**S4-174 decides what this can ever show.** `enqueueHandoff` has **no caller in `src/lib/spine/**`** —
confirmed. Handoffs are a **mission-path** feature and the acceptance runs on the **track path**. So
the producer gap is two deep and S0 fixed only the first:

1. ~~writer never set `track_id`~~ — **fixed today**
2. **nothing on the track path calls the writer at all**

**Not DEVSERVER** (the `asked` branch still has no live data: 0 tracks carry either field).
S1 · 20:0x IST · WORKING · NO DEVSERVER (8080 held for browser checks, killed after each; note `kill` reported clear once while the process survived, so I now verify with lsof AFTER the kill, and `bun run dev` binds 8080 not 5173 -- S3's finding, the R-21 guard named a port that is always free) · TEN UNITS SHIPPED AND DRIVEN, RUN-124..133, all pushed to origin/lane/run · RUN-124 the Discover shape (#16) · RUN-125 the terminal-hold split, which I shipped WRONG first under an unreachable branch and only a browser caught · RUN-126 demo-fixture provenance on the forecast desk (S4-166) · RUN-127 the Take this control, whose file driving rewrote twice · RUN-128 what a station produced (#28) · RUN-129 the same claim left stale on SIGNED_IN_HOME and TrackStart, found by writing the guard · RUN-130 a station the loop gave up on was drawn as awaiting an approval, caught by my own census one unit after I wrote it · RUN-131 the SDLC translation (#26) plus A07's board mount, my half · RUN-132 S0's return edge had no surface and its origin was clamped, truncating the forecast it carries verbatim · RUN-133 the leave-promise made honest at the door · WHY NOT U7/U8/U9: U7 is claimed by the other session writing this file; U8's band columns DO NOT EXIST (information_schema returns nothing for %band% on decisions, and S0 confirms gap #15 is the half of Move 4 they have not built), so drawing "how it reads" would stage a state the data cannot prove; U9's emitters are S0's and I refused to invent their frontmatter in RUN-127 · PRESENCE AUDITED AGAINST ITS OWN IRON LAW AND IT HOLDS: zero timers under presence, two guards already in place, nothing staged · THE ONE CLAIM I MAY NOT MAKE ALONE IS STILL LIVE IN ONE PLACE AND IT IS NOT MINE: character.ts:228 says "you can leave this page and I'll keep going" in the thinking state, while 97 of 106 tracks carry a hold and the verdict email has fired zero times. Reported to S0 · OPEN WITH S0, all messaged per F-156: getTrackHandoffs (unblocks #29), DueForecast's dropped workspace_id, and from_learning_id on Track (all three taken, queued as theirs) · S0 answered the return-edge question definitively: the pass has NEVER been dispatched, outcome-tick is hourly and the edge reached production at 14:30:03Z, so its first possible run is 15:00Z, and the real record owes exactly ONE track · NEXT: F-168 is fixed and d2263583 released for retry, so Decide can now walk; I will watch what that run does to my surfaces and take the first thing it breaks · gates: tsc 0, 13,278 tests 0 fail across 919 files, eslint clean, docs:check clean · src/components/{track,spine,presence,decisions,learn,ask,discover}/** and my five routes

**Unit:** RUN-142 · withdrew my own top recommendation. `ship` cannot fold.
**Unit:** RUN-143 · S3 challenged RUN-141's cause and was right. Corrected.
**Unit:** RUN-144 · one reason that took four stations off the route is said once. **DEVSERVER 8080.**
**Unit:** RUN-145 · two `is_sample` flags disagree. Every "how much is real" number is a coin toss.
**Unit:** RUN-146 · my own top-priority item was already done and the ledger said OPEN.
**Unit:** RUN-147 · audited my own queue, because it had lied to me twice.
**Unit:** RUN-148 · audited my brief's standing presence rule, then proved the guards bite.
**Unit:** RUN-149 · same disease one level down — two flags, then two timestamps.
**Unit:** RUN-151 · a process hook caught three real failures; one changed what I am building.
**Unit:** RUN-152 · S1-Q1 / gap #29 — open questions, drawn always, answered in place.
**DEVSERVER 8080, killed and verified clear.**

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
**So my section says "nothing handed on" on every acceptance-path track, forever, until (2) closes.**
Honest, and it means #29's *answer one* half cannot fire where it matters; the raise control is the
only live half there.

**Refused `constraints`** on the same gate: 13 handoffs carry it, **0 of them reachable from a track.**
Fifth producer gap today.

**Next:** taking that two-deep gap to S0 as the thing that decides whether #29 can ever light up.
