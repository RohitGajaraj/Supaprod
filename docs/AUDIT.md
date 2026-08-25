# AUDIT — where the platform actually stands

> _Written 2026-08-25 13:5x IST (08:2x UTC) by MAIN (Fable). Every claim below was verified today
> against the live database, the running build, or the file on disk — nothing is carried testimony.
> Findings history and fix commits live in [`../the-first-run/FINDINGS-LEDGER.md`](../the-first-run/FINDINGS-LEDGER.md);
> this file is the consolidated answer to "what works, what is broken, what is theatre, what is absent"._

## The verdict, first

**The loop is mechanically alive and walked three stations unaided this morning.** Track
`48eee889` (harbor's Helio Labs workspace) advanced `sense → decide` at 07:10:22 UTC and
`decide → define` at 07:41:37, actor `system`, no human touch, and the sweep was still driving
it at 08:10 — minutes before this audit ran
(`SELECT from_stage, to_stage, actor, at FROM stage_events WHERE entity_id='48eee889-…'`).

**The deciding variable is no longer code. It is evidence.** Four sibling tracks started the same
morning in the same workspace all hold `produced-nothing` at `sense` — because their titles
("print-friendly checklist", "phone number on job card") match nothing in the workspace's 231
signals, and the Discover crew now honestly says so instead of hallucinating. The one track whose
sentence was grounded in evidence the workspace actually holds is the one that moved. **The loop
advances exactly when its input is real.** That is the correct behaviour of an honest system with
its evidence intake switched off (F-38).

**Gate state, run this session:** `tsc` 0 errors · `bun test` **10,889 pass / 0 fail / 650 files** ·
the running Lovable build embeds commit `7044d462` = current `main` HEAD, so **what is deployed is
what is in git.**

---

## WORKING — verified live today

| What | Evidence |
| --- | --- |
| **The seven-station spine walks by itself** | Round 6 above. Rounds 4–6 cumulatively reached `design` and `define` unaided. 88 agent runs in the last 8h, $0.73 spent (`agent_runs WHERE created_at > now()-interval '8 hours'`) |
| **Discover files honest verdicts** | Harbor seat outputs quote signal IDs when evidence exists, decline when it does not. The F-19/F-22/F-24 fixes hold: no more absence-notes-as-evidence loop |
| **The watched run continues itself** (queue item 34 — **shipped by a lane, queue not yet updated**) | `TrackRun.tsx:297` — auto-continue on `out-of-window` only, capped at 8 legs, never past a hold, stoppable. One press now buys the route |
| **`/start` one-click on-ramp exists** | `_authenticated.start.tsx` grew 922 → 10,259 chars; job cards wired (LANE 1, `801b9c427`) |
| **All 8 of last night's fixes are real in code** | Migrations `20260825033000/064500/073000` on disk; `tools-refused` in driver+correction+test; `updateToolMode` floor refusal (4 refs); `stationSubject`; `AUTO_SHIP_ENABLED` wired at `loop.server.ts:179` |
| **Credit governance works and defends itself** | The top-up RPC refused our own grant (`cap_exceeded`) until done as a plan change. Balances now: harbor 3,442, `0b792d52` 2,635 |
| **External ingest door works** | Proven 2026-08-22: 10 signals POSTed twice → `created: 10` then `restated: 10` (dedup) |
| **Anti-runaway spend meter counts again** | F-45 L1: `ai_budgets` 6 → 7 rows, `max(updated_at)` moved to 2026-08-25 after 10 frozen days |

## BROKEN — live defects, each with today's measurement

| What | Measurement (today) | Root |
| --- | --- | --- |
| **GitHub is refused in the only workspace the loop ran in for weeks** | 11 of 11 `repo.tree`/`repo.search` calls failed in 8h, **all** in `0b792d52` (`tool_calls WHERE ok=false GROUP BY workspace_id`) | F-39: workspace owned by a **suspended** demo account with no GitHub binding. Harbor's binding exists and is **untested** |
| **Ship is unreachable by construction** | 0 deployments and 0 merged changesets in any proof workspace (42 / 16 exist globally, all from outside the spine) | F-36: Build is briefed on `studio.stage` only; `studio.commit` appears 0 times in `driver.ts`; merge + preview never happen on the loop |
| **Evidence intake has never run in production** | `scout_targets` 0 · `scout_snapshots` 0 ever · last `scout_runs` row **2026-07-25** (re-verified today) | F-38: no Firecrawl key (dormant reports `ok:true`), `auto_scout_enabled` 0/21, briefs missing 13/21. **Founder call, on the RULINGS open list** |
| **Unattended pace is ~20 min/station** | F-25 measurements stand; 5 fresh tracks alternating one seat per tick | Items 33 (sweep) — sequential under one 45s deadline is deliberate; the fix is a design call, not a constant |
| **40 of 88 runs failed in 8h** | `agent_runs` 8h window | Dominated by the 401 workspace + honest evidence declines — both above; not a new defect class |

## FAKE — reads as working, is not

| What | The tell |
| --- | --- |
| **The one track at `learn`** | Placed there by hand on 2026-08-01, 0 agent runs (X-08). Anyone counting stations reached will be fooled. **Still true today** (`at_learn = 1`) |
| **The front door** | `AskDock` says *"What should we build?"* app-wide and files a **mission** the run workbench cannot see. `startTrackCore` exists in `chat.ts` **only inside a comment** (line 1130). Item 16, still open, P0 |
| **Health surfaces** | Scout returns `ok:true` when dormant; `connections.status` said `connected` for a month with a NULL secret; `latest_commit_sha` is unordered. Optimism by construction — F-38/F-39/F-23 |
| **11 of 21 workspaces are samples** | Every investor-facing account shows a workspace where the loop is excluded from running (F-42, partly fixed: both Helio workspaces now run) |

## MISSING — does not exist anywhere

1. **Agent presence.** Nothing personifies the crew. Work is visible only as transcript rows after
   the fact. No live "who is working, on what, right now", no character, no motion that reads as
   agency. **The founder named this today as the reason the product does not feel agentic — it is
   the Phase 3 build and the core product bet.**
2. **A graded forecast.** The moat is *forecast captured at decision time*; 348 decisions exist and
   the grading tick has never settled one on a real workspace (M-3).
3. **Attribution.** `activation_events`: 38 rows, 0 with a user (F-40). The funnel cannot answer
   who did what.
4. **A track that finished.** 68 tracks, 0 have walked `sense → learn`. Unchanged headline.

---

## THE NARROWEST TRULY-AUTONOMOUS LOOP — the call this audit exists to make

**Workspace:** harbor's Helio Labs (`60000000-…`). It is the only workspace that has all four
preconditions at once: real evidence (231 signals), an unsuspended owner, a GitHub binding
(untested, installation `142608030`), and credits (3,442).

**Track:** one sentence grounded in the evidence the workspace holds — Round 6
("notification fatigue") already proves `sense → define` advances on exactly this shape.

**What stands between `define` and `learn`, in order:**

1. **Test harbor's GitHub binding** — one `repo.tree` call. Cheap, decisive, never been done. (MAIN)
2. **Brief Build through its own six-step chain** — `studio.commit → pr.open → checks.run →
   pr.merge` (item 41). The tools all exist; no station brief names them. (MAIN, code)
3. **The merge gate** — `AUTO_SHIP_ENABLED` already resolves `studio.pr.merge` to `confirm`; this
   is founder option (b) **already built**. Needs the founder to say yes to setting it for the
   proof workspace. (FOUNDER)
4. **The Ship gate** — F-18's three options; option (b) is now the smallest step. (FOUNDER)
5. **Record a preview deploy** on the merged changeset — the one genuinely missing mechanism
   (`deployments` row with `provider='deno'`). Scope: smallest honest implementation. (MAIN)
6. **Learn grades the forecast** — the calibrate-insights tick exists; wire `forecast_resolution`
   for this track's decision (M-3). (MAIN)

**Evidence intake (F-38) is NOT on this critical path.** Harbor already holds real signals; the
proof run reads them. Switching the scout on is a separate, founder-owned spend decision.

## What only the founder can decide (unchanged, sharpened)

1. **F-18/F-36 — the Ship gates.** `AUTO_SHIP_ENABLED` for the proof workspace is the smallest
   move and already exists. Saying yes unblocks steps 3–4 above in one word.
2. **F-38 — evidence intake on or off.** Not blocking the proof; blocking the *product* claim
   "starts from one sentence, zero configuration".
3. **F-39 — GitHub for the demo accounts** — steps written in
   `docs/operations/github-and-demo-account-setup.md`.

## Method

Database: Lovable MCP against project `371dd588`, all queries inline above, `now()` stamped
(DB is UTC, this box is IST). Code: grep/read on `main` at `7044d462`. Gates: `bunx tsc --noEmit`
and `bun test`, full output in the session record. Deploy identity: commit SHA embedded in
`latest_screenshot_url`, the only ordered deploy signal (F-23).
