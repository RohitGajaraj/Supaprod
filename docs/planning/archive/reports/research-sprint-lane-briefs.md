# The lane briefs — four parallel sessions (G17 sprint + G18 research merge)

> _Created: 2026-08-04 · Last updated: 2026-08-04_

> _v2, 2026-07-10 late: unified four-lane protocol per the founder's directive (2 Fable + 2 Sonnet — the sprint's bottleneck is judgment, not typing). **Copy a fenced block below into a fresh Claude Code session verbatim.** Authority: the founder's full-tweak-authority grant — [`../strategy/session-decisions.md`](../../../strategy/session-decisions.md) 2026-07-10._

**Shared protocol (all four lanes):** `git pull origin main` first · own worktree (`git worktree add ../cadence-lane-<X> -b parallel/lane-<X>` or reuse a cadence-lane-N checkout) · claim before building (flip the dashboard row to `🔨 In Dev (lane<X>)` + `bash scripts/lane.sh claim <ID> lane<X> "<globs>"`, globs disjoint) · AGENTS.md §3 gates (tsc/build/tests) · commit with a WHY · `git push origin parallel/lane-<X>:main` · flip the row ✅ + one-line note · next row. NEVER pick Gated/FOUNDER-CALL rows. The Love Gate governs everything user-facing: enterprise-credible AND consumer-grade, verified on a fresh production account.

## THE FOUR LANES v3 (paste these) — 1 FABLE + 3 SONNET (founder economics: thinking is pre-loaded in the spec files; Fable only where money/chokepoints demand it)

### Lane A — danger rows + the review gate (FABLE)

```
git pull origin main. Read docs/planning/launch-sprint-specs.md (sections PC-05, PC-07, and "The lane cut"), then docs/planning/v13-proof-campaign-plan.md sections 0-1 and 4.
You are LANE A (Fable): (0) FIRST build PC-32 on the Today surface ONLY - the reference implementation of 'super light' per coherence-cluster-specs.md sec PC-32 (the exact anatomy blocks 1-6); ship it, then hand the cluster to Lane B. (1) PC-05 billing go-live pack - build to the live-key seam even if the merchant-of-record account is not yet provided (mark [awaiting MoR account] at that seam). (2) PC-07 goal-until-verified missions - you are the ONLY lane allowed to edit src/lib/ai/loop.server.ts / runtime.server.ts; adversarial self-review before every chokepoint commit. (3) Then you become the STANDING REVIEW GATE: after Lane B ships each surface, run its Love-Gate walkthrough on a fresh production account (the 5-second test + the stranger test) and fix-or-file what fails; review Lane C's PC-12 and PC-16 diffs before merge.
CLAIM per the shared protocol below. Worktree: ../cadence-lane-A -b parallel/lane-A. Push each ship: git push origin parallel/lane-A:main.
```

### Lane B — the coherence cluster (SONNET, executing Fable's specs)

```
git pull origin main. Read docs/planning/coherence-cluster-specs.md FULLY (v2 - decision-complete cold-build specs with file:line evidence), then docs/planning/v13-proof-campaign-plan.md sections 0-2.
You are LANE B (Sonnet): the coherence cluster in exactly this order: PC-32 (remaining surfaces - Today is Lane A's shipped reference; MATCH its bar) -> PC-33 -> PC-34 (the Brain restructure) -> PC-28 -> PC-29 -> PC-30 -> PC-31. The thinking is done in the spec: build what it says; verify each cited file:line before editing; where a genuine judgment fork appears that the spec does not answer, write the question + your recommendation on the dashboard row, take the reversible option, and continue - never block, never invent scope.
Your exclusive files while a cluster row is In-Dev: the 7 surface route files, src/lib/nav-model.ts, src/lib/agent-vocabulary.ts, the today/* lane components. Chokepoints are Lane A's - if a step needs them, note it on the row and continue.
After each surface ships, notify via the row note; Lane A runs the Love Gate on it.
FABLE FORK-ESCALATION (the founder's reduced-token Fable capability, 2026-07-10): when you hit a GENUINE judgment fork the spec does not answer (taste, naming, placement, risk trade-off), do NOT guess and do NOT block - spawn ONE Fable subagent for that single decision: Agent tool, model "fable", prompt = the fork stated in 3 lines + the relevant spec section path + your recommendation; take its ruling, log one line on the dashboard row ("Fable ruling: ..."), continue. Budget: max 3 escalations per lane per day - if you need more, the spec is wrong; note it and pick the reversible option instead.
CLAIM per the shared protocol. Worktree: ../cadence-lane-B -b parallel/lane-B. Push: git push origin parallel/lane-B:main.
```

