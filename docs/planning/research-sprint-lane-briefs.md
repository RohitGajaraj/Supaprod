# The lane briefs — four parallel sessions (G17 sprint + G18 research merge)

> _v2, 2026-07-10 late: unified four-lane protocol per the founder's directive (2 Fable + 2 Sonnet — the sprint's bottleneck is judgment, not typing). **Copy a fenced block below into a fresh Claude Code session verbatim.** Authority: the founder's full-tweak-authority grant — [`../strategy/session-decisions.md`](../strategy/session-decisions.md) 2026-07-10._

**Shared protocol (all four lanes):** `git pull origin main` first · own worktree (`git worktree add ../cadence-lane-<X> -b parallel/lane-<X>` or reuse a cadence-lane-N checkout) · claim before building (flip the dashboard row to `🔨 In Dev (lane<X>)` + `bash scripts/lane.sh claim <ID> lane<X> "<globs>"`, globs disjoint) · AGENTS.md §3 gates (tsc/build/tests) · commit with a WHY · `git push origin parallel/lane-<X>:main` · flip the row ✅ + one-line note · next row. NEVER pick Gated/FOUNDER-CALL rows. The Love Gate governs everything user-facing: enterprise-credible AND consumer-grade, verified on a fresh production account.

## THE FOUR LANES (paste these)

### Lane A — the coherence cluster (FABLE — judgment + taste, end to end)

```
git pull origin main. Read docs/planning/coherence-cluster-specs.md fully (the v2 cold-build specs), then docs/planning/v13-proof-campaign-plan.md sections 0-3.
You are LANE A (Fable): the coherence cluster PC-32 -> PC-33 -> PC-28 -> PC-29 -> PC-30 -> PC-31, in exactly that order, maps AND applies together - one surface fully coherent before the next.
The specs are decision-complete: build what they say; you may deepen with judgment but never silently skip or re-litigate a made decision. Bind to the audit facts cited in the specs (file:line) - verify each before editing.
CLAIM: one PC row at a time per the shared protocol. Your exclusive files while In-Dev: the 7 surface route files, src/lib/nav-model.ts, src/lib/agent-vocabulary.ts, the today/* lane components. Chokepoints (loop.server.ts, runtime.server.ts) are LANE B's - if a step needs them, note it on the row and continue.
Love Gate per surface: the 5-second "what do I look at?" test + the stranger test ("who works here, what did they just do, what can I hand them, how do I check it") on a fresh production account.
Worktree: ../cadence-lane-A -b parallel/lane-A. Push each ship: git push origin parallel/lane-A:main.
```

### Lane B — the trust + chokepoint spine (FABLE — attended-grade engine work)

```
git pull origin main. Read docs/planning/v13-proof-campaign-plan.md sections 0-4 (the 25-day ship + gates), then the row specs in section 2.
You are LANE B (Fable): the chokepoint spine, in order: PC-05 (billing go-live pack - if the merchant-of-record account is not yet provided, build everything up to the live-key seam and mark the row [awaiting MoR account]) -> PC-07 (goal-until-verified missions; you own loop.server.ts - attended-grade care, adversarial self-review before commit) -> PC-12 (parallel fan-out to one review queue) -> PC-16 (judgment-memory hero moments) -> PC-27 DRAFT ONLY (assemble the YC application draft from docs/pitch/ + the strategy corpus; the founder submits post-launch, W27 batch).
You are the ONLY lane allowed to edit src/lib/ai/loop.server.ts and src/lib/ai/runtime.server.ts. Every chokepoint edit gets an adversarial review pass before commit.
CLAIM per the shared protocol. Worktree: ../cadence-lane-B -b parallel/lane-B. Push: git push origin parallel/lane-B:main.
```

### Lane C — launch-critical build (SONNET — well-specified product rows)

