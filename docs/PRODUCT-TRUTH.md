# PHASE 2: Product Truth — What We Build and Why — 2026-08-26

> **One page.** The user, the painful job, what SupaProd does instead, why it is 10x, what we delete. Authority: The founder has this authority. If the seven stations or the brain are the wrong shape for the real job, merge them, cut them, or rename them.

---

## The User

**The front door: the individual PM or founding PM.** Not the team (nobody self-identifies as a team). Not the CTO (they have engineers). **The person who owns the call — what to build, why, whether it worked.**

Two mindsets within this door:
- **Energized (41%):** Excited about AI, hopeful, least burned out. **Primary target.**
- **Conflicted (35%):** Curious AND overwhelmed AND tired. They feel the judgment gap hardest. **Primary target — they can start today.**

**Reach them:** Talk about relief and judgment, never throughput or obligation. 82% already have speed. Speed is the disease.

**Scale:** Individual contributor buys themselves (PLG path). Expansion needs the VP of Product who wants the record (sales motion).

---

## The Painful Job: The Judgment Gap

**What happens today:**

A PM owns the whole arc: talk to users, decide what is worth building, write the spec, get it built and shipped, launch it, handle support, and learn from the result. That arc is smeared across **15 tools with a human manually carrying context across every seam.** The cost of switching, reconciling, and re-explaining at each seam **now exceeds the cost of the work itself.**

**The deeper pain:** Building commoditizes (code has a fast oracle, compiles in seconds). **Deciding what to build does not** (feedback lands in weeks to quarters). When an agent makes the engineer 5x faster, the PM's bottleneck shifts from "Can we build this?" to "Should we build this?" — and the ability to defend a call does not improve on its own.

**The name for this, from the community:** *"AI can accelerate delivery fast enough that the bottleneck moves. The teams I've seen get into trouble post-AI aren't the ones with slow pipelines. They're the ones where PMs got faster at shipping but didn't get better at defending why. **The judgment gap got exposed.**"*

---

## What SupaProd Does Instead

**One governed loop that owns the full arc, end to end.**

A PM enters signals (what is happening, what customers say, what competitors are doing, what their past calls were). The system surfaces what matters, proposes a decision to make, runs the work (or hands it to a builder), ships the outcome, measures what actually happened, and **writes that verdict back against the decision that caused it** — changing what the system surfaces next.

Seven stations, named for what a product operator actually does:

| Station | Job |
| --- | --- |
| **Sense** | Catalog what is happening: signals, customer voice, product data, competitors, past decisions |
| **Discover** | Cluster into themes: what patterns emerge? What is the real problem? |
| **Decide** | Record a decision: what are we choosing? Why? What do we expect to happen? |
| **Plan** | Spec it: acceptance criteria, success metric, any constraints |
| **Design** | Show it: clickable prototype, before code, so we can see if we want this |
| **Build** | Make it: handed to a builder (ours or yours); SupaProd watches, not makes |
| **Learn** | Measure it: what actually happened? Was the forecast right? Write the verdict back |

**The loop is a cycle, not a line.** The verdict from Learn re-ranks what Discover surfaces next. The system does not end with a report. It ends by changing what you are shown.

**Agents walk all seven stations.** A human sets boundaries in advance (autonomy level, approval gates, tool access). The agent does not ask for permission station by station — it works within those boundaries and tells you what it did.

**The product user can watch it happen on one screen.** A run timeline shows where the agent is, what it decided, what it changed, and what it needs. Not a dashboard of numbers. A live trace of thinking.

---

## Why It Is 10x

**1. The forecast captured at decision time is not recoverable any other way.**

The **record** is backfillable (a shrewd observer can reconstruct a decision weeks later from Slack, emails, calls). The **outcome** is largely derivable (logs show what shipped). The **forecast** — what you believed would happen, recorded *before* you found out — leaves no trace unless something captures it at the moment of the call. It is the only irreplaceable signal.

That forecast, bound to a decision, is the moat. It is what lets an outcome change the next call instead of just becoming a report.

**2. The judgment gap is a recognized, named buying requirement.**

AI governance platforms got their inaugural Gartner Magic Quadrant in June 2026 and are forecast at $492M growing 45.3% a year. SupaProd does not fight that category — it owns the part of it that is specific to product decisions: *context governance* in the community's word. When agents do the work, being able to answer "why did we decide this, on what evidence, and who signed off" becomes the control that lets you let them run at all.

**3. An agent-writable substrate cannot be a low-level tool.**

Agents can write into a spreadsheet or GitHub issue, but they cannot write a **decision with its evidence, its author, a verdict slot, and a human gate.** Low-level tools are agent-writable but not agent-governable. That is the seam we sit in, and it is exactly what enterprise customers are staffing PMs to build by hand today.

