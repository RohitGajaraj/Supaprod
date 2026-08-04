# Billing rail (Stripe, credit-bundle model)

> _Created: 2026-06-20 · Last updated: 2026-06-26_

> **Pricing strategy reference:** the WHY behind the tier model, credit dropdown architecture, upgrade narrative, and value matrix lives in [`strategy/pricing/pricing-strategy.md`](../strategy/pricing/pricing-strategy.md) (2026-06-26 founder decision: 4 tiers / Lovable-style dropdown / linear credit pricing / annual-only discount). This file documents the HOW (Stripe rail, webhook, catalog tables). Read pricing-strategy.md first if you are working on pricing surfaces.

> Status · Stripe rail SHIPPED 2026-06-20 (Stripe-capable in sandbox; admin-editable pricing catalog + service-role billing vault tables). **Checkout + customer portal + cancel/resume + top-up checkout are all wired in `src/lib/payments.functions.ts`, plus the live webhook at `src/routes/api/public/payments/webhook.ts`.** Webhook handles `checkout.session.completed`, `customer.subscription.{updated,deleted}`. Sandbox/test env active; live env gated on the founder.
>
> _Reconciled 2026-06-21 against shipped code: dropped the "TBD Phase 5" framing - checkout, top-up, portal, and the webhook are all shipped. The live rail is `src/lib/payments.functions.ts` + `src/routes/api/public/payments/webhook.ts` (via the Lovable connector gateway). The older `src/routes/api/stripe/webhook.ts` is dead/legacy and is NOT live._

## Update 2026-06-20 (Lovable cycle: cancel / resume / portal as shipped)

- **Server fns (`src/lib/payments.functions.ts`):**
  - `getMySubscription` — reads the active subscription row via service-role after `requireSupabaseAuth` verifies the caller.
  - `createPortalSession` — opens Stripe Customer Portal (new tab; portal cannot embed).
  - `mutateCancelFlag` — sets `cancel_at_period_end` true/false (cancel + resume). End-of-period semantics: a canceled sub keeps access until `current_period_end`.
  - All three load `supabaseAdmin` lazily inside the handler (never at module scope) per the server-runtime rule.
- **UI:** Settings → Plan hosts cancel / resume / "Open portal" inline next to the current-plan card. Destructive cancel goes through `useConfirm()` (per `destructive-actions.md`).
- **Test-mode banner:** a calm banner declares when Stripe is in sandbox so the user is never confused about whether a real charge happened. Component: `src/components/billing/PaymentTestModeBanner.tsx`.
- **Stripe-id column lockdown:** migration `20260620225748_*.sql` revokes `stripe_customer_id` / `stripe_subscription_id` on `accounts`, `workspaces`, `subscriptions` from anon+authenticated. Two EXPOSED_SENSITIVE_DATA findings closed.

## What it does

The end-to-end Stripe subscription + portal rail for Supaprod. Tiers are feature gates; the headline price is driven by a per-tier credit-bundle dropdown (Lovable-style). Top-ups live on a separate `/settings/credits` page (Anthropic-style isolation, not the Plan tab). Admin pricing is editable from `/admin/pricing` (inbuilt console; no separate portal).

## Tier shape

> **Rewritten 2026-08-04.** This section described the retired Constellation naming (Star / Cluster / Constellation / Galaxy / Cosmos), a per-tier **credit-bundle dropdown**, and a **Max** tier. All three are gone. The band picker was retired by founder ruling 2026-08-03, the thematic names on 2026-07-13, and **Max is not offered** (founder ruling restated 2026-08-04).

**Four tiers, and only four.** `PUBLIC_PLAN_TIERS` in `src/lib/entitlements.ts` is the authority: `["free", "pro", "team", "enterprise"]`.

| | Free | Pro | Business (`team`) | Enterprise |
| --- | --- | --- | --- | --- |
| **Price** | $0 | **$20**/mo | **$50 per seat**/mo | committed contract |
| **Credits / month** | **750** | **3,750** | **15,000 pooled** | committed pool |
| **Seats** | 1 | 1 | **minimum 2** (`MIN_SEATS`) | unlimited |

- **Price is flat per tier.** There is no band, no dropdown, and no linear credit multiplier. `priceForCredits` accepts a `credits` argument for call-site compatibility and **deliberately ignores it**.
- **Annual** = monthly x 10/12, roughly 17% off.
- **Top-ups** are how capacity is bought: add credits any time **up to 2x the monthly grant** (`topUpCycleCap = grant x 2`), with **no plan change**, so a Pro user reaches 3x their allowance without being pushed onto a team plan.
- **A tier sells seats and capability; credits sell capacity.** Conflating those two axes is the mistake the band model was retired for; the reasoning is in `src/lib/billing-tier.ts`.

