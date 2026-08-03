# The seven-station spine delivers, unattended

> _Created: 2026-08-01 · Last updated: 2026-08-01_

> Status · **Shipped and verified live 2026-08-01** (`main` through `11330af7`; all migrations applied to production; deployed) · Surfaces `/today`, the track panel on each station, `/boundary` · Owner agents: the full 15-seat cast across all seven stations

## What it does

One piece of work now walks **Discover → Decide → Plan → Design → Build → Ship → Learn**
on its own, with nobody watching, and **produces a real artifact at every station it
passes**. A cluster of evidence becomes work without anyone clicking; each station runs
its whole crew; each agent is briefed with what the previous one actually filed; the
track meters its own spend and stops when it reaches its ceiling.

Verified on the live system rather than argued from the code: a real track walked Plan
through Learn autonomously and finished `status = done`, filing a prototype, a mission
and a graded learning along the way.

## Why it exists

The driver shipped on 2026-08-01 morning and, on its first honest test, **ran the whole
loop and delivered nothing**. It advanced Plan → Design → Build → Ship producing one
prototype and no spec. Four independent silent failures, each of which hid the next:

1. **The tool was unreachable.** Plan's agent wrote a complete, correct spec into its
   final answer and never called `prd.draft`, because that account had no `agent_tools`
   row for it and `loop.server.ts` built the tool list from that table. A tool with no
   row was not disabled, it was **invisible**. Measured live: **11 of 16 accounts could
   not draft a spec**, and `prd.revise`, `decision.revise` and `roadmap.move` were
   reachable by nobody at all. Discover and Plan, the two stations that START the loop,
   were the two that could produce nothing.
2. **There was no handoff.** `stationGoal` took only the track's title and origin, so
   Design never saw the spec and Build never saw the design. Learn's brief said "compare
   against what the spec said" while never being shown the spec. Seven stations were each
   handed the same one-line brief and asked to invent the rest.
3. **The driver advanced on silence.** A station that ran cleanly and filed nothing was
   indistinguishable from one that did its job, so 1 and 2 could never surface. Build
   reported, correctly, that it had been given nothing to build. The track advanced to
   Ship anyway.
4. **The loop discarded correct tool calls over one field name.** Models emit
   `{"type":"learning.record","args":{…}}` rather than the contract's
   `{"type":"tool_call","name":"learning.record",…}`, because they put the tool in the field
   literally called `type`. `action.name` was undefined, the loop answered
   `Unknown tool: undefined`, and fully-formed calls carrying a verdict, an evidence id
   and reasoning were thrown away. **Invisible in code, in tests and in every status
   field**; found only by reading a live `agent_run_checkpoints` row.

## Where to find it

- **Any station surface** → open a track → the chain (what it has) and the activity
  (who did it) sit one above the other.
- **`/boundary`** → two ceilings: what one run may spend, and what one piece of work may
  spend end to end.
- **`cron.cluster-tick`** → clusters that clear the bar become tracks on their own.
- **`cron.track-tick`** → drives up to five open tracks per sweep, bounded by a deadline.

## Demo script (≤ 2 min)

1. Open a track on any station. The **chain** shows the route with waived stations and
   their reasons; the **activity** shows each agent that acted, in order.
2. A running seat shows `AgentPulse`: the seven-petal mark turning beside a rotating
   gerund with running dots. A finished one states what it filed, in the product's
   words: _"Draft filed a spec"_, or the honest _"finished, filing nothing"_.
3. Where the station changes, the row reads **"picked up from Plan"**, the handoff, made
   visible for the first time.
4. On `/boundary`, lower the piece-of-work ceiling below what the track has spent. The
   next tick holds it with `over-budget`, and raising the ceiling resumes exactly where
   it stopped rather than restarting.

## How it works

### The route and the crew

`spine/route.ts` models the route (entry, path, waivers with reasons). `spine/driver.ts`
decides whether a track may move and **who acts**: `stationCrew()` returns the station's
whole crew in working order, derived from `SPECIALIST_CATALOG` so an agent cannot be
added to the roster and quietly left out of the loop.

Before today the driver dispatched **one** agent per station, so 7 of 13 active agents ran
and six never ran at all. Three seats were then genuinely missing and were created:

| Seat | Station | Why it had to exist |
|---|---|---|
| `design-critic` | Design | The only station with nobody reading the work back |
| `release-verifier` | Ship | Nothing checked readiness before the one irreversible station; a person was the only check, which is the gate doing policy's job |
| `insight-keeper` | Learn | Measure graded one outcome and nothing carried the grade forward. A station that only writes a `learnings` row is storage, and the brain is not storage |

The crew runs **within one tick**, sequentially, so "one tick = one attempt at one
station" stays true. A seat that hits a boundary stops the crew rather than letting later
seats review work that does not exist yet.

### The handoff

`describeUpstream()` in `spine/driver.ts` threads what earlier stations filed into the
next station's brief, newest two artifacts in full (6,000 chars each), older ones named
by kind and id. The server side (`loadUpstream`) reads `spine_track_members` and resolves
each artifact through `ARTIFACT_SOURCE`, **the same map the chain panel uses**, so the
brief an agent is given and the record a person audits are one story about one piece of
work.

Every brief now also names what the seat must **file**, as the tool that files it.
"Record the decision" is a sentence an agent can believe it satisfied by writing a
paragraph; "call `decision.record`" is not.