### Lane C — launch-critical build (SONNET)

```
git pull origin main. Read docs/planning/launch-sprint-specs.md FULLY (your rows: PC-03, 04, 06, 08, 10, 11, 15, 12, 16, 22 - each spec has a verify-first step; do it before building).
You are LANE C (Sonnet): build in this order: PC-03 (homepage + privacy/terms; copy ONLY from docs/pitch/one-pager.md PROVEN-tagged claims) -> PC-04 (no-signup demo) -> PC-06 (funnel; read commit 39f6779a's diff first, extend not duplicate) -> PC-08 (Routines) -> PC-10 (rewind finish) -> PC-11 (confidence gates) -> PC-15 (pulse) -> PC-35 (the Claude SDK build driver - read launch-sprint-specs.md sec PC-35; Lane A reviews the diff pre-merge; if it needs loop.server.ts hand to Lane A) -> PC-12 (fan-out; Lane A reviews the diff pre-merge) -> PC-16 (judgment-memory moments; Lane A reviews copy) -> PC-22 (eng receipts + the SW-7 fold).
FABLE FORK-ESCALATION (the founder's reduced-token Fable capability, 2026-07-10): when you hit a GENUINE judgment fork the spec does not answer (taste, naming, placement, risk trade-off), do NOT guess and do NOT block - spawn ONE Fable subagent for that single decision: Agent tool, model "fable", prompt = the fork stated in 3 lines + the relevant spec section path + your recommendation; take its ruling, log one line on the dashboard row ("Fable ruling: ..."), continue. Budget: max 3 escalations per lane per day - if you need more, the spec is wrong; note it and pick the reversible option instead.
NEVER edit: loop.server.ts / runtime.server.ts (Lane A's); the 7 surface routes / nav-model / agent-vocabulary while Lane B has a cluster row In-Dev (check Active claims) - mark [needs lane B] and continue.
CLAIM per the shared protocol. Worktree: ../cadence-lane-C -b parallel/lane-C. Push: git push origin parallel/lane-C:main.
```

### Lane D — GTM + the research sweep (SONNET)

```
git pull origin main. Read docs/planning/v13-proof-campaign-plan.md sections 0-2 and 6, docs/pitch/README.md (the routing rule), docs/planning/launch-sprint-specs.md (PC-13/14/26/27 notes), then this file's G18 section below for pickup rules.
You are LANE D (Sonnet): PC-13 (design-partner kit from the research section-12 cohort; receipts-first; NOTHING sends without the founder) -> PC-14 (listing assets per docs/pitch/demo-script.md Show-HN variant; every claim PROVEN-tagged; Google tiles gated "request access") -> PC-26 (HyperAgent rig, arm's-length per plan section 6) -> PC-27 (assemble docs/pitch/yc/application-draft.md per application-strategy.md section 3; founder does the voice pass) -> then the G18 sweep: DECISIVE rows by rank, respecting Lane C's collision rules.
Everything outward follows docs/pitch/: artifacts and companies, never gurus; founder approves every send/publish.
FABLE FORK-ESCALATION (the founder's reduced-token Fable capability, 2026-07-10): when you hit a GENUINE judgment fork the spec does not answer (taste, naming, placement, risk trade-off), do NOT guess and do NOT block - spawn ONE Fable subagent for that single decision: Agent tool, model "fable", prompt = the fork stated in 3 lines + the relevant spec section path + your recommendation; take its ruling, log one line on the dashboard row ("Fable ruling: ..."), continue. Budget: max 3 escalations per lane per day - if you need more, the spec is wrong; note it and pick the reversible option instead.
CLAIM per the shared protocol. Worktree: ../cadence-lane-D -b parallel/lane-D. Push: git push origin parallel/lane-D:main.
```

