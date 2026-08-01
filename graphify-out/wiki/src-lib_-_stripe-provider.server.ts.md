# src/lib - stripe-provider.server.ts

> 54 nodes · cohesion 0.10

## Key Concepts

- **stripe-provider.server.ts** (38 connections) — `src/lib/payments/stripe-provider.server.ts`
- **paddle-provider.server.ts** (29 connections) — `src/lib/payments/paddle-provider.server.ts`
- **grant-core.server.ts** (20 connections) — `src/lib/payments/grant-core.server.ts`
- **billing-webhook.ts** (19 connections) — `src/lib/billing-webhook.ts`
- **getServiceClient()** (15 connections) — `src/lib/payments/grant-core.server.ts`
- **creditsFromLookupKey()** (11 connections) — `src/lib/billing-tier.ts`
- **billing-webhook.test.ts** (11 connections) — `src/lib/billing-webhook.test.ts`
- **applyTierForUser()** (10 connections) — `src/lib/payments/grant-core.server.ts`
- **grantForSubscription()** (10 connections) — `src/lib/payments/grant-core.server.ts`
- **paddleGrantFromEvent()** (10 connections) — `src/lib/payments/paddle-provider.server.ts`
- **resolvePriceLookup()** (8 connections) — `src/lib/billing-webhook.ts`
- **stripeGrantFromEvent()** (8 connections) — `src/lib/payments/stripe-provider.server.ts`
- **resolveTopupCredits()** (7 connections) — `src/lib/billing-webhook.ts`
- **applyTopupPurchase()** (7 connections) — `src/lib/payments/grant-core.server.ts`
- **handleInvoicePaymentSucceeded()** (7 connections) — `src/lib/payments/stripe-provider.server.ts`
- **handleSubscriptionCreated()** (7 connections) — `src/lib/payments/stripe-provider.server.ts`
- **handleSubscriptionUpdated()** (7 connections) — `src/lib/payments/stripe-provider.server.ts`
- **buildSubscriptionUpdate()** (6 connections) — `src/lib/billing-webhook.ts`
- **buildSubscriptionUpsert()** (6 connections) — `src/lib/billing-webhook.ts`
- **applyRefundClawback()** (6 connections) — `src/lib/payments/grant-core.server.ts`
- **findTopupForRefund()** (6 connections) — `src/lib/payments/grant-core.server.ts`
- **invoiceSubscriptionId()** (6 connections) — `src/lib/stripe-invoice.ts`
- **tierFromLookupKey()** (5 connections) — `src/lib/billing-tier.ts`
- **resolvePeriod()** (5 connections) — `src/lib/billing-webhook.ts`
- **resolveAccountId()** (5 connections) — `src/lib/payments/grant-core.server.ts`
- *... and 29 more nodes in this community*

## Relationships

- [src/lib - go-live.functions.ts](src-lib_-_go-live.functions.ts.md) (14 shared connections)
- [src/lib - PlanPicker.tsx](src-lib_-_PlanPicker.tsx.md) (12 shared connections)
- [src/lib - paddle-events.ts](src-lib_-_paddle-events.ts.md) (6 shared connections)
- [src/lib - payments.functions.ts](src-lib_-_payments.functions.ts.md) (5 shared connections)
- [src/integrations - supabase/types.ts](src-integrations_-_supabase-types.ts.md) (2 shared connections)

## Source Files

- `src/lib/billing-tier.ts`
- `src/lib/billing-webhook.test.ts`
- `src/lib/billing-webhook.ts`
- `src/lib/payments/grant-core.server.ts`
- `src/lib/payments/paddle-provider.server.ts`
- `src/lib/payments/provider.server.ts`
- `src/lib/payments/stripe-provider.server.ts`
- `src/lib/stripe-invoice.test.ts`
- `src/lib/stripe-invoice.ts`

## Audit Trail

- EXTRACTED: 328 (97%)
- INFERRED: 11 (3%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*