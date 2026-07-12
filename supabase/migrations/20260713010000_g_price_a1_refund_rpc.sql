-- G-PRICE PR-A1: refund_account_credits — the inverse of debit_account_credits.
--
-- Spec: docs/strategy/pricing/implementation-plan.md PR-A1 ("charge only on delivered
-- artifacts; stop/abandon = free"). Mirrors debit_account_credits exactly (same locking
-- discipline, same service-role-only surface via SECURITY DEFINER) but credits the pool
-- back: TOP-UP first, then INCLUDED (the reverse draw order of a debit), and writes a
-- credit_ledger 'adjustment' row (positive delta) tagged with the same ai_event/surface
-- so the ledger shows a paired debit+refund rather than a silent balance edit.
--
-- Called by loop.server.ts / handoff.server.ts when a mission/run reaches an ABANDONED
-- terminal status (halted/failed/stopped) instead of a DELIVERED one — the credits its
-- steps already drew during execution are handed back, so "it burned an hour then
-- charged me for nothing" cannot happen. Idempotent per call site (each call refunds a
-- specific, already-debited amount once); the caller is responsible for not double-
-- refunding the same run (loop.server.ts tracks this via agent_runs.credits_refunded).
-- No-op on non-positive amounts. Dormant with the rest of the credit engine.

create or replace function public.refund_account_credits(
  _account_id uuid,
  _credits bigint,
  _user_id uuid,
  _surface text,
  _ai_event_id uuid,
  _product_id uuid
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if _credits is null or _credits <= 0 then
    return;
  end if;

  -- Lock the pool row so a concurrent debit/refund cannot race this credit-back.
  perform 1 from public.account_credits where account_id = _account_id for update;
  if not found then
    return;
  end if;

  -- Refund into TOP-UP first (mirrors the debit order in reverse: a debit draws
  -- included-then-topup, so a refund restores topup-then-included). This keeps a
  -- purchased top-up balance whole before touching the monthly included grant.
  update public.account_credits
     set topup_credits = coalesce(topup_credits, 0) + _credits
   where account_id = _account_id;

  insert into public.credit_ledger
    (account_id, user_id, delta_credits, reason, surface, ai_event_id, product_id)
  values
    (_account_id, _user_id, _credits, 'adjustment', _surface, _ai_event_id, _product_id);
end;
$$;

-- agent_runs.credits_refunded: idempotency guard so an abandoned run's credits can
-- only ever be handed back once (a resumed/re-checked run must not double-refund).
alter table public.agent_runs add column if not exists credits_refunded boolean not null default false;