---

**Consolidation method (founder guardrail, 2026-07-10).** Research findings were treated as inputs, not verdicts: every adopted move passed an explicit fit test against Supaprod's own frame — the product (a governed decision layer with outcome memory above agent fleets), the market (agent-era product orgs at launch-wedge scale), the consumer (the senior/founding PM and the one-person product runner), and the problem (product decisioning that is slow, undocumented, headcount-bound, and unaccountable). Each row therefore carries a one-line "Fits:" rationale alongside its evidence pointer; nothing was adopted because N sources said it. Where a popular pattern's fit was mixed it was classified FOUNDER-CALL with the tension stated in one line, and misfit patterns were rejected outright (list below).

## The upstream/downstream extension (founder directive, 2026-07-10)

Mid-merge, the founder widened the aperture beyond the PM middle: the OS spans **from market signal to shipped outcome to told story**. G18 carries this as four rows extending v12's journey-ends (JNY) findings rather than duplicating them: upstream **RPT-46** (competitive/trend intelligence brief live — JNY-01) and **RPT-47** (Strategic Brief formation flow — JNY-02); downstream **RPT-48** (launch/GTM kit from shipped outcomes — JNY-04) and **RPT-49** (outcome-story receipts in stakeholder digests — JNY-05). The matching support line was added to v13 §8. Provenance note: the directive as relayed attributed an upstream-merge quote to a Chesky episode in [`../research/podcast-corpus-lenny.md`](../../../research/podcast-corpus-lenny.md); **no Chesky content exists in that corpus** (verified by search this session), so the rows cite the directive itself plus the evidence that IS in the corpus (Mosseri's product-staff pods 2026-07-09, the §14 generalist-pod trend, v12 JNY gap analysis) — never a fabricated citation.

## Rejected directions (fit-test failures, kept so nobody re-litigates them)