### No advancing on silence

A station that runs cleanly and files nothing holds with `produced-nothing` and counts an
attempt, bounded by `MAX_STATION_ATTEMPTS`. It is named separately from `stalled` because
the causes differ: `stalled` means "stop spending on this", while this means "the run
worked and its output went nowhere".

### Tools are platform policy, not per-user rows

`TOOL_REGISTRY` is the list and [`src/lib/ai/tools/defaults.ts`](../../src/lib/ai/tools/defaults.ts)
is the policy. `agent_tools` now holds **only per-account deviations**: an absent row
means the default applies, never "you may not". A new tool is live for every account the
moment it ships; a new account needs no seeding at all.

**Never seed `agent_tools`.** All seven historical seed functions are no-op'd in the live
database, including the two `handle_new_user` called directly (emptied rather than
unhooked, because that function is regenerated by Lovable syncs).

Adding a tool is a registry entry plus a `TOOL_DEFAULTS` entry, no migration, no
backfill. `tools/defaults.test.ts` fails the build if you add one without the other.

### Three ceilings, and why the middle one had to exist

| Layer | Bounds | Default |
|---|---|---|
| Run / mission | one dispatch, or one mission's runs | $10, fail-closed |
| **Track** | one piece of work end to end | **$5** |
| Workspace / day | everything | operator-set |

`runtime.server.ts` already carried the lesson: _"a ten hop mission got ten separate
ceilings and could spend ten times the cap with every individual check passing."_ That
became true one level up. Only Build opens a mission, so **six of seven stations dispatch
with `mission_id = null`** and each of their runs carried an independent ceiling that
nothing summed. Measured live: of 14 driver runs, 6 had a mission and 8 did not.

The track ceiling is checked **before every seat**, not once per tick, and the meter is
persisted on **every path out** including holds and stalls, a counter that only advances
on the happy path is a budget that resets itself whenever work gets interesting.

### The front door

`spine/promote.ts` decides when a cluster becomes work. Before today, `startTrack` had
exactly one caller: a button. **307 of 308 signals were clustered into 181 themes and one
track existed.** The driver was built because a station transition required a click; the
loop's *entrance* still had precisely that shape.

The bar is evidence, and **all three must clear**: frequency ≥ 8, severity ≥ 4,
confidence ≥ 0.75. Deliberately not a weighted score, a score lets one huge number carry
two weak ones, so forty low-severity mentions of something trivial would open work.
Calibrated against the real distribution of 181 live themes; it selects roughly the top
tenth.

Four guards: bounded at **2 per workspace per sweep**; a partial `UNIQUE` index on
`spine_tracks.theme_id` makes a double promotion impossible even when two ticks overlap;
a theme a person dismissed or merged is never re-promoted, because no bar may overrule a
human judgment; and everything it starts is bounded by the track ceiling.

> **Scope note for operators:** `cron.cluster-tick` processes up to five workspaces, so
> one tick can legitimately open up to **ten** tracks, not two. Check against
> `2 × (distinct workspaces in that tick)`.

### Making it visible

`agent_runs.track_id` was the missing link: a run was attributable to a user, a workspace
and sometimes a mission, but never to the piece of work. `spine/activity.ts` builds the
stream and `TrackActivity` renders it, who acted, what they filed, and where the baton
moved.

It **reports and never guesses**: "working" is said only when the row literally says
`running`, an unrecognised status renders as stopped rather than a clean finish, and a
turn that filed nothing says so. A status display that invents state is worse than none,
because a person cannot tell the inventions from the facts.

## What this cost, measured

| | |
|---|---|
| One agent run | ~$0.03 |
| Full track pass | ~16 runs, ~$0.50 |
| Same with every station retried to the ceiling | ~$1.50 |

## Guards that keep it from regressing

| Test | Fails the build when |
|---|---|
| `tools/defaults.test.ts` | a registered tool has no platform default |
| `spine/agent-roster-seed.test.ts` | a catalog agent has no roster row |
| `spine/driver.test.ts` | an active agent is in no crew, or a station drops below a maker and a reader |
| `spine/promote.test.ts` | the promotion bar loosens, or a settled theme becomes promotable |
| `spine/track-caps.test.ts` | a ceiling fails open instead of closed |
| `ai/action-envelope.test.ts` | the loop stops accepting the action shape models emit |

## Known gaps

- **Promotion has shipped but has not yet been observed firing live.** It runs inside
  `cron.cluster-tick` and needs a sweep. This is the first thing to verify.
- **`AgentPulse` is wired into `TrackActivity` only.** The founder asked for it across
  every surface where an agent runs, with per-action detail (which file, which line, which
  mockup). See the UX brief in [`operations/session-handoff.md`](../operations/session-handoff.md).
- The Build terminal does not yet show what changed; Claude Code's diff view is the
  reference to lift.

## Related

- [`operations/session-handoff.md`](../operations/session-handoff.md), the open UX brief, in the
  founder's own order and words
- [`loop-runs-itself.md`](./loop-runs-itself.md), the June mission-level twin of this,
  one layer down: that one carries a mission's DAG, this one carries a piece of work
  across stations
- [`planning/rebuild-2026-07/GOVERNANCE-PRINCIPLE.md`](../planning/rebuild-2026-07/GOVERNANCE-PRINCIPLE.md), why
  the bar is set in advance instead of queued for approval
