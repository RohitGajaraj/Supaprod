# QUEUE — S4 · THE PROVING GROUND (`lane/proof`)

> _Written by S0 2026-08-26. **S0 writes this file; you read it and never write it.** Your brief is
> [`SESSION-4-THE-PROVING-GROUND.md`](../../the-first-run/SESSION-4-THE-PROVING-GROUND.md)._
>
> **You write `e2e/**` and `docs/lanes/verify/**` and NOTHING in `src/`.** You cannot fix what you
> find — prove it, name it, hand it back. Your verdict outranks a builder's buildlog.

> ## ⚠ YOUR STANDING QUESTION 1 IS OUT OF DATE. READ THIS BEFORE YOU ASK IT.
>
> Your brief says: ask the acceptance count, *"never accept it via `workspaces.is_sample`, which
> returns a false 1."* **That is no longer the only way it lies. As of 2026-08-26 09:03 UTC the
> PLAIN query returns 1 as well, and the acceptance is still NOT met (F-79).**
>
> Track `d1168015` walked all seven with every `stage_events` row `actor='system'` **and**
> `driven_via='sweep'` — nobody pressed anything. But approval `bdf32286` was raised against its
> Build mission `310bd16b` at 18:11 UTC and **rejected at 18:48 UTC**, 2 days 23 hours before
> `expires_at`, so a person answered a boundary call **mid-run**. R-18 fails.
> `agent_approvals.decided_by` is **NULL** — the schema records no decider, which is itself a defect.
>
> **The honest query is in [`OPERATING-MODEL-5-SESSIONS.md`](../../the-first-run/OPERATING-MODEL-5-SESSIONS.md)
> §2 and it returns 0.** Ask S0 for it by name. **If any session reports the acceptance as met,
> your first job is to check for a decided approval before you believe it.**

> ## ⚠ RE-RANKED 2026-08-31 BY FOUNDER INSTRUCTION. READ THIS BEFORE THE ITEMS BELOW.
>
> The order in [`../../the-first-run/RANKED-BACKLOG.md`](../../the-first-run/RANKED-BACKLOG.md)
> **supersedes the order in this file.** The items below are still specified correctly; they are no
> longer necessarily topmost. Two rulings changed the ranking: **§0.7 the freeze** (every lane's
> weight on platform strength until the acceptance is met) and **§0.8 Anthropic's AI-native SDLC
> playbook as our framework**, which added gaps 15–29.
>
> **Two specs are new and you read them before touching a station boundary, an artifact or a
> handoff:** [`SPEC-AI-NATIVE-SDLC.md`](../../the-first-run/SPEC-AI-NATIVE-SDLC.md) (the adoption
> register) and [`SPEC-STATION-MODEL-AND-ARTIFACTS.md`](../../the-first-run/SPEC-STATION-MODEL-AND-ARTIFACTS.md)
> (why the seven stations stay seven, the artifact formats, running on an engine that is not Claude,
> and the UX contract in its §4).
>
> **THE SEQUENCING GUARD.** Only **Tier 0** moves the acceptance and all of Tier 0 is S0's. Ten new
> gaps arrived from a playbook this week; **a lane that opens with artifact emitters instead of its
> Tier 1 item is re-architecting instead of shipping**, which is this repository's signature failure.
>
> **YOU MEASURE WHETHER THE FOUR STALLS ACTUALLY CLEARED.** New standing question: for each of approval gates, reviews, handoffs and policies — **is a person still the bottleneck, and can you name the row that proves it either way?** A stall that moved from a committee to a faster queue has not cleared. `docs/strategy/ai-native-sdlc-rewiring-2026-08.md` §3.5.
>
> **YOUR TIER 1 ITEM (re-ranked 2026-08-31 after an 11-agent audit):** **Verify the three 2026-08-31 fixes adversarially — F-149, F-151, F-147 — before anything else.** S0 cannot sign its own spine work (R-11), and all three were found by subagents and fixed the same hour. **F-149 especially: the guard test is new and was written by the same session that wrote the fix.** Then #24, the golden set, built from real graded runs.
>
> **EVERY COUNT IN EVERY DOCUMENT IS STALE.** *"73 tracks, 71 entered at `sense`"* was measured 2026-08-26. **Today: 106 tracks, 103 entered at `sense`, 81 still sitting there.** The honest acceptance query still returns 0. **Re-measure before quoting a number; never copy one forward.**

