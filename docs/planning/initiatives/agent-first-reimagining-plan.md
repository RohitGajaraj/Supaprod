# The agent-first reimagining: build plan

> _Created: 2026-08-23 · Last updated: 2026-08-23_

**This is LANE 1's overnight build plan.** It does not re-derive the platform design; that
exists, is cited below, and stays canonical. This document says what is already true, what is
still false on the screen, and the exact order work lands in so every commit compounds. Status
never lives here: it lives in [`../SOURCE-OF-TRUTH.md`](../SOURCE-OF-TRUTH.md), and this file
is revised in place as the night teaches.

Reading notes behind every claim here: [`coordination/units/000-reading-notes.md`](../../../coordination/units/000-reading-notes.md)
(repo channel folder, outside `docs/`).

---

## 1. Current state and prior-work findings

**What exists and is load-bearing** (verified by driving the app as `harbor@` via Playwright;
~40 destinations measured for computed hierarchy on 2026-08-23):

- **Navigation is already collapsed, further than documented.** Rail = Today · Runs · Brain ·
  Guardrails. Measured redirect map (all live): `/opportunities`->`/decide`,
  `/roadmap`->`/plan?view=roadmap`, `/prds`->`/plan?view=specs`, `/artifacts`->`/brain?tab=artifacts`,
  `/memory`->`/brain?tab=learnings`, `/inbox`->`/today`, `/chat`->`/today`, `/tasks`->`/today`,
  `/knowledge`->`/brain`, `/notifications`->`/settings?section=notifications`,
  `/integrations`->`/settings?section=interop`, `/briefing`->`/settings?section=brief`,
  `/track-record`+`/trust-ledger`->`/engine-room?room=record`, `/evals`+`/prompts`->Engine Room,
  `/drift`->`/engine-room?room=quality`, `/swarm`->`/engine-room?room=safety`,
  `/analytics`->`/engine-room?room=spend`, `/observe`+`/govern`->`/engine-room`,
  `/fleet`+`/delegate`->`/build`, `/cockpit`->`/build?view=lane`, `/changelog`->`/ship`,
  `/start`->`/onboarding`. Roughly thirty legacy routes already fold into four rail doors,
  the station strip, and Settings sections.
- **Station surfaces carry claim-shaped h1s** that state state, not name: /decide "56 bets
  ranked, strongest first.", /build "Nothing is being written. 2 need you.", /approvals "14
  decisions are ready for you.", /brain "Real outcomes have re-scored 2 calls." Engine Room
  rooms extend the pattern by question: "What exactly happened?" (record), "Is the machine
  still good?" (quality), "What is it allowed to do?" (safety), "What is this costing me?"
  (spend). This voice is the house style and Wave 3 must not flatten it.
- **Measured type scale in use:** h1 25px, sub 20px, body 14/13px, labels 12.5/12px, micro 10px;
  weights 400-600; 2-7 colours per surface. Page-level hierarchy is real on every measured
  destination. The founder's complaint survives at **card level**: inset detail boxes render
  five-plus undifferentiated small lines (cluster card on /discover, bet card on /decide).
- **Intent-first entry partially exists**: composer ("What should we build?") on station
  surfaces; global Ask via Cmd+K.
- **The loop ran on real external input** (2026-08-22): ingest webhook -> sink -> clusters ->
  spine; spine starvation and rotation defects found and fixed the same night.
- **Observed inconsistencies to resolve in Wave 3** (noted, not yet diagnosed): bare `/plan`
  bounced to `/today` once while `/plan?view=specs` renders; `/calendar` lands on
  `/brain?tab=decisions`, which reads as a wrong-door redirect; clicking the header ticker
  scrolls to /today's queue rather than opening Approvals. Dev-mode first-hit compile makes
  short-timeout empties unreliable -- measure with a content-wait, never a fixed timer.

**What is incomplete or failing:**

1. **The rival type scales are still live.** Ratchet baseline: 3,170 retired-vocabulary
   occurrences across 222 files. Concentration: `src/styles.css` 703, `src/styles/primitives.css`
   279, `src/styles/ink.css` 190, `shell/primitives.tsx` 92, `AppFrame.tsx` 57. The three CSS
   files define competing scales every surface inherits. This is the root cause of the
   founder's number one pain point and Wave 1 exists because of it.
