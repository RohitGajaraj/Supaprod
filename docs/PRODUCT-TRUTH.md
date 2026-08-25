# PRODUCT-TRUTH.md — The One Problem We Solve

> **One-page product thesis.** Rewritten 2026-08-25 under the founder's Phase 2 mandate, and reshaped
> by **F-70**: every visible trace of accumulated learning in this product is seed data — re-verified
> live against production the day this page was written. Canon it obeys:
> [`docs/strategy/positioning-locked-2026-08.md`](./strategy/positioning-locked-2026-08.md). Evidence:
> [`the-first-run/FINDINGS-LEDGER.md`](../the-first-run/FINDINGS-LEDGER.md). If this page and
> [`RULINGS.md`](../the-first-run/RULINGS.md) disagree, RULINGS.md wins.

---

## Who the user is

**The individual PM or founding PM who ships with agents.** Not "product teams" — nobody
self-identifies as a team, and the land motion is one person who can start without procurement. They
sit in the Energized or Conflicted 76%: already measurably faster with agents, already tired. So we
sell relief, never throughput — 82% report the speed already; speed is the thing that is hurting them.

## The one painful job

**Did the change do what we said it would do — and can we defend the call?** A practitioner named
the pain before we did: *"PMs got faster at shipping but didn't get better at defending why. The
judgment gap got exposed."* Three parts of the job do not compress into an agent: **deciding what is
worth doing, defining what good looks like, and catching when the system is confidently wrong.**
Those are stations decide, define and learn. The rest of the job is reps, and the reps are leaving.

## What they suffer today without us

**Slack archaeology presented as rigor.** The plan is in Notion, the code is in GitHub, the debate is
in Slack, and no surface says *here is what we chose, why, and how we will know*. Causes can be
rebuilt afterwards — Vercel's COO reconstructed the true cause of a lost deal from Slack, email and
call recordings with an agent built in two days, running for about $1,000 a year — so the record is
not the scarce thing. **The forecast is.** What a team believed would happen, before the outcome was
known, leaves no trace unless something captured it at the moment of the call. Today nothing does. So
every "I knew it" is unfalsifiable, every retro is oral history, and the same bet gets made twice
because nothing learned is standing at the next decision.

## What SupaProd does instead

A person types one sentence. Agents walk the work through the stations — sense · decide · define ·
design · build · ship · learn — while the person watches one screen: a transcript of what each agent
did on the left, the current artifact on the right, one Stop control, no navigating. **At decide, the
forecast goes on the record before the outcome is known** — what we expect, and when we will know. It
is the only station that writes one, which is why a route without it has no moat (R-25). In an
ordinary workspace the person holds one gate — the merge approval, a click that unblocks ship — and
the production deploy is gated by proof, not by a click (R-27), so a run inside boundaries a human
set in advance completes on its own. At learn, the verdict lands against the forecast — predicted
beside actual, win or lose — a decision and its outcome on one audit trail.

**What is proven, measured 2026-08-25.** Six of the seven stations have done their jobs for real,
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
