-- 20260822160000_the_spend_ceiling_can_be_deleted_by_the_person_it_binds.sql
--
-- Claude lane, 2026-08-22.
--
-- THE CONTROL THAT BOUNDS A RUNAWAY-SPEND INCIDENT CAN BE REMOVED BY THE PERSON
-- WHO BENEFITS FROM REMOVING IT.
--
-- Measured against production on 2026-08-22, impersonating the account's own
-- owner (`request.jwt.claims` -> sub = accounts.owner_id, role = authenticated,
-- `set local role authenticated` so RLS was live), asserting on the VALUE the row
-- held afterwards rather than on whether the statement threw:
--
--   raise    UPDATE credit_caps SET cap_credits = 999999999   5000 -> 999999999
--   lower    UPDATE credit_caps SET cap_credits = 100         -> 100
--   disable  UPDATE credit_caps SET enabled = false           -> false
--   repoint  UPDATE credit_caps SET target_id = <other>       -> re-pointed
--            ... and window_kind 'cycle' -> 'day'             -> 'day'
--   delete   DELETE FROM credit_caps WHERE id = ...           -> 0 rows remain
--
-- All five held. The policy is `account owner writes caps [ALL]` and the ONLY
-- trigger on the table was `set_updated_at`, a timestamp helper. `accounts` and
-- `workspaces` both carry a guard for exactly this shape of problem
-- (`protect_account_billing_columns` / `protect_workspace_billing_columns`,
-- which silently revert protected columns for any caller that is not
-- service_role). `credit_caps` had no equivalent, so the ceiling was advisory.
--
-- It matters here specifically because this product closed a real runaway-spend
-- incident on 2026-08-21 -- roughly $75/month of the autonomous spine driving
-- demo fixtures. A cap is the control that bounds that class of failure.
--
-- THE ASYMMETRY, WHICH IS THE WHOLE POINT AND IS WHY THIS WAS NOT A ONE-LINE
-- COLUMN FREEZE. An owner LOWERING their own cap is legitimate and must keep
-- working: a cap is a safety control and tightening one is always safe. What is
-- not self-service is loosening it. So, for any caller that is not service_role:
--
--   cap_credits   clamped to least(NEW, OLD) -- lower freely, never raise
--   enabled       true -> false reverted     -- disabling is removal by another name
--   account_id
--   scope
--   target_id
--   window_kind   frozen -- re-pointing a cap at a different target, scope,
--                 account or window removes it from the thing it was bounding,
--                 which is a DELETE wearing an UPDATE's clothes. 'day' is also
--                 strictly looser than 'month', so the window is not a free edit.
--   id            frozen; enforcement never reads it, but a cap should not be
--                 able to change which row the settings UI thinks it is.
--   DELETE        silently skipped (BEFORE DELETE returning NULL)
--
-- NO ABSOLUTE CEILING NUMBER IS INVENTED HERE, and none is needed for this
-- shape: raising is refused outright rather than allowed up to some maximum.
-- Whether an owner should be able to raise a cap AT ALL without an admin, and
-- up to what per-tier number, is a founder decision. Nothing in the schema
-- currently knows a per-tier credit ceiling -- `tier_product_limit`,
-- `tier_workspace_limit`, `tier_connector_limit` and `tier_seat_limit` exist,
-- but there is no `tier_credit_limit`; the only per-tier credit numbers in SQL
-- are the grant CASE hand-mirrored inside `backfill_account_credits`
-- (750/3750/15000/15000, pinned to `entitlements.ts` by
-- credit-grant-sql-parity.test.ts). Choosing to reuse those as a ceiling would
-- be inventing pricing policy, so that half is left to the founder.
--
-- INSERT IS DELIBERATELY LEFT ALONE. Adding a cap can only ever tighten: the
-- enforcement in `assertCreditCaps` (src/lib/ai/runtime.server.ts) loops every
-- ENABLED cap matching the call's (scope, target) and throws on the first one
-- exceeded -- caps AND together, they do not pick a winner. A second row can
-- therefore never relax the first. credit-cap-guard.test.ts pins that, because
-- if enforcement ever changed to "use the highest cap", INSERT becomes the
-- bypass this trigger closes everywhere else.
--
-- TWO THINGS TO KNOW BEFORE YOU DEBUG THIS AT 2AM.
--
-- 1. `auth.role()` is read from the REQUEST, not from the database role. A
--    direct psql or SQL-editor session sets no JWT claims, so auth.role() is
--    '' and this guard applies to the founder too. To make a deliberate raise,
--    claim the role in the same transaction:
--      begin;
--      select set_config('request.jwt.claims', '{"role":"service_role"}', true);
--      update public.credit_caps set cap_credits = ... where id = ...;
--      commit;
--
-- 2. THE UI STILL REPORTS SUCCESS. `saveCreditCap` / `removeCreditCap`
--    (src/lib/payments.functions.ts) write through the ACTING USER's client, so
--    a raise or a delete now returns ok:true while nothing changes -- the same
--    silent-revert behaviour the two billing guards already have. That is the
--    established pattern and it is what makes the guard unbypassable, but the
--    settings surface should eventually say "ask an admin to raise a cap"
--    instead of pretending. Filed as a follow-up, not fixed here: this migration
--    must not touch product code owned by another lane.

create or replace function public.protect_credit_cap_ceiling()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  -- Same exemption model as protect_account_billing_columns: service_role only.
  if coalesce(auth.role(), '') = 'service_role' then
    if TG_OP = 'DELETE' then
      return OLD;
    end if;
    return NEW;
  end if;

  -- Removing the ceiling is never self-service. Skipped silently rather than
  -- raised, matching how the billing guards revert without erroring.
  if TG_OP = 'DELETE' then
    return null;
  end if;

  -- Identity: a cap must keep binding the thing it was created to bind.
  NEW.id          := OLD.id;
  NEW.account_id  := OLD.account_id;
  NEW.scope       := OLD.scope;
  NEW.target_id   := OLD.target_id;
  NEW.window_kind := OLD.window_kind;

  if OLD.enabled then
    -- A cap that is currently binding may only ever be tightened.
    NEW.cap_credits := least(NEW.cap_credits, OLD.cap_credits);
    NEW.enabled     := true;
  end if;
  -- A DORMANT cap (enabled = false) bounds nothing today, so any edit to it --
  -- including switching it on at a higher number -- lands strictly tighter than
  -- the nothing it replaces. Left free on purpose. Note the only way to reach
  -- enabled = false from here is to have been INSERTed that way, because the
  -- branch above refuses to turn a live cap off.

  return NEW;
end;
$$;

comment on function public.protect_credit_cap_ceiling() is
  'Spend caps are one-way for anyone but service_role: cap_credits may be lowered but never raised, enabled may not go true->false, the identity columns (account_id, scope, target_id, window_kind, id) are frozen, and DELETE is silently skipped. INSERT is unguarded because an extra cap can only tighten (assertCreditCaps ANDs every matching enabled cap).';

drop trigger if exists trg_protect_credit_cap_ceiling on public.credit_caps;
create trigger trg_protect_credit_cap_ceiling
  before update or delete on public.credit_caps
  for each row
  execute function public.protect_credit_cap_ceiling();
