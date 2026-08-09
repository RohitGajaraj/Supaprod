# Billing and Plan UI

> 65 nodes · cohesion 0.05

## Key Concepts

- **PlanPicker.tsx** (37 connections) — `src/components/billing/PlanPicker.tsx`
- **pricing.tsx** (21 connections) — `src/routes/pricing.tsx`
- **checkout.tsx** (19 connections) — `src/routes/checkout.tsx`
- **stripe.ts** (15 connections) — `src/lib/stripe.ts`
- **BillingBanner.tsx** (14 connections) — `src/components/billing/BillingBanner.tsx`
- **StripeEmbeddedCheckout.tsx** (14 connections) — `src/components/billing/StripeEmbeddedCheckout.tsx`
- **planPresentation** (14 connections) — `src/lib/entitlements.ts`
- **getStripeEnvironment()** (11 connections) — `src/lib/stripe.ts`
- **PaidTierCard()** (8 connections) — `src/components/billing/PlanPicker.tsx`
- **priceForCredits()** (8 connections) — `src/lib/billing-tier.ts`
- **includedCreditsFor()** (8 connections) — `src/lib/entitlements.ts`
- **paymentsConfigured()** (8 connections) — `src/lib/stripe.ts`
- **CheckoutPage()** (6 connections) — `src/routes/checkout.tsx`
- **checkout.return.tsx** (6 connections) — `src/routes/checkout.return.tsx`
- **BillingBanner()** (5 connections) — `src/components/billing/BillingBanner.tsx`
- **StripeEmbeddedCheckout()** (5 connections) — `src/components/billing/StripeEmbeddedCheckout.tsx`
- **parseStripeEnv()** (5 connections) — `src/lib/stripe.ts`
- **BillingBanner.test.tsx** (4 connections) — `src/components/billing/BillingBanner.test.tsx`
- **getStripe()** (4 connections) — `src/lib/stripe.ts`
- **getStripeEnvironmentOrNull()** (4 connections) — `src/lib/stripe.ts`
- **paymentsEnvironment()** (4 connections) — `src/lib/stripe.ts`
- **PricingCard()** (4 connections) — `src/routes/pricing.tsx`
- **shouldWarnLowCredits()** (3 connections) — `src/components/billing/BillingBanner.tsx`
- **PlanTable()** (3 connections) — `src/components/billing/PlanPicker.tsx`
- **createPortalSession** (3 connections) — `src/lib/payments.functions.ts`
- *... and 40 more nodes in this community*

## Relationships

- [Usage and Billing Metrics](Usage_and_Billing_Metrics.md) (14 shared connections)
- [Payment and Membership](Payment_and_Membership.md) (13 shared connections)
- [Working State Indicators](Working_State_Indicators.md) (8 shared connections)
- [Billing Tier Management](Billing_Tier_Management.md) (7 shared connections)
- [Payments and Credits](Payments_and_Credits.md) (6 shared connections)
- [Admin Claims Management](Admin_Claims_Management.md) (4 shared connections)
- [Trust and Repo Modals](Trust_and_Repo_Modals.md) (4 shared connections)
- [Landing Page Visuals](Landing_Page_Visuals.md) (4 shared connections)
- [UI Component Library](UI_Component_Library.md) (3 shared connections)
- [Invite Code Management](Invite_Code_Management.md) (3 shared connections)
- [Onboarding and Room Routing](Onboarding_and_Room_Routing.md) (2 shared connections)

## Source Files

- `src/components/billing/BillingBanner.test.tsx`
- `src/components/billing/BillingBanner.tsx`
- `src/components/billing/PlanPicker.tsx`
- `src/components/billing/StripeEmbeddedCheckout.tsx`
- `src/lib/billing-tier.ts`
- `src/lib/entitlements.ts`
- `src/lib/payments.functions.ts`
- `src/lib/stripe.test.ts`
- `src/lib/stripe.ts`
- `src/routes/_authenticated.settings.tsx`
- `src/routes/checkout.return.tsx`
- `src/routes/checkout.tsx`
- `src/routes/pricing.tsx`

## Audit Trail

- EXTRACTED: 282 (98%)
- INFERRED: 6 (2%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*