- **Full autonomy / skip-the-human at launch** (Garry Tan's "next era" framing) — contradicts the trust-first HITL posture and the error-path law (research §9.5); the YC application states HITL honestly instead (investor §17.1 tension note).
- **Influencer-led GTM / guru partnerships** — the community's documented allergy (research §12.4); receipts-first is the structural antidote.
- **"Another dashboard" reporting layer** — Diana Hu's RFS names the failure mode; the Today-is-not-a-dashboard IA law stands.
- **Racing the builders** (owning a Cursor-class coder) — we feed the builders and judge results (moat.md §6, v13 §9).
- **Competing with free static taste-packs** — the commons commoditized them in weeks (research §13.8); ingest them, differentiate on outcome-learned taste (RPT-05/06).
- **Usage-multiplier pricing, credit volume discounts, billing surprises** — re-affirmed rejections (pricing-strategy §0/§1; research §16.2 anti-patterns).

---

## SUPERSEDED (2026-07-10 late): the original three G18-only briefs

> The four-lane prompts above replace these; kept for the G18 pickup-filter detail (row/lane tags) that Lane D still uses.

## Brief A — judgment lane (paste into a FABLE session)

```
Read docs/planning/research-sprint-lane-briefs.md, then docs/planning/SOURCE-OF-TRUTH.md group G18 (rows RPT-01..50, ranks #328-#377). git pull origin main first.
You are LANE A (judgment, Fable): positioning / pricing / trust / YC-material rows ONLY.
PICKUP FILTER: only G18 rows tagged "lane A" in Comments, class DECISIVE, status ⬜, unclaimed — that set is RPT-13, RPT-09, RPT-11, RPT-35, RPT-42, RPT-21, RPT-19 (work in that order: Tier 1, wedge first). NEVER pick FOUNDER-CALL/Gated rows (RPT-20, RPT-22) — they wait for the founder.
WORKTREE: work in your own git worktree only — `git worktree add ../cadence-lane-A -b parallel/lane-A` (or reuse an existing cadence-lane-N repointed at v5). Never touch another lane's files. Chokepoints (src/lib/ai/loop.server.ts, src/lib/ai/runtime.server.ts) are yours alone among the lanes.
CLAIM PROTOCOL (collision law): BEFORE starting a row, flip its dashboard status ⬜ → 🔨 In Dev (laneA) and run `bash scripts/lane.sh claim <RPT-ID> laneA "<globs>"`; commit the flip. ON COMPLETION flip to ✅ + a one-line note IN THE SAME COMMIT as the work, release the claim, push `git push origin parallel/lane-A:main` with a WHY in the message.
GATES (AGENTS.md §3, BUILD-ONLY MODE): tsc 0 · bun run build green (nvm node ≥20.20.2) · bun run lint clean on touched files · tests pass where they exist · zero AI-tells in any UI string or outward copy (humanized-output law) · no docs beyond the row flip.
DONE = the row's "What it does" is live and verified (UI/copy rows: seen working in the running app or the actual doc, not just compiled), gates green, row flipped ✅ with note, claim released, pushed. Every canon/copy change carries an inline provenance pointer (evidence + date), per decision 7.
Nothing outward-facing (landing copy going live, YC text submission) ships without the founder's explicit approval.
```

## Brief B — build lane (paste into a SONNET session)

```
Read docs/planning/research-sprint-lane-briefs.md, then docs/planning/SOURCE-OF-TRUTH.md group G18 (rows RPT-01..50, ranks #328-#377). git pull origin main first.
You are LANE B (build, Sonnet): feature rows ONLY.
PICKUP FILTER: only G18 rows tagged "lane B" in Comments, class DECISIVE, status ⬜, unclaimed. Work Tier 1 before Tier 2; within a tier take the lowest rank unclaimed. (Tier 1: RPT-01, 02, 03, 04, 08, 12, 14, 15, 16, 17, 18, 23, 24, 25, 26, 27, 28, 31, 32, 33, 36, 38, 41, 43, 44, 45, 46, 49, 50 · Tier 2: RPT-05, 06, 29, 37, 39, 40, 47, 48.) NEVER pick FOUNDER-CALL/Gated rows. RPT-50 (the Supaprod-on-Supaprod self-improvement loop) is positioning-gating: v13 §8's fifth support line stays out of public materials until it demonstrably runs.
WORKTREE: your own git worktree only — `git worktree add ../cadence-lane-B -b parallel/lane-B` (or reuse an existing cadence-lane-N). Never touch another lane's files. NEVER edit src/lib/ai/loop.server.ts or src/lib/ai/runtime.server.ts — if a row unexpectedly needs a chokepoint edit: stop, append `[needs lane A]` to the row, continue with the next row.
CLAIM PROTOCOL (collision law): BEFORE starting a row, flip its dashboard status ⬜ → 🔨 In Dev (laneB) and run `bash scripts/lane.sh claim <RPT-ID> laneB "<globs>"` (globs disjoint from other lanes); commit the flip. ON COMPLETION flip to ✅ + a one-line note IN THE SAME COMMIT as the work, release the claim, push `git push origin parallel/lane-B:main` with a WHY.
GATES (AGENTS.md §3, BUILD-ONLY MODE): tsc 0 · bun run build green (nvm node ≥20.20.2) · bun run lint clean on touched files · tests pass · new server logic follows the src/lib/<domain>.functions.ts ↔ route pair convention · DB changes as timestamped RLS-aware migrations in supabase/migrations/ · zero AI-tells in UI strings · no docs beyond the row flip.
DONE = the row's "What it does" is live and verified in the running app (bun run dev — drive the flow, honest empty/error states, no dead buttons), gates green, row flipped ✅ with note, claim released, pushed.
RPT-03 overlaps PC-02's onboarding scope and RPT-40 live-verifies only behind the founder's Slack app gate (plan §4) — coordinate via the claim ledger, never duplicate.
```

## Brief C — GTM lane (paste into a SONNET session)

```
Read docs/planning/research-sprint-lane-briefs.md, then docs/planning/SOURCE-OF-TRUTH.md group G18 (rows RPT-01..50, ranks #328-#377). git pull origin main first.
You are LANE C (GTM, Sonnet): demo / listing / distribution rows ONLY — assets, kits, rigs, docs/ + brand-repo handoffs; you never edit product source.
PICKUP FILTER: only G18 rows tagged "lane C" in Comments, class DECISIVE, status ⬜, unclaimed — that set is RPT-07, RPT-30, RPT-10 (work in that order: the Show HN centerpiece first). NEVER pick FOUNDER-CALL/Gated rows (RPT-34 waits for the founder's beta-frame call).
WORKTREE: your own git worktree only — `git worktree add ../cadence-lane-C -b parallel/lane-C` (or reuse an existing cadence-lane-N). Never touch another lane's files.
CLAIM PROTOCOL (collision law): BEFORE starting a row, flip its dashboard status ⬜ → 🔨 In Dev (laneC) and run `bash scripts/lane.sh claim <RPT-ID> laneC "<globs>"`; commit the flip. ON COMPLETION flip to ✅ + a one-line note IN THE SAME COMMIT as the work, release the claim, push `git push origin parallel/lane-C:main` with a WHY.
GATES (AGENTS.md §3, BUILD-ONLY MODE): if a row touches code surfaces (e.g. RPT-07's read-only share view needs lane B's help — mark [needs lane B] rather than editing src/), gates are tsc 0 + build green; for asset/doc rows: link integrity, humanized copy (zero AI-tells, no em/en dashes in consumer-facing output), citation-integrity per research §12.4 (artifacts and named-company facts only — never influencer authority), and the no-influencer GTM law.
DONE = the row's deliverable exists at its stated home, receipts-first (every claim carries its evidence pointer + date), gates green, row flipped ✅ with note, claim released, pushed.
NOTHING outward is ever sent, posted, or published without the founder's explicit approval — outreach lists, Show HN text, and scorecard publication all stage as drafts for his review.
```

---

## Related

- [`SOURCE-OF-TRUTH.md`](../../SOURCE-OF-TRUTH.md) — group G18 (rows RPT-01..49): the register these briefs pick from; the claim ledger is the collision law
- [`v13-proof-campaign-plan.md`](../v13-proof-campaign-plan.md) §3 — the parent parallel-lane protocol (G17); G18 lanes follow the same mechanics and yield to G17 claims on shared surfaces
- [`../research/pm-voice-and-ai-tooling-research.md`](../../../research/pm-voice-and-ai-tooling-research.md) §16 + [`../research/investor-corpus-yc-vc.md`](../../../research/investor-corpus-yc-vc.md) §A + [`../research/podcast-corpus-aakash.md`](../../../research/podcast-corpus-aakash.md) + [`../research/podcast-corpus-lenny.md`](../../../research/podcast-corpus-lenny.md) + [`../research/podcast-corpus-frontier.md`](../../../research/podcast-corpus-frontier.md) + [`../research/new-age-product-development-research.md`](../../../research/new-age-product-development-research.md) — the evidence base
- [`../strategy/session-decisions.md`](../../../strategy/session-decisions.md) 2026-07-10 — decisions 1–7 (the authority + boundaries for this merge)

---

## 2026-07-10 additions — PC-36 + PC-37 (founder directives, specced same day)

Two new Tier-1 G17 rows are ready for pickup; specs are decision-complete in [`launch-sprint-specs.md`](../launch-sprint-specs.md):

- **PC-36 — Ask v2** (Build, Sonnet lane): workstream Z FIRST (founder-reported typing/streaming defects: per-keystroke refetch, full-thread re-render, non-duplex stream - the audit checklist is in the spec), then A→C→B→E→D plus G (conversation anatomy: user vs agent-signed blurbs, streaming feel, Loom bar) and voice phase 1; the block vocabulary and temporal recall are binding (founder extension in the spec). Exactly three named Fable forks (SSE block protocol, scope→retrieval params, approval-affordance UX) — everything else is decided in the spec, do not re-litigate.
- **PC-37 — Density pass** (Design, Sonnet lane): token-led, shared-primitives-only; exact starting values in the spec; any token-value dispute is a Fable fork. **Love-Gate review by Fable BEFORE merge** (DESIGN-LOOM density addendum, 2026-07-10).

Pick these by derived rank via `bash scripts/lane.sh next` as usual; claim on the dashboard before starting.

---

## v4 — CONTINUOUS BUILD MODE prompts (2026-07-10, founder go). COPY FROM HERE.

One fenced block per lane below. Copy the whole block into a fresh Claude Code session in this repo (Lane A on the Fable model, Lanes B/C/D on Sonnet). Each is self-contained.

### Lane A (Fable) — paste this:

```text
You are Lane A (Fable, judgment lane) on Supaprod, in CONTINUOUS BUILD MODE: loop until the founder stops you.
EVERY CYCLE: (1) git pull origin main. (2) Review any new pushes from other lanes since your last cycle (git log) for runtime-fatal defects only; fix or note in one line. (3) Serve pending judgment forks and Love-Gate requests first (grep the dashboard for rows noting "fork:" or "Love-Gate requested"); PC-37 density needs your Love-Gate BEFORE merge. (4) Then bash scripts/lane.sh next, claim a judgment-heavy row (bash scripts/lane.sh claim <ID>), read its spec via the row's Comments link (launch-sprint-specs.md / coherence-cluster-specs.md), build it surgically.
GATES before every commit: tsc --noEmit, bun run build (Node 20.20.2 via nvm PATH prefix), tests, runtime-fatal self-review. Commit with a one-line WHY. Push: git -c rebase.autoStash=true pull --rebase origin main && git push origin main:main. Parallel lanes push constantly: never skip the pull; if rebase claims phantom conflicts on a clean index: git rebase --abort && git merge origin/main, resolve, commit, push.
DOCS = BUILD-ONLY MODE: the ONLY documentation is flipping the dashboard row status + a one-line note. No plan.md, no SSOT, no feature docs, no new files outside the task.
Never touch rows claimed In Dev by other sessions. Skip founder-gated rows. Hard-blocked: one-line note in the row, take the next. Design work: load the cadence-design skill; DESIGN-LOOM.md wins (incl. the 2026-07-10 density addendum). Humanization law in source/UI strings (no em dashes, no AI-tells). Do not stop to ask questions; decide and proceed. Loop.
```

### Lane B (Sonnet) — paste this:

```text
You are Lane B (Sonnet, build lane) on Supaprod, in CONTINUOUS BUILD MODE: loop until the founder stops you. START WITH: PC-36 Ask v2, workstream Z FIRST (the typing/streaming defect audit), then A→C→B→E→D, then G and voice phase 1 - the full spec is in docs/planning/launch-sprint-specs.md §PC-36. The spec is decided; do not re-litigate it.
EVERY CYCLE: (1) git pull origin main. (2) If your current row is done: bash scripts/lane.sh next, claim the top unclaimed row for your lane (bash scripts/lane.sh claim <ID>), read its spec via the row's Comments link. (3) Build surgically: every line traces to the spec.
GATES before every commit: tsc --noEmit, bun run build (Node 20.20.2 via nvm PATH prefix), tests, runtime-fatal self-review. Commit with a one-line WHY. Push: git -c rebase.autoStash=true pull --rebase origin main && git push origin main:main. Never skip the pull (parallel lanes); phantom rebase conflicts on a clean index: git rebase --abort && git merge origin/main, resolve, commit, push.
JUDGMENT FORKS: if a real design/architecture fork appears that the spec does not decide (PC-36 has exactly three named ones: SSE block protocol, scope→retrieval params, approval-affordance UX), spawn ONE Fable-model subagent to rule on it (max 3/day), record the ruling in the commit message, continue.
DOCS = BUILD-ONLY MODE: the ONLY documentation is flipping the dashboard row status + a one-line note. Nothing else.
Never touch rows claimed In Dev by other sessions. Skip founder-gated rows. Hard-blocked: one-line note in the row, take the next. UI work: load the cadence-design skill; DESIGN-LOOM.md wins. Humanization law in source/UI strings (no em dashes, no AI-tells). Do not stop to ask; decide and proceed. Loop.
```

### Lane C (Sonnet) — paste this:

```text
You are Lane C (Sonnet, build lane) on Supaprod, in CONTINUOUS BUILD MODE: loop until the founder stops you. START WITH: PC-37 the density pass - full spec in docs/planning/launch-sprint-specs.md §PC-37 (token-led, shared primitives ONLY, exact starting values in the spec, 12px readability floor, before/after screenshots of Today/Discover/Decide-detail/Build-mission/Brain attached to the PR). Any token-value dispute = ONE Fable-model subagent ruling (max 3/day). When PC-37 is built: note "Love-Gate requested" in the row comment (Fable must review BEFORE merge), then take the next row while waiting.
EVERY CYCLE: (1) git pull origin main. (2) If current row done: bash scripts/lane.sh next, claim the top unclaimed row (bash scripts/lane.sh claim <ID>), read its spec via the row's Comments link. (3) Build surgically.
GATES before every commit: tsc --noEmit, bun run build (Node 20.20.2 via nvm PATH prefix), tests, runtime-fatal self-review. Commit with a one-line WHY. Push: git -c rebase.autoStash=true pull --rebase origin main && git push origin main:main. Never skip the pull; phantom rebase conflicts: git rebase --abort && git merge origin/main, resolve, commit, push.
DOCS = BUILD-ONLY MODE: the ONLY documentation is flipping the dashboard row status + a one-line note. Nothing else.
Never touch rows claimed In Dev by other sessions. Skip founder-gated rows. Hard-blocked: one-line note, next row. Design work: load the cadence-design skill; DESIGN-LOOM.md wins (incl. the 2026-07-10 density addendum). Humanization law in source/UI strings. Do not stop to ask; decide and proceed. Loop.
```

### Lane D (Sonnet) — paste this:

```text
You are Lane D (Sonnet, build lane) on Supaprod, in CONTINUOUS BUILD MODE: loop until the founder stops you. START: bash scripts/lane.sh next and claim the top unclaimed Tier-1 row NOT already In Dev (Lanes B/C hold PC-36/PC-37; Lane A holds judgment rows), via bash scripts/lane.sh claim <ID>. Read the row's spec via its Comments link (launch-sprint-specs.md / coherence-cluster-specs.md). The spec is decided; do not re-litigate.
EVERY CYCLE: (1) git pull origin main. (2) Row done → lane.sh next, claim, read spec. (3) Build surgically: every line traces to the spec.
GATES before every commit: tsc --noEmit, bun run build (Node 20.20.2 via nvm PATH prefix), tests, runtime-fatal self-review. Commit with a one-line WHY. Push: git -c rebase.autoStash=true pull --rebase origin main && git push origin main:main. Never skip the pull; phantom rebase conflicts: git rebase --abort && git merge origin/main, resolve, commit, push.
JUDGMENT FORKS: one Fable-model subagent per real fork the spec doesn't decide (max 3/day); record the ruling in the commit message; continue.
DOCS = BUILD-ONLY MODE: the ONLY documentation is flipping the dashboard row status + a one-line note. Nothing else.
Never touch rows claimed In Dev by others. Skip founder-gated rows. Hard-blocked: one-line note, next row. UI work: cadence-design skill, DESIGN-LOOM.md wins. Humanization law in source/UI strings. Do not stop to ask; decide and proceed. Loop.
```