## 1 · Adversarially verify F-76 — S0's own unit, and S0 cannot sign it off

- **Goal:** try to break the claim that the self-check now works. R-11 exists because a lane never
  signs off its own work, and **this is S0's work**, so it is yours to disprove.
- **What S0 claims** (commits `e13c24b5f`, `a185d3f5c`, `814c37476`): five of seven station checks
  named a schema that does not exist and could never pass; the `self-check-failed` hold left
  `attempts` at 0 so nothing bounded it; both are fixed; `bun test src/lib/spine/` is 708 pass /
  0 fail; `bunx tsc --noEmit` exit 0.
- **The specific things to attack, in order:**
  1. **The tests S0 deleted printed `MISSION GATE MET` and a hardcoded acceptance count of 1 while
     importing nothing but `vitest`.** Read the replacement,
     `src/lib/spine/the-self-check-must-ask-the-real-schema.test.ts`, and ask the same question of
     it: **does it load the code it claims to test?** If it does not, say so — S0 has already been
     wrong about a test suite once today.
  2. **Does the fix actually match the live schema?** Ask S0 to re-run
     `SELECT station, artifact_kind, count(*) FROM spine_track_members GROUP BY 1,2` and the
     `information_schema.columns` reads, and check the code against the ANSWER rather than against
     S0's summary of it.
  3. **Is the bound real?** With `attempts` now counting, does a station that fails its own check
     three times actually reach `given-up` and route to `decideCorrection` — or does something else
     catch it first? **Assert on what the fix uniquely controls, across two cycles**; a held track
     looks identical to a working guard.
- **Files:** `docs/lanes/verify/S4-001-f76.md`. Add an `e2e/**` spec only if you can point it at a
  local dev server you start and stop, or a guarded workspace S0 names — **never at production**; a
  spec pressing production once created six duplicate tracks that starved the run being watched.
- **Acceptance:** a verdict that names each claim upheld or broken, with the command or query that
  settled it. **"I could not reproduce it" is a valid and valuable verdict** — say it plainly.

## 2 · The sixty seconds, with fresh eyes — standing question 2

- **Goal:** take the stranger's path and record what a person actually understands at **10s, 30s and
  60s**, with screenshots and timestamps. This is the founder's second acceptance and it is equal in
  weight to the first.
- **User value (§0 q1/q2):** it is the only measurement of whether the product explains itself. **If
  they ask what a word means, the word is wrong — not their understanding.**
- **How, precisely:** land with no context, type one sentence, and write down what you saw — not what
  the surface intended. Look hardest for **theatre** (standing question 3): a state not derived from
  a row that exists, a step label advanced by a timer, a count from a column no writer sets, a
  "learning" that is seed data. **133 of 133 `learnings` rows were measured as seed on 2026-08-25**
  and the four brain tools have zero calls across 2,652 runs — so any surface claiming accumulated
  learning is theatre until S0 says otherwise. **This is the finding that ends a feature rather than
  fixing it, so it is the one you look hardest for.**
- **Files:** `docs/lanes/verify/S4-002-sixty-seconds.md`. **Screenshots go in `docs/screenshots/`,
  which is gitignored — never commit one and never leave one at repo root.** Reference paths in
  your verdict.
- **Acceptance:** three timestamped observations with what a stranger would conclude at each, and a
  named list of every word that needed explaining. **Point the browser at a local dev server you
  start and stop (R-21), or ask S0 to name a guarded workspace.**

## Standing, every unit

`git fetch origin && git rebase origin/main` · `cat docs/lanes/NOW-*.md` ·
`cat coordination/answers/S4/*.md` · rewrite `docs/lanes/NOW-S4.md` · append `docs/lanes/log/S4.md` ·
commit explicit paths · `git push -u origin HEAD`. **R-21: `lsof -ti:5173` before you start one,
`DEVSERVER` in your NOW line while you hold it, kill it the moment the check is done — a unit
claiming a browser check without recording that it stopped the server is rejected on review.**
