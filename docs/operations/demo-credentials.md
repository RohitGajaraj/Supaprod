# Demo credentials

> _Created: 2026-06-04 · Last updated: 2026-07-10_

Two pre-provisioned demo accounts ship with the database. Use them for YC / investor / customer demos, screen recordings, and any application that asks for a working login. Same password for both — easy to share, easy to remember.

| #   | Email                  | Password           |
| --- | ---------------------- | ------------------ |
| 1   | `demo@redcadence.app`  | `Cadence!Demo2026` |
| 2   | `demo2@redcadence.app` | `Cadence!Demo2026` |

Sign in at [`/login`](https://cadence-flow-beta.lovable.app/login) (or the preview URL).

> [!WARNING]
> **`demo@redcadence.app` credit balance is not guaranteed sufficient for a full live walkthrough — check/top-up before demoing.** During this ship-week's live testing the account repeatedly hit the cost guard (balance seen as low as 2 credits against a 32-credit projected action) before a manual grant of 1,000 standing credits was applied. Separately, on 2026-07-10 the platform-wide free-tier starter grant was raised from 500 to 750 credits for NEW signups (existing accounts were trued up +250) — that platform change is unrelated to, and does not substitute for, verifying this specific demo account's live balance. Check the account's actual balance before any demo/investor walkthrough; do not assume it is sufficient.

> [!IMPORTANT]
> **New comprehensive sample seed (SAMPLE-SEED, authored 2026-07-05).** A richer, two-product showcase seed supersedes the single Lumen narrative below for the demo accounts: **Prism** (a consumer money app, the deep hero) + **Trellis** (a warehouse-native product-analytics platform), covering every surface with rich business/product/stakeholder data, including a live outcome-driven **supersession** on both products (the moat proof). It ships as `supabase/migrations/20260705120000_sample_workspace_seed.sql` and, when applied via Lovable, **wipes the demo accounts' prior content and reseeds** them into an **"Explore workspace"** (a space to explore the product, renamed from the internal "sample" wording). Full coverage guide: [`../features/sample-workspace-seed.md`](../features/sample-workspace-seed.md). A ready-to-read under-3-minute founder demo script driven by this data: [`founder-demo-script.md`](./founder-demo-script.md). The Lumen section below is retained as the prior narrative until that migration is applied.

## What ships in each account

Each account lands in a fully populated **Demo workspace** seeded with the Lumen narrative (an AI customer-support operator for B2B SaaS):

- 1 product (Lumen) with a north-star + target date
- 3 themes, 9 signals across Intercom / Slack / CSAT / sales / churn calls
- 5 opportunities (2 committed, 1 discovery, 2 backlog) with ICE scores
- 2 PRDs (Escalation Policy Engine — approved, Smart Off-Hours Routing — draft)
- 10 tasks (done / doing / todo, split across agents and humans)
- 4 internal docs (product brief, operating principles, Q4 roadmap, competitive scan)
- 2 meetings with transcripts + action items + decisions
- 3 decisions, 4 founder notes
- 1 in-flight conversation, 1 mission ("Ship Escalation Policy Engine v0") with agent-to-agent handoffs
- 2 completed agent runs, 18 AI events across 3 traces (chat / agent / copilot / discovery / roadmap / meetings)
- 1 eval suite (protected-topic escalation) with 4 cases, 1 completed run, results per case
- 7 days of drift snapshots + baseline thresholds
- AI budget (daily + monthly caps with usage)
- 5 daily briefs

Each account also gets an empty `My Workspace` alongside the Demo workspace, which you can use for clean experiments.

> [!NOTE]
> **Live drift on `demo@` (as of ship-week testing, 2026-07-10).** The `demo@redcadence.app` workspace has accumulated real production artifacts on top of the originally-seeded sample data over the course of live ship-week testing — a bound GitHub test repo, an active goal, an active loop, and several real/failed missions. Its current live contents are no longer purely the documented sample-seed narrative above. Anyone doing a clean demo should re-seed (see "Re-seeding" below) or otherwise account for this drift before relying on the account matching this doc exactly.

## How they were created

- **Auth users** — migration `20260604203338_*.sql` provisions both accounts directly into `auth.users` with `email_confirmed_at` set, so no verification email is needed.
- **Seed data** — created by `public.seed_demo_workspace(user_id)`, which is idempotent (early-exits if a Demo workspace already exists for the user).
- **Slug fix** — migration `20260604214234_*.sql` switched the demo workspace slug from a hardcoded `'demo'` to a per-owner slug (`'demo-' || substr(user_id::text, 1, 8)`), so multiple demo users no longer collide on the global `UNIQUE(slug)` constraint. The same migration re-seeds the existing demo accounts.

## Re-seeding

If a demo account ever ends up empty, call the seed function manually as a database superuser.

> ⚠️ **KI-14 — run the normalization too.** `seed_demo_workspace` still writes eval/drift scores on the legacy **0–1** scale, but those columns are now **0–100** (migration `20260614160000`). Re-seeding a _fresh/emptied_ demo account without normalizing makes the Evals/Drift surfaces read the false "score 1 · below gate 80". Use this exact block (seed, then normalize):

```sql
SELECT public.seed_demo_workspace(id) FROM auth.users WHERE email = 'demo@redcadence.app';
-- KI-14 normalization — bring the seed's 0–1 eval/drift scores onto the 0–100 scale.
-- Guarded by `<= 1`, so it only touches freshly-seeded 0–1 rows.
UPDATE public.eval_runs         SET avg_score      = round(avg_score * 100, 3)      WHERE avg_score IS NOT NULL AND avg_score <= 1;
UPDATE public.eval_case_results SET score          = round(score * 100, 3)          WHERE score IS NOT NULL AND score <= 1;
UPDATE public.drift_snapshots   SET avg_eval_score = round(avg_eval_score * 100, 3) WHERE avg_eval_score IS NOT NULL AND avg_eval_score <= 1;
```

The seed itself is safe to call repeatedly — it checks for an existing `Demo workspace` and bails if one is already there.

## Security note

These accounts are public knowledge by design. Do not store any real customer or commercial data in them. The shared password is intentionally generic and not tied to any other system.

## Related

- [`AGENTS.md`](../../AGENTS.md) — operating manual
- [`README.md`](../README.md) — product thesis
- [`docs/planning/feature-backlog.md`](../planning/archive/feature-backlog.md) — live status board
