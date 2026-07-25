# Demo credentials

> _Created: 2026-06-04 · Last updated: 2026-07-25_

## ⭐ Investor logins, one per application (2026-07-25)

**Four accounts, four isolated workspaces, identical content.** These go into **venture programme applications**: one login per application form. Record which went where in the table below.

Application reviewers are the reason isolation is not optional. They log in **asynchronously and unpredictably**, sometimes weeks after submitting, often more than one reviewer per firm. A shared login means whoever opens it second finds an approval queue the first one already cleared, and the single most important beat in the product is simply gone, with no way to know it happened.

| Account | Password | Workspace | Given to | Sent on |
| --- | --- | --- | --- | --- |
| `voyage@supaprod.ai` | `Supaprod!Voyage2026` | Helio Labs (`20000000-…`) | _(fill in)_ | |
| `compass@supaprod.ai` | `Supaprod!Compass2026` | Helio Labs (`30000000-…`) | _(fill in)_ | |
| `meridian@supaprod.ai` | `Supaprod!Meridian2026` | Helio Labs (`40000000-…`) | _(fill in)_ | |
| `lantern@supaprod.ai` | `Supaprod!Lantern2026` | Helio Labs (`50000000-…`) | _(fill in)_ | |

### The rehearsal copy (never send this one out)

| Account | Password | Workspace | Purpose |
| --- | --- | --- | --- |
| `harbor@supaprod.ai` | `Supaprod!Harbor2026` | Helio Labs (`60000000-…`) | The founder's practice runs, and the account any agent uses for testing. |

**Rehearse on `harbor@`, never on a login you plan to send.** Approving a gate is a write. A walkthrough practised on `voyage@` hands that firm an already-empty approval queue, which is precisely the beat the demo is built around. `harbor@` is identical in content, so practice is faithful, and it is disposable: re-run the clone for the `60000000` prefix any time to restore its pending queue.

Provisioned by `supabase/migrations/20260725120000_investor_demo_accounts.sql`; content cloned by `20260725140000_clone_helio_to_investor_workspaces.sql`. Both idempotent.

> [!IMPORTANT]
> **Never give two firms the same login.** The demo's signature beat is approving a pending gate, and approving is a *write*. Two firms on one workspace means the second one opens an empty queue and sees a dead room. That is the entire reason these four exist rather than sharing `explore@`.

**Why these names.** They extend the existing `explore@` / `ember@` convention. They are deliberately not `demo1` / `demo2`: an investor reads the address, and "demo3@" says they are one of a list. The account name is also how the founder tracks who is looking, so **fill in the "Given to" column when you send one** — a login that appears in the logs is an engagement signal, and it is worthless if nobody knows whose it is.

**Each account signs in as `Maya Ruiz`,** the product manager in [`../pitch/demo-story.md`](../pitch/demo-story.md). The name on screen has to match the name in the voiceover, or the story breaks the moment a viewer notices.

**Re-arming between firms.** Approvals decided by one firm stay decided in that workspace. To hand a used login to someone else, re-run the clone migration for that prefix; it restores the pending queue without touching the other three.

### Internal accounts (not for investors)

| # | Email | Password | Notes |
| --- | --- | --- | --- |
| 1 | `explore@supaprod.ai` | `Supaprod!Explore2026` | The founder's recording account. Admin on the shared Helio Labs. |
| 2 | `ember@supaprod.ai` | `Supaprod!Ember2026` | Codename twin, also on the shared Helio Labs. |
### Retired: the `redcadence.app` logins (2026-07-25)

`demo@redcadence.app` and `demo2@redcadence.app` are **disabled and must not be used or quoted anywhere.** Their passwords were rotated to random values and `profiles.suspended` is `true` on both, so the credentials printed in older docs no longer authenticate. **`harbor@supaprod.ai` replaces them for all internal use.**

They were deliberately **disabled rather than deleted**, and this matters:

`workspaces.owner_id` is `ON DELETE CASCADE`, and 45 of the 65 foreign keys into `auth.users` cascade. `demo@redcadence.app` still **owns Helio Labs** (`10000000-`), the master template every other demo workspace is cloned from, plus Sample sandbox. Deleting that auth row would delete Helio Labs itself and cascade through `projects` and everything beneath, taking the clone source with it. 41 rows inside Helio Labs alone are still owned by that user.

**To delete them for real,** the ownership has to move first: reassign `workspaces.owner_id` for Helio Labs and Sample sandbox, then reassign the `user_id` on the rows those workspaces hold, and only then remove the auth rows. That is careful surgery, not a one-line delete, and nothing needs it today since both logins are already dead.

> [!WARNING]
> `explore@` and `ember@` are **both admins of the same** Helio Labs workspace, so they contaminate each other. Fine for internal use, never for two investors.

Sign in at [`/login`](https://supaprod.ai/login) (or the preview URL - `supaprod.lovable.app` 302-redirects here, confirmed live 2026-07-17).

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
