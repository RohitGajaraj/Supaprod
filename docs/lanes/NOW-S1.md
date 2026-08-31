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
S1 · 20:0x IST · WORKING · NO DEVSERVER (8080 held for browser checks, killed after each; note `kill` reported clear once while the process survived, so I now verify with lsof AFTER the kill, and `bun run dev` binds 8080 not 5173 -- S3's finding, the R-21 guard named a port that is always free) · TEN UNITS SHIPPED AND DRIVEN, RUN-124..133, all pushed to origin/lane/run · RUN-124 the Discover shape (#16) · RUN-125 the terminal-hold split, which I shipped WRONG first under an unreachable branch and only a browser caught · RUN-126 demo-fixture provenance on the forecast desk (S4-166) · RUN-127 the Take this control, whose file driving rewrote twice · RUN-128 what a station produced (#28) · RUN-129 the same claim left stale on SIGNED_IN_HOME and TrackStart, found by writing the guard · RUN-130 a station the loop gave up on was drawn as awaiting an approval, caught by my own census one unit after I wrote it · RUN-131 the SDLC translation (#26) plus A07's board mount, my half · RUN-132 S0's return edge had no surface and its origin was clamped, truncating the forecast it carries verbatim · RUN-133 the leave-promise made honest at the door · WHY NOT U7/U8/U9: U7 is claimed by the other session writing this file; U8's band columns DO NOT EXIST (information_schema returns nothing for %band% on decisions, and S0 confirms gap #15 is the half of Move 4 they have not built), so drawing "how it reads" would stage a state the data cannot prove; U9's emitters are S0's and I refused to invent their frontmatter in RUN-127 · PRESENCE AUDITED AGAINST ITS OWN IRON LAW AND IT HOLDS: zero timers under presence, two guards already in place, nothing staged · THE ONE CLAIM I MAY NOT MAKE ALONE IS STILL LIVE IN ONE PLACE AND IT IS NOT MINE: character.ts:228 says "you can leave this page and I'll keep going" in the thinking state, while 97 of 106 tracks carry a hold and the verdict email has fired zero times. Reported to S0 · OPEN WITH S0, all messaged per F-156: getTrackHandoffs (unblocks #29), DueForecast's dropped workspace_id, and from_learning_id on Track (all three taken, queued as theirs) · S0 answered the return-edge question definitively: the pass has NEVER been dispatched, outcome-tick is hourly and the edge reached production at 14:30:03Z, so its first possible run is 15:00Z, and the real record owes exactly ONE track · NEXT: F-168 is fixed and d2263583 released for retry, so Decide can now walk; I will watch what that run does to my surfaces and take the first thing it breaks · gates: tsc 0, 13,278 tests 0 fail across 919 files, eslint clean, docs:check clean · src/components/{track,spine,presence,decisions,learn,ask,discover}/** and my five routes

**Unit:** RUN-142 · withdrew my own top recommendation. `ship` cannot fold.
**Unit:** RUN-143 · S3 challenged RUN-141's cause and was right. Corrected.
**Unit:** RUN-144 · one reason that took four stations off the route is said once. **DEVSERVER 8080.**
**Unit:** RUN-145 · two `is_sample` flags disagree. Every "how much is real" number is a coin toss.

**State:** no code changed. Logged and pushed; S0 told before the number hardens in canon.

**The find.** S0 wrote *"only 14 deployments are real, newest 51 days old"* into `THE-ONE-SCREEN.md`
using a number I gave them. Mine said *newest 2026-07-18*. **Eight days apart on one table.**

`deployments` has its **own** `is_sample` AND joins to `workspaces.is_sample`:

| dep.is_sample | ws.is_sample | n | newest |
| --- | --- | --- | --- |
| false | **TRUE** | **14** | 2026-07-10 |
| **TRUE** | false | **4** | 2026-07-18 |
| TRUE | TRUE | 24 | 2026-07-18 |

**S0's 14 are all on sample workspaces. My 4 are all flagged sample on the row.**
`NOT d.is_sample AND NOT w.is_sample` = **0**.

**So the honest number is zero.** Nothing has shipped for real *ever* on this record — there is no
date to be 51 days past. That makes S0's sentence stronger, not weaker.

**Why it matters beyond one number.** `CLAUDE.md` documents the workspace flag and says nothing about
the row-level one. Two careful readers reached for different flags within an hour. **Same class as
F-158's default-as-data, one join away.**

**The method is the transferable part.** I was not looking for this. Two lanes measured the same table
and disagreed. That is twice today — F-85's `ignored` default was the other. **Neither was findable
by measuring more carefully alone.**

**Not DEVSERVER** (8080 killed and verified clear after RUN-144).

**Next:** S2's `answerForArtifact` offer, against the same build/refuse gate.
