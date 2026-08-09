# Billing and Subscriptions

> 67 nodes · cohesion 0.08

## Key Concepts

- **stripe-provider.server.ts** (38 connections) — `src/lib/payments/stripe-provider.server.ts`
- **paddle-provider.server.ts** (29 connections) — `src/lib/payments/paddle-provider.server.ts`
- **grant-core.server.ts** (20 connections) — `src/lib/payments/grant-core.server.ts`
- **billing-webhook.ts** (19 connections) — `src/lib/billing-webhook.ts`
- **getServiceClient()** (15 connections) — `src/lib/payments/grant-core.server.ts`
- **provider.server.ts** (14 connections) — `src/lib/payments/provider.server.ts`
- **creditsFromLookupKey()** (11 connections) — `src/lib/billing-tier.ts`
- **billing-tier.test.ts** (11 connections) — `src/lib/billing-tier.test.ts`
- **billing-webhook.test.ts** (11 connections) — `src/lib/billing-webhook.test.ts`
- **applyTierForUser()** (10 connections) — `src/lib/payments/grant-core.server.ts`
- **grantForSubscription()** (10 connections) — `src/lib/payments/grant-core.server.ts`
- **paddleGrantFromEvent()** (10 connections) — `src/lib/payments/paddle-provider.server.ts`
- **resolvePriceLookup()** (8 connections) — `src/lib/billing-webhook.ts`
- **PaymentsProviderAdapter** (8 connections) — `src/lib/payments/provider.server.ts`
- **stripeGrantFromEvent()** (8 connections) — `src/lib/payments/stripe-provider.server.ts`
- **resolveTopupCredits()** (7 connections) — `src/lib/billing-webhook.ts`
- **applyTopupPurchase()** (7 connections) — `src/lib/payments/grant-core.server.ts`
- **PaymentsEnv** (7 connections) — `src/lib/payments/grant-core.server.ts`
- **handleInvoicePaymentSucceeded()** (7 connections) — `src/lib/payments/stripe-provider.server.ts`
- **handleSubscriptionCreated()** (7 connections) — `src/lib/payments/stripe-provider.server.ts`
- **handleSubscriptionUpdated()** (7 connections) — `src/lib/payments/stripe-provider.server.ts`
- **buildSubscriptionUpdate()** (6 connections) — `src/lib/billing-webhook.ts`
- **buildSubscriptionUpsert()** (6 connections) — `src/lib/billing-webhook.ts`
- **applyRefundClawback()** (6 connections) — `src/lib/payments/grant-core.server.ts`
- **findTopupForRefund()** (6 connections) — `src/lib/payments/grant-core.server.ts`
- *... and 42 more nodes in this community*

## Relationships

- [Billing Tier Management](Billing_Tier_Management.md) (18 shared connections)
- [Payments and Credits](Payments_and_Credits.md) (8 shared connections)
- [Paddle Payment Integration](Paddle_Payment_Integration.md) (6 shared connections)
- [Usage and Billing Metrics](Usage_and_Billing_Metrics.md) (2 shared connections)
- [Database Type Definitions](Database_Type_Definitions.md) (2 shared connections)

## Source Files

- `src/lib/billing-tier.test.ts`
- `src/lib/billing-tier.ts`
- `src/lib/billing-webhook.test.ts`
- `src/lib/billing-webhook.ts`
- `src/lib/payments/grant-core.server.ts`
- `src/lib/payments/paddle-provider.server.ts`
- `src/lib/payments/provider.server.ts`
- `src/lib/payments/stripe-provider.server.ts`
- `src/lib/stripe-invoice.test.ts`
- `src/lib/stripe-invoice.ts`
- `src/routes/api/public/payments/webhook.ts`

## Audit Trail

- EXTRACTED: 396 (98%)
- INFERRED: 10 (2%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*