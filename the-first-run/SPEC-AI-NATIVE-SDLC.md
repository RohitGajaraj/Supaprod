# SPEC — Anthropic's AI-native SDLC playbook, mapped onto our seven stations

> _Written 2026-08-31, at the founder's instruction, from
> <https://claude.com/blog/the-ai-native-sdlc-playbook>._
>
> **Read this before proposing anything at a station boundary.** It is the one place the playbook is
> written down (§14: at the moment of need, by the session that needs it, written down once). If a
> file answers your question, read it and stop.
>
> ## THE STANDING RULING — founder, 2026-08-31
>
> *"Whatever this AI SDLC playbook Anthropic has published, we need to adopt it wherever possible.
> That's a master thing for us. They are the ones leading the industry, so we go with them and push
> back only where it does not fit. This is framework level."*
>
> **So the default is ADOPT, and the burden of proof is on the refusal.** Before this ruling a session
> would have asked *"should we take this?"* — now it asks *"can we argue why not?"*, writes the
> argument down, and adopts if it cannot. **A refusal that is not argued in this file is not a
> refusal; it is drift.**
>
> **What this is:** the model vendor has published the standard shape of the pipeline we sit on top
> of. It corroborates layers 01 and 02 in vocabulary our customers will be reading this quarter, it
> hands us artifacts and measurements we adopt directly, and **it is silent on layer 03.** All three
> facts matter and the third matters most.
>
> **And the commercial reason the default is adopt, which is sharper than "they lead the industry":**
> every team that follows this playbook will hold `intent.md`, `spec.md`, `plan.md`, `CLAUDE.md` and
> `REVIEW.md` in their repository. **If what Supaprod hands a builder is already those files, we are
> native to their pipeline on day one and there is nothing to integrate.** If it is our own shape, we
> are one more thing to map. Compatibility with the leader's format is worth more than any format we
> could design.

---

## 1 · The claim at the centre of it, and it is ours

> *"When code is no longer the bottleneck and the build phase runs faster than the traditional SDLC
> allows for, three things become true: the bottleneck moves to the steps to the left and right of
> the build phase — mainly plan, review/test and deploy, which still run at human speed; the controls
> stop matching reality and become intractable; governance costs increase."*

That is canon §5N, published by Anthropic, four days after we ruled it. Ours was measured from the
market (review time **+441.5%** against throughput **+33.7%**, agentic PRs **5.3x** longer to pick
up). Theirs is argued from the vendor's own product telemetry. **Two independent derivations of the
same conclusion, and neither cites the other.**

Their named failure mode is worth quoting on its own, because it is the sentence a buyer will
recognise: *"Security teams are sized for human output, so when agents multiply code output, either
the review queue builds or code ships under-reviewed."*

**Use this. Do not re-derive it.** When an outward answer needs a third party for the bottleneck
claim, this is it — and it is the vendor, not an analyst.

---

## 2 · Their six stages against our seven stations

| Their stage | Their artifact | Our station | Our artifact today |
| --- | --- | --- | --- |
| — | — | **Discover** | a track entering at `sense` — **no shape, no fields** |
| 1 · Plan | `intent.md` | **Decide** | `decisions` row, eleven `forecast_*` columns |
| 2 · Design | `spec.md` | **Plan** | `prds` |
| 2 · Design | `spec.md` | **Design** | `prototypes` |
| 3 · Build | `plan.md` · `CLAUDE.md` · `.claude/skills/` · `.claude/agents/` | **Build** | `studio_changesets` |
| 4 · Test | a named verification target; a hook the agent cannot edit around | **— none, and we do not really cover it — see the correction below —** | `studio.checks.run` at one Build seat, skippable, ungated |
| 5 · Deploy | `REVIEW.md` · `.claude/settings.json` · hooks exiting 0/1/2 | **Ship** | `deployments` |
| 6 · Maintain | `bands.yaml` · detection → a new `intent.md` | **Learn** | `learnings`, `forecast_resolution` |

**Three structural readings, and each one is actionable.**

1. **Their Stage 1 starts with a person who already knows the problem.** Discover has no counterpart
   in their playbook at all. That is ours, it is the harder half, and it stays.