**4. The rework KPI is measurable and it moves fast.**

When feedback on a decision goes from quarters to minutes, teams drop rework hard — spec mismatches, clarification loops, reopened tickets all collapse. SupaProd is the only product that measures rework because it is the only one that owns the full arc and the record together. That is the operational lever that proves the forecast thesis works.

---

## What We Delete

**We are not building any of these:**

| Refuse | Why |
| --- | --- |
| **A builder** | That market is finished, priced at $48B, and the pain moved. Nobody is short of generated code; everybody is short of confidence in it. Builders are substitutable suppliers; we embed them. |
| **A seven-station diagram as the hero** | Stations are a commodity at ~15 named companies. A heavily-diagrammed lifecycle is the visual signature of SAFe, which this buyer is actively ripping out. |
| **A Critic that red-teams the user's call** | Automated code review lost because "a thing roasts your code" depletes social capital. We flag, we never gate. The user always owns the judgment. |
| **Throughput features** | 82% of PMs already have speed. Selling speed is selling the disease. We sell relief. |
| **"The outcome ledger cannot be backfilled"** | False. The forecast cannot be. Stop claiming records are defensible — they are. Lead with what is actually defensible. |
| **Single-entry loops** | The loop is a cycle with two doors: Discover for new problems, Build → Learn for cheap-to-test ones. No default; both are real paths. |
| **An unbroken full-station walk in production** | Three station-to-station handoffs were never written by any code until 2026-08-10. Prove Discover → Decide → Learn on real data first. The other half is the builder's domain. |

---

## The Architecture: Still Open Questions

**The seven stations are hypotheses, not commitments.** These are the things we get to decide together, and they are not small:

1. **Should Decide be wired to record forecasts?** Yes, and P0 — this is the irreplaceable signal. But should it force-gate on a forecast? (Answer: no. Gate on evidence, not prediction.)

2. **Should Learn re-rank Discover immediately, or accumulate verdicts first?** Today: immediately. Open question: should there be a hold until *N* verdicts land on the same theme?

3. **Should Build be a station or a doorway to external builders?** Today: both. Open question: do we need the station form, or is it just orchestration metadata?

4. **Should the loop have five stations instead of seven?** Open question. The founding PM uses three: Decide, Plan, Learn. The enterprise PM uses all seven. Do we optimize for one path and gate the others, or is the flexibility the feature?

These are not blocked. They ship. But they are measured against the real job, not assumed to be right because the diagram says so.

---

## What "Done" Looks Like

The mission gate: **A founder watches a complete sense → learn loop run end to end on screen, with everything functional.** Not demos. Not stubs. Real signals flowing through real agents with the user able to see and steer what is happening.

Then: **The acceptance query returns > 0.** One track enters at Sense, produces real output, learns from it, and is visibly changed by that learning.

The acceptance query: `SELECT id FROM spine_tracks WHERE entry_station='sense' AND station='learn' AND waived='[]' LIMIT 1`

**Today: 0 rows.** Target: > 0 rows, in production, with the founder watching.
driven by agents. The honest acceptance query — `entry_station='sense' AND station='learn' AND
waived='[]'` — returns **0 of 93 tracks, ever** (never ask this via `workspaces.is_sample`, which
returns a false 1 — F-61/F-71). The furthest genuine run stands at **ship, right now** (track
`7977dc06`, entered at sense, nothing waived). The one track at `learn` entered at define with sense
and decide waived: it proves the machinery, not the loop. And every visible trace of the brain is
seed: 133 of 133 `learnings` rows are `is_sample = true`; the 98 `learning_citations` rows share
**one distinct microsecond across seven dates** — a single INSERT wearing a week; the four brain
tools (`learning.record`, `brain.due_forecasts`, `brain.outcome_history`, `brain.contradictions`)
have **zero calls across 2,652 agent runs**; `decisions.cited_by_count` is 0 on all 355 (F-70). **The
loop is wired, six of its seven stations are proven in real runs, and it begins accruing on first
real use. Nothing has accrued yet.** The block is reachability, not the brain's machinery: a station
never reached cannot call its tools in anger.

## Why this is 10x

- **The forecast cannot be backfilled.** Everything else about a decision has been rebuilt from
  artifacts — twice, on the record. The forecast at decision time is the one thing a competitor, an
  agent sweep over Slack, or next quarter's model release cannot reconstruct. We are the surface that
  captures it at the moment it exists. (Stated because it is honest: every forecast on the record so
  far is agent-authored; whether one becomes required on the human decision path is an open founder
  call.)
