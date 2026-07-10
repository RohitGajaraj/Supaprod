# Credit engine + billing go-live runbook

> _Created: 2026-06-21 · Owner: Claude (monetization is Claude-owned end to end as of 2026-06-21)._

The monetization + credit engine is **built and wired end-to-end**, verified in sandbox, and intentionally **dormant on the live app**. This runbook is the exact, safe sequence to turn it on. Until every step here is done, the engine stays off and the live app is unaffected.

## Current state (what is already true)

- **Stripe rail (sandbox):** the embedded checkout, subscriptions, top-ups, portal, cancel/resume, and the signature-verified webhook (`src/routes/api/public/payments/webhook.ts`) all work against Stripe **sandbox** keys. The legacy `/api/stripe/webhook` is retired (a 200 no-op).
- **Credit engine (wired, dormant):** on an active subscription the webhook grants the bundle's monthly credits; on renewal it refills; a top-up credits the balance; all of this writes balances **unconditionally** (only ever adds credits). The **debit** path (`assertAccountCredits`/`debitAccountCredits` in `runtime.server.ts`) is the only part gated by `credits_enabled()`, which is **OFF**.
- **Pricing:** the public `/pricing` page + the in-app picker both reflect the catalog (`pricing_bundles`): Cluster 1k/$25, Constellation 5k/$99, Galaxy 1k/$30 per seat (recommended), with the full per-tier credit-volume ladder.
- **Guardrail:** `admin_set_credits_enabled` now **refuses** to turn metering on while any non-enterprise account has 0 credits (this is what prevents a repeat of the 2026-06-21 incident, where metering was armed with zero credits and blocked all AI).

## ⚠️ The 2026-06-21 incident (read this before touching the toggle)

The admin "credits engine" toggle (Settings → Admin → Overview) writes `app_settings.credits_enabled`, which `credits_enabled()` reads live. It was flipped ON with **zero credits granted**, so every AI call halted (`credit_exhausted: balance 0 below projected`). It is now OFF, and the guard above blocks re-arming it until balances exist. **Do not flip it on from the admin UI by itself** - follow the sequence below.

## Go-live sequence

### Step 1 - provide live Stripe keys (founder)

Set these as wrangler secrets (server) + the Vite client token (the env-var split in `CLAUDE.md`):

- `STRIPE_LIVE_API_KEY` (server, the live secret key via the Lovable connector gateway)
- `VITE_PAYMENTS_CLIENT_TOKEN` = the **live** publishable token (`pk_live_...`) — flips `PaymentTestModeBanner` to live and lets the embedded checkout mount
- `PAYMENTS_LIVE_WEBHOOK_SECRET` (the live webhook signing secret)
- Confirm the live Stripe catalog has prices whose `lookup_key`s match `billing-tier.ts` (`cluster_1k_monthly`, `constellation_5k_monthly`, `galaxy_1k_seat_monthly`, the per-bundle variants, and `topup_250` / `topup_1k` / `topup_2_5k`). Tell Claude when the keys are in and the live webhook endpoint (`/api/public/payments/webhook?env=live`) is registered in Stripe.

> Until live keys are present, `stripeConfigured` is false and checkout stays in sandbox/preview. Nothing charges.

### Step 2 - backfill credits (one call, safe, idempotent)

Grant every existing account its tier's monthly allowance so no one is blocked the moment metering turns on:

```sql
select public.backfill_account_credits();
-- free -> 500, pro -> 2500, max -> 10000, team -> 10000; enterprise = custom (skipped).
-- Only touches accounts with monthly_grant_credits = 0; preserves bundle grants + top-ups.
```

Verify zero accounts are unfunded:

```sql
select count(*) from account_credits c join accounts a on a.id=c.account_id
 where a.plan_tier <> 'enterprise'
   and coalesce(c.balance_credits,0)+coalesce(c.topup_credits,0)+coalesce(c.monthly_grant_credits,0)=0;
-- must be 0 before enabling.
```

### Step 3 - keep new accounts funded (so the guard stays true after go-live)

New free accounts start at 0 until granted. The `credit-tick` cron grants un-granted accounts on its schedule; confirm it is enabled in production so a brand-new free account is funded before its first AI call. (Follow-up `GRANT-ON-CREATE` will seed the free allowance at account creation so there is never a gap; until then the cron covers it.)

### Step 4 - enable metering (the switch)

Either flip the admin toggle (Settings → Admin → Overview → "Turn ON"), or:

```sql
-- this goes through the guard; it will RAISE if any account is still unfunded.
select public.admin_set_credits_enabled(true);  -- (must be called as an admin)
```