```
git pull origin main. Read docs/planning/v13-proof-campaign-plan.md sections 0-2 (the 25-day ship; your rows' acceptance criteria live in section 2).
You are LANE C (Sonnet): launch-critical build rows, in order: PC-03 (public homepage + positioning refresh - copy comes from docs/pitch/one-pager.md, the one-liner + the data-trust answer; parchment DESIGN.md contract) -> PC-04 (try-without-signup demo) -> PC-06 (activation funnel instrumentation) -> PC-08 (Routines productized) -> PC-10 (finish artifact rewind: UI wiring; note the roadmaps leg is deferred - see the row) -> PC-11 (confidence-gated execution) -> PC-15 (in-product feedback pulse) -> PC-22 (eng receipts chain; folds the SW-7 remainder).
NEVER edit: loop.server.ts, runtime.server.ts (Lane B's), the 7 surface route files / nav-model.ts / agent-vocabulary.ts while Lane A has a cluster row In-Dev (check Active claims) - if your row needs one, mark the row [needs lane A/B] and continue to the next.
CLAIM per the shared protocol. Worktree: ../cadence-lane-C -b parallel/lane-C. Push: git push origin parallel/lane-C:main.
```

### Lane D — GTM + the research sweep (SONNET — outward assets + G18 rows)

```
git pull origin main. Read docs/planning/v13-proof-campaign-plan.md sections 0-2 and 6, docs/pitch/README.md (the routing rule), then docs/planning/research-sprint-lane-briefs.md (this file) for the G18 pickup rules below.
You are LANE D (Sonnet): GTM + research-derived rows, in order: PC-13 (design-partner program: the 25-target kit seeded from the research section-12 cohort; receipts-first outreach drafts - NOTHING sends without the founder) -> PC-14 (the listing assets: Show HN draft with no-signup demo path + honest-limitations list + the failure-path GIF plan; Product Hunt kit; every claim checked against docs/pitch/one-pager.md PROVEN tags) -> PC-26 (HyperAgent GTM rig per plan section 6) -> then the G18 sweep: rows tagged "lane B"/"lane C" in G18 comments, class DECISIVE, by rank - respecting the same file-collision rules as Lane C.
Everything outward-facing follows docs/pitch/ (the routing rule): cite artifacts and companies, never gurus; claims carry PROVEN/WIRING/ROADMAP tags; founder approves every send/publish.
CLAIM per the shared protocol. Worktree: ../cadence-lane-D -b parallel/lane-D. Push: git push origin parallel/lane-D:main.
```

---

**Consolidation method (founder guardrail, 2026-07-10).** Research findings were treated as inputs, not verdicts: every adopted move passed an explicit fit test against Cadence's own frame — the product (a governed decision layer with outcome memory above agent fleets), the market (agent-era product orgs at launch-wedge scale), the consumer (the senior/founding PM and the one-person product runner), and the problem (product decisioning that is slow, undocumented, headcount-bound, and unaccountable). Each row therefore carries a one-line "Fits:" rationale alongside its evidence pointer; nothing was adopted because N sources said it. Where a popular pattern's fit was mixed it was classified FOUNDER-CALL with the tension stated in one line, and misfit patterns were rejected outright (list below).

## The upstream/downstream extension (founder directive, 2026-07-10)

