# S4 handoff · the proving ground · 2026-08-28

**Read this before re-investigating anything.** As the proving ground my job this session was to
settle claims, so the most valuable thing here is the list of what is now **PROVED**, what is
**REFUTED**, and what is still **UNVERIFIED**. Do not re-litigate the first two. Do not trust the
third.

`lane/proof` is rebased onto `main` and pushed. **S0 does the integration merges — do not push to
`main` from a lane.**

---

## 1 · PROVED, and settled

| claim | evidence |
| --- | --- |
| **The gates could not see the code that proves the product works.** `tsconfig.json` includes `src/**` only; `e2e/` is absent and every `*.test.ts` excluded. | A `const x: number = "definitely not a number"` in a spec produced **zero** tsc errors. Fixed: `e2e/tsconfig.json` and a `tsc:e2e` gate, mutation-tested both ways. |
| **`bun test` does not run Playwright specs.** The only execution the harness gets is a lane running `check-motion.sh` by hand. | I broke a spec (`VIEWPORT.width` where `VIEWPORT` is undefined on most runs) and all four gates went green on a spec that could not start. |
| **The unit suite is unchecked: 797 files, 414 type errors.** | Measured with a tests config; 9 further errors were probe artifacts and are excluded. |
| **The detector for the commonest defect was run by nothing.** `check:unreachable` finds 141 of 656 server functions and 80 of 492 components with no importer — including all five orphans S3 found by hand. | `grep -c "check:unreachable" scripts/lane-gates.sh` returned **0**. Now a gated ratchet. |
| **The retired design system is still reachable through an alias.** 59 aliases in `styles.css` resolve to `--ds-*`; **46 files** use one and every one passes the existing ratchet. | Now a gated ratchet at 46. |
| **`track_drives` is written 323 times and read nowhere.** 277 sweep, **40 presses across 19 tracks**, 6 continuation. | The only `SELECT` in the repo is inside a test's documentation string. `driven_via` is the column the acceptance query needs, and no screen shows it. |
| **Two safety mechanisms are wired and never fed.** `mission_token_cap` NULL on all 2,847 runs — no default, no resolver, no caller. `ai_budgets` holds no cap on 10 of 14 rows. | The most expensive run used 233,988 tokens against no ceiling. |
| **The mission spend cap has never been tested.** `$10` cap, most ever spent on one run **$0.1420** — 1.42%, and not one run reached half. | Untested, not broken. |
| **`guardrail_hits` cannot be cited as evidence in either direction.** 7,225 of 8,535 are demo fixtures whose oldest and newest rows share a microsecond a month apart; the 1,310 "real" ones sit at 83 instants with up to 24 rows of a **single** rule at one microsecond. | 439 runs under live rules in 30 days wrote nothing. 83% of recent runs are in workspaces with no rules at all. |
| **113 of 324 boundary calls expired unanswered** — 35%. | Bears directly on R-18. |
| **No mounted control can rate a recall** (S3's finding, verified independently). `MessageMetaFooter` is exported and imported by nothing. | 77 ratings, last 23 July; `ignored` is the row **default**, 12,454 of them, still written yesterday. |
| **Contrast is viewport-independent.** Identical at 390, 768 and 1280 on every public surface. | So the baseline needs one set of numbers, not three. |
| **All 29 baseline surfaces have a contrast number, nothing unjudged.** 18 signed-in surfaces measured on a phone; 12 have nothing under the WCAG floor. | Ratchet armed and mutation-tested; only contrast fails a build. |
| **Nothing in the product scrolls sideways at 390.** | Reported only after the check was watched firing on an injected 900px element. |

## 2 · REFUTED — do not chase these again

- **"The guardrails went silent 33 days ago."** I drafted it. The silence is when somebody last ran a
  seed. Absence of hits is not absence of screening — `callModel` screens unless told not to.
- **"`--mrd-mute` is 0.07 short."** The token is fine. The cause is `--mrd-select`, a 17% white wash
  on the **selected** stage only. S0's 7.12 and my 4.43 were both right, describing different states.
- **"`spine_tracks.spend_cap_usd` is never fed."** `resolveTrackSpendCap` falls back to the workspace
  default ($5.00 on all 21) and then to a constant. A null column with a resolver is not a defect.
- **"`--mrd-fail-bright` / `--mrd-pass-bright` are orphans."** Both exist only inside a doc comment
  recording their removal. The engine room paints correctly.
- **"The `md` breakpoint leaves iPads without touch targets."** 767 and 768 measure identically. The
  failing controls are `<a>` styled as text, so `CONTROL_SHAPE` never applied at any width.
- **"The decay sweep is eating unrated memories."** `outcomeImportance` returns 3 or 4 against a prune
  floor of 2, deliberately, with the reasoning in the file.
- **"Editing a bash script mid-run corrupts its verdict."** Not reproducible at 4/8/16KB, spanning the
  real file's 12,178 bytes. The snapshot guard I wrote for it was withdrawn.

## 3 · UNVERIFIED — trust nothing here

- **The `1280` width of the brand-link fix.** Layout-neutral by construction and measured at 390; the
  rail selectors were not present in the desktop probe.
- **Everything measured on `lane/proof` before the rebase**, against S3's and S2's later fixes. The
  contrast and tap numbers in verdicts S4-131 to S4-152 predate them.
- **Whether `guardrail_hits` would record an organic screening event.** Needs a run under live rules
  with a deliberate violation. Nobody has done that.
- **Whether the 414 test-suite type errors hide broken assertions.** S3's sample of four files found
  two tests that did not test. If that rate holds it is a few dozen assertions not running — a much
  stronger argument for clearing it than "tsc should be clean".

- **That the red CI on every branch is a billing block rather than a test failure.** S2 reports the
  runner refusing to start with *"recent account payments have failed or your spending limit needs to
  be increased"*, sampled across four runs. **I could not verify it: `gh` is not installed in this
  worktree.** Recorded as reported, not as measured.

  The lesson is mine to keep regardless of the cause: **a check that never started is
  indistinguishable, in a branch list, from a check that ran and failed.** Same shape as a gate killed
  at exit 137, and the same shape as the `0 errors` this session got from a compiler that had died.
  **A gate that was not run is not a passing gate and it is not a failing one either.**

## 4 · Left measured and unowned

`meridian/` and `shell/` have no live owner. Each of these is measured, not guessed, and not touched:

- **`Door`** — the retry control in every failure line, 56x21, inline in prose. Padding it changes the
  line box of every sentence it sits in. Needs a standalone variant, not a padding class.
- **`ReadFailed`** repeats the shell's session sentence and draws a second Sign-in door. The rule is
  already written in `AppFrame`: *"the shell says it once, above everything"*.
- **`track_drives` has no reader.** The fix is not a migration — the data is correct and already
  there. It is a surface that says who drove this work.

## 5 · The gate is now six

`tsc` · **`tsc:e2e`** · **`unreachable`** · **`aliases`** · `docs:check` · `test` · `build`

Two did not exist yesterday. `check:dead-writers` is deliberately **not** gated: whether a dead writer
is a defect needs a judgement per table, and a gate that fails on a judgement is one people route
around.

Every ratchet freezes today's debt and fails only on growth, and every one carries an anti-vacuity
guard: **a scan of nothing must never report clean.** That rule was earned three times tonight — a
`0 below AA of 0 judged`, a `0 errors` from a compiler that had died, and a `12,531 of 12,531` that
was counting a default.


### Two kinds of green board, and the remedies are opposite

Sharpened with S2 at the close, and this is the most useful thing in the ledger.

**A tool's silence misread as its verdict.** Three instances tonight:

- a CI check that **never started** — indistinguishable in a branch list from one that ran and failed
- a gate **killed at exit 137**, which looks exactly like a gate that was not run
- a compiler that **died mid-run** and reported `0 errors`, which I nearly filed as a clean suite

**No tool having an opinion at all.** One instance, a different shape:

- `background: var(--mrd-raised)` named a property declared nowhere. A bare `var()` on an undeclared
  custom property is **legal CSS** — the declaration is silently dropped and the element inherits.
  tsc, eslint and the build were all **correct** to stay silent. There was nothing for them to
  report. It surfaced only because a guard was widened from the retired `--sp-` family to the one
  everybody actually writes.

**Both end in a green board and a wrong screen, and that is where the similarity stops.** The first
three need the runner's status surfaced, so silence can be told from a verdict. The fourth needs a
check that does not exist yet — S3's proposal is the right one: every `var(--mrd-*)` in the repo must
name a property `meridian.css` declares. Mechanical, cheap, and it would have caught this on the
introducing commit.

**Do not treat them as one problem.** A team that hears "our checks missed it" four times will
harden the checks it has, which fixes three of these and cannot touch the fourth.


## 6 · The habit worth keeping

**Four defects in my own instrument were found by trying to prove a fix, not by hunting a fault.** It
measured the box not the target; counted a click on the parent as a hit; could see the 44 bar but not
the 24 floor; and treated `null` from an off-viewport probe as a failure. Each returned a confident
wrong answer rather than no answer.

**A check nobody has watched fail is not a check.** Mutation-test with a real defect — a real orphan
file, a real bad annotation — rather than by editing the baseline. Editing the number proves the
arithmetic; the file proves the detector.

---

> **Below this line: the other lanes' handoffs from the same night, preserved intact.**
> This file is written by every session at close, so a merge here is two lanes reporting, not a
> disagreement. Nothing was dropped to resolve it.

# S3 handoff, 2026-08-28 ~00:30 UTC

**Lane `lane/platform`, 32 commits U-111 to U-141, all pushed, all gated.** The tree is clean and
every unit is coherent on its own. Nothing is half-landed.

## THE ONE PATTERN WORTH CARRYING FORWARD

**Unreachable finished work is the most common defect on these surfaces.** More common than wrong
logic, and INVISIBLE TO EVERY GATE: it typechecks, it lints, it builds, its tests pass. Seven
instances in one night, each a capability wired end to end with no way in:

| What was finished | What was missing | Unit |
| --- | --- | --- |
| `BoundaryTool.chosen` (S0 shipped the field) | nothing read it | U-125 |
| `MessageMetaFooter`, the only caller of `submitFeedback` | mounted nowhere, so **nothing in the product can rate a recall** | U-137 |
| `AutoChip`, 32 lines | never drawn, so **166 of 369 decisions read as hand-raised** | U-138 |
| `OutcomeHistory`, 188 lines | built for a tab it never reached | U-140 |
| `data-motion`, 8 CSS rules + a MutationObserver | **nothing in `src/` ever wrote it** | U-141 |
| `AskInPlace`, 176 lines | S1's mounts, still open | — |
| `LiveTicker` | S2's top bar, still open | — |

S4 has now gated the class (`bun run check:unreachable`, baseline 141 server functions / 80
components, fails on an increase).

**ONE THING THE NEXT SESSION MUST NOT RE-INVESTIGATE, AND MUST NOT TRUST AT FACE VALUE.** That
detector counts a component orphaned when no STATIC import names it. It does not see
`React.lazy(() => import("…"))`. I checked ten of the components it lists — `ApprovalsPanel` (5
callers), `CompoundingPanel` (7), `ArtifactsView` (4), `AgentRosterPanel`, `IncidentsPanel`,
`SelfImprovementPanel` (2 each), `SupportSignalsPanel`, `EvalCalibrationPanel`, `EvidenceRule`,
`PairMark` (1 each) — and **every one is mounted**, most through a lazy import in a route. The 80 is
therefore an upper bound, not a work list. The ratchet is still worth keeping (it cannot regress),
but do not go mounting things off that output without grepping for the name first. Fixing the
detector to follow `import(` belongs to S4, who owns `e2e/`.

## What changed that a person can see

- **Boundary / Guardrails, `src/components/governance/BoundaryControls.tsx`** — rebuilt around one
  question: *what can these agents do without asking me.* Posture headline, then where the crew
  stands, then three regions each stating the SET-vs-RUNNING disagreement in words
  (`Set to Ask first, and it does not: …`), then what your answers changed, then the ceiling and the
  kill switch. Six new pure modules with guards: `ceiling-reality.ts`, `gates-nobody-answered.ts`,
  `what-they-actually-did.ts`, `where-the-crew-stands.ts`, `who-chose-this.ts`,
  `guardrail-silence.ts`.
- **`getBoundary` now buckets on what a tool RUNS AS, not what it is set to** — it composes the seed
  with the arc dial and the safety floors through `resolveToolMode`, which is what the loop does. A
  row set to `confirm` on a `trusted` arc runs as `auto`, and the screen used to file it under "asks
  first". 96 of 97 `agent_tools` rows run as `auto`.
- **Three-state discipline everywhere** — `false` is not `null`, absent is never claimed as false, a
  failed read never renders as zero. Four panels used to say the record was empty when the read had
  failed (U-120).
- **Tap targets** — 44px floors across the home page, `/product`, the legal footers and the failed-room
  control. The footer link's target is a centred `::after` overlay because it sits inline in prose and
  cannot reflow the row.
- **Motion** — Settings › Appearance now carries the switch the whole product was already obeying.
  It can only ever AGREE with an operating-system reduced-motion preference, never override it.
- **`bun run typecheck:tests`** — no test file in this repo had ever been typechecked. Two of mine
  were not testing anything (U-131) and six fixtures were not the shape the product returns (U-132).
  Deliberately NOT gated: 414 errors remain, visible and drivable.

## OPEN, and why I did not take them

Each needs an owner who was offline, and each is one small change:

1. **`Door` is 56×21 inline in prose** (`src/components/meridian/`). `CONTROL_SHAPE` already gives
   every `Action` a 44px floor below `md`; `Door` never got it. The remedy is the `::after` overlay
   from U-135, which is already shared in `src/styles/public-legibility.css`.
2. **`ReadFailed` repeats the shell's session sentence and adds a second door.** `AppFrame` already
   states the rule: the shell says it once, above everything. Same directory as (1).
3. **Nothing mounts a recall-rating control.** `MessageMetaFooter` and `submitFeedback` both work;
   the surfaces that would carry "did this help" are S1's. Until one does, the Brain's 77-of-12,531
   rated count is what was rated before the control was taken out, and U-139 says exactly that on
   screen rather than implying the rest were unhelpful.

## Do not re-measure these

`guardrail_hits` stop dead on 2026-07-25 and S4 showed most are PLANTED (7,225 sample-workspace rows
sharing a microsecond a month apart). Spend ceiling is $10 on all 21 workspaces against a max single
run of $0.142. `mission_token_cap` is NULL on all 2,570 runs with **no resolver and no caller**. 92
of 324 approvals expired unanswered. 133 of 135 learnings have a NULL `decision_id`. One
`user_notification_preferences` row against 16 profiles (U-134).

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

## What the integration pass turned out to be for

`main` is integrated and green: **12,849 tests across 866 files, 0 fail**, tsc 0,
docs 0, build 0. Three passes so far, all four lanes each time.

**The two defects it found on the first pass could not have been seen by any
lane**, and that is the argument for doing it several times an hour rather than
once at the end:

1. A guard on one branch caught code on another. `a-failure-line-never-argues-
   with-itself` asserts a `ReadFailed` given `error` must not also have a child
   calling `failureLine`, because both answer an ended session and the sign-in
   sentence then prints twice in one box. Two files did exactly that.
2. **A tripwire fired.** `a-toggle-that-cannot-deliver` was written to fail the
   moment any surface began rendering the in-app feed, and to carry instructions
   for whoever hit it. S2's `SystemAlerts` does. The hold lifted for budget and
   drift, and the settings page's own copy had gone false with it.

### The recurring shape, now named

**Two sentences agreeing a few lines apart are worse than two contradicting** (S2).
A contradiction tells a reader something is wrong; agreement leaves them unable
to tell which line is the surface's own claim. Three instances this week, every
one **two correct components**, every lane's gates green, and no test either
session could write sees a composed screen.

`two-lines-on-one-screen-must-not-restate-each-other.test.ts` is the structural
guard: no shared run of three significant words between a hold line and its way
out. It asserts no wording, and it found a live restatement on its first run.
**Its blind spot is named beside it:** it catches saying a thing twice and cannot
catch saying it zero times, which S1 and I promptly did to the same hold from
opposite sides.

### Convenience-shaped commands that did more than the sentence in your head

Four from three lanes in one night, worth a named section rather than four
scattered warnings:

| Command | What it actually does |
| --- | --- |
| `cmd \| tail` / `\| head` in a `&&` chain | reports the pipe's exit status, not the command's |
| `eslint --fix src/routes` | reformatted 27 files across three lanes' prefixes |
| `git checkout <sha> -- <file>` | **stages** it, so the obvious restore reports success and leaves the reverted code in the tree |
| `.apply((q) => ...)` on a PostgREST chain | **the method does not exist** and still typechecks, throwing at runtime |

The last is the nastiest: the other three are commands taking a wider path than
you said, while that one is the type system not looking at all — the same family
as a wrong column inside a `select` string.

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