The guard refuses if step 2/3 were skipped. Once on, `assertAccountCredits` meters AI calls and `debitAccountCredits` draws down the pool.

### Step 5 - verify

- A test subscribe (live, small) grants the bundle's credits; a top-up adds to the balance; an AI call debits and the ledger shows the `debit` row; the Credits tab balance moves.
- Watch `ai_events` for any `credit_exhausted` blocks (should be none for funded accounts).

## Rollback

If anything looks wrong, turn metering off instantly (reversible, restores the dormant state):

```sql
update public.app_settings set value='false'::jsonb, updated_at=now() where key='credits_enabled';
```

Balances are preserved; only the debit path stops. The in-process flag cache refreshes within 5 minutes (cold-starts immediately).

> **Live-state update (2026-07-11, lane-A, corrected after full verification):** every repo migration through `20260711010000` is APPLIED to the live DB (via the Lovable MCP; the calendar-oauth one needed an existence guard — live drift from a 2026-07-09 ad hoc apply). Verified live: `apply_refund_clawback` + `credit_refunds` + `subscriptions/credit_topups.provider` + `missions.verify_cycles` all present; unfunded-account count **0**; every auth user has a profile, the orchestrator, and the sync-branch tool (8/8 — a healed signup-trigger bug, see `20260711010000`). **Correction: `credits_enabled` is ALREADY ON in production** (it has been since ship-week live testing — this doc's "dormant" framing was stale); that is safe because the guard condition (zero unfunded accounts) holds. What still waits on the founder is the payment-rail decision for the live MERCHANT path (real-card checkout), not metering. **Rail ruling (founder, 2026-07-11): DEFERRED.** Stripe remains the active default rail (this runbook's Step 1 — live Stripe keys — still slots in with zero code changes); the Paddle adapter is code-complete and inactive beside it. Whichever way the call lands, activation is config-only through the PaymentsProvider seam (see the PC-05 section below).

## PC-05 additions (2026-07-10): the provider seam, the refund path, the automated checklist

- **PaymentsProvider seam** (`src/lib/payments/provider.server.ts`): one interface (`createCheckout` / `verifyWebhook` / `grantFromEvent`), Stripe refactored into it (`stripe-provider.server.ts`), Paddle beside it (`paddle-provider.server.ts`). The grant/tier/top-up/refund money paths live once in `grant-core.server.ts` — adapters only translate events. The webhook URL gains `&provider=paddle` for the Paddle destination; Stripe registrations are unchanged.
- **Paddle activation [awaiting MoR account]** — zero code changes at go-live: (1) set `PADDLE_API_KEY` + `PADDLE_WEBHOOK_SECRET` (wrangler secrets), (2) register `/api/public/payments/webhook?env=live&provider=paddle` as the Paddle notification destination, (3) mirror the catalog in Paddle with each price carrying `custom_data.lookup_key` = our existing lookup keys (`cluster_*` / `constellation_*` / `galaxy_*` / `topup_*`), (4) set `PAYMENTS_PROVIDER=paddle` to make hosted Paddle checkout the active rail (the checkout dialog redirects to the hosted page automatically).
- **Refund path (both rails):** a provider refund on a top-up purchase claws the credits back via `apply_refund_clawback` (migration `20260710233000`) — floored at zero, never negative-locks a workspace, one `credit_ledger` row per clawback, idempotent per provider refund id, and the purchase row flips to `refunded`. Subscription-fee refunds deliberately do not claw the monthly allowance (the subscription lifecycle governs that).
- **The checklist, automated:** Settings → Admin → Overview now renders a "Billing go-live checklist" card (`getBillingGoLiveReadiness`): provider keys present, every active catalog key parses to credits, the runbook's unfunded-account query, webhook liveness, and the meter state. It is report-only (the dry run); the flip stays the guarded toggle above it. Steps 2-5 in this runbook remain the authoritative sequence — the card tells you when they are genuinely done.

## Related

- [`../features/billing.md`](../features/billing.md) · [`../features/credits.md`](../features/credits.md) · [`../features/pricing.md`](../features/pricing.md)
- Engine: `src/routes/api/public/payments/webhook.ts`, `src/lib/payments.functions.ts`, `src/lib/credits.functions.ts`, `src/lib/ai/runtime.server.ts`
- Migrations: `20260621120000_credit_flow_apply.sql` (grant/topup/renewal RPCs), `20260621130000_credit_golive_guard.sql` (guard + backfill)
- Dashboard rows: `M-C-PRICE`, `WM-M11/M12/M13/M16`, `BYO-P4`