2. **They have a Test stage and we do not — and this file said something false about it until
   2026-08-31.** It claimed the station self-check is our Test stage. **Measured against the code,
   that is not true and the correction is F-148.** `verifyStationOutput` (`driver.server.ts:1382`)
   compiles nothing, executes nothing and runs no test: it checks that a row of the right kind
   exists and, at four of seven stations, that one string is non-empty. **Build's branch is worse
   than lenient — it asks for artifact kind `mission`, which the driver itself writes at
   `driver.server.ts:773` before any seat runs, so Build's self-check cannot fail no matter what the
   builder did.** Real execution exists — `studio.checks.run` clones the branch into a sandbox and
   takes real exit codes from `tsc`, `bun test` and `lint` — but it is one instruction at one seat,
   skippable, with nothing refusing to advance if it never ran or came back red.
   **The self-check is a FILING check, not a verification check**, and the two must never be
   conflated again. What follows is not that we add a station: it is that Test needs a real gate
   (gap #22 rewritten, and gap #21's un-editable hook), and that we do not claim this stage until it
   has one.
3. **Every one of their handoffs is a committed file with a git timestamp**, and every leading
   indicator is the gap between two of those timestamps. We already have the shape —
   `spine_track_members` — and F-99 already measured a track filing its first artifact in 34 hours.
   **We built the instrument and never read it.**

---

## 3 · What we adopt. Ranked, owned, and each one is a real gap.

Each of these is authorised under §0.6's four-part test and is carried into the operating model's
ranked list as gaps **15 – 19**. Detail lives here; the ranking lives there.

### A · The return edge now has a published shape — finish it (gap #4, unchanged owner: S0)

Their Stage 6: a detection script watches production, and when a band is breached **the agent writes
its findings as an `intent.md` which re-enters the pipeline at Stage 1 through the normal stages.**

That is our Learn → Discover edge, exactly, and ours has **processed zero workspaces in its life**
(F-51). The playbook adds one thing we do not have: **the re-entry is a normal piece of work, not a
special object.** It gets a problem statement, it gets triaged, it can be rejected. Adopt that — a
missed forecast should produce a new track at Discover carrying the forecast it failed and a link
back to the run that failed it, and it should be refusable like any other.

### B · A forecast needs a band, not a point — NEW, and it is the sharpest thing in the playbook

`bands.yaml` holds metric baselines, detection rules, and **three response tiers: 1σ logs only, 2σ
invokes a read-only diagnosis, 3σ opens a PR or triggers a runbook.**

We record a forecast at Decide and grade it once at its horizon. **That is why the grader has never
usefully fired:** a single point, checked once, months later, is not an instrument anybody can act
on. A forecast should carry what counts as on-track, what counts as drift, and what counts as a miss
— **and what the system does at each**, which is the part we have never had.

- *Owner:* **S0** for the columns and the tick, **S1** for the surface.
- *Why it is not a rebuild:* the metric probe is already specced (`SPEC-BUILD-PATHS.md`, Decide's
  probe, ranked first of the sandbox uses precisely because *"without it the verdict can never
  land"*). The band is the missing half of that probe, not a new one.
- *The honesty guard:* a band derived from fewer than N observations says so. **A tier that fires on
  noise is theatre and gets the feature deleted rather than fixed.**

### C · The thing that enters Discover needs five fields — NEW (owner: S1 surface, S0 schema)

`intent.md` is written by the originator with the agent and carries: **problem statement · proposed
outcome · affected users and systems · constraints · open questions.**

A track enters our product at `sense` as a slug. **~46 died there.** The fold that returned `ids: []`
was one cause and it is fixed; the other is that nothing ever said what a signal must contain to be
worth deciding on. Adopt the five fields as the shape of a thing that can leave Discover — and
**"open questions" is the field we would never have thought of**: it is the one that makes a handoff
honest rather than confident.

### D · Read the instrument we already built — the value-audit verb, for free (gap #7, owner: S1 + S0)

Their leading and lagging indicators are per stage and portable as written. Ours, mapped:

| Their measure | Ours, using rows that already exist |
| --- | --- |
| First conversation → committed `intent.md` | track created → first `spine_track_members` row at Decide |
| `intent.md` → `spec.md` | Decide artifact → Plan artifact |
| Share of changes merging on the first pass | tracks reaching Ship with `attempts = 1` |
| First-pass CI success rate | **`studio.checks.run` exit codes** — never the self-check, which cannot fail at Build (F-148) |
| Time to first review | approval raised → `agent_approvals.decided_at` |
| Band breach → intent in triage | forecast miss → the new track from **A** above |
| **Lagging:** rework cycles per change | `attempts` summed across a track's stations |
| **Lagging:** repeat incidents of the same class | the same forecast missed twice |

**Gap #7 says *"was it worth it" has no surface* and calls value audit entirely unbuilt. This table is
that surface's content, and every row is a query against tables that already hold data.**

### E · The customer declares what review means — `REVIEW.md` (owner: S3)

Their tech lead writes the review passes (bugs, security, compliance), the severity definitions, and
the exclusions. Ours are hardcoded by us.

This is the missing half of the boundary page. **"What it's allowed to do" answers what the agents
may DO; nothing anywhere answers what counts as DONE**, and that is the question a company actually
argues about. One more section on the page S3 is already building — not a destination.

### F · Autonomy tiered by environment (owner: S3)

Theirs: **dev deploys freely, staging is intermediate, production is gated on a named approval.**

Ours is a four-rung trust arc plus per-tool modes. Theirs is a sentence a person says out loud, which
is §12's whole test. **Fold it into the same page, as the way the ladder is explained**, not as a
second ladder — `trust-ramp.ts` stays the only one that promotes.

### G · The inbound gesture is confirmed by the vendor (gap #13, owners: S0 · S2 · S3)

Claude Tag *"joins Slack or Teams channels under its own identity, picks up incidents and triage work
from channel messages; small fixes arrive as PRs, larger work becomes `intent.md`, and the channel
history serves as the audit trail."*

That is `SPEC-CONNECTORS.md`'s inbound assignment and `SPEC-AGENT-COMMS.md`'s Slack out-and-back, with
one refinement worth taking: **the size of the response is decided by the work, not by the channel.**
Small → a change comes back. Large → a new piece of work enters at the front. We had one path.

### H · Deterministic gates the customer owns (owner: S3 surface, S0 engine)

Their hooks are shell scripts exiting **0 allow / 1 ask / 2 block**, and their deploy hooks *"require
a named approval — a change ticket, a release manager sign-off."*

Two things we do not have. **The gate is a rule the customer writes, not a policy we infer from their
answers** — and `resolveApprovalPolicy` infers. Keep the inference (it is good, and it is now wired at
`src/lib/approvals-queue.functions.ts:1904`), and add the declared rule above it. And **a named
approver**: `agent_approvals.decided_by` is NULL on 18 of 176 answered calls, which is the same hole
seen from the other side.

---

## 4 · The adoption register — every part of the playbook, with a status

**Default ADOPT. A refusal needs an argument in this column, and any of these can be reopened.**
Statuses: **ADOPTED** (already true here) · **ADOPTING** (a gap number, owned) · **ADAPTED** (taken,
with a named change and the reason) · **REFUSED** (argued).

### Their artifacts

| Their artifact | Status | What we do |
| --- | --- | --- |
| `intent.md` — problem, outcome, affected users and systems, constraints, **open questions** | **ADOPTING** — gap #16 | The five fields become the shape of what enters Discover, **and the shape of what we hand out** (§4.1) |
| `spec.md` — requirements and design, constrained by encoded standards | **ADOPTING** — §4.1 | Our Plan and Design artifacts emit as `spec.md` in their shape |
| `plan.md` — files that change, the order of the work, the tests that prove it | **ADOPTING** — §4.1 | What Build hands to a builder, in their format, not ours |
| `CLAUDE.md` — conventions, commands, architecture, the mistakes a team makes most | **ADOPTED internally · ADAPTED as product** | Ours exists and is maintained. In the product we **read** the customer's, never own it (§4.2) |
| `.claude/skills/` — policy as a triggered instruction | **ADOPTED internally** | We run 200+. In the product, this is the shape our guardrails should emit into a customer repo |
| `.claude/agents/` — recurring jobs with scoped tools | **ADOPTED internally** | Our station crews are this. Nothing to change |
| `REVIEW.md` — the passes, the severities, the exclusions, written by the customer | **ADOPTING** — gap #18 | The half of the boundary page that says what counts as **done** |
| `.claude/settings.json` — hooks, permissions, sandbox rules per repository | **ADOPTED internally · ADOPTING as product** | Gap #19: a gate the customer declares, above the policy we infer |
| `bands.yaml` — baselines, detection rules, 1σ/2σ/3σ response tiers | **ADOPTING** — gap #15 | The missing half of Decide's metric probe, and why the grader has never usefully fired |

### Their practices

| Their practice | Status | What we do |
| --- | --- | --- |
| Plan mode — the agent writes a plan before it may edit | **ADOPTED internally · ADOPTED as product** | It is how this fleet works, and it is what our Plan station already is. **Their framing is better than ours in one way: the plan is a committed file the engineer interrogates.** Ours should be too |
| Parallel sessions, one per git worktree | **ADOPTED** | Five worktrees, this operating model. No change |
| Subagents for repeated jobs, with scoped context and tools | **ADOPTED** | §7 already requires them for audits and sweeps |
| An explicit verification target the agent iterates against | **ADOPTED** — gap #1, shipped as F-76 | Stations now check their own output. **Their addition: a hook the agent cannot edit around** — ours should have one |
| A hook preventing the agent editing tests during a fix | **ADOPTING** — cheap, and we have the finding | We have shipped tests that asserted nothing. This is the guard for it |
| AI review of every PR, humans on regulated and critical code | **ADOPTED as posture** | This is our own review-gate model. Do not build a surface for it (§4.3) |
| Hooks as deterministic gates, exit 0 allow / 1 ask / 2 block | **ADOPTED internally · ADOPTING as product** | Gap #19 |
| A named approver on a production gate | **ADOPTING** — gap #19 | `agent_approvals.decided_by` is NULL on **18 of 176** answered calls |
| Autonomy tiered by environment — dev free, staging middle, prod gated | **ADAPTED** — gap in §3 F | Taken as the **explanation** of our existing ladder, because it is a sentence a person says out loud. **Never as a second ladder**: `trust-ramp.ts` stays the only thing that promotes |
| `claude -p` / Agent SDK in CI, scoped short-lived credentials, tools over MCP | **ADOPTED** | Supaprod is already an MCP server; the sandbox primitive is specced |
| Detection → the agent writes findings as a new `intent.md` that re-enters at Stage 1 | **ADOPTING** — gap #4 | The return edge, which has processed zero workspaces in its life |
| Their leading and lagging indicators, per stage | **ADOPTING** — gap #17 | Portable as written; §3 D maps every one onto rows we already hold |

### 4.1 · The adoption the first draft of this file missed, and it is the largest

**What Supaprod hands to a builder should BE `intent.md`, `spec.md` and `plan.md`, in Anthropic's
shape, named their names.**

`SPEC-BUILD-PATHS.md` already rules the hybrid: hand the spec and the forecast to their builder, or
build it here on credits. **It does not say what the handoff looks like.** The playbook now answers
that, and the answer is the format the customer's own tooling will already understand.

- Discover and Decide emit **`intent.md`** — plus our forecast block, which theirs has no field for
  and which is the whole moat (§5).
- Plan and Design emit **`spec.md`**.
- Build emits **`plan.md`** — files that change, the order, and the tests that prove it.
- The handback (gap #12) reads their `REVIEW.md` to know what the outcome had to clear.

**This is not a new station and not a new surface.** It is the serialisation of artifacts
`spine_track_members` already holds. **A team that has adopted the playbook can drop our output into
their repository and their agent picks it up with no adapter** — which is what "go with the leader"
buys, stated as a mechanism rather than a posture.

*Owner: S0 for the emitters, S1 for the copy-out control on the run surface (queue item 24 already
wants a run pasteable into a PR thread).*

### 4.2 · What is genuinely refused, and the argument for each

**Four**, and no more than four. **Each is reopenable; none is a matter of taste.**

1. **We do not become a builder.** The playbook's Stage 3 is written for a team generating its own
   code, and adopting it as a *product feature* would put us in the $48B market canon §5N rules we
   stay out of. **The refusal is narrow: we refuse to generate the code, not to speak the format.**
   §4.1 is the proof — we adopt every artifact of Stage 3 and still hand the building out.
2. **We do not own the customer's `CLAUDE.md` or `.claude/skills/`.** Those state a team's own
   conventions. **We read them where a connector reaches the repo** — they are the best available
   statement of how a team works, and reading them makes our specs better. **We may propose a change
   as a normal change, through their review.** We never write them silently, because a vendor editing
   a team's conventions file is the single fastest way to lose the repository connection.
3. **We do not renumber our seven stations to their six.** R-01 settles our names, the acceptance
   query keys on them, and ours are already plain. **But this refusal costs something and we pay it
   properly: the mapping table in §2 becomes a translation the product speaks**, so a customer who
   says "where is my spec.md" is answered in their words. Refusing a rename is not refusing the
   vocabulary.
4. **We review a diff BEFORE it is committed, and that is why we own a reviewer — ADDED
   2026-08-31, and it is the argument that was missing.** Raised at the framework gate by S4
   (S4-168) against my own F-147 fix, correctly: F-147 wired `code-review.server.ts` into the
   Build brief, §4.3 says CONSUME the vendor's review rather than rebuild it, and **the
   register row asserted our ownership without ever arguing it.** §0.8 puts the burden of
   proof on the refusal, so an unargued departure is drift **whoever makes it**, including me.
   Here is the argument, and it is not "ours is better".

   **Every managed review service in this market reviews a pull request.** A PR is a commit
   that has already been pushed to a branch. **Ours reviews the STAGED diff — the change
   exists in `studio_changes` and has been committed nowhere** — which is a moment no
   PR-based service can reach, because at that moment there is nothing for it to attach to.

   **That earlier moment is the whole product, not a convenience.** Canon §5N: review time is
   up 441.5% and agentic PRs take 5.3x longer to pick up, because output queues at review.
   A review that runs before the commit is the only one that can stop a bad change from ever
   entering that queue; a review after it has joined the queue is measuring the problem. It
   is also what makes the self-check loop (SESSION-0 §1) possible at all — **a station cannot
   check its own output against what it was asked for if the check only exists after the
   output has been published.**

   **The refusal stays as narrow as the other three.** We refuse to give up the pre-commit
   review. We do **not** build a code-review SURFACE, a findings board, a triage screen or a
   scan-results page — §4.3 is unchanged and still binding. And **once a PR exists, the
   vendor's review is the one that runs**; ours does not compete with it there, it has already
   finished.

   **What this refusal costs, paid honestly:** from 2026-08-31 it spends a model call per
   staged diff for the first time, because F-147 is what made it reachable. **Before that fix
   it had run ZERO times** — `studio.review` has no row in `tool_calls` at all, and zero of 51
   changesets carry a `code_review`, while nine PRs were opened and seven merged unreviewed.
   So this refusal is being argued at the moment it starts costing something, which is the
   right moment and not a coincidence.

   **The model for how to do this well is already in the repo and it is `studio.deps.audit`**,
   which reads GitHub's own Dependabot alerts and reports *"not available"* honestly, because
   not-available "is never the same as clean". That is §4.3 followed exactly. `studio.review`
   earns its exception by reaching a moment nothing else can; it does not earn a surface.

**On the Test stage, which deserves a straight answer rather than a refusal — CORRECTED 2026-08-31,
and the earlier answer here overstated our coverage (F-148).** They have one and we do not. **We do not add an eighth station** — the spine, the acceptance query and R-01 all key on
seven, and the cost of an eighth is not worth paying. **We adopt the substance instead: the
self-check becomes visible and counted.** Their leading indicator is *first-pass CI success rate*;
ours is *stations passing their own check without a retry*, and it goes on the value-audit surface
(gap #17). **They count the thing we hide; that is the real finding, and it does not need a station
to fix.**

### 4.3 · What the playbook itself tells us not to build

Their Stage 5 and Stage 6 name **Managed Code Review**, **Claude Security** (scheduled scans, findings
validated before reporting) and **Claude Tag** (joins a channel under its own identity, picks up
incidents, small fixes return as PRs and large ones become a new `intent.md`).

**Adopting the playbook means CONSUMING those, not rebuilding them.** A lane that builds a code-review
board, a vulnerability-triage screen or a scan-results surface has departed from the playbook while
believing it is following it. They are suppliers to layer 02 exactly as every builder is, and their
commoditisation is our tailwind on the same argument (canon §5N).

**Claude Tag's one refinement we do take** — and it is gap #13's missing half: **the size of the
response is decided by the work, not by the channel.** Small comes back as a change; large enters at
the front as a new piece of work. We had one path.

---

## 5 · The two things to say to the founder, plainly

**Both survive the framework-level ruling. Adopting their pipeline wholesale does not weaken the
moat — it sharpens where the moat is, because it removes every other candidate.**

### The playbook is silent on the forecast, and that is the moat holding

Six stages. Ten named artifacts. Twelve leading indicators and six lagging ones. **Nowhere in any of
them is a prediction recorded before the outcome is known.**

`intent.md` carries a *proposed outcome* — that is a goal, written by the person asking, with no
horizon and no grade. `bands.yaml` carries a *baseline* — that is history, computed from what already
happened. **Neither is a forecast.** Nobody in that pipeline writes down what they believe will
happen, by when, before the work starts, somewhere it cannot be edited afterwards. Their Stage 6
measures drift from the past. Ours grades a belief against reality.

**So the vendor has just published the canonical shape of layers 01 and 02 — and left 03 empty.** For
a company whose moat is *the forecast captured at decision time*, that is the best available outcome:
the pipeline we sit on top of now has a standard shape, described in words our buyers will already
know, with a hole in it exactly where we are.

### And the risk, which is real and is not the same thing

The same post names **Managed Code Review**, **Claude Security** (scheduled scans, findings validated
before reporting) and **Claude Tag**. Those are Anthropic shipping product into their Stage 5 and
Stage 6 — the stages we call **Ship** and **Learn**.

We do not compete there and we should not try: those are suppliers to layer 02, exactly like every
builder is (canon §5N), and their commoditisation is our tailwind on the same argument. **But a lane
that builds a code-review surface, a vulnerability triage screen or a scheduled-scan feature is
building something the vendor now gives away.** That is the concrete instruction: consume those,
never rebuild them, and if a queue item looks like one, say so before starting it.

---

## 6 · What changes in the build queue because of this

| # | Adoption | Owner | Sits with |
| --- | --- | --- | --- |
| 15 | Forecast bands and tiered response (§3 B) | S0 schema · S1 surface | gap #4, gap #11's Decide probe |
| 16 | The five-field intent shape at Discover (§3 C) | S1 · S0 | the `sense` graveyard |
| 17 | The stage-timestamp measures, i.e. value audit (§3 D) | S1 · S0 | gap #7 |
| 18 | `REVIEW.md` — what counts as done (§3 E) | S3 | the boundary page |
| 19 | Declared gates and a named approver (§3 H) | S3 · S0 | gap #14, `decided_by` NULL |
| 20 | **Emit `intent.md` · `spec.md` · `plan.md` in their shape** (§4.1) | S0 emitters · S1 the control | `SPEC-BUILD-PATHS.md`, gap #12 |
| 21 | A hook the agent cannot edit around during a fix (§4, practices) | S0 | gap #1's guard |
| 22 | The station self-check becomes **visible and counted** (§4.2) | S0 the count · S1 the surface | their Test stage, gap #17 |

**None of these is a new destination.** Every one lands on a surface that already exists or is already
queued, which is the §0.6 test they had to pass to be here.

---

## 7 · How a session uses this file

1. **Before proposing anything at a station boundary, or any handoff, gate, metric or artifact —
   check the register in §4 first.** If the playbook has a shape for it, take that shape.
2. **If you want to do it differently, write the argument into §4.2 and say why.** Three refusals
   exist; a fourth is allowed and must be argued the same way. **An unargued departure is drift, and
   S0 rejects it at the gate.**
3. **If the playbook is silent on it, you are on your own and that is fine** — Discover and the
   forecast are both in that category, and both are ours.
4. **Never re-read the blog post.** It is extracted here. If something is missing, add it here once.
