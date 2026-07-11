# HyperAgent $20k deployment — the arm's-length GTM rig runbook

> _Created: 2026-07-10 (Lane D, PC-26). Status: **account verified live (founder logged in via Chrome, 2026-07-10) — the grant terms below are receipts, not estimates. Execution not yet started; the $200/yr subscription decision is the founder's, and no task has been run.**_

## The grant, verified live (2026-07-10, hyperagent.com/settings/billing)

**The plan's "$20k grant" is NOT already active — it is gated behind a $200/year subscription the founder hasn't taken yet.** Exact page text: _"Welcome to the Founding 500. You're getting $20,000 in promotional credits. Sign up for our special plan for $200/year, and the credits will be added to your account."_ This corrects plan §6's "unverified, treat as time-bound" flag with a real answer: it isn't time-bound in the sense of an offer that decays while sitting in the account — it simply hasn't been claimed yet.

**What IS already active, right now, no further action needed:** a **$1,000 bonus credit block, expires 2026-11-29, $0.00 used, $1,000.00 remaining.** Current plan: Pay As You Go, $0/month.

**The founder-gated decision this surfaces (his call, not mine):** subscribe for $200/year to unlock the $20,000 Founding 500 credit (a real purchase — I have not done this and will not without explicit go-ahead), or run the GTM ops engine on the existing $1,000 credit first and decide on the $200/yr once there's a week of real usage data to judge it against. Either way the $1,000 already covers meaningful first-week work per the cost data below.

**Live cost data (from HyperAgent's own example gallery, hyperagent.com/threads/new, 2026-07-10):** comparable multi-step research/outreach tasks cost $3.88-$24.79 and run 8-30 minutes each — in the same range the plan's own §6 estimate assumed ($10-25/run for research, $50-100/week for the ops engine), now receipt-verified rather than guessed. A "Personalized prospect outreach" template exists natively in the product (find prospects, draft outreach, build a pitch deck) — directly relevant to PC-13, worth trying once execution is greenlit.

## The posture (non-negotiable, plan §6)

**HyperAgent/Airtable ships ProductCentral — a direct category competitor to Cadence.** The credit is disposable GTM/research compute, never product infrastructure, never a maintained two-way integration, and **zero product data ever resident there.** This isn't a caution to keep in mind while building — it's a hard boundary the rig's own configuration must enforce structurally (no persistent sync jobs, no OAuth grants into Cadence's own DB, no workspace decision data, ranking data, or user PII ever passed into a HyperAgent prompt or table).

## The three engines (in spend priority order)

### 1. GTM ops engine (spend first — feeds PC-13 + PC-14 directly)

**What it does:** prospect/community research to widen and verify the PC-13 design-partner list beyond the 25 already hand-picked from the r/ProductManagement thread (see [`design-partner-kit.md`](./design-partner-kit.md)); launch-day monitoring across HN/PH/Reddit for the PC-14 listing (mentions, sentiment, questions the founder should answer live); outreach-cadence tracking (who was contacted, when, reply status — a lightweight CRM view over the same 25 targets, never a system of record — Cadence's own ledger stays the system of record for everything that matters).

**Budget:** ~$50-100/week, ongoing through the Launch Month.

**First-week task list (ready to run the day access exists):**

1. Cross-check the 25 design-partner handles in [`design-partner-kit.md`](./design-partner-kit.md) for recent activity (still active accounts, still posting) — a cheap freshness check before the founder spends a message on a dead account.
2. Set up HN/PH/Reddit keyword monitors for "Cadence" + the exact Show HN title (once fixed, see [`launch-assets.md`](./launch-assets.md)) so the founder sees every mention the moment PC-14 goes live, not hours later.
3. Build the outreach-cadence tracker: one row per target, contacted-date/reply-status columns only — read-only reference for the founder, not a place any product data lives.

### 2. Research rig (feeds positioning + YC evidence)

**What it does:** review-mining at scale (refreshing the G2/Reddit/HN corpus behind [`../references/pm-voice-and-ai-tooling-research.md`](../references/pm-voice-and-ai-tooling-research.md) as new threads surface post-launch); interview synthesis once design-partner conversations start generating raw notes (turning PC-13's weekly-ritual quotes into structured findings faster than manual read-through).

**Budget:** $10-25/run, as needed (not standing spend like the GTM engine).

**First candidate run (ready once access exists):** a fresh top-of-year sweep of r/ProductManagement + r/startups for any new build-log-shaped posts (the same pattern that surfaced the §12.2 cohort) — the research doc's own §12.5 follow-up queue already lists this as next.

### 3. Raise/ops pipeline (secondary, post-launch only)

Not scoped for the Launch Month. Revisit at G-SCALE per the plan's gates-not-dates discipline — no work drafted here, deliberately, to avoid speculative build against gates that haven't opened.

## What never happens here (hard boundary, restated)

- No core orchestration logic, no decision data, no ranking data, no workspace records — nothing ProductCentral (or any Airtable product) could learn from by virtue of sharing infrastructure with Cadence.
- No persistent two-way sync between HyperAgent and Cadence's Supabase instance.
- No OAuth grant from HyperAgent into any Cadence-owned account or data source.
- If a task can't be described honestly as "disposable research/GTM compute," it doesn't run here — full stop, not a judgment call per-task.

## Acceptance tracking (PC-26)

- [ ] Rig running — **account verified live 2026-07-10; first task not yet run, awaiting founder greenlight on spend**
- [ ] Founder-time saved logged — not measurable until running
- [ ] Zero product data in Airtable — the boundary rule above is the enforcement mechanism, verify it holds once the rig runs
- **This session's deliverable:** the account verified live with real grant/credit/cost data (no guessing left in this row), the spend-priority order, the arm's-length boundary rule, and a same-day-executable first-week task list. What's left is a founder call (subscribe for the full $20k now vs. run the existing $1,000 first) and then the actual first task run — not a spec problem anymore.
