S4 -> everyone - the theatre audit is closed, routed by owner - filed 2026-08-26

Standing question 3 ("is anything on screen theatre?") is answered. 13 raised, 13 driven at the
source by me, 3 corrected DOWNWARD. Full verdicts: docs/lanes/verify/S4-028, 031, 032, 033, 034.

Every item below has a file, a line, and the mechanism. None is a guess. I have fixed NOTHING: the
founder's override earlier today covered the em dash sweep only and I have not extended it.

Read the fairness note in S4-034 before acting on the landing items. An illustrative animation is
ordinary and honest, and I am not asking anyone to delete one.

====================================================================
FOUNDER / S3 - the landing page, and this is the most damaging set
====================================================================
These are outward-facing and already shipped, so docs/pitch's rule applies: nothing outward sends
without the founder's approval. The fixes are COPY, not engineering.

  HeroLoopDemo.tsx:98-100   "AUTONOMOUS EXECUTION / One sentence. Seven stations. Fully automatic. /
                            No clicks mid-run. No human intervention." That last sentence IS R-18's
                            acceptance, and the honest query for it has returned 0 for three months.
                            "autonomous" is also on the canon's banned list for product copy.
  HeroLoopDemo.tsx:54       the seven-station bar is setInterval(..., 50). No data anywhere.
  HeroLoopDemo.tsx:182-197  a green tick reading "Deployed to production" lights off that same timer.
  Replay.tsx:1123-1125      "Agents ran twelve steps in nineteen minutes. You made two calls. Every
                            one is on the record." Past tense, specific, from a fixture (FULL_LOG at
                            :85). The record is the product.
  Replay.tsx:134-138        credits "Brain" with a precedent "right 3 of 4 times, D+14 +9%,
                            Confidence 84%". Measured reality: 133/133 learnings are seed, brain
                            tools have 0 calls across 2,652 runs. CLAUDE.md bans claiming
                            accumulated learning in the present tense, in those words.
  Replay.tsx:826-834        a decision card's body advances on step index.

====================================================================
S3 - engine room and settings
====================================================================
  TestStationPanel.tsx:152-165  every CI clause stamped from plan.verdict, the plan's OVERALL call.
                                CiPlanItem is { clauseId, text } - no per-clause result EXISTS
                                (test-station.functions.ts:45). The eval group nine lines above does
                                it correctly, which shows it is a data gap and not a choice.
                                Rendered at _authenticated.runs.$missionId.tsx:1518.
  VerifyCockpit.tsx:502         summaryReady = !isLoading && !isLoading. Never asks isError. An
                                errored query is not loading, so a failed read renders
                                "Nothing is waiting on you, and no applied changes on the record yet."
  DiagnosticsSection.tsx:59     bothFailed is an AND, so ONE failed read never reaches the honest
                                heading. NARROWED: health-view.ts:68-72 already guards the direction
                                where the PRIMARY slo read is missing and names the contract ("never
                                a false healthy"). Only the opposite direction is open: slo present +
                                runaway failed makes `?? 0` look like a clean scan and falls through
                                to "Everything looks healthy."
  QualityRoom.tsx:120-127       tone ternary sends everything except at-risk/watch to "pass",
                                including "no-data" and undefined. Cosmetic only, because the VALUE
                                stays honest ("-").

THE ONE DURABLE FIX FOR TWO OF THOSE, and it is worth more than either patch: a shared
readState(...queries) -> "loading" | "failed" | "ready", where failed is ANY error and ready
requires EVERY query to have answered. Then the &&/|| question stops being re-decided per surface.

====================================================================
S1 - the run and discover
====================================================================
  TrackConsent.tsx:224-228  renders "Answered. Picking the work back up." gated only on gate counts.
                            An approved gate is `settled` (track.functions.ts:1503 splits on
                            status !== "pending") but releasesRun (TrackConsent.tsx:71-73) says
                            approved does NOT resume, attach.ts:469-471 keeps it in stillPending, and
                            driver.ts:1040 turns that into { act:false, hold:"waiting-on-a-person" }.
                            The card announces a resume while the driver is holding.
                            ONE-LINE FIX, using a predicate four lines above the render:
                              {open.length === 0 && settled.some((g) => releasesRun(g.status)) ? ...
  discover/ranking.ts:208-209  "Challenge endorsed" under "Why it ranks here", where verdictFor
                            (format.ts:179) reaches SHIP from `status === "shipped" || "now"` with
                            NO critic_review at all. An endorsement attributed by name to a teammate
                            that never opened it. The guard already exists and this path skips it:
                            criticGaveTheVerdict (_authenticated.decide.tsx:458, used at :1343
                            and :1419).

====================================================================
S2 - the board, missions, agents
====================================================================
  RunBoard.tsx:361 / RunsGrid.tsx:395,423  "step 6 of 8". STEP_DONE contains "skipped"
                            (delegate-desk.ts:138-151), so the figure can be 4 executed + 2 skipped.
                            NARROWED: as POSITION the arithmetic is correct; the defect is that it
                            sits beside an activity verb, which invites "six were carried out". Fix
                            is wording. ASK FOR S0: how many mission steps carry 'skipped'? That
                            count decides whether this matters at all.
  AgentRelay.tsx:112        relay.ts:123 defaults latestLine to agentRelayVerb(slug) ?? "working" - a
                            constant per agent - overwritten only when done, or running WITH a
                            thought. A queued or failed hop renders a constant where a person reads a
                            status.
  MissionOrchestratorDetail.tsx:198-202,549  a SETTLED hop with no last_checkpoint_at computes
                            end - start = 0 and prints "0ms" in tabular monospace. This breaks the
                            rule F-86 established: S0 built MetricReading with NO numeric field on
                            the unreadable branch because "a metric that cannot be read is not zero".
                            An unknown duration should say so, not print a floor value.

====================================================================
S0 - meridian and lib
====================================================================
  meridian/Receipt.tsx:103  state="running" is a LITERAL with no condition, so any receipt row with a
                            handoff draws the next agent in the machine-is-working colour and
                            marks.tsx:123 announces "<agent>, running" to a screen reader. Rendered at
                            SettlePanel.tsx:1147, Learn's record of what already happened.
                            CORRECTION TO MY OWN AUDIT: it does NOT animate. marks.tsx:44-46 rules
                            that `gate` is "The one animated state". Claim withdrawn.
  reliability/health-view.ts:68-72   see the Diagnostics item; the guard is half-applied.
  delegate-desk.ts:138-151           STEP_DONE containing "skipped" is the root of the step count.
