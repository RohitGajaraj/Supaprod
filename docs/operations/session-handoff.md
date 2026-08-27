# S2 · MISSION CONTROL handoff, 2026-08-28 ~05:20 IST

**Branch `lane/control`, pushed at `e4361662b`, tree clean, 0/0 with origin. No dev server of
mine; port 8080 is free as far as I am concerned.** Closed on the founder's instruction relayed
by S0, mid-unit, with the unit finished rather than abandoned.

## DONE this session, last first

- **`e4361662b` The rail carries the working crew, on every surface.**
  SPEC-MULTIPLAYER-PRESENCE §3.4, the largest item my brief names me owner of.
  `RailCrew` mounts once in `AppFrame` between the nav and `.sp-railfoot`, so the answer to
  "who is working and on what" is the same on every surface. Pure derivation in
  `src/components/shell/rail-crew.ts` (newest anchor per agent), 18 tests across two files.
  It shares `queryKey: ["presence", "anchors", workspaceId]` with `OverlapNote`, so the board's
  collision marks and this stack are two renderings of one fetch and cannot disagree.
- Before it, 31 units on this lane, all gated: the board no longer states more than its reads
  support (false all-clears, capped-read counts, cross-scope numbers, restatement), every
  `SlowRead` in the product offers a way out after 15s, and the poll helper backs off on failure.

## OPEN, and it is mine

- **§3.1 the cursor layer and §3.2 the shared-object indicator are NOT BUILT.** §3.3 the
  collision mark exists but only on the board, via `today/OverlapNote.tsx`; the spec puts it
  app-wide in the shell. §3.4 is now built, so the remaining three are the whole gap.
- **The empty-workspace path has never been verified in a browser**, after three attempts that
  each failed on my instrument rather than the product. Draining server-fn responses does not
  work: every function has its own shape and a generic drain leaves the page at ~841 characters
  of nothing. The honest instrument is a genuinely empty workspace, i.e. a second account.
  `quietMorning`, `CrewPulseNote` and now `RailCrew`'s quiet state are pinned by unit tests only.
- **The fold is still the founder's call, not mine.** At 1440x900 the first Approve sits at
  946px. Every remedy costs something real; the analysis is in `docs/lanes/log/S2.md`.

## FOR S0 AND S1 — a swallow that makes a failure indistinguishable from calm

`getWorkspaceAnchors` (`src/lib/approvals-queue.functions.ts`, around line 1947) catches a failed
`agent_runs` read and **returns `{ anchors: [], collisions: [], unknowableRuns: 0 }` rather than
throwing**. So `isError` never goes true, and one branch is reached by both "nobody is working"
and "we could not find out". That is why `RailCrew`'s quiet state is a DOOR to `/start` and not a
sentence: a sentence there would be a false all-clear on a dead feed. Fix it at the source and the
door can become the honest sentence the spec asks for. **Do not "fix" the component instead.**

## FOR S4 — §3.4 is built, and here is what to point your standing check at

Your check is that no presence mark exists which cannot be traced to a row. `RailCrew` cannot
break it structurally, not carefully: `getWorkspaceAnchors` filters `agent_runs` to the live
statuses and joins `tool_calls` only to those runs' traces, so every mark drawn IS a live run.
Runs with no `trace_id` are counted, never drawn ("N more are running and not saying what"),
because dropping them would undercount the crew on the one control that answers "how many".

## DO NOT RE-INVESTIGATE

- **Em dashes.** 0 in user-facing strings across 1175 non-test source files, 0 visible text nodes
  on the rendered board. Closed.
- **Meridian adoption.** 49 of 49 components have an importer. Closed.
- **`missions` has no subject key** (full column list checked). Duplicate detection matches on
  title as a floor. If a real subject relation lands, the title matching GOES rather than
  becoming a fallback.
- **A growing test-failure count on an unchanged tree is a machine report, not a test report.**
  I watched 2 -> 7 -> 15 timeouts at load average 28-31 with four lanes running gates;
  `bun test --timeout 30000` returned 12,773 pass, 0 fail on the same tree. A chained gate run
  returned exit 137 (killed) the same way. Run gates individually with a captured exit code.
- **Prose is not code.** Four times a sweep of mine reported my own explanatory comment, quoting
  the line it had replaced, as the defect. Strip comments before scanning.

## MID-FLIGHT WHEN THE CALL LANDED

Nothing half-applied. The RailCrew unit was the in-flight work and it is finished, gated and
pushed. `src/styles/shell.css` carried a stray trailing newline from CSS I had added and then
removed; reverted to HEAD, so the file is untouched by me.

---

# S4 handoff, 2026-08-27 ~04:00 UTC

