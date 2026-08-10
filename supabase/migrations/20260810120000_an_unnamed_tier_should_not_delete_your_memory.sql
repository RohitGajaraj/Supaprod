-- An unnamed tier should not delete your memory.
--
-- THE LOADED GUN. `set_agent_memory_expiry` decided who keeps their outcome
-- memories by matching a hardcoded ALLOW-LIST of paid tiers:
--
--     w.plan_tier in ('pro', 'max', 'team', 'enterprise')
--
-- Anything not on that list fell through to the else branch and had
-- `expires_at` set to 30 days out. So the list was not a description of who
-- pays, it was the definition of whose record survives, and every tier the
-- list did not anticipate was silently treated as free.
--
-- WHY THIS MATTERS NOW. On 2026-07-13 the founder locked four tiers, Free /
-- Pro / Business / Enterprise, retiring the earlier names. The code and the
-- database still ship five on the old slugs, and `'business'` appears nowhere
-- in the billing code OR in the list above. Land that rename against this
-- function unchanged and every Business customer's outcome memories begin
-- expiring at 30 days, quietly, on the exact data the product calls its moat.
--
-- The trigger is INERT today: `memory_expiry_enabled()` reads false from
-- app_settings and zero rows carry an expiry. That is precisely why this is
-- the right moment to fix it. The defect is only harmless while the switch is
-- off, and the switch is a single admin call away from being on.
--
-- THE FIX IS TO INVERT THE TEST, not to add 'business' to the list. Adding the
-- name would fix today's tier and rebuild the same trap for the next one. The
-- question the function should ask is not "is this tier one I recognise as
-- paid" but "is this tier the free one", because those differ exactly on the
-- unknown case, and the unknown case is where the damage lives.
--
-- So: expiry now applies only to a user whose every workspace is explicitly on
-- 'free'. A tier that is new, renamed, misspelled, or null preserves the
-- record. That is the safe direction and it is not symmetric: wrongly keeping
-- a free user's memories costs storage, and wrongly deleting a paying
-- customer's outcome history destroys the one asset that cannot be
-- reconstructed by re-running anything. The founder chose this shape on
-- 2026-08-10 over renaming the tiers first.
--
-- Behaviour is otherwise unchanged: the enablement gate, the service_role
-- INSERT passthrough, the untouched-last_used_at UPDATE short-circuit and the
-- 30-day window are all exactly as they were.

create or replace function public.set_agent_memory_expiry()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare v_keeps_memory boolean;
begin
  if not public.memory_expiry_enabled() then return NEW; end if;
  if TG_OP = 'INSERT' and coalesce(auth.role(), '') = 'service_role' and NEW.expires_at is not null then
    return NEW;
  end if;
  if TG_OP = 'UPDATE' and NEW.last_used_at is not distinct from OLD.last_used_at then return NEW; end if;

  -- Any workspace that is NOT explicitly the free tier keeps the record.
  -- A null or unrecognised `plan_tier` reads as "not free" and is preserved,
  -- which is the whole point of the inversion.
  select exists (
    select 1 from public.workspace_members wm
    join public.workspaces w on w.id = wm.workspace_id
    where wm.user_id = NEW.user_id
      and coalesce(w.plan_tier, '') <> 'free'
  ) into v_keeps_memory;

  if v_keeps_memory then NEW.expires_at := null;
  else NEW.expires_at := coalesce(NEW.last_used_at, NEW.created_at, now()) + interval '30 days';
  end if;
  return NEW;
end; $function$;

comment on function public.set_agent_memory_expiry() is
  'Sets agent_memory.expires_at when memory_expiry_enabled(). Expiry applies ONLY when every workspace the user belongs to is explicitly plan_tier = ''free''; an unknown, renamed or null tier preserves the record. Inverted from a paid-tier allow-list on 2026-08-10 so a tier rename cannot silently delete outcome memories.';
