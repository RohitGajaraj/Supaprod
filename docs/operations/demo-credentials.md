# Demo credentials

> _Created: 2026-06-04 · Last updated: 2026-08-03_

> ### STALE PASSWORDS, VERIFY BEFORE YOU TRUST ONE (2026-08-03)
>
> **The passwords below are not reliable.** They were rotated and this file was not
> updated. On 2026-08-03 an agent followed it, tried the documented password twice, got
> "That email or password isn't right", and burned a chunk of a session before the
> founder said the credentials had changed.
>
> That is the whole cost of this file being wrong: `CLAUDE.md` points every tool at it
> as the way to get a working login, so a stale value here does not fail loudly, it
> sends the next reader down a debugging path that has nothing to do with the product.
>
> **Until a row is re-verified and re-dated, treat its password as unknown and ask the
> founder.** The EMAILS and the workspace mapping are still correct and still useful.
>
> **Rule for whoever rotates next:** change the password and this file in the same
> sitting, and stamp the row with the date it was verified. A credentials doc that is
> occasionally right is worse than one that admits it does not know.

## ⭐ Investor logins, one per application (2026-07-25)

**Four accounts, four isolated workspaces, identical content.** These go into **venture programme applications**: one login per application form. Record which went where in the table below.

Application reviewers are the reason isolation is not optional. They log in **asynchronously and unpredictably**, sometimes weeks after submitting, often more than one reviewer per firm. A shared login means whoever opens it second finds an approval queue the first one already cleared, and the single most important beat in the product is simply gone, with no way to know it happened.

| Account | Password | Workspace | Given to | Sent on |
| --- | --- | --- | --- | --- |
| `voyage@supaprod.ai` | `Supaprod!Voyage2026` | Helio Labs (`20000000-…`) | South Park Commons ❌, then EF The Bridge ❌. **✅ FREE AGAIN 2026-08-22 — this is the NEXT allocation** | 2026-07-31, 2026-08-18 |
| `compass@supaprod.ai` | `Supaprod!Compass2026` | Helio Labs (`30000000-…`) | Betaworks AI Camp — **live, do not reissue** | 2026-07-31 |
| `meridian@supaprod.ai` | `Supaprod!Meridian2026` | Helio Labs (`40000000-…`) | **Nobody. The last never-issued account — hold it as the reserve** | — |
| `lantern@supaprod.ai` | `Supaprod!Lantern2026` | Helio Labs (`50000000-…`) | Campus Founders CF#9 — **live, decision 2026-08-28** | 2026-08-16 |

> **`explore@supaprod.ai` sits outside this table and went to Y Combinator** (2026-07-23). It is the one account with a sign-in nobody has attributed. See below.

### ✅ `voyage@` was double-issued, and measuring it showed that did not matter

**It went to two programmes against the one-login rule** — South Park Commons on 2026-07-31 and EF The Bridge inline in Q4 on 2026-08-18. Both rejected. The obvious fear was that a reviewer from one had cleared the approval queue for the other, which is the exact failure this file exists to prevent.

**Measured against the live database on 2026-08-22, that fear was unfounded: `last_sign_in_at` is NULL.** Neither firm ever signed in. The queue is intact at **6 live pending** and **2,087 credits**, and the 14 decided rows are the 2026-07-21 seed that every demo account carries, not reviewer activity. **Nothing to re-arm, nothing to rotate.** It returns to the pool clean.

```sql
-- the query behind every number above; re-run it before issuing any login
SELECT u.email, w.name AS workspace,
       coalesce(ac.balance_credits,0)+coalesce(ac.topup_credits,0) AS credits,
       (SELECT count(*) FROM agent_approvals a
         WHERE a.workspace_id=w.id AND a.status='pending'
           AND a.decided_at IS NULL AND a.expires_at > now()) AS live_pending,
       u.last_sign_in_at
FROM auth.users u
JOIN workspace_members wm ON wm.user_id=u.id
JOIN workspaces w ON w.id=wm.workspace_id
LEFT JOIN account_credits ac ON ac.account_id=w.account_id
ORDER BY u.email;
```

### 🔍 NO PROGRAMME REVIEWER HAS EVER SIGNED IN, and that is the finding worth acting on

Across every login issued to a venture programme, `last_sign_in_at` tells one story:

| Account | Programme | Last sign-in | Whose |
| --- | --- | --- | --- |
| `voyage@` | SPC, EF | **never** | — |
| `compass@` | Betaworks | **never** | — |
| `meridian@` | none | **never** | — |
| `lantern@` | Campus Founders | 2026-08-16 05:54 UTC | **ours** — matches the recorded 11:25 IST verification exactly |
| `explore@` | Y Combinator | 2026-08-13 08:12 UTC | **UNATTRIBUTED.** Nobody recorded doing this. It is either an unlogged check of ours or the only reviewer sign-in we have ever had |
| `harbor@` | rehearsal only | 2026-08-21 05:45 UTC | ours, as intended |

**Two consequences.** First, the one-login-per-programme rule has never once been load-bearing, because no second reviewer has ever arrived to find a cleared queue. Keep the rule — the cost of breaking it is asymmetric — but stop treating a double-issue as an emergency. Second, **`explore@`'s 2026-08-13 sign-in needs attributing**, because if it was YC it is the single most interesting datapoint in this file and nothing anywhere records it.