**FIRST DECISION OF THE MORNING: nothing fixed last night is live.** Production deploys from `main`
and all four lanes sit 9 to 16 commits ahead. Every fix is inert until a merge, and that merge is the
founder's call. S0 declined to take it unilaterally.

## The acceptance, and why it is 0

The loop worked. `a30238f5` walked `sense` to `ship` agent-driven after S0's Discover fix: 13
members, a real pull request, five stations in under three hours, on a track that filed nothing
across twelve drives that morning. **Do not press it** — it is S0's proving ground.

It is parked at `ship` on `given-up`, a terminal hold, and both of Ship's refusals are correct.

**Three things stand between here and R-18, all definitional rather than broken:**

1. **The published query will report a FALSE PASS.** It excludes decided approvals and cannot see a
   press. `a30238f5` has 0 decided approvals and **7 presses**. One extra `NOT IN` against
   `track_drives.driven_via='press'` fixes it (`S4-071`). 19 of 106 tracks carry a press.
2. **No agent can clear a design gate and there is no `prd.approve`** (`S4-076`, corroborated by S0).
   The acceptance also forbids `waived`, so three things must hold that cannot. S0 built `spec-gate.ts`
   for this (F-116).
3. **117 of 119 specs carried no success metric**, so Learn had nothing to grade (S0, F-117).

## What I built, all in `e2e/`

`bash e2e/check-motion.sh [--signed-in] [--phone] [--expired-session] [paths…]`, also
`bun run check:motion`. Boots against a dead database, fabricates the session the guard reads (no
credentials), warms routes **in a browser** and reports: motion that survives a dead backend,
counted progress that ADVANCES (this one fails the build), failure sentences per surface, clipped
unreachable content, controls a screen reader cannot name, prose past Meridian's 68ch measure.

`e2e/helpers/surface-census.mjs` answers what all 95 URLs do: **51 render, 43 redirect, 0 dead.**
14 of those redirects land on `/engine-room`.

## Open, by owner

- **S2** · the lit rail row on `/today` needs a three-way call with S1 and S0 (they fixed the label).
- **S3** · prose at **122ch on `/`** and **165ch on `/pricing`** against a 68ch token (`S4-085`).
- **S1/S3** · `/brain` and `/learn` each announce one dead read **7 times**; both have fixes unmerged.
- **Founder** · outward copy on the hero was checked against canon §5N and is CLEAN, not a defect.

## What I got wrong, so it is not inherited

`/runs` is a dead end (my curl warming), four surfaces show cache keys (my 401 shim), the settings
control is ungated (diagnosis inverted, gating would be the danger), the em dash leak is closed (a
column total proves nothing), `/meridian` is the worst surface (it is the component gallery), 15
forecasts are overdue (13 are demo fixtures). **Five of six were my instrument or my population.**

---

# Session handoff

> _Last updated: 2026-08-27, S0 CONDUCTOR_

## The finding that matters most: F-124

**The critical path is one action, and the "missing mechanism" is not missing.**

F-36 has stood for weeks as *"`release.publish` requires a `deployments` row the
loop cannot produce"*, and [`SESSION-0-CONDUCTOR.md`](../../the-first-run/SESSION-0-CONDUCTOR.md)
§1b calls the preview deploy **"the missing mechanism"** and ranks building it
second of five. Measured against the live database, every link in that chain
exists and every one has worked before:

| Link | Exists in code | Has run on SAMPLE | Has run on REAL work |
| --- | --- | --- | --- |
| `ci-poll-tick` | yes, active `*/2 * * * *` | — | — |
| Deno preview deploy | yes | **13 rows** | **0** |
| `studio.pr.merge` | yes | **14 executed** | **0** |
| Production promotion | yes | 1 row by `promote` | 3 rows, `provider='github'` |

**Nothing on that list needs building. But only the first column is evidence
about the platform; the middle column is evidence about fixtures.**

> **CORRECTION, made against my own finding.** The first version of this section
> read *"13 deno previews, 14 merges executed, nothing needs building"* and
> presented that as proof the chain has worked. **Every one of those rows is on a
> sample workspace.** On real work: **one changeset has ever merged, zero Deno
> previews exist, and no merge approval has ever executed.** That is the same
> mistake S4 made three times in one night and corrected each time, made by the
> session that had just been told about it.
>
> The founder's own rule, relayed the same hour: a measurement of current rows
> may shape PRIORITY and must not shape DESIGN, and most of these rows are demo
> seed. Here it had shaped a *conclusion*, which is worse.
>
> **The conclusion that survives is unchanged: the critical path is deploying
> `main`,** because nothing downstream can run while every merge queues for a
> person who stopped answering on 2026-07-10. What does not survive is the
> comfort that the rest of the chain is proven.

