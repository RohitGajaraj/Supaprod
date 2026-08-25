# BUILDLOG

Newest first. **What changed · why · what is next.** One entry per logical unit.

This file is a build record, not a status board — status lives in
[`docs/planning/SOURCE-OF-TRUTH.md`](./docs/planning/SOURCE-OF-TRUTH.md), and what was found lives in
[`the-first-run/FINDINGS-LEDGER.md`](./the-first-run/FINDINGS-LEDGER.md).

---

## 2026-08-25 21:5x IST — deploy fired to unblock the live run · MAIN

**What.** `deploy_project` on current `main` (`045da4ef`). Everything below has been on `main` and
**undeployed**, which is why the acceptance run has spent seven station-drives grinding at Build
against a wall that is already fixed in source:

| | |
| --- | --- |
| **F-66** | `studio.pr.open` resolves the binding **before** trusting its cache, and refuses naming both repos. `studio.pr.merge` guarded too — it merges `/repos/{bound}/pulls/{stored number}`, which today 404s **by luck**. |
| **F-67** | `studio.unstage` exists, so a changeset carrying a forbidden path is no longer permanently unshippable. The commit refusal names it as the way out. |
| **F-68** | the driver cross-checks a seat's claim against its own `tool_calls`; every seat is told a step it was told failed may not be reported as done. |
| **R-27 #5** | a changeset that edited what CI runs may not ship. |
| **F-62** | `track_drives` — intervention is a log, not a slot the next sweep overwrites. |

**Why.** The mission's gate is *"watch a complete loop run itself end to end."* The run is at `build`,
`attempts 2`, `station_drives 7`, and **every one of those drives re-does ~90 seconds of real work
into a wall that source already removed.** Deploying is the shortest path between the code and the
gate.

**Next.** Verify the SERVING bundle rather than the publish status — F-59: a `status: completed`
describes the pipeline, not the bytes. Marker string `studio.unstage`, which is a new tool name and
so cannot be a stale match. Then watch for the first `studio.commit ok:true`.

**What I must decide.** Nothing yet. If the crew does not reach for `studio.unstage` on its own, the
refusal wording is the thing to change — not the tool.

---

## 2026-08-25 22:2x IST — Phase 1 closed. The moat has never fired. · MAIN

**What.** Three Fable audits, verified against code and the live DB, then acted on:

- **The front door is now `/start`** (`c4ce719d7`). `SIGNED_IN_HOME` flipped on R-15's seam, so ten
  doors moved together and reversing is one line. The measurement that decided it: a new account
  landed on `/today`, whose empty workspace opens with **five negations** and **no control that
  starts a run**, while `/start` — live, auto-driving, 500ms transcript, character present — sat
  behind a rail label a new user has no reason to press. **We built the right first screen and made
  it the side door.**
- **`AUDIT.md`'s last load-bearing error corrected** (`b27c312af`). It said *"NO STATION BRIEFS
  [`release.publish`]. So publish cannot fire."* Both halves false: Ship has briefed it since
  2026-08-01, and R-27 un-pinned it this morning. It would have sent someone to fix a non-problem
  while F-18 — **who answers the approval when publish fires** — stayed unmade.
- **F-70 and F-71 filed**, and they are the ones that matter.

**F-70 is the finding of the day and it is about the thing we call the moat.** Layer 03 — the brain,
*"the only one defensible alone"* — **has never fired once.**

```sql
SELECT count(*), count(DISTINCT date_part('microsecond', created_at)),
       count(DISTINCT created_at::date) FROM learning_citations;
-- 98 rows | 1 distinct microsecond | 7 distinct days
```

Ninety-eight citations across seven days sharing **one microsecond value** is one `INSERT` wearing
seven dates. `learnings` is 133 of 133 seed. `learning.record`, `brain.due_forecasts`,
`brain.outcome_history` and `brain.contradictions` have **zero calls across 2,638 agent runs**.

**The fix is reachability, not a writer.** No track has reached Learn from `sense`, so the brain's
tools have never been callable in anger, and everything downstream is dead by starvation rather than
by defect. **CLAUDE.md's own law — never claim accumulated learning in the present tense — is
violated by the data, not the copy**, and its prescribed honest form is simply true: nothing has
accrued yet.

**Why.** The mission's test is *"would a real user feel this, love it, and come back tomorrow?"* A
brain with 133 seeded memories and zero real ones fails that on day two, when they notice it learned
nothing from them.

