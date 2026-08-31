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

**It has no caller.** Only the module, its `.server.ts` and its own test reference it. Sixth
producer-without-a-consumer in two days, and this one is inverted: the reader and the words exist,
the door does not.

**The door is mine** — `SPEC-BUILD-PATHS §2.3` puts it at track creation, so `spine/TrackStart.tsx`
and the `start` route. **Blocked on one line of S0's:** `evidenceForSubject(db, workspaceId, subject)`
is a plain helper a browser cannot reach; it needs a `createServerFn` wrapper.

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
**Proposed, and it cannot be lost:** add
`(SELECT count(DISTINCT station) FROM track_drives WHERE track_id = t.id) = 7`.
`d2263583` returns **3**. Excluded on evidence rather than on a column that happened to be written.
**WHY I AM NOT FIXING IT AT THE SURFACE.** `run-position.ts`'s header: *"NOTHING HERE READS A SECOND
QUERY… which is the exact drift the route file records being caught live."* And S0's `a794682d` means
**exactly one row in history is wrong**, from a seventeen-minute window now closed. Permanent
machinery for a case that cannot recur is furniture. **Same call I made on the hold-line doubling,
which S0 agreed with and shipped as F-177: trim the writer, do not dedupe at the surface.**
**The class is four deep today:** S3's comment-strip, my username, F-150's passing test, and my own
RUN-144 fold — passing since I wrote it, never once rendered. **Green proves nothing until you know
why it is green.**
**Two found while driving, neither mine.** The **Brain door crashes** —
`DecisionsPanel.tsx:567 · Cannot read properties of undefined (reading 'tone')`, reproduced live with
a stack; S2 filed it, `knowledge/**` is **S3's**, still unrouted. And a **live failed read**
(`ERR_CONNECTION_CLOSED`) on `agent_messages` made my `cannot-tell` branch fire in production
conditions rather than a test.
**I am NOT building this against the shape**, and the difference from open-questions matters: there,
`null` rendered one honest line beside a live control. **Here the sentence IS the whole feature**, so
without the wrapper it renders *"I could not check"* on every keystroke, for ever.

**Checked first, none serves:** `AskInPlace` (asks for a connector) · `TrackConsent` (a gate, and S0
is explicit *"nothing here may become a gate"*) · `WhatWereSolving` (reads a track that already
exists; this runs before one does).
**Blocked and named:** the evidence door needs one `createServerFn` from S0 · S1-Q2 needs the founder's
F-161 ruling · #22/#27/#17/#14 need S0's half.
**No S0 dependency, and I checked before asking for one.** `track.functions.ts:1199` already selects
`source`, so `fields.source` was reaching my component all along and nothing read it. I nearly filed
the sixth producer-with-no-consumer of the day and the producer was already wired to my door.
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