2. **Approvals has no home** (founder directive, 2026-08-23). Reachable only via the subtle
   header ticker (which scrolls to /today's queue section) or by typing `/approvals`. A gate
   that unblocks agents deserves a persistent door with a live count.
3. **Inset boxes are walls of small text.** The cluster detail on /discover and bet detail on
   /decide render five-plus undifferentiated lines inside one dark inset. Hierarchy exists at
   page level and dies inside the card.
4. **Gallery-only Meridian components.** `RunTimeline`, `ToolStream`, `RunMap`, `PlanGate`,
   `PlanCard`, `AgentInbox` exist and are mounted only in `_authenticated.meridian.tsx`.
5. **Empty/loading/error states on the long tail** are bare or absent. /discover renders an
   empty black field for seconds before content arrives; unvisited routes have default states.
6. **Loop economics broke under real input**: one full loop burned a monthly grant in 80
   minutes; promotion cleared by 13 restatements of two sentences. Founder-gated numbers;
   build work must at least not worsen them silently.
7. **Known open defects carried from prior sessions**: quarantine replayed by the idempotency
   wrapper; tick overrun (measured 100.6s vs 45s deadline); `ToolStream` unproven on a live
   run; six phantom tool names baked into applied seed migrations.

**Prior work that is canon and will not be redone:** `agent-first-platform.md` (the object
model Question -> Bet -> Run -> Verdict; §5's surface traces; §9's slices), `station-journeys.md`
(dual journeys), `agent-to-agent.md` (three machine doors), `non-station-surfaces-2026-08.md`,
the audit register (`audit-reports/agent-audit-2026-08.md`), `adversarial-review-2026-08.md`.
Where this plan and those documents disagree, the newer measurement wins and the older document
gets superseded in place.

## 2. Supaprod's agent-first product model

Adopted wholesale from [`agent-first-platform.md`](./agent-first-platform.md) §2-§3, restated
in one paragraph so this file stands alone:

The unit of work is the **Question**, which becomes a **Bet** (with a forecast recorded before
the outcome is known), executed as **Runs** by agent crews, settling as a **Verdict** that
re-ranks everything downstream. Stations survive as lenses on this one object flow, not as
seven destinations. Humans set policy in advance (boundaries, gates, spend ceilings);
permission is asked only in the moment when judgment is genuinely required. Autonomy is the
default (`loadAgentArc` returns `trusted` when no row exists) and is paid for with the
tamper-evident record.

**On the moat, stated with the founder's 2026-08-23 refinement:** knowing what to build is
part of the moat, but only in its compounding form. Ranking *as a capability* is a commodity
-- any frontier model plus the same signals can rank, which is why the director is the door,
not the defence. What cannot be copied is guidance **graded by your own settled verdicts**:
every outcome re-ranks the next recommendation, and that outcome-labelled history is produced
only as a byproduct of running the loop. The forecast captured at decision time is the
unbackfillable kernel of the same asset -- causes survive in artifacts, beliefs before
outcomes do not. And the same asset serves agents as readily as humans: when an external
agent asks what to build next, answer quality rests on context nobody else holds, which is
the six-month-forward form of this moat.

**Addition this run makes:** the model is only real if it is *visible*. Every wave below serves
one of the four visible properties: legible, premium, functional, agent-first.

## 3. The reimagined lifecycle and the whole platform

Not just stations 01-07. The surfaces this plan touches, grouped:

| Group | Surfaces | State after this plan |
| --- | --- | --- |
| Shell | rail, header, station strip, composer, Ask pane, theme toggle | One scale, one status vocabulary, approvals door present |
| Stations | /discover /decide /plan /design /build /ship /learn (+ detail routes) | Card-level hierarchy fixed; inset-box pattern replaced; empty/loading states designed; redirect targets consistent (the /plan, /calendar oddities resolved deliberately) |
| Judgment lane | /approvals, /today queue, gate modals | Approvals gets a persistent home with live count; ticker click opens it rather than scrolling |
| Brain | /brain (+ tabs), memory, artifacts | Forecast made first-class wherever a decision appears |
| Engine Room | hub + rooms: record, quality (evals/drift), safety, spend | Recessed but legible; same type contract; room-per-question pattern kept and completed |
| Settings | every tab incl. profile, brief/voice, interop/connectors, autonomy, notifications | Form hierarchy; no eleven-field walls |
| Long tail | onboarding, admin sub-tabs, product pages (/m/*), public-facing product routes | Contract applied; worst offenders rebuilt first |

Census method note: surfaces were measured by computed style through Playwright with a
content-wait (never fixed timers -- dev-mode cold compile produces false empties). Detail
routes (`/runs/$missionId`, `/prds/$id`, `/m/*`, admin sub-tabs) are covered in Wave 3's
per-surface passes rather than the census.

## 4. Dual user/agent journeys

Method from [`architecture/station-journeys.md`](../../architecture/station-journeys.md):
every surface is walked twice, once as the user, once as an external agent over MCP with no
UI. The walk produces two acceptance checks per surface:

- **User check:** can I tell without reading what is title, supporting text, status, and the
  one action? Is there exactly one primary action?
- **Agent check:** can an external agent complete this job through the machine doors alone?
  If not, the capability is UI-trapped; file it as a gap (section 8) rather than shipping a
  veneer.

Surfaces already verified dual-walkable: ingest -> cluster -> promote -> spine dispatch ->
settle. The known UI-trapped capability class is manual edits to promoted artifacts; tracked
as a gap, not silently accepted.

## 5. Station, signal, agent, backend, handoff architecture

Unchanged from `agent-first-platform.md` §5-§6. The spine (`spine.track-tick`) drives tracks
under a shared 45s deadline with strict round-robin fairness (fixed 2026-08-23); crews are up
to three dispatches per station; escalation to a human happens through `agent_approvals`. This
plan builds **no second orchestration path** -- invariant 2 of AGENTS.md. Where a surface
needs new data, it extends the existing server-function module for its domain; never a new
data-flow shape.

One architectural addition is planned: **the approvals door** reads the same
`agent_approvals` feed the ticker and /today already read -- no new endpoint, a new persistent
affordance over existing wiring.

## 6. The headless / MCP / agent-to-agent model

Adopted from [`architecture/agent-to-agent.md`](../../architecture/agent-to-agent.md): three
machine doors (read/query, write-with-policy, stream). This run's obligations toward it:

- Any capability surfaced in the UI during Waves 3-4 gets its MCP-door parity checked in the
  same unit (the dual-journey agent check above).
- The quarantine-as-success defect (writes auditing refusals as success) blocks honest
  headless use; fixing the audit classification landed 2026-08-22, the idempotency-replay
  half remains open and is queued in section 8.

## 7. Meridian and Beautiful UI application, plus extensions

**Floor:** Meridian's 113 tokens and 47 components (`src/styles/meridian.css`,
`src/components/meridian/`). Documents about Meridian lose to the files.

**Extensions this plan intends, each argued against Meridian's own law (earns place on second
caller, named for meaning):**

1. **Button tiers** -- primary / secondary / quiet / destructive must be visibly distinct at a
   glance. The founder named buttons directly ("not differentiable from each other"). Today
   Approve-vs-Decline differ mostly by fill; quiet and destructive are near-indistinguishable
   from secondary on several surfaces. Build into Meridian once, adopt everywhere.
2. **Inset/detail pattern** -- the recurring wall-of-small-text box inside cards (cluster
   detail, bet detail). One component: label row, key line, evidence lines, footer actions,
   with real step hierarchy between them. Replaces at least six ad-hoc insets found already.
3. **Empty/loading/error state kit** -- token-driven spot graphics plus the standard copy
   pattern; used by every route instead of bare defaults. Illustration rules from the brief:
   carries meaning, Meridian tokens, inline SVG, never delays content.
4. **Forecast block** -- a decision surface primitive that renders the recorded forecast
   (claim / how-we-will-know / horizon / resolution) identically everywhere a decision
   appears, so the moat is first-class rather than an optional field.

Each extension lands in `src/components/meridian/` with tests, is adopted by at least the
surfaces that motivated it in the same unit, and is recorded in `MERIDIAN-INVENTORY.md`.

**Type-and-status contract:** Wave 2 writes `docs/design/TYPE-AND-STATUS-CONTRACT.md` giving
each of the 14 steps one sentence of product purpose, and the status colours their exact
trigger conditions (pass/fail = an outcome that happened; hold = waiting on a condition;
agent = a machine working; you = a person required). Colour carries status, never decorates;
identity is shape.

## 8. Product, UX, engineering and agent gaps

Ranked by leverage; the ones this run commits to are marked.

1. [WAVE 1] Rival scales in three CSS files + shell TSX (root cause).
2. [WAVE 2] Button tiers, inset pattern, contract doc, guard test.
3. [FOUNDER] Approvals home with live count.
4. [WAVE 3] Card-level hierarchy on stations; long tail; empty/loading/error states.
5. [WAVE 4] Intent-first universal composer behaviour; interruptible visible agent progress;
   next-best-action surfaced on every station surface.
6. Quarantine replayed by idempotency wrapper (headless honesty).
7. ToolStream proof on a live builder run (needs MAIN LANE to dispatch one; request if Wave 3
   reaches /runs detail first).
8. Loop economics visibility: credit spend shown at the moment of the action that spends it
   (no pricing changes; founder-gated numbers stay out).
9. UI-trapped capabilities found by dual walks (filed as discovered, fixed if cheap).

Genuinely out of scope this run: billing-rail activation, enterprise SSO, connector stubs
(Linear/Notion/Jira/Figma remain registered-but-stubbed; no surface may imply otherwise).

## 9. Implementation sequence

**Wave 0 (done):** reading pass, this plan, reading-notes unit.

**Wave 1 -- one scale, one status vocabulary.** Nothing else starts until it lands.
Per-file, in this order (per MAIN LANE M01: the guard is per-file; each falls on its own):
1. `src/styles/primitives.css` (279): map every `--sp-text-*`/retired reference to its
   `--mrd-t-*` equivalent; delete values that should not exist. Verify computed values
   unchanged via Playwright before/after on affected classes.
2. `src/styles/ink.css` (190): same treatment.
3. `src/styles.css` (703): largest; split into sub-passes if needed, re-freezing per pass.
4. `src/components/shell/primitives.tsx` (92) and `AppFrame.tsx` (57): the shell every
   surface renders through.
After each file: `bun run design:ratchet`, commit baseline **in the same commit**.

**Wave 2 -- contract and primitives.**
1. `docs/design/TYPE-AND-STATUS-CONTRACT.md` (linked from DESIGN-SYSTEM.md and here).
2. Button tiers in Meridian; adopt in shell + approvals + today first.
3. Inset/detail pattern; adopt on /discover and /decide cards (the two worst measured).
4. Guard test extension: new-file hard-coded text sizes/raw colours fail.

**Wave 3 -- surfaces in dependency order.**
Shell -> shared components -> high-traffic (/today, /discover, /decide, /approvals, /runs,
/brain) -> long tail by worst-first sweep. Every touched surface: computed-style verification
via Playwright, screenshot to docs/screenshots/ (never committed), empty+loading+error states
included. **Approvals home ships early in this wave** (founder directive): rail entry or
persistent affordance with live count, one click from anywhere.

**Wave 4 -- agent-first substance.**
Universal intent entry (composer everywhere, resolves to the right workflow); visible agent
progress with interrupt/inspect/redirect; next-best-action on station surfaces; forecast block
adopted on every decision-bearing surface.

Parallelism: Waves 3's surfaces share no files and fan out to subagents with disjoint file
lists; Waves 1-2 touch shared files and stay serial with me committing each unit.

**Re-planning rule:** any finding that contradicts this plan gets the plan updated in the same
commit as the work that revealed it.

## 10. Validation and acceptance criteria

Per unit (non-negotiable): `bunx tsc --noEmit` exit 0; `bun test` 0 failures (whole suite);
`bun run docs:check` exit 0 when docs touched; commit message states wrong/cost/shape; unit
file written; pull-rebase then push.

Per surface (all eight hats, resolved toward the end user):
- Computed-style check proves title/body/caption/status genuinely differ (font-size, weight,
  colour read off the DOM, not the source).
- Exactly one visually primary action per view.
- Empty, loading and error states rendered and screenshotted.
- Dual-journey check: the job completable over the machine doors, or filed as a gap.
- Vocabulary clean against the banned list; approve/review usage matches gate semantics.

Run-level:
- Ratchet total strictly down from 3,170, locked per file, never widened.
- The founder's question answerable "yes" on every touched surface: can I tell at a glance
  what is a title, what is supporting text, what is a status, and what is the one thing to do.
- Approvals reachable in one click from any surface with a live count.
- No fabricated numbers anywhere; every count traceable to a query.

Counter-metric (from the platform design §10 correction): split nothing by demo tenants this
run since all verification is local; anything production-facing goes to MAIN LANE as a
request, never asserted.

---

## Related

- [`agent-first-platform.md`](./agent-first-platform.md) -- the platform design this executes
- [`agent-first-reimagining-index.md`](./agent-first-reimagining-index.md) -- the 2026-08-22 session's map
- [`audit-reports/agent-audit-2026-08.md`](./audit-reports/agent-audit-2026-08.md) -- findings register
- [`../../design/DESIGN-SYSTEM.md`](../../design/DESIGN-SYSTEM.md) -- Meridian contract
- [`coordination/units/000-reading-notes.md`](../../../coordination/units/000-reading-notes.md) -- evidence behind section 1