**Next.** Two Opus agents are building Phase 3: the live route header on `/track/:id` (mounting
`RunMap`, which exists and was only ever mounted in the gallery) and per-turn work summaries with
inline artifact proof. Meridian has **no determinate-progress vocabulary at all** — no n-of-m, no
bar, no ETA — so that gets built as primitives, not one-off styles.

**What I must decide.** Nothing. **What the founder must decide:** whether `is_sample` keeps meaning
two contradictory things (F-71), and who answers the publish approval when a track reaches Ship
(F-18).

---

## 2026-08-25 23:3x IST — session close · MAIN

**The cleanest run this product has ever had is walking right now, unattended.**

```sql
SELECT from_stage, to_stage, driven_via, at FROM stage_events
 WHERE entity_id = 'd1168015-…' ORDER BY at;
-- sense  -> decide  | sweep | 17:10:34
-- decide -> define  | sweep | 17:30:37
-- define -> design  | sweep | 17:41:25
-- design -> build   | sweep | 18:00:19

SELECT driven_via, count(*) FROM track_drives WHERE track_id = 'd1168015-…';
-- sweep | 9        (zero 'press' — nobody has touched it)
```

**Five of seven stations, ten artifacts filed** (3 signals · 2 themes · 1 decision · 1 spec · 2 tasks
· 1 prototype), **entry station `sense`, `waived '[]'`, and not one human drive.** It is the first
track that can make that claim from its FIRST transition — `7977dc06` cannot, because its opening
five predate the `driven_via` column.

**The honest bound, agreed with Session A so we both write it the same way:** `d1168015` demonstrates
**the loop**, not **the discovery**. Its Discover station cleared by citing another track's spec and
decision as evidence (F-73), so the walk is real and the evidence base is self-referential. F-73's fix
is what lets the next track claim both.

`7977dc06` reached `given-up` at Ship, as predicted — three attempts against a changeset that never
committed. It served its purpose as the `studio.unstage` probe and its scorecard closed at 11:36.

### What this session shipped

**Nine findings filed, F-65 through F-73**, and the two that matter most are about the product's own
story rather than its code:

- **F-70 — the moat has never fired.** Layer 03, *"the only one defensible alone"*, has zero real
  activity: `learnings` 133 of 133 seed; **98 citations across seven days sharing ONE microsecond
  value**; the four brain tools at **zero calls in 2,638 runs**. The fix is reachability, not a
  writer — nothing has reached Learn, so the brain has never been callable in anger.
- **F-72 — Build handed on changesets that had never left the platform.** Three `studio.stage` calls,
  no commit, and `build -> ship` four seconds later. **Both existing gates passed it because both ask
  whether a thing of the right KIND exists; neither asks whether it is FINISHED.** That was the
  bounce.

**And three corrections against my own claims**, which is the part worth keeping: F-56's cited
evidence never existed (the CI job never ran), F-63's *"what saved us"* was wrong (nothing ran at
all), and **F-68 falsified the sentence I had repeated all day** — that no agent had reported work it
had not done. Eleven runs supported it. The twelfth did not.

### The front door, and the bug it caused

`SIGNED_IN_HOME` is `/start`. The measurement: `/today`'s empty workspace opened with **five
negations** and **no control that starts a run**, while the surface that shows work was behind a rail
label. **Then my own flip left the home with no rail at all** — `/start` rendered outside the shell,
so every signed-in person landed chromeless. Fixed by making the treatment follow the PERSON rather
than the path. **No test would have caught it: nothing asserts the home renders inside the shell,
because until today the home always did.**

### Next session picks up here

1. **Phase 3 is half-built.** The route header is mounted; the `here`-versus-`done` ink fix was
   in flight when the agent died, and **Meridian still has no determinate-progress vocabulary** — no
   n-of-m, no bar, no ETA. Build those as primitives.
2. **The IA decision is written and unexecuted** (`14 destinations -> 5`). Two calls are the
   founder's: killing the global station strip (it reverses his own 2026-07-30 ruling) and `Work`
   versus `Runs` as the label.
3. **F-70's reachability.** Learn has still never been reached from `sense`. `d1168015` is two
   stations away and is the best chance yet.

**What the founder must decide:** the two IA calls above; whether `is_sample` keeps meaning two
contradictory things (F-71); and who answers the publish approval when a track reaches Ship (F-18) —
which is now live, because R-27 un-pinned `release.publish` and Ship has briefed it since August.
