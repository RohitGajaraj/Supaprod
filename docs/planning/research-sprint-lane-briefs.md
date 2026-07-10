                               # Research-sprint lane briefs — G18 (2026-07-10 research merge)

> _Created: 2026-07-10 (the research-to-product merge session). Authority: the founder's full-tweak-authority grant — [`../strategy/session-decisions.md`](../strategy/session-decisions.md) 2026-07-10 decision 7 (25-day ship · provenance on every change · claims-based collision discipline · documentation minimalism · nothing-is-doctrine)._

**What this is.** Three paste-ready briefs, one per parallel Claude Code session, over dashboard group **G18** ([`feature-dashboard.md`](./feature-dashboard.md) rows **RPT-01..50**, ranks #328–#377): the merged, deduped product moves from the five research lanes (pm-voice research §16 RPT-01..14 · investor corpus §A · Aakash corpus · Lenny corpus · frontier corpus · new-age building research · the founder's upstream/downstream directive · the founder's self-improving-loop directive, RPT-50). 47 rows are **DECISIVE** (⬜ claimable); 3 are **FOUNDER-CALL** (⬜ Gated — RPT-20 outcome-priced SKU, RPT-22 BYOK metering bypass, RPT-34 paid pilots — each with its tension stated on the row; lanes NEVER pick these). Canon edits already applied this merge: pricing-strategy.md (Critic teardown into Free; value-metric evolution note; labor-budget anchor), moat.md (§1 research-corroboration note), v13-proof-campaign.md §8 (five evidence-ratified support lines, the fifth — "Cadence runs on Cadence" — stamped claim-on-wiring until RPT-50 runs).

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