- **Agent-governable, not merely agent-writable.** An agent can write into a folder or a Notion page.
  It cannot write *a decision with its evidence, its author, a verdict slot and a human gate* into
  either. Our write surface is live and scope-gated (`record_decision`, `draft_spec`,
  `settle_outcome`, `ingest_signal`), and nothing an agent writes lands finished. DIY folders work
  for one operator and die at the second person or the first fleet of agents; that transition is
  where we win.
- **One gate instead of five.** Today the person runs every gate themselves — read the diff, chase
  the deploy, wait for the outcome, grade it, extract the lesson. Here they answer one question and
  the record carries the rest. A design fact, not a measured outcome.
- **Rework, not speed, is the metric.** First-pass acceptance is live per agent (since 2026-08-10,
  from `human_gate_events`); review burden is derivable from the same stream; clarification loops are
  unmeasured and declared, never drawn as zero.

No time-savings number appears on this page because none has been measured: capture began
2026-08-10, there are zero external users, and a figure produced before real usage is a number about
demo data. Unproven is unproven.

## What we delete

- **Collaboration surfaces** — chat, threads, mentions. Consent is asked in place, at the station
  that raised it, or it does not get answered (R-04).
- **Templates and libraries** — the spec is an input the agent drafts and the person edits once, not
  a form to fill.
- **Settings and tuning** — every toggle is a decision that belongs to the loop, not to the person.
- **Onboarding tours and help text** — in a closed loop every action is the only one that makes
  sense; a surface that needs explaining is the defect.
- **The brain's seeded displays — new, forced by F-70.** 133 sample learnings, citations from one
  INSERT, `playbook_proposals` read by five surfaces and holding 0 rows lifetime. A brain wearing
  seeded memories fails the only test that matters on day two, when the user notices it learned
  nothing *from them*. The brain earns its first pixel when the first real learning exists; until
  then its surfaces show honest emptiness, not theater.
- **This page's own dead claims.** "Two tracks reached Learn in automated test" — both sat at
  `station='sense'`, `status='abandoned'`, and the test that "proved" it writes real tracks into
  production (F-69). "The calibration can compound" — the forecast grader has processed zero
  workspaces in its life (F-51). The 30-minute code review and 2–3-day feedback figures — invented;
  nothing was ever measured.

## The architecture call — is seven the right shape?

Made under the founder's grant: *the stations and the brain are hypotheses, not commitments.*

**The count is not the problem. The terminus is.** Keep the stations — as stages of one record,
never rooms (R-01: a progress display, never a menu; the person sees a transcript). The middle is
already merged per shape of work: route shapes waive stations with recorded reasons, and
`incident-fix` honestly carries *"nothing is being forecast on this."* Cutting a station globally is
a waiver that can never be un-waived. And every wall that stopped a real run sat at a handoff to the
outside world — the repo the product stopped recognising (F-49), the merge gate no station was
briefed to approach (F-50), dependencies a customer's repo cannot install (F-56), a CI gate the
builder disabled (F-63), GitHub billing (F-64). Fewer stations removes none of those walls; they are
where the product meets reality, not where it meets itself.

**The change the evidence does demand: learn is not station seven of a corridor. It is the return
edge of a cycle, on its own clock.** Delivery finishes at ship, in days. The verdict cannot exist
until the window named at decide closes — days to months later. Holding a track un-done until the
calendar catches up is why learn starves, and why everything downstream of it — the brain, entire —
starved with it. The data already flows as a cycle: on real lineage, decide's largest inbound source
is already learn (36 edges against 9 from opportunities), and the founder has ruled the picture a
cycle with two front doors (canon §5E). So: six delivery stations one walk proves in days, and learn
as the scheduled return — the due-forecast queue, whose mechanism exists and has processed zero
workspaces (F-51) — landing its verdict when the window closes. The concrete consequence for the
acceptance: the run's own forecast must be one that can settle inside the run (a deploy-health
window, not a quarterly retention bet), or "reach learn" waits on the calendar rather than on the
product. R-18 stands as written; this is how a run satisfies its verdict clause without waiting for
October.

**The brain stays — as a hypothesis with a start condition.** Nothing real has ever reached it, so it
is unfalsified in both directions. Until the first real learning exists it makes no claim on any
surface, and this page does not call it "defensible alone." What is defensible today is the forecast
captured at decision time, which is live at decide.

## Acceptance — what counts as done

R-18, strictly: one piece of work enters at sense and completes all seven stations, driven entirely
by agents, no human touching it mid-run, watchable on one screen, ending with a verdict — predicted
beside actual — proven with SQL, a track id and a screenshot. In three months it has never happened
once. The furthest honest run is at ship today. That is the distance left, and this page will not
describe it as smaller than it is.