**Two names still to reconcile in code:** the locked display names are Free / Pro / **Business** / Enterprise, while the slug is `team`, and a fifth `max` slug lingers in the internal `PLAN_TIERS` list without being offered. Tracked in [`../planning/SOURCE-OF-TRUTH.md`](../planning/SOURCE-OF-TRUTH.md) open findings.

## Where to find it

- **In app:** Settings → Plan (subscription + bundle picker, manage-subscription via portal). Settings → Credits (balance, cycle anchor, top-up bundles, ledger).
- **Public:** `/pricing` reuses the same Settings-Plan component, fed by the public-readable pricing catalog tables.
- **Admin:** `/admin/pricing` (gated by `has_role(uid, 'admin')`).

## How it works

- **Catalog tables** (`pricing_plans`, `pricing_bundles`, `pricing_features`, `pricing_topup_bundles`): public read, service-role write. Seeded with the placeholder shape above. Edits from the admin console clone-and-archive Stripe Prices so existing subscribers stay on their original price.
- **Billing vaults** (`account_billing_secrets`, `workspace_billing_secrets`): service-role-only storage for Stripe customer/subscription ids. Replaces the legacy columns on `accounts` / `workspaces` (column-level SELECT revoked from members; fixes the EXPOSED_SENSITIVE_DATA findings).
- **Admin role** (`public.app_role` enum + `user_roles` table + `has_role()` security-definer fn): canonical separate-table role storage. `/admin/*` routes gate on `has_role(uid,'admin')`.
- **Server fns** (SHIPPED, `src/lib/payments.functions.ts`): `createCheckoutSession({tier, bundleId, recurrence})`, `createTopUpCheckout({bundleId})`, `createPortalSession()`, `getMySubscription()`, `cancelMySubscription()` / `resumeMySubscription()`. All Stripe calls route through the Lovable connector gateway (`connector-gateway.lovable.dev/stripe`). Read-only billing state is `getBillingState` and lives separately in `src/lib/billing.functions.ts` (not the payments module). Price tiers resolve via `lookup_keys` in `src/lib/billing-tier.ts`.
- **Webhook** (SHIPPED, `src/routes/api/public/payments/webhook.ts`): `/api/public/payments/webhook?env=…` handles `checkout.session.completed`, `customer.subscription.{updated,deleted}` and writes vault + plan tier. Note: the older `src/routes/api/stripe/webhook.ts` was retired 2026-06-21 (gutted to a 200 no-op; it had hardcoded the `pro` tier and written now-revoked `stripe_*` columns) and is NOT the live path (M-C-DEDUPE-WEBHOOK). FIXED 2026-06-21 (`M-C-TOPUP-BUG`): `handleCheckoutCompleted` now calls the `apply_topup_credits` RPC (records the `credit_topups` row, increments `account_credits.topup_credits`, writes a `credit_ledger` row, idempotent per Stripe session), so purchased top-ups reach the spendable balance. Grant-on-subscribe + renewal-refill are wired too (migration `20260621120000`).
- **Test coverage:** only pure math is unit-tested (`entitlements.test.ts`, `credits.test.ts`, `ai/pricing.test.ts`). There are no automated tests yet for any Stripe server fn, the webhook, or voucher redemption.

## How to verify (per phase)

- **Phase 2 (done):** `select * from pricing_plans;` returns 5 rows · `select * from pricing_bundles;` returns 13 rows · `select * from pricing_topup_bundles;` returns 3 rows · service-role-only vaults exist with backfilled rows · column-level SELECT revoked on legacy Stripe id columns.
- **Checkout / portal / webhook (shipped):** sandbox checkout for each tier × bundle × recurrence creates a Stripe sub and writes a vault row · portal opens for an authed customer · webhook flips plan tier. (No automated tests cover these yet - verify manually in sandbox.)
- **Phase 8:** admin edits Cluster 1k price → new Stripe Price cloned → `/pricing` shows new amount · existing subs untouched.

## Related

- [`./credits.md`](./credits.md) — separate top-up page + credit engine surfaces
- [`./admin-console.md`](./admin-console.md) — `/admin/*` hub + pricing console
- [`./pricing.md`](./pricing.md) — legacy entitlements doc (3-tier shape, superseded by this rail)
- [`../planning/SOURCE-OF-TRUTH.md`](../planning/SOURCE-OF-TRUTH.md) — row M-C-PRICE (plus the M-C-_ / ADM-_ rows) for this rail
- [`../../supabase/migrations/`](../../supabase/migrations/) — `stripe_rail_pricing_catalog_and_admin_role`