### ⏰ The queues lapse around 2026-09-26, inside SkyDeck's interview window

The 2026-07-28 re-arm set `expires_at` to **+60 days**. Berkeley SkyDeck interviews run **09-08 to 10-05**, so a reviewer arriving in the last week of that window finds an expired queue. **Re-run the reset before 2026-09-26.**

### The rehearsal copy (never send this one out)

| Account | Password | Workspace | Purpose |
| --- | --- | --- | --- |
| `harbor@supaprod.ai` | `Supaprod!Harbor2026` | Helio Labs (`60000000-…`) | The founder's practice runs, and the account any agent uses for testing. |

**Rehearse on `harbor@`, never on a login you plan to send.** Approving a gate is a write. A walkthrough practised on `voyage@` hands that firm an already-empty approval queue, which is precisely the beat the demo is built around. `harbor@` is identical in content, so practice is faithful, and it is disposable: re-run the clone for the `60000000` prefix any time to restore its pending queue.

Provisioned by `supabase/migrations/20260725120000_investor_demo_accounts.sql`; content cloned by `20260725140000_clone_helio_to_investor_workspaces.sql`. Both idempotent.

### ⏳ The queues decay on their own — re-arm before every review window (found 2026-07-28)

The seed gives each workspace **5 pending approvals whose `expires_at` sits only hours out**, so the queue rots with no one touching it: by 2026-07-28 every demo workspace (all seven Helio prefixes, master included) had decayed to **1 pending + 4 expired**, and even the surviving "pending" row was past its expiry. A partner logging in would have found a dead approval room — the exact failure this file exists to prevent, caused by time instead of a shared login.

**Re-armed 2026-07-28:** undecided rows only (`status in (pending, expired)` and `decided_at is null`) reset to `pending` with `expires_at = now() + 60 days`; decision-history rows (approved / rejected / executed / failed) untouched, they are the record partners should see. Verified after: 5 live pending in all seven prefixes. **This holds until late September. Re-run the same reset before any interview window, and after any re-clone** — a fresh clone inherits the short expiries and starts decaying immediately.

### 💳 The credits decay too, and that is a second axis (found 2026-08-20)

**The queue rots by TIME. The balance rots by USE, and nothing was watching it.** Measured
2026-08-20, before a top-up: `compass@` **0**, `harbor@` **0**, `lantern@` **1**, `explore@` **2**,
`voyage@` **8**. Only `meridian@` (742) was healthy.

`LOW_CREDITS_WARN` is **100** (`src/lib/entitlements.ts:126`), so five accounts were under it and
`BillingBanner` put this at the top of **every page in the shell**:

> *"Running low: 0 AI credits left. Top up or upgrade so the loop keeps running."*

**A reviewer would have read that before seeing anything work**, and it was not only cosmetic:
`gate_credit_exhausted` refused **167 calls in 24 hours across 5 users**.

**Topped up 2026-08-20 to 5,000 each** (founder-authorised), recorded in `credit_ledger` as `grant`
and in `admin_audit_log`. Verified after: the lowest account in the system is now 742, and the
banner is gone from `/today` and `/approvals`.

**Rule for the next review window: check the BALANCE as well as the queue.** One query:

```sql
SELECT u.email, coalesce(ac.balance_credits,0)+coalesce(ac.topup_credits,0) AS credits
FROM accounts a JOIN auth.users u ON u.id=a.owner_id
LEFT JOIN account_credits ac ON ac.account_id=a.id
WHERE u.email LIKE '%@supaprod.ai' ORDER BY credits;
```

Anything at or under 100 shows the banner. **Agents spend these accounts too**: this lane's own
verification runs drained `harbor@` over one day.

> [!IMPORTANT]
> **Never give two firms the same login.** The demo's signature beat is approving a pending gate, and approving is a *write*. Two firms on one workspace means the second one opens an empty queue and sees a dead room. That is the entire reason these four exist rather than sharing `explore@`.

**Why these names.** They extend the existing `explore@` / `ember@` convention. They are deliberately not `demo1` / `demo2`: an investor reads the address, and "demo3@" says they are one of a list. The account name is also how the founder tracks who is looking, so **fill in the "Given to" column when you send one** — a login that appears in the logs is an engagement signal, and it is worthless if nobody knows whose it is.

**Each account signs in as `Maya Ruiz`,** the product manager in [`../pitch/demo-story.md`](../pitch/demo-story.md). The name on screen has to match the name in the voiceover, or the story breaks the moment a viewer notices.

**Re-arming between firms.** Approvals decided by one firm stay decided in that workspace. To hand a used login to someone else, re-run the clone migration for that prefix; it restores the pending queue without touching the other three.

### Internal accounts (not for investors)

| # | Email | Password | Notes |
| --- | --- | --- | --- |
| 1 | `explore@supaprod.ai` | `Supaprod!Explore2026` | **The login on the YC application form.** Owns its own isolated Helio Labs clone (`70000000-…`) since 2026-07-25. It was the founder's recording account; from 2026-07-28 rehearse and record on `harbor@` only, because explore@ is what YC holds. |
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
- [`planning/archive/feature-backlog.md`](../planning/archive/feature-backlog.md) — live status board
