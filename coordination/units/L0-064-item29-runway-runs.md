# UNIT L0-064 — item 29 finished: the banner speaks in runs

**Lane:** LANE 0 · **Item:** BUILD-QUEUE #29 (final half) · **Date:** 2026-08-25

## What changed

`src/components/billing/BillingBanner.tsx` — the low-credits line now carries
the RUNWAY figure from MAIN's `credit_runway` RPC (migration
`20260825072000`, SECURITY DEFINER, tenancy re-checked in-body):

- "Running low: N credits left. That is about M more runs at the recent rate.
  Top up or upgrade so the loop keeps running."
- `runs_left` NULL renders as **"How many runs that buys is not known yet"** —
  the honest unknown MAIN specified, never Infinity, never a fabricated number.
- The exhausted state (balance ≤ 0) keeps its own undismissable line; runway is
  not shown there because zero needs no rate.

Implementation note: the generated Supabase RPC union predates the migration,
so the call goes through a structural cast — the house idiom for generated-type
lag. When types regenerate, the cast can shrink to a plain call.

## Gates

`tsc` 0 · full suite **10,923 pass / 0 fail** · eslint: 0 errors (1
pre-existing react-refresh warning) · no dev server.

## Verification owed

The rendered sentence with a real number needs an account whose window holds
runs — verifiable on harbor@ after MAIN's next deploy (the RPC + this banner in
one build). Falsifiers: Infinity or a negative rendered; unknown rendered as a
number; runway shown while metering is off.
