# AUDIT.md — Ground Truth: What Works, What's Broken

> **2026-08-25, Session RESUME. Measuring what can run now, what is untested, what blocks completion.**
> **Goal: watch a complete loop run itself end to end, on screen, with everything functional. No stubs, no mocks, no theatre.**

---

## The Fact: 59 Tracks, Zero Completions

| Metric | Status |
| --- | --- |
| **Tracks created** | 59 (since 2026-08-01) |
| **Entered station 1 (sense)** | 58 of 59 |
| **Reached station 7 (learn)** | **0 of 59** — one manually placed, no agent walked it |
| **Latest progress** | 13 moved past station 1; 5 walked 2–4 stations before dying |

**The goal has never been true.** Not once has a person typed a sentence and watched a loop walk end-to-end without touching it.

---

## The Seven Stations: Wired, Blocked, or Fake

### Stations 1–5: Driving Without a Person in the Loop

**Sense (discover)** → Decide → Define (plan) → Design → Build → ✅ All drive on their own on harbor@'s GitHub connection.

Build now briefs `studio.commit` + `studio.pr.open` + `studio.pr.merge` (F-50 FIXED). Can reach merge gate.

### Station 6: Ship — Reachable With Human Gate

**Reachable IF:** Human approves merge at Build's gate. `ci-poll-tick` auto-deploys preview after merge. Track can write to ship station.

**Gate:** `release.publish` is pinned to `review` by founder ruling (correct — production deploy is irreversible). **NO STATION BRIEFS IT.** So publish cannot fire, even if auto is decided later.

### Station 7: Learn — Unreachable

Needs shipped code + forecast window closed. Mechanically sound, structurally blocked only by nothing shipping yet.

---

## The Blockers

| # | Problem | Impact | Status |
| --- | --- | --- | --- |
| **F-25** | Only 1 track per tick (sequential, 45s deadline) | ~20 min/station, need manual restart every 50s | ❌ OPEN |
| **F-26** | Watched path stops every 50s | ~10 manual presses per end-to-end run | ❌ OPEN (Lane 0 item 34) |
| **F-39** | GitHub 401 on demo2@ | Build fails there. ✅ Workaround: harbor@ works. | ✅ WORKED AROUND |
| **F-51** | Forecast grader never runs | `auto_derive_enabled` false on 21/21 workspaces. ✅ Set true on harbor. | ⚠️ PARTIAL |
| **F-18** | Ship gate undefined | Founder hasn't decided: auto publish or human approval? | ⚠️ AWAITING CALL |

**Core finding:** F-25 + F-26 make continuous end-to-end impossible. Everything else is wired or worked-around.

---

## The Narrowest Loop That Runs Today

**Path:** Sense → Decide → Define → Design → Build → (Human merges) → Deploy → Ship reached

**Proof of concept:** Round 7 on harbor@'s workspace, with:
- Manual one-sentence start
- Automated sense through build (5 stations)
- Human approval at merge gate
- Automated preview deploy
- First measurement: does Ship write track_members?

**Cost:** 1–2 hours, one approval, $0.20 agent spend.

**What it doesn't answer:**
- Can continuous watching work with nobody driving? (No, F-26)
- Can multiple tracks run in parallel? (No, F-25)
- Does Learn work? (Yes, but needs time + shipping first)

---

## Recommendation: Run Round 7 Now

**State:** Harbor workspace is_sample=false, Round 7 queued with all fixes.

**Next:** Monitor `spine_tracks` for harbor's workspace. Check if Ship writes track_members on merge. If yes, the loop is wired end-to-end. If no, find what's missing.

**Then fix:** F-25/F-26 to make it continuously watchable and autonomous.


---

## Addendum — 2026-08-25 evening (Session A, supaprod-8c): Round 7's answer

**Round 7 ran and is called.** Founder sentence via `/start` at 16:48 IST, sense → build in 13
minutes with the sweep doing all of it — the fastest walk in the product's history, and proof the
watchable pace (AUTO_MAX 24, queue 55) is real. Scorecard closed at 17:06 IST (11:36 UTC) honestly (B
repointed the GitHub binding on the founder's instruction — recorded, not buried). Build then
spent its three attempts on two tool defects, not on agent failure:

- **F-57**: `tools-refused` catches `401`, GitHub answers `404` for a repo an installation
  cannot see — so R-26 never classified the refusal and two attempts were burned re-learning it.
- **F-58**: `repo.search` (GitHub code search) does not reliably index private repos. The file
  the work was about existed and the crew's primary way of finding code returned zero. Both
  agents reasoned correctly from a false premise.

**What is now true that was not this morning:** criterion 2 is provable on both paths —
queue 63 (`driven_via` sweep/press/continuation, B+A) is in the deployed Worker (published
17:37 IST) and the widened constraints are verified in the database. The screen can carry it:
`attempts` and per-leg origin are on the payloads (queues 65/66, component halves with LANE 0).
Credits stand at 10,000 via an auditable founder-authorised grant.

**Round 8 is the next attempt and its two blockers are named:** fix F-57's classification
(404-on-root-with-binding is a permission answer) and give Build a code-finding path that works
on private repos (F-58: `git/trees` walks, `repo.search` does not). Both sit in Session B's
claimed files. Learn arrives by filing a learning row — a far-out forecast horizon does not bar
completion (arrival and settling are separate facts; read Round 6's recorded hold before
claiming otherwise).

**Marked for deletion, standing:** `prove-loop.ts` (untracked, repo root) — service-role track
insert plus hardcoded success print. Fake-agentic; never run it, never commit it.
