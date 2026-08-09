# Billing Tier Management

> 20 nodes · cohesion 0.12

## Key Concepts

- **billing-tier.ts** (27 connections) — `src/lib/billing-tier.ts`
- **go-live.functions.ts** (14 connections) — `src/lib/payments/go-live.functions.ts`
- **topup-cap-sql-parity.test.ts** (6 connections) — `src/lib/topup-cap-sql-parity.test.ts`
- **lookupKeyFor()** (5 connections) — `src/lib/billing-tier.ts`
- **topUpCycleCap()** (4 connections) — `src/lib/billing-tier.ts`
- **FALLBACK_TOPUP_CAP** (3 connections) — `src/lib/billing-tier.ts`
- **activePaymentsProviderId()** (3 connections) — `src/lib/payments/provider.server.ts`
- **defaultMonthlyLookupKey()** (2 connections) — `src/lib/billing-tier.ts`
- **formatPrice()** (2 connections) — `src/lib/billing-tier.ts`
- **parseCreditsToken()** (2 connections) — `src/lib/billing-tier.ts`
- **TIER_PRESERVING_STATUSES** (2 connections) — `src/lib/billing-tier.ts`
- **MAX_MONTHLY_USD** (2 connections) — `src/lib/entitlements.ts`
- **getBillingGoLiveReadiness** (2 connections) — `src/lib/payments/go-live.functions.ts`
- **GoLiveCheck** (2 connections) — `src/lib/payments/go-live.functions.ts`
- **TIER_BASE_MONTHLY_USD** (1 connections) — `src/lib/billing-tier.ts`
- **TIER_PREFIX** (1 connections) — `src/lib/billing-tier.ts`
- **GoLiveReadiness** (1 connections) — `src/lib/payments/go-live.functions.ts`
- **MIGRATIONS_DIR** (1 connections) — `src/lib/topup-cap-sql-parity.test.ts`
- **parseCapFormula()** (1 connections) — `src/lib/topup-cap-sql-parity.test.ts`
- **readCapMigration()** (1 connections) — `src/lib/topup-cap-sql-parity.test.ts`

## Relationships

- [Billing and Subscriptions](Billing_and_Subscriptions.md) (18 shared connections)
- [Billing and Plan UI](Billing_and_Plan_UI.md) (7 shared connections)
- [Usage and Billing Metrics](Usage_and_Billing_Metrics.md) (4 shared connections)
- [Payments and Credits](Payments_and_Credits.md) (3 shared connections)
- [Admin Claims Management](Admin_Claims_Management.md) (3 shared connections)
- [Auth Middleware and Approvals](Auth_Middleware_and_Approvals.md) (2 shared connections)
- [Memory Recall System](Memory_Recall_System.md) (1 shared connections)

## Source Files

- `src/lib/billing-tier.ts`
- `src/lib/entitlements.ts`
- `src/lib/payments/go-live.functions.ts`
- `src/lib/payments/provider.server.ts`
- `src/lib/topup-cap-sql-parity.test.ts`

## Audit Trail

- EXTRACTED: 82 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*