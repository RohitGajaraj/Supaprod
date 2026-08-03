-- Record the cached-input tokens the PROVIDER reported, so the meter can be audited
-- against a real invoice instead of being taken on trust.
--
-- WHY. Until now est_cost_usd was computed by multiplying provider-reported token
-- counts by OUR rate table. That is fine until a provider discounts part of the input,
-- and Alibaba Model Studio does: its implicit context cache bills a cache-hit input
-- token at 20% of the input rate. Measured live on 2026-08-03 against the exact
-- endpoint this product calls, two identical-prefix requests both reported
-- prompt_tokens 2521, with prompt_tokens_details.cached_tokens going 0 then 2432. So on
-- a repeated prefix 96% of the input was cache-served and every one of those tokens was
-- being billed at the full rate. That is the shape of the gap between our computed Qwen
-- spend and the invoice.
--
-- The pricing fix ships in the same change (pricing.ts: Pricing.cached_in_per_mtok, and
-- estimateCostUsd now takes the cached count). This column exists so the claim is
-- CHECKABLE: with it, summing cached vs uncached tokens per model reproduces the bill.
-- Without it the correction would be just another number nobody can verify, which is
-- the failure this repo keeps paying for.
--
-- NULLABLE ON PURPOSE, and not backfilled. Every row written before today genuinely has
-- no cached figure, because nothing captured one. A DEFAULT 0 would assert "the provider
-- reported zero cached tokens" for 100k+ historical rows where the truth is "we never
-- asked". NULL means unknown and 0 means the provider reported none; conflating those
-- would poison exactly the audit this column exists to enable.

ALTER TABLE public.ai_events
  ADD COLUMN IF NOT EXISTS cached_tokens integer;

COMMENT ON COLUMN public.ai_events.cached_tokens IS
  'Input tokens the provider served from its own context cache, as reported by the provider. A SUBSET of prompt_tokens, never an addition to it. NULL means the call predates capture (2026-08-03) or the provider reports no cache field; 0 means the provider reported a cache miss.';

-- Cost auditing reads "recent calls on one model", so the index matches that shape and
-- is partial: rows with no cached figure are exactly the ones an audit must exclude.
CREATE INDEX IF NOT EXISTS ai_events_model_cached_idx
  ON public.ai_events (model, created_at DESC)
  WHERE cached_tokens IS NOT NULL;