Mid-merge, the founder widened the aperture beyond the PM middle: the OS spans **from market signal to shipped outcome to told story**. G18 carries this as four rows extending v12's journey-ends (JNY) findings rather than duplicating them: upstream **RPT-46** (competitive/trend intelligence brief live — JNY-01) and **RPT-47** (Strategic Brief formation flow — JNY-02); downstream **RPT-48** (launch/GTM kit from shipped outcomes — JNY-04) and **RPT-49** (outcome-story receipts in stakeholder digests — JNY-05). The matching support line was added to v13 §8. Provenance note: the directive as relayed attributed an upstream-merge quote to a Chesky episode in [`../references/podcast-corpus-lenny.md`](../references/podcast-corpus-lenny.md); **no Chesky content exists in that corpus** (verified by search this session), so the rows cite the directive itself plus the evidence that IS in the corpus (Mosseri's product-staff pods 2026-07-09, the §14 generalist-pod trend, v12 JNY gap analysis) — never a fabricated citation.

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
Read docs/planning/research-sprint-lane-briefs.md, then docs/planning/feature-dashboard.md group G18 (rows RPT-01..50, ranks #328-#377). git pull origin main first.
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
Read docs/planning/research-sprint-lane-briefs.md, then docs/planning/feature-dashboard.md group G18 (rows RPT-01..50, ranks #328-#377). git pull origin main first.
You are LANE B (build, Sonnet): feature rows ONLY.
PICKUP FILTER: only G18 rows tagged "lane B" in Comments, class DECISIVE, status ⬜, unclaimed. Work Tier 1 before Tier 2; within a tier take the lowest rank unclaimed. (Tier 1: RPT-01, 02, 03, 04, 08, 12, 14, 15, 16, 17, 18, 23, 24, 25, 26, 27, 28, 31, 32, 33, 36, 38, 41, 43, 44, 45, 46, 49, 50 · Tier 2: RPT-05, 06, 29, 37, 39, 40, 47, 48.) NEVER pick FOUNDER-CALL/Gated rows. RPT-50 (the Cadence-on-Cadence self-improvement loop) is positioning-gating: v13 §8's fifth support line stays out of public materials until it demonstrably runs.
WORKTREE: your own git worktree only — `git worktree add ../cadence-lane-B -b parallel/lane-B` (or reuse an existing cadence-lane-N). Never touch another lane's files. NEVER edit src/lib/ai/loop.server.ts or src/lib/ai/runtime.server.ts — if a row unexpectedly needs a chokepoint edit: stop, append `[needs lane A]` to the row, continue with the next row.
CLAIM PROTOCOL (collision law): BEFORE starting a row, flip its dashboard status ⬜ → 🔨 In Dev (laneB) and run `bash scripts/lane.sh claim <RPT-ID> laneB "<globs>"` (globs disjoint from other lanes); commit the flip. ON COMPLETION flip to ✅ + a one-line note IN THE SAME COMMIT as the work, release the claim, push `git push origin parallel/lane-B:main` with a WHY.
GATES (AGENTS.md §3, BUILD-ONLY MODE): tsc 0 · bun run build green (nvm node ≥20.20.2) · bun run lint clean on touched files · tests pass · new server logic follows the src/lib/<domain>.functions.ts ↔ route pair convention · DB changes as timestamped RLS-aware migrations in supabase/migrations/ · zero AI-tells in UI strings · no docs beyond the row flip.
DONE = the row's "What it does" is live and verified in the running app (bun run dev — drive the flow, honest empty/error states, no dead buttons), gates green, row flipped ✅ with note, claim released, pushed.
RPT-03 overlaps PC-02's onboarding scope and RPT-40 live-verifies only behind the founder's Slack app gate (plan §4) — coordinate via the claim ledger, never duplicate.
```

## Brief C — GTM lane (paste into a SONNET session)

```
Read docs/planning/research-sprint-lane-briefs.md, then docs/planning/feature-dashboard.md group G18 (rows RPT-01..50, ranks #328-#377). git pull origin main first.
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

- [`feature-dashboard.md`](./feature-dashboard.md) — group G18 (rows RPT-01..49): the register these briefs pick from; the claim ledger is the collision law
- [`v13-proof-campaign-plan.md`](./v13-proof-campaign-plan.md) §3 — the parent parallel-lane protocol (G17); G18 lanes follow the same mechanics and yield to G17 claims on shared surfaces
- [`../references/pm-voice-and-ai-tooling-research.md`](../references/pm-voice-and-ai-tooling-research.md) §16 + [`../references/investor-corpus-yc-vc.md`](../references/investor-corpus-yc-vc.md) §A + [`../references/podcast-corpus-aakash.md`](../references/podcast-corpus-aakash.md) + [`../references/podcast-corpus-lenny.md`](../references/podcast-corpus-lenny.md) + [`../references/podcast-corpus-frontier.md`](../references/podcast-corpus-frontier.md) + [`../references/new-age-product-development-research.md`](../references/new-age-product-development-research.md) — the evidence base
- [`../strategy/session-decisions.md`](../strategy/session-decisions.md) 2026-07-10 — decisions 1–7 (the authority + boundaries for this merge)