### And the correction sharpens the marker question, from "check" to "expect"

The one real changeset that **did** reach `merged` — `helio-labs/atlas-installer-portal`
— produced **zero Deno deployment rows**. So the preview step has never succeeded
on real work even when handed exactly what it needs. Meanwhile all 13 sample
previews are against `RohitGajaraj/Test-Project-Cadence`, a repo scaffolded by us,
and `renderStarterTemplate` writes `supaprod.json` into every repo it scaffolds.

**That is what a missing marker looks like.** So the `supaprod.json` question below
is not a loose end to check afterwards; it is the most likely next blocker once
the merge starts running, and it costs one file at the repo root. What stopped is the merge, and two dates
say it exactly: the last executed merge was **2026-07-10 17:14** and the last
Deno preview was **2026-07-10 21:22**. Since then, of every merge approval filed:
**21 expired undecided, 8 rejected** (most recently 2026-08-25 18:11, which is
F-79's row), **7 still pending, 0 executed.** All six real changesets sit at
`pr_open` with zero deployment rows, including two opened on 2026-08-27.

So the loop files a merge approval and waits for a person. **That is precisely
what F-75 fixed** — `studio.pr.merge` was pinned to `review` regardless of
`STUDIO_AUTO_SHIP`, so every merge queued. With F-75 deployed and the arc at
`trusted` (all 93 rows, and `loadAgentArc` defaults the other 190 agents to
trusted), it executes inline.

**The whole critical path is therefore: deploy `main`.** Production serves from
`main`; all four lanes sit 9 to 16 commits ahead of it; F-75 and everything from
F-114 to F-126 is inert until then. After the deploy the chain is merge → preview
within two minutes → `release.publish` → Ship → Learn, and every one of those
steps has a row proving it has run before.

**This session did not merge to `main`.** It is production, it is outward-facing,
and doing it while three other lanes hold unmerged work would be out of step with
how they are running. It is the founder's call, and F-124 exists to make it a
single one.

### The cheapest possible proof it worked, after the deploy

S4's before-picture, measured 2026-08-27 on real workspaces only. **37 of 55
tracks sit at `sense` and 35 of those are held** — so on real work the
seven-station loop has been a one-station loop, and Discover is not a station it
passes through but the place it stops.

```sql
SELECT t.station, count(*), count(*) FILTER (WHERE t.last_hold IS NOT NULL)
FROM spine_tracks t JOIN workspaces w ON w.id = t.workspace_id
WHERE w.is_sample = false GROUP BY 1 ORDER BY 2 DESC;
```

**The expected floor is 5, not 0**, and knowing that is what stops the result
being misread. Of the 37, five cannot be reached by the sweep at all: four hold
`station-cannot-finish` and one `going-in-circles`, both of which are in
`TERMINAL_HOLDS`. The other **32 are genuinely drivable** — every one is
non-terminal AND under the `MAX_STATION_DRIVES = 12` ceiling, so F-43 will not
stop them on the first tick the way F-99 describes. The highest `station_drives`
in the group, 90, belongs to a terminal track.

So: 37 → about 5 means the fix worked completely. 37 → 30 means it reached the
brief and not the outcome. 37 → 37 means it reached neither.

Re-run it a day after the deploy. **If `sense` does not fall well below 37, the
fix reached the BRIEF and not the OUTCOME.** That distinction caught both
sessions in one night: mine when a `FILE_IT` rewrite never reached a seat, S4's
when a check measured the container instead of the line. It needs no new
instrument.

### Three things to check beside the deploy, not behind it

1. **`supaprod.json` at the root of `Supaprod/relay-homeowner-app`.** See below.
2. **Five conflicted pull requests.** S4 measured every real merge failure in the
   product's life: eight, of which **five are `GitHub merge 405: Pull Request has
   merge conflicts`**. Nothing automated resolves those, and under F-75
   auto-merge the loop meets them again with no person in the run. F-127b makes
   the track say so by name when it does, instead of "this station could not use
   a tool it needed".
3. **The workspace binding**, corrected in F-110/F-111. An unbound workspace used
   to fall through to a deployment-wide `GITHUB_REPO`, and four tenants had
   written into one repository that way.

### The one unknown that could still stall it

Whether `Supaprod/relay-homeowner-app` carries a **`supaprod.json`** marker at its
root. `ci-poll-tick` deploys a preview only for a repo that has one. That repo is
private to the App installation and invisible to this session's GitHub identity,
so it could not be checked from here, and — until F-125 — the tick had never
recorded what it found. If the marker is absent, that is one file at the repo
root, not a code change. Worth confirming beside the deploy rather than
discovering after it.

---

## The structural finding: F-116

**R-18's acceptance was impossible by construction, and three columns say so.**

The path from Define to Ship passes three states, and a person is the only writer
of every one:

| Gate | Live state | Who can write it |
| --- | --- | --- |
| `prds.status` | 61 draft, 1 review, 43 approved | The human tray at `approvals-queue.functions.ts:1403`. **No `prd.approve` tool exists.** |
| `prds.design_gate_status` | **116 of 119 `pending`** | `decideDesignGate`, behind `requireSupabaseAuth`, stamping `design_decided_by: userId` |
| the success metric | **117 of 119 specs carry none** | nothing was writing one (F-117) |

`design_stage_enabled` is true on all 21 workspaces, so `pending` really does mean
nobody answered.

**The cause was not a missing permission.** `design-critic` is already in Design's
crew doing exactly this judgement, and its filing line said *"say plainly if it is
sound as it stands"* — **so a pass left no trace.** Only a change wrote anything,
and `pending` therefore meant both "nobody looked" and "the critic looked and it
was fine". The station was doing the work and had nowhere to put it.

[`src/lib/spec-gate.ts`](../../src/lib/spec-gate.ts) is the place the verdict
lands. It is modelled on `decision-gate.ts` and deliberately **stricter**, because
that module's argument for auto-approving is that a `decisions` row is a RECEIPT —
and **a spec is a LEVER**. A human's `rejected` is read first and can never be
overturned; nine gates each name a different next action; confidence is tested
positively so null, NaN and out-of-range all ask. No seat calls it: an agent can
only ask for its spec to be **argued against**, and a clearance is a consequence
of surviving that.

### The chain was verified as runnable, not only as built

After F-124b it would be fair to ask whether the F-116 chain is another thing
that exists in code and has never run. Checked, and it can run the moment `main`
deploys:

| Check | Result |
| --- | --- |
| Is the toolset per seat? | **No.** `resolveToolAccess(Object.keys(TOOL_REGISTRY), overrides)` — every agent gets every registered tool unless an override turns it off |
| `agent_tools` override rows | **97, none disabled, none touching these tools** |
| `critic.evaluate` mode | `auto` → under arc `trusted`, executes inline |
| `prd.draft` | `auto` → inline |
| `design.draft` | `confirm` → under `trusted`, inline |
| `learning.record` | `confirm` → under `trusted`, inline |
| Arc in force | `trusted` on all 93 rows, and `loadAgentArc` defaults the other 190 agents to trusted |

So nothing in the chain queues for a person, and nothing is switched off. **This
is the check F-114 existed for**: a rule the model was never given, and a tool a
seat cannot reach, fail the same way and look the same from outside.

---

## The recurring shape, found six times in one session

**A failed read and an empty result were the same value**, and every instance
produced a surface stating a confident falsehood rather than an error.

- the forecast desk reported no overdue calls and then **vanished from the page**,
  because its panel returns null when all three reads come back empty (F-120)
- Guardrails said "Nothing checks your AI calls yet" over a table it could not
  read (F-118)
- the autonomy dial returned `trusted` on a failed read, granting more
  independence than the operator had set (F-119)
- `getTrack` **did not destructure `error` at all**, so an unreadable track
  rendered as "this piece of work does not exist" on the run screen (F-126)

[`src/lib/read-failure.ts`](../../src/lib/read-failure.ts) now holds the one rule
that tells them apart, and it holds the counter-argument too: four tests defended
the old soft-fail with a better reason than the first fix that replaced it —
*"Migrations and deploys are two switches with no enforced order, and PostgREST
answers an unknown column with an error rather than a null."* Both are right, and
they are about different errors. `42703`/`PGRST204` is a deployment-ordering fact
and falls soft; anything else is a runtime fact and raises.

---

## What is still open, and whose it is

| Item | Owner |
| --- | --- |
| Deploy `main`, which is the whole critical path (F-124) | **Founder** |
| Confirm `supaprod.json` exists at the repo root | **Founder** |
| `AppFrame`'s live-work strip has no `isError` branch, so it will still show nothing when the read fails | **S2** (told) |
| Adopt `src/lib/track-origin.ts` and delete the local copy | **S1** (told, ready) |

**Do not press `a30238f5`.** It sits at `ship` on `given-up`, is already
disqualified by seven presses from before the Discover fixes, and is the proving
ground for whether the Ship fixes work. A press costs the only evidence it can
still give.

Full detail on every finding: [`the-first-run/FINDINGS-LEDGER.md`](../../the-first-run/FINDINGS-LEDGER.md),
F-114 through F-126.